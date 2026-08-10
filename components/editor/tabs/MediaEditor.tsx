import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import ProgressCircle from "../shared/ProgressCircle";
import { getMediaItemProgress, getMediaItemProgressData } from "@/lib/utils/progressCalculator";
import { apiUrl } from "@/lib/utils/api";
import { isOnline } from "@/lib/utils/offline-cache";

function useImageValidation(urls: string[]): { broken: Set<string>; checking: boolean } {
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const validUrls = urls.filter((u) => u && u.trim() !== "");
    if (validUrls.length === 0) {
      setBroken(new Set());
      setChecking(false);
      return;
    }
    setChecking(true);
    let cancelled = false;
    const newBroken = new Set<string>();
    let checked = 0;
    validUrls.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        checked++;
        if (cancelled) return;
        if (checked === validUrls.length) {
          setBroken(newBroken);
          setChecking(false);
        }
      };
      img.onerror = () => {
        checked++;
        if (cancelled) return;
        newBroken.add(url);
        if (checked === validUrls.length) {
          setBroken(newBroken);
          setChecking(false);
        }
      };
      img.src = url;
    });
    return () => { cancelled = true; };
  }, [urls.join(",")]);

  return { broken, checking };
}

interface MediaEditorProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
  invitationId?: string;
  onSave?: (updatedData: InvitationData) => Promise<void>;
  isDemoMode?: boolean;
  showNumbers?: boolean;
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
  { id: "background", label: "Background", description: "Hero background images" },
  { id: "logo", label: "Logo", description: "Display logo" },
  { id: "gallery", label: "Photo Gallery", description: "Photo gallery settings" },
  { id: "venue", label: "Venue Photo", description: "Ceremony &/or Reception photos" },
  { id: "photos", label: "Photos & Images Picker", description: "Upload images or add image URLs" },
  { id: "fonts", label: "Fonts", description: "Custom font settings" },
  { id: "music", label: "Audio Files", description: "Upload audios or audio URLs" },
];

