# Implementation plan

| Вимога | Status | Owner | Evidence |
|---|---|---|---|
| Зелений канон «Зелений двір»: `#365c4f`, `#4f7969`, Golos Text + Onest, без фіолетових ознак | done | `/root/green_mobile_lesson6` | `beginners/source/concept.html`, `concept.md`, `prototype/_base.css`; scan фіолетових lesson HTML/CSS tokens: 0 |
| Mobile-first композиція для 390 px; desktop як акуратне розширення/службова оболонка | done | `/root/green_mobile_lesson6` | `.impeccable/review/qa-mobile-*.png`, `qa-desktop-listings-empty.png` |
| Єдина дизайн-система на всіх 13 сторінках станів уроку 6 | done | `/root/green_mobile_lesson6` | `beginners/source/prototype/*.html` (13/13), спільний `_base.css` |
| Продуктова навігація «Пошук / Чати / Оголошення / Профіль / Додати» на всіх 13 сторінках | done | `/root/green_mobile_lesson6` | 13/13 navigation blocks; 5 links, 1 active; mobile target 72.8×70 px; Solar assets |
| Спільне навчальне дерево 01–06 на root, research і lesson 6; mobile drawer + desktop sidebar | done | `/root/green_mobile_lesson6` | `course-nav.css/js`; 19 HTML includes; `qa-mobile-course-open.png`, `qa-desktop-course-research.png` |
| Усі файлові правки виконують агенти; root лише координує і перевіряє | done | `/root/green_mobile_lesson6` | `AGENTS.md` |
| URL, screenshots, responsive та a11y перевірки | done | `/root/green_mobile_lesson6` | 13/13 lesson URLs і representative root/research/concept = HTTP 200; 0 horizontal overflow at 390; theme/focus/reduced-motion; Impeccable detector виконано (degraded parser; findings лише в incumbent root/research styles/copy) |

План є живим: кожна наступна користувацька правка спочатку фіксується тут, після чого root делегує її агенту й очікує статус.

## Known limitations

- Impeccable detector працював у degraded regex mode через відсутні HTML/CSS parser modules; його incumbent findings у root/research зафіксовані як undercount, не як clean bill of health.
- Незалежний finish reviewer не завершився у відведене вікно передачі й був зупинений за вказівкою root; повторний reviewer не запускався. Візуальні докази перевірено агентом вручну по одному файлу.
- Фінальний Impeccable detector для web-app rebuild також працював у degraded regex mode: 16 warning-level findings, переважно incumbent root/research styles; 2 стосуються навмисної width/margin анімації desktop sidebar. CDP layout, contrast та keyboard checks виконані окремо й пройшли без помилок.

## Web-app shell rebuild

| Вимога | Status | Owner | Evidence |
|---|---|---|---|
| Read-only crawl root, research і lesson-6: локальні `href`, `src`, `action`, CSS `url()`, 404, хибні relative paths і redirect loops у двох URL-контекстах | done | `/root/green_mobile_lesson6` | `scripts/audit-local-links.mjs`: 81 HTML, 99 route contexts, 6,229 checks на кожному з `127.0.0.1` і `192.168.31.21`; 0 broken, 0 redirects; виправлено research alias paths і `_template.html` target |
| Lesson 6 product canvas канонічно 390 px: на viewport ≤390 `width:100%`, `max-width:390px`, `min-height:100dvh`, без рамки/обрізання/overflow; на 430 px і desktop не розтягується, а центрується у web-app shell поруч із course tree; 390×844 — головний acceptance, 320×568 — graceful shrink | done | `/root/green_mobile_lesson6` | `scripts/qa-web-app.mjs`: 13/13 states — canvas 320/390/390/390 px на viewport 320/390/430/1440; max overflow 0; acceptance body/main 390 px та min-height 844 px |
| Спільний collapsible desktop sidebar та accessible mobile drawer/overlay з Escape, focus management, `aria-expanded`, state memory | done | `/root/green_mobile_lesson6` | `course-nav.css/js`; keyboard smoke підтвердив open/close ARIA, focus на close, Escape + focus restore, desktop collapse persistence після reload |
| Дерево 01–06 + 13 state pages, active route і collapsible groups; старі sidebar не дублюються | done | `/root/green_mobile_lesson6` | 64 DOM checks: рівно 1 shell, 1 active route, 0 legacy sidebars; 2 native collapsible groups |
| Окрема продуктова navigation всередині lesson-6 content | done | `/root/green_mobile_lesson6` | 13/13 state pages мають 5 product links; CDP acceptance: fixed nav 390×76 px |
| Route paths працюють під `/kootok/` та canonical directories без filesystem hardcode | done | `/root/green_mobile_lesson6` | Friendly + canonical contexts у crawler; 0/6,229 broken на local і LAN origins |
| Green «Зелений двір» лишається mobile-first visual canon | done | `/root/green_mobile_lesson6` | `site-theme.css`, `_base.css`, 12 screenshots root/research/4 lesson families × tree closed/open; representative images visually reviewed |
| Єдині shared color tokens для app shell/root/research/lesson6: green primary, green surfaces, neutral text/borders, role-bound cream accent, semantic success/error/info; без видимих purple/Notion-like shared surfaces | done | `/root/green_mobile_lesson6` | Shared tokens in `site-theme.css`; research hero purple glow/text overridden; tested contrast ratios 5.21:1–11.62:1 across text, muted, primary, accent and semantic roles |
| Фінальний crawl, 0 broken targets, 0 overflow, screenshots 6 surfaces open/closed, keyboard/ARIA smoke | done | `/root/green_mobile_lesson6` | `scripts/audit-local-links.mjs` + `scripts/qa-web-app.mjs`: 12 screenshots, 64 layout checks, 0 failures; keyboard/ARIA clean |
| Окремий commit без `figmosha2` та `.impeccable` | done | `/root/green_mobile_lesson6` | Production/docs/scripts staged explicitly; `.impeccable` screenshots and `figmosha2` excluded from commit |
