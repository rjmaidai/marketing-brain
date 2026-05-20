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

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function HeadAvatar({
  id,
  name,
  color,
  size = "md",
  isSpeaking,
  isMuted,
}: HeadAvatarProps) {
  const px = SIZE_PX[size];
  const seed = hashSeed(id);

  // Small per-head variation so heads look distinct
  const eyeShape = seed % 3; // 0: round, 1: tall, 2: wide
  const browTilt = ((seed >> 3) % 3) - 1; // -1, 0, 1
  const browOffset = browTilt * 1.2;
  const hairStyle = seed % 4; // 0: none, 1: tuft, 2: side, 3: short
  const accessoryStyle = (seed >> 5) % 5; // 0: none, 1: glasses, 2: beard, 3: moustache, 4: earring

  const eyeRX = eyeShape === 2 ? 2.6 : 2;
  const eyeRY = eyeShape === 1 ? 2.8 : 2;

  return (
    <div
      className={`ha-root relative inline-flex items-center justify-center rounded-full ${
        isSpeaking ? "ha-speaking" : ""
      } ${isMuted ? "opacity-40 saturate-50" : ""}`}
      style={{
        width: px,
        height: px,
        background: `radial-gradient(circle at 35% 30%, ${color} 0%, ${shade(
          color,
          -0.25,
        )} 100%)`,
        boxShadow: isSpeaking
          ? `0 0 0 2px ${color}cc, 0 0 22px -2px ${color}bb`
          : `0 0 0 1px ${color}55, 0 4px 14px -8px ${color}`,
        transition: "box-shadow 220ms ease, opacity 220ms ease",
      }}
      aria-label={name ?? id}
      title={name ? `${id} · ${name}` : id}
    >
      <svg
        viewBox="0 0 40 40"
        width="100%"
        height="100%"
        aria-hidden
        className="absolute inset-0"
      >
        {/* Hair */}
        {hairStyle === 1 && (
          <path
            d="M11 11 Q20 4 29 11 L28 14 Q20 9 12 14 Z"
            fill="#0c1424"
            opacity="0.85"
          />
        )}
        {hairStyle === 2 && (
          <path
            d="M9 13 Q11 7 22 8 L26 12 Q18 10 11 14 Z"
            fill="#0c1424"
            opacity="0.85"
          />
        )}
        {hairStyle === 3 && (
          <path
            d="M10 13 Q15 6 30 11 L28 14 Q20 11 11 14 Z"
            fill="#0c1424"
            opacity="0.7"
          />
        )}

        {/* Brows */}
        <line
          x1="10.5"
          y1={13.5 + browOffset}
          x2="16"
          y2={13.5 - browOffset}
          stroke="#0c1424"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.85"
        />
        <line
          x1="24"
          y1={13.5 - browOffset}
          x2="29.5"
          y2={13.5 + browOffset}
          stroke="#0c1424"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Eyes */}
        <ellipse
          className="ha-eye"
          cx="13.5"
          cy="17.5"
          rx={eyeRX}
          ry={eyeRY}
          fill="#0c1424"
        />
        <ellipse
          className="ha-eye"
          cx="26.5"
          cy="17.5"
          rx={eyeRX}
          ry={eyeRY}
          fill="#0c1424"
        />

        {/* Glasses */}
        {accessoryStyle === 1 && (
          <g
            fill="none"
            stroke="#0c1424"
            strokeWidth="1"
            opacity="0.85"
          >
            <circle cx="13.5" cy="17.5" r="3.6" />
            <circle cx="26.5" cy="17.5" r="3.6" />
            <line x1="17.1" y1="17.5" x2="22.9" y2="17.5" />
          </g>
        )}

        {/* Moustache */}
        {accessoryStyle === 3 && (
          <path
            d="M14 25 Q17 23 20 25 Q23 23 26 25"
            stroke="#0c1424"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Earring */}
        {accessoryStyle === 4 && (
          <circle cx="32" cy="22" r="1.1" fill="#0c1424" opacity="0.85" />
        )}

        {/* Mouth */}
        <g style={{ transformOrigin: "20px 27.5px" }}>
          <rect
            className={isSpeaking ? "ha-mouth-talking" : "ha-mouth-idle"}
            x="15"
            y="25.8"
            width="10"
            height="3.4"
            rx="1.7"
            fill="#0c1424"
          />
        </g>

        {/* Beard (drawn over mouth area but below chin curve) */}
        {accessoryStyle === 2 && (
          <path
            d="M11 28 Q20 36 29 28 Q26 32 20 33 Q14 32 11 28 Z"
            fill="#0c1424"
            opacity="0.55"
          />
        )}
      </svg>
    </div>
  );
}

function shade(hex: string, percent: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + 255 * percent)));
  return `#${adj(r).toString(16).padStart(2, "0")}${adj(g)
    .toString(16)
    .padStart(2, "0")}${adj(b).toString(16).padStart(2, "0")}`;
}
