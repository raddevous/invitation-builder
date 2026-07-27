"use client";

import { useState, useRef, useEffect } from "react";

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

interface QRUploadProps {
  qrCode: string;
  maskedName: string;
  onQRCodeChange: (qrCode: string, maskedName: string) => void;
  accentColor?: string;
  isDarkMode?: boolean;
}

// Financial masking function: "Juan Dela Cruz" -> "JUAN D***"
function maskAccountName(name: string): string {
  if (!name) return "";
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  
  // Keep first name, drop middle initials, mask last name
  const firstName = parts[0].toUpperCase();
  const lastName = parts[parts.length - 1].toUpperCase();
  
  // Truncate last name to first letter + ***
  const maskedLastName = lastName.charAt(0) + "***";
  
  return `${firstName} ${maskedLastName}`;
}

// Parse EMVCo QR payment format to extract account name
function parseQRPaymentData(qrData: string): string {
  try {
    // EMVCo format uses length-value pairs with nested TLV structures
    // We need to parse the TLV structure properly
    
    // Helper to parse TLV at a given position
    function parseTLV(data: string, pos: number): { tag: string; length: number; value: string; nextPos: number } | null {
      if (pos + 4 > data.length) return null;
      const tag = data.substring(pos, pos + 2);
      const lengthStr = data.substring(pos + 2, pos + 4);
      const length = parseInt(lengthStr, 10);
      if (isNaN(length) || pos + 4 + length > data.length) return null;
      const value = data.substring(pos + 4, pos + 4 + length);
      return { tag, length, value, nextPos: pos + 4 + length };
    }
    
    // Recursively search for tag 59 (merchant name) in TLV structure
    function findTag59(data: string): string | null {
      let pos = 0;
      while (pos < data.length) {
        const tlv = parseTLV(data, pos);
        if (!tlv) break;
        
        if (tlv.tag === "59") {
          return tlv.value;
        }
        
        // Check nested TLV (tags like 26-51 often contain sub-TLVs)
        if (tlv.length > 4) {
          const nested = findTag59(tlv.value);
          if (nested) return nested;
        }
        
        pos = tlv.nextPos;
      }
      return null;
    }
    
    // Try proper TLV parsing first
    const name = findTag59(qrData);
    if (name) return name;
    
    // Fallback: regex for tag 59 (less reliable but catches some edge cases)
    const tag59Match = qrData.match(/59(\d{2})(.+)/);
    if (tag59Match) {
      const length = parseInt(tag59Match[1], 10);
      const name = tag59Match[2].substring(0, length);
      return name;
    }
    
    // Fallback: look for merchant name in sub-TLV tag 01 within tag 26-51
    // Common in Philippine QR codes (GCash, Maya, etc.)
    for (let tagNum = 26; tagNum <= 51; tagNum++) {
      const tagStr = String(tagNum).padStart(2, '0');
      const tagRegex = new RegExp(`${tagStr}(\\d{2})(.+)`);
      const match = qrData.match(tagRegex);
      if (match) {
        const innerLen = parseInt(match[1], 10);
        const innerData = match[2].substring(0, innerLen);
        // Sub-tag 01 often contains merchant name
        const subMatch = innerData.match(/01(\d{2})(.+)/);
        if (subMatch) {
          const subLen = parseInt(subMatch[1], 10);
          const subName = subMatch[2].substring(0, subLen);
          if (subName && /[a-zA-Z]/.test(subName)) return subName;
        }
      }
    }
    
    // Fallback: look for readable name patterns
    const nameMatch = qrData.match(/[A-Z][a-zA-Z\s]{2,}/g);
    if (nameMatch) {
      // Return the longest match that looks like a name (not just noise)
      const filtered = nameMatch.filter(n => n.trim().length >= 3 && !/^[A-Z]+$/.test(n));
      if (filtered.length > 0) {
        return filtered.sort((a, b) => b.length - a.length)[0];
      }
      return nameMatch.sort((a, b) => b.length - a.length)[0];
    }
    
    return "";
  } catch {
    return "";
  }
}

