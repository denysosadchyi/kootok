#!/usr/bin/env node
// Як запускати: `cd /home/hp/from-den && python3 -m http.server 8791`, Chrome з --remote-debugging-port=N;
// `KOOTOOK_CDP_PORT=N node scripts/qa-polish.mjs http://127.0.0.1:8791` (origin без /kootok; скріншоти — у os.tmpdir()/kootok-qa-polish).

import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cdpPort = process.env.KOOTOOK_CDP_PORT;
if (!cdpPort) { console.error("Потрібна змінна KOOTOOK_CDP_PORT (порт Chrome DevTools)."); process.exit(2); }
if (!process.argv[2]) { console.error("Потрібен origin першим аргументом, напр. http://127.0.0.1:8791 (без /kootok)."); process.exit(2); }
const origin = process.argv[2].replace(/\/+$/, "");
const outputDirectory = process.env.KOOTOOK_QA_SCREENSHOTS || join(tmpdir(), "kootok-qa-polish");
const pages = ["listings.html", "listing.html", "compatibility-form.html", "application.html"];
const viewports = [
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

await mkdir(outputDirectory, { recursive: true });
const version = await fetch(`http://127.0.0.1:${cdpPort}/json/version`).then((response) => response.json());
const cdp = new CDP(version.webSocketDebuggerUrl);
const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
const send = (method, params = {}) => cdp.send(method, params, sessionId);
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__qaCumulativeLayoutShift = 0;
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__qaCumulativeLayoutShift += entry.value;
  }).observe({type:'layout-shift', buffered:true});
` });

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

async function capture(name, full = false) {
  const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: full });
  await writeFile(`${outputDirectory}/${name}.png`, Buffer.from(result.data, "base64"));
}

async function navigate(page, viewport) {
  await send("Emulation.setDeviceMetricsOverride", { ...viewport, screenWidth: viewport.width, screenHeight: viewport.height, deviceScaleFactor: 1, mobile: viewport.width < 900 });
  await send("Page.navigate", { url: `${origin}/kootok/lesson-6/${page}?qa-polish=${viewport.width}` });
  await waitFor(`document.readyState === 'complete' && location.pathname.endsWith('/${page}') && document.documentElement.classList.contains('has-course-nav')`, `${page} at ${viewport.width}`);
  if (page === "compatibility-form.html") {
    const hadDraft = await evaluate(`localStorage.getItem('kutok-compatibility-draft-v1') !== null`);
    if (hadDraft) {
      await evaluate(`localStorage.removeItem('kutok-compatibility-draft-v1'); location.reload(); true`);
      await waitFor(`document.readyState === 'complete' && document.documentElement.classList.contains('has-course-nav')`, `${page} clean draft at ${viewport.width}`);
    }
  }
  await evaluate(`document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))`);
  await new Promise((resolve) => setTimeout(resolve, 260));
  await evaluate(`window.__qaCumulativeLayoutShift = 0; new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))`);
}

async function readListingsGeometry() {
  await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))`);
  return evaluate(`(() => {
    const productViewport=document.querySelector('.prototype-device__screen')||document.documentElement;
    const viewportRect=productViewport.getBoundingClientRect();
    const read=node=>{
      if(!node)return null;
      const rect=node.getBoundingClientRect();
      return {
        text:node.textContent.replace(/\\s+/g,' ').trim(),
        left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),
        clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,
        fullyInside:rect.left>=viewportRect.left-.5&&rect.right<=viewportRect.right+.5&&rect.width>0,
        textUnclipped:node.scrollWidth<=node.clientWidth
      };
    };
    const brand=read(document.querySelector('.kit-shell__brand a'));
    const filter=read(document.querySelector('.kit-button--icon-filter'));
    const dock=read(document.querySelector('.kit-tabbar'));
    const tabs=[...document.querySelectorAll('.kit-tabbar .kit-tab')].map(read);
    const scrollers=[document.scrollingElement,document.documentElement,document.body,document.querySelector('.prototype-device__content'),productViewport].filter(Boolean);
    const scrollLeft=scrollers.map(node=>({node:node.className||node.tagName,left:Math.round(node.scrollLeft)}));
    const labels=tabs.map(tab=>tab.text);
    return {
      viewport:{left:Math.round(viewportRect.left),right:Math.round(viewportRect.right),width:Math.round(viewportRect.width)},
      brand,filter,dock,tabs,scrollLeft,
      pass:brand?.text==='Куток'&&brand.fullyInside&&brand.textUnclipped&&filter?.text==='Фільтри'&&filter.fullyInside&&filter.textUnclipped&&dock?.fullyInside&&labels.join('|')==='Пошук|Чати|Профіль'&&tabs.every(tab=>tab.fullyInside&&tab.textUnclipped)&&scrollLeft.every(item=>item.left===0)
    };
  })()`);
}

