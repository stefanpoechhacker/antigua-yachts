"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Vessel } from "@/lib/types";
import {
  NAV_STATUS,
  getShipTypeLabel,
  formatSpeed,
  formatLength,
  getNavStatusBg,
  timeAgo,
  marineTrafficUrl,
  vesselFinderUrl,
} from "@/lib/vessel-utils";
import { X, ExternalLink, Anchor, Compass, Ruler, Clock, Ship, Camera } from "lucide-react";
import Image from "next/image";

interface Props {
  vessel: Vessel;
  onClose: () => void;
}

function useVesselPhoto(mmsi: number) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPhotoUrl(null);
    fetch(`/api/vessel-photo?mmsi=${mmsi}`)
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (blob) setPhotoUrl(URL.createObjectURL(blob));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mmsi]);

  return { photoUrl, loading };
}

export default function VesselDetail({ vessel, onClose }: Props) {
  const { info, position, famousInfo, mmsi } = vessel;
  const name = info?.name ?? `MMSI ${mmsi}`;
  const navStatus = position?.navStatus ?? 15;
  const { photoUrl, loading: photoLoading } = useVesselPhoto(mmsi);

  // Prefer our fetched photo over the famous yacht hardcoded one
  const displayPhoto = photoUrl ?? famousInfo?.photoUrl ?? null;

  return (
    <div className="animate-slide-in flex flex-col h-full bg-navy-900 border-l border-white/10 overflow-hidden">
      {/* Vessel photo */}
      <div className="relative w-full h-44 bg-navy-800 flex-shrink-0 overflow-hidden">
        {displayPhoto ? (
          <>
            <Image
              src={displayPhoto}
              alt={name}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent" />
          </>
        ) : photoLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={24} className="text-gray-700 animate-pulse" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Camera size={24} className="text-gray-700" />
            <span className="text-xs text-gray-600">No photo available</span>
          </div>
        )}

        {/* Close button overlaid on photo */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Name overlay on photo */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {famousInfo && (
            <span className="text-gold-400 text-xs font-bold tracking-widest uppercase block mb-0.5">⭐ Famous</span>
          )}
          <h2 className={`text-xl font-bold drop-shadow-lg ${famousInfo ? "text-gold-300" : "text-white"}`}>
            {name}
          </h2>
          {info && (
            <div className="text-sm text-gray-300 drop-shadow">
              {info.flagEmoji} {info.flag} · {getShipTypeLabel(info.shipType)}
            </div>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${getNavStatusBg(navStatus)}`}>
          {NAV_STATUS[navStatus] ?? "Unknown"}
        </span>
        {position && (
          <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
            <Clock size={11} />
            {timeAgo(vessel.lastSeen)}
          </span>
        )}
      </div>

      {/* Famous info */}
      {famousInfo && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 flex-shrink-0">
          <div className="text-gold-400 font-bold text-sm">{famousInfo.owner}</div>
          {famousInfo.ownerTitle && (
            <div className="text-gold-400/70 text-xs mb-1">{famousInfo.ownerTitle}</div>
          )}
          <p className="text-gray-300 text-xs leading-relaxed">{famousInfo.notes}</p>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Position & Movement */}
        {position && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Position & Movement</h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard icon={<Compass size={14} />} label="Speed" value={formatSpeed(position.sog)} />
              <StatCard icon={<Compass size={14} className="rotate-45" />} label="Course" value={position.cog ? `${Math.round(position.cog)}°` : "—"} />
              <StatCard icon={<Anchor size={14} />} label="Latitude" value={`${position.lat.toFixed(4)}°N`} />
              <StatCard icon={<Anchor size={14} />} label="Longitude" value={`${Math.abs(position.lng).toFixed(4)}°W`} />
            </div>
          </div>
        )}

        {/* Vessel Details */}
        {info && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vessel Details</h3>
            <div className="grid grid-cols-2 gap-2">
              {info.length > 0 && (
                <StatCard icon={<Ruler size={14} />} label="Length" value={formatLength(info.length)} highlight={info.length >= 30} />
              )}
              {info.beam > 0 && (
                <StatCard icon={<Ruler size={14} className="rotate-90" />} label="Beam" value={formatLength(info.beam)} />
              )}
              {info.draught > 0 && (
                <StatCard icon={<Anchor size={14} />} label="Draught" value={`${info.draught}m`} />
              )}
              {info.imo > 0 && (
                <StatCard icon={<Ship size={14} />} label="IMO" value={`${info.imo}`} />
              )}
            </div>

            {info.callSign && (
              <Row label="Call Sign" value={info.callSign} mono />
            )}
            <Row label="MMSI" value={`${mmsi}`} mono />
            {info.destination && (
              <Row label="Destination" value={info.destination} accent />
            )}
            {info.eta && (
              <Row label="ETA" value={info.eta} />
            )}
          </div>
        )}

        {/* Size bar */}
        {info && info.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Vessel Size</span>
              <span className="text-xs text-gold-400 font-medium">
                {info.length >= 100 ? "MEGAYACHT" : info.length >= 60 ? "SUPERYACHT" : info.length >= 30 ? "Large Yacht" : "Yacht"}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${info.length >= 60 ? "bg-gold-400" : "bg-teal-400"}`}
                style={{ width: `${Math.min(100, (info.length / 140) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* External links */}
        <div className="space-y-2 pb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">More Info</h3>
          <a href={marineTrafficUrl(mmsi)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-colors border border-white/10">
            <ExternalLink size={14} /> MarineTraffic
          </a>
          <a href={vesselFinderUrl(mmsi)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-colors border border-white/10">
            <ExternalLink size={14} /> VesselFinder
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">{icon}<span className="text-xs">{label}</span></div>
      <div className={`text-sm font-semibold ${highlight ? "text-gold-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex gap-2 items-center text-sm">
      <span className="text-gray-500 text-xs w-20 flex-shrink-0">{label}</span>
      <span className={`${mono ? "font-mono" : ""} ${accent ? "text-teal-400 font-medium" : "text-white"}`}>{value}</span>
    </div>
  );
}
