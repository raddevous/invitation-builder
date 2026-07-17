import { useState, useRef, useEffect } from "react";
import type { InvitationData } from "@/lib/types/invitation";

interface TableMapEditorProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  onImmediateSave?: (updatedData: InvitationData) => Promise<void>;
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
}

interface Table {
  id: string;
  type: 'round' | 'rectangular' | 'square' | 'dance-floor' | 'buffet' | 'other-table' | 'dessert-display' | 'stage' | 'entrance' | 'door';
  name: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  rotation: number;
  chairCount: number;
  chairType?: 'chair-1' | 'chair-2' | 'chair-3' | 'chair-4' | 'chair-5' | 'chair-6';
  hasHeadOfTable?: boolean;
  imageUrl?: string;
  guestAssignments?: string[];
  locked?: boolean;
  doorColorMode?: 0 | 1 | 2 | 3;
  roundedCorners?: boolean;
  cornerRadius?: number;
  flipVertically?: boolean;
  flipHorizontally?: boolean;
  shape?: 'circular' | 'rectangular';
}

interface VenueLayout {
  baseShape: 'rectangle' | 'circle' | 'square';
  dimensions: { width: number; height: number };
  cutouts: Array<{ x: number; y: number; width: number; height: number; shape: 'rectangle' | 'circle' }>;
  doors: Array<{
    id: string;
    type: 'entrance' | 'exit';
    position: { x: number; y: number };
    rotation: number;
    label?: string;
  }>;
  tables: Table[];
  isLocked?: boolean;
  gridDensity?: number;
  floorColor?: string;
  gridColor?: string;
  tableColor?: string;
  tableTextColor?: string;
  chairColor?: string;
  outlineColor?: string;
  tableScale?: number;
  doorColorMode?: 0 | 1;
}

const DANCE_FLOOR_LOGO_VALUE = '__dance_floor_logo__';
const DANCE_FLOOR_INITIAL_VALUE = '__dance_floor_initial__';
const DANCE_FLOOR_OTHER_DANCE_URL = '/assets/ico-mapping-other-custom.png';
const DANCE_FLOOR_NO_ICON_URL = '/assets/ico-no.png';

// Helper functions for chair color transparency
const parseColor = (color: string): { r: number; g: number; b: number; a: number } | null => {
  if (!color) return null;
  const hex = /^#([0-9a-f]{3,8})$/i.exec(color);
  if (hex) {
    const h = hex[1];
    if (h.length === 6 || h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
      };
    }
    if (h.length === 3) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
        a: 1
      };
    }
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)$/i.exec(color);
  if (rgb) {
    return {
      r: parseInt(rgb[1], 10),
      g: parseInt(rgb[2], 10),
      b: parseInt(rgb[3], 10),
      a: rgb[4] ? parseFloat(rgb[4]) : 1
    };
  }
  return null;
};

