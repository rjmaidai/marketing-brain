"use client";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/**
 * Eleganter animierter Berater-Avatar für den Fallback-Modus
 * (wenn kein HeyGen-Live-Gesicht verfügbar ist). Reagiert sichtbar auf
 * die vier Zustände: ruhig, zuhörend, denkend, sprechend.
 */
export function AdvisorOrb({ state }: { state: OrbState }) {
  const speaking = state === "speaking";
  const listening = state === "listening";
  const thinking = state === "thinking";

  // Sprech-Balken: statische Höhen, per Animation-Delay versetzt.
  const bars = [14, 26, 40, 30, 18];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        viewBox="0 0 200 200"
        className="h-full max-h-[420px] w-auto"
        role="img"
        aria-label="Berater-Avatar"
      >
        <defs>
          <radialGradient id="orbFill" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#3f5c9e" />
            <stop offset="55%" stopColor="#1E3260" />
            <stop offset="100%" stopColor="#0D1628" />
          </radialGradient>
          <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#C9A84C" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="orbStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C9A84C" />
            <stop offset="100%" stopColor="#7d6a2f" />
          </linearGradient>
        </defs>

        {/* Aussen-Glow */}
        <circle cx="100" cy="100" r="90" fill="url(#orbGlow)" />

        {/* Ausbreitende Ringe, wenn aktiv */}
        {(speaking || listening) && (
          <>
            <circle
              className="orb-ring orb-ring-active"
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="url(#orbStroke)"
              strokeWidth="1.5"
              style={{ animationDelay: "0s" }}
            />
            <circle
              className="orb-ring orb-ring-active"
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="url(#orbStroke)"
              strokeWidth="1.5"
              style={{ animationDelay: "0.9s" }}
            />
          </>
        )}

        {/* Rotierender Halo-Ring */}
        <g className="orb-halo">
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="none"
            stroke="url(#orbStroke)"
            strokeWidth="1"
            strokeDasharray="3 10"
            opacity="0.5"
          />
        </g>

        {/* Kern-Kugel */}
        <circle
          className={
            speaking
              ? "orb-core orb-core-speaking"
              : listening
                ? "orb-core orb-listening"
                : "orb-core"
          }
          cx="100"
          cy="100"
          r="58"
          fill="url(#orbFill)"
          stroke="url(#orbStroke)"
          strokeWidth="1.5"
        />

        {/* Innen-Inhalt je nach Zustand */}
        {speaking ? (
          <g>
            {bars.map((h, i) => (
              <rect
                key={i}
                className="orb-bar orb-bar-active"
                x={100 - 26 + i * 12}
                y={100 - h / 2}
                width="6"
                height={h}
                rx="3"
                fill="#C9A84C"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </g>
        ) : thinking ? (
          <g>
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={100 - 16 + i * 16}
                cy="100"
                r="5"
                fill="#C9A84C"
                opacity="0.85"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;1;0.2"
                  dur="1.2s"
                  begin={`${i * 0.2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>
        ) : listening ? (
          <g>
            <circle cx="100" cy="100" r="10" fill="#C9A84C" opacity="0.9" />
            <circle
              cx="100"
              cy="100"
              r="20"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="1.5"
              opacity="0.5"
            />
          </g>
        ) : (
          <circle cx="100" cy="100" r="8" fill="#C9A84C" opacity="0.7" />
        )}
      </svg>
    </div>
  );
}
