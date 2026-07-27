import { useState, useRef, useEffect } from "react";

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface BudgetItem {
  id: string;
  name: string;
  budget: string;
  cost: string;
  paid: string;
  due: string;
}

interface BudgetContainer {
  id: string;
  title: string;
  items: BudgetItem[];
  isExpanded: boolean;
}

interface BudgetEditorProps {
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
}

export default function BudgetEditor({ isDarkMode = false, accentColor = "#6998EE", onClose }: BudgetEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  // Initialize from localStorage directly
  const getInitialContainers = (): BudgetContainer[] => {
    try {
      const stored = localStorage.getItem('weddingBudget');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load initial budget:', error);
    }
    return [];
  };
  const [containers, setContainers] = useState<BudgetContainer[]>(getInitialContainers);
  const initialDataSnapshot = useRef(JSON.stringify(getInitialContainers()));
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
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
    setHasUnsavedChanges(JSON.stringify(containers) !== initialDataSnapshot.current);
  }, [containers]);

  // Helper function to save to localStorage
  const saveToLocalStorage = (data: BudgetContainer[]) => {
    try {
      localStorage.setItem('weddingBudget', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save budget to localStorage:', error);
      throw error;
    }
  };

  // Handle close - auto-apply pending changes, no save prompt
  const handleClose = () => {
    if (hasUnsavedChanges) {
      saveToLocalStorage(containers);
    }
    onClose();
  };

  // Calculate balance for an item
  const getItemBalance = (item: BudgetItem): number => {
    const cost = parseFloat(item.cost) || parseFloat(item.budget) || 0;
    const paid = parseFloat(item.paid) || 0;
    return cost - paid;
  };

  // Calculate paid percentage for an item
  const getItemBalancePercentage = (item: BudgetItem): number => {
    const cost = parseFloat(item.cost) || parseFloat(item.budget) || 0;
    const paid = parseFloat(item.paid) || 0;
    if (cost === 0) return 0;
    return Math.round((paid / cost) * 100);
  };

  // Get display cost (actual cost if available, otherwise budget)
  const getDisplayCost = (item: BudgetItem): string => {
    return item.cost || item.budget || "0";
  };

  // Calculate total budget across all items
  const getTotalBudget = (): number => {
    return containers.flatMap(c => c.items).reduce((sum, item) => {
      return sum + (parseFloat(item.cost) || parseFloat(item.budget) || 0);
    }, 0);
  };

  // Calculate total paid across all items
  const getTotalPaid = (): number => {
    return containers.flatMap(c => c.items).reduce((sum, item) => {
      return sum + (parseFloat(item.paid) || 0);
    }, 0);
  };

  // Calculate total balance across all items
  const getTotalBalance = (): number => {
    return containers.flatMap(c => c.items).reduce((sum, item) => {
      return sum + getItemBalance(item);
    }, 0);
  };

  // Calculate overall progress percentage
  const getProgressPercentage = (): number => {
    const totalBudget = getTotalBudget();
    const totalPaid = getTotalPaid();
    if (totalBudget === 0) return 0;
    return Math.round((totalPaid / totalBudget) * 100);
  };

  // Get color based on percentage (10% increments, 100% = green)
  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 100) return "#10B981"; // Green (success)
    if (percentage >= 90) return "#34D399"; // Light green
    if (percentage >= 80) return "#6EE7B7"; // Very light green
    if (percentage >= 70) return "#A7F3D0"; // Pale green
    if (percentage >= 60) return "#FCD34D"; // Yellow
    if (percentage >= 50) return "#FBBF24"; // Amber
    if (percentage >= 40) return "#F59E0B"; // Orange
    if (percentage >= 30) return "#F97316"; // Dark orange
    if (percentage >= 20) return "#EF4444"; // Red-orange
    if (percentage >= 10) return "#DC2626"; // Red
    return "#B91C1C"; // Dark red (0-10%)
  };

  // Add new container
  const addContainer = () => {
    if (containers.length >= 30) {
      alert("Maximum of 30 budget items allowed");
      return;
    }
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      name: "New Item",
      budget: "",
      cost: "",
      paid: "",
      due: "",
    };
    const newContainer: BudgetContainer = {
      id: Date.now().toString(),
      title: "New Item",
      items: [newItem],
      isExpanded: false,
    };
    setContainers([...containers, newContainer]);
  };

  // Delete container
  const deleteContainer = (containerId: string) => {
    const container = containers.find(c => c.id === containerId);
    if (container && container.items.length > 0) {
      if (!confirm("This budget item contains data. Are you sure you want to delete it?")) {
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
  const startEditingTitle = (container: BudgetContainer) => {
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

  // Update item field
  const updateItemField = (containerId: string, itemId: string, field: keyof BudgetItem, value: string) => {
    setContainers(containers.map(c => 
      c.id === containerId 
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) }
        : c
    ));
  };

  // Update item name
  const updateItemName = (containerId: string, itemId: string, name: string) => {
    updateItemField(containerId, itemId, 'name', name);
  };

  // Update item budget
  const updateItemBudget = (containerId: string, itemId: string, budget: string) => {
    updateItemField(containerId, itemId, 'budget', budget);
  };

  // Update item cost
  const updateItemCost = (containerId: string, itemId: string, cost: string) => {
    updateItemField(containerId, itemId, 'cost', cost);
  };

  // Update item paid
  const updateItemPaid = (containerId: string, itemId: string, paid: string) => {
    updateItemField(containerId, itemId, 'paid', paid);
  };

  // Update item due
  const updateItemDue = (containerId: string, itemId: string, due: string) => {
    updateItemField(containerId, itemId, 'due', due);
  };

  return (
    <div className={`w-full h-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Drag indicator toast */}
      {dragToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          style={{ animation: "be-drag-toast-in 0.2s ease-out" }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-sm shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "be-drag-grip 1s ease-in-out infinite" }}>
              <line x1="8" y1="6" x2="8" y2="6.01" /><line x1="16" y1="6" x2="16" y2="6.01" /><line x1="8" y1="12" x2="8" y2="12.01" /><line x1="16" y1="12" x2="16" y2="12.01" /><line x1="8" y1="18" x2="8" y2="18.01" /><line x1="16" y1="18" x2="16" y2="18.01" />
            </svg>
            <span className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{dragToast}</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes be-drag-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes be-drag-grip {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
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
                Budget List
              </h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Track your wedding expenses
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
              WebkitMaskImage: "url(/assets/ico-budget.png)",
              WebkitMaskSize: "contain",
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url(/assets/ico-budget.png)",
              maskSize: "contain",
              maskPosition: "center",
              maskRepeat: "no-repeat"
            }} />
            <div>
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Budget Overview
              </h3>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {getTotalPaid().toLocaleString()} / {getTotalBudget().toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-sm font-medium" style={{ fontFamily: "Inter, sans-serif", color: getPercentageColor(getProgressPercentage()) }}>
            ({getProgressPercentage()}%)
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: isDarkMode ? "#374151" : "#E5E7EB" }}>
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${getProgressPercentage()}%`,
              backgroundColor: accentColor
            }}
          />
        </div>
        {/* Summary stats */}
        <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
          • Cost: {getTotalBudget().toLocaleString()}   • Paid: {getTotalPaid().toLocaleString()} • Balance: {getTotalBalance().toLocaleString()}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ fontFamily: "Inter, sans-serif" }}>
        {containers.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            <p className="text-sm">No budget items yet</p>
          </div>
        ) : (
          containers.map((container, idx) => (
            <div
              key={container.id}
              data-be-idx={idx}
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
                    setDragToast("Drag to reorder budget items");
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
                    const cell = els.find((el: Element) => el.hasAttribute('data-be-idx'));
                    if (cell) {
                      const overIdx = parseInt(cell.getAttribute('data-be-idx')!, 10);
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
                  {/* Preview when collapsed */}
                  {!container.isExpanded && container.items.length > 0 && (
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {container.items.map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span>• Cost: {getDisplayCost(item)}      • Balance: {getItemBalance(item).toLocaleString()}</span>
                            <span style={{ color: getPercentageColor(getItemBalancePercentage(item)) }}>({getItemBalancePercentage(item)}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>• Paid: {item.paid || "0"}      • Deadline: {item.due || "TBD"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

              {/* Container Items - Input fields */}
              {container.isExpanded && (
                <div className={`p-4 space-y-4 ${isEditMode ? (isDarkMode ? "border-gray-700" : "border-gray-100") : "border-transparent"} border-t`}
                  style={isEditMode ? (isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }) : { backgroundColor: "transparent" }}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>BUDGET</label>
                        <input
                          type="text"
                          value={container.items[0]?.budget || ""}
                          onChange={(e) => updateItemBudget(container.id, container.items[0]?.id || "", e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isEditMode ? (isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) : {}}
                          placeholder="Expected cost"
                          disabled={!isEditMode}
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>COST</label>
                        <input
                          type="text"
                          value={container.items[0]?.cost || ""}
                          onChange={(e) => updateItemCost(container.id, container.items[0]?.id || "", e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isEditMode ? (isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) : {}}
                          placeholder="Actual cost"
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>PAID</label>
                        <input
                          type="text"
                          value={container.items[0]?.paid || ""}
                          onChange={(e) => updateItemPaid(container.id, container.items[0]?.id || "", e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isEditMode ? (isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) : {}}
                          placeholder="Amount paid"
                          disabled={!isEditMode}
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>DUE</label>
                        <input
                          type="text"
                          value={container.items[0]?.due || ""}
                          onChange={(e) => updateItemDue(container.id, container.items[0]?.id || "", e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isEditMode ? (isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) : {}}
                          placeholder="Deadline"
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>BALANCE</label>
                      <div className={`px-3 py-2 text-sm rounded-lg ${isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                        {container.items[0] ? getItemBalance(container.items[0]).toLocaleString() : "0"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        <div className="h-8"></div>
        
        {/* Edit/Add Item button */}
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
              + Add Item
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
            Edit Budget
          </button>
        )}
      </div>

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