const toHex = (color: string): string => {
  const c = parseColor(color);
  if (!c) return '#000000';
  const r = c.r.toString(16).padStart(2, '0');
  const g = c.g.toString(16).padStart(2, '0');
  const b = c.b.toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

const toRgba = (color: string, alpha: number): string => {
  const c = parseColor(color);
  if (!c) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
};

const getAlpha = (color: string): number => {
  const c = parseColor(color);
  return c ? c.a : 1;
};

export default function TableMapEditor({ data, onChange, onImmediateSave, isDarkMode = true, accentColor = "#2563EB", onClose }: TableMapEditorProps) {
  const defaultOutlineColor = toRgba(data.mainColor1 || '#454545', 1);
  const initialVenueLayout = data.venueLayout ? {
    ...data.venueLayout,
    outlineColor: data.venueLayout.outlineColor || defaultOutlineColor,
    doorColorMode: data.venueLayout.doorColorMode ?? 0,
    tables: (data.venueLayout.tables || []).map(table =>
      table.type === 'dance-floor' && !table.imageUrl ? { ...table, imageUrl: DANCE_FLOOR_OTHER_DANCE_URL } : table
    )
  } : {
    baseShape: 'rectangle',
    dimensions: { width: 300, height: 200 },
    cutouts: [],
    doors: [],
    tables: [],
    isLocked: false,
    tableTextColor: '#000000',
    outlineColor: defaultOutlineColor,
    doorColorMode: 0
  };
  const [venueLayout, setVenueLayout] = useState<VenueLayout>(initialVenueLayout as VenueLayout);
  const [isEditDisabled, setIsEditDisabled] = useState(venueLayout.isLocked || false);

  // Sync isEditDisabled with venueLayout.isLocked when data changes
  useEffect(() => {
    if (data.venueLayout?.isLocked !== undefined) {
      setIsEditDisabled(data.venueLayout.isLocked);
    }
  }, [data.venueLayout?.isLocked]);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draggedItemType, setDraggedItemType] = useState<string | null>(null);

  // Preload chair images
  const chairImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const chairColorTempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chairImagesLoaded, setChairImagesLoaded] = useState(false);
  useEffect(() => {
    const chairTypes = ['02', '03', '04', '05', '06'];
    let loadedCount = 0;
    const totalChairs = chairTypes.length;
    
    chairTypes.forEach(type => {
      const img = new Image();
      img.src = `/assets/ico-mapping-chair-${type}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalChairs) {
          setChairImagesLoaded(true);
        }
      };
      chairImagesRef.current[type] = img;
    });
  }, []);

  // Preload display table images
  const displayImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const displayIconTempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const displayIcons = [
      '/assets/ico-mapping-mini-round-pastry.png',
      '/assets/ico-mapping-mini-round-gift.png',
      '/assets/ico-mapping-mini-round-cake.png',
      '/assets/ico-mapping-mini-round-dessert.png',
      '/assets/ico-mapping-other-newwed.png',
      '/assets/ico-mapping-other-dance.png',
      DANCE_FLOOR_OTHER_DANCE_URL,
    ];
    displayIcons.forEach(src => {
      const img = new Image();
      img.src = src;
      displayImagesRef.current[src] = img;
    });
  }, []);

  // Preload celebrant logo for dance floor display icon
  useEffect(() => {
    if (data.heroIcon && data.heroIcon.trim() !== '') {
      const img = new Image();
      img.src = data.heroIcon;
      img.onload = () => {
        setVenueLayout(prev => ({ ...prev }));
      };
      displayImagesRef.current[data.heroIcon] = img;
    }
  }, [data.heroIcon]);

  const handleDragStart = (e: React.DragEvent, type: string) => {
    setDraggedItemType(type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedItemType(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItemType) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTable = {
      id: Date.now().toString(),
      type: draggedItemType as 'round' | 'rectangular' | 'square' | 'dance-floor' | 'buffet' | 'other-table' | 'dessert-display' | 'stage' | 'entrance' | 'door',
      name: draggedItemType === 'entrance' ? 'Entrance' : (draggedItemType === 'door' ? 'Door' : ''),
      position: { x, y },
      dimensions: getDefaultDimensions(draggedItemType),
      rotation: 0,
      chairCount: getDefaultChairCount(draggedItemType),
      chairType: 'chair-1' as const,
      hasHeadOfTable: true,
      locked: false,
      imageUrl: draggedItemType === 'dessert-display' ? '/assets/ico-mapping-mini-round-pastry.png' : (draggedItemType === 'dance-floor' ? DANCE_FLOOR_OTHER_DANCE_URL : undefined),
      shape: draggedItemType === 'dance-floor' ? 'rectangular' as const : undefined,
      cornerRadius: draggedItemType === 'dance-floor' ? 0 : undefined,
    };

    setVenueLayout(prev => {
      const newLayout = {
        ...prev,
        tables: [...prev.tables, newTable]
      };
      saveToHistory(newLayout);
      return newLayout;
    });

    setDraggedItemType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const getDefaultDimensions = (type: string) => {
    switch (type) {
      case 'round': return { width: 70, height: 70 };
      case 'rectangular': return { width: 120, height: 40 };
      case 'square': return { width: 60, height: 60 };
      case 'dance-floor': return { width: 120, height: 80 };
      case 'buffet': return { width: 120, height: 25 };
      case 'other-table': return { width: 120, height: 25 };
      case 'dessert-display': return { width: 40, height: 40 };
      case 'stage': return { width: 150, height: 60 };
      case 'entrance': return { width: 60, height: 30 };
      case 'door': return { width: 30, height: 30 };
      default: return { width: 70, height: 70 };
    }
  };

  const getDefaultChairCount = (type: string) => {
    switch (type) {
      case 'round': return 6;
      case 'rectangular': return 12;
      case 'square': return 4;
      case 'dance-floor': return 0;
      case 'buffet': return 0;
      case 'other-table': return 0;
      case 'dessert-display': return 0;
      case 'stage': return 0;
      case 'entrance': return 0;
      case 'door': return 0;
      default: return 6;
    }
  };
  useEffect(() => {
    const currentLayout = JSON.stringify(venueLayout);
    const originalLayout = JSON.stringify(data.venueLayout);
    setHasUnsavedChanges(currentLayout !== originalLayout);
  }, [venueLayout, data.venueLayout]);
  const [showControls, setShowControls] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCutout, setSelectedCutout] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showBaseLayoutDropdown, setShowBaseLayoutDropdown] = useState(false);
  const [showCutoutDropdown, setShowCutoutDropdown] = useState(false);
  const [cutoutShape, setCutoutShape] = useState<'rectangle' | 'circle'>('rectangle');
  const [isDeletingCutout, setIsDeletingCutout] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [expandedColorSection, setExpandedColorSection] = useState<'floor' | 'grid' | 'table' | 'chair' | 'outline' | 'door' | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, right: 'auto' as 'auto' | number });
  const [customColors, setCustomColors] = useState({
    floor: data.venueLayout?.floorColor || (isDarkMode ? '#d1d5db' : '#1f2937'),
    grid: data.venueLayout?.gridColor || (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
    table: data.venueLayout?.tableColor || '#ffffff',
    tableText: (data.venueLayout as any)?.tableTextColor || '#000000',
    chair: toHex((data.venueLayout as any)?.chairColor || '#ffffff'),
    outline: toHex((data.venueLayout as any)?.outlineColor || (data.mainColor1 || '#454545'))
  });
  const [showGridSlider, setShowGridSlider] = useState(false);
  const [gridDensity, setGridDensity] = useState(data.venueLayout?.gridDensity || 50);
  const [showResizeSlider, setShowResizeSlider] = useState(false);
  const [tableScale, setTableScale] = useState(data.venueLayout?.tableScale || 100);
  const [sliderPosition, setSliderPosition] = useState({ left: 0, right: 'auto' as 'auto' | number });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  // Undo/Redo state
  const [history, setHistory] = useState<any[]>([]);
  const [future, setFuture] = useState<any[]>([]);
  const MAX_HISTORY = 50;
  
  // Helper function to save state to history
  const saveToHistory = (newLayout: any) => {
    setHistory(prev => {
      const newHistory = [...prev, JSON.parse(JSON.stringify(newLayout))];
      return newHistory.slice(-MAX_HISTORY);
    });
    setFuture([]); // Clear future when new action is performed
  };
  
  // Undo function
  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setFuture(prev => [...prev, JSON.parse(JSON.stringify(venueLayout))]);
    setHistory(prev => prev.slice(0, -1));
    setVenueLayout(previousState);
    // Update derived states
    setGridDensity(previousState.gridDensity || 50);
    setTableScale(previousState.tableScale || 100);
    setCustomColors({
      floor: previousState.floorColor || (isDarkMode ? '#d1d5db' : '#1f2937'),
      grid: previousState.gridColor || (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
      table: previousState.tableColor || '#ffffff',
      tableText: previousState.tableTextColor || '#000000',
      chair: toHex(previousState.chairColor || '#ffffff'),
      outline: toHex(previousState.outlineColor || (isDarkMode ? '#ffffff' : '#000000'))
    });
  };
  
  // Redo function
  const handleRedo = () => {
    if (future.length === 0) return;
    const nextState = future[future.length - 1];
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(venueLayout))]);
    setFuture(prev => prev.slice(0, -1));
    setVenueLayout(nextState);
    // Update derived states
    setGridDensity(nextState.gridDensity || 50);
    setTableScale(nextState.tableScale || 100);
    setCustomColors({
      floor: nextState.floorColor || (isDarkMode ? '#d1d5db' : '#1f2937'),
      grid: nextState.gridColor || (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
      table: nextState.tableColor || '#ffffff',
      tableText: nextState.tableTextColor || '#000000',
      chair: toHex(nextState.chairColor || '#ffffff'),
      outline: toHex(nextState.outlineColor || (isDarkMode ? '#ffffff' : '#000000'))
    });
  };
  
  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, future, venueLayout]);
  
  // Helper function to constrain dropdown position within canvas bounds
  const constrainDropdownPosition = (buttonRef: React.RefObject<HTMLElement>, dropdownWidth: number) => {
    if (!buttonRef.current) return { left: 0, right: 'auto' as 'auto' | number };
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const canvasContainer = buttonRef.current.closest('.flex-1');
    if (!canvasContainer) return { left: 0, right: 'auto' as 'auto' | number };
    
    const containerRect = canvasContainer.getBoundingClientRect();
    const rightEdge = buttonRect.left + dropdownWidth;
    const containerRightEdge = containerRect.right;
    
    if (rightEdge > containerRightEdge) {
      const offset = rightEdge - containerRightEdge;
      return { left: -offset, right: 'auto' as 'auto' | number };
    }
    
    return { left: 0, right: 'auto' as 'auto' | number };
  };
  
  // Update dropdown positions when they open
  useEffect(() => {
    if (showBaseLayoutDropdown && baseLayoutDropdownRef.current) {
      setDropdownPosition(constrainDropdownPosition(baseLayoutDropdownRef, 150));
    }
  }, [showBaseLayoutDropdown]);
  
  useEffect(() => {
    if (showCutoutDropdown && cutoutDropdownRef.current) {
      setDropdownPosition(constrainDropdownPosition(cutoutDropdownRef, 150));
    }
  }, [showCutoutDropdown]);
  
  useEffect(() => {
    if (showColorDropdown && colorDropdownRef.current) {
      setDropdownPosition(constrainDropdownPosition(colorDropdownRef, 200));
    }
  }, [showColorDropdown]);
  
  useEffect(() => {
    if (showGridSlider && gridButtonRef.current) {
      setSliderPosition(constrainDropdownPosition(gridButtonRef, 200));
    }
  }, [showGridSlider]);
  
  useEffect(() => {
    if (showResizeSlider && resizeButtonRef.current) {
      setSliderPosition(constrainDropdownPosition(resizeButtonRef, 200));
    }
  }, [showResizeSlider]);
  
  // Reset function to restore defaults
  const handleTableDelete = () => {
    if (!selectedTable) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedTable) return;
    setVenueLayout(prev => {
      const newLayout = {
        ...prev,
        tables: prev.tables.filter(table => table.id !== selectedTable.id)
      };
      saveToHistory(newLayout);
      return newLayout;
    });
    setSelectedTable(null);
    setShowTableOptions(false);
    setShowDeleteDialog(false);
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleTableNameChange = (newName: string) => {
    if (!selectedTable) return;
    setVenueLayout(prev => {
      const newLayout = {
        ...prev,
        tables: prev.tables.map(table => 
          table.id === selectedTable.id 
            ? { ...table, name: newName }
            : table
        )
      };
      saveToHistory(newLayout);
      return newLayout;
    });
    setSelectedTable({ ...selectedTable, name: newName });
  };

  const handleRotationChange = (newRotation: number) => {
    if (!selectedTable) return;
    setVenueLayout(prev => {
      const newLayout = {
        ...prev,
        tables: prev.tables.map(table => 
          table.id === selectedTable.id 
            ? { ...table, rotation: newRotation }
            : table
        )
      };
      return newLayout;
    });
    setSelectedTable({ ...selectedTable, rotation: newRotation });
  };

  const handleChairCountChange = (newCount: number) => {
    if (!selectedTable) return;
    
    // Calculate new dimensions based on chair count
    let newDimensions = selectedTable.dimensions;
    if (selectedTable.type === 'round') {
      const sizeMap: Record<number, number> = {
        2: 40,
        4: 50,
        6: 55,
        8: 60,
        10: 65,
        12: 70
      };
      const newSize = sizeMap[newCount] || 60;
      newDimensions = { width: newSize, height: newSize };
    } else if (selectedTable.type === 'rectangular') {
      const widthMap: Record<number, number> = {
        4: 40,
        6: 60,
        8: 80,
        10: 100,
        12: 120
      };
      const newWidth = widthMap[newCount] || 60;
      // Apply head of table adjustment: 0 if on, +30 if off
      const adjustedWidth = selectedTable.hasHeadOfTable ? newWidth : newWidth + 30;
      newDimensions = { width: adjustedWidth, height: 40 };
    }
    
    setVenueLayout(prev => {
      const newLayout = {
        ...prev,
        tables: prev.tables.map(table => 
          table.id === selectedTable.id 
            ? { ...table, chairCount: newCount, dimensions: newDimensions }
            : table
        )
      };
      saveToHistory(newLayout);
      return newLayout;
    });
    setSelectedTable({ ...selectedTable, chairCount: newCount, dimensions: newDimensions });
  };

  const handleChairTypeChange = (newType: 'chair-1' | 'chair-2' | 'chair-3' | 'chair-4' | 'chair-5' | 'chair-6') => {
    if (!selectedTable) return;
    setVenueLayout(prev => {
      const newLayout = {
        ...prev,
        tables: prev.tables.map(table => 
          table.id === selectedTable.id 
            ? { ...table, chairType: newType }
            : table
        )
      };
      saveToHistory(newLayout);
      return newLayout;
    });
    setSelectedTable({ ...selectedTable, chairType: newType });
  };

  const handleHeadOfTableChange = (hasHead: boolean) => {
    if (!selectedTable) return;

    // Calculate new dimensions based on hasHeadOfTable
    let newDimensions = selectedTable.dimensions;
    if (selectedTable.type === 'rectangular') {
      // Get base width by reversing current adjustment
      const currentHasHead = selectedTable.hasHeadOfTable !== false;
      const baseWidth = currentHasHead ? selectedTable.dimensions.width : selectedTable.dimensions.width - 30;
      // Apply new adjustment: 0 if on, +30 if off
      const newWidth = hasHead ? baseWidth : baseWidth + 30;
      newDimensions = {
        width: newWidth,
        height: selectedTable.dimensions.height
      };
    }

    setVenueLayout(prev => {
      const newLayout = {
        ...prev,
        tables: prev.tables.map(table =>
          table.id === selectedTable.id
            ? { ...table, hasHeadOfTable: hasHead, dimensions: newDimensions }
            : table
        )
      };
      saveToHistory(newLayout);
      return newLayout;
    });
    setSelectedTable({ ...selectedTable, hasHeadOfTable: hasHead, dimensions: newDimensions });
  };

  const handleResetToDefaults = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    const defaultFloorColor = isDarkMode ? '#d1d5db' : '#1f2937';
    const defaultGridColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const defaultTableColor = '#ffffff';
    const defaultTableTextColor = '#000000';
    const defaultChairColor = '#ffffff';
    const defaultOutlineColor = data.mainColor1 || '#454545';
    const defaultTableScale = 100;
    setCustomColors({
      floor: defaultFloorColor,
      grid: defaultGridColor,
      table: defaultTableColor,
      tableText: defaultTableTextColor,
      chair: defaultChairColor,
      outline: defaultOutlineColor
    });
    setGridDensity(50);
    setTableScale(100);
    const newLayout = { ...venueLayout, floorColor: defaultFloorColor, gridColor: defaultGridColor, tableColor: defaultTableColor, tableTextColor: defaultTableTextColor, chairColor: defaultChairColor, outlineColor: defaultOutlineColor, tableScale: defaultTableScale, gridDensity: 50, doorColorMode: 0 as 0 };
    saveToHistory(newLayout);
    setVenueLayout(newLayout);
    setShowResetDialog(false);
  };

  const cancelReset = () => {
    setShowResetDialog(false);
  };
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [resizeTableStart, setResizeTableStart] = useState<{ x: number; y: number; width: number; height: number; position: { x: number; y: number }; rotation: number; tableId: string; type: Table['type'] } | null>(null);
  const [isDrawingCutout, setIsDrawingCutout] = useState(false);
  const [cutoutStart, setCutoutStart] = useState<{ x: number; y: number } | null>(null);
  const [currentCutout, setCurrentCutout] = useState<{ x: number; y: number; width: number; height: number; shape: 'rectangle' | 'circle' } | null>(null);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [dragTableStart, setDragTableStart] = useState<{ x: number; y: number; tableX: number; tableY: number } | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [mouseDownTime, setMouseDownTime] = useState<number>(0);
  const layoutBeforeDragRef = useRef<any>(null);
  const colorBeforeChangeRef = useRef<any>(null);
  const rotationBeforeChangeRef = useRef<any>(null);
  const gridDensityBeforeChangeRef = useRef<any>(null);
  const tableScaleBeforeChangeRef = useRef<any>(null);
  const [showTableOptions, setShowTableOptions] = useState(false);
  const [tableOptionsPosition, setTableOptionsPosition] = useState<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseLayoutDropdownRef = useRef<HTMLDivElement>(null);
  const cutoutDropdownRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const gridSliderRef = useRef<HTMLDivElement>(null);
  const gridButtonRef = useRef<HTMLButtonElement>(null);
  const resizeSliderRef = useRef<HTMLDivElement>(null);
  const resizeButtonRef = useRef<HTMLButtonElement>(null);
  const entranceFillImageRef = useRef<HTMLImageElement | null>(null);
  const entranceOutlineImageRef = useRef<HTMLImageElement | null>(null);
  const doorFillImageRef = useRef<HTMLImageElement | null>(null);
  const doorOutlineImageRef = useRef<HTMLImageElement | null>(null);
  const [entranceDoorImagesLoaded, setEntranceDoorImagesLoaded] = useState(false);

  // Load entrance and door images
  useEffect(() => {
    const loadImages = () => {
      let loadedCount = 0;
      const totalImages = 4;
      
      const checkLoaded = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setEntranceDoorImagesLoaded(true);
        }
      };
      
      const fillImg = new Image();
      fillImg.src = '/assets/ico-mapping-entrance-fill.png';
      fillImg.onload = () => {
        entranceFillImageRef.current = fillImg;
        checkLoaded();
      };
      fillImg.onerror = () => {
        console.error('Failed to load entrance fill image');
        checkLoaded();
      };
      
      const outlineImg = new Image();
      outlineImg.src = '/assets/ico-mapping-entrance-outline.png';
      outlineImg.onload = () => {
        entranceOutlineImageRef.current = outlineImg;
        checkLoaded();
      };
      outlineImg.onerror = () => {
        console.error('Failed to load entrance outline image');
        checkLoaded();
      };
      
      const doorFillImg = new Image();
      doorFillImg.src = '/assets/ico-mapping-door-fill.png';
      doorFillImg.onload = () => {
        doorFillImageRef.current = doorFillImg;
        checkLoaded();
      };
      doorFillImg.onerror = () => {
        console.error('Failed to load door fill image');
        checkLoaded();
      };
      
      const doorOutlineImg = new Image();
      doorOutlineImg.src = '/assets/ico-mapping-door-outline.png';
      doorOutlineImg.onload = () => {
        doorOutlineImageRef.current = doorOutlineImg;
        checkLoaded();
      };
      doorOutlineImg.onerror = () => {
        console.error('Failed to load door outline image');
        checkLoaded();
      };
    };
    
    loadImages();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (baseLayoutDropdownRef.current && !baseLayoutDropdownRef.current.contains(event.target as Node)) {
        setShowBaseLayoutDropdown(false);
      }
      if (cutoutDropdownRef.current && !cutoutDropdownRef.current.contains(event.target as Node)) {
        setShowCutoutDropdown(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false);
      }
      if (showGridSlider && 
          gridSliderRef.current && 
          !gridSliderRef.current.contains(event.target as Node) &&
          gridButtonRef.current &&
          !gridButtonRef.current.contains(event.target as Node)) {
        setShowGridSlider(false);
      }
      if (showResizeSlider && 
          resizeSliderRef.current && 
          !resizeSliderRef.current.contains(event.target as Node) &&
          resizeButtonRef.current &&
          !resizeButtonRef.current.contains(event.target as Node)) {
        setShowResizeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGridSlider, showResizeSlider]);

  // Resize canvas to match container exactly
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate center position
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Outline color helpers
    const outlineColor = toRgba(venueLayout.outlineColor || defaultOutlineColor, 1);

    // Helper to draw the display icon for dance floor tables
    const drawDanceFloorIcon = (table: Table, scale: number) => {
      const value = table.imageUrl;
      if (!value || value === DANCE_FLOOR_NO_ICON_URL) return;

      const iconColor = outlineColor;
      const MAX_DANCE_FLOOR_ICON_SIZE = 60;
      const maxSize = Math.min(MAX_DANCE_FLOOR_ICON_SIZE, Math.min(table.dimensions.width, table.dimensions.height) * scale * 0.7);

      if (value === DANCE_FLOOR_INITIAL_VALUE) {
        const firstName = data.nameType === 'couple' ? data.hisName : data.coupleName;
        const secondName = data.nameType === 'couple' ? data.herName : '';
        const firstInitial = (firstName?.trim().charAt(0) || '').toUpperCase();
        const secondInitial = (secondName?.trim().charAt(0) || '').toUpperCase();
        const initialText = firstInitial && secondInitial ? `${firstInitial} & ${secondInitial}` : firstInitial || secondInitial;
        if (!initialText) return;
        const fontSize = Math.min(maxSize * 0.5, Math.min(table.dimensions.width, table.dimensions.height) * scale * 0.25);
        ctx.fillStyle = iconColor;
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initialText, 0, 0);
        return;
      }

      const imageUrl = value === DANCE_FLOOR_LOGO_VALUE ? data.heroIcon : value;
      if (!imageUrl) return;
      const displayImage = displayImagesRef.current[imageUrl];
      if (!displayImage || !displayImage.complete) return;

      const aspect = displayImage.width && displayImage.height ? displayImage.width / displayImage.height : 1;
      let drawW = Math.round(maxSize);
      let drawH = Math.round(maxSize / aspect);
      if (drawH > maxSize) {
        drawH = Math.round(maxSize);
        drawW = Math.round(maxSize * aspect);
      }

      let tempCanvas = displayIconTempCanvasRef.current;
      if (!tempCanvas) {
        tempCanvas = document.createElement('canvas');
        displayIconTempCanvasRef.current = tempCanvas;
      }
      tempCanvas.width = drawW;
      tempCanvas.height = drawH;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.clearRect(0, 0, drawW, drawH);
        tempCtx.drawImage(displayImage, 0, 0, drawW, drawH);
        // Apply color overlay for all icons except logo
        if (value !== DANCE_FLOOR_LOGO_VALUE) {
          tempCtx.globalCompositeOperation = 'source-atop';
          tempCtx.fillStyle = iconColor;
          tempCtx.fillRect(0, 0, drawW, drawH);
          tempCtx.globalCompositeOperation = 'source-over';
        }
        ctx.drawImage(tempCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
      }
    };

    // Draw venue shape
    ctx.fillStyle = customColors.floor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = isEditDisabled ? 6 : 2;

    const venueX = (canvasWidth - venueLayout.dimensions.width) / 2;
    const venueY = (canvasHeight - venueLayout.dimensions.height) / 2;

    if (venueLayout.baseShape === 'rectangle' || venueLayout.baseShape === 'square') {
      // Draw base rectangle fill
      ctx.save();
      ctx.fillStyle = customColors.floor;
      ctx.fillRect(venueX, venueY, venueLayout.dimensions.width, venueLayout.dimensions.height);
      ctx.restore();

      // Draw cutouts (make them transparent using composite operation)
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      venueLayout.cutouts.forEach(cutout => {
        if (cutout.shape === 'circle') {
          const centerX = venueX + cutout.x + cutout.width / 2;
          const centerY = venueY + cutout.y + cutout.height / 2;
          const radiusX = cutout.width / 2;
          const radiusY = cutout.height / 2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(venueX + cutout.x, venueY + cutout.y, cutout.width, cutout.height);
        }
      });
      ctx.restore();

      // Draw base rectangle outline, excluding cutout areas
      ctx.save();
      ctx.beginPath();
      ctx.rect(venueX, venueY, venueLayout.dimensions.width, venueLayout.dimensions.height);
      venueLayout.cutouts.forEach(cutout => {
        if (cutout.shape === 'circle') {
          const centerX = venueX + cutout.x + cutout.width / 2;
          const centerY = venueY + cutout.y + cutout.height / 2;
          const radiusX = cutout.width / 2;
          const radiusY = cutout.height / 2;
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        } else {
          ctx.rect(venueX + cutout.x, venueY + cutout.y, cutout.width, cutout.height);
        }
      });
      ctx.clip('evenodd');
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = isEditDisabled ? 6 : 2;
      ctx.strokeRect(venueX, venueY, venueLayout.dimensions.width, venueLayout.dimensions.height);
      ctx.restore();

      // Draw cutout outlines, excluding base rectangle outline
      if (!isEditDisabled) {
        ctx.save();
        ctx.beginPath();
        venueLayout.cutouts.forEach((cutout, index) => {
          if (cutout.shape === 'circle') {
            const centerX = venueX + cutout.x + cutout.width / 2;
            const centerY = venueY + cutout.y + cutout.height / 2;
            const radiusX = cutout.width / 2;
            const radiusY = cutout.height / 2;
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          } else {
            ctx.rect(venueX + cutout.x, venueY + cutout.y, cutout.width, cutout.height);
          }
        });
        ctx.rect(venueX, venueY, venueLayout.dimensions.width, venueLayout.dimensions.height);
        ctx.clip('evenodd');
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        venueLayout.cutouts.forEach((cutout, index) => {
          if (cutout.shape === 'circle') {
            const centerX = venueX + cutout.x + cutout.width / 2;
            const centerY = venueY + cutout.y + cutout.height / 2;
            const radiusX = cutout.width / 2;
            const radiusY = cutout.height / 2;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeRect(venueX + cutout.x, venueY + cutout.y, cutout.width, cutout.height);
          }
        });
        ctx.restore();
      }

      // Draw resize handles for selected cutout
      if (!isEditDisabled && selectedCutout !== null && venueLayout.cutouts[selectedCutout]) {
        const cutout = venueLayout.cutouts[selectedCutout];
        const handleSize = 10;
        ctx.fillStyle = accentColor;
        
        // Corner handles
        const corners = [
          { x: venueX + cutout.x, y: venueY + cutout.y },
          { x: venueX + cutout.x + cutout.width, y: venueY + cutout.y },
          { x: venueX + cutout.x, y: venueY + cutout.y + cutout.height },
          { x: venueX + cutout.x + cutout.width, y: venueY + cutout.y + cutout.height },
        ];
        
        corners.forEach(corner => {
          ctx.fillRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
        });
        
        // Edge handles
        const edges = [
          { x: venueX + cutout.x + cutout.width/2, y: venueY + cutout.y },
          { x: venueX + cutout.x + cutout.width/2, y: venueY + cutout.y + cutout.height },
          { x: venueX + cutout.x, y: venueY + cutout.y + cutout.height/2 },
          { x: venueX + cutout.x + cutout.width, y: venueY + cutout.y + cutout.height/2 },
        ];
        
        edges.forEach(edge => {
          ctx.fillRect(edge.x - handleSize/2, edge.y - handleSize/2, handleSize, handleSize);
        });
      }

      // Draw resize handles if controls are shown
      if (showControls) {
        const handleSize = 10;
        ctx.fillStyle = accentColor;
        
        // Corner handles
        const corners = [
          { x: venueX, y: venueY }, // top-left
          { x: venueX + venueLayout.dimensions.width, y: venueY }, // top-right
          { x: venueX, y: venueY + venueLayout.dimensions.height }, // bottom-left
          { x: venueX + venueLayout.dimensions.width, y: venueY + venueLayout.dimensions.height }, // bottom-right
        ];
        
        corners.forEach(corner => {
          ctx.fillRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
        });
        
        // Edge handles
        const edges = [
          { x: venueX + venueLayout.dimensions.width/2, y: venueY }, // top
          { x: venueX + venueLayout.dimensions.width/2, y: venueY + venueLayout.dimensions.height }, // bottom
          { x: venueX, y: venueY + venueLayout.dimensions.height/2 }, // left
          { x: venueX + venueLayout.dimensions.width, y: venueY + venueLayout.dimensions.height/2 }, // right
        ];
        
        edges.forEach(edge => {
          ctx.fillRect(edge.x - handleSize/2, edge.y - handleSize/2, handleSize, handleSize);
        });
      }

      // Draw current cutout being drawn
      if (currentCutout) {
        ctx.fillStyle = accentColor + '40'; // Semi-transparent accent color
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        if (currentCutout.shape === 'circle') {
          const centerX = venueX + currentCutout.x + currentCutout.width / 2;
          const centerY = venueY + currentCutout.y + currentCutout.height / 2;
          const radiusX = currentCutout.width / 2;
          const radiusY = currentCutout.height / 2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(venueX + currentCutout.x, venueY + currentCutout.y, currentCutout.width, currentCutout.height);
          ctx.strokeRect(venueX + currentCutout.x, venueY + currentCutout.y, currentCutout.width, currentCutout.height);
        }
      }
    } else if (venueLayout.baseShape === 'circle') {
      // Draw ellipse (can be oval)
      const centerX = venueX + venueLayout.dimensions.width / 2;
      const centerY = venueY + venueLayout.dimensions.height / 2;
      const radiusX = venueLayout.dimensions.width / 2;
      const radiusY = venueLayout.dimensions.height / 2;
      
      // Draw base ellipse fill
      ctx.save();
      ctx.fillStyle = customColors.floor;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Draw cutouts (make them transparent using composite operation)
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      venueLayout.cutouts.forEach(cutout => {
        if (cutout.shape === 'circle') {
          const centerX = venueX + cutout.x + cutout.width / 2;
          const centerY = venueY + cutout.y + cutout.height / 2;
          const radiusX = cutout.width / 2;
          const radiusY = cutout.height / 2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(venueX + cutout.x, venueY + cutout.y, cutout.width, cutout.height);
        }
      });
      ctx.restore();

      // Draw base ellipse outline, excluding cutout areas
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      venueLayout.cutouts.forEach(cutout => {
        if (cutout.shape === 'circle') {
          const cutoutCenterX = venueX + cutout.x + cutout.width / 2;
          const cutoutCenterY = venueY + cutout.y + cutout.height / 2;
          const cutoutRadiusX = cutout.width / 2;
          const cutoutRadiusY = cutout.height / 2;
          ctx.ellipse(cutoutCenterX, cutoutCenterY, cutoutRadiusX, cutoutRadiusY, 0, 0, Math.PI * 2);
        } else {
          ctx.rect(venueX + cutout.x, venueY + cutout.y, cutout.width, cutout.height);
        }
      });
      ctx.clip('evenodd');
      ctx.strokeStyle = isEditDisabled ? (isDarkMode ? '#111827' : '#4b5563') : accentColor;
      ctx.lineWidth = isEditDisabled ? 6 : 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Draw cutout outlines, excluding base ellipse outline
      if (!isEditDisabled) {
        ctx.save();
        ctx.beginPath();
        venueLayout.cutouts.forEach((cutout, index) => {
          if (cutout.shape === 'circle') {
            const cutoutCenterX = venueX + cutout.x + cutout.width / 2;
            const cutoutCenterY = venueY + cutout.y + cutout.height / 2;
            const cutoutRadiusX = cutout.width / 2;
            const cutoutRadiusY = cutout.height / 2;
            ctx.ellipse(cutoutCenterX, cutoutCenterY, cutoutRadiusX, cutoutRadiusY, 0, 0, Math.PI * 2);
          } else {
            ctx.rect(venueX + cutout.x, venueY + cutout.y, cutout.width, cutout.height);
          }
        });
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.clip('evenodd');
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        venueLayout.cutouts.forEach((cutout, index) => {
          if (cutout.shape === 'circle') {
            const cutoutCenterX = venueX + cutout.x + cutout.width / 2;
            const cutoutCenterY = venueY + cutout.y + cutout.height / 2;
            const cutoutRadiusX = cutout.width / 2;
            const cutoutRadiusY = cutout.height / 2;
            ctx.beginPath();
            ctx.ellipse(cutoutCenterX, cutoutCenterY, cutoutRadiusX, cutoutRadiusY, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeRect(venueX + cutout.x, venueY + cutout.y, cutout.width, cutout.height);
          }
        });
        ctx.restore();
      }

      // Draw resize handles for selected cutout
      if (!isEditDisabled && selectedCutout !== null && venueLayout.cutouts[selectedCutout]) {
        const cutout = venueLayout.cutouts[selectedCutout];
        const handleSize = 10;
        ctx.fillStyle = accentColor;
        
        // Corner handles
        const corners = [
          { x: venueX + cutout.x, y: venueY + cutout.y },
          { x: venueX + cutout.x + cutout.width, y: venueY + cutout.y },
          { x: venueX + cutout.x, y: venueY + cutout.y + cutout.height },
          { x: venueX + cutout.x + cutout.width, y: venueY + cutout.y + cutout.height },
        ];
        
        corners.forEach(corner => {
          ctx.fillRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
        });
        
        // Edge handles
        const edges = [
          { x: venueX + cutout.x + cutout.width/2, y: venueY + cutout.y },
          { x: venueX + cutout.x + cutout.width/2, y: venueY + cutout.y + cutout.height },
          { x: venueX + cutout.x, y: venueY + cutout.y + cutout.height/2 },
          { x: venueX + cutout.x + cutout.width, y: venueY + cutout.y + cutout.height/2 },
        ];
        
        edges.forEach(edge => {
          ctx.fillRect(edge.x - handleSize/2, edge.y - handleSize/2, handleSize, handleSize);
        });
      }
      
      // Draw resize handle for circle/ellipse
      if (showControls) {
        const handleSize = 10;
        ctx.fillStyle = accentColor;
        
        // Right handle
        ctx.fillRect(centerX + radiusX - handleSize/2, centerY - handleSize/2, handleSize, handleSize);
        // Left handle
        ctx.fillRect(centerX - radiusX - handleSize/2, centerY - handleSize/2, handleSize, handleSize);
        // Top handle
        ctx.fillRect(centerX - handleSize/2, centerY - radiusY - handleSize/2, handleSize, handleSize);
        // Bottom handle
        ctx.fillRect(centerX - handleSize/2, centerY + radiusY - handleSize/2, handleSize, handleSize);
      }

      // Draw current cutout being drawn
      if (currentCutout) {
        ctx.fillStyle = accentColor + '40'; // Semi-transparent accent color
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        if (currentCutout.shape === 'circle') {
          const centerX = venueX + currentCutout.x + currentCutout.width / 2;
          const centerY = venueY + currentCutout.y + currentCutout.height / 2;
          const radiusX = currentCutout.width / 2;
          const radiusY = currentCutout.height / 2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(venueX + currentCutout.x, venueY + currentCutout.y, currentCutout.width, currentCutout.height);
          ctx.strokeRect(venueX + currentCutout.x, venueY + currentCutout.y, currentCutout.width, currentCutout.height);
        }
      }
    }

    // Draw doors
    venueLayout.doors.forEach(door => {
      const x = venueX + door.position.x;
      const y = venueY + door.position.y;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((door.rotation * Math.PI) / 180);
      
      ctx.fillStyle = door.type === 'entrance' ? '#10b981' : '#ef4444';
      ctx.fillRect(-15, -5, 30, 10);
      
      // Draw arrow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (door.type === 'entrance') {
        ctx.moveTo(10, 0);
        ctx.lineTo(5, -5);
        ctx.lineTo(5, 5);
      } else {
        ctx.moveTo(-10, 0);
        ctx.lineTo(-5, -5);
        ctx.lineTo(-5, 5);
      }
      ctx.fill();
      
      ctx.restore();
    });

    // Helper to draw the vector chair-1 shape (square with bottom-left and bottom-right rounded)
    const drawVectorChair1 = (ctx: CanvasRenderingContext2D, chairSize: number, scale: number) => {
      const chairFillColor = venueLayout.chairColor || '#ffffff';
      const radius = Math.min(6 * scale, chairSize / 3);
      const x = -chairSize / 2;
      const y = -chairSize / 2;

      // Draw chair fill
      ctx.fillStyle = chairFillColor;
      ctx.beginPath();
      ctx.roundRect(x, y, chairSize, chairSize, [0, 0, radius, radius]);
      ctx.fill();

      // Draw outline stroke matching table line width (2 * scale)
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.roundRect(x, y, chairSize, chairSize, [0, 0, radius, radius]);
      ctx.stroke();
    };

    // Helper to draw a chair image tinted with the chair color and an optional outline
    const drawColoredChair = (ctx: CanvasRenderingContext2D, chairImage: HTMLImageElement | undefined, chairSize: number, type?: string, scale?: number) => {
      if (type === 'chair-1' && scale !== undefined) {
        drawVectorChair1(ctx, chairSize, scale);
        return;
      }

      if (!chairImage) {
        return;
      }

      const chairFillColor = venueLayout.chairColor || '#ffffff';
      let tempCanvas = chairColorTempCanvasRef.current;
      if (!tempCanvas) {
        tempCanvas = document.createElement('canvas');
        chairColorTempCanvasRef.current = tempCanvas;
      }
      tempCanvas.width = chairSize;
      tempCanvas.height = chairSize;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        // Draw outline behind the chair
        const outlineWidth = (4 * (scale ?? 1));
        tempCtx.clearRect(0, 0, chairSize, chairSize);
        tempCtx.drawImage(chairImage, 0, 0, chairSize, chairSize);
        tempCtx.globalCompositeOperation = 'source-atop';
        tempCtx.fillStyle = outlineColor;
        tempCtx.fillRect(0, 0, chairSize, chairSize);
        tempCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tempCanvas, -(chairSize + outlineWidth) / 2, -(chairSize + outlineWidth) / 2, chairSize + outlineWidth, chairSize + outlineWidth);

        // Draw the chair fill
        tempCtx.clearRect(0, 0, chairSize, chairSize);
        tempCtx.drawImage(chairImage, 0, 0, chairSize, chairSize);
        tempCtx.globalCompositeOperation = 'source-atop';
        tempCtx.fillStyle = chairFillColor;
        tempCtx.fillRect(0, 0, chairSize, chairSize);
        tempCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tempCanvas, -chairSize / 2, -chairSize / 2, chairSize, chairSize);
      }
    };

    // Draw tables
    venueLayout.tables.forEach(table => {
      const x = venueX + table.position.x;
      const y = venueY + table.position.y;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((table.rotation * Math.PI) / 180);
      
      // Draw table based on type
      if (table.type === 'dance-floor' || table.type === 'buffet' || table.type === 'other-table') {
        const tableColor = venueLayout.tableColor || (isDarkMode ? '#4b5563' : '#d1d5db');
        const scale = (venueLayout.tableScale || 100) / 100;
        ctx.fillStyle = tableColor;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 2;

        if (table.type === 'dance-floor' && table.shape === 'circular') {
          // Draw as ellipse for circular shape
          const scaledWidth = table.dimensions.width * scale;
          const scaledHeight = table.dimensions.height * scale;
          ctx.beginPath();
          ctx.ellipse(0, 0, scaledWidth / 2, scaledHeight / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (table.type === 'buffet' && table.roundedCorners) {
          const scaledWidth = table.dimensions.width * scale;
          const scaledHeight = table.dimensions.height * scale;
          const x = -scaledWidth / 2;
          const y = -scaledHeight / 2;
          const radius = Math.min(28, Math.min(scaledWidth, scaledHeight) * 0.45);
          ctx.beginPath();
          ctx.roundRect(x, y, scaledWidth, scaledHeight, radius);
          ctx.fill();
          ctx.stroke();
        } else if (table.type === 'dance-floor' && table.shape === 'rectangular' && (table.cornerRadius ?? 0) > 0) {
          const scaledWidth = table.dimensions.width * scale;
          const scaledHeight = table.dimensions.height * scale;
          const x = -scaledWidth / 2;
          const y = -scaledHeight / 2;
          const radius = (table.cornerRadius ?? 0) * scale;
          ctx.beginPath();
          ctx.roundRect(x, y, scaledWidth, scaledHeight, radius);
          ctx.fill();
          ctx.stroke();
        } else {
          const scaledWidth = table.dimensions.width * scale;
          const scaledHeight = table.dimensions.height * scale;
          ctx.fillRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        }

        // Draw resize handles for selected table (only if not locked)
        if (selectedTable?.id === table.id && !table.locked) {
          const handleSize = 10;
          ctx.fillStyle = accentColor;
          const halfW = (table.dimensions.width / 2) * scale;
          const halfH = (table.dimensions.height / 2) * scale;
          const handles = table.type === 'dance-floor'
            ? [
                { x: -halfW, y: -halfH },
                { x: halfW, y: -halfH },
                { x: -halfW, y: halfH },
                { x: halfW, y: halfH },
                { x: 0, y: -halfH },
                { x: 0, y: halfH },
                { x: -halfW, y: 0 },
                { x: halfW, y: 0 },
              ]
            : [
                { x: -halfW, y: 0 },
                { x: halfW, y: 0 },
              ];
          handles.forEach(h => {
            ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
          });
        }
      } else if (table.type === 'dessert-display') {
        const tableColor = venueLayout.tableColor || (isDarkMode ? '#4b5563' : '#d1d5db');
        const scale = (venueLayout.tableScale || 100) / 100;
        ctx.fillStyle = tableColor;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 2;
        const radius = (table.dimensions.width / 2) * scale;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const displayImage = table.imageUrl ? displayImagesRef.current[table.imageUrl] : null;
        if (displayImage && displayImage.complete) {
          const iconSize = table.dimensions.width * scale * 0.6;
          const tableTextColor = outlineColor;
          let tempCanvas = displayIconTempCanvasRef.current;
          if (!tempCanvas) {
            tempCanvas = document.createElement('canvas');
            displayIconTempCanvasRef.current = tempCanvas;
          }
          tempCanvas.width = iconSize;
          tempCanvas.height = iconSize;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            tempCtx.clearRect(0, 0, iconSize, iconSize);
            tempCtx.drawImage(displayImage, 0, 0, iconSize, iconSize);
            tempCtx.globalCompositeOperation = 'source-atop';
            tempCtx.fillStyle = tableTextColor;
            tempCtx.fillRect(0, 0, iconSize, iconSize);
            tempCtx.globalCompositeOperation = 'source-over';
            ctx.drawImage(tempCanvas, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
          }
        }

        // Draw resize handles for selected dessert display (only if not locked)
        if (selectedTable?.id === table.id && !table.locked) {
          const handleSize = 10;
          ctx.fillStyle = accentColor;
          const halfW = (table.dimensions.width / 2) * scale;
          const handles = [
            { x: -halfW, y: 0 },
            { x: halfW, y: 0 },
          ];
          handles.forEach(h => {
            ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
          });
        }
      } else if (table.type === 'stage') {
        ctx.fillStyle = isDarkMode ? '#b45309' : '#f59e0b';
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 2;
        ctx.fillRect(-table.dimensions.width / 2, -table.dimensions.height / 2, table.dimensions.width, table.dimensions.height);
        ctx.strokeRect(-table.dimensions.width / 2, -table.dimensions.height / 2, table.dimensions.width, table.dimensions.height);
      } else if (table.type === 'entrance') {
        // Draw entrance using images
        const fillImage = entranceFillImageRef.current;
        const outlineImage = entranceOutlineImageRef.current;
        
        if (fillImage && outlineImage) {
          const scale = (venueLayout.tableScale || 100) / 100;
          const imageWidth = table.dimensions.width * scale;
          const imageHeight = table.dimensions.height * scale;
          const mode = venueLayout.doorColorMode ?? 0;
          
          // Apply flip transformations
          if (table.flipVertically) {
            ctx.scale(1, -1);
          }
          
          // Create temporary canvas for fill tinting
          const fillTempCanvas = document.createElement('canvas');
          fillTempCanvas.width = imageWidth;
          fillTempCanvas.height = imageHeight;
          const fillTempCtx = fillTempCanvas.getContext('2d');
          
          if (fillTempCtx) {
            // Draw fill image to temp canvas
            fillTempCtx.drawImage(fillImage, 0, 0, imageWidth, imageHeight);
            
            // Apply fill tint based on mode
            fillTempCtx.globalCompositeOperation = 'source-atop';
            if (mode === 0) {
              fillTempCtx.fillStyle = customColors.floor;
            } else {
              fillTempCtx.fillStyle = isDarkMode ? '#1F2937' : '#F3F4F6';
            }
            fillTempCtx.fillRect(0, 0, imageWidth, imageHeight);
            
            // Draw the tinted fill image to main canvas
            ctx.drawImage(fillTempCanvas, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
          }
          
          // Draw the outline image with outline color
          const outlineTempCanvas = document.createElement('canvas');
          outlineTempCanvas.width = imageWidth;
          outlineTempCanvas.height = imageHeight;
          const outlineTempCtx = outlineTempCanvas.getContext('2d');
          if (outlineTempCtx) {
            outlineTempCtx.drawImage(outlineImage, 0, 0, imageWidth, imageHeight);
            outlineTempCtx.globalCompositeOperation = 'source-atop';
            outlineTempCtx.fillStyle = outlineColor;
            outlineTempCtx.fillRect(0, 0, imageWidth, imageHeight);
            outlineTempCtx.globalCompositeOperation = 'source-over';
            ctx.drawImage(outlineTempCanvas, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
          }
          
          // Reset flip transformations
          if (table.flipVertically) {
            ctx.scale(1, -1);
          }
        } else {
          // Fallback if images not loaded
          const scale = (venueLayout.tableScale || 100) / 100;
          const scaledWidth = table.dimensions.width * scale;
          const scaledHeight = table.dimensions.height * scale;
          const mode = venueLayout.doorColorMode ?? 0;
          
          // Apply flip transformations
          if (table.flipVertically) {
            ctx.scale(1, -1);
          }
          
          ctx.fillStyle = (mode === 0) ? customColors.floor : (isDarkMode ? '#1F2937' : '#F3F4F6');
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = 2;
          ctx.fillRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          
          // Reset flip transformations
          if (table.flipVertically) {
            ctx.scale(1, -1);
          }
        }
      } else if (table.type === 'door') {
        // Draw door using images
        const fillImage = doorFillImageRef.current;
        const outlineImage = doorOutlineImageRef.current;
        
        if (fillImage && outlineImage) {
          const scale = (venueLayout.tableScale || 100) / 100;
          const imageWidth = table.dimensions.width * scale;
          const imageHeight = table.dimensions.height * scale;
          const mode = venueLayout.doorColorMode ?? 0;
          
          // Apply flip transformations
          if (table.flipHorizontally) {
            ctx.scale(-1, 1);
          }
          if (table.flipVertically) {
            ctx.scale(1, -1);
          }
          
          // Create temporary canvas for fill tinting
          const fillTempCanvas = document.createElement('canvas');
          fillTempCanvas.width = imageWidth;
          fillTempCanvas.height = imageHeight;
          const fillTempCtx = fillTempCanvas.getContext('2d');
          
          if (fillTempCtx) {
            // Draw fill image to temp canvas
            fillTempCtx.drawImage(fillImage, 0, 0, imageWidth, imageHeight);
            
            // Apply fill tint based on mode
            fillTempCtx.globalCompositeOperation = 'source-atop';
            if (mode === 0) {
              fillTempCtx.fillStyle = customColors.floor;
            } else {
              fillTempCtx.fillStyle = isDarkMode ? '#1F2937' : '#F3F4F6';
            }
            fillTempCtx.fillRect(0, 0, imageWidth, imageHeight);
            
            // Draw the tinted fill image to main canvas
            ctx.drawImage(fillTempCanvas, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
          }
          
          // Draw the outline image with outline color
          const outlineTempCanvas = document.createElement('canvas');
          outlineTempCanvas.width = imageWidth;
          outlineTempCanvas.height = imageHeight;
          const outlineTempCtx = outlineTempCanvas.getContext('2d');
          if (outlineTempCtx) {
            outlineTempCtx.drawImage(outlineImage, 0, 0, imageWidth, imageHeight);
            outlineTempCtx.globalCompositeOperation = 'source-atop';
            outlineTempCtx.fillStyle = outlineColor;
            outlineTempCtx.fillRect(0, 0, imageWidth, imageHeight);
            outlineTempCtx.globalCompositeOperation = 'source-over';
            ctx.drawImage(outlineTempCanvas, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
          }
          
          // Reset flip transformations
          if (table.flipVertically) {
            ctx.scale(1, -1);
          }
          if (table.flipHorizontally) {
            ctx.scale(-1, 1);
          }
        } else {
          // Fallback if images not loaded
          const scale = (venueLayout.tableScale || 100) / 100;
          const scaledWidth = table.dimensions.width * scale;
          const scaledHeight = table.dimensions.height * scale;
          const mode = venueLayout.doorColorMode ?? 0;
          
          // Apply flip transformations
          if (table.flipHorizontally) {
            ctx.scale(-1, 1);
          }
          if (table.flipVertically) {
            ctx.scale(1, -1);
          }
          
          ctx.fillStyle = (mode === 0) ? customColors.floor : (isDarkMode ? '#1F2937' : '#F3F4F6');
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = 2;
          ctx.fillRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          
          // Reset flip transformations
          if (table.flipVertically) {
            ctx.scale(1, -1);
          }
          if (table.flipHorizontally) {
            ctx.scale(-1, 1);
          }
        }
      } else {
        // Regular tables (round, rectangular, square)
        const tableColor = venueLayout.tableColor || (isDarkMode ? '#4b5563' : '#d1d5db');
        const scale = (venueLayout.tableScale || 100) / 100;
        ctx.fillStyle = tableColor;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 2 * scale;
        
        if (table.type === 'round') {
          const radius = (table.dimensions.width / 2) * scale;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (table.type === 'rectangular' && table.roundedCorners) {
          const scaledWidth = table.dimensions.width * scale;
          const scaledHeight = table.dimensions.height * scale;
          const x = -scaledWidth / 2;
          const y = -scaledHeight / 2;
          const radius = Math.min(28, Math.min(scaledWidth, scaledHeight) * 0.3);
          ctx.beginPath();
          ctx.roundRect(x, y, scaledWidth, scaledHeight, radius);
          ctx.fill();
          ctx.stroke();
        } else {
          const scaledWidth = table.dimensions.width * scale;
          const scaledHeight = table.dimensions.height * scale;
          ctx.fillRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        }
        
        // Draw chairs for regular tables
        if (table.chairCount > 0) {
          const chairSize = 18 * scale;
          const chairImage = table.chairType && table.chairType !== 'chair-1'
            ? chairImagesRef.current[table.chairType.replace('chair-', '0')]
            : undefined;
          
          if (chairImage || table.chairType === 'chair-1') {
            if (table.type === 'round') {
              // Circular arrangement for round tables
              const tableRadius = (table.dimensions.width / 2) * scale;
              const chairDistance = tableRadius + (15 * scale);
              
              for (let i = 0; i < table.chairCount; i++) {
                const angle = (i / table.chairCount) * Math.PI * 2;
                const chairX = Math.cos(angle) * chairDistance;
                const chairY = Math.sin(angle) * chairDistance;
                
                ctx.save();
                ctx.translate(chairX, chairY);
                ctx.rotate(angle + Math.PI / 2);
                drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                ctx.restore();
              }
            } else {
              // Linear arrangement for rectangular/square tables
              const halfWidth = (table.dimensions.width / 2) * scale;
              const halfHeight = (table.dimensions.height / 2) * scale;
              const chairDistance = 15 * scale;
              
              // Determine long and short sides
              const isWidthLonger = table.dimensions.width > table.dimensions.height;
              const longSideLength = isWidthLonger ? table.dimensions.width : table.dimensions.height;
              const shortSideLength = isWidthLonger ? table.dimensions.height : table.dimensions.width;
              
              // Check if head of table is enabled
              const hasHeadOfTable = table.hasHeadOfTable !== false;
              
              // Place 1 chair on each long side only if hasHeadOfTable is true
              const chairsOnLongSides = hasHeadOfTable ? 2 : 0;
              const remainingChairs = table.chairCount - chairsOnLongSides;
              const chairsPerShortSide = Math.max(1, Math.ceil(remainingChairs / 2));
              
              let chairIndex = 0;
              
              if (isWidthLonger) {
                // Width is longer - place 1 chair on left/right (long sides), distribute on top/bottom (short sides)
                
                // Top edge (short side) - distribute chairs with proper spacing
                if (chairsPerShortSide > 0) {
                  if (chairsPerShortSide === 1) {
                    // Single chair - center it
                    const x = 0;
                    const y = -halfHeight - chairDistance;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(0); // Bottom faces down towards table
                    drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                    ctx.restore();
                    chairIndex++;
                  } else {
                    // Multiple chairs - distribute with spacing
                    const totalChairWidth = chairsPerShortSide * chairSize;
                    const totalGapWidth = (chairsPerShortSide - 1) * (4 * scale); // 4px gap between chairs
                    const totalWidth = totalChairWidth + totalGapWidth;
                    const startX = -totalWidth / 2 + chairSize / 2; // Adjust to center the group
                    
                    for (let i = 0; i < chairsPerShortSide && chairIndex < table.chairCount; i++) {
                      const x = startX + i * (chairSize + (4 * scale));
                      const y = -halfHeight - chairDistance;
                      ctx.save();
                      ctx.translate(x, y);
                      ctx.rotate(0); // Bottom faces down towards table
                      drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                      ctx.restore();
                      chairIndex++;
                    }
                  }
                }
                
                // Right edge (long side) - 1 chair in center (only if hasHeadOfTable)
                if (hasHeadOfTable && chairIndex < table.chairCount) {
                  const x = halfWidth + chairDistance;
                  const y = 0;
                  ctx.save();
                  ctx.translate(x, y);
                  ctx.rotate(Math.PI / 2); // Bottom faces left towards table
                  drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                  ctx.restore();
                  chairIndex++;
                }
                
                // Bottom edge (short side) - distribute chairs with proper spacing
                if (chairsPerShortSide > 0) {
                  if (chairsPerShortSide === 1) {
                    // Single chair - center it
                    const x = 0;
                    const y = halfHeight + chairDistance;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI); // Bottom faces up towards table
                    drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                    ctx.restore();
                    chairIndex++;
                  } else {
                    // Multiple chairs - distribute with spacing
                    const totalChairWidth = chairsPerShortSide * chairSize;
                    const totalGapWidth = (chairsPerShortSide - 1) * (4 * scale); // 4px gap between chairs
                    const totalWidth = totalChairWidth + totalGapWidth;
                    const startX = -totalWidth / 2 + chairSize / 2; // Adjust to center the group
                    
                    for (let i = 0; i < chairsPerShortSide && chairIndex < table.chairCount; i++) {
                      const x = startX + i * (chairSize + (4 * scale));
                      const y = halfHeight + chairDistance;
                      ctx.save();
                      ctx.translate(x, y);
                      ctx.rotate(Math.PI); // Bottom faces up towards table
                      drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                      ctx.restore();
                      chairIndex++;
                    }
                  }
                }
                
                // Left edge (long side) - 1 chair in center (only if hasHeadOfTable)
                if (hasHeadOfTable && chairIndex < table.chairCount) {
                  const x = -halfWidth - chairDistance;
                  const y = 0;
                  ctx.save();
                  ctx.translate(x, y);
                  ctx.rotate(-Math.PI / 2); // Bottom faces right towards table
                  drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                  ctx.restore();
                  chairIndex++;
                }
              } else {
                // Height is longer - place 1 chair on top/bottom (long sides), distribute on left/right (short sides)
                
                // Top edge (long side) - 1 chair in center (only if hasHeadOfTable)
                if (hasHeadOfTable && chairIndex < table.chairCount) {
                  const x = 0;
                  const y = -halfHeight - chairDistance;
                  ctx.save();
                  ctx.translate(x, y);
                  ctx.rotate(0); // Bottom faces down towards table
                  drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                  ctx.restore();
                  chairIndex++;
                }
                
                // Right edge (short side) - distribute chairs with proper spacing
                if (chairsPerShortSide > 0) {
                  if (chairsPerShortSide === 1) {
                    // Single chair - center it
                    const x = halfWidth + chairDistance;
                    const y = 0;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI / 2); // Bottom faces left towards table
                    drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                    ctx.restore();
                    chairIndex++;
                  } else {
                    // Multiple chairs - distribute with spacing
                    const totalChairHeight = chairsPerShortSide * chairSize;
                    const totalGapHeight = (chairsPerShortSide - 1) * (4 * scale); // 4px gap between chairs
                    const totalHeight = totalChairHeight + totalGapHeight;
                    const startY = -totalHeight / 2 + chairSize / 2; // Adjust to center the group
                    
                    for (let i = 0; i < chairsPerShortSide && chairIndex < table.chairCount; i++) {
                      const x = halfWidth + chairDistance;
                      const y = startY + i * (chairSize + (4 * scale));
                      ctx.save();
                      ctx.translate(x, y);
                      ctx.rotate(Math.PI / 2); // Bottom faces left towards table
                      drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                      ctx.restore();
                      chairIndex++;
                    }
                  }
                }
                
                // Bottom edge (long side) - 1 chair in center (only if hasHeadOfTable)
                if (hasHeadOfTable && chairIndex < table.chairCount) {
                  const x = 0;
                  const y = halfHeight + chairDistance;
                  ctx.save();
                  ctx.translate(x, y);
                  ctx.rotate(Math.PI); // Bottom faces up towards table
                  drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                  ctx.restore();
                  chairIndex++;
                }
                
                // Left edge (short side) - distribute chairs with proper spacing
                if (chairsPerShortSide > 0) {
                  if (chairsPerShortSide === 1) {
                    // Single chair - center it
                    const x = -halfWidth - chairDistance;
                    const y = 0;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(-Math.PI / 2); // Bottom faces right towards table
                    drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                    ctx.restore();
                    chairIndex++;
                  } else {
                    // Multiple chairs - distribute with spacing
                    const totalChairHeight = chairsPerShortSide * chairSize;
                    const totalGapHeight = (chairsPerShortSide - 1) * (4 * scale); // 4px gap between chairs
                    const totalHeight = totalChairHeight + totalGapHeight;
                    const startY = -totalHeight / 2 + chairSize / 2; // Adjust to center the group
                    
                    for (let i = 0; i < chairsPerShortSide && chairIndex < table.chairCount; i++) {
                      const x = -halfWidth - chairDistance;
                      const y = startY + i * (chairSize + (4 * scale));
                      ctx.save();
                      ctx.translate(x, y);
                      ctx.rotate(-Math.PI / 2); // Bottom faces right towards table
                      drawColoredChair(ctx, chairImage, chairSize, table.chairType, scale);
                      ctx.restore();
                      chairIndex++;
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      // Draw table name
      ctx.fillStyle = outlineColor;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // For entrance and door, draw name above the image
      if (table.type === 'entrance' || table.type === 'door') {
        const scale = (venueLayout.tableScale || 100) / 100;
        const imageHeight = table.dimensions.height * scale;
        ctx.fillText(table.name, 0, -imageHeight / 2 - 15);
      } else {
        // For regular tables, counter-rotate the name so it stays upright
        if (table.type === 'dance-floor' && table.imageUrl && table.imageUrl !== DANCE_FLOOR_NO_ICON_URL) {
          const scale = (venueLayout.tableScale || 100) / 100;
          drawDanceFloorIcon(table, scale);
        } else {
          ctx.save();
          ctx.rotate(-(table.rotation * Math.PI) / 180);
          ctx.fillText(table.name, 0, 0);
          ctx.restore();
        }
      }

      ctx.restore();
    });

    // Draw cutout being drawn
    if (currentCutout) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([5, 5]);
      ctx.fillRect(venueX + currentCutout.x, venueY + currentCutout.y, currentCutout.width, currentCutout.height);
      ctx.strokeRect(venueX + currentCutout.x, venueY + currentCutout.y, currentCutout.width, currentCutout.height);
      ctx.setLineDash([]);
    }

    // Draw grid lines - drawn last to be on top
    ctx.save();
    ctx.strokeStyle = customColors.grid;
    ctx.lineWidth = 1;
    // Calculate grid size from density (10-100 slider value)
    // Higher density = smaller spacing, Lower density = larger spacing
    const gridSize = Math.max(5, 60 - (gridDensity * 0.55));

    // Calculate offset to center the grid
    const offsetX = (canvasWidth % gridSize) / 2;
    const offsetY = (canvasHeight % gridSize) / 2;

    for (let x = offsetX; x <= canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    for (let y = offsetY; y <= canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Draw thicker center lines
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 0);
    ctx.lineTo(canvasWidth / 2, canvasHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, canvasHeight / 2);
    ctx.lineTo(canvasWidth, canvasHeight / 2);
    ctx.stroke();

    ctx.restore();

  }, [venueLayout, selectedTable, isDarkMode, accentColor, isDrawingCutout, cutoutStart, showControls, currentCutout, selectedCutout, isEditDisabled, customColors, gridDensity, chairImagesLoaded, entranceDoorImagesLoaded, data.heroIcon, data.hisName, data.herName, data.nameType, data.coupleName]);

  // Handle canvas click to show/hide controls
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Don't process click if we're resizing
    if (isResizing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Calculate venue position
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const venueX = (canvasWidth - venueLayout.dimensions.width) / 2;
    const venueY = (canvasHeight - venueLayout.dimensions.height) / 2;

    // Check if click is on a table (for selection only, not drag)
    let clickedTableIndex = -1;
    venueLayout.tables.forEach((table, index) => {
      const tableAbsX = venueX + table.position.x;
      const tableAbsY = venueY + table.position.y;
      const scale = (venueLayout.tableScale || 100) / 100;
      const halfWidth = (table.dimensions.width / 2) * scale;
      const halfHeight = (table.dimensions.height / 2) * scale;

      if (x >= tableAbsX - halfWidth && x <= tableAbsX + halfWidth &&
          y >= tableAbsY - halfHeight && y <= tableAbsY + halfHeight) {
        clickedTableIndex = index;
      }
    });

    if (clickedTableIndex !== -1) {
      const table = venueLayout.tables[clickedTableIndex];
      // For locked tables, show options panel on click
      if (table.locked) {
        setSelectedTable(table);
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const panelX = Math.min((e.clientX - rect.left), rect.width - 200);
          const panelY = Math.min((e.clientY - rect.top), rect.height - 150);
          setTableOptionsPosition({ x: Math.max(0, panelX), y: Math.max(0, panelY) });
          setShowTableOptions(true);
        }
      }
      setSelectedCutout(null);
      setShowControls(false);
      return;
    }

    // Check if click is on a cutout
    let clickedCutoutIndex = -1;
    venueLayout.cutouts.forEach((cutout, index) => {
      const cutoutAbsX = venueX + cutout.x;
      const cutoutAbsY = venueY + cutout.y;
      if (x >= cutoutAbsX && x <= cutoutAbsX + cutout.width &&
          y >= cutoutAbsY && y <= cutoutAbsY + cutout.height) {
        clickedCutoutIndex = index;
      }
    });

    if (clickedCutoutIndex !== -1) {
      if (isEditDisabled) {
        return; // Don't select cutout if edit is disabled
      }
      if (isDeletingCutout) {
        // Delete the cutout
        const updatedCutouts = venueLayout.cutouts.filter((_, index) => index !== clickedCutoutIndex);
        saveToHistory({ ...venueLayout, cutouts: updatedCutouts });
        setVenueLayout({ ...venueLayout, cutouts: updatedCutouts });
        setIsDeletingCutout(false);
        setSelectedTool(null);
      } else {
        setSelectedCutout(clickedCutoutIndex);
        setShowControls(false);
      }
      return;
    }

    // Check if click is on venue outline
    let onEdge = false;

    if (isEditDisabled) {
      // Don't allow venue edge selection if edit is disabled
      onEdge = false;
    } else if (venueLayout.baseShape === 'circle') {
      // Check if click is on circle outline
      const centerX = venueX + venueLayout.dimensions.width / 2;
      const centerY = venueY + venueLayout.dimensions.height / 2;
      const radiusX = venueLayout.dimensions.width / 2;
      const radiusY = venueLayout.dimensions.height / 2;
      
      // Use bounding box check for circle - if click is near any edge
      const tolerance = 20;
      const onLeftEdge = Math.abs(x - venueX) < tolerance;
      const onRightEdge = Math.abs(x - (venueX + venueLayout.dimensions.width)) < tolerance;
      const onTopEdge = Math.abs(y - venueY) < tolerance;
      const onBottomEdge = Math.abs(y - (venueY + venueLayout.dimensions.height)) < tolerance;
      onEdge = onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;
    } else {
      // Check if click is on rectangle outline (with some tolerance)
      const tolerance = 10;
      const onLeftEdge = Math.abs(x - venueX) < tolerance;
      const onRightEdge = Math.abs(x - (venueX + venueLayout.dimensions.width)) < tolerance;
      const onTopEdge = Math.abs(y - venueY) < tolerance;
      const onBottomEdge = Math.abs(y - (venueY + venueLayout.dimensions.height)) < tolerance;
      onEdge = onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;
    }

    // Only show controls if clicking on the edge, otherwise hide
    if (onEdge) {
      setShowControls(true);
      setSelectedCutout(null);
      setSelectedTable(null);
      setShowTableOptions(false);
    } else {
      setShowControls(false);
      setSelectedCutout(null);
      setSelectedTable(null);
      setIsDraggingTable(false);
      setDragTableStart(null);
      setShowTableOptions(false);
    }
  };

  // Handle mouse down on resize handles
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Calculate venue position
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const venueX = (canvasWidth - venueLayout.dimensions.width) / 2;
    const venueY = (canvasHeight - venueLayout.dimensions.height) / 2;

    // Check if mouse is on a resize handle for dance floor, buffet, or other table
    let danceFloorHandle: string | null = null;
    let danceFloorTable: Table | null = null;
    const scale = (venueLayout.tableScale || 100) / 100;
    for (let i = venueLayout.tables.length - 1; i >= 0; i--) {
      const table = venueLayout.tables[i];
      if (table.type !== 'dance-floor' && table.type !== 'buffet' && table.type !== 'other-table' && table.type !== 'dessert-display') continue;
      if (table.locked) continue;

      const tableAbsX = venueX + table.position.x;
      const tableAbsY = venueY + table.position.y;
      const halfW = (table.dimensions.width / 2) * scale;
      const halfH = (table.dimensions.height / 2) * scale;
      const rad = (table.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rotate = (lx: number, ly: number) => ({
        x: tableAbsX + (lx * cos - ly * sin),
        y: tableAbsY + (lx * sin + ly * cos),
      });

      const handleSize = 15;
      const isWidthOnly = table.type === 'buffet' || table.type === 'other-table' || table.type === 'dessert-display';
      const handles = isWidthOnly
        ? [
            { handle: 'dance-l', ...rotate(-halfW, 0) },
            { handle: 'dance-r', ...rotate(halfW, 0) },
          ]
        : [
            { handle: 'dance-tl', ...rotate(-halfW, -halfH) },
            { handle: 'dance-tr', ...rotate(halfW, -halfH) },
            { handle: 'dance-bl', ...rotate(-halfW, halfH) },
            { handle: 'dance-br', ...rotate(halfW, halfH) },
            { handle: 'dance-t', ...rotate(0, -halfH) },
            { handle: 'dance-b', ...rotate(0, halfH) },
            { handle: 'dance-l', ...rotate(-halfW, 0) },
            { handle: 'dance-r', ...rotate(halfW, 0) },
          ];

      for (const h of handles) {
        if (Math.abs(x - h.x) < handleSize && Math.abs(y - h.y) < handleSize) {
          danceFloorHandle = h.handle;
          danceFloorTable = table;
          break;
        }
      }
      if (danceFloorHandle) break;
    }

    if (danceFloorHandle && danceFloorTable) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedTable(danceFloorTable);
      setResizeHandle(danceFloorHandle);
      setResizeTableStart({
        x,
        y,
        width: danceFloorTable.dimensions.width,
        height: danceFloorTable.dimensions.height,
        position: danceFloorTable.position,
        rotation: danceFloorTable.rotation,
        tableId: danceFloorTable.id,
        type: danceFloorTable.type,
      });
      setIsResizing(true);
      return;
    }

    // Check if mouse is on a table and start dragging
    let clickedTableIndex = -1;
    venueLayout.tables.forEach((table, index) => {
      if (table.locked) return; // Skip locked tables
      const tableAbsX = venueX + table.position.x;
      const tableAbsY = venueY + table.position.y;
      const scale = (venueLayout.tableScale || 100) / 100;
      const halfWidth = (table.dimensions.width / 2) * scale;
      const halfHeight = (table.dimensions.height / 2) * scale;

      if (x >= tableAbsX - halfWidth && x <= tableAbsX + halfWidth &&
          y >= tableAbsY - halfHeight && y <= tableAbsY + halfHeight) {
        clickedTableIndex = index;
      }
    });

    if (clickedTableIndex !== -1) {
      const table = venueLayout.tables[clickedTableIndex];
      setSelectedTable(table);
      
      // If table is locked, show options panel immediately
      if (table.locked) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const panelX = Math.min(e.clientX - rect.left, rect.width - 200);
          const panelY = Math.min(e.clientY - rect.top, rect.height - 150);
          setTableOptionsPosition({ x: Math.max(0, panelX), y: Math.max(0, panelY) });
          setShowTableOptions(true);
        }
        setSelectedCutout(null);
        setShowControls(false);
        return;
      }
      
      // Only allow dragging if table is not locked
      setMouseDownPos({ x: e.clientX, y: e.clientY });
      setMouseDownTime(Date.now());
      setIsDraggingTable(true);
      setDragTableStart({ x, y, tableX: table.position.x, tableY: table.position.y });
      setSelectedCutout(null);
      setShowControls(false);
      return;
    }

    // Prevent other editing when disabled (cutouts, venue resizing, etc.)
    if (isEditDisabled) return;

    // Handle tool activation
    if (selectedTool === 'cutout') {
      setIsDrawingCutout(true);
      setCutoutStart({ x, y });
      return;
    }

    // Handle cutout drawing
    if (isDrawingCutout) {
      // Start drawing cutout (store absolute canvas coordinates)
      setCutoutStart({ x, y });
      return;
    }

    // Handle cutout resize
    if (selectedCutout !== null) {
      const cutout = venueLayout.cutouts[selectedCutout];
      if (!cutout) return;

      const handleSize = 15;
      
      // Check corner handles
      const corners = [
        { handle: 'cutout-tl', x: venueX + cutout.x, y: venueY + cutout.y },
        { handle: 'cutout-tr', x: venueX + cutout.x + cutout.width, y: venueY + cutout.y },
        { handle: 'cutout-bl', x: venueX + cutout.x, y: venueY + cutout.y + cutout.height },
        { handle: 'cutout-br', x: venueX + cutout.x + cutout.width, y: venueY + cutout.y + cutout.height },
      ];
      
      for (const corner of corners) {
        if (Math.abs(x - corner.x) < handleSize && Math.abs(y - corner.y) < handleSize) {
          e.preventDefault();
          e.stopPropagation();
          setResizeHandle(corner.handle);
          setResizeStart({ x, y, width: cutout.width, height: cutout.height });
          setIsResizing(true);
          return;
        }
      }
      
      // Check edge handles
      const edges = [
        { handle: 'cutout-t', x: venueX + cutout.x + cutout.width/2, y: venueY + cutout.y },
        { handle: 'cutout-b', x: venueX + cutout.x + cutout.width/2, y: venueY + cutout.y + cutout.height },
        { handle: 'cutout-l', x: venueX + cutout.x, y: venueY + cutout.y + cutout.height/2 },
        { handle: 'cutout-r', x: venueX + cutout.x + cutout.width, y: venueY + cutout.y + cutout.height/2 },
      ];
      
      for (const edge of edges) {
        if (Math.abs(x - edge.x) < handleSize && Math.abs(y - edge.y) < handleSize) {
          e.preventDefault();
          e.stopPropagation();
          setResizeHandle(edge.handle);
          setResizeStart({ x, y, width: cutout.width, height: cutout.height });
          setIsResizing(true);
          return;
        }
      }
    }

    if (!showControls) return;

    const handleSize = 15;
    
    // Check corner handles
    const corners = [
      { handle: 'top-left', x: venueX, y: venueY },
      { handle: 'top-right', x: venueX + venueLayout.dimensions.width, y: venueY },
      { handle: 'bottom-left', x: venueX, y: venueY + venueLayout.dimensions.height },
      { handle: 'bottom-right', x: venueX + venueLayout.dimensions.width, y: venueY + venueLayout.dimensions.height },
    ];
    
    for (const corner of corners) {
      if (Math.abs(x - corner.x) < handleSize && Math.abs(y - corner.y) < handleSize) {
        e.preventDefault();
        e.stopPropagation();
        setResizeHandle(corner.handle);
        setResizeStart({ x, y, width: venueLayout.dimensions.width, height: venueLayout.dimensions.height });
        setIsResizing(true);
        return;
      }
    }
    
    // Check edge handles
    const edges = [
      { handle: 'top', x: venueX + venueLayout.dimensions.width/2, y: venueY },
      { handle: 'bottom', x: venueX + venueLayout.dimensions.width/2, y: venueY + venueLayout.dimensions.height },
      { handle: 'left', x: venueX, y: venueY + venueLayout.dimensions.height/2 },
      { handle: 'right', x: venueX + venueLayout.dimensions.width, y: venueY + venueLayout.dimensions.height/2 },
    ];
    
    for (const edge of edges) {
      if (Math.abs(x - edge.x) < handleSize && Math.abs(y - edge.y) < handleSize) {
        e.preventDefault();
        e.stopPropagation();
        setResizeHandle(edge.handle);
        setResizeStart({ x, y, width: venueLayout.dimensions.width, height: venueLayout.dimensions.height });
        setIsResizing(true);
        return;
      }
    }
    
    // Check circle handle - use bounding box approach
    if (venueLayout.baseShape === 'circle') {
      const centerX = venueX + venueLayout.dimensions.width / 2;
      const centerY = venueY + venueLayout.dimensions.height / 2;
      const halfWidth = venueLayout.dimensions.width / 2;
      const halfHeight = venueLayout.dimensions.height / 2;
      
      // Check if click is within the circle's bounding box
      if (x >= venueX && x <= venueX + venueLayout.dimensions.width &&
          y >= venueY && y <= venueY + venueLayout.dimensions.height) {
        e.preventDefault();
        e.stopPropagation();
        
        // Determine which handle based on which side is closer
        const distToLeft = Math.abs(x - venueX);
        const distToRight = Math.abs(x - (venueX + venueLayout.dimensions.width));
        const distToTop = Math.abs(y - venueY);
        const distToBottom = Math.abs(y - (venueY + venueLayout.dimensions.height));
        
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        
        if (minDist === distToLeft) {
          setResizeHandle('circle-left');
        } else if (minDist === distToRight) {
          setResizeHandle('circle-right');
        } else if (minDist === distToTop) {
          setResizeHandle('circle-top');
        } else {
          setResizeHandle('circle-bottom');
        }
        
        setResizeStart({ x, y, width: venueLayout.dimensions.width, height: venueLayout.dimensions.height });
        setIsResizing(true);
        return;
      }
    }
  };

  // Handle window mouse move for resizing (continues outside canvas)
  const handleWindowMouseMove = (e: MouseEvent) => {
    // Handle table dragging
    if (isDraggingTable && dragTableStart && selectedTable) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const deltaX = x - dragTableStart.x;
      const deltaY = y - dragTableStart.y;

      const newX = dragTableStart.tableX + deltaX;
      const newY = dragTableStart.tableY + deltaY;

      setVenueLayout(prev => {
        const newLayout = {
          ...prev,
          tables: prev.tables.map(table => 
            table.id === selectedTable.id 
              ? { ...table, position: { x: newX, y: newY } }
              : table
          )
        };
        return newLayout;
      });

      setSelectedTable({ ...selectedTable, position: { x: newX, y: newY } });
      return;
    }

    // Handle cutout drawing
    if (isDrawingCutout && cutoutStart) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Calculate venue position
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const venueX = (canvasWidth - venueLayout.dimensions.width) / 2;
      const venueY = (canvasHeight - venueLayout.dimensions.height) / 2;

      // Calculate cutout dimensions in absolute canvas coordinates
      const cutoutAbsX = Math.min(cutoutStart.x, x);
      const cutoutAbsY = Math.min(cutoutStart.y, y);
      const cutoutAbsWidth = Math.abs(x - cutoutStart.x);
      const cutoutAbsHeight = Math.abs(y - cutoutStart.y);

      // Convert to venue-relative coordinates
      const cutoutX = cutoutAbsX - venueX;
      const cutoutY = cutoutAbsY - venueY;

      // Constrain to venue bounds
      const constrainedX = Math.max(0, cutoutX);
      const constrainedY = Math.max(0, cutoutY);
      const constrainedWidth = Math.min(venueLayout.dimensions.width - constrainedX, cutoutAbsWidth);
      const constrainedHeight = Math.min(venueLayout.dimensions.height - constrainedY, cutoutAbsHeight);

      // Update current cutout for rendering
      setCurrentCutout({ x: constrainedX, y: constrainedY, width: constrainedWidth, height: constrainedHeight, shape: cutoutShape });
      return;
    }

    // Handle cutout resize
    if (isResizing && selectedCutout !== null && resizeHandle && resizeStart && resizeHandle.startsWith('cutout-')) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const dx = x - resizeStart.x;
      const dy = y - resizeStart.y;

      const cutout = venueLayout.cutouts[selectedCutout];
      if (!cutout) return;

      let newX = cutout.x;
      let newY = cutout.y;
      let newWidth = cutout.width;
      let newHeight = cutout.height;

      const minSize = 20;

      // Handle based on which corner/edge is being dragged - same as base layout
      if (resizeHandle === 'cutout-r') {
        newWidth = Math.min(venueLayout.dimensions.width - cutout.x, Math.max(minSize, resizeStart.width + dx));
      } else if (resizeHandle === 'cutout-l') {
        newWidth = Math.min(cutout.x + cutout.width, Math.max(minSize, resizeStart.width - dx));
        newX = cutout.x + cutout.width - newWidth;
      } else if (resizeHandle === 'cutout-b') {
        newHeight = Math.min(venueLayout.dimensions.height - cutout.y, Math.max(minSize, resizeStart.height + dy));
      } else if (resizeHandle === 'cutout-t') {
        newHeight = Math.min(cutout.y + cutout.height, Math.max(minSize, resizeStart.height - dy));
        newY = cutout.y + cutout.height - newHeight;
      } else if (resizeHandle === 'cutout-br') {
        newWidth = Math.min(venueLayout.dimensions.width - cutout.x, Math.max(minSize, resizeStart.width + dx));
        newHeight = Math.min(venueLayout.dimensions.height - cutout.y, Math.max(minSize, resizeStart.height + dy));
      } else if (resizeHandle === 'cutout-bl') {
        newWidth = Math.min(cutout.x + cutout.width, Math.max(minSize, resizeStart.width - dx));
        newX = cutout.x + cutout.width - newWidth;
        newHeight = Math.min(venueLayout.dimensions.height - cutout.y, Math.max(minSize, resizeStart.height + dy));
      } else if (resizeHandle === 'cutout-tr') {
        newWidth = Math.min(venueLayout.dimensions.width - cutout.x, Math.max(minSize, resizeStart.width + dx));
        newHeight = Math.min(cutout.y + cutout.height, Math.max(minSize, resizeStart.height - dy));
        newY = cutout.y + cutout.height - newHeight;
      } else if (resizeHandle === 'cutout-tl') {
        newWidth = Math.min(cutout.x + cutout.width, Math.max(minSize, resizeStart.width - dx));
        newX = cutout.x + cutout.width - newWidth;
        newHeight = Math.min(cutout.y + cutout.height, Math.max(minSize, resizeStart.height - dy));
        newY = cutout.y + cutout.height - newHeight;
      }

      // Update cutout
      const updatedCutouts = [...venueLayout.cutouts];
      updatedCutouts[selectedCutout] = { x: newX, y: newY, width: newWidth, height: newHeight, shape: cutout.shape };
      const newLayout = { ...venueLayout, cutouts: updatedCutouts };
      setVenueLayout(newLayout);
      return;
    }

    // Handle dance floor resize
    if (isResizing && resizeHandle && resizeHandle.startsWith('dance-') && resizeTableStart) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const dx = x - resizeTableStart.x;
      const dy = y - resizeTableStart.y;

      const rad = (resizeTableStart.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const ldx = dx * cos + dy * sin;
      const ldy = -dx * sin + dy * cos;

      const minSize = 30;
      let newWidth = resizeTableStart.width;
      let newHeight = resizeTableStart.height;
      let newX = resizeTableStart.position.x;
      let newY = resizeTableStart.position.y;

      if (resizeHandle === 'dance-r') {
        newWidth = Math.max(minSize, resizeTableStart.width + ldx);
        newX = resizeTableStart.position.x + (ldx / 2) * cos;
        newY = resizeTableStart.position.y + (ldx / 2) * sin;
      } else if (resizeHandle === 'dance-l') {
        newWidth = Math.max(minSize, resizeTableStart.width - ldx);
        newX = resizeTableStart.position.x + (ldx / 2) * cos;
        newY = resizeTableStart.position.y + (ldx / 2) * sin;
      } else if (resizeHandle === 'dance-b') {
        newHeight = Math.max(minSize, resizeTableStart.height + ldy);
        newX = resizeTableStart.position.x - (ldy / 2) * sin;
        newY = resizeTableStart.position.y + (ldy / 2) * cos;
      } else if (resizeHandle === 'dance-t') {
        newHeight = Math.max(minSize, resizeTableStart.height - ldy);
        newX = resizeTableStart.position.x - (ldy / 2) * sin;
        newY = resizeTableStart.position.y + (ldy / 2) * cos;
      } else if (resizeHandle === 'dance-br') {
        newWidth = Math.max(minSize, resizeTableStart.width + ldx);
        newHeight = Math.max(minSize, resizeTableStart.height + ldy);
        newX = resizeTableStart.position.x + (ldx / 2) * cos - (ldy / 2) * sin;
        newY = resizeTableStart.position.y + (ldx / 2) * sin + (ldy / 2) * cos;
      } else if (resizeHandle === 'dance-bl') {
        newWidth = Math.max(minSize, resizeTableStart.width - ldx);
        newHeight = Math.max(minSize, resizeTableStart.height + ldy);
        newX = resizeTableStart.position.x + (ldx / 2) * cos - (ldy / 2) * sin;
        newY = resizeTableStart.position.y + (ldx / 2) * sin + (ldy / 2) * cos;
      } else if (resizeHandle === 'dance-tr') {
        newWidth = Math.max(minSize, resizeTableStart.width + ldx);
        newHeight = Math.max(minSize, resizeTableStart.height - ldy);
        newX = resizeTableStart.position.x + (ldx / 2) * cos - (ldy / 2) * sin;
        newY = resizeTableStart.position.y + (ldx / 2) * sin + (ldy / 2) * cos;
      } else if (resizeHandle === 'dance-tl') {
        newWidth = Math.max(minSize, resizeTableStart.width - ldx);
        newHeight = Math.max(minSize, resizeTableStart.height - ldy);
        newX = resizeTableStart.position.x + (ldx / 2) * cos - (ldy / 2) * sin;
        newY = resizeTableStart.position.y + (ldx / 2) * sin + (ldy / 2) * cos;
      }

      // Buffet and other-table keep a fixed height of 25
      if (resizeTableStart.type === 'buffet' || resizeTableStart.type === 'other-table') {
        newHeight = 25;
      }

      // Display table stays round and resizes between 20 and 60
      if (resizeTableStart.type === 'dessert-display') {
        const minSizeDisplay = 20;
        const maxSizeDisplay = 60;
        if (resizeHandle === 'dance-r') {
          const size = Math.max(minSizeDisplay, Math.min(maxSizeDisplay, resizeTableStart.width + ldx));
          newWidth = size;
          newHeight = size;
          newX = resizeTableStart.position.x + ((size - resizeTableStart.width) / 2) * cos;
          newY = resizeTableStart.position.y + ((size - resizeTableStart.width) / 2) * sin;
        } else if (resizeHandle === 'dance-l') {
          const size = Math.max(minSizeDisplay, Math.min(maxSizeDisplay, resizeTableStart.width - ldx));
          newWidth = size;
          newHeight = size;
          newX = resizeTableStart.position.x - ((size - resizeTableStart.width) / 2) * cos;
          newY = resizeTableStart.position.y - ((size - resizeTableStart.width) / 2) * sin;
        }
      }

      const updatedTables = venueLayout.tables.map(table =>
        table.id === resizeTableStart.tableId
          ? { ...table, position: { x: newX, y: newY }, dimensions: { width: newWidth, height: newHeight } }
          : table
      );
      const newTable = updatedTables.find(table => table.id === resizeTableStart.tableId);
      const newLayout = { ...venueLayout, tables: updatedTables };
      setVenueLayout(newLayout);
      if (newTable && selectedTable?.id === resizeTableStart.tableId) {
        setSelectedTable(newTable);
      }
      return;
    }

    if (!isResizing || !resizeStart || !resizeHandle) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const dx = x - resizeStart.x;
    const dy = y - resizeStart.y;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;

    // Maximum dimensions (canvas size with some padding)
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const maxWidth = canvasWidth - 40;
    const maxHeight = canvasHeight - 40;
    const minSize = 100;

    if (resizeHandle === 'right') {
      newWidth = Math.min(maxWidth, Math.max(minSize, resizeStart.width + dx));
    } else if (resizeHandle === 'left') {
      newWidth = Math.min(maxWidth, Math.max(minSize, resizeStart.width - dx));
    } else if (resizeHandle === 'bottom') {
      newHeight = Math.min(maxHeight, Math.max(minSize, resizeStart.height + dy));
    } else if (resizeHandle === 'top') {
      newHeight = Math.min(maxHeight, Math.max(minSize, resizeStart.height - dy));
    } else if (resizeHandle === 'bottom-right') {
      newWidth = Math.min(maxWidth, Math.max(minSize, resizeStart.width + dx));
      newHeight = Math.min(maxHeight, Math.max(minSize, resizeStart.height + dy));
    } else if (resizeHandle === 'bottom-left') {
      newWidth = Math.min(maxWidth, Math.max(minSize, resizeStart.width - dx));
      newHeight = Math.min(maxHeight, Math.max(minSize, resizeStart.height + dy));
    } else if (resizeHandle === 'top-right') {
      newWidth = Math.min(maxWidth, Math.max(minSize, resizeStart.width + dx));
      newHeight = Math.min(maxHeight, Math.max(minSize, resizeStart.height - dy));
    } else if (resizeHandle === 'top-left') {
      newWidth = Math.min(maxWidth, Math.max(minSize, resizeStart.width - dx));
      newHeight = Math.min(maxHeight, Math.max(minSize, resizeStart.height - dy));
    } else if (resizeHandle === 'circle-left') {
      // Only adjust width for left handle
      newWidth = Math.min(maxWidth, Math.max(minSize, resizeStart.width - dx));
      newHeight = resizeStart.height;
    } else if (resizeHandle === 'circle-right') {
      // Only adjust width for right handle
      newWidth = Math.min(maxWidth, Math.max(minSize, resizeStart.width + dx));
      newHeight = resizeStart.height;
    } else if (resizeHandle === 'circle-top') {
      // Only adjust height for top handle
      newWidth = resizeStart.width;
      newHeight = Math.min(maxHeight, Math.max(minSize, resizeStart.height - dy));
    } else if (resizeHandle === 'circle-bottom') {
      // Only adjust height for bottom handle
      newWidth = resizeStart.width;
      newHeight = Math.min(maxHeight, Math.max(minSize, resizeStart.height + dy));
    }

    // Use requestAnimationFrame for smoother updates
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const newLayout = { ...venueLayout, dimensions: { width: newWidth, height: newHeight } };
      setVenueLayout(newLayout);
      animationFrameRef.current = null;
    });
  };

  // Handle window mouse up to stop resizing/cutout drawing
  const handleWindowMouseUp = (e: MouseEvent) => {
    // Handle table dragging stop
    if (isDraggingTable && dragTableStart && mouseDownPos) {
      const mouseUpX = e.clientX;
      const mouseUpY = e.clientY;
      const mouseUpTime = Date.now();
      
      const distance = Math.sqrt(
        Math.pow(mouseUpX - mouseDownPos.x, 2) + 
        Math.pow(mouseUpY - mouseDownPos.y, 2)
      );
      const timeDiff = mouseUpTime - mouseDownTime;
      
      // If moved less than 5px and less than 200ms, it's a click, not a drag
      if (distance < 5 && timeDiff < 200) {
        // It's a click - show table options panel
        const canvas = canvasRef.current;
        if (canvas && selectedTable) {
          const rect = canvas.getBoundingClientRect();
          const panelX = Math.min(mouseDownPos.x - rect.left, rect.width - 200);
          const panelY = Math.min(mouseDownPos.y - rect.top, rect.height - 150);
          setTableOptionsPosition({ x: Math.max(0, panelX), y: Math.max(0, panelY) });
          setShowTableOptions(true);
        }
      } else {
        // It's a drag - save the layout from before drag to history
        if (layoutBeforeDragRef.current) {
          saveToHistory(layoutBeforeDragRef.current);
          layoutBeforeDragRef.current = null;
        }
      }
      
      setIsDraggingTable(false);
      setDragTableStart(null);
      setMouseDownPos(null);
      setMouseDownTime(0);
      return;
    }

    // Handle click on locked table (not dragging but selected)
    if (!isDraggingTable && selectedTable && mouseDownPos) {
      const mouseUpX = e.clientX;
      const mouseUpY = e.clientY;
      const mouseUpTime = Date.now();
      
      const distance = Math.sqrt(
        Math.pow(mouseUpX - mouseDownPos.x, 2) + 
        Math.pow(mouseUpY - mouseDownPos.y, 2)
      );
      const timeDiff = mouseUpTime - mouseDownTime;
      
      // If moved less than 5px and less than 200ms, it's a click
      if (distance < 5 && timeDiff < 200) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const panelX = Math.min(mouseDownPos.x - rect.left, rect.width - 200);
          const panelY = Math.min(mouseDownPos.y - rect.top, rect.height - 150);
          setTableOptionsPosition({ x: Math.max(0, panelX), y: Math.max(0, panelY) });
          setShowTableOptions(true);
        }
      }
      
      setMouseDownPos(null);
      setMouseDownTime(0);
      return;
    }

    // Handle cutout drawing completion
    if (isDrawingCutout && currentCutout && currentCutout.width > 5 && currentCutout.height > 5) {
      // Add cutout to venue layout
      const newLayout = {
        ...venueLayout,
        cutouts: [...venueLayout.cutouts, { x: currentCutout.x, y: currentCutout.y, width: currentCutout.width, height: currentCutout.height, shape: currentCutout.shape }]
      };
      saveToHistory(newLayout);
      setVenueLayout(newLayout);
    }
    
    // Reset cutout state and tool selection
    setCutoutStart(null);
    setCurrentCutout(null);
    setIsDrawingCutout(false);
    setSelectedTool(null);

    // Save to history after resizing completes
    if (isResizing) {
      saveToHistory(venueLayout);
    }
    
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStart(null);
    setResizeTableStart(null);
  };

  // Add/remove window event listeners when resizing or cutout drawing state changes
  useEffect(() => {
    if (isResizing || isDrawingCutout || isDraggingTable) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    } else {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isResizing, isDrawingCutout, isDraggingTable, resizeStart, resizeHandle, resizeTableStart, venueLayout, cutoutStart, currentCutout, dragTableStart, selectedTable]);

  return (
    <div className={`w-full h-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
              Table Map
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Custom Reception Layout and Table Mapping
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Tool Pane */}
        <div className={`p-3 border-b shrink-0 ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center gap-2">
            {/* Lock Layout Button */}
            <button
              onClick={() => {
                const newLockState = !isEditDisabled;
                setIsEditDisabled(newLockState);
                const newLayout = { ...venueLayout, isLocked: newLockState };
                saveToHistory(newLayout);
                setVenueLayout(newLayout);
              }}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
              title={isEditDisabled ? 'Unlock Layout' : 'Lock Layout'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isEditDisabled ? (
                  <>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </>
                ) : (
                  <>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </>
                )}
              </svg>
            </button>

            {/* Reception Base Layout Dropdown */}
            {!isEditDisabled && (
              <div className="relative" ref={baseLayoutDropdownRef}>
                <button
                  onClick={() => setShowBaseLayoutDropdown(!showBaseLayoutDropdown)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    showBaseLayoutDropdown
                      ? 'bg-blue-500 text-white'
                      : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                  onMouseEnter={(e) => { if (!showBaseLayoutDropdown) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                  onMouseLeave={(e) => { if (!showBaseLayoutDropdown) e.currentTarget.style.backgroundColor = '' }}
                  title="Reception Floor Layout"
                >
                  <img src="/assets/ico-mapping-layout.png" alt="Base Layout" width="20" height="20" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
                </button>
                
                {showBaseLayoutDropdown && (
                  <div className={`absolute top-full mt-1 rounded-lg shadow-lg border z-10 min-w-[150px] ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                  }`} style={{ left: dropdownPosition.left, right: dropdownPosition.right }}>
                    <button
                      onClick={() => {
                        const newLayout = { ...venueLayout, baseShape: 'rectangle' as const };
                        saveToHistory(newLayout);
                        setVenueLayout(newLayout);
                        setShowBaseLayoutDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        venueLayout.baseShape === 'rectangle' ? 'font-semibold' : ''
                      } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      Rectangle
                    </button>
                    <button
                      onClick={() => {
                        const newLayout = { ...venueLayout, baseShape: 'circle' as const };
                        saveToHistory(newLayout);
                        setVenueLayout(newLayout);
                        setShowBaseLayoutDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        venueLayout.baseShape === 'circle' ? 'font-semibold' : ''
                      } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      Circle
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cutout Tool with Shape Selection */}
            {!isEditDisabled && (
              <div className="relative" ref={cutoutDropdownRef}>
                <button
                  onClick={() => setShowCutoutDropdown(!showCutoutDropdown)}
                  className={`p-2 rounded-lg transition-colors ${
                    showCutoutDropdown || isDeletingCutout
                      ? 'bg-red-500 text-white'
                      : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  onMouseEnter={(e) => { if (!showCutoutDropdown && !isDeletingCutout) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                  onMouseLeave={(e) => { if (!showCutoutDropdown && !isDeletingCutout) e.currentTarget.style.backgroundColor = '' }}
                  title="Add Cutout"
                >
                  <img src="/assets/ico-mapping-cutout.png" alt="Cutout" width="20" height="20" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
                </button>
                
                {showCutoutDropdown && (
                  <div className={`absolute top-full mt-1 rounded-lg shadow-lg border z-10 min-w-[150px] ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                  }`} style={{ left: dropdownPosition.left, right: dropdownPosition.right }}>
                    <button
                      onClick={() => {
                        setCutoutShape('rectangle');
                        setShowCutoutDropdown(false);
                        setSelectedTool('cutout');
                        setIsDeletingCutout(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      Rectangle Cutout
                    </button>
                    <button
                      onClick={() => {
                        setCutoutShape('circle');
                        setShowCutoutDropdown(false);
                        setSelectedTool('cutout');
                        setIsDeletingCutout(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      Circle Cutout
                    </button>
                    <div className={`h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <button
                      onClick={() => {
                        setShowCutoutDropdown(false);
                        setSelectedTool('delete-cutout');
                        setIsDeletingCutout(true);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-600 dark:text-red-400`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Delete Cutout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Grid Toggle Button */}
            <div className="relative">
              <button
                ref={gridButtonRef}
                onClick={() => setShowGridSlider(!showGridSlider)}
                className={`p-2 rounded-lg transition-colors ${
                  showGridSlider
                    ? 'bg-green-500 text-white'
                    : isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Grid Density"
              >
                <img src="/assets/ico-mapping-grid.png" alt="Grid" width="20" height="20" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
              </button>

              {showGridSlider && (
                <div ref={gridSliderRef} className={`absolute top-full mt-1 rounded-lg shadow-lg border z-10 p-3 min-w-[200px] ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                }`} style={{ left: sliderPosition.left, right: sliderPosition.right }}>
                  <label className={`text-xs font-medium mb-2 block ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`} style={{ fontFamily: "Inter, sans-serif" }}>
                    Grid Density
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={gridDensity}
                    onMouseDown={() => {
                      gridDensityBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                    }}
                    onChange={(e) => {
                      const newDensity = parseInt(e.target.value);
                      setGridDensity(newDensity);
                      const newLayout = { ...venueLayout, gridDensity: newDensity };
                      setVenueLayout(newLayout);
                    }}
                    onMouseUp={() => {
                      if (gridDensityBeforeChangeRef.current) {
                        saveToHistory(gridDensityBeforeChangeRef.current);
                        gridDensityBeforeChangeRef.current = null;
                      }
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${gridDensity}%, ${isDarkMode ? '#374151' : '#e5e7eb'} ${gridDensity}%, ${isDarkMode ? '#374151' : '#e5e7eb'} 100%)`
                    }}
                  />
                  <div className={`text-xs mt-1 text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} style={{ fontFamily: "Inter, sans-serif" }}>
                    {gridDensity}
                  </div>
                </div>
              )}
            </div>

            <div className={`h-6 w-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />

            {/* Color Button */}
            {isEditDisabled && (
              <div className="relative" ref={colorDropdownRef}>
                <button
                  onClick={() => setShowColorDropdown(!showColorDropdown)}
                  className={`p-2 rounded-lg transition-colors ${
                    showColorDropdown
                      ? 'bg-purple-500 text-white'
                      : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  onMouseEnter={(e) => { if (!showColorDropdown) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                  onMouseLeave={(e) => { if (!showColorDropdown) e.currentTarget.style.backgroundColor = '' }}
                  title="Colors"
                >
                  <img src="/assets/ico-mapping-color.png" alt="Colors" width="20" height="20" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
                </button>
                
                {showColorDropdown && (
                  <div className={`absolute top-full mt-1 rounded-lg shadow-lg border z-10 min-w-[200px] overflow-hidden ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                  }`} style={{ left: dropdownPosition.left, right: dropdownPosition.right }}>
                  {/* Door Color Section */}
                  <div>
                    <button
                      onClick={() => setExpandedColorSection(expandedColorSection === 'door' ? null : 'door')}
                      className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      } ${expandedColorSection === 'door' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      <span>Door</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedColorSection === 'door' ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expandedColorSection === 'door' && (
                      <div className={`px-3 py-2 space-y-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setVenueLayout(prev => {
                              saveToHistory(prev);
                              return { ...prev, doorColorMode: 0 as 0 };
                            })}
                            className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                              (venueLayout.doorColorMode ?? 0) === 0
                                ? (isDarkMode ? 'bg-blue-500 border-blue-500 text-white' : 'bg-blue-600 border-blue-600 text-white')
                                : (isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50')
                            }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            Floor
                          </button>
                          <button
                            onClick={() => setVenueLayout(prev => {
                              saveToHistory(prev);
                              return { ...prev, doorColorMode: 1 as 1 };
                            })}
                            className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                              venueLayout.doorColorMode === 1
                                ? (isDarkMode ? 'bg-blue-500 border-blue-500 text-white' : 'bg-blue-600 border-blue-600 text-white')
                                : (isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50')
                            }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            Canvas
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Floor Section */}
                  <div>
                    <button
                      onClick={() => setExpandedColorSection(expandedColorSection === 'floor' ? null : 'floor')}
                      className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      } ${expandedColorSection === 'floor' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      <span>Floor</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedColorSection === 'floor' ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expandedColorSection === 'floor' && (
                      <div className={`px-3 py-2 space-y-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColors.floor}
                            onMouseDown={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            onChange={(e) => {
                              setCustomColors({ ...customColors, floor: e.target.value });
                              const newLayout = { ...venueLayout, floorColor: e.target.value };
                              setVenueLayout(newLayout);
                            }}
                            onMouseUp={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={customColors.floor}
                            onChange={(e) => {
                              setCustomColors({ ...customColors, floor: e.target.value });
                              const newLayout = { ...venueLayout, floorColor: e.target.value };
                              setVenueLayout(newLayout);
                            }}
                            onBlur={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            onFocus={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            className={`flex-1 px-2 py-1 text-sm rounded border ${
                              isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                            }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grid Section */}
                  <div>
                    <button
                      onClick={() => setExpandedColorSection(expandedColorSection === 'grid' ? null : 'grid')}
                      className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      } ${expandedColorSection === 'grid' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      <span>Grid</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedColorSection === 'grid' ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expandedColorSection === 'grid' && (
                      <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColors.grid.startsWith('rgba') ? '#000000' : customColors.grid}
                            onMouseDown={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            onChange={(e) => {
                              setCustomColors({ ...customColors, grid: e.target.value });
                              const newLayout = { ...venueLayout, gridColor: e.target.value };
                              setVenueLayout(newLayout);
                            }}
                            onMouseUp={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={customColors.grid}
                            onChange={(e) => {
                              setCustomColors({ ...customColors, grid: e.target.value });
                              const newLayout = { ...venueLayout, gridColor: e.target.value };
                              setVenueLayout(newLayout);
                            }}
                            onBlur={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            onFocus={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            className={`flex-1 px-2 py-1 text-sm rounded border ${
                              isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                            }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Table Section */}
                  <div>
                    <button
                      onClick={() => setExpandedColorSection(expandedColorSection === 'table' ? null : 'table')}
                      className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      } ${expandedColorSection === 'table' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      <span>Table</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedColorSection === 'table' ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expandedColorSection === 'table' && (
                      <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColors.table}
                            onMouseDown={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            onChange={(e) => {
                              setCustomColors({ ...customColors, table: e.target.value });
                              const newLayout = { ...venueLayout, tableColor: e.target.value };
                              setVenueLayout(newLayout);
                            }}
                            onMouseUp={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={customColors.table}
                            onChange={(e) => {
                              setCustomColors({ ...customColors, table: e.target.value });
                              const newLayout = { ...venueLayout, tableColor: e.target.value };
                              setVenueLayout(newLayout);
                            }}
                            onBlur={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            onFocus={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            className={`flex-1 px-2 py-1 text-sm rounded border ${
                              isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                            }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chair Section */}
                  <div>
                    <button
                      onClick={() => setExpandedColorSection(expandedColorSection === 'chair' ? null : 'chair')}
                      className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      } ${expandedColorSection === 'chair' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      <span>Chair</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedColorSection === 'chair' ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expandedColorSection === 'chair' && (
                      <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColors.chair}
                            onMouseDown={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            onChange={(e) => {
                              const alpha = getAlpha(venueLayout.chairColor || '#ffffff');
                              const hex = toHex(e.target.value);
                              setCustomColors({ ...customColors, chair: hex });
                              const newLayout = { ...venueLayout, chairColor: toRgba(hex, alpha) };
                              setVenueLayout(newLayout);
                            }}
                            onMouseUp={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={customColors.chair}
                            onChange={(e) => {
                              const alpha = getAlpha(venueLayout.chairColor || '#ffffff');
                              const hex = toHex(e.target.value);
                              setCustomColors({ ...customColors, chair: hex });
                              const newLayout = { ...venueLayout, chairColor: toRgba(hex, alpha) };
                              setVenueLayout(newLayout);
                            }}
                            onBlur={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            onFocus={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            className={`flex-1 px-2 py-1 text-sm rounded border ${
                              isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                            }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          />
                          <button
                            type="button"
                            onMouseDown={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            onClick={() => {
                              const alpha = getAlpha(venueLayout.chairColor || '#ffffff');
                              const newAlpha = alpha === 0 ? 1 : 0;
                              const newLayout = { ...venueLayout, chairColor: toRgba(customColors.chair, newAlpha) };
                              setVenueLayout(newLayout);
                            }}
                            onMouseUp={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isDarkMode ? 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                            title={getAlpha(venueLayout.chairColor || '#ffffff') === 0 ? 'Chair color is transparent' : 'Chair color is visible'}
                          >
                            {getAlpha(venueLayout.chairColor || '#ffffff') === 0 ? (
                              <img src="/assets/ico-opa.png" alt="Transparent" width="14" height="14" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
                            ) : (
                              <img src="/assets/ico-opa-off.png" alt="Visible" width="14" height="14" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Outline Section */}
                  <div>
                    <button
                      onClick={() => setExpandedColorSection(expandedColorSection === 'outline' ? null : 'outline')}
                      className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      } ${expandedColorSection === 'outline' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      <span>Outline</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedColorSection === 'outline' ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expandedColorSection === 'outline' && (
                      <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColors.outline}
                            onMouseDown={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            onChange={(e) => {
                              const hex = toHex(e.target.value);
                              setCustomColors({ ...customColors, outline: hex });
                              const newLayout = { ...venueLayout, outlineColor: toRgba(hex, 1) };
                              setVenueLayout(newLayout);
                            }}
                            onMouseUp={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={customColors.outline}
                            onChange={(e) => {
                              const hex = toHex(e.target.value);
                              setCustomColors({ ...customColors, outline: hex });
                              const newLayout = { ...venueLayout, outlineColor: toRgba(hex, 1) };
                              setVenueLayout(newLayout);
                            }}
                            onBlur={() => {
                              if (colorBeforeChangeRef.current) {
                                saveToHistory(colorBeforeChangeRef.current);
                                colorBeforeChangeRef.current = null;
                              }
                            }}
                            onFocus={() => {
                              colorBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                            }}
                            className={`flex-1 px-2 py-1 text-sm rounded border ${
                              isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                            }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            {isEditDisabled && (
              <div className={`h-6 w-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            )}

            {/* Resize Button */}
            {isEditDisabled && (
              <div className="relative">
                <button
                  ref={resizeButtonRef}
                  onClick={() => setShowResizeSlider(!showResizeSlider)}
                  className={`p-2 rounded-lg transition-colors ${
                    showResizeSlider
                      ? 'bg-orange-500 text-white'
                      : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  onMouseEnter={(e) => { if (!showResizeSlider) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                  onMouseLeave={(e) => { if (!showResizeSlider) e.currentTarget.style.backgroundColor = '' }}
                  title="Resize Tables"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </button>
                
                {showResizeSlider && (
                  <div ref={resizeSliderRef} className={`absolute top-full mt-1 rounded-lg shadow-lg border z-10 p-3 min-w-[200px] ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                  }`} style={{ left: sliderPosition.left, right: sliderPosition.right }}>
                  <label className={`text-xs font-medium mb-2 block ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`} style={{ fontFamily: "Inter, sans-serif" }}>
                    Table Scale
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={tableScale}
                    onMouseDown={() => {
                      tableScaleBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                    }}
                    onChange={(e) => {
                      const newScale = parseInt(e.target.value);
                      setTableScale(newScale);
                      const newLayout = { ...venueLayout, tableScale: newScale };
                      setVenueLayout(newLayout);
                    }}
                    onMouseUp={() => {
                      if (tableScaleBeforeChangeRef.current) {
                        saveToHistory(tableScaleBeforeChangeRef.current);
                        tableScaleBeforeChangeRef.current = null;
                      }
                    }}
                    className="w-full"
                    style={{
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      height: '6px',
                      borderRadius: '3px',
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((tableScale - 20) / (150 - 20)) * 100}%, rgba(255, 255, 255, 0.3) ${((tableScale - 20) / (150 - 20)) * 100}%, rgba(255, 255, 255, 0.3) 100%)`,
                      outline: 'none'
                    }}
                  />
                  <div className={`text-xs mt-1 text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} style={{ fontFamily: "Inter, sans-serif" }}>
                    {tableScale}%
                  </div>
                </div>
              )}
            </div>
            )}

            {isEditDisabled && (
              <div className={`h-6 w-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            )}

            {/* Reset Button */}
            <button
              onClick={handleResetToDefaults}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
              title="Reset to Defaults"
            >
              <img src="/assets/ico-mapping-default.png" alt="Reset" width="20" height="20" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
            </button>

            <div className={`h-6 w-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />

            {/* Undo Button */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`p-2 rounded-lg transition-colors ${
                history.length === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
              onMouseEnter={(e) => { if (history.length > 0) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
              onMouseLeave={(e) => { if (history.length > 0) e.currentTarget.style.backgroundColor = '' }}
              title="Undo (Ctrl+Z)"
            >
              <img src="/assets/ico-mapping-undo.png" alt="Undo" width="20" height="20" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
            </button>

            {/* Redo Button */}
            <button
              onClick={handleRedo}
              disabled={future.length === 0}
              className={`p-2 rounded-lg transition-colors ${
                future.length === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
              onMouseEnter={(e) => { if (future.length > 0) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
              onMouseLeave={(e) => { if (future.length > 0) e.currentTarget.style.backgroundColor = '' }}
              title="Redo (Ctrl+Y)"
            >
              <img src="/assets/ico-mapping-redo.png" alt="Redo" width="20" height="20" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
            </button>

            <div className={`h-6 w-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />

            {hasUnsavedChanges && (
              <button
                onClick={() => {
                  const updatedData = { ...data, venueLayout };
                  onChange('venueLayout', venueLayout);
                  if (onImmediateSave) {
                    onImmediateSave(updatedData);
                  }
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Save"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-100">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>
        
        {/* Palette Area / Table Options Area */}
        <div className={`h-48 border-t shrink-0 relative ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          {/* Lock overlay when layout is unlocked */}
          {!isEditDisabled && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-80">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-white text-sm font-medium opacity-80" style={{ fontFamily: "Inter, sans-serif" }}>
                  Lock layout to edit tables
                </span>
              </div>
            </div>
          )}
          
          {showTableOptions && selectedTable ? (
            <div className="flex flex-col h-full">
              <div className={`p-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  {selectedTable.type === 'entrance' ? 'Entrance Options' : (selectedTable.type === 'door' ? 'Door Options' : (selectedTable.type === 'dessert-display' ? 'Display Table Options' : (selectedTable.type === 'dance-floor' ? (selectedTable.name ? `Custom - ${selectedTable.name} Options` : 'Custom Station Options') : (selectedTable.name ? `Table - ${selectedTable.name} Options` : 'Table Options'))))}
                </h3>
                <div className="flex items-center gap-2">
                  {selectedTable.type === 'entrance' || selectedTable.type === 'door' || selectedTable.type === 'round' || selectedTable.type === 'rectangular' || selectedTable.type === 'buffet' || selectedTable.type === 'other-table' || selectedTable.type === 'dessert-display' || selectedTable.type === 'dance-floor' ? (
                    <button
                      onClick={() => {
                        const updatedTables = venueLayout.tables.map(t => 
                          t.id === selectedTable.id ? { ...t, locked: !t.locked } : t
                        );
                        const newLayout = { ...venueLayout, tables: updatedTables };
                        setVenueLayout(newLayout);
                        setSelectedTable(updatedTables.find(t => t.id === selectedTable.id) || null);
                      }}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                        selectedTable.locked 
                          ? (isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                          : (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')
                      }`}
                      title={selectedTable.locked ? 'Unlock' : 'Lock'}
                    >
                      {selectedTable.locked ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        </svg>
                      )}
                    </button>
                  ) : null}
                  <button
                    onClick={handleTableDelete}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                      isDarkMode ? 'bg-red-900/20 hover:bg-red-900/30 text-gray-400' : 'bg-red-50 hover:bg-red-100 text-red-600'
                    }`}
                  >
                    <img src="/assets/ico-delete.png" alt="Delete" width="16" height="16" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'invert(42%) sepia(93%) saturate(1352%) hue-rotate(315deg) brightness(95%) contrast(94%)' }} />
                  </button>
                </div>
              </div>
              <div className={`flex-1 p-3 space-y-4 relative ${selectedTable.locked ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                {/* Lock overlay when table is locked */}
                {selectedTable.locked && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 pointer-events-auto">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-80">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span className="text-white text-sm font-medium opacity-80" style={{ fontFamily: "Inter, sans-serif" }}>
                        Unlock station to edit
                      </span>
                    </div>
                  </div>
                )}
                {selectedTable && selectedTable.type !== 'dessert-display' && (
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={selectedTable?.name || ''}
                      onChange={(e) => handleTableNameChange(e.target.value)}
                      placeholder={selectedTable?.type === 'entrance' ? 'Entrance' : (selectedTable?.type === 'door' ? 'Door' : (selectedTable?.type === 'buffet' || selectedTable?.type === 'other-table' ? 'Buffet, Bar or Cart name' : 'Table name or number'))}
                      className={`w-full px-2 py-1.5 text-sm rounded border ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                      }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                )}
                {selectedTable && selectedTable.type === 'dance-floor' && (
                  <div className="mt-4">
                    <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Display Icon
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const firstName = data.nameType === 'couple' ? data.hisName : data.coupleName;
                        const secondName = data.nameType === 'couple' ? data.herName : '';
                        const firstInitial = (firstName?.trim().charAt(0) || '').toUpperCase();
                        const secondInitial = (secondName?.trim().charAt(0) || '').toUpperCase();
                        const initialText = firstInitial && secondInitial ? `${firstInitial} & ${secondInitial}` : firstInitial || secondInitial;
                        const options = [
                          ...(data.heroIcon && data.heroIcon.trim() !== '' ? [{ value: DANCE_FLOOR_LOGO_VALUE, src: data.heroIcon, label: 'Logo' }] : []),
                          ...(initialText ? [{ value: DANCE_FLOOR_INITIAL_VALUE, label: initialText }] : []),
                          { value: '/assets/ico-mapping-other-newwed.png', src: '/assets/ico-mapping-other-newwed.png', label: 'Newwed' },
                          { value: '/assets/ico-mapping-other-dance.png', src: '/assets/ico-mapping-other-dance.png', label: 'Dance' },
                          { value: undefined, src: DANCE_FLOOR_NO_ICON_URL, label: 'No Icon' },
                        ];
                        return options.map((icon) => {
                          const isSelected = selectedTable?.imageUrl === icon.value;
                          return (
                            <button
                              key={icon.value ?? 'no-icon'}
                              onClick={() => {
                                if (!selectedTable) return;
                                setVenueLayout(prev => {
                                  const newLayout = {
                                    ...prev,
                                    tables: prev.tables.map(table =>
                                      table.id === selectedTable.id ? { ...table, imageUrl: icon.value } : table
                                    )
                                  };
                                  saveToHistory(newLayout);
                                  return newLayout;
                                });
                                setSelectedTable({ ...selectedTable, imageUrl: icon.value });
                              }}
                              className={`w-10 h-10 rounded border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? (isDarkMode ? 'border-blue-500 bg-blue-500/20' : 'border-blue-500 bg-blue-50')
                                  : (isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100')
                              }`}
                              title={icon.label}
                            >
                              {icon.src ? (
                                <img src={icon.src} alt={icon.label} width="24" height="24" style={{ filter: isDarkMode && icon.value !== DANCE_FLOOR_LOGO_VALUE ? 'brightness(0) invert(1)' : 'none' }} />
                              ) : (
                                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} style={{ fontFamily: "Inter, sans-serif" }}>{icon.label}</span>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
                {selectedTable && selectedTable.type === 'dance-floor' && (
                  <div className="mt-4">
                    <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Shape
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {[
                        { value: 'circular' as const, label: 'Circular' },
                        { value: 'rectangular' as const, label: 'Rectangular' },
                      ].map((shape) => {
                        const isSelected = selectedTable?.shape === shape.value;
                        return (
                          <button
                            key={shape.value}
                            onClick={() => {
                              if (!selectedTable) return;
                              setVenueLayout(prev => {
                                const newLayout = {
                                  ...prev,
                                  tables: prev.tables.map(table =>
                                    table.id === selectedTable.id ? { ...table, shape: shape.value } : table
                                  )
                                };
                                saveToHistory(newLayout);
                                return newLayout;
                              });
                              setSelectedTable({ ...selectedTable, shape: shape.value });
                            }}
                            className={`px-3 py-1.5 text-sm rounded transition-colors ${
                              isSelected
                                ? (isDarkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                                : (isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800')
                            }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {shape.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selectedTable && (selectedTable.type === 'buffet' || selectedTable.type === 'rectangular') && (
                  <div className="mt-4 flex items-center justify-between">
                    <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Rounded Corners
                    </label>
                    <button
                      onClick={() => {
                        if (!selectedTable) return;
                        const roundedCorners = !selectedTable.roundedCorners;
                        setVenueLayout(prev => {
                          const newLayout = {
                            ...prev,
                            tables: prev.tables.map(table =>
                              table.id === selectedTable.id
                                ? { ...table, roundedCorners }
                                : table
                            )
                          };
                          saveToHistory(newLayout);
                          return newLayout;
                        });
                        setSelectedTable({ ...selectedTable, roundedCorners });
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        selectedTable.roundedCorners
                          ? (isDarkMode ? 'bg-blue-500' : 'bg-blue-600')
                          : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                      }`}
                      aria-label="Toggle rounded corners"
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          selectedTable.roundedCorners ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}
                {selectedTable && selectedTable.type === 'dance-floor' && selectedTable.shape === 'rectangular' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        Corner Radius
                      </label>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        {selectedTable.cornerRadius ?? 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={selectedTable.cornerRadius ?? 0}
                      onChange={(e) => {
                        if (!selectedTable) return;
                        const cornerRadius = parseInt(e.target.value);
                        setVenueLayout(prev => {
                          const newLayout = {
                            ...prev,
                            tables: prev.tables.map(table =>
                              table.id === selectedTable.id
                                ? { ...table, cornerRadius }
                                : table
                            )
                          };
                          saveToHistory(newLayout);
                          return newLayout;
                        });
                        setSelectedTable({ ...selectedTable, cornerRadius });
                      }}
                      className="w-full"
                      style={{
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        height: '6px',
                        borderRadius: '3px',
                        background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((selectedTable.cornerRadius ?? 0) / 50) * 100}%, rgba(255, 255, 255, 0.3) ${((selectedTable.cornerRadius ?? 0) / 50) * 100}%, rgba(255, 255, 255, 0.3) 100%)`,
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
                {selectedTable && (selectedTable.type === 'door' || selectedTable.type === 'entrance') && (
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="flipVertically"
                      checked={selectedTable?.flipVertically || false}
                      onChange={(e) => {
                        if (!selectedTable) return;
                        setVenueLayout(prev => {
                          const newLayout = {
                            ...prev,
                            tables: prev.tables.map(table => 
                              table.id === selectedTable.id 
                                ? { ...table, flipVertically: e.target.checked }
                                : table
                            )
                          };
                          saveToHistory(newLayout);
                          return newLayout;
                        });
                        setSelectedTable({ ...selectedTable, flipVertically: e.target.checked });
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <label 
                      htmlFor="flipVertically"
                      className={`text-xs font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} 
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Flip Vertically
                    </label>
                  </div>
                )}
                {selectedTable && selectedTable.type === 'door' && (
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="flipHorizontally"
                      checked={selectedTable?.flipHorizontally || false}
                      onChange={(e) => {
                        if (!selectedTable) return;
                        setVenueLayout(prev => {
                          const newLayout = {
                            ...prev,
                            tables: prev.tables.map(table => 
                              table.id === selectedTable.id 
                                ? { ...table, flipHorizontally: e.target.checked }
                                : table
                            )
                          };
                          saveToHistory(newLayout);
                          return newLayout;
                        });
                        setSelectedTable({ ...selectedTable, flipHorizontally: e.target.checked });
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <label 
                      htmlFor="flipHorizontally"
                      className={`text-xs font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} 
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Flip Horizontally
                    </label>
                  </div>
                )}
                {selectedTable && selectedTable.type === 'rectangular' && (
                  <div className="mt-4 flex items-center justify-between">
                    <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Head of Table
                    </label>
                    <button
                      onClick={() => {
                        if (!selectedTable) return;
                        const hasHeadOfTable = !selectedTable.hasHeadOfTable;
                        handleHeadOfTableChange(hasHeadOfTable);
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        selectedTable.hasHeadOfTable !== false
                          ? (isDarkMode ? 'bg-blue-500' : 'bg-blue-600')
                          : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                      }`}
                      aria-label="Toggle head of table"
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          selectedTable.hasHeadOfTable !== false ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}
                {selectedTable && selectedTable.type !== 'dance-floor' && selectedTable.type !== 'buffet' && selectedTable.type !== 'other-table' && selectedTable.type !== 'dessert-display' && selectedTable.type !== 'stage' && selectedTable.type !== 'entrance' && selectedTable.type !== 'door' && (
                  <div className="mt-4">
                    <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Number of Chairs
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const minChairs = selectedTable?.type === 'rectangular' ? 4 : 2;
                          const newCount = Math.max(minChairs, (selectedTable?.chairCount || minChairs) - 2);
                          handleChairCountChange(newCount);
                        }}
                        disabled={selectedTable?.type === 'rectangular' ? (selectedTable?.chairCount || 4) <= 4 : (selectedTable?.chairCount || 2) <= 2}
                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed'
                        }`}
                      >
                        -
                      </button>
                      <div className="relative flex-1">
                        <select
                          value={selectedTable?.chairCount || (selectedTable?.type === 'rectangular' ? 4 : 2)}
                          onChange={(e) => handleChairCountChange(parseInt(e.target.value))}
                          className={`w-full px-2 py-1.5 text-sm rounded border appearance-none cursor-pointer text-center ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                          }`}
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {selectedTable?.type === 'rectangular' 
                            ? [4, 6, 8, 10, 12].map(count => <option key={count} value={count}>{count}</option>)
                            : [2, 4, 6, 8, 10, 12].map(count => <option key={count} value={count}>{count}</option>)
                          }
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          const newCount = Math.min(12, (selectedTable?.chairCount || 2) + 2);
                          handleChairCountChange(newCount);
                        }}
                        disabled={(selectedTable?.chairCount || 2) >= 12}
                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                {selectedTable && selectedTable.type !== 'dance-floor' && selectedTable.type !== 'buffet' && selectedTable.type !== 'other-table' && selectedTable.type !== 'dessert-display' && selectedTable.type !== 'stage' && selectedTable.type !== 'entrance' && selectedTable.type !== 'door' && (
                  <div className="mt-4">
                    <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Chair Type
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const currentIndex = (selectedTable?.chairType?.replace('chair-', '') || '1') as '1' | '2' | '3' | '4' | '5' | '6';
                          const newIndex = currentIndex === '1' ? '6' : (parseInt(currentIndex) - 1).toString() as '1' | '2' | '3' | '4' | '5' | '6';
                          handleChairTypeChange(`chair-${newIndex}`);
                        }}
                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                      >
                        ‹
                      </button>
                      <div className="relative flex-1">
                        <select
                          value={selectedTable?.chairType || 'chair-1'}
                          onChange={(e) => handleChairTypeChange(e.target.value as 'chair-1' | 'chair-2' | 'chair-3' | 'chair-4' | 'chair-5' | 'chair-6')}
                          className={`w-full px-2 py-1.5 text-sm rounded border appearance-none cursor-pointer text-center ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                          }`}
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {['Chair 1', 'Chair 2', 'Chair 3', 'Chair 4', 'Chair 5', 'Chair 6'].map((name, index) => (
                            <option key={name} value={`chair-${index + 1}`}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          const currentIndex = (selectedTable?.chairType?.replace('chair-', '') || '1') as '1' | '2' | '3' | '4' | '5' | '6';
                          const newIndex = currentIndex === '6' ? '1' : (parseInt(currentIndex) + 1).toString() as '1' | '2' | '3' | '4' | '5' | '6';
                          handleChairTypeChange(`chair-${newIndex}`);
                        }}
                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
                {selectedTable && selectedTable.type === 'dessert-display' && (
                  <div className="mt-4">
                    <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Display Icon
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {[
                        { src: '/assets/ico-mapping-mini-round-pastry.png', label: 'Pastry' },
                        { src: '/assets/ico-mapping-mini-round-gift.png', label: 'Gift' },
                        { src: '/assets/ico-mapping-mini-round-cake.png', label: 'Cake' },
                        { src: '/assets/ico-mapping-mini-round-dessert.png', label: 'Dessert' },
                      ].map((icon) => {
                        const isSelected = selectedTable?.imageUrl === icon.src;
                        return (
                          <button
                            key={icon.src}
                            onClick={() => {
                              if (!selectedTable) return;
                              setVenueLayout(prev => {
                                const newLayout = {
                                  ...prev,
                                  tables: prev.tables.map(table =>
                                    table.id === selectedTable.id ? { ...table, imageUrl: icon.src } : table
                                  )
                                };
                                saveToHistory(newLayout);
                                return newLayout;
                              });
                              setSelectedTable({ ...selectedTable, imageUrl: icon.src });
                            }}
                            className={`w-10 h-10 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? (isDarkMode ? 'border-blue-500 bg-blue-500/20' : 'border-blue-500 bg-blue-50')
                                : (isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100')
                            }`}
                            title={icon.label}
                          >
                            <img src={icon.src} alt={icon.label} width="24" height="24" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selectedTable && (selectedTable.type === 'rectangular' || selectedTable.type === 'round' || selectedTable.type === 'dessert-display' || selectedTable.type === 'dance-floor' || selectedTable.type === 'entrance' || selectedTable.type === 'door') && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        Rotate
                      </label>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        {selectedTable?.rotation || 0}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedTable?.rotation || 0}
                      onMouseDown={() => {
                        rotationBeforeChangeRef.current = JSON.parse(JSON.stringify(venueLayout));
                      }}
                      onChange={(e) => handleRotationChange(parseInt(e.target.value))}
                      onMouseUp={() => {
                        if (rotationBeforeChangeRef.current) {
                          saveToHistory(rotationBeforeChangeRef.current);
                          rotationBeforeChangeRef.current = null;
                        }
                      }}
                      className="w-full"
                      style={{
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        height: '6px',
                        borderRadius: '3px',
                        background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((selectedTable?.rotation || 0) / 360) * 100}%, rgba(255, 255, 255, 0.3) ${((selectedTable?.rotation || 0) / 360) * 100}%, rgba(255, 255, 255, 0.3) 100%)`,
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <p className={`text-xs font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Drag tables to the canvas
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[
                  { type: 'round', name: 'Round Table', icon: '/assets/ico-mapping-chair-pallete-round.png' },
                  { type: 'rectangular', name: 'Rect Table', icon: '/assets/ico-mapping-chair-pallete-rect.png' },
                  { type: 'dance-floor', name: 'Custom Station', icon: '/assets/ico-mapping-other-custom.png' },
                  { type: 'buffet', name: 'Buffet', icon: '/assets/ico-mapping-buffet.png' },
                  { type: 'dessert-display', name: 'Display Table', icon: '/assets/ico-mapping-mini-round-pastry.png' },
                  { type: 'entrance', name: 'Entrance', icon: '/assets/ico-mapping-entrance.png' },
                  { type: 'door', name: 'Door', icon: '/assets/ico-mapping-door.png' },
                ].map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.type)}
                    onDragEnd={handleDragEnd}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}` }}
                  >
                    {item.type === 'round' || item.type === 'rectangular' || item.type === 'dance-floor' || item.type === 'buffet' || item.type === 'dessert-display' || item.type === 'entrance' || item.type === 'door' ? (
                      <img src={item.icon} alt={item.name} width="32" height="32" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0.3)' }} />
                    ) : (
                      <span className="text-2xl">{item.icon}</span>
                    )}
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Delete Table
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Are you sure you want to delete this table?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className={`px-4 py-2 text-sm rounded transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className={`px-4 py-2 text-sm rounded transition-colors ${
                    isDarkMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Dialog */}
        {showResetDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Reset to Defaults
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Are you sure you want to reset all colors and settings to defaults?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelReset}
                  className={`px-4 py-2 text-sm rounded transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReset}
                  className={`px-4 py-2 text-sm rounded transition-colors ${
                    isDarkMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
