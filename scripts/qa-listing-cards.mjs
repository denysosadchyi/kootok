#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const cdpPort = process.env.KOOTOOK_CDP_PORT || "9224";
const origin = process.argv[2] || "http://127.0.0.1";
const screenshotDir = resolve(".impeccable/review");
const routes = ["listings.html", "listings-loading.html"];
const sizes = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1440, height: 900 }
];

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
  await send("Page.navigate", { url: `${origin}/kootok/lesson-6/${route}` });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
    if (await evaluate("document.readyState === 'complete' && document.documentElement.classList.contains('has-course-nav')")) break;
    if (attempt === 99) throw new Error(`Timed out loading ${route}`);
  }
  await evaluate("document.fonts && document.fonts.ready");
  await evaluate("document.querySelector('.prototype-device__content').scrollTo(0,0); new Promise(requestAnimationFrame)");
}

async function inspect(route, size) {
  await open(route, size);
  return evaluate(`(() => {
    const round = (value) => Math.round(value * 100) / 100;
    const box = (node) => {
      const rect = node.getBoundingClientRect();
      return Object.fromEntries(["top", "right", "bottom", "left", "width", "height"].map((key) => [key, round(rect[key])]));
    };
    const cards = [...document.querySelectorAll("article.listing-card")];
    const success = !document.querySelector("article.listing-card.is-loading");
    const first = cards[0];
    const media = first?.querySelector(".listing-card__photo,.placeholder");
    const body = first?.querySelector(".card-body");
    const screen = document.querySelector(".prototype-device__screen");
    const device = document.querySelector(".prototype-device");
    const headings = cards.map((card) => card.querySelector("h3")).filter(Boolean);
    return {
      success,
      viewport: [innerWidth, innerHeight],
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      canvas: box(screen),
      device: box(device),
      cards: cards.length,
      images: document.querySelectorAll("article.listing-card img").length,
      placeholders: document.querySelectorAll("article.listing-card .placeholder").length,
      cardDirection: getComputedStyle(first).flexDirection,
      card: box(first),
      media: box(media),
      body: box(body),
      mediaRatio: round(media.getBoundingClientRect().width / media.getBoundingClientRect().height),
      mediaBackground: getComputedStyle(media).backgroundImage,
      headingOverflow: headings.some((heading) => heading.scrollWidth > heading.clientWidth || heading.scrollHeight > heading.clientHeight),
      trustOff: Boolean(document.querySelector(".trust-off")),
      focusTarget: Boolean(first?.querySelector("h3 a[href='listing.html']")),
      imageDimensions: [...document.querySelectorAll("article.listing-card img")].map((image) => [image.getAttribute("width"), image.getAttribute("height"), image.getAttribute("src")])
    };
  })()`);
}

async function screenshot(route, size, name) {
  await open(route, size);
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  await writeFile(resolve(screenshotDir, name), Buffer.from(data, "base64"));
}

const matrix = [];
const failures = [];
for (const route of routes) {
  for (const size of sizes) {
    const result = await inspect(route, size);
    matrix.push({ route, ...result });
    const expectedCanvas = Math.min(390, size.width);
    if (result.overflow !== 0) failures.push(`${route} ${size.width}: overflow=${result.overflow}`);
    if (Math.abs(result.canvas.width - expectedCanvas) > 1) failures.push(`${route} ${size.width}: canvas=${result.canvas.width}`);
    if (size.width > 430 && (result.device.width !== 416 || result.canvas.width !== 390)) failures.push(`${route} ${size.width}: device contract drift`);
    if (result.cardDirection !== "column") failures.push(`${route} ${size.width}: card direction=${result.cardDirection}`);
    if (Math.abs(result.media.width - result.card.width) > 1 || result.media.bottom > result.body.top + 1) failures.push(`${route} ${size.width}: media is not full-width/top`);
    if (Math.abs(result.mediaRatio - 1.5) > .02) failures.push(`${route} ${size.width}: media ratio=${result.mediaRatio}`);
    if (result.headingOverflow) failures.push(`${route} ${size.width}: heading overflow`);
    if (result.success && (result.cards !== 5 || result.images !== 5 || !result.trustOff || !result.focusTarget)) failures.push(`${route} ${size.width}: success state coverage incomplete`);
    if (!result.success && (result.images !== 0 || result.placeholders !== 4 || result.mediaBackground !== "none")) failures.push(`${route} ${size.width}: loading leaks real media`);
    if (result.success && result.imageDimensions.some(([width, height, src]) => !width || !height || !src?.startsWith("assets/listings/"))) failures.push(`${route} ${size.width}: image source/intrinsic dimensions incomplete`);
  }
}

await screenshot("listings.html", sizes[1], "cards-success-390.png");
await screenshot("listings-loading.html", sizes[1], "cards-loading-390.png");
await screenshot("listings.html", sizes[3], "cards-success-device.png");
await screenshot("listings-loading.html", sizes[3], "cards-loading-device.png");

console.log(JSON.stringify({ matrix, screenshots: 4, failures }, null, 2));
await cdp.send("Target.closeTarget", { targetId });
cdp.socket.close();
if (failures.length) process.exitCode = 1;
