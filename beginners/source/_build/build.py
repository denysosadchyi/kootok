#!/usr/bin/env python3
"""Збирає статичний сайт проєкту Куток у _site/.

Навігація повторює структуру курсу «Design Engineering Beginners»
(6 уроків). Візуальний референс — Notion. Тема: тільки світла.
"""

import re
import shutil
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"
SCREENS = ROOT / "research" / "screens"
GITHUB_URL = "https://github.com/denysosadchyi/kkutok"

# ── Структура курсу ──────────────────────────────────────────────────
# Кожен урок: файл, іконка, номер, назва, статус, дані для сторінки-заглушки,
# і вкладені документи (файл, іконка, назва, джерело .md)
LESSONS = [
    {
        "tone": "sky", "short": "Онбординг", "file": "lesson1.html", "icon": "terminal", "no": "Урок 1",
        "title": "Онбординг: перший день з Claude Code",
        "status": "done",
        "goal": "Спокійно зайти в Claude Code, навчитися керувати ним "
                "промптами і зняти страхи перед стартом.",
        "topics": [
            "Що таке Claude Code простими словами і чим відрізняється від чату.",
            "Як давати промпти: формулювати, виправляти, скеровувати.",
            "Як Claude тримає контекст роботи і як ним керувати.",
            "Де Claude типово помиляється — і чому це не страшно.",
        ],
        "homework": "Поставити Claude Code і дати йому 3–5 простих завдань. "
                    "Мета не результат, а ритм розмови.",
        "state": "Пройдено. Артефактів у репозиторії не лишає — "
                 "результат уроку це налаштоване середовище.",
        "children": [],
    },
    {
        "tone": "teal", "short": "Ресерч і бенчмарк", "file": "lesson2.html", "icon": "search", "no": "Урок 2",
        "title": "Ресерч і бенчмарк",
        "status": "done",
        "goal": "За один підхід зібрати готове дослідження ринку — рівно "
                "стільки, щоб упевнено стартувати продукт.",
        "topics": [
            "Як поставити Claude завдання на дослідження конкурентів.",
            "Як Claude сам збирає інформацію з сайтів і робить скріни.",
            "З чого складається готове дослідження: конкуренти, спільні "
            "рішення, прогалини ринку, власні гіпотези.",
            "Коли Claude починає вигадувати дані — і як це ловити.",
        ],
        "homework": "5 конкурентів, 3 патерни, які повторюються у всіх, "
                    "і 5 своїх гіпотез — в одному документі поряд з проєктом.",
        "state": "Зроблено з запасом: 15 конкурентів у трьох групах, "
                 "44 скріншоти, 3 патерни ринку, 5 гіпотез.",
        "children": [
            ("brief.html", "file-text", "Продуктовий бриф", ROOT / "CLAUDE.md"),
            ("research.html", "table", "Конкуренти", ROOT / "research" / "research.md"),
            ("screens.html", "images", "Скріншоти", None),
            ("trust.html", "shield", "Вимір довіри",
             ROOT / "research" / "notes" / "trust-dimension.md"),
            ("patterns.html", "grid", "UX-патерни",
             ROOT / "research" / "notes" / "ux-patterns.md"),
            ("implications.html", "lightbulb", "Дизайн-висновки",
             ROOT / "research" / "design-implications.md"),
        ],
    },
    {
        "tone": "purple", "short": "Персони і структура", "file": "lesson3.html", "icon": "users", "no": "Урок 3",
        "title": "Персони, задачі і структура продукту",
        "status": "next",
        "goal": "З дослідження зробити живі персони, їхні задачі (JTBD) і "
                "структуру продукту — карту екранів, навігацію, сценарії.",
        "topics": [
            "Як з дослідження зробити персони, де кожна деталь має підставу.",
            "JTBD простими словами: яку задачу людина закриває і чим.",
            "Як з персон і задач сама виростає структура екранів.",
            "Що на екрані головне і скільки кроків до головної дії.",
        ],
        "homework": "2–4 персони, таблиця задач (JTBD), карта екранів, "
                    "навігація і 3–5 головних сценаріїв.",
        "children": [],
    },
    {
        "tone": "orange", "short": "Прототипування", "file": "lesson4.html", "icon": "layout", "no": "Урок 4",
        "title": "Прототипування і вайрфреймінг",
        "status": "ahead",
        "goal": "Швидко зібрати клікабельні чорно-білі прототипи ключових "
                "екранів — основу для перенесення у Figma.",
        "topics": [
            "Чому клікабельний прототип збирається швидше за статику.",
            "Як організувати екрани: поодинці чи цілим сценарієм.",
            "Що деталізувати зараз, а що лишити приблизним.",
            "Одразу закривати всі стани: порожній, помилка, завантаження, успіх.",
        ],
        "homework": "5–7 ключових екранів свого продукту, mobile-first, "
                    "з усіма закритими станами.",
        "state": "Попереду. Для Кутка це стрічка оголошень, сторінка "
                 "оголошення, профіль з анкетою і створення оголошення.",
        "children": [],
    },
    {
        "tone": "pink", "short": "Прототип у Figma", "file": "lesson5.html", "icon": "figma", "no": "Урок 5",
        "title": "figmosha2: прототип у Figma і жива дизайн-система",
        "status": "ahead",
        "goal": "Перенести готовий прототип у Figma і зібрати з нього живу "
                "дизайн-систему — компоненти, варіанти, кольори-токени.",
        "topics": [
            "Як поставити безкоштовний плагін figmosha2.",
            "Як Claude сам збирає екрани у Figma прямо з прототипу.",
            "Як зробити компоненти і їхні варіанти без ручного перетягування.",
            "Як підв'язати кольори і скруглення як змінні.",
        ],
        "homework": "Перенести прототип у Figma, зробити 3–5 компонентів "
                    "з варіантами, підв'язати змінні, зібрати бібліотеку.",
        "state": "Попереду. Потрібні Figma Desktop і плагін figmosha2.",
        "children": [],
    },
    {
        "tone": "green", "short": "Чистка макетів", "file": "lesson6.html", "icon": "sparkles", "no": "Урок 6",
        "title": "figmosha2: чистимо й оптимізуємо макети у Figma",
        "status": "ahead",
        "goal": "Взяти реальний робочий файл Figma, знайти в ньому проблеми "
                "і навести лад — стилі на змінні, примітиви на токени.",
        "topics": [
            "Авдит файлу: відірвані стилі, хардкод, дублікати, хаос у шарах.",
            "Міграція зі стилів на змінні (Variables).",
            "Від примітивів до семантичних токенів: «синій-500» → «фон-головний».",
            "Масові правки за конвенцією одним проходом.",
        ],
        "homework": "Свій реальний файл: прогнати авдит, виправити "
                    "топ-проблем, перевести кольори на змінні.",
        "state": "Попереду. Потрібен власний робочий файл у Figma.",
        "children": [],
    },
]

