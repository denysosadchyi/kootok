---
name: "Куток"
description: "Тепла, доказова mobile-first система для пошуку кімнати й співмешканців у Києві — «Зелений двір»."
colors:
  forest: "#245744"
  forest-deep: "#16352a"
  leaf: "#2e6a53"
  mint: "#cfe5d8"
  mint-soft: "#e4f0e8"
  lime: "#d8e99a"
  white: "#ffffff"
  canvas: "#f6f3ea"
  sunken: "#eae5d7"
  sunken-claim: "#e9e5d8"
  line: "#dcd8ca"
  hairline: "rgba(23,37,32,.10)"
  ink: "#172520"
  ink-2: "#33443c"
  muted: "#5a6a62"
  success: "#17503a"
  success-bg: "#dcefe4"
  error: "#8e2731"
  error-bg: "#f9e1e2"
  waiting: "#7a4b0b"
  waiting-bg: "#f8ecd2"
  notification: "#c2452d"
  focus: "#2f5b80"
typography:
  headline: { fontFamily: "Jost, sans-serif", fontSize: "24px", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }
  card-head: { fontFamily: "Jost, sans-serif", fontSize: "20px", fontWeight: 800, lineHeight: 1.2 }
  section-title: { fontFamily: "Jost, sans-serif", fontSize: "17px", fontWeight: 700, lineHeight: 1.3 }
  card-title: { fontFamily: "Jost, sans-serif", fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }
  body: { fontFamily: "Golos Text, sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: 1.5 }
  compact: { fontFamily: "Golos Text, sans-serif", fontSize: "14px", fontWeight: 400, lineHeight: 1.45 }
  label: { fontFamily: "Jost, sans-serif", fontSize: "14px", fontWeight: 600, lineHeight: 1.35 }
  meta: { fontFamily: "Golos Text, sans-serif", fontSize: "13px", fontWeight: 400, lineHeight: 1.45 }
  nav: { fontFamily: "Jost, sans-serif", fontSize: "12px", fontWeight: 600, lineHeight: 1.2 }
  price: { fontFamily: "Jost, sans-serif", fontSize: "18px", fontWeight: 800, lineHeight: 1.15 }
  price-head: { fontFamily: "Jost, sans-serif", fontSize: "22px", fontWeight: 800, lineHeight: 1.15 }
  shell-title: { fontFamily: "Jost, sans-serif", fontSize: "15px", fontWeight: 700, lineHeight: 1.2 }
rounded: { field: "10px", control: "10px", card: "14px", listing-top: "18px", tabbar: "18px", sheet: "18px", context: "20px", pill: "999px", circle: "50%" }
spacing: { xs: "6px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px" }
ratio: { listing: "3/2", gallery: "4/3" }
elevation:
  card: "none"
  lift: "none"
  primary: "none"
components:
  button-primary: { background: "#245744", textColor: "{colors.white}", rounded: "{rounded.control}", height: "50px", shadow: "none" }
  button-secondary: { backgroundColor: "{colors.white}", textColor: "{colors.forest}", rounded: "{rounded.control}", height: "50px", shadow: "none" }
  field: { backgroundColor: "{colors.sunken}", textColor: "{colors.ink}", rounded: "{rounded.field}", minHeight: "50px" }
  card: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.card}", padding: "16px", shadow: "none" }
  chip: { backgroundColor: "{colors.success-bg}", textColor: "{colors.success}", rounded: "{rounded.pill}" }
  tag: { backgroundColor: "{colors.sunken-claim}", textColor: "{colors.ink-2}", rounded: "{rounded.pill}" }
  appbar: { backgroundColor: "{colors.white}", backControl: "{colors.canvas}", minHeight: "60px", shadow: "none" }
  # усередині .kit-listing chip/tag — текстовий рядок без фону й радіуса
---

# Design System: Куток

## Overview

**Creative North Star: «Зелений двір»**

