import { useState, useRef, useEffect } from "react";
import FloatingActionMenu from "../shared/FloatingActionMenu";
import type { ChecklistItem, ChecklistContainer } from "@/lib/types/invitation";

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface ChecklistEditorProps {
  isDarkMode?: boolean;
  accentColor?: string;
  showNumbers?: boolean;
  highlightItemId?: string | null;
  initialExpandedContainerId?: string | null;
  initialData?: ChecklistContainer[];
  onChange?: (data: ChecklistContainer[]) => void;
  onClose: () => void;
}

let idCounter = 0;
const genId = () => `default-${idCounter++}`;

function getDefaultChecklist(): ChecklistContainer[] {
  const makeItems = (names: string[]): ChecklistItem[] =>
    names.map((name) => ({ id: genId(), name, checked: false }));

  return [
    {
      id: genId(),
      title: "12+ Months Before",
      items: makeItems([
        "Set a budget",
        "Choose a wedding date",
        "Book the ceremony & reception venue",
        "Hire a wedding planner (optional)",
        "Send save-the-dates",
        "Start guest list",
      ]),
    },
    {
      id: genId(),
      title: "8-12 Months Before",
      items: makeItems([
        "Book photographer/videographer",
        "Book caterer",
        "Book florist",
        "Book entertainment/DJ/band",
        "Choose wedding party (entourage)",
        "Start dress shopping",
        "Book officiant",
      ]),
    },
    {
      id: genId(),
      title: "6-8 Months Before",
      items: makeItems([
        "Order wedding invitations",
        "Book transportation",
        "Book honeymoon",
        "Choose bridesmaid dresses",
        "Choose groom/groomsmen attire",
        "Book hair & makeup artist",
        "Plan rehearsal dinner",
      ]),
    },
    {
      id: genId(),
      title: "4-6 Months Before",
      items: makeItems([
        "Mail invitations",
        "Order wedding rings",
        "Book wedding cake",
        "Finalize menu & drinks",
        "Arrange accommodations for out-of-town guests",
        "Buy wedding favors",
      ]),
    },
    {
      id: genId(),
      title: "2-3 Months Before",
      items: makeItems([
        "Apply for marriage license",
        "Finalize guest count",
        "Create wedding day timeline",
        "Confirm all vendors",
        "Final dress fitting",
        "Arrange seating plan",
      ]),
    },
    {
      id: genId(),
      title: "1 Month Before",
      items: makeItems([
        "Final headcount to caterer",
        "Confirm honeymoon details",
        "Pack for honeymoon",
        "Prepare wedding day emergency kit",
        "Confirm rehearsal dinner details",
      ]),
    },
    {
      id: genId(),
      title: "1 Week Before",
      items: makeItems([
        "Final vendor confirmations",
        "Prepare payments/tips for vendors",
        "Break in wedding shoes",
        "Get marriage license",
        "Confirm wedding party details",
      ]),
    },
    {
      id: genId(),
      title: "Day Before",
      items: makeItems([
        "Rehearsal & rehearsal dinner",
        "Get beauty rest",
        "Pack wedding day bag",
      ]),
    },
  ];
}

