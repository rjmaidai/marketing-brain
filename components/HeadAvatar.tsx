"use client";

interface HeadAvatarProps {
  id: string;
  name?: string;
  color: string;
  size?: "sm" | "md" | "lg";
  isSpeaking?: boolean;
  isMuted?: boolean;
}

const SIZE_PX: Record<"sm" | "md" | "lg", number> = {
  sm: 38,
  md: 48,
  lg: 64,
};

const HEAD_VISUALS: Record<string, {
  skinTone: string; skinMid: string; skinDark: string;
  hairColor: string; hairStyle: "short" | "medium" | "long" | "bald" | "curly" | "tied";
  eyeColor: string;
  hasBeard: boolean; beardColor?: string;
  hasGlasses: boolean;
  gender: "m" | "f";
  age: "young" | "mid" | "senior";
}> = {
  S1: { skinTone:"#f5d5b0",skinMid:"#e8a870",skinDark:"#c07840",hairColor:"#2a1a0a",hairStyle:"medium",eyeColor:"#5a7a40",hasBeard:false,hasGlasses:false,gender:"f",age:"mid" },
  S2: { skinTone:"#f0d0a0",skinMid:"#d8a060",skinDark:"#b07030",hairColor:"#c8c8c8",hairStyle:"short",eyeColor:"#3a3a5a",hasBeard:false,hasGlasses:true,gender:"m",age:"senior" },
  S3: { skinTone:"#fde8c8",skinMid:"#e8b880",skinDark:"#c08050",hairColor:"#909090",hairStyle:"short",eyeColor:"#604020",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  S4: { skinTone:"#ffe0c0",skinMid:"#e8b070",skinDark:"#c07840",hairColor:"#909090",hairStyle:"short",eyeColor:"#3a5030",hasBeard:false,hasGlasses:true,gender:"m",age:"senior" },
  S5: { skinTone:"#fde8cc",skinMid:"#e0b070",skinDark:"#b87840",hairColor:"#b8b8b8",hairStyle:"short",eyeColor:"#404040",hasBeard:false,hasGlasses:true,gender:"m",age:"senior" },
  A1: { skinTone:"#f5d5a0",skinMid:"#d8a058",skinDark:"#a87030",hairColor:"#909090",hairStyle:"short",eyeColor:"#503020",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  A2: { skinTone:"#ffe8c8",skinMid:"#e8b878",skinDark:"#c08848",hairColor:"#1a1010",hairStyle:"short",eyeColor:"#3a2a1a",hasBeard:true,beardColor:"#1a1010",hasGlasses:false,gender:"m",age:"mid" },
  A3: { skinTone:"#fde0b8",skinMid:"#e0a860",skinDark:"#b87838",hairColor:"#909090",hairStyle:"bald",eyeColor:"#2a2a2a",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  A4: { skinTone:"#f8e0b8",skinMid:"#e0a858",skinDark:"#b07030",hairColor:"#808080",hairStyle:"short",eyeColor:"#4a4a3a",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  A5: { skinTone:"#fde8d0",skinMid:"#e8b878",skinDark:"#c07848",hairColor:"#4a3020",hairStyle:"long",eyeColor:"#5a4030",hasBeard:false,hasGlasses:false,gender:"f",age:"mid" },
  D1: { skinTone:"#f0d0a0",skinMid:"#d8a060",skinDark:"#b07030",hairColor:"#1a1a1a",hairStyle:"bald",eyeColor:"#3a3020",hasBeard:false,hasGlasses:true,gender:"m",age:"mid" },
  D2: { skinTone:"#ffe8c8",skinMid:"#e8b878",skinDark:"#c08848",hairColor:"#3a2a10",hairStyle:"short",eyeColor:"#3a4a2a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  D3: { skinTone:"#f0d8a0",skinMid:"#d8a858",skinDark:"#a87030",hairColor:"#0a0a0a",hairStyle:"short",eyeColor:"#1a1a1a",hasBeard:false,hasGlasses:false,gender:"m",age:"young" },
  D4: { skinTone:"#fde0c0",skinMid:"#e0a868",skinDark:"#b07840",hairColor:"#2a1a0a",hairStyle:"short",eyeColor:"#4a3020",hasBeard:true,beardColor:"#2a1a0a",hasGlasses:false,gender:"m",age:"mid" },
  D5: { skinTone:"#ffe0c0",skinMid:"#e8b070",skinDark:"#c07840",hairColor:"#6a4020",hairStyle:"curly",eyeColor:"#4a3020",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  C1: { skinTone:"#fde8c0",skinMid:"#e0a858",skinDark:"#b07030",hairColor:"#1a1a1a",hairStyle:"short",eyeColor:"#2a2a2a",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  C2: { skinTone:"#ffe0b8",skinMid:"#e0a858",skinDark:"#b07030",hairColor:"#0a0808",hairStyle:"bald",eyeColor:"#1a1a1a",hasBeard:true,beardColor:"#0a0808",hasGlasses:false,gender:"m",age:"senior" },
  C3: { skinTone:"#f8e8c8",skinMid:"#e8b870",skinDark:"#c08840",hairColor:"#4a3818",hairStyle:"short",eyeColor:"#3a3020",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  C4: { skinTone:"#c8956c",skinMid:"#a87040",skinDark:"#885020",hairColor:"#0a0a0a",hairStyle:"short",eyeColor:"#1a1a1a",hasBeard:true,beardColor:"#0a0a0a",hasGlasses:false,gender:"m",age:"young" },
  C5: { skinTone:"#fde0c0",skinMid:"#e0a860",skinDark:"#b07030",hairColor:"#5a3018",hairStyle:"short",eyeColor:"#4a3020",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  R1: { skinTone:"#fde8c8",skinMid:"#e8b878",skinDark:"#c08848",hairColor:"#808080",hairStyle:"short",eyeColor:"#3a3a3a",hasBeard:false,hasGlasses:true,gender:"m",age:"senior" },
  R2: { skinTone:"#ffe0c0",skinMid:"#e8b068",skinDark:"#c07838",hairColor:"#3a2810",hairStyle:"short",eyeColor:"#3a3020",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  R3: { skinTone:"#f8e8d0",skinMid:"#e0b070",skinDark:"#b07838",hairColor:"#3a3a3a",hairStyle:"medium",eyeColor:"#3a3a3a",hasBeard:true,beardColor:"#3a3a3a",hasGlasses:false,gender:"m",age:"mid" },
  R4: { skinTone:"#fde8c8",skinMid:"#e8b878",skinDark:"#c08848",hairColor:"#1a1a1a",hairStyle:"short",eyeColor:"#2a2a2a",hasBeard:false,hasGlasses:true,gender:"m",age:"young" },
  R5: { skinTone:"#ffe0c0",skinMid:"#e8b068",skinDark:"#c07838",hairColor:"#6a4820",hairStyle:"medium",eyeColor:"#4a3820",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  "01": { skinTone:"#f0d8b0",skinMid:"#d8a868",skinDark:"#b07838",hairColor:"#1a1010",hairStyle:"short",eyeColor:"#2a1a0a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  "02": { skinTone:"#fde8c8",skinMid:"#e8b878",skinDark:"#c08848",hairColor:"#808080",hairStyle:"short",eyeColor:"#3a3a3a",hasBeard:false,hasGlasses:true,gender:"m",age:"senior" },
  "03": { skinTone:"#f5e0c0",skinMid:"#e0b060",skinDark:"#b07830",hairColor:"#2a2010",hairStyle:"short",eyeColor:"#3a3020",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  "04": { skinTone:"#fde8d0",skinMid:"#e0b070",skinDark:"#b07838",hairColor:"#1a1a1a",hairStyle:"short",eyeColor:"#2a2a2a",hasBeard:false,hasGlasses:true,gender:"m",age:"senior" },
  "05": { skinTone:"#ffe8c0",skinMid:"#e8b870",skinDark:"#c08840",hairColor:"#d0b080",hairStyle:"medium",eyeColor:"#5a4a30",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  ST1: { skinTone:"#fde0c0",skinMid:"#e0a860",skinDark:"#b07030",hairColor:"#1a1a1a",hairStyle:"short",eyeColor:"#2a2a2a",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  ST2: { skinTone:"#f8e8c8",skinMid:"#e8b870",skinDark:"#c08840",hairColor:"#6a4820",hairStyle:"long",eyeColor:"#4a3820",hasBeard:true,beardColor:"#4a2810",hasGlasses:false,gender:"m",age:"senior" },
  ST3: { skinTone:"#ffe8d0",skinMid:"#e8b870",skinDark:"#c08840",hairColor:"#a0a0a0",hairStyle:"short",eyeColor:"#4a4a4a",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  ST4: { skinTone:"#fde8c8",skinMid:"#e8b878",skinDark:"#c08848",hairColor:"#3a2a10",hairStyle:"short",eyeColor:"#3a2a1a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  ST5: { skinTone:"#ffe0c0",skinMid:"#e0a860",skinDark:"#b07030",hairColor:"#2a2010",hairStyle:"medium",eyeColor:"#3a2a1a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  K1: { skinTone:"#fde8c0",skinMid:"#e0a858",skinDark:"#b07030",hairColor:"#808080",hairStyle:"short",eyeColor:"#3a3030",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  K2: { skinTone:"#ffe0c0",skinMid:"#e8b068",skinDark:"#c07838",hairColor:"#1a1a1a",hairStyle:"short",eyeColor:"#2a2a2a",hasBeard:false,hasGlasses:true,gender:"m",age:"mid" },
  K3: { skinTone:"#fde8c8",skinMid:"#e8b878",skinDark:"#c08848",hairColor:"#2a2010",hairStyle:"short",eyeColor:"#3a2a1a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  K4: { skinTone:"#e0c090",skinMid:"#c09050",skinDark:"#a07030",hairColor:"#0a0a0a",hairStyle:"short",eyeColor:"#1a1a1a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  K5: { skinTone:"#fde8c8",skinMid:"#e8b878",skinDark:"#c08848",hairColor:"#3a3a3a",hairStyle:"short",eyeColor:"#3a3a3a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  I1: { skinTone:"#ffe0c0",skinMid:"#e8b068",skinDark:"#c07838",hairColor:"#909090",hairStyle:"short",eyeColor:"#2a2a3a",hasBeard:false,hasGlasses:false,gender:"m",age:"senior" },
  I2: { skinTone:"#fde8c0",skinMid:"#e0a858",skinDark:"#b07030",hairColor:"#4a3820",hairStyle:"medium",eyeColor:"#3a2a1a",hasBeard:true,beardColor:"#3a2a10",hasGlasses:false,gender:"m",age:"mid" },
  I3: { skinTone:"#fde0c0",skinMid:"#e0a860",skinDark:"#b07030",hairColor:"#2a2010",hairStyle:"short",eyeColor:"#3a2a1a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  I4: { skinTone:"#f0d8b0",skinMid:"#d8a868",skinDark:"#b07838",hairColor:"#1a1010",hairStyle:"short",eyeColor:"#2a1a0a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
  I5: { skinTone:"#fde8c8",skinMid:"#e8b878",skinDark:"#c08848",hairColor:"#2a1a0a",hairStyle:"short",eyeColor:"#3a2a1a",hasBeard:false,hasGlasses:false,gender:"m",age:"mid" },
};

const DEFAULT_VISUAL = {
  skinTone:"#fde8c8", skinMid:"#e8b878", skinDark:"#c08848",
  hairColor:"#2a2010", hairStyle:"short" as const, eyeColor:"#3a2a1a",
  hasBeard:false, hasGlasses:false, gender:"m" as const, age:"mid" as const
};

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#",""), 16);
  const r = Math.min(255, Math.max(0, ((n>>16)&0xff) + Math.round(amt*255)));
  const g = Math.min(255, Math.max(0, ((n>>8)&0xff) + Math.round(amt*255)));
  const b = Math.min(255, Math.max(0, (n&0xff) + Math.round(amt*255)));
  return "#" + r.toString(16).padStart(2,"0") + g.toString(16).padStart(2,"0") + b.toString(16).padStart(2,"0");
}

export function HeadAvatar({ id, name, color, size = "md", isSpeaking, isMuted }: HeadAvatarProps) {
  const px = SIZE_PX[size];
  const v = HEAD_VISUALS[id] ?? DEFAULT_VISUAL;

  const speakingShadow = "0 0 0 2px " + color + "cc, 0 0 22px -2px " + color + "bb";
  const idleShadow = "0 0 0 1px " + color + "55, 0 4px 14px -8px " + color;
  const rootClass = "ha-root relative inline-flex items-center justify-center rounded-full overflow-hidden" +
    (isSpeaking ? " ha-speaking" : "") +
    (isMuted ? " opacity-40 saturate-50" : "");
  const titleAttr = name ? (id + " - " + name) : id;

  return (
    <div
      className={rootClass}
      style={{
        width: px,
        height: px,
        boxShadow: isSpeaking ? speakingShadow : idleShadow,
        transition: "box-shadow 220ms ease, opacity 220ms ease",
      }}
      aria-label={name ?? id}
      title={titleAttr}
    >
      <svg viewBox="0 0 100 100" width={px} height={px} aria-hidden>
        <defs>
          <radialGradient id={"skin-" + id} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor={v.skinTone}/>
            <stop offset="55%" stopColor={v.skinMid}/>
            <stop offset="100%" stopColor={v.skinDark}/>
          </radialGradient>
          <radialGradient id={"hair-" + id} cx="50%" cy="20%" r="70%">
            <stop offset="0%" stopColor={shade(v.hairColor, 0.15)}/>
            <stop offset="100%" stopColor={v.hairColor}/>
          </radialGradient>
          <radialGradient id={"iris-" + id} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={shade(v.eyeColor, 0.3)}/>
            <stop offset="70%" stopColor={v.eyeColor}/>
            <stop offset="100%" stopColor={shade(v.eyeColor, -0.2)}/>
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill="#1a1a2a"/>
        <rect x="36" y="82" width="28" height="20" rx="4" fill={"url(#skin-" + id + ")"}/>
        <rect x="36" y="82" width="28" height="8" fill={v.skinDark} opacity="0.3"/>
        <ellipse cx="50" cy="50" rx="34" ry="38" fill={"url(#skin-" + id + ")"}/>
        <ellipse cx="22" cy="58" rx="8" ry="6" fill="#e07060" opacity="0.12"/>
        <ellipse cx="78" cy="58" rx="8" ry="6" fill="#e07060" opacity="0.12"/>

        {v.hairStyle === "short" && (
          <path d="M16 44 Q16 14 50 12 Q84 14 84 44 L80 36 Q75 18 50 16 Q25 18 20 36 Z"
            fill={"url(#hair-" + id + ")"}/>
        )}
        {v.hairStyle === "medium" && (
          <>
            <path d="M16 44 Q16 14 50 12 Q84 14 84 44 L80 36 Q75 18 50 16 Q25 18 20 36 Z"
              fill={"url(#hair-" + id + ")"}/>
            <path d="M16 44 Q14 55 16 68 Q18 58 20 50 Z" fill={"url(#hair-" + id + ")"}/>
            <path d="M84 44 Q86 55 84 68 Q82 58 80 50 Z" fill={"url(#hair-" + id + ")"}/>
          </>
        )}
        {v.hairStyle === "long" && (
          <>
            <path d="M16 44 Q16 14 50 12 Q84 14 84 44 L80 36 Q75 18 50 16 Q25 18 20 36 Z"
              fill={"url(#hair-" + id + ")"}/>
            <path d="M16 44 Q12 60 14 85 Q17 70 20 55 Z" fill={"url(#hair-" + id + ")"}/>
            <path d="M84 44 Q88 60 86 85 Q83 70 80 55 Z" fill={"url(#hair-" + id + ")"}/>
          </>
        )}
        {v.hairStyle === "curly" && (
          <path d="M16 44 Q14 28 24 18 Q32 10 50 12 Q68 10 76 18 Q86 28 84 44 Q82 36 78 30 Q70 18 50 16 Q30 18 22 30 Q18 36 16 44 Z"
            fill={"url(#hair-" + id + ")"}/>
        )}
        {v.hairStyle === "tied" && (
          <>
            <path d="M16 44 Q16 14 50 12 Q84 14 84 44 L80 36 Q75 18 50 16 Q25 18 20 36 Z"
              fill={"url(#hair-" + id + ")"}/>
            <ellipse cx="50" cy="12" rx="6" ry="5" fill={v.hairColor}/>
            <rect x="47" y="8" width="6" height="8" rx="2" fill={v.hairColor}/>
          </>
        )}

        <ellipse cx="16" cy="54" rx="5" ry="8" fill={"url(#skin-" + id + ")"}/>
        <ellipse cx="84" cy="54" rx="5" ry="8" fill={"url(#skin-" + id + ")"}/>
        <ellipse cx="16" cy="54" rx="3" ry="5" fill={v.skinDark} opacity="0.4"/>

        {v.age === "senior" ? (
          <>
            <path d="M25 38 Q31 35 39 38" stroke={v.hairColor} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9"/>
            <path d="M61 38 Q69 35 75 38" stroke={v.hairColor} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9"/>
          </>
        ) : (
          <>
            <path d="M25 38 Q32 34 39 37" stroke={v.hairColor} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.95"/>
            <path d="M61 37 Q68 34 75 38" stroke={v.hairColor} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.95"/>
          </>
        )}

        <ellipse cx="32" cy="48" rx="9" ry="7" fill="#f8f6f0" opacity="0.95"/>
        <ellipse cx="68" cy="48" rx="9" ry="7" fill="#f8f6f0" opacity="0.95"/>
        <path d="M23 45 Q32 42 41 45" stroke={v.hairColor} strokeWidth="1.2" fill="none" opacity="0.6"/>
        <path d="M59 45 Q68 42 77 45" stroke={v.hairColor} strokeWidth="1.2" fill="none" opacity="0.6"/>

        <circle cx="32" cy="48" r="5" fill={"url(#iris-" + id + ")"}/>
        <circle cx="68" cy="48" r="5" fill={"url(#iris-" + id + ")"}/>
        <circle cx="32" cy="48" r="2.5" fill="#0d0d0d"/>
        <circle cx="68" cy="48" r="2.5" fill="#0d0d0d"/>
        <circle cx="34" cy="46.5" r="1.4" fill="white" opacity="0.85"/>
        <circle cx="70" cy="46.5" r="1.4" fill="white" opacity="0.85"/>

        {v.hasGlasses && (
          <g opacity="0.85">
            <rect x="22" y="43" width="20" height="12" rx="4" fill="none" stroke="#2a2a2a" strokeWidth="1.5"/>
            <rect x="58" y="43" width="20" height="12" rx="4" fill="none" stroke="#2a2a2a" strokeWidth="1.5"/>
            <line x1="42" y1="49" x2="58" y2="49" stroke="#2a2a2a" strokeWidth="1.5"/>
            <line x1="16" y1="47" x2="22" y2="47" stroke="#2a2a2a" strokeWidth="1.5"/>
            <line x1="78" y1="47" x2="84" y2="47" stroke="#2a2a2a" strokeWidth="1.5"/>
          </g>
        )}

        <path d="M46 55 Q50 64 54 55" stroke={v.skinDark} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7"/>
        <ellipse cx="48" cy="63" rx="3" ry="2" fill={v.skinDark} opacity="0.25"/>
        <ellipse cx="52" cy="63" rx="3" ry="2" fill={v.skinDark} opacity="0.25"/>

        <path d={"M37 73 Q50 70 63 73"} stroke={shade(v.skinDark, -0.1)} strokeWidth="1.2" fill={shade(v.skinMid, -0.05)}/>
        <path d={"M37 73 Q50 78 63 73"} stroke={shade(v.skinDark, -0.15)} strokeWidth="1" fill={shade(v.skinDark, 0.05)} opacity="0.8"/>

        {v.hasBeard && (
          <path d="M22 68 Q50 90 78 68 Q75 82 50 88 Q25 82 22 68 Z"
            fill={v.beardColor ?? v.hairColor} opacity="0.7"/>
        )}

        {v.age === "senior" && (
          <g opacity="0.2" stroke={v.skinDark} strokeWidth="0.8" fill="none">
            <path d="M22 52 Q20 56 22 60"/>
            <path d="M40 60 Q38 63 40 66"/>
            <path d="M60 60 Q62 63 60 66"/>
          </g>
        )}

        <ellipse cx="50" cy="50" rx="34" ry="38" fill="none" stroke={color} strokeWidth="2" opacity="0.5"/>
      </svg>
    </div>
  );
}