async function readContentGrid(page) {
  const selectors = {
    "listings.html": ".kit-listing",
    "listing.html": ".kit-card--head,.kit-card--section",
    "compatibility-form.html": ".kit-step:not([hidden]) .kit-fieldset",
    "application.html": ".kit-conversation-context,.kit-application-card"
  };
  const expectedCounts = { "listings.html": 5, "listing.html": 6, "compatibility-form.html": 2, "application.html": 2 };
  return evaluate(`(() => {
    const shell=document.querySelector('.kit-shell');
    const shellRect=shell.getBoundingClientRect();
    const cards=[...document.querySelectorAll(${JSON.stringify(selectors[page])})].filter(node=>{const style=getComputedStyle(node);return !node.hidden&&style.display!=='none'&&style.visibility!=='hidden'}).sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
    const bounds=cards.map(node=>{const rect=node.getBoundingClientRect();return {className:node.className,left:Number((rect.left-shellRect.left).toFixed(2)),right:Number((shellRect.right-rect.right).toFixed(2)),top:Number(rect.top.toFixed(2)),bottom:Number(rect.bottom.toFixed(2)),background:getComputedStyle(node).backgroundColor}});
    const gaps=bounds.slice(1).map((item,index)=>Number((item.top-bounds[index].bottom).toFixed(2)));
    const gallery=document.querySelector('.kit-gallery');
    const galleryRect=gallery?.getBoundingClientRect();
    const galleryBounds=galleryRect?{left:Number((galleryRect.left-shellRect.left).toFixed(2)),right:Number((shellRect.right-galleryRect.right).toFixed(2)),scrollLeft:Number(gallery.scrollLeft.toFixed(2)),clientWidth:gallery.clientWidth,scrollWidth:gallery.scrollWidth}:null;
    const ownedHeadings=[...document.querySelectorAll('.kit-card--section,.kit-fieldset,.kit-application-card')].filter(node=>getComputedStyle(node).display!=='none'&&!node.closest('[hidden]')).map(node=>({className:node.className,first:node.firstElementChild?.tagName||null,inside:Boolean(node.firstElementChild?.matches('h2,legend'))}));
    const removedStatus=[...document.querySelectorAll('.kit-listing')].filter(node=>node.textContent.includes('Профіль заповнено')).length;
    return {shell:{left:Math.round(shellRect.left),right:Math.round(shellRect.right),width:Math.round(shellRect.width)},bounds,gaps,galleryBounds,ownedHeadings,removedStatus,pass:cards.length===${expectedCounts[page]}&&bounds.every(item=>Math.abs(item.left-16)<.51&&Math.abs(item.right-16)<.51)&&gaps.every(gap=>Math.abs(gap-16)<.51)&&ownedHeadings.every(item=>item.inside)&&removedStatus===0&&(${JSON.stringify(page)}!=='listing.html'||galleryBounds&&Math.abs(galleryBounds.left-16)<.51&&Math.abs(galleryBounds.right-16)<.51&&(gallery.children.length<2||galleryBounds.scrollWidth>galleryBounds.clientWidth))};
  })()`);
}