export default function ChecklistEditor({ isDarkMode = false, accentColor = "#6998EE", showNumbers = false, highlightItemId = null, initialExpandedContainerId = null, initialData, onChange, onClose }: ChecklistEditorProps) {
  // Expand/collapse is local UI state only — never persisted. Resets to
  // all-collapsed every time the editor opens. Expanding a container also
  // reveals its rename/delete buttons and editable items (replaces the old
  // edit mode).
  const [expandedContainerId, setExpandedContainerId] = useState<string | null>(initialExpandedContainerId);
  // Initialize from initialData prop, fallback to localStorage, then defaults.
  // Strip isExpanded from loaded data so it doesn't get persisted.
  const getInitialContainers = (): ChecklistContainer[] => {
    if (initialData && initialData.length > 0) {
      return initialData.map((c: ChecklistContainer) => { const { isExpanded, ...rest } = c; return rest; });
    }
    try {
      const stored = localStorage.getItem('weddingChecklist');
      if (stored) {
        return JSON.parse(stored).map((c: ChecklistContainer) => { const { isExpanded, ...rest } = c; return rest; });
      }
    } catch (error) {
      console.error('Failed to load initial checklist:', error);
    }
    return getDefaultChecklist();
  };
  const [containers, setContainers] = useState<ChecklistContainer[]>(getInitialContainers);
  const initialDataSnapshot = useRef(JSON.stringify(getInitialContainers()));
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(highlightItemId);
  // Pending container deletion (styled confirmation dialog instead of native confirm)
  const [pendingDeleteContainer, setPendingDeleteContainer] = useState<ChecklistContainer | null>(null);
  // Pending item deletion (styled confirmation dialog)
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{ containerId: string; item: ChecklistItem } | null>(null);
  // Add container dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistItems, setNewChecklistItems] = useState<ChecklistItem[]>([]);

  // Scroll to + glow highlighted item on mount
  useEffect(() => {
    if (!highlightItemId) return;
    setActiveHighlightId(highlightItemId);
    const timer = setTimeout(() => setActiveHighlightId(null), 4000);
    // Scroll to the item
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-item-id="${highlightItemId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    return () => clearTimeout(timer);
  }, [highlightItemId]);
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
    setHasUnsavedChanges(JSON.stringify(containers) !== initialDataSnapshot.current);
  }, [containers]);

  // Helper function to save to localStorage (cache) and notify parent.
  // Strip isExpanded so expand/collapse state is never persisted.
  const saveData = (data: ChecklistContainer[]) => {
    const clean = data.map(c => { const { isExpanded, ...rest } = c; return rest; });
    try {
      localStorage.setItem('weddingChecklist', JSON.stringify(clean));
    } catch (error) {
      console.error('Failed to save checklist to localStorage:', error);
    }
    if (onChange) {
      onChange(clean);
    }
  };

  // Handle close - auto-apply pending changes, no save prompt
  const handleClose = () => {
    if (hasUnsavedChanges) {
      saveData(containers);
    }
    onClose();
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

  // Add new container — opens dialog
  const addContainer = () => {
    if (containers.length >= 15) {
      alert("Maximum of 15 checklists allowed");
      return;
    }
    setNewChecklistTitle("New Checklist");
    setNewChecklistItems([]);
    setShowAddDialog(true);
  };

  // Add item to the new checklist in dialog
  const addDialogItem = () => {
    if (newChecklistItems.length >= 20) {
      alert("Maximum of 20 items per checklist");
      return;
    }
    setNewChecklistItems([...newChecklistItems, { id: Date.now().toString(), name: "", checked: false, deadline: "" }]);
  };

  // Confirm add container from dialog
  const confirmAddContainer = () => {
    const title = newChecklistTitle.trim() || "New Checklist";
    const newContainer: ChecklistContainer = {
      id: Date.now().toString(),
      title,
      items: newChecklistItems,
    };
    setContainers([...containers, newContainer]);
    setShowAddDialog(false);
    setNewChecklistTitle("");
    setNewChecklistItems([]);
  };

  // Save is disabled until the default "New Checklist" title is renamed
  const canSaveChecklist = newChecklistTitle.trim() !== "New Checklist" && newChecklistTitle.trim() !== "";

  // Delete container — opens styled confirmation dialog
  const deleteContainer = (containerId: string) => {
    const container = containers.find(c => c.id === containerId);
    if (container) setPendingDeleteContainer(container);
  };

  // Confirm container deletion
  const confirmDeleteContainer = () => {
    if (pendingDeleteContainer) {
      setContainers(containers.filter(c => c.id !== pendingDeleteContainer.id));
      if (expandedContainerId === pendingDeleteContainer.id) setExpandedContainerId(null);
    }
    setPendingDeleteContainer(null);
  };

  // Toggle container expansion (accordion behavior - only one expanded at a time).
  // Uses local UI state only — never persisted.
  const toggleContainer = (containerId: string) => {
    setExpandedContainerId(prev => prev === containerId ? null : containerId);
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
      deadline: "",
    };
    setContainers(containers.map(c => 
      c.id === containerId ? { ...c, items: [...c.items, newItem] } : c
    ));
  };

  // Delete item — opens styled confirmation dialog
  const deleteItem = (containerId: string, itemId: string) => {
    const container = containers.find(c => c.id === containerId);
    const item = container?.items.find(i => i.id === itemId);
    if (item) setPendingDeleteItem({ containerId, item });
  };

  // Confirm item deletion
  const confirmDeleteItem = () => {
    if (pendingDeleteItem) {
      const { containerId, item } = pendingDeleteItem;
      setContainers(containers.map(c =>
        c.id === containerId ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c
      ));
    }
    setPendingDeleteItem(null);
  };

  // Update item name
  const updateItemName = (containerId: string, itemId: string, name: string) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, name } : i) }
        : c
    ));
  };

  // Toggle item checkbox
  const toggleItemCheck = (containerId: string, itemId: string) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
        : c
    ));
  };

  // Update item deadline
  const updateItemDeadline = (containerId: string, itemId: string, deadline: string) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, deadline } : i) }
        : c
    ));
  };

  // Format deadline for display (M/D/YY)
  const formatDeadline = (deadline: string): string => {
    if (!deadline) return "";
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return "";
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(2)}`;
  };

  return (
    <div className={`w-full h-dvh rounded-2xl flex flex-col overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Drag indicator toast */}
      {dragToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          style={{ animation: "cl-drag-toast-in 0.2s ease-out" }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-sm shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "cl-drag-grip 1s ease-in-out infinite" }}>
              <line x1="8" y1="6" x2="8" y2="6.01" /><line x1="16" y1="6" x2="16" y2="6.01" /><line x1="8" y1="12" x2="8" y2="12.01" /><line x1="16" y1="12" x2="16" y2="12.01" /><line x1="8" y1="18" x2="8" y2="18.01" /><line x1="16" y1="18" x2="16" y2="18.01" />
            </svg>
            <span className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{dragToast}</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes cl-drag-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes cl-drag-grip {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes cl-highlight-pulse {
          0% { text-shadow: 0 0 0 ${accentColor}, 0 0 10px ${hexToRgba(accentColor, 0.9)}, 0 0 4px ${hexToRgba(accentColor, 0.6)}; transform: scale(1); }
          40% { text-shadow: 0 0 0 ${accentColor}, 0 0 12px ${hexToRgba(accentColor, 0.6)}, 0 0 4px ${hexToRgba(accentColor, 0.4)}; transform: scale(1.08); }
          100% { text-shadow: 0 0 0 transparent, 0 0 0 transparent; transform: scale(1); }
        }
        .checklist-item-highlight {
          animation: cl-highlight-pulse 1.5s ease-in-out 1;
        }
      `}</style>
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
                style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
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
          containers.map((container, idx) => (
            <div
              key={container.id}
              data-cl-idx={idx}
              onMouseEnter={() => setHoveredContainer(container.id)}
              onMouseLeave={() => setHoveredContainer(null)}
              className={`border rounded-xl overflow-hidden transition-all duration-300`}
              style={{
                backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
                borderColor: hoveredContainer === container.id ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
                ...(expandedContainerId === container.id ? {
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
                    setDragToast("Drag to reorder checklists");
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
                    const cell = els.find((el: Element) => el.hasAttribute('data-cl-idx'));
                    if (cell) {
                      const overIdx = parseInt(cell.getAttribute('data-cl-idx')!, 10);
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
                  {expandedContainerId === container.id ? (
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
                  <div className="flex items-center justify-between">
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
                    {expandedContainerId !== container.id && (
                      <p className="text-xs text-gray-400">{showNumbers ? getContainerProgress(container) : `${getContainerPercentage(container)}%`}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {expandedContainerId === container.id && (
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
              {expandedContainerId === container.id && (
                <div className={`p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"} border-t`}
                  style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                  {container.items.length === 0 ? (
                    <p className={`text-sm text-center py-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      List is empty
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {container.items.map((item, itemIdx) => (
                        <div
                          key={item.id}
                          data-item-id={item.id}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium shrink-0 w-5 text-right ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                              {itemIdx + 1}.
                            </span>
                            <div className="flex-1 flex items-center gap-1">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItemName(container.id, item.id, e.target.value)}
                                className={`flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${activeHighlightId === item.id ? "checklist-item-highlight" : ""}`}
                                style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                                placeholder="Item name"
                              />
                            </div>
                            <button
                              onClick={() => deleteItem(container.id, item.id)}
                              className={`p-1 rounded transition-colors shrink-0 ${isDarkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-200 text-red-500"}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 ml-7 mt-1">
                            <label className={`text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>Deadline</label>
                            <input
                              type="date"
                              value={item.deadline || ""}
                              onChange={(e) => updateItemDeadline(container.id, item.id, e.target.value)}
                              className={`px-2 py-1 text-xs rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                              style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", colorScheme: isDarkMode ? "dark" : "light" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add item button - shown when container is expanded */}
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => addItem(container.id)}
                      className="px-4 py-2 text-sm text-center rounded-lg transition-colors"
                      style={{ color: accentColor, backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
                    >
                      + Add item
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        <div className="h-8"></div>
      </div>

      {/* Delete Container Confirmation Dialog */}
      {pendingDeleteContainer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setPendingDeleteContainer(null)}>
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Delete Checklist
            </h3>
            <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Are you sure you want to delete "{pendingDeleteContainer.title}"?
            </p>
            <p className="text-red-500 text-xs mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingDeleteContainer(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: isDarkMode ? "#374151" : "#E5E7EB", color: isDarkMode ? "#9CA3AF" : "#6B7280", fontFamily: "Inter, sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteContainer}
                className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: "#EF4444", fontFamily: "Inter, sans-serif" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Dialog */}
      {pendingDeleteItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setPendingDeleteItem(null)}>
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Delete Task
            </h3>
            <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Are you sure you want to delete "{pendingDeleteItem.item.name || "this task"}"?
            </p>
            <p className="text-red-500 text-xs mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingDeleteItem(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: isDarkMode ? "#374151" : "#E5E7EB", color: isDarkMode ? "#9CA3AF" : "#6B7280", fontFamily: "Inter, sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: "#EF4444", fontFamily: "Inter, sans-serif" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Checklist Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowAddDialog(false)}>
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              Add Checklist
            </h3>
            {/* Checklist name (editable, click to rename) */}
            <div className="mb-4">
              <input
                type="text"
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                style={{ backgroundColor: "transparent" }}
                placeholder="Checklist name"
                autoFocus
              />
            </div>
            {/* Items */}
            {newChecklistItems.length > 0 && (
              <div className="space-y-2 mb-2">
                {newChecklistItems.map((item, itemIdx) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium shrink-0 w-5 text-right ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {itemIdx + 1}.
                      </span>
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => setNewChecklistItems(newChecklistItems.map((it, i) => i === itemIdx ? { ...it, name: e.target.value } : it))}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                          placeholder="Item name"
                        />
                      </div>
                      <button
                        onClick={() => setNewChecklistItems(newChecklistItems.filter((_, i) => i !== itemIdx))}
                        className={`p-1 rounded transition-colors shrink-0 ${isDarkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-200 text-red-500"}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 ml-7 mt-1">
                      <label className={`text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Deadline</label>
                      <input
                        type="date"
                        value={item.deadline || ""}
                        onChange={(e) => setNewChecklistItems(newChecklistItems.map((it, i) => i === itemIdx ? { ...it, deadline: e.target.value } : it))}
                        className={`px-2 py-1 text-xs rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                        style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", colorScheme: isDarkMode ? "dark" : "light" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Add item button */}
            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={addDialogItem}
                className="w-full px-4 py-2 text-sm text-center rounded-lg font-medium transition-colors"
                style={{ color: accentColor, backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
              >
                + Add item
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowAddDialog(false)}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: isDarkMode ? "#374151" : "#E5E7EB", color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmAddContainer}
                disabled={!canSaveChecklist}
                className="w-full px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: accentColor }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Menu */}
      <FloatingActionMenu
        accentColor={accentColor}
        isDarkMode={isDarkMode}
        options={[
          { label: "Add item", icon: "plus", onClick: addContainer },
        ]}
      />

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
