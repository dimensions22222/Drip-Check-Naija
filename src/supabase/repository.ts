import { normalizeLook, type Character, type Expression, type Item, type ItemSlot, type Look, type View } from "../avatar/catalog";
import { supabase } from "./client";
import type { CloudOutfit, Database, Json } from "./database.types";

export type OutfitPreset = { id: string; name: string; character: Character; look: Look; source: "local" | "cloud" };
export type FashionCatalogueItem = Item & {
  catalogueId: string | null;
  category: ItemSlot;
  price: number | null;
  createdAt: string | null;
  thumbnailPath: string | null;
};
export type OwnedFashionItem = FashionCatalogueItem & { acquiredAt: string; source: string };
type ProfileRow = Database["public"]["Tables"]["player_profiles"]["Row"];
type AvatarRow = Database["public"]["Tables"]["avatars"]["Row"];
type FashionRow = Database["public"]["Tables"]["fashion_items"]["Row"];

function client() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function object(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function string(value: Json | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function expression(value: string | undefined): Expression | undefined {
  switch (value) {
    case "normal":
    case "happy":
    case "serious":
    case "surprised":
      return value;
    default:
      return undefined;
  }
}

function view(value: string | undefined): View | undefined {
  switch (value) {
    case "front":
    case "side":
    case "back":
      return value;
    default:
      return undefined;
  }
}

function lookFromJson(appearance: Json, equipped: Json, character: Character): Look {
  const values = { ...object(appearance), ...object(equipped) };
  return normalizeLook({
    skin: string(values.skin),
    hair: string(values.hair),
    hairColor: string(values.hairColor),
    top: string(values.top),
    bottom: string(values.bottom),
    shoes: string(values.shoes),
    chain: string(values.chain),
    earrings: string(values.earrings),
    glasses: string(values.glasses),
    watch: string(values.watch),
    bag: string(values.bag),
    expression: expression(string(values.expression)),
    view: view(string(values.view)),
    accessory: string(values.accessory),
  }, character);
}

function outfitFromRow(row: CloudOutfit): OutfitPreset {
  const look = lookFromJson(row.appearance_config, row.equipped_items, row.character_type);
  return { id: row.id, name: row.name, character: row.character_type, look, source: "cloud" };
}

function outfitToRow(preset: OutfitPreset, userId: string): Database["public"]["Tables"]["outfits"]["Insert"] {
  const { look } = preset;
  return {
    id: preset.id,
    user_id: userId,
    name: preset.name.trim(),
    character_type: preset.character,
    equipped_items: {
      hair: look.hair,
      top: look.top,
      bottom: look.bottom,
      shoes: look.shoes,
      chain: look.chain,
      earrings: look.earrings,
      glasses: look.glasses,
      watch: look.watch,
      bag: look.bag,
    },
    appearance_config: {
      skin: look.skin,
      hairColor: look.hairColor,
      expression: look.expression,
      view: look.view,
    },
  };
}

export async function listOutfits(): Promise<OutfitPreset[]> {
  const { data, error } = await client().from("outfits").select("*").order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(outfitFromRow);
}

export async function saveOutfit(preset: OutfitPreset, userId: string): Promise<OutfitPreset> {
  const { data, error } = await client().from("outfits")
    .upsert(outfitToRow(preset, userId), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return outfitFromRow(data);
}

export async function deleteOutfit(id: string) {
  const { error } = await client().from("outfits").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await client().from("player_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function loadOrCreateProfile(userId: string): Promise<ProfileRow> {
  const existing = await loadProfile(userId);
  if (existing) return existing;
  const username = `player_${userId.replaceAll("-", "").slice(0, 13)}`;
  const { data, error } = await client().from("player_profiles")
    .insert({ user_id: userId, username }).select("*").single();
  if (!error) return data;
  if (error.code === "23505") {
    const createdByTrigger = await loadProfile(userId);
    if (createdByTrigger) return createdByTrigger;
  }
  throw new Error(error.message);
}

export async function updateProfile(userId: string, values: Pick<ProfileRow, "username" | "bio" | "country">): Promise<ProfileRow> {
  const { data, error } = await client().from("player_profiles").update(values).eq("user_id", userId).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function loadAvatar(userId: string): Promise<AvatarRow | null> {
  const { data, error } = await client().from("avatars").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveAvatar(userId: string, character: Character, looks: Record<Character, Look>): Promise<AvatarRow> {
  const { data, error } = await client().from("avatars").upsert({
    user_id: userId,
    character_type: character,
    appearance_config: { looks } as Json,
  }, { onConflict: "user_id" }).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export function looksFromAvatar(row: AvatarRow): Record<Character, Look> | null {
  const looks = object(row.appearance_config).looks;
  if (!looks || typeof looks !== "object" || Array.isArray(looks)) return null;
  const saved = looks as Record<string, Json | undefined>;
  return {
    femme: lookFromJson(saved.femme ?? {}, {}, "femme"),
    masc: lookFromJson(saved.masc ?? {}, {}, "masc"),
  };
}

export async function listActiveFashionItems(): Promise<FashionRow[]> {
  const { data, error } = await client().from("fashion_items").select("*").eq("active", true).order("category").order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function listInventory(userId: string): Promise<OwnedFashionItem[]> {
  const { data: inventory, error: inventoryError } = await client()
    .from("player_inventory").select("fashion_item_id, acquired_at, source").eq("user_id", userId).order("acquired_at", { ascending: false });
  if (inventoryError) throw new Error(inventoryError.message);
  if (!inventory.length) return [];
  const { data: items, error: itemsError } = await client().from("fashion_items")
    .select("*").in("id", inventory.map((row) => row.fashion_item_id));
  if (itemsError) throw new Error(itemsError.message);
  const itemsById = new Map(items.flatMap((row) => {
    const item = mapFashionItem(row);
    return item ? [[row.id, item] as const] : [];
  }));
  return inventory.flatMap((row) => {
    const item = itemsById.get(row.fashion_item_id);
    return item ? [{ ...item, acquiredAt: row.acquired_at, source: row.source }] : [];
  });
}

export type ActiveFashionItem = FashionCatalogueItem;

export function mapFashionItem(row: FashionRow): FashionCatalogueItem | null {
  const metadata = object(row.metadata);
  const slots = ["hair", "top", "bottom", "shoes", "chain", "earrings", "glasses", "watch", "bag"] as const;
  const slot = slots.find((value) => value === row.category);
  if (!slot || !["Common", "Rare", "Epic"].includes(row.rarity) || typeof metadata.color !== "string") return null;
  const characters = metadata.characters;
  if (!Array.isArray(characters)) return null;
  const compatibleCharacters = characters.filter((value): value is Character => value === "femme" || value === "masc");
  if (!compatibleCharacters.length) return null;
  return {
    id: row.slug,
    catalogueId: row.id,
    name: row.name,
    slot,
    category: slot,
    characters: compatibleCharacters,
    rarity: row.rarity as Item["rarity"],
    color: metadata.color,
    accent: typeof metadata.accent === "string" ? metadata.accent : undefined,
    description: typeof metadata.description === "string" ? metadata.description : "",
    price: row.price,
    createdAt: row.created_at,
    thumbnailPath: row.thumbnail_path,
  };
}

export type PurchaseFashionItem = (fashionItemId: string) => Promise<void>;
export const securePurchasesAvailable = false;
export const purchaseFashionItem: PurchaseFashionItem = async (_fashionItemId) => {
  throw new Error("Purchases are disabled until a verified server-side purchase endpoint is configured.");
};

