"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Vessel, AISStreamMessage } from "@/lib/types";
import { getFlagFromMMSI, getShipTypeLabel } from "@/lib/vessel-utils";
import { findFamousYacht } from "@/lib/famous-yachts";

// Antigua & Barbuda bounding box (expanded to catch approaching vessels)
const ANTIGUA_BBOX = [[[16.5, -62.5], [17.85, -61.2]]];

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export function useAISStream(apiKey: string) {
  const [vessels, setVessels] = useState<Map<number, Vessel>>(new Map());
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [messageCount, setMessageCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!apiKey || apiKey === "your_api_key_here") return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: ANTIGUA_BBOX,
        FilterMessageTypes: ["PositionReport", "ShipStaticData", "StandardClassBPositionReport"],
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: AISStreamMessage = JSON.parse(event.data as string);
        const mmsi = data.MetaData?.MMSI;
        if (!mmsi) return;

        setMessageCount((c) => c + 1);

        setVessels((prev) => {
          const next = new Map(prev);
          const existing = next.get(mmsi) ?? { mmsi, lastSeen: data.MetaData.time_utc };

          if (data.MessageType === "PositionReport" || data.MessageType === "StandardClassBPositionReport") {
            const pos = data.Message.PositionReport;
            if (pos && pos.Latitude !== 0 && pos.Longitude !== 0) {
              existing.position = {
                lat: pos.Latitude,
                lng: pos.Longitude,
                sog: pos.SpeedOverGround,
                cog: pos.CourseOverGround,
                heading: pos.TrueHeading,
                navStatus: pos.NavigationalStatus,
                timestamp: data.MetaData.time_utc,
              };
              existing.lastSeen = data.MetaData.time_utc;
            }
          }

          if (data.MessageType === "ShipStaticData") {
            const info = data.Message.ShipStaticData;
            if (info) {
              const name = (info.Name || data.MetaData.ShipName || "").trim();
              const [flag, flagEmoji] = getFlagFromMMSI(mmsi);
              const dim = info.Dimension ?? { A: 0, B: 0, C: 0, D: 0 };
              existing.info = {
                name,
                callSign: info.CallSign?.trim() ?? "",
                shipType: info.ShipType,
                imo: info.ImoNumber,
                length: (dim.A ?? 0) + (dim.B ?? 0),
                beam: (dim.C ?? 0) + (dim.D ?? 0),
                draught: info.MaximumStaticDraught ?? 0,
                destination: (info.Destination ?? "").trim(),
                flag,
                flagEmoji,
                eta: info.Eta
                  ? `${info.Eta.Month}/${info.Eta.Day} ${String(info.Eta.Hour).padStart(2,"0")}:${String(info.Eta.Minute).padStart(2,"0")}`
                  : undefined,
              };
              if (name) {
                existing.famousInfo = findFamousYacht(name);
              }
              existing.lastSeen = data.MetaData.time_utc;
            }
          }

          // Use metadata name as fallback
          if (!existing.info?.name && data.MetaData.ShipName) {
            const name = data.MetaData.ShipName.trim();
            if (name) {
              if (!existing.info) {
                const [flag, flagEmoji] = getFlagFromMMSI(mmsi);
                existing.info = {
                  name,
                  callSign: "",
                  shipType: 0,
                  imo: 0,
                  length: 0,
                  beam: 0,
                  draught: 0,
                  destination: "",
                  flag,
                  flagEmoji,
                };
              } else {
                existing.info.name = name;
              }
              existing.famousInfo = findFamousYacht(name);
            }
          }

          next.set(mmsi, { ...existing });
          return next;
        });
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus("error");
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("disconnected");
      // Reconnect after 5 seconds
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 5000);
    };
  }, [apiKey]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const vesselArray = Array.from(vessels.values()).filter((v) => v.position);

  return { vessels: vesselArray, allVessels: vessels, status, messageCount };
}
