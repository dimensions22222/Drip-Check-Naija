import { useEffect, useMemo, useState } from "react";
import PhaserWorld from "./components/PhaserWorld";

type Tab = "Studio" | "Drip City" | "Battles" | "Wardrobe" | "Profile";
type Outfit = { skin: string; hair: string; top: string; bottom: string; shoes: string; accessory: string };

const defaults: Outfit = {
  skin: "#9b6041", hair: "#171313", top: "#e9b84b", bottom: "#202633", shoes: "#f4f0e8", accessory: "Gold chain"
};

const choices: Record<keyof Outfit, string[]> = {
  skin: ["#6d402f", "#9b6041", "#c98760", "#e0aa82"],
  hair: ["#171313", "#34221b", "#5b3422", "#171d2b"],
  top: ["#e9b84b", "#e95d76", "#54c9a0", "#f4f0e8", "#202633"],
  bottom: ["#202633", "#171313", "#806044", "#e95d76"],
  shoes: ["#f4f0e8", "#171313", "#e9b84b", "#e95d76"],
  accessory: ["None", "Gold chain", "Cap", "Sunglasses"]
};

const navIcons: Record<Tab, string> = {
  Studio: "✦", "Drip City": "⌂", Battles: "⚔", Wardrobe: "▦", Profile: "◎"
};

function Avatar({ outfit }: { outfit: Outfit }) {
  return <svg className="avatar-art" viewBox="0 0 260 390" role="img" aria-label="Your customizable fashion avatar">
    <ellipse cx="130" cy="365" rx="72" ry="13" fill="#000" opacity=".24" />
    {/* legs */}
    <path d="M91 225 L128 225 L121 330 L99 330 Z" fill={outfit.bottom}/>
    <path d="M132 225 L169 225 L163 330 L140 330 Z" fill={outfit.bottom}/>
    {/* shoes */}
    <path d="M96 323 Q84 331 83 349 L127 349 L126 335 L116 323Z" fill={outfit.shoes}/>
    <path d="M141 323 L159 323 Q175 332 181 349 L138 349Z" fill={outfit.shoes}/>
    {/* neck and face */}
    <rect x="113" y="104" width="34" height="37" rx="12" fill={outfit.skin}/>
    <ellipse cx="130" cy="77" rx="49" ry="57" fill={outfit.skin}/>
    {/* hair */}
    <path d="M82 77 Q72 18 129 17 Q189 18 179 82 L167 58 Q139 39 103 58 L91 91Z" fill={outfit.hair}/>
    <path d="M94 83 Q99 76 109 82 M150 82 Q160 76 168 83" stroke="#241b18" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <ellipse cx="110" cy="87" rx="4" ry="5" fill="#171313"/>
    <ellipse cx="151" cy="87" rx="4" ry="5" fill="#171313"/>
    <path d="M119 111 Q130 119 142 110" stroke="#6c3029" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* shirt */}
    <path d="M91 137 Q130 119 169 137 L190 224 Q130 247 70 224Z" fill={outfit.top}/>
    <path d="M113 133 Q130 153 147 133" stroke="#fff" strokeOpacity=".4" strokeWidth="5" fill="none"/>
    {/* arms */}
    <path d="M88 145 L67 220 Q63 236 78 240 Q88 241 93 225 L111 166Z" fill={outfit.skin}/>
    <path d="M172 145 L193 220 Q197 236 182 240 Q172 241 167 225 L149 166Z" fill={outfit.skin}/>
    {outfit.accessory === "Gold chain" && <path d="M109 145 Q130 180 151 145" stroke="#e9b84b" strokeWidth="5" fill="none"/>}
    {outfit.accessory === "Sunglasses" && <g fill="#171313"><rect x="91" y="76" width="34" height="15" rx="5"/><rect x="135" y="76" width="34" height="15" rx="5"/><path d="M125 82H135" stroke="#171313" strokeWidth="5"/></g>}
    {outfit.accessory === "Cap" && <path d="M80 54 Q130 3 181 54 L178 67 Q130 48 82 68Z" fill="#e9b84b"/>}
  </svg>;
}

