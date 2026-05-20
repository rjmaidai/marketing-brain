import { getHead } from "./heads";

export interface MessageBlock {
  kind: "message";
  headId: string;
  headName: string;
  segment: string;
  color: string;
  text: string;
}

export interface SpecialBlock {
  kind: "erkenntnis" | "frage";
  text: string;
}

export type ParsedBlock = MessageBlock | SpecialBlock;

export interface ParseResult {
  blocks: ParsedBlock[];
  /**
   * Index of the block that is still actively receiving text from the stream.
   * -1 if no block is open (we are between headers).
   */
  openBlockIndex: number;
}

const HEADER_RE = /\[([A-Z]{1,3}\d{1,2}|\d{2})\s*:\s*([^\]\n]+?)\]/g;
const ERKENNTNIS_RE = /\[ERKENNTNIS\]/i;
const FRAGE_RE = /\[OFFENE FRAGE\]/i;

interface Marker {
  index: number;
  length: number;
  block: Omit<MessageBlock, "text"> | { kind: "erkenntnis" | "frage" };
}

function findMarkers(buffer: string): Marker[] {
  const markers: Marker[] = [];

  HEADER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HEADER_RE.exec(buffer)) !== null) {
    const id = m[1].trim();
    const head = getHead(id);
    if (!head) continue;
    markers.push({
      index: m.index,
      length: m[0].length,
      block: {
        kind: "message",
        headId: head.id,
        headName: head.name,
        segment: head.segment,
        color: head.color,
      },
    });
  }

  const eMatch = ERKENNTNIS_RE.exec(buffer);
  if (eMatch) {
    markers.push({
      index: eMatch.index,
      length: eMatch[0].length,
      block: { kind: "erkenntnis" },
    });
  }
  const fMatch = FRAGE_RE.exec(buffer);
  if (fMatch) {
    markers.push({
      index: fMatch.index,
      length: fMatch[0].length,
      block: { kind: "frage" },
    });
  }

  markers.sort((a, b) => a.index - b.index);
  return markers;
}

export function parseStream(buffer: string): ParseResult {
  const markers = findMarkers(buffer);
  if (markers.length === 0) {
    return { blocks: [], openBlockIndex: -1 };
  }

  const blocks: ParsedBlock[] = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index + markers[i].length;
    const end = i + 1 < markers.length ? markers[i + 1].index : buffer.length;
    const text = buffer.slice(start, end).trim();
    const m = markers[i];
    if (m.block.kind === "message") {
      blocks.push({
        kind: "message",
        headId: m.block.headId,
        headName: m.block.headName,
        segment: m.block.segment,
        color: m.block.color,
        text,
      });
    } else if (m.block.kind === "erkenntnis") {
      blocks.push({ kind: "erkenntnis", text });
    } else {
      blocks.push({ kind: "frage", text });
    }
  }

  return { blocks, openBlockIndex: blocks.length - 1 };
}
