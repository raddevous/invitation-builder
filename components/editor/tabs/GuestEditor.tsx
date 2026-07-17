import { useState, useEffect, useRef, useMemo } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { getEntourageGuestNames, type EntourageGuest } from "@/lib/utils/entourageGuests";

interface GuestEditorProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
  onSave?: (updatedData: InvitationData) => Promise<void>;
}

type InviteeTitle = "M" | "Mr." | "Ms." | "Mrs.";

export default function GuestEditor({ data, onChange, isDarkMode = false, accentColor = "#B88A78", onClose, onSave }: GuestEditorProps) {
  const [inviteeSort, setInviteeSort] = useState<"alphabetical" | "date-added">("date-added");
  const [inviteePage, setInviteePage] = useState(0);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterIncludeEntourage, setFilterIncludeEntourage] = useState(true);
  const [filterIncludeNormal, setFilterIncludeNormal] = useState(true);
  const [filterSortOption, setFilterSortOption] = useState<"date" | "name" | "date-entourage" | "name-entourage">("date");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editGuestData, setEditGuestData] = useState<{ isEntourage: boolean; name: string; title: InviteeTitle; originalIndex: number; plusOne?: string; tableNumber?: string } | null>(null);
  const [originalGuestData, setOriginalGuestData] = useState<{ name: string; title: InviteeTitle; plusOne?: string; tableNumber?: string } | null>(null);
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
        editGuestData.tableNumber !== originalGuestData.tableNumber;
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
  const [pendingEntourageGuestDetails, setPendingEntourageGuestDetails] = useState<Record<string, { plusOne: string; tableNumber: string }>>(() => {
    const details = data.rsvpEntourageGuestDetails || {};
    // Convert old number format to new string format
    const converted: Record<string, { plusOne: string; tableNumber: string }> = {};
    for (const [key, value] of Object.entries(details)) {
      converted[key] = {
        plusOne: typeof value.plusOne === 'number' ? String(value.plusOne) : value.plusOne,
        tableNumber: value.tableNumber
      };
    }
    return converted;
  });
  const [pendingGuestDetails, setPendingGuestDetails] = useState<Record<number, { plusOne: string; tableNumber: string }>>(data.rsvpGuestDetails || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [duplicateErrors, setDuplicateErrors] = useState<Record<number, boolean>>({});

  // Sync local state with data when data changes from outside
  useEffect(() => {
    const inviteesData = (data.rsvpInvitees || []).map(invitee =>
      typeof invitee === 'string' ? { name: invitee, title: "M" as const } : invitee
    );
    setPendingInvitees(inviteesData);
    setPendingEntourageHonorifics(data.rsvpEntourageHonorifics || {});
    
    // Convert old number format to new string format for entourage
    const details = data.rsvpEntourageGuestDetails || {};
    const converted: Record<string, { plusOne: string; tableNumber: string }> = {};
    for (const [key, value] of Object.entries(details)) {
      converted[key] = {
        plusOne: typeof value.plusOne === 'number' ? String(value.plusOne) : value.plusOne,
        tableNumber: value.tableNumber
      };
    }
    setPendingEntourageGuestDetails(converted);
    
    setPendingGuestDetails(data.rsvpGuestDetails || {});
    
    setHasUnsavedChanges(false);
    setDuplicateErrors({});
  }, [data.rsvpInvitees, data.rsvpEntourageHonorifics, data.rsvpEntourageGuestDetails, data.rsvpGuestDetails]);

  // Auto-added guests from the Entourage list (excludes couple, groom's parents, bride's parents).
  // These are read-only here; edit/remove them from the Entourage List instead.
  const entourageGuests = useMemo(() => getEntourageGuestNames(data.entourage), [data.entourage]);

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
    setHasUnsavedChanges(true);
  };

  // Handle invitee changes (local only)
  const handleInviteeChange = (index: number, field: "name" | "title", value: string) => {
    const updated = [...pendingInvitees];
    updated[index] = { ...updated[index], [field]: value as InviteeTitle };
    setPendingInvitees(updated);
    setHasUnsavedChanges(true);

    // Check for duplicate if name is being changed
    if (field === "name") {
      const isDuplicate = checkDuplicate(value, index);
      setDuplicateErrors(prev => ({ ...prev, [index]: isDuplicate }));
    }
  };

  // Handle invitee removal (local only)
  const handleInviteeRemove = (index: number, name: string) => {
    if (name.trim()) {
      if (confirm(`Remove "${name}" from the guest list?`)) {
        const updated = [...pendingInvitees];
        updated.splice(index, 1);
        setPendingInvitees(updated);
        setHasUnsavedChanges(true);
        // Clear duplicate error for this index
        setDuplicateErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      }
    } else {
      const updated = [...pendingInvitees];
      updated.splice(index, 1);
      setPendingInvitees(updated);
      setHasUnsavedChanges(true);
      // Clear duplicate error for this index
      setDuplicateErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  // Handle adding new invitee (local only)
  const handleAddInvitee = () => {
    const updated = [...pendingInvitees, { name: "", title: "M" as const }];
    setPendingInvitees(updated);
    setHasUnsavedChanges(true);
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

  // Apply changes to parent
  const handleApplyChanges = () => {
    // Check for any duplicate errors before applying
    const hasDuplicates = Object.values(duplicateErrors).some(error => error);
    if (hasDuplicates) {
      alert("Please fix duplicate names before saving.");
      return;
    }
    // Filter out guests with blank names
    const filteredInvitees = pendingInvitees.filter(invitee => invitee.name.trim() !== "");
    onChange("rsvpInvitees", filteredInvitees as unknown as InvitationData[keyof InvitationData]);
    onChange("rsvpEntourageHonorifics", pendingEntourageHonorifics as unknown as InvitationData[keyof InvitationData]);
    onChange("rsvpEntourageGuestDetails", pendingEntourageGuestDetails as unknown as InvitationData[keyof InvitationData]);
    onChange("rsvpGuestDetails", pendingGuestDetails as unknown as InvitationData[keyof InvitationData]);
    setHasUnsavedChanges(false);
    if (onSave) {
      onSave({ ...data, rsvpInvitees: filteredInvitees as any, rsvpEntourageHonorifics: pendingEntourageHonorifics as any, rsvpEntourageGuestDetails: pendingEntourageGuestDetails as any, rsvpGuestDetails: pendingGuestDetails as any });
    }
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    const inviteesData = (data.rsvpInvitees || []).map(invitee =>
      typeof invitee === 'string' ? { name: invitee, title: "M" as const } : invitee
    );
    setPendingInvitees(inviteesData.length > 0 ? inviteesData : [{ name: "", title: "M" }]);
    setPendingEntourageHonorifics(data.rsvpEntourageHonorifics || {});
    setHasUnsavedChanges(false);
    setDuplicateErrors({});
    onClose();
  };

  const handleSaveAndClose = async () => {
    setShowUnsavedDialog(false);
    handleApplyChanges();
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
      }));
    }

    // Sort based on filter option
    const allItems = [...entourageDisplayItems, ...displayInvitees];
    
    if (filterSortOption === "name" || filterSortOption === "name-entourage") {
      allItems.sort((a, b) => {
        const nameA = a.name.split('\n')[0].toLowerCase();
        const nameB = b.name.split('\n')[0].toLowerCase();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
    }
    // "date" and "date-entourage" keep original order (entourage first, then date-added order for regular)

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
            GUEST LIST ({entourageGuests.length + pendingInvitees.filter((n) => n.name.trim()).length})
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
                    <button
                      type="button"
                      onClick={() => setFilterSortOption("date-entourage")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterSortOption === "date-entourage" ? (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900") : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}`}
                    >
                      Sort by Date (with Entourage)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterSortOption("name-entourage")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterSortOption === "name-entourage" ? (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900") : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}`}
                    >
                      Sort by Name (with Entourage)
                    </button>
                    <div className={`my-1 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}></div>
                    <button
                      type="button"
                      onClick={() => setFilterIncludeEntourage(!filterIncludeEntourage)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      {filterIncludeEntourage ? "Exclude Entourage" : "Include Entourage"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterIncludeNormal(!filterIncludeNormal)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      {filterIncludeNormal ? "Exclude Normal Guest" : "Include Normal Guest"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddDialog(true)}
                title="Add guest"
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{ backgroundColor: accentColor, color: "white" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search guests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg text-sm focus:outline-none transition-colors ${
            isDarkMode 
              ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500" 
              : "bg-gray-100 border-gray-200 text-gray-700 placeholder-gray-500"
          } border`}
        />
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
                            .map(({ name, originalIndex, readOnly, key, guestName }) => (
                              readOnly ? (
                                <div key={key} className="flex items-center gap-2">
                                  <div
                                    className={`flex-1 px-3 py-2 border rounded-lg text-sm ${isDarkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"}`}
                                    style={isDarkMode ? { backgroundColor: "#151B24", whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#EDEEF1", whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif" }}
                                    title="Auto-added from Entourage List"
                                  >
                                    {name}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const guestDetails = pendingEntourageGuestDetails[guestName] || { plusOne: "", tableNumber: "" };
                                      setEditGuestData({ 
                                        isEntourage: true, 
                                        name: guestName, 
                                        title: pendingEntourageHonorifics[guestName] || "M", 
                                        originalIndex,
                                        plusOne: guestDetails.plusOne,
                                        tableNumber: guestDetails.tableNumber
                                      });
                                      setOriginalGuestData({
                                        name: guestName,
                                        title: pendingEntourageHonorifics[guestName] || "M",
                                        plusOne: guestDetails.plusOne,
                                        tableNumber: guestDetails.tableNumber
                                      });
                                      setGuestNumberError(false);
                                      setEditDialogHasChanges(false);
                                      setShowEditDialog(true);
                                    }}
                                    title="Edit Guest"
                                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                                    style={{
                                      backgroundColor: isDarkMode ? "#374151" : "#E5E7EB",
                                      color: isDarkMode ? "#9CA3AF" : "#6B7280",
                                    }}
                                  >
                                    <img src="/assets/ico-edit.png" alt="Edit" width="14" height="14" />
                                  </button>
                                </div>
                              ) : (
                              <div key={key} className="flex items-center gap-2">
                                <div
                                  className={`flex-1 px-3 py-2 border rounded-lg text-sm ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 text-gray-600"}`}
                                  style={isDarkMode ? { backgroundColor: "#1C2531", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                                >
                                  {name}
                                </div>
                                <button
                                  type="button"
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
                                  title="Edit guest"
                                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                                  style={{
                                    backgroundColor: isDarkMode ? "#374151" : "#E5E7EB",
                                    color: isDarkMode ? "#9CA3AF" : "#6B7280",
                                  }}
                                >
                                  <img src="/assets/ico-edit.png" alt="Edit" width="14" height="14" />
                                </button>
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

      {/* Apply button - shows when there are unsaved changes */}
      {hasUnsavedChanges && (
        <div className="flex justify-center p-4 border-t" style={{ borderColor: isDarkMode ? "#374151" : "#E5E7EB" }}>
          <button
            onClick={handleApplyChanges}
            className="px-6 py-2 text-white rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
          >
            Save Changes
          </button>
        </div>
      )}

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
                        setHasUnsavedChanges(true);
                        setShowAddDialog(false);
                        setNewGuestName("");
                        setNewGuestTitle("M");
                        setNewGuestPlusOne("");
                        setNewGuestTableNumber("");
                        setAddDialogHasChanges(false);
                        setAddDialogGuestNumberError(false);
                      }
                    }}
                    disabled={addDialogGuestNumberError || !newGuestName.trim()}
                    className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: (addDialogGuestNumberError || !newGuestName.trim()) ? "#9CA3AF" : accentColor, fontFamily: "Inter, sans-serif" }}
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
                    onClick={() => {
                      const updated = [...pendingInvitees];
                      updated.splice(editGuestData.originalIndex, 1);
                      setPendingInvitees(updated);
                      setHasUnsavedChanges(true);
                      setShowEditDialog(false);
                      setEditGuestData(null);
                      setOriginalGuestData(null);
                      setGuestNumberError(false);
                    }}
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
                            tableNumber: editGuestData.tableNumber || "" 
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
                      setHasUnsavedChanges(true);
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
    </div>
  );
}