STATUS_LABEL = {
    "done": "зроблено",
    "next": "наступний крок",
    "ahead": "попереду",
}

CSS = """
:root {
  /* colors — DESIGN-notion.md */
  --primary: #0075de;
  --primary-active: #005bab;
  --canvas: #f6f5f4;
  --surface: #ffffff;
  --ink: #000000;
  --ink-secondary: #31302e;
  --ink-muted: #615d59;
  --ink-faint: #a39e98;
  --hairline: #e6e6e6;
  --sky: #62aef0;
  --purple: #d6b6f6;
  --pink: #ff64c8;
  --orange: #dd5b00;
  --teal: #2a9d99;
  --green: #1aae39;

  --sans: Inter, -apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif;
  --mono: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;

  /* rounded */
  --r-xs: 4px; --r-sm: 5px; --r-md: 8px; --r-lg: 12px; --r-xl: 16px; --r-full: 9999px;
  /* spacing */
  --s-xxs: 4px; --s-xs: 8px; --s-sm: 12px; --s-md: 16px; --s-lg: 24px;
  --s-xl: 28px; --s-xxl: 32px; --s-3xl: 48px; --s-4xl: 64px;

  --lift: rgba(0,0,0,0.01) 0 0.175px 1.041px, rgba(0,0,0,0.02) 0 0.8px 2.925px,
          rgba(0,0,0,0.027) 0 2.025px 7.847px, rgba(0,0,0,0.04) 0 4px 18px;
  --nav-w: 260px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--canvas); color: rgba(0,0,0,0.95);
  font-family: var(--sans); font-size: 16px; line-height: 1.5;
  font-feature-settings: 'lnum' 1; -webkit-font-smoothing: antialiased;
}
:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: var(--r-xs); }

.shell { display: grid; grid-template-columns: var(--nav-w) minmax(0, 1fr); }

/* ── Бічна панель ─────────────────────────────────────────────── */
.side {
  grid-column: 1; background: var(--canvas);
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
  padding: var(--s-sm) 0 var(--s-xxl); font-size: 15px; line-height: 1.33;
}
.side-head {
  display: flex; align-items: center; gap: 10px;
  padding: var(--s-xs) var(--s-sm); margin: 0 var(--s-xs) 6px;
}
.side-head .mark {
  width: 24px; height: 24px; flex: none; border-radius: var(--r-md);
  background: var(--ink); color: #fff; display: grid; place-items: center;
  font-size: 13px; font-weight: 600;
}
.side-head .nm {
  display: block; font-weight: 600; font-size: 15px; letter-spacing: -0.125px;
  color: var(--ink);
}
.side-head .sub {
  display: block; font-size: 12px; font-weight: 400; color: var(--ink-faint);
  line-height: 1.33; margin-top: 1px;
}

.sec {
  font-size: 12px; font-weight: 600; letter-spacing: 0.125px;
  text-transform: uppercase; color: var(--ink-faint);
  padding: var(--s-lg) var(--s-md) 10px; margin: 0;
}
.tree { list-style: none; margin: 0; padding: 0 var(--s-xs); }
.tree > li + li { margin-top: 2px; }
.tree > li:has(.kids) + li { margin-top: 10px; }
.tree > li:has(.kids) { margin-top: 10px; }
.item {
  display: flex; align-items: center; gap: 10px;
  padding: 6px var(--s-xs); border-radius: var(--r-sm);
  color: var(--ink-secondary); text-decoration: none;
  transition: background 120ms var(--ease);
}
.item:hover { background: rgba(0,0,0,0.045); }
.item[aria-current='page'] { background: rgba(0,0,0,0.07); }
.item[aria-current='page'] .nm2 { color: var(--ink); font-weight: 600; }
.item.flat { cursor: default; }
.item.flat:hover { background: none; }
.item.flat .nm2, .item.flat .no { color: var(--ink-faint); }
.item .ic {
  flex: none; display: grid; place-items: center;
  width: 22px; height: 22px; border-radius: var(--r-sm); color: var(--ink-muted);
}
.item .tile { color: #fff; }
.tile.sky { background: var(--sky); } .tile.purple { background: #a86fe0; }
.tile.pink { background: var(--pink); } .tile.orange { background: var(--orange); }
.tile.teal { background: var(--teal); } .tile.green { background: var(--green); }
.item.flat .tile { opacity: 0.45; }
.item .tx { flex: 1; min-width: 0; }
.item .no { display: block; font-size: 12px; font-weight: 500; color: var(--ink-faint); }
.item .nm2 { display: block; font-size: 15px; }
.item .pip { flex: none; width: 6px; height: 6px; border-radius: var(--r-full); }
.pip.done { background: var(--green); }
.pip.next { background: var(--primary); }
.pip.ahead { background: transparent; border: 1px solid var(--ink-faint); }

.kids { list-style: none; margin: 3px 0 0; padding: 0 0 0 22px;
  display: grid; gap: 1px; }
.kids .item { padding: 4px var(--s-xs); }
.kids .item .ic { width: 18px; height: 18px; }
.kids .item .nm2 { font-size: 14px; color: var(--ink-muted); }
.kids .item[aria-current='page'] .nm2 { color: var(--ink); }

.side-link {
  display: flex; align-items: center; gap: 10px;
  margin: var(--s-lg) var(--s-xs) 0; padding: 6px var(--s-xs);
  border-radius: var(--r-sm); color: var(--ink-muted);
  text-decoration: none; font-size: 14px;
  transition: background 120ms var(--ease);
}
.side-link:hover { background: rgba(0,0,0,0.045); color: var(--ink); }
.side-link .lu { flex: none; }
.side-foot {
  margin: var(--s-md) var(--s-xs) 0; padding: var(--s-md) var(--s-sm) 0;
  border-top: 1px solid var(--hairline);
  font-size: 12px; line-height: 1.5; color: var(--ink-faint);
}

/* ── Контент: біла поверхня на теплому полотні ────────────────── */
main { grid-column: 2; min-width: 0; padding: var(--s-xs) var(--s-xs) var(--s-xs) 0; }
.sheetwrap { background: var(--surface); border: 1px solid var(--hairline);
  border-radius: var(--r-lg); min-height: calc(100vh - 16px); overflow: hidden; }
.crumbs {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: var(--s-sm) var(--s-xxl); font-size: 14px; color: var(--ink-muted);
  border-bottom: 1px solid var(--hairline);
  position: sticky; top: 0; background: var(--surface); z-index: 10;
}
.crumbs a { color: var(--ink-muted); text-decoration: none;
  padding: 2px 6px; border-radius: var(--r-xs); }
.crumbs a:hover { background: rgba(0,0,0,0.045); color: var(--ink); }
.crumbs .now { color: var(--ink); font-weight: 500; }
.crumbs .sep { display: grid; place-items: center; color: var(--ink-faint); }
.crumbs .sep .lu { width: 13px; height: 13px; }
.crumbs .badge {
  margin-left: auto; display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.125px;
  padding: var(--s-xxs) var(--s-xs); border-radius: var(--r-full);
  background: var(--surface); border: 1px solid var(--hairline);
  color: var(--primary); white-space: nowrap;
}
.crumbs .badge::before { content: ''; width: 6px; height: 6px;
  border-radius: var(--r-full); background: var(--green); }
.crumbs .badge.next { color: var(--primary); }
.crumbs .badge.next::before { background: var(--primary); }
.crumbs .badge.ahead { color: var(--ink-muted); }
.crumbs .badge.ahead::before { background: transparent; border: 1px solid var(--ink-faint); }

.doc { --doc-pad: clamp(20px, 3.5vw, 56px);
  padding: var(--s-3xl) var(--doc-pad) 96px; max-width: none; }
.doc > *:first-child { margin-top: 0; }

.page-icon { margin: 0 0 var(--s-md); }
.tile.doc-tile { background: #31302e; }
.page-icon .tile-lg {
  width: 40px; height: 40px; border-radius: var(--r-lg); color: #fff;
  display: grid; place-items: center;
}
h1 { font-size: 40px; font-weight: 700; line-height: 1.1; letter-spacing: -1px;
  margin: 0 0 var(--s-lg); color: var(--ink); text-wrap: balance; }
h2 { font-size: 26px; font-weight: 700; line-height: 1.23; letter-spacing: -0.625px;
  margin: var(--s-3xl) 0 10px; color: var(--ink); text-wrap: balance; }
h3 { font-size: 22px; font-weight: 700; line-height: 1.27; letter-spacing: -0.25px;
  margin: var(--s-xl) 0 6px; color: var(--ink); }
h4 { font-size: 20px; font-weight: 600; line-height: 1.4; letter-spacing: -0.125px;
  margin: var(--s-lg) 0 2px; color: var(--ink); }
p { margin: 0 0 var(--s-sm); }
p, li { max-width: none; }
ul, ol { margin: 0 0 var(--s-md); padding-left: 26px; }
li { margin-bottom: 6px; }
li::marker { color: var(--ink-faint); }
strong { font-weight: 600; color: var(--ink); }
a { color: var(--primary); text-decoration-color: rgba(0,117,222,0.35);
  text-underline-offset: 2px; }
a:hover { color: var(--primary-active); text-decoration-color: currentColor; }
hr { border: 0; border-top: 1px solid var(--hairline); margin: var(--s-4xl) 0; }

code { font-family: var(--mono); font-size: 0.86em; background: var(--canvas);
  color: var(--orange); padding: 2px 5px; border-radius: var(--r-xs); }
pre { background: var(--canvas); border: 1px solid var(--hairline);
  border-radius: var(--r-md); padding: var(--s-md); overflow-x: auto; }
pre code { background: none; color: inherit; padding: 0; }

blockquote { margin: var(--s-md) 0; padding: var(--s-md); border-radius: var(--r-lg);
  background: var(--canvas); border: 1px solid var(--hairline); color: var(--ink-secondary); }
blockquote p:last-child { margin-bottom: 0; }

/* ── Таблиці ──────────────────────────────────────────────────── */
.tablewrap { margin: var(--s-md) 0 var(--s-xl); }
.tablewrap.wide {
  margin-inline: calc(-1 * var(--doc-pad));
  padding-inline: var(--doc-pad);
}
.cmp-group .tablescroll { background: var(--surface); }
.tablescroll {
  overflow-x: auto; border: 1px solid var(--hairline);
  border-radius: var(--r-md); background: var(--surface);
}
table {
  border-collapse: separate; border-spacing: 0; width: 100%;
  table-layout: fixed; font-size: 14px; line-height: 1.45;
  font-variant-numeric: tabular-nums;
}
.tablewrap.wide table { min-width: 60rem; }
th, td {
  padding: 10px var(--s-sm); text-align: left; vertical-align: top;
  border-bottom: 1px solid var(--hairline);
  overflow-wrap: break-word; text-wrap: pretty;
}
th {
  background: var(--canvas); font-size: 11px; font-weight: 600;
  letter-spacing: 0.5px; text-transform: uppercase; color: var(--ink-muted);
  position: sticky; top: 0; z-index: 2; white-space: nowrap;
  border-bottom: 1px solid #dcdcdc;
}
td { color: var(--ink-secondary); }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover td { background: #fafafa; }

/* перша колонка тримається на місці при горизонтальній прокрутці */
.tablewrap.wide th:first-child, .tablewrap.wide td:first-child {
  position: sticky; left: 0; z-index: 1;
  background: var(--surface); border-right: 1px solid var(--hairline);
  font-weight: 600; color: var(--ink);
}
.tablewrap.wide th:first-child { z-index: 3; background: var(--canvas); }
.tablewrap.wide tbody tr:hover td:first-child { background: #fafafa; }
.tablewrap.wide td:first-child strong { font-weight: 600; }

/* тонкі роздільники колонок — лише у широких таблицях */
.tablewrap.wide td, .tablewrap.wide th { border-right: 1px solid #f0f0f0; }
.tablewrap.wide td:last-child, .tablewrap.wide th:last-child { border-right: 0; }

.tag {
  display: inline-block; white-space: nowrap;
  font-size: 11px; font-weight: 600; letter-spacing: 0.25px;
  padding: 2px 8px; border-radius: var(--r-full);
}
.tag.hard { background: #fdece0; color: #8a3c00; }
.tag.soft { background: #ddf1f0; color: #10635f; }
.tag.asp  { background: #efe4fb; color: #4a2273; }


/* ── Порівняння: два режими читання ───────────────────────────── */
.cmp-wrap {
  margin: var(--s-md) 0 var(--s-xl);
  margin-inline: calc(-1 * var(--doc-pad)); padding-inline: var(--doc-pad);
}
.cmp-switch { display: inline-flex; gap: 2px; padding: 3px; margin-bottom: var(--s-md);
  background: var(--canvas); border-radius: var(--r-md); }
.cmp-switch input { position: absolute; opacity: 0; pointer-events: none; }
.cmp-switch label {
  font-size: 13px; font-weight: 500; color: var(--ink-muted);
  padding: 5px 12px; border-radius: 6px; cursor: pointer;
  transition: background 120ms var(--ease), color 120ms var(--ease);
}
.cmp-switch label:hover { color: var(--ink); }
.cmp-switch input:checked + label {
  background: var(--surface); color: var(--ink); box-shadow: var(--lift);
}
.cmp-switch input:focus-visible + label { outline: 2px solid var(--primary); outline-offset: 1px; }
.cmp-view { display: none; }
.cmp-wrap:has(#cmpv-a:checked) .view-a { display: block; }
.cmp-wrap:has(#cmpv-b:checked) .view-b { display: block; }

.cmp-group + .cmp-group { margin-top: var(--s-xxl); }
.cmp-cap {
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  font-size: 13px; font-weight: 600; letter-spacing: 0.25px;
  text-transform: uppercase; color: var(--ink-muted); margin: 0 0 10px;
}
.cmp-note { font-weight: 400; text-transform: none; letter-spacing: 0;
  font-size: 13px; color: var(--ink-faint); }

table.cmp { table-layout: fixed; width: 100%; border-collapse: separate;
  border-spacing: 0; font-size: 14px; line-height: 1.45; }
table.cmp col.c-name { width: 150px; }
table.cmp.axis { min-width: 0; }
table.cmp.axis col.c-name { width: 210px; }
table.cmp:not(.axis) { min-width: 58rem; }
table.cmp th, table.cmp td {
  padding: 11px var(--s-sm); text-align: left; vertical-align: top;
  border-bottom: 1px solid var(--hairline);
  overflow-wrap: normal; word-break: normal; hyphens: none; text-wrap: pretty;
}
table.cmp thead th {
  background: var(--canvas); font-size: 11px; font-weight: 600;
  letter-spacing: 0.5px; text-transform: uppercase; color: var(--ink-muted);
  position: sticky; top: 0; z-index: 2; white-space: nowrap;
}
table.cmp tbody th[scope='row'] {
  font-weight: 600; color: var(--ink); font-size: 14px;
  text-transform: none; letter-spacing: 0;
  position: sticky; left: 0; background: var(--surface); z-index: 1;
  border-right: 1px solid var(--hairline);
}
table.cmp.axis tbody th[scope='row'] { position: static; }
table.cmp tbody th .tag.mini {
  display: block; margin-top: 5px; font-size: 10px; padding: 1px 6px;
  width: fit-content; font-weight: 600;
}
table.cmp td { color: var(--ink-secondary); }
table.cmp tbody tr:last-child th, table.cmp tbody tr:last-child td { border-bottom: 0; }
table.cmp tbody tr:hover td, table.cmp tbody tr:hover th { background: #fafafa; }
table.cmp.axis td { padding-left: var(--s-lg); }

@media (max-width: 62rem) {
  table.cmp col.c-name, table.cmp.axis col.c-name { width: 120px; }
  table.cmp tbody th[scope='row'] { font-size: 13px; }
}

/* ── Перелік розділів ─────────────────────────────────────────── */
.toc { margin: 0 0 var(--s-3xl); padding: var(--s-md) var(--s-lg);
  background: var(--canvas); border-radius: var(--r-lg); }
.toc-label { font-size: 12px; font-weight: 600; letter-spacing: 0.125px;
  text-transform: uppercase; color: var(--ink-faint); margin: 0 0 var(--s-xs); }
.toc ul { list-style: none; margin: 0; padding: 0; columns: 3; column-gap: var(--s-xxl); }
.toc li { margin: 0 0 5px; break-inside: avoid; max-width: none; }
.toc a { font-size: 15px; text-decoration: none; color: var(--ink-secondary); }
.toc a:hover { color: var(--primary); }

/* ── Сторінка уроку ───────────────────────────────────────────── */
.lede { font-size: 20px; font-weight: 400; line-height: 1.4; letter-spacing: -0.125px;
  color: var(--ink-secondary); max-width: none; margin-bottom: var(--s-xl); }
.callout { display: flex; gap: var(--s-sm); padding: var(--s-md) var(--s-lg);
  border-radius: var(--r-lg); background: var(--canvas);
  margin: 0 0 var(--s-3xl); max-width: none; }
.callout .ci { flex: none; color: var(--green); padding-top: 2px; }
.callout.ahead .ci { color: var(--ink-muted); }
.callout p { margin: 0; }
.claude-refero-block { margin-top: 64px; padding: clamp(20px, 3vw, 40px);
  border: 1px solid var(--line); border-radius: 20px; background: var(--surface-soft); }
.claude-refero-block > .source-label { margin: 0 0 8px; color: var(--ink-muted);
  font-size: .78rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.claude-refero-block > h2 { margin-top: 0; }
.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
  gap: var(--s-xxl) var(--s-4xl); margin: var(--s-xl) 0 0; }
.cols h3 { margin-top: 0; }

.docs-row { display: flex; flex-wrap: wrap; gap: 10px; margin: var(--s-md) 0 0; }
.doc-chip { display: inline-flex; align-items: center; gap: var(--s-xs);
  padding: var(--s-xs) 14px; border: 1px solid var(--hairline);
  border-radius: var(--r-md); text-decoration: none; color: var(--ink);
  font-size: 16px; font-weight: 500; background: var(--surface);
  transition: box-shadow 150ms var(--ease); }
.doc-chip:hover { box-shadow: var(--lift); color: var(--ink); }
.doc-chip .ic { color: var(--ink-muted); display: grid; place-items: center; }

/* ── Огляд ────────────────────────────────────────────────────── */
.map { margin: var(--s-xl) 0 0; display: grid; gap: 6px; }
.map-split { font-size: 12px; font-weight: 600; letter-spacing: 0.125px;
  text-transform: uppercase; color: var(--ink-faint);
  margin: var(--s-lg) 0 2px; }
.map-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 3px var(--s-md);
  align-items: baseline; padding: var(--s-md) var(--s-lg) var(--s-md) var(--s-md);
  background: var(--surface); border: 1px solid var(--hairline);
  border-radius: var(--r-lg); text-decoration: none; color: var(--ink);
  transition: box-shadow 150ms var(--ease); }
.map-row:hover { box-shadow: var(--lift); }
.map-row.flat { background: var(--canvas); border-color: transparent; }
.map-row.flat:hover { box-shadow: none; }
.map-row.flat .t { color: var(--ink-muted); font-weight: 500; }
.map-row.flat .d { color: var(--ink-faint); }
.map-row .ic { grid-row: span 2; align-self: start; display: grid; place-items: center;
  width: 32px; height: 32px; border-radius: var(--r-md); color: #fff; }
.map-row.flat .ic { opacity: 0.45; }
.map-row .t { font-size: 20px; font-weight: 600; letter-spacing: -0.125px; }
.map-row .d { grid-column: 2; font-size: 15px; color: var(--ink-muted); }
.map-row .s { font-size: 12px; font-weight: 600; letter-spacing: 0.125px;
  color: var(--ink-muted); white-space: nowrap; display: inline-flex;
  align-items: center; gap: 6px; }
.map-row .s::before { content: ''; width: 6px; height: 6px;
  border-radius: var(--r-full); background: var(--green); }
.map-row .s.next { color: var(--primary); }
.map-row .s.next::before { background: var(--primary); }
.map-row .s.ahead::before { background: transparent; border: 1px solid var(--ink-faint); }
.stats { display: flex; flex-wrap: wrap; gap: var(--s-4xl); margin-top: var(--s-4xl);
  padding-top: var(--s-lg); border-top: 1px solid var(--hairline); }
.stat .n { font-size: 26px; font-weight: 700; letter-spacing: -0.625px;
  line-height: 1.23; color: var(--ink); }
.stat .l { font-size: 14px; color: var(--ink-muted); margin-top: 2px; }

/* ── Скріншоти ────────────────────────────────────────────────── */
.grp { font-size: 12px; font-weight: 600; letter-spacing: 0.125px;
  text-transform: uppercase; color: var(--ink-faint);
  margin: var(--s-4xl) 0 0; padding-bottom: var(--s-xs);
  border-bottom: 1px solid var(--hairline); }
.slug { font-size: 20px; font-weight: 600; letter-spacing: -0.125px;
  margin: var(--s-lg) 0 10px; }
.shots { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--s-md); margin-bottom: var(--s-xl); }
.shot { margin: 0; border: 1px solid var(--hairline); border-radius: var(--r-lg);
  overflow: hidden; background: var(--surface); }
.shot a { display: block; line-height: 0; }
.shot img { width: 100%; display: block; aspect-ratio: 39 / 84;
  object-fit: cover; object-position: top; background: var(--canvas); }
.shot figcaption { font-family: var(--mono); font-size: 12px; line-height: 1.4;
  color: var(--ink-muted); padding: var(--s-xs) var(--s-sm);
  border-top: 1px solid var(--hairline); word-break: break-word; }
.shot .locked { display: block; margin-top: 3px; color: var(--orange);
  font-weight: 600; }

.lu { width: 16px; height: 16px; display: block; }
.lu-big { width: 22px; height: 22px; }

/* ── Мобільний ────────────────────────────────────────────────── */
.topbar { display: none; }
@media (max-width: 62rem) {
  .shell { grid-template-columns: 1fr; }
  .topbar { display: flex; align-items: center; gap: var(--s-sm);
    padding: var(--s-xs) var(--s-md); background: var(--canvas);
    border-bottom: 1px solid var(--hairline); position: sticky; top: 0; z-index: 30; }
  .topbar .nm { font-weight: 600; font-size: 15px; }
  .topbar .where { margin-left: auto; font-size: 13px; color: var(--ink-faint);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55%; }
  .navbtn { display: grid; place-items: center; width: 30px; height: 30px; padding: 0;
    border: 1px solid var(--hairline); border-radius: var(--r-md);
    background: var(--surface); color: var(--ink); cursor: pointer; }
  .side { position: static; height: auto; display: none;
    border-bottom: 1px solid var(--hairline); }
  .side.open { display: block; }
  .side-head { display: none; }
  main { grid-column: 1; padding: 0; }
  .sheetwrap { border: 0; border-radius: 0; min-height: 0; }
  .crumbs { padding: var(--s-xs) var(--s-md); top: 46px; }
  .doc { --doc-pad: var(--s-md); padding: var(--s-lg) var(--doc-pad) 64px; }
  h1 { font-size: 30px; letter-spacing: -0.75px; }
  h2 { font-size: 22px; letter-spacing: -0.375px; }
  .lede { font-size: 17px; }
  .toc ul { columns: 1; }
  .map-row { grid-template-columns: 32px 1fr; }
  .map-row .s { grid-column: 2; margin-top: 6px; }
}
@media (min-width: 100rem) { .doc { --doc-pad: 56px; } }
@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } }
"""

