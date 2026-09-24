#!/usr/bin/env node
// QA уроку 8: кіт design-system/, токени, 4 екрани lesson-6, docs і ui-вітрини.
// Запуск: сервер з БАТЬКІВСЬКОЇ теки (`cd /home/hp/from-den && python3 -m http.server <port>`),
// headless Chrome з `--remote-debugging-port=<cdp>`, далі
// `KOOTOOK_CDP_PORT=<cdp> node scripts/qa-lesson-8.mjs http://127.0.0.1:<port>` (origin без /kootok).

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const repo = resolve(new URL("..", import.meta.url).pathname);
if (!process.argv[2] || !process.env.KOOTOOK_CDP_PORT) {
  console.error("Використання: KOOTOOK_CDP_PORT=<cdp> node scripts/qa-lesson-8.mjs http://127.0.0.1:<port>  (origin без /kootok)");
  process.exit(2);
}
const siteOrigin = new URL(process.argv[2]).origin;
const origin = `${siteOrigin}/kootok`;
const cdpPort = process.env.KOOTOOK_CDP_PORT;
const sizes = [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 430, height: 900 }, { width: 1440, height: 900 }];
const failures = [];
const fail = (gate, detail) => failures.push({ gate, detail });

const prototypes = (await readdir(resolve(repo, "beginners/source/prototype"))).filter((x) => x.endsWith(".html")).sort();
if (prototypes.length !== 4) fail("coverage", `active early prototypes ${prototypes.length}/4`);

