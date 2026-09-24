#!/usr/bin/env node
// Як запускати: `cd /home/hp/from-den && python3 -m http.server 8791`, Chrome з --remote-debugging-port=N;
// `KOOTOOK_CDP_PORT=N node scripts/qa-ui-parity.mjs http://127.0.0.1:8791 [compare|capture]` (origin без /kootok).
//
// Baseline DOM (кількість елементів/контролів/зображень, хеш тексту) для 4 екранів уроку 6 після
// актуалізації 2026-09-24 лежить у scripts/baselines/dom-2026-09-24.json. Перезняти після свідомої
// зміни екранів: режим `capture` (синонім `write`). Шлях можна перевизначити KOOTOOK_UI_PARITY_BASELINE.
// Перед зніманням очищується localStorage (чернетка анкети впливає на текст статусу).

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cdpPort = process.env.KOOTOOK_CDP_PORT;
if (!cdpPort) { console.error("Потрібна змінна KOOTOOK_CDP_PORT (порт Chrome DevTools)."); process.exit(2); }
if (!process.argv[2]) { console.error("Потрібен origin першим аргументом, напр. http://127.0.0.1:8791 (без /kootok)."); process.exit(2); }
const origin = process.argv[2].replace(/\/+$/, "");
const mode = process.argv[3] || "compare";
const baselinePath = process.env.KOOTOOK_UI_PARITY_BASELINE || join(dirname(fileURLToPath(import.meta.url)), "baselines", "dom-2026-09-24.json");
const pages = ["listings.html", "listing.html", "compatibility-form.html", "application.html"];

class CDP {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = reject;
    });
    this.socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    };
  }
  async send(method, params = {}, sessionId) {
    await this.ready;
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}

const version = await fetch(`http://127.0.0.1:${cdpPort}/json/version`).then((response) => response.json());
const cdp = new CDP(version.webSocketDebuggerUrl);
const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
const send = (method, params = {}) => cdp.send(method, params, sessionId);
await send("Page.enable");
await send("Runtime.enable");

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result.value;
}

async function waitFor(expression, label) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out: ${label}`);
}

await send("Page.navigate", { url: `${origin}/kootok/lesson-6/listings.html?qa-ui-parity=reset` });
await waitFor(`document.readyState === 'complete'`, "reset");
await evaluate(`(() => { try { localStorage.removeItem('kutok-compatibility-draft-v1'); } catch (_) {} return true; })()`);

const snapshot = {};
for (const page of pages) {
  await send("Page.navigate", { url: `${origin}/kootok/lesson-6/${page}?qa-ui-parity=1` });
  await waitFor(`document.readyState === 'complete' && location.pathname.endsWith('/${page}')`, page);
  const raw = await evaluate(`(() => {
    const root = document.querySelector('.kit-shell');
    const nodes = [...root.querySelectorAll('*')];
    const normalize = value => value.replace(/\\s+/g, ' ').trim();
    const tagCounts = nodes.reduce((counts, node) => {
      const tag = node.tagName.toLowerCase();
      counts[tag] = (counts[tag] || 0) + 1;
      return counts;
    }, {});
    const controls = nodes.filter(node => node.matches('a,button,input,textarea,select'));
    return {
      elementCount: nodes.length,
      tagCounts,
      controlCount: controls.length,
      controlTags: controls.reduce((counts, node) => {
        const key = node.tagName.toLowerCase() + (node.type ? ':' + node.type : '');
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {}),
      imageCount: nodes.filter(node => node.matches('img')).length,
      imageSources: nodes.filter(node => node.matches('img')).map(node => node.getAttribute('src')),
      text: normalize(root.textContent),
      textNodeCount: (() => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let count = 0;
        while (walker.nextNode()) if (normalize(walker.currentNode.nodeValue)) count += 1;
        return count;
      })(),
      pseudoContentCount: nodes.reduce((count, node) => count + ['::before','::after'].filter(pseudo => {
        const content = getComputedStyle(node, pseudo).content;
        return content && content !== 'none' && content !== 'normal' && content !== '""';
      }).length, 0)
    };
  })()`);
  snapshot[page] = {
    ...raw,
    textHash: createHash("sha256").update(raw.text).digest("hex"),
    textWithoutProfileCompletedHash: createHash("sha256").update(raw.text.replaceAll("Профіль заповнено", "").replace(/\s+/g, " ").trim()).digest("hex"),
    profileCompletedCount: raw.text.split("Профіль заповнено").length - 1
  };
  delete snapshot[page].text;
}

if (mode === "write" || mode === "capture") {
  await writeFile(baselinePath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(JSON.stringify({ mode, baselinePath, snapshot }, null, 2));
  process.exit(0);
}

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const failures = [];
for (const page of pages) {
  const expected = structuredClone(baseline[page]);
  if (mode === "compare-profile-removal" && page === "listings.html") {
    expected.elementCount -= 2;
    expected.tagCounts.li -= 2;
    expected.textNodeCount -= 2;
    expected.textHash = expected.textWithoutProfileCompletedHash;
    expected.profileCompletedCount = 0;
  }
  if (JSON.stringify(snapshot[page]) !== JSON.stringify(expected)) {
    failures.push({ page, expected, before: baseline[page], after: snapshot[page] });
  }
}
console.log(JSON.stringify({ mode, baselinePath, failures, snapshot }, null, 2));
process.exit(failures.length ? 1 : 0);
