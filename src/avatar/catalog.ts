export type Character = "femme" | "masc";
export type View = "front" | "side" | "back";
export type Expression = "normal" | "happy" | "serious" | "surprised";
export type Slot = "skin" | "hair" | "hairColor" | "expression" | "top" | "bottom" | "shoes" | "chain" | "earrings" | "glasses" | "watch" | "bag";
export type ItemSlot = Exclude<Slot, "skin" | "hairColor" | "expression">;

export type Item = {
  id: string;
  name: string;
  slot: ItemSlot;
  characters: Character[];
  rarity: "Common" | "Rare" | "Epic";
  color: string;
  accent?: string;
  description: string;
};

export type Look = {
  skin: string;
  hair: string;
  hairColor: string;
  top: string;
  bottom: string;
  shoes: string;
  chain: string;
  earrings: string;
  glasses: string;
  watch: string;
  bag: string;
  expression: Expression;
  view: View;
};

export const SKINS = ["#6E4034", "#9D6044", "#C98261", "#E6B08B", "#F2C9A6"];
export const HAIR_COLOURS = ["#1D1520", "#4B2926", "#7A4934", "#C46B57", "#A78BFA", "#FF8A5B"];
const both: Character[] = ["femme", "masc"];
const make = (id: string, name: string, slot: ItemSlot, color: string, description: string, rarity: Item["rarity"] = "Common", accent?: string, characters = both): Item => ({ id, name, slot, color, description, rarity, accent, characters });

export const items: Item[] = [
  make("hair-bob", "Soft bob", "hair", "#211B27", "A clean silhouette with a soft fringe.", "Common", undefined, ["femme"]),
  make("hair-bantu", "Bantu knots", "hair", "#382120", "A sculptural crown of confident knots.", "Rare", undefined, ["femme"]),
  make("hair-braids", "Long braids", "hair", "#211B27", "Long protective braids with a polished finish.", "Epic", undefined, ["femme"]),
  make("hair-spikes", "Cloud spikes", "hair", "#211B27", "Textured and lifted with easy energy.", "Common", undefined, ["masc"]),
  make("hair-curls", "Defined curls", "hair", "#4B2926", "Full curls with a soft, rounded shape.", "Rare", undefined, ["masc"]),
  make("hair-fade", "Fresh fade", "hair", "#211B27", "A neat low fade with a sharp hairline.", "Epic", undefined, ["masc"]),
  make("top-lilac", "Lavender tee", "top", "#A78BFA", "An easy crew-neck tee in signature lavender.", "Common", "#DCD0FF"),
  make("top-orange", "Sunset hoodie", "top", "#FF8A5B", "A relaxed hoodie made for a night out.", "Rare", "#FFC09E"),
  make("top-mint", "Mint varsity", "top", "#72E0C1", "A varsity jacket with a crisp contrast trim.", "Rare", "#DFFFF4"),
  make("top-ink", "Ink jacket", "top", "#37324A", "A tailored street jacket with clean lines.", "Common", "#FFF4E6"),
  make("top-cream", "Cream tee", "top", "#FFF4E6", "A soft neutral T-shirt for everyday rotation.", "Common", "#A78BFA"),
  make("top-plum-hoodie", "Plum hoodie", "top", "#6B477B", "A roomy pullover with a deep-plum finish.", "Epic", "#A78BFA"),
  make("bottom-cargo", "Cargo flow", "bottom", "#4B4966", "Relaxed cargos with roomy utility pockets.", "Common", "#77748F"),
  make("bottom-plum", "Plum cargos", "bottom", "#6B477B", "Utility pockets meet a colour-pop finish.", "Rare", "#A78BFA"),
  make("bottom-cream", "Cream wide-leg", "bottom", "#E9D7BE", "Easy drape with a premium neutral finish.", "Epic", "#FFF4E6"),
  make("bottom-skirt", "Pleated mini", "bottom", "#E7688A", "A playful pleat with a little edge.", "Rare", "#FFB6C8", ["femme"]),
  make("bottom-shorts", "City shorts", "bottom", "#424056", "Easy knee-length shorts for warm days.", "Common", "#A78BFA"),
  make("shoe-runner", "Cloud runners", "shoes", "#FFF4E6", "Chunky comfort for every block.", "Common", "#A78BFA"),
  make("shoe-orange", "Tangerine kicks", "shoes", "#FF8A5B", "The pair that gets noticed.", "Rare", "#FFF4E6"),
  make("shoe-boot", "Platform boots", "shoes", "#252334", "A sturdy platform sole with a sharp finish.", "Epic", "#A78BFA"),
  make("chain-none", "No chain", "chain", "transparent", "Keep the neckline clean."),
  make("chain-gold", "Gold link chain", "chain", "#FFD36C", "A little shine with big confidence.", "Rare"),
  make("chain-silver", "Silver pendant", "chain", "#D9DCE8", "A clean silver accent for any fit.", "Common"),
  make("earrings-none", "No earrings", "earrings", "transparent", "Keep it simple."),
  make("earrings-hoops", "Gold hoops", "earrings", "#FFD36C", "Small hoops, bright energy.", "Rare"),
  make("earrings-studs", "Silver studs", "earrings", "#D9DCE8", "A quiet glint for every day.", "Common"),
  make("glasses-none", "No glasses", "glasses", "transparent", "Let them see your expression."),
  make("glasses-shades", "Tint shades", "glasses", "#252334", "Keep them guessing.", "Rare", "#FF8A5B"),
  make("glasses-round", "Round frames", "glasses", "#FFD36C", "A bright frame with a playful edge.", "Common"),
  make("watch-none", "No watch", "watch", "transparent", "No extra wrist detail."),
  make("watch-digital", "Digital watch", "watch", "#252334", "A compact everyday essential.", "Common", "#72E0C1"),
  make("watch-gold", "Gold watch", "watch", "#FFD36C", "A refined flash at the wrist.", "Epic", "#FFF4E6"),
  make("bag-none", "No bag", "bag", "transparent", "Nothing to carry but the look."),
  make("bag-crossbody", "Crossbody bag", "bag", "#A78BFA", "Hands-free utility with a colour pop.", "Epic", "#DCD0FF"),
  make("bag-tangerine", "Tangerine mini bag", "bag", "#FF8A5B", "A compact statement piece.", "Rare", "#FFF4E6"),
];

export const defaultLooks: Record<Character, Look> = {
  femme: { skin: "#C98261", hair: "hair-bob", hairColor: "#211B27", top: "top-lilac", bottom: "bottom-cargo", shoes: "shoe-runner", chain: "chain-gold", earrings: "earrings-hoops", glasses: "glasses-none", watch: "watch-none", bag: "bag-none", expression: "normal", view: "front" },
  masc: { skin: "#9D6044", hair: "hair-spikes", hairColor: "#211B27", top: "top-orange", bottom: "bottom-plum", shoes: "shoe-orange", chain: "chain-none", earrings: "earrings-none", glasses: "glasses-none", watch: "watch-digital", bag: "bag-none", expression: "normal", view: "front" },
};

export const itemFor = (id: string) => items.find((item) => item.id === id);
export const optionsFor = (slot: ItemSlot, character: Character) => items.filter((item) => item.slot === slot && item.characters.includes(character));
