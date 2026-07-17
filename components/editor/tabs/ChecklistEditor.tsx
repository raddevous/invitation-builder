import { useState, useRef, useEffect } from "react";

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
}

interface ChecklistContainer {
  id: string;
  title: string;
  items: ChecklistItem[];
  isExpanded: boolean;
}

interface ChecklistEditorProps {
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
}

export default function ChecklistEditor({ isDarkMode = false, accentColor = "#2563EB", onClose }: ChecklistEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  // Initialize from localStorage directly
  const getInitialContainers = (): ChecklistContainer[] => {
    try {
      const stored = localStorage.getItem('weddingChecklist');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load initial checklist:', error);
    }
    return [];
  };
  const [containers, setContainers] = useState<ChecklistContainer[]>(getInitialContainers);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Helper function to save to localStorage
  const saveToLocalStorage = (data: ChecklistContainer[]) => {
    try {
      localStorage.setItem('weddingChecklist', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save checklist to localStorage:', error);
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

  // Calculate progress for a container (returns ratio like "(2/4)")
  const getContainerProgress = (container: ChecklistContainer) => {
    if (container.items.length === 0) return "(0/0)";
    const checkedCount = container.items.filter(item => item.checked).length;
    return `(${checkedCount}/${container.items.length})`;
  };

  // Calculate percentage for a container
  const getContainerPercentage = (container: ChecklistContainer) => {
    if (container.items.length === 0) return 0;
    const checkedCount = container.items.filter(item => item.checked).length;
    return Math.round((checkedCount / container.items.length) * 100);
  };

  // Calculate global progress (returns ratio like "(5/10)")
  const getGlobalProgress = () => {
    const allItems = containers.flatMap(c => c.items);
    if (allItems.length === 0) return "(0/0)";
    const checkedCount = allItems.filter(item => item.checked).length;
    return `(${checkedCount}/${allItems.length})`;
  };

  // Calculate remaining tasks
  const getRemainingTasks = () => {
    const allItems = containers.flatMap(c => c.items);
    const uncheckedCount = allItems.filter(item => !item.checked).length;
    return uncheckedCount;
  };

  // Calculate completed tasks
  const getCompletedTasks = () => {
    const allItems = containers.flatMap(c => c.items);
    const checkedCount = allItems.filter(item => item.checked).length;
    return checkedCount;
  };

  // Calculate total tasks
  const getTotalTasks = () => {
    const allItems = containers.flatMap(c => c.items);
    return allItems.length;
  };

  // Calculate percentage for circle
  const getPercentage = () => {
    const allItems = containers.flatMap(c => c.items);
    if (allItems.length === 0) return 0;
    const checkedCount = allItems.filter(item => item.checked).length;
    return Math.round((checkedCount / allItems.length) * 100);
  };

  // Get motivational commentary based on progress
  const getMotivationalComment = () => {
    const percentage = getPercentage();
    if (percentage === 0) return "Let's get started!";
    if (percentage <= 10) return "Great start!";
    if (percentage <= 20) return "Making progress!";
    if (percentage <= 30) return "Keep it up!";
    if (percentage <= 40) return "Almost halfway!";
    if (percentage <= 50) return "Halfway there!";
    if (percentage <= 60) return "More than halfway!";
    if (percentage <= 70) return "Great progress!";
    if (percentage <= 80) return "Almost done!";
    if (percentage <= 90) return "So close!";
    if (percentage < 100) return "Final stretch!";
    return "Amazing work!";
  };

  // Add new container
  const addContainer = () => {
    if (containers.length >= 15) {
      alert("Maximum of 15 checklists allowed");
      return;
    }
    const newContainer: ChecklistContainer = {
      id: Date.now().toString(),
      title: "New Checklist",
      items: [],
      isExpanded: false,
    };
    setContainers([...containers, newContainer]);
    markUnsaved();
  };

  // Delete container
  const deleteContainer = (containerId: string) => {
    const container = containers.find(c => c.id === containerId);
    if (container && container.items.length > 0) {
      if (!confirm("This checklist contains items. Are you sure you want to delete it?")) {
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
  const startEditingTitle = (container: ChecklistContainer) => {
    setEditingContainerId(container.id);
    setEditingTitle(container.title);
  };

  // Save container title
  const saveTitle = () => {
    if (editingContainerId) {
      setContainers(containers.map(c => 
        c.id === editingContainerId ? { ...c, title: editingTitle } : c
      ));
      setEditingContainerId(null);
      setEditingTitle("");
      markUnsaved();
    }
  };

  // Add item to container
  const addItem = (containerId: string) => {
    const container = containers.find(c => c.id === containerId);
    if (container && container.items.length >= 20) {
      alert("Maximum of 20 items per checklist");
      return;
    }
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      name: "",
      checked: false,
    };
    setContainers(containers.map(c => 
      c.id === containerId ? { ...c, items: [...c.items, newItem] } : c
    ));
    markUnsaved();
  };

  // Delete item
  const deleteItem = (containerId: string, itemId: string) => {
    setContainers(containers.map(c => 
      c.id === containerId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
    ));
    markUnsaved();
  };

  // Update item name
  const updateItemName = (containerId: string, itemId: string, name: string) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, name } : i) }
        : c
    ));
    markUnsaved();
  };

  // Toggle item checkbox
  const toggleItemCheck = (containerId: string, itemId: string) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
        : c
    ));
    markUnsaved();
  };

  return (
    <div className={`w-full h-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Header */}
      <div className={`flex flex-col p-4 shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {/* Title row with progress */}
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
                Checklist
              </h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Track your wedding tasks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className={`p-4 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8" style={{
              backgroundColor: accentColor,
              WebkitMaskImage: "url(/assets/ico-progress.png)",
              WebkitMaskSize: "contain",
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url(/assets/ico-progress.png)",
              maskSize: "contain",
              maskPosition: "center",
              maskRepeat: "no-repeat"
            }} />
            <div>
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Planning Milestone
              </h3>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {getMotivationalComment()}
              </p>
            </div>
          </div>
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                className={isDarkMode ? "stroke-gray-700" : "stroke-gray-200"}
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={accentColor}
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - getPercentage() / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              {getPercentage()}%
            </span>
          </div>
        </div>
        {/* Task count and remaining - aligned */}
        <div className="flex items-center justify-between">
          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
            {getCompletedTasks()} / {getTotalTasks()} tasks
          </div>
          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
            {getRemainingTasks()} remaining
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ fontFamily: "Inter, sans-serif" }}>
        {containers.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            <p className="text-sm">No checklists yet</p>
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
                  {editingContainerId === container.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-sm font-medium bg-transparent border-b outline-none ${isDarkMode ? "text-gray-200 border-gray-500" : "text-gray-900 border-gray-300"}`}
                      autoFocus
                    />
                  ) : (
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>{container.title}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 mt-0.5">{getContainerProgress(container)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{getContainerPercentage(container)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isEditMode && (
                    <>
                      {editingContainerId !== container.id && (
                        <button
                          onClick={() => startEditingTitle(container)}
                          className={`p-1 rounded transition-colors ${isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => deleteContainer(container.id)}
                        className={`p-1 rounded transition-colors ${isDarkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-200 text-red-500"}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Container Items */}
              {container.isExpanded && (
                <div className={`p-4 space-y-4 ${isEditMode ? (isDarkMode ? "border-gray-700" : "border-gray-100") : "border-transparent"} border-t`}
                  style={isEditMode ? (isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }) : { backgroundColor: "transparent" }}>
                  {container.items.length === 0 ? (
                    <p className={`text-sm text-center py-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      List is empty
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {container.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          {!isEditMode && (
                            <div 
                              className="w-4 h-4 rounded-full border-2 cursor-pointer flex items-center justify-center transition-colors"
                              style={{ 
                                borderColor: item.checked ? accentColor : (isDarkMode ? "#4B5563" : "#D1D5DB"),
                                backgroundColor: item.checked ? accentColor : "transparent"
                              }}
                              onClick={() => toggleItemCheck(container.id, item.id)}
                            >
                              {item.checked && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          )}
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItemName(container.id, item.id, e.target.value)}
                            className={`flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isEditMode ? (isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200") : "bg-transparent border-transparent"} ${!isEditMode ? (isDarkMode ? "text-gray-200" : "text-gray-900") : ""} ${!isEditMode && item.checked ? "line-through opacity-50" : ""}`}
                            style={isEditMode ? (isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) : {}}
                            placeholder="Item name"
                            disabled={!isEditMode}
                          />
                          {isEditMode && (
                            <button
                              onClick={() => deleteItem(container.id, item.id)}
                              className={`p-1 rounded transition-colors ${isDarkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-200 text-red-500"}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add item button - always shown in edit mode */}
                  {isEditMode && (
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => addItem(container.id)}
                        className="px-4 py-2 text-sm text-center rounded-lg transition-colors"
                        style={{ color: accentColor, backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
                      >
                        + Add item
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        <div className="h-8"></div>
        
        {/* Edit/Add Checklist button */}
        {isEditMode ? (
          <div className="space-y-2">
            <button
              onClick={addContainer}
              className="w-full py-3 text-sm font-medium text-center rounded-xl transition-colors border-2 border-dashed"
              style={{ 
                color: accentColor, 
                borderColor: accentColor,
                backgroundColor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" 
              }}
            >
              + Add Checklist
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className="w-full py-3 text-sm font-medium text-center rounded-xl transition-colors text-white"
              style={{ 
                backgroundColor: accentColor
              }}
            >
              Done Edit
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditMode(true)}
            className="w-full py-3 text-sm font-medium text-center rounded-xl transition-colors border-2 border-dashed"
            style={{ 
              color: accentColor, 
              borderColor: accentColor,
              backgroundColor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" 
            }}
          >
            Edit Checklist
          </button>
        )}
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