const audits = [];
const interactionFailures = [];
const geometryFailures = [];
const gridFailures = [];
for (const page of pages) {
  for (const viewport of viewports) {
    await navigate(page, viewport);
    const slug = `${page.replace(".html", "")}-${viewport.width}`;
    const initial = await evaluate(`(() => {
      const shell = document.querySelector('.kit-shell');
      const nav = document.querySelector('.kit-tabbar');
      const footer = document.querySelector('.kit-footer');
      const deviceScreen = document.querySelector('.prototype-device__screen');
      const deviceContent = document.querySelector('.prototype-device__content');
      const cards = [...document.querySelectorAll('.kit-card,.kit-fieldset,.kit-listing')];
      const sectionHeadingOutsideCard = [...document.querySelectorAll('.kit-section__title')].filter(node => !node.closest('.kit-card')).length;
      const sectionHeadingGeometry = [...document.querySelectorAll('.kit-section__title')].map(node => {
        const card = node.closest('.kit-card');
        const next = node.nextElementSibling;
        const cardRect = card?.getBoundingClientRect();
        const headingRect = node.getBoundingClientRect();
        const nextRect = next?.getBoundingClientRect();
        return {
          id: node.id,
          direct: node.parentElement === card,
          inset: cardRect ? Math.round(headingRect.left - cardRect.left) : null,
          nextInset: cardRect && nextRect ? Math.round(nextRect.left - cardRect.left) : null
        };
      });
      return {
        viewport: { width: innerWidth, height: innerHeight },
        device: deviceScreen && deviceContent ? { screenHeight: deviceScreen.clientHeight, contentHeight: deviceContent.clientHeight, contentCssHeight: getComputedStyle(deviceContent).height, overflowY: getComputedStyle(deviceContent).overflowY } : null,
        overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        canvas: getComputedStyle(shell).backgroundColor,
        card: cards[0] ? getComputedStyle(cards[0]).backgroundColor : null,
        tabs: nav ? [...nav.querySelectorAll('a')].map(node => node.textContent.trim()) : [],
        navPosition: nav ? getComputedStyle(nav).position : null,
        navAfterMain: nav ? Boolean(document.querySelector('main').compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING) : null,
        fixedProductControls: [...shell.querySelectorAll('*')].filter(node => { const style=getComputedStyle(node); return ['fixed','sticky'].includes(style.position) && style.visibility!=='hidden' && style.display!=='none'; }).map(node => node.className),
        fonts: {
          status: document.fonts.status,
          jostCyrillic: document.fonts.check('700 16px "Jost"', 'Ґанок їжак є Київ'),
          golosCyrillic: document.fonts.check('400 15px "Golos Text"', 'Ґанок їжак є Київ'),
          jostFaces: [...document.fonts].filter(face => face.family.includes('Jost') && face.status === 'loaded').length,
          golosFaces: [...document.fonts].filter(face => face.family.includes('Golos Text') && face.status === 'loaded').length,
          displayFamily: getComputedStyle(document.querySelector('.kit-headline,.kit-shell__title')).fontFamily,
          bodyFamily: getComputedStyle(document.querySelector('.kit-meta,.kit-choice,.kit-hint,.kit-shell__body p:not(.kit-price)')).fontFamily,
          localRequests: performance.getEntriesByType('resource').filter(entry => entry.name.includes('/assets/fonts/')).map(entry => new URL(entry.name).pathname),
          remoteRequests: performance.getEntriesByType('resource').filter(entry => /fonts\.(googleapis|gstatic)\.com/.test(entry.name)).map(entry => entry.name),
          cls: Number((window.__qaCumulativeLayoutShift || 0).toFixed(4))
        },
        sectionHeadingOutsideCard,
        sectionHeadingGeometry,
        endpoint: nav ? 'nav' : (footer ? 'footer' : null)
      };
    })()`);
    const initialGeometry = page === "listings.html" ? await readListingsGeometry() : null;
    if (initialGeometry && !initialGeometry.pass) geometryFailures.push({ page, width: viewport.width, state: "initial", ...initialGeometry });
    const initialGrid = await readContentGrid(page);
    if (!initialGrid.pass) gridFailures.push({ page, width: viewport.width, state: "initial", ...initialGrid });
    await capture(`${slug}-top`);

    if (page === "listings.html") {
      await evaluate(`(() => { const candidate=document.querySelector('.prototype-device__content'); const scroller=candidate&&getComputedStyle(candidate).overflowY==='auto'?candidate:document.scrollingElement; if(scroller===document.scrollingElement) scrollTo({top:scroller.scrollHeight/2,behavior:'instant'}); else scroller.scrollTop=scroller.scrollHeight/2; return true; })()`);
      await new Promise((resolve) => setTimeout(resolve, 250));
      await evaluate(`Promise.race([Promise.all([...document.images].filter(image => { const rect=image.getBoundingClientRect(); return rect.bottom >= 0 && rect.top <= innerHeight; }).map(image => image.decode().catch(() => true))),new Promise(resolve => setTimeout(resolve,1500))]).then(() => true)`);
      await capture(`${slug}-mid`);
      await evaluate(`(() => { const candidate=document.querySelector('.prototype-device__content'); const scroller=candidate&&getComputedStyle(candidate).overflowY==='auto'?candidate:document.scrollingElement; if(scroller===document.scrollingElement) scrollTo({top:0,behavior:'instant'}); else scroller.scrollTop=0; return true; })()`);
    }

    let interaction = { pass: true };
    if (page === "listings.html") {
      interaction = await evaluate(`(() => {
        const trigger=document.querySelector('[aria-controls="listing-filters-sheet"]');
        const sheet=document.getElementById('listing-filters-sheet');
        // Поведінковий контракт шторки (без прив'язки до класів): відкривається, фокус усередині, Escape закриває й повертає фокус.
        const visible=()=>!!sheet && (sheet.open===true || (sheet.open===undefined && !sheet.hidden && getComputedStyle(sheet).display!=='none'));
        if (!trigger || !sheet) return {pass:false, missing:!trigger?'trigger':'sheet'};
        trigger.focus(); trigger.click();
        const opened=visible() && sheet.contains(document.activeElement) && trigger.getAttribute('aria-expanded')==='true';
        (document.activeElement||sheet).dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
        return {pass:opened && !visible() && document.activeElement===trigger, opened, closed:!visible(), focusReturned:document.activeElement===trigger};
      })()`);
    } else if (page === "compatibility-form.html") {
      interaction = await evaluate(`(() => {
        const chooseVisible=()=>{ const step=[...document.querySelectorAll('[data-step]')].find(node=>!node.hidden); [...step.querySelectorAll('fieldset')].forEach(fieldset=>{ const first=fieldset.querySelector('input[type=radio]'); if(first) first.click(); }); };
        chooseVisible(); document.querySelector('[data-step]:not([hidden]) [data-next]').click();
        const focus2=document.activeElement.textContent.includes('Крок 2');
        chooseVisible(); document.querySelector('[data-step]:not([hidden]) [data-next]').click();
        const focus3=document.activeElement.textContent.includes('Крок 3');
        chooseVisible(); document.getElementById('about').value='Переїжджаю у вересні, працюю вдень.'; document.getElementById('about').dispatchEvent(new Event('input',{bubbles:true}));
        return {pass:focus2&&focus3&&document.querySelector('[data-progress-label]').textContent==='Крок 3 із 3'&&localStorage.getItem('kutok-compatibility-draft-v1')!==null, focus2, focus3, progress:document.querySelector('[data-progress-label]').textContent};
      })()`);
    } else if (page === "application.html") {
      interaction = await evaluate(`(() => {
        const form=document.querySelector('[data-prototype-application]'); const field=document.getElementById('application-message');
        form.requestSubmit(); const invalidFocus=document.activeElement===field;
        field.value='Хочу познайомитися й домовитися про перегляд.'; form.requestSubmit();
        const result=document.getElementById('prototype-result');
        // Видимий фокус на результаті — правильна поведінка, тому outline не вимагаємо 'none'.
        const text=result.textContent;
        const resultText=text.includes('Сценарій заявки завершено')||text.includes('заявку не надіслано');
        const resultShown=!result.hidden&&getComputedStyle(result).display!=='none';
        return {pass:invalidFocus&&resultShown&&document.activeElement===result&&resultText, invalidFocus, resultVisible:resultShown, resultText, focus:document.activeElement.id, outline:getComputedStyle(result).outlineStyle};
      })()`);
    }
    if (!interaction.pass) interactionFailures.push({ page, width: viewport.width, ...interaction });
    const postInteractionGeometry = page === "listings.html" ? await readListingsGeometry() : null;
    if (postInteractionGeometry && !postInteractionGeometry.pass) geometryFailures.push({ page, width: viewport.width, state: "after-filter-close", ...postInteractionGeometry });
    const postInteractionGrid = await readContentGrid(page);
    if (!postInteractionGrid.pass) gridFailures.push({ page, width: viewport.width, state: "after-interaction", ...postInteractionGrid });

    await evaluate(`(() => {
      const candidate=document.querySelector('.prototype-device__content');
      const scroller=candidate&&getComputedStyle(candidate).overflowY==='auto'?candidate:document.scrollingElement;
      if (scroller===document.scrollingElement) scrollTo({top:scroller.scrollHeight,behavior:'instant'}); else scroller.scrollTop=scroller.scrollHeight;
      return true;
    })()`);
    await new Promise((resolve) => setTimeout(resolve, page === "listings.html" ? 300 : 60));
    const endpoint = await evaluate(`(() => {
      const candidate=document.querySelector('.prototype-device__content');
      const scroller=candidate&&getComputedStyle(candidate).overflowY==='auto'?candidate:document.scrollingElement;
      const nav=document.querySelector('.kit-tabbar');
      const footer=document.querySelector('.kit-footer');
      const node=nav||footer;
      const viewportBottom=innerWidth>430?document.querySelector('.prototype-device__screen').getBoundingClientRect().bottom:innerHeight;
      const gap=Math.round(viewportBottom-node.getBoundingClientRect().bottom);
      const contentGap=Math.round((nav?nav.getBoundingClientRect().top:viewportBottom)-footer.getBoundingClientRect().bottom);
      return {gap,contentGap,node:node.className,visible:node.getBoundingClientRect().bottom<=viewportBottom,dockVisible:nav?nav.getBoundingClientRect().top>=0&&nav.getBoundingClientRect().bottom<=viewportBottom:true,scroller:scroller===document.scrollingElement?'document':'prototype',overflowY:getComputedStyle(scroller).overflowY,scrollTop:Math.round(scroller.scrollTop),scrollHeight:Math.round(scroller.scrollHeight),clientHeight:Math.round(scroller.clientHeight)};
    })()`);
    await capture(`${slug}-bottom`);

    if (viewport.width <= 430) {
      await capture(`${slug}-full`, true);
    } else {
      await evaluate(`(() => { const style=document.createElement('style'); style.id='qa-full-page'; style.textContent='body{height:auto!important;overflow:visible!important}.lesson-workspace{align-items:flex-start!important}.prototype-device,.prototype-device__screen,.prototype-device__content{height:auto!important;max-height:none!important;overflow:visible!important}'; document.head.appendChild(style); return true; })()`);
      await new Promise((resolve) => setTimeout(resolve, 60));
      await capture(`${slug}-full`, true);
      await evaluate(`document.getElementById('qa-full-page').remove(); true`);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    audits.push({ page, width: viewport.width, ...initial, interaction, initialGeometry, postInteractionGeometry, initialGrid, postInteractionGrid, endpoint });
  }
}

const zoom = [];
for (const page of pages) {
  const viewport = { width: 195, height: 422 };
  await navigate(page, viewport);
  zoom.push(await evaluate(`({page:${JSON.stringify(page)}, overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth), controls:[...document.querySelectorAll('.kit-shell button,.kit-shell a,.kit-shell input,.kit-shell textarea')].filter(node=>{const r=node.getBoundingClientRect(),style=getComputedStyle(node);return style.display!=='none'&&style.visibility!=='hidden'&&(r.right>innerWidth+0.5||r.left<-.5)}).length})`));
}

const showcase = [];
for (const path of ["ui/kit.html", "ui/tokens.html"]) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await send("Emulation.setDeviceMetricsOverride", { ...viewport, screenWidth: viewport.width, screenHeight: viewport.height, deviceScaleFactor: 1, mobile: viewport.width < 900 });
    await send("Page.navigate", { url: `${origin}/kootok/${path}?qa-polish=${viewport.width}` });
    await waitFor(`document.readyState === 'complete' && document.documentElement.classList.contains('has-course-nav')`, `${path} at ${viewport.width}`);
    if (path === "ui/tokens.html") await waitFor(`document.body.dataset.tokenSource === 'tokens.css'`, `${path} token graph at ${viewport.width}`);
    await evaluate(`document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))`);
    const data = await evaluate(`(() => {
      const root=getComputedStyle(document.documentElement);
      const read=node=>{if(!node)return null;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return {background:style.backgroundColor,borderTop:style.borderTopWidth,paddingTop:style.paddingTop,paddingRight:style.paddingRight,paddingBottom:style.paddingBottom,paddingLeft:style.paddingLeft,radius:style.borderRadius,fontFamily:style.fontFamily,fontSize:style.fontSize,left:Number(rect.left.toFixed(2)),right:Number((innerWidth-rect.right).toFixed(2))}};
      const tokens={canvas:root.getPropertyValue('--color-page-background').trim(),card:root.getPropertyValue('--color-card-background').trim(),gutter:root.getPropertyValue('--space-screen-gutter').trim(),sectionGap:root.getPropertyValue('--space-section-gap').trim(),cardPadding:root.getPropertyValue('--space-card-inline').trim(),cardRadius:root.getPropertyValue('--radius-card').trim(),controlRadius:root.getPropertyValue('--radius-control').trim(),displayFamily:root.getPropertyValue('--primitive-font-family-display').trim(),textFamily:root.getPropertyValue('--primitive-font-family-text').trim()};
      const kit=${JSON.stringify(path)}==='ui/kit.html'?{swatch:read(document.querySelector('.swatch')),card:read(document.querySelector('.kit-card')),fieldset:read(document.querySelector('.kit-fieldset')),button:read(document.querySelector('.kit-button')),field:read(document.querySelector('.kit-field input')),trustBorders:[...document.querySelectorAll('.kit-trust-list li')].map(node=>getComputedStyle(node).borderTopWidth),headline:read(document.querySelector('.kit-headline')),body:read(document.querySelector('.showcase-type > p:not([class])')),tabLabels:[...document.querySelectorAll('.showcase-tabbar .kit-tab')].map(node=>node.textContent.trim()),ownedHeading:Boolean(document.querySelector('.swatch > h2:first-child'))}:null;
      const tokenRows=${JSON.stringify(path)}==='ui/tokens.html'?{source:document.body.dataset.tokenSource,primitive:Number(document.body.dataset.primitiveCount),semantic:Number(document.body.dataset.semanticCount),rows:document.querySelectorAll('tr[data-token]').length,canvasRow:document.querySelector('[data-token="--color-page-background"]')?.textContent.replace(/\\s+/g,' ').trim()||'',gapRow:document.querySelector('[data-token="--space-section-gap"]')?.textContent.replace(/\\s+/g,' ').trim()||''}:null;
      return {path:${JSON.stringify(path)},width:innerWidth,title:document.title,h1:document.querySelector('h1')?.textContent.trim(),overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),background:getComputedStyle(document.body).backgroundColor,tokens,kit,tokenRows};
    })()`);
    showcase.push(data);
    await capture(`${path.replace(/\W/g, "-")}-${viewport.width}-top`);
  }
}