function App() {
  const [tab, setTab] = useState<Tab>("Studio");
  const [outfit, setOutfit] = useState<Outfit>(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem("dcnaija-outfit") || "{}") }; }
    catch { return defaults; }
  });
  const [saved, setSaved] = useState(false);
  const [category, setCategory] = useState<keyof Outfit>("top");
  const [playerName, setPlayerName] = useState("NaijaStylista");

  useEffect(() => { localStorage.setItem("dcnaija-outfit", JSON.stringify(outfit)); }, [outfit]);

  const categoryLabel = useMemo(() => ({
    skin: "Skin tone", hair: "Hair", top: "Tops", bottom: "Bottoms", shoes: "Shoes", accessory: "Accessories"
  }[category]), [category]);

  function update(value: string) {
    setOutfit(current => ({ ...current, [category]: value }));
    setSaved(false);
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={() => setTab("Studio")}><span className="brand-mark">DC</span><span>DRIP CHECK <b>NAIJA</b><small>YOUR STYLE. YOUR CITY. YOUR CROWN.</small></span></a>
      <div className="top-meta"><span className="online-dot"/> BETA PREVIEW <span className="coin">◈ 1,250</span></div>
    </header>

    <div className="layout">
      <aside className="sidebar">
        <div className="side-label">YOUR WORLD</div>
        {(Object.keys(navIcons) as Tab[]).map(item =>
          <button key={item} className={`nav-button ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>
            <span>{navIcons[item]}</span>{item}
          </button>
        )}
        <div className="sidebar-note"><strong>NO BE EVERYBODY GET DRIP.</strong><p>Find your look. Enter the battle. Own your crown.</p></div>
      </aside>

      <main className="main-content">
        <div className="page-heading">
          <div><div className="eyebrow">DRIP CHECK NAIJA / {tab.toUpperCase()}</div><h1>{tab === "Studio" ? "Build your look." : tab === "Drip City" ? "Welcome to Drip City." : tab === "Battles" ? "Who get the drip?" : tab === "Wardrobe" ? "Your collection." : "Your style profile."}</h1><p>{tab === "Studio" ? "Mix it. Match it. Make it yours." : "Your style. Your city. Your crown."}</p></div>
          <div className="user-chip"><div className="mini-avatar">✦</div><span>{playerName}</span></div>
        </div>

        {tab === "Studio" && <section className="studio-grid">
          <div className="preview-card">
            <div className="card-top"><span>AVATAR PREVIEW</span><span className="live-tag">● LIVE</span></div>
            <div className="avatar-stage"><div className="stage-glow"/><Avatar outfit={outfit}/><div className="stage-caption">YOUR NEXT LOOK STARTS HERE</div></div>
            <div className="preview-footer"><span>STYLE RATING <b>—</b></span><span>OUTFIT PREVIEW</span></div>
          </div>
          <div className="editor-card">
            <div className="card-top"><span>STYLE EDITOR</span><span className="muted">01 / CUSTOMIZE</span></div>
            <div className="category-grid">
              {(Object.keys(choices) as (keyof Outfit)[]).map(key =>
                <button key={key} onClick={() => setCategory(key)} className={`category-button ${category === key ? "selected" : ""}`}>
                  <span>{({skin:"◉",hair:"♟",top:"▰",bottom:"▥",shoes:"⌁",accessory:"✧"})[key]}</span>{({skin:"Skin",hair:"Hair",top:"Tops",bottom:"Bottoms",shoes:"Shoes",accessory:"Extras"})[key]}
                </button>
              )}
            </div>
            <div className="option-heading"><div><span className="eyebrow">CHOOSE YOUR STYLE</span><h2>{categoryLabel}</h2></div><span className="muted">{choices[category].length} OPTIONS</span></div>
            <div className="options-grid">
              {choices[category].map((value, index) => {
                const colorValue = value.startsWith("#");
                return <button key={value} className={`option-tile ${outfit[category] === value ? "chosen" : ""}`} onClick={() => update(value)}>
                  {colorValue ? <span className="swatch" style={{background:value}}/> : <span className="option-symbol">{value === "None" ? "×" : value === "Gold chain" ? "♢" : value === "Cap" ? "⌂" : "◉"}</span>}
                  <small>{colorValue ? `Style ${index + 1}` : value}</small>
                </button>;
              })}
            </div>
            <div className="editor-actions"><button className="secondary-button" onClick={() => setOutfit(defaults)}>Reset</button><button className="primary-button" onClick={() => {localStorage.setItem("dcnaija-outfit", JSON.stringify(outfit)); setSaved(true);}}> {saved ? "✓ OUTFIT SAVED" : "SAVE OUTFIT →"}</button></div>
            <p className="helper-text">Your outfit is saved in this browser for this prototype.</p>
          </div>
        </section>}

        {tab === "Drip City" && <section className="content-card"><div className="card-top"><span>DRIP CITY / SOCIAL PLAZA</span><span className="live-tag">BETA MAP</span></div><PhaserWorld/><p className="helper-text">Move with WASD or the arrow keys. This is a starter scene; multiplayer presence is not connected yet.</p></section>}
        {tab === "Battles" && <section className="feature-grid"><div className="feature-card battle-feature"><span className="eyebrow">FEATURED CHALLENGE</span><h2>Lagos Nightlife</h2><p>Step out like the whole city is watching. Show us your after-dark fit.</p><div className="challenge-meta"><span>◷ 2 DAYS LEFT</span><span>♙ OPEN TO ALL</span></div><button className="primary-button" onClick={() => setTab("Studio")}>STYLE YOUR ENTRY →</button></div><div className="feature-card"><span className="eyebrow">COMING UP</span><h2>Detty December</h2><p>Bring the colour, confidence and celebration.</p><span className="muted">NEXT CHALLENGE</span></div><div className="feature-card"><span className="eyebrow">BATTLE RULES</span><h2>Keep it fair.</h2><p>Community voting decides the winners. No voting for your own entry.</p></div></section>}
        {tab === "Wardrobe" && <section className="content-card"><div className="card-top"><span>YOUR SAVED LOOK</span><span className="live-tag">LOCAL SAVE</span></div><div className="wardrobe-row"><div className="wardrobe-avatar"><Avatar outfit={outfit}/></div><div><h2>My first drip</h2><p className="muted">Your currently saved avatar combination.</p><button className="secondary-button" onClick={() => setTab("Studio")}>EDIT OUTFIT</button></div></div></section>}
        {tab === "Profile" && <section className="content-card profile-card"><div className="profile-symbol">✦</div><label className="eyebrow" htmlFor="player-name">PLAYER HANDLE</label><input id="player-name" value={playerName} onChange={e => setPlayerName(e.target.value)} maxLength={20}/><h2>New face. Fresh drip.</h2><p className="muted">Your profile, battle history, badges and rankings will grow here.</p><div className="stats-row"><div><b>1</b><small>LEVEL</small></div><div><b>0</b><small>BATTLES</small></div><div><b>0</b><small>WINS</small></div></div></section>}
        <footer className="footer"><span>DRIP CHECK NAIJA © 2026</span><span>BUILT FOR THE CULTURE. MADE FOR THE CROWN.</span></footer>
      </main>
    </div>
  </div>;
}

export default App;