JS = """
(function(){var b=document.querySelector('.navbtn'),n=document.querySelector('.side');
if(!b||!n)return;b.addEventListener('click',function(){var o=n.classList.toggle('open');
b.setAttribute('aria-expanded',o?'true':'false');});})();
"""


# ── Lucide (інлайн SVG, 24×24, stroke) ───────────────────────────────
ICONS = {
    "home": '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
            '<polyline points="9 22 9 12 15 12 15 22"/>',
    "terminal": '<polyline points="4 17 10 11 4 5"/>'
                '<line x1="12" x2="20" y1="19" y2="19"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>'
             '<circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>'
             '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "layout": '<rect width="7" height="9" x="3" y="3" rx="1"/>'
              '<rect width="7" height="5" x="14" y="3" rx="1"/>'
              '<rect width="7" height="9" x="14" y="12" rx="1"/>'
              '<rect width="7" height="5" x="3" y="16" rx="1"/>',
    "figma": '<path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>'
             '<path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/>'
             '<path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/>'
             '<path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/>'
             '<path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>',
    "sparkles": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 '
                '0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 '
                '0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 '
                '.964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1 '
                '-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>'
                '<path d="M4 17v2"/><path d="M5 18H3"/>',
    "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 '
                 '2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/>'
                 '<path d="M16 13H8"/><path d="M16 17H8"/>',
    "table": '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 '
             '0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>',
    "images": '<path d="M18 22H4a2 2 0 0 1-2-2V6"/>'
              '<path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"/>'
              '<circle cx="12" cy="8" r="2"/><rect width="16" height="16" x="6" y="2" rx="2"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 '
              '18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 '
              '0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    "grid": '<rect width="7" height="7" x="3" y="3" rx="1"/>'
            '<rect width="7" height="7" x="14" y="3" rx="1"/>'
            '<rect width="7" height="7" x="14" y="14" rx="1"/>'
            '<rect width="7" height="7" x="3" y="14" rx="1"/>',
    "lightbulb": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 '
                 '0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>'
                 '<path d="M9 18h6"/><path d="M10 22h4"/>',
    "github": '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    "menu": '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/>'
            '<line x1="4" x2="20" y1="18" y2="18"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
}


