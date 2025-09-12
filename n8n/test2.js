// test-subtasks.js
const fs = require('fs');
const path = require('path');

// 讀檔：node test-subtasks.js page.json [actions.json]
const pagePath    = process.argv[2] || path.join(__dirname, 'page.json');
const actionsPath = process.argv[3]; // 可省略

const pageObj = JSON.parse(fs.readFileSync(pagePath, 'utf8'));
const actionsOut = actionsPath ? JSON.parse(fs.readFileSync(actionsPath, 'utf8')) : [];

// 轉成 n8n items 形狀
const items = Array.isArray(pageObj) ? pageObj.map(x => ({ json: x })) : [{ json: pageObj }];

// 模擬 $items('Map Actions')
function $items(nodeName) {
    if (nodeName === 'Map Actions') {
        return actionsOut.map(x => (x.json ? x : { json: x }));
    }
    return [];
}

// ====== 把 n8n 版本邏輯貼進來（略去 $item / $node，僅用 $items） ======
const actions = $items('Map Actions') || [];
const nameByPage = {};
for (const a of actions) {
    const pid = a?.json?.actionPageId;
    const nm  = a?.json?.actionName;
    if (pid) nameByPage[pid] = nm ?? 'Untitled';
}

function getPageTitle(props = {}) {
    return (
        props['行動任務卡片']?.title?.[0]?.plain_text ??
        props.Name?.title?.[0]?.plain_text ??
        Object.values(props).find(p => p?.type === 'title')?.title?.[0]?.plain_text ??
        'Untitled'
    );
}
function getSubtasksRelation(props = {}) {
    if (props['Sub-tasks']?.type === 'relation') return props['Sub-tasks'];
    const anyRel = Object.values(props).find(
        p => p?.type === 'relation' && (p.id?.includes('sub_task_relation'))
    );
    return anyRel || null;
}
function stripHyphen(id) { return id ? id.replace(/-/g, '') : null; }

const out = [];
for (const it of items) {
    const page = it?.json;
    if (!page) continue;

    const props = page.properties || {};
    const rel = getSubtasksRelation(props);
    const subs = rel?.relation ?? [];

    const parentPageId = page.id;
    const parentName =
        nameByPage[parentPageId] ?? getPageTitle(props);

    // 在這裡下斷點，觀察 props / rel / subs
    debugger;

    if (!subs.length) continue;

    for (const r of subs) {
        out.push({
            json: {
                parentPageId: stripHyphen(parentPageId),
                parentName,
                subTaskId: stripHyphen(r.id),
            }
        });
    }
}

console.log(JSON.stringify(out.length ? out : [{ json: { noSubtasks: true } }], null, 2));