export default function QRUpload({ qrCode, maskedName, onQRCodeChange, accentColor = "#6998EE", isDarkMode = false }: QRUploadProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const cropperRef = useRef<any>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const inputId = useRef(`qr-upload-${Math.random()}`).current;

  useEffect(() => {
    // Load html5-qrcode library from CDN
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.Html5Qrcode) {
        // @ts-ignore
        html5QrCodeRef.current = new window.Html5Qrcode("qr-reader-hidden");
      }
    };
    document.body.appendChild(script);

    // Load cropperjs library from CDN
    const cropperScript = document.createElement("script");
    cropperScript.src = "https://unpkg.com/cropperjs@1.6.1/dist/cropper.min.js";
    cropperScript.async = true;
    document.body.appendChild(cropperScript);

    const cropperCss = document.createElement("link");
    cropperCss.rel = "stylesheet";
    cropperCss.href = "https://unpkg.com/cropperjs@1.6.1/dist/cropper.min.css";
    document.head.appendChild(cropperCss);

    return () => {
      document.body.removeChild(script);
      document.body.removeChild(cropperScript);
      document.head.removeChild(cropperCss);
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsCropping(true);

    // Read file as data URL for cropping
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCrop = async () => {
    if (!cropperRef.current || !uploadedImage) return;

    setIsCropping(false);
    setIsScanning(true);

    try {
      // Get cropped canvas with max resolution for better QR readability
      const containerData = cropperRef.current.getContainerData();
      const cropData = cropperRef.current.getData();
      // Scale up for better quality while keeping reasonable size
      const maxDimension = 1024;
      const scale = Math.min(maxDimension / Math.max(cropData.width, cropData.height), 4);
      const canvas = cropperRef.current.getCroppedCanvas({
        width: Math.round(cropData.width * scale),
        height: Math.round(cropData.height * scale),
        imageSmoothingQuality: 'high'
      });
      const croppedDataUrl = canvas.toDataURL("image/png");

      // Convert to blob for QR scanning
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          resolve(blob!);
        }, "image/png");
      });

      const file = new File([blob], "cropped-qr.png", { type: "image/png" });

      // Scan the QR code to extract data
      // @ts-ignore
      if (!window.Html5Qrcode || !html5QrCodeRef.current) {
        throw new Error("QR code library not loaded");
      }

      // @ts-ignore
      const html5QrCode = html5QrCodeRef.current;
      
      try {
        const result = await html5QrCode.scanFileV2(file, true);
        const qrData = result.decodedText;
        
        // Extract account name from QR payment data
        const extractedName = parseQRPaymentData(qrData);
        
        // Apply masking
        const masked = maskAccountName(extractedName);
        
        onQRCodeChange(croppedDataUrl, masked);
      } catch (scanError) {
        // If scanning fails, still upload the image but leave name empty
        console.warn("QR scan failed, uploading image only:", scanError);
        setError("Could not read QR data. The image will be uploaded but no name was detected.");
        onQRCodeChange(croppedDataUrl, "");
      }
    } catch (err) {
      setError("Failed to process QR code");
      console.error(err);
    } finally {
      setIsScanning(false);
      setUploadedImage(null);
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    }
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setUploadedImage(null);
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
  };

  const handleRemove = () => {
    onQRCodeChange("", "");
  };

  // Initialize cropper when image is loaded
  useEffect(() => {
    if (isCropping && uploadedImage && imageRef.current) {
      // @ts-ignore
      if (window.Cropper) {
        // @ts-ignore
        cropperRef.current = new window.Cropper(imageRef.current, {
          aspectRatio: 1,
          viewMode: 1,
          autoCropArea: 0.9,
          responsive: true,
          background: false,
          zoomable: true,
          scalable: true,
        });
      }
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
      }
    };
  }, [isCropping, uploadedImage]);

  return (
    <div className="space-y-2">
      <label className="block text-xs text-gray-500">QR Code</label>
      
      {isCropping && uploadedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-4 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>Crop QR Code</h3>
            <div className={`flex-1 overflow-hidden rounded-lg mb-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <img
                ref={imageRef}
                src={uploadedImage}
                alt="Upload for cropping"
                className="max-w-full"
                style={{ maxHeight: '60vh' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelCrop}
                className={`flex-1 px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDarkMode 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCrop}
                disabled={isScanning}
                className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = adjustColorBrightness(accentColor, -10)}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
              >
                {isScanning ? "Processing..." : "Crop & Scan"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {qrCode ? (
        <div className="relative">
          <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3">
            <img
              src={qrCode}
              alt="QR Code"
              className="w-16 h-16 object-contain border border-gray-100 rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {maskedName || "No name detected"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">QR code uploaded</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isCropping || isScanning}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isCropping || isScanning
                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                : "border-gray-200 text-gray-600"
            }`}
            style={
              !isCropping && !isScanning
                ? {
                    borderColor: accentColor,
                    backgroundColor: `${accentColor}05`
                  }
                : undefined
            }
          >
            {isScanning ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span className="text-sm">Processing...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm">Upload QR Code</span>
              </>
            )}
          </label>
        </div>
      )}
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
      
      {/* Hidden element for html5-qrcode */}
      <div id="qr-reader-hidden" className="hidden" />
    </div>
  );
}
