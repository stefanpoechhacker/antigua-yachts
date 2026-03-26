"use client";

import { useEffect, useRef, useState } from "react";
import { Vessel, AISStreamMessage } from "@/lib/types";
import { getFlagFromMMSI } from "@/lib/vessel-utils";
import { findFamousYacht } from "@/lib/famous-yachts";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export function useAISStream(_apiKey: string) {
  const [vessels, setVessels] = useState<Map<number, Vessel>>(new Map());
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [statusDetail, setStatusDetail] = useState("Connecting to AISStream...");
  const [messageCount, setMessageCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const retryDelay = useRef(5000);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;
      setStatus("connecting");
      setStatusDetail(`Connecting to AISStream...`);

      const es = new EventSource("/api/ais-stream");
      esRef.current = es;

      es.addEventListener("status", (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const { connected, code, reason } = JSON.parse(e.data as string);
          if (connected) {
            setStatus("connected");
            setStatusDetail("Live — receiving AIS data");
            retryDelay.current = 5000; // reset backoff on success
          } else {
            setStatus("disconnected");
            setStatusDetail(`Disconnected — reconnecting in ${retryDelay.current / 1000}s`);
            es.close();
            reconnectTimer.current = setTimeout(connect, retryDelay.current);
            retryDelay.current = Math.min(retryDelay.current * 2, 60000); // max 60s
          }
        } catch { /* ignore */ }
      });

      es.addEventListener("error", (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const { message } = JSON.parse(e.data as string);
          setStatus("error");
          setStatusDetail(`Error: ${message} — retrying in ${retryDelay.current / 1000}s`);
          es.close();
          reconnectTimer.current = setTimeout(connect, retryDelay.current);
          retryDelay.current = Math.min(retryDelay.current * 2, 60000);
        } catch { /* ignore */ }
      });

      es.onmessage = (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const data: AISStreamMessage = JSON.parse(e.data as string);
          const mmsi = data.MetaData?.MMSI;
          if (!mmsi) return;

          setMessageCount((c) => c + 1);

          setVessels((prev) => {
            const next = new Map(prev);
            const existing: Vessel = next.get(mmsi) ?? { mmsi, lastSeen: data.MetaData.time_utc };

            if (
              data.MessageType === "PositionReport" ||
              data.MessageType === "StandardClassBPositionReport"
            ) {
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
                    ? `${info.Eta.Month}/${info.Eta.Day} ${String(info.Eta.Hour).padStart(2, "0")}:${String(info.Eta.Minute).padStart(2, "0")}`
                    : undefined,
                };
                if (name) existing.famousInfo = findFamousYacht(name);
                existing.lastSeen = data.MetaData.time_utc;
              }
            }

            // Fallback: use metadata name
            if (!existing.info?.name && data.MetaData.ShipName) {
              const name = data.MetaData.ShipName.trim();
              if (name) {
                if (!existing.info) {
                  const [flag, flagEmoji] = getFlagFromMMSI(mmsi);
                  existing.info = {
                    name, callSign: "", shipType: 0, imo: 0,
                    length: 0, beam: 0, draught: 0, destination: "",
                    flag, flagEmoji,
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
        } catch { /* ignore parse errors */ }
      };

      // EventSource network error (not the AIS-level error event)
      es.onerror = () => {
        if (!mountedRef.current) return;
        if (es.readyState === EventSource.CLOSED) {
          setStatus("disconnected");
          setStatusDetail("Connection lost — reconnecting in 5s");
          reconnectTimer.current = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  const vesselArray = Array.from(vessels.values()).filter((v) => v.position);
  return { vessels: vesselArray, allVessels: vessels, status, statusDetail, messageCount };
}
