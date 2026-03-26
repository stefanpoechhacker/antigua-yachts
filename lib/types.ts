export interface VesselPosition {
  lat: number;
  lng: number;
  sog: number; // speed over ground (knots)
  cog: number; // course over ground (degrees)
  heading: number;
  navStatus: number;
  timestamp: string;
}

export interface VesselInfo {
  name: string;
  callSign: string;
  shipType: number;
  imo: number;
  length: number; // metres (A+B)
  beam: number;   // metres (C+D)
  draught: number;
  destination: string;
  flag: string;
  flagEmoji: string;
  eta?: string;
}

export interface FamousYacht {
  owner: string;
  ownerTitle?: string;
  notes: string;
  photoUrl?: string;
}

export interface Vessel {
  mmsi: number;
  position?: VesselPosition;
  info?: VesselInfo;
  lastSeen: string;
  famousInfo?: FamousYacht;
}

// AISStream raw message types
export interface AISStreamMessage {
  MessageType: string;
  Message: {
    PositionReport?: RawPositionReport;
    ShipStaticData?: RawShipStaticData;
    StandardClassBPositionReport?: RawPositionReport;
  };
  MetaData: {
    MMSI: number;
    ShipName: string;
    latitude: number;
    longitude: number;
    time_utc: string;
  };
}

export interface RawPositionReport {
  UserID: number;
  Latitude: number;
  Longitude: number;
  SpeedOverGround: number;
  CourseOverGround: number;
  TrueHeading: number;
  NavigationalStatus: number;
  Timestamp: number;
}

export interface RawShipStaticData {
  UserID: number;
  Name: string;
  CallSign: string;
  ShipType: number;
  Dimension: { A: number; B: number; C: number; D: number };
  ImoNumber: number;
  Destination: string;
  Eta: { Month: number; Day: number; Hour: number; Minute: number };
  MaximumStaticDraught: number;
}
