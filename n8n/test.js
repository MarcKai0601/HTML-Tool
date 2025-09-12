// test-n8n-function.js
// 用來在本地 IDE 模擬 n8n Function 節點：把 Notion Page 轉成 {actionPageId, actionName}

const fs = require('fs');

// ====== 1) 讀入你的輸入 ======
// 你可以把 Notion 的 JSON 貼成 input.json（單一 page 或陣列都可），或用 process.argv 指定路徑
const INPUT_PATH = process.argv[2] || './input.json';
const raw = fs.readFileSync(INPUT_PATH, 'utf8');
let payload = JSON.parse(raw);

/**
 * 將任意形式的 payload 正規化為 n8n 的 items 形狀：
 * - 若是單一 Notion Page 物件 => 轉成 [{ json: <page> }]
 * - 若是陣列 => 允許：
 *     a) [{ json: {...} }, ...]（已是 n8n 形狀）=> 原樣返回
 *     b) [ {...}, {...} ]（純原始）=> 包裝成 [{json: {...}}, ...]
 */
function normalizeToItems(payload) {
    if (Array.isArray(payload)) {
        // 已經是 n8n 形狀？
        const looksLikeN8n = payload.every(
            (x) => x && typeof x === 'object' && x.json && typeof x.json === 'object'
        );
        if (looksLikeN8n) return payload;

        // 否則包裝成 n8n 形狀
        return payload.map((obj) => ({ json: obj }));
    }

    // 單一物件 => 包裝成一筆 item
    return [{ json: payload }];
}

// ====== 2) 這段就是你在 n8n 的 Function 節點中會寫的主邏輯 ======
function transform(items) {
    const out = [];
    console.log("items" + items);

    for (const it of items) {
        const id = it?.json?.id;
        console.log(id);
        const props = it.json.properties || {};
        console.log("=======props start=======");
        console.log(props);
        console.log("=======props end=======");
        const name =
            it?.json?.properties?.['行動任務卡片']?.title?.[0]?.plain_text ||
            it?.json?.properties?.Name?.title?.[0]?.plain_text ||
            'Untitled';
        console.log(name);
        // 在這裡下斷點最方便
        // 你也可以改成 console.log(it) 看整筆資料
        debugger;

        out.push({
            json: {
                actionPageId: id,
                actionName: name,
            },
        });
    }
    console.log("out"+out.length ? out : [{ json: { noActions: true } }]);

    return out.length ? out : [{ json: { noActions: true } }];
}

// ====== 3) 串起流程並輸出 ======
const items = normalizeToItems(payload);
const result = transform(items);

// 顯示輸入與輸出，便於比對
console.log('------------------------------------------------------------------------------------------------------------------------------');
console.log('--- INPUT items (normalized) ---');
console.dir(items, { depth: 5 });
console.log('\n--- OUTPUT ---');
console.dir(result, { depth: 5 });
