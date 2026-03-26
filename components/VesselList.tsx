"use client";

import { useState } from "react";
import { Vessel } from "@/lib/types";
import {
  isYacht,
  NAV_STATUS,
  getShipTypeLabel,
  timeAgo,
  formatLength,
} from "@/lib/vessel-utils";
import { Search, Star } from "lucide-react";

type FilterMode = "all" | "yachts" | "famous";

interface Props {
  vessels: Vessel[];
  selectedMmsi: number | null;
  onSelectVessel: (mmsi: number) => void;
}

export default function VesselList({ vessels, selectedMmsi, onSelectVessel }: Props) {
  const [filter, setFilter] = useState<FilterMode>("yachts");
  const [search, setSearch] = useState("");

  const filtered = vessels
    .filter((v) => {
      if (filter === "yachts") return isYacht(v.info?.shipType ?? 0) || v.info?.shipType === 0;
      if (filter === "famous") return !!v.famousInfo;
      return true;
    })
    .filter((v) => {
      if (!search) return true;
      const name = v.info?.name ?? "";
      return name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      // Famous first, then by length desc
      if (a.famousInfo && !b.famousInfo) return -1;
      if (!a.famousInfo && b.famousInfo) return 1;
      return (b.info?.length ?? 0) - (a.info?.length ?? 0);
    });

  const totalYachts = vessels.filter((v) => isYacht(v.info?.shipType ?? 0)).length;
  const famousCount = vessels.filter((v) => v.famousInfo).length;

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-1 p-3 border-b border-white/10 flex-shrink-0">
        <StatPill label="Total" value={vessels.length} />
        <StatPill label="Yachts" value={totalYachts} accent />
        <StatPill label="Famous" value={famousCount} gold />
      </div>

      {/* Search */}
      <div className="p-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search vessels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-white/10 flex-shrink-0">
        {(["yachts", "all", "famous"] as FilterMode[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "text-gold-400 border-b-2 border-gold-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {f === "famous" ? "⭐ Famous" : f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 p-8 text-center">
            <div className="text-4xl mb-3">⚓</div>
            <div className="text-sm">
              {filter === "famous"
                ? "No famous yachts spotted yet"
                : "Waiting for vessels..."}
            </div>
          </div>
        ) : (
          filtered.map((vessel) => (
            <VesselRow
              key={vessel.mmsi}
              vessel={vessel}
              isSelected={vessel.mmsi === selectedMmsi}
              onClick={() => onSelectVessel(vessel.mmsi)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function VesselRow({
  vessel,
  isSelected,
  onClick,
}: {
  vessel: Vessel;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { info, position, famousInfo } = vessel;
  const name = info?.name ?? `MMSI ${vessel.mmsi}`;
  const navStatus = position?.navStatus ?? 15;
  const statusLabel = NAV_STATUS[navStatus] ?? "Unknown";
  const isFamousYacht = !!famousInfo;
  const shipType = info?.shipType ?? 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-white/5 transition-all hover:bg-white/5 ${
        isSelected ? "bg-white/10 border-l-2 border-l-gold-400" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isFamousYacht && <Star size={10} className="text-gold-400 fill-gold-400 flex-shrink-0" />}
            <span
              className={`text-sm font-semibold truncate ${
                isFamousYacht ? "text-gold-300" : "text-white"
              }`}
            >
              {name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{info?.flagEmoji ?? "🏴"}</span>
            <span className="truncate">{getShipTypeLabel(shipType)}</span>
            {info?.length ? <span className="text-teal-500">{formatLength(info.length)}</span> : null}
          </div>
          {isFamousYacht && (
            <div className="text-xs text-gold-500/70 truncate mt-0.5">{famousInfo.owner}</div>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <div
            className={`text-xs px-1.5 py-0.5 rounded-full mb-1 ${
              navStatus === 1 || navStatus === 5
                ? "bg-blue-500/20 text-blue-400"
                : navStatus === 0 || navStatus === 8
                ? "bg-green-500/20 text-green-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {statusLabel}
          </div>
          {position && (
            <div className="text-xs text-gray-600">{timeAgo(vessel.lastSeen)}</div>
          )}
        </div>
      </div>
    </button>
  );
}

function StatPill({
  label,
  value,
  accent,
  gold,
}: {
  label: string;
  value: number;
  accent?: boolean;
  gold?: boolean;
}) {
  return (
    <div className="flex flex-col items-center py-1.5 rounded-lg bg-white/5">
      <span
        className={`text-lg font-bold ${gold ? "text-gold-400" : accent ? "text-teal-400" : "text-white"}`}
      >
        {value}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
