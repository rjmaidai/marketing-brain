import type Anthropic from "@anthropic-ai/sdk";

/**
 * Datei-Anhänge für den Video-Berater: PDF und Bilder werden nativ von Claude
 * gelesen (inkl. Tabellen/Layout — wichtig für Studien/Meta-Analysen), Text-
 * dateien (txt/md/csv/json) werden als Text eingebettet.
 *
 * Größen sind bewusst konservativ: Vercel-Serverless erlaubt ~4,5 MB Request-
 * Body, und Base64 bläht ~+33 % auf. Größere Dokumente bitte aufteilen.
 */

export type AttachmentKind = "pdf" | "image" | "text";

export interface AdvisorAttachment {
  name: string;
  kind: AttachmentKind;
  /** Für Bilder: image/png|jpeg|gif|webp. Für PDF: application/pdf. */
  mediaType?: string;
  /** Base64 (pdf/image) oder roher Text (text). */
  data: string;
}

export const MAX_FILES = 6;
export const MAX_TOTAL_DATA = 4_000_000; // ~4 MB über alle Anhänge
export const MAX_TEXT_CHARS = 200_000;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export interface ParseResult {
  files: AdvisorAttachment[];
  error?: string;
}

/** Validiert die vom Client gesendeten Anhänge defensiv. */
export function parseAttachments(raw: unknown): ParseResult {
  if (raw === undefined || raw === null) return { files: [] };
  if (!Array.isArray(raw)) return { files: [], error: "Anhänge ungültig." };
  if (raw.length > MAX_FILES) {
    return { files: [], error: `Maximal ${MAX_FILES} Dateien pro Anfrage.` };
  }

  const files: AdvisorAttachment[] = [];
  let total = 0;

  for (const item of raw) {
    const f = item as Partial<AdvisorAttachment>;
    const name = String(f?.name ?? "Datei").slice(0, 200);
    const kind = f?.kind;
    const data = typeof f?.data === "string" ? f.data : "";
    if (!data) continue;

    if (kind === "image") {
      const mediaType = String(f?.mediaType ?? "");
      if (!IMAGE_TYPES.has(mediaType)) {
        return { files: [], error: `Bildformat nicht unterstützt: ${name}` };
      }
      total += data.length;
      files.push({ name, kind, mediaType, data });
    } else if (kind === "pdf") {
      total += data.length;
      files.push({ name, kind, mediaType: "application/pdf", data });
    } else if (kind === "text") {
      const text = data.slice(0, MAX_TEXT_CHARS);
      total += text.length;
      files.push({ name, kind, data: text });
    } else {
      return { files: [], error: `Dateityp nicht unterstützt: ${name}` };
    }

    if (total > MAX_TOTAL_DATA) {
      return {
        files: [],
        error:
          "Anhänge zu groß (max. ~4 MB gesamt). Bitte kleinere Dateien oder ein PDF aufteilen.",
      };
    }
  }

  return { files };
}

/** Wandelt Anhänge in Anthropic-Content-Blöcke. */
export function attachmentsToBlocks(
  files: AdvisorAttachment[],
): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const f of files) {
    if (f.kind === "pdf") {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: f.data },
        title: f.name,
      });
    } else if (f.kind === "image") {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: f.mediaType as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          data: f.data,
        },
      });
    } else {
      blocks.push({
        type: "text",
        text: `Angehängte Datei "${f.name}" (Inhalt):\n"""\n${f.data}\n"""`,
      });
    }
  }
  return blocks;
}
