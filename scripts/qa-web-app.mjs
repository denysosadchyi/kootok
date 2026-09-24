#!/usr/bin/env node
// Як запускати: `cd /home/hp/from-den && python3 -m http.server 8791`, Chrome з --remote-debugging-port=N;
// `KOOTOOK_CDP_PORT=N node scripts/qa-web-app.mjs http://127.0.0.1:8791` (origin без /kootok; скріншоти — у os.tmpdir()/kootok-qa-web-app, KOOTOOK_NO_SCREENSHOTS=1 вимикає).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const cdpPort = process.env.KOOTOOK_CDP_PORT;
if (!cdpPort) { console.error("Потрібна змінна KOOTOOK_CDP_PORT (порт Chrome DevTools)."); process.exit(2); }
if (!process.argv[2]) { console.error("Потрібен origin першим аргументом, напр. http://127.0.0.1:8791 (без /kootok)."); process.exit(2); }
const origin = process.argv[2].replace(/\/+$/, "");
const noScreenshots = process.env.KOOTOOK_NO_SCREENSHOTS === "1";
const screenshotDir = process.env.KOOTOOK_QA_SCREENSHOTS || join(tmpdir(), "kootok-qa-web-app");
const root = resolve(new URL("..", import.meta.url).pathname);

// Лише активні маршрути: 4 екрани уроку 6 + перевірка системи (чати) + дві курсові сторінки.
// Окремих сторінок станів (*-loading/-empty/-error), chats.html і profile.html в уроці 6 більше немає.
const prototypeScreens = ["listings.html", "listing.html", "compatibility-form.html", "application.html"];
const matrixPaths = [
  "/kootok/",
  "/kootok/research.html",
  ...prototypeScreens.map((name) => "/kootok/lesson-6/" + name),
  "/kootok/design-system/examples/chats.html"
];
const viewports = [
  { width: 320, height: 568 }, { width: 390, height: 844 },
  { width: 430, height: 932 }, { width: 1440, height: 900 }
];

class CDP {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((ok, fail) => {
      this.socket.onopen = ok;
      this.socket.onerror = fail;
    });
    this.socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (message.id && this.pending.has(message.id)) {
        const { ok, fail } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) fail(new Error(message.error.message)); else ok(message.result);
      }
    };
  }
  async send(method, params = {}, sessionId) {
    await this.ready;
    const id = ++this.id;
    return new Promise((ok, fail) => {
      this.pending.set(id, { ok, fail });
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

async function viewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 900 });
}

async function navigate(path) {
  await send("Page.navigate", { url: origin + path });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await new Promise((ok) => setTimeout(ok, 50));
    const ready = await evaluate("document.readyState === 'complete' && document.documentElement.classList.contains('has-course-nav')");
    if (ready) break;
    if (attempt === 99) throw new Error("Timed out loading " + path);
  }
  await evaluate("document.fonts && document.fonts.ready");
  await evaluate("scrollTo(0, 0); new Promise(requestAnimationFrame)");
}

async function metrics(path, size) {
  await viewport(size.width, size.height);
  await navigate(path);
  return evaluate(`(() => {
    const deviceScreen = document.querySelector(".prototype-device__screen");
    const prototype = Boolean(deviceScreen);
    const courseShell = document.querySelector("#course-shell");
    const device = document.querySelector(".prototype-device");
    const dock = document.querySelector(".kit-tabbar--dock");
    const rect = (node) => node ? Object.fromEntries(["left","right","top","bottom","width","height"].map(k => [k, Math.round(node.getBoundingClientRect()[k] * 100) / 100])) : null;
    const shadowScope = prototype ? "*" : ".course-shell,.course-shell *,.course-mobilebar,.course-mobilebar *,.course-shell__backdrop";
    return {
      path: location.pathname, prototype, innerWidth,
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      deviceScreen: rect(deviceScreen), device: rect(device), courseShell: rect(courseShell), dock: rect(dock),
      legacySidebars: document.querySelectorAll("body > .mobtop, body > .mobile, .app > .sidebar").length,
      shellCount: document.querySelectorAll("#course-shell").length,
      activeCount: document.querySelectorAll("#course-shell [aria-current=page]").length,
      ownThemeButtons: document.querySelectorAll("#tt, #theme, .themebtn").length,
      shadowCount: Array.from(document.querySelectorAll(shadowScope)).filter(node => { const s=getComputedStyle(node); return s.boxShadow!=="none" || s.textShadow!=="none" || s.filter.includes("drop-shadow"); }).length,
      imagesWithoutAlt: document.querySelectorAll("img:not([alt])").length,
      hiddenButShown: Array.from(document.querySelectorAll("[hidden]")).filter(node => getComputedStyle(node).display !== "none").length
    };
  })()`);
}

