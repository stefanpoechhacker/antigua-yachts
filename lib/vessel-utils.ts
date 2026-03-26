// MID (Maritime Identification Digits) → country flag emoji
const MID_TO_FLAG: Record<number, [string, string]> = {
  201: ["Albania", "🇦🇱"], 202: ["Andorra", "🇦🇩"], 203: ["Austria", "🇦🇹"],
  204: ["Azores", "🇵🇹"], 205: ["Belgium", "🇧🇪"], 206: ["Belarus", "🇧🇾"],
  207: ["Bulgaria", "🇧🇬"], 208: ["Vatican", "🇻🇦"], 209: ["Cyprus", "🇨🇾"],
  210: ["Cyprus", "🇨🇾"], 211: ["Germany", "🇩🇪"], 212: ["Cyprus", "🇨🇾"],
  213: ["Georgia", "🇬🇪"], 214: ["Moldova", "🇲🇩"], 215: ["Malta", "🇲🇹"],
  216: ["Armenia", "🇦🇲"], 218: ["Germany", "🇩🇪"], 219: ["Denmark", "🇩🇰"],
  220: ["Denmark", "🇩🇰"], 224: ["Spain", "🇪🇸"], 225: ["Spain", "🇪🇸"],
  226: ["France", "🇫🇷"], 227: ["France", "🇫🇷"], 228: ["France", "🇫🇷"],
  229: ["Malta", "🇲🇹"], 230: ["Finland", "🇫🇮"], 231: ["Faroe Islands", "🇫🇴"],
  232: ["UK", "🇬🇧"], 233: ["UK", "🇬🇧"], 234: ["UK", "🇬🇧"], 235: ["UK", "🇬🇧"],
  236: ["Gibraltar", "🇬🇮"], 237: ["Greece", "🇬🇷"], 238: ["Croatia", "🇭🇷"],
  239: ["Greece", "🇬🇷"], 240: ["Greece", "🇬🇷"], 241: ["Greece", "🇬🇷"],
  242: ["Morocco", "🇲🇦"], 243: ["Hungary", "🇭🇺"], 244: ["Netherlands", "🇳🇱"],
  245: ["Netherlands", "🇳🇱"], 246: ["Netherlands", "🇳🇱"], 247: ["Italy", "🇮🇹"],
  248: ["Malta", "🇲🇹"], 249: ["Malta", "🇲🇹"], 250: ["Ireland", "🇮🇪"],
  251: ["Iceland", "🇮🇸"], 252: ["Liechtenstein", "🇱🇮"], 253: ["Luxembourg", "🇱🇺"],
  254: ["Monaco", "🇲🇨"], 255: ["Madeira", "🇵🇹"], 256: ["Malta", "🇲🇹"],
  257: ["Norway", "🇳🇴"], 258: ["Norway", "🇳🇴"], 259: ["Norway", "🇳🇴"],
  261: ["Poland", "🇵🇱"], 262: ["Montenegro", "🇲🇪"], 263: ["Portugal", "🇵🇹"],
  264: ["Romania", "🇷🇴"], 265: ["Sweden", "🇸🇪"], 266: ["Sweden", "🇸🇪"],
  267: ["Slovakia", "🇸🇰"], 268: ["San Marino", "🇸🇲"], 269: ["Switzerland", "🇨🇭"],
  270: ["Czech Republic", "🇨🇿"], 271: ["Turkey", "🇹🇷"], 272: ["Ukraine", "🇺🇦"],
  273: ["Russia", "🇷🇺"], 274: ["North Macedonia", "🇲🇰"], 275: ["Latvia", "🇱🇻"],
  276: ["Estonia", "🇪🇪"], 277: ["Lithuania", "🇱🇹"], 278: ["Slovenia", "🇸🇮"],
  279: ["Serbia", "🇷🇸"],
  303: ["USA", "🇺🇸"], 338: ["USA", "🇺🇸"], 339: ["Cayman Islands", "🇰🇾"],
  366: ["USA", "🇺🇸"], 367: ["USA", "🇺🇸"], 368: ["USA", "🇺🇸"],
  369: ["USA", "🇺🇸"], 370: ["Panama", "🇵🇦"], 371: ["Panama", "🇵🇦"],
  372: ["Panama", "🇵🇦"], 373: ["Panama", "🇵🇦"], 374: ["Panama", "🇵🇦"],
  376: ["British Virgin Islands", "🇻🇬"], 378: ["British Virgin Islands", "🇻🇬"],
  379: ["British Virgin Islands", "🇻🇬"], 319: ["Cayman Islands", "🇰🇾"],
  341: ["Antigua & Barbuda", "🇦🇬"], 355: ["Bahamas", "🇧🇸"],
  308: ["Bermuda", "🇧🇲"], 316: ["Canada", "🇨🇦"],
  440: ["Japan", "🇯🇵"], 477: ["Hong Kong", "🇭🇰"],
  518: ["Cook Islands", "🇨🇰"], 525: ["Indonesia", "🇮🇩"],
  538: ["Marshall Islands", "🇲🇭"], 553: ["Papua New Guinea", "🇵🇬"],
  557: ["Solomon Islands", "🇸🇧"], 566: ["Singapore", "🇸🇬"],
  636: ["Liberia", "🇱🇷"], 667: ["Sierra Leone", "🇸🇱"],
  710: ["Brazil", "🇧🇷"], 720: ["Argentina", "🇦🇷"], 725: ["Chile", "🇨🇱"],
  740: ["Uruguay", "🇺🇾"], 760: ["Venezuela", "🇻🇪"],
};