«Куток» — світлий, теплий мобільний продукт у напрямі «київська дворова editorial utility»: лляне полотно, реальні фото кімнат і людей, чітка колонка та небагато білих контейнерів. Глибокий лісовий зелений веде до рішення; ціна, район, побут і статус перевірки видно до контакту.

**Key Characteristics:**

- 390px mobile-first полотно з одним стовпчиком; теплий лляний фон (`#f6f3ea`), трохи світліший за попередній, але далі відділяє білі картки без тіней і рамок.
- Пласка editorial-ієрархія: полотно → біла картка для одного цілісного змістового блоку → структуровані рядки → заглиблене поле. Декоративних тіней і градієнтів немає; функціональні винятки — скрим фото і скло ціни.
- Анімацій у продукті немає: стани (натискання, шторка, кроки) змінюються миттєво, скрол без згладжування.
- Один акцент — ліс — із лаймом лише для поточного стану (активний таб, активний чат).
- Фото 3:2 у стрічці (`--ratio-listing-media`) з функціональним скримом під ціною, 4:3 у галереї деталі (`--ratio-gallery-media`, crop через `object-fit: cover`); медіа є головною емоційною точкою. Набір власний: кімнати й портрети згенеровано ШІ одним колоритом (`visuals/`, мапа й alt — `visuals/manifest.md`); кожна людина й кімната має окреме зображення, стокові підстановки «чужого обличчя» заборонені. У кіті — веб-версії 1200×800 і 288×288 з `lesson-6/assets/{rooms,avatars}/`, завжди з `width`/`height`.
- Solar Bold Duotone для навігації й станів; Solar Linear для малих фактів і стрілок; локальні SVG лежать у
  `tokens/icons/` і підключаються через primitive icon tokens без data URI (mask у `currentColor`, без вшитого кольору).

## Colors

Палітра — зелений київський двір улітку: глибокий evergreen для дій, м'ята для м'яких підкладок, кислуватий лайм для «поточного», і теплі лляні нейтральні замість білого-на-сірому.

- **Ліс** `#245744` (первинна дія, ціна, бренд-марка) · **Глибокий ліс** `#16352a` (текст на лаймі й на склі) · **Листя** `#2e6a53` (пін локації, дрібні акценти).
- **Лайм** `#d8e99a`: лише поточне — активний таб, статус «Активний чат». Рідкість = сила. У темній темі лайм поза current не вживається. **М'ята** `#cfe5d8` / `#e4f0e8`: лише семантичні proof/system states, не звичайні контентні модулі.
- **Тепле лляне полотно** `#f6f3ea` — єдиний фон застосунку. **Біла поверхня** `#ffffff` — одна картка на цілісну секцію, question fieldset, оголошення/контекст або верхня панель вкладеного екрана; не окрема картка на кожен рядок. **Заглиблене** `#eae5d7` — поля вводу, доріжка сегмента.
- **Чорнило** `#172520`, **чорнило-2** `#33443c`, **приглушений** `#5a6a62` (контраст ≥ 4.5:1 на всіх поверхнях). **Розділювач** `#dcd8ca` і **hairline** `rgba(23,37,32,.10)`.
- **Доказ довіри**: `#17503a` на `#dcefe4`. **Очікування**: `#7a4b0b` на `#f8ecd2`. **Помилка**: `#8e2731` на `#f9e1e2`. **Глина** `#c2452d` — лічильник непрочитаного. **Фокус** `#2f5b80`.

**The Evidence Has Words Rule.** Успіх, помилка, очікування й довіра ніколи не передаються лише кольором: поруч є іконка й короткий текст.

**The Lime Is Current Rule.** Лайм позначає лише поточний вибір; він не фарбує бренд-марку, картки або звичайні факти. Бренд-марка — `--color-brand-mark` (ліс `#245744` в обох темах), ніколи лайм; усередині плитки — власний знак «Куток» (дім зі «спільною лавою», `--primitive-icon-brand`), wordmark лишається живим текстом у Jost.

## Typography

