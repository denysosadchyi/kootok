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

## Lesson 6 desktop device shell

| Вимога | Status | Owner | Evidence |
|---|---|---|---|
| Спільний стриманий device mockup навколо незмінного канонічного lesson-6 canvas 390 px на wider screens: корпус, bezel, speaker/dynamic-island detail, home indicator і м’яка тінь без дублювання у 13 HTML | done | `/root/green_mobile_lesson6` | Один runtime wrapper у `course-nav.js`, shared presentation у `prototype/_base.css`; 13 HTML не дублюють markup |
| На viewport ≤430 shell повністю відсутній: edge-to-edge 320/390 mobile, без рамки й horizontal overflow | done | `/root/green_mobile_lesson6` | 13/13 CDP: screen 320/390/390 px на 320/390/430; computed border/padding/radius = 0; max overflow 0 |
| На desktop device shell співіснує з course tree, не перекриває його; inner product canvas лишається 390 px | done | `/root/green_mobile_lesson6` | 13/13 CDP at 1440×900: shell 416 px, inner screen/main/nav 390 px; device left ≥ course tree right; 0 overlap/overflow |
| QA 13/13: inner canvas 320/390/390/390 на viewport 320/390/430/1440, 0 overflow; screenshots 390×844 і 1440×900 з tree open/closed; crawler 0 broken | done | `/root/green_mobile_lesson6` | `scripts/qa-web-app.mjs`: 64 layout checks, 14 screenshots, 0 failures; mobile and desktop tree open/closed visually reviewed; crawler 81 HTML/99 contexts/6,229 checks, 0 broken/redirects; detector 0 findings |
| Окремий commit без `figmosha2` та `.impeccable` | done | `/root/green_mobile_lesson6` | Production/docs/scripts staged explicitly; screenshots and `figmosha2` excluded |

## Lesson 6 vertical listing cards

| Вимога | Status | Owner | Evidence |
|---|---|---|---|
| У всіх відповідних lesson-6 states фото картки зверху на всю ширину; explicit horizontal `aspect-ratio: 3 / 2`, `object-fit: cover`, intrinsic dimensions/CLS; loading placeholder має ті самі computed width/height; контент вертикально нижче | done | `/root/fable` | `_base.css` + 5 semantic local images з intrinsic dimensions; CDP 390: success і loading media `358 × 238.66`, ratio `1.5`, media width = card width, body одразу нижче |
| Ієрархія без зміни copy/product truth: фото → тип/бейдж → назва → ціна → короткі факти → trust proof/актуальність; виразний, але стриманий green card, стабільні radius/shadow/spacing, stretched link/focus | done | `/root/fable` | 5/5 success cards: 16 px radius, один `--shadow-soft`, 18 px title, 20 px price, facts grid, green/error trust footer; stretched `listing.html` link і card-level focus ring |
| Loading skeleton повторює вертикальну геометрію та не показує фото; success має 5 cards, перевірені trust-off і довгі українські назви | done | `/root/fable` | `scripts/qa-listing-cards.mjs`: success 5 cards/5 images/trust-off; loading 4 cards/0 images/4 placeholders/`background-image:none`; heading overflow `false` на 320/390/430/1440 |
| Responsive QA 320/390/430/1440, device shell збережено, 0 overflow; card screenshots success+loading у 390 і desktop device | done | `/root/fable` | Card matrix 8/8, `failures:[]`; canvas 320/390/390/390, overflow 0, desktop device `416` + inner `390`; 4 screenshots visually reviewed in one pass, one bounded fix, one confirmation |
| Crawler/diff-check clean та окремий commit без `figmosha2`/`.impeccable` | done | `/root/fable` | Local + LAN crawler: 81 HTML, 99 contexts, 6,229 checks each, 0 broken/redirects; full QA 64/64 + 14 screenshots, 0 failures; detector degraded regex, 0 findings; explicit staging, hash in handoff |

## Lesson 6 prototype label cleanup

| Вимога | Status | Owner | Evidence |
|---|---|---|---|
| Прибрати видимий `Навчальний прототип · дані демонстраційні` з усіх 13 lesson-6 states, видалити dead `.demo-label` CSS без порожнього gap; зберегти green canon, navigation, course tree, 390 canvas, device shell і cards | done | `/root/fable` | Source scan: 13/13 markup removed, label/CSS matches 0; LAN URLs 13/13 HTTP 200; `qa-web-app`: canvas 320/390/390/390, max overflow 0, 64 checks + 14 screenshots, `failures:[]`; focused diff: тільки 13 labels, 1 dead CSS rule і цей plan row |
