#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const cdpPort = process.env.KOOTOOK_CDP_PORT || "9224";
const origin = process.argv[2] || "http://127.0.0.1";
const noScreenshots = process.env.KOOTOOK_NO_SCREENSHOTS === "1";
const screenshotDir = resolve(".impeccable/review");
const lessonStates = [
  "chats.html", "chat.html", "profile.html",
  "listings.html", "listings-empty.html", "listings-error.html", "listings-loading.html",
  "listing.html", "listing-error.html", "listing-loading.html",
  "compatibility-form.html", "compatibility-form-error.html", "compatibility-form-loading.html",
  "application.html", "application-error.html", "application-loading.html", "application-sent.html"
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
      deviceStyle: device ? (()=>{const d=getComputedStyle(device),s=getComputedStyle(deviceScreen),before=getComputedStyle(device,'::before'),after=getComputedStyle(device,'::after'),controls=document.querySelector('.prototype-device__controls'); return {borderTopWidth:d.borderTopWidth,outlineWidth:s.outlineWidth,outlineStyle:s.outlineStyle,paddingLeft:d.paddingLeft,borderRadius:d.borderRadius,background:d.backgroundColor,screenBackground:s.backgroundColor,boxShadow:d.boxShadow,before:{content:before.content,width:before.width,height:before.height},after:{content:after.content,width:after.width,height:after.height},controlsDisplay:controls?getComputedStyle(controls).display:null,controlCount:document.querySelectorAll('.prototype-device__control').length};})() : null,
      productStyle: product ? {display:getComputedStyle(product).display, visibility:getComputedStyle(product).visibility, opacity:getComputedStyle(product).opacity, zIndex:getComputedStyle(product).zIndex} : null,
      oldSidebars,
      shellCount: document.querySelectorAll("#course-shell").length,
      activeCount: document.querySelectorAll("#course-shell [aria-current=page]").length,
      productLinks: document.querySelectorAll(".product-nav__link").length,
      backLinks: document.querySelectorAll(".prototype-device__content > header:not(.product-header) .back-link").length,
      contextualAppbars: document.querySelectorAll(".prototype-device__content > header:not(.product-header)").length,
      contentOffset: main && deviceScreen ? Math.round((main.getBoundingClientRect().top-deviceScreen.getBoundingClientRect().top)*100)/100 : null,
      bodyMinHeight: getComputedStyle(document.body).minHeight,
      shadowCount: Array.from(document.querySelectorAll(prototype ? "*" : ".course-shell,.course-shell *,.course-mobilebar,.course-mobilebar *,.course-shell__backdrop")).filter(node => { const s=getComputedStyle(node); return s.boxShadow!=="none" || s.textShadow!=="none" || s.filter.includes("drop-shadow"); }).length,
      avatarInvalid: Array.from(document.querySelectorAll(".profile-avatar,.chat-avatar:not(.avatar-pair),.avatar-pair img,.person-avatar,.listing-avatar:not(.is-loading)")).filter(node => { const r=node.getBoundingClientRect(),s=getComputedStyle(node); return Math.abs(r.width-r.height)>.5 || s.borderRadius!=="50%" || s.objectFit!=="cover"; }).length,
      secondaryBorderInvalid: Array.from(document.querySelectorAll('.secondary')).filter(node=>getComputedStyle(node).borderTopWidth!=='0px').length,
      ordinaryRadiusInvalid: prototype ? Array.from(document.querySelectorAll('.prototype-device__content button:not(.filters-fab):not(.filters-close),a.btn,.field input:not([type=radio]):not([type=checkbox]),.field select,.field textarea,.chat-search input,.composer input')).filter(node=>getComputedStyle(node).borderRadius!=='20px').length : 0,
      fieldStyleInvalid: prototype ? Array.from(document.querySelectorAll('.field input:not([type=radio]):not([type=checkbox]),.field select,.field textarea,.chat-search input,.composer input')).filter(node=>{const s=getComputedStyle(node); return s.borderTopWidth!=='0px' || s.borderRadius!=='20px' || s.backgroundColor!=='rgba(0, 0, 0, 0.05)';}).length : 0,
      contentCardBorderInvalid: Array.from(document.querySelectorAll('article.listing-card,.application-listing,.recap,.application-attachment,.conversation-context,.composer,.state-block,.profile-search > div')).filter(node=>getComputedStyle(node).borderTopWidth!=='0px').length,
      stateInvalid: Array.from(document.querySelectorAll('.state-block')).filter(node=>{const s=getComputedStyle(node),title=node.querySelector('.state-title'),cta=node.querySelector('a.btn'),well=title?getComputedStyle(title,'::before'):null,icon=title?getComputedStyle(title,'::after'):null,r=node.getBoundingClientRect(),cr=cta?.getBoundingClientRect(); return s.borderTopWidth!=='0px' || s.backgroundColor!=='rgba(0, 0, 0, 0)' || s.textAlign!=='center' || s.alignItems!=='center' || well?.width!=='64px' || well?.height!=='64px' || well?.borderRadius!=='50%' || well?.backgroundColor==='rgba(0, 0, 0, 0)' || !icon?.maskImage.includes('bold-duotone') || (cta && (Math.abs(cr.width-r.width)>1 || getComputedStyle(cta).borderRadius!=='20px'));}).length,
      stateGeometry: (()=>{const state=document.querySelector('.state-block'); if(!state)return null; const r=state.getBoundingClientRect(),sr=deviceScreen.getBoundingClientRect(),app=document.querySelector('.prototype-device__content > header:not(.product-header)')?.getBoundingClientRect(),nr=product.getBoundingClientRect(),availableTop=app?app.bottom:sr.top,availableBottom=nr.top; return {xDelta:Math.round(Math.abs((r.left+r.right)/2-(sr.left+sr.right)/2)*100)/100,yDelta:Math.round(Math.abs((r.top+r.bottom)/2-(availableTop+availableBottom)/2)*100)/100,navGap:Math.round((nr.top-r.bottom)*100)/100};})(),
      chatIdentityInvalid: Array.from(document.querySelectorAll('.chat-row')).filter(row=>row.querySelectorAll('img.chat-avatar').length!==1 || row.querySelector('.avatar-pair')).length + (document.querySelector('.chat-appbar-avatar') && document.querySelectorAll('.chat-appbar-avatar').length!==1 ? 1 : 0),
      fab: (()=>{const fab=document.querySelector('.filters-fab'),nav=document.querySelector('.product-header'),screen=document.querySelector('.prototype-device__screen'); if(!fab)return null; const r=fab.getBoundingClientRect(),n=nav.getBoundingClientRect(),sr=screen.getBoundingClientRect(),s=getComputedStyle(fab),icon=getComputedStyle(fab.querySelector('span')); return {width:r.width,height:r.height,radius:s.borderRadius,rightInset:Math.round((sr.right-r.right)*100)/100,navGap:Math.round((n.top-r.bottom)*100)/100,text:fab.textContent.trim(),label:fab.getAttribute('aria-label'),mask:icon.maskImage};})(),
      cardTrust: (() => { const cards=Array.from(document.querySelectorAll("article.listing-card")); return { cards:cards.length, mediaInvalid:cards.filter(card=>{const m=card.querySelector('.listing-card__media'); if(!m)return true; const r=m.getBoundingClientRect(); return Math.abs(r.width/r.height-1.5)>.02;}).length, avatars:document.querySelectorAll('.listing-avatar').length, chips:document.querySelectorAll('.trust-chips > span').length, dated:Array.from(document.querySelectorAll('.trust')).some(node=>/звіт від|\d{1,2}\s+(лип|сер)/i.test(node.textContent)), stripe: Array.from(document.querySelectorAll('.trust')).some(node=>getComputedStyle(node).backgroundColor!=='rgba(0, 0, 0, 0)')}; })(),
      chatGroupGaps: Array.from(document.querySelectorAll('.chat-row:has(.chat-avatar.avatar-pair)')).map(row=>{const a=row.querySelector('.chat-avatar.avatar-pair').getBoundingClientRect(),c=row.querySelector('.chat-copy').getBoundingClientRect(); return Math.round((c.left-a.right)*100)/100;})
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

if (!noScreenshots) await mkdir(screenshotDir, { recursive: true });
const matrixPaths = ["/kootok/", "/kootok/research.html", "/kootok/lesson-6-concept.html", ...lessonStates.map((name) => "/kootok/lesson-6/" + name)];
const layout = [];
for (const path of matrixPaths) for (const size of viewports) layout.push({ size, ...await metrics(path, size) });

const failures = [];
for (const item of layout) {
  if (item.overflow !== 0) failures.push(`${item.path} ${item.size.width}: overflow ${item.overflow}`);
  if (item.shellCount !== 1 || item.oldSidebars !== 0) failures.push(`${item.path}: shell=${item.shellCount}, legacy=${item.oldSidebars}`);
  if (item.activeCount !== 1) failures.push(`${item.path}: active routes=${item.activeCount}`);
  if (item.shadowCount !== 0) failures.push(`${item.path}: computed shadows=${item.shadowCount}`);
  if (item.avatarInvalid !== 0) failures.push(`${item.path}: invalid avatars=${item.avatarInvalid}`);
  if (item.secondaryBorderInvalid !== 0) failures.push(`${item.path}: secondary controls with borders=${item.secondaryBorderInvalid}`);
  if (item.ordinaryRadiusInvalid !== 0) failures.push(`${item.path}: ordinary control radius defects=${item.ordinaryRadiusInvalid}`);
  if (item.fieldStyleInvalid !== 0) failures.push(`${item.path}: field style defects=${item.fieldStyleInvalid}`);
  if (item.contentCardBorderInvalid !== 0) failures.push(`${item.path}: content card borders=${item.contentCardBorderInvalid}`);
  if (item.stateInvalid !== 0) failures.push(`${item.path}: empty/error state contract defects=${item.stateInvalid}`);
  if (item.stateGeometry && (item.stateGeometry.xDelta>2 || item.stateGeometry.yDelta>32 || item.stateGeometry.navGap<0)) failures.push(`${item.path}: state geometry=${JSON.stringify(item.stateGeometry)}`);
  if (item.chatIdentityInvalid !== 0) failures.push(`${item.path}: chat single-avatar contract defects=${item.chatIdentityInvalid}`);
  if (item.prototype) {
    const rootTab = /\/(listings(?:-empty|-error|-loading)?|chats|profile)\.html$/.test(item.path);
    if (item.backLinks !== (rootTab ? 0 : 1)) failures.push(`${item.path}: back links=${item.backLinks}, expected=${rootTab ? 0 : 1}`);
    if (item.contextualAppbars !== (rootTab ? 0 : 1)) failures.push(`${item.path}: contextual appbars=${item.contextualAppbars}, expected=${rootTab ? 0 : 1}`);
    if (rootTab && item.contentOffset > 40) failures.push(`${item.path}: root content keeps reserved appbar gap=${item.contentOffset}`);
    if (item.chatGroupGaps.some(gap=>gap < 8)) failures.push(`${item.path}: stacked avatar/text gap=${item.chatGroupGaps.join(',')}`);
    if (item.fab && (item.fab.width!==48 || item.fab.height!==48 || item.fab.radius!=='50%' || item.fab.rightInset!==16 || item.fab.navGap<8 || item.fab.text!=='' || item.fab.label!=='Відкрити фільтри' || !item.fab.mask.includes('bold-duotone'))) failures.push(`${item.path}: filter FAB contract incorrect`);
    if (/\/listings\.html$/.test(item.path) && (item.cardTrust.cards !== 5 || item.cardTrust.mediaInvalid || item.cardTrust.avatars !== 5 || item.cardTrust.chips < 5 || item.cardTrust.dated || item.cardTrust.stripe)) failures.push(`${item.path}: success card trust/media contract incorrect`);
    if (/\/listings-loading\.html$/.test(item.path) && (item.cardTrust.cards !== 4 || item.cardTrust.mediaInvalid || item.cardTrust.avatars !== 4)) failures.push(`${item.path}: loading card trust/media contract incorrect`);
    const expected = Math.min(390, item.size.width);
    if (!item.main || Math.abs(item.main.width - expected) > 1) failures.push(`${item.path} ${item.size.width}: canvas=${item.main?.width}, expected=${expected}`);
    if (!item.deviceScreen || Math.abs(item.deviceScreen.width - expected) > 1) failures.push(`${item.path} ${item.size.width}: device screen=${item.deviceScreen?.width}, expected=${expected}`);
    const expectedNav = item.size.width <= 430 ? expected - 24 : expected - 20;
    if (!item.product || Math.abs(item.product.width - expectedNav) > 1) failures.push(`${item.path} ${item.size.width}: product nav=${item.product?.width}, expected floating width=${expectedNav}`);
    if (item.productLinks !== 4) failures.push(`${item.path}: product links=${item.productLinks}`);
    if (item.size.width <= 430 && (item.deviceStyle.borderTopWidth !== "0px" || item.deviceStyle.paddingLeft !== "0px" || item.deviceStyle.borderRadius !== "0px")) failures.push(`${item.path} ${item.size.width}: mobile device chrome is visible`);
    if (item.size.width <= 430 && (item.deviceStyle.before.content !== "none" || item.deviceStyle.after.content !== "none" || item.deviceStyle.controlsDisplay !== null || item.deviceStyle.outlineStyle !== "none")) failures.push(`${item.path} ${item.size.width}: mobile decorative device details visible`);
    if (item.size.width > 430 && (item.device?.width !== 396 || item.deviceScreen?.width !== 390 || item.deviceStyle.borderTopWidth !== "1px" || item.deviceStyle.paddingLeft !== "2px" || item.deviceStyle.borderRadius !== "28px" || item.deviceStyle.outlineStyle !== "none" || item.deviceStyle.before.content !== "none" || item.deviceStyle.after.content !== "none" || item.deviceStyle.controlsDisplay !== null || item.deviceStyle.controlCount !== 0 || item.deviceStyle.boxShadow !== "none" || [item.deviceStyle.background,item.deviceStyle.screenBackground].some(color=>{const m=color.match(/\d+/g); return m && Number(m[0])<40 && Number(m[1])<40 && Number(m[2])<40;}))) failures.push(`${item.path} ${item.size.width}: neutral desktop frame contract incorrect`);
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

await navigate("/kootok/lesson-6/listings.html");
const filterInitial = await evaluate(`(() => { const fab=document.querySelector('.filters-fab'),sheet=document.querySelector('.filters'); return {expanded:fab?.getAttribute('aria-expanded'),open:sheet?.open,role:sheet?.getAttribute('role'),modal:sheet?.getAttribute('aria-modal')}; })()`);
await evaluate("document.querySelector('.filters-fab').focus(); document.querySelector('.filters-fab').click()");
const filterOpen = await evaluate(`(async() => { const fab=document.querySelector('.filters-fab'),sheet=document.querySelector('.filters'),close=document.querySelector('.filters-close'),body=document.querySelector('.filters-body'),r=close.getBoundingClientRect(),s=getComputedStyle(close),icon=getComputedStyle(close,'::before'); const old=body.scrollTop; body.scrollTop=Math.min(40,body.scrollHeight-body.clientHeight); await new Promise(requestAnimationFrame); const scrollMoved=body.scrollTop>old; body.scrollTop=old; return {expanded:fab.getAttribute('aria-expanded'),open:sheet.open,focus:document.activeElement.className,closeWidth:r.width,closeHeight:r.height,closeRadius:s.borderRadius,closeBorder:s.borderTopWidth,closeBackground:s.backgroundColor,closeMask:icon.maskImage,label:close.getAttribute('aria-label'),filterOverflow:getComputedStyle(body).overflowY,filterScrollbar:getComputedStyle(body).scrollbarWidth,filterScrollMoved:scrollMoved}; })()`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
const filterEscape = await evaluate(`(() => ({expanded:document.querySelector('.filters-fab').getAttribute('aria-expanded'),open:document.querySelector('.filters').open,focus:document.activeElement.className}))()`);
await evaluate("document.querySelector('.filters-fab').click(); document.querySelector('.filters-backdrop').click()");
const filterBackdrop = await evaluate(`(() => ({expanded:document.querySelector('.filters-fab').getAttribute('aria-expanded'),open:document.querySelector('.filters').open}))()`);
await evaluate("document.querySelector('.filters-fab').click(); document.querySelector('.filters form').requestSubmit()");
const filterSubmit = await evaluate(`(() => ({expanded:document.querySelector('.filters-fab').getAttribute('aria-expanded'),open:document.querySelector('.filters').open}))()`);
if (filterInitial.expanded !== "false" || filterInitial.open || filterInitial.role !== "dialog" || filterInitial.modal !== "true") failures.push("Filter sheet initial semantics incorrect");
if (filterOpen.expanded !== "true" || !filterOpen.open || !filterOpen.focus.includes("filters-close") || filterOpen.closeWidth !== 44 || filterOpen.closeHeight !== 44 || filterOpen.closeRadius !== "50%" || filterOpen.closeBorder !== "0px" || filterOpen.closeBackground !== "rgba(0, 0, 0, 0)" || !filterOpen.closeMask.includes("close-linear") || filterOpen.label !== "Закрити фільтри" || filterOpen.filterOverflow !== "auto" || filterOpen.filterScrollbar !== "none" || !filterOpen.filterScrollMoved) failures.push("Filter sheet open/focus/close/scroll state incorrect");
if (filterEscape.expanded !== "false" || filterEscape.open || !filterEscape.focus.includes("filters-fab")) failures.push("Filter Escape close/focus restore incorrect");
if (filterBackdrop.expanded !== "false" || filterBackdrop.open) failures.push("Filter backdrop close incorrect");
if (filterSubmit.expanded !== "false" || filterSubmit.open) failures.push("Filter apply did not close sheet");

await navigate("/kootok/lesson-6/listing.html");
const scrollMobileQA = await evaluate(`(async() => { const test=async(node,axis)=>{ if(!node)return null; const prop=axis==='x'?'scrollLeft':'scrollTop',max=axis==='x'?node.scrollWidth-node.clientWidth:node.scrollHeight-node.clientHeight,old=node[prop],behavior=node.style.scrollBehavior,snap=node.style.scrollSnapType; node.style.scrollBehavior='auto'; node.style.scrollSnapType='none'; node[prop]=max; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); const moved=Math.abs(node[prop]-old)>1; node[prop]=old; node.style.scrollBehavior=behavior; node.style.scrollSnapType=snap; const s=getComputedStyle(node); return {moved,max,overflow:axis==='x'?s.overflowX:s.overflowY,scrollbar:s.scrollbarWidth}; }; return {document:await test(document.scrollingElement,'y'),gallery:await test(document.querySelector('.gallery'),'x'),course:await test(document.querySelector('.course-shell__tree'),'y')}; })()`);
await viewport(1440,900);
await navigate("/kootok/lesson-6/listing.html");
const scrollDesktopQA = await evaluate(`(async() => { const node=document.querySelector('.prototype-device__content'),max=node.scrollHeight-node.clientHeight,old=node.scrollTop; node.scrollTop=Math.min(40,max); await new Promise(requestAnimationFrame); const moved=node.scrollTop>old; node.scrollTop=old; const s=getComputedStyle(node); return {moved,max,overflow:s.overflowY,scrollbar:s.scrollbarWidth}; })()`);
const scrollQA = {...scrollMobileQA,device:scrollDesktopQA};
for (const [name,test] of Object.entries(scrollQA)) if (!test || test.max<=0 || !test.moved || !["auto","scroll"].includes(test.overflow) || test.scrollbar!=="none") failures.push(`Hidden scrollbar/scroll behavior incorrect: ${name}`);

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
  chats: "/kootok/lesson-6/chats.html", chat: "/kootok/lesson-6/chat.html", profile: "/kootok/lesson-6/profile.html",
  "listings-empty": "/kootok/lesson-6/listings-empty.html", listing: "/kootok/lesson-6/listing.html",
  form: "/kootok/lesson-6/compatibility-form.html", application: "/kootok/lesson-6/application.html"
};
if (!noScreenshots) {
  for (const [name, path] of Object.entries(screenshotPages)) {
    await capture(name, path, false);
    await capture(name, path, true);
  }
}

async function captureDesktopDevice(collapsed) {
  await viewport(1440, 900);
  await navigate("/kootok/lesson-6/listings-empty.html");
  await evaluate(`localStorage.setItem('kootok-course-sidebar-collapsed','${collapsed ? "1" : "0"}'); document.documentElement.classList.toggle('course-sidebar-collapsed',${collapsed});`);
  await new Promise((ok) => setTimeout(ok, 260));
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  await writeFile(resolve(screenshotDir, `device-desktop-tree-${collapsed ? "closed" : "open"}.png`), Buffer.from(data, "base64"));
}
if (!noScreenshots) {
  await captureDesktopDevice(false);
  await captureDesktopDevice(true);
}

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
const chatGapSummary = layout.filter((item) => item.path.endsWith("/lesson-6/chats.html")).map((item) => ({ viewport:item.size.width, gaps:item.chatGroupGaps }));
const deviceShellSummary = layout.filter((item) => item.path.endsWith("/lesson-6/listings-empty.html")).map((item) => ({ viewport:item.size.width, shellWidth:item.device?.width, innerWidth:item.deviceScreen?.width, shell:item.deviceStyle, overlapsCourse:item.device && item.courseShell ? item.device.left < item.courseShell.right : false }));
console.log(JSON.stringify({ origin, pages: matrixPaths.length, layoutChecks: layout.length, prototypeSummary, acceptance390, chatGapSummary, deviceShellSummary, scrollQA, contrasts, aria: { before: ariaBefore, open: ariaOpen, closed: ariaClosed, persistence, filters: { initial:filterInitial, open:filterOpen, escape:filterEscape, backdrop:filterBackdrop, submit:filterSubmit } }, screenshots: noScreenshots ? 0 : Object.keys(screenshotPages).length * 2 + 2, failures }, null, 2));
await cdp.send("Target.closeTarget", { targetId });
cdp.socket.close();
if (failures.length) process.exitCode = 1;
