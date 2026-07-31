package com.instavow.app;

import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;

public class MainActivity extends BridgeActivity {

  // Locally bundled static export (out/, synced into assets/public) used as an
  // offline fallback when the remote server (https://instavow.com) is unreachable.
  // Requests to this fake host are intercepted in shouldInterceptRequest below and
  // served directly from assets/public, so no real network call is ever attempted
  // and Next.js's root-absolute asset paths (e.g. /_next/...) resolve correctly.
  private static final String LOCAL_FALLBACK_HOST = "local.instavow.app";
  private static final String LOCAL_FALLBACK_URL = "https://" + LOCAL_FALLBACK_HOST + "/index.html";
  private static final String REMOTE_URL = "https://instavow.com";
  private boolean offlineFallbackActive = false;
  private ConnectivityManager connectivityManager;
  private ConnectivityManager.NetworkCallback networkCallback;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(SystemBrowserPlugin.class);
    super.onCreate(savedInstanceState);

    WebView webView = getBridge().getWebView();
    webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        if (LOCAL_FALLBACK_HOST.equals(request.getUrl().getHost())) {
          // Keep in-app navigation within the offline fallback host inside this
          // WebView instead of letting Capacitor's default navigation policy treat
          // it as an untrusted external link and hand it off to the system browser.
          return false;
        }
        return super.shouldOverrideUrlLoading(view, request);
      }

      @Override
      public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        if (LOCAL_FALLBACK_HOST.equals(request.getUrl().getHost())) {
          WebResourceResponse local = loadLocalAsset(request.getUrl().getPath());
          if (local != null) {
            return local;
          }
        }
        return super.shouldInterceptRequest(view, request);
      }

      @Override
      public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (request.isForMainFrame() && !offlineFallbackActive) {
          offlineFallbackActive = true;
          view.loadUrl(LOCAL_FALLBACK_URL);
          return;
        }
        super.onReceivedError(view, request, error);
      }
    });

    // Once real internet connectivity is restored while showing the offline
    // fallback, navigate back to the real remote origin. Staying on the fake
    // local origin would otherwise break same-origin API calls (CORS) and any
    // window.location.origin-based link generation in the web app.
    connectivityManager = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
    networkCallback = new ConnectivityManager.NetworkCallback() {
      @Override
      public void onAvailable(Network network) {
        runOnUiThread(() -> {
          if (offlineFallbackActive) {
            String currentPath = getBridge().getWebView().getUrl();
            // Don't auto-reload when the user is in demo mode — demo data is
            // fully local (localStorage) and a reload would lose unsaved edits
            // and send the user back to the login page.
            if (currentPath != null && currentPath.contains("/demo")) {
              offlineFallbackActive = false;
              return;
            }
            // For non-demo pages, reload to the same path on the remote origin
            // so the user stays on the same page rather than being sent to root.
            String pathOnly = "";
            if (currentPath != null) {
              int pathStart = currentPath.indexOf("/", "https://".length());
              if (pathStart >= 0) pathOnly = currentPath.substring(pathStart);
            }
            offlineFallbackActive = false;
            getBridge().getWebView().loadUrl(REMOTE_URL + pathOnly);
          }
        });
      }
    };
    NetworkRequest networkRequest = new NetworkRequest.Builder()
      .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
      .addCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
      .build();
    connectivityManager.registerNetworkCallback(networkRequest, networkCallback);
  }

  @Override
  public void onDestroy() {
    if (connectivityManager != null && networkCallback != null) {
      connectivityManager.unregisterNetworkCallback(networkCallback);
    }
    super.onDestroy();
  }

  private WebResourceResponse loadLocalAsset(String urlPath) {
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
      try {
        InputStream stream = getAssets().open(candidate);
        return new WebResourceResponse(guessMimeType(candidate), null, stream);
      } catch (IOException ignored) {
        // try next candidate
      }
    }
    return null;
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