def ico(name, cls="lu"):
    """Інлайн Lucide-іконка."""
    return (
        f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        f'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" '
        f'aria-hidden="true">{ICONS.get(name, "")}</svg>'
    )


def all_pages():
    """Плоский список усіх сторінок: (файл, назва, урок, статус)."""
    pages = [("index.html", "Огляд", None, "done")]
    for ls in LESSONS:
        pages.append((ls["file"], f'{ls["no"]}. {ls["title"]}', ls, ls["status"]))
        for f, _ic, nm, _src in ls["children"]:
            pages.append((f, nm, ls, ls["status"]))
    return pages


def nav_html(current):
    out = [
        '<nav class="side" id="side" aria-label="Навігація курсу">',
        '<div class="side-head"><span class="mark">К</span><span>'
        '<span class="nm">Куток</span>'
        '<span class="sub">Design Engineering Beginners</span></span></div>',
        '<ul class="tree"><li>',
        f'<a class="item" href="index.html"'
        f'{" aria-current=\'page\'" if current == "index.html" else ""}>'
        f'<span class="ic">{ico("home")}</span>'
        '<span class="tx"><span class="nm2">Огляд</span></span></a>',
        "</li></ul>",
        '<p class="sec">Уроки курсу</p>',
        '<ul class="tree">',
    ]
    for ls in LESSONS:
        inner = (
            f'<span class="ic tile {ls["tone"]}">{ico(ls["icon"])}</span>'
            f'<span class="tx"><span class="nm2">{ls["short"]}</span></span>'
            f'<span class="pip {ls["status"]}"></span>'
        )
        if ls["status"] == "done":
            cur = ' aria-current="page"' if current == ls["file"] else ""
            out.append(f'<li><a class="item" href="{ls["file"]}"{cur}>{inner}</a>')
        else:
            out.append(f'<li><span class="item flat">{inner}</span>')
        if ls["children"]:
            out.append('<ul class="kids">')
            for f, ic, nm, _src in ls["children"]:
                c = ' aria-current="page"' if current == f else ""
                out.append(
                    f'<li><a class="item" href="{f}"{c}>'
                    f'<span class="ic">{ico(ic)}</span>'
                    f'<span class="tx"><span class="nm2">{nm}</span></span></a></li>'
                )
            out.append("</ul>")
        out.append("</li>")
    out.append("</ul>")
    out.append(
        f'<a class="side-link" href="{GITHUB_URL}" target="_blank" rel="noopener">'
        f'{ico("github")}<span>GitHub</span></a>'
        '<p class="side-foot">Наскрізний кейс курсу.<br>'
        'Дослідження: 25.07.2026. Цифри варто перевіряти перед вжитком.</p></nav>'
    )
    return "".join(out)


