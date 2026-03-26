"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Vessel } from "@/lib/types";
import { NAV_STATUS, isYacht } from "@/lib/vessel-utils";

interface Props {
  vessels: Vessel[];
  selectedMmsi: number | null;
  onSelectVessel: (mmsi: number) => void;
}

const ANTIGUA_CENTER: [number, number] = [17.05, -61.80];

function createYachtIcon(isSelected: boolean, isFamous: boolean, isYachtType: boolean, sog: number): L.DivIcon {
  const moving = sog > 0.5;
  const color = isFamous ? "#f0c060" : isYachtType ? "#2dd4bf" : "#94a3b8";
  const size = isFamous ? 14 : isYachtType ? 12 : 10;
  const ring = isSelected ? `box-shadow:0 0 0 3px ${color},0 0 0 5px rgba(255,255,255,0.3);` : "";
  const pulse = isFamous && moving
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size * 2.5}px;height:${size * 2.5}px;border-radius:50%;border:2px solid ${color};opacity:0.4;animation:ping 2s ease-out infinite;"></div>`
    : "";

  const html = `
    <div style="position:relative;width:${size * 2}px;height:${size * 2}px;">
      ${pulse}
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:${size}px;height:${size}px;
        background:${color};border-radius:50%;
        border:2px solid rgba(255,255,255,0.8);
        ${ring}
      "></div>
    </div>`;

  return L.divIcon({ html, className: "", iconSize: [size * 2, size * 2], iconAnchor: [size, size] });
}

export default function MapComponent({ vessels, selectedMmsi, onSelectVessel }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: ANTIGUA_CENTER,
      zoom: 11,
      zoomControl: false,
    });

    // CartoDB Dark Matter tiles - free, no API key
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Antigua label
    const antiguaLabel = L.divIcon({
      html: `<div style="color:#d4a853;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:0.7;text-shadow:0 1px 3px #000;pointer-events:none;">ANTIGUA</div>`,
      className: "",
      iconSize: [100, 20],
      iconAnchor: [50, 10],
    });
    L.marker([17.12, -61.84], { icon: antiguaLabel, interactive: false }).addTo(map);

    // English Harbour label
    const ehLabel = L.divIcon({
      html: `<div style="color:#60a5fa;font-size:9px;font-weight:600;letter-spacing:1px;opacity:0.8;text-shadow:0 1px 2px #000;pointer-events:none;">⚓ ENGLISH HARBOUR</div>`,
      className: "",
      iconSize: [130, 16],
      iconAnchor: [65, 8],
    });
    L.marker([17.00, -61.77], { icon: ehLabel, interactive: false }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<number>();

    vessels.forEach((vessel) => {
      if (!vessel.position) return;
      const { lat, lng, sog, navStatus } = vessel.position;
      const mmsi = vessel.mmsi;
      seen.add(mmsi);

      const isSelected = selectedMmsi === mmsi;
      const isFamous = !!vessel.famousInfo;
      const isYachtType = isYacht(vessel.info?.shipType ?? 0);
      const icon = createYachtIcon(isSelected, isFamous, isYachtType, sog);
      const name = vessel.info?.name ?? `MMSI ${mmsi}`;
      const status = NAV_STATUS[navStatus] ?? "Unknown";

      const existing = markersRef.current.get(mmsi);
      if (existing) {
        existing.setLatLng([lat, lng]);
        existing.setIcon(icon);
      } else {
        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindTooltip(
            `<div style="background:#0f2040;border:1px solid #d4a853;color:#fff;padding:4px 8px;border-radius:6px;font-size:12px;font-family:sans-serif;">
              <div style="font-weight:700;color:${isFamous ? "#f0c060" : "#fff"}">${name}</div>
              <div style="color:#94a3b8;font-size:10px;">${status} · ${sog?.toFixed(1) ?? "—"} kn</div>
            </div>`,
            { sticky: true, className: "yacht-tooltip", opacity: 1 }
          )
          .on("click", () => onSelectVessel(mmsi));
        markersRef.current.set(mmsi, marker);
      }
    });

    // Remove stale markers
    markersRef.current.forEach((marker, mmsi) => {
      if (!seen.has(mmsi)) {
        marker.remove();
        markersRef.current.delete(mmsi);
      }
    });
  }, [vessels, selectedMmsi, onSelectVessel]);

  // Pan to selected vessel
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedMmsi) return;
    const vessel = vessels.find((v) => v.mmsi === selectedMmsi);
    if (vessel?.position) {
      map.panTo([vessel.position.lat, vessel.position.lng], { animate: true });
    }
  }, [selectedMmsi, vessels]);

  return (
    <>
      <style>{`
        .yacht-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
        @keyframes ping { 0% { transform: translate(-50%,-50%) scale(0.5); opacity:0.8; } 100% { transform: translate(-50%,-50%) scale(2); opacity:0; } }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}
