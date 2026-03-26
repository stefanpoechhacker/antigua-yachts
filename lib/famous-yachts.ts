import { FamousYacht } from "./types";

// Famous superyachts that visit the Caribbean / Antigua
// All information is publicly available
export const FAMOUS_YACHTS: Record<string, FamousYacht> = {
  "RISING SUN": {
    owner: "Larry Ellison",
    ownerTitle: "Oracle Co-Founder",
    notes: "138m. One of the world's largest private yachts. 82 cabins, basketball court.",
    photoUrl: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400",
  },
  "FLYING FOX": {
    owner: "Charter / Private",
    ownerTitle: "136m Superyacht",
    notes: "136m. Largest charter yacht ever built. Infinity pool, submarine, helipad.",
    photoUrl: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400",
  },
  "AMADEA": {
    owner: "Seized / US Treasury",
    ownerTitle: "Formerly Russian oligarch",
    notes: "106m. Seized under Russia sanctions 2022. Features gold leaf interior.",
    photoUrl: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400",
  },
  "EON": {
    owner: "Larry Ellison",
    ownerTitle: "Oracle Co-Founder",
    notes: "72m. Ellison's second yacht. Regularly spotted in the Caribbean.",
  },
  "AQUILA": {
    owner: "Barry Diller & Diane von Furstenberg",
    ownerTitle: "IAC Chairman",
    notes: "75m. Features a distinctive sleek black hull. Caribbean regular.",
  },
  "TOPAZ": {
    owner: "UAE Royal Family",
    ownerTitle: "Abu Dhabi Royal",
    notes: "147m. One of the world's 10 largest yachts. Cinema, spa, helipad.",
  },
  "LADY MOURA": {
    owner: "Nasser Al-Rashid",
    ownerTitle: "Saudi Business",
    notes: "105m. Famous for its gold-leaf hull lettering and remote-controlled jet ski.",
  },
  "TANGO": {
    owner: "Victor Vekselberg",
    ownerTitle: "Russian Billionaire",
    notes: "83m. Seized in Spain 2022 under Russia sanctions.",
  },
  "MY SONG": {
    owner: "Pier Luigi Loro Piana",
    ownerTitle: "Fashion Heir",
    notes: "40m sailing yacht. Sank briefly in Antigua after crew error in 2019. Insured for €14m.",
  },
  "OCEAN VICTORY": {
    owner: "Victor Rashnikov",
    ownerTitle: "Russian Steel Oligarch",
    notes: "88m. Seized in Gibraltar 2022 under EU sanctions.",
  },
  "KISMET": {
    owner: "Shahid Khan",
    ownerTitle: "Jacksonville Jaguars Owner",
    notes: "95m. Named after the Turkish word for fate. Regular Caribbean visitor.",
  },
  "SYMPHONY": {
    owner: "Jeff Bezos",
    ownerTitle: "Amazon Founder",
    notes: "127m. World's largest sailing yacht. Three masts. Accompanying support yacht 'Abeona'.",
    photoUrl: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400",
  },
  "KORU": {
    owner: "Jeff Bezos",
    ownerTitle: "Amazon Founder",
    notes: "127m sailing yacht. Named after Maori symbol for new beginnings. Launched 2023.",
  },
  "EXCELLENCE V": {
    owner: "Heiner Langerbeck",
    ownerTitle: "German Businessman",
    notes: "80m. Classic motor yacht. Caribbean regular.",
  },
  "LIMITLESS": {
    owner: "Les Wexner",
    ownerTitle: "L Brands Founder",
    notes: "84m. One of the largest yachts registered in the USA.",
  },
};

export function findFamousYacht(name: string): FamousYacht | undefined {
  if (!name) return undefined;
  const upperName = name.toUpperCase().trim();

  // Direct match
  if (FAMOUS_YACHTS[upperName]) return FAMOUS_YACHTS[upperName];

  // Partial match
  for (const [key, val] of Object.entries(FAMOUS_YACHTS)) {
    if (upperName.includes(key) || key.includes(upperName)) {
      return val;
    }
  }

  return undefined;
}
