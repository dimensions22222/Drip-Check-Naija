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
export type PublicPlayer = Database["public"]["Views"]["public_player_profiles"]["Row"];
export type PublicShowcaseRow = Database["public"]["Views"]["public_outfit_showcases"]["Row"];
export type PublicShowcase = {
  id: string;
  playerPublicId: string;
  username: string;
  title: string;
  character: Character;
  look: Look;
  publishedAt: string;
  likeCount: number;
  viewerLiked: boolean;
};
export type PlayerConnection = Database["public"]["Functions"]["get_player_connections"]["Returns"][number];
export type ProgressionDashboard = {
  profile: { level: number; xp: number; levelXp: number; nextLevelXp: number };
  streak: { current_streak: number; longest_streak: number; last_login_date: string | null };
  missions: Array<{ id: string; code: string; scope: "daily" | "weekly"; title: string; description: string; target: number; xpReward: number; progress: number; completed: boolean; completedAt: string | null; claimedAt: string | null; periodKey: string }>;
  achievements: Array<{ code: string; category: string; name: string; description: string; icon: string; rarity: string | null; unlockedAt: string | null; featured: boolean }>;
  events: Array<{ eventType: string; xp: number; createdAt: string }>;
  leaderboard: Array<{ username: string; level: number; xp: number; publicId: string }>;
  rewards: unknown[];
};
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

export async function listPublicPlayers(search = "", offset = 0, limit = 24): Promise<PublicPlayer[]> {
  const term = search.trim().replace(/[\\%_]/g, "\\$&");
  let query = client().from("public_player_profiles").select("*");
  if (term) query = query.ilike("username", `%${term}%`);
  const { data, error } = await query
    .order("follower_count", { ascending: false })
    .order("username", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data;
}

export async function loadPublicProfile(publicId: string): Promise<PublicPlayer | null> {
  const { data, error } = await client().from("public_player_profiles")
    .select("*").eq("public_id", publicId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export function publicAvatarFromProfile(profile: PublicPlayer): { character: Character; look: Look } | null {
  const character = profile.avatar_character_type;
  const config = profile.avatar_appearance_config;
  if (!character || !config) return null;
  return { character, look: lookFromJson(config, {}, character) };
}

export async function listPublicShowcases(playerPublicId?: string, offset = 0, limit = 12): Promise<PublicShowcase[]> {
  let query = client().from("public_outfit_showcases").select("*");
  if (playerPublicId) query = query.eq("player_public_id", playerPublicId);
  const { data, error } = await query
    .order("like_count", { ascending: false })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data.map(showcaseFromRow);
}

function showcaseFromRow(row: PublicShowcaseRow): PublicShowcase {
  return {
    id: row.id,
    playerPublicId: row.player_public_id,
    username: row.username,
    title: row.title,
    character: row.character_type,
    look: lookFromJson(row.appearance_config, row.equipped_items, row.character_type),
    publishedAt: row.published_at,
    likeCount: row.like_count,
    viewerLiked: row.viewer_liked,
  };
}

export async function getPlayerConnections(publicId: string, type: "followers" | "following"): Promise<PlayerConnection[]> {
  const { data, error } = await client().rpc("get_player_connections", {
    target_public_id: publicId,
    connection_type: type,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function setPlayerFollow(publicId: string, follow: boolean): Promise<void> {
  const { error } = await client().rpc("set_player_follow", {
    target_public_id: publicId,
    should_follow: follow,
  });
  if (error) throw new Error(error.message);
  if (follow) await recordProgressionActivity("player_followed", publicId);
}

export async function setShowcaseLike(showcaseId: string, liked: boolean): Promise<void> {
  const { error } = await client().rpc("set_outfit_showcase_like", {
    target_showcase_id: showcaseId,
    should_like: liked,
  });
  if (error) throw new Error(error.message);
  if (liked) await recordProgressionActivity("outfit_liked", showcaseId);
}

export async function publishShowcase(outfitId: string, title: string): Promise<string> {
  const { data, error } = await client().rpc("publish_outfit_showcase", {
    target_outfit_id: outfitId,
    showcase_title: title,
  });
  if (error) throw new Error(error.message);
  await recordProgressionActivity("showcase_published", data);
  return data;
}

export async function removeShowcase(showcaseId: string): Promise<void> {
  const { error } = await client().rpc("remove_outfit_showcase", {
    target_showcase_id: showcaseId,
  });
  if (error) throw new Error(error.message);
}

export async function getProgressionDashboard(): Promise<ProgressionDashboard> {
  const { data, error } = await client().rpc("get_progression_dashboard");
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The progression dashboard response was invalid.");
  }
  return data as unknown as ProgressionDashboard;
}

export async function recordProgressionActivity(activityType: string, referenceId = ""): Promise<ProgressionDashboard | null> {
  const { data, error } = await client().rpc("record_progression_activity", {
    p_activity_type: activityType,
    p_reference_id: referenceId,
  });
  if (error) {
    if (activityType === "outfit_saved") return null;
    throw new Error(error.message);
  }
  return data as unknown as ProgressionDashboard;
}

export async function claimMissionReward(missionId: string): Promise<ProgressionDashboard> {
  const { data, error } = await client().rpc("claim_mission_reward", { p_mission_id: missionId });
  if (error) throw new Error(error.message);
  return data as unknown as ProgressionDashboard;
}

export async function saveOutfit(preset: OutfitPreset, userId: string): Promise<OutfitPreset> {
  const { data, error } = await client().from("outfits")
    .upsert(outfitToRow(preset, userId), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await recordProgressionActivity("outfit_saved", data.id);
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

export async function setAvatarPublicDisplay(publicDisplay: boolean): Promise<void> {
  const { error } = await client().rpc("set_avatar_public_display", {
    should_be_public: publicDisplay,
  });
  if (error) throw new Error(error.message);
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

