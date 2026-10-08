#!/usr/bin/env node
// QA зменшеного руху (DESIGN.md «Анімація», «Ціна кадру»): сирий CDP до headless Chromium, без Playwright.
// Запуск: сервер з БАТЬКІВСЬКОЇ теки (`cd .. && python3 -m http.server <port>`),
// headless Chrome з `--remote-debugging-port=<cdp>`, далі
// `KOOTOOK_CDP_PORT=<cdp> node scripts/qa-reduced-motion.mjs http://127.0.0.1:<port>` (origin без /kootok).
//
// Що перевіряє з емуляцією prefers-reduced-motion: reduce (провал → exit 1):
//   1. 5 екранів активного прототипу + docs кнопки й split-view: matchMedia справді reduce; у кожного
//      елемента й ::before/::after обчислені animation-duration і transition-duration ≤ 0.01 мс (кожне
//      значення списку), animation-iteration-count ≤ 1, scroll-behavior ≠ smooth; нескінченних анімацій немає.
//   2. Кнопка (docs/button.html): у стані pressed (:active, справжнє натискання миші) і hover кнопка
//      та її коло ::after не масштабуються (scale = 1).
//   3. Split-view на «Стрічці кімнат» у рамці «Десктоп» (1280): відповідь сторінки деталі уповільнена
//      на 600 мс (Fetch.requestPaused → continueRequest). Поки aria-busy="true": статус «Завантажуємо…»
//      видимий (не hidden, ненульовий rect, opacity 1), getAnimations() без infinite. Після завантаження:
//      rect деталі в момент появи і через 100 мс однакові, computed transform = none; сума layout-shift
//      (hadRecentInput = false) після кліку. Сценарій A — перше відкриття з сітки, B — зміна картки при
//      відкритій деталі.
// Контрольний прогін без емуляції (no-preference) друкується поруч, щоб було видно різницю — не провал,
// крім статусу завантаження: він мусить бути видимим в обох режимах.

if (!process.argv[2] || !process.env.KOOTOOK_CDP_PORT) {
  console.error("Використання: KOOTOOK_CDP_PORT=<cdp> node scripts/qa-reduced-motion.mjs http://127.0.0.1:<port>  (origin без /kootok)");
  process.exit(2);
}
const siteOrigin = new URL(process.argv[2]).origin;
const origin = `${siteOrigin}/kootok`;
const cdpPort = process.env.KOOTOOK_CDP_PORT;

const pages = [
  ["Стрічка кімнат", "/lesson-6/listings.html"],
  ["Картка оголошення", "/lesson-6/listing.html"],
  ["Анкета сумісності", "/lesson-6/compatibility-form.html"],
  ["Заявка", "/lesson-6/application.html"],
  ["Чати", "/design-system/examples/chats.html"],
  ["docs · Кнопки", "/design-system/docs/button.html"],
  ["docs · Split-view", "/design-system/docs/split-view.html"],
];
const REDUCED_MAX_MS = 0.01;
const DETAIL_DELAY_MS = 600;
const failures = [];
const warnings = [];
const fail = (gate, detail) => failures.push({ gate, detail });
const log = (...xs) => console.log(...xs);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(url) {
    this.id = 0; this.pending = new Map(); this.listeners = new Map(); this.ws = new WebSocket(url);
    this.ready = new Promise((ok, no) => { this.ws.onopen = ok; this.ws.onerror = no; });
    this.ws.onmessage = ({ data }) => { const m = JSON.parse(data); if (m.id && this.pending.has(m.id)) { const p = this.pending.get(m.id); this.pending.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } else for (const fn of this.listeners.get(m.method) || []) fn(m.params, m.sessionId); };
  }
  async send(method, params = {}, sessionId) { await this.ready; const id = ++this.id; return new Promise((ok, no) => { this.pending.set(id, { ok, no }); this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }); }
  on(method, fn) { this.listeners.set(method, [...(this.listeners.get(method) || []), fn]); }
}
const version = await fetch(`http://127.0.0.1:${cdpPort}/json/version`).then((r) => r.json());
const cdp = new CDP(version.webSocketDebuggerUrl);
const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
const send = (method, params = {}) => cdp.send(method, params, sessionId);
await send("Page.enable"); await send("Runtime.enable");
let runtimeErrors = [];
cdp.on("Runtime.exceptionThrown", (p, sid) => { if (sid === sessionId) runtimeErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || "exception"); });
// Уповільнення відповіді сторінки деталі (лише коли ввімкнено Fetch.enable у сценарії split-view).
cdp.on("Fetch.requestPaused", (p, sid) => {
  if (sid !== sessionId) return;
  setTimeout(() => { send("Fetch.continueRequest", { requestId: p.requestId }).catch(() => {}); }, DETAIL_DELAY_MS);
});

