#!/usr/bin/env node
// Як запускати: `cd /home/hp/from-den && python3 -m http.server 8791`, Chrome з --remote-debugging-port=N;
// `KOOTOOK_CDP_PORT=N node scripts/qa-listing-cards.mjs http://127.0.0.1:8791` (origin без /kootok; скріншоти — у os.tmpdir()/kootok-qa-listing-cards).

import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cdpPort = process.env.KOOTOOK_CDP_PORT;
if (!cdpPort) { console.error("Потрібна змінна KOOTOOK_CDP_PORT (порт Chrome DevTools)."); process.exit(2); }
if (!process.argv[2]) { console.error("Потрібен origin першим аргументом, напр. http://127.0.0.1:8791 (без /kootok)."); process.exit(2); }
const origin = process.argv[2].replace(/\/+$/, "");
const screenshotDir = process.env.KOOTOOK_QA_SCREENSHOTS || join(tmpdir(), "kootok-qa-listing-cards");

// Лише активні маршрути: 4 екрани уроку 6 + перевірка системи (чати). Стани loading/empty/error — усередині екранів.
const routes = [
  "/kootok/lesson-6/listings.html",
  "/kootok/lesson-6/listing.html",
  "/kootok/lesson-6/compatibility-form.html",
  "/kootok/lesson-6/application.html",
  "/kootok/design-system/examples/chats.html"
];
const sizes = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1440, height: 900 }
];
const LISTING_RATIO = 1.5; // 3:2 у стрічці (--ratio-listing-media)

class CDP {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((resolveReady, reject) => {
      this.socket.onopen = resolveReady;
      this.socket.onerror = reject;
    });
    this.socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolveRequest, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolveRequest(message.result);
    };
  }

  async send(method, params = {}, sessionId) {
    await this.ready;
    const id = ++this.id;
    return new Promise((resolveRequest, reject) => {
      this.pending.set(id, { resolveRequest, reject });
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
await mkdir(screenshotDir, { recursive: true });

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result.value;
}

async function open(route, size) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: size.width,
    height: size.height,
    deviceScaleFactor: 1,
    mobile: size.width < 900
  });
  await send("Page.navigate", { url: origin + route });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
    if (await evaluate("document.readyState === 'complete' && document.documentElement.classList.contains('has-course-nav')")) break;
    if (attempt === 99) throw new Error(`Timed out loading ${route}`);
  }
  await evaluate("document.fonts && document.fonts.ready");
  await evaluate("(document.querySelector('.prototype-device__content') || document.scrollingElement).scrollTo(0,0); new Promise(requestAnimationFrame)");
}

async function inspect(route, size) {
  await open(route, size);
  return evaluate(`(() => {
    const round = (value) => Math.round(value * 100) / 100;
    const box = (node) => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return Object.fromEntries(["top", "right", "bottom", "left", "width", "height"].map((key) => [key, round(rect[key])]));
    };
    const cards = [...document.querySelectorAll("article.kit-listing")].map((card) => {
      const media = card.querySelector(".kit-listing__media");
      const body = card.querySelector(".kit-listing__body");
      const image = card.querySelector("img.kit-listing__photo");
      const heading = card.querySelector("h3");
      const mediaBox = box(media), cardBox = box(card), bodyBox = box(body);
      return {
        card: cardBox, media: mediaBox, body: bodyBox,
        ratio: mediaBox && mediaBox.height ? round(mediaBox.width / mediaBox.height) : null,
        image: image ? { width: image.getAttribute("width"), height: image.getAttribute("height"), src: image.getAttribute("src"), alt: image.getAttribute("alt") } : null,
        headingOverflow: heading ? heading.scrollWidth > heading.clientWidth + 1 : true,
        focusTarget: Boolean(card.querySelector("h3 a[href]")),
        // Картка без деталі в прототипі чесно каже про це підказкою замість мертвого посилання.
        explainedNoDetail: !card.querySelector("a[href]") && Boolean([...card.querySelectorAll(".kit-hint")].some((hint) => hint.textContent.includes("не входить у прототип")))
      };
    });
    const screen = document.querySelector(".prototype-device__screen");
    const images = [...document.querySelectorAll("main img, .kit-shell img")];
    return {
      prototype: Boolean(screen),
      viewport: [innerWidth, innerHeight],
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      canvas: box(screen),
      cards,
      imagesWithoutAlt: images.filter((image) => !image.hasAttribute("alt")).length,
      imagesWithoutSize: images.filter((image) => !image.getAttribute("width") || !image.getAttribute("height")).map((image) => image.getAttribute("src"))
    };
  })()`);
}

async function screenshot(route, size, name) {
  await open(route, size);
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  await writeFile(join(screenshotDir, name), Buffer.from(data, "base64"));
}

const matrix = [];
const failures = [];
const warnings = [];
for (const route of routes) {
  for (const size of sizes) {
    const result = await inspect(route, size);
    matrix.push({ route, width: size.width, overflow: result.overflow, canvas: result.canvas?.width ?? null, cards: result.cards.length });
    const label = `${route} ${size.width}`;
    if (result.overflow !== 0) failures.push(`${label}: overflow=${result.overflow}`);
    // ≤430 px: екран на всю ширину без рамки; ширше — полотно 390 px у рамці пристрою.
    const expectedCanvas = size.width <= 430 ? size.width : 390;
    if (result.prototype && Math.abs(result.canvas.width - expectedCanvas) > 1) failures.push(`${label}: canvas=${result.canvas.width}, expected=${expectedCanvas}`);
    if (result.imagesWithoutAlt) failures.push(`${label}: images without alt=${result.imagesWithoutAlt}`);
    if (result.imagesWithoutSize.length && size.width === 390) warnings.push(`${label}: images without intrinsic size: ${result.imagesWithoutSize.join(", ")}`);
    if (route.endsWith("/listings.html")) {
      if (result.cards.length !== 5) failures.push(`${label}: cards=${result.cards.length}, expected 5`);
      result.cards.forEach((card, index) => {
        const tag = `${label} card ${index + 1}`;
        if (!card.media || !card.body) { failures.push(`${tag}: media/body missing`); return; }
        if (Math.abs(card.media.width - card.card.width) > 1 || card.media.bottom > card.body.top + 1) failures.push(`${tag}: media is not full-width/top`);
        if (Math.abs(card.ratio - LISTING_RATIO) > .02) failures.push(`${tag}: media ratio=${card.ratio}, expected 3:2`);
        if (card.headingOverflow) failures.push(`${tag}: heading overflow`);
        if (!card.focusTarget && !card.explainedNoDetail) failures.push(`${tag}: heading has no link and no «не входить у прототип» hint`);
        if (!card.image || !card.image.width || !card.image.height || !card.image.src?.startsWith("assets/rooms/")) failures.push(`${tag}: image source/intrinsic dimensions incomplete`);
      });
    }
  }
}

await screenshot(routes[0], sizes[1], "cards-390.png");
await screenshot(routes[0], sizes[3], "cards-device.png");

console.log(JSON.stringify({ origin, screenshotDir, matrix, screenshots: 2, warnings, failures }, null, 2));
await cdp.send("Target.closeTarget", { targetId });
cdp.socket.close();
if (failures.length) process.exitCode = 1;