def crumbs_html(title, lesson, status):
    sep = f'<span class="sep">{ico("chevron-right")}</span>'
    parts = ['<div class="crumbs"><a href="index.html">Куток</a>']
    if lesson:
        parts.append(sep)
        if title.startswith(lesson["no"]):
            parts.append(f'<span class="now">{lesson["no"]}</span>')
        else:
            if lesson["status"] == "done":
                parts.append(f'<a href="{lesson["file"]}">{lesson["no"]}</a>')
            else:
                parts.append(f'<span>{lesson["no"]}</span>')
            parts.append(f'{sep}<span class="now">{title}</span>')
    else:
        parts.append(f'{sep}<span class="now">{title}</span>')
    parts.append(f'<span class="badge {status}">{STATUS_LABEL[status]}</span></div>')
    return "".join(parts)


def shell(title, body, current, lesson=None, status="done"):
    short = title if len(title) < 40 else title[:38] + "…"
    return f"""<!doctype html>
<html lang="uk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Куток</title>
<meta name="color-scheme" content="light">
<style>{CSS}</style></head>
<body>
<div class="topbar">
  <button class="navbtn" aria-expanded="false" aria-controls="side" aria-label="Навігація">{ico("menu")}</button>
  <span class="nm">Куток</span><span class="where">{short}</span>
</div>
<div class="shell">
{nav_html(current)}
<main><div class="sheetwrap">
{crumbs_html(title, lesson, status)}
<article class="doc">{body}</article>
</div></main>
</div>
<script>{JS}</script>
</body></html>"""


