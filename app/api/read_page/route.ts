import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const NOTION_VERSION = process.env.NOTION_VERSION || "2022-06-28";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY!;

function requireKey(req: Request) {
  if (req.headers.get("x-api-key") !== INTERNAL_API_KEY) throw new Error("unauthorized");
}

function extractPageId(input: string): string {
  const m32 = input.match(/[0-9a-fA-F]{32}/);
  const raw = (m32 ? m32[0] : input).replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(raw)) throw new Error("invalid_page_id");
  return raw.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5").toLowerCase();
}

async function notionGET(path: string) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION
    }
  });
  if (!res.ok) throw new Error(`notion_error_${res.status}`);
  return res.json();
}

async function listAllChildren(blockId: string) {
  let results: any[] = [];
  let cursor: string | null = null;
  while (true) {
    const qs = cursor ? `?start_cursor=${encodeURIComponent(cursor)}` : "";
    const data = await notionGET(`/blocks/${blockId}/children${qs}`);
    results = results.concat(data.results || []);
    if (!data.has_more) break;
    cursor = data.next_cursor;
    if (!cursor) break;
  }
  return results;
}

function blocksToPlainText(blocks: any[]): string {
  const lines: string[] = [];
  for (const b of blocks) {
    const t = b.type;
    const obj = b[t];
    const rich = obj?.rich_text;
    const text = Array.isArray(rich)
      ? rich.map((r: any) => r?.plain_text || "").join("")
      : "";
    if (!text.trim()) continue;

    if (t === "heading_1" || t === "heading_2" || t === "heading_3") lines.push(`\n# ${text}`);
    else if (t === "bulleted_list_item") lines.push(`- ${text}`);
    else if (t === "numbered_list_item") lines.push(`1. ${text}`);
    else lines.push(text);
  }
  return lines.join("\n").trim();
}

export async function POST(req: Request) {
  try {
    requireKey(req);
    const { page_url_or_id } = await req.json();
    const pageId = extractPageId(String(page_url_or_id || ""));
    const blocks = await listAllChildren(pageId);
    return NextResponse.json({ page_id: pageId, text: blocksToPlainText(blocks) });
  } catch (e: any) {
    const msg = e?.message || "error";
    return NextResponse.json({ error: msg }, { status: msg === "unauthorized" ? 401 : 400 });
  }
}