const courseChrome = [];
await navigate("listings.html", { width: 1440, height: 900 });
courseChrome.push(await evaluate(`(() => {
  const sidebar=document.querySelector('.course-shell'),panel=document.querySelector('.lesson-family-panel'),link=document.querySelector('.course-shell__link'),current=document.querySelector('.course-shell__link[aria-current="page"]'),familyLink=document.querySelector('.lesson-family-panel a'),control=document.querySelector('.course-shell__theme'),tree=document.querySelector('.course-shell__tree');
  const read=node=>{const rect=node.getBoundingClientRect(),style=getComputedStyle(node);return {width:Math.round(rect.width),height:Math.round(rect.height),background:style.backgroundColor,color:style.color,radius:style.borderRadius,fontFamily:style.fontFamily,fontSize:style.fontSize,paddingLeft:style.paddingLeft,paddingRight:style.paddingRight,display:style.display}};
  return {mode:'desktop',sidebar:read(sidebar),panel:read(panel),link:read(link),current:read(current),familyLink:read(familyLink),control:read(control),tree:read(tree),bodyMargin:getComputedStyle(document.body).marginLeft,deviceWidth:Math.round(document.querySelector('.prototype-device').getBoundingClientRect().width)};
})()`));
await capture('course-nav-1440-desktop');

