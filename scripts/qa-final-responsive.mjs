#!/usr/bin/env node
// Як запускати: `cd /home/hp/from-den && python3 -m http.server 8791`, Chrome з --remote-debugging-port=N;
// `KOOTOOK_CDP_PORT=N node scripts/qa-final-responsive.mjs http://127.0.0.1:8791` (origin без /kootok).

const cdpPort = process.env.KOOTOOK_CDP_PORT;
if (!cdpPort) { console.error("Потрібна змінна KOOTOOK_CDP_PORT (порт Chrome DevTools)."); process.exit(2); }
if (!process.argv[2]) { console.error("Потрібен origin першим аргументом, напр. http://127.0.0.1:8791 (без /kootok)."); process.exit(2); }
const origin = process.argv[2].replace(/\/+$/, "");
// 5 екранів уроку 6 у курсовій рамці: 4 макети lesson-6/ + «Чати» (design-system/examples/chats.html).
const pages = ["listings.html", "listing.html", "compatibility-form.html", "application.html", "chats.html"];
const pagePath = (page) => page === "chats.html" ? "/kootok/design-system/examples/chats.html" : `/kootok/lesson-6/${page}`;
// Курсова панель «Екрани уроку 6» — ті самі 5 екранів.
const familyLabels = ["Пошук", "Оголошення", "Сумісність", "Заявка", "Чати"];
const dockScreens = { "listings.html": "listings.html", "chats.html": "/kootok/design-system/examples/chats.html" };
const dockCurrentLabel = { "listings.html": "Пошук", "chats.html": "Чати" };
// Dock за IA для ролі шукачки: 3 пункти, поточний — «Пошук».
const dockLabels = ["Пошук", "Чати", "Профіль"];
const viewports = [320, 390, 430, 1440];

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

const results = [];
for (const page of pages) {
  for (const width of viewports) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: width === 320 ? 568 : width === 390 ? 844 : width === 430 ? 932 : 900, deviceScaleFactor: 1, mobile: width < 900 });
    await send("Page.navigate", { url: `${origin}${pagePath(page)}` });
    for (let attempt = 0; attempt < 100; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (await evaluate(`document.readyState === 'complete' && location.pathname.endsWith('/${page}') && document.documentElement.classList.contains('has-course-nav')`)) break;
      if (attempt === 99) throw new Error(`Timed out: ${page} at ${width}`);
    }
    const metrics = await evaluate(`(() => {
      const rect = (selector) => { const node = document.querySelector(selector); return node ? node.getBoundingClientRect().width : null; };
      const device = document.querySelector('.prototype-device');
      return {
        canvas: rect('.kit-shell'), device: rect('.prototype-device'), screen: rect('.prototype-device__screen'),
        overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), border: device ? getComputedStyle(device).borderTopWidth : null,
        familyLabels: [...document.querySelectorAll('.lesson-family-panel a')].map(node => node.textContent.trim()),
        tabLabels: [...document.querySelectorAll('.kit-tabbar a')].map(node => node.textContent.trim()),
        currentTab: document.querySelector('.kit-tabbar [aria-current="page"]')?.getAttribute('href'),
        currentTabLabel: document.querySelector('.kit-tabbar [aria-current="page"]')?.textContent.trim(),
        familyCurrent: document.querySelector('.lesson-family-panel a[aria-current="page"]')?.textContent.trim() || null,
        stateLinks: document.querySelectorAll('.state-switcher').length,
        // Статичний вміст поза прототипом (рядки чатів, картки без деталі) не виглядає вимкненим.
        fadedContent: [...document.querySelectorAll('.kit-chat-row, .kit-listing')].filter(node => parseFloat(getComputedStyle(node).opacity) < 1).length,
        productRoutes: [...document.querySelectorAll('.prototype-device a[href], .prototype-device form[action]')].map(node => new URL(node.getAttribute('href') || node.getAttribute('action'), location.href).pathname.split('/').pop())
      };
    })()`);
    results.push({ page, width, ...metrics });
    if (page === 'application.html') {
      const feedback = await evaluate(`(() => { document.getElementById('application-message').value='Хочу познайомитися й домовитися про перегляд.'; const form=document.querySelector('[data-prototype-application]'); form.requestSubmit(); const result=document.getElementById('prototype-result'); return { path: location.pathname, focus: document.activeElement.id, hidden: result.hidden, resultDisplay: getComputedStyle(result).display, formDisplay: getComputedStyle(form).display, text: result.textContent }; })()`);
      if (!feedback.path.endsWith('/application.html') || feedback.focus !== 'prototype-result' || feedback.hidden || feedback.resultDisplay === 'none' || !feedback.text.includes('заявку не надіслано')) throw new Error('Application left the early prototype or lacks honest feedback');
      if (feedback.formDisplay !== 'none') throw new Error(`Application form stays visible after submit (display: ${feedback.formDisplay})`);
    }
  }
}

const failures = results.filter((item) => {
  const expectedCanvas = item.width <= 430 ? item.width : 390;
  const expectedTabs = dockScreens[item.page] ? dockLabels : [];
  const expectedCurrentTab = dockScreens[item.page];
  const expectedCurrentLabel = dockCurrentLabel[item.page];
  const expectedFamily = familyLabels[pages.indexOf(item.page)];
  return Math.abs(item.canvas - expectedCanvas) > 0.1 || item.overflow !== 0 ||
    (item.width <= 430 ? item.border !== "0px" : item.border !== "1px") ||
    JSON.stringify(item.familyLabels) !== JSON.stringify(familyLabels) || JSON.stringify(item.tabLabels) !== JSON.stringify(expectedTabs) ||
    item.currentTab !== expectedCurrentTab || item.currentTabLabel !== expectedCurrentLabel ||
    item.familyCurrent !== expectedFamily || item.stateLinks !== 0 || item.fadedContent !== 0 || item.productRoutes.some(route => !pages.includes(route));
});
console.log(JSON.stringify({ checks: results.length, failures, results }, null, 2));
await send("Target.closeTarget", { targetId });
cdp.socket.close();
if (failures.length) process.exitCode = 1;
