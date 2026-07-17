import { useState, useRef, useEffect } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { HOST_LINE_MESSAGES, CLOSING_SENTIMENT_MESSAGES, getNextMessage } from "@/lib/constants/heroMessages";

interface EventDetailsTabProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  isDarkMode = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  isDarkMode?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
      />
    </div>
  );
}

export default function EventDetailsTab({ data, onChange, isDarkMode = false, accentColor = "#B88A78" }: EventDetailsTabProps) {
  const nameType = data.nameType ?? "couple";
  const [hostLineIndex, setHostLineIndex] = useState(0);
  const [closingSentimentIndex, setClosingSentimentIndex] = useState(0);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Local state for pending changes
  const [pendingData, setPendingData] = useState<InvitationData>(data);

  // Update pending data when parent data changes (e.g., after save)
  useEffect(() => {
    console.log('[EventDetailsTab] Parent data changed, syncing pendingData');
    setPendingData(data);
  }, [data]);

  // Local change handler that updates pending state and queues the change
  const handleLocalChange = (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => {
    setPendingData(prev => ({ ...prev, [field]: value }));
    onChange(field, value);
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? "bg-gray-800" : ""}`}>
      <div className="flex-1 overflow-y-auto space-y-5 p-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleLocalChange("nameType", "couple")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pendingData.nameType === "couple"
                ? " text-white"
                : (isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200")
            }`}
            style={{ backgroundColor: pendingData.nameType === "couple" ? accentColor : undefined }}
          >
            Couple
          </button>
          <button
            type="button"
            onClick={() => handleLocalChange("nameType", "event")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pendingData.nameType === "event"
                ? " text-white"
                : (isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200")
            }`}
            style={{ backgroundColor: pendingData.nameType === "event" ? accentColor : undefined }}
          >
            Event
          </button>
        </div>
      </div>

      {/* Couple Name Fields */}
      {pendingData.nameType === "couple" ? (
        <>
          <Field
            label="First name"
            value={pendingData.hisName ?? ""}
            onChange={(v) => handleLocalChange("hisName", v)}
            placeholder="Rad"
            isDarkMode={isDarkMode}
          />
          <Field
            label="And"
            value={pendingData.andText ?? "&"}
            onChange={(v) => handleLocalChange("andText", v)}
            placeholder="&"
            isDarkMode={isDarkMode}
          />
          <Field
            label="Second name"
            value={pendingData.herName ?? ""}
            onChange={(v) => handleLocalChange("herName", v)}
            placeholder="Chin"
            isDarkMode={isDarkMode}
          />
        </>
      ) : (
        <Field
          label="Event Name"
          value={pendingData.coupleName}
          onChange={(v) => handleLocalChange("coupleName", v)}
          placeholder="Birthday Party"
          isDarkMode={isDarkMode}
        />
      )}
      <div className={`border-t my-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
      <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>EVENT DATE</label>
      <div className="space-y-1">
        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Date</label>
        <div className="relative">
          <input
            ref={dateInputRef}
            type="date"
            value={pendingData.date}
            onChange={(e) => handleLocalChange("date", e.target.value)}
            className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
            style={{
              ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }),
              WebkitAppearance: "none"
            }}
          />
          <div 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer"
            style={{
              backgroundColor: accentColor,
              WebkitMaskImage: "url(/assets/date.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url(/assets/date.svg)",
              maskSize: "contain",
              maskPosition: "center",
              maskRepeat: "no-repeat"
            }}
            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
          />
          <style>{`
            input[type="date"]::-webkit-calendar-picker-indicator {
              display: none;
            }
          `}</style>
        </div>
      </div>
      <Field
        label="Time"
        value={pendingData.time}
        onChange={(v) => handleLocalChange("time", v)}
        placeholder="3:00 PM"
        isDarkMode={isDarkMode}
      />
      <div className="space-y-1">
        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Timezone</label>
        <select
          value={pendingData.timezone ?? ""}
          onChange={(e) => handleLocalChange("timezone", e.target.value)}
          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 bg-white"}`}
        style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
        >
          <option value="">Select timezone</option>
          <option value="GMT-12">GMT-12 (Baker Island)</option>
          <option value="GMT-11">GMT-11 (American Samoa)</option>
          <option value="GMT-10">GMT-10 (Hawaii)</option>
          <option value="GMT-9">GMT-9 (Alaska)</option>
          <option value="GMT-8">GMT-8 (Pacific Time)</option>
          <option value="GMT-7">GMT-7 (Mountain Time)</option>
          <option value="GMT-6">GMT-6 (Central Time)</option>
          <option value="GMT-5">GMT-5 (Eastern Time)</option>
          <option value="GMT-4">GMT-4 (Atlantic Time)</option>
          <option value="GMT-3">GMT-3 (Brazil)</option>
          <option value="GMT-2">GMT-2 (Mid-Atlantic)</option>
          <option value="GMT-1">GMT-1 (Azores)</option>
          <option value="GMT+0">GMT+0 (London)</option>
          <option value="GMT+1">GMT+1 (Central Europe)</option>
          <option value="GMT+2">GMT+2 (Eastern Europe)</option>
          <option value="GMT+3">GMT+3 (Moscow)</option>
          <option value="GMT+4">GMT+4 (Dubai)</option>
          <option value="GMT+5">GMT+5 (Pakistan)</option>
          <option value="GMT+6">GMT+6 (Bangladesh)</option>
          <option value="GMT+7">GMT+7 (Vietnam)</option>
          <option value="GMT+8">GMT+8 (Philippines/China)</option>
          <option value="GMT+9">GMT+9 (Japan)</option>
          <option value="GMT+10">GMT+10 (Sydney)</option>
          <option value="GMT+11">GMT+11 (Solomon Islands)</option>
          <option value="GMT+12">GMT+12 (New Zealand)</option>
        </select>
      </div>
      <div className={`border-t my-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
      <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>Event Location</label>
      <Field
        label="Ceremony Venue"
        value={pendingData.venueName}
        onChange={(v) => handleLocalChange("venueName", v)}
        placeholder="The Garden Pavilion"
        isDarkMode={isDarkMode}
      />
      <Field
        label="Ceremony Address"
        value={pendingData.venueAddress}
        onChange={(v) => handleLocalChange("venueAddress", v)}
        placeholder="Quezon City, Philippines"
        isDarkMode={isDarkMode}
      />
      <Field
        label="Reception Venue"
        value={pendingData.receptionVenueName ?? ""}
        onChange={(v) => handleLocalChange("receptionVenueName", v)}
        placeholder="The Grand Ballroom"
        isDarkMode={isDarkMode}
      />
      <Field
        label="Reception Address"
        value={pendingData.receptionVenueAddress ?? ""}
        onChange={(v) => handleLocalChange("receptionVenueAddress", v)}
        placeholder="Makati City, Philippines"
        isDarkMode={isDarkMode}
      />
      <div className={`border-t my-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
      <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>MESSAGE</label>
      <div className="space-y-1">
        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Host line</label>
        <div className="relative">
          <textarea
            value={pendingData.heroMessage ?? ""}
            onChange={(e) => handleLocalChange("heroMessage", e.target.value)}
            placeholder="We are getting married!"
            rows={2}
            className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
          />
          <button
            type="button"
            onClick={() => {
              const { message, nextIndex } = getNextMessage(HOST_LINE_MESSAGES, hostLineIndex);
              handleLocalChange("heroMessage", message);
              setHostLineIndex(nextIndex);
            }}
            className={`absolute right-2 top-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}
            title="Next message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Closing Sentiment</label>
        <div className="relative">
          <textarea
            value={pendingData.heroClosingSentiment ?? ""}
            onChange={(e) => handleLocalChange("heroClosingSentiment", e.target.value)}
            placeholder="We can't wait to celebrate with you!"
            rows={2}
            className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
          />
          <button
            type="button"
            onClick={() => {
              const { message, nextIndex } = getNextMessage(CLOSING_SENTIMENT_MESSAGES, closingSentimentIndex);
              handleLocalChange("heroClosingSentiment", message);
              setClosingSentimentIndex(nextIndex);
            }}
            className={`absolute right-2 top-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}
            title="Next message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
