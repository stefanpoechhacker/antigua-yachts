"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useAISStream } from "@/hooks/useAISStream";
import VesselList from "@/components/VesselList";
import VesselDetail from "@/components/VesselDetail";
import { Anchor, Radio, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

interface Props {
  apiKey: string;
}

export default function AntiguaApp({ apiKey }: Props) {
  const { vessels, status, statusDetail, messageCount } = useAISStream(apiKey);
  const [selectedMmsi, setSelectedMmsi] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selectedVessel = selectedMmsi ? vessels.find((v) => v.mmsi === selectedMmsi) : null;

  const noKey = !apiKey || apiKey === "your_api_key_here";

  return (
    <div className="flex h-screen w-screen bg-navy-950 text-white overflow-hidden">
      {/* Left sidebar */}
      <div
        className={`flex-shrink-0 flex flex-col transition-all duration-300 border-r border-white/10 bg-navy-900 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Anchor size={18} className="text-gold-400" />
            <h1 className="font-display font-bold text-gold-400 text-lg tracking-wide">
              Antigua Watch
            </h1>
          </div>
          <p className="text-xs text-gray-500">Who&apos;s in town? 👀</p>

          {/* Connection status */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                status === "connected"
                  ? "bg-green-400 animate-pulse-slow"
                  : status === "connecting"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-red-400"
              }`}
            />
            <span className="text-xs text-gray-500 capitalize">{status}</span>
            {status === "connected" && (
              <span className="text-xs text-gray-600 ml-auto">{messageCount} signals</span>
            )}
          </div>
          {statusDetail && status !== "connected" && (
            <div className="mt-1 text-xs text-gray-600 leading-tight">{statusDetail}</div>
          )}
        </div>

        {noKey ? (
          <ApiKeyPrompt />
        ) : (
          <VesselList
            vessels={vessels}
            selectedMmsi={selectedMmsi}
            onSelectVessel={setSelectedMmsi}
          />
        )}
      </div>

      {/* Toggle sidebar */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-10 flex items-center justify-center bg-navy-800 border border-white/10 rounded-r-lg hover:bg-navy-700 transition-colors"
        style={{ left: sidebarOpen ? "288px" : "0px" }}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Map */}
      <div className="flex-1 relative">
        {/* Top bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-navy-900/90 backdrop-blur border border-white/10 flex items-center gap-3 text-sm">
          <Radio size={14} className="text-gold-400" />
          <span className="text-gray-300 font-medium">Antigua &amp; Barbuda</span>
          <span className="text-gray-600">·</span>
          <span className="text-gold-400 font-semibold">{vessels.length}</span>
          <span className="text-gray-500">vessels live</span>
        </div>

        {/* Map legend */}
        <div className="absolute bottom-8 left-4 z-10 p-3 rounded-xl bg-navy-900/90 backdrop-blur border border-white/10 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full bg-gold-400" />
            <span>Famous yacht</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full bg-teal-400" />
            <span>Pleasure craft</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Other vessel</span>
          </div>
        </div>

        <MapComponent
          vessels={vessels}
          selectedMmsi={selectedMmsi}
          onSelectVessel={(mmsi) => setSelectedMmsi(mmsi === selectedMmsi ? null : mmsi)}
        />
      </div>

      {/* Right detail panel */}
      {selectedVessel && (
        <div className="flex-shrink-0 w-72">
          <VesselDetail
            vessel={selectedVessel}
            onClose={() => setSelectedMmsi(null)}
          />
        </div>
      )}
    </div>
  );
}

function ApiKeyPrompt() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle size={40} className="text-gold-400 mb-4" />
      <h3 className="text-white font-semibold mb-2">AISStream API Key Required</h3>
      <p className="text-gray-500 text-sm mb-4 leading-relaxed">
        Get your <strong className="text-gold-400">free</strong> API key at{" "}
        <span className="text-teal-400">aisstream.io</span>
      </p>
      <div className="text-xs text-gray-600 bg-white/5 rounded-lg p-3 text-left font-mono w-full">
        <div className="text-gray-500 mb-1"># .env.local</div>
        <div>NEXT_PUBLIC_</div>
        <div>AISSTREAM_API_KEY=</div>
        <div className="text-gold-400">your_key_here</div>
      </div>
    </div>
  );
}