export default function MediaEditor({ data, onChange, isDarkMode = false, accentColor = "#6998EE", onClose, invitationId, onSave, isDemoMode = false, showNumbers = false }: MediaEditorProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(["background", "logo", "gallery", "photos", "venue", "fonts", "music"]));
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [musicDeleteIdx, setMusicDeleteIdx] = useState<number | null>(null);

  // Local state for sections (no auto-save)
  const [pendingBgDesktop, setPendingBgDesktop] = useState<string[]>(data.heroBackgroundImages || []);
  const [pendingBgMobile, setPendingBgMobile] = useState<string[]>(data.heroBackgroundImagesMobile || []);
  const [isMobileBackgroundMode, setIsMobileBackgroundMode] = useState(false);
  const [showBgImagePicker, setShowBgImagePicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<"logo" | "gallery" | "venue" | "receptionVenue" | null>(null);
  const [pendingLogo, setPendingLogo] = useState(data.heroIcon || "");
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [pendingGallery, setPendingGallery] = useState<string[]>(data.galleryImages || []);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [showGalleryUrlInput, setShowGalleryUrlInput] = useState(false);
  const galleryDragTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [galleryDeleteIdx, setGalleryDeleteIdx] = useState<number | null>(null);
  const [galleryDragIdx, setGalleryDragIdx] = useState<number | null>(null);
  const galleryDragStart = useRef({ x: 0, y: 0 });
  const galleryDragTriggered = useRef(false);
  const [pendingVenue, setPendingVenue] = useState<string[]>(data.venueImages || []);
  const [venueUrlInput, setVenueUrlInput] = useState("");
  const [showVenueUrlInput, setShowVenueUrlInput] = useState(false);
  const venueDragTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [venueDeleteIdx, setVenueDeleteIdx] = useState<number | null>(null);
  const [venueDragIdx, setVenueDragIdx] = useState<number | null>(null);
  const venueDragStart = useRef({ x: 0, y: 0 });
  const venueDragTriggered = useRef(false);
  const [pendingReceptionVenue, setPendingReceptionVenue] = useState<string[]>(data.receptionVenueImages || []);
  const [receptionVenueUrlInput, setReceptionVenueUrlInput] = useState("");
  const [showReceptionVenueUrlInput, setShowReceptionVenueUrlInput] = useState(false);
  const receptionVenueDragTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [receptionVenueDeleteIdx, setReceptionVenueDeleteIdx] = useState<number | null>(null);
  const [receptionVenueDragIdx, setReceptionVenueDragIdx] = useState<number | null>(null);
  const receptionVenueDragStart = useRef({ x: 0, y: 0 });
  const receptionVenueDragTriggered = useRef(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>(() => {
    // Split existing photos: WordPress-uploaded URLs go to pendingUploadedPhotos,
    // rest stay in pendingPhotos (URL-based)
    const all = data.photosAndImages || [];
    return all; // Will be split in the effect below
  });
  const [pendingUploadedPhotos, setPendingUploadedPhotos] = useState<string[]>([]);
  const [photosUrlInput, setPhotosUrlInput] = useState("");
  const [showPhotosUrlInput, setShowPhotosUrlInput] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photosDragTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [photosDeleteIdx, setPhotosDeleteIdx] = useState<number | null>(null);
  const [photosDragIdx, setPhotosDragIdx] = useState<number | null>(null);
  const photosDragStart = useRef({ x: 0, y: 0 });
  const photosDragTriggered = useRef(false);
  const isDraggingImage = useRef(false);
  const [dragToast, setDragToast] = useState<string | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const deleteToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageDelete = (url: string) => {
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setDeleteToast("Image deleted and link copied");
    if (deleteToastTimer.current) clearTimeout(deleteToastTimer.current);
    deleteToastTimer.current = setTimeout(() => setDeleteToast(null), 2500);
  };

  const openImagePicker = (target: "logo" | "gallery" | "venue" | "receptionVenue") => {
    setImagePickerTarget(target);
    setShowImagePicker(true);
  };

  const handleImagePickerSelect = (url: string) => {
    if (imagePickerTarget === "logo") {
      setPendingLogo(url);
    } else if (imagePickerTarget === "gallery") {
      setPendingGallery([...pendingGallery, url]);
    } else if (imagePickerTarget === "venue") {
      setPendingVenue([...pendingVenue, url]);
    } else if (imagePickerTarget === "receptionVenue") {
      setPendingReceptionVenue([...pendingReceptionVenue, url]);
    }
    setShowImagePicker(false);
    setImagePickerTarget(null);
  };
  const [pendingHeadingFont, setPendingHeadingFont] = useState(data.customHeadingFont || "");
  const [pendingBodyFont, setPendingBodyFont] = useState(data.customBodyFont || "");
  const [pendingBackgroundMusic, setPendingBackgroundMusic] = useState<string[]>(data.backgroundMusic || []);
  const [pendingBackgroundMusicFileNames, setPendingBackgroundMusicFileNames] = useState<string[]>(data.backgroundMusicFileNames || []);
  // URL-based music (separate from uploaded files)
  const [pendingMusicUrls, setPendingMusicUrls] = useState<string[]>([]);
  const [musicUrlInput, setMusicUrlInput] = useState("");
  const [showMusicUrlInput, setShowMusicUrlInput] = useState(false);
  // URL-based fonts (separate from uploaded files)
  const [pendingHeadingFontUrl, setPendingHeadingFontUrl] = useState("");
  const [pendingBodyFontUrl, setPendingBodyFontUrl] = useState("");
  const [showHeadingFontUrlInput, setShowHeadingFontUrlInput] = useState(false);
  const [showBodyFontUrlInput, setShowBodyFontUrlInput] = useState(false);
  const [headingFontUrlInput, setHeadingFontUrlInput] = useState("");
  const [bodyFontUrlInput, setBodyFontUrlInput] = useState("");

  // Track pending file uploads (blob URLs that need to be uploaded to WordPress on Save)
  // This is a module-level Map shared across components so EditorPanel can access it at save time
  // Maps blob URL -> { file, field, invitationId }
  const pendingFileUploadsRef = useRef<Map<string, { file: File; field: string; invitationId: string }>>(new Map());

  // Register/unregister blob URLs with the global pending uploads tracker
  const addPendingUpload = (blobUrl: string, file: File, field: string) => {
    pendingFileUploadsRef.current.set(blobUrl, { file, field, invitationId: invitationId! });
    // Also register globally so EditorPanel can find them at save time
    if (typeof window !== 'undefined') {
      (window as any).__pendingUploads = (window as any).__pendingUploads || new Map();
      (window as any).__pendingUploads.set(blobUrl, { file, field, invitationId });
    }
  };

  const removePendingUpload = (blobUrl: string) => {
    pendingFileUploadsRef.current.delete(blobUrl);
    if (typeof window !== 'undefined' && (window as any).__pendingUploads) {
      (window as any).__pendingUploads.delete(blobUrl);
    }
  };

  // Track a file for deferred deletion (will be deleted from WordPress on Save)
  const addPendingDeletion = (url: string) => {
    if (typeof window !== 'undefined') {
      (window as any).__pendingDeletions = (window as any).__pendingDeletions || [];
      if (!(window as any).__pendingDeletions.includes(url)) {
        (window as any).__pendingDeletions.push(url);
      }
    }
  };

  // Split existing photos into uploaded vs URL-based on mount
  // WordPress-uploaded URLs match pattern: contains invitationId and "photosAndImages"
  useEffect(() => {
    if (!invitationId) return;
    const all = data.photosAndImages || [];
    const uploaded: string[] = [];
    const urlBased: string[] = [];
    for (const url of all) {
      if (url && url.includes(invitationId) && url.includes('photosAndImages')) {
        uploaded.push(url);
      } else {
        urlBased.push(url);
      }
    }
    setPendingUploadedPhotos(uploaded);
    setPendingPhotos(urlBased);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Split existing music into uploaded vs URL-based on mount
  // Uploaded music has file names in backgroundMusicFileNames; URL music doesn't
  useEffect(() => {
    const allMusic = data.backgroundMusic || [];
    const allNames = data.backgroundMusicFileNames || [];
    const uploaded: string[] = [];
    const uploadedNames: string[] = [];
    const urlBased: string[] = [];
    for (let i = 0; i < allMusic.length; i++) {
      const url = allMusic[i];
      const name = allNames[i];
      // If there's a corresponding file name, it was uploaded; otherwise it's a URL
      if (name) {
        uploaded.push(url);
        uploadedNames.push(name);
      } else {
        urlBased.push(url);
      }
    }
    setPendingBackgroundMusic(uploaded);
    setPendingBackgroundMusicFileNames(uploadedNames);
    setPendingMusicUrls(urlBased);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Split existing fonts into uploaded vs URL-based on mount
  useEffect(() => {
    const headingFont = data.customHeadingFont || "";
    const bodyFont = data.customBodyFont || "";
    // Uploaded fonts have blob: or WordPress URLs with invitationId; URL fonts are external
    if (headingFont && !headingFont.startsWith('blob:') && !headingFont.includes(invitationId || '__none__')) {
      setPendingHeadingFontUrl(headingFont);
      setPendingHeadingFont("");
    }
    if (bodyFont && !bodyFont.startsWith('blob:') && !bodyFont.includes(invitationId || '__none__')) {
      setPendingBodyFontUrl(bodyFont);
      setPendingBodyFont("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track if there are unsaved changes
  const [hasBackgroundChanges, setHasBackgroundChanges] = useState(false);
  const [hasLogoChanges, setHasLogoChanges] = useState(false);
  const [hasGalleryChanges, setHasGalleryChanges] = useState(false);
  const [hasVenueChanges, setHasVenueChanges] = useState(false);
  const [hasReceptionVenueChanges, setHasReceptionVenueChanges] = useState(false);
  const [hasPhotosChanges, setHasPhotosChanges] = useState(false);
  const [hasFontsChanges, setHasFontsChanges] = useState(false);
  const [hasMusicChanges, setHasMusicChanges] = useState(false);

  // Combined check for any changes
  const hasAnyChanges = hasBackgroundChanges || hasLogoChanges || hasGalleryChanges || hasVenueChanges || hasReceptionVenueChanges || hasPhotosChanges || hasFontsChanges || hasMusicChanges;

  // Update change tracking when data changes
  useEffect(() => {
    const currentDesktop = data.heroBackgroundImages || [];
    const currentMobile = data.heroBackgroundImagesMobile || [];
    setHasBackgroundChanges(
      pendingBgDesktop.length !== currentDesktop.length ||
      pendingBgDesktop.some((url, i) => url !== currentDesktop[i]) ||
      pendingBgMobile.length !== currentMobile.length ||
      pendingBgMobile.some((url, i) => url !== currentMobile[i])
    );
  }, [pendingBgDesktop, pendingBgMobile, data.heroBackgroundImages, data.heroBackgroundImagesMobile]);

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
    const currentReceptionVenue = data.receptionVenueImages || [];
    setHasReceptionVenueChanges(
      pendingReceptionVenue.length !== currentReceptionVenue.length ||
      pendingReceptionVenue.some((url, i) => url !== currentReceptionVenue[i])
    );
  }, [pendingReceptionVenue, data.receptionVenueImages]);

  useEffect(() => {
    const currentPhotos = data.photosAndImages || [];
    const combined = [...pendingUploadedPhotos, ...pendingPhotos];
    setHasPhotosChanges(
      combined.length !== currentPhotos.length ||
      combined.some((url, i) => url !== currentPhotos[i])
    );
  }, [pendingUploadedPhotos, pendingPhotos, data.photosAndImages]);

  useEffect(() => {
    setHasFontsChanges(
      pendingHeadingFont !== (data.customHeadingFont || "") ||
      pendingBodyFont !== (data.customBodyFont || "") ||
      pendingHeadingFontUrl !== "" ||
      pendingBodyFontUrl !== ""
    );
  }, [pendingHeadingFont, pendingBodyFont, pendingHeadingFontUrl, pendingBodyFontUrl, data.customHeadingFont, data.customBodyFont]);

  useEffect(() => {
    const currentMusic = data.backgroundMusic || [];
    const currentFileNames = data.backgroundMusicFileNames || [];
    const combinedMusic = [...pendingBackgroundMusic, ...pendingMusicUrls];
    const combinedNames = [...pendingBackgroundMusicFileNames, ...pendingMusicUrls.map(() => "")];
    setHasMusicChanges(
      combinedMusic.length !== currentMusic.length ||
      combinedMusic.some((url, i) => url !== currentMusic[i]) ||
      combinedNames.length !== currentFileNames.length ||
      combinedNames.some((name, i) => name !== currentFileNames[i])
    );
  }, [pendingBackgroundMusic, pendingBackgroundMusicFileNames, pendingMusicUrls, data.backgroundMusic, data.backgroundMusicFileNames]);

  // Live data for real-time progress calculation (merges pending local state)
  const liveData = useMemo<InvitationData>(() => ({
    ...data,
    heroBackgroundImages: pendingBgDesktop,
    heroBackgroundImagesMobile: pendingBgMobile,
    heroIcon: pendingLogo,
    galleryImages: pendingGallery,
    venueImages: pendingVenue,
    receptionVenueImages: pendingReceptionVenue,
    photosAndImages: [...pendingUploadedPhotos, ...pendingPhotos],
    customHeadingFont: pendingHeadingFont || pendingHeadingFontUrl,
    customBodyFont: pendingBodyFont || pendingBodyFontUrl,
    backgroundMusic: [...pendingBackgroundMusic, ...pendingMusicUrls],
    backgroundMusicFileNames: [...pendingBackgroundMusicFileNames, ...pendingMusicUrls.map(() => "")],
  }), [data, pendingBgDesktop, pendingBgMobile, pendingLogo, pendingGallery, pendingVenue, pendingReceptionVenue, pendingUploadedPhotos, pendingPhotos, pendingHeadingFont, pendingHeadingFontUrl, pendingBodyFont, pendingBodyFontUrl, pendingBackgroundMusic, pendingBackgroundMusicFileNames, pendingMusicUrls]);

  // Image validation for logo, gallery, venue, photos
  const logoValidation = useImageValidation(pendingLogo ? [pendingLogo] : []);
  const galleryValidation = useImageValidation(pendingGallery);
  const venueValidation = useImageValidation(pendingVenue);
  const receptionVenueValidation = useImageValidation(pendingReceptionVenue);
  const photosValidation = useImageValidation([...pendingUploadedPhotos, ...pendingPhotos]);

  // Adjusted live data excluding broken images from progress
  const liveDataAdjusted = useMemo<InvitationData>(() => ({
    ...liveData,
    heroIcon: logoValidation.broken.has(pendingLogo) ? "" : pendingLogo,
    galleryImages: pendingGallery.filter((url) => !galleryValidation.broken.has(url)),
    venueImages: pendingVenue.filter((url) => !venueValidation.broken.has(url)),
    receptionVenueImages: pendingReceptionVenue.filter((url) => !receptionVenueValidation.broken.has(url)),
  }), [liveData, pendingLogo, pendingGallery, pendingVenue, pendingReceptionVenue, logoValidation.broken, galleryValidation.broken, venueValidation.broken, receptionVenueValidation.broken]);

  // Prevent page scroll during image drag-and-drop reordering
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingImage.current) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', handleTouchMove);
  }, []);

  // Apply pending changes to parent state (blob URLs are passed through as-is;
  // actual upload to WordPress happens at Save time in EditorPanel)
  const applyPendingChanges = () => {
    if (hasBackgroundChanges) {
      onChange("heroBackgroundImages", pendingBgDesktop as unknown as string);
      onChange("heroBackgroundImagesMobile", pendingBgMobile as unknown as string);
    }
    if (hasLogoChanges) {
      onChange("heroIcon", pendingLogo);
    }
    if (hasGalleryChanges) {
      onChange("galleryImages", pendingGallery as unknown as string);
    }
    if (hasVenueChanges) {
      onChange("venueImages", pendingVenue as unknown as string);
    }
    if (hasReceptionVenueChanges) {
      onChange("receptionVenueImages", pendingReceptionVenue as unknown as string);
    }
    if (hasPhotosChanges) {
      onChange("photosAndImages", [...pendingUploadedPhotos, ...pendingPhotos] as unknown as string);
    }
    if (hasFontsChanges) {
      onChange("customHeadingFont", pendingHeadingFont || pendingHeadingFontUrl);
      onChange("customBodyFont", pendingBodyFont || pendingBodyFontUrl);
    }
    if (hasMusicChanges) {
      onChange("backgroundMusic", [...pendingBackgroundMusic, ...pendingMusicUrls] as unknown as string);
      onChange("backgroundMusicFileNames", [...pendingBackgroundMusicFileNames, ...pendingMusicUrls.map(() => "")] as unknown as string);
    }
  };

  // Handle close - auto-apply pending changes, no save prompt
  const handleClose = () => {
    applyPendingChanges();
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
    // If collapsing the photos section, hide the URL input
    if (sectionId === "photos" && !collapsedSections.has("photos")) {
      setShowPhotosUrlInput(false);
      setPhotosUrlInput("");
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
    if (isDemoMode) {
      alert("Music upload is available after you sign up and purchase your invitation.");
      return;
    }

    if (!invitationId) {
      alert("Invitation ID is required for file upload");
      return;
    }

    if (!isOnline()) {
      setDeleteToast("You need to be online to upload files");
      if (deleteToastTimer.current) clearTimeout(deleteToastTimer.current);
      deleteToastTimer.current = setTimeout(() => setDeleteToast(null), 3000);
      return;
    }

    // Validate file size (4MB limit — stays under Vercel's 4.5MB body limit)
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB — matches Vercel's body limit
    if (file.size > maxSize) {
      alert("File size exceeds 4.5MB limit. Please use a smaller file or compress your audio.");
      return;
    }

    setUploadingIndex(index);

    try {
      // Create a blob URL for local preview — file will be uploaded to WordPress on Save
      const blobUrl = URL.createObjectURL(file);

      // Track this file for upload on Save (globally so EditorPanel can access it)
      addPendingUpload(blobUrl, file, `backgroundMusic-${index}`);

      // Update pending state with blob URL
      const newMusic = [...pendingBackgroundMusic];
      const newFileNames = [...pendingBackgroundMusicFileNames];
      newMusic[index] = blobUrl;
      newFileNames[index] = file.name;
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
    if (isDemoMode) {
      alert("Custom font upload is available after you sign up and purchase your invitation.");
      return;
    }

    if (!invitationId) {
      alert("Invitation ID is required for file upload");
      return;
    }

    if (!isOnline()) {
      setDeleteToast("You need to be online to upload files");
      if (deleteToastTimer.current) clearTimeout(deleteToastTimer.current);
      deleteToastTimer.current = setTimeout(() => setDeleteToast(null), 3000);
      return;
    }

    // Validate file size (4MB limit — stays under Vercel's 4.5MB body limit)
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB — matches Vercel's body limit
    if (file.size > maxSize) {
      alert("File size exceeds 4.5MB limit. Please use a smaller file.");
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
      // Create a blob URL for local preview — file will be uploaded to WordPress on Save
      const blobUrl = URL.createObjectURL(file);
      const field = type === 'heading' ? 'customHeadingFont' : 'customBodyFont';

      // Track this file for upload on Save (globally so EditorPanel can access it)
      addPendingUpload(blobUrl, file, field);

      if (type === 'heading') {
        setPendingHeadingFont(blobUrl);
      } else {
        setPendingBodyFont(blobUrl);
      }
    } catch (error) {
      console.error("Font upload error:", error);
      alert(error instanceof Error ? `Failed to upload font file: ${error.message}` : "Failed to upload font file. Please try again.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleDeleteFont = (type: 'heading' | 'body') => {
    if (isDemoMode) {
      if (type === 'heading') {
        setPendingHeadingFont("");
      } else {
        setPendingBodyFont("");
      }
      return;
    }

    const url = type === 'heading' ? pendingHeadingFont : pendingBodyFont;
    if (url) {
      // If it's a blob URL (not yet uploaded), just revoke and remove from pending uploads
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
        removePendingUpload(url);
      } else {
        // Real URL on WordPress — defer deletion until Save
        addPendingDeletion(url);
      }
    }

    if (type === 'heading') {
      setPendingHeadingFont("");
    } else {
      setPendingBodyFont("");
    }
  };

  const handleDeleteMusic = async () => {
    const idx = musicDeleteIdx;
    if (idx === null) {
      setShowDeleteDialog(false);
      return;
    }

    const url = pendingBackgroundMusic[idx];

    // Remove from pending state
    const newMusic = pendingBackgroundMusic.filter((_, i) => i !== idx);
    const newFileNames = pendingBackgroundMusicFileNames.filter((_, i) => i !== idx);
    setPendingBackgroundMusic(newMusic);
    setPendingBackgroundMusicFileNames(newFileNames);
    setMusicDeleteIdx(null);
    setShowDeleteDialog(false);

    // Handle deletion: blob URLs are local-only, real URLs are deferred until Save
    console.log('[MediaEditor] handleDeleteMusic: url =', url, 'isBlob =', url?.startsWith('blob:'));
    if (!isDemoMode && url) {
      if (url.startsWith('blob:')) {
        // Blob URL — just revoke and remove from pending uploads
        URL.revokeObjectURL(url);
        removePendingUpload(url);
      } else {
        // Real URL on WordPress — defer deletion until Save
        addPendingDeletion(url);
      }
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (isDemoMode) {
      alert("Image upload is available after you sign up and purchase your invitation.");
      return;
    }

    if (!invitationId) {
      alert("Invitation ID is required for file upload");
      return;
    }

    if (!isOnline()) {
      setDeleteToast("You need to be online to upload files");
      if (deleteToastTimer.current) clearTimeout(deleteToastTimer.current);
      deleteToastTimer.current = setTimeout(() => setDeleteToast(null), 3000);
      return;
    }

    // Validate file size (4MB limit for images — stays under Vercel's 4.5MB body limit)
    const maxSize = 4.5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size exceeds 4.5MB limit. Please use a smaller image or compress it.");
      return;
    }

    // Validate image file type
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      alert("Please upload a valid image file (.jpg, .jpeg, .png, .gif, .webp, .svg).");
      return;
    }

    // Check max upload limit (6)
    if (pendingUploadedPhotos.length >= 6) {
      alert("Maximum of 6 uploaded images reached.");
      return;
    }

    setUploadingPhoto(true);

    try {
      // Create a blob URL for local preview — file will be uploaded to WordPress on Save
      const blobUrl = URL.createObjectURL(file);
      const field = `photosAndImages-upload-${pendingUploadedPhotos.length}`;

      // Track this file for upload on Save
      addPendingUpload(blobUrl, file, field);

      // Add to uploaded photos
      setPendingUploadedPhotos([...pendingUploadedPhotos, blobUrl]);
    } catch (error) {
      console.error("Photo upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className={`w-full h-dvh rounded-2xl flex flex-col overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Drag indicator toast */}
      {dragToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          style={{ animation: "media-drag-toast-in 0.2s ease-out" }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-sm shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "media-drag-grip 1s ease-in-out infinite" }}>
              <line x1="8" y1="6" x2="8" y2="6.01" /><line x1="16" y1="6" x2="16" y2="6.01" /><line x1="8" y1="12" x2="8" y2="12.01" /><line x1="16" y1="12" x2="16" y2="12.01" /><line x1="8" y1="18" x2="8" y2="18.01" /><line x1="16" y1="18" x2="16" y2="18.01" />
            </svg>
            <span className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{dragToast}</span>
          </div>
        </div>
      )}
      {/* Delete confirmation toast */}
      {deleteToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          style={{ animation: "media-drag-toast-in 0.2s ease-out" }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-sm shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{deleteToast}</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes media-drag-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes media-drag-grip {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
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
        <div className="flex-1">
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
          <Fragment key={item.id}>
          {item.id === "photos" && (
            <div className="flex items-center gap-3 pt-4 pb-1">
              <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
              <span className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Source Files
              </span>
              <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            </div>
          )}
          <div
            key={item.id}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`border rounded-xl overflow-hidden transition-all duration-300`}
            style={{
              backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
              borderColor: hoveredItem === item.id ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
              ...(!collapsedSections.has(item.id) ? {
                boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
              } : {})
            }}
          >
            <div 
              className={`flex items-center gap-3 p-4 cursor-pointer rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
              onClick={() => handleToggle(item.id)}
            >
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
              </div>
              <div className="shrink-0 ml-2">
                {(() => {
                  const progress = getMediaItemProgress(liveDataAdjusted, item.id);
                  if (progress !== null) {
                    const progressData = getMediaItemProgressData(liveDataAdjusted, item.id);
                    return (
                      <ProgressCircle
                        percentage={progress}
                        accentColor={accentColor}
                        isDarkMode={isDarkMode}
                        size="compact"
                        showNumbers={showNumbers}
                        filled={progressData?.filled}
                        total={progressData?.total}
                      />
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Background settings */}
            {!collapsedSections.has("background") && item.id === "background" && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-3">
                  <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>BACKGROUND</label>

                  <div className="flex items-center justify-between">
                    <label className="block text-xs tracking-wide uppercase text-gray-500">{isMobileBackgroundMode ? "PHONE SCREEN" : "DESKTOP"}</label>
                    <button
                      type="button"
                      onClick={() => setIsMobileBackgroundMode(!isMobileBackgroundMode)}
                      className={`px-3 py-2 text-sm border rounded-md transition-colors ${isDarkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"}`}
                      title={isMobileBackgroundMode ? "Switch to Desktop" : "Switch to Phone"}
                    >
                      {isMobileBackgroundMode ? (
                        <div className="w-5 h-5" style={{
                          backgroundColor: accentColor,
                          WebkitMaskImage: "url(/assets/desktop.png)",
                          WebkitMaskSize: "contain",
                          WebkitMaskPosition: "center",
                          WebkitMaskRepeat: "no-repeat",
                          maskImage: "url(/assets/desktop.png)",
                          maskSize: "contain",
                          maskPosition: "center",
                          maskRepeat: "no-repeat"
                        }} />
                      ) : (
                        <div className="w-5 h-5" style={{
                          backgroundColor: accentColor,
                          WebkitMaskImage: "url(/assets/smartphone.png)",
                          WebkitMaskSize: "contain",
                          WebkitMaskPosition: "center",
                          WebkitMaskRepeat: "no-repeat",
                          maskImage: "url(/assets/smartphone.png)",
                          maskSize: "contain",
                          maskPosition: "center",
                          maskRepeat: "no-repeat"
                        }} />
                      )}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(isMobileBackgroundMode ? pendingBgMobile : pendingBgDesktop).map((bgImage, index) => (
                      <div key={index} className="relative">
                        {bgImage && (
                          <div className={`relative w-full h-32 rounded-lg overflow-hidden border mb-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <img src={bgImage} alt={`Background ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                handleImageDelete(bgImage);
                                const current = isMobileBackgroundMode ? [...pendingBgMobile] : [...pendingBgDesktop];
                                current.splice(index, 1);
                                if (isMobileBackgroundMode) {
                                  setPendingBgMobile(current);
                                } else {
                                  setPendingBgDesktop(current);
                                }
                              }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                              style={{ border: "1px solid #6998EE" }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {(isMobileBackgroundMode ? pendingBgMobile : pendingBgDesktop).filter(Boolean).length < 3 && (
                      <button
                        type="button"
                        onClick={() => setShowBgImagePicker(true)}
                        className={`w-full px-3 py-2 border-2 border-dashed rounded-lg text-sm hover:border-gray-400 hover:text-gray-600 transition-colors ${isDarkMode ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-500"}`}
                      >
                        + Add background image
                      </button>
                    )}
                    <p className="text-xs text-gray-400 text-center mt-2">
                      {isMobileBackgroundMode ? "Use portrait images" : "Use landscape images"}
                    </p>
                  </div>
                </div>

                {/* Background Image Picker Sheet */}
                {showBgImagePicker && (
                  <>
                    <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowBgImagePicker(false)} />
                    <div
                      className={`fixed bottom-0 left-0 right-0 z-50 ${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-t-3xl shadow-2xl flex flex-col animate-slide-up`}
                      style={{ maxWidth: 480, margin: "0 auto", maxHeight: "60vh" }}
                    >
                      <div className="flex justify-center pt-3 pb-1 shrink-0">
                        <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
                      </div>
                      <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                        <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          Select Background Image
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowBgImagePicker(false)}
                          className={`p-1.5 rounded-md transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10">
                        <div className="grid grid-cols-3 gap-3">
                          {([...pendingUploadedPhotos, ...pendingPhotos]).filter(Boolean).map((url, i) => (
                            <button
                              key={`photos-${i}`}
                              onClick={() => {
                                const current = isMobileBackgroundMode ? [...pendingBgMobile] : [...pendingBgDesktop];
                                current.push(url);
                                if (isMobileBackgroundMode) {
                                  setPendingBgMobile(current);
                                } else {
                                  setPendingBgDesktop(current);
                                }
                                setShowBgImagePicker(false);
                              }}
                              className="aspect-square rounded-2xl border-2 border-transparent overflow-hidden transition-all active:scale-95 hover:border-gray-300"
                            >
                              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                          {([...pendingUploadedPhotos, ...pendingPhotos]).filter(Boolean).length === 0 && (
                            <div className="col-span-3 text-center py-8 text-gray-400 text-sm">
                              No images available.
                              <br />
                              Add photos in Photos & Images below.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Logo settings */}
            {!collapsedSections.has("logo") && item.id === "logo" && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-3">
                  <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>DISPLAY LOGO</label>
                  
                  <div className="space-y-3">
                    {/* Preview with Change/Remove buttons */}
                    {pendingLogo && !showLogoUrlInput && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
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
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openImagePicker("logo")}
                            className="text-xs px-3 py-1 rounded-lg transition-colors"
                            style={{ fontFamily: "Inter, sans-serif", color: accentColor, border: `1px solid ${accentColor}` }}
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleImageDelete(pendingLogo);
                              setPendingLogo("");
                              setShowLogoUrlInput(false);
                              setLogoUrlInput("");
                            }}
                            className="text-xs px-3 py-1 rounded-lg transition-colors text-red-500"
                            style={{ fontFamily: "Inter, sans-serif", border: "1px solid #ef4444" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Add Logo Button (dashed outline) - shown when no logo and no URL input */}
                    {!pendingLogo && !showLogoUrlInput && (
                      <button
                        type="button"
                        onClick={() => openImagePicker("logo")}
                        className="w-full py-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors"
                        style={{
                          borderColor: isDarkMode ? "#374151" : "#d1d5db",
                          color: isDarkMode ? "#6b7280" : "#9ca3af",
                        }}
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Add Logo</span>
                      </button>
                    )}
                    
                    {/* URL Input with ADD button */}
                    {showLogoUrlInput && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={logoUrlInput}
                            onChange={(e) => setLogoUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && logoUrlInput.trim()) {
                                setPendingLogo(convertGoogleDriveUrl(logoUrlInput.trim()));
                                setLogoUrlInput("");
                                setShowLogoUrlInput(false);
                              }
                            }}
                            placeholder="Paste logo URL or Google Drive link..."
                            autoFocus
                            className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                            style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (logoUrlInput.trim()) {
                                setPendingLogo(convertGoogleDriveUrl(logoUrlInput.trim()));
                                setLogoUrlInput("");
                                setShowLogoUrlInput(false);
                              }
                            }}
                            className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                            style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
                          >
                            Add
                          </button>
                        </div>
                        {pendingLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowLogoUrlInput(false);
                              setLogoUrlInput("");
                            }}
                            className="text-xs w-full text-center"
                            style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#6b7280" : "#9ca3af" }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
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
                          data-gallery-idx={idx}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer select-none group"
                          style={{
                            outline: galleryDeleteIdx === idx ? `2px solid #ef4444` : galleryDragIdx === idx ? `2px solid ${accentColor}` : "none",
                            outlineOffset: galleryDeleteIdx === idx || galleryDragIdx === idx ? "2px" : "0",
                            boxShadow: galleryDragIdx === idx ? `0 0 12px 4px ${hexToRgba(accentColor, 0.6)}, 0 0 4px 2px ${hexToRgba(accentColor, 0.4)}` : "none",
                            opacity: galleryDragIdx === idx ? 0.6 : 1,
                            touchAction: 'pan-y',
                            WebkitTouchCallout: 'none',
                          }}
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                          onClick={() => {
                            if (galleryDragTriggered.current) {
                              galleryDragTriggered.current = false;
                              return;
                            }
                            if (galleryDeleteIdx === idx) {
                              setGalleryDeleteIdx(null);
                            } else {
                              setGalleryDeleteIdx(idx);
                            }
                          }}
                          onPointerDown={(e) => {
                            galleryDragStart.current = { x: e.clientX, y: e.clientY };
                            galleryDragTriggered.current = false;
                            if (galleryDragTimer.current) clearTimeout(galleryDragTimer.current);
                            galleryDragTimer.current = setTimeout(() => {
                              galleryDragTriggered.current = true;
                              isDraggingImage.current = true;
                              setGalleryDragIdx(idx);
                              setGalleryDeleteIdx(null);
                              setDragToast("Drag to reorder photos");
                            }, 350);
                          }}
                          onPointerMove={(e) => {
                            if (galleryDragTimer.current && !galleryDragTriggered.current) {
                              const dx = e.clientX - galleryDragStart.current.x;
                              const dy = e.clientY - galleryDragStart.current.y;
                              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                                clearTimeout(galleryDragTimer.current);
                                galleryDragTimer.current = null;
                              }
                            }
                            if (galleryDragTriggered.current && galleryDragIdx !== null) {
                              const els = document.elementsFromPoint(e.clientX, e.clientY);
                              const cell = els.find((el: Element) => el.hasAttribute('data-gallery-idx'));
                              if (cell) {
                                const overIdx = parseInt(cell.getAttribute('data-gallery-idx')!, 10);
                                if (overIdx !== galleryDragIdx) {
                                  const newGallery = [...pendingGallery];
                                  const [moved] = newGallery.splice(galleryDragIdx, 1);
                                  newGallery.splice(overIdx, 0, moved);
                                  setPendingGallery(newGallery);
                                  setGalleryDragIdx(overIdx);
                                }
                              }
                            }
                          }}
                          onPointerUp={() => {
                            if (galleryDragTimer.current) {
                              clearTimeout(galleryDragTimer.current);
                              galleryDragTimer.current = null;
                            }
                            if (galleryDragTriggered.current) {
                              setGalleryDragIdx(null);
                              isDraggingImage.current = false;
                              setDragToast(null);
                            }
                            setTimeout(() => { galleryDragTriggered.current = false; }, 100);
                          }}
                          onPointerCancel={() => {
                            if (galleryDragTimer.current) {
                              clearTimeout(galleryDragTimer.current);
                              galleryDragTimer.current = null;
                            }
                            setGalleryDragIdx(null);
                            isDraggingImage.current = false;
                            setDragToast(null);
                            setTimeout(() => { galleryDragTriggered.current = false; }, 100);
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
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageDelete(pendingGallery[idx]);
                                  const newImages = pendingGallery.filter((_, i) => i !== idx);
                                  setPendingGallery(newImages);
                                  setGalleryDeleteIdx(null);
                                }}
                                className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGalleryDeleteIdx(null);
                                }}
                                className="px-4 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Image Button inline in grid - hidden after 25 images */}
                      {pendingGallery.length < 25 && !showGalleryUrlInput && (
                        <button
                          type="button"
                          onClick={() => openImagePicker("gallery")}
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
                      onClick={() => openImagePicker("gallery")}
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

                  {/* Hint */}
                  {pendingGallery.length > 0 && pendingGallery.length < 25 && (
                    <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Tap to delete · Hold to drag and reorder
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Photos & Images Picker settings */}
            {!collapsedSections.has("photos") && item.id === "photos" && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>PHOTOS & IMAGES PICKER</label>

                  {/* === UPLOAD SECTION (top) — max 6 === */}
                  <div className="space-y-2">
                    <label className={`block text-[10px] tracking-wide uppercase text-left ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>Upload Image {pendingUploadedPhotos.length > 0 && `(${pendingUploadedPhotos.length}/6)`}</label>

                    {pendingUploadedPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {pendingUploadedPhotos.map((imgUrl, idx) => (
                          <div
                            key={`upload-${idx}`}
                            data-photos-upload-idx={idx}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer select-none group"
                            style={{
                              outline: photosDeleteIdx === idx + 1000 ? `2px solid #ef4444` : "none",
                              outlineOffset: photosDeleteIdx === idx + 1000 ? "2px" : "0",
                            }}
                            onClick={() => {
                              if (photosDeleteIdx === idx + 1000) {
                                setPhotosDeleteIdx(null);
                              } else {
                                setPhotosDeleteIdx(idx + 1000);
                              }
                            }}
                          >
                            <img src={imgUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                            {photosDeleteIdx === idx + 1000 && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = pendingUploadedPhotos[idx];
                                    if (url.startsWith('blob:')) {
                                      URL.revokeObjectURL(url);
                                      removePendingUpload(url);
                                    } else {
                                      addPendingDeletion(url);
                                    }
                                    setPendingUploadedPhotos(pendingUploadedPhotos.filter((_, i) => i !== idx));
                                    setPhotosDeleteIdx(null);
                                  }}
                                  className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPhotosDeleteIdx(null);
                                  }}
                                  className="px-4 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Upload button (dashed, upload icon) — shown when < 6 */}
                        {pendingUploadedPhotos.length < 6 && !isDemoMode && (
                          <label
                            className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                            style={{
                              borderColor: isDarkMode ? "#374151" : "#d1d5db",
                              color: isDarkMode ? "#6b7280" : "#9ca3af",
                              opacity: uploadingPhoto ? 0.5 : 1,
                            }}
                          >
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                              className="hidden"
                              disabled={uploadingPhoto}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(file);
                                e.target.value = "";
                              }}
                            />
                            {uploadingPhoto ? (
                              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            )}
                          </label>
                        )}
                      </div>
                    )}

                    {/* Upload button (full width, dashed) — shown when no uploads yet */}
                    {pendingUploadedPhotos.length === 0 && !isDemoMode && (
                      <label
                        className="w-full py-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                        style={{
                          borderColor: isDarkMode ? "#374151" : "#d1d5db",
                          color: isDarkMode ? "#6b7280" : "#9ca3af",
                          opacity: uploadingPhoto ? 0.5 : 1,
                        }}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                          className="hidden"
                          disabled={uploadingPhoto}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file);
                            e.target.value = "";
                          }}
                        />
                        {uploadingPhoto ? (
                          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        )}
                        <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Upload Image</span>
                        <span className={`text-[10px] ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>Max 6 · 4.5MB limit</span>
                      </label>
                    )}

                    {pendingUploadedPhotos.length >= 6 && (
                      <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        Maximum of 6 uploaded images reached
                      </p>
                    )}
                  </div>

                  {/* === DIVIDER === */}
                  <div className="flex items-center gap-3 py-1">
                    <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`} />
                  </div>

                  {/* === URL SECTION (bottom) — existing behavior === */}
                  <div className="space-y-2">
                    <label className={`block text-[10px] tracking-wide uppercase text-left ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>Add Image URL</label>

                    {/* URL Image Grid */}
                    {pendingPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {pendingPhotos.map((imgUrl, idx) => (
                          <div
                            key={`url-${idx}`}
                            data-photos-idx={idx}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer select-none group"
                            style={{
                              outline: photosDeleteIdx === idx ? `2px solid #ef4444` : photosDragIdx === idx ? `2px solid ${accentColor}` : "none",
                              outlineOffset: photosDeleteIdx === idx || photosDragIdx === idx ? "2px" : "0",
                              boxShadow: photosDragIdx === idx ? `0 0 12px 4px ${hexToRgba(accentColor, 0.6)}, 0 0 4px 2px ${hexToRgba(accentColor, 0.4)}` : "none",
                              opacity: photosDragIdx === idx ? 0.6 : 1,
                              touchAction: 'pan-y',
                              WebkitTouchCallout: 'none',
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                            onClick={() => {
                              if (photosDragTriggered.current) {
                                photosDragTriggered.current = false;
                                return;
                              }
                              if (photosDeleteIdx === idx) {
                                setPhotosDeleteIdx(null);
                              } else {
                                setPhotosDeleteIdx(idx);
                              }
                            }}
                            onPointerDown={(e) => {
                              photosDragStart.current = { x: e.clientX, y: e.clientY };
                              photosDragTriggered.current = false;
                              if (photosDragTimer.current) clearTimeout(photosDragTimer.current);
                              photosDragTimer.current = setTimeout(() => {
                                photosDragTriggered.current = true;
                                isDraggingImage.current = true;
                                setPhotosDragIdx(idx);
                                setPhotosDeleteIdx(null);
                                setDragToast("Drag to reorder photos");
                              }, 350);
                            }}
                            onPointerMove={(e) => {
                              if (photosDragTimer.current && !photosDragTriggered.current) {
                                const dx = e.clientX - photosDragStart.current.x;
                                const dy = e.clientY - photosDragStart.current.y;
                                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                                  clearTimeout(photosDragTimer.current);
                                  photosDragTimer.current = null;
                                }
                              }
                              if (photosDragTriggered.current && photosDragIdx !== null) {
                                const els = document.elementsFromPoint(e.clientX, e.clientY);
                                const cell = els.find((el: Element) => el.hasAttribute('data-photos-idx'));
                                if (cell) {
                                  const overIdx = parseInt(cell.getAttribute('data-photos-idx')!, 10);
                                  if (overIdx !== photosDragIdx) {
                                    const newPhotos = [...pendingPhotos];
                                    const [moved] = newPhotos.splice(photosDragIdx, 1);
                                    newPhotos.splice(overIdx, 0, moved);
                                    setPendingPhotos(newPhotos);
                                    setPhotosDragIdx(overIdx);
                                  }
                                }
                              }
                            }}
                            onPointerUp={() => {
                              if (photosDragTimer.current) {
                                clearTimeout(photosDragTimer.current);
                                photosDragTimer.current = null;
                              }
                              if (photosDragTriggered.current) {
                                setPhotosDragIdx(null);
                                isDraggingImage.current = false;
                                setDragToast(null);
                              }
                              setTimeout(() => { photosDragTriggered.current = false; }, 100);
                            }}
                            onPointerCancel={() => {
                              if (photosDragTimer.current) {
                                clearTimeout(photosDragTimer.current);
                                photosDragTimer.current = null;
                              }
                              setPhotosDragIdx(null);
                              isDraggingImage.current = false;
                              setDragToast(null);
                              setTimeout(() => { photosDragTriggered.current = false; }, 100);
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={`Photo ${idx + 1}`}
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
                            {photosDeleteIdx === idx && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageDelete(pendingPhotos[idx]);
                                    const newImages = pendingPhotos.filter((_, i) => i !== idx);
                                    setPendingPhotos(newImages);
                                    setPhotosDeleteIdx(null);
                                  }}
                                  className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPhotosDeleteIdx(null);
                                  }}
                                  className="px-4 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add URL Image Button inline in grid — chain icon */}
                        {pendingPhotos.length < 50 && !showPhotosUrlInput && (
                          <button
                            type="button"
                            onClick={() => setShowPhotosUrlInput(true)}
                            className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors"
                            style={{
                              borderColor: isDarkMode ? "#374151" : "#d1d5db",
                              color: isDarkMode ? "#6b7280" : "#9ca3af",
                            }}
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Add URL Image Button (dashed outline) — shown when no URL images yet */}
                    {pendingPhotos.length === 0 && !showPhotosUrlInput && (
                      <button
                        type="button"
                        onClick={() => setShowPhotosUrlInput(true)}
                        className="w-full py-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors"
                        style={{
                          borderColor: isDarkMode ? "#374151" : "#d1d5db",
                          color: isDarkMode ? "#6b7280" : "#9ca3af",
                        }}
                      >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Add Image URL</span>
                      </button>
                    )}

                    {/* URL Input with ADD button */}
                    {showPhotosUrlInput && pendingPhotos.length < 50 && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={photosUrlInput}
                            onChange={(e) => setPhotosUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && photosUrlInput.trim()) {
                                setPendingPhotos([...pendingPhotos, convertGoogleDriveUrl(photosUrlInput.trim())]);
                                setPhotosUrlInput("");
                                setShowPhotosUrlInput(false);
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
                              if (photosUrlInput.trim()) {
                                setPendingPhotos([...pendingPhotos, convertGoogleDriveUrl(photosUrlInput.trim())]);
                                setPhotosUrlInput("");
                                setShowPhotosUrlInput(false);
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
                    {pendingPhotos.length >= 50 && (
                      <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        Maximum of 50 photos reached
                      </p>
                    )}

                    {/* Hint */}
                    {pendingPhotos.length > 0 && pendingPhotos.length < 50 && (
                      <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        Tap to delete · Hold to drag and reorder
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Wedding Venue Photo settings */}
            {!collapsedSections.has("venue") && item.id === "venue" && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {data.oneVenueOnly ? "Event Venue Images" : "Ceremony Venue Images"}
                  </label>

                  {/* Image Grid */}
                  {pendingVenue.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {pendingVenue.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          data-venue-idx={idx}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer select-none group"
                          style={{
                            outline: venueDeleteIdx === idx ? `2px solid #ef4444` : venueDragIdx === idx ? `2px solid ${accentColor}` : "none",
                            outlineOffset: venueDeleteIdx === idx || venueDragIdx === idx ? "2px" : "0",
                            boxShadow: venueDragIdx === idx ? `0 0 12px 4px ${hexToRgba(accentColor, 0.6)}, 0 0 4px 2px ${hexToRgba(accentColor, 0.4)}` : "none",
                            opacity: venueDragIdx === idx ? 0.6 : 1,
                            touchAction: 'pan-y',
                            WebkitTouchCallout: 'none',
                          }}
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                          onClick={() => {
                            if (venueDragTriggered.current) {
                              venueDragTriggered.current = false;
                              return;
                            }
                            if (venueDeleteIdx === idx) {
                              setVenueDeleteIdx(null);
                            } else {
                              setVenueDeleteIdx(idx);
                            }
                          }}
                          onPointerDown={(e) => {
                            venueDragStart.current = { x: e.clientX, y: e.clientY };
                            venueDragTriggered.current = false;
                            if (venueDragTimer.current) clearTimeout(venueDragTimer.current);
                            venueDragTimer.current = setTimeout(() => {
                              venueDragTriggered.current = true;
                              isDraggingImage.current = true;
                              setVenueDragIdx(idx);
                              setVenueDeleteIdx(null);
                              setDragToast("Drag to reorder photos");
                            }, 350);
                          }}
                          onPointerMove={(e) => {
                            if (venueDragTimer.current && !venueDragTriggered.current) {
                              const dx = e.clientX - venueDragStart.current.x;
                              const dy = e.clientY - venueDragStart.current.y;
                              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                                clearTimeout(venueDragTimer.current);
                                venueDragTimer.current = null;
                              }
                            }
                            if (venueDragTriggered.current && venueDragIdx !== null) {
                              const els = document.elementsFromPoint(e.clientX, e.clientY);
                              const cell = els.find((el: Element) => el.hasAttribute('data-venue-idx'));
                              if (cell) {
                                const overIdx = parseInt(cell.getAttribute('data-venue-idx')!, 10);
                                if (overIdx !== venueDragIdx) {
                                  const newVenue = [...pendingVenue];
                                  const [moved] = newVenue.splice(venueDragIdx, 1);
                                  newVenue.splice(overIdx, 0, moved);
                                  setPendingVenue(newVenue);
                                  setVenueDragIdx(overIdx);
                                }
                              }
                            }
                          }}
                          onPointerUp={() => {
                            if (venueDragTimer.current) {
                              clearTimeout(venueDragTimer.current);
                              venueDragTimer.current = null;
                            }
                            if (venueDragTriggered.current) {
                              setVenueDragIdx(null);
                              isDraggingImage.current = false;
                              setDragToast(null);
                            }
                            setTimeout(() => { venueDragTriggered.current = false; }, 100);
                          }}
                          onPointerCancel={() => {
                            if (venueDragTimer.current) {
                              clearTimeout(venueDragTimer.current);
                              venueDragTimer.current = null;
                            }
                            setVenueDragIdx(null);
                            isDraggingImage.current = false;
                            setDragToast(null);
                            setTimeout(() => { venueDragTriggered.current = false; }, 100);
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
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageDelete(pendingVenue[idx]);
                                  const newImages = pendingVenue.filter((_, i) => i !== idx);
                                  setPendingVenue(newImages);
                                  setVenueDeleteIdx(null);
                                }}
                                className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVenueDeleteIdx(null);
                                }}
                                className="px-4 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Image Button inline in grid - hidden after 5 images */}
                      {pendingVenue.length < 5 && !showVenueUrlInput && (
                        <button
                          type="button"
                          onClick={() => openImagePicker("venue")}
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
                      onClick={() => openImagePicker("venue")}
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
                      Maximum of 5 photos reached
                    </p>
                  )}

                  {/* Hint */}
                  {pendingVenue.length > 0 && pendingVenue.length < 5 && (
                    <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Tap to delete · Hold to drag and reorder
                    </p>
                  )}
                </div>

                {/* Reception Venue Images - only when oneVenueOnly is off */}
                {!data.oneVenueOnly && (
                  <div className="space-y-4 pt-4 border-t" style={{ borderColor: isDarkMode ? "#374151" : "#d1d5db" }}>
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Reception Venue Images
                    </label>

                    {/* Image Grid */}
                    {pendingReceptionVenue.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {pendingReceptionVenue.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            data-reception-venue-idx={idx}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer select-none group"
                            style={{
                              outline: receptionVenueDeleteIdx === idx ? `2px solid #ef4444` : receptionVenueDragIdx === idx ? `2px solid ${accentColor}` : "none",
                              outlineOffset: receptionVenueDeleteIdx === idx || receptionVenueDragIdx === idx ? "2px" : "0",
                              boxShadow: receptionVenueDragIdx === idx ? `0 0 12px 4px ${hexToRgba(accentColor, 0.6)}, 0 0 4px 2px ${hexToRgba(accentColor, 0.4)}` : "none",
                              opacity: receptionVenueDragIdx === idx ? 0.6 : 1,
                              touchAction: 'pan-y',
                              WebkitTouchCallout: 'none',
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                            onClick={() => {
                              if (receptionVenueDragTriggered.current) {
                                receptionVenueDragTriggered.current = false;
                                return;
                              }
                              if (receptionVenueDeleteIdx === idx) {
                                setReceptionVenueDeleteIdx(null);
                              } else {
                                setReceptionVenueDeleteIdx(idx);
                              }
                            }}
                            onPointerDown={(e) => {
                              receptionVenueDragStart.current = { x: e.clientX, y: e.clientY };
                              receptionVenueDragTriggered.current = false;
                              if (receptionVenueDragTimer.current) clearTimeout(receptionVenueDragTimer.current);
                              receptionVenueDragTimer.current = setTimeout(() => {
                                receptionVenueDragTriggered.current = true;
                                isDraggingImage.current = true;
                                setReceptionVenueDragIdx(idx);
                                setReceptionVenueDeleteIdx(null);
                                setDragToast("Drag to reorder photos");
                              }, 350);
                            }}
                            onPointerMove={(e) => {
                              if (receptionVenueDragTimer.current && !receptionVenueDragTriggered.current) {
                                const dx = e.clientX - receptionVenueDragStart.current.x;
                                const dy = e.clientY - receptionVenueDragStart.current.y;
                                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                                  clearTimeout(receptionVenueDragTimer.current);
                                  receptionVenueDragTimer.current = null;
                                }
                              }
                              if (receptionVenueDragTriggered.current && receptionVenueDragIdx !== null) {
                                const els = document.elementsFromPoint(e.clientX, e.clientY);
                                const cell = els.find((el: Element) => el.hasAttribute('data-reception-venue-idx'));
                                if (cell) {
                                  const overIdx = parseInt(cell.getAttribute('data-reception-venue-idx')!, 10);
                                  if (overIdx !== receptionVenueDragIdx) {
                                    const newVenue = [...pendingReceptionVenue];
                                    const [moved] = newVenue.splice(receptionVenueDragIdx, 1);
                                    newVenue.splice(overIdx, 0, moved);
                                    setPendingReceptionVenue(newVenue);
                                    setReceptionVenueDragIdx(overIdx);
                                  }
                                }
                              }
                            }}
                            onPointerUp={() => {
                              if (receptionVenueDragTimer.current) {
                                clearTimeout(receptionVenueDragTimer.current);
                                receptionVenueDragTimer.current = null;
                              }
                              if (receptionVenueDragTriggered.current) {
                                setReceptionVenueDragIdx(null);
                                isDraggingImage.current = false;
                                setDragToast(null);
                              }
                              setTimeout(() => { receptionVenueDragTriggered.current = false; }, 100);
                            }}
                            onPointerCancel={() => {
                              if (receptionVenueDragTimer.current) {
                                clearTimeout(receptionVenueDragTimer.current);
                                receptionVenueDragTimer.current = null;
                              }
                              setReceptionVenueDragIdx(null);
                              isDraggingImage.current = false;
                              setDragToast(null);
                              setTimeout(() => { receptionVenueDragTriggered.current = false; }, 100);
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={`Reception venue ${idx + 1}`}
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
                            {receptionVenueDeleteIdx === idx && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageDelete(pendingReceptionVenue[idx]);
                                    const newImages = pendingReceptionVenue.filter((_, i) => i !== idx);
                                    setPendingReceptionVenue(newImages);
                                    setReceptionVenueDeleteIdx(null);
                                  }}
                                  className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReceptionVenueDeleteIdx(null);
                                  }}
                                  className="px-4 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add Image Button inline in grid - hidden after 5 images */}
                        {pendingReceptionVenue.length < 5 && !showReceptionVenueUrlInput && (
                          <button
                            type="button"
                            onClick={() => openImagePicker("receptionVenue")}
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
                    {pendingReceptionVenue.length === 0 && !showReceptionVenueUrlInput && (
                      <button
                        type="button"
                        onClick={() => openImagePicker("receptionVenue")}
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
                    {showReceptionVenueUrlInput && pendingReceptionVenue.length < 5 && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={receptionVenueUrlInput}
                            onChange={(e) => setReceptionVenueUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && receptionVenueUrlInput.trim()) {
                                setPendingReceptionVenue([...pendingReceptionVenue, convertGoogleDriveUrl(receptionVenueUrlInput.trim())]);
                                setReceptionVenueUrlInput("");
                                setShowReceptionVenueUrlInput(false);
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
                              if (receptionVenueUrlInput.trim()) {
                                setPendingReceptionVenue([...pendingReceptionVenue, convertGoogleDriveUrl(receptionVenueUrlInput.trim())]);
                                setReceptionVenueUrlInput("");
                                setShowReceptionVenueUrlInput(false);
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
                    {pendingReceptionVenue.length >= 5 && (
                      <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        Maximum of 5 photos reached
                      </p>
                    )}

                    {/* Hint */}
                    {pendingReceptionVenue.length > 0 && pendingReceptionVenue.length < 5 && (
                      <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        Tap to delete · Hold to drag and reorder
                      </p>
                    )}
                  </div>
                )}
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

                    {/* Upload section */}
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

                    {/* Divider */}
                    <div className="flex items-center gap-3 py-1">
                      <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`} />
                    </div>

                    {/* URL section */}
                    {!pendingHeadingFontUrl && !showHeadingFontUrlInput ? (
                      <button
                        type="button"
                        onClick={() => setShowHeadingFontUrlInput(true)}
                        className="w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors"
                        style={{
                          borderColor: isDarkMode ? "#374151" : "#d1d5db",
                          color: isDarkMode ? "#6b7280" : "#9ca3af",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Add Font URL</span>
                      </button>
                    ) : showHeadingFontUrlInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={headingFontUrlInput}
                          onChange={(e) => setHeadingFontUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && headingFontUrlInput.trim()) {
                              setPendingHeadingFontUrl(headingFontUrlInput.trim());
                              setHeadingFontUrlInput("");
                              setShowHeadingFontUrlInput(false);
                            }
                          }}
                          placeholder="Paste font URL (.woff2, .ttf, .otf)..."
                          autoFocus
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (headingFontUrlInput.trim()) {
                              setPendingHeadingFontUrl(headingFontUrlInput.trim());
                              setHeadingFontUrlInput("");
                              setShowHeadingFontUrlInput(false);
                            }
                          }}
                          className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                          style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <div className={`flex-1 px-3 py-2.5 border rounded-lg text-sm truncate ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        >
                          <span className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <span className="truncate">{pendingHeadingFontUrl.split('/').pop()}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingHeadingFontUrl("")}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                          title="Remove font URL"
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

                    {/* Upload section */}
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

                    {/* Divider */}
                    <div className="flex items-center gap-3 py-1">
                      <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`} />
                    </div>

                    {/* URL section */}
                    {!pendingBodyFontUrl && !showBodyFontUrlInput ? (
                      <button
                        type="button"
                        onClick={() => setShowBodyFontUrlInput(true)}
                        className="w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors"
                        style={{
                          borderColor: isDarkMode ? "#374151" : "#d1d5db",
                          color: isDarkMode ? "#6b7280" : "#9ca3af",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Add Font URL</span>
                      </button>
                    ) : showBodyFontUrlInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bodyFontUrlInput}
                          onChange={(e) => setBodyFontUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && bodyFontUrlInput.trim()) {
                              setPendingBodyFontUrl(bodyFontUrlInput.trim());
                              setBodyFontUrlInput("");
                              setShowBodyFontUrlInput(false);
                            }
                          }}
                          placeholder="Paste font URL (.woff2, .ttf, .otf)..."
                          autoFocus
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (bodyFontUrlInput.trim()) {
                              setPendingBodyFontUrl(bodyFontUrlInput.trim());
                              setBodyFontUrlInput("");
                              setShowBodyFontUrlInput(false);
                            }
                          }}
                          className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                          style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <div className={`flex-1 px-3 py-2.5 border rounded-lg text-sm truncate ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        >
                          <span className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <span className="truncate">{pendingBodyFontUrl.split('/').pop()}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingBodyFontUrl("")}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                          title="Remove font URL"
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
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Audio Files</label>

                  {/* === UPLOAD SECTION (top) — max 3 === */}
                  <div className="space-y-2">
                    <label className={`block text-[10px] tracking-wide uppercase text-left ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>Upload Music {pendingBackgroundMusic.length > 0 && `(${pendingBackgroundMusic.length}/3)`}</label>

                    {/* Render existing uploaded tracks */}
                    {pendingBackgroundMusic.map((url, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <div className={`flex-1 px-3 py-2.5 border rounded-lg text-sm truncate ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        >
                          {pendingBackgroundMusicFileNames[idx] || `Track ${idx + 1}`}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMusicDeleteIdx(idx);
                            setShowDeleteDialog(true);
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                          title="Remove track"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Upload slot for empty position (up to 3 total) */}
                    {pendingBackgroundMusic.length < 3 && (
                      <div className="flex gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          uploadingIndex !== null
                            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                            : "border-gray-200 text-gray-600"
                        }`} style={
                          uploadingIndex === null
                            ? {
                                borderColor: accentColor,
                                backgroundColor: `${accentColor}05`
                              }
                            : undefined
                        }>
                          {uploadingIndex === pendingBackgroundMusic.length ? (
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
                              <span className="text-sm">Upload music file {pendingBackgroundMusic.length > 0 ? `(${pendingBackgroundMusic.length + 1}/3)` : ""}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleMusicUpload(pendingBackgroundMusic.length, file);
                              }
                            }}
                            disabled={uploadingIndex !== null}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {pendingBackgroundMusic.length >= 3 && (
                      <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        Maximum of 3 uploaded tracks reached
                      </p>
                    )}
                  </div>

                  {/* === DIVIDER === */}
                  <div className="flex items-center gap-3 py-1">
                    <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`} />
                  </div>

                  {/* === URL SECTION (bottom) — max 3 === */}
                  <div className="space-y-2">
                    <label className={`block text-[10px] tracking-wide uppercase text-left ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>Add MP3 URL {pendingMusicUrls.length > 0 && `(${pendingMusicUrls.length}/3)`}</label>

                    {/* Render existing URL tracks */}
                    {pendingMusicUrls.map((url, idx) => (
                      <div key={`music-url-${idx}`} className="flex gap-2 items-center">
                        <div className={`flex-1 px-3 py-2.5 border rounded-lg text-sm truncate ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        >
                          <span className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <span className="truncate">{url.split('/').pop() || `URL ${idx + 1}`}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingMusicUrls(pendingMusicUrls.filter((_, i) => i !== idx));
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                          title="Remove URL track"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Add URL button (dashed, link icon) — shown when < 3 and no input visible */}
                    {pendingMusicUrls.length < 3 && !showMusicUrlInput && (
                      <button
                        type="button"
                        onClick={() => setShowMusicUrlInput(true)}
                        className="w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors"
                        style={{
                          borderColor: isDarkMode ? "#374151" : "#d1d5db",
                          color: isDarkMode ? "#6b7280" : "#9ca3af",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Add MP3 URL</span>
                      </button>
                    )}

                    {/* URL Input with ADD button */}
                    {showMusicUrlInput && pendingMusicUrls.length < 3 && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={musicUrlInput}
                          onChange={(e) => setMusicUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && musicUrlInput.trim()) {
                              setPendingMusicUrls([...pendingMusicUrls, musicUrlInput.trim()]);
                              setMusicUrlInput("");
                              setShowMusicUrlInput(false);
                            }
                          }}
                          placeholder="Paste MP3 URL..."
                          autoFocus
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (musicUrlInput.trim()) {
                              setPendingMusicUrls([...pendingMusicUrls, musicUrlInput.trim()]);
                              setMusicUrlInput("");
                              setShowMusicUrlInput(false);
                            }
                          }}
                          className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                          style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
                        >
                          Add
                        </button>
                      </div>
                    )}

                    {pendingMusicUrls.length >= 3 && (
                      <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        Maximum of 3 URL tracks reached
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Broken image warnings */}
            {item.id === "logo" && pendingLogo && logoValidation.broken.has(pendingLogo) && (
              <div className="px-4 pb-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Logo image link is broken or invalid</span>
                </div>
              </div>
            )}
            {item.id === "gallery" && pendingGallery.length > 0 && galleryValidation.broken.size > 0 && (
              <div className="px-4 pb-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{galleryValidation.broken.size} of {pendingGallery.length} gallery {galleryValidation.broken.size === 1 ? "image is" : "images are"} broken or invalid</span>
                </div>
              </div>
            )}
            {item.id === "venue" && pendingVenue.length > 0 && venueValidation.broken.size > 0 && (
              <div className="px-4 pb-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{venueValidation.broken.size} of {pendingVenue.length} {data.oneVenueOnly ? "event venue" : "ceremony venue"} {venueValidation.broken.size === 1 ? "image is" : "images are"} broken or invalid</span>
                </div>
              </div>
            )}
            {item.id === "venue" && !data.oneVenueOnly && pendingReceptionVenue.length > 0 && receptionVenueValidation.broken.size > 0 && (
              <div className="px-4 pb-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{receptionVenueValidation.broken.size} of {pendingReceptionVenue.length} reception venue {receptionVenueValidation.broken.size === 1 ? "image is" : "images are"} broken or invalid</span>
                </div>
              </div>
            )}
            {item.id === "photos" && pendingPhotos.length > 0 && photosValidation.broken.size > 0 && (
              <div className="px-4 pb-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{photosValidation.broken.size} of {pendingPhotos.length} {photosValidation.broken.size === 1 ? "image is" : "images are"} broken or invalid</span>
                </div>
              </div>
            )}
          </div>
          </Fragment>
        ))}
      </div>

      {/* Image Picker Sheet (for logo, gallery, venue) */}
      {showImagePicker && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setShowImagePicker(false); setImagePickerTarget(null); }} />
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 ${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-t-3xl shadow-2xl flex flex-col animate-slide-up`}
            style={{ maxWidth: 480, margin: "0 auto", maxHeight: "60vh" }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
            </div>
            <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Select Image {imagePickerTarget && `for ${imagePickerTarget === "logo" ? "Logo" : imagePickerTarget === "gallery" ? "Photo Gallery" : imagePickerTarget === "receptionVenue" ? "Reception Venue Photo" : "Venue Photo"}`}
              </h3>
              <button
                type="button"
                onClick={() => { setShowImagePicker(false); setImagePickerTarget(null); }}
                className={`p-1.5 rounded-md transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10">
              <div className="grid grid-cols-3 gap-3">
                {([...pendingUploadedPhotos, ...pendingPhotos]).filter(Boolean).map((url, i) => (
                  <button
                    key={`picker-${i}`}
                    onClick={() => handleImagePickerSelect(url)}
                    className="aspect-square rounded-2xl border-2 border-transparent overflow-hidden transition-all active:scale-95 hover:border-gray-300"
                  >
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {([...pendingUploadedPhotos, ...pendingPhotos]).filter(Boolean).length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-400 text-sm">
                    No images available.
                    <br />
                    Add photos in Photos & Images section.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteDialog(false)}>
          <div 
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Delete Music Track
            </h3>
            <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Are you sure you want to delete this music track? This action cannot be undone.
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
    </div>
  );
}