def slugify(text):
    s = re.sub(r"<[^>]+>", "", text).strip().lower()
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE)
    return re.sub(r"\s+", "-", s)[:60]


def render_md(path, icon="file-text", title_override=None):
    md = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists"])
    html = md.convert(path.read_text(encoding="utf-8"))

    title = title_override or ""
    m = re.match(r"\s*<h1>(.*?)</h1>", html, flags=re.S)
    if m:
        title = title_override or m.group(1)
        html = html[m.end():]

    heads = []

    def anchor(mo):
        text = mo.group(1)
        sid = slugify(text)
        heads.append((sid, re.sub(r"<[^>]+>", "", text)))
        return f'<h2 id="{sid}">{text}</h2>'

    html = re.sub(r"<h2>(.*?)</h2>", anchor, html, flags=re.S)
    html = enhance_tables(html)

    head = (f'<p class="page-icon"><span class="tile tile-lg doc-tile">'
            f'{ico(icon, "lu-big")}</span></p><h1>{title}</h1>') if title else ""
    if len(heads) > 2:
        links = "".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in heads)
        head += f'<nav class="toc"><p class="toc-label">Розділи</p><ul>{links}</ul></nav>'
    return head + html


def lesson_page(ls):
    topics = "".join(f"<li>{t}</li>" for t in ls["topics"])
    docs = ""
    if ls["children"]:
        chips = "".join(
            f'<a class="doc-chip" href="{f}"><span class="ic">{ico(ic)}</span>{nm}</a>'
            for f, ic, nm, _s in ls["children"]
        )
        docs = f'<h2>Матеріали уроку</h2><div class="docs-row">{chips}</div>'
    tone = "" if ls["status"] == "done" else " ahead"
    mark = ico("check") if ls["status"] == "done" else ico("arrow-right")
    return f"""<p class="page-icon"><span class="tile tile-lg {ls["tone"]}">{ico(ls["icon"], "lu-big")}</span></p>
<h1>{ls["no"]}. {ls["title"]}</h1>
<p class="lede">{ls["goal"]}</p>
<div class="callout{tone}"><span class="ci">{mark}</span><p>{ls["state"]}</p></div>
<div class="cols">
  <section><h3>Що розбираємо</h3><ul>{topics}</ul></section>
  <section><h3>Домашнє завдання</h3><p>{ls["homework"]}</p></section>
</div>
{docs}"""


