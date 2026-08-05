package com.instavow.app;

import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {

  // Remote server that hosts the live app. Capacitor's JS bridge/plugins
  // (e.g. Preferences) and localStorage are only meaningful for this exact
  // origin — they're never injected for, or shared with, any other origin.
  // Rather than navigating to a separate fake "offline" host when there's no
  // network (which broke the bridge and split storage across origins), we
  // stay on this same origin at all times and transparently serve requests
  // from the locally bundled static export (out/, synced into assets/public)
  // whenever the device is offline.
  private static final String REMOTE_URL = "https://instavow.com";
  private static final String REMOTE_HOST = Uri.parse(REMOTE_URL).getHost();
  private ConnectivityManager connectivityManager;
  private ConnectivityManager.NetworkCallback networkCallback;
  // Guards against an infinite reload loop: a main-frame URL that keeps
  // failing (e.g. a dynamic route with no offline shell available at all)
  // should only be retried once, not forever.
  private String lastFailedMainFrameUrl = null;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(SystemBrowserPlugin.class);
    super.onCreate(savedInstanceState);

    WebView webView = getBridge().getWebView();
    connectivityManager = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);

    webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String host = request.getUrl().getHost();
        String path = request.getUrl().getPath();

        // "localhost" is the origin the CapacitorUpdater (Capgo) plugin always
        // serves the built-in bundle from, regardless of capacitor.config's
        // server.url — so /tools/<slug> requests need the offline-shell
        // fallback here too, not just when REMOTE_HOST is offline.
        boolean isLocalBundle = "localhost".equals(host);
        if (isLocalBundle || (REMOTE_HOST.equals(host) && !isDeviceOnline())) {
          WebResourceResponse local = loadLocalAsset(path, request.isForMainFrame());
          if (local != null) {
            Log.d("Instavow", "[LOCAL] served local asset: " + path);
            return local;
          }
          Log.w("Instavow", "[LOCAL] no local asset for: " + path);
        }

        return super.shouldInterceptRequest(view, request);
      }

      @Override
      public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        String url = request.getUrl().toString();
        if (request.isForMainFrame()) {
          if (url.equals(lastFailedMainFrameUrl)) {
            // Already retried this exact URL once and it failed again —
            // stop here to avoid an infinite reload loop.
            Log.w("Instavow", "[ERROR] main frame failed again, giving up: " + url + " Error: " + error.getDescription());
            super.onReceivedError(view, request, error);
            return;
          }
          // Retry the same URL — shouldInterceptRequest above will now
          // correctly detect offline state and serve the local asset instead.
          lastFailedMainFrameUrl = url;
          Log.w("Instavow", "[ERROR] main frame failed, reloading: " + url + " Error: " + error.getDescription());
          view.loadUrl(url);
          return;
        }
        Log.w("Instavow", "[ERROR] sub-resource failed: " + url + " Error: " + error.getDescription());
        super.onReceivedError(view, request, error);
      }

      @Override
      public void onPageFinished(WebView view, String url) {
        lastFailedMainFrameUrl = null;
        super.onPageFinished(view, url);
      }
    });

    // Forward JS console.log/warn/error to Android Logcat so we can debug
    // the web app's output (media caching, auto-login, etc.) alongside
    // native-side logs. Filter Logcat by "JS" to see only these.
    webView.setWebChromeClient(new WebChromeClient() {
      @Override
      public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
        String tag = "JS:" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber();
        switch (consoleMessage.messageLevel()) {
          case ERROR:
            Log.e("JS", consoleMessage.message());
            break;
          case WARNING:
            Log.w("JS", consoleMessage.message());
            break;
          default:
            Log.d("JS", consoleMessage.message());
            break;
        }
        return true;
      }
    });

    // No special handling is needed when connectivity returns — the WebView
    // never leaves the https://instavow.com origin, so subsequent requests
    // naturally hit the real network again via shouldInterceptRequest above.
    networkCallback = new ConnectivityManager.NetworkCallback() {
      @Override
      public void onAvailable(Network network) {
        Log.d("Instavow", "[ONLINE] connectivity restored");
      }
    };
    NetworkRequest networkRequest = new NetworkRequest.Builder()
      .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
      .addCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
      .build();
    connectivityManager.registerNetworkCallback(networkRequest, networkCallback);
  }

  private boolean isDeviceOnline() {
    Network activeNetwork = connectivityManager.getActiveNetwork();
    if (activeNetwork == null) return false;
    NetworkCapabilities caps = connectivityManager.getNetworkCapabilities(activeNetwork);
    return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
  }

  @Override
  public void onDestroy() {
    if (connectivityManager != null && networkCallback != null) {
      connectivityManager.unregisterNetworkCallback(networkCallback);
    }
    super.onDestroy();
  }

  private WebResourceResponse loadLocalAsset(String urlPath, boolean isForMainFrame) {
    if (urlPath == null || urlPath.isEmpty() || urlPath.equals("/")) {
      urlPath = "/index.html";
    }
    String basePath = "public" + urlPath;
    // Next.js static export emits flat "route.html" files (no extension in the
    // URL), so try the exact path first (covers /_next/... assets which already
    // have extensions), then "<path>.html", then "<path>/index.html".
    String[] candidates = new String[] {
      basePath,
      basePath + ".html",
      basePath.endsWith("/") ? basePath + "index.html" : basePath + "/index.html"
    };
    for (String candidate : candidates) {
      WebResourceResponse response = tryOpenAsset(candidate);
      if (response != null) return response;
    }

    // /tools/<slug> is a fully dynamic, per-invitation route that can never be
    // statically exported per real slug (see scripts/build-capacitor.js) — only
    // a generic "offline" placeholder slug is pre-rendered so its JS chunk gets
    // bundled. Serve that generic shell for any other /tools/<slug> request;
    // the page reads the real slug from window.location at runtime, which
    // still reflects the originally requested URL.
    if (urlPath.startsWith("/tools/") && !urlPath.startsWith("/tools/offline") && !urlPath.startsWith("/tools/live-frame")) {
      // A top-level (main frame) navigation always needs a real HTML document
      // to render — a bare RSC ".txt" payload can't be displayed on its own,
      // so use the HTML shell even if the original request targeted ".txt".
      // Background prefetch requests can use the matching ".txt" payload.
      String ext = (!isForMainFrame && urlPath.endsWith(".txt")) ? ".txt" : ".html";
      WebResourceResponse response = tryOpenAsset("public/tools/offline" + ext);
      if (response != null) return response;
    }

    Log.w("Instavow", "[ASSET] not found in any candidate: " + urlPath);
    return null;
  }

  private WebResourceResponse tryOpenAsset(String candidate) {
    try {
      InputStream stream = getAssets().open(candidate);
      Map<String, String> headers = new HashMap<>();
      headers.put("Cache-Control", "no-cache, no-store, must-revalidate");
      Log.d("Instavow", "[ASSET] loaded: " + candidate);
      return new WebResourceResponse(guessMimeType(candidate), null, 200, "OK", headers, stream);
    } catch (IOException ignored) {
      return null;
    }
  }

  private String guessMimeType(String path) {
    if (path.endsWith(".js")) return "application/javascript";
    if (path.endsWith(".css")) return "text/css";
    if (path.endsWith(".html")) return "text/html";
    if (path.endsWith(".json")) return "application/json";
    if (path.endsWith(".svg")) return "image/svg+xml";
    if (path.endsWith(".png")) return "image/png";
    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
    if (path.endsWith(".webp")) return "image/webp";
    if (path.endsWith(".woff2")) return "font/woff2";
    if (path.endsWith(".woff")) return "font/woff";
    if (path.endsWith(".ico")) return "image/x-icon";
    String guess = URLConnection.guessContentTypeFromName(path);
    return guess != null ? guess : "application/octet-stream";
  }
}
