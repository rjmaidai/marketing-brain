export type SegmentId =
  | "Strategie"
  | "Audience"
  | "Distribution"
  | "Conversion"
  | "Retention"
  | "Social Media"
  | "Storytelling"
  | "Krise"
  | "Influencer";

export interface Head {
  id: string;
  segment: SegmentId;
  name: string;
  axis_position: string;
  function: string;
  color: string;
  pitch: string;
  core_rule: string;
}

export interface Segment {
  id: SegmentId;
  color: string;
  description: string;
}

export interface HeadSelection {
  heads: Array<{ id: string; reason: string }>;
  ritson_gate?: {
    triggered: boolean;
    missing_layer?: string;
    note?: string;
  };
  notes?: string;
}

export type StreamBlockKind = "message" | "erkenntnis" | "frage";

export interface ParsedBlock {
  kind: StreamBlockKind;
  headId?: string;
  headName?: string;
  text: string;
  isStreaming: boolean;
}