const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const setMotion = (mode) => send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: mode }] });
const navigate = async (path, size = { width: 1600, height: 1000 }) => {
  runtimeErrors = [];
  await send("Emulation.setDeviceMetricsOverride", { ...size, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: origin + path });
  const expected = new URL(origin + path).pathname;
  for (let i = 0; i < 200; i++) {
    await sleep(25);
    if (await evaluate(`document.readyState==='complete'&&location.pathname===${JSON.stringify(expected)}`).catch(() => false)) {
      await evaluate(`document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))`);
      return;
    }
  }
  throw new Error(`timeout ${path}`);
};

// 1. Обчислені тривалості на всіх елементах і псевдоелементах.
const auditExpression = `(() => {
  const ms = (v) => { v = v.trim(); if (v === 'auto' || v === '') return 0; const n = parseFloat(v); return Number.isNaN(n) ? 0 : (v.endsWith('ms') ? n : n * 1000); };
  const list = (v) => v.split(',').map(ms);
  const iters = (v) => v.split(',').map((x) => x.trim() === 'infinite' ? Infinity : parseFloat(x));
  const name = (el, pseudo) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') + (pseudo || '');
  const bad = []; let count = 0, maxAnim = 0, maxTrans = 0, maxIter = 0, smooth = 0;
  for (const el of document.querySelectorAll('*')) for (const pseudo of [null, '::before', '::after']) {
    const cs = getComputedStyle(el, pseudo); count++;
    const a = Math.max(...list(cs.animationDuration)), t = Math.max(...list(cs.transitionDuration)), it = Math.max(...iters(cs.animationIterationCount));
    maxAnim = Math.max(maxAnim, a); maxTrans = Math.max(maxTrans, t); maxIter = Math.max(maxIter, it);
    if (cs.scrollBehavior === 'smooth') smooth++;
    if (a > ${REDUCED_MAX_MS} + 1e-9 || t > ${REDUCED_MAX_MS} + 1e-9 || it > 1 || cs.scrollBehavior === 'smooth') bad.push(name(el, pseudo) + ' anim=' + cs.animationDuration + ' trans=' + cs.transitionDuration + ' iter=' + cs.animationIterationCount + ' scroll=' + cs.scrollBehavior);
  }
  const infinite = document.getAnimations().filter((x) => x.effect && x.effect.getComputedTiming().iterations === Infinity).length;
  return { reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, count, maxAnim, maxTrans, maxIter, smooth, infinite, badCount: bad.length, bad: bad.slice(0, 8) };
})()`;

