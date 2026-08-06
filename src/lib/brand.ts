export const BRAND = {
  primary: "#0B6839",
  primaryDark: "#074a29",
  accent: "#FEE101",
  pink: "#FF0080",
  offwhite: "#FFFBE8",
  white: "#FFFFFF",
  black: "#0A0A0A",
} as const;

export const EVENT = {
  name: "GOA",
  nameHindi: "गोवा",
  full: "HACKER HOUSE GOA",
  year: "2026",
  dates: "28 – 31 OCT 2026",
  place: "GOA, INDIA",
  hashtag: "#FrameInGoa",
  studio: "2:47 PM STUDIO",
} as const;

export const BUILDER_TITLES = [
  "Terminal Surfer",
  "Ship-or-Ship Architect",
  "Coastal Compiler",
  "On-Chain Cartographer",
  "Demo Day Demigod",
  "Fiber & Fire Builder",
  "Palm Protocol Lead",
  "Night-Shift Shipper",
  "Sandbox Sovereign",
  "Latency Whisperer",
  "Prompt Pirate",
  "Mainnet Mariner",
  "Bounty Beachcomber",
  "Stack Stormrider",
  "Goa Runtime Legend",
  "Waveform Wizard",
  "Commit Coast Captain",
  "Hack House Herald",
  "Pixel & Palm Pioneer",
  "Build-Station Boss",
  "Oceanic Optimizer",
  "Residency Renegade",
  "Token Tide Turner",
  "AI × Crypto Alchemist",
] as const;

export function generateBuilderTitle(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return BUILDER_TITLES[hash % BUILDER_TITLES.length];
}

export function shareCaption(name?: string, title?: string): string {
  const who = name?.trim() ? name.trim() : "a builder";
  const role = title?.trim() ? ` — ${title.trim()}` : "";
  return `Locked in for Hacker House Goa 2026 as ${who}${role}.\n\nMade my official HH Goa frame — make yours 👇\n${EVENT.hashtag}`;
}
