#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const cdpPort = process.env.KOOTOOK_CDP_PORT || "9224";
const origin = process.argv[2] || "http://127.0.0.1";
const screenshotDir = resolve(".impeccable/review");
const lessonStates = [
  "listings.html", "listings-empty.html", "listings-error.html", "listings-loading.html",
  "listing.html", "listing-error.html", "listing-loading.html",
  "compatibility-form.html", "compatibility-form-error.html", "compatibility-form-loading.html",
  "application.html", "application-error.html", "application-loading.html"
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
    this.events = [];
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
      } else this.events.push(message);
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
    const prototype = document.body.classList.contains("course-nav--prototype");
    const main = document.querySelector("main");
    const product = document.querySelector(".product-header");
    const device = document.querySelector(".prototype-device");
    const deviceScreen = document.querySelector(".prototype-device__screen");
    const courseShell = document.querySelector("#course-shell");
    const oldSidebars = document.querySelectorAll("body > .mobtop, body > .mobile, .app > .sidebar").length;
    const rect = (node) => node ? Object.fromEntries(["left","right","top","bottom","width","height"].map(k => [k, Math.round(node.getBoundingClientRect()[k] * 100) / 100])) : null;
    return {
      path: location.pathname, prototype, innerWidth, innerHeight,
      documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      main: rect(main), product: rect(product),
      device: rect(device), deviceScreen: rect(deviceScreen), courseShell: rect(courseShell),
      deviceStyle: device ? {borderTopWidth:getComputedStyle(device).borderTopWidth, paddingLeft:getComputedStyle(device).paddingLeft, borderRadius:getComputedStyle(device).borderRadius} : null,
      productStyle: product ? {display:getComputedStyle(product).display, visibility:getComputedStyle(product).visibility, opacity:getComputedStyle(product).opacity, zIndex:getComputedStyle(product).zIndex} : null,
      oldSidebars,
      shellCount: document.querySelectorAll("#course-shell").length,
      activeCount: document.querySelectorAll("#course-shell [aria-current=page]").length,
      productLinks: document.querySelectorAll(".product-nav__link").length,
      bodyMinHeight: getComputedStyle(document.body).minHeight
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
  const { data } = await send("Page.captureScreenshot", {
    format: "png", fromSurface: true, captureBeyondViewport: false
  });
  await writeFile(resolve(screenshotDir, `webapp-${name}-${open ? "open" : "closed"}.png`), Buffer.from(data, "base64"));
}

await mkdir(screenshotDir, { recursive: true });
const matrixPaths = ["/kootok/", "/kootok/research.html", "/kootok/lesson-6-concept.html", ...lessonStates.map((name) => "/kootok/lesson-6/" + name)];
const layout = [];
for (const path of matrixPaths) for (const size of viewports) layout.push({ size, ...await metrics(path, size) });

const failures = [];
for (const item of layout) {
  if (item.overflow !== 0) failures.push(`${item.path} ${item.size.width}: overflow ${item.overflow}`);
  if (item.shellCount !== 1 || item.oldSidebars !== 0) failures.push(`${item.path}: shell=${item.shellCount}, legacy=${item.oldSidebars}`);
  if (item.activeCount !== 1) failures.push(`${item.path}: active routes=${item.activeCount}`);
  if (item.prototype) {
    const expected = Math.min(390, item.size.width);
    if (!item.main || Math.abs(item.main.width - expected) > 1) failures.push(`${item.path} ${item.size.width}: canvas=${item.main?.width}, expected=${expected}`);
    if (!item.deviceScreen || Math.abs(item.deviceScreen.width - expected) > 1) failures.push(`${item.path} ${item.size.width}: device screen=${item.deviceScreen?.width}, expected=${expected}`);
    const expectedNav = item.size.width <= 430 ? expected - 24 : expected - 20;
    if (!item.product || Math.abs(item.product.width - expectedNav) > 1) failures.push(`${item.path} ${item.size.width}: product nav=${item.product?.width}, expected floating width=${expectedNav}`);
    if (item.productLinks !== 5) failures.push(`${item.path}: product links=${item.productLinks}`);
    if (item.size.width <= 430 && (item.deviceStyle.borderTopWidth !== "0px" || item.deviceStyle.paddingLeft !== "0px" || item.deviceStyle.borderRadius !== "0px")) failures.push(`${item.path} ${item.size.width}: mobile device chrome is visible`);
    if (item.size.width > 430 && (item.device?.width !== 416 || item.deviceScreen?.width !== 390 || item.deviceStyle.borderTopWidth === "0px")) failures.push(`${item.path} ${item.size.width}: desktop device geometry incorrect`);
    if (item.size.width >= 900 && item.device.left < item.courseShell.right) failures.push(`${item.path} ${item.size.width}: device overlaps course tree`);
  }
}

