# Steep → Figma: список токенів і стилів

> **Історичний документ (Beginners / урок 6 до перебудови 2026-09-17).** Не є чинним: канон — `/CLAUDE.md`, `/DESIGN.md`, `/design-system/`, `/concept.md`. Збережено як історію.

**Залито у Figma — робочий файл `kootok`:**
https://www.figma.com/design/WlotY7SHAGBPsQdOnkQBjb/kootok (через figmosha-бридж).
Дубль у чернетці: https://www.figma.com/design/mY2eKpqlPW6SvXt1dqOStg
Створено: 2 колекції Variables (58 Color + 28 Number),
13 text styles, 3 effect styles, 2 grid styles.
Акцент і стани (розділ 8) додані лише у `kootok` — чернетка на них відстає.
Шрифти-підміни у файлі: **Source Serif 4** замість Signifier, **Inter** замість
Söhne (оригінальних ліцензій у Figma немає); ваги Söhne 400/430 → Inter Regular,
450/480/500 → Inter Medium.

Джерело: style reference «Steep — serif analytics on warm paper».
Нижче — точний реєстр того, що створюється у Figma-файлі: **Variables**
(колекції Color / Number), **Text styles**, **Effect styles**, **Grid style**.
Назви подані у фінальному вигляді (`/` = група у панелі Figma).

> Не плутати з `SITE-DESIGN.md` — той описує оформлення сайту-артефакту
> проєкту («мова креслення»), а не дизайн самого продукту. Продуктова
> система — ця.

---

## 1. Variables → колекція `Color` (mode: Light)

Тип: `COLOR`. Одна мода — `Light` (система свідомо тільки світла).

### 1.1 Primitives (група `color/`)

| Variable | HEX | Роль |
|---|---|---|
| `color/ink-black` | `#17191C` | основний текст, фон filled-кнопки, логотип |
| `color/paper-white` | `#FFFFFF` | полотно сторінки, текст на кнопці |
| `color/mist-gray` | `#F2F2F3` | поверхня карток, інпутів |
| `color/fog-white` | `#FAFAFB` | фон секцій, що чергуються |
| `color/slate-gray` | `#777B86` | посилання, muted-текст, футер |
| `color/ash-gray` | `#979799` | третинні лейбли, категорії-теги |
| `color/smoke-gray` | `#A3A6AF` | placeholder, disabled |
| `color/blush-peach` | `#FBE1D1` | єдина хроматична поверхня, акцентна картка |
| `color/sienna-brown` | `#5D2A1A` | текст і штрихи на peach, лінії графіків |
| `color/hairline` | `#ECECEC` | бордер інпутів (у reference без імені — додаю явно) |

### 1.2 Semantic aliases (група `semantic/`, значення = alias на primitives)

| Variable | → alias | Призначення |
|---|---|---|
| `semantic/text/primary` | `color/ink-black` | body, headings |
| `semantic/text/muted` | `color/slate-gray` | helper, футер |
| `semantic/text/tertiary` | `color/ash-gray` | теги, категорії |
| `semantic/text/placeholder` | `color/smoke-gray` | інпут |
| `semantic/text/on-dark` | `color/paper-white` | текст на filled-кнопці |
| `semantic/text/on-accent` | `color/sienna-brown` | текст на peach |
| `semantic/surface/canvas` | `color/paper-white` | level 0 |
| `semantic/surface/card` | `color/mist-gray` | level 1 |
| `semantic/surface/section` | `color/fog-white` | level 2 |
| `semantic/surface/accent` | `color/blush-peach` | level 3 |
| `semantic/surface/elevated` | `color/paper-white` | level 4, floating artifact |
| `semantic/border/hairline` | `color/hairline` | інпути, тонкі межі |
| `semantic/border/strong` | `color/ink-black` | ghost-кнопка |
| `semantic/action/primary-bg` | `color/ink-black` | filled pill |
| `semantic/action/primary-fg` | `color/paper-white` | текст filled pill |
| `semantic/chart/stroke` | `color/sienna-brown` | лінії/радіальні графіки |

Правило, яке треба тримати у файлі: **жодного хроматичного кольору поза парою
peach/brown**. Система на ~97% ахроматична.

---

## 2. Variables → колекція `Number`

