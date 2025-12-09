module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/Code/Projects/Notion-GPT Connector/app/api/read_page/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Code$2f$Projects$2f$Notion$2d$GPT__Connector$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Code/Projects/Notion-GPT Connector/node_modules/next/server.js [app-route] (ecmascript)");
;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_VERSION = process.env.NOTION_VERSION || "2022-06-28";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
function requireKey(req) {
    if (req.headers.get("x-api-key") !== INTERNAL_API_KEY) throw new Error("unauthorized");
}
function extractPageId(input) {
    const m32 = input.match(/[0-9a-fA-F]{32}/);
    const raw = (m32 ? m32[0] : input).replace(/-/g, "");
    if (!/^[0-9a-fA-F]{32}$/.test(raw)) throw new Error("invalid_page_id");
    return raw.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5").toLowerCase();
}
async function notionGET(path) {
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
async function listAllChildren(blockId) {
    let results = [];
    let cursor = null;
    while(true){
        const qs = cursor ? `?start_cursor=${encodeURIComponent(cursor)}` : "";
        const data = await notionGET(`/blocks/${blockId}/children${qs}`);
        results = results.concat(data.results || []);
        if (!data.has_more) break;
        cursor = data.next_cursor;
        if (!cursor) break;
    }
    return results;
}
function blocksToPlainText(blocks) {
    const lines = [];
    for (const b of blocks){
        const t = b.type;
        const obj = b[t];
        const rich = obj?.rich_text;
        const text = Array.isArray(rich) ? rich.map((r)=>r?.plain_text || "").join("") : "";
        if (!text.trim()) continue;
        if (t === "heading_1" || t === "heading_2" || t === "heading_3") lines.push(`\n# ${text}`);
        else if (t === "bulleted_list_item") lines.push(`- ${text}`);
        else if (t === "numbered_list_item") lines.push(`1. ${text}`);
        else lines.push(text);
    }
    return lines.join("\n").trim();
}
async function POST(req) {
    try {
        requireKey(req);
        const { page_url_or_id } = await req.json();
        const pageId = extractPageId(String(page_url_or_id || ""));
        const blocks = await listAllChildren(pageId);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Code$2f$Projects$2f$Notion$2d$GPT__Connector$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            page_id: pageId,
            text: blocksToPlainText(blocks)
        });
    } catch (e) {
        const msg = e?.message || "error";
        return __TURBOPACK__imported__module__$5b$project$5d2f$Code$2f$Projects$2f$Notion$2d$GPT__Connector$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: msg
        }, {
            status: msg === "unauthorized" ? 401 : 400
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__19d5fec7._.js.map