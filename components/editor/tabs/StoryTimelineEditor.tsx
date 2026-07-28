import { useState, useRef, useEffect } from "react";
import FloatingActionMenu from "../shared/FloatingActionMenu";

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
  data?: any;
  onChange?: (key: any, value: any) => void;
  onSave?: (updatedData: any) => Promise<void>;
}

export default function StoryTimelineEditor({ isDarkMode = false, accentColor = "#6998EE", onClose, galleryImages = [], data, onChange, onSave }: StoryTimelineEditorProps) {
  // Initialize from data.storyTimeline
  const getInitialContainers = (): StoryTimelineContainer[] => {
    if (data?.storyTimeline && data.storyTimeline.length > 0) {
      return data.storyTimeline.map((item: any) => ({
        id: item.id,
        title: item.title,
        item: {
          id: item.id,
          title: item.title,
          date: item.date,
          description: item.description,
          photoUrl: item.photoUrl
        },
        isExpanded: false
      }));
    }
    return [];
  };
  const [containers, setContainers] = useState<StoryTimelineContainer[]>(getInitialContainers);
  const initialDataSnapshot = useRef(JSON.stringify((data?.storyTimeline || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    description: item.description,
    photoUrl: item.photoUrl
  }))));
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // Drag-and-drop reorder state
  const dragTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragTriggered = useRef(false);
  const isDragging = useRef(false);
  const [dragToast, setDragToast] = useState<string | null>(null);
  const [hoveredContainer, setHoveredContainer] = useState<string | null>(null);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Prevent page scroll during drag-and-drop reordering
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', handleTouchMove);
  }, []);

  // Revert detection: compare current containers with initial snapshot
  useEffect(() => {
    const currentData = JSON.stringify(containers.map(c => ({
      id: c.item.id,
      title: c.item.title,
      date: c.item.date,
      description: c.item.description,
      photoUrl: c.item.photoUrl
    })));
    setHasUnsavedChanges(currentData !== initialDataSnapshot.current);
  }, [containers]);

  // Helper function to save to data.storyTimeline via onChange
  const saveToData = (containers: StoryTimelineContainer[]) => {
    const timelineData = containers.map(container => ({
      id: container.item.id,
      title: container.item.title,
      date: container.item.date,
      description: container.item.description,
      photoUrl: container.item.photoUrl
    }));
    onChange?.('storyTimeline' as any, timelineData);
  };

  // Handle close - auto-apply pending changes, no save prompt
  const handleClose = () => {
    if (hasUnsavedChanges) {
      saveToData(containers);
    }
    onClose();
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
    }
  };

  // Update item field
  const updateItemField = (containerId: string, field: keyof StoryTimelineItem, value: string | number) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, item: { ...c.item, [field]: value } }
        : c
    ));
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
      {/* Drag indicator toast */}
      {dragToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          style={{ animation: "st-drag-toast-in 0.2s ease-out" }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-sm shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "st-drag-grip 1s ease-in-out infinite" }}>
              <line x1="8" y1="6" x2="8" y2="6.01" /><line x1="16" y1="6" x2="16" y2="6.01" /><line x1="8" y1="12" x2="8" y2="12.01" /><line x1="16" y1="12" x2="16" y2="12.01" /><line x1="8" y1="18" x2="8" y2="18.01" /><line x1="16" y1="18" x2="16" y2="18.01" />
            </svg>
            <span className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{dragToast}</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes st-drag-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes st-drag-grip {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
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
          containers.map((container, idx) => (
            <div
              key={container.id}
              data-st-idx={idx}
              onMouseEnter={() => setHoveredContainer(container.id)}
              onMouseLeave={() => setHoveredContainer(null)}
              className={`border rounded-xl overflow-hidden transition-all duration-300`}
              style={{
                backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
                borderColor: hoveredContainer === container.id ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
                ...(container.isExpanded ? {
                  boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
                } : {}),
                ...(dragIdx === idx ? {
                  outline: `2px solid ${accentColor}`,
                  outlineOffset: "2px",
                  boxShadow: `0 0 12px 4px ${hexToRgba(accentColor, 0.6)}, 0 0 4px 2px ${hexToRgba(accentColor, 0.4)}`,
                  opacity: 0.6,
                } : {}),
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              {/* Container Header */}
              <div 
                className={`flex items-center gap-3 p-4 cursor-pointer rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
                style={{
                  touchAction: 'pan-y',
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                }}
                onClick={() => {
                  if (dragTriggered.current) {
                    dragTriggered.current = false;
                    return;
                  }
                  toggleContainer(container.id);
                }}
                onPointerDown={(e) => {
                  dragStart.current = { x: e.clientX, y: e.clientY };
                  dragTriggered.current = false;
                  if (dragTimer.current) clearTimeout(dragTimer.current);
                  dragTimer.current = setTimeout(() => {
                    dragTriggered.current = true;
                    isDragging.current = true;
                    setDragIdx(idx);
                    setDragToast("Drag to reorder story events");
                  }, 350);
                }}
                onPointerMove={(e) => {
                  if (dragTimer.current && !dragTriggered.current) {
                    const dx = e.clientX - dragStart.current.x;
                    const dy = e.clientY - dragStart.current.y;
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                      clearTimeout(dragTimer.current);
                      dragTimer.current = null;
                    }
                  }
                  if (dragTriggered.current && dragIdx !== null) {
                    const els = document.elementsFromPoint(e.clientX, e.clientY);
                    const cell = els.find((el: Element) => el.hasAttribute('data-st-idx'));
                    if (cell) {
                      const overIdx = parseInt(cell.getAttribute('data-st-idx')!, 10);
                      if (overIdx !== dragIdx) {
                        const newContainers = [...containers];
                        const [moved] = newContainers.splice(dragIdx, 1);
                        newContainers.splice(overIdx, 0, moved);
                        setContainers(newContainers);
                        setDragIdx(overIdx);
                      }
                    }
                  }
                }}
                onPointerUp={() => {
                  if (dragTimer.current) {
                    clearTimeout(dragTimer.current);
                    dragTimer.current = null;
                  }
                  if (dragTriggered.current) {
                    setDragIdx(null);
                    isDragging.current = false;
                    setDragToast(null);
                  }
                  setTimeout(() => { dragTriggered.current = false; }, 100);
                }}
                onPointerCancel={() => {
                  if (dragTimer.current) {
                    clearTimeout(dragTimer.current);
                    dragTimer.current = null;
                  }
                  setDragIdx(null);
                  isDragging.current = false;
                  setDragToast(null);
                  setTimeout(() => { dragTriggered.current = false; }, 100);
                }}
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
                  {isEditMode && (
                    <button
                      onClick={() => deleteContainer(container.id)}
                      className={`p-1 rounded transition-colors ${isDarkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-200 text-red-500"}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
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
      </div>

      {/* Floating Action Menu */}
      <FloatingActionMenu
        accentColor={accentColor}
        isDarkMode={isDarkMode}
        options={isEditMode ? [
          { label: "Add Event", icon: "plus", onClick: addContainer },
          { label: "Done Edit", icon: "done", onClick: () => setIsEditMode(false) },
        ] : [
          { label: "Add Event", icon: "plus", onClick: addContainer },
          { label: "Edit Events", icon: "edit", onClick: () => setIsEditMode(true) },
        ]}
      />

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

    </div>
  );
}