**Display/UI Font:** Jost (500–800) · **Reading Font:** Golos Text (400–700). Обидва variable WOFF2 self-hosted у `assets/fonts/`; runtime не залежить від Google Fonts/CDN. Ліцензії й source hashes — у `assets/fonts/SOURCES.md`.

- **Заголовок сторінки** `.kit-headline` (Jost 24/800, tracking −0.02em) — тільки на полотні, один на екран.
- **Заголовок картки-шапки деталі** `.kit-card--head h2` (Jost 20/800).
- **Заголовок розділу** `.kit-section__title` (Jost 17/700).
- **Заголовок картки / legend** `fieldset > legend` (Jost 16/700).
- **Тіло** — Golos Text 15/400.
- **Підпис поля** `.kit-field > label` — Jost 14/600, ink-2. **Мета** `.kit-meta` — Golos Text 13/400; **підказка** `.kit-hint` — Golos Text 14/400, muted. **Нижня навігація** — Jost, не менше 12/600.
- **Ціна** `.kit-price` — Jost 18/800 forest у картці, 22/800 у шапці деталі (`.kit-card--head .kit-price`).
- **Ціна на фото** `.kit-listing__media > .kit-price` — Jost 16/700 (`--type-card-title`) глибоким лісом на склі (`--color-glass-background`), radius 10: скло вже дає вагу, тому кегль менший за звичайну ціну.
- **Заголовок appbar** `.kit-shell__title` — Jost 15/700.

**Ієрархія заголовків.** Рівні читаються як різні вагові категорії, а не збільшена копія body: headline 24 відкриває екран і трапляється один раз; card-head 20 — лише в шапці деталі; section-title 17 підписує змістовий блок; card-title 16 підписує картку або є legend форми. Тіло 15 і менші рівні 12–14 не імітують заголовок вагою чи кеглем — жирність і Jost зарезервовані за переліком вище.

**The Two-Voice Rule.** Jost — рішення, структура й короткі UI-лейбли; Golos Text — довге читання, введення, пояснення й метадані. Jost не застосовується до абзаців або довгих підказок.

## Правило контейнерів

Полотно (`--color-page-background`) відділяє цілісні білі content cards. Кожна картка має один заголовок або `legend` першим усередині, а факти, довіра, люди та choices формують спільну групу під ним.

Біла `.kit-card` потрібна, коли елементи утворюють один об'єкт або одну змістову групу: оголошення з фото, шапка деталі, одна detail-секція, один compatibility fieldset, application form/result або conversation context. Не перетворюємо кожен рядок, note або proof на окрему плитку й не вкладаємо картки одна в одну. Заголовок лишається прямою першою дитиною тієї самої білої групи.

Product gutter зліва/справа — 16px; між сусідніми content cards — рівно 16px; усередині групи ритм 8/12/16px. Рядки структуруються відступом, alignment і вагою; hairline застосовується рідко, а не між кожним metadata/household/proof row. Pills мають окремі ролі — доказ (`.kit-chip`), звичка (`.kit-tag`), статус і застосований фільтр; усередині картки стрічки `.kit-listing` ті самі chip/tag стають текстовими рядками без підкладки.

## Layout

Полотно 390px (мінімум 320), gutter 16px, вертикальний ритм 6/8/12/16/24 (`--space-stack-xs…xl`), 32 — для великих переходів. Кореневий екран: лісова бренд-марка + «Куток», проста мітка міста, заголовок, лічильник/дія, контент. Вкладений екран: біла app bar на всю ширину з круглою «Назад» кольору полотна і центрованим заголовком; бренд-рядок не показується. На кореневій стрічці нижня навігація є fixed dock; `--space-tabbar-clearance` обчислюється як 70px dock + 24px нижнього inset + safe-area + 24px scroll-end breathing room. Деталь і форми не рендерять global tabs та покладаються на app-bar back і головну дію.

Стрічка — вертикальні картки з фото 3:2; household і trust rows групуються відступом без сітки hairline. Деталі — горизонтальна галерея зі snap у тій самій 16px content column (частина наступного фото лишається видимою всередині колонки), біла шапка й білі content cards із заголовками всередині. Форми — одна біла картка на question fieldset, без картки на кожен choice.