Тип: `FLOAT`. База — 4px.

### 2.1 Spacing (`spacing/`)

`spacing/4` = 4 · `spacing/8` = 8 · `spacing/12` = 12 · `spacing/16` = 16 ·
`spacing/20` = 20 · `spacing/24` = 24 · `spacing/28` = 28 · `spacing/32` = 32 ·
`spacing/40` = 40 · `spacing/64` = 64 · `spacing/80` = 80 · `spacing/96` = 96 ·
`spacing/124` = 124 · `spacing/128` = 128 · `spacing/160` = 160

### 2.2 Radius (`radius/`)

| Variable | Значення | Де застосовується |
|---|---|---|
| `radius/images` | 12 | зображення |
| `radius/inputs` | 16 | інпути, small cards |
| `radius/small-cards` | 16 | дрібні картки |
| `radius/elevated-cards` | 20 | floating product artifacts |
| `radius/cards` | 24 | контентні картки (neutral, accent) |
| `radius/pill` | 9999 | усі кнопки, аватари |

### 2.3 Layout (`layout/`)

| Variable | Значення |
|---|---|
| `layout/page-max-width` | 1200 |
| `layout/section-gap` | 80 |
| `layout/card-padding` | 20 |
| `layout/element-gap` | 8 |

---

## 3. Text styles

Шрифти для завантаження у файл (з фолбеками, якщо ліцензій немає):
- **Signifier** → фолбек: GT Sectra / Tiempos Headline / Source Serif 4
- **Söhne** → фолбек: Inter

Signifier завжди Regular 400 — це підпис системи, жодного bold.
Söhne має пів-кроки ваги 430/450/480; якщо у Figma доступний тільки
статичний Inter — мапити 430→Regular, 450/480→Medium, 500→Medium.

| Text style | Font | Size | Line height | Letter spacing | Weight |
|---|---|---|---|---|---|
| `Display/90` | Signifier | 90 | 1.3 (117) | −2.25 (−2.5%) | 400 |
| `Heading/64` | Signifier | 64 | 1.3 (83) | −0.96 (−1.5%) | 400 |
| `Heading/44` | Signifier | 44 | 1.3 (57) | −0.66 (−1.5%) | 400 |
| `Subhead/26` | Söhne | 26 | 1.18 (31) | −0.234 (−0.9%) | 450 |
| `Subhead/22` | Söhne | 22 | 1.5 (33) | 0 | 430 |
| `Body/20 Medium` | Söhne | 20 | 1.35 (27) | 0 | 500 |
| `Body/20` | Söhne | 20 | 1.35 (27) | 0 | 400 |
| `Body/18` | Söhne | 18 | 1.5 (27) | −0.162 (−0.9%) | 430 |
| `Body/17` | Söhne | 17 | 1.35 (23) | 0 | 400 |
| `UI/16` | Söhne | 16 | 1.0 (16) | 0 | 400 |
| `Caption/15` | Söhne | 15 | 1.5 (22.5) | 0 | 400 |
| `Meta/14` | Söhne | 14 | 1.35 (19) | 0 | 400 |

`Display/90` передбачає курсивну вставку в середині фрази — окремий стиль
`Display/90 Italic` (Signifier Italic 400), той самий розмір і трекінг.

---

## 4. Effect styles

| Effect style | Значення |
|---|---|
| `Elevation/Artifact` | `0 0 0 1px rgba(4,23,43,0.05)`, `0 20px 25px -5px rgba(0,0,0,0.1)`, `0 8px 10px -6px rgba(0,0,0,0.1)` |
| `Elevation/Modal` | `0 0 0 1px rgba(0,0,0,0.05)`, `0 8px 40px 0 rgba(0,0,0,0.1)` |
| `Elevation/Popover` | `0 0 0 1px rgba(0,0,0,0.05)`, `0 4px 24px 0 rgba(0,0,0,0.08)` |

У Figma перший шар кожного стилю — це не blur, а «spread-ring»: Drop shadow
з `blur 0`, `spread 1`, offset 0. Тінь має **лише** floating product artifact;
Neutral і Accent картки — без тіні взагалі.

---

## 5. Grid style

