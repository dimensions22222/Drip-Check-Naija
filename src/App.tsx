import { useEffect, useMemo, useState } from "react";
import AvatarRenderer from "./avatar/AvatarRenderer";
import { defaultLooks, HAIR_COLOURS, itemFor, optionsFor, SKINS, type Character, type Expression, type ItemSlot, type Look, type Slot, type View } from "./avatar/catalog";

type Page = "home" | "studio" | "battles" | "wardrobe" | "profile" | "city";
type Preset = { id: string; name: string; character: Character; look: Look };
type Store = { looks: Record<Character, Look>; presets: Preset[]; handle: string };
const key = "drip-check-naija-demo-v2";
const empty: Store = { looks: structuredClone(defaultLooks), presets: [], handle: "AyoDrips" };
const labels: Record<Slot, string> = { skin: "Skin tone", hair: "Hairstyle", hairColor: "Hair colour", expression: "Expression", top: "Tops", bottom: "Bottoms", shoes: "Sneakers", chain: "Chains", earrings: "Earrings", glasses: "Glasses", watch: "Watches", bag: "Bags" };
const slots = Object.keys(labels) as Slot[];
const nav: [Page, string, string][] = [["home", "⌂", "Home"], ["studio", "✦", "Studio"], ["battles", "⚔", "Battles"], ["wardrobe", "▦", "Wardrobe"], ["profile", "◎", "Profile"], ["city", "◈", "Drip City"]];
const expressions: Expression[] = ["normal", "happy", "serious", "surprised"];
const isItemSlot = (slot: Slot): slot is ItemSlot => !["skin", "hairColor", "expression"].includes(slot);
function normalizeLook(value: Partial<Look> & { accessory?: string } | undefined, character: Character): Look {
  const defaults = defaultLooks[character];
  const oldAccessory = value?.accessory;
  return {
    ...defaults,
    ...value,
    chain: value?.chain ?? (oldAccessory === "acc-chain" ? "chain-gold" : defaults.chain),
    glasses: value?.glasses ?? (oldAccessory === "acc-glasses" ? "glasses-shades" : defaults.glasses),
    bag: value?.bag ?? (oldAccessory === "acc-bag" ? "bag-crossbody" : defaults.bag),
    hairColor: value?.hairColor ?? itemFor(value?.hair ?? defaults.hair)?.color ?? defaults.hairColor,
    expression: expressions.includes(value?.expression as Expression) ? value!.expression! : defaults.expression,
    view: ["front", "side", "back"].includes(value?.view ?? "") ? value!.view! : defaults.view,
  };
}
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
  const look = store.looks[character];
  const update = (next: Look) => setStore((data) => ({ ...data, looks: { ...data.looks, [character]: next } }));
  useEffect(() => localStorage.setItem(key, JSON.stringify(store)), [store]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 2600); return () => window.clearTimeout(timer); }, [notice]);
  const save = () => { const count = store.presets.filter((preset) => preset.character === character).length; const name = saveName.trim() || "Look " + (count + 1); const preset: Preset = { id: crypto.randomUUID(), name, character, look: structuredClone(look) }; setStore((data) => ({ ...data, presets: [preset, ...data.presets] })); setSaveName(""); setNotice("Look saved to Wardrobe."); };
  const randomize = () => {
    const next: Look = { ...look, skin: SKINS[Math.floor(Math.random() * SKINS.length)], hairColor: HAIR_COLOURS[Math.floor(Math.random() * HAIR_COLOURS.length)], expression: expressions[Math.floor(Math.random() * expressions.length)] };
    (["hair", "top", "bottom", "shoes", "chain", "earrings", "glasses", "watch", "bag"] as ItemSlot[]).forEach((part) => {
      const choices = optionsFor(part, character);
      next[part] = choices[Math.floor(Math.random() * choices.length)].id;
    });
    update(next); setNotice("Fresh fit, no stress.");
  };
  const remove = (id: string) => { setStore((data) => ({ ...data, presets: data.presets.filter((preset) => preset.id !== id) })); setNotice("Preset deleted."); };
  const rename = (id: string, name: string) => { const trimmed = name.trim(); if (!trimmed) return; setStore((data) => ({ ...data, presets: data.presets.map((preset) => preset.id === id ? { ...preset, name: trimmed } : preset) })); setNotice("Outfit renamed."); };
  const load = (preset: Preset) => { setCharacter(preset.character); setStore((data) => ({ ...data, looks: { ...data.looks, [preset.character]: normalizeLook(preset.look, preset.character) } })); setPage("studio"); setNotice("Preset loaded."); };
  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setPage("home")}><b>DC</b><span>DRIP CHECK <strong>NAIJA</strong><small>YOUR STYLE. YOUR CITY. YOUR CROWN.</small></span></button><div className="status"><i/> DEMO MODE <b>◈ 1,250</b></div></header>
    <div className="layout"><aside className="sidebar"><span className="nav-label">YOUR WORLD</span>{nav.map((link) => <button key={link[0]} className={page === link[0] ? "active" : ""} onClick={() => setPage(link[0])}><b>{link[1]}</b>{link[2]}</button>)}<div className="quote"><b>NO BE EVERYBODY GET DRIP.</b><p>Find your fit. Enter the battle. Own your crown.</p></div></aside>
      <main className="content">
        {page === "home" && <Home character={character} look={look} studio={() => setPage("studio")} battles={() => setPage("battles")}/>}
        {page === "studio" && <Studio character={character} look={look} slot={slot} saveName={saveName} setCharacter={setCharacter} setSlot={setSlot} setSaveName={setSaveName} update={update} save={save} randomize={randomize} reset={() => { update(structuredClone(defaultLooks[character])); setNotice("Look reset."); }}/>}
        {page === "battles" && <Battles entered={entered} voted={voted} studio={() => setPage("studio")} enter={() => { setEntered(true); setNotice("Your current look has entered Lagos Nightlife."); }} vote={() => { if (voted) setNotice("One vote per battle — yours is locked."); else { setVoted(true); setNotice("Vote counted. Sharp eye!"); } }}/>}
        {page === "wardrobe" && <Wardrobe presets={store.presets} character={character} setCharacter={setCharacter} studio={() => setPage("studio")} load={load} rename={rename} remove={remove}/>}
        {page === "profile" && <Profile handle={store.handle} character={character} look={look} change={(handle) => setStore((data) => ({ ...data, handle }))}/>}
        {page === "city" && <City studio={() => setPage("studio")}/>}
        <footer><span>DRIP CHECK NAIJA © 2026</span><span>BUILT FOR THE CULTURE. MADE FOR THE CROWN.</span></footer>
      </main>
    </div>
    <nav className="mobile-nav">{nav.slice(0, 5).map((link) => <button key={link[0]} className={page === link[0] ? "active" : ""} onClick={() => setPage(link[0])}><b>{link[1]}</b>{link[2]}</button>)}</nav>
    {notice && <div className="toast" role="status">{notice}</div>}
  </div>;
}

