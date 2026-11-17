import { useMemo, useState } from "react";
import AvatarRenderer from "../avatar/AvatarRenderer";
import { defaultLooks, items as studioItems, type Character, type ItemSlot, type Look, type Slot } from "../avatar/catalog";
import type { OwnedFashionItem } from "../supabase/repository";

type State = "idle" | "loading" | "ready" | "error";
type Props = {
  items: OwnedFashionItem[];
  demoMode: boolean;
  signedIn: boolean;
  state: State;
  error: string;
  retry: () => void;
  character: Character;
  setCharacter: (character: Character) => void;
  look: Look;
  onEquip: (item: OwnedFashionItem) => void;
  onUnequip: (item: OwnedFashionItem) => void;
  openMall: () => void;
  openAccount: () => void;
};
const categories: [Slot | "all", string][] = [
  ["all", "All items"], ["skin", "Skin tone"], ["hair", "Hairstyle"], ["hairColor", "Hair colour"],
  ["expression", "Expression"], ["top", "Tops"], ["bottom", "Bottoms"], ["shoes", "Sneakers"],
  ["chain", "Chains"], ["earrings", "Earrings"], ["glasses", "Glasses"], ["watch", "Watches"], ["bag", "Bags"],
];
const isItemSlot = (slot: Slot): slot is ItemSlot => !["skin", "hairColor", "expression"].includes(slot);

export default function PlayerInventory(props: Props) {
  const [category, setCategory] = useState<Slot | "all">("all");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => props.items.filter((item) =>
    (category === "all" || item.slot === category) &&
    item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  ), [category, props.items, query]);

  return <>
    <div className="page-title"><div><span className="eyebrow">DRIP CHECK NAIJA / PLAYER INVENTORY</span><h1>Your pieces, your rules.</h1><p>Items shown here are verified against your account. Equipping updates your Studio look.</p></div><span className={`connection-chip${props.demoMode ? "" : " connected"}`}>{props.demoMode ? "DEMO INVENTORY" : "CLOUD INVENTORY"}</span></div>
    {props.demoMode && <section className="inventory-message"><span className="eyebrow">DEMO MODE · NO PERMANENT OWNERSHIP</span><h2>Your local Studio stays open.</h2><p>Demo styles are available to try on in the Mall and Studio, but none are represented as owned inventory. They are not grants and are not permanent.</p><div className="inventory-cta"><button className="button" onClick={props.openMall}>BROWSE THE FASHION MALL</button><button className="button quiet" onClick={props.openAccount}>CLOUD ACCOUNT SETUP</button></div></section>}
    {!props.demoMode && !props.signedIn && <section className="empty"><b>◎</b><h2>Sign in to see your inventory.</h2><p>Ownership is read from your private player inventory; the Mall cannot verify ownership while signed out.</p><button className="button" onClick={props.openAccount}>SIGN IN OR CREATE ACCOUNT</button></section>}
    {!props.demoMode && props.signedIn && props.state === "loading" && <section className="empty" role="status"><b>✦</b><h2>Checking your collection…</h2><p>Reading inventory ownership for this account.</p></section>}
    {!props.demoMode && props.signedIn && props.state === "error" && <section className="empty" role="alert"><b>!</b><h2>Inventory could not load.</h2><p>{props.error}</p><button className="button" onClick={props.retry}>RETRY INVENTORY</button></section>}
    {!props.demoMode && props.signedIn && props.state === "ready" && <>
      <div className="inventory-toolbar"><label className="mall-search"><span aria-hidden="true">⌕</span><input aria-label="Search owned items" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your inventory"/></label><div className="inventory-person-switch" aria-label="Avatar character">{(["femme", "masc"] as Character[]).map((value) => <button className={props.character === value ? "selected" : ""} key={value} onClick={() => props.setCharacter(value)}>{value === "femme" ? "♀ FEMME" : "♂ MASC"}</button>)}</div></div>
      <div className="mall-categories inventory-categories" aria-label="Inventory categories">{categories.map(([id, label]) => <button key={id} className={category === id ? "selected" : ""} aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}</div>
      {filtered.length ? <><div className="inventory-count"><span className="eyebrow">{filtered.length} VERIFIED {filtered.length === 1 ? "ITEM" : "ITEMS"}</span><p>Cloud inventory · ownership supplied by Supabase, not browser storage.</p></div><div className="mall-grid inventory-grid">{filtered.map((item) => {
        const compatible = item.characters.includes(props.character);
        const equipped = compatible && props.look[item.slot] === item.id;
        const itemLook = { ...defaultLooks[props.character], [item.slot]: item.id };
        return <article className={`mall-card inventory-card${equipped ? " inventory-equipped" : ""}`} key={item.catalogueId ?? item.id}>
          <div className="mall-card-art inventory-art"><AvatarRenderer character={props.character} look={itemLook} compact catalogItems={[...studioItems, item]}/><span className="mall-rarity">{item.rarity}</span></div>
          <div className="mall-card-copy"><div><h2>{item.name}</h2><span>{categories.find(([id]) => id === item.slot)?.[1] ?? item.category}</span></div><b className="inventory-source">{item.source}</b></div>
          <div className="mall-card-status">{equipped ? <span className="owned-status">✓ EQUIPPED</span> : compatible ? <span className="owned-status">✓ OWNED</span> : <span className="locked-status">NOT FOR THIS AVATAR</span>}</div>
          {isItemSlot(item.slot) && <button className="mall-purchase inventory-action" disabled={!compatible} onClick={() => equipped ? props.onUnequip(item) : props.onEquip(item)}>{equipped ? "UNEQUIP" : compatible ? "EQUIP IN STUDIO" : `USE ${item.characters.join(" / ").toUpperCase()} AVATAR`}</button>}
          <p className="inventory-acquired">Added {new Date(item.acquiredAt).toLocaleDateString()}</p>
        </article>;
      })}</div></> : <section className="empty inventory-empty"><b>{props.items.length ? "⌕" : "✦"}</b><h2>{props.items.length ? "No matching items." : "Your inventory is waiting."}</h2><p>{props.items.length ? "Try a different search or category." : "No items have been granted to this account yet. Mall purchases remain disabled."}</p>{!props.items.length && <button className="button" onClick={props.openMall}>VISIT THE FASHION MALL</button>}{props.items.length > 0 && <button className="text-btn" onClick={() => { setCategory("all"); setQuery(""); }}>CLEAR FILTERS</button>}</section>}
    </>}
    {props.signedIn && props.state === "ready" && props.items.length > 0 && <p className="inventory-footnote">Studio outfits remain saved locally as before. Equipping an owned item changes only the matching Studio category.</p>}
  </>;
}
