export type Character = "femme" | "masc";
export type View = "front" | "side" | "back";
export type Expression = "normal" | "happy" | "serious" | "surprised";
export type Slot = "skin" | "hair" | "top" | "bottom" | "shoes" | "accessory";

export type Item = {
  id: string;
  name: string;
  slot: Slot;
  characters: Character[];
  rarity: "Common" | "Rare" | "Epic";
  color: string;
  accent?: string;
  description: string;
};

export type Look = Record<Slot, string> & { expression: Expression; view: View };

export const SKINS = ["#6E4034", "#9D6044", "#C98261", "#E6B08B"];
export const HAIR_COLOURS = ["#1D1520", "#4B2926", "#7A4934", "#C46B57"];

export const items: Item[] = [
  { id: "hair-bob", name: "Soft bob", slot: "hair", characters: ["femme"], rarity: "Common", color: "#211B27", description: "Clean silhouette, soft fringe." },
  { id: "hair-bantu", name: "Bantu knots", slot: "hair", characters: ["femme"], rarity: "Rare", color: "#382120", description: "A crown of confident knots." },
  { id: "hair-spikes", name: "Cloud spikes", slot: "hair", characters: ["masc"], rarity: "Common", color: "#211B27", description: "Textured and lifted." },
  { id: "hair-curls", name: "Defined curls", slot: "hair", characters: ["masc"], rarity: "Rare", color: "#4B2926", description: "Full curls, easy energy." },
  { id: "top-lilac", name: "Lavender layer", slot: "top", characters: ["femme", "masc"], rarity: "Common", color: "#A78BFA", accent: "#DCD0FF", description: "Oversized long sleeve with a bright layer." },
  { id: "top-orange", name: "Sunset hoodie", slot: "top", characters: ["femme", "masc"], rarity: "Rare", color: "#FF8A5B", accent: "#FFC09E", description: "Warm, bold and made for a night out." },
  { id: "top-mint", name: "Mint varsity", slot: "top", characters: ["femme", "masc"], rarity: "Rare", color: "#72E0C1", accent: "#DFFFF4", description: "Campus classic, remixed." },
  { id: "top-ink", name: "Ink tee", slot: "top", characters: ["femme", "masc"], rarity: "Common", color: "#37324A", accent: "#FFF4E6", description: "A sharp fitted essential." },
  { id: "bottom-cargo", name: "Cargo flow", slot: "bottom", characters: ["femme", "masc"], rarity: "Common", color: "#4B4966", accent: "#77748F", description: "Relaxed pockets, strong proportions." },
  { id: "bottom-plum", name: "Plum cargos", slot: "bottom", characters: ["femme", "masc"], rarity: "Rare", color: "#6B477B", accent: "#A78BFA", description: "A colour-pop cargo set." },
  { id: "bottom-cream", name: "Cream wide-leg", slot: "bottom", characters: ["femme", "masc"], rarity: "Epic", color: "#E9D7BE", accent: "#FFF4E6", description: "Easy drape, premium finish." },
  { id: "bottom-skirt", name: "Pleated mini", slot: "bottom", characters: ["femme"], rarity: "Rare", color: "#E7688A", accent: "#FFB6C8", description: "A playful pleat with edge." },
  { id: "shoe-runner", name: "Cloud runners", slot: "shoes", characters: ["femme", "masc"], rarity: "Common", color: "#FFF4E6", accent: "#A78BFA", description: "Chunky comfort for every block." },
  { id: "shoe-orange", name: "Tangerine kicks", slot: "shoes", characters: ["femme", "masc"], rarity: "Rare", color: "#FF8A5B", accent: "#FFF4E6", description: "The pair that gets noticed." },
  { id: "shoe-boot", name: "Platform boots", slot: "shoes", characters: ["femme", "masc"], rarity: "Epic", color: "#252334", accent: "#A78BFA", description: "Heavy sole, light work." },
  { id: "acc-none", name: "No extra", slot: "accessory", characters: ["femme", "masc"], rarity: "Common", color: "transparent", description: "Let the outfit speak." },
  { id: "acc-chain", name: "Crown chain", slot: "accessory", characters: ["femme", "masc"], rarity: "Rare", color: "#FFD36C", description: "A little shine, big confidence." },
  { id: "acc-glasses", name: "Tint shades", slot: "accessory", characters: ["femme", "masc"], rarity: "Rare", color: "#252334", accent: "#FF8A5B", description: "Keep them guessing." },
  { id: "acc-cap", name: "City cap", slot: "accessory", characters: ["femme", "masc"], rarity: "Common", color: "#FF8A5B", accent: "#FFF4E6", description: "A low-key top-off." },
  { id: "acc-bag", name: "Crossbody bag", slot: "accessory", characters: ["femme", "masc"], rarity: "Epic", color: "#A78BFA", accent: "#DCD0FF", description: "Hands free, fit complete." },
];

export const defaultLooks: Record<Character, Look> = {
  femme: { skin: "#C98261", hair: "hair-bob", top: "top-lilac", bottom: "bottom-cargo", shoes: "shoe-runner", accessory: "acc-chain", expression: "normal", view: "front" },
  masc: { skin: "#9D6044", hair: "hair-spikes", top: "top-orange", bottom: "bottom-plum", shoes: "shoe-orange", accessory: "acc-cap", expression: "normal", view: "front" },
};

export const itemFor = (id: string) => items.find((item) => item.id === id);
export const optionsFor = (slot: Slot, character: Character) => items.filter((item) => item.slot === slot && item.characters.includes(character));