function Home({ character, look, studio, battles }: { character: Character; look: Look; studio: () => void; battles: () => void }) { return <><Title eyebrow="DRIP CHECK NAIJA / HOME" heading="Your crown is waiting." copy="Dress sharp. Battle hard. The city is watching."/><section className="home-grid"><article className="hero"><div><span className="eyebrow">TODAY'S FIT</span><h2>Ready to turn heads?</h2><p>Build a look that makes the group chat pause.</p><Action onClick={studio}>OPEN STUDIO →</Action></div><AvatarRenderer character={character} look={look}/></article><article className="tile"><span className="eyebrow">DAILY CHALLENGE</span><h2>Wear one bright colour.</h2><p>Complete it in Studio for a demo badge.</p><b className="mint">● AVAILABLE NOW</b></article><article className="tile battle-tile"><span className="eyebrow">FEATURED BATTLE</span><h2>Lagos Nightlife</h2><p>After-dark drip only. Na who wear am better?</p><button className="text-btn" onClick={battles}>VIEW BATTLE →</button></article></section><section className="activity"><span className="eyebrow">AROUND THE CITY</span><p><b>Lola Luxe</b> just earned the <b>Night Owl</b> badge. <small>8m</small></p><p><b>Timi Threads</b> saved a new streetwear look. <small>26m</small></p></section></>; }

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
function Wardrobe({ presets, character, setCharacter, studio, load, rename, remove }: { presets: Preset[]; character: Character; setCharacter: (value: Character) => void; studio: () => void; load: (p: Preset) => void; rename: (id: string, name: string) => void; remove: (id: string) => void }) {
  const collection = presets.filter((preset) => preset.character === character);
  return <><Title eyebrow="DRIP CHECK NAIJA / WARDROBE" heading="Your collection." copy="Every saved look, ready when the city calls."/><div className="wardrobe-tabs"><button className={character === "femme" ? "selected" : ""} onClick={() => setCharacter("femme")}>♀ FEMME <span>{presets.filter((preset) => preset.character === "femme").length}</span></button><button className={character === "masc" ? "selected" : ""} onClick={() => setCharacter("masc")}>♂ MASC <span>{presets.filter((preset) => preset.character === "masc").length}</span></button></div><section className="section-heading"><div><span className="eyebrow">SAVED OUTFITS · {character === "femme" ? "FEMME" : "MASC"}</span><h2>{collection.length ? collection.length + " looks in rotation" : "Your closet is ready."}</h2></div><Action onClick={studio}>OPEN STUDIO</Action></section>{collection.length ? <section className="presets">{collection.map((preset) => <PresetCard key={preset.id} preset={preset} load={load} rename={rename} remove={remove}/>)}</section> : <section className="empty"><b>✦</b><h2>No saved outfits yet.</h2><p>Build a look in Studio, then save it to this character's wardrobe.</p><Action onClick={studio}>GO TO STUDIO</Action></section>}</>;
}
function PresetCard({ preset, load, rename, remove }: { preset: Preset; load: (preset: Preset) => void; rename: (id: string, name: string) => void; remove: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(preset.name);
  const saveName = () => { if (!name.trim()) return; rename(preset.id, name); setEditing(false); };
  return <article className="preset-card"><AvatarRenderer character={preset.character} look={preset.look} compact/>{editing ? <div className="rename-form"><input aria-label="New outfit name" value={name} onChange={(event) => setName(event.target.value)} maxLength={28}/><button className="text-btn" onClick={saveName}>SAVE NAME</button><button className="text-btn" onClick={() => { setName(preset.name); setEditing(false); }}>CANCEL</button></div> : <><h3>{preset.name}</h3><p>{preset.character === "femme" ? "Femme" : "Masc"} · saved locally</p><div className="preset-actions"><button className="text-btn" onClick={() => load(preset)}>LOAD</button><button className="text-btn" onClick={() => setEditing(true)}>RENAME</button><button className="text-btn delete-action" onClick={() => remove(preset.id)}>DELETE</button></div></>}</article>;
}
function Profile({ handle, character, look, change }: { handle: string; character: Character; look: Look; change: (x: string) => void }) { return <><Title eyebrow="DRIP CHECK NAIJA / PROFILE" heading="Your style reputation." copy="Your stats will grow with every battle and every bold look."/><section className="profile"><div><AvatarRenderer character={character} look={look}/></div><article><label className="eyebrow" htmlFor="handle">PLAYER HANDLE</label><input id="handle" value={handle} onChange={(e) => change(e.target.value)} maxLength={20}/><p>New face. Fresh drip. Lagos, Nigeria.</p><section><b>01<small>LEVEL</small></b><b>00<small>BATTLES</small></b><b>00<small>WINS</small></b><b>1,250<small>COINS</small></b></section></article></section></>; }
function City({ studio }: { studio: () => void }) { return <><Title eyebrow="DRIP CHECK NAIJA / DRIP CITY" heading="The city is your runway." copy="A compact social plaza is on the way. Start with a look worth seeing."/><section className="city"><div><strong>DRIP<br/>CITY</strong><i>✦</i></div><article><b className="mint">● LOCAL DEMO</b><h2>Plaza opening soon.</h2><p>The social world is waiting until Studio and Battles are connected to real player data. Your avatar setup is ready.</p><Action onClick={studio}>BUILD YOUR LOOK →</Action></article></section></>; }
