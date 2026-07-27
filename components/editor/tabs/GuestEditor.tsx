import { useState, useEffect, useRef, useMemo } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { getEntourageGuestNames, type EntourageGuest } from "@/lib/utils/entourageGuests";
import { USHER_INSTRUCTIONS, USHERETTE_INSTRUCTIONS, getNextMessage } from "@/lib/constants/heroMessages";

interface GuestEditorProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
  onSave?: (updatedData: InvitationData) => Promise<void>;
}

type InviteeTitle = "M" | "Mr." | "Ms." | "Mrs.";

export default function GuestEditor({ data, onChange, isDarkMode = false, accentColor = "#6998EE", onClose, onSave }: GuestEditorProps) {
  const [inviteeSort, setInviteeSort] = useState<"alphabetical" | "date-added">("date-added");
  const [inviteePage, setInviteePage] = useState(0);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterIncludeEntourage, setFilterIncludeEntourage] = useState(true);
  const [filterIncludeNormal, setFilterIncludeNormal] = useState(true);
  const [filterSortOption, setFilterSortOption] = useState<"date" | "name" | "ushers" | "usherettes" | "entourage-only" | "normal-only" | "all">("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editGuestData, setEditGuestData] = useState<{ isEntourage: boolean; name: string; title: InviteeTitle; originalIndex: number; plusOne?: string; tableNumber?: string; entourageTitle?: string; instruction?: string } | null>(null);
  const [originalGuestData, setOriginalGuestData] = useState<{ name: string; title: InviteeTitle; plusOne?: string; tableNumber?: string; instruction?: string } | null>(null);
  const [guestNumberError, setGuestNumberError] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestTitle, setNewGuestTitle] = useState<InviteeTitle>("M");
  const [newGuestPlusOne, setNewGuestPlusOne] = useState("");
  const [newGuestTableNumber, setNewGuestTableNumber] = useState("");
  const [addDialogGuestNumberError, setAddDialogGuestNumberError] = useState(false);
  const [addDialogHasChanges, setAddDialogHasChanges] = useState(false);
  const [editDialogHasChanges, setEditDialogHasChanges] = useState(false);
  const inviteeScrollRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Detect changes between current and original guest data
  useEffect(() => {
    if (editGuestData && originalGuestData) {
      const hasChanges = 
        editGuestData.name !== originalGuestData.name ||
        editGuestData.title !== originalGuestData.title ||
        editGuestData.plusOne !== originalGuestData.plusOne ||
        editGuestData.tableNumber !== originalGuestData.tableNumber ||
        editGuestData.instruction !== originalGuestData.instruction;
      const nameIsNotBlank = editGuestData.name.trim() !== "";
      setEditDialogHasChanges(hasChanges && nameIsNotBlank);
    }
  }, [editGuestData, originalGuestData]);

  // Local state for pending changes (not auto-saved)
  const [pendingInvitees, setPendingInvitees] = useState<Array<{ name: string; title: InviteeTitle }>>(() => {
    const inviteesData = (data.rsvpInvitees || []).map(invitee =>
      typeof invitee === 'string' ? { name: invitee, title: "M" as const } : invitee
    );
    return inviteesData;
  });
  const [pendingEntourageHonorifics, setPendingEntourageHonorifics] = useState<Record<string, InviteeTitle>>(data.rsvpEntourageHonorifics || {});
  const [pendingEntourageGuestDetails, setPendingEntourageGuestDetails] = useState<Record<string, { plusOne: string; tableNumber: string; instruction?: string }>>(() => {
    const details = data.rsvpEntourageGuestDetails || {};
    // Convert old number format to new string format
    const converted: Record<string, { plusOne: string; tableNumber: string; instruction?: string }> = {};
    for (const [key, value] of Object.entries(details)) {
      converted[key] = {
        plusOne: typeof value.plusOne === 'number' ? String(value.plusOne) : value.plusOne,
        tableNumber: value.tableNumber,
        instruction: value.instruction
      };
    }
    return converted;
  });
  const [pendingGuestDetails, setPendingGuestDetails] = useState<Record<number, { plusOne: string; tableNumber: string }>>(data.rsvpGuestDetails || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [duplicateErrors, setDuplicateErrors] = useState<Record<number, boolean>>({});

  // Snapshot of initial data for revert detection
  const initialGuestDataSnapshot = useRef(JSON.stringify({
    invitees: (data.rsvpInvitees || []).map((i: any) => typeof i === 'string' ? { name: i, title: 'M' } : i),
    entourageHonorifics: data.rsvpEntourageHonorifics || {},
    entourageGuestDetails: (() => {
      const details = data.rsvpEntourageGuestDetails || {};
      const converted: Record<string, { plusOne: string; tableNumber: string; instruction?: string }> = {};
      for (const [key, value] of Object.entries(details)) {
        converted[key] = {
          plusOne: typeof value.plusOne === 'number' ? String(value.plusOne) : value.plusOne,
          tableNumber: value.tableNumber,
          instruction: value.instruction
        };
      }
      return converted;
    })(),
    guestDetails: data.rsvpGuestDetails || {}
  }));

  // Revert detection: compare current pending state with initial snapshot
  useEffect(() => {
    const currentData = JSON.stringify({
      invitees: pendingInvitees,
      entourageHonorifics: pendingEntourageHonorifics,
      entourageGuestDetails: pendingEntourageGuestDetails,
      guestDetails: pendingGuestDetails
    });
    setHasUnsavedChanges(currentData !== initialGuestDataSnapshot.current);
  }, [pendingInvitees, pendingEntourageHonorifics, pendingEntourageGuestDetails, pendingGuestDetails]);

  // Auto-added guests from the Entourage list (excludes couple, groom's parents, bride's parents).
  // These are read-only here; edit/remove them from the Entourage List instead.
  const entourageGuests = useMemo(() => getEntourageGuestNames(data.entourage), [data.entourage]);

  // Special names that should not be added to the guest list (groom, bride, parents)
  const specialNames = useMemo(() => {
    const names: Array<{ name: string; label: string }> = [];
    if (data.nameType === "event" && data.coupleName?.trim()) names.push({ name: data.coupleName.trim(), label: "The Couple" });
    if (data.nameType === "couple") {
      if (data.hisName?.trim()) names.push({ name: data.hisName.trim(), label: "The Groom" });
      if (data.herName?.trim()) names.push({ name: data.herName.trim(), label: "The Bride" });
    }
    const ent = data.entourage;
    if (ent?.couple?.groomName?.trim()) names.push({ name: ent.couple.groomName.trim(), label: "The Groom" });
    if (ent?.couple?.brideName?.trim()) names.push({ name: ent.couple.brideName.trim(), label: "The Bride" });
    if (ent?.groomParents?.fatherName?.trim()) names.push({ name: ent.groomParents.fatherName.trim(), label: "The Groom's Parents" });
    if (ent?.groomParents?.motherName?.trim()) names.push({ name: ent.groomParents.motherName.trim(), label: "The Groom's Parents" });
    if (ent?.brideParents?.fatherName?.trim()) names.push({ name: ent.brideParents.fatherName.trim(), label: "The Bride's Parents" });
    if (ent?.brideParents?.motherName?.trim()) names.push({ name: ent.brideParents.motherName.trim(), label: "The Bride's Parents" });
    return names;
  }, [data.nameType, data.coupleName, data.hisName, data.herName, data.entourage]);

  const getSpecialNameLabel = (name: string): string | null => {
    const lower = name.toLowerCase().trim();
    const match = specialNames.find(n => n.name.toLowerCase().trim() === lower);
    return match ? match.label : null;
  };

  const isSpecialName = (name: string) => {
    return getSpecialNameLabel(name) !== null;
  };

  // Check for duplicate names (case-insensitive)
  const checkDuplicate = (name: string, currentIndex: number) => {
    if (!name.trim()) return false;
    const lowerName = name.toLowerCase().trim();
    
    // Get all names excluding current index
    const regularNames = pendingInvitees
      .map((inv, idx) => ({ name: inv.name.toLowerCase().trim(), idx }))
      .filter(item => item.idx !== currentIndex && item.name !== "")
      .map(item => item.name);
    
    const entourageNames = entourageGuests.map(guest => guest.name.toLowerCase().trim());
    const allNames = [...regularNames, ...entourageNames];
    
    return allNames.includes(lowerName);
  };

  // Handle entourage honorific changes (local only)
  const handleEntourageHonorificChange = (guestName: string, title: InviteeTitle) => {
    const updated = { ...pendingEntourageHonorifics, [guestName]: title };
    setPendingEntourageHonorifics(updated);
  };

  // Handle invitee changes (local only)
  const handleInviteeChange = (index: number, field: "name" | "title", value: string) => {
    const updated = [...pendingInvitees];
    updated[index] = { ...updated[index], [field]: value as InviteeTitle };
    setPendingInvitees(updated);

    // Check for duplicate if name is being changed
    if (field === "name") {
      const isDuplicate = checkDuplicate(value, index);
      setDuplicateErrors(prev => ({ ...prev, [index]: isDuplicate }));
    }
  };

  // Handle invitee removal (local only)
  const handleInviteeRemove = (index: number, name: string) => {
    const doRemove = () => {
      const updated = [...pendingInvitees];
      updated.splice(index, 1);
      setPendingInvitees(updated);
      // Reindex pendingGuestDetails after splice
      const newGuestDetails: Record<number, { plusOne: string; tableNumber: string }> = {};
      Object.entries(pendingGuestDetails).forEach(([key, value]) => {
        const numKey = Number(key);
        if (numKey < index) {
          newGuestDetails[numKey] = value;
        } else if (numKey > index) {
          newGuestDetails[numKey - 1] = value;
        }
        // Skip the removed index
      });
      setPendingGuestDetails(newGuestDetails);
      // Clear duplicate error for this index
      setDuplicateErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    };
    if (name.trim()) {
      if (confirm(`Remove "${name}" from the guest list?`)) {
        doRemove();
      }
    } else {
      doRemove();
    }
  };

  // Handle adding new invitee (local only)
  const handleAddInvitee = () => {
    const updated = [...pendingInvitees, { name: "", title: "M" as const }];
    setPendingInvitees(updated);
  };

  // Recalculate duplicate errors when pendingInvitees changes
  useEffect(() => {
    const newErrors: Record<number, boolean> = {};
    pendingInvitees.forEach((invitee, index) => {
      newErrors[index] = checkDuplicate(invitee.name, index);
    });
    setDuplicateErrors(newErrors);
  }, [pendingInvitees, entourageGuests]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterMenu]);

  // Apply changes to parent state (no API save)
  const applyPendingChanges = () => {
    // Check for any duplicate errors before applying
    const hasDuplicates = Object.values(duplicateErrors).some(error => error);
    if (hasDuplicates) {
      return; // Don't apply if there are duplicates
    }
    // Filter out guests with blank names
    const filteredInvitees = pendingInvitees.filter(invitee => invitee.name.trim() !== "");
    onChange("rsvpInvitees", filteredInvitees as unknown as InvitationData[keyof InvitationData]);
    onChange("rsvpEntourageHonorifics", pendingEntourageHonorifics as unknown as InvitationData[keyof InvitationData]);
    onChange("rsvpEntourageGuestDetails", pendingEntourageGuestDetails as unknown as InvitationData[keyof InvitationData]);
    onChange("rsvpGuestDetails", pendingGuestDetails as unknown as InvitationData[keyof InvitationData]);
  };

  // Handle close - auto-apply pending changes, no save prompt
  const handleClose = () => {
    applyPendingChanges();
    onClose();
  };

  const combinedInvitees = useMemo(() => {
    // Build display items based on filter options
    let displayInvitees: Array<{ name: string; title: InviteeTitle; originalIndex: number; readOnly: false; key: string; guestName?: string }> = [];
    let entourageDisplayItems: Array<{ name: string; title: InviteeTitle; originalIndex: number; readOnly: true; key: string; guestName: string }> = [];

    if (filterIncludeNormal) {
      displayInvitees = pendingInvitees.map((invitee, idx) => ({ ...invitee, originalIndex: idx, readOnly: false, key: `guest-${idx}` }));
    }

    if (filterIncludeEntourage) {
      entourageDisplayItems = entourageGuests.map((guest: EntourageGuest, idx: number) => ({
        name: `${guest.name}\n(${guest.title})`,
        title: "M",
        originalIndex: -1,
        readOnly: true,
        key: `entourage-${idx}`,
        guestName: guest.name,
        entourageTitle: guest.title,
      }));
    }

    // Sort based on filter option
    const allItems = [...entourageDisplayItems, ...displayInvitees];
    
    if (filterSortOption === "name") {
      allItems.sort((a, b) => {
        const nameA = a.name.split('\n')[0].toLowerCase();
        const nameB = b.name.split('\n')[0].toLowerCase();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
    } else if (filterSortOption === "ushers") {
      let filtered = allItems.filter(item => (item as any).entourageTitle === "Ushers");
      filtered.sort((a, b) => {
        const nameA = a.name.split('\n')[0].toLowerCase();
        const nameB = b.name.split('\n')[0].toLowerCase();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
      return filtered;
    } else if (filterSortOption === "usherettes") {
      let filtered = allItems.filter(item => (item as any).entourageTitle === "Usherettes");
      filtered.sort((a, b) => {
        const nameA = a.name.split('\n')[0].toLowerCase();
        const nameB = b.name.split('\n')[0].toLowerCase();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
      return filtered;
    } else if (filterSortOption === "entourage-only") {
      let filtered = allItems.filter(item => item.readOnly === true);
      filtered.sort((a, b) => {
        const nameA = a.name.split('\n')[0].toLowerCase();
        const nameB = b.name.split('\n')[0].toLowerCase();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
      return filtered;
    } else if (filterSortOption === "normal-only") {
      let filtered = allItems.filter(item => item.readOnly === false);
      filtered.sort((a, b) => {
        const nameA = a.name.split('\n')[0].toLowerCase();
        const nameB = b.name.split('\n')[0].toLowerCase();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
      return filtered;
    }
    // "date" keeps original order (entourage first, then date-added order for regular)

    // Keep empty string at the end if it exists
    const emptyIndex = allItems.findIndex(item => item.name === "");
    if (emptyIndex !== -1) {
      const [emptyItem] = allItems.splice(emptyIndex, 1);
      allItems.push(emptyItem);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return allItems.filter(item => {
        const name = item.name.split('\n')[0].toLowerCase();
        return name.includes(query);
      });
    }

    return allItems;
  }, [pendingInvitees, entourageGuests, filterIncludeNormal, filterIncludeEntourage, filterSortOption, searchQuery]);

  // Pagination: 25 per page
  const itemsPerPage = 25;
  const totalPages = Math.ceil(combinedInvitees.length / itemsPerPage);

  // Reset page if it's out of bounds (e.g., after deletions)
  useEffect(() => {
    if (inviteePage >= totalPages && totalPages > 0) {
      setInviteePage(totalPages - 1);
    }
  }, [inviteePage, totalPages]);

  // Update current page when scrolling
  useEffect(() => {
    const scrollContainer = inviteeScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.clientWidth;
      const currentPage = Math.round(scrollLeft / containerWidth);
      setInviteePage(currentPage);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`w-full h-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Header - fixed, not scrollable */}
      <div className={`flex items-center justify-between p-4 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
            title="Back to Tools"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
              Guest List
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Manage your RSVP invitee list
            </p>
          </div>
        </div>
      </div>

      {/* Guest list header - outside scrollable area */}
      <div className="px-4 py-2 space-y-3 shrink-0" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex items-center justify-between">
          <label className="block text-xs tracking-wide uppercase text-gray-500">
            GUEST LIST ({combinedInvitees.filter(item => item.name.trim() !== "").length})
          </label>
          <div className="flex items-center gap-2">
            <div className="relative" ref={filterMenuRef}>
              <button
                type="button"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                title="Filter guests"
                className="p-1.5 rounded transition-colors"
                style={{ filter: isDarkMode ? "brightness(0.7)" : "brightness(0.4)" }}
              >
                <img src="/assets/ico-filter.png" alt="Filter" width="16" height="16" />
              </button>
              
              {showFilterMenu && (
                <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-50 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => setFilterSortOption("date")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterSortOption === "date" ? (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900") : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}`}
                    >
                      Sort by Date
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterSortOption("name")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterSortOption === "name" ? (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900") : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}`}
                    >
                      Sort by Name
                    </button>
                    <div className={`my-1 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}></div>
                    <button
                      type="button"
                      onClick={() => setFilterSortOption("ushers")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterSortOption === "ushers" ? (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900") : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}`}
                    >
                      Ushers Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterSortOption("usherettes")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterSortOption === "usherettes" ? (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900") : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}`}
                    >
                      Usherettes Only
                    </button>
                    <div className={`my-1 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}></div>
                    <button
                      type="button"
                      onClick={() => setFilterSortOption("entourage-only")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterSortOption === "entourage-only" ? (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900") : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}`}
                    >
                      Entourage Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterSortOption("normal-only")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterSortOption === "normal-only" ? (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900") : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}`}
                    >
                      Normal Guest Only
                    </button>
                    <div className={`my-1 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}></div>
                    <button
                      type="button"
                      onClick={() => setFilterSortOption("all")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterSortOption === "all" ? (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900") : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}`}
                    >
                      Show All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-full">
          {searchQuery.trim() && combinedInvitees.length === 0 && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 z-10 cursor-pointer"
              onClick={() => {
                setNewGuestName(searchQuery.trim());
                setShowAddDialog(true);
              }}
              style={{
                backgroundColor: accentColor,
                WebkitMaskImage: 'url(/assets/ico-addguest.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
                maskImage: 'url(/assets/ico-addguest.png)',
                maskSize: 'contain',
                maskPosition: 'center',
                maskRepeat: 'no-repeat',
              }}
            />
          )}
          <input
            type="text"
            placeholder="Search or add guests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2 rounded-lg text-sm focus:outline-none transition-colors ${
              isDarkMode 
                ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500" 
                : "bg-gray-100 border-gray-200 text-gray-700 placeholder-gray-500"
            } border ${searchQuery.trim() && combinedInvitees.length === 0 ? 'pl-10' : 'px-4'}`}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        <div className="space-y-2">
          <div className="space-y-2">
            <div
              ref={inviteeScrollRef}
              className="overflow-x-auto snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex snap-x snap-mandatory" style={{ minWidth: '100%' }}>
                {Array.from({ length: totalPages }).map((_, pageIndex) => (
                        <div
                          key={pageIndex}
                          className="flex-col gap-2 shrink-0 w-full snap-start space-y-2"
                          style={{ scrollSnapAlign: 'start' }}
                        >
                          {combinedInvitees
                            .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
                            .map(({ name, originalIndex, readOnly, key, guestName, ...item }) => (
                              readOnly ? (
                                <div key={key} className="flex items-center gap-2">
                                  <div
                                    onClick={() => {
                                      const guestDetails = pendingEntourageGuestDetails[guestName] || { plusOne: "", tableNumber: "" };
                                      const entTitle = (item as any).entourageTitle || "";
                                      setEditGuestData({ 
                                        isEntourage: true, 
                                        name: guestName, 
                                        title: pendingEntourageHonorifics[guestName] || "M", 
                                        originalIndex,
                                        plusOne: guestDetails.plusOne,
                                        tableNumber: guestDetails.tableNumber,
                                        entourageTitle: entTitle,
                                        instruction: guestDetails.instruction || ""
                                      });
                                      setOriginalGuestData({
                                        name: guestName,
                                        title: pendingEntourageHonorifics[guestName] || "M",
                                        plusOne: guestDetails.plusOne,
                                        tableNumber: guestDetails.tableNumber,
                                        instruction: guestDetails.instruction || ""
                                      });
                                      setGuestNumberError(false);
                                      setEditDialogHasChanges(false);
                                      setShowEditDialog(true);
                                    }}
                                    className={`flex-1 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${isDarkMode ? "border-gray-700 text-gray-300 hover:border-gray-500" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                                    style={isDarkMode ? { backgroundColor: "#151B24", whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#EDEEF1", whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif" }}
                                    title="Auto-added from Entourage List - Click to edit"
                                  >
                                    {name}
                                  </div>
                                </div>
                              ) : (
                              <div key={key} className="flex items-center gap-2">
                                <div
                                  onClick={() => {
                                    const guestDetails = pendingGuestDetails[originalIndex] || { plusOne: "", tableNumber: "" };
                                    setEditGuestData({ 
                                      isEntourage: false, 
                                      name: pendingInvitees[originalIndex]?.name || "", 
                                      title: pendingInvitees[originalIndex]?.title || "M", 
                                      originalIndex,
                                      plusOne: guestDetails.plusOne,
                                      tableNumber: guestDetails.tableNumber
                                    });
                                    setOriginalGuestData({
                                      name: pendingInvitees[originalIndex]?.name || "",
                                      title: pendingInvitees[originalIndex]?.title || "M",
                                      plusOne: guestDetails.plusOne,
                                      tableNumber: guestDetails.tableNumber
                                    });
                                    setGuestNumberError(false);
                                    setEditDialogHasChanges(false);
                                    setShowEditDialog(true);
                                  }}
                                  className={`flex-1 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${isDarkMode ? "border-gray-700 text-gray-200 hover:border-gray-500" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                                  style={isDarkMode ? { backgroundColor: "#1C2531", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                                >
                                  {name}
                                </div>
                              </div>
                              )
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
          </div>
        </div>
      </div>

      {/* Pagination dots - fixed outside scrollable area */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-3">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInviteePage(idx);
                const pageElement = inviteeScrollRef.current?.children[0]?.children[idx] as HTMLElement;
                if (pageElement) {
                  pageElement.scrollIntoView({ behavior: 'smooth', inline: 'start' });
                }
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === inviteePage
                  ? "scale-125"
                  : "opacity-40"
              }`}
              style={{ backgroundColor: accentColor }}
            />
          ))}
        </div>
      )}

      {/* Add Guest Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddDialog(false)}>
          <div 
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Add Guest
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const titles: InviteeTitle[] = ["M", "Mr.", "Ms.", "Mrs."];
                    const currentIndex = titles.indexOf(newGuestTitle);
                    const nextIndex = (currentIndex + 1) % titles.length;
                    setNewGuestTitle(titles[nextIndex]);
                    setAddDialogHasChanges(true);
                  }}
                  className={`w-24 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-200 text-gray-700"}`}
                  style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                >
                  {newGuestTitle}
                </button>
                <input
                  type="text"
                  value={newGuestName}
                  onChange={(e) => {
                    setNewGuestName(e.target.value);
                    setAddDialogHasChanges(true);
                  }}
                  placeholder="Guest name"
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-200 text-gray-700"}`}
                  style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                />
              </div>
              {(() => {
                const lowerName = newGuestName.toLowerCase().trim();
                if (!lowerName) return null;
                const normalMatch = pendingInvitees.some(inv => inv.name.toLowerCase().trim() === lowerName);
                const entourageMatch = entourageGuests.some(g => g.name.toLowerCase().trim() === lowerName);
                const specialLabel = getSpecialNameLabel(newGuestName);
                if (specialLabel) {
                  return (
                    <p className="text-red-500 text-xs ml-28" style={{ fontFamily: "Inter, sans-serif" }}>
                      You cannot add {specialLabel} to the list
                    </p>
                  );
                }
                if (normalMatch || entourageMatch) {
                  return (
                    <p className="text-red-500 text-xs ml-28" style={{ fontFamily: "Inter, sans-serif" }}>
                      This name already exists
                    </p>
                  );
                }
                return null;
              })()}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-24 px-3 py-2 border rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: "transparent", borderColor: "transparent", fontFamily: "Inter, sans-serif", color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                    Guest #:
                  </div>
                  <input
                    type="text"
                    value={newGuestPlusOne}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewGuestPlusOne(value);
                      setAddDialogHasChanges(true);
                      
                      // Validate: must be a number and between 1-5
                      const num = parseInt(value);
                      if (value && (isNaN(num) || num < 1 || num > 5)) {
                        setAddDialogGuestNumberError(true);
                      } else {
                        setAddDialogGuestNumberError(false);
                      }
                    }}
                    placeholder="Number of Guest under this name"
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-200 text-gray-700"}`}
                    style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                  />
                </div>
                {addDialogGuestNumberError && (
                  <p className="text-red-500 text-xs ml-28" style={{ fontFamily: "Inter, sans-serif" }}>
                    Type numbers only from 1-5
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 px-3 py-2 border rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: "transparent", borderColor: "transparent", fontFamily: "Inter, sans-serif", color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                  Table #:
                </div>
                <input
                  type="text"
                  value={newGuestTableNumber}
                  onChange={(e) => {
                    setNewGuestTableNumber(e.target.value);
                    setAddDialogHasChanges(true);
                  }}
                  placeholder="Table name or number"
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-200 text-gray-700"}`}
                  style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                />
              </div>
              <div className="flex gap-2">
                {addDialogHasChanges ? (
                  <button
                    onClick={() => {
                      if (newGuestName.trim()) {
                        const updated = [...pendingInvitees, { name: newGuestName.trim(), title: newGuestTitle }];
                        setPendingInvitees(updated);
                        const newIndex = updated.length - 1;
                        setPendingGuestDetails({
                          ...pendingGuestDetails,
                          [newIndex]: {
                            plusOne: newGuestPlusOne,
                            tableNumber: newGuestTableNumber
                          }
                        });
                        setShowAddDialog(false);
                        setNewGuestName("");
                        setNewGuestTitle("M");
                        setNewGuestPlusOne("");
                        setNewGuestTableNumber("");
                        setAddDialogHasChanges(false);
                        setAddDialogGuestNumberError(false);
                      }
                    }}
                    disabled={addDialogGuestNumberError || !newGuestName.trim() || (() => {
                      const lowerName = newGuestName.toLowerCase().trim();
                      return pendingInvitees.some(inv => inv.name.toLowerCase().trim() === lowerName) ||
                        entourageGuests.some(g => g.name.toLowerCase().trim() === lowerName) ||
                        isSpecialName(newGuestName);
                    })()}
                    className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: (addDialogGuestNumberError || !newGuestName.trim() || (() => {
                      const lowerName = newGuestName.toLowerCase().trim();
                      return pendingInvitees.some(inv => inv.name.toLowerCase().trim() === lowerName) ||
                        entourageGuests.some(g => g.name.toLowerCase().trim() === lowerName) ||
                        isSpecialName(newGuestName);
                    })()) ? "#9CA3AF" : accentColor, fontFamily: "Inter, sans-serif" }}
                  >
                    Add
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowAddDialog(false);
                      setNewGuestName("");
                      setNewGuestTitle("M");
                      setNewGuestPlusOne("");
                      setNewGuestTableNumber("");
                      setAddDialogHasChanges(false);
                      setAddDialogGuestNumberError(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: isDarkMode ? "#374151" : "#E5E7EB", color: isDarkMode ? "#9CA3AF" : "#6B7280", fontFamily: "Inter, sans-serif" }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Guest Dialog */}
      {showEditDialog && editGuestData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditDialog(false)}>
          <div 
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Edit Guest
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const titles: InviteeTitle[] = ["M", "Mr.", "Ms.", "Mrs."];
                    const currentIndex = titles.indexOf(editGuestData.title);
                    const nextIndex = (currentIndex + 1) % titles.length;
                    setEditGuestData({ ...editGuestData, title: titles[nextIndex] });
                  }}
                  className={`w-24 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-200 text-gray-700"}`}
                  style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                >
                  {editGuestData.title}
                </button>
                <input
                  type="text"
                  value={editGuestData.name}
                  onChange={(e) => {
                    setEditGuestData({ ...editGuestData, name: e.target.value });
                  }}
                  placeholder="Guest name"
                  disabled={editGuestData.isEntourage}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${editGuestData.isEntourage ? "cursor-not-allowed opacity-50" : ""} ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-200 text-gray-700"}`}
                  style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                />
              </div>
              {editGuestData.isEntourage && (editGuestData.entourageTitle === "Ushers" || editGuestData.entourageTitle === "Usherettes") && (
                <div className="relative">
                  <textarea
                    value={editGuestData.instruction || ""}
                    onChange={(e) => {
                      setEditGuestData({ ...editGuestData, instruction: e.target.value });
                    }}
                    placeholder={editGuestData.entourageTitle === "Ushers" ? "As one of the Usher, may you please help us with the parking space?" : "e.g. As one of the Usherette, may you please guide our guest?"}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-200 text-gray-700"}`}
                    style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const messages = editGuestData.entourageTitle === "Ushers" ? USHER_INSTRUCTIONS : USHERETTE_INSTRUCTIONS;
                      const currentText = editGuestData.instruction || "";
                      const currentIndex = messages.indexOf(currentText);
                      const { nextIndex } = getNextMessage(messages, currentIndex >= 0 ? currentIndex : -1);
                      setEditGuestData({ ...editGuestData, instruction: messages[nextIndex] });
                    }}
                    title="Cycle through predefined instructions"
                    className="absolute top-1 right-1 p-1 rounded transition-colors"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 4v6h-6" />
                      <path d="M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </button>
                </div>
              )}
              <>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-24 px-3 py-2 border rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: "transparent", borderColor: "transparent", fontFamily: "Inter, sans-serif", color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                      Guest #:
                    </div>
                    <input
                      type="text"
                      value={editGuestData.plusOne || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditGuestData({ ...editGuestData, plusOne: value });
                        
                        // Validate: must be a number and between 1-5
                        const num = parseInt(value);
                        if (value && (isNaN(num) || num < 1 || num > 5)) {
                          setGuestNumberError(true);
                        } else {
                          setGuestNumberError(false);
                        }
                      }}
                      placeholder="Number of Guest under this name"
                      className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-200 text-gray-700"}`}
                      style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                    />
                  </div>
                  {guestNumberError && (
                    <p className="text-red-500 text-xs ml-28" style={{ fontFamily: "Inter, sans-serif" }}>
                      Type numbers only from 1-5
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 px-3 py-2 border rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: "transparent", borderColor: "transparent", fontFamily: "Inter, sans-serif", color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                    Table #:
                  </div>
                  <input
                    type="text"
                    value={editGuestData.tableNumber || ""}
                    onChange={(e) => {
                      setEditGuestData({ ...editGuestData, tableNumber: e.target.value });
                    }}
                    placeholder="Table name or number"
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-200 text-gray-700"}`}
                    style={{ backgroundColor: isDarkMode ? "#1C2531" : "#F3F4F6", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                  />
                </div>
              </>
              <div className="flex gap-2">
                {!editGuestData.isEntourage && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-24 px-3 py-2 rounded-lg flex items-center justify-center transition-colors"
                    style={{ backgroundColor: "#EF4444", color: "white", fontFamily: "Inter, sans-serif" }}
                  >
                    <img src="/assets/ico-delete.png" alt="Delete" width="20" height="20" />
                  </button>
                )}
                {editDialogHasChanges && !guestNumberError ? (
                  <button
                    onClick={() => {
                      if (editGuestData.isEntourage) {
                        setPendingEntourageHonorifics({ ...pendingEntourageHonorifics, [editGuestData.name]: editGuestData.title });
                        setPendingEntourageGuestDetails({ 
                          ...pendingEntourageGuestDetails, 
                          [editGuestData.name]: { 
                            plusOne: editGuestData.plusOne || "", 
                            tableNumber: editGuestData.tableNumber || "",
                            instruction: editGuestData.instruction || undefined
                          } 
                        });
                      } else {
                        const updated = [...pendingInvitees];
                        updated[editGuestData.originalIndex] = { name: editGuestData.name, title: editGuestData.title };
                        setPendingInvitees(updated);
                        setPendingGuestDetails({
                          ...pendingGuestDetails,
                          [editGuestData.originalIndex]: {
                            plusOne: editGuestData.plusOne || "",
                            tableNumber: editGuestData.tableNumber || ""
                          }
                        });
                      }
                      setShowEditDialog(false);
                      setEditGuestData(null);
                      setOriginalGuestData(null);
                      setGuestNumberError(false);
                    }}
                    className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
                  >
                    Update
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowEditDialog(false);
                      setEditGuestData(null);
                      setOriginalGuestData(null);
                      setGuestNumberError(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: isDarkMode ? "#374151" : "#E5E7EB", color: isDarkMode ? "#9CA3AF" : "#6B7280", fontFamily: "Inter, sans-serif" }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Delete Guest
            </h3>
            <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Are you sure you want to delete "{editGuestData?.name}" from the guest list?
            </p>
            <p className="text-red-500 text-xs mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setShowEditDialog(false);
                  setEditGuestData(null);
                  setOriginalGuestData(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: isDarkMode ? "#374151" : "#E5E7EB", color: isDarkMode ? "#9CA3AF" : "#6B7280", fontFamily: "Inter, sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editGuestData) {
                    const idx = editGuestData.originalIndex;
                    const updated = [...pendingInvitees];
                    updated.splice(idx, 1);
                    setPendingInvitees(updated);
                    // Reindex pendingGuestDetails after splice
                    const newGuestDetails: Record<number, { plusOne: string; tableNumber: string }> = {};
                    Object.entries(pendingGuestDetails).forEach(([key, value]) => {
                      const numKey = Number(key);
                      if (numKey < idx) {
                        newGuestDetails[numKey] = value;
                      } else if (numKey > idx) {
                        newGuestDetails[numKey - 1] = value;
                      }
                    });
                    setPendingGuestDetails(newGuestDetails);
                    setShowDeleteConfirm(false);
                    setShowEditDialog(false);
                    setEditGuestData(null);
                    setOriginalGuestData(null);
                    setGuestNumberError(false);
                  }
                }}
                className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: "#EF4444", fontFamily: "Inter, sans-serif" }}
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