**The Entry Point Rule.** Кожен екран має одну річ, на яку падає око першим: заголовок або фото з ціною.

**The Thumb-Zone Rule.** Навігація й головна дія — у нижній зоні; кожна ціль ≥ 44px.

## Elevation & Depth

Система пласка: `card`, `lift` і `primary` semantic elevation tokens дорівнюють `none`. Рівні читаються через медіа, сітку, відступ, hairline і рідкісну білу поверхню; focus outline є accessibility state, не декоративною elevation.

## Shapes

Радіуси за роллю: поля й контроли 10, content cards 14, верх картки стрічки/tabbar/sheet 18, контекст заявки 20, доріжка сегмента 16, pills 999 для доказу, звички й статусу, аватари й кругла «Назад» 50%. Висота поля = висота контролу = 50 (`--size-control`), ціль дотику ≥ 44 (`--size-tap`). Внутрішні rows і notes не отримують окремого радіуса.

**The Pills Have A Job Rule.** Pill — компактний стан або навігація; довгі контентні поверхні не стають капсулами.

## Components

### Buttons

Дві ваги: **primary** (суцільний лісовий, білий текст, 50px, radius 10), **secondary** (біла поверхня, лісовий текст). `--compact` — 44px/14px: «Фільтри» в toolbar (з `--icon-filter`) і «Змінити» в рядку прикріпленої анкети. `--block` — на всю ширину.

### Chips і теги — два голоси

- **Доказ довіри** `.kit-chip`: пігулка `success-bg` із галочкою; `--error` має слово/іконку, а не лише колір. `--muted` — inline-факт без підкладки (наприклад, тип оголошення «Підселення» / «Оренда з нуля»). Усередині `.kit-listing` chip — текстовий рядок без фону.
- **Звичка / умова** `.kit-tag`: пігулка на `sunken-claim`; усередині `.kit-listing` — текстовий рядок без фону.

### Cards / Containers

- **Картка** `.kit-card` — білий контейнер для цілісного об'єкта, radius 14, без тіні.
- **Картка-шапка деталі** `.kit-card--head` — назва 20, `.kit-meta--place`, ціна 22.
- **Картка стрічки** `.kit-listing` — фото 3:2 з ціною на фото, тіло з назвою/фактами й структурованими рядами довіри/людей. З посиланням на деталь уся картка клікабельна; без нього — статична картка звичайного вигляду (не вимкнена).
- **Ключ–значення** `dl.kit-kv` — рядки замість двоколонкових плиток фактів.
- **Fieldset** — одна біла content card із `legend` = card-title першим усередині; choices не стають окремими картками й не потребують лінії між кожною парою.
- **Заявка** `.kit-application-card` — біла картка форми; прикріплена анкета `.kit-application-choice` — один рядок на поверхні полотна: галочка доказу, назва «Анкету сумісності додано», secondary compact «Змінити» (44px) праворуч і пояснення під назвою.

### Inputs / Fields

Заглиблені (`#eae5d7`), radius 10, 50px, без рамки; focus — синє кільце; помилка — рожева поверхня й `.kit-field__message`.

### Navigation