| Grid style | Параметри |
|---|---|
| `Page/1200` | Columns: 12, type Stretch, margin 40, gutter 24, max-width контейнера 1200 |
| `Baseline/4` | Rows/Grid 4px — для перевірки відступів |

---

## 6. Компоненти, які збираються з цих токенів (наступний крок після токенів)

Порядок складання у Figma: спочатку Variables → Text/Effect/Grid styles →
далі компоненти нижче, кожен уже тільки на токенах.

1. `Button/Pill Filled` — bg `semantic/action/primary-bg`, text `on-dark`,
   radius `pill`, padding 0/20, `UI/16`, без тіні.
2. `Button/Pill Ghost` — fill transparent, border 1px `border/strong`,
   text `text/primary`, та сама геометрія (пара до filled).
3. `Link/Text with Arrow` — `UI/16`, `text/primary`, стрілка `→` у самому
   лейблі, padding 20/0, underline тільки в hover-варіанті.
4. `Nav/Link` — `UI/16`, `text/primary`, padding 2/0, прозорий бар.
5. `Card/Neutral` — bg `surface/card`, radius `cards`, без тіні й бордера.
6. `Card/Accent Peach` — bg `surface/accent`, текст `text/on-accent`,
   radius `cards`, без тіні. Максимум одна на сторінку.
7. `Card/Floating Artifact` — bg `surface/elevated`, radius `elevated-cards`,
   effect `Elevation/Artifact`, padding 16/20/12/12.
8. `Input/Composer` — bg white, border 1px `border/hairline`, radius `inputs`,
   padding 16, placeholder `text/placeholder`, справа кругла кнопка 40px
   `action/primary-bg`.
9. `Card/Stat with Chart` — метрика `Body/20 Medium`, дельта `Meta/14`
   `text/muted`, лінія графіка `chart/stroke`, без осей і сітки.
10. `Avatar/Bubble` — 40px, radius `pill`, монограма Söhne 500, курсор-стрілка
    від краю.
11. `Tag/Category` — `Meta/14`, `text/tertiary`, без фону й бордера
    (типографічний тег, не бейдж).

---

## 7. Чек-лист правил, які треба зафіксувати описами у Figma

- Signifier — тільки 400, на всіх розмірах.
- Peach-картка — не більше однієї на сторінку і тільки на білому/mist фоні.
- Тінь — лише у floating artifact; контентні картки плоскі.
- Radius: кнопки 9999, картки 24; нічого нижче 16 на картках.
- Filled pill завжди йде в парі з ghost pill в одному рядку.
- Sienna Brown — тільки на peach-поверхнях і як штрих графіка, ніколи як
  body-текст на білому.
- Söhne: підніматися по вагах 430 → 450 → 480 перед тим, як брати 500.

---

## 8. Акцент і стани взаємодії (додано пізніше, є у `kootok`)

### 8.1 Вибір акценту

**Terracotta `#B23F22`** — `color/terracotta-500`. Чому саме він:

- Лежить у тій самій теплій родині, що `blush-peach` і `sienna-brown`, тож не
  ламає правило «нічого хроматичного поза peach/brown» — це його продовження,
  а не третій колір.
- Контраст на білому **5.8:1** — проходить WCAG AA для тексту будь-якого
  розміру, тобто ним можна фарбувати не лише плашки, а й посилання.
- Не конкурує з `ink-black`: чорна pill лишається головною дією, теракота
  бере на себе стан («вибрано», «активно», «перевірено»), а не силу.
- Прочитується як редлайн/анотація на кресленні — рима з `SITE-DESIGN.md`.

Ramp: `terracotta-100 #F9E9E2` (wash) · `200 #F0CFC2` (wash pressed) ·
`500 #B23F22` (base) · `600 #96331A` (hover) · `700 #7A2814` (pressed).

### 8.2 Нові primitives

