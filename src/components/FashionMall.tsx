import { useEffect, useMemo, useState } from "react";
import AvatarRenderer from "../avatar/AvatarRenderer";
import { items as studioItems, type Character, type ItemSlot, type Look, type Slot } from "../avatar/catalog";
import type { FashionCatalogueItem } from "../supabase/repository";

type State = "idle" | "loading" | "ready" | "error";
type Sort = "catalog" | "newest" | "price-low" | "price-high";
type Props = {
  catalogue: FashionCatalogueItem[];
  demoMode: boolean;
  catalogueState: State;
  catalogueError: string;
  retryCatalogue: () => void;
  character: Character;
  setCharacter: (character: Character) => void;
  looks: Record<Character, Look>;
  signedIn: boolean;
  inventoryState: State;
  inventoryError: string;
  ownedSlugs: string[];
  retryInventory: () => void;
  openAccount: () => void;
  openStudio: () => void;
};

const categories: [Slot | "all", string][] = [
  ["all", "All styles"], ["skin", "Skin tone"], ["hair", "Hairstyle"], ["hairColor", "Hair colour"],
  ["expression", "Expression"], ["top", "Tops"], ["bottom", "Bottoms"], ["shoes", "Sneakers"],
  ["chain", "Chains"], ["earrings", "Earrings"], ["glasses", "Glasses"], ["watch", "Watches"], ["bag", "Bags"],
];
const categoryIcon: Record<ItemSlot, string> = {
  hair: "✦", top: "◫", bottom: "▥", shoes: "⌁", chain: "◇", earrings: "✧", glasses: "◉", watch: "◷", bag: "▣",
};

