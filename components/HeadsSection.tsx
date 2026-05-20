"use client";
import { useState } from "react";
import { HEADS } from "@/lib/heads";
import { SEGMENTS } from "@/lib/segments";
import { HeadAvatar } from "@/components/HeadAvatar";

const SEGMENT_IDS = Object.keys(SEGMENTS) as (keyof typeof SEGMENTS)[];

export function HeadsSection() {
    const [openSegment, setOpenSegment] = useState<string | null>(null);

  const toggle = (seg: string) =>
        setOpenSegment((prev) => (prev === seg ? null : seg));

  return (
        <section className="mt-16 border-t border-white/10 pt-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold mb-2">
                      Die 45 Köpfe
              </p>p>
              <p className="text-sm text-muted mb-8 max-w-lg">
                      9 Segmente. Je 5 Experten. Klick auf ein Segment um die Köpfe zu sehen.
              </p>p>
        
          {/* Segment buttons */}
              <div className="flex flex-wrap gap-2 mb-8">
                {SEGMENT_IDS.map((seg) => {
                    const s = SEGMENTS[seg];
                    const isOpen = openSegment === seg;
                    return (
                                  <button
                                                  key={seg}
                                                  onClick={() => toggle(seg)}
                                                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all duration-200"
                                                  style={{
                                                                    borderColor: s.color,
                                                                    color: isOpen ? "#fff" : s.color,
                                                                    background: isOpen ? s.color + "33" : "transparent",
                                                                    boxShadow: isOpen ? `0 0 12px ${s.color}44` : "none",
                                                  }}
                                                >
                                                <span
                                                                  className="inline-block w-2 h-2 rounded-full"
                                                                  style={{ background: s.color }}
                                                                />
                                    {seg}
                                                <span className="opacity-50 ml-1">{isOpen ? "▲" : "▼"}</span>
                                  </button>button>
                                );
        })}
              </div>div>
        
          {/* Open segment panel */}
          {openSegment && (() => {
                  const seg = SEGMENTS[openSegment as keyof typeof SEGMENTS];
                  const heads = HEADS.filter((h) => h.segment === openSegment);
                  return (
                              <div
                                            className="rounded-xl border p-6 mb-6 transition-all duration-300"
                                            style={{ borderColor: seg.color + "44", background: seg.color + "0a" }}
                                          >
                                          <p className="text-[10px] uppercase tracking-widest mb-5 opacity-40">
                                            {seg.description}
                                          </p>p>
                                          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                            {heads.map((h) => (
                                                            <div
                                                                                key={h.id}
                                                                                className="flex flex-col items-center gap-3 rounded-lg p-4 text-center"
                                                                                style={{ background: seg.color + "15" }}
                                                                              >
                                                                              <HeadAvatar
                                                                                                    id={h.id}
                                                                                                    name={h.name}
                                                                                                    color={seg.color}
                                                                                                    size="lg"
                                                                                                  />
                                                                              <div>
                                                                                                  <p
                                                                                                                          className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                                                                                                                          style={{ color: seg.color }}
                                                                                                                        >
                                                                                                    {h.id}
                                                                                                    </p>p>
                                                                                                  <p className="text-sm font-semibold leading-tight">{h.name}</p>p>
                                                                                                  <p className="text-[11px] text-muted mt-1 italic">{h.function}</p>p>
                                                                              </div>div>
                                                                              <p className="text-[11px] text-muted leading-relaxed line-clamp-3">
                                                                                {h.pitch}
                                                                              </p>p>
                                                                              <p className="text-[10px] opacity-40 leading-snug line-clamp-2">
                                                                                {h.axis_position}
                                                                              </p>p>
                                                            </div>div>
                                                          ))}
                                          </div>div>
                              </div>div>
                            );
        })()}
        </section>section>
      );
}</section>
