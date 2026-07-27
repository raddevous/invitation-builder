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
  iconSrc?: string;
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
  data?: any;
  onChange?: (key: any, value: any) => void;
  onSave?: (updatedData: any) => Promise<void>;
}

export default function WeddingProgramEditor({ isDarkMode = false, accentColor = "#6998EE", onClose, data, onChange, onSave }: WeddingProgramEditorProps) {
  // Initialize from data.weddingProgram
  const getInitialContainers = (): WeddingProgramContainer[] => {
    if (data?.weddingProgram && data.weddingProgram.length > 0) {
      return data.weddingProgram.map((item: any) => ({
        id: item.id,
        title: item.name,
        item: {
          id: item.id,
          name: item.name,
          eventDetails: item.eventDetails,
          place: item.place,
          time: item.time,
          imageVariant: item.imageVariant,
          iconSrc: item.iconSrc
        },
        isExpanded: false
      }));
    }
    return [];
  };
  const [containers, setContainers] = useState<WeddingProgramContainer[]>(getInitialContainers);
  const initialDataSnapshot = useRef(JSON.stringify((data?.weddingProgram || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    eventDetails: item.eventDetails,
    place: item.place,
    time: item.time,
    imageVariant: item.imageVariant,
    iconSrc: item.iconSrc
  }))));
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [timeSlotVariantCount, setTimeSlotVariantCount] = useState(4);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [availableIcons, setAvailableIcons] = useState<string[]>([]);
  const [iconPickerContainerId, setIconPickerContainerId] = useState<string | null>(null);
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
      name: c.item.name,
      eventDetails: c.item.eventDetails,
      place: c.item.place,
      time: c.item.time,
      imageVariant: c.item.imageVariant,
      iconSrc: c.item.iconSrc
    })));
    setHasUnsavedChanges(currentData !== initialDataSnapshot.current);
  }, [containers]);

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

  // Detect available icons from /assets/wed-eve/ folder
  const detectAvailableIcons = async (): Promise<string[]> => {
    const icons: string[] = [];
    for (let i = 1; i <= 50; i++) {
      const padded = String(i).padStart(2, '0');
      const src = `/assets/wed-eve/${padded}.png`;
      const exists = await imageExists(src);
      if (exists) {
        icons.push(src);
      } else {
        break;
      }
    }
    return icons;
  };

  // Detect variants on mount
  useEffect(() => {
    detectTimeSlotVariantCount().then(setTimeSlotVariantCount);
    detectAvailableIcons().then(setAvailableIcons);
  }, []);

  // Helper function to save to data.weddingProgram via onChange
  const saveToData = (containers: WeddingProgramContainer[]) => {
    const programData = containers.map(container => ({
      id: container.item.id,
      name: container.item.name,
      eventDetails: container.item.eventDetails,
      place: container.item.place,
      time: container.item.time,
      imageVariant: container.item.imageVariant,
      iconSrc: container.item.iconSrc
    }));
    onChange?.('weddingProgram' as any, programData);
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
      iconSrc: availableIcons[0] || `/assets/ico-timeslot-1.png`,
    };
    const newContainer: WeddingProgramContainer = {
      id: Date.now().toString(),
      title: "Timeline Event",
      item: newItem,
      isExpanded: false,
    };
    setContainers([...containers, newContainer]);
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
    }
  };

  // Update item field
  const updateItemField = (containerId: string, field: keyof WeddingProgramItem, value: string | number) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, item: { ...c.item, [field]: value } }
        : c
    ));
  };

  // Get the icon source for a container (uses iconSrc if available, falls back to imageVariant)
  const getContainerIconSrc = (container: WeddingProgramContainer) => {
    if (container.item.iconSrc) return container.item.iconSrc;
    return getTimeSlotSrc(container.item.imageVariant);
  };

  // Select icon for a container
  const selectIcon = (containerId: string, iconSrc: string) => {
    updateItemField(containerId, 'iconSrc' as keyof WeddingProgramItem, iconSrc);
    setImageLoadErrors(prev => ({ ...prev, [containerId]: false }));
    setIconPickerContainerId(null);
  };

  return (
    <div className={`w-full h-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Drag indicator toast */}
      {dragToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          style={{ animation: "wp-drag-toast-in 0.2s ease-out" }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-sm shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "wp-drag-grip 1s ease-in-out infinite" }}>
              <line x1="8" y1="6" x2="8" y2="6.01" /><line x1="16" y1="6" x2="16" y2="6.01" /><line x1="8" y1="12" x2="8" y2="12.01" /><line x1="16" y1="12" x2="16" y2="12.01" /><line x1="8" y1="18" x2="8" y2="18.01" /><line x1="16" y1="18" x2="16" y2="18.01" />
            </svg>
            <span className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{dragToast}</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes wp-drag-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes wp-drag-grip {
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
          containers.map((container, idx) => (
            <div
              key={container.id}
              data-wp-idx={idx}
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
                    setDragToast("Drag to reorder program slots");
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
                    const cell = els.find((el: Element) => el.hasAttribute('data-wp-idx'));
                    if (cell) {
                      const overIdx = parseInt(cell.getAttribute('data-wp-idx')!, 10);
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
                      onClick={() => setIconPickerContainerId(container.id)}
                    >
                      {imageLoadErrors[container.id] ? (
                        <div className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          Image
                        </div>
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: isDarkMode ? "#D1D5DB" : "#374151",
                            WebkitMaskImage: `url(${getContainerIconSrc(container)})`,
                            maskImage: `url(${getContainerIconSrc(container)})`,
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskPosition: 'center',
                          }}
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

      {/* Icon Picker Dialog */}
      {iconPickerContainerId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIconPickerContainerId(null)}
        >
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Select Icon
            </h3>
            {availableIcons.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                No icons found in /assets/wed-eve/
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {availableIcons.map((iconSrc) => (
                  <button
                    key={iconSrc}
                    onClick={() => selectIcon(iconPickerContainerId, iconSrc)}
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center p-2 transition-all hover:scale-105 ${
                      isDarkMode ? "border-gray-600 hover:border-gray-400" : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{
                      ...(getContainerIconSrc(containers.find(c => c.id === iconPickerContainerId)!) === iconSrc
                        ? { borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }
                        : {})
                    }}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: isDarkMode ? "#D1D5DB" : "#374151",
                        WebkitMaskImage: `url(${iconSrc})`,
                        maskImage: `url(${iconSrc})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setIconPickerContainerId(null)}
              className={`mt-4 w-full px-4 py-2 border rounded-lg text-sm transition-colors ${
                isDarkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
