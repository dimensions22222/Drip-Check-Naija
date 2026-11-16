import type { Character, Look } from "./catalog";
import { itemFor } from "./catalog";

type Props = { character: Character; look: Look; compact?: boolean };
const line = "#30243A";

export default function AvatarRenderer({ character, look, compact = false }: Props) {
  const hair = itemFor(look.hair);
  const top = itemFor(look.top);
  const bottom = itemFor(look.bottom);
  const shoes = itemFor(look.shoes);
  const chain = itemFor(look.chain);
  const earrings = itemFor(look.earrings);
  const glasses = itemFor(look.glasses);
  const watch = itemFor(look.watch);
  const bag = itemFor(look.bag);
  const side = look.view === "side";
  const back = look.view === "back";
  const femme = character === "femme";
  const hairColor = look.hairColor || hair?.color || "#211B27";
  const isShorts = look.bottom === "bottom-shorts";
  const isSkirt = look.bottom === "bottom-skirt";
  const isHoodie = look.top === "top-orange" || look.top === "top-plum-hoodie";
  const isJacket = look.top === "top-mint" || look.top === "top-ink";
  const isBob = look.hair === "hair-bob";
  const isKnots = look.hair === "hair-bantu";
  const isBraids = look.hair === "hair-braids";
  const isCurls = look.hair === "hair-curls";
  const isFade = look.hair === "hair-fade";
  const eye = look.expression === "happy"
    ? "M101 91q8 8 16 0M143 91q8 8 16 0"
    : look.expression === "serious"
      ? "M101 92q8-5 16 0M143 92q8-5 16 0"
      : "M101 91q8-9 16 0M143 91q8-9 16 0";
  const mouth = look.expression === "happy"
    ? "M116 112q14 15 28 0"
    : look.expression === "serious"
      ? "M117 117h26"
      : look.expression === "surprised"
        ? "M124 111q6-5 12 0 0 15-12 0"
        : "M119 114q11 8 22 0";
  const sideEye = look.expression === "happy" ? "M119 90q7 6 14 0m17 0q5-3 9 0" : look.expression === "serious" ? "M119 91h14m17 0h9" : "M119 90q7-7 14 0m17 0q5-4 9 0";
  const sideMouth = look.expression === "happy" ? "M142 113q8 9 16-1" : look.expression === "serious" ? "M145 117h13" : look.expression === "surprised" ? "M149 112q8-5 8 4 0 8-8 0" : "M145 115q7 5 13 0";
  const faceShape = femme
    ? "M83 68q0-49 47-49t47 49q0 62-47 70Q83 130 83 68z"
    : "M82 64q0-45 48-45t48 45q0 55-22 66l-26 8-26-8Q82 120 82 64z";
  const bodyShape = side
    ? "M110 221h26l-3 116h-27zM132 221h21l19 116h-25z"
    : femme
      ? "M104 221h25l-8 119H94zM132 221h25l13 119h-28z"
      : "M98 221h30l-8 119H89zM134 221h30l12 119h-31z";
  const hairShape = isBob
    ? "M83 77Q72 31 105 19q48-17 72 22 12 20 1 61l-13 22-5-51q-26 8-47-10-11 20-29 24l-1 35-13-19z"
    : isKnots
      ? "M83 79Q74 35 103 21q44-19 71 15 20 25 6 57l-14 3-3-32q-23 13-48 1-13 17-28 15l-1 34-13-20z"
      : isBraids
        ? "M83 74Q77 31 106 19q43-17 68 13 19 24 6 55l-11-8-4 86-12-2-2-77q-24 8-44-7-12 16-23 14l-2 69-12 2-1-76-11-5z"
        : isCurls
          ? "M84 80Q68 65 78 48q-7-23 16-31 13-22 34-11 20-10 34 8 24 8 18 31 15 18-1 39l-13 1-2-39q-27 12-51-1-15 17-29 14z"
          : isFade
            ? "M84 71Q82 42 100 32q30-20 61 0 17 10 15 39l-14-7-3-19q-30 13-60 0l-2 23z"
            : "M83 72 91 33l16 15 9-30 15 27 19-28 8 31 16-16 4 43-22-17-20 17-22-19-20 20z";

  return <svg className={`avatar ${compact ? "avatar--compact" : ""}`} viewBox="0 0 260 420" role="img" aria-label={`${femme ? "Female" : "Male"} fashion avatar, ${look.view} view, ${look.expression} expression`}>
    <defs>
      <linearGradient id="skin-shade" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#ffffff" stopOpacity=".14"/><stop offset="1" stopColor="#2b1422" stopOpacity=".15"/></linearGradient>
      <linearGradient id="cloth-shade" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#ffffff" stopOpacity=".12"/><stop offset="1" stopColor="#180f23" stopOpacity=".18"/></linearGradient>
    </defs>
    <ellipse cx="130" cy="390" rx="66" ry="10" fill="#170F20" opacity=".24"/>
    <g className="layer-hair-back" fill={hairColor} stroke={line} strokeWidth="3.5" strokeLinejoin="round">
      {back && <path d={isBraids ? "M88 79Q80 29 111 19q39-15 63 18 14 21 3 55l-7 98h-14l-2-75H103l-2 75H87l-4-98z" : isKnots ? "M88 79Q80 29 111 19q39-15 63 18 14 21 3 55l-7 37-80 0-5-36z" : isFade ? "M88 75Q84 39 111 25q31-16 57 7 11 15 9 44l-9-5-4-26q-34 13-65 0l-3 30z" : "M88 79Q80 29 111 19q39-15 63 18 14 21 3 55l-7 37-80 0-5-36z"}/>}
      {!back && <path d={hairShape}/>}
      {isKnots && <><circle cx="94" cy="35" r="11"/><circle cx="112" cy="23" r="11"/><circle cx="133" cy="21" r="11"/><circle cx="154" cy="25" r="11"/><circle cx="170" cy="39" r="10"/></>}
      {(isCurls || isFade) && !back && <path d="M91 52q37-23 78-2M99 62q31-13 61-1" fill="none" stroke="#ffffff" strokeOpacity=".2" strokeWidth="2"/>}
    </g>
    <g className="layer-body" stroke={line} strokeWidth="3" strokeLinejoin="round">
      <path d={bodyShape} fill={look.skin}/>
      <path d={side ? "M103 144q-18 17-14 49l8 39q3 10 12 7l7-6-4-48 18-29z" : "M97 146 73 224q-7 19 7 24 13 3 18-12l28-64z"} fill={look.skin}/>
      <path d={side ? "M152 146q18 10 20 32l10 50q2 13-10 16l-8-8-3-46-20-24z" : "M163 146 187 224q7 19-7 24-13 3-18-12l-28-64z"} fill={look.skin}/>
      <path d="M91 211q18 7 36 1M136 212q19 6 34-1" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="2"/>
    </g>
    <g className="layer-shoes" stroke={line} strokeWidth="3.5" strokeLinejoin="round">
      <path d="M91 328h34l9 23q3 9-8 11H72q0-24 19-34zM137 328h34q20 10 20 34h-53q-10-2-8-11z" fill={shoes?.color ?? "#FFF4E6"}/>
      <path d="M75 350h54M134 350h53" stroke={shoes?.accent ?? "#A78BFA"} strokeWidth="4"/>
      <path d="M99 334l9 9m-3-10 9 9m35-8 9 8m-3-9 9 8" fill="none" stroke="#ffffff" strokeOpacity=".65" strokeWidth="2"/>
    </g>
    <g className="layer-bottom" stroke={line} strokeWidth="3.5" strokeLinejoin="round">
      {isSkirt
        ? <path d="M91 216h78l19 57H73z" fill={bottom?.color ?? "#E7688A"}/>
        : isShorts
          ? <path d="M88 211h84l-8 77h-32l-4-38-7 38H91z" fill={bottom?.color ?? "#424056"}/>
          : <path d={side ? "M103 211h61l8 126h-29l-11-75-2 75H99z" : femme ? "M91 211h78l-8 129h-31l-3-77-7 77H97z" : "M84 211h92l-8 129h-36l-3-77-8 77H89z"} fill={bottom?.color ?? "#4B4966"}/>}
      <path d={isSkirt ? "M82 239h112M88 248l12 23m12-25 5 29m18-29-2 29m18-29-7 27m21-25-10 23" : "M91 225h31m20 0h27"} fill="none" stroke={bottom?.accent ?? "#77748F"} strokeWidth="2.5" opacity=".8"/>
      {!isSkirt && !isShorts && <><path d={back ? "M96 232h19v18H96zm48 0h19v18h-19z" : "M93 253h19v18H92zm55 0h19v18h-20z"} fill={bottom?.accent ?? "#77748F"} opacity=".7"/><path d={back ? "M100 236h12m36 0h12" : "M96 257h13m43 0h13"} stroke="#ffffff" strokeOpacity=".38" strokeWidth="2"/></>}
    </g>
    <g className="layer-top" stroke={line} strokeWidth="3.5" strokeLinejoin="round">
      <path d={side ? "M109 145q22-12 46 0l20 66q-39 17-73 0z" : femme ? "M98 143q32-20 64 0l18 71q-49 17-98 0z" : "M91 141q39-24 78 0l23 73q-62 18-124 0z"} fill={top?.color ?? "#A78BFA"}/>
      <path d={back ? "M112 145q18 18 36 0" : "M111 145q19 18 38 0"} fill="none" stroke={top?.accent ?? "#DCD0FF"} strokeWidth="3"/>
      {isHoodie && <><path d="M111 144q-8-20 19-24 27 4 19 24" fill={top?.color ?? "#FF8A5B"} stroke={line}/><path d="M109 149l-8 20m51-20 8 20M130 181v21" fill="none" stroke={top?.accent ?? "#FFC09E"} strokeWidth="2.5"/><path d="M108 194q22 9 44 0" fill="none" stroke={line} strokeWidth="2"/></>}
      {isJacket && <><path d="m130 151 0 59m-28-13 12 3m32-3-12 3" fill="none" stroke={top?.accent ?? "#FFF4E6"} strokeWidth="3"/><path d="M99 180h16m28 0h16" stroke={line} strokeWidth="2"/></>}
      {back ? <path d="M130 157v47m-25-40h12m14 0h12" fill="none" stroke={top?.accent ?? "#DCD0FF"} strokeWidth="2.5" opacity=".8"/> : !isHoodie && !isJacket && <path d="M104 185h52" stroke={top?.accent ?? "#DCD0FF"} strokeWidth="3" opacity=".75"/>}
      <path d="M97 207q33 7 66 0" fill="none" stroke="url(#cloth-shade)" strokeWidth="10"/>
    </g>
    <g className="layer-face" stroke={line} strokeWidth="3.5" strokeLinejoin="round">
      <path d="M112 117h36v34q-18 15-36 0z" fill={look.skin}/>
      <path d={back
        ? faceShape
        : side
          ? "M111 26q34-9 49 14 10 14 4 38l-8 31q-9 22-30 25l-21-19-8-48q-4-29 14-41z"
          : faceShape} fill={look.skin}/>
      <path d={side ? "M111 26q34-9 49 14 10 14 4 38l-8 31q-9 22-30 25l-21-19-8-48q-4-29 14-41z" : faceShape} fill="url(#skin-shade)" stroke="none"/>
      {!back && !side && <><path d={eye} fill="none" strokeWidth="3.3" strokeLinecap="round"/>{look.expression !== "happy" && <><ellipse cx="109" cy="94" rx="2.5" ry="3.5" fill={line} stroke="none"/><ellipse cx="151" cy="94" rx="2.5" ry="3.5" fill={line} stroke="none"/></>}<path d={mouth} fill={look.expression === "surprised" ? "#9D5361" : "none"} stroke="#9D5361" strokeWidth="2.7" strokeLinecap="round"/></>}
      {side && !back && <><path d={sideEye} fill="none" strokeWidth="3" strokeLinecap="round"/><path d="m169 99 10 5-10 5" fill="none" strokeWidth="2.5"/><path d={sideMouth} fill={look.expression === "surprised" ? "#9D5361" : "none"} stroke="#9D5361" strokeWidth="2.5"/></>}
    </g>
    {back && <g className="layer-back-hair-cap" fill={hairColor} stroke={line} strokeWidth="3.5" strokeLinejoin="round">
      <path d={isBraids ? "M84 67q0-48 46-48t46 48l-8 74h-13l-2-58q-23 13-47 0l-2 58H91z" : isKnots ? "M83 68q0-49 47-49t47 49l-6 63h-14l-2-47q-24 13-50 0l-2 47H89z" : isFade ? "M85 65q3-43 45-46 44 2 46 46l-9-5-4-25q-32 13-64 0l-4 26z" : "M83 68q0-49 47-49t47 49l-5 60h-14l-3-45q-25 12-51 0l-3 45H88z"}/>
      {isKnots && <><circle cx="94" cy="35" r="11"/><circle cx="112" cy="23" r="11"/><circle cx="133" cy="21" r="11"/><circle cx="154" cy="25" r="11"/><circle cx="170" cy="39" r="10"/></>}
    </g>}
    {!back && <g className="layer-hair-front" fill={hairColor} stroke={line} strokeWidth="3.5" strokeLinejoin="round">
      {!isFade && !isBraids && <path d={isBob ? "M84 70Q88 28 127 23q40 0 47 35-20-9-33-19-19 18-40 20l-8 19z" : isKnots ? "M84 67Q88 31 120 25q36-4 51 24-18-5-34-17-20 17-43 19l-9 19z" : isCurls ? "M84 70q-9-20 7-30-4-17 16-20 9-16 25-8 15-9 25 6 21 1 17 19 15 11 2 32-19-8-26-19-18 15-42 12-12 14-24 13z" : "M84 68l8-40 17 21 10-31 14 27 20-28 7 32 19-15 2 33-23-18-20 18-22-20-20 18z"}/>}
      {isBraids && <path d="M86 56q20-29 43-27 24-4 42 23l-11 11q-14-20-31-18-20-3-34 22z"/>}
      {(isBob || isBraids) && <path d={isBob ? "M86 68l-1 47m86-50 2 49" : "M88 71l-1 78m82-75 3 74"} fill="none" stroke={hairColor} strokeWidth="10" strokeLinecap="round"/>}
    </g>}
    <g className="layer-accessories" strokeLinejoin="round">
      {bag && bag.id !== "bag-none" && <g stroke={line} strokeWidth="3.5"><path d="M163 158q-38 28-21 83" fill="none" stroke="#251c30" strokeWidth="7"/><path d="M163 158q-38 28-21 83" fill="none" stroke={bag.color} strokeWidth="3"/><rect x="128" y="229" width="38" height="43" rx="7" fill={bag.color}/><path d="M136 238h22m-20 8h18" stroke={bag.accent ?? "#DCD0FF"} strokeWidth="2.5"/></g>}
      {chain && chain.id !== "chain-none" && !back && <g fill="none" stroke={chain.color} strokeWidth="4"><path d="M112 146q18 29 36 0"/><path d="M127 164l3 5 3-5-3-5z" fill={chain.accent ?? chain.color} strokeWidth="2"/></g>}
      {earrings && earrings.id !== "earrings-none" && !back && <g fill="none" stroke={earrings.color} strokeWidth="3"><circle cx={side ? 163 : 84} cy="91" r="4"/><circle cx={side ? 163 : 176} cy="91" r="4"/></g>}
      {glasses && glasses.id !== "glasses-none" && !back && !side && <g fill={glasses.color} stroke={glasses.accent ?? line} strokeWidth="2.5"><path d="M92 84h31l-2 16q-12 7-24 0zm45 0h31l-5 16q-12 7-24 0z" opacity=".85"/><path d="M123 89h14m-44 0-5-2m82 2 5-2" fill="none"/></g>}
      {watch && watch.id !== "watch-none" && <g stroke={line} strokeWidth="2.5"><path d="M79 222v15m7-16v15" stroke={watch.color} strokeWidth="4"/><rect x="77" y="227" width="11" height="13" rx="3" fill={watch.color}/><path d="M80 231h5" stroke={watch.accent ?? "#72E0C1"} strokeWidth="1.5"/></g>}
    </g>
  </svg>;
}