await viewport(390, 844);
await navigate("/kootok/lesson-6/listings-empty.html");
const ariaBefore = await evaluate(`(() => { const b=document.querySelector('.course-mobilebar__open'); return {expanded:b.getAttribute('aria-expanded'), hidden:document.querySelector('#course-shell').getAttribute('aria-hidden')}; })()`);
await evaluate("document.querySelector('.course-mobilebar__open').click()");
const ariaOpen = await evaluate(`(() => ({expanded:document.querySelector('.course-mobilebar__open').getAttribute('aria-expanded'), hidden:document.querySelector('#course-shell').getAttribute('aria-hidden'), focus:document.activeElement.className}))()`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
const ariaClosed = await evaluate(`(() => ({expanded:document.querySelector('.course-mobilebar__open').getAttribute('aria-expanded'), hidden:document.querySelector('#course-shell').getAttribute('aria-hidden'), focus:document.activeElement.className}))()`);
if (ariaBefore.expanded !== "false" || ariaBefore.hidden !== "true") failures.push("Mobile drawer initial ARIA state incorrect");
if (ariaOpen.expanded !== "true" || ariaOpen.hidden !== "false" || !ariaOpen.focus.includes("course-shell__close")) failures.push("Mobile drawer open/focus state incorrect");
if (ariaClosed.expanded !== "false" || ariaClosed.hidden !== "true" || !ariaClosed.focus.includes("course-mobilebar__open")) failures.push("Escape did not close/restore focus");

await viewport(1440, 900);
await navigate("/kootok/research.html");
await evaluate("localStorage.removeItem('kootok-course-sidebar-collapsed'); document.documentElement.classList.remove('course-sidebar-collapsed'); document.querySelector('.course-shell__collapse').click()");
await send("Page.reload");
for (let attempt = 0; attempt < 60 && !(await evaluate("document.readyState === 'complete' && document.documentElement.classList.contains('has-course-nav')")); attempt += 1) await new Promise((ok) => setTimeout(ok, 50));
const persistence = await evaluate(`(() => ({collapsed:document.documentElement.classList.contains('course-sidebar-collapsed'), stored:localStorage.getItem('kootok-course-sidebar-collapsed'), expanded:document.querySelector('.course-shell__collapse').getAttribute('aria-expanded')}))()`);
if (!persistence.collapsed || persistence.stored !== "1" || persistence.expanded !== "false") failures.push("Desktop collapse persistence/ARIA incorrect");
await evaluate("document.querySelector('.course-shell__collapse').click()");

const screenshotPages = {
  root: "/kootok/", research: "/kootok/research.html",
  "listings-empty": "/kootok/lesson-6/listings-empty.html", listing: "/kootok/lesson-6/listing.html",
  form: "/kootok/lesson-6/compatibility-form.html", application: "/kootok/lesson-6/application.html"
};
for (const [name, path] of Object.entries(screenshotPages)) {
  await capture(name, path, false);
  await capture(name, path, true);
}

async function captureDesktopDevice(collapsed) {
  await viewport(1440, 900);
  await navigate("/kootok/lesson-6/listings-empty.html");
  await evaluate(`localStorage.setItem('kootok-course-sidebar-collapsed','${collapsed ? "1" : "0"}'); document.documentElement.classList.toggle('course-sidebar-collapsed',${collapsed});`);
  await new Promise((ok) => setTimeout(ok, 260));
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  await writeFile(resolve(screenshotDir, `device-desktop-tree-${collapsed ? "closed" : "open"}.png`), Buffer.from(data, "base64"));
}
await captureDesktopDevice(false);
await captureDesktopDevice(true);

const prototypeSummary = layout.filter((item) => item.prototype).reduce((acc, item) => {
  const key = String(item.size.width);
  acc[key] ||= { pages: 0, maxOverflow: 0, canvasWidths: new Set() };
  acc[key].pages += 1;
  acc[key].maxOverflow = Math.max(acc[key].maxOverflow, item.overflow);
  acc[key].canvasWidths.add(item.main?.width);
  return acc;
}, {});
for (const value of Object.values(prototypeSummary)) value.canvasWidths = [...value.canvasWidths];

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255).map((value) => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}
function contrast(foreground, background) {
  const a = luminance(foreground), b = luminance(background);
  return Math.round(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)) * 100) / 100;
}
const contrastPairs = {
  "text/canvas": ["#263b33", "#fbfcf9"], "muted/canvas": ["#5b6f67", "#fbfcf9"],
  "white/primary": ["#ffffff", "#365c4f"], "primary/mint": ["#365c4f", "#d7e8e0"],
  "accent-text/accent": ["#665d2d", "#faf5d9"], "success": ["#225541", "#dcefe7"],
  "error": ["#7d2d36", "#f7e0e2"], "info": ["#315a7c", "#e0ecf4"]
};
const contrasts = Object.fromEntries(Object.entries(contrastPairs).map(([name, pair]) => [name, contrast(...pair)]));
for (const [name, ratio] of Object.entries(contrasts)) if (ratio < 4.5) failures.push(`Contrast ${name}=${ratio}:1`);

const acceptance390 = layout.find((item) => item.path.endsWith("/lesson-6/listings-empty.html") && item.size.width === 390);
console.log(JSON.stringify({ origin, pages: matrixPaths.length, layoutChecks: layout.length, prototypeSummary, acceptance390, contrasts, aria: { before: ariaBefore, open: ariaOpen, closed: ariaClosed, persistence }, screenshots: Object.keys(screenshotPages).length * 2 + 2, failures }, null, 2));
await cdp.send("Target.closeTarget", { targetId });
cdp.socket.close();
if (failures.length) process.exitCode = 1;