async function capture(name, path, open) {
  await viewport(390, 844);
  await navigate(path);
  if (open) {
    await evaluate("document.querySelector('.course-mobilebar__open').click()");
    await new Promise((ok) => setTimeout(ok, 260));
  }
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  await writeFile(join(screenshotDir, `webapp-${name}-${open ? "open" : "closed"}.png`), Buffer.from(data, "base64"));
}

if (!noScreenshots) await mkdir(screenshotDir, { recursive: true });
const layout = [];
for (const path of matrixPaths) for (const size of viewports) layout.push({ size, ...await metrics(path, size) });

const failures = [];
for (const item of layout) {
  const label = `${item.path} ${item.size.width}`;
  if (item.overflow !== 0) failures.push(`${label}: overflow ${item.overflow}`);
  if (item.shellCount !== 1 || item.legacySidebars !== 0) failures.push(`${label}: shell=${item.shellCount}, legacy=${item.legacySidebars}`);
  if (item.activeCount !== 1) failures.push(`${label}: active routes=${item.activeCount}`);
  if (item.ownThemeButtons !== 0) failures.push(`${label}: page-level theme buttons=${item.ownThemeButtons} (має бути лише курсовий перемикач)`);
  if (item.shadowCount !== 0) failures.push(`${label}: computed shadows=${item.shadowCount}`);
  if (item.imagesWithoutAlt !== 0) failures.push(`${label}: images without alt=${item.imagesWithoutAlt}`);
  if (item.hiddenButShown !== 0) failures.push(`${label}: [hidden] elements still displayed=${item.hiddenButShown}`);
  if (item.prototype) {
    const expected = item.size.width <= 430 ? item.size.width : 390; // ≤430 px — без рамки на всю ширину
    if (Math.abs(item.deviceScreen.width - expected) > 1) failures.push(`${label}: device screen=${item.deviceScreen.width}, expected=${expected}`);
    if (item.size.width >= 900 && item.courseShell && item.device && item.device.left < item.courseShell.right) failures.push(`${label}: device overlaps course tree`);
  }
}

