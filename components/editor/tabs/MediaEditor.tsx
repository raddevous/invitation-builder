import { useState, useEffect, useRef } from "react";
import type { InvitationData } from "@/lib/types/invitation";

interface MediaEditorProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
  invitationId?: string;
  onSave?: (updatedData: InvitationData) => Promise<void>;
}

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper function to convert Google Drive share URL to direct image URL
const convertGoogleDriveUrl = (url: string): string => {
  // Match Google Drive file URLs: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
  }
  // Match Google Drive open URLs: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w1000`;
  }
  return url;
};

const MEDIA_ITEMS = [
  { id: "logo", label: "Logo", description: "Display logo" },
  { id: "gallery", label: "Photo Gallery", description: "Photo gallery settings" },
  { id: "venue", label: "Wedding Venue Photo", description: "Ceremony &/or Reception photos" },
  { id: "fonts", label: "Fonts", description: "Custom font settings" },
  { id: "music", label: "Music", description: "Background music settings" },
];

export default function MediaEditor({ data, onChange, isDarkMode = false, accentColor = "#B88A78", onClose, invitationId, onSave }: MediaEditorProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(["logo", "gallery", "venue", "fonts", "music"]));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Local state for sections (no auto-save)
  const [pendingLogo, setPendingLogo] = useState(data.heroIcon || "");
  const [pendingGallery, setPendingGallery] = useState<string[]>(data.galleryImages || []);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [showGalleryUrlInput, setShowGalleryUrlInput] = useState(false);
  const galleryLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [galleryDeleteIdx, setGalleryDeleteIdx] = useState<number | null>(null);
  const [pendingVenue, setPendingVenue] = useState<string[]>(data.venueImages || []);
  const [venueUrlInput, setVenueUrlInput] = useState("");
  const [showVenueUrlInput, setShowVenueUrlInput] = useState(false);
  const venueLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [venueDeleteIdx, setVenueDeleteIdx] = useState<number | null>(null);
  const [pendingHeadingFont, setPendingHeadingFont] = useState(data.customHeadingFont || "");
  const [pendingBodyFont, setPendingBodyFont] = useState(data.customBodyFont || "");
  const [pendingBackgroundMusic, setPendingBackgroundMusic] = useState<string[]>(data.backgroundMusic || []);
  const [pendingBackgroundMusicFileNames, setPendingBackgroundMusicFileNames] = useState<string[]>(data.backgroundMusicFileNames || []);

  // Track if there are unsaved changes
  const [hasLogoChanges, setHasLogoChanges] = useState(false);
  const [hasGalleryChanges, setHasGalleryChanges] = useState(false);
  const [hasVenueChanges, setHasVenueChanges] = useState(false);
  const [hasFontsChanges, setHasFontsChanges] = useState(false);

  // Combined check for any changes
  const hasAnyChanges = hasLogoChanges || hasGalleryChanges || hasVenueChanges || hasFontsChanges;

  // Update change tracking when data changes
  useEffect(() => {
    setHasLogoChanges(pendingLogo !== (data.heroIcon || ""));
  }, [pendingLogo, data.heroIcon]);

  useEffect(() => {
    const currentGallery = data.galleryImages || [];
    setHasGalleryChanges(
      pendingGallery.length !== currentGallery.length ||
      pendingGallery.some((url, i) => url !== currentGallery[i])
    );
  }, [pendingGallery, data.galleryImages]);

  useEffect(() => {
    const currentVenue = data.venueImages || [];
    setHasVenueChanges(
      pendingVenue.length !== currentVenue.length ||
      pendingVenue.some((url, i) => url !== currentVenue[i])
    );
  }, [pendingVenue, data.venueImages]);

  useEffect(() => {
    setHasFontsChanges(
      pendingHeadingFont !== (data.customHeadingFont || "") ||
      pendingBodyFont !== (data.customBodyFont || "")
    );
  }, [pendingHeadingFont, pendingBodyFont, data.customHeadingFont, data.customBodyFont]);

  // Combined apply handler
  const handleApplyAll = () => {
    if (hasLogoChanges) {
      onChange("heroIcon", pendingLogo);
    }
    if (hasGalleryChanges) {
      onChange("galleryImages", pendingGallery as unknown as string);
    }
    if (hasVenueChanges) {
      onChange("venueImages", pendingVenue as unknown as string);
    }
    if (hasFontsChanges) {
      onChange("customHeadingFont", pendingHeadingFont);
      onChange("customBodyFont", pendingBodyFont);
    }
    // Reset all change flags
    setHasLogoChanges(false);
    setHasGalleryChanges(false);
    setHasVenueChanges(false);
    setHasFontsChanges(false);
    if (onSave) {
      const updatedData = { ...data };
      if (hasLogoChanges) updatedData.heroIcon = pendingLogo;
      if (hasGalleryChanges) updatedData.galleryImages = pendingGallery as any;
      if (hasVenueChanges) updatedData.venueImages = pendingVenue as any;
      if (hasFontsChanges) {
        updatedData.customHeadingFont = pendingHeadingFont;
        updatedData.customBodyFont = pendingBodyFont;
      }
      onSave(updatedData);
    }
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasAnyChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setPendingLogo(data.heroIcon || "");
    setPendingGallery(data.galleryImages || []);
    setGalleryUrlInput("");
    setShowGalleryUrlInput(false);
    setPendingVenue(data.venueImages || []);
    setVenueUrlInput("");
    setShowVenueUrlInput(false);
    setPendingHeadingFont(data.customHeadingFont || "");
    setPendingBodyFont(data.customBodyFont || "");
    setPendingBackgroundMusic(data.backgroundMusic || []);
    setPendingBackgroundMusicFileNames(data.backgroundMusicFileNames || []);
    setHasLogoChanges(false);
    setHasGalleryChanges(false);
    setHasVenueChanges(false);
    setHasFontsChanges(false);
    onClose();
  };

  const handleSaveAndClose = async () => {
    setShowUnsavedDialog(false);
    handleApplyAll();
    onClose();
  };

  const handleToggle = (sectionId: string) => {
    // If collapsing the gallery section, hide the URL input
    if (sectionId === "gallery" && !collapsedSections.has("gallery")) {
      setShowGalleryUrlInput(false);
      setGalleryUrlInput("");
    }
    // If collapsing the venue section, hide the URL input
    if (sectionId === "venue" && !collapsedSections.has("venue")) {
      setShowVenueUrlInput(false);
      setVenueUrlInput("");
    }
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        // Section is collapsed - expand it and collapse all others (accordion)
        newSet.clear();
        MEDIA_ITEMS.forEach(item => {
          if (item.id !== sectionId) {
            newSet.add(item.id);
          }
        });
      } else {
        // Section is expanded - collapse it
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleMusicUpload = async (index: number, file: File) => {
    if (!invitationId) {
      alert("Invitation ID is required for file upload");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit. Please use a smaller file or compress your audio.");
      return;
    }

    setUploadingIndex(index);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", `backgroundMusic-${index}`);
      formData.append("invitationId", invitationId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      
      // Update the music URL and file name - auto-save immediately
      const newMusic = [...(data.backgroundMusic || [])];
      const newFileNames = [...(data.backgroundMusicFileNames || [])];
      newMusic[index] = result.url;
      newFileNames[index] = file.name;
      const updatedData = { ...data, backgroundMusic: newMusic as any, backgroundMusicFileNames: newFileNames as any };
      onChange("backgroundMusic", newMusic as unknown as string);
      onChange("backgroundMusicFileNames", newFileNames as unknown as string);
      // Save to Supabase immediately
      if (onSave) {
        await onSave(updatedData);
      }
      // Also update local state to keep UI in sync
      setPendingBackgroundMusic(newMusic);
      setPendingBackgroundMusicFileNames(newFileNames);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload music file. Please try again.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleFontUpload = async (type: 'heading' | 'body', file: File) => {
    if (!invitationId) {
      alert("Invitation ID is required for file upload");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit. Please use a smaller file.");
      return;
    }

    // Validate font file type
    const validExtensions = ['.woff2', '.woff', '.ttf', '.otf'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      alert("Please upload a valid font file (.woff2, .woff, .ttf, .otf).");
      return;
    }

    setUploadingIndex(type === 'heading' ? -1 : -2);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", type === 'heading' ? 'customHeadingFont' : 'customBodyFont');
      formData.append("invitationId", invitationId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      if (type === 'heading') {
        setPendingHeadingFont(result.url);
      } else {
        setPendingBodyFont(result.url);
      }
    } catch (error) {
      console.error("Font upload error:", error);
      alert(error instanceof Error ? `Failed to upload font file: ${error.message}` : "Failed to upload font file. Please try again.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleDeleteFont = (type: 'heading' | 'body') => {
    const url = type === 'heading' ? pendingHeadingFont : pendingBodyFont;
    if (url) {
      const pathMatch = url.match(/\/user-uploads\/(.+)$/);
      if (pathMatch && invitationId) {
        fetch("/api/delete-file", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path: pathMatch[1] }),
        }).catch((error) => console.error("Delete font error:", error));
      }
    }

    if (type === 'heading') {
      setPendingHeadingFont("");
    } else {
      setPendingBodyFont("");
    }
  };

  const handleDeleteMusic = async () => {
    // If no music file exists, just clear the dialog and state
    if (!pendingBackgroundMusic?.[0]) {
      const updatedData = { ...data, backgroundMusic: [] as any, backgroundMusicFileNames: [] as any };
      onChange("backgroundMusic", [] as unknown as string);
      onChange("backgroundMusicFileNames", [] as unknown as string);
      setPendingBackgroundMusic([]);
      setPendingBackgroundMusicFileNames([]);
      setShowDeleteDialog(false);
      if (onSave) {
        await onSave(updatedData);
      }
      return;
    }

    if (!invitationId) {
      const updatedData = { ...data, backgroundMusic: [] as any, backgroundMusicFileNames: [] as any };
      onChange("backgroundMusic", [] as unknown as string);
      onChange("backgroundMusicFileNames", [] as unknown as string);
      setPendingBackgroundMusic([]);
      setPendingBackgroundMusicFileNames([]);
      setShowDeleteDialog(false);
      if (onSave) {
        await onSave(updatedData);
      }
      return;
    }

    // Extract file path from URL
    const url = pendingBackgroundMusic[0];
    const pathMatch = url.match(/\/user-uploads\/(.+)$/);
    if (!pathMatch) {
      console.error("Could not extract file path from URL");
      // Still clear the data even if we can't delete from storage
      const updatedData = { ...data, backgroundMusic: [] as any, backgroundMusicFileNames: [] as any };
      onChange("backgroundMusic", [] as unknown as string);
      onChange("backgroundMusicFileNames", [] as unknown as string);
      setPendingBackgroundMusic([]);
      setPendingBackgroundMusicFileNames([]);
      setShowDeleteDialog(false);
      if (onSave) {
        await onSave(updatedData);
      }
      return;
    }

    const filePath = pathMatch[1];

    try {
      const response = await fetch("/api/delete-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: filePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Delete failed");
      }

      // Clear the music data - auto-save immediately
      const updatedData = { ...data, backgroundMusic: [] as any, backgroundMusicFileNames: [] as any };
      onChange("backgroundMusic", [] as unknown as string);
      onChange("backgroundMusicFileNames", [] as unknown as string);
      setPendingBackgroundMusic([]);
      setPendingBackgroundMusicFileNames([]);
      setShowDeleteDialog(false);
      if (onSave) {
        await onSave(updatedData);
      }
    } catch (error) {
      console.error("Delete error:", error);
      // Still clear the data even if storage delete failed
      const updatedData = { ...data, backgroundMusic: [] as any, backgroundMusicFileNames: [] as any };
      onChange("backgroundMusic", [] as unknown as string);
      onChange("backgroundMusicFileNames", [] as unknown as string);
      setPendingBackgroundMusic([]);
      setPendingBackgroundMusicFileNames([]);
      setShowDeleteDialog(false);
      if (onSave) {
        await onSave(updatedData);
      }
    }
  };

  return (
    <div className={`w-full h-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Header - fixed, not scrollable */}
      <div className={`flex items-center gap-3 p-4 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <button
          onClick={handleClose}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
            Media
          </h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
            Manage your media files
          </p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ fontFamily: "Inter, sans-serif" }}>
        {MEDIA_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`border rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            style={{
              backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
              ...(!collapsedSections.has(item.id) ? {
                boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
              } : {})
            }}
          >
            <div 
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              onClick={() => handleToggle(item.id)}
            >
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
              </div>
              <div className="shrink-0 text-gray-400 ml-2">
                {collapsedSections.has(item.id) ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                )}
              </div>
            </div>

            {/* Logo settings */}
            {!collapsedSections.has("logo") && item.id === "logo" && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-3">
                  <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>DISPLAY LOGO</label>
                  
                  <div className="space-y-3">
                    {/* Preview */}
                    {pendingLogo && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center mx-auto">
                        {data.heroIconColorTint ? (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundColor: accentColor,
                              opacity: data.heroIconColorTintOpacity ?? 1,
                              WebkitMaskImage: `url(${pendingLogo})`,
                              WebkitMaskSize: "contain",
                              WebkitMaskPosition: "center",
                              WebkitMaskRepeat: "no-repeat",
                              maskImage: `url(${pendingLogo})`,
                              maskSize: "contain",
                              maskPosition: "center",
                              maskRepeat: "no-repeat",
                            }}
                          />
                        ) : (
                          <img src={pendingLogo} alt="Logo" className="w-full h-full object-contain" />
                        )}
                      </div>
                    )}
                    
                    {/* URL Input */}
                    <input
                      type="text"
                      value={pendingLogo}
                      onChange={(e) => setPendingLogo(convertGoogleDriveUrl(e.target.value))}
                      placeholder="Paste logo URL or Google Drive link..."
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Photo Gallery settings */}
            {!collapsedSections.has("gallery") && item.id === "gallery" && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>PHOTOS</label>

                  {/* Image Grid */}
                  {pendingGallery.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {pendingGallery.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer select-none group"
                          style={{
                            outline: galleryDeleteIdx === idx ? `2px solid #ef4444` : "none",
                            outlineOffset: galleryDeleteIdx === idx ? "2px" : "0",
                          }}
                          onPointerDown={() => {
                            galleryLongPressTimer.current = setTimeout(() => {
                              setGalleryDeleteIdx(idx);
                            }, 500);
                          }}
                          onPointerUp={() => {
                            if (galleryLongPressTimer.current) {
                              clearTimeout(galleryLongPressTimer.current);
                              galleryLongPressTimer.current = null;
                            }
                          }}
                          onPointerLeave={() => {
                            if (galleryLongPressTimer.current) {
                              clearTimeout(galleryLongPressTimer.current);
                              galleryLongPressTimer.current = null;
                            }
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector(".broken-placeholder")) {
                                const placeholder = document.createElement("div");
                                placeholder.className = "broken-placeholder w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700";
                                placeholder.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                          {/* Delete confirmation overlay */}
                          {galleryDeleteIdx === idx && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                              <p className="text-white text-xs font-medium text-center px-2">Delete this image?</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newImages = pendingGallery.filter((_, i) => i !== idx);
                                    setPendingGallery(newImages);
                                    setGalleryDeleteIdx(null);
                                  }}
                                  className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGalleryDeleteIdx(null);
                                  }}
                                  className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Image Button inline in grid - hidden after 25 images */}
                      {pendingGallery.length < 25 && !showGalleryUrlInput && (
                        <button
                          type="button"
                          onClick={() => setShowGalleryUrlInput(true)}
                          className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors"
                          style={{
                            borderColor: isDarkMode ? "#374151" : "#d1d5db",
                            color: isDarkMode ? "#6b7280" : "#9ca3af",
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Add Image Button (dashed outline) - shown when no images yet */}
                  {pendingGallery.length === 0 && !showGalleryUrlInput && (
                    <button
                      type="button"
                      onClick={() => setShowGalleryUrlInput(true)}
                      className="w-full py-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors"
                      style={{
                        borderColor: isDarkMode ? "#374151" : "#d1d5db",
                        color: isDarkMode ? "#6b7280" : "#9ca3af",
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Add Image</span>
                    </button>
                  )}

                  {/* URL Input with ADD button */}
                  {showGalleryUrlInput && pendingGallery.length < 25 && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={galleryUrlInput}
                          onChange={(e) => setGalleryUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && galleryUrlInput.trim()) {
                              setPendingGallery([...pendingGallery, convertGoogleDriveUrl(galleryUrlInput.trim())]);
                              setGalleryUrlInput("");
                              setShowGalleryUrlInput(false);
                            }
                          }}
                          placeholder="Paste image URL or Google Drive link..."
                          autoFocus
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (galleryUrlInput.trim()) {
                              setPendingGallery([...pendingGallery, convertGoogleDriveUrl(galleryUrlInput.trim())]);
                              setGalleryUrlInput("");
                              setShowGalleryUrlInput(false);
                            }
                          }}
                          className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                          style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Max limit indicator */}
                  {pendingGallery.length >= 25 && (
                    <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Maximum of 25 photos reached
                    </p>
                  )}

                  {/* Long press hint */}
                  {pendingGallery.length > 0 && pendingGallery.length < 25 && (
                    <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Hold down an image to delete
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Wedding Venue Photo settings */}
            {!collapsedSections.has("venue") && item.id === "venue" && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Venue Images (Optional)</label>

                  {/* Image Grid */}
                  {pendingVenue.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {pendingVenue.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer select-none group"
                          style={{
                            outline: venueDeleteIdx === idx ? `2px solid #ef4444` : "none",
                            outlineOffset: venueDeleteIdx === idx ? "2px" : "0",
                          }}
                          onPointerDown={() => {
                            venueLongPressTimer.current = setTimeout(() => {
                              setVenueDeleteIdx(idx);
                            }, 500);
                          }}
                          onPointerUp={() => {
                            if (venueLongPressTimer.current) {
                              clearTimeout(venueLongPressTimer.current);
                              venueLongPressTimer.current = null;
                            }
                          }}
                          onPointerLeave={() => {
                            if (venueLongPressTimer.current) {
                              clearTimeout(venueLongPressTimer.current);
                              venueLongPressTimer.current = null;
                            }
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Venue ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector(".broken-placeholder")) {
                                const placeholder = document.createElement("div");
                                placeholder.className = "broken-placeholder w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700";
                                placeholder.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                          {/* Delete confirmation overlay */}
                          {venueDeleteIdx === idx && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                              <p className="text-white text-xs font-medium text-center px-2">Delete this image?</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newImages = pendingVenue.filter((_, i) => i !== idx);
                                    setPendingVenue(newImages);
                                    setVenueDeleteIdx(null);
                                  }}
                                  className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVenueDeleteIdx(null);
                                  }}
                                  className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Image Button inline in grid - hidden after 5 images */}
                      {pendingVenue.length < 5 && !showVenueUrlInput && (
                        <button
                          type="button"
                          onClick={() => setShowVenueUrlInput(true)}
                          className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors"
                          style={{
                            borderColor: isDarkMode ? "#374151" : "#d1d5db",
                            color: isDarkMode ? "#6b7280" : "#9ca3af",
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Add Image Button (dashed outline) - shown when no images yet */}
                  {pendingVenue.length === 0 && !showVenueUrlInput && (
                    <button
                      type="button"
                      onClick={() => setShowVenueUrlInput(true)}
                      className="w-full py-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors"
                      style={{
                        borderColor: isDarkMode ? "#374151" : "#d1d5db",
                        color: isDarkMode ? "#6b7280" : "#9ca3af",
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Add Image</span>
                    </button>
                  )}

                  {/* URL Input with ADD button */}
                  {showVenueUrlInput && pendingVenue.length < 5 && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={venueUrlInput}
                          onChange={(e) => setVenueUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && venueUrlInput.trim()) {
                              setPendingVenue([...pendingVenue, convertGoogleDriveUrl(venueUrlInput.trim())]);
                              setVenueUrlInput("");
                              setShowVenueUrlInput(false);
                            }
                          }}
                          placeholder="Paste image URL or Google Drive link..."
                          autoFocus
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (venueUrlInput.trim()) {
                              setPendingVenue([...pendingVenue, convertGoogleDriveUrl(venueUrlInput.trim())]);
                              setVenueUrlInput("");
                              setShowVenueUrlInput(false);
                            }
                          }}
                          className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                          style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Max limit indicator */}
                  {pendingVenue.length >= 5 && (
                    <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Maximum of 5 venue photos reached
                    </p>
                  )}

                  {/* Long press hint */}
                  {pendingVenue.length > 0 && pendingVenue.length < 5 && (
                    <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Hold down an image to delete
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fonts settings */}
            {!collapsedSections.has("fonts") && item.id === "fonts" && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-6">
                  {/* Custom Heading Font */}
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Custom Heading Font</label>
                    {!pendingHeadingFont ? (
                      <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploadingIndex === -1
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "border-gray-200 text-gray-600"
                      }`} style={
                        uploadingIndex !== -1
                          ? {
                              borderColor: accentColor,
                              backgroundColor: `${accentColor}05`
                            }
                          : undefined
                      }>
                        {uploadingIndex === -1 ? (
                          <>
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            <span className="text-sm">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17,8 12,3 7,8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className="text-sm">Upload font file</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".woff2,.woff,.ttf,.otf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFontUpload('heading', file);
                            }
                          }}
                          disabled={uploadingIndex !== null}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <div className={`flex-1 px-3 py-2.5 border rounded-lg text-sm truncate ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        >
                          Custom Heading Added
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFont('heading')}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                          title="Remove font file"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Custom Body Font */}
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Custom Body Font</label>
                    {!pendingBodyFont ? (
                      <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploadingIndex === -2
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "border-gray-200 text-gray-600"
                      }`} style={
                        uploadingIndex !== -2
                          ? {
                              borderColor: accentColor,
                              backgroundColor: `${accentColor}05`
                            }
                          : undefined
                      }>
                        {uploadingIndex === -2 ? (
                          <>
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            <span className="text-sm">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17,8 12,3 7,8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className="text-sm">Upload font file</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".woff2,.woff,.ttf,.otf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFontUpload('body', file);
                            }
                          }}
                          disabled={uploadingIndex !== null}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <div className={`flex-1 px-3 py-2.5 border rounded-lg text-sm truncate ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        >
                          Custom Body Added
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFont('body')}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                          title="Remove font file"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Music settings */}
            {!collapsedSections.has("music") && item.id === "music" && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Background Music</label>
                  
                  {!pendingBackgroundMusic.length ? (
                    <div className="flex gap-2">
                      {/* Upload button (initial) */}
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploadingIndex === 0
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "border-gray-200 text-gray-600"
                      }`} style={
                        uploadingIndex !== 0
                          ? {
                              borderColor: accentColor,
                              backgroundColor: `${accentColor}05`
                            }
                          : undefined
                      }>
                        {uploadingIndex === 0 ? (
                          <>
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            <span className="text-sm">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17,8 12,3 7,8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className="text-sm">Upload music file</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleMusicUpload(0, file);
                            }
                          }}
                          disabled={uploadingIndex !== null}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      {/* File name display */}
                      <div className={`flex-1 px-3 py-2.5 border rounded-lg text-sm truncate ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                        style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                      >
                        Music File Added
                      </div>
                      
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => setShowDeleteDialog(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                        title="Remove file"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Single Apply button - shown when there are any changes, fixed at bottom */}
      {hasAnyChanges && (
        <div className="p-4 border-t shrink-0" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
          <button
            type="button"
            onClick={handleApplyAll}
            className="w-full px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
          >
            Apply Changes
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteDialog(false)}>
          <div 
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Delete Music File
            </h3>
            <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Are you sure you want to delete this music file? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className={`flex-1 px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDarkMode 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMusic}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved changes dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Unsaved Changes
            </h3>
            <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              You have unsaved changes. Do you want to save them or discard them?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDiscardChanges}
                className={`flex-1 px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDarkMode 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Discard
              </button>
              <button
                onClick={handleSaveAndClose}
                className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
