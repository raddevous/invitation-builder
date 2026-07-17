import { useState, useEffect, useRef, useCallback } from "react";
import type { InvitationData } from "@/lib/types/invitation";

interface EntourageEditorProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
  onSave?: (updatedData: InvitationData) => Promise<void>;
}

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function EntourageEditor({ data, onChange, isDarkMode = false, accentColor = "#B88A78", onClose, onSave }: EntourageEditorProps) {
  const [pendingEntourageChanges, setPendingEntourageChanges] = useState(data.entourage || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [localVisibleSections, setLocalVisibleSections] = useState(data.entourage?.visibleSections || {});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  const localVisibleSectionsRef = useRef(localVisibleSections);

  // Keep refs in sync with state
  useEffect(() => {
    localVisibleSectionsRef.current = localVisibleSections;
  }, [localVisibleSections]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Helper function to update nested entourage data (local only)
  const updateEntourageField = (path: string, value: any) => {
    const entourage = { ...pendingEntourageChanges };
    const keys = path.split('.');
    let current: any = entourage;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setPendingEntourageChanges(entourage);
    setHasUnsavedChanges(true);
  };

  // Save entourage changes
  const saveEntourage = useCallback(() => {
    const updated = { ...pendingEntourageChanges, visibleSections: localVisibleSectionsRef.current };
    console.log('[EntourageEditor] Saving entourage:', JSON.stringify(updated).substring(0, 500) + '...');
    setPendingEntourageChanges(updated);
    onChange("entourage", updated);
    setHasUnsavedChanges(false);
    if (onSave) {
      const fullData = { ...data, entourage: updated };
      console.log('[EntourageEditor] Calling onSave with full data, entourage keys:', Object.keys(updated));
      onSave(fullData);
    }
  }, [onChange, pendingEntourageChanges, onSave, data]);

  // Handle local checkbox changes (only updates local state)
  const handleVisibilityCheckboxChange = (section: string, checked: boolean) => {
    const updatedSections = {
      ...localVisibleSections,
      [section]: checked
    };
    setLocalVisibleSections(updatedSections);
    setHasUnsavedChanges(true);

    // Clear input fields when disabling a section
    if (!checked) {
      switch (section) {
        case 'marriageTalkSpeaker':
          updateEntourageField("marriageTalkSpeaker.name", "");
          break;
        case 'officiatingMinister':
          updateEntourageField("officiatingMinister.name", "");
          break;
        case 'witnesses':
          updateEntourageField("witnesses.names", ["", ""]);
          break;
        case 'bestMan':
          updateEntourageField("bestMan.name", "");
          break;
        case 'maidOfHonor':
          updateEntourageField("maidOfHonor.name", "");
          break;
        case 'directorOfCeremony':
          updateEntourageField("directorOfCeremony.names", [""]);
          break;
        case 'directorOfFeast':
          updateEntourageField("directorOfFeast.names", [""]);
          break;
        case 'ushers':
          updateEntourageField("ushers.names", [""]);
          break;
        case 'usherettes':
          updateEntourageField("usherettes.names", [""]);
          break;
        case 'groomsmen':
          updateEntourageField("groomsmen.names", [""]);
          break;
        case 'bridesmaids':
          updateEntourageField("bridesmaids.names", [""]);
          break;
        case 'jrGroomsmen':
          updateEntourageField("jrGroomsmen.names", [""]);
          break;
        case 'jrBridesmaid':
          updateEntourageField("jrBridesmaid.names", [""]);
          break;
        case 'flowerGirls':
          updateEntourageField("flowerGirls.names", [""]);
          break;
        case 'bibleBearer':
          updateEntourageField("bibleBearer.name", "");
          break;
        case 'ringBearer':
          updateEntourageField("ringBearer.name", "");
          break;
        case 'chairman':
          updateEntourageField("chairman.name", "");
          break;
        case 'groomParents':
          updateEntourageField("groomParents.fatherName", "");
          updateEntourageField("groomParents.motherName", "");
          break;
        case 'brideParents':
          updateEntourageField("brideParents.fatherName", "");
          updateEntourageField("brideParents.motherName", "");
          break;
        case 'couple':
          updateEntourageField("couple.groomName", "");
          updateEntourageField("couple.brideName", "");
          break;
      }
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
    setPendingEntourageChanges(data.entourage || {});
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleSaveAndClose = () => {
    setShowUnsavedDialog(false);
    saveEntourage();
    onClose();
  };

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
              Entourage List
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Customize your wedding entourage
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ fontFamily: "Inter, sans-serif" }}>
          {/* THE COUPLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium truncate" style={{ color: accentColor }}>
                  {pendingEntourageChanges?.couple?.titleCustom || "THE COUPLE"}
                </h4>
                {!pendingEntourageChanges?.couple?.titleCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = prompt("Enter new label for THE COUPLE:", "THE COUPLE");
                      if (newValue !== null && newValue.trim() !== "") {
                        updateEntourageField("couple.titleCustom", newValue.trim());
                      } else if (newValue !== null && newValue.trim() === "") {
                        updateEntourageField("couple.titleCustom", undefined);
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Rename"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
                {pendingEntourageChanges?.couple?.titleCustom && (
                  <button
                    type="button"
                    onClick={() => updateEntourageField("couple.titleCustom", undefined)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Reset title to default"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 4v6h-6" />
                      <path d="M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowCheckboxes(!showCheckboxes)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Toggle section visibility controls"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            {!showCheckboxes && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <input
                    type="text"
                    value={pendingEntourageChanges?.couple?.groomName ?? ""}
                    onChange={(e) => updateEntourageField("couple.groomName", e.target.value)}
                    placeholder="Groom name"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{pendingEntourageChanges?.couple?.groomTitleCustom || "Groom"}</span>
                    {!pendingEntourageChanges?.couple?.groomTitleCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = prompt("Enter groom title:", "Groom");
                          if (newValue !== null && newValue.trim() !== "") {
                            updateEntourageField("couple.groomTitleCustom", newValue.trim());
                          }
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit title"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    {pendingEntourageChanges?.couple?.groomTitleCustom && (
                      <button
                        type="button"
                        onClick={() => updateEntourageField("couple.groomTitleCustom", undefined)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Reset title to default"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 4v6h-6" />
                          <path d="M1 20v-6h6" />
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <input
                    type="text"
                    value={pendingEntourageChanges?.couple?.brideName ?? ""}
                    onChange={(e) => updateEntourageField("couple.brideName", e.target.value)}
                    placeholder="Bride name"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{pendingEntourageChanges?.couple?.brideTitleCustom || "Bride"}</span>
                    {!pendingEntourageChanges?.couple?.brideTitleCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = prompt("Enter bride title:", "Bride");
                          if (newValue !== null && newValue.trim() !== "") {
                            updateEntourageField("couple.brideTitleCustom", newValue.trim());
                          }
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit title"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    {pendingEntourageChanges?.couple?.brideTitleCustom && (
                      <button
                        type="button"
                        onClick={() => updateEntourageField("couple.brideTitleCustom", undefined)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Reset title to default"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 4v6h-6" />
                          <path d="M1 20v-6h6" />
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GROOM'S PARENTS */}
          {(showCheckboxes || localVisibleSections.groomParents) && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.groomParents ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("groomParents", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.groomParents?.titleCustom || "GROOM'S PARENTS"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.groomParents?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter new label for GROOM'S PARENTS:", "GROOM'S PARENTS");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("groomParents.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("groomParents.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Rename"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.groomParents?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("groomParents.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.groomParents && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={pendingEntourageChanges?.groomParents?.fatherName ?? ""}
                          onChange={(e) => updateEntourageField("groomParents.fatherName", e.target.value)}
                          placeholder="Groom's Father"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{pendingEntourageChanges?.groomParents?.fatherTitleCustom || "Father"}</span>
                          {!pendingEntourageChanges?.groomParents?.fatherTitleCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = prompt("Enter father title:", "Father");
                                if (newValue !== null && newValue.trim() !== "") {
                                  updateEntourageField("groomParents.fatherTitleCustom", newValue.trim());
                                }
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit title"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                          {pendingEntourageChanges?.groomParents?.fatherTitleCustom && (
                            <button
                              type="button"
                              onClick={() => updateEntourageField("groomParents.fatherTitleCustom", undefined)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Reset title to default"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6" />
                                <path d="M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={pendingEntourageChanges?.groomParents?.motherName ?? ""}
                          onChange={(e) => updateEntourageField("groomParents.motherName", e.target.value)}
                          placeholder="Groom's Mother"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{pendingEntourageChanges?.groomParents?.motherTitleCustom || "Mother"}</span>
                          {!pendingEntourageChanges?.groomParents?.motherTitleCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = prompt("Enter mother title:", "Mother");
                                if (newValue !== null && newValue.trim() !== "") {
                                  updateEntourageField("groomParents.motherTitleCustom", newValue.trim());
                                }
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit title"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                          {pendingEntourageChanges?.groomParents?.motherTitleCustom && (
                            <button
                              type="button"
                              onClick={() => updateEntourageField("groomParents.motherTitleCustom", undefined)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Reset title to default"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6" />
                                <path d="M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.brideParents ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("brideParents", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.brideParents?.titleCustom || "BRIDE'S PARENTS"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.brideParents?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter new label for BRIDE'S PARENTS:", "BRIDE'S PARENTS");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("brideParents.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("brideParents.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Rename"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.brideParents?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("brideParents.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.brideParents && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={pendingEntourageChanges?.brideParents?.fatherName ?? ""}
                          onChange={(e) => updateEntourageField("brideParents.fatherName", e.target.value)}
                          placeholder="Bride's Father"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{pendingEntourageChanges?.brideParents?.fatherTitleCustom || "Father"}</span>
                          {!pendingEntourageChanges?.brideParents?.fatherTitleCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = prompt("Enter father title:", "Father");
                                if (newValue !== null && newValue.trim() !== "") {
                                  updateEntourageField("brideParents.fatherTitleCustom", newValue.trim());
                                }
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit title"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                          {pendingEntourageChanges?.brideParents?.fatherTitleCustom && (
                            <button
                              type="button"
                              onClick={() => updateEntourageField("brideParents.fatherTitleCustom", undefined)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Reset title to default"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6" />
                                <path d="M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={pendingEntourageChanges?.brideParents?.motherName ?? ""}
                          onChange={(e) => updateEntourageField("brideParents.motherName", e.target.value)}
                          placeholder="Bride's Mother"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{pendingEntourageChanges?.brideParents?.motherTitleCustom || "Mother"}</span>
                          {!pendingEntourageChanges?.brideParents?.motherTitleCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = prompt("Enter mother title:", "Mother");
                                if (newValue !== null && newValue.trim() !== "") {
                                  updateEntourageField("brideParents.motherTitleCustom", newValue.trim());
                                }
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit title"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                          {pendingEntourageChanges?.brideParents?.motherTitleCustom && (
                            <button
                              type="button"
                              onClick={() => updateEntourageField("brideParents.motherTitleCustom", undefined)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Reset title to default"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6" />
                                <path d="M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Marriage Talk Speaker */}
          {(showCheckboxes || localVisibleSections.marriageTalkSpeaker) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={localVisibleSections.marriageTalkSpeaker ?? false}
                    onChange={(e) => handleVisibilityCheckboxChange("marriageTalkSpeaker", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: accentColor }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate max-w-[200px]" style={{ color: accentColor }}>
                    {pendingEntourageChanges?.marriageTalkSpeaker?.titleCustom || "MARRIAGE TALK SPEAKER"}
                  </h4>
                  {showCheckboxes && !pendingEntourageChanges?.marriageTalkSpeaker?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = prompt("Enter marriage talk speaker title:", "Marriage Talk Speaker");
                        if (newValue !== null && newValue.trim() !== "") {
                          updateEntourageField("marriageTalkSpeaker.titleCustom", newValue.trim());
                        } else if (newValue !== null && newValue.trim() === "") {
                          updateEntourageField("marriageTalkSpeaker.titleCustom", undefined);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Rename"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {showCheckboxes && pendingEntourageChanges?.marriageTalkSpeaker?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => updateEntourageField("marriageTalkSpeaker.titleCustom", undefined)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Reset title to default"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {!showCheckboxes && localVisibleSections.marriageTalkSpeaker && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={pendingEntourageChanges?.marriageTalkSpeaker?.name ?? ""}
                    onChange={(e) => updateEntourageField("marriageTalkSpeaker.name", e.target.value)}
                    placeholder="Speaker name"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Officiating Minister */}
          {(showCheckboxes || localVisibleSections.officiatingMinister) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={localVisibleSections.officiatingMinister ?? false}
                    onChange={(e) => handleVisibilityCheckboxChange("officiatingMinister", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: accentColor }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate max-w-[200px]" style={{ color: accentColor }}>
                    {pendingEntourageChanges?.officiatingMinister?.titleCustom || "OFFICIATING MINISTER"}
                  </h4>
                  {showCheckboxes && !pendingEntourageChanges?.officiatingMinister?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = prompt("Enter officiating minister title:", "Officiating Minister");
                        if (newValue !== null && newValue.trim() !== "") {
                          updateEntourageField("officiatingMinister.titleCustom", newValue.trim());
                        } else if (newValue !== null && newValue.trim() === "") {
                          updateEntourageField("officiatingMinister.titleCustom", undefined);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Rename"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {showCheckboxes && pendingEntourageChanges?.officiatingMinister?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => updateEntourageField("officiatingMinister.titleCustom", undefined)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Reset title to default"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {!showCheckboxes && localVisibleSections.officiatingMinister && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={pendingEntourageChanges?.officiatingMinister?.name ?? ""}
                    onChange={(e) => updateEntourageField("officiatingMinister.name", e.target.value)}
                    placeholder="Minister name"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Witnesses */}
          {(showCheckboxes || localVisibleSections.witnesses) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={localVisibleSections.witnesses ?? false}
                    onChange={(e) => handleVisibilityCheckboxChange("witnesses", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: accentColor }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate max-w-[200px]" style={{ color: accentColor }}>
                    {pendingEntourageChanges?.witnesses?.titleCustom || "WITNESSES"}
                  </h4>
                  {showCheckboxes && !pendingEntourageChanges?.witnesses?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = prompt("Enter witnesses label:", "WITNESSES");
                        if (newValue !== null && newValue.trim() !== "") {
                          updateEntourageField("witnesses.titleCustom", newValue.trim());
                        } else if (newValue !== null && newValue.trim() === "") {
                          updateEntourageField("witnesses.titleCustom", undefined);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Rename"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {showCheckboxes && pendingEntourageChanges?.witnesses?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => updateEntourageField("witnesses.titleCustom", undefined)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Reset to default"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {!showCheckboxes && localVisibleSections.witnesses && (
                <div className="grid grid-cols-2 gap-6">
                  {(pendingEntourageChanges?.witnesses?.names || [""]).map((name: string, i: number) => {
                    const names = pendingEntourageChanges?.witnesses?.names || [""];
                    const isOdd = names.length % 2 === 1;
                    const isLast = i === names.length - 1;
                    
                    return (
                      <div key={i} className={`relative ${isOdd && isLast ? "col-span-2" : ""}`}>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const newNames = [...names];
                            newNames[i] = e.target.value;
                            updateEntourageField("witnesses.names", newNames);
                          }}
                          placeholder={`Witness ${i + 1}`}
                          className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        {i === 0 && names.length < 12 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newNames = [...names];
                              newNames.push("");
                              updateEntourageField("witnesses.names", newNames);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                            title="Add witness"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        )}
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newNames = [...names];
                              newNames.splice(i, 1);
                              updateEntourageField("witnesses.names", newNames);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                            title="Remove witness"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Best Man and Maid of Honor */}
          {(showCheckboxes || localVisibleSections.bestMan || localVisibleSections.maidOfHonor) && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.bestMan ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("bestMan", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.bestMan?.titleCustom || "BEST MAN"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.bestMan?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter best man title:", "Best Man");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("bestMan.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("bestMan.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit title"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.bestMan?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("bestMan.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.bestMan && (
                    <input
                      type="text"
                      value={pendingEntourageChanges?.bestMan?.name ?? ""}
                      onChange={(e) => updateEntourageField("bestMan.name", e.target.value)}
                      placeholder="Best Man name"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.maidOfHonor ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("maidOfHonor", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.maidOfHonor?.titleCustom || "MAID OF HONOR"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.maidOfHonor?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter maid of honor title:", "Maid of Honor");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("maidOfHonor.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("maidOfHonor.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit title"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.maidOfHonor?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("maidOfHonor.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.maidOfHonor && (
                    <input
                      type="text"
                      value={pendingEntourageChanges?.maidOfHonor?.name ?? ""}
                      onChange={(e) => updateEntourageField("maidOfHonor.name", e.target.value)}
                      placeholder="Maid of honor name"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Director of Ceremony */}
          {(showCheckboxes || localVisibleSections.directorOfCeremony) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={localVisibleSections.directorOfCeremony ?? false}
                    onChange={(e) => handleVisibilityCheckboxChange("directorOfCeremony", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: accentColor }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate max-w-[200px]" style={{ color: accentColor }}>
                    {pendingEntourageChanges?.directorOfCeremony?.titleCustom || "DIRECTOR OF THE CEREMONY"}
                  </h4>
                  {showCheckboxes && !pendingEntourageChanges?.directorOfCeremony?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = prompt("Enter director of ceremony label:", "DIRECTOR OF THE CEREMONY");
                        if (newValue !== null && newValue.trim() !== "") {
                          updateEntourageField("directorOfCeremony.titleCustom", newValue.trim());
                        } else if (newValue !== null && newValue.trim() === "") {
                          updateEntourageField("directorOfCeremony.titleCustom", undefined);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Rename"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {showCheckboxes && pendingEntourageChanges?.directorOfCeremony?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => updateEntourageField("directorOfCeremony.titleCustom", undefined)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Reset to default"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {!showCheckboxes && localVisibleSections.directorOfCeremony && (
                <div className="grid grid-cols-2 gap-6">
                  {(pendingEntourageChanges?.directorOfCeremony?.names || [""]).map((name: string, i: number) => {
                    const names = pendingEntourageChanges?.directorOfCeremony?.names || [""];
                    const isOdd = names.length % 2 === 1;
                    const isLast = i === names.length - 1;
                    
                    return (
                      <div key={i} className={`relative ${isOdd && isLast ? "col-span-2" : ""}`}>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const newNames = [...names];
                            newNames[i] = e.target.value;
                            updateEntourageField("directorOfCeremony.names", newNames);
                          }}
                          placeholder={`Director ${i + 1}`}
                          className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        {i === 0 && names.length < 12 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newNames = [...names];
                              newNames.push("");
                              updateEntourageField("directorOfCeremony.names", newNames);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                            title="Add director"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        )}
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newNames = [...names];
                              newNames.splice(i, 1);
                              updateEntourageField("directorOfCeremony.names", newNames);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                            title="Remove director"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Director of Feast */}
          {(showCheckboxes || localVisibleSections.directorOfFeast) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={localVisibleSections.directorOfFeast ?? false}
                    onChange={(e) => handleVisibilityCheckboxChange("directorOfFeast", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: accentColor }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate max-w-[200px]" style={{ color: accentColor }}>
                    {pendingEntourageChanges?.directorOfFeast?.titleCustom || "DIRECTOR OF THE FEAST"}
                  </h4>
                  {showCheckboxes && !pendingEntourageChanges?.directorOfFeast?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = prompt("Enter director of feast label:", "DIRECTOR OF THE FEAST");
                        if (newValue !== null && newValue.trim() !== "") {
                          updateEntourageField("directorOfFeast.titleCustom", newValue.trim());
                        } else if (newValue !== null && newValue.trim() === "") {
                          updateEntourageField("directorOfFeast.titleCustom", undefined);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Rename"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {showCheckboxes && pendingEntourageChanges?.directorOfFeast?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => updateEntourageField("directorOfFeast.titleCustom", undefined)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Reset to default"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {!showCheckboxes && localVisibleSections.directorOfFeast && (
                <div className="grid grid-cols-2 gap-6">
                  {(pendingEntourageChanges?.directorOfFeast?.names || [""]).map((name: string, i: number) => {
                    const names = pendingEntourageChanges?.directorOfFeast?.names || [""];
                    const isOdd = names.length % 2 === 1;
                    const isLast = i === names.length - 1;
                    
                    return (
                      <div key={i} className={`relative ${isOdd && isLast ? "col-span-2" : ""}`}>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const newNames = [...names];
                            newNames[i] = e.target.value;
                            updateEntourageField("directorOfFeast.names", newNames);
                          }}
                          placeholder={`Director ${i + 1}`}
                          className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        {i === 0 && names.length < 12 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newNames = [...names];
                              newNames.push("");
                              updateEntourageField("directorOfFeast.names", newNames);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                            title="Add director"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        )}
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newNames = [...names];
                              newNames.splice(i, 1);
                              updateEntourageField("directorOfFeast.names", newNames);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                            title="Remove director"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Ushers and Usherettes */}
          {(showCheckboxes || localVisibleSections.ushers || localVisibleSections.usherettes) && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.ushers ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("ushers", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.ushers?.titleCustom || "USHERS"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.ushers?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter ushers title:", "Ushers");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("ushers.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("ushers.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit title"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.ushers?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("ushers.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.ushers && (
                    <div className="space-y-2">
                      {(pendingEntourageChanges?.ushers?.names || [""]).map((name, i) => {
                        const names = pendingEntourageChanges?.ushers?.names || [""];
                        
                        return (
                          <div key={i} className="relative">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                const newNames = [...names];
                                newNames[i] = e.target.value;
                                updateEntourageField("ushers.names", newNames);
                              }}
                              placeholder={`Usher ${i + 1}`}
                              className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                              style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                            />
                            {i === 0 && names.length < 24 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.push("");
                                  updateEntourageField("ushers.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                title="Add usher"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </button>
                            )}
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.splice(i, 1);
                                  updateEntourageField("ushers.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Remove usher"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.usherettes ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("usherettes", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.usherettes?.titleCustom || "USHERETTES"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.usherettes?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter usherettes title:", "Usherettes");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("usherettes.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("usherettes.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit title"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.usherettes?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("usherettes.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.usherettes && (
                    <div className="space-y-2">
                      {(pendingEntourageChanges?.usherettes?.names || [""]).map((name, i) => {
                        const names = pendingEntourageChanges?.usherettes?.names || [""];
                        
                        return (
                          <div key={i} className="relative">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                const newNames = [...names];
                                newNames[i] = e.target.value;
                                updateEntourageField("usherettes.names", newNames);
                              }}
                              placeholder={`Usherette ${i + 1}`}
                              className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                              style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                            />
                            {i === 0 && names.length < 24 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.push("");
                                  updateEntourageField("usherettes.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                title="Add usherette"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </button>
                            )}
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.splice(i, 1);
                                  updateEntourageField("usherettes.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Remove usherette"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chairman */}
          {(showCheckboxes || localVisibleSections.chairman) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={localVisibleSections.chairman ?? false}
                    onChange={(e) => handleVisibilityCheckboxChange("chairman", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: accentColor }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate max-w-[200px]" style={{ color: accentColor }}>
                    {pendingEntourageChanges?.chairman?.titleCustom || "CHAIRMAN"}
                  </h4>
                  {showCheckboxes && !pendingEntourageChanges?.chairman?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = prompt("Enter chairman title:", "Chairman");
                        if (newValue !== null && newValue.trim() !== "") {
                          updateEntourageField("chairman.titleCustom", newValue.trim());
                        } else if (newValue !== null && newValue.trim() === "") {
                          updateEntourageField("chairman.titleCustom", undefined);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Rename"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {showCheckboxes && pendingEntourageChanges?.chairman?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => updateEntourageField("chairman.titleCustom", undefined)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Reset to default"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {!showCheckboxes && localVisibleSections.chairman && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={pendingEntourageChanges?.chairman?.name ?? ""}
                    onChange={(e) => updateEntourageField("chairman.name", e.target.value)}
                    placeholder="Chairman name"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Groomsmen and Bridesmaids */}
          {(showCheckboxes || localVisibleSections.groomsmen || localVisibleSections.bridesmaids) && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.groomsmen ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("groomsmen", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.groomsmen?.titleCustom || "GROOMSMEN"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.groomsmen?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter groomsmen title:", "Groomsmen");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("groomsmen.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("groomsmen.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit title"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.groomsmen?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("groomsmen.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.groomsmen && (
                    <div className="space-y-2">
                      {(pendingEntourageChanges?.groomsmen?.names || [""]).map((name: string, i: number) => {
                        const names = pendingEntourageChanges?.groomsmen?.names || [""];
                        
                        return (
                          <div key={i} className="relative">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                const newNames = [...names];
                                newNames[i] = e.target.value;
                                updateEntourageField("groomsmen.names", newNames);
                              }}
                              placeholder={`Groomsman ${i + 1}`}
                              className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                              style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                            />
                            {i === 0 && names.length < 12 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.push("");
                                  updateEntourageField("groomsmen.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                title="Add groomsman"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </button>
                            )}
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.splice(i, 1);
                                  updateEntourageField("groomsmen.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Remove groomsman"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.bridesmaids ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("bridesmaids", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.bridesmaids?.titleCustom || "BRIDESMAIDS"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.bridesmaids?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter bridesmaids title:", "Bridesmaids");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("bridesmaids.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("bridesmaids.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit title"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.bridesmaids?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("bridesmaids.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.bridesmaids && (
                    <div className="space-y-2">
                      {(pendingEntourageChanges?.bridesmaids?.names || [""]).map((name: string, i: number) => {
                        const names = pendingEntourageChanges?.bridesmaids?.names || [""];
                        
                        return (
                          <div key={i} className="relative">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                const newNames = [...names];
                                newNames[i] = e.target.value;
                                updateEntourageField("bridesmaids.names", newNames);
                              }}
                              placeholder={`Bridesmaid ${i + 1}`}
                              className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                              style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                            />
                            {i === 0 && names.length < 12 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.push("");
                                  updateEntourageField("bridesmaids.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                title="Add bridesmaid"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </button>
                            )}
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.splice(i, 1);
                                  updateEntourageField("bridesmaids.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Remove bridesmaid"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Jr Groomsmen and Jr Bridesmaids */}
          {(showCheckboxes || localVisibleSections.jrGroomsmen || localVisibleSections.jrBridesmaid) && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.jrGroomsmen ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("jrGroomsmen", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.jrGroomsmen?.titleCustom || "JR GROOMSMEN"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.jrGroomsmen?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter jr groomsmen title:", "Jr Groomsmen");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("jrGroomsmen.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("jrGroomsmen.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit title"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.jrGroomsmen?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("jrGroomsmen.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.jrGroomsmen && (
                    <div className="space-y-2">
                      {(pendingEntourageChanges?.jrGroomsmen?.names || [""]).map((name: string, i: number) => {
                        const names = pendingEntourageChanges?.jrGroomsmen?.names || [""];
                        
                        return (
                          <div key={i} className="relative">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                const newNames = [...names];
                                newNames[i] = e.target.value;
                                updateEntourageField("jrGroomsmen.names", newNames);
                              }}
                              placeholder={`Jr Groomsman ${i + 1}`}
                              className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                              style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                            />
                            {i === 0 && names.length < 12 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.push("");
                                  updateEntourageField("jrGroomsmen.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                title="Add jr groomsman"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </button>
                            )}
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.splice(i, 1);
                                  updateEntourageField("jrGroomsmen.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Remove jr groomsman"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={localVisibleSections.jrBridesmaid ?? false}
                        onChange={(e) => handleVisibilityCheckboxChange("jrBridesmaid", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: accentColor }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate max-w-[120px]" style={{ color: accentColor }}>
                        {pendingEntourageChanges?.jrBridesmaid?.titleCustom || "JR BRIDESMAIDS"}
                      </h4>
                      {showCheckboxes && !pendingEntourageChanges?.jrBridesmaid?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = prompt("Enter jr bridesmaids title:", "Jr Bridesmaids");
                            if (newValue !== null && newValue.trim() !== "") {
                              updateEntourageField("jrBridesmaid.titleCustom", newValue.trim());
                            } else if (newValue !== null && newValue.trim() === "") {
                              updateEntourageField("jrBridesmaid.titleCustom", undefined);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit title"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {showCheckboxes && pendingEntourageChanges?.jrBridesmaid?.titleCustom && (
                        <button
                          type="button"
                          onClick={() => updateEntourageField("jrBridesmaid.titleCustom", undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset title to default"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {!showCheckboxes && localVisibleSections.jrBridesmaid && (
                    <div className="space-y-2">
                      {(pendingEntourageChanges?.jrBridesmaid?.names || [""]).map((name: string, i: number) => {
                        const names = pendingEntourageChanges?.jrBridesmaid?.names || [""];
                        
                        return (
                          <div key={i} className="relative">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                const newNames = [...names];
                                newNames[i] = e.target.value;
                                updateEntourageField("jrBridesmaid.names", newNames);
                              }}
                              placeholder={`Jr Bridesmaid ${i + 1}`}
                              className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                              style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                            />
                            {i === 0 && names.length < 12 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.push("");
                                  updateEntourageField("jrBridesmaid.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                title="Add jr bridesmaid"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </button>
                            )}
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newNames = [...names];
                                  newNames.splice(i, 1);
                                  updateEntourageField("jrBridesmaid.names", newNames);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Remove jr bridesmaid"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Flower Girls */}
          {(showCheckboxes || localVisibleSections.flowerGirls) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={localVisibleSections.flowerGirls ?? false}
                    onChange={(e) => handleVisibilityCheckboxChange("flowerGirls", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: accentColor }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate max-w-[200px]" style={{ color: accentColor }}>
                    {pendingEntourageChanges?.flowerGirls?.titleCustom || "FLOWER GIRLS"}
                  </h4>
                  {showCheckboxes && !pendingEntourageChanges?.flowerGirls?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = prompt("Enter flower girls title:", "Flower Girls");
                        if (newValue !== null && newValue.trim() !== "") {
                          updateEntourageField("flowerGirls.titleCustom", newValue.trim());
                        } else if (newValue !== null && newValue.trim() === "") {
                          updateEntourageField("flowerGirls.titleCustom", undefined);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit title"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {showCheckboxes && pendingEntourageChanges?.flowerGirls?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => updateEntourageField("flowerGirls.titleCustom", undefined)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Reset title to default"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {!showCheckboxes && localVisibleSections.flowerGirls && (
                <div className="space-y-2">
                  {(pendingEntourageChanges?.flowerGirls?.names || [""]).map((name: string, i: number) => {
                    const names = pendingEntourageChanges?.flowerGirls?.names || [""];
                    
                    return (
                      <div key={i} className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const newNames = [...names];
                            newNames[i] = e.target.value;
                            updateEntourageField("flowerGirls.names", newNames);
                          }}
                          placeholder={`Flower Girl ${i + 1}`}
                          className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                        {i === 0 && names.length < 10 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newNames = [...names];
                              newNames.push("");
                              updateEntourageField("flowerGirls.names", newNames);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                            title="Add flower girl"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        )}
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newNames = [...names];
                              newNames.splice(i, 1);
                              updateEntourageField("flowerGirls.names", newNames);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                            title="Remove flower girl"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bible Bearer */}
          {(showCheckboxes || localVisibleSections.bibleBearer) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={localVisibleSections.bibleBearer ?? false}
                    onChange={(e) => handleVisibilityCheckboxChange("bibleBearer", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: accentColor }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate max-w-[200px]" style={{ color: accentColor }}>
                    {pendingEntourageChanges?.bibleBearer?.titleCustom || "BIBLE BEARER"}
                  </h4>
                  {showCheckboxes && !pendingEntourageChanges?.bibleBearer?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = prompt("Enter bible bearer title:", "Bible Bearer");
                        if (newValue !== null && newValue.trim() !== "") {
                          updateEntourageField("bibleBearer.titleCustom", newValue.trim());
                        } else if (newValue !== null && newValue.trim() === "") {
                          updateEntourageField("bibleBearer.titleCustom", undefined);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit title"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {showCheckboxes && pendingEntourageChanges?.bibleBearer?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => updateEntourageField("bibleBearer.titleCustom", undefined)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Reset title to default"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {!showCheckboxes && localVisibleSections.bibleBearer && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={pendingEntourageChanges?.bibleBearer?.name ?? ""}
                    onChange={(e) => updateEntourageField("bibleBearer.name", e.target.value)}
                    placeholder="Bible bearer name"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Ring Bearer */}
          {(showCheckboxes || localVisibleSections.ringBearer) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={localVisibleSections.ringBearer ?? false}
                    onChange={(e) => handleVisibilityCheckboxChange("ringBearer", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: accentColor }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate max-w-[200px]" style={{ color: accentColor }}>
                    {pendingEntourageChanges?.ringBearer?.titleCustom || "RING BEARER"}
                  </h4>
                  {showCheckboxes && !pendingEntourageChanges?.ringBearer?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = prompt("Enter ring bearer title:", "Ring Bearer");
                        if (newValue !== null && newValue.trim() !== "") {
                          updateEntourageField("ringBearer.titleCustom", newValue.trim());
                        } else if (newValue !== null && newValue.trim() === "") {
                          updateEntourageField("ringBearer.titleCustom", undefined);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit title"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {showCheckboxes && pendingEntourageChanges?.ringBearer?.titleCustom && (
                    <button
                      type="button"
                      onClick={() => updateEntourageField("ringBearer.titleCustom", undefined)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Reset title to default"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {!showCheckboxes && localVisibleSections.ringBearer && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={pendingEntourageChanges?.ringBearer?.name ?? ""}
                    onChange={(e) => updateEntourageField("ringBearer.name", e.target.value)}
                    placeholder="Ring bearer name"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

      {/* Footer with save button */}
      <div className="p-4">
        {hasUnsavedChanges && (
          <div className="flex justify-center">
            <button
              onClick={saveEntourage}
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
    </div>
  );
}
