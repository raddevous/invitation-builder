import { useState, useEffect, useMemo, useRef } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { getEntourageGuestNames, type EntourageGuest } from "@/lib/utils/entourageGuests";
import { supabase } from "@/lib/supabase/client";

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface RSVPResponseEditorProps {
  data: InvitationData;
  invitationId: string;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
}

type ResponseFilter = "all" | "not-responded" | "messaged" | "attending" | "not-attending";

type RSVPResponse = {
  guest_name: string;
  attendance: string;
  guest_count: number;
  message: string | null;
  submitted_at: string;
};

export default function RSVPResponseEditor({ data, invitationId, onChange, isDarkMode = false, accentColor = "#B88A78", onClose }: RSVPResponseEditorProps) {
  const [filter, setFilter] = useState<ResponseFilter>("all");
  const [responses, setResponses] = useState<RSVPResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<{ guestName: string; message: string } | null>(null);
  const [readMessages, setReadMessages] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`rsvpReadMessages_${invitationId}`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const guestScrollRef = useRef<HTMLDivElement>(null);

  // Fetch RSVP responses from Supabase
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const { data: responsesData, error } = await supabase
          .from("rsvp_responses")
          .select("*")
          .eq("invitation_id", invitationId);

        if (error) throw error;
        setResponses(responsesData || []);
      } catch (error) {
        console.error("Error fetching RSVP responses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [invitationId]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [filter, searchQuery]);

  // Get combined guest list (entourage + manual guests)
  const combinedGuests = useMemo(() => {
    const entourageGuests = getEntourageGuestNames(data.entourage);
    const manualGuests = (data.rsvpInvitees || []).map(invitee =>
      typeof invitee === 'string' ? { name: invitee, title: "M" as const } : invitee
    );

    // Combine with entourage guests first, then manual guests
    const allGuests: Array<{ name: string; isEntourage: boolean; title?: string }> = [
      ...entourageGuests.map(g => ({ name: g.name, isEntourage: true, title: g.title })),
      ...manualGuests.map(g => ({ name: g.name, isEntourage: false, title: g.title }))
    ];

    // Remove duplicates (keep first occurrence)
    const uniqueGuests = allGuests.filter((guest, index, self) =>
      index === self.findIndex(g => g.name.toLowerCase() === guest.name.toLowerCase())
    );

    return uniqueGuests;
  }, [data.entourage, data.rsvpInvitees]);

  // Filter guests based on selected tab
  const filteredGuests = useMemo(() => {
    let guests = combinedGuests;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      guests = guests.filter(guest => 
        guest.name.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filter === "all") {
      return guests;
    }

    return guests.filter(guest => {
      const response = responses.find(r => r.guest_name.toLowerCase() === guest.name.toLowerCase());
      
      if (filter === "not-responded") {
        return !response;
      }
      
      if (filter === "messaged") {
        return response && response.message && response.message.trim() !== "";
      }
      
      if (filter === "attending") {
        return response?.attendance === "attending";
      }
      
      if (filter === "not-attending") {
        return response?.attendance === "not-attending";
      }
      
      return true;
    });
  }, [combinedGuests, responses, filter, searchQuery]);

  // Pagination: 25 per page
  const itemsPerPage = 25;
  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);

  // Reset page if it's out of bounds
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  // Update current page when scrolling
  useEffect(() => {
    const scrollContainer = guestScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.clientWidth;
      const newPage = Math.round(scrollLeft / containerWidth);
      setCurrentPage(newPage);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Get response status for a guest
  const getResponseStatus = (guestName: string) => {
    const response = responses.find(r => r.guest_name.toLowerCase() === guestName.toLowerCase());
    if (!response) return "not-responded";
    return response.attendance === "attending" ? "attending" : "not-attending";
  };

  // Get response details for a guest
  const getResponseDetails = (guestName: string) => {
    return responses.find(r => r.guest_name.toLowerCase() === guestName.toLowerCase());
  };

  const TabButton = ({ label, activeFilter, count, icon }: { label: string; activeFilter: ResponseFilter; count?: number; icon?: string }) => (
    <button
      onClick={() => setFilter(activeFilter)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
        filter === activeFilter
          ? isDarkMode
            ? "bg-gray-600 text-white"
            : "bg-gray-200 text-gray-900"
          : isDarkMode
            ? "text-gray-400 hover:text-gray-200"
            : "text-gray-600 hover:text-gray-900"
      }`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {!icon ? (
        <>
          {label}
          {count !== undefined && <span className="ml-1 opacity-60">({count})</span>}
        </>
      ) : (
        <div className="w-5 h-5" style={{
          backgroundColor: accentColor,
          WebkitMaskImage: `url(${icon})`,
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskImage: `url(${icon})`,
          maskSize: "contain",
          maskPosition: "center",
          maskRepeat: "no-repeat"
        }} />
      )}
    </button>
  );

  return (
    <div className={`w-full h-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Header - fixed, not scrollable */}
      <div className={`flex items-center justify-between p-4 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
            title="Back to Tools"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
              Responses
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Track guest responses
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search - not scrollable */}
      <div className="px-4 py-3 space-y-3 shrink-0">
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <TabButton label="All" activeFilter="all" count={combinedGuests.length} />
          <TabButton 
            label="Waiting" 
            activeFilter="not-responded" 
            count={combinedGuests.filter(g => !responses.find(r => r.guest_name.toLowerCase() === g.name.toLowerCase())).length}
            icon="/assets/ico-nores.png"
          />
          <TabButton 
            label="Messaged" 
            activeFilter="messaged" 
            count={combinedGuests.filter(g => {
              const response = responses.find(r => r.guest_name.toLowerCase() === g.name.toLowerCase());
              return response && response.message && response.message.trim() !== "";
            }).length}
            icon="/assets/ico-msg.png"
          />
          <TabButton 
            label="Accepted" 
            activeFilter="attending" 
            count={combinedGuests.filter(g => responses.find(r => r.guest_name.toLowerCase() === g.name.toLowerCase())?.attendance === "attending").length}
            icon="/assets/ico-yes.png"
          />
          <TabButton 
            label="Declined" 
            activeFilter="not-attending" 
            count={combinedGuests.filter(g => responses.find(r => r.guest_name.toLowerCase() === g.name.toLowerCase())?.attendance === "not-attending").length}
            icon="/assets/ico-no.png"
          />
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
          style={{ fontFamily: "Inter, sans-serif" }}
        />
      </div>

      {/* Scrollable content - only guest list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Guest List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"} style={{ fontFamily: "Inter, sans-serif" }}>
                Loading responses...
              </p>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"} style={{ fontFamily: "Inter, sans-serif" }}>
                No guests found
              </p>
            </div>
          ) : (
            <div
              ref={guestScrollRef}
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
                    {filteredGuests
                      .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
                      .map((guest, index) => {
                        const status = getResponseStatus(guest.name);
                        const details = getResponseDetails(guest.name);
                        
                        return (
                          <div
                            key={`${guest.name}-${index}`}
                            className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                              isDarkMode ? "border-gray-700" : "border-gray-200"
                            }`}
                            style={{
                              backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
                            }}
                          >
                            <div className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-3">
                                {/* Status indicator */}
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      status === "attending"
                                        ? "#10b981"
                                        : status === "not-attending"
                                          ? "#ef4444"
                                          : "#9ca3af"
                                  }}
                                />
                                
                                {/* Guest name and guest count */}
                                <div>
                                  <p className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                                    {guest.name}
                                  </p>
                                  {guest.isEntourage && (
                                    <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                                      {guest.title}
                                    </p>
                                  )}
                                  {details && !guest.isEntourage && (
                                    <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                                      Number of guest: {details.guest_count}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Response details - attending status and message */}
                              {details && (
                                <div className="text-right flex items-center gap-2">
                                  {/* Status icon */}
                                  <div 
                                    className="w-5 h-5"
                                    style={{
                                      backgroundColor: accentColor,
                                      WebkitMaskImage: `url(${details.attendance === "attending" ? "/assets/ico-yes.png" : "/assets/ico-no.png"})`,
                                      WebkitMaskSize: "contain",
                                      WebkitMaskPosition: "center",
                                      WebkitMaskRepeat: "no-repeat",
                                      maskImage: `url(${details.attendance === "attending" ? "/assets/ico-yes.png" : "/assets/ico-no.png"})`,
                                      maskSize: "contain",
                                      maskPosition: "center",
                                      maskRepeat: "no-repeat"
                                    }}
                                  />
                                  {/* Message icon */}
                                  {details.message && (
                                    <div 
                                      className="w-5 h-5 cursor-pointer"
                                      onClick={() => {
                                        setSelectedMessage({ guestName: guest.name, message: details.message || "" });
                                        // Mark as read in localStorage
                                        if (!readMessages.includes(guest.name)) {
                                          const updated = [...readMessages, guest.name];
                                          setReadMessages(updated);
                                          localStorage.setItem(`rsvpReadMessages_${invitationId}`, JSON.stringify(updated));
                                        }
                                      }}
                                      style={{
                                        backgroundColor: accentColor,
                                        WebkitMaskImage: `url(${readMessages.includes(guest.name) ? "/assets/ico-msg-read.png" : "/assets/ico-msg-new.png"})`,
                                        WebkitMaskSize: "contain",
                                        WebkitMaskPosition: "center",
                                        WebkitMaskRepeat: "no-repeat",
                                        maskImage: `url(${readMessages.includes(guest.name) ? "/assets/ico-msg-read.png" : "/assets/ico-msg-new.png"})`,
                                        maskSize: "contain",
                                        maskPosition: "center",
                                        maskRepeat: "no-repeat"
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination dots - fixed outside scrollable area */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-3">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentPage(idx);
                const pageElement = guestScrollRef.current?.children[0]?.children[idx] as HTMLElement;
                if (pageElement) {
                  pageElement.scrollIntoView({ behavior: 'smooth', inline: 'start' });
                }
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPage
                  ? "scale-125"
                  : "opacity-40"
              }`}
              style={{ backgroundColor: accentColor }}
            />
          ))}
        </div>
      )}

      {/* Message Dialog */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMessage(null)}>
          <div 
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Message from {selectedMessage.guestName}
            </h3>
            <div 
              className={`border rounded-lg p-3 mb-6 ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
              style={{ minHeight: "4.5em" }}
            >
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {selectedMessage.message.charAt(0).toUpperCase() + selectedMessage.message.slice(1)}
              </p>
            </div>
            <button
              onClick={() => setSelectedMessage(null)}
              className="w-full px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
