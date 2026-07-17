import { useState, useRef, useEffect } from "react";

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface StoryTimelineItem {
  id: string;
  title: string;
  date: string;
  description: string;
  photoUrl: string;
}

interface StoryTimelineContainer {
  id: string;
  title: string;
  item: StoryTimelineItem;
  isExpanded: boolean;
}

interface StoryTimelineEditorProps {
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
  galleryImages?: string[];
}

export default function StoryTimelineEditor({ isDarkMode = false, accentColor = "#2563EB", onClose, galleryImages = [] }: StoryTimelineEditorProps) {
  // Initialize from localStorage directly
  const getInitialContainers = (): StoryTimelineContainer[] => {
    try {
      const stored = localStorage.getItem('storyTimeline');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load initial story timeline:', error);
    }
    return [];
  };
  const [containers, setContainers] = useState<StoryTimelineContainer[]>(getInitialContainers);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Helper function to save to localStorage
  const saveToLocalStorage = (data: StoryTimelineContainer[]) => {
    try {
      localStorage.setItem('storyTimeline', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save story timeline to localStorage:', error);
      throw error;
    }
  };

  // Mark changes as unsaved
  const markUnsaved = () => setHasUnsavedChanges(true);

  // Manual save
  const handleSave = async () => {
    setSaveStatus("saving");
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      saveToLocalStorage(containers);
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChangesRef.current) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleSaveAndClose = async () => {
    setShowUnsavedDialog(false);
    setSaveStatus("saving");
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      saveToLocalStorage(containers);
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      await new Promise(resolve => setTimeout(resolve, 1000));
      onClose();
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }
  };

  // Add new container
  const addContainer = () => {
    if (containers.length >= 30) {
      alert("Maximum of 30 story events allowed");
      return;
    }
    const newItem: StoryTimelineItem = {
      id: Date.now().toString(),
      title: "Story Event",
      date: "",
      description: "",
      photoUrl: "",
    };
    const newContainer: StoryTimelineContainer = {
      id: Date.now().toString(),
      title: "Story Event",
      item: newItem,
      isExpanded: false,
    };
    setContainers([...containers, newContainer]);
    markUnsaved();
  };

  // Delete container
  const deleteContainer = (containerId: string) => {
    const container = containers.find(c => c.id === containerId);
    if (container && (container.item.date || container.item.description)) {
      if (!confirm("This story event contains data. Are you sure you want to delete it?")) {
        return;
      }
    }
    setContainers(containers.filter(c => c.id !== containerId));
    markUnsaved();
  };

  // Toggle container expansion (accordion behavior - only one expanded at a time)
  const toggleContainer = (containerId: string) => {
    setContainers(containers.map(c => {
      if (c.id === containerId) {
        // Toggle the clicked container
        return { ...c, isExpanded: !c.isExpanded };
      } else {
        // Collapse all other containers (accordion behavior)
        return { ...c, isExpanded: false };
      }
    }));
  };

  // Start editing container title
  const startEditingTitle = (container: StoryTimelineContainer) => {
    setEditingContainerId(container.id);
    setEditingTitle(container.title);
  };

  // Save container title
  const saveTitle = () => {
    if (editingContainerId) {
      setContainers(containers.map(c => 
        c.id === editingContainerId ? { ...c, title: editingTitle, item: { ...c.item, title: editingTitle } } : c
      ));
      setEditingContainerId(null);
      setEditingTitle("");
      markUnsaved();
    }
  };

  // Update item field
  const updateItemField = (containerId: string, field: keyof StoryTimelineItem, value: string | number) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, item: { ...c.item, [field]: value } }
        : c
    ));
    markUnsaved();
  };

  // Update photo URL
  const updatePhotoUrl = (containerId: string, url: string) => {
    updateItemField(containerId, 'photoUrl', url);
  };

  // Handle photo square click
  const handlePhotoClick = (containerId: string) => {
    setSelectedContainerId(containerId);
    setShowPhotoSelector(true);
  };

  // Handle photo selection
  const handlePhotoSelect = (url: string) => {
    if (selectedContainerId) {
      updatePhotoUrl(selectedContainerId, url);
    }
    setShowPhotoSelector(false);
    setSelectedContainerId(null);
  };

  return (
    <div className={`w-full h-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Header */}
      <div className={`flex flex-col p-4 shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {/* Title row */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
                Story Timeline
              </h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Create your love story
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ fontFamily: "Inter, sans-serif" }}>
        {containers.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            <p className="text-sm">No story events yet</p>
          </div>
        ) : (
          containers.map((container) => (
            <div
              key={container.id}
              className={`border rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              style={{
                backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
                ...(container.isExpanded ? {
                  boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
                } : {})
              }}
            >
              {/* Container Header */}
              <div 
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                onClick={() => toggleContainer(container.id)}
              >
                <div className="shrink-0 text-gray-400">
                  {container.isExpanded ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  {container.isExpanded ? (
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>Story Event {containers.indexOf(container) + 1}</p>
                  ) : (
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>{container.item.title || "Story Event"}</p>
                  )}
                  {/* Preview when collapsed */}
                  {!container.isExpanded && (
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {container.item.date && <span>{container.item.date}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => deleteContainer(container.id)}
                    className={`p-1 rounded transition-colors ${isDarkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-200 text-red-500"}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Container Item - Input fields */}
              {container.isExpanded && (
                <div className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
                  style={{ backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0" }}>
                  <div className="flex gap-4">
                    {/* Photo Placeholder */}
                    <div 
                      className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ borderColor: isDarkMode ? "#4B5563" : "#D1D5DB" }}
                      onClick={() => handlePhotoClick(container.id)}
                    >
                      {container.item.photoUrl ? (
                        <img
                          src={container.item.photoUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          Photo
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {/* Story Event Title */}
                      <input
                        type="text"
                        value={container.item.title}
                        onChange={(e) => updateItemField(container.id, 'title', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                        style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6" }}
                        placeholder="Story Event"
                      />
                      
                      {/* Date */}
                      <input
                        type="text"
                        value={container.item.date}
                        onChange={(e) => updateItemField(container.id, 'date', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                        style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", marginTop: "8px" }}
                        placeholder="Date"
                      />
                      
                      {/* Description */}
                      <textarea
                        value={container.item.description}
                        onChange={(e) => updateItemField(container.id, 'description', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors resize-none ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                        style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", marginTop: "8px" }}
                        placeholder="Description"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        <div className="h-8"></div>
        
        {/* Add Event button */}
        <button
          onClick={addContainer}
          className="w-full py-3 text-sm font-medium text-center rounded-xl transition-colors border-2 border-dashed"
          style={{ 
            color: accentColor, 
            borderColor: accentColor,
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" 
          }}
        >
          + Add Event
        </button>
      </div>

      {/* Photo Selector Modal */}
      {showPhotoSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPhotoSelector(false)}>
          <div
            className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Select Photo
              </h3>
              <button
                onClick={() => setShowPhotoSelector(false)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Photo Grid */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {galleryImages.length === 0 ? (
                <div className={`text-center py-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  <p className="text-sm">No photos in gallery. Add photos in Media.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.filter(url => url && url.trim() !== "").map((url, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-transparent hover:border-blue-500"
                      onClick={() => handlePhotoSelect(url)}
                    >
                      <img
                        src={url}
                        alt={`Gallery photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer with save button */}
      <div className="p-4 shrink-0">
        {hasUnsavedChanges && (
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              className="px-6 py-2 text-white rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

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

      {/* Saving overlay */}
      {saveStatus !== "idle" && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center transition-opacity duration-500">
          <div className="absolute inset-0 bg-gray-900" style={{ opacity: 0.95 }} />
          <div className="relative z-10 flex flex-col items-center gap-4 text-white drop-shadow-lg">
            <span className="text-xl font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "error" && "Save failed"}
            </span>
            {saveStatus === "saving" && (
              <div className="w-14 h-14 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            )}
            {saveStatus === "saved" && (
              <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-9" />
              </svg>
            )}
            {saveStatus === "error" && (
              <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