function isHttpUrl(value: string | null): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export default function FashionMall(props: Props) {
  const [category, setCategory] = useState<Slot | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("catalog");
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const previewItem = props.catalogue.find((item) => item.id === previewSlug && item.characters.includes(props.character)) ?? null;
  const supportsNewest = props.catalogue.some((item) => item.createdAt && Number.isFinite(Date.parse(item.createdAt)));
  const supportsPrice = props.catalogue.some((item) => item.price !== null);

  useEffect(() => {
    if (supportsNewest && sort === "catalog") setSort("newest");
    else if (!supportsNewest && sort === "newest") setSort("catalog");
  }, [sort, supportsNewest]);

  useEffect(() => {
    if (previewSlug && !props.catalogue.some((item) => item.id === previewSlug && item.characters.includes(props.character))) {
      setPreviewSlug(null);
    }
  }, [previewSlug, props.catalogue, props.character]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const result = props.catalogue.filter((item) =>
      (category === "all" || item.slot === category) &&
      (!normalizedQuery || item.name.toLocaleLowerCase().includes(normalizedQuery))
    );
    if (sort === "price-low") result.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
    if (sort === "price-high") result.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === "newest") result.sort((a, b) => (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0));
    return result;
  }, [category, props.catalogue, query, sort]);

  const displayLook = previewItem
    ? { ...props.looks[props.character], [previewItem.slot]: previewItem.id }
    : props.looks[props.character];
  const ownershipMessage = props.demoMode
    ? "Demo preview only — nothing here is permanently owned."
    : !props.signedIn
      ? "Sign in to verify which items you own."
      : props.inventoryState === "loading" || props.inventoryState === "idle"
        ? "Checking your verified inventory…"
        : props.inventoryState === "error"
          ? "Ownership could not be verified."
          : "Ownership is verified against your player inventory.";

  return <>
    <div className="page-title">
      <div><span className="eyebrow">DRIP CHECK NAIJA / FASHION MALL</span><h1>Find your next fit.</h1><p>Preview the look first. Your Studio outfit stays untouched.</p></div>
      <span className="connection-chip">{props.demoMode ? "DEMO CATALOGUE" : "CLOUD CATALOGUE"}</span>
    </div>
    {props.demoMode && <p className="mall-banner" role="status">DEMO MODE · Sample styles are here to try on. They are not owned inventory and cannot be purchased.</p>}
    {!props.demoMode && <div className="mall-banner" role="status"><span>{ownershipMessage}</span>{props.signedIn && props.inventoryState === "error" && <button className="text-btn" onClick={props.retryInventory}>RETRY OWNERSHIP CHECK</button>}{!props.signedIn && <button className="text-btn" onClick={props.openAccount}>SIGN IN</button>}</div>}
    {props.catalogueState === "loading" && <section className="empty" role="status"><b>✦</b><h2>Loading the Mall…</h2><p>Fetching active fashion from the cloud catalogue.</p></section>}
    {props.catalogueState === "error" && <section className="empty" role="alert"><b>!</b><h2>The catalogue could not load.</h2><p>{props.catalogueError}</p><button className="button" onClick={props.retryCatalogue}>RETRY CATALOGUE</button></section>}
    {props.catalogueState !== "loading" && props.catalogueState !== "error" && <div className="mall-layout">
      <section className="mall-catalogue">
        <div className="mall-tools">
          <label className="mall-search"><span aria-hidden="true">⌕</span><input aria-label="Search fashion items" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the Mall"/></label>
          <label className="mall-sort">SORT BY<select aria-label="Sort fashion items" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>{supportsNewest && <option value="newest">Newest</option>}<option value="catalog">Catalogue order</option><option value="price-low" disabled={!supportsPrice}>Price: low to high</option><option value="price-high" disabled={!supportsPrice}>Price: high to low</option></select></label>
        </div>
        <div className="mall-categories" aria-label="Fashion categories">{categories.map(([id, label]) => <button key={id} className={category === id ? "selected" : ""} aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}</div>
        <div className="mall-results"><span className="eyebrow">{filtered.length} {filtered.length === 1 ? "STYLE" : "STYLES"}</span><span className="mall-data-note">Popularity is not tracked in the catalogue.</span>{category !== "all" && ["skin", "hairColor", "expression"].includes(category) && <span>Customize this in Studio; it is not a collectible item.</span>}</div>
        {filtered.length ? <div className="mall-grid">{filtered.map((item) => {
          const itemCharacter = item.characters.includes(props.character) ? props.character : item.characters[0];
          const itemLook = { ...props.looks[itemCharacter], [item.slot]: item.id };
          const owned = !props.demoMode && props.signedIn && props.inventoryState === "ready" && props.ownedSlugs.includes(item.id);
          const ownershipUnknown = !props.demoMode && (!props.signedIn || props.inventoryState !== "ready");
          return <article className={`mall-card${previewSlug === item.id ? " previewing" : ""}`} key={item.catalogueId ?? item.id}>
            <button className="mall-card-art" aria-label={`Preview ${item.name} on your avatar`} onClick={() => { props.setCharacter(itemCharacter); setPreviewSlug(item.id); }}>
              {isHttpUrl(item.thumbnailPath) ? <img src={item.thumbnailPath} alt="" loading="lazy"/> : <span className="mall-art-icon" style={{ color: item.accent ?? item.color }}>{categoryIcon[item.slot]}</span>}
              <AvatarRenderer character={itemCharacter} look={itemLook} compact catalogItems={props.catalogue}/>
              <span className="mall-rarity">{item.rarity}</span>
            </button>
            <div className="mall-card-copy"><div><h2>{item.name}</h2><span>{categories.find(([id]) => id === item.slot)?.[1] ?? item.category}</span></div><b className="mall-price">{item.price === null ? "DEMO PRICE N/A" : `PRICE ${item.price.toLocaleString()}`}</b></div>
            <div className="mall-card-status">{props.demoMode ? <span className="demo-status">TRY-ON ONLY</span> : ownershipUnknown ? <span>VERIFY OWNERSHIP</span> : owned ? <span className="owned-status">✓ OWNED</span> : <span className="locked-status">LOCKED</span>}</div>
            <button className="mall-purchase" disabled aria-label={`Purchases unavailable for ${item.name}`}>{owned ? "IN YOUR INVENTORY" : "PURCHASES COMING SOON"}</button>
          </article>;
        })}</div> : <section className="empty mall-empty"><b>⌕</b><h2>No styles found.</h2><p>{category !== "all" && ["skin", "hairColor", "expression"].includes(category) ? "This Studio category has options, but no collectible Mall items." : "Try another search or category filter."}</p>{category !== "all" && <button className="text-btn" onClick={() => setCategory("all")}>SHOW ALL STYLES</button>}</section>}
      </section>
      <aside className="mall-preview">
        <div className="panel-top"><b>TRY IT ON</b><span className="mint">● {previewItem ? "PREVIEW" : "YOUR STUDIO LOOK"}</span></div>
        <div className="mall-avatar-stage"><div className="mall-person-switch"><button className={props.character === "femme" ? "selected" : ""} onClick={() => props.setCharacter("femme")}>FEMME</button><button className={props.character === "masc" ? "selected" : ""} onClick={() => props.setCharacter("masc")}>MASC</button></div><AvatarRenderer character={props.character} look={displayLook} catalogItems={props.catalogue}/><p>{previewItem ? `${previewItem.name} · temporary preview` : "Your saved Studio look"}</p></div>
        <div className="mall-preview-detail">{previewItem ? <><b>{previewItem.name}</b><p>{previewItem.description || "A fresh addition to the rotation."}</p></> : <><b>Make it yours, first.</b><p>Select any compatible style to preview it on your current Studio avatar. No outfit data changes until you choose to edit in Studio.</p></>}</div>
        {previewItem && <button className="button quiet mall-clear" onClick={() => setPreviewSlug(null)}>CLEAR PREVIEW · RETURN TO MY OUTFIT</button>}
        <button className="button mall-studio-link" onClick={props.openStudio}>OPEN AVATAR STUDIO</button>
        <div className="mall-purchase-note"><span className="eyebrow">PURCHASES</span><p>Purchases are safely disabled. This app has no verified server-side checkout or atomic inventory grant.</p></div>
      </aside>
    </div>}
  </>;
}