GROUP_ORDER = ["Хард", "Софт", "Аспіраційні"]
GROUP_NOTE = {
    "Хард": "той самий продукт, та сама аудиторія, Київ",
    "Софт": "інший продукт, та сама задача «з ким і де жити»",
    "Аспіраційні": "міжнародні еталони пошуку співмешканців",
}


def comparison_view(heads, rows):
    """Порівняння в двох режимах: по конкурентах і по осях."""
    gi = next(i for i, h in enumerate(heads) if strip_tags(h).lower().startswith("груп"))
    axes = [i for i in range(len(heads)) if i not in (0, gi)]

    buckets = {g: [] for g in GROUP_ORDER}
    for r in rows:
        g = strip_tags(r[gi])
        buckets.setdefault(g, []).append(r)

    # режим 1 — три таблиці по групах
    by_comp = []
    for g in GROUP_ORDER:
        if not buckets.get(g):
            continue
        tone = TAG_TONE.get(g.lower(), "hard")
        th = "".join(f"<th>{heads[i]}</th>" for i in axes)
        body = ""
        for r in buckets[g]:
            tds = "".join(f"<td>{r[i]}</td>" for i in axes)
            body += f"<tr><th scope='row'>{r[0]}</th>{tds}</tr>"
        cols = f'<col class="c-name">' + "".join(
            f'<col style="width:{100 / len(axes):.1f}%">' for _ in axes)
        by_comp.append(
            f'<div class="cmp-group"><p class="cmp-cap"><span class="tag {tone}">{g}</span>'
            f'<span class="cmp-note">{GROUP_NOTE.get(g, "")}</span></p>'
            f'<div class="tablescroll"><table class="cmp">{cols}'
            f"<thead><tr><th>Конкурент</th>{th}</tr></thead><tbody>{body}</tbody>"
            "</table></div></div>"
        )

    # режим 2 — блок на кожну вісь
    by_axis = []
    for i in axes:
        body = ""
        for g in GROUP_ORDER:
            for r in buckets.get(g, []):
                tone = TAG_TONE.get(g.lower(), "hard")
                body += (f"<tr><th scope='row'>{r[0]}"
                         f'<span class="tag {tone} mini">{g}</span></th>'
                         f"<td>{r[i]}</td></tr>")
        by_axis.append(
            f'<div class="cmp-group"><p class="cmp-cap">{heads[i]}</p>'
            f'<div class="tablescroll"><table class="cmp axis">'
            f'<col class="c-name"><col>'
            f"<tbody>{body}</tbody></table></div></div>"
        )

    return (
        '<div class="cmp-wrap">'
        '<div class="cmp-switch" role="group" aria-label="Режим перегляду">'
        '<input type="radio" name="cmpv" id="cmpv-a" checked>'
        '<label for="cmpv-a">За конкурентами</label>'
        '<input type="radio" name="cmpv" id="cmpv-b">'
        '<label for="cmpv-b">За осями</label></div>'
        f'<div class="cmp-view view-a">{"".join(by_comp)}</div>'
        f'<div class="cmp-view view-b">{"".join(by_axis)}</div>'
        "</div>"
    )


def strip_tags(t):
    return re.sub(r"<[^>]+>", "", t).strip()


TAG_TONE = {"хард": "hard", "софт": "soft", "аспіраційні": "asp"}


def enhance_tables(html):
    """Пропорційні ширини колонок, теги категорій, повноширинні таблиці."""

    strip = strip_tags

    def one(m):
        tbl = m.group(0)
        heads = re.findall(r"<th[^>]*>(.*?)</th>", tbl, flags=re.S)
        if not heads:
            return f'<div class="tablewrap"><div class="tablescroll">{tbl}</div></div>'
        ncol = len(heads)
        rows = re.findall(r"<tr>(.*?)</tr>", tbl, flags=re.S)

        # велика матриця порівняння — окремий компонент
        has_group = any(strip(h).lower().startswith("груп") for h in heads)
        if has_group and ncol >= 6:
            data = []
            for r in rows:
                cells = re.findall(r"<td[^>]*>(.*?)</td>", r, flags=re.S)
                if len(cells) == ncol:
                    data.append(cells)
            if data:
                return comparison_view(heads, data)

        # середня довжина тексту в кожній колонці
        lens = [len(strip(h)) for h in heads]
        counts = [1] * ncol
        for r in rows:
            cells = re.findall(r"<td[^>]*>(.*?)</td>", r, flags=re.S)
            for i, c in enumerate(cells[:ncol]):
                lens[i] += len(strip(c))
                counts[i] += 1
        avg = [lens[i] / counts[i] for i in range(ncol)]

        # ширина ∝ √довжини — приглушує розрив між короткими й довгими
        raw = [max(1.0, a) ** 0.5 for a in avg]
        total = sum(raw)
        pct = [100 * r / total for r in raw]
        # межі: жодна колонка не вужча за 7% і не ширша за 24%
        pct = [min(24.0, max(7.0, w)) for w in pct]
        k = 100 / sum(pct)
        pct = [w * k for w in pct]
        cols = "".join(f'<col style="width:{w:.1f}%">' for w in pct)

        # категорії — компактними тегами
        gi = next((i for i, h in enumerate(heads)
                   if strip(h).lower().startswith("груп")), None)
        if gi is not None:
            def tagrow(mr):
                inner = mr.group(1)
                cells = list(re.finditer(r"<td[^>]*>(.*?)</td>", inner, flags=re.S))
                if gi < len(cells):
                    c = cells[gi]
                    val = strip(c.group(1))
                    tone = TAG_TONE.get(val.lower(), "hard")
                    inner = (inner[:c.start()]
                             + f'<td><span class="tag {tone}">{val}</span></td>'
                             + inner[c.end():])
                return f"<tr>{inner}</tr>"
            tbl = re.sub(r"<tr>(.*?)</tr>", tagrow, tbl, flags=re.S)

        tbl = tbl.replace("<table>", f"<table>{cols}", 1)
        wide = " wide" if ncol >= 5 else ""
        return (f'<div class="tablewrap{wide}"><div class="tablescroll">'
                f"{tbl}</div></div>")

    return re.sub(r"<table>.*?</table>", one, html, flags=re.S)


