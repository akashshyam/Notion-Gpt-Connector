import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const NOTION_VERSION = process.env.NOTION_VERSION || "2022-06-28";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY!;
const CONFIRM_TOKEN = process.env.CONFIRM_TOKEN || "APPLY";

function requireKey(req: Request) {
  if (req.headers.get("x-api-key") !== INTERNAL_API_KEY) throw new Error("unauthorized");
}

function extractPageId(input: string): string {
  const m32 = input.match(/[0-9a-fA-F]{32}/);
  const raw = (m32 ? m32[0] : input).replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(raw)) throw new Error("invalid_page_id");
  return raw.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5").toLowerCase();
}

function mkText(content: string) {
  return [{ type: "text", text: { content } }];
}

async function notionPATCH(path: string, body: any) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`notion_error_${res.status}`);
  return res.json();
}

export async function POST(req: Request) {
  try {
    requireKey(req);
    const { page_url_or_id, title, bullets, confirm } = await req.json();
    if (confirm !== CONFIRM_TOKEN) throw new Error("missing_confirm");

    const pageId = extractPageId(String(page_url_or_id || ""));
    const safeBullets = Array.isArray(bullets) ? bullets.map(String).filter(Boolean) : [];

    const children = [
      { object: "block", type: "heading_2", heading_2: { rich_text: mkText(String(title || "AI notes")) } },
      ...safeBullets.slice(0, 99).map((b: string) => ({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: mkText(b) }
      }))
    ];

    const out = await notionPATCH(`/blocks/${pageId}/children`, { children });
    return NextResponse.json({ ok: true, appended: out?.results?.length ?? children.length });
  } catch (e: any) {
    const msg = e?.message || "error";
    return NextResponse.json({ error: msg }, { status: msg === "unauthorized" ? 401 : 400 });
  }
}
