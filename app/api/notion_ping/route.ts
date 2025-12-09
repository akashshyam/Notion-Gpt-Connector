import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const NOTION_VERSION = process.env.NOTION_VERSION || "2022-06-28";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY!;

export async function GET(req: Request) {
  try {
    if (req.headers.get("x-api-key") !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const res = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
      },
    });

    const bodyText = await res.text();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      tokenPrefix: (NOTION_TOKEN || "").slice(0, 4),
      tokenLen: (NOTION_TOKEN || "").length,
      notionBody: bodyText.slice(0, 300),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