def build_screens():
    groups = [
        ("Хард — Київ, той самий продукт",
         ["olx", "dimria", "inhata", "tg-arenda", "fb-groups"]),
        ("Софт — та сама задача «з ким і де жити»",
         ["coliving-one", "kvartyrant-bot", "airbnb", "pryhystok", "corporate-chats"]),
        ("Аспіраційні — міжнародні еталони",
         ["spareroom", "badi", "roomster", "diggz", "cohabby"]),
    ]
    out = [
        f'<p class="page-icon"><span class="tile tile-lg doc-tile">'
        f'{ico("images", "lu-big")}</span></p><h1>Скріншоти конкурентів</h1>',
        '<p class="lede">Знімки зроблені через Playwright у мобільному viewport '
        "390×844, 25.07.2026. Екрани, недоступні без входу, підписані "
        "«доступ обмежений» — вміст за ними не реконструювався.</p>",
    ]
    for group, slugs in groups:
        out.append(f'<p class="grp">{group}</p>')
        for slug in slugs:
            d = SCREENS / slug
            if not d.is_dir():
                continue
            files = sorted(p.name for p in d.iterdir() if p.suffix == ".png")
            out.append(f'<p class="slug">{slug}</p><div class="shots">')
            for f in files:
                cap = f
                if "dostup-obmezhenyi" in f:
                    cap += '<span class="locked">доступ обмежений</span>'
                src = f"screens/{slug}/{f}"
                out.append(
                    f'<figure class="shot"><a href="{src}" target="_blank" rel="noopener">'
                    f'<img src="{src}" alt="{slug}: {f}" loading="lazy"></a>'
                    f"<figcaption>{cap}</figcaption></figure>"
                )
            out.append("</div>")
    return "\n".join(out)


def build_index(n_shots):
    rows = []
    prev = None
    for ls in LESSONS:
        if prev and prev != ls["status"] and ls["status"] != "next":
            rows.append('<p class="map-split">Далі за програмою</p>')
        prev = ls["status"]
        kids = ""
        if ls["children"]:
            kids = " · " + ", ".join(nm for _f, _i, nm, _s in ls["children"])
        inner = (
            f'<span class="ic tile {ls["tone"]}">{ico(ls["icon"])}</span>'
            f'<span class="t">{ls["no"]}. {ls["title"]}</span>'
            f'<span class="s {ls["status"]}">{STATUS_LABEL[ls["status"]]}</span>'
            f'<span class="d">{ls["goal"]}{kids}</span>'
        )
        if ls["status"] == "done":
            rows.append(f'<a class="map-row" href="{ls["file"]}">{inner}</a>')
        else:
            rows.append(f'<div class="map-row flat">{inner}</div>')
    return f"""<p class="page-icon">{ico("home", "lu-big")}</p>
<h1>Куток</h1>
<p class="lede">Пошук співмешканців і вільних кімнат у Києві. Mobile-first,
аудиторія 22–30 років, головна цінність — довіра. Наскрізний кейс курсу
«Design Engineering Beginners»: тут лежить усе, що напрацьовано по уроках.</p>
<div class="map">{"".join(rows)}</div>
<div class="stats">
  <div class="stat"><p class="n">15</p><p class="l">конкурентів</p></div>
  <div class="stat"><p class="n">{n_shots}</p><p class="l">скріншотів</p></div>
  <div class="stat"><p class="n">5</p><p class="l">гіпотез</p></div>
  <div class="stat"><p class="n">3</p><p class="l">сценарії матчингу</p></div>
  <div class="stat"><p class="n">4</p><p class="l">пріоритетні екрани</p></div>
</div>"""


def main():
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir()
    n_shots = sum(1 for _ in SCREENS.rglob("*.png")) if SCREENS.exists() else 0
    built = 0

    (SITE / "index.html").write_text(
        shell("Огляд", build_index(n_shots), "index.html"), encoding="utf-8"
    )
    built += 1

    for ls in LESSONS:
        if ls["status"] != "done":
            continue
        title = f'{ls["no"]}. {ls["title"]}'
        (SITE / ls["file"]).write_text(
            shell(title, lesson_page(ls), ls["file"], ls, ls["status"]), encoding="utf-8"
        )
        built += 1
        for f, ic, nm, src in ls["children"]:
            if f == "screens.html":
                body = build_screens()
            elif src and src.exists():
                body = render_md(src, ic, nm)
            else:
                print(f"  пропущено: {f}")
                continue
            (SITE / f).write_text(
                shell(nm, body, f, ls, ls["status"]), encoding="utf-8"
            )
            built += 1

    concept_src = ROOT / "concept.md"
    if concept_src.exists():
        concept_lesson = LESSONS[2]
        concept_body = render_md(concept_src, "palette", "Візуальна концепція")
        references_src = ROOT / "concept" / "references.md"
        if references_src.exists():
            references_body = render_md(
                references_src, title_override="Уся інформація, яку Claude Code отримав з Refero"
            )
            references_body = references_body.replace('id="', 'id="claude-refero-')
            references_body = references_body.replace('href="#', 'href="#claude-refero-')
            concept_body += (
                '<section class="claude-refero-block" aria-labelledby="claude-refero-title">'
                '<p class="source-label">Claude Code × Refero MCP</p>'
                '<h2 id="claude-refero-title">Окремий блок даних від Claude</h2>'
                '<p>Нижче — повний зафіксований результат роботи Claude Code з Refero, '
                'без змішування з основною концепцією.</p>'
                f'{references_body}</section>'
            )
        (SITE / "concept.html").write_text(
            shell(
                "Візуальна концепція «Кутка»",
                concept_body,
                "concept.html",
                concept_lesson,
                concept_lesson["status"],
            ),
            encoding="utf-8",
        )
        built += 1

    # скріншоти: копія поруч зі збіркою (symlink не переживає деплой)
    dest = SITE / "screens"
    if SCREENS.exists() and not dest.exists():
        shutil.copytree(SCREENS, dest)
    print(f"зібрано {SITE}: {built} сторінок, {n_shots} скріншотів")


if __name__ == "__main__":
    main()
