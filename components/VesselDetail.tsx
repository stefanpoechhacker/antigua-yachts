"use client";

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
import { X, ExternalLink, Anchor, Compass, Ruler, Flag, Clock, Ship } from "lucide-react";
import Image from "next/image";

interface Props {
  vessel: Vessel;
  onClose: () => void;
}

export default function VesselDetail({ vessel, onClose }: Props) {
  const { info, position, famousInfo, mmsi } = vessel;
  const name = info?.name ?? `MMSI ${mmsi}`;
  const navStatus = position?.navStatus ?? 15;

  return (
    <div className="animate-slide-in flex flex-col h-full bg-navy-900 border-l border-white/10 overflow-hidden">
      {/* Header */}
      <div className="relative p-4 border-b border-white/10 flex-shrink-0">
        {famousInfo && (
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-transparent pointer-events-none" />
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {famousInfo && <span className="text-gold-400 text-xs font-bold tracking-widest uppercase">⭐ Famous</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getNavStatusBg(navStatus)}`}>
                {NAV_STATUS[navStatus] ?? "Unknown"}
              </span>
            </div>
            <h2 className={`text-xl font-bold truncate ${famousInfo ? "text-gold-400" : "text-white"}`}>
              {name}
            </h2>
            {info && (
              <div className="text-sm text-gray-400 mt-0.5">
                {info.flagEmoji} {info.flag} · {getShipTypeLabel(info.shipType)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Famous info */}
      {famousInfo && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 flex-shrink-0">
          {famousInfo.photoUrl && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3">
              <Image
                src={famousInfo.photoUrl}
                alt={name}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
            </div>
          )}
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
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>Updated {timeAgo(vessel.lastSeen)}</span>
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
              <div className="flex gap-2 items-center text-sm">
                <span className="text-gray-500 text-xs w-20 flex-shrink-0">Call Sign</span>
                <span className="text-white font-mono">{info.callSign}</span>
              </div>
            )}
            <div className="flex gap-2 items-center text-sm">
              <span className="text-gray-500 text-xs w-20 flex-shrink-0">MMSI</span>
              <span className="text-white font-mono">{mmsi}</span>
            </div>
            {info.destination && (
              <div className="flex gap-2 items-start text-sm">
                <span className="text-gray-500 text-xs w-20 flex-shrink-0 mt-0.5">Destination</span>
                <span className="text-teal-400 font-medium">{info.destination}</span>
              </div>
            )}
            {info.eta && (
              <div className="flex gap-2 items-center text-sm">
                <span className="text-gray-500 text-xs w-20 flex-shrink-0">ETA</span>
                <span className="text-white">{info.eta}</span>
              </div>
            )}
          </div>
        )}

        {/* Vessel Size Indicator */}
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
                className={`h-full rounded-full transition-all ${info.length >= 60 ? "bg-gold-400" : "bg-teal-400"}`}
                style={{ width: `${Math.min(100, (info.length / 140) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>0m</span>
              <span>70m</span>
              <span>140m+</span>
            </div>
          </div>
        )}

        {/* External Links */}
        <div className="space-y-2 pb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Track Online</h3>
          <a
            href={marineTrafficUrl(mmsi)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-colors border border-white/10"
          >
            <ExternalLink size={14} />
            MarineTraffic
          </a>
          <a
            href={vesselFinderUrl(mmsi)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-colors border border-white/10"
          >
            <ExternalLink size={14} />
            VesselFinder
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`text-sm font-semibold ${highlight ? "text-gold-400" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
