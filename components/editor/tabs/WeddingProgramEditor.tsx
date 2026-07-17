import { useState, useRef, useEffect } from "react";

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface WeddingProgramItem {
  id: string;
  name: string;
  eventDetails: string;
  place: string;
  time: string;
  imageVariant: number;
}

interface WeddingProgramContainer {
  id: string;
  title: string;
  item: WeddingProgramItem;
  isExpanded: boolean;
}

interface WeddingProgramEditorProps {
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
}

export default function WeddingProgramEditor({ isDarkMode = false, accentColor = "#2563EB", onClose }: WeddingProgramEditorProps) {
  // Initialize from localStorage directly
  const getInitialContainers = (): WeddingProgramContainer[] => {
    try {
      const stored = localStorage.getItem('weddingProgram');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load initial wedding program:', error);
    }
    return [];
  };
  const [containers, setContainers] = useState<WeddingProgramContainer[]>(getInitialContainers);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [timeSlotVariantCount, setTimeSlotVariantCount] = useState(4);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Helper function to check if image exists
  const imageExists = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  // Get time slot image source
  const getTimeSlotSrc = (variant: number) => {
    return `/assets/ico-timeslot-${variant + 1}.png`;
  };

  // Detect time slot variant count
  const detectTimeSlotVariantCount = async (): Promise<number> => {
    let count = 0;
    for (let i = 0; i < 20; i++) {
      const exists = await imageExists(getTimeSlotSrc(i));
      if (exists) {
        count = i + 1;
      } else {
        break;
      }
    }
    return Math.max(count, 1);
  };

  // Detect variants on mount
  useEffect(() => {
    detectTimeSlotVariantCount().then(setTimeSlotVariantCount);
  }, []);

  // Helper function to save to localStorage
  const saveToLocalStorage = (data: WeddingProgramContainer[]) => {
    try {
      localStorage.setItem('weddingProgram', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save wedding program to localStorage:', error);
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
      alert("Maximum of 30 program slots allowed");
      return;
    }
    const newItem: WeddingProgramItem = {
      id: Date.now().toString(),
      name: "Timeline Event",
      eventDetails: "",
      place: "",
      time: "",
      imageVariant: 0,
    };
    const newContainer: WeddingProgramContainer = {
      id: Date.now().toString(),
      title: "Timeline Event",
      item: newItem,
      isExpanded: false,
    };
    setContainers([...containers, newContainer]);
    markUnsaved();
  };

  // Delete container
  const deleteContainer = (containerId: string) => {
    const container = containers.find(c => c.id === containerId);
    if (container && (container.item.place || container.item.time)) {
      if (!confirm("This program slot contains data. Are you sure you want to delete it?")) {
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
  const startEditingTitle = (container: WeddingProgramContainer) => {
    setEditingContainerId(container.id);
    setEditingTitle(container.title);
  };

  // Save container title
  const saveTitle = () => {
    if (editingContainerId) {
      setContainers(containers.map(c => 
        c.id === editingContainerId ? { ...c, title: editingTitle, item: { ...c.item, name: editingTitle } } : c
      ));
      setEditingContainerId(null);
      setEditingTitle("");
      markUnsaved();
    }
  };

  // Update item field
  const updateItemField = (containerId: string, field: keyof WeddingProgramItem, value: string | number) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, item: { ...c.item, [field]: value } }
        : c
    ));
    markUnsaved();
  };

  // Cycle image variant
  const cycleImageVariant = (containerId: string) => {
    const container = containers.find(c => c.id === containerId);
    if (container) {
      const nextVariant = (container.item.imageVariant + 1) % timeSlotVariantCount;
      updateItemField(containerId, 'imageVariant', nextVariant);
      // Reset error state for this container
      setImageLoadErrors(prev => ({ ...prev, [containerId]: false }));
    }
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
                Wedding Program
              </h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Create your event timeline
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ fontFamily: "Inter, sans-serif" }}>
        {containers.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            <p className="text-sm">No program slots yet</p>
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
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>Time Slot {containers.indexOf(container) + 1}</p>
                  ) : (
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>{container.item.name || "Timeline Event"}</p>
                  )}
                  {/* Preview when collapsed */}
                  {!container.isExpanded && (
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {container.item.place && <span>• Place: {container.item.place}</span>}
                      {container.item.time && <span className="ml-2">• Time: {container.item.time}</span>}
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
                    {/* Square Image Placeholder */}
                    <div 
                      className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ borderColor: isDarkMode ? "#4B5563" : "#D1D5DB" }}
                      onClick={() => cycleImageVariant(container.id)}
                    >
                      {imageLoadErrors[container.id] ? (
                        <div className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          Image
                        </div>
                      ) : (
                        <img
                          src={getTimeSlotSrc(container.item.imageVariant)}
                          alt=""
                          className="w-full h-full object-contain"
                          onError={() => setImageLoadErrors(prev => ({ ...prev, [container.id]: true }))}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {/* Timeline Event Name */}
                      <input
                        type="text"
                        value={container.item.name}
                        onChange={(e) => updateItemField(container.id, 'name', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                        style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6" }}
                        placeholder="Timeline Event"
                      />
                      
                      {/* Event Details */}
                      <input
                        type="text"
                        value={container.item.eventDetails}
                        onChange={(e) => updateItemField(container.id, 'eventDetails', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                        style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", marginTop: "8px" }}
                        placeholder="Event Details"
                      />
                      
                      {/* Time and Place */}
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <input
                          type="text"
                          value={container.item.time}
                          onChange={(e) => updateItemField(container.id, 'time', e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6" }}
                          placeholder="Time"
                        />
                        <input
                          type="text"
                          value={container.item.place}
                          onChange={(e) => updateItemField(container.id, 'place', e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6" }}
                          placeholder="Place"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        <div className="h-8"></div>
        
        {/* Add Slot button */}
        <button
          onClick={addContainer}
          className="w-full py-3 text-sm font-medium text-center rounded-xl transition-colors border-2 border-dashed"
          style={{ 
            color: accentColor, 
            borderColor: accentColor,
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" 
          }}
        >
          + Add Slot
        </button>
      </div>

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