| Variable | HEX | Роль |
|---|---|---|
| `color/terracotta-100` | `#F9E9E2` | підкладка вибраного |
| `color/terracotta-200` | `#F0CFC2` | підкладка вибраного, pressed |
| `color/terracotta-500` | `#B23F22` | базовий акцент |
| `color/terracotta-600` | `#96331A` | акцент, hover |
| `color/terracotta-700` | `#7A2814` | акцент, pressed |
| `color/ink-hover` | `#2E3138` | ink-black у hover |
| `color/ink-pressed` | `#0B0C0E` | ink-black у pressed |
| `color/mist-pressed` | `#E6E6E8` | нейтральна поверхня, pressed |
| `color/disabled-surface` | `#EDEDEF` | фон disabled |
| `color/disabled-ink` | `#B4B6BC` | текст/іконка disabled |
| `color/disabled-border` | `#E2E2E4` | межа disabled |

### 8.3 Semantic-токени станів

| Variable | → alias | Де застосовується |
|---|---|---|
| `semantic/accent/bg` | `terracotta-500` | акцентна кнопка/маркер, rest |
| `semantic/accent/bg-hover` | `terracotta-600` | те саме, hover |
| `semantic/accent/bg-pressed` | `terracotta-700` | те саме, pressed |
| `semantic/accent/fg` | `paper-white` | текст на акцентній заливці |
| `semantic/accent/text` | `terracotta-500` | акцентний текст, активне посилання |
| `semantic/accent/text-hover` | `terracotta-600` | акцентний текст, hover |
| `semantic/accent/wash` | `terracotta-100` | підкладка вибраного чипа/рядка |
| `semantic/accent/wash-pressed` | `terracotta-200` | те саме, pressed |
| `semantic/accent/border` | `terracotta-500` | межа вибраного елемента |
| `semantic/focus/ring` | `terracotta-500` | фокус-обведення |
| `semantic/action/primary-bg-hover` | `ink-hover` | filled pill, hover |
| `semantic/action/primary-bg-pressed` | `ink-pressed` | filled pill, pressed |
| `semantic/action/secondary-bg-hover` | `mist-gray` | ghost pill, hover (заливка з'являється) |
| `semantic/action/secondary-bg-pressed` | `mist-pressed` | ghost pill, pressed |
| `semantic/action/secondary-border-hover` | `ink-hover` | ghost pill, межа в hover |
| `semantic/surface/hover` | `mist-gray` | картка/рядок, hover |
| `semantic/surface/pressed` | `mist-pressed` | картка/рядок, pressed |
| `semantic/surface/selected` | `terracotta-100` | вибраний чип/таб/рядок |
| `semantic/state/disabled-bg` | `disabled-surface` | disabled, заливка |
| `semantic/state/disabled-fg` | `disabled-ink` | disabled, текст/іконка |
| `semantic/state/disabled-border` | `disabled-border` | disabled, межа |

### 8.4 Нові Number-токени

| Variable | Значення | Роль |
|---|---|---|
| `stroke/hairline` | 1 | межа інпутів і ghost pill у rest |
| `stroke/focus` | 2 | товщина фокус-обведення |
| `stroke/focus-offset` | 2 | відступ обведення від елемента |

### 8.5 Як застосовувати на компонентах

Стани задаються **заміною токена**, а не окремим кольором — геометрія,
радіус і тінь між станами не змінюються.

| Компонент | rest | hover | pressed | disabled |
|---|---|---|---|---|
| Filled pill | `action/primary-bg` + `text/on-dark` | `action/primary-bg-hover` | `action/primary-bg-pressed` | `state/disabled-bg` + `state/disabled-fg` |
| Ghost pill | прозорий + `border/strong` | `action/secondary-bg-hover` + `secondary-border-hover` | `action/secondary-bg-pressed` | `state/disabled-bg` + `state/disabled-border` + `state/disabled-fg` |
| Accent pill | `accent/bg` + `accent/fg` | `accent/bg-hover` | `accent/bg-pressed` | `state/disabled-bg` + `state/disabled-fg` |
| Text link | `text/primary` | `accent/text-hover` + underline | `accent/text` | `state/disabled-fg` |
| Картка/рядок стрічки | `surface/canvas` | `surface/hover` | `surface/pressed` | — |
| Чип фільтра | `surface/card` + `text/primary` | `surface/hover` | `accent/wash-pressed` | `state/disabled-bg` + `state/disabled-fg` |
| Чип фільтра (обраний) | `surface/selected` + `accent/border` + `accent/text` | `accent/wash-pressed` | `accent/wash-pressed` | — |
| Інпут | `surface/elevated` + `border/hairline` (`stroke/hairline`) | `border/strong` | — | `state/disabled-bg` + `state/disabled-border` |

**Фокус** — окремий шар поверх будь-якого стану: обведення `focus/ring`
товщиною `stroke/focus` з відступом `stroke/focus-offset`. Він не замінює
hover, а накладається на нього.

---

## 9. Компоненти (сторінка `Design System` у `kootok`)

Атоми визначені за тим, що реально повторюється на екрані «Стрічка кімнат»
і має стани. Усі кольори — тільки з Variables, жодного hex у компонентах.

### 9.1 Атоми зі станами

| Component set | Варіанти (`State`) | Токени |
|---|---|---|
| `Button/CTA` | Default · Hover · Pressed · Disabled | `action/primary-bg[-hover/-pressed]`, `text/on-dark`, `state/disabled-*`, `radius/control`, `size/control-height` |
| `Chip/Tag` | Default · Hover · Pressed · Selected · Disabled | `surface/chip[-hover/-pressed]`, `surface/selected` + `accent/border` + `accent/text`, `radius/pill` |
| `Segmented/Item` | Active · Default · Hover · Pressed · Disabled | `surface/elevated`, `surface/hover`, `surface/track-pressed`, `text/primary`/`muted`, `radius/segment` |
| `Nav/Tab` | Active · Default · Hover · Pressed · Disabled | `surface/nav-active`, `surface/hover`, `surface/track-pressed`, `radius/tab` |
| `FAB/Filter` | Default · Hover · Pressed · Disabled | ті самі `action/*`, `radius/pill`, `size/fab` |
| `Card/Listing` | Default · Hover · Pressed | `surface/elevated` → `surface/hover` → `surface/pressed` |

`Nav/Tab` має властивість **`Icon` (instance swap)** — таб міняє іконку без
окремого компонента на кожен пункт.

### 9.2 Компоненти без станів

| Component | Роль |
|---|---|
| `Icon/Photo` `Icon/Listings` `Icon/Chat` `Icon/Profile` `Icon/Filter` | іконки; колір задається в місці використання |
| `Media/PhotoPlaceholder` | плейсхолдер фото (`surface/placeholder` + `border/rule`) |
| `List/FactRow` | рядок факту: лейбл `text/muted` + значення `text/primary` |
| `Segmented/Control` | доріжка перемикача з двох `Segmented/Item` |
| `Nav/Bar` | нижня навігація з трьох `Nav/Tab` |
| `Chrome/StatusBar` `Chrome/AppBar` `Chrome/Footer` `Chrome/HomeIndicator` | обрамлення екрана |

Ієрархія вкладення: `Card/Listing` → `Media/PhotoPlaceholder`, `List/FactRow` ×3,
`Chip/Tag` ×4, `Button/CTA`. `Nav/Bar` → `Nav/Tab` ×3 → `Icon/*`.

### 9.3 Що зібрано на екрані `16:1265`

Екран повністю складений з інстансів — власних фреймів лишились тільки
layout-обгортки (`main`, `section · результати`, `listing-list`) і заголовок
секції:

`Chrome/StatusBar` · `Chrome/AppBar` · `Segmented/Control` · 5× `Card/Listing`
(усередині 5 CTA, 20 чипів, 15 fact-рядків, 5 фото-плейсхолдерів) ·
`Chrome/Footer` · `Nav/Bar` · `Chrome/HomeIndicator` · `FAB/Filter`.

Геометрія збережена: висоти карток 645/645/678/645/645, екран 393×3721 як до
складання.

### 9.4 Довʼязані змінні на макеті

Усі «сирі» заливки й обведення екрана переведені на токени — після складання
на екрані **не лишилось жодного hex**:
фон екрана й статус-бар → `surface/app`, app bar і `main` → `surface/chrome`,
нижня навігація → `surface/nav`, картки → `surface/elevated`,
плейсхолдер фото → `surface/placeholder`, доріжка перемикача → `surface/track`,
структурні межі → `border/rule`, роздільники в картці → `border/divider`,
контур пристрою → `border/rule-strong`, іконки → `text/primary` / `text/muted`.

Додано під це: `semantic/surface/app`, `semantic/surface/chrome|nav|nav-active|track|track-pressed|chip|chip-hover|chip-pressed|placeholder`,
`semantic/border/rule|rule-strong|divider`, `radius/control|tab|segment|track`,
`size/control-height|fab|icon|icon-lg`.

### 9.5 Фото в оголошеннях

`Media/PhotoPlaceholder` став component set із двома станами:

| Variant | Що показує |
|---|---|
| `State=Empty` | плейсхолдер: `surface/placeholder` + іконка + підпис «Фото кімнати» |
| `State=Filled` | та сама рамка, службові діти приховані — під реальне фото |

П'ять карток переведені на `State=Filled` з реальними фото інтер'єрів.
Джерело — **Pexels** (Pexels License: безкоштовно, зокрема комерційно,
атрибуція не обов'язкова). Файли підготовлені під 351×199 @2x
(702×398, JPEG q76, 30–38 KB) і завантажені у Figma як image fill
зі `scaleMode: FILL`.

| Картка | Pexels ID |
|---|---|
| Солом'янський | 1454806 |
| Голосіївський | 271816 |
| Оболонський | 276566 |
| Дніпровський | 439227 |
| Печерський | 271743 |

Заміна фото: `State=Filled` + новий image fill на конкретному інстансі —
це контентний оверрайд, не кольоровий; правило «колір тільки в токенах і
майстрах» він не порушує.

### 9.6 Правки типографіки й чипів (майстри, не інстанси)

| Що | Було | Стало |
|---|---|---|
| Заголовок картки (`head` у `Card/Listing`) | `UI/16` | `Body/20 Medium` |
| Лейбл у `List/FactRow` | `Meta/14` | `Meta/12` |
| Значення у `List/FactRow` | `Meta/14` | `Meta/13` |
| `color/chip` | `#EBEBEE` | `#F7EBE3` (теплий пісок) |
| `color/chip-hover` | `#E4E4E8` | `#F2DFD3` |
| `color/chip-pressed` | `#DEDEE2` | `#EBD3C3` |
| Текст чипа (Default/Hover/Pressed) | `text/primary` | `text/on-accent` |
| `semantic/surface/selected` | `terracotta-100` | `terracotta-200` |

Чипи стали теплими, тож `surface/selected` підняли на крок глибше — інакше
вибраний чип зливався б зі звичайним. Кольори змінені **у значеннях токенів**,
типографіка — **у майстер-компонентах**; жоден інстанс не чіпали.

---

## 10. Екран «Стрічка — порожньо»

Джерело: вайрфрейм `prototype/listings-empty.html` (крок 1 сценарію Соломії,
вихід — послабити фільтри на цьому ж екрані, а не глухий кут).

Новий фрейм **«Стрічка кімнат — порожньо · 393»** (`16:2457`) стоїть праворуч
від екрана успіху. Зібраний повністю з наявних компонентів:

| Частина | Що використано |
|---|---|
| Обрамлення | `Chrome/StatusBar`, `Chrome/AppBar`, `Chrome/Footer`, `Chrome/HomeIndicator`, `Nav/Bar` |
| Перемикач | `Segmented/Control` |
| Заголовок секції | текст `Meta/14` → «0 оголошень у Печерському районі» |
| Активні фільтри | 3× `Chip/Tag` **State=Selected** — «Підселення», «Печерський», «до 6 000 грн» |
| Порожній стан | новий компонент `State/Empty` |
| Фільтри | `FAB/Filter`, переставлений над навігацією |

### Новий компонент `State/Empty`

Заголовок `Body/20 Medium` → `text/primary`, пояснення `Meta/13` →
`text/muted`, дія — інстанс `Button/CTA` («Послабити фільтри») на всю ширину.
Поверхня `surface/elevated`, радіус `radius/small-cards`, падінги 24/20.

Чому саме `Chip/Tag State=Selected` для фільтрів: порожній стан має показати
**яка саме комбінація дала нуль** — інакше «послабити фільтри» нема від чого
відштовхнутись. Це заодно перше живе застосування акцентного стану.

Аудит екрана: 0 незв'язаних заливок, 0 текстів без текст-стилю; власними
фреймами лишились тільки layout-обгортки (`main`, `section · результати`,
`listing-list`, `active-filters`).