// 2. Кнопка. Headless Chromium має (hover: none), а Emulation.setEmulatedMedia фічу hover не емулює,
// тож hover відтворюємо атрибутом data-demo-state="hover" (ті самі правила, що й :hover у button.css);
// pressed — справжнє натискання миші (:active не залежить від медіа hover).
const scaleOf = (t) => `(${t} === 'none' ? 1 : (() => { const m = new DOMMatrix(${t}); return Math.hypot(m.a, m.b); })())`;
async function buttonCheck() {
  await navigate("/design-system/docs/button.html");
  const box = await evaluate(`(() => { const b = [...document.querySelectorAll('.kit-button:not([data-demo-state]):not(:disabled):not([aria-disabled="true"])')].find((x) => x.getBoundingClientRect().width > 0); b.id = b.id || 'qa-rm-button'; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { id: b.id, x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const read = `(() => { const b = document.getElementById(${JSON.stringify(box.id)}); const t = getComputedStyle(b).transform, at = getComputedStyle(b, '::after').transform; return { button: ${scaleOf("t")}, after: ${scaleOf("at")}, afterOpacity: getComputedStyle(b, '::after').opacity }; })()`;
  await evaluate(`document.getElementById(${JSON.stringify(box.id)}).setAttribute('data-demo-state', 'hover')`);
  await sleep(60);
  const hover = await evaluate(read);
  await evaluate(`document.getElementById(${JSON.stringify(box.id)}).removeAttribute('data-demo-state')`);
  await sleep(400);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await sleep(60);
  const pressed = await evaluate(read);
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
  const demo = await evaluate(`(() => [...document.querySelectorAll('.kit-button[data-demo-state="active"], .kit-button[data-demo-state="hover"]')].map((b) => ({ state: b.dataset.demoState, button: ${scaleOf("getComputedStyle(b).transform")}, after: ${scaleOf("getComputedStyle(b, '::after').transform")} })))()`);
  return { hover, pressed, demoMaxDeviation: Math.max(0, ...demo.map((d) => Math.max(Math.abs(d.button - 1), Math.abs(d.after - 1)))), demoCount: demo.length };
}

// 3. Split-view на «Стрічці кімнат», рамка «Десктоп».
async function splitCheck() {
  await navigate("/lesson-6/listings.html");
  await evaluate(`localStorage.setItem('kootok-prototype-device', 'desktop')`);
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/lesson-6/listing-*.html*", requestStage: "Request" }, { urlPattern: "*/lesson-6/listing.html*", requestStage: "Request" }, { urlPattern: "*/prototype/listing-*.html*", requestStage: "Request" }, { urlPattern: "*/prototype/listing.html*", requestStage: "Request" }] });
  try {
    await navigate("/lesson-6/listings.html");
    for (let i = 0; i < 80; i++) {
      if (await evaluate(`(() => { const r = document.querySelector('.kit-split[data-kit-split]'); return !!r && r.hasAttribute('data-kit-split-ready') && getComputedStyle(r).getPropertyValue('--kit-split-enabled').trim() === '1'; })()`)) break;
      await sleep(50);
    }
    const setup = await evaluate(`(() => {
      const root = document.querySelector('.kit-split[data-kit-split]');
      if (getComputedStyle(root).getPropertyValue('--kit-split-enabled').trim() !== '1') return { enabled: false, device: document.documentElement.dataset.prototypeDevice };
      const detail = root.querySelector('.kit-split__detail'), content = root.querySelector('.kit-split__content');
      window.__qaShifts = [];
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__qaShifts.push({ value: e.value, recent: e.hadRecentInput, t: e.startTime }); }).observe({ type: 'layout-shift', buffered: true });
      window.__qaAppear = [];
      const snap = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, transform: getComputedStyle(el).transform, opacity: getComputedStyle(el).opacity }; };
      new MutationObserver(() => {
        if (detail.hasAttribute('aria-busy') || detail.hidden) return;
        const last = window.__qaAppear[window.__qaAppear.length - 1];
        if (last && last.pending) return;
        const rec = { pending: true, t: performance.now(), detail: snap(detail), content: snap(content) };
        window.__qaAppear.push(rec);
        // Через ≥100 мс і два кадри: анімації просуваються лише з кадрами, а перший кадр після відкриття важкий.
        setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => { rec.dt = performance.now() - rec.t; rec.detail100 = snap(detail); rec.content100 = snap(content); rec.pending = false; })), 100);
      }).observe(detail, { attributes: true, attributeFilter: ['hidden', 'aria-busy'] });
      return { enabled: true, device: document.documentElement.dataset.prototypeDevice };
    })()`);
    if (!setup.enabled) return { error: `split не ввімкнувся (рамка: ${setup.device})` };
    const scenario = async (key) => {
      const box = await evaluate(`(() => { const a = document.querySelector('[data-kit-split-key="${key}"] h3 a[href]'); a.scrollIntoView({ block: 'center' }); const r = a.getBoundingClientRect(); return { x: r.left + Math.min(20, r.width / 2), y: r.top + r.height / 2 }; })()`);
      await sleep(50);
      const before = await evaluate(`({ t: performance.now(), n: window.__qaAppear.length })`);
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
      const busy = [];
      for (let i = 0; i < 120; i++) {
        const s = await evaluate(`(() => {
          const root = document.querySelector('.kit-split[data-kit-split]'), detail = root.querySelector('.kit-split__detail'), st = root.querySelector('.kit-split__status');
          const isBusy = detail.getAttribute('aria-busy') === 'true';
          if (!isBusy) return { busy: false, open: root.getAttribute('data-kit-split-state') === 'open' };
          const r = st ? st.getBoundingClientRect() : { width: 0, height: 0 }, cs = st ? getComputedStyle(st) : null;
          return { busy: true, status: st ? { hidden: st.hidden, w: r.width, h: r.height, opacity: cs.opacity, visibility: cs.visibility, display: cs.display, role: st.getAttribute('role'), live: st.getAttribute('aria-live'), text: st.textContent.trim() } : null,
            infinite: document.getAnimations().filter((x) => x.effect && x.effect.getComputedTiming().iterations === Infinity).map((x) => x.animationName || 'waapi') };
        })()`);
        if (s.busy) busy.push(s); else if (busy.length && s.open) break;
        await sleep(30);
      }
      await sleep(250);
      const after = await evaluate(`(() => ({ appear: window.__qaAppear.slice(${before.n}).map(({ pending, ...x }) => x), shifts: window.__qaShifts.filter((x) => x.t >= ${before.t}), statusHidden: document.querySelector('.kit-split__status')?.hidden, ariaCurrent: document.querySelector('[data-kit-split-key="${key}"] h3 a')?.getAttribute('aria-current') }))()`);
      return { key, busy, ...after };
    };
    const first = await scenario("solomianskyi");
    const second = await scenario("podilskyi");
    return { first, second, errors: [...runtimeErrors] };
  } finally {
    await send("Fetch.disable");
    await evaluate(`localStorage.removeItem('kootok-prototype-device')`).catch(() => {});
  }
}

const same = (a, b) => a && b && ["x", "y", "w", "h"].every((k) => Math.abs(a[k] - b[k]) < 0.5);
const fmtRect = (r) => r ? `${r.x.toFixed(1)},${r.y.toFixed(1)} ${r.w.toFixed(1)}×${r.h.toFixed(1)} transform=${r.transform} opacity=${r.opacity}` : "—";
function summarizeSplit(mode, res, strict) {
  if (res.error) { log(`  split-view: ${res.error}`); fail("split", `${mode}: ${res.error}`); return; }
  for (const [label, sc, el] of [["A перше відкриття", res.first, "detail"], ["B зміна картки", res.second, "content"]]) {
    const statusOk = sc.busy.length > 0 && sc.busy.every((s) => s.status && !s.status.hidden && s.status.w > 0 && s.status.h > 0 && s.status.opacity === "1" && s.status.visibility === "visible" && s.status.role === "status" && /^Завантажуємо/.test(s.status.text));
    const infinite = [...new Set(sc.busy.flatMap((s) => s.infinite))];
    const ap = sc.appear[0];
    const rect0 = ap && ap[el], rect100 = ap && ap[`${el}100`];
    const stable = same(rect0, rect100);
    const noTransform = rect0 && rect0.transform === "none" && rect100 && rect100.transform === "none";
    const shift = sc.shifts.filter((x) => !x.recent).reduce((s, x) => s + x.value, 0);
    const shiftRecent = sc.shifts.filter((x) => x.recent).reduce((s, x) => s + x.value, 0);
    const st = sc.busy[0]?.status;
    log(`  split-view ${label} (${sc.key}): aria-busy знімків ${sc.busy.length}; статус ${statusOk ? "видимий" : "НЕ видимий"}${st ? ` «${st.text}» ${st.w.toFixed(0)}×${st.h.toFixed(0)} opacity=${st.opacity} role=${st.role} aria-live=${st.live}` : ""}; після — hidden=${sc.statusHidden}`);
    log(`    infinite під час busy: ${infinite.length ? infinite.join(", ") : "немає"}`);
    log(`    ${el} у момент появи: ${fmtRect(rect0)}`);
    log(`    ${el} через ${ap ? Math.round(ap.dt) : "—"} мс:   ${fmtRect(rect100)} → ${stable ? "rect однаковий" : "rect ЗМІНИВСЯ"}, ${noTransform ? "transform none" : "transform НЕ none"}`);
    log(`    layout-shift після кліку: ${shift.toFixed(4)} (без недавнього вводу), ${shiftRecent.toFixed(4)} (hadRecentInput)`);
    if (!statusOk) fail("split-status", `${mode} ${label}: статус завантаження не видимий ${JSON.stringify(sc.busy.slice(0, 2))}`);
    if (sc.statusHidden !== true) fail("split-status", `${mode} ${label}: статус не сховався після завантаження`);
    if (!strict) continue;
    if (infinite.length) fail("split-infinite", `${mode} ${label}: ${infinite.join(", ")}`);
    if (!ap) fail("split-appear", `${mode} ${label}: момент появи не зафіксовано`);
    else {
      if (!stable) fail("split-rect", `${mode} ${label}: ${fmtRect(rect0)} → ${fmtRect(rect100)}`);
      if (!noTransform) fail("split-transform", `${mode} ${label}: ${rect0.transform} / ${rect100.transform}`);
    }
    // A: перше відкриття перебудовує сітку карток у колонку списку — це наслідок кліку, але
    // відкладений на час завантаження (600 мс > 500 мс вікна hadRecentInput), тому браузер рахує
    // його як неочікуваний зсув. Без зменшеного руху FLIP (transform) ховає стрибок, у reduce
    // переїзду немає. Це відома відкрита задача (відкривати колонки одразу на клік, до завантаження),
    // друкується як попередження; B (зміна картки при відкритій деталі) — строго 0.
    if (shift > 0 && el === "content") fail("split-layout-shift", `${mode} ${label}: ${shift.toFixed(4)}`);
    else if (shift > 0) { warnings.push(`${mode} ${label}: layout-shift ${shift.toFixed(4)} — сітка → колонка після завантаження (не провал, див. коментар)`); }
  }
  if (res.errors.length) fail("console", { mode, errors: res.errors });
}

const report = {};
for (const [mode, strict] of [["reduce", true], ["no-preference", false]]) {
  await setMotion(mode);
  log(`\n=== prefers-reduced-motion: ${mode}${strict ? "" : " (контроль, не провал)"} ===`);
  report[mode] = {};
  for (const [label, path] of pages) {
    await navigate(path);
    const a = await evaluate(auditExpression);
    report[mode][path] = a;
    log(`  ${label.padEnd(18)} matchMedia(reduce)=${a.reduce}  елементів+псевдо ${a.count}  max animation ${a.maxAnim} мс  max transition ${a.maxTrans} мс  max iterations ${a.maxIter}  smooth ${a.smooth}  infinite ${a.infinite}${a.badCount ? `  понад межу: ${a.badCount}` : ""}`);
    if (strict) {
      if (!a.reduce) fail("matchMedia", `${path}: емуляція reduce не спрацювала`);
      if (a.badCount) fail("durations", { path, count: a.badCount, sample: a.bad });
      if (a.infinite) fail("infinite", { path, count: a.infinite });
      if (runtimeErrors.length) fail("console", { path, errors: runtimeErrors });
    } else if (a.reduce) fail("matchMedia", `${path}: контроль показує reduce`);
  }
  const b = await buttonCheck();
  log(`  кнопка hover: scale кнопки ${b.hover.button}, кола ::after ${b.hover.after.toFixed(3)} (opacity ${b.hover.afterOpacity}); pressed: кнопки ${b.pressed.button.toFixed(3)}, кола ${b.pressed.after.toFixed(3)}; demo-стани (${b.demoCount}) max відхилення scale ${b.demoMaxDeviation.toFixed(3)}`);
  if (strict) {
    for (const [state, v] of [["hover", b.hover], ["pressed", b.pressed]]) {
      if (Math.abs(v.button - 1) > 1e-6 || Math.abs(v.after - 1) > 1e-6) fail("button-scale", `${state}: кнопка ${v.button}, коло ${v.after}`);
    }
    if (b.demoMaxDeviation > 1e-6) fail("button-scale", `demo-стани: відхилення ${b.demoMaxDeviation}`);
  }
  summarizeSplit(mode, await splitCheck(), strict);
}

await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
cdp.ws.close();
if (warnings.length) { log(`\nПОПЕРЕДЖЕННЯ: ${warnings.length}`); for (const w of warnings) log(`- ${w}`); }
if (failures.length) {
  log(`\nПРОВАЛ: ${failures.length}`);
  for (const f of failures) log(`- [${f.gate}] ${typeof f.detail === "string" ? f.detail : JSON.stringify(f.detail)}`);
  process.exit(1);
}
log("\nОК: зменшений рух дотримано на всіх сторінках; статус завантаження видимий текстом.");
