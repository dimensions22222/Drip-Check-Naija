import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import AvatarRenderer from "./avatar/AvatarRenderer";
import Account from "./components/Account";
import FashionMall from "./components/FashionMall";
import DripCity from "./components/DripCity";
import PlayerInventory from "./components/PlayerInventory";
import { defaultLooks, HAIR_COLOURS, itemFor, items as studioItems, normalizeLook, optionsFor, SKINS, type Character, type Expression, type ItemSlot, type Look, type Slot, type View } from "./avatar/catalog";
import { supabase, supabaseConfigError } from "./supabase/client";
import { deleteOutfit, listActiveFashionItems, listInventory, listOutfits, loadAvatar as loadCloudAvatar, loadOrCreateProfile, looksFromAvatar, mapFashionItem, saveAvatar as saveCloudAvatar, saveOutfit, setAvatarPublicDisplay, updateProfile, type ActiveFashionItem, type FashionCatalogueItem, type OutfitPreset, type OwnedFashionItem } from "./supabase/repository";
import type { Database } from "./supabase/database.types";

type Page = "home" | "studio" | "mall" | "inventory" | "battles" | "wardrobe" | "profile" | "city" | "account";
type Preset = OutfitPreset;
type Store = { looks: Record<Character, Look>; presets: Preset[]; handle: string };
type ProfileRow = Database["public"]["Tables"]["player_profiles"]["Row"];
type InventoryItem = OwnedFashionItem;
type RemoteState = "idle" | "loading" | "ready" | "error";
const key = "drip-check-naija-demo-v2";
const empty: Store = { looks: structuredClone(defaultLooks), presets: [], handle: "AyoDrips" };
const demoCatalogue: FashionCatalogueItem[] = studioItems.map((item) => ({
  ...item,
  catalogueId: null,
  category: item.slot,
  price: null,
  createdAt: null,
  thumbnailPath: null,
}));
const labels: Record<Slot, string> = { skin: "Skin tone", hair: "Hairstyle", hairColor: "Hair colour", expression: "Expression", top: "Tops", bottom: "Bottoms", shoes: "Sneakers", chain: "Chains", earrings: "Earrings", glasses: "Glasses", watch: "Watches", bag: "Bags" };
const slots = Object.keys(labels) as Slot[];
const nav: [Page, string, string][] = [["home", "⌂", "Home"], ["studio", "✦", "Studio"], ["mall", "◇", "Fashion Mall"], ["inventory", "▦", "Inventory"], ["battles", "⚔", "Battles"], ["wardrobe", "▣", "Wardrobe"], ["profile", "◎", "Profile"], ["city", "◈", "Drip City"]];
const expressions: Expression[] = ["normal", "happy", "serious", "surprised"];
const isItemSlot = (slot: Slot): slot is ItemSlot => !["skin", "hairColor", "expression"].includes(slot);
function getStore(): Store {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "{}") as Partial<Store>;
    const savedLooks = stored.looks as Partial<Record<Character, Partial<Look> & { accessory?: string }>> | undefined;
    return {
      ...empty,
      ...stored,
      looks: {
        femme: normalizeLook(savedLooks?.femme, "femme"),
        masc: normalizeLook(savedLooks?.masc, "masc"),
      },
      presets: Array.isArray(stored.presets) ? stored.presets.filter((preset) => preset && (preset.character === "femme" || preset.character === "masc")).map((preset) => ({
        ...preset,
        source: "local" as const,
        look: normalizeLook(preset.look as Partial<Look> & { accessory?: string }, preset.character),
      })) : [],
    };
  } catch {
    return structuredClone(empty);
  }
}
function Action({ children, quiet, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { quiet?: boolean }) { return <button {...props} className={quiet ? "button quiet" : "button"}>{children}</button>; }
function Title({ eyebrow, heading, copy }: { eyebrow: string; heading: string; copy: string }) { return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{heading}</h1><p>{copy}</p></div><span className="player-chip">✦ AyoDrips</span></div>; }

export default function App() {
  const [store, setStore] = useState<Store>(getStore);
  const [page, setPage] = useState<Page>("home");
  const [character, setCharacter] = useState<Character>("femme");
  const [slot, setSlot] = useState<Slot>("top");
  const [notice, setNotice] = useState("");
  const [saveName, setSaveName] = useState("");
  const [entered, setEntered] = useState(false);
  const [voted, setVoted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [cloudOutfits, setCloudOutfits] = useState<Preset[]>([]);
  const [cloudOutfitsUserId, setCloudOutfitsUserId] = useState<string | null>(null);
  const [accountDataUserId, setAccountDataUserId] = useState<string | null>(null);
  const [cloudOutfitState, setCloudOutfitState] = useState<RemoteState>("idle");
  const [cloudOutfitError, setCloudOutfitError] = useState("");
  const [busyOutfitIds, setBusyOutfitIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileState, setProfileState] = useState<RemoteState>("idle");
  const [profileError, setProfileError] = useState("");
  const [avatarCandidate, setAvatarCandidate] = useState<Record<Character, Look> | null>(null);
  const [avatarPublic, setAvatarPublic] = useState(false);
  const [avatarState, setAvatarState] = useState<RemoteState>("idle");
  const [avatarError, setAvatarError] = useState("");
  const [catalog, setCatalog] = useState<ActiveFashionItem[]>([]);
  const [catalogState, setCatalogState] = useState<RemoteState>("idle");
  const [catalogError, setCatalogError] = useState("");
  const [inventory, setInventory] = useState<OwnedFashionItem[]>([]);
  const [inventoryState, setInventoryState] = useState<RemoteState>("idle");
  const [inventoryError, setInventoryError] = useState("");
  const currentUserId = session?.user.id ?? null;
  const currentUserRef = useRef<string | null>(null);
  const look = store.looks[character];
  const update = (next: Look) => setStore((data) => ({ ...data, looks: { ...data.looks, [character]: next } }));
  useEffect(() => localStorage.setItem(key, JSON.stringify(store)), [store]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 2600); return () => window.clearTimeout(timer); }, [notice]);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let authEvents = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEvents += 1;
      currentUserRef.current = nextSession?.user.id ?? null;
      setSession(nextSession);
      setAuthLoading(false);
      setAuthError("");
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || authEvents > 0) return;
      if (error) setAuthError(error.message);
      currentUserRef.current = data.session?.user.id ?? null;
      setSession(data.session);
      setAuthLoading(false);
    }).catch((error: unknown) => {
      if (!active || authEvents > 0) return;
      setAuthError(error instanceof Error ? error.message : "Could not restore the saved session.");
      setAuthLoading(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    setCatalogState("loading");
    void listActiveFashionItems().then((rows) => {
      if (!active) return;
      setCatalog(rows.map(mapFashionItem).filter((item): item is ActiveFashionItem => item !== null));
      setCatalogState("ready");
      setCatalogError("");
    }).catch((error: unknown) => {
      if (!active) return;
      setCatalogError(error instanceof Error ? error.message : "Could not load the fashion catalogue.");
      setCatalogState("error");
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    currentUserRef.current = currentUserId;
    setAccountDataUserId(null);
    setCloudOutfitsUserId(null);
    setCloudOutfits([]);
    setCloudOutfitError("");
    setProfile(null);
    setAvatarCandidate(null);
    setAvatarPublic(false);
    setInventory([]);
    if (!currentUserId || !supabase) {
      setCloudOutfitState("idle");
      setProfileState("idle");
      setAvatarState("idle");
      setInventoryState("idle");
      return;
    }

    let active = true;
    setCloudOutfitState("loading");
    setProfileState("loading");
    setAvatarState("loading");
    setInventoryState("loading");
    void Promise.allSettled([
      listOutfits(),
      loadOrCreateProfile(currentUserId),
      loadCloudAvatar(currentUserId),
      listInventory(currentUserId),
    ]).then(([outfitsResult, profileResult, avatarResult, inventoryResult]) => {
      if (!active || currentUserRef.current !== currentUserId) return;
      if (outfitsResult.status === "fulfilled") {
        setCloudOutfits(outfitsResult.value);
        setCloudOutfitState("ready");
      } else {
        setCloudOutfitError(outfitsResult.reason instanceof Error ? outfitsResult.reason.message : "Could not load cloud outfits.");
        setCloudOutfitState("error");
      }
      setCloudOutfitsUserId(currentUserId);
      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value);
        setProfileState("ready");
      } else {
        setProfileError(profileResult.reason instanceof Error ? profileResult.reason.message : "Could not load your profile.");
        setProfileState("error");
      }
      if (avatarResult.status === "fulfilled") {
        setAvatarCandidate(avatarResult.value ? looksFromAvatar(avatarResult.value) : null);
        setAvatarPublic(avatarResult.value?.public_display ?? false);
        setAvatarState("ready");
      } else {
        setAvatarPublic(false);
        setAvatarError(avatarResult.reason instanceof Error ? avatarResult.reason.message : "Could not load your avatar.");
        setAvatarState("error");
      }
      if (inventoryResult.status === "fulfilled") {
        setInventory(inventoryResult.value);
        setInventoryState("ready");
      } else {
        setInventoryError(inventoryResult.reason instanceof Error ? inventoryResult.reason.message : "Could not load your inventory.");
        setInventoryState("error");
      }
      setAccountDataUserId(currentUserId);
    });
    return () => { active = false; };
  }, [currentUserId]);
  const signIn = async (email: string, password: string) => {
    if (!supabase) return;
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAuthMessage("You are signed in.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setAuthBusy(false);
    }
  };
  const signUp = async (email: string, password: string) => {
    if (!supabase) return;
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      setAuthMessage(data.session ? "Account created and signed in." : "Check your email to confirm your account, then sign in.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Account creation failed.");
    } finally {
      setAuthBusy(false);
    }
  };
  const signOut = async () => {
    if (!supabase) return;
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthMessage("Signed out. Your local outfits are still available.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign-out failed.");
    } finally {
      setAuthBusy(false);
    }
  };
  const setOutfitBusy = (id: string, busy: boolean) => setBusyOutfitIds((ids) => busy ? (ids.includes(id) ? ids : [...ids, id]) : ids.filter((value) => value !== id));
  const save = () => {
    const count = store.presets.filter((preset) => preset.character === character).length;
    const preset: Preset = { id: crypto.randomUUID(), name: saveName.trim() || "Look " + (count + 1), character, look: structuredClone(look), source: "local" };
    setStore((data) => ({ ...data, presets: [preset, ...data.presets] }));
    setSaveName("");
    if (supabase && currentUserId && accountDataReady) {
      setOutfitBusy(preset.id, true);
      void saveOutfit(preset, currentUserId).then((saved) => {
        if (currentUserRef.current !== currentUserId) return;
        setCloudOutfits((savedPresets) => [saved, ...savedPresets.filter((item) => item.id !== saved.id)]);
        setCloudOutfitState("ready");
        setNotice("Outfit saved locally and to your cloud wardrobe.");
      }).catch((error: unknown) => {
        if (currentUserRef.current !== currentUserId) return;
        setCloudOutfitError(error instanceof Error ? error.message : "Cloud save failed.");
        setCloudOutfitState("error");
        setNotice("Saved locally; cloud sync failed. Retry from Wardrobe.");
      }).finally(() => setOutfitBusy(preset.id, false));
    } else if (currentUserId && supabase) {
      setNotice("Outfit saved locally. Cloud sync will be available when account data finishes loading.");
    } else {
      setNotice("Outfit saved locally to Wardrobe.");
    }
  };
  const randomize = () => {
    const next: Look = { ...look, skin: SKINS[Math.floor(Math.random() * SKINS.length)], hairColor: HAIR_COLOURS[Math.floor(Math.random() * HAIR_COLOURS.length)], expression: expressions[Math.floor(Math.random() * expressions.length)] };
    (["hair", "top", "bottom", "shoes", "chain", "earrings", "glasses", "watch", "bag"] as ItemSlot[]).forEach((part) => {
      const choices = optionsFor(part, character);
      next[part] = choices[Math.floor(Math.random() * choices.length)].id;
    });
    update(next); setNotice("Fresh fit, no stress.");
  };
  const syncLocalOutfit = (preset: Preset) => {
    if (!supabase || !currentUserId || !accountDataReady) return;
    setOutfitBusy(preset.id, true);
    void saveOutfit(preset, currentUserId).then((saved) => {
      if (currentUserRef.current !== currentUserId) return;
      setCloudOutfits((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
      setCloudOutfitState("ready"); setCloudOutfitError(""); setNotice("Local outfit added to your cloud wardrobe.");
    }).catch((error: unknown) => {
      if (currentUserRef.current !== currentUserId) return;
      setCloudOutfitError(error instanceof Error ? error.message : "Could not sync this outfit.");
      setCloudOutfitState("error"); setNotice("Local outfit kept. Cloud sync failed.");
    }).finally(() => setOutfitBusy(preset.id, false));
  };
  const remove = (preset: Preset) => {
    if (preset.source === "cloud" && supabase && currentUserId) {
      setOutfitBusy(preset.id, true);
      void deleteOutfit(preset.id).then(() => {
        if (currentUserRef.current !== currentUserId) return;
        setCloudOutfits((items) => items.filter((item) => item.id !== preset.id));
        setStore((data) => ({ ...data, presets: data.presets.filter((item) => item.id !== preset.id) }));
        setNotice("Outfit deleted from your wardrobe.");
      }).catch((error: unknown) => {
        if (currentUserRef.current !== currentUserId) return;
        setCloudOutfitError(error instanceof Error ? error.message : "Could not delete the cloud outfit.");
        setCloudOutfitState("error"); setNotice("Cloud outfit was not deleted.");
      }).finally(() => setOutfitBusy(preset.id, false));
      return;
    }
    setStore((data) => ({ ...data, presets: data.presets.filter((item) => item.id !== preset.id) }));
    setNotice("Local outfit deleted.");
  };
  const rename = (preset: Preset, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (preset.source === "cloud" && supabase && currentUserId) {
      const renamed = { ...preset, name: trimmed };
      setOutfitBusy(preset.id, true);
      void saveOutfit(renamed, currentUserId).then((saved) => {
        if (currentUserRef.current !== currentUserId) return;
        setCloudOutfits((items) => items.map((item) => item.id === saved.id ? saved : item));
        setStore((data) => ({ ...data, presets: data.presets.map((item) => item.id === saved.id ? { ...item, name: saved.name } : item) }));
        setCloudOutfitState("ready"); setCloudOutfitError("");
        setNotice("Cloud outfit renamed.");
      }).catch((error: unknown) => {
        if (currentUserRef.current !== currentUserId) return;
        setCloudOutfitError(error instanceof Error ? error.message : "Could not rename the cloud outfit.");
        setCloudOutfitState("error"); setNotice("Outfit was not renamed in the cloud.");
      }).finally(() => setOutfitBusy(preset.id, false));
      return;
    }
    setStore((data) => ({ ...data, presets: data.presets.map((item) => item.id === preset.id ? { ...item, name: trimmed } : item) }));
    setNotice("Local outfit renamed.");
  };
  const updatePreset = (preset: Preset) => {
    const updated = { ...preset, look: structuredClone(store.looks[preset.character]) };
    if (preset.source === "cloud" && supabase && currentUserId && accountDataReady) {
      setOutfitBusy(preset.id, true);
      void saveOutfit(updated, currentUserId).then((saved) => {
        if (currentUserRef.current !== currentUserId) return;
        setCloudOutfits((items) => items.map((item) => item.id === saved.id ? saved : item));
        setStore((data) => ({ ...data, presets: data.presets.map((item) => item.id === saved.id ? { ...item, look: saved.look } : item) }));
        setCloudOutfitState("ready"); setCloudOutfitError("");
        setNotice("Cloud outfit updated from Studio.");
      }).catch((error: unknown) => {
        if (currentUserRef.current !== currentUserId) return;
        setCloudOutfitError(error instanceof Error ? error.message : "Could not update the cloud outfit.");
        setCloudOutfitState("error"); setNotice("Outfit update failed; the saved version is unchanged.");
      }).finally(() => setOutfitBusy(preset.id, false));
      return;
    }
    if (preset.source === "local") {
      setStore((data) => ({ ...data, presets: data.presets.map((item) => item.id === preset.id ? { ...item, look: updated.look } : item) }));
      setNotice("Local outfit updated from Studio.");
    }
  };
  const load = (preset: Preset) => { setCharacter(preset.character); setStore((data) => ({ ...data, looks: { ...data.looks, [preset.character]: normalizeLook(preset.look, preset.character) } })); setPage("studio"); setNotice("Outfit loaded."); };
  const saveProfile = async (values: Pick<ProfileRow, "username" | "bio" | "country">) => {
    if (!currentUserId) return;
    try {
      const saved = await updateProfile(currentUserId, values);
      if (currentUserRef.current !== currentUserId) return;
      setProfile(saved); setProfileState("ready"); setProfileError(""); setNotice("Profile saved.");
    } catch (error) {
      if (currentUserRef.current !== currentUserId) return;
      setProfileError(error instanceof Error ? error.message : "Profile save failed.");
      setNotice("Profile was not saved.");
    }
  };
  const saveAvatar = async () => {
    if (!currentUserId) return;
    try {
      const saved = await saveCloudAvatar(currentUserId, character, store.looks);
      if (currentUserRef.current !== currentUserId) return;
      setAvatarCandidate(looksFromAvatar(saved)); setAvatarState("ready"); setAvatarError(""); setNotice("Studio looks saved to your cloud avatar.");
      setAvatarPublic(saved.public_display);
    } catch (error) {
      if (currentUserRef.current !== currentUserId) return;
      setAvatarError(error instanceof Error ? error.message : "Avatar save failed.");
      setAvatarState("error"); setNotice("Avatar was not saved to the cloud.");
    }
  };
  const setAvatarVisibility = async (publicDisplay: boolean) => {
    if (!currentUserId) throw new Error("Sign in to change avatar visibility.");
    const requestedUserId = currentUserId;
    await setAvatarPublicDisplay(publicDisplay);
    if (currentUserRef.current !== requestedUserId) return;
    setAvatarPublic(publicDisplay);
  };
  const applyAvatar = () => {
    if (!avatarCandidate) return;
    setStore((data) => ({ ...data, looks: structuredClone(avatarCandidate) }));
    setNotice("Cloud avatar applied to the local Studio.");
  };
  const refreshCloudOutfits = () => {
    if (!currentUserId) return;
    const requestedUserId = currentUserId;
    setCloudOutfitState("loading"); setCloudOutfitError("");
    void listOutfits().then((items) => {
      if (currentUserRef.current !== requestedUserId) return;
      setCloudOutfits(items); setCloudOutfitState("ready"); setCloudOutfitError(""); setCloudOutfitsUserId(requestedUserId);
    }).catch((error: unknown) => {
      if (currentUserRef.current !== requestedUserId) return;
      setCloudOutfitError(error instanceof Error ? error.message : "Could not load cloud outfits.");
      setCloudOutfitState("error"); setCloudOutfitsUserId(requestedUserId);
    });
  };
  const retryProfile = () => {
    if (!currentUserId) return;
    const requestedUserId = currentUserId;
    setProfileState("loading");
    void loadOrCreateProfile(requestedUserId).then((value) => {
      if (currentUserRef.current !== requestedUserId) return;
      setProfile(value); setProfileState("ready"); setProfileError("");
    }).catch((error: unknown) => {
      if (currentUserRef.current !== requestedUserId) return;
      setProfileError(error instanceof Error ? error.message : "Could not load your profile.");
      setProfileState("error");
    });
  };
  const retryAvatar = () => {
    if (!currentUserId) return;
    const requestedUserId = currentUserId;
    setAvatarState("loading");
    void loadCloudAvatar(requestedUserId).then((value) => {
      if (currentUserRef.current !== requestedUserId) return;
      setAvatarCandidate(value ? looksFromAvatar(value) : null); setAvatarState("ready"); setAvatarError("");
      setAvatarPublic(value?.public_display ?? false);
    }).catch((error: unknown) => {
      if (currentUserRef.current !== requestedUserId) return;
      setAvatarError(error instanceof Error ? error.message : "Could not load your avatar.");
      setAvatarState("error");
    });
  };
  const retryCatalog = () => {
    if (!supabase) return;
    setCatalogState("loading");
    void listActiveFashionItems().then((rows) => {
      setCatalog(rows.map(mapFashionItem).filter((item): item is ActiveFashionItem => item !== null));
      setCatalogState("ready"); setCatalogError("");
    }).catch((error: unknown) => {
      setCatalogError(error instanceof Error ? error.message : "Could not load the fashion catalogue.");
      setCatalogState("error");
    });
  };
  const retryInventory = () => {
    if (!currentUserId) return;
    const requestedUserId = currentUserId;
    setInventoryState("loading");
    void listInventory(requestedUserId).then((value) => {
      if (currentUserRef.current !== requestedUserId) return;
      setInventory(value); setInventoryState("ready"); setInventoryError("");
    }).catch((error: unknown) => {
      if (currentUserRef.current !== requestedUserId) return;
      setInventoryError(error instanceof Error ? error.message : "Could not load your inventory.");
      setInventoryState("error");
    });
  };
  const equipInventoryItem = (item: OwnedFashionItem) => {
    const verifiedItem = accountDataReady && inventoryState === "ready" &&
      inventory.some((owned) => owned.catalogueId === item.catalogueId && owned.id === item.id);
    if (!verifiedItem || !item.characters.includes(character)) {
      setNotice("Could not verify ownership or avatar compatibility. Refresh your inventory and try again.");
      return;
    }
    update({ ...store.looks[character], [item.slot]: item.id });
    setNotice(`${item.name} equipped in your Studio look.`);
  };
  const unequipInventoryItem = (item: OwnedFashionItem) => {
    const verifiedItem = accountDataReady && inventoryState === "ready" &&
      inventory.some((owned) => owned.catalogueId === item.catalogueId && owned.id === item.id);
    if (!verifiedItem || !item.characters.includes(character) || store.looks[character][item.slot] !== item.id) {
      setNotice("Could not verify the equipped item. Refresh your inventory and try again.");
      return;
    }
    const starter = defaultLooks[character][item.slot];
    const alternative = starter !== item.id
      ? starter
      : optionsFor(item.slot, character).find((option) => option.id !== item.id)?.id;
    if (!alternative) {
      setNotice("There is no alternate Studio item for this category.");
      return;
    }
    update({ ...store.looks[character], [item.slot]: alternative });
    setNotice(`${item.name} unequipped. A Studio starter style is now in that slot.`);
  };
  const accountDataReady = Boolean(currentUserId && accountDataUserId === currentUserId);
  const visibleCloudOutfits = currentUserId && cloudOutfitsUserId === currentUserId ? cloudOutfits : [];
  const visiblePresets = [...visibleCloudOutfits, ...store.presets.filter((preset) => !visibleCloudOutfits.some((remote) => remote.id === preset.id))];
  const visibleCloudOutfitState = currentUserId && cloudOutfitsUserId !== currentUserId ? "loading" : cloudOutfitState;
  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setPage("home")}><b>DC</b><span>DRIP CHECK <strong>NAIJA</strong><small>YOUR STYLE. YOUR CITY. YOUR CROWN.</small></span></button><div className="status"><i/> {session ? "CLOUD ACCOUNT" : "DEMO MODE"} <b>WALLET OFFLINE</b><button className="account-link" onClick={() => setPage("account")}>{session ? "ACCOUNT" : "SIGN IN"}</button></div></header>
    <div className="layout"><aside className="sidebar"><span className="nav-label">YOUR WORLD</span>{nav.map((link) => <button key={link[0]} className={page === link[0] ? "active" : ""} aria-current={page === link[0] ? "page" : undefined} onClick={() => setPage(link[0])}><b>{link[1]}</b>{link[2]}</button>)}<div className="quote"><b>NO BE EVERYBODY GET DRIP.</b><p>Find your fit. Enter the battle. Own your crown.</p></div></aside>
      <main className="content">
        {page === "home" && <Home character={character} look={look} studio={() => setPage("studio")} battles={() => setPage("battles")} mall={() => setPage("mall")} inventory={() => setPage("inventory")} city={() => setPage("city")}/>}
        {page === "studio" && <Studio character={character} look={look} slot={slot} saveName={saveName} setCharacter={setCharacter} setSlot={setSlot} setSaveName={setSaveName} update={update} save={save} randomize={randomize} reset={() => { update(structuredClone(defaultLooks[character])); setNotice("Look reset."); }}/>}
        {page === "mall" && <FashionMall catalogue={supabase ? catalog : demoCatalogue} demoMode={!supabase} catalogueState={catalogState} catalogueError={catalogError} retryCatalogue={retryCatalog} character={character} setCharacter={setCharacter} looks={store.looks} signedIn={Boolean(currentUserId)} inventoryState={currentUserId && !accountDataReady ? "loading" : inventoryState} inventoryError={accountDataReady ? inventoryError : ""} ownedSlugs={accountDataReady ? inventory.map((item) => item.id) : []} retryInventory={retryInventory} openAccount={() => setPage("account")} openStudio={() => setPage("studio")}/>}
        {page === "inventory" && <PlayerInventory items={accountDataReady ? inventory : []} demoMode={!supabase} signedIn={Boolean(currentUserId)} state={currentUserId && !accountDataReady ? "loading" : inventoryState} error={accountDataReady ? inventoryError : ""} retry={retryInventory} character={character} setCharacter={setCharacter} look={look} onEquip={equipInventoryItem} onUnequip={unequipInventoryItem} openMall={() => setPage("mall")} openAccount={() => setPage("account")}/>}
        {page === "battles" && <Battles entered={entered} voted={voted} studio={() => setPage("studio")} enter={() => { setEntered(true); setNotice("Your current look has entered Lagos Nightlife."); }} vote={() => { if (voted) setNotice("One vote per battle — yours is locked."); else { setVoted(true); setNotice("Vote counted. Sharp eye!"); } }}/>}
        {page === "wardrobe" && <Wardrobe presets={visiblePresets} character={character} setCharacter={setCharacter} studio={() => setPage("studio")} load={load} rename={rename} remove={remove} update={updatePreset} sync={syncLocalOutfit} connected={Boolean(session && supabase)} state={visibleCloudOutfitState} error={accountDataReady ? cloudOutfitError : ""} busyIds={busyOutfitIds} retry={refreshCloudOutfits}/>}
        {page === "profile" && <Profile handle={store.handle} character={character} look={look} change={(handle) => setStore((data) => ({ ...data, handle }))}/>}
        {page === "city" && <DripCity key={currentUserId ?? "guest"} configured={Boolean(supabase)} signedIn={Boolean(currentUserId)} displayName={accountDataReady && profile ? profile.username : store.handle} displayNameIsReal={!supabase || Boolean(accountDataReady && profile)} character={character} look={look} savedOutfits={visiblePresets} myPublicId={accountDataReady ? profile?.public_id ?? null : null} avatarSaved={Boolean(avatarCandidate)} avatarPublic={avatarPublic} catalog={supabase ? catalog : demoCatalogue} openAccount={() => setPage("account")} openStudio={() => setPage("studio")} setNotice={setNotice} onAvatarPublicChange={setAvatarVisibility}/>}
        {page === "account" && <Account configured={Boolean(supabase)} configurationMessage={supabaseConfigError} session={session} authLoading={authLoading} authBusy={authBusy} authMessage={authMessage} authError={authError} signIn={signIn} signUp={signUp} signOut={signOut} continueDemo={() => { setPage("home"); setNotice("Demo mode is ready. Your local outfits are safe."); }} profile={accountDataReady ? profile : null} profileState={currentUserId && !accountDataReady ? "loading" : profileState} profileError={accountDataReady ? profileError : ""} retryProfile={retryProfile} saveProfile={saveProfile} avatar={accountDataReady ? avatarCandidate : null} avatarState={currentUserId && !accountDataReady ? "loading" : avatarState} avatarError={accountDataReady ? avatarError : ""} retryAvatar={retryAvatar} saveAvatar={saveAvatar} applyAvatar={applyAvatar} catalog={catalog} catalogState={catalogState} catalogError={catalogError} retryCatalog={retryCatalog} inventory={accountDataReady ? inventory : []} inventoryState={currentUserId && !accountDataReady ? "loading" : inventoryState} inventoryError={accountDataReady ? inventoryError : ""} retryInventory={retryInventory} cloudOutfitCount={visibleCloudOutfits.length}/>}
        <footer><span>DRIP CHECK NAIJA © 2026</span><span>BUILT FOR THE CULTURE. MADE FOR THE CROWN.</span></footer>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Main navigation">{nav.map((link) => <button key={link[0]} className={page === link[0] ? "active" : ""} aria-current={page === link[0] ? "page" : undefined} onClick={() => setPage(link[0])}><b>{link[1]}</b>{link[2]}</button>)}</nav>
    {notice && <div className="toast" role="status">{notice}</div>}
  </div>;
}