const expectedLinks = ["/kootok/design-system/index.css"];
for (const [kind, dir, names] of [["prototype", "beginners/source/prototype", prototypes]]) {
  for (const name of names) {
    const html = await readFile(resolve(repo, dir, name), "utf8");
    for (const href of expectedLinks) if (!html.includes(`href="${href}"`)) fail("migration", `${kind}/${name} missing ${href}`);
    if (/href=["']\/kootok\/(?:tokens\.css|components\/index\.css)["']/.test(html)) fail("migration", `${kind}/${name} retains split imports`);
    if (/ui\/kit\.css|href=["'][^"']*\/kit\.css/.test(html)) fail("legacy", `${kind}/${name}`);
  }
}
const shell = await readFile(resolve(repo, "ui/shell.html"), "utf8");
if (!shell.includes("../design-system/index.css") || shell.includes("../tokens.css") || shell.includes("../components/index.css") || shell.includes("kit.css")) fail("shell", "stylesheet contract");
try { await stat(resolve(repo, "ui/kit.css")); fail("legacy", "ui/kit.css still exists"); } catch (error) { if (error.code !== "ENOENT") throw error; }

const legacyHits = [];
for (const file of ["README.md", "CLAUDE.md", "DESIGN.md", "ui/kit.html", "ui/shell.html", ...prototypes.map((x) => `beginners/source/prototype/${x}`)]) {
  const text = await readFile(resolve(repo, file), "utf8");
  if (/ui\/kit\.css|href=["'][^"']*\/kit\.css/.test(text)) legacyHits.push(file);
}
if (legacyHits.length) fail("legacy", legacyHits);

const packageCss = await readFile(resolve(repo, "design-system/index.css"), "utf8");
const packageImports = [...packageCss.matchAll(/@import\s+["']([^"']+)["']/g)].map((x) => x[1]);
if (packageImports.join("|") !== "./tokens.css|./components/index.css") fail("package", packageImports);
const indexCss = await readFile(resolve(repo, "design-system/components/index.css"), "utf8");
const imports = [...indexCss.matchAll(/@import\s+["']([^"']+)["']/g)].map((x) => x[1]);
const moduleFiles = (await readdir(resolve(repo, "design-system/components"))).filter((x) => x.endsWith(".css") && x !== "index.css").map((x) => `./${x}`).sort();
if (new Set(imports).size !== imports.length || [...imports].sort().join("|") !== moduleFiles.join("|")) fail("imports", { imports, moduleFiles });
const componentCss = [];
for (const item of imports) {
  const path = resolve(repo, "design-system/components", item);
  try { componentCss.push(await readFile(path, "utf8")); } catch { fail("imports", `missing ${item}`); }
}
const tokensCss = await readFile(resolve(repo, "design-system/tokens.css"), "utf8");
const declarations = new Set([...tokensCss.matchAll(/(--[\w-]+)\s*:/g)].map((x) => x[1]));
const refs = new Set([...componentCss.join("\n").matchAll(/var\((--[\w-]+)/g)].map((x) => x[1]));
const locallyAssigned = new Set([...componentCss.join("\n").matchAll(/(--[\w-]+)\s*:/g)].map((x) => x[1]));
const unresolved = [...refs].filter((x) => !declarations.has(x) && !locallyAssigned.has(x));
if (unresolved.length) fail("variables", unresolved);
if (/data:image/i.test(tokensCss + componentCss.join("\n"))) fail("icons", "data URI present");
// Анімацій у продукті немає (2026-09-24): жодних transition/animation/@keyframes/плавного скролу й токенів тривалості.
const motionSource = [tokensCss, ...componentCss, await readFile(resolve(repo, "beginners/source/prototype/_base.css"), "utf8"), await readFile(resolve(repo, "course-nav.css"), "utf8")].join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
const motionHits = motionSource.match(/(?:^|[;{\s])(?:transition(?:-[a-z]+)?|animation(?:-[a-z]+)?)\s*:|@keyframes|scroll-behavior\s*:\s*smooth|--(?:primitive-)?duration-[\w-]+/g);
if (motionHits) fail("no-motion", [...new Set(motionHits.map((x) => x.trim()))]);

// Кожен клас kit-* у розмітці сторінок має оголошення в components/.
const declaredKit = new Set([...componentCss.join("\n").matchAll(/\.(kit-[\w-]+)/g)].map((x) => x[1]));
const listHtml = async (dir) => (await readdir(resolve(repo, dir))).filter((x) => x.endsWith(".html")).map((x) => `${dir}/${x}`);
const markupPages = [...prototypes.map((x) => `beginners/source/prototype/${x}`), ...await listHtml("ui"), ...await listHtml("design-system/docs"), ...await listHtml("design-system/examples")];
const undeclared = [];
for (const file of markupPages) {
  const html = await readFile(resolve(repo, file), "utf8");
  for (const [, attr] of html.matchAll(/class="([^"]*)"/g)) for (const cls of attr.split(/\s+/)) if (cls.startsWith("kit-") && !declaredKit.has(cls)) undeclared.push(`${file}: ${cls}`);
}
if (undeclared.length) fail("undeclared-kit-class", [...new Set(undeclared)]);
const iconDecls = [...tokensCss.matchAll(/(--primitive-icon-[\w-]+)\s*:\s*url\("([^"]+)"\)/g)];
const iconFiles = (await readdir(resolve(repo, "tokens/icons"))).filter((x) => x.endsWith(".svg")).sort();
const iconUrls = [...new Set(iconDecls.map((x) => x[2].replace("/kootok/tokens/icons/", "")))].sort();
if (iconUrls.join("|") !== iconFiles.join("|")) fail("icons", { tokenFiles: iconUrls, svgFiles: iconFiles });
for (const file of iconFiles) {
  const svg = await readFile(resolve(repo, "tokens/icons", file), "utf8");
  if (/(?:fill|stroke)="#[0-9a-f]{3,8}"/i.test(svg)) fail("icons", `${file}: вшитий колір замість currentColor`);
}

// Екранний шар не оголошує правил кіта: усе kit-* і шторка фільтрів живуть у design-system/.
// Дозволено лише прив'язати компонент до курсової рамки: селектор, що починається з .prototype-device…
const screenCss = await readFile(resolve(repo, "beginners/source/prototype/_base.css"), "utf8");
const screenKitRules = [...screenCss.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}@]+)\{/g)]
  .flatMap((x) => x[1].split(",").map((sel) => sel.trim()))
  .filter((sel) => /\.filters/.test(sel) || (/\.kit-/.test(sel) && !sel.startsWith(".prototype-device")));
if (screenKitRules.length) fail("screen-layer-kit-rules", screenKitRules);
for (const [, name, url] of iconDecls) {
  if (!url.startsWith("/kootok/tokens/icons/") || url.includes("data:")) fail("icons", `${name}: ${url}`);
  const response = await fetch(new URL(url, origin));
  if (!response.ok || !/image\/svg\+xml/i.test(response.headers.get("content-type") || "")) fail("icons", `${url}: ${response.status} ${response.headers.get("content-type")}`);
}

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
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable"); await send("Network.enable");
let runtimeErrors = [];
let externalRequests = [];
cdp.on("Network.requestWillBeSent", (p, sid) => { if (sid !== sessionId) return; const url = p.request.url; if (/^(?:data|blob|about|chrome|devtools):/.test(url)) return; try { if (new URL(url).origin !== siteOrigin) externalRequests.push(url); } catch { /* ignore */ } });
cdp.on("Runtime.exceptionThrown", (p, sid) => { if (sid === sessionId) runtimeErrors.push(p.exceptionDetails?.text || "exception"); });
cdp.on("Log.entryAdded", (p, sid) => { if (sid === sessionId && ["error", "warning"].includes(p.entry.level) && !/favicon|google.*font/i.test(`${p.entry.url || ''} ${p.entry.text}`)) runtimeErrors.push(`${p.entry.url || ''} ${p.entry.text}`.trim()); });
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const navigate = async (path, size) => {
  runtimeErrors = []; externalRequests = [];
  await send("Emulation.setDeviceMetricsOverride", { ...size, deviceScaleFactor: 1, mobile: size.width < 900 });
  await send("Page.navigate", { url: origin + path });
  const expected = new URL(origin + path).pathname;
  for (let i = 0; i < 150; i++) { await new Promise((r) => setTimeout(r, 25)); if (await evaluate(`document.readyState!=='loading'&&location.pathname===${JSON.stringify(expected)}&&[...document.styleSheets].some(s=>s.href?.includes('design-system/index.css'))&&[...document.images].filter(i=>i.loading!=='lazy'&&new URL(i.src,location.href).origin===location.origin).every(i=>i.complete)`)) { await evaluate(`document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))`); return; } }
  throw new Error(`timeout ${path}`);
};
const routes = prototypes.map((x) => ({ kind: "prototype", path: `/beginners/source/prototype/${x}`, alias: `/lesson-6/${x}` }));
const renderRoutes = routes;
let browserChecks = 0;
for (const route of renderRoutes) for (const size of sizes) {
  await navigate(route.path, size);
  const result = await evaluate(`(() => {
    const root=document.querySelector('.prototype-device__screen');
    const interactive=[...(root||document).querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')].filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&!e.disabled});
    const namedIconOnly=interactive.filter(e=>{const t=(e.textContent||'').trim();const iconOnly=!t&&(e.matches('button,.kit-back')||e.getAttribute('role')==='button');return iconOnly&&!e.getAttribute('aria-label')&&!e.getAttribute('title')}).length;
    const touch=interactive.filter(e=>e.matches('button,input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]),select,textarea,.kit-tab,.kit-back')).filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44}).length;
    const focusVisible=[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules]}catch{return[]}}).some(rule=>rule.cssText?.includes(':focus-visible'));
    const hiddenShown=[...document.querySelectorAll('[hidden]')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.tagName+'.'+e.className).length;
    return {root:!!root,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),namedIconOnly,touch,focusVisible,ariaCurrent:document.querySelectorAll('[aria-current="page"]').length,hiddenShown};
  })()`);
  browserChecks++;
  if (!result.root || result.overflow || result.namedIconOnly || result.touch || !result.focusVisible || result.ariaCurrent < 1) fail("browser", { ...route, width: size.width, ...result });
  if (result.hiddenShown) fail("hidden-display", { path: route.path, width: size.width, hiddenShown: result.hiddenShown });
  if (runtimeErrors.length) fail("console", { path: route.path, width: size.width, errors: runtimeErrors });
}

// docs, examples, ui-вітрини й lesson-6 aliases: без зовнішніх запитів, [hidden] = display:none, без помилок консолі.
const docsPages = [...await listHtml("design-system/docs"), ...await listHtml("design-system/examples"), ...await listHtml("ui")].map((x) => `/${x}`);
const surfacePages = [...docsPages, ...routes.map((r) => r.alias)];
for (const path of surfacePages) for (const size of [sizes[0], sizes[3]]) {
  await navigate(path, size);
  const r = await evaluate(`({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),hiddenShown:[...document.querySelectorAll('[hidden]')].filter(e=>getComputedStyle(e).display!=='none').length})`);
  browserChecks++;
  if (externalRequests.length) fail("no-external-requests", { path, width: size.width, urls: [...new Set(externalRequests)] });
  if (r.hiddenShown) fail("hidden-display", { path, width: size.width, hiddenShown: r.hiddenShown });
  if (r.overflow) fail("surface-overflow", { path, width: size.width, overflow: r.overflow });
  if (runtimeErrors.length) fail("console", { path, width: size.width, errors: runtimeErrors });
}

const density=[];
for(const path of ['/ui/tokens.html','/ui/kit.html'])for(const size of sizes){await navigate(path,size);if(path.includes('tokens'))for(let i=0;i<100&&!await evaluate(`document.body.dataset.tokenSource==='tokens.css'`);i++)await new Promise(r=>setTimeout(r,25));const surface=await evaluate(`({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),mainHeight:document.querySelector('main,.showcase-grid')?.getBoundingClientRect().height||0,focusRule:[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch{return[]}}).some(r=>r.cssText?.includes(':focus-visible')),heroHeight:Math.round(document.querySelector('.tokens-hero')?.getBoundingClientRect().height||0),firstTableTop:Math.round(document.querySelector('.token-table,.table-wrap')?.getBoundingClientRect().top||0),rowHeight:Math.round(document.querySelector('tbody tr')?.getBoundingClientRect().height||0)})`);browserChecks++;if(path.includes('tokens'))density.push({width:size.width,heroHeight:surface.heroHeight,firstTableTop:surface.firstTableTop,rowHeight:surface.rowHeight});if(surface.overflow||surface.mainHeight<200||!surface.focusRule||(path.includes('tokens')&&(surface.heroHeight>300||surface.rowHeight>64||surface.firstTableTop>820)))fail('ui-responsive',{path,width:size.width,...surface});if(runtimeErrors.length)fail('console',{path,width:size.width,errors:runtimeErrors});}
await navigate("/ui/tokens.html", sizes[1]);
for(let i=0;i<100&&!await evaluate(`document.body.dataset.tokenSource==='tokens.css'`);i++)await new Promise(r=>setTimeout(r,25));
const tokenDocs=await evaluate(`({source:document.body.dataset.tokenSource,primitive:Number(document.body.dataset.primitiveCount),semantic:Number(document.body.dataset.semanticCount),icons:Number(document.body.dataset.canonicalIconCount),rows:document.querySelectorAll('[data-token]').length,tables:document.querySelectorAll('.token-table').length})`);
if(tokenDocs.source!=="tokens.css"||tokenDocs.primitive+tokenDocs.semantic!==declarations.size||tokenDocs.semantic<1||tokenDocs.icons!==iconFiles.length||tokenDocs.rows!==declarations.size||tokenDocs.tables<6)fail("token-documentation",tokenDocs);
const tokenSurface=await evaluate(`({title:document.title,h1:document.querySelector('h1')?.textContent.trim(),mainHeight:document.querySelector('main')?.getBoundingClientRect().height||0,current:[...document.querySelectorAll('.course-shell__link[aria-current="page"]')].map(e=>e.textContent.trim())})`);
if(!tokenSurface.title.includes('токени уроку 8')||!tokenSurface.h1||tokenSurface.mainHeight<400||tokenSurface.current.length!==1||tokenSurface.current[0]!=='Токени')fail('token-surface',tokenSurface);
const iconMasks = await evaluate(`(() => {
  const names=${JSON.stringify(iconDecls.map((x) => x[1]))};
  const host=document.createElement('div');document.body.append(host);
  return names.map(name=>{const e=document.createElement('a');e.className='kit-tab';e.href='#';e.textContent='icon';e.style.setProperty('--kit-icon','var('+name+')');host.append(e);const s=getComputedStyle(e,'::before');return {name,mask:s.maskImage||s.webkitMaskImage,width:s.width,height:s.height};});
})()`);
for (const icon of iconMasks) if (!icon.mask.includes("tokens/icons/") || icon.mask === "none" || parseFloat(icon.width) <= 0 || parseFloat(icon.height) <= 0) fail("computed-icons", icon);

await navigate('/ui/kit.html',sizes[1]);
const kitSurface=await evaluate(`({title:document.title,h1:document.querySelector('h1')?.textContent.trim(),tokenReference:document.querySelectorAll('#token-reference,.token-docs,[data-token]').length,components:document.querySelectorAll('.showcase-grid .swatch').length,current:[...document.querySelectorAll('.course-shell__link[aria-current="page"]')].map(e=>e.textContent.trim())})`);
if(!kitSurface.title.includes('вітрина UI-кіта')||kitSurface.h1!=='Вітрина UI-кіта'||kitSurface.tokenReference!==0||kitSurface.components<10||kitSurface.current.length!==1||kitSurface.current[0]!=='Вітрина UI-кіта')fail('kit-surface',kitSurface);

const contrast = await evaluate(`(() => {
  const rgba=x=>{const m=x.match(/[\\d.]+/g);if(!m)return null;const v=m.map(Number);return [v[0],v[1],v[2],v[3]??1]};
  const composite=(fg,bg)=>{const a=fg[3]+bg[3]*(1-fg[3]);return a?[0,1,2].map(i=>(fg[i]*fg[3]+bg[i]*bg[3]*(1-fg[3]))/a).concat(a):[0,0,0,0]};
  const surface=e=>{if(!e)return [[255,255,255,1]];const s=getComputedStyle(e);if(s.backgroundImage!=='none'){const colors=[...s.backgroundImage.matchAll(/rgba?\\([^)]*\\)/g)].map(m=>rgba(m[0])).filter(Boolean);if(colors.length)return colors.map(c=>c[3]===1?c:composite(c,surface(e.parentElement)[0]));}const color=rgba(s.backgroundColor);if(color&&color[3]===1)return [color];if(color&&color[3]>0)return surface(e.parentElement).map(bg=>composite(color,bg));return surface(e.parentElement)};
  const lum=c=>{const v=c.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};
  const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
  const selectors=['body','.showcase-title','.swatch','.kit-card','.kit-meta','.kit-button','.kit-button--secondary','.kit-chip','.kit-chip--error','.kit-application-choice'];
  const out=[];for(const theme of ['light','dark']){document.documentElement.dataset.theme=theme;document.body.style.setProperty('background','var(--color-page-outer-background)','important');document.body.style.setProperty('color','var(--color-text-primary)','important');for(const selector of selectors){const e=document.querySelector(selector);if(!e)continue;const backgrounds=surface(e),raw=rgba(getComputedStyle(e).color);if(raw&&backgrounds.length){const ratios=backgrounds.map(bg=>ratio(composite(raw,bg),bg));out.push({theme,selector,ratio:Math.round(Math.min(...ratios)*100)/100});}}}return out;
})()`);
for (const item of contrast) if (item.ratio < 4.5) fail("contrast", item);

let parity = 0; let pixelParity = 0;
const visualSnapshot=()=>evaluate(`JSON.stringify([...document.querySelectorAll('.kit-shell,.kit-shell *')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return [e.tagName,e.className,Math.round(r.x*10)/10,Math.round(r.y*10)/10,Math.round(r.width*10)/10,Math.round(r.height*10)/10,s.display,s.color,s.backgroundColor,s.borderRadius,s.fontFamily,s.fontSize,s.fontWeight,s.maskImage||s.webkitMaskImage]}))`);
const productScreenshot=async()=>{const clip=await evaluate(`(()=>{const e=document.querySelector('.kit-shell');const r=e.getBoundingClientRect();return {x:Math.max(0,r.x),y:Math.max(0,r.y),width:Math.min(innerWidth,r.width),height:Math.min(innerHeight-Math.max(0,r.y),r.height)}})()`);return (await send("Page.captureScreenshot",{format:"png",fromSurface:true,clip:{...clip,scale:1}})).data};
const pixelDifference=(a,b)=>evaluate(`(async()=>{const load=src=>new Promise((ok,no)=>{const i=new Image;i.onload=()=>ok(i);i.onerror=no;i.src='data:image/png;base64,'+src});const [ia,ib]=await Promise.all([load(${JSON.stringify(a)}),load(${JSON.stringify(b)})]);if(ia.width!==ib.width||ia.height!==ib.height)return 1;const c=document.createElement('canvas');c.width=ia.width;c.height=ia.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(ia,0,0);const da=x.getImageData(0,0,c.width,c.height).data;x.clearRect(0,0,c.width,c.height);x.drawImage(ib,0,0);const db=x.getImageData(0,0,c.width,c.height).data;let changed=0;for(let i=0;i<da.length;i+=4)if(Math.max(Math.abs(da[i]-db[i]),Math.abs(da[i+1]-db[i+1]),Math.abs(da[i+2]-db[i+2]),Math.abs(da[i+3]-db[i+3]))>8)changed++;return changed/(da.length/4)})()`);
const pixelRoutes=new Set(['/beginners/source/prototype/application.html','/beginners/source/prototype/compatibility-form.html']);
for (const route of routes.filter(route=>pixelRoutes.has(route.path))) {
  await navigate(route.path, sizes[1]);
  await evaluate(`(()=>{const s=document.createElement('style');s.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';document.head.append(s)})()`);
  const canonicalSnapshot=createHash("sha256").update(await visualSnapshot()).digest("hex");
  const canonical = pixelRoutes.has(route.path)?await productScreenshot():null;
  await navigate(route.alias, sizes[1]);
  await evaluate(`(()=>{const s=document.createElement('style');s.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';document.head.append(s)})()`);
  const aliasSnapshot=createHash("sha256").update(await visualSnapshot()).digest("hex");
  const alias = pixelRoutes.has(route.path)?await productScreenshot():null;
  parity++;
  if (canonicalSnapshot !== aliasSnapshot) fail("route-visual-parity", route);
  if(canonical){pixelParity++;const difference=await pixelDifference(canonical,alias);if (difference > 0.001) fail("route-pixel-parity", {...route,difference});}
}

await send("Target.closeTarget", { targetId }); cdp.ws.close();
console.log(JSON.stringify({ coverage: { prototypes: prototypes.length }, architecture: { imports: imports.length, variablesReferenced: refs.size, unresolved: unresolved.length, legacyRefs: legacyHits.length }, tokenDocs, density, icons: { declarations: iconDecls.length, svgFiles: iconFiles.length, computedMasks: iconMasks.length }, markup: { pages: markupPages.length, declaredKitClasses: declaredKit.size }, surfaces: surfacePages.length, browser: { viewports: sizes.map((x) => x.width), checks: browserChecks, routeVisualParity: parity, representativePixelParity: pixelParity }, contrast, failures }, null, 2));
if (failures.length) process.exitCode = 1;