- **Таб-бар**: fixed білий dock лише на кореневих розділах, radius 18, іконки Solar Bold Duotone 24px + підпис 12px (на 320px/200% zoom підпис переноситься, не обрізається); поточний — лайм із глибоким лісом. У макетах — dock шукачки `.kit-tabbar`, 3 пункти (Пошук · Чати · Профіль); dock лістера з «Оголошеннями» в макетах не показано, тож у кіті його немає. Перемикання макетів уроку — лише курсова панель. Структурний `--space-tabbar-clearance` гарантує 24px між останнім контентом і dock; на detail/form screens таб-бар відсутній.
- **App bar**: біла панель на всю ширину оболонки (`--color-appbar-surface`), відділена від полотна лише фоном; «Назад» — коло 44px кольору полотна (`--color-appbar-control`) без тіні. У темній темі — темна поверхня й темне полотно відповідно.
- **Сегмент**: заглиблена доріжка (radius 16), активний пункт — біла поверхня radius 10 без тіні.
- **Рядок лічильника з дією** `.kit-toolbar`: лічильник ліворуч, кнопка «Фільтри» (secondary compact) праворуч.
- **Фільтри** — bottom sheet `.kit-sheet` з backdrop `--color-scrim`, тригер — лише кнопка «Фільтри» в toolbar (плаваючої кнопки немає); focus trap, закриття Escape/backdrop/«Закрити», повернення фокуса на тригер. Групи: тип оголошення, район/ціна/заїзд, звички; перемикач «Кімнати / Люди» (для шукачки «Люди» недоступні з поясненням).
- **Кроки форми** — патерн `apply-step` (`patterns/apply-step.md`): `.kit-progress` + `.kit-step` + `.kit-actions--split` + `.kit-draft-status`.

### State Block

Результат сценарію живе в `.kit-card.kit-card--state`: компактна лісова іконка (`--document` або `--chat`) без декоративного колодязя, заголовок 20 (ніколи не червоний), пояснення 14 muted, повноширинні дії. Композиція за замовчуванням вирівняна ліворуч. `.kit-card--prototype` — мета-стан прототипу (результат сценарію замість бекенду), завжди разом із `--state`.

### Chat

Список чатів — картка `.kit-card--list` з рядками на всю ширину й hairline; статус заявки — пігулка словами (надіслано/активний/прийнято), непрочитане — глиняний лічильник. У прототипі екрана розмови немає, тож рядок — статичний `div.kit-chat-row` звичайного вигляду, а не вимкнене посилання. Контекст заявки `.kit-conversation-context` — фото кімнати, назва й ціна.

## Do's and Don'ts

### Do:

- **Do** давайте екрану вхідну точку: заголовок або фото з ціною.
- **Do** кладіть ціну на фото і локацію з піном — це перші два факти пошуку.
- **Do** показуйте людей і довіру структурованими рядами, а не набором пігулок.
- **Do** будуйте структуру медіа, 16px grid, білою груповою поверхнею, alignment і відступом; semantic elevation tokens лишаються `none`.
- **Do** тримайте всі текстові пари ≥ 4.5:1.

### Don't:

- **Don't** повертати подвійну шапку (бренд-смуга + app bar) на вкладених екранах.
- **Don't** фарбувати лаймом щось, крім поточного стану.
- **Don't** робити картку на кожен рядок або note, вкладати картки чи проводити hairline між кожною парою фактів.
- **Don't** робити доказ довіри і побутову звичку однаковою пігулкою.
- **Don't** переносити стиль research-сторінок (`site-theme.css`, `lesson-artifact.css`) у продукт.

## Внесок у систему

Порядок внесення змін (спочатку `design-system/`, потім екрани; правило
«залишаємо») визначений в одному місці — `AGENTS.md`, розділ «Внесок у
систему». Цей документ описує мову, а не процес.

## Джерела

- `concept.md` — обґрунтування атрибутів мови («чому»).
- `concept/references.md` — референси та анти-референси.
- `design-system/index.css` — єдина точка входу; `design-system/tokens.css`,
  `design-system/components/`, `design-system/patterns/` і
  `design-system/docs/` — канонічна реалізація та документація системи.
- `ui/tokens.html`, `ui/kit.html`, `ui/shell.html` — оглядові або навчальні
  артефакти; вони не замінюють канонічну документацію в `design-system/docs/`.
- `beginners/source/prototype/` (`lesson-6/`) — чотири активні екрани раннього сценарію.
- `microcopy.md`, `voice.md` — тексти й голос компонентів.
- Стилі research-сторінок і курсової оболонки (`site-theme.css`,
  `lesson-artifact.css`, `course-nav.css`) не є джерелом продуктової мови.
