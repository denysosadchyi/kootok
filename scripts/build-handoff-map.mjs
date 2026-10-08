#!/usr/bin/env node
// Збирає handoff/map.md — карту «екран → зона → елемент → компонент → токени → ключ microcopy»
// і зворотний список «токен → екрани». Токени не пишуться руками: скрипт бере розмітку екранів,
// знаходить CSS-правила кіта, що застосовуються до кожного елемента, і виписує var(--…) з них.
// Руками ведеться лише список елементів нижче (SCREENS): локатор, компонент, ключ.
// Запуск: node scripts/build-handoff-map.mjs  (браузер і сервер не потрібні).

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repo = resolve(new URL("..", import.meta.url).pathname);
const read = (p) => readFileSync(resolve(repo, p), "utf8");
const PROTO = "beginners/source/prototype/";
const CHATS = "design-system/examples/chats.html";

/* ───────────── Токени: назви, шар, залежності semantic → primitive ───────────── */

const tokensCss = read("design-system/tokens.css").replace(/\/\*[\s\S]*?\*\//g, "");
const tokenDeps = new Map(); // назва → Set назв, на які посилається (у будь-якій темі)
for (const m of tokensCss.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  if (!tokenDeps.has(m[1])) tokenDeps.set(m[1], new Set());
  for (const v of m[2].matchAll(/var\(\s*(--[\w-]+)/g)) tokenDeps.get(m[1]).add(v[1]);
}
const isToken = (n) => tokenDeps.has(n);
const isPrimitive = (n) => n.startsWith("--primitive-") || /^--(bp|grid-gap|container-max|col-count)/.test(n);
function closure(name, seen = new Set()) {
  for (const d of tokenDeps.get(name) || []) if (!seen.has(d)) { seen.add(d); closure(d, seen); }
  return seen;
}

/* ───────────── CSS кіта: правила з селекторами й токенами ───────────── */

function splitTop(s, sep = ",") {
  const out = []; let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth--;
    if (ch === sep && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
/* Літерали брейкпоінтів у @container/@media посилаються на токен коментарем
   («/* = --bp-desktop *\/», DESIGN.md «Адаптив»). Такий токен приписуємо всім правилам блоку. */
function preprocess(css) {
  return css
    .replace(/(@(?:container|media)[^{]*)\{\s*\/\*([^*]*)\*\//g, (_, at, note) => `${at} ${[...note.matchAll(/--[\w-]+/g)].map((m) => `__ref(${m[0]})`).join(" ")} {`)
    .replace(/\/\*[\s\S]*?\*\//g, "");
}
const keyframes = new Map(); // назва → токени
function parseCss(css, file, out, inherited = []) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const semi = css.indexOf(";", i);
    if (semi >= 0 && semi < open) { i = semi + 1; continue; }
    const prelude = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (depth && j < css.length) { if (css[j] === "{") depth++; else if (css[j] === "}") depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    const varsIn = (text) => [...text.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]).filter(isToken);
    if (prelude.startsWith("@keyframes")) {
      keyframes.set(prelude.split(/\s+/)[1], varsIn(body));
    } else if (prelude.startsWith("@")) {
      if (/^@(media|container|supports|layer)/.test(prelude)) {
        const refs = [...prelude.matchAll(/__ref\((--[\w-]+)\)/g)].map((m) => m[1]).filter(isToken);
        parseCss(body, file, out, [...inherited, ...refs]);
      }
    } else {
      const anim = [...body.matchAll(/animation(?:-name)?\s*:\s*([^;]+)/g)].flatMap((m) => m[1].split(/[\s,]+/));
      const pending = anim.length ? anim : null;
      const tokens = [...new Set([...varsIn(body), ...inherited])];
      if (tokens.length || pending) for (const sel of splitTop(prelude)) out.push({ file, sel, tokens, anim: pending });
    }
    i = j;
  }
}
const componentDir = "design-system/components";
const modules = readdirSync(resolve(repo, componentDir)).filter((f) => f.endsWith(".css") && f !== "index.css");
const rules = [];
for (const f of modules) parseCss(preprocess(read(`${componentDir}/${f}`)), f, rules);
for (const r of rules) if (r.anim) r.tokens = [...new Set([...r.tokens, ...r.anim.flatMap((n) => keyframes.get(n) || [])])];

/* Селектор → послідовність складених селекторів. :is()/:where() розгортаються,
   псевдокласи, :has(), :not() і атрибути — це стани, для збігу ігноруються. */
function expandIs(sel) {
  const m = sel.match(/:(is|where)\(/);
  if (!m) return [sel];
  const start = m.index, inner0 = start + m[0].length;
  let depth = 1, k = inner0;
  while (depth && k < sel.length) { if (sel[k] === "(") depth++; else if (sel[k] === ")") depth--; k++; }
  const alts = splitTop(sel.slice(inner0, k - 1));
  return alts.flatMap((a) => expandIs(sel.slice(0, start) + a + sel.slice(k)));
}
function stripStates(s) {
  let out = s, prev;
  do { prev = out; out = out.replace(/:(has|not|nth-[\w-]+|is|where)\((?:[^()]|\([^()]*\))*\)/g, ""); } while (out !== prev);
  return out.replace(/\[[^\]]*\]/g, "").replace(/::?[\w-]+/g, "");
}
function compounds(sel) {
  // [{tag, classes, id, attrs, comb}] зліва направо; comb — комбінатор перед цим складеним
  const parts = []; let comb = " ";
  for (const tok of sel.replace(/\s*([>+~])\s*/g, " $1 ").trim().split(/\s+/)) {
    if (/^[>+~]$/.test(tok)) { comb = tok; continue; }
    const tag = (tok.match(/^[a-z][\w-]*|^\*/i) || [""])[0].toLowerCase();
    const classes = [...tok.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
    const id = (tok.match(/#([\w-]+)/) || [])[1];
    const attrs = [...tok.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)].map((m) => [m[1], m[2]]);
    parts.push({ tag, classes, id, attrs, comb });
    comb = " ";
  }
  return parts;
}
const ruleSeqs = rules.flatMap((r) => expandIs(r.sel).map((s) => ({ ...r, seq: compounds(stripStates(s)) })));

/* ───────────── Мінімальний HTML-парсер (розмітка екранів рукописна й валідна) ───────────── */

const VOID = new Set("area base br col embed hr img input link meta source track wbr".split(" "));
function parseHtml(html) {
  html = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  const root = { tag: "#root", classes: [], attrs: {}, children: [], parent: null };
  let cur = root;
  for (const m of html.matchAll(/<(\/?)([a-z][\w-]*)([^>]*)>/gi)) {
    const [, close, tagRaw, rest] = m; const tag = tagRaw.toLowerCase();
    if (close) { let n = cur; while (n && n.tag !== tag) n = n.parent; if (n && n.parent) cur = n.parent; continue; }
    const attrs = {};
    for (const a of rest.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? "";
    const node = { tag, attrs, classes: (attrs.class || "").split(/\s+/).filter(Boolean), children: [], parent: cur };
    cur.children.push(node);
    if (!VOID.has(tag) && !rest.trim().endsWith("/")) cur = node;
  }
  return root;
}
const all = (n, acc = []) => { for (const c of n.children) { acc.push(c); all(c, acc); } return acc; };
function matchCompound(node, c, checkAttrs) {
  if (!node || node.tag === "#root") return false;
  if (c.tag && c.tag !== "*" && c.tag !== node.tag) return false;
  if (c.id && node.attrs.id !== c.id) return false;
  if (!c.classes.every((k) => node.classes.includes(k))) return false;
  if (checkAttrs && !c.attrs.every(([k, v]) => k in node.attrs && (v === undefined || node.attrs[k] === v))) return false;
  return true;
}
function prevSiblings(node) { const sib = node.parent ? node.parent.children : []; return sib.slice(0, sib.indexOf(node)).reverse(); }
function matchSeq(node, seq, checkAttrs) {
  const last = seq[seq.length - 1];
  if (!matchCompound(node, last, checkAttrs)) return false;
  let ctx = node;
  for (let i = seq.length - 2; i >= 0; i--) {
    const comb = seq[i + 1].comb, c = seq[i];
    if (!c.tag && !c.classes.length && !c.id) continue; // лише атрибут/стан, напр. [data-theme="dark"]
    let found = null;
    if (comb === " ") { let p = ctx.parent; while (p && !found) { if (matchCompound(p, c, checkAttrs)) found = p; p = p.parent; } }
    else if (comb === ">") { if (matchCompound(ctx.parent, c, checkAttrs)) found = ctx.parent; }
    else if (comb === "+") { const p = prevSiblings(ctx)[0]; if (matchCompound(p, c, checkAttrs)) found = p; }
    else if (comb === "~") found = prevSiblings(ctx).find((p) => matchCompound(p, c, checkAttrs)) || null;
    if (!found) return false;
    ctx = found;
  }
  return true;
}
const GLOBAL_TAGS = new Set(["", "*", "html", "body", ":root"]);
function isGlobal(seq) { const l = seq[seq.length - 1]; return !l.classes.length && !l.id && GLOBAL_TAGS.has(l.tag); }

/* Токени й модулі, які читають правила, що застосовуються до вузла. */
function tokensFor(node) {
  const tokens = new Set(), files = new Set();
  for (const r of ruleSeqs) {
    if (!r.seq.length || isGlobal(r.seq)) continue;
    if (matchSeq(node, r.seq, false)) { r.tokens.forEach((t) => tokens.add(t)); files.add(r.file); }
  }
  return { tokens: [...tokens].sort(), files: [...files].sort() };
}
const globalTokens = [...new Set(ruleSeqs.filter((r) => r.seq.length && isGlobal(r.seq)).flatMap((r) => r.tokens))].sort();

/* ───────────── Список елементів ───────────── */
// [зона, елемент, локатор, компонент (сторінка docs), ключ microcopy, опції]
// Локатор — CSS-селектор по розмітці екрана; «@N» наприкінці — N-й збіг.
// opts.file — інший файл того ж екрана (варіант); opts.virtual — вузол, який створює скрипт кіта:
// { parent: локатор, tag, classes }.

const SCREENS = [
  {
    name: "Оболонка (спільна)", file: PROTO + "listings.html", note: "Однакова на всіх 5 екранах; на кореневих («Стрічка», «Чати») — dock знизу, на вкладених — app bar і таб-бар у шапці (від `--bp-desktop`).",
    screens: ["Стрічка кімнат", "Картка оголошення", "Анкета сумісності", "Заявка", "Чати"],
    rows: [
      ["Каркас", "Оболонка екрана", "div.kit-shell", "shell", "—"],
      ["Каркас", "Тіло екрана", "main.kit-shell__body", "shell", "—"],
      ["Бренд-рядок", "Бренд", "header.kit-shell__brand a", "shell", "shell.brand.name"],
      ["Бренд-рядок", "Місто", "header.kit-shell__brand span", "shell", "shell.brand.city"],
      ["Навігація", "Dock (кореневі екрани)", "nav.kit-tabbar--dock", "shell", "shell.nav.label"],
      ["Навігація", "Таб-бар у шапці (вкладені екрани)", "nav.kit-tabbar--header", "shell", "shell.nav.label", { file: PROTO + "listing.html" }],
      ["Навігація", "Пункт «Пошук» (поточний)", "nav.kit-tabbar a.kit-tab", "shell", "shell.nav.search"],
      ["Навігація", "Пункт «Чати»", "a.kit-tab--chats", "shell", "shell.nav.chats"],
      ["Навігація", "Пункт «Профіль» (вимкнений)", "a.kit-tab--profile", "shell", "shell.nav.profile-disabled"],
      ["Навігація", "Місто в таб-барі", "span.kit-tabbar__city", "shell", "shell.brand.city"],
      ["App bar", "App bar вкладеного екрана", "header.kit-shell__appbar", "shell", "—", { file: PROTO + "listing.html" }],
      ["App bar", "Ланцюжок (десктоп)", "nav.kit-breadcrumbs", "breadcrumbs", "shell.breadcrumbs.label", { file: PROTO + "listing.html" }],
      ["Футер", "Футер", "p.kit-footer", "shell", "shell.footer"],
    ],
  },
  {
    name: "Стрічка кімнат", file: PROTO + "listings.html", route: "lesson-6/listings.html",
    rows: [
      ["Шапка", "Шапка списку", "header.kit-page-intro", "layout", "—"],
      ["Шапка", "Заголовок H1", "h1.kit-headline", "typography", "listings.header.title"],
      ["Шапка", "Лічильник оголошень", "p#listings-count", "typography", "listings.header.count"],
      ["Шапка", "Перемикач «Кімнати / Люди»", "ul.kit-segmented", "segmented", "listings.feed.label"],
      ["Шапка", "Сегмент «Кімнати» (поточний)", "ul.kit-segmented a", "segmented", "listings.feed.rooms"],
      ["Шапка", "Лічильник у сегменті", "span.kit-segmented__count", "segmented", "listings.feed.rooms"],
      ["Шапка", "Сегмент «Люди» (вимкнений)", "ul.kit-segmented span[aria-disabled]", "segmented", "listings.feed.people"],
      ["Шапка", "Пояснення вимкненого сегмента", "p#people-feed-hint", "typography", "listings.feed.people-hint"],
      ["Шапка", "Тулбар", "div.kit-toolbar", "layout", "—"],
      ["Шапка", "Кнопка «Фільтри»", "button.kit-button--icon-filter", "button", "listings.toolbar.filters"],
      ["Стрічка", "Split-view (список + деталь)", "div.kit-split", "split-view", "—"],
      ["Стрічка", "Секція списку", "section.kit-split__list", "split-view", "listings.list.heading"],
      ["Стрічка", "Сітка карток", "ul.kit-list", "listing", "—"],
      ["Картка оголошення", "Картка", "article.kit-listing", "listing", "—"],
      ["Картка оголошення", "Медіа-блок (фото 3:2, скрим)", "div.kit-listing__media", "listing", "—"],
      ["Картка оголошення", "Ціна поверх фото", "div.kit-listing__media p.kit-price", "listing", "common.listing.price"],
      ["Картка оголошення", "Посилання-фото (у вузькій колонці — мініатюра)", "div.kit-listing__media a", "listing", "listings.card.photo-label"],
      ["Картка оголошення", "Фото", "img.kit-listing__photo", "listing", "listings.card.photo-label; alt — `visuals/manifest.md`"],
      ["Картка оголошення", "Назва (посилання на всю картку)", "article.kit-listing h3 a", "listing", "common.listing.title"],
      ["Картка оголошення", "Тип оголошення", "article.kit-listing span.kit-chip--muted", "badge", "common.listing.type.sublet / .fresh"],
      ["Картка оголошення", "Район", "article.kit-listing p.kit-meta--place", "listing", "common.listing.place"],
      ["Картка оголошення", "Заїзд", "article.kit-listing dl.kit-facts", "data-list", "common.listing.move-in.label / .value"],
      ["Картка оголошення", "Хто живе", "div.kit-household", "listing", "listings.card.household"],
      ["Картка оголошення", "Аватари мешканців", "div.kit-household img.kit-avatar", "listing", "alt — `visuals/manifest.md`"],
      ["Картка оголошення", "Список доказів", "article.kit-listing ul.kit-tags", "listing", "listings.card.proof-label"],
      ["Картка оголошення", "Доказ довіри", "ul.kit-tags li.kit-chip", "badge", "common.proof.*"],
      ["Картка оголошення", "Непідтверджений факт", "li.kit-chip--error", "badge", "common.proof.missing.*"],
      ["Картка оголошення", "Тег «Власник напряму»", "li.kit-tag", "listing", "common.proof.owner-direct"],
      ["Кінець списку", "Порожній результат фільтра", "p#listings-empty", "typography", "listings.filter.empty"],
      ["Кінець списку", "Показано N із M", "section.kit-split__list p.kit-hint@2", "typography", "listings.list.shown"],
      ["Кінець списку", "«Завантажити ще»", "section.kit-split__list button.kit-button", "button", "listings.list.load-more"],
      ["Деталь (десктоп)", "Колонка деталі", "section.kit-split__detail", "split-view", "—"],
      ["Деталь (десктоп)", "Заголовок деталі", "h2.kit-split__title", "split-view", "listings.split.title"],
      ["Деталь (десктоп)", "«Закрити»", "button.kit-split__close", "split-view", "listings.split.close"],
      ["Деталь (десктоп)", "Вміст деталі", "div.kit-split__content", "split-view", "ключі «Картки оголошення»"],
      ["Деталь (десктоп)", "Статус завантаження (створює `split-view.js`)", "", "split-view", "listings.split.loading", { virtual: { parent: "ul.kit-list li", tag: "p", classes: ["kit-split__status"] } }],
      ["Фільтри", "Шторка / панель", "details.kit-sheet", "sheet", "—"],
      ["Фільтри", "Заголовок шторки", "span.kit-sheet__title", "sheet", "listings.filters.title"],
      ["Фільтри", "Рядок стану", "span.kit-sheet__state", "sheet", "listings.filters.state"],
      ["Фільтри", "Тіло шторки", "div.kit-sheet__body", "sheet", "—"],
      ["Фільтри", "«Закрити» (створює `sheet.js`)", "", "sheet", "listings.filters.close", { virtual: { parent: "details.kit-sheet", tag: "button", classes: ["kit-sheet__close"] } }],
      ["Фільтри", "Фон шторки (створює `sheet.js`)", "", "sheet", "listings.filters.close", { virtual: { parent: "div.kit-shell", tag: "button", classes: ["kit-sheet-backdrop"] } }],
      ["Фільтри", "Форма", "details.kit-sheet form.kit-form", "form", "listings.filters.label"],
      ["Фільтри", "Група полів", "details.kit-sheet fieldset.kit-fieldset", "form", "—"],
      ["Фільтри", "Назва групи", "details.kit-sheet fieldset legend", "form", "listings.filters.type / .place / .habits"],
      ["Фільтри", "Згортання групи (панель, створює `sheet.js`)", "", "sheet", "listings.filters.summary", { virtual: { parent: "details.kit-sheet fieldset legend", tag: "button", classes: ["kit-sheet__group-toggle"] } }],
      ["Фільтри", "Варіант (радіо)", "details.kit-sheet label.kit-choice", "form", "listings.filters.type"],
      ["Фільтри", "Радіо-кружок", "details.kit-sheet label.kit-choice input", "form", "—"],
      ["Фільтри", "Поле-список", "div.kit-field--select", "form", "listings.filters.district, .habits.*"],
      ["Фільтри", "Підпис поля", "div.kit-field--select label", "form", "listings.filters.district"],
      ["Фільтри", "Список вибору", "select#district", "form", "listings.filters.district"],
      ["Фільтри", "Два поля в рядок", "div.kit-field-row", "form", "—"],
      ["Фільтри", "Числове поле", "input#price-min", "form", "listings.filters.price-min / .price-max"],
      ["Фільтри", "Поле дати", "div.kit-field--date", "form", "listings.filters.move-in"],
      ["Фільтри", "Дії", "details.kit-sheet div.kit-actions", "button", "—"],
      ["Фільтри", "«Застосувати фільтри» / «Фільтрувати»", "details.kit-sheet button[type=\"submit\"]", "button", "listings.filters.apply / .apply-panel"],
      ["Фільтри", "«Скинути фільтри»", "details.kit-sheet button[type=\"reset\"]", "button", "listings.filters.reset"],
    ],
  },
  {
    name: "Картка оголошення", file: PROTO + "listing.html", route: "lesson-6/listing.html (+ 4 `listing-<район>.html`)",
    rows: [
      ["App bar", "«Назад»", "a.kit-back", "shell", "listing.appbar.back"],
      ["App bar", "Ланцюжок", "nav.kit-breadcrumbs", "breadcrumbs", "listing.breadcrumbs"],
      ["App bar", "Заголовок", "h1.kit-shell__title", "shell", "listing.appbar.title"],
      ["Розкладка", "Деталь (2 колонки від 60rem)", "div.kit-detail", "layout", "—"],
      ["Розкладка", "Сітка деталі", "div.kit-detail__layout", "layout", "—"],
      ["Галерея", "Галерея", "ul.kit-gallery", "gallery", "listing.gallery.label"],
      ["Галерея", "Фото", "ul.kit-gallery img", "gallery", "alt — `visuals/manifest.md`"],
      ["Зведення", "Картка-шапка", "div.kit-card--head", "card", "—"],
      ["Зведення", "Назва", "div.kit-card--head h2.kit-headline", "typography", "common.listing.title"],
      ["Зведення", "Адреса", "div.kit-card--head p.kit-meta--place", "typography", "listing.head.place"],
      ["Зведення", "Тип оголошення", "div.kit-card--head span.kit-chip--muted", "badge", "common.listing.type.*"],
      ["Зведення", "Ціна", "p.kit-price", "typography", "common.listing.price"],
      ["Зведення", "Комунальні", "div.kit-card--head p.kit-meta@2", "typography", "listing.head.utilities"],
      ["Зведення", "Актуальність", "div.kit-card--head p.kit-meta@3", "typography", "listing.head.updated"],
      ["Зведення", "Підсумок доказів: перевірено", "p.kit-evidence-summary", "card", "listing.evidence.verified"],
      ["Зведення", "Підсумок доказів: частково", "p.kit-evidence-summary", "card", "listing.evidence.partial", { file: PROTO + "listing-solomianskyi.html" }],
      ["Зведення", "Непідтверджені факти (нічого не перевірено)", "div.kit-card--head span.kit-chip--error", "badge", "common.proof.missing.*", { file: PROTO + "listing-podilskyi.html" }],
      ["Заявка", "Блок дії", "section.kit-detail__apply", "layout", "—"],
      ["Заявка", "Попередження про передоплату", "p.kit-note--warning", "note", "listing.apply.safety"],
      ["Заявка", "«Подати заявку»", "section.kit-detail__apply a.kit-button", "button", "listing.apply.cta"],
      ["Заявка", "Підказка під дією", "section.kit-detail__apply p.kit-hint", "typography", "listing.apply.hint"],
      ["Заявка", "Нотатка прототипу", "section.kit-detail__apply p.kit-note--info", "note", "listing.apply.prototype-note"],
      ["Секції", "Картка секції", "section.kit-card--section", "card", "—"],
      ["Секції", "Заголовок секції", "section.kit-card--section h2.kit-section__title", "typography", "listing.trust.title, .about.title, .residents.title, .wishes.title, .description.title"],
      ["Що перевірено", "Список фактів", "ul.kit-trust-list", "badge", "listing.trust.identity / .phone / .instagram / .lease"],
      ["Що перевірено", "Факт", "ul.kit-trust-list li", "badge", "listing.trust.*"],
      ["Що перевірено", "Нічого не перевірено", "section.kit-card--section p", "card", "listing.trust.none", { file: PROTO + "listing-podilskyi.html" }],
      ["Що перевірено", "Підзаголовок «Ще не перевірено»", "section.kit-card--section p.kit-meta", "typography", "listing.trust.missing", { file: PROTO + "listing-podilskyi.html" }],
      ["Що перевірено", "Непідтверджений факт", "section.kit-card--section span.kit-chip--error", "badge", "common.proof.missing.*", { file: PROTO + "listing-podilskyi.html" }],
      ["Про кімнату", "Факти", "dl.kit-kv", "data-list", "listing.about.facts"],
      ["Мешканці", "Людина", "div.kit-person", "badge", "listing.residents.person"],
      ["Мешканці", "Аватар", "div.kit-person img.kit-avatar", "badge", "alt — `visuals/manifest.md`"],
      ["Мешканці", "Імʼя й вік", "p.kit-person__name", "badge", "listing.residents.person"],
      ["Мешканці", "Опис", "p.kit-person__bio", "badge", "listing.residents.person"],
      ["Мешканці", "Нотатка про профіль", "section.kit-card--section p.kit-hint", "typography", "listing.residents.profile-note"],
      ["Побажання", "Побажання", "section.kit-card--section li.kit-tag", "listing", "listing.wishes.item"],
      ["Опис", "Текст опису", "section[aria-labelledby=\"description-heading\"] p", "card", "listing.description.body"],
    ],
  },
  {
    name: "Анкета сумісності", file: PROTO + "compatibility-form.html", route: "lesson-6/compatibility-form.html",
    rows: [
      ["App bar", "«Назад»", "a.kit-back", "shell", "compat.appbar.back"],
      ["App bar", "Заголовок", "h1.kit-shell__title", "shell", "compat.appbar.title"],
      ["Розкладка", "Основна колонка + бічна (десктоп)", "div.kit-columns", "layout", "—"],
      ["Вступ", "Заголовок", "header.kit-page-intro h2.kit-headline", "typography", "compat.intro.title"],
      ["Вступ", "Текст", "header.kit-page-intro p.kit-hint", "typography", "compat.intro.text"],
      ["Прогрес", "Прогрес", "div.kit-progress", "progress", "compat.progress"],
      ["Прогрес", "Назва кроку й «Крок N із 3»", "p.kit-progress__meta", "progress", "compat.progress"],
      ["Прогрес", "Доріжка", "div.kit-progress__track", "progress", "compat.progress"],
      ["Прогрес", "Заповнення", "span.kit-progress__value", "progress", "—"],
      ["Крок", "Крок форми", "section.kit-step", "layout", "—"],
      ["Крок", "Прихований заголовок кроку", "section.kit-step h3.kit-sr-only", "base", "compat.step1.intro (і step2, step3)"],
      ["Крок", "Вступ кроку", "p.kit-step__intro", "layout", "compat.step1.intro"],
      ["Питання", "Питання", "fieldset.kit-fieldset", "form", "compat.step1.sleep тощо"],
      ["Питання", "Назва питання", "fieldset.kit-fieldset legend", "form", "compat.step1.sleep тощо"],
      ["Питання", "Варіант відповіді", "label.kit-choice", "form", "compat.step1.sleep тощо"],
      ["Питання", "Радіо-кружок", "label.kit-choice input", "form", "—"],
      ["Про себе", "Поле", "div.kit-field", "form", "compat.step3.about"],
      ["Про себе", "Текстове поле", "textarea#about", "form", "compat.step3.about"],
      ["Про себе", "Підказка поля", "p.kit-field__message", "form", "compat.step3.about-hint"],
      ["Дії", "«Зберегти й далі» (крок 1)", "button[data-next]", "button", "compat.actions.next"],
      ["Дії", "Дві дії поруч (кроки 2–3)", "div.kit-actions--split", "layout", "—"],
      ["Дії", "«Назад»", "button[data-back]", "button", "compat.actions.back"],
      ["Дії", "«Зберегти й перейти до заявки»", "button[type=\"submit\"]", "button", "compat.actions.submit"],
      ["Дії", "Статус чернетки", "p.kit-draft-status", "progress", "compat.draft.*"],
      ["Бічна колонка", "Кімната, до якої заявка", "a.kit-conversation-context", "chat", "common.context.application"],
      ["Бічна колонка", "Фото кімнати", "a.kit-conversation-context img", "chat", "alt — `visuals/manifest.md`"],
      ["Бічна колонка", "Надпис «Заявка …»", "a.kit-conversation-context small", "chat", "common.context.application"],
      ["Бічна колонка", "Назва кімнати", "a.kit-conversation-context strong", "chat", "common.context.application"],
      ["Бічна колонка", "Заголовок «Кроки анкети»", "aside section.kit-card--section h2.kit-section__title", "typography", "compat.aside.steps"],
      ["Бічна колонка", "Кроки", "ol.kit-steps", "progress", "compat.aside.steps"],
      ["Бічна колонка", "Крок (поточний)", "ol.kit-steps li", "progress", "compat.aside.steps"],
    ],
  },
  {
    name: "Заявка", file: PROTO + "application.html", route: "lesson-6/application.html",
    rows: [
      ["App bar", "«Назад»", "a.kit-back", "shell", "application.appbar.back"],
      ["App bar", "Заголовок", "h1.kit-shell__title", "shell", "application.appbar.title"],
      ["Розкладка", "Основна колонка + бічна (десктоп)", "div.kit-columns", "layout", "—"],
      ["Бічна колонка", "Кімната, на яку заявка", "a.kit-conversation-context", "chat", "application.aside.label, common.context.application"],
      ["Бічна колонка", "Фото кімнати", "a.kit-conversation-context img", "chat", "alt — `visuals/manifest.md`"],
      ["Бічна колонка", "Надпис «Заявка …»", "a.kit-conversation-context small", "chat", "common.context.application"],
      ["Бічна колонка", "Назва кімнати", "a.kit-conversation-context strong", "chat", "common.context.application"],
      ["Повідомлення", "Картка заявки", "section.kit-application-card", "card", "—"],
      ["Повідомлення", "Заголовок", "section.kit-application-card h2.kit-section__title", "typography", "application.message.title"],
      ["Повідомлення", "Вступ", "section.kit-application-card p.kit-hint", "typography", "application.message.intro"],
      ["Повідомлення", "Форма", "form.kit-form", "form", "—"],
      ["Повідомлення", "Підпис поля", "div.kit-field label", "form", "application.message.field"],
      ["Повідомлення", "Текстове поле", "textarea#application-message", "form", "application.message.field"],
      ["Повідомлення", "Підказка поля", "p.kit-field__message", "form", "application.message.hint"],
      ["Анкета", "Блок «Анкету додано»", "div.kit-application-choice", "card", "—"],
      ["Анкета", "Заголовок", "p.kit-application-choice__title", "card", "application.profile.title"],
      ["Анкета", "«Змінити»", "div.kit-application-choice a.kit-button", "button", "application.profile.change"],
      ["Анкета", "Пояснення", "p.kit-application-choice__meta", "card", "application.profile.meta"],
      ["Дія", "Нотатка прототипу", "form p.kit-note--info", "note", "application.prototype.note"],
      ["Дія", "Головна дія", "form button.kit-button", "button", "application.submit"],
      ["Результат", "Стан «Заявку надіслано»", "div.kit-state", "card", "—"],
      ["Результат", "Іконка стану", "span.kit-state__icon", "card", "—"],
      ["Результат", "Заголовок", "h2#result-heading", "card", "application.result.title"],
      ["Результат", "Що далі", "div.kit-state ol.kit-steps", "progress", "application.result.steps"],
      ["Результат", "Пройдений крок", "li.kit-steps__item--done", "progress", "application.result.steps"],
      ["Результат", "Поточний крок", "div.kit-state ol.kit-steps li[aria-current]", "progress", "application.result.steps"],
      ["Результат", "«Повернутися до оголошення»", "div.kit-state a.kit-button", "button", "application.result.back"],
      ["Результат", "«Змінити анкету»", "div.kit-state a.kit-button--secondary", "button", "application.result.change"],
      ["Результат", "Нотатка прототипу", "div.kit-state p.kit-note--info", "note", "application.result.prototype-note"],
    ],
  },
  {
    name: "Чати", file: CHATS, route: "design-system/examples/chats.html",
    rows: [
      ["Шапка", "Заголовок H1", "h1.kit-headline", "typography", "chats.header.title"],
      ["Шапка", "Лічильник", "header.kit-page-intro p.kit-hint", "typography", "chats.header.count"],
      ["Розкладка", "Основна колонка + бічна (десктоп)", "div.kit-columns", "layout", "—"],
      ["Список", "Картка списку", "div.kit-card--list", "card", "—"],
      ["Список", "Список заявок і чатів", "ul.kit-chat-list", "chat", "chats.list.label"],
      ["Рядок", "Рядок «Заявку надіслано»", "div.kit-chat-row--waiting", "chat", "chats.row.status.sent"],
      ["Рядок", "Рядок «Активний чат», непрочитане", "div.kit-chat-row--unread", "chat", "chats.row.status.active"],
      ["Рядок", "Рядок «Заявку прийнято»", "div.kit-chat-row@3", "chat", "chats.row.status.accepted, chats.row.empty-thread"],
      ["Рядок", "Аватар", "div.kit-chat-row img.kit-avatar", "chat", "alt — `visuals/manifest.md`"],
      ["Рядок", "Імʼя", "span.kit-chat-copy strong", "chat", "chats.row.name"],
      ["Рядок", "Останнє повідомлення", "span.kit-chat-copy span", "chat", "chats.row.preview"],
      ["Рядок", "Статус", "span.kit-chat-copy em", "chat", "chats.row.status.*"],
      ["Рядок", "Кімната", "span.kit-chat-copy small span", "chat", "chats.row.room"],
      ["Рядок", "Час", "span.kit-chat-side time", "chat", "chats.row.time"],
      ["Рядок", "Лічильник непрочитаного", "span.kit-unread", "chat", "chats.row.unread"],
      ["Список", "Підказка під списком", "section.kit-columns__main p.kit-hint", "typography", "chats.hint"],
      ["Бічна колонка", "Заголовок «Як працюють заявки»", "aside h2.kit-section__title", "typography", "chats.how"],
      ["Бічна колонка", "Кроки", "ol.kit-steps", "progress", "chats.how"],
      ["Бічна колонка", "Крок", "ol.kit-steps li", "progress", "chats.how"],
    ],
  },
];

/* ───────────── Збирання ───────────── */

const trees = new Map();
const tree = (file) => { if (!trees.has(file)) trees.set(file, parseHtml(read(file))); return trees.get(file); };
function locate(file, locator) {
  const [sel, nth] = locator.split("@");
  const seq = compounds(sel);
  const found = all(tree(file)).filter((n) => matchSeq(n, seq, true));
  const node = found[(Number(nth) || 1) - 1];
  if (!node) throw new Error(`Не знайдено «${locator}» у ${file}`);
  return node;
}

const usage = new Map(); // токен → Map(екран → кількість елементів)
const use = (token, screens) => {
  if (!usage.has(token)) usage.set(token, new Map());
  for (const s of screens) usage.get(token).set(s, (usage.get(token).get(s) || 0) + 1);
};
const docsLink = (c) => `[\`${c}\`](../design-system/docs/${c}.html)`;
const code = (list) => list.map((t) => `\`${t}\``).join(" ");

const sections = [];
for (const screen of SCREENS) {
  const screensForUsage = screen.screens || [screen.name];
  const lines = [`## ${screen.name}`, ""];
  if (screen.route) lines.push(`Файл: \`${screen.route}\`.`, "");
  if (screen.note) lines.push(screen.note, "");
  lines.push("| Зона | Елемент | Компонент (модулі CSS) | Токени, які читає | Ключ `microcopy.md` |", "|---|---|---|---|---|");
  for (const [zone, element, locator, component, key, opts = {}] of screen.rows) {
    const file = opts.file || screen.file;
    let node;
    if (opts.virtual) {
      const parent = locate(file, opts.virtual.parent);
      node = { tag: opts.virtual.tag, classes: opts.virtual.classes, attrs: {}, children: [], parent };
    } else node = locate(file, locator);
    const { tokens, files } = tokensFor(node);
    tokens.forEach((t) => use(t, screensForUsage));
    const variant = opts.file && opts.file !== screen.file ? ` (\`${opts.file.split("/").pop()}\`)` : "";
    const keyCell = key.replace(/(?<![\w`.])((?:shell|common|listings|listing|compat|application|chats)\.[\w.*-]+)/g, "`$1`");
    lines.push(`| ${zone} | ${element}${variant} | ${docsLink(component)}${files.length ? ` (${files.join(", ")})` : ""} | ${tokens.length ? code(tokens) : "—"} | ${keyCell} |`);
  }
  sections.push(lines.join("\n"));
}

/* Зворотний список. Пряме читання + усе, що токен тягне за собою через tokens.css. */
const ALL5 = ["Стрічка кімнат", "Картка оголошення", "Анкета сумісності", "Заявка", "Чати"];
globalTokens.forEach((t) => use(t, ALL5));
const globalSet = new Set(globalTokens);
const reach = new Map(); // токен → { screens, via:Set, direct:кількість елементів }
for (const [t, m] of usage) {
  for (const [d, via] of [[t, null], ...[...closure(t)].map((x) => [x, t])]) {
    if (!reach.has(d)) reach.set(d, { screens: new Set(), via: new Set(), direct: 0 });
    const e = reach.get(d);
    m.forEach((n, sName) => { e.screens.add(sName); if (!via) e.direct += n; });
    if (via) e.via.add(via);
  }
}
const screensCell = (t) => {
  const names = ALL5.filter((sName) => reach.get(t).screens.has(sName));
  return (names.length === ALL5.length ? "усі 5" : names.join(", ")) + (globalSet.has(t) ? " (глобальне правило)" : "");
};
const viaCell = (t) => { const v = [...reach.get(t).via].sort(); return v.length ? code(v) : "—"; };
const reached = [...reach.keys()];
const semanticRows = reached.filter((t) => !isPrimitive(t)).sort();
const reverseSemantic = semanticRows.map((t) => {
  const deps = [...closure(t)].filter(isPrimitive).sort();
  return `| \`${t}\` | ${screensCell(t)} | ${reach.get(t).direct || "—"} | ${viaCell(t)} | ${deps.length ? code(deps) : "—"} |`;
});
const primRows = reached.filter(isPrimitive).sort();
const reversePrimitive = primRows.map((t) => `| \`${t}\` | ${screensCell(t)} | ${reach.get(t).direct || "—"} | ${viaCell(t)} |`);
const primUsage = { size: primRows.length };
const unused = [...tokenDeps.keys()].filter((t) => !reach.has(t)).sort();

const out = `# Карта екранів — з чого зібраний кожен екран

> **Згенеровано** \`node scripts/build-handoff-map.mjs\` (${new Date().toISOString().slice(0, 10)}). Не редагуй руками:
> токени скрипт знаходить сам — бере розмітку екрана, шукає правила
> \`design-system/components/*.css\`, що застосовуються до елемента (з усіма станами:
> hover, focus, disabled, тема, адаптив), і виписує \`var(--…)\` з них. Руками ведеться лише
> список елементів, компонентів і ключів — масив \`SCREENS\` у скрипті. Змінив екран,
> компонент чи токен — перезапусти скрипт.

Навіщо: відповісти на питання **«якщо я зміню цей токен, що поїде»** — для цього є
[зворотний список](#зворотний-список-токен--екрани) наприкінці. Вперед — щоб знати, з чого
збирати екран.

Як читати:

- **Один рядок — один елемент екрана.** Повторювані елементи (5 карток стрічки, 18 варіантів
  анкети) описано одним рядком. Варіант екрана, з якого взято елемент, — у дужках.
- **Компонент** — сторінка живої документації \`design-system/docs/\` зі станами в обох темах;
  у дужках — CSS-модулі, правила яких реально застосовуються до елемента.
- **Токени** — ті, що читають правила самого елемента. Успадковане від батька (колір тексту,
  шрифт) тут не повторюється — дивись рядок батьківського елемента. Токени глобальних правил
  (\`html\`, \`body\`, \`*\` у \`base.css\`) стоять на всіх екранах і винесені в
  [окремий список](#глобальні-правила).
- **Ключ** — адреса тексту в [\`microcopy.md\`](microcopy.md), розділ «Активні екрани». \`*\` —
  будь-який ключ гілки; \`/\` — варіанти. «alt — \`visuals/manifest.md\`» — альтернативний
  текст фото береться з маніфесту візуалів.
- **Новий текст** для екрана, якого в карті ще немає: тон і правила — [\`voice.md\`](voice.md)
  (принципи, словник, «Правила за типом елемента»); новий рядок у \`microcopy.md\` отримує ключ
  за схемою \`<екран>.<зона>.<елемент>\`, повторюваний текст — \`common.*\` або \`shell.*\`.
  Тексти станів, яких ще немає на екранах (помилки, порожньо, завантаження), — у
  \`microcopy.md › Повний інвентар\`; правила застосування — [\`common.md\`](common.md).

Курсова рамка (\`course-nav.*\`, \`_base.css\`) не продукт і в карту не входить. Поведінка
скриптів кіта, яка читає токени через \`getComputedStyle\` (\`split-view.js\` — тривалості й
криві руху, \`sheet.js\` і \`split-view.js\` — прапорці режимів), у карті не показана: вона
спирається на ті самі токени, що вже є в рядках \`sheet\` і \`split-view\`.

${sections.join("\n\n")}

## Глобальні правила

Правила \`html\`, \`body\`, \`*\` у модулях кіта (переважно \`base.css\`) — шрифт і колір
сторінки, зменшений рух, фокус. Діють на всіх 5 екранах:

${code(globalTokens)}

## Зворотний список: токен → екрани

«Що поїде, якщо змінити токен». Екрани — де токен читає хоча б один елемент (або глобальне
правило), зокрема й ті, що читають його не напряму, а через інший токен
(\`--elevation-hover\` → \`--color-shadow-hover\`). «Читають напряму» — скільки рядків карти
мають токен у колонці «Токени»; «Через» — які токени передають зміну далі. Зміна значення в
\`design-system/tokens.css\` змінює всі ці місця в обох темах, якщо темна тема не
перевизначає токен.

### Semantic-токени

| Токен | Екрани | Читають напряму (елементів) | Через інші токени | Спирається на primitive |
|---|---|---|---|---|
${reverseSemantic.join("\n")}

### Primitive-токени

Primitive напряму читають лише компоненти (геометрія, іконки, font-weight — \`AGENTS.md\`);
решта приходить через semantic.

| Токен | Екрани | Читають напряму (елементів) | Через |
|---|---|---|---|
${reversePrimitive.join("\n")}

### Не читаються на жодному екрані

Зміна цих токенів 5 екранів не зачепить: на них не посилається жодне правило, що
застосовується до елементів карти, ані інший такий токен. Вони можуть працювати в docs, у
вітринах \`ui/\`, у станах, яких на екранах немає, або бути запасом:

${unused.length ? code(unused) : "—"}
`;

writeFileSync(resolve(repo, "handoff/map.md"), out);
console.log(`handoff/map.md: ${SCREENS.reduce((a, s) => a + s.rows.length, 0)} елементів, ${semanticRows.length} semantic, ${primUsage.size} primitive, ${unused.length} не читаються`);