await navigate("listings.html", { width: 390, height: 844 });
const mobileClosed=await evaluate(`(() => {const bar=document.querySelector('.course-mobilebar'),open=document.querySelector('.course-mobilebar__open'),panel=document.querySelector('.lesson-family-panel');const read=node=>{const rect=node.getBoundingClientRect(),style=getComputedStyle(node);return {width:Math.round(rect.width),height:Math.round(rect.height),background:style.backgroundColor,color:style.color,radius:style.borderRadius,fontFamily:style.fontFamily,fontSize:style.fontSize,paddingLeft:style.paddingLeft,paddingRight:style.paddingRight,display:style.display}};return {mode:'mobile-closed',bar:read(bar),open:read(open),panel:read(panel),expanded:open.getAttribute('aria-expanded'),drawerOpen:document.documentElement.classList.contains('course-drawer-open')}})()`);
courseChrome.push(mobileClosed);
await capture('course-nav-390-closed');
await evaluate(`document.querySelector('.course-mobilebar__open').click(); true`);
await waitFor(`document.documentElement.classList.contains('course-drawer-open') && document.querySelector('.course-shell__close')===document.activeElement`, 'mobile course drawer open');
await new Promise(resolve=>setTimeout(resolve,250));
const mobileOpen=await evaluate(`(() => {const sidebar=document.querySelector('.course-shell'),link=document.querySelector('.course-shell__link'),current=document.querySelector('.course-shell__link[aria-current="page"]'),control=document.querySelector('.course-shell__theme'),tree=document.querySelector('.course-shell__tree'),close=document.querySelector('.course-shell__close');const read=node=>{const rect=node.getBoundingClientRect(),style=getComputedStyle(node);return {width:Math.round(rect.width),height:Math.round(rect.height),left:Math.round(rect.left),background:style.backgroundColor,color:style.color,radius:style.borderRadius,fontFamily:style.fontFamily,fontSize:style.fontSize,paddingLeft:style.paddingLeft,paddingRight:style.paddingRight,display:style.display}};return {mode:'mobile-open',sidebar:read(sidebar),link:read(link),current:read(current),control:read(control),tree:read(tree),close:read(close),expanded:document.querySelector('.course-mobilebar__open').getAttribute('aria-expanded'),drawerOpen:document.documentElement.classList.contains('course-drawer-open'),focus:document.activeElement.className}})()`);
courseChrome.push(mobileOpen);
await capture('course-nav-390-open');
await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})); true`);
await waitFor(`!document.documentElement.classList.contains('course-drawer-open') && document.activeElement===document.querySelector('.course-mobilebar__open')`, 'mobile course drawer escape close');
courseChrome.push(await evaluate(`({mode:'mobile-restored',expanded:document.querySelector('.course-mobilebar__open').getAttribute('aria-expanded'),drawerOpen:document.documentElement.classList.contains('course-drawer-open'),focusRestored:document.activeElement===document.querySelector('.course-mobilebar__open')})`));

await navigate("listings.html", { width: 390, height: 844 });
const typography = await evaluate(`(() => {
  const read=(selector,role)=>{const style=getComputedStyle(document.querySelector(selector));return {role,selector,size:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight),weight:Number(style.fontWeight),family:style.fontFamily}};
  return [read('.kit-headline','page'),read('.kit-listing__body h3','card'),read('.kit-actions .kit-button','control'),read('.kit-meta--place','meta'),read('.kit-tab','nav')];
})()`);
await navigate("listing.html", { width: 390, height: 844 });
typography.push(...await evaluate(`(() => { const read=(selector,role)=>{const style=getComputedStyle(document.querySelector(selector));return {role,selector,size:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight),weight:Number(style.fontWeight),family:style.fontFamily}}; return [read('.kit-card--head h2','detail'),read('.kit-section__title','section'),read('#description-heading + p','body')]; })()`));
await navigate("compatibility-form.html", { width: 390, height: 844 });
typography.push(...await evaluate(`(() => { const read=(selector,role)=>{const style=getComputedStyle(document.querySelector(selector));return {role,selector,size:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight),weight:Number(style.fontWeight),family:style.fontFamily}}; return [read('.kit-fieldset legend','card'),read('.kit-step__intro','support'),read('.kit-progress__meta span','meta'),read('.kit-choice','body'),read('textarea','input')]; })()`));

await navigate("listings.html", { width: 390, height: 844 });
const contrast = await evaluate(`(() => {
  const parse=value=>{if(value.startsWith('#')){const raw=value.slice(1),hex=raw.length===3?raw.split('').map(char=>char+char).join(''):raw;return [0,2,4].map(index=>parseInt(hex.slice(index,index+2),16))}const parts=value.match(/[\\d.]+/g)?.map(Number)||[];return parts.slice(0,3)};
  const lum=value=>{const rgb=parse(value).map(channel=>{const x=channel/255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};
  const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const bg=node=>{for(let item=node;item;item=item.parentElement){const color=getComputedStyle(item).backgroundColor;if(!color.endsWith(', 0)')&&color!=='rgba(0, 0, 0, 0)'&&color!=='transparent')return color}return getComputedStyle(document.body).backgroundColor};
  const selectors=['.kit-headline','.kit-meta','.kit-listing__body h3','.kit-household__copy span','.kit-chip','.kit-chip--muted','.kit-chip--error','.kit-tag','.kit-tab:not([aria-current])','.kit-tab[aria-current]'];
  const text=selectors.map(selector=>{const node=document.querySelector(selector);const fg=getComputedStyle(node).color,b=bg(node);return {selector,fg,bg:b,ratio:Number(ratio(fg,b).toFixed(2))}});
  const root=getComputedStyle(document.documentElement); const roles=name=>root.getPropertyValue(name).trim();
  const focus=['--color-page-background','--color-card-background','--color-surface-sunken'].map(surface=>({selector:'--color-focus on '+surface,fg:roles('--color-focus'),bg:roles(surface),ratio:Number(ratio(roles('--color-focus'),roles(surface)).toFixed(2))}));
  return [...text,...focus];
})()`);

const failures = audits.filter((item) => item.overflow || item.canvas !== "rgb(246, 243, 234)" || item.card !== "rgb(255, 255, 255)" || item.fixedProductControls.length || item.endpoint.contentGap < 24 || !item.endpoint.visible || !item.endpoint.dockVisible || item.sectionHeadingOutsideCard || item.sectionHeadingGeometry.some(heading => !heading.direct || heading.nextInset !== null && Math.abs(heading.inset - heading.nextInset) > 1) || item.fonts.status !== 'loaded' || !item.fonts.jostCyrillic || !item.fonts.golosCyrillic || item.fonts.jostFaces < 2 || item.fonts.golosFaces < 2 || !item.fonts.displayFamily.includes('Jost') || !item.fonts.bodyFamily.includes('Golos Text') || item.fonts.remoteRequests.length || item.fonts.cls > .01 || (item.page === "listings.html" ? !["fixed","absolute"].includes(item.navPosition) || !item.navAfterMain || item.tabs.length !== 3 : item.tabs.length !== 0));
const zoomFailures = zoom.filter((item) => item.overflow || item.controls);
const showcaseFailures = showcase.filter((item) => {
  const tokensPass=item.tokens.canvas==='#f6f3ea'&&item.tokens.card==='#fff'&&item.tokens.gutter==='16px'&&item.tokens.sectionGap==='16px'&&item.tokens.cardPadding==='16px'&&item.tokens.cardRadius==='14px'&&item.tokens.controlRadius==='10px'&&item.tokens.displayFamily.includes('Jost')&&item.tokens.textFamily.includes('Golos Text');
  if(item.path==='ui/kit.html') return item.overflow||item.background!=="rgb(246, 243, 234)"||item.title!=="Куток · вітрина UI-кіта"||item.h1!=="Вітрина UI-кіта"||!tokensPass||item.kit.swatch.paddingLeft!=='16px'||item.kit.swatch.paddingRight!=='16px'||item.kit.swatch.radius!=='14px'||item.kit.card.background!=="rgb(255, 255, 255)"||item.kit.card.paddingLeft!=='16px'||item.kit.card.radius!=='14px'||item.kit.fieldset.background!=="rgb(255, 255, 255)"||item.kit.fieldset.paddingLeft!=='16px'||item.kit.fieldset.radius!=='14px'||item.kit.button.background!=="rgb(36, 87, 68)"||item.kit.button.radius!=='10px'||item.kit.field.background!=="rgb(234, 229, 215)"||item.kit.field.radius!=='10px'||item.kit.trustBorders.some(value=>value!=='0px')||!item.kit.headline.fontFamily.includes('Jost')||!item.kit.body.fontFamily.includes('Golos Text')||!(item.kit.tabLabels.slice(0,3).join('|')==='Пошук|Чати|Профіль'&&!item.kit.tabLabels.some(label=>label==='Сумісність'||label==='Заявка'))||!item.kit.ownedHeading; // IA (sitemap.md): Пошук · Чати · (Оголошення) · Профіль
  return item.overflow||item.background!=="rgb(246, 243, 234)"||item.title!=="Куток · токени уроку 8"||item.h1!=="Токени, що тримають весь продукт разом"||!tokensPass||item.tokenRows.source!=='tokens.css'||item.tokenRows.primitive+item.tokenRows.semantic!==item.tokenRows.rows||!item.tokenRows.canvasRow.includes('--primitive-color-cream-100')||!item.tokenRows.gapRow.includes('--primitive-length-16');
});
const courseChromeFailures = courseChrome.filter(item => {
  if(item.mode==='desktop') return item.sidebar.width!==244||item.panel.width!==156||item.sidebar.background!=="rgb(255, 255, 255)"||item.panel.background!=="rgb(246, 243, 234)"||item.tree.paddingLeft!=='16px'||item.tree.paddingRight!=='16px'||item.link.height!==44||item.familyLink.height!==44||item.control.height!==44||item.control.radius!=='10px'||!item.link.fontFamily.includes('Jost')||!item.control.fontFamily.includes('Jost')||item.current.background!=="rgb(216, 233, 154)"||item.bodyMargin!=='400px'||item.deviceWidth!==396;
  if(item.mode==='mobile-closed') return item.bar.height!==60||item.bar.paddingLeft!=='16px'||item.open.height!==44||item.open.radius!=='10px'||!item.open.fontFamily.includes('Jost')||item.panel.display!=='none'||item.expanded!=='false'||item.drawerOpen;
  if(item.mode==='mobile-open') return item.sidebar.width!==280||item.sidebar.left!==0||item.sidebar.background!=="rgb(255, 255, 255)"||item.tree.paddingLeft!=='16px'||item.tree.paddingRight!=='16px'||item.link.height!==44||item.control.height!==44||item.control.radius!=='10px'||item.current.background!=="rgb(216, 233, 154)"||item.close.height!==44||item.close.radius!=='10px'||item.expanded!=='true'||!item.drawerOpen||item.focus!=='course-shell__close';
  return item.expanded!=='false'||item.drawerOpen||!item.focusRestored;
});
const contrastFailures = contrast.filter((item) => item.ratio < (item.selector.startsWith("--color-focus") ? 3 : 4.5));
const expectedType = {page:24,detail:20,section:17,card:16,body:15,control:15,support:14,meta:13,nav:12,input:16};
const displayRoles = new Set(['page','detail','section','card','control','nav']);
const typographyFailures = typography.filter(item => expectedType[item.role] !== item.size || item.lineHeight < item.size * 1.15 || (displayRoles.has(item.role) ? !item.family.includes('Jost') : !item.family.includes('Golos Text')));
const summary = { screenshots: outputDirectory, responsiveChecks: audits.length, audits, failures, interactionFailures, geometryFailures, gridFailures, zoom, zoomFailures, showcase, showcaseFailures, courseChrome, courseChromeFailures, typography, typographyFailures, contrast, contrastFailures };
console.log(JSON.stringify(summary, null, 2));
await send("Target.closeTarget", { targetId });
cdp.socket.close();
if (failures.length || interactionFailures.length || geometryFailures.length || gridFailures.length || zoomFailures.length || showcaseFailures.length || courseChromeFailures.length || typographyFailures.length || contrastFailures.length) process.exitCode = 1;