// Мобільна шухляда курсу: ARIA, фокус, Escape.
await viewport(390, 844);
await navigate("/kootok/lesson-6/listings.html");
const ariaBefore = await evaluate(`(() => { const b=document.querySelector('.course-mobilebar__open'); return {expanded:b.getAttribute('aria-expanded'), hidden:document.querySelector('#course-shell').getAttribute('aria-hidden')}; })()`);
await evaluate("document.querySelector('.course-mobilebar__open').click()");
const ariaOpen = await evaluate(`(() => ({expanded:document.querySelector('.course-mobilebar__open').getAttribute('aria-expanded'), hidden:document.querySelector('#course-shell').getAttribute('aria-hidden'), focus:document.activeElement.className}))()`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
const ariaClosed = await evaluate(`(() => ({expanded:document.querySelector('.course-mobilebar__open').getAttribute('aria-expanded'), hidden:document.querySelector('#course-shell').getAttribute('aria-hidden'), focus:document.activeElement.className}))()`);
if (ariaBefore.expanded !== "false" || ariaBefore.hidden !== "true") failures.push("Mobile drawer initial ARIA state incorrect");
if (ariaOpen.expanded !== "true" || ariaOpen.hidden !== "false" || !ariaOpen.focus.includes("course-shell__close")) failures.push("Mobile drawer open/focus state incorrect");
if (ariaClosed.expanded !== "false" || ariaClosed.hidden !== "true" || !ariaClosed.focus.includes("course-mobilebar__open")) failures.push("Escape did not close/restore focus");

// Шторка фільтрів: поведінковий контракт без прив'язки до класів (тригер з aria-controls → керована панель).
await navigate("/kootok/lesson-6/listings.html");
const visibleFn = "const visible=(node)=>!!node && (node.open===true || (node.open===undefined && !node.hidden && getComputedStyle(node).display!=='none' && getComputedStyle(node).visibility!=='hidden'));";
const filterInitial = await evaluate(`(() => { ${visibleFn} const t=document.querySelector('.kit-shell [aria-controls][aria-expanded]'); const s=t&&document.getElementById(t.getAttribute('aria-controls')); return {trigger:!!t, sheet:!!s, expanded:t?.getAttribute('aria-expanded'), visible:visible(s), triggers:s?document.querySelectorAll('[aria-controls="'+s.id+'"]').length:0, inlineToolbar:!!t?.closest('.kit-toolbar')}; })()`);
let filterOpen = null, filterEscape = null;
if (filterInitial.trigger && filterInitial.sheet) {
  await evaluate("(() => { const t=document.querySelector('.kit-shell [aria-controls][aria-expanded]'); t.focus(); t.click(); return true; })()");
  await new Promise((ok) => setTimeout(ok, 300));
  filterOpen = await evaluate(`(() => { ${visibleFn} const t=document.querySelector('.kit-shell [aria-controls][aria-expanded]'); const s=document.getElementById(t.getAttribute('aria-controls')); return {expanded:t.getAttribute('aria-expanded'), visible:visible(s), focusInside:s.contains(document.activeElement)}; })()`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await new Promise((ok) => setTimeout(ok, 300));
  filterEscape = await evaluate(`(() => { ${visibleFn} const t=document.querySelector('.kit-shell [aria-controls][aria-expanded]'); const s=document.getElementById(t.getAttribute('aria-controls')); return {expanded:t.getAttribute('aria-expanded'), visible:visible(s), focusReturned:document.activeElement===t}; })()`);
}
if (!filterInitial.trigger || !filterInitial.sheet) failures.push("Filter trigger (aria-controls/aria-expanded) or its sheet not found");
// Єдиний тригер шторки — кнопка «Фільтри» в toolbar стрічки; плаваючої кнопки (FAB) немає (2026-09-24).
else if (filterInitial.triggers !== 1 || !filterInitial.inlineToolbar) failures.push(`Filter sheet must have exactly one inline toolbar trigger, got ${filterInitial.triggers}`);
else {
  if (filterInitial.expanded !== "false" || filterInitial.visible) failures.push("Filter sheet initial state incorrect");
  if (filterOpen.expanded !== "true" || !filterOpen.visible || !filterOpen.focusInside) failures.push("Filter sheet open/focus state incorrect");
  if (filterEscape.expanded !== "false" || filterEscape.visible || !filterEscape.focusReturned) failures.push("Filter Escape close/focus restore incorrect");
}

// Прокрутка: документ на мобільному, вміст пристрою на десктопі.
await navigate("/kootok/lesson-6/listing.html");
const scrollMobile = await evaluate(`(async() => { const node=document.scrollingElement,max=node.scrollHeight-node.clientHeight,old=node.scrollTop,behavior=node.style.scrollBehavior; node.style.scrollBehavior='auto'; node.scrollTop=Math.min(40,max); await new Promise(requestAnimationFrame); const moved=node.scrollTop>old; node.scrollTop=old; node.style.scrollBehavior=behavior; return {moved,max}; })()`);
await viewport(1440, 900);
await navigate("/kootok/lesson-6/listing.html");
const scrollDesktop = await evaluate(`(async() => { const node=document.querySelector('.prototype-device__content'); if(!node) return null; const max=node.scrollHeight-node.clientHeight,old=node.scrollTop,behavior=node.style.scrollBehavior; node.style.scrollBehavior='auto'; node.scrollTop=Math.min(40,max); await new Promise(requestAnimationFrame); const moved=node.scrollTop>old; node.scrollTop=old; node.style.scrollBehavior=behavior; return {moved,max,overflow:getComputedStyle(node).overflowY}; })()`);
if (!scrollMobile.moved) failures.push("Mobile document does not scroll on listing.html");
if (!scrollDesktop || !scrollDesktop.moved || !["auto", "scroll"].includes(scrollDesktop.overflow)) failures.push("Desktop device content does not scroll on listing.html");

// Згорнута панель курсу на десктопі переживає перезавантаження.
await navigate("/kootok/research.html");
await evaluate("try{localStorage.removeItem('kootok-course-sidebar-collapsed')}catch(e){} document.documentElement.classList.remove('course-sidebar-collapsed'); document.querySelector('.course-shell__collapse').click()");
await send("Page.reload");
for (let attempt = 0; attempt < 60 && !(await evaluate("document.readyState === 'complete' && document.documentElement.classList.contains('has-course-nav')")); attempt += 1) await new Promise((ok) => setTimeout(ok, 50));
const persistence = await evaluate(`(() => ({collapsed:document.documentElement.classList.contains('course-sidebar-collapsed'), expanded:document.querySelector('.course-shell__collapse').getAttribute('aria-expanded')}))()`);
if (!persistence.collapsed || persistence.expanded !== "false") failures.push("Desktop collapse persistence/ARIA incorrect");
await evaluate("document.querySelector('.course-shell__collapse').click()");

// Єдиний ключ теми: курсовий перемикач пише kootok-color-theme і діє на уроках 1–5.
await navigate("/kootok/research.html");
const theme = await evaluate(`(async() => { const b=document.querySelector('.course-shell__theme'); if(!b) return null; const before=document.documentElement.dataset.theme, bg1=getComputedStyle(document.body).backgroundColor; b.click(); await new Promise(requestAnimationFrame); const after=document.documentElement.dataset.theme, bg2=getComputedStyle(document.body).backgroundColor; let stored=null; try{stored=localStorage.getItem('kootok-color-theme')}catch(e){} b.click(); return {before,after,stored,bodyChanged:bg1!==bg2}; })()`);
if (!theme || theme.before === theme.after || theme.stored !== theme.after || !theme.bodyChanged) failures.push(`Course theme toggle does not affect research.html: ${JSON.stringify(theme)}`);

const screenshotPages = {
  root: "/kootok/", research: "/kootok/research.html",
  listings: "/kootok/lesson-6/listings.html", listing: "/kootok/lesson-6/listing.html",
  form: "/kootok/lesson-6/compatibility-form.html", application: "/kootok/lesson-6/application.html",
  chats: "/kootok/design-system/examples/chats.html"
};
if (!noScreenshots) {
  for (const [name, path] of Object.entries(screenshotPages)) {
    await capture(name, path, false);
    await capture(name, path, true);
  }
}

// Контраст ключових пар — значення з frontmatter DESIGN.md (канон «Зелений двір»).
const frontmatter = (await readFile(join(root, "DESIGN.md"), "utf8")).split("---")[1] || "";
const colors = Object.fromEntries([...frontmatter.matchAll(/^\s+([\w-]+):\s*"(#[0-9a-fA-F]{6})"/gm)].map((match) => [match[1], match[2]]));
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255).map((value) => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}
function contrast(foreground, background) {
  const a = luminance(foreground), b = luminance(background);
  return Math.round(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)) * 100) / 100;
}
const contrastPairs = {
  "ink/canvas": ["ink", "canvas"], "muted/canvas": ["muted", "canvas"], "muted/white": ["muted", "white"],
  "white/forest": ["white", "forest"], "forest/mint": ["forest", "mint"], "ink/lime": ["ink", "lime"],
  "success": ["success", "success-bg"], "error": ["error", "error-bg"], "waiting": ["waiting", "waiting-bg"]
};
const contrasts = {};
for (const [name, [fg, bg]] of Object.entries(contrastPairs)) {
  if (!colors[fg] || !colors[bg]) { failures.push(`Contrast ${name}: колір відсутній у DESIGN.md`); continue; }
  contrasts[name] = contrast(colors[fg], colors[bg]);
  if (contrasts[name] < 4.5) failures.push(`Contrast ${name}=${contrasts[name]}:1`);
}

console.log(JSON.stringify({ origin, pages: matrixPaths.length, layoutChecks: layout.length, contrasts, aria: { before: ariaBefore, open: ariaOpen, closed: ariaClosed, persistence }, filters: { initial: filterInitial, open: filterOpen, escape: filterEscape }, scroll: { mobile: scrollMobile, desktop: scrollDesktop }, theme, screenshotDir: noScreenshots ? null : screenshotDir, screenshots: noScreenshots ? 0 : Object.keys(screenshotPages).length * 2, failures }, null, 2));
await cdp.send("Target.closeTarget", { targetId });
cdp.socket.close();
if (failures.length) process.exitCode = 1;
