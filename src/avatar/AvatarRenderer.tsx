import type { Character, Look } from "./catalog";
import { itemFor } from "./catalog";

type Props = { character: Character; look: Look; compact?: boolean };
const line = "#30253C";

export default function AvatarRenderer({ character, look, compact = false }: Props) {
  const hair = itemFor(look.hair)!; const top = itemFor(look.top)!; const bottom = itemFor(look.bottom)!;
  const shoes = itemFor(look.shoes)!; const accessory = itemFor(look.accessory)!;
  const side = look.view === "side"; const back = look.view === "back"; const femme = character === "femme";
  const mouth = look.expression === "happy" ? "M111 112 Q130 128 149 112" : look.expression === "serious" ? "M116 119 L144 119" : look.expression === "surprised" ? "M124 113 Q130 122 136 113 Q130 130 124 113" : "M119 116 Q130 122 141 115";
  const eye = look.expression === "happy" ? "M102 92 Q109 100 116 92 M144 92 Q151 100 158 92" : "";
  return <svg className={`avatar ${compact ? "avatar--compact" : ""}`} viewBox="0 0 260 420" role="img" aria-label={`${character === "femme" ? "Female" : "Male"} fashion avatar, ${look.view} view`}>
    <ellipse cx="130" cy="395" rx="68" ry="11" fill="#170F20" opacity=".22" />
    {/* base body layer */}
    <g className="layer-base"><path d="M103 213h24l-8 128H92zM134 213h24l10 128h-27z" fill={look.skin} stroke={line} strokeWidth="3" /><path d="M87 145 63 237q-4 15 9 18 12 2 16-12l24-70M173 145l24 92q4 15-9 18-12 2-16-12l-24-70" fill={look.skin} stroke={line} strokeWidth="3" strokeLinecap="round" /></g>
    {/* back hair layer */}
    {!back && <path d={femme ? "M82 90Q68 40 94 23q38-27 77 0 27 17 7 69l-15-15-66 4z" : "M85 86Q72 43 91 25q40-31 80 0 22 21 3 65l-15-19-56 7z"} fill={hair.color} stroke={line} strokeWidth="4" />}
    {/* shoes */}
    <g className="layer-shoes"><path d="M83 330h42l8 31H70q0-21 13-31zM137 330h42q13 10 13 31h-63z" fill={shoes.color} stroke={line} strokeWidth="4" /><path d="M76 350h52M133 350h53" stroke={shoes.accent ?? "#fff"} strokeWidth="4" opacity=".8" /></g>
    {/* bottoms */}
    <g className="layer-bottom"><path d={bottom.id === "bottom-skirt" ? "M84 208h92l15 55H69z" : "M84 205h92l-8 132h-36l-2-76-8 76H92z"} fill={bottom.color} stroke={line} strokeWidth="4" strokeLinejoin="round" /><path d="M93 230h28M140 230h27" stroke={bottom.accent} strokeWidth="4" opacity=".8" /></g>
    {/* torso / top layer */}
    <g className="layer-top"><path d="M93 137q37-23 74 0l22 83q-57 22-118 0z" fill={top.color} stroke={line} strokeWidth="4" strokeLinejoin="round" /><path d="M107 140q23 20 46 0M95 187h70" fill="none" stroke={top.accent} strokeWidth="4" opacity=".7" /></g>
    {/* neck and face layer */}
    <g className="layer-face"><path d="M113 116h34v33q-17 16-34 0z" fill={look.skin} stroke={line} strokeWidth="3" /><path d={side ? "M99 44q32-20 56 5 19 23 1 72-20 31-50 3Q83 97 99 44z" : "M82 64q0-49 48-49t48 49q0 64-48 70Q82 128 82 64z"} fill={look.skin} stroke={line} strokeWidth="4" /><path d={eye || "M100 93q9-10 18 0M142 93q9-10 18 0"} fill="none" stroke={line} strokeWidth="4" strokeLinecap="round" />{!eye && !back && <><circle cx="109" cy="95" r="3" fill={line}/><circle cx="151" cy="95" r="3" fill={line}/></>} {!back && <path d={mouth} fill="none" stroke="#9D5361" strokeWidth="3" strokeLinecap="round" />}</g>
    {/* front hair layer */}
    {!back && <g className="layer-front-hair" fill={hair.color} stroke={line} strokeWidth="4"><path d={femme ? "M83 71Q75 25 129 19q53 5 48 53l-22-18-13 29-16-31-17 28z" : "M83 66 92 27l15 19 10-28 15 27 19-28 8 30 17-16 2 44-25-20-23 19-22-20z"}/></g>}
    {/* accessories / effects layer */}
    {accessory.id === "acc-chain" && <path d="M110 145q20 33 40 0" fill="none" stroke={accessory.color} strokeWidth="5" />}
    {accessory.id === "acc-glasses" && <g fill={accessory.color} stroke={accessory.accent} strokeWidth="2"><rect x="91" y="84" width="34" height="17" rx="6"/><rect x="135" y="84" width="34" height="17" rx="6"/><path d="M125 92h10"/></g>}
    {accessory.id === "acc-cap" && <path d="M82 58q45-40 95 0l-5 17q-44-14-87 1z" fill={accessory.color} stroke={line} strokeWidth="4"/>}
    {accessory.id === "acc-bag" && <g stroke={line} strokeWidth="4"><path d="M167 156q-30 30-4 111" fill="none"/><rect x="157" y="232" width="38" height="45" rx="7" fill={accessory.color}/><path d="M164 245h24" stroke={accessory.accent}/></g>}
  </svg>;
}