function Home({ character, look, studio, battles, mall, inventory, city }: { character: Character; look: Look; studio: () => void; battles: () => void; mall: () => void; inventory: () => void; city: () => void }) { return <><Title eyebrow="DRIP CHECK NAIJA / HOME" heading="Your crown is waiting." copy="Dress sharp. Battle hard. The city is watching."/><section className="home-grid"><article className="hero"><div><span className="eyebrow">TODAY'S FIT</span><h2>Ready to turn heads?</h2><p>Build a look that makes the group chat pause.</p><Action onClick={studio}>OPEN STUDIO →</Action></div><AvatarRenderer character={character} look={look}/></article><article className="tile"><span className="eyebrow">DRIP CITY</span><h2>Your style, your neighbourhood.</h2><p>Explore a single-player demo, discover public players, and browse outfits players choose to share.</p><button className="text-btn" onClick={city}>ENTER DRIP CITY →</button></article><article className="tile"><span className="eyebrow">FASHION MALL</span><h2>Fresh pieces, Naija energy.</h2><p>Find a fit and try it on before you commit.</p><button className="text-btn" onClick={mall}>BROWSE THE MALL →</button></article><article className="tile"><span className="eyebrow">PLAYER INVENTORY</span><h2>Your pieces, your rules.</h2><p>See verified cloud items or keep styling in demo mode.</p><button className="text-btn" onClick={inventory}>OPEN INVENTORY →</button></article><article className="tile battle-tile"><span className="eyebrow">BATTLE CORNER · DEMO</span><h2>Lagos Nightlife</h2><p>Battle entry and voting are demo-only and are not saved to a live competition.</p><button className="text-btn" onClick={battles}>VIEW BATTLE →</button></article></section><section className="activity"><span className="eyebrow">CITY STATUS</span><p>Live activity, online status, battle placements, and messages are not connected yet. The Drip City demo is clearly labelled.</p></section></>; }

function Studio({ character, look, slot, saveName, setCharacter, setSlot, setSaveName, update, save, randomize, reset }: { character: Character; look: Look; slot: Slot; saveName: string; setCharacter: (v: Character) => void; setSlot: (v: Slot) => void; setSaveName: (v: string) => void; update: (v: Look) => void; save: () => void; randomize: () => void; reset: () => void }) {
  const options = useMemo(() => isItemSlot(slot) ? optionsFor(slot, character) : [], [slot, character]);
  const item = isItemSlot(slot) ? itemFor(look[slot]) : undefined;
  const value = slot === "skin" ? look.skin : slot === "hairColor" ? look.hairColor : slot === "expression" ? look.expression : item?.color ?? "";
  const pickItem = (next: string) => {
    if (slot === "skin") update({ ...look, skin: next });
    else if (slot === "hairColor") update({ ...look, hairColor: next });
    else if (slot === "expression") update({ ...look, expression: next as Expression });
    else if (isItemSlot(slot)) update({ ...look, [slot]: next });
  };
  const swatches = slot === "skin" ? SKINS : slot === "hairColor" ? HAIR_COLOURS : [];
  const expressionsCount = slot === "expression" ? expressions.length : 0;
  const itemCount = slot === "skin" || slot === "hairColor" ? swatches.length : slot === "expression" ? expressionsCount : options.length;
  return <><Title eyebrow="DRIP CHECK NAIJA / STUDIO" heading="Build your look." copy="Mix it. Match it. Make it yours."/><section className="studio">
    <aside className="studio-left"><span className="eyebrow">01 / CHARACTER</span><div className="person-switch"><button className={character === "femme" ? "selected" : ""} onClick={() => setCharacter("femme")}>♀ FEMME</button><button className={character === "masc" ? "selected" : ""} onClick={() => setCharacter("masc")}>♂ MASC</button></div><span className="eyebrow category-heading">02 / CUSTOMIZE</span>{slots.map((part) => <button className={slot === part ? "slot selected" : "slot"} onClick={() => setSlot(part)} key={part}><b>{part === "skin" ? "◉" : part === "hair" || part === "hairColor" ? "✦" : part === "top" ? "◫" : part === "bottom" ? "▥" : part === "shoes" ? "⌁" : part === "expression" ? "◡" : "✧"}</b>{labels[part]}<i>›</i></button>)}</aside>
    <section className="preview"><div className="panel-top"><b>AVATAR PREVIEW</b><span className="mint">● LIVE</span></div><div className="avatar-stage"><i/><AvatarRenderer character={character} look={look}/><small>YOUR NEXT LOOK STARTS HERE</small></div><div className="controls"><div><span>VIEW</span>{(["front", "side", "back"] as View[]).map((view) => <button className={look.view === view ? "selected" : ""} onClick={() => update({ ...look, view })} key={view}>{view}</button>)}</div><div><span>MOOD</span>{expressions.map((expression) => <button aria-label={expression} title={expression} className={look.expression === expression ? "selected" : ""} onClick={() => update({ ...look, expression })} key={expression}>{expression === "normal" ? "•" : expression === "happy" ? "⌣" : expression === "serious" ? "—" : "○"}</button>)}</div></div></section>
    <section className="picker"><div className="panel-top"><b>03 / STYLE SELECT</b><span>{itemCount} OPTIONS</span></div><div className="picker-title"><div><span className="eyebrow">CHOOSE YOUR STYLE</span><h2>{labels[slot]}</h2></div><p>{item?.rarity ?? ""}</p></div>
      {slot === "skin" || slot === "hairColor"
        ? <div className={`item-grid swatch-grid ${slot === "skin" ? "skin-grid" : ""}`}>{swatches.map((tone, index) => <button aria-label={slot === "skin" ? `Skin tone ${index + 1}` : `Hair colour ${index + 1}`} className={value === tone ? "chosen" : ""} onClick={() => pickItem(tone)} key={tone}><i style={{ background: tone }}/><small>{slot === "skin" ? `Tone ${index + 1}` : ["Ink", "Cocoa", "Chestnut", "Copper", "Lavender", "Tangerine"][index]}</small></button>)}</div>
        : slot === "expression"
          ? <div className="item-grid expression-grid">{expressions.map((expression) => <button aria-label={expression} className={look.expression === expression ? "chosen" : ""} onClick={() => pickItem(expression)} key={expression}><i className={`expression-icon expression-${expression}`}>{expression === "happy" ? "⌣" : expression === "serious" ? "—" : expression === "surprised" ? "○" : "•"}</i><small>{expression}</small></button>)}</div>
          : <div className="item-grid">{options.map((option) => <button className={look[slot] === option.id ? "chosen" : ""} onClick={() => pickItem(option.id)} key={option.id}><i style={{ background: option.color }}/><small>{option.name}</small><em>{option.rarity}</em></button>)}</div>}
      <div className="detail"><i style={{ background: value }}/><div><b>{slot === "skin" ? "Your tone" : slot === "hairColor" ? "Hair colour" : slot === "expression" ? look.expression : item?.name}</b><p>{slot === "skin" ? "Pick the tone that feels right." : slot === "hairColor" ? "Choose a shade independently from your hairstyle." : slot === "expression" ? "Set the mood for your avatar." : item?.description}</p></div></div>
      <div className="save"><input aria-label="Outfit name" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Name this outfit" maxLength={28}/><Action onClick={save}>SAVE OUTFIT</Action></div><div className="actions"><Action quiet onClick={reset}>RESET</Action><Action quiet onClick={randomize}>✦ RANDOMIZE</Action></div>
    </section>
  </section></>;
}

function Battles({ entered, voted, studio, enter, vote }: { entered: boolean; voted: boolean; studio: () => void; enter: () => void; vote: () => void }) { return <><Title eyebrow="DRIP CHECK NAIJA / BATTLES" heading="Who get the drip?" copy="Style up, submit before the bell, and vote with sense."/><section className="battle-hero"><div><span className="eyebrow">ACTIVE CHALLENGE</span><h2>Lagos Nightlife</h2><p>Step out like the whole city is watching. Think colour, confidence and a little bit of drama.</p><b className="countdown">ENDS IN 2D 14H</b><div>{entered ? <Action disabled>✓ LOOK SUBMITTED</Action> : <><Action onClick={studio}>STYLE YOUR ENTRY →</Action><button className="text-btn" onClick={enter}>Use current Studio look</button></>}</div></div><strong>AFTER<br/>DARK <i>✦</i></strong></section><div className="section-heading"><div><span className="eyebrow">COMMUNITY PICK</span><h2>One vote. Make it count.</h2></div><span>DEMO VOTING</span></div><section className="votes"><VoteCard name="Lola Luxe" character="femme" own/><VoteCard name="Timi Threads" character="masc" voted={voted} select={vote}/></section></>; }
function VoteCard({ name, character, own, voted, select }: { name: string; character: Character; own?: boolean; voted?: boolean; select?: () => void }) { return <article className={voted ? "vote-card voted" : "vote-card"}><span className="eyebrow">{own ? "YOUR LOOK" : "LOOK B"}</span><AvatarRenderer character={character} look={defaultLooks[character]} compact/><h3>{name}</h3><Action quiet disabled={own || voted} onClick={select}>{own ? "YOUR ENTRY" : voted ? "✓ VOTED" : "VOTE FOR THIS LOOK"}</Action></article>; }
function Wardrobe({ presets, character, setCharacter, studio, load, rename, remove, update, sync, connected, state, error, busyIds, retry }: { presets: Preset[]; character: Character; setCharacter: (value: Character) => void; studio: () => void; load: (p: Preset) => void; rename: (preset: Preset, name: string) => void; remove: (preset: Preset) => void; update: (preset: Preset) => void; sync: (preset: Preset) => void; connected: boolean; state: RemoteState; error: string; busyIds: string[]; retry: () => void }) {
  const collection = presets.filter((preset) => preset.character === character);
  return <><Title eyebrow="DRIP CHECK NAIJA / WARDROBE" heading="Your collection." copy="Every saved look, ready when the city calls."/><div className="wardrobe-tabs"><button className={character === "femme" ? "selected" : ""} onClick={() => setCharacter("femme")}>♀ FEMME <span>{presets.filter((preset) => preset.character === "femme").length}</span></button><button className={character === "masc" ? "selected" : ""} onClick={() => setCharacter("masc")}>♂ MASC <span>{presets.filter((preset) => preset.character === "masc").length}</span></button></div>
    {connected && state === "loading" && <p className="cloud-banner" role="status">Loading this account's cloud outfits… Local drafts remain available.</p>}
    {connected && state === "error" && <div className="cloud-banner cloud-banner-error" role="alert"><span>Cloud wardrobe error: {error}</span><button className="text-btn" onClick={retry}>RETRY</button></div>}
    <p className="wardrobe-note">{connected ? "Cloud outfits and local drafts are combined for viewing. Local-only drafts are uploaded only when you choose Sync to cloud." : "These outfits are saved on this device. Sign in to enable cloud wardrobe sync."}</p>
    <section className="section-heading"><div><span className="eyebrow">SAVED OUTFITS · {character === "femme" ? "FEMME" : "MASC"}</span><h2>{collection.length ? collection.length + " looks in rotation" : "Your closet is ready."}</h2></div><Action onClick={studio}>OPEN STUDIO</Action></section>{collection.length ? <section className="presets">{collection.map((preset) => <PresetCard key={preset.id} preset={preset} load={load} rename={rename} remove={remove} update={update} sync={sync} connected={connected} busy={busyIds.includes(preset.id)}/>)}</section> : <section className="empty"><b>✦</b><h2>No saved outfits yet.</h2><p>Build a look in Studio, then save it to this character's wardrobe.</p><Action onClick={studio}>GO TO STUDIO</Action></section>}</>;
}
function PresetCard({ preset, load, rename, remove, update, sync, connected, busy }: { preset: Preset; load: (preset: Preset) => void; rename: (preset: Preset, name: string) => void; remove: (preset: Preset) => void; update: (preset: Preset) => void; sync: (preset: Preset) => void; connected: boolean; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(preset.name);
  const saveName = () => { if (!name.trim()) return; rename(preset, name); setEditing(false); };
  return <article className="preset-card"><AvatarRenderer character={preset.character} look={preset.look} compact/>{editing ? <div className="rename-form"><input aria-label="New outfit name" value={name} onChange={(event) => setName(event.target.value)} maxLength={28}/><button className="text-btn" disabled={busy} onClick={saveName}>SAVE NAME</button><button className="text-btn" onClick={() => { setName(preset.name); setEditing(false); }}>CANCEL</button></div> : <><h3>{preset.name}</h3><p>{preset.character === "femme" ? "Femme" : "Masc"} · {preset.source === "cloud" ? "cloud" : "this device"}</p><div className="preset-actions"><button className="text-btn" onClick={() => load(preset)}>LOAD</button><button className="text-btn" disabled={busy} onClick={() => update(preset)}>UPDATE LOOK</button><button className="text-btn" disabled={busy} onClick={() => setEditing(true)}>RENAME</button>{connected && preset.source === "local" && <button className="text-btn" disabled={busy} onClick={() => sync(preset)}>{busy ? "SYNCING…" : "SYNC TO CLOUD"}</button>}<button className="text-btn delete-action" disabled={busy} onClick={() => remove(preset)}>{busy ? "SAVING…" : "DELETE"}</button></div></>}</article>;
}
function Profile({ handle, character, look, change }: { handle: string; character: Character; look: Look; change: (x: string) => void }) { return <><Title eyebrow="DRIP CHECK NAIJA / PROFILE" heading="Your local profile." copy="A device-only display name and your current Studio avatar."/><section className="profile"><div><AvatarRenderer character={character} look={look}/></div><article><label className="eyebrow" htmlFor="handle">DEMO DISPLAY NAME</label><input id="handle" value={handle} onChange={(e) => change(e.target.value)} maxLength={20}/><p>This name is saved only on this device. Manage your public cloud profile in Account or Drip City.</p></article></section></>; }