export function getFlagFromMMSI(mmsi: number): [string, string] {
  const mid = Math.floor(mmsi / 1_000_000);
  return MID_TO_FLAG[mid] ?? ["Unknown", "🏴"];
}

export const NAV_STATUS: Record<number, string> = {
  0: "Underway",
  1: "At Anchor",
  2: "Not Under Command",
  3: "Restricted",
  5: "Moored",
  6: "Aground",
  8: "Sailing",
  15: "Unknown",
};

export const SHIP_TYPES: Record<number, string> = {
  0: "Unknown",
  20: "Wing in Ground",
  21: "Wing in Ground",
  30: "Fishing",
  31: "Towing",
  32: "Towing",
  33: "Dredging",
  34: "Diving",
  35: "Military",
  36: "Sailing Yacht",
  37: "Pleasure Craft",
  40: "High Speed Craft",
  41: "High Speed Craft",
  50: "Pilot Vessel",
  51: "Search & Rescue",
  52: "Tug",
  53: "Port Tender",
  54: "Anti-Pollution",
  55: "Law Enforcement",
  60: "Passenger",
  61: "Passenger",
  70: "Cargo",
  71: "Cargo",
  80: "Tanker",
  81: "Tanker",
  90: "Other",
};

export function getShipTypeLabel(type: number): string {
  if (type >= 20 && type <= 29) return SHIP_TYPES[20] ?? "Wing in Ground";
  if (type >= 30 && type <= 39) return SHIP_TYPES[type] ?? "Special";
  if (type >= 40 && type <= 49) return SHIP_TYPES[40] ?? "High Speed";
  if (type >= 50 && type <= 59) return SHIP_TYPES[type] ?? "Special";
  if (type >= 60 && type <= 69) return SHIP_TYPES[60] ?? "Passenger";
  if (type >= 70 && type <= 79) return SHIP_TYPES[70] ?? "Cargo";
  if (type >= 80 && type <= 89) return SHIP_TYPES[80] ?? "Tanker";
  if (type >= 90 && type <= 99) return SHIP_TYPES[90] ?? "Other";
  return SHIP_TYPES[type] ?? "Unknown";
}

export function isYacht(shipType: number): boolean {
  return shipType === 36 || shipType === 37;
}

export function isLargeVessel(length: number): boolean {
  return length >= 50;
}

export function isSuperYacht(length: number): boolean {
  return length >= 30 && length > 0;
}

export function formatSpeed(knots: number): string {
  if (knots < 0.3) return "Stationary";
  return `${knots.toFixed(1)} kn`;
}

export function formatLength(m: number): string {
  if (!m || m === 0) return "—";
  return `${m}m`;
}

export function getNavStatusColor(status: number): string {
  if (status === 1 || status === 5) return "text-blue-400";
  if (status === 0 || status === 8) return "text-green-400";
  if (status === 6) return "text-red-400";
  return "text-gray-400";
}

export function getNavStatusBg(status: number): string {
  if (status === 1 || status === 5) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  if (status === 0 || status === 8) return "bg-green-500/20 text-green-300 border-green-500/30";
  return "bg-gray-500/20 text-gray-300 border-gray-500/30";
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function marineTrafficUrl(mmsi: number): string {
  return `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${mmsi}`;
}

export function vesselFinderUrl(mmsi: number): string {
  return `https://www.vesselfinder.com/vessels/details/${mmsi}`;
}
