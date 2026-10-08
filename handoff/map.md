# Карта екранів — з чого зібраний кожен екран

> **Згенеровано** `node scripts/build-handoff-map.mjs` (2026-10-08). Не редагуй руками:
> токени скрипт знаходить сам — бере розмітку екрана, шукає правила
> `design-system/components/*.css`, що застосовуються до елемента (з усіма станами:
> hover, focus, disabled, тема, адаптив), і виписує `var(--…)` з них. Руками ведеться лише
> список елементів, компонентів і ключів — масив `SCREENS` у скрипті. Змінив екран,
> компонент чи токен — перезапусти скрипт.

Навіщо: відповісти на питання **«якщо я зміню цей токен, що поїде»** — для цього є
[зворотний список](#зворотний-список-токен--екрани) наприкінці. Вперед — щоб знати, з чого
збирати екран.

Як читати:

- **Один рядок — один елемент екрана.** Повторювані елементи (5 карток стрічки, 18 варіантів
  анкети) описано одним рядком. Варіант екрана, з якого взято елемент, — у дужках.
- **Компонент** — сторінка живої документації `design-system/docs/` зі станами в обох темах;
  у дужках — CSS-модулі, правила яких реально застосовуються до елемента.
- **Токени** — ті, що читають правила самого елемента. Успадковане від батька (колір тексту,
  шрифт) тут не повторюється — дивись рядок батьківського елемента. Токени глобальних правил
  (`html`, `body`, `*` у `base.css`) стоять на всіх екранах і винесені в
  [окремий список](#глобальні-правила).
- **Ключ** — адреса тексту в [`microcopy.md`](microcopy.md), розділ «Активні екрани». `*` —
  будь-який ключ гілки; `/` — варіанти. «alt — `visuals/manifest.md`» — альтернативний
  текст фото береться з маніфесту візуалів.
- **Новий текст** для екрана, якого в карті ще немає: тон і правила — [`voice.md`](voice.md)
  (принципи, словник, «Правила за типом елемента»); новий рядок у `microcopy.md` отримує ключ
  за схемою `<екран>.<зона>.<елемент>`, повторюваний текст — `common.*` або `shell.*`.
  Тексти станів, яких ще немає на екранах (помилки, порожньо, завантаження), — у
  `microcopy.md › Повний інвентар`; правила застосування — [`common.md`](common.md).

Курсова рамка (`course-nav.*`, `_base.css`) не продукт і в карту не входить. Поведінка
скриптів кіта, яка читає токени через `getComputedStyle` (`split-view.js` — тривалості й
криві руху, `sheet.js` і `split-view.js` — прапорці режимів), у карті не показана: вона
спирається на ті самі токени, що вже є в рядках `sheet` і `split-view`.

## Оболонка (спільна)

Однакова на всіх 5 екранах; на кореневих («Стрічка», «Чати») — dock знизу, на вкладених — app bar і таб-бар у шапці (від `--bp-desktop`).

| Зона | Елемент | Компонент (модулі CSS) | Токени, які читає | Ключ `microcopy.md` |
|---|---|---|---|---|
| Каркас | Оболонка екрана | [`shell`](../design-system/docs/shell.html) (shell.css) | `--bp-desktop` `--bp-tablet` `--color-page-background` `--color-text-primary` `--primitive-length-390` `--primitive-length-700` `--primitive-width-full` `--size-detail-max` `--size-page-max` `--size-side-panel` `--size-single-column` `--space-screen-gutter` `--type-body` | — |
| Каркас | Тіло екрана | [`shell`](../design-system/docs/shell.html) (layout.css, shell.css) | `--bp-desktop` `--bp-tablet` `--primitive-width-full` `--size-detail-max` `--space-screen-gutter` `--space-scroll-end` `--space-section-gap` `--space-tabbar-clearance` | — |
| Бренд-рядок | Бренд | [`shell`](../design-system/docs/shell.html) (base.css, shell.css) | `--color-brand-mark` `--color-focus` `--color-icon-current` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--opacity-disabled` `--primitive-icon-brand` `--primitive-length-1` `--primitive-length-2` `--primitive-length-22` `--primitive-length-3` `--primitive-length-30` `--primitive-length-38` `--primitive-length-4` `--primitive-width-50pct` `--radius-mark` `--size-tap` `--type-brand` `--type-tracking-display` `--type-underline-offset` | `shell.brand.name` |
| Бренд-рядок | Місто | [`shell`](../design-system/docs/shell.html) (base.css, shell.css) | `--bp-desktop` `--color-accent` `--color-icon-current` `--color-text-primary-support` `--color-transparent` `--primitive-font-weight-600` `--primitive-icon-pin` `--primitive-length-14` `--primitive-length-30` `--primitive-length-5` `--type-meta` | `shell.brand.city` |
| Навігація | Dock (кореневі екрани) | [`shell`](../design-system/docs/shell.html) (shell.css) | `--bp-desktop` `--bp-tablet` `--color-card-background` `--color-transparent` `--elevation-lift` `--primitive-length-1` `--primitive-length-3` `--primitive-length-390` `--primitive-width-50pct` `--primitive-width-full` `--radius-hero` `--size-page-max` `--size-tabbar` `--space-screen-gutter` `--space-stack-xs` `--space-tabbar-edge` `--z-dock` | `shell.nav.label` |
| Навігація | Таб-бар у шапці (вкладені екрани) (`listing.html`) | [`shell`](../design-system/docs/shell.html) (shell.css) | `--bp-desktop` `--color-card-background` `--color-transparent` `--elevation-lift` `--primitive-length-1` `--primitive-length-3` `--radius-hero` `--size-tabbar` `--space-screen-gutter` `--space-stack-xs` | `shell.nav.label` |
| Навігація | Пункт «Пошук» (поточний) | [`shell`](../design-system/docs/shell.html) (base.css, shell.css) | `--bp-desktop` `--color-current-background` `--color-current-text` `--color-focus` `--color-icon-current` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-text-secondary` `--opacity-disabled` `--primitive-font-weight-700` `--primitive-icon-home` `--primitive-length-1` `--primitive-length-2` `--primitive-length-24` `--primitive-length-3` `--primitive-length-58` `--radius-control` `--size-tap` `--space-control-inline` `--space-stack-sm` `--type-leading-nav` `--type-nav` `--type-tracking-nav` `--type-underline-offset` | `shell.nav.search` |
| Навігація | Пункт «Чати» | [`shell`](../design-system/docs/shell.html) (base.css, shell.css) | `--bp-desktop` `--color-current-background` `--color-current-text` `--color-focus` `--color-icon-current` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-text-secondary` `--opacity-disabled` `--primitive-font-weight-700` `--primitive-icon-chats` `--primitive-icon-home` `--primitive-length-1` `--primitive-length-2` `--primitive-length-24` `--primitive-length-3` `--primitive-length-58` `--radius-control` `--size-tap` `--space-control-inline` `--space-stack-sm` `--type-leading-nav` `--type-nav` `--type-tracking-nav` `--type-underline-offset` | `shell.nav.chats` |
| Навігація | Пункт «Профіль» (вимкнений) | [`shell`](../design-system/docs/shell.html) (base.css, shell.css) | `--bp-desktop` `--color-current-background` `--color-current-text` `--color-focus` `--color-icon-current` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-text-secondary` `--opacity-disabled` `--primitive-font-weight-700` `--primitive-icon-home` `--primitive-icon-profile` `--primitive-length-1` `--primitive-length-2` `--primitive-length-24` `--primitive-length-3` `--primitive-length-58` `--radius-control` `--size-tap` `--space-control-inline` `--space-stack-sm` `--type-leading-nav` `--type-nav` `--type-tracking-nav` `--type-underline-offset` | `shell.nav.profile-disabled` |
| Навігація | Місто в таб-барі | [`shell`](../design-system/docs/shell.html) (shell.css) | `--bp-desktop` `--color-accent` `--color-icon-current` `--color-text-primary-support` `--primitive-font-weight-600` `--primitive-icon-pin` `--primitive-length-14` `--primitive-length-5` `--size-tap` `--space-stack-sm` `--type-meta` | `shell.brand.city` |
| App bar | App bar вкладеного екрана (`listing.html`) | [`shell`](../design-system/docs/shell.html) (shell.css) | `--bp-desktop` `--bp-tablet` `--color-appbar-surface` `--color-transparent` `--primitive-length-12` `--primitive-length-60` `--primitive-length-8` `--primitive-width-full` `--size-tap` `--space-screen-gutter` `--space-stack-lg` `--space-stack-xs` `--z-overlay` | — |
| App bar | Ланцюжок (десктоп) (`listing.html`) | [`breadcrumbs`](../design-system/docs/breadcrumbs.html) (breadcrumbs.css, shell.css) | `--bp-desktop` `--color-text-primary` | `shell.breadcrumbs.label` |
| Футер | Футер | [`shell`](../design-system/docs/shell.html) (shell.css) | `--color-text-secondary` `--type-footer` | `shell.footer` |

## Стрічка кімнат

Файл: `lesson-6/listings.html`.

| Зона | Елемент | Компонент (модулі CSS) | Токени, які читає | Ключ `microcopy.md` |
|---|---|---|---|---|
| Шапка | Шапка списку | [`layout`](../design-system/docs/layout.html) (layout.css, shell.css) | `--bp-desktop` `--primitive-width-full` `--size-page-max` `--space-screen-gutter` `--space-stack-sm` `--space-stack-xl` | — |
| Шапка | Заголовок H1 | [`typography`](../design-system/docs/typography.html) (shell.css, typography.css) | `--bp-desktop` `--measure-headline` `--type-page-title` `--type-page-title-wide` `--type-tracking-display` | `listings.header.title` |
| Шапка | Лічильник оголошень | [`typography`](../design-system/docs/typography.html) (typography.css) | `--color-text-secondary` `--measure-hint` `--type-support` | `listings.header.count` |
| Шапка | Перемикач «Кімнати / Люди» | [`segmented`](../design-system/docs/segmented.html) (layout.css, segmented.css) | `--color-card-background` `--color-current-text` `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-surface-sunken` `--color-text-secondary` `--primitive-font-weight-500` `--primitive-font-weight-700` `--primitive-length-2` `--primitive-length-3` `--primitive-length-4` `--primitive-width-full` `--radius-track` `--size-segmented-max` | `listings.feed.label` |
| Шапка | Сегмент «Кімнати» (поточний) | [`segmented`](../design-system/docs/segmented.html) (base.css, segmented.css) | `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-text-secondary` `--opacity-disabled` `--primitive-font-weight-600` `--primitive-length-1` `--primitive-length-14` `--primitive-length-2` `--primitive-length-3` `--primitive-length-38` `--primitive-length-6` `--primitive-width-full` `--radius-field` `--type-support` `--type-underline-offset` | `listings.feed.rooms` |
| Шапка | Лічильник у сегменті | [`segmented`](../design-system/docs/segmented.html) (segmented.css) | `--color-card-background` `--color-current-background` `--color-current-text` `--color-text-secondary` `--primitive-font-weight-600` `--primitive-font-weight-700` `--primitive-length-14` `--primitive-length-24` `--primitive-length-38` `--primitive-length-6` `--primitive-width-full` `--radius-field` `--radius-pill` `--space-stack-xs` `--type-meta` `--type-support` | `listings.feed.rooms` |
| Шапка | Сегмент «Люди» (вимкнений) | [`segmented`](../design-system/docs/segmented.html) (segmented.css) | `--color-text-secondary` `--primitive-font-weight-600` `--primitive-length-14` `--primitive-length-38` `--primitive-length-6` `--primitive-width-full` `--radius-field` `--type-support` | `listings.feed.people` |
| Шапка | Пояснення вимкненого сегмента | [`typography`](../design-system/docs/typography.html) (layout.css, typography.css) | `--color-text-secondary` `--measure-hint` `--primitive-length-280` `--type-support` | `listings.feed.people-hint` |
| Шапка | Тулбар | [`layout`](../design-system/docs/layout.html) (layout.css) | `--bp-tablet` `--primitive-length-12` `--space-stack-sm` | — |
| Шапка | Кнопка «Фільтри» | [`button`](../design-system/docs/button.html) (base.css, button.css) | `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-card-background` `--color-focus` `--color-icon-current` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--color-text-primary` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-hover-secondary` `--elevation-primary` `--opacity-disabled` `--press-scale` `--press-scale-sm` `--primitive-icon-tuning` `--primitive-length-10` `--primitive-length-18` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--radius-circle` `--radius-control` `--size-control` `--size-tap` `--space-control-block` `--space-control-inline` `--space-stack-sm` `--type-control` `--type-control-compact` `--type-input` `--z-below` | `listings.toolbar.filters` |
| Стрічка | Split-view (список + деталь) | [`split-view`](../design-system/docs/split-view.html) (split-view.css) | `--bp-desktop` `--primitive-length-0` `--primitive-width-full` `--size-scrollport` `--size-split-detail-min` `--size-split-list` `--size-split-list-min` `--space-screen-gutter` `--space-section-gap` | — |
| Стрічка | Секція списку | [`split-view`](../design-system/docs/split-view.html) (layout.css, split-view.css) | `--bp-desktop` `--color-card-background` `--radius-card` `--size-panel-min` `--space-card-block` `--space-card-inline` `--space-screen-gutter` `--space-stack-md` `--space-stack-sm` | `listings.list.heading` |
| Стрічка | Сітка карток | [`listing`](../design-system/docs/listing.html) (listing.css, split-view.css) | `--bp-desktop` `--bp-listing-compact` `--bp-tablet` `--col-count-desktop` `--col-count-tablet` `--container-max` `--primitive-width-full` `--space-grid-gap` `--space-section-gap` `--space-stack-sm` | — |
| Картка оголошення | Картка | [`listing`](../design-system/docs/listing.html) (listing.css, split-view.css) | `--bp-desktop` `--color-card-active-background` `--color-card-hover-background` `--color-card-subdued-background` `--color-current-background` `--color-current-text` `--color-focus` `--color-interactive-surface-active` `--color-transparent` `--elevation-card` `--primitive-length-2` `--primitive-length-3` `--radius-card` `--radius-hero` `--size-listing-thumb` `--space-stack-md` `--space-stack-sm` `--space-stack-xxs` | — |
| Картка оголошення | Медіа-блок (фото 3:2, скрим) | [`listing`](../design-system/docs/listing.html) (listing.css) | `--color-info-background` `--color-media-hover-overlay` `--color-photo-scrim` `--primitive-width-full` `--ratio-listing-media` | — |
| Картка оголошення | Ціна поверх фото | [`listing`](../design-system/docs/listing.html) (listing.css, typography.css) | `--color-action` `--color-current-text` `--color-glass-background` `--color-text-primary` `--color-transparent` `--primitive-length-10` `--primitive-length-12` `--primitive-length-6` `--radius-control` `--space-card-block` `--space-card-inline` `--type-card-title` `--type-price` `--z-overlay` | `common.listing.price` |
| Картка оголошення | Посилання-фото (у вузькій колонці — мініатюра) | [`listing`](../design-system/docs/listing.html) (base.css, listing.css) | `--color-focus` `--color-info-background` `--color-interactive-text-active` `--color-interactive-text-hover` `--opacity-disabled` `--primitive-length-1` `--primitive-length-2` `--primitive-length-3` `--radius-control` `--ratio-listing-thumb` `--size-listing-thumb` `--type-underline-offset` | `listings.card.photo-label` |
| Картка оголошення | Фото | [`listing`](../design-system/docs/listing.html) (listing.css) | `--primitive-width-full` | `listings.card.photo-label`; alt — `visuals/manifest.md` |
| Картка оголошення | Назва (посилання на всю картку) | [`listing`](../design-system/docs/listing.html) (base.css) | `--color-focus` `--color-interactive-text-active` `--color-interactive-text-hover` `--opacity-disabled` `--primitive-length-1` `--primitive-length-2` `--primitive-length-3` `--type-underline-offset` | `common.listing.title` |
| Картка оголошення | Тип оголошення | [`badge`](../design-system/docs/badge.html) (badge.css, base.css, listing.css) | `--color-current-text` `--color-icon-current` `--color-text-primary-support` `--color-text-secondary` `--color-transparent` `--color-trust` `--color-trust-background` `--primitive-font-weight-600` `--primitive-icon-check` `--primitive-length-11` `--primitive-length-3` `--primitive-length-4` `--primitive-length-7` `--primitive-length-9` `--radius-pill` `--type-chip` `--type-meta` | `common.listing.type.sublet` / .fresh |
| Картка оголошення | Район | [`listing`](../design-system/docs/listing.html) (base.css, listing.css, typography.css) | `--color-accent` `--color-current-text` `--color-icon-current` `--color-text-secondary` `--primitive-icon-pin` `--primitive-length-14` `--primitive-length-2` `--primitive-length-5` `--type-meta` | `common.listing.place` |
| Картка оголошення | Заїзд | [`data-list`](../design-system/docs/data-list.html) (data-list.css, listing.css) | `--color-current-text` `--color-text-primary-support` `--type-meta` | `common.listing.move-in.label` / .value |
| Картка оголошення | Хто живе | [`listing`](../design-system/docs/listing.html) (listing.css) | `--color-transparent` `--primitive-length-1` `--primitive-length-n1` `--space-stack-md` `--space-stack-xs` | `listings.card.household` |
| Картка оголошення | Аватари мешканців | [`listing`](../design-system/docs/listing.html) (listing.css) | `--color-avatar-background` `--color-card-background` `--color-current-background` `--primitive-length-2` `--primitive-length-34` `--primitive-length-48` `--radius-circle` | alt — `visuals/manifest.md` |
| Картка оголошення | Список доказів | [`listing`](../design-system/docs/listing.html) (listing.css) | `--color-current-text` `--color-text-secondary` `--primitive-length-4` `--space-stack-md` `--space-stack-sm` `--space-stack-xs` `--type-chip` | `listings.card.proof-label` |
| Картка оголошення | Доказ довіри | [`badge`](../design-system/docs/badge.html) (badge.css, base.css, listing.css) | `--color-icon-current` `--color-transparent` `--color-trust` `--color-trust-background` `--primitive-icon-check` `--primitive-length-11` `--primitive-length-3` `--primitive-length-4` `--primitive-length-7` `--primitive-length-9` `--radius-pill` `--type-chip` | `common.proof.*` |
| Картка оголошення | Непідтверджений факт | [`badge`](../design-system/docs/badge.html) (badge.css, base.css, listing.css) | `--color-danger` `--color-danger-background` `--color-icon-current` `--color-transparent` `--color-trust` `--color-trust-background` `--primitive-icon-check` `--primitive-icon-warning` `--primitive-length-11` `--primitive-length-3` `--primitive-length-4` `--primitive-length-7` `--primitive-length-9` `--radius-pill` `--type-chip` | `common.proof.missing.*` |
| Картка оголошення | Тег «Власник напряму» | [`listing`](../design-system/docs/listing.html) (listing.css) | `--color-claim-background` `--color-text-primary-support` `--color-transparent` `--primitive-font-weight-500` `--primitive-length-1` `--primitive-length-12` `--primitive-length-5` `--primitive-length-n1` `--radius-pill` `--type-meta` | `common.proof.owner-direct` |
| Кінець списку | Порожній результат фільтра | [`typography`](../design-system/docs/typography.html) (typography.css) | `--color-text-secondary` `--measure-hint` `--type-support` | `listings.filter.empty` |
| Кінець списку | Показано N із M | [`typography`](../design-system/docs/typography.html) (typography.css) | `--color-text-secondary` `--measure-hint` `--type-support` | `listings.list.shown` |
| Кінець списку | «Завантажити ще» | [`button`](../design-system/docs/button.html) (base.css, button.css, split-view.css) | `--bp-desktop` `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-card-background` `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--color-surface-sunken` `--color-text-primary` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-hover-secondary` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--primitive-width-full` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-input` `--z-below` | `listings.list.load-more` |
| Деталь (десктоп) | Колонка деталі | [`split-view`](../design-system/docs/split-view.html) (split-view.css) | `--bp-desktop` `--color-card-background` `--dur-base` `--ease-enter` `--move-sm` `--radius-card` `--size-panel-min` `--space-card-block` `--space-card-inline` `--space-screen-gutter` `--space-section-gap` | — |
| Деталь (десктоп) | Заголовок деталі | [`split-view`](../design-system/docs/split-view.html) (split-view.css) | `--type-detail-title` | `listings.split.title` |
| Деталь (десктоп) | «Закрити» | [`split-view`](../design-system/docs/split-view.html) (base.css, button.css, split-view.css) | `--bp-desktop` `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-card-background` `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--color-surface-sunken` `--color-text-primary` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-hover-secondary` `--elevation-primary` `--opacity-disabled` `--press-scale` `--press-scale-sm` `--primitive-length-10` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--radius-circle` `--radius-control` `--size-control` `--size-tap` `--space-control-block` `--space-control-inline` `--space-stack-sm` `--type-control` `--type-control-compact` `--type-input` `--z-below` | `listings.split.close` |
| Деталь (десктоп) | Вміст деталі | [`split-view`](../design-system/docs/split-view.html) (split-view.css) | `--dur-reduced` `--dur-slow` `--ease-enter` `--ease-loop` `--move-sm` `--pulse-opacity` `--space-section-gap` | ключі «Картки оголошення» |
| Деталь (десктоп) | Статус завантаження (створює `split-view.js`) | [`split-view`](../design-system/docs/split-view.html) (split-view.css) | `--color-current-background` `--color-current-text` `--radius-pill` `--space-stack-sm` `--space-stack-xxs` `--type-chip` `--z-overlay` | `listings.split.loading` |
| Фільтри | Шторка / панель | [`sheet`](../design-system/docs/sheet.html) (sheet.css, shell.css) | `--bp-desktop` `--bp-tablet` `--color-card-background` `--color-page-background` `--color-text-primary` `--elevation-lift` `--primitive-height-82dvh` `--primitive-length-390` `--primitive-length-700` `--primitive-width-105pct` `--primitive-width-full` `--radius-card` `--radius-sheet` `--size-control-compact` `--size-panel-min` `--size-scrollport` `--space-card-inline` `--space-screen-gutter` `--space-section-gap` `--space-stack-lg` `--z-raised` `--z-sheet` | — |
| Фільтри | Заголовок шторки | [`sheet`](../design-system/docs/sheet.html) (sheet.css) | `--color-text-primary` `--type-section-title` | `listings.filters.title` |
| Фільтри | Рядок стану | [`sheet`](../design-system/docs/sheet.html) (sheet.css) | `--bp-desktop` `--color-text-secondary` `--type-meta` | `listings.filters.state` |
| Фільтри | Тіло шторки | [`sheet`](../design-system/docs/sheet.html) (sheet.css) | `--bp-desktop` `--bp-tablet` `--primitive-height-60dvh` `--primitive-length-20` `--space-screen-gutter` `--space-stack-lg` `--space-stack-xxl` | — |
| Фільтри | «Закрити» (створює `sheet.js`) | [`sheet`](../design-system/docs/sheet.html) (base.css, sheet.css) | `--bp-desktop` `--bp-tablet` `--color-action` `--color-focus` `--color-icon-current` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-text-primary` `--color-transparent` `--opacity-disabled` `--primitive-icon-close` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--radius-circle` `--size-tap` `--space-screen-gutter` `--space-stack-lg` `--space-stack-xl` `--type-input` `--type-leading-icon-only` `--z-raised` | `listings.filters.close` |
| Фільтри | Фон шторки (створює `sheet.js`) | [`sheet`](../design-system/docs/sheet.html) (base.css, sheet.css) | `--bp-desktop` `--color-action` `--color-scrim` `--color-text-primary` `--type-input` `--z-sheet-backdrop` | `listings.filters.close` |
| Фільтри | Форма | [`form`](../design-system/docs/form.html) (form.css, sheet.css) | `--bp-desktop` `--primitive-length-16` | `listings.filters.label` |
| Фільтри | Група полів | [`form`](../design-system/docs/form.html) (card.css, sheet.css) | `--bp-desktop` `--bp-tablet` `--color-card-background` `--color-transparent` `--elevation-card` `--primitive-length-1` `--primitive-width-full` `--radius-card` `--space-card-block` `--space-card-inline` `--space-stack-md` `--space-stack-sm` `--space-stack-xs` | — |
| Фільтри | Назва групи | [`form`](../design-system/docs/form.html) (card.css, sheet.css, typography.css) | `--bp-desktop` `--bp-tablet` `--color-text-primary` `--primitive-length-12` `--primitive-width-full` `--space-stack-sm` `--space-stack-xs` `--type-card-title` | `listings.filters.type` / .place / .habits |
| Фільтри | Згортання групи (панель, створює `sheet.js`) | [`sheet`](../design-system/docs/sheet.html) (base.css, sheet.css) | `--color-action` `--color-focus` `--color-icon-current` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-text-primary` `--color-text-secondary` `--color-transparent` `--primitive-icon-down` `--primitive-length-16` `--primitive-length-2` `--primitive-length-3` `--primitive-width-full` `--radius-control` `--size-tap` `--space-stack-sm` `--space-stack-xs` `--type-card-title` `--type-input` | `listings.filters.summary` |
| Фільтри | Варіант (радіо) | [`form`](../design-system/docs/form.html) (form.css, sheet.css) | `--bp-desktop` `--primitive-length-12` `--size-choice-compact` `--size-tap` `--space-stack-sm` `--type-body` | `listings.filters.type` |
| Фільтри | Радіо-кружок | [`form`](../design-system/docs/form.html) (base.css, form.css, sheet.css) | `--bp-desktop` `--color-action` `--color-text-primary` `--primitive-length-22` `--size-choice-mark-compact` `--type-input` | — |
| Фільтри | Поле-список | [`form`](../design-system/docs/form.html) (form.css, sheet.css) | `--bp-tablet` `--color-icon-current` `--color-text-secondary` `--opacity-disabled` `--primitive-icon-down` `--primitive-length-16` `--primitive-length-6` `--size-control` `--space-control-inline` `--type-field-label` | `listings.filters.district`, .habits.* |
| Фільтри | Підпис поля | [`form`](../design-system/docs/form.html) (form.css) | `--color-text-primary-support` `--type-field-label` | `listings.filters.district` |
| Фільтри | Список вибору | [`form`](../design-system/docs/form.html) (base.css, form.css) | `--color-action` `--color-field-focus` `--color-field-hover` `--color-focus` `--color-interactive-surface-active` `--color-surface-sunken` `--color-text-primary` `--opacity-disabled` `--primitive-length-1` `--primitive-length-3` `--primitive-width-full` `--radius-field` `--size-control` `--size-tap` `--space-control-block` `--space-control-inline` `--type-input` | `listings.filters.district` |
| Фільтри | Два поля в рядок | [`form`](../design-system/docs/form.html) (form.css, sheet.css) | `--bp-tablet` `--primitive-length-12` `--space-stack-md` | — |
| Фільтри | Числове поле | [`form`](../design-system/docs/form.html) (base.css, form.css) | `--color-action` `--color-field-focus` `--color-field-hover` `--color-focus` `--color-interactive-surface-active` `--color-surface-sunken` `--color-text-primary` `--color-text-secondary` `--opacity-disabled` `--primitive-length-1` `--primitive-length-3` `--primitive-width-full` `--radius-field` `--size-control` `--space-control-block` `--space-control-inline` `--type-input` | `listings.filters.price-min` / .price-max |
| Фільтри | Поле дати | [`form`](../design-system/docs/form.html) (form.css) | `--color-icon-current` `--color-text-secondary` `--opacity-disabled` `--primitive-icon-calendar` `--primitive-icon-down` `--primitive-length-16` `--primitive-length-6` `--size-control` `--space-control-inline` `--type-field-label` | `listings.filters.move-in` |
| Фільтри | Дії | [`button`](../design-system/docs/button.html) (button.css, sheet.css) | `--bp-desktop` `--bp-tablet` `--color-card-background` `--space-card-block` `--space-stack-md` `--z-raised` | — |
| Фільтри | «Застосувати фільтри» / «Фільтрувати» | [`button`](../design-system/docs/button.html) (base.css, button.css, sheet.css) | `--bp-tablet` `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-focus` `--color-on-action` `--color-text-primary` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--primitive-width-full` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-input` `--z-below` | `listings.filters.apply` / .apply-panel |
| Фільтри | «Скинути фільтри» | [`button`](../design-system/docs/button.html) (base.css, button.css, sheet.css) | `--bp-desktop` `--bp-tablet` `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-card-background` `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--color-surface-sunken` `--color-text-primary` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-hover-secondary` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--primitive-width-full` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-input` `--z-below` | `listings.filters.reset` |

## Картка оголошення

Файл: `lesson-6/listing.html (+ 4 `listing-<район>.html`)`.

| Зона | Елемент | Компонент (модулі CSS) | Токени, які читає | Ключ `microcopy.md` |
|---|---|---|---|---|
| App bar | «Назад» | [`shell`](../design-system/docs/shell.html) (base.css, shell.css) | `--bp-desktop` `--color-action` `--color-appbar-control` `--color-focus` `--color-icon-current` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--opacity-disabled` `--primitive-icon-back` `--primitive-length-1` `--primitive-length-2` `--primitive-length-22` `--primitive-length-3` `--primitive-length-n2` `--radius-circle` `--size-tap` `--type-leading-icon-only` `--type-underline-offset` | `listing.appbar.back` |
| App bar | Ланцюжок | [`breadcrumbs`](../design-system/docs/breadcrumbs.html) (breadcrumbs.css, shell.css) | `--bp-desktop` `--color-text-primary` | `listing.breadcrumbs` |
| App bar | Заголовок | [`shell`](../design-system/docs/shell.html) (shell.css) | `--bp-desktop` `--type-appbar` `--type-page-title-wide` `--type-tracking-display` | `listing.appbar.title` |
| Розкладка | Деталь (2 колонки від 60rem) | [`layout`](../design-system/docs/layout.html) | — | — |
| Розкладка | Сітка деталі | [`layout`](../design-system/docs/layout.html) (layout.css) | `--size-detail-aside` `--space-detail-column-gap` `--space-section-gap` | — |
| Галерея | Галерея | [`gallery`](../design-system/docs/gallery.html) (gallery.css, layout.css) | `--primitive-length-10` `--size-detail-aside` `--space-detail-column-gap` | `listing.gallery.label` |
| Галерея | Фото | [`gallery`](../design-system/docs/gallery.html) (gallery.css) | `--primitive-length-280` `--primitive-width-full` `--radius-card` `--ratio-gallery-media` | alt — `visuals/manifest.md` |
| Зведення | Картка-шапка | [`card`](../design-system/docs/card.html) (card.css) | `--color-card-background` `--elevation-card` `--radius-card` `--space-card-block` `--space-card-inline` | — |
| Зведення | Назва | [`typography`](../design-system/docs/typography.html) (typography.css) | `--measure-headline` `--type-detail-title` `--type-page-title` `--type-tracking-display` | `common.listing.title` |
| Зведення | Адреса | [`typography`](../design-system/docs/typography.html) (badge.css, base.css, typography.css) | `--color-accent` `--color-icon-current` `--color-text-secondary` `--primitive-icon-pin` `--primitive-length-14` `--primitive-length-5` `--space-stack-xs` `--type-meta` | `listing.head.place` |
| Зведення | Тип оголошення | [`badge`](../design-system/docs/badge.html) (badge.css, base.css) | `--color-icon-current` `--color-text-primary-support` `--color-transparent` `--color-trust` `--color-trust-background` `--primitive-icon-check` `--primitive-length-11` `--primitive-length-3` `--primitive-length-4` `--primitive-length-7` `--primitive-length-9` `--radius-pill` `--type-chip` | `common.listing.type.*` |
| Зведення | Ціна | [`typography`](../design-system/docs/typography.html) (badge.css, card.css, typography.css) | `--color-action` `--space-stack-lg` `--space-stack-xs` `--type-price` `--type-price-hero` | `common.listing.price` |
| Зведення | Комунальні | [`typography`](../design-system/docs/typography.html) (badge.css, typography.css) | `--color-text-secondary` `--space-stack-xs` `--type-meta` | `listing.head.utilities` |
| Зведення | Актуальність | [`typography`](../design-system/docs/typography.html) (badge.css, typography.css) | `--color-text-secondary` `--space-stack-xs` `--type-meta` | `listing.head.updated` |
| Зведення | Підсумок доказів: перевірено | [`card`](../design-system/docs/card.html) (badge.css, card.css, listing.css) | `--color-divider` `--color-transparent` `--color-trust` `--primitive-icon-shield` `--primitive-length-1` `--primitive-length-10` `--primitive-length-20` `--space-stack-md` `--space-stack-xs` | `listing.evidence.verified` |
| Зведення | Підсумок доказів: частково (`listing-solomianskyi.html`) | [`card`](../design-system/docs/card.html) (badge.css, card.css, listing.css) | `--color-divider` `--color-transparent` `--color-trust` `--primitive-icon-shield` `--primitive-length-1` `--primitive-length-10` `--primitive-length-20` `--space-stack-md` `--space-stack-xs` | `listing.evidence.partial` |
| Зведення | Непідтверджені факти (нічого не перевірено) (`listing-podilskyi.html`) | [`badge`](../design-system/docs/badge.html) (badge.css, base.css) | `--color-danger` `--color-danger-background` `--color-icon-current` `--color-trust` `--color-trust-background` `--primitive-icon-check` `--primitive-icon-warning` `--primitive-length-11` `--primitive-length-3` `--primitive-length-4` `--primitive-length-7` `--primitive-length-9` `--radius-pill` `--type-chip` | `common.proof.missing.*` |
| Заявка | Блок дії | [`layout`](../design-system/docs/layout.html) (layout.css) | `--size-detail-aside` `--space-detail-column-gap` `--space-stack-md` | — |
| Заявка | Попередження про передоплату | [`note`](../design-system/docs/note.html) (base.css, note.css) | `--color-icon-current` `--color-text-primary` `--color-text-primary-support` `--color-transparent` `--color-waiting-background` `--primitive-icon-shield` `--primitive-icon-shield-warning` `--primitive-length-13` `--primitive-length-20` `--primitive-length-30` `--radius-control` `--space-stack-md` `--space-stack-sm` `--type-support` | `listing.apply.safety` |
| Заявка | «Подати заявку» | [`button`](../design-system/docs/button.html) (base.css, button.css) | `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-focus` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-1` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--primitive-width-full` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-underline-offset` `--z-below` | `listing.apply.cta` |
| Заявка | Підказка під дією | [`typography`](../design-system/docs/typography.html) (card.css, typography.css) | `--color-text-secondary` `--measure-hint` `--primitive-length-8` `--type-support` | `listing.apply.hint` |
| Заявка | Нотатка прототипу | [`note`](../design-system/docs/note.html) (base.css, note.css) | `--color-icon-current` `--color-text-primary-support` `--color-transparent` `--primitive-icon-shield` `--primitive-length-13` `--primitive-length-20` `--primitive-length-30` `--space-stack-md` `--type-support` | `listing.apply.prototype-note` |
| Секції | Картка секції | [`card`](../design-system/docs/card.html) (card.css) | `--color-card-background` `--elevation-card` `--radius-card` `--space-card-block` `--space-card-inline` | — |
| Секції | Заголовок секції | [`typography`](../design-system/docs/typography.html) (typography.css) | `--type-section-title` | `listing.trust.title`, .about.title, .residents.title, .wishes.title, .description.title |
| Що перевірено | Список фактів | [`badge`](../design-system/docs/badge.html) (badge.css) | `--type-support` | `listing.trust.identity` / .phone / .instagram / .lease |
| Що перевірено | Факт | [`badge`](../design-system/docs/badge.html) (badge.css) | `--color-text-primary` `--color-trust` `--color-trust-background` `--primitive-icon-check` `--primitive-length-12` `--primitive-length-20` `--primitive-length-4` `--radius-circle` `--space-stack-md` `--space-stack-xs` | `listing.trust.*` |
| Що перевірено | Нічого не перевірено (`listing-podilskyi.html`) | [`card`](../design-system/docs/card.html) (badge.css) | `--space-stack-xs` | `listing.trust.none` |
| Що перевірено | Підзаголовок «Ще не перевірено» (`listing-podilskyi.html`) | [`typography`](../design-system/docs/typography.html) (badge.css, typography.css) | `--color-text-secondary` `--space-stack-xs` `--type-meta` | `listing.trust.missing` |
| Що перевірено | Непідтверджений факт (`listing-podilskyi.html`) | [`badge`](../design-system/docs/badge.html) (badge.css, base.css) | `--color-danger` `--color-danger-background` `--color-icon-current` `--color-trust` `--color-trust-background` `--primitive-icon-check` `--primitive-icon-warning` `--primitive-length-11` `--primitive-length-3` `--primitive-length-4` `--primitive-length-7` `--primitive-length-9` `--radius-pill` `--type-chip` | `common.proof.missing.*` |
| Про кімнату | Факти | [`data-list`](../design-system/docs/data-list.html) | — | `listing.about.facts` |
| Мешканці | Людина | [`badge`](../design-system/docs/badge.html) (badge.css) | `--primitive-length-12` `--primitive-length-2` `--primitive-length-48` | `listing.residents.person` |
| Мешканці | Аватар | [`badge`](../design-system/docs/badge.html) (badge.css, listing.css) | `--color-avatar-background` `--primitive-length-48` `--radius-circle` | alt — `visuals/manifest.md` |
| Мешканці | Імʼя й вік | [`badge`](../design-system/docs/badge.html) (badge.css) | `--primitive-length-8` `--type-control` | `listing.residents.person` |
| Мешканці | Опис | [`badge`](../design-system/docs/badge.html) (badge.css) | `--color-text-secondary` `--type-support` | `listing.residents.person` |
| Мешканці | Нотатка про профіль | [`typography`](../design-system/docs/typography.html) (badge.css, typography.css) | `--color-text-secondary` `--measure-hint` `--space-stack-xs` `--type-support` | `listing.residents.profile-note` |
| Побажання | Побажання | [`listing`](../design-system/docs/listing.html) (listing.css) | `--color-claim-background` `--color-text-primary-support` `--primitive-font-weight-500` `--primitive-length-12` `--primitive-length-5` `--radius-pill` `--type-meta` | `listing.wishes.item` |
| Опис | Текст опису | [`card`](../design-system/docs/card.html) (badge.css) | `--space-stack-xs` | `listing.description.body` |

## Анкета сумісності

Файл: `lesson-6/compatibility-form.html`.

| Зона | Елемент | Компонент (модулі CSS) | Токени, які читає | Ключ `microcopy.md` |
|---|---|---|---|---|
| App bar | «Назад» | [`shell`](../design-system/docs/shell.html) (base.css, shell.css) | `--bp-desktop` `--color-action` `--color-appbar-control` `--color-focus` `--color-icon-current` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--opacity-disabled` `--primitive-icon-back` `--primitive-length-1` `--primitive-length-2` `--primitive-length-22` `--primitive-length-3` `--primitive-length-n2` `--radius-circle` `--size-tap` `--type-leading-icon-only` `--type-underline-offset` | `compat.appbar.back` |
| App bar | Заголовок | [`shell`](../design-system/docs/shell.html) (shell.css) | `--bp-desktop` `--type-appbar` `--type-page-title-wide` `--type-tracking-display` | `compat.appbar.title` |
| Розкладка | Основна колонка + бічна (десктоп) | [`layout`](../design-system/docs/layout.html) (layout.css) | `--bp-desktop` `--size-page-aside` `--space-detail-column-gap` `--space-section-gap` | — |
| Вступ | Заголовок | [`typography`](../design-system/docs/typography.html) (typography.css) | `--measure-headline` `--type-page-title` `--type-tracking-display` | `compat.intro.title` |
| Вступ | Текст | [`typography`](../design-system/docs/typography.html) (typography.css) | `--color-text-secondary` `--measure-hint` `--type-support` | `compat.intro.text` |
| Прогрес | Прогрес | [`progress`](../design-system/docs/progress.html) (progress.css) | `--space-stack-sm` | `compat.progress` |
| Прогрес | Назва кроку й «Крок N із 3» | [`progress`](../design-system/docs/progress.html) (progress.css) | `--color-text-secondary` `--space-stack-md` `--type-meta` | `compat.progress` |
| Прогрес | Доріжка | [`progress`](../design-system/docs/progress.html) (progress.css) | `--color-surface-sunken` `--primitive-length-4` `--radius-pill` | `compat.progress` |
| Прогрес | Заповнення | [`progress`](../design-system/docs/progress.html) (progress.css) | `--color-action-surface` `--primitive-width-full` `--radius-pill` | — |
| Крок | Крок форми | [`layout`](../design-system/docs/layout.html) (layout.css) | `--space-stack-lg` | — |
| Крок | Прихований заголовок кроку | [`base`](../design-system/docs/base.html) (base.css) | `--primitive-length-1` `--primitive-length-n1` | `compat.step1.intro` (і step2, step3) |
| Крок | Вступ кроку | [`layout`](../design-system/docs/layout.html) (layout.css) | `--color-text-secondary` `--type-support` | `compat.step1.intro` |
| Питання | Питання | [`form`](../design-system/docs/form.html) (card.css, form.css) | `--bp-desktop` `--color-card-background` `--elevation-card` `--radius-card` `--space-card-block` `--space-card-inline` `--space-stack-lg` | `compat.step1.sleep` тощо |
| Питання | Назва питання | [`form`](../design-system/docs/form.html) (card.css, form.css, typography.css) | `--bp-desktop` `--color-text-primary` `--primitive-length-12` `--primitive-width-full` `--space-stack-xs` `--type-card-title` | `compat.step1.sleep` тощо |
| Питання | Варіант відповіді | [`form`](../design-system/docs/form.html) (form.css) | `--bp-desktop` `--primitive-length-12` `--size-tap` `--type-body` | `compat.step1.sleep` тощо |
| Питання | Радіо-кружок | [`form`](../design-system/docs/form.html) (base.css, form.css) | `--color-action` `--color-text-primary` `--primitive-length-22` `--type-input` | — |
| Про себе | Поле | [`form`](../design-system/docs/form.html) (form.css) | `--opacity-disabled` `--primitive-length-6` | `compat.step3.about` |
| Про себе | Текстове поле | [`form`](../design-system/docs/form.html) (base.css, form.css) | `--color-action` `--color-field-focus` `--color-field-hover` `--color-focus` `--color-interactive-surface-active` `--color-surface-sunken` `--color-text-primary` `--color-text-secondary` `--opacity-disabled` `--primitive-length-1` `--primitive-length-120` `--primitive-length-14` `--primitive-length-3` `--primitive-width-full` `--radius-field` `--size-control` `--space-control-block` `--space-control-inline` `--type-input` | `compat.step3.about` |
| Про себе | Підказка поля | [`form`](../design-system/docs/form.html) (form.css) | `--color-text-secondary` `--type-meta` | `compat.step3.about-hint` |
| Дії | «Зберегти й далі» (крок 1) | [`button`](../design-system/docs/button.html) (base.css, button.css, layout.css) | `--bp-desktop` `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-focus` `--color-on-action` `--color-text-primary` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--primitive-width-full` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-input` `--z-below` | `compat.actions.next` |
| Дії | Дві дії поруч (кроки 2–3) | [`layout`](../design-system/docs/layout.html) (button.css, layout.css) | `--bp-desktop` `--primitive-width-fr-072` `--primitive-width-fr-128` `--space-stack-md` | — |
| Дії | «Назад» | [`button`](../design-system/docs/button.html) (base.css, button.css, layout.css) | `--bp-desktop` `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-card-background` `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--color-text-primary` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-hover-secondary` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--primitive-width-full` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-input` `--z-below` | `compat.actions.back` |
| Дії | «Зберегти й перейти до заявки» | [`button`](../design-system/docs/button.html) (base.css, button.css, layout.css) | `--bp-desktop` `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-focus` `--color-on-action` `--color-text-primary` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--primitive-width-full` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-input` `--z-below` | `compat.actions.submit` |
| Дії | Статус чернетки | [`progress`](../design-system/docs/progress.html) (layout.css, progress.css, typography.css) | `--bp-desktop` `--color-text-secondary` `--measure-hint` `--primitive-length-20` `--type-meta` `--type-support` | `compat.draft.*` |
| Бічна колонка | Кімната, до якої заявка | [`chat`](../design-system/docs/chat.html) (base.css, chat.css) | `--bp-desktop` `--color-action` `--color-card-subdued-background` `--color-focus` `--color-interactive-text-active` `--color-interactive-text-hover` `--opacity-disabled` `--primitive-length-1` `--primitive-length-2` `--primitive-length-3` `--primitive-length-72` `--primitive-length-80` `--radius-context` `--type-underline-offset` | `common.context.application` |
| Бічна колонка | Фото кімнати | [`chat`](../design-system/docs/chat.html) (chat.css) | `--bp-desktop` `--primitive-length-72` `--primitive-length-80` `--primitive-length-84` `--primitive-width-full` `--ratio-listing-media` | alt — `visuals/manifest.md` |
| Бічна колонка | Надпис «Заявка …» | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-text-secondary` `--type-overline` `--type-tracking-overline` | `common.context.application` |
| Бічна колонка | Назва кімнати | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-text-primary` `--type-card-title` | `common.context.application` |
| Бічна колонка | Заголовок «Кроки анкети» | [`typography`](../design-system/docs/typography.html) (typography.css) | `--type-section-title` | `compat.aside.steps` |
| Бічна колонка | Кроки | [`progress`](../design-system/docs/progress.html) (progress.css) | `--space-stack-md` | `compat.aside.steps` |
| Бічна колонка | Крок (поточний) | [`progress`](../design-system/docs/progress.html) (progress.css) | `--color-current-background` `--color-current-text` `--color-surface-sunken` `--color-text-secondary` `--primitive-font-weight-700` `--primitive-length-2` `--primitive-length-24` `--radius-circle` `--space-stack-md` `--type-meta` | `compat.aside.steps` |

## Заявка

Файл: `lesson-6/application.html`.

| Зона | Елемент | Компонент (модулі CSS) | Токени, які читає | Ключ `microcopy.md` |
|---|---|---|---|---|
| App bar | «Назад» | [`shell`](../design-system/docs/shell.html) (base.css, shell.css) | `--bp-desktop` `--color-action` `--color-appbar-control` `--color-focus` `--color-icon-current` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--opacity-disabled` `--primitive-icon-back` `--primitive-length-1` `--primitive-length-2` `--primitive-length-22` `--primitive-length-3` `--primitive-length-n2` `--radius-circle` `--size-tap` `--type-leading-icon-only` `--type-underline-offset` | `application.appbar.back` |
| App bar | Заголовок | [`shell`](../design-system/docs/shell.html) (shell.css) | `--bp-desktop` `--type-appbar` `--type-page-title-wide` `--type-tracking-display` | `application.appbar.title` |
| Розкладка | Основна колонка + бічна (десктоп) | [`layout`](../design-system/docs/layout.html) (layout.css) | `--bp-desktop` `--size-page-aside` `--space-detail-column-gap` `--space-section-gap` | — |
| Бічна колонка | Кімната, на яку заявка | [`chat`](../design-system/docs/chat.html) (base.css, chat.css) | `--bp-desktop` `--color-action` `--color-card-subdued-background` `--color-focus` `--color-interactive-text-active` `--color-interactive-text-hover` `--opacity-disabled` `--primitive-length-1` `--primitive-length-2` `--primitive-length-3` `--primitive-length-72` `--primitive-length-80` `--radius-context` `--type-underline-offset` | `application.aside.label`, `common.context.application` |
| Бічна колонка | Фото кімнати | [`chat`](../design-system/docs/chat.html) (chat.css) | `--bp-desktop` `--primitive-length-72` `--primitive-length-80` `--primitive-length-84` `--primitive-width-full` `--ratio-listing-media` | alt — `visuals/manifest.md` |
| Бічна колонка | Надпис «Заявка …» | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-text-secondary` `--type-overline` `--type-tracking-overline` | `common.context.application` |
| Бічна колонка | Назва кімнати | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-text-primary` `--type-card-title` | `common.context.application` |
| Повідомлення | Картка заявки | [`card`](../design-system/docs/card.html) (card.css) | `--color-card-background` `--elevation-card` `--radius-card` `--space-card-block` `--space-card-inline` | — |
| Повідомлення | Заголовок | [`typography`](../design-system/docs/typography.html) (typography.css) | `--type-section-title` | `application.message.title` |
| Повідомлення | Вступ | [`typography`](../design-system/docs/typography.html) (badge.css, card.css, typography.css) | `--color-text-secondary` `--measure-hint` `--space-stack-sm` `--space-stack-xs` `--type-support` | `application.message.intro` |
| Повідомлення | Форма | [`form`](../design-system/docs/form.html) (card.css, form.css) | `--primitive-length-16` `--space-stack-lg` | — |
| Повідомлення | Підпис поля | [`form`](../design-system/docs/form.html) (form.css) | `--color-text-primary-support` `--type-field-label` | `application.message.field` |
| Повідомлення | Текстове поле | [`form`](../design-system/docs/form.html) (base.css, form.css) | `--color-action` `--color-field-focus` `--color-field-hover` `--color-focus` `--color-interactive-surface-active` `--color-surface-sunken` `--color-text-primary` `--color-text-secondary` `--opacity-disabled` `--primitive-length-1` `--primitive-length-120` `--primitive-length-14` `--primitive-length-3` `--primitive-width-full` `--radius-field` `--size-control` `--space-control-block` `--space-control-inline` `--type-input` | `application.message.field` |
| Повідомлення | Підказка поля | [`form`](../design-system/docs/form.html) (form.css) | `--color-text-secondary` `--type-meta` | `application.message.hint` |
| Анкета | Блок «Анкету додано» | [`card`](../design-system/docs/card.html) (base.css, card.css) | `--color-hairline` `--color-icon-current` `--color-trust` `--primitive-icon-check` `--primitive-length-1` `--primitive-length-2` `--primitive-length-22` `--primitive-length-24` `--space-stack-md` `--space-stack-sm` | — |
| Анкета | Заголовок | [`card`](../design-system/docs/card.html) (card.css) | `--color-text-primary` `--type-field-label` | `application.profile.title` |
| Анкета | «Змінити» | [`button`](../design-system/docs/button.html) (base.css, button.css, card.css) | `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-card-background` `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-hover-secondary` `--elevation-primary` `--opacity-disabled` `--press-scale` `--press-scale-sm` `--primitive-length-1` `--primitive-length-10` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--radius-circle` `--radius-control` `--size-control` `--size-tap` `--space-control-block` `--space-control-inline` `--space-stack-sm` `--space-stack-xs` `--type-control` `--type-control-compact` `--type-underline-offset` `--z-below` | `application.profile.change` |
| Анкета | Пояснення | [`card`](../design-system/docs/card.html) (card.css) | `--color-text-secondary` `--type-meta` | `application.profile.meta` |
| Дія | Нотатка прототипу | [`note`](../design-system/docs/note.html) (base.css, note.css) | `--color-icon-current` `--color-text-primary-support` `--color-transparent` `--primitive-icon-shield` `--primitive-length-13` `--primitive-length-20` `--primitive-length-30` `--space-stack-md` `--type-support` | `application.prototype.note` |
| Дія | Головна дія | [`button`](../design-system/docs/button.html) (base.css, button.css, layout.css) | `--bp-desktop` `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-focus` `--color-on-action` `--color-text-primary` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--primitive-width-full` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-input` `--z-below` | `application.submit` |
| Результат | Стан «Заявку надіслано» | [`card`](../design-system/docs/card.html) (card.css) | `--color-focus` `--primitive-length-2` `--primitive-length-3` `--space-stack-md` | — |
| Результат | Іконка стану | [`card`](../design-system/docs/card.html) (base.css, card.css) | `--color-icon-current` `--color-trust` `--color-trust-background` `--primitive-icon-chat-empty` `--primitive-length-24` `--primitive-length-48` `--radius-circle` | — |
| Результат | Заголовок | [`card`](../design-system/docs/card.html) (card.css) | `--color-text-primary` `--space-stack-xs` `--type-detail-title` | `application.result.title` |
| Результат | Що далі | [`progress`](../design-system/docs/progress.html) (card.css, progress.css) | `--space-stack-md` `--space-stack-xs` | `application.result.steps` |
| Результат | Пройдений крок | [`progress`](../design-system/docs/progress.html) (progress.css) | `--color-action-surface` `--color-current-background` `--color-current-text` `--color-icon-current` `--color-on-action` `--color-surface-sunken` `--color-text-secondary` `--primitive-font-weight-700` `--primitive-icon-check` `--primitive-length-16` `--primitive-length-2` `--primitive-length-24` `--primitive-length-4` `--radius-circle` `--space-stack-md` `--type-meta` | `application.result.steps` |
| Результат | Поточний крок | [`progress`](../design-system/docs/progress.html) (progress.css) | `--color-current-background` `--color-current-text` `--color-surface-sunken` `--color-text-secondary` `--primitive-font-weight-700` `--primitive-length-2` `--primitive-length-24` `--radius-circle` `--space-stack-md` `--type-meta` | `application.result.steps` |
| Результат | «Повернутися до оголошення» | [`button`](../design-system/docs/button.html) (base.css, button.css) | `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-focus` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-1` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-underline-offset` `--z-below` | `application.result.back` |
| Результат | «Змінити анкету» | [`button`](../design-system/docs/button.html) (base.css, button.css) | `--color-action` `--color-action-surface` `--color-action-surface-active` `--color-action-surface-hover` `--color-card-background` `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--color-interactive-text-active` `--color-interactive-text-hover` `--color-on-action` `--dur-fast` `--dur-hover` `--ease-standard` `--elevation-hover` `--elevation-hover-secondary` `--elevation-primary` `--opacity-disabled` `--press-scale` `--primitive-length-1` `--primitive-length-2` `--primitive-length-20` `--primitive-length-3` `--primitive-width-105pct` `--primitive-width-50pct` `--radius-circle` `--radius-control` `--size-control` `--space-control-block` `--space-stack-sm` `--type-control` `--type-underline-offset` `--z-below` | `application.result.change` |
| Результат | Нотатка прототипу | [`note`](../design-system/docs/note.html) (base.css, card.css, note.css) | `--color-icon-current` `--color-text-primary-support` `--color-text-secondary` `--color-transparent` `--measure-hint` `--primitive-icon-shield` `--primitive-length-13` `--primitive-length-20` `--primitive-length-30` `--space-stack-md` `--type-meta` `--type-support` | `application.result.prototype-note` |

## Чати

Файл: `design-system/examples/chats.html`.

| Зона | Елемент | Компонент (модулі CSS) | Токени, які читає | Ключ `microcopy.md` |
|---|---|---|---|---|
| Шапка | Заголовок H1 | [`typography`](../design-system/docs/typography.html) (shell.css, typography.css) | `--bp-desktop` `--measure-headline` `--type-page-title` `--type-page-title-wide` `--type-tracking-display` | `chats.header.title` |
| Шапка | Лічильник | [`typography`](../design-system/docs/typography.html) (typography.css) | `--color-text-secondary` `--measure-hint` `--type-support` | `chats.header.count` |
| Розкладка | Основна колонка + бічна (десктоп) | [`layout`](../design-system/docs/layout.html) (layout.css) | `--bp-desktop` `--size-page-aside` `--space-detail-column-gap` `--space-section-gap` | — |
| Список | Картка списку | [`card`](../design-system/docs/card.html) (card.css) | `--color-card-background` `--elevation-card` `--radius-card` `--space-card-block` `--space-card-inline` | — |
| Список | Список заявок і чатів | [`chat`](../design-system/docs/chat.html) | — | `chats.list.label` |
| Рядок | Рядок «Заявку надіслано» | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--primitive-length-12` `--primitive-length-16` `--primitive-length-2` `--primitive-length-3` `--primitive-length-52` | `chats.row.status.sent` |
| Рядок | Рядок «Активний чат», непрочитане | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--primitive-length-12` `--primitive-length-16` `--primitive-length-2` `--primitive-length-3` `--primitive-length-52` | `chats.row.status.active` |
| Рядок | Рядок «Заявку прийнято» | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-focus` `--color-interactive-surface-active` `--color-interactive-surface-hover` `--primitive-length-12` `--primitive-length-16` `--primitive-length-2` `--primitive-length-3` `--primitive-length-52` | `chats.row.status.accepted`, `chats.row.empty-thread` |
| Рядок | Аватар | [`chat`](../design-system/docs/chat.html) (chat.css, listing.css) | `--color-avatar-background` `--primitive-length-48` `--primitive-length-52` `--radius-circle` | alt — `visuals/manifest.md` |
| Рядок | Імʼя | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-text-primary` `--type-control-compact` | `chats.row.name` |
| Рядок | Останнє повідомлення | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-text-secondary` `--type-meta` | `chats.row.preview` |
| Рядок | Статус | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-surface-sunken` `--color-text-secondary` `--color-waiting` `--color-waiting-background` `--primitive-font-weight-700` `--primitive-length-2` `--primitive-length-8` `--radius-pill` `--type-size-badge` | `chats.row.status.*` |
| Рядок | Кімната | [`chat`](../design-system/docs/chat.html) | — | `chats.row.room` |
| Рядок | Час | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-text-secondary` `--type-size-caption` | `chats.row.time` |
| Рядок | Лічильник непрочитаного | [`chat`](../design-system/docs/chat.html) (chat.css) | `--color-notification` `--color-on-action` `--primitive-font-weight-700` `--primitive-length-20` `--primitive-length-6` `--radius-pill` `--type-size-badge` | `chats.row.unread` |
| Список | Підказка під списком | [`typography`](../design-system/docs/typography.html) (typography.css) | `--color-text-secondary` `--measure-hint` `--type-support` | `chats.hint` |
| Бічна колонка | Заголовок «Як працюють заявки» | [`typography`](../design-system/docs/typography.html) (typography.css) | `--type-section-title` | `chats.how` |
| Бічна колонка | Кроки | [`progress`](../design-system/docs/progress.html) (progress.css) | `--space-stack-md` | `chats.how` |
| Бічна колонка | Крок | [`progress`](../design-system/docs/progress.html) (progress.css) | `--color-current-background` `--color-current-text` `--color-surface-sunken` `--color-text-secondary` `--primitive-font-weight-700` `--primitive-length-2` `--primitive-length-24` `--radius-circle` `--space-stack-md` `--type-meta` | `chats.how` |

## Глобальні правила

Правила `html`, `body`, `*` у модулях кіта (переважно `base.css`) — шрифт і колір
сторінки, зменшений рух, фокус. Діють на всіх 5 екранах:

`--bp-desktop` `--bp-tablet` `--color-current-background` `--color-focus` `--color-page-background` `--color-page-outer-background` `--color-scrollbar-thumb` `--color-scrollbar-thumb-hover` `--color-text-primary` `--color-transparent` `--dur-reduced` `--primitive-length-10` `--primitive-length-12` `--primitive-length-2` `--primitive-length-3` `--primitive-width-full` `--radius-pill` `--space-stack-md` `--space-stack-sm` `--type-body`

## Зворотний список: токен → екрани

«Що поїде, якщо змінити токен». Екрани — де токен читає хоча б один елемент (або глобальне
правило), зокрема й ті, що читають його не напряму, а через інший токен
(`--elevation-hover` → `--color-shadow-hover`). «Читають напряму» — скільки рядків карти
мають токен у колонці «Токени»; «Через» — які токени передають зміну далі. Зміна значення в
`design-system/tokens.css` змінює всі ці місця в обох темах, якщо темна тема не
перевизначає токен.

### Semantic-токени

| Токен | Екрани | Читають напряму (елементів) | Через інші токени | Спирається на primitive |
|---|---|---|---|---|
| `--color-accent` | усі 5 | 12 | — | `--primitive-color-green-200` `--primitive-color-green-600` |
| `--color-action` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 27 | — | `--primitive-color-green-200` `--primitive-color-green-700` |
| `--color-action-surface` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 15 | — | `--primitive-color-green-600` `--primitive-color-green-700` |
| `--color-action-surface-active` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 13 | — | `--primitive-color-green-900` `--primitive-color-ink-900` |
| `--color-action-surface-hover` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 13 | — | `--primitive-color-green-500` `--primitive-color-green-600` |
| `--color-appbar-control` | Картка оголошення, Анкета сумісності, Заявка | 3 | — | `--primitive-color-cream-100` `--primitive-color-ink-900` |
| `--color-appbar-surface` | усі 5 | 5 | — | `--primitive-color-green-900` `--primitive-color-white` |
| `--color-avatar-background` | Стрічка кімнат, Картка оголошення, Чати | 3 | — | `--primitive-color-green-200` `--primitive-color-green-700` |
| `--color-brand-mark` | усі 5 | 5 | — | `--primitive-color-green-700` |
| `--color-card-active-background` | Стрічка кімнат | 1 | — | `--primitive-color-green-100` `--primitive-color-green-700` |
| `--color-card-background` | усі 5 | 30 | — | `--primitive-color-green-900` `--primitive-color-white` |
| `--color-card-hover-background` | Стрічка кімнат | 1 | — | `--primitive-color-cream-300` `--primitive-color-green-900` |
| `--color-card-subdued-background` | Стрічка кімнат, Анкета сумісності, Заявка | 3 | — | `--primitive-color-ink-700` `--primitive-color-white` |
| `--color-claim-background` | Стрічка кімнат, Картка оголошення | 2 | — | `--primitive-color-cream-300` `--primitive-color-green-900` |
| `--color-current-background` | усі 5 (глобальне правило) | 28 | — | `--primitive-color-green-300` `--primitive-color-green-600` |
| `--color-current-text` | усі 5 | 28 | — | `--primitive-color-cream-050` `--primitive-color-green-900` |
| `--color-danger` | Стрічка кімнат, Картка оголошення | 3 | — | `--primitive-color-red-050` `--primitive-color-red-700` |
| `--color-danger-background` | Стрічка кімнат, Картка оголошення | 3 | — | `--primitive-color-red-050` `--primitive-color-red-700` |
| `--color-divider` | Картка оголошення | 2 | — | `--primitive-color-cream-500` `--primitive-color-green-100` |
| `--color-field-focus` | Стрічка кімнат, Анкета сумісності, Заявка | 4 | — | `--primitive-color-ink-700` `--primitive-color-white` |
| `--color-field-hover` | Стрічка кімнат, Анкета сумісності, Заявка | 4 | — | `--primitive-color-cream-300` `--primitive-color-green-900` |
| `--color-focus` | усі 5 (глобальне правило) | 58 | — | `--primitive-color-blue-700` `--primitive-color-green-200` |
| `--color-glass-background` | Стрічка кімнат | 1 | — | `--primitive-color-green-900` `--primitive-color-white-a86` |
| `--color-hairline` | Заявка | 1 | — | `--primitive-color-green-600` `--primitive-color-ink-a10` |
| `--color-icon-current` | усі 5 | 53 | — | `--primitive-color-current` |
| `--color-info-background` | Стрічка кімнат | 2 | — | `--primitive-color-green-050` `--primitive-color-green-900` |
| `--color-interactive-surface-active` | усі 5 | 37 | — | `--primitive-color-green-200` `--primitive-color-green-900` |
| `--color-interactive-surface-hover` | усі 5 | 32 | — | `--primitive-color-cream-300` `--primitive-color-ink-700` |
| `--color-interactive-text-active` | усі 5 | 40 | — | `--primitive-color-cream-050` `--primitive-color-ink-900` |
| `--color-interactive-text-hover` | усі 5 | 40 | — | `--primitive-color-green-100` `--primitive-color-green-900` |
| `--color-media-hover-overlay` | Стрічка кімнат | 1 | — | `--primitive-color-photo-a20` `--primitive-color-white-a20` |
| `--color-notification` | Чати | 1 | — | `--primitive-color-orange-700` |
| `--color-on-action` | усі 5 | 20 | — | `--primitive-color-cream-050` `--primitive-color-white` |
| `--color-page-background` | усі 5 (глобальне правило) | 11 | — | `--primitive-color-cream-100` `--primitive-color-ink-900` |
| `--color-page-outer-background` | усі 5 (глобальне правило) | 5 | — | `--primitive-color-cream-350` `--primitive-color-green-900` |
| `--color-photo-scrim` | Стрічка кімнат | 1 | — | `--primitive-color-photo-a20` `--primitive-color-photo-a65` `--primitive-gradient-photo-top` |
| `--color-scrim` | Стрічка кімнат | 1 | — | `--primitive-color-ink-a45` |
| `--color-scrollbar-thumb` | усі 5 (глобальне правило) | 5 | — | `--primitive-color-cream-a28` `--primitive-color-ink-a28` |
| `--color-scrollbar-thumb-hover` | усі 5 (глобальне правило) | 5 | — | `--primitive-color-cream-a45` `--primitive-color-ink-a45` |
| `--color-shadow-hover` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--elevation-hover` | `--primitive-color-green-500-a15` `--primitive-color-green-600-a15` |
| `--color-shadow-hover-secondary` | Стрічка кімнат, Анкета сумісності, Заявка | — | `--elevation-hover-secondary` | `--primitive-color-cream-300-a15` `--primitive-color-ink-700-a15` |
| `--color-surface-sunken` | Стрічка кімнат, Анкета сумісності, Заявка, Чати | 14 | — | `--primitive-color-cream-400` `--primitive-color-ink-700` |
| `--color-text-primary` | усі 5 (глобальне правило) | 46 | — | `--primitive-color-cream-050` `--primitive-color-ink-900` |
| `--color-text-primary-support` | усі 5 | 21 | — | `--primitive-color-cream-300` `--primitive-color-ink-700` |
| `--color-text-secondary` | усі 5 | 65 | — | `--primitive-color-cream-300` `--primitive-color-ink-600` |
| `--color-transparent` | усі 5 (глобальне правило) | 42 | — | `--primitive-color-transparent` |
| `--color-trust` | Стрічка кімнат, Картка оголошення, Заявка | 11 | — | `--primitive-color-green-100` `--primitive-color-green-800` |
| `--color-trust-background` | Стрічка кімнат, Картка оголошення, Заявка | 8 | — | `--primitive-color-green-100` `--primitive-color-green-700` |
| `--color-waiting` | Чати | 1 | — | `--primitive-color-amber-800` `--primitive-color-cream-200` |
| `--color-waiting-background` | Картка оголошення, Чати | 2 | — | `--primitive-color-amber-800` `--primitive-color-cream-200` |
| `--dur-base` | Стрічка кімнат | 1 | — | `--primitive-duration-200` |
| `--dur-fast` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 13 | — | `--primitive-duration-120` |
| `--dur-hover` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 13 | — | `--primitive-duration-320` |
| `--dur-reduced` | усі 5 (глобальне правило) | 6 | — | `--primitive-duration-001` |
| `--dur-slow` | Стрічка кімнат | 1 | — | `--primitive-duration-320` |
| `--ease-enter` | Стрічка кімнат | 2 | — | `--primitive-ease-out` |
| `--ease-loop` | Стрічка кімнат | 1 | — | `--primitive-ease-linear` |
| `--ease-standard` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 13 | — | `--primitive-ease-in-out` |
| `--elevation-card` | усі 5 | 7 | — | — |
| `--elevation-hover` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 13 | — | `--primitive-color-green-500-a15` `--primitive-color-green-600-a15` `--primitive-length-12` `--primitive-length-4` |
| `--elevation-hover-secondary` | Стрічка кімнат, Анкета сумісності, Заявка | 7 | — | `--primitive-color-cream-300-a15` `--primitive-color-ink-700-a15` `--primitive-length-12` `--primitive-length-4` |
| `--elevation-lift` | усі 5 | 11 | — | — |
| `--elevation-primary` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 13 | — | — |
| `--measure-headline` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Чати | 4 | — | `--primitive-width-22ch` |
| `--measure-hint` | усі 5 | 12 | — | `--primitive-width-60ch` |
| `--move-sm` | Стрічка кімнат | 2 | — | `--primitive-length-0` `--primitive-length-4` |
| `--opacity-disabled` | усі 5 | 49 | — | `--primitive-opacity-55` |
| `--press-scale` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 13 | — | `--primitive-scale-098` `--primitive-scale-100` |
| `--press-scale-sm` | Стрічка кімнат, Заявка | 3 | — | `--primitive-scale-096` `--primitive-scale-100` |
| `--pulse-opacity` | Стрічка кімнат | 1 | — | `--primitive-opacity-60` |
| `--radius-card` | усі 5 | 11 | — | `--primitive-length-14` |
| `--radius-circle` | усі 5 | 26 | — | `--primitive-radius-circle` |
| `--radius-context` | Анкета сумісності, Заявка | 2 | — | `--primitive-length-20` |
| `--radius-control` | усі 5 | 32 | — | `--primitive-length-10` |
| `--radius-field` | Стрічка кімнат, Анкета сумісності, Заявка | 7 | — | `--primitive-length-10` |
| `--radius-hero` | усі 5 | 11 | — | `--primitive-length-18` |
| `--radius-mark` | усі 5 | 5 | — | `--primitive-length-8` |
| `--radius-pill` | усі 5 (глобальне правило) | 19 | — | `--primitive-radius-pill` |
| `--radius-sheet` | Стрічка кімнат | 1 | — | `--primitive-length-18` |
| `--radius-track` | Стрічка кімнат | 1 | — | `--primitive-length-16` |
| `--ratio-gallery-media` | Картка оголошення | 1 | — | — |
| `--ratio-listing-media` | Стрічка кімнат, Анкета сумісності, Заявка | 3 | — | — |
| `--ratio-listing-thumb` | Стрічка кімнат | 1 | — | — |
| `--size-choice-compact` | Стрічка кімнат | 1 | — | `--primitive-length-32` |
| `--size-choice-mark-compact` | Стрічка кімнат | 1 | — | `--primitive-length-18` |
| `--size-control` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 19 | — | `--primitive-length-50` |
| `--size-control-compact` | Стрічка кімнат | 1 | — | `--primitive-length-44` |
| `--size-detail-aside` | Картка оголошення | 3 | — | `--primitive-length-360` |
| `--size-detail-max` | усі 5 | 10 | — | `--container-max` |
| `--size-listing-thumb` | Стрічка кімнат | 2 | — | `--primitive-length-96` |
| `--size-page-aside` | Картка оголошення, Анкета сумісності, Заявка, Чати | 3 | `--size-detail-aside` | `--primitive-length-360` |
| `--size-page-max` | усі 5 | 11 | `--size-detail-max` | `--container-max` |
| `--size-panel-min` | Стрічка кімнат | 3 | — | `--primitive-length-360` |
| `--size-scrollport` | Стрічка кімнат | 2 | — | `--primitive-height-100dvh` |
| `--size-segmented-max` | Стрічка кімнат | 1 | — | `--primitive-length-360` |
| `--size-side-panel` | усі 5 | 5 | — | `--primitive-length-360` |
| `--size-single-column` | усі 5 | 5 | — | `--primitive-length-608` |
| `--size-split-detail-min` | Стрічка кімнат | 1 | — | `--primitive-length-480` |
| `--size-split-list` | Стрічка кімнат | 1 | — | `--primitive-length-360` |
| `--size-split-list-min` | Стрічка кімнат | 1 | — | `--primitive-length-288` |
| `--size-tabbar` | усі 5 | 10 | `--space-tabbar-clearance` | `--primitive-length-70` |
| `--size-tap` | усі 5 | 41 | `--size-control-compact` | `--primitive-length-44` |
| `--space-card-block` | усі 5 | 10 | — | `--primitive-length-16` |
| `--space-card-inline` | усі 5 | 10 | — | `--primitive-length-16` |
| `--space-control-block` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 17 | — | `--primitive-length-12` |
| `--space-control-inline` | усі 5 | 24 | — | `--primitive-length-16` |
| `--space-detail-column-gap` | Картка оголошення, Анкета сумісності, Заявка, Чати | 6 | — | `--primitive-length-24` |
| `--space-grid-gap` | Стрічка кімнат | 1 | — | `--grid-gap` |
| `--space-screen-gutter` | усі 5 | 32 | — | `--primitive-length-16` |
| `--space-scroll-end` | усі 5 | 5 | `--space-tabbar-clearance` | `--primitive-length-24` |
| `--space-section-gap` | усі 5 | 14 | — | `--primitive-length-16` |
| `--space-stack-lg` | усі 5 | 12 | — | `--primitive-length-16` |
| `--space-stack-md` | усі 5 (глобальне правило) | 31 | — | `--primitive-length-12` |
| `--space-stack-sm` | усі 5 (глобальне правило) | 53 | — | `--primitive-length-8` |
| `--space-stack-xl` | Стрічка кімнат | 2 | — | `--primitive-length-24` |
| `--space-stack-xs` | усі 5 | 37 | — | `--primitive-length-6` |
| `--space-stack-xxl` | Стрічка кімнат | 1 | — | `--primitive-length-32` |
| `--space-stack-xxs` | Стрічка кімнат | 2 | — | `--primitive-length-2` |
| `--space-tabbar-clearance` | усі 5 | 5 | — | `--primitive-length-24` `--primitive-length-70` |
| `--space-tabbar-edge` | усі 5 | 5 | `--space-tabbar-clearance` | `--primitive-length-24` |
| `--type-appbar` | Картка оголошення, Анкета сумісності, Заявка | 3 | — | `--primitive-font-family-display` `--primitive-font-weight-700` `--primitive-length-15` `--primitive-line-height-120` |
| `--type-body` | усі 5 (глобальне правило) | 12 | — | `--primitive-font-family-text` `--primitive-font-weight-400` `--primitive-length-15` `--primitive-line-height-150` |
| `--type-brand` | усі 5 | 5 | — | `--primitive-font-family-display` `--primitive-font-weight-800` `--primitive-length-18` `--primitive-line-height-1` |
| `--type-card-title` | Стрічка кімнат, Анкета сумісності, Заявка | 6 | — | `--primitive-font-family-display` `--primitive-font-weight-700` `--primitive-length-16` `--primitive-line-height-130` |
| `--type-chip` | Стрічка кімнат, Картка оголошення | 8 | — | `--primitive-font-family-display` `--primitive-font-weight-700` `--primitive-length-12` `--primitive-line-height-120` |
| `--type-control` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 14 | — | `--primitive-font-family-display` `--primitive-font-weight-700` `--primitive-length-15` `--primitive-line-height-130` |
| `--type-control-compact` | Стрічка кімнат, Заявка, Чати | 4 | — | `--primitive-font-family-display` `--primitive-font-weight-700` `--primitive-length-14` `--primitive-line-height-130` |
| `--type-detail-title` | Стрічка кімнат, Картка оголошення, Заявка | 3 | — | `--primitive-font-family-display` `--primitive-font-weight-800` `--primitive-length-20` `--primitive-line-height-120` |
| `--type-field-label` | Стрічка кімнат, Заявка | 5 | — | `--primitive-font-family-display` `--primitive-font-weight-600` `--primitive-length-14` `--primitive-line-height-135` |
| `--type-footer` | усі 5 | 5 | — | `--primitive-font-family-text` `--primitive-font-weight-400` `--primitive-length-12` `--primitive-line-height-140` |
| `--type-input` | Стрічка кімнат, Анкета сумісності, Заявка | 18 | — | `--primitive-font-family-text` `--primitive-font-weight-400` `--primitive-length-16` `--primitive-line-height-150` |
| `--type-leading-icon-only` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 4 | — | `--primitive-line-height-0` |
| `--type-leading-nav` | усі 5 | 15 | — | `--primitive-line-height-115` |
| `--type-meta` | усі 5 | 32 | — | `--primitive-font-family-text` `--primitive-font-weight-400` `--primitive-length-13` `--primitive-line-height-145` |
| `--type-nav` | усі 5 | 15 | — | `--primitive-font-family-display` `--primitive-font-weight-600` `--primitive-length-12` `--primitive-line-height-120` |
| `--type-overline` | Анкета сумісності, Заявка | 2 | — | `--primitive-font-family-display` `--primitive-font-weight-700` `--primitive-length-11` `--primitive-line-height-120` |
| `--type-page-title` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Чати | 4 | — | `--primitive-font-family-display` `--primitive-font-weight-800` `--primitive-length-24` `--primitive-line-height-115` |
| `--type-page-title-wide` | усі 5 | 5 | — | `--primitive-font-family-display` `--primitive-font-weight-800` `--primitive-length-32` `--primitive-line-height-115` |
| `--type-price` | Стрічка кімнат, Картка оголошення | 2 | — | `--primitive-font-family-display` `--primitive-font-weight-800` `--primitive-length-18` `--primitive-line-height-115` |
| `--type-price-hero` | Картка оголошення | 1 | — | `--primitive-font-family-display` `--primitive-font-weight-800` `--primitive-length-22` `--primitive-line-height-115` |
| `--type-section-title` | усі 5 | 5 | — | `--primitive-font-family-display` `--primitive-font-weight-700` `--primitive-length-17` `--primitive-line-height-130` |
| `--type-size-badge` | Чати | 2 | — | `--primitive-length-11` |
| `--type-size-caption` | Чати | 1 | — | `--primitive-length-12` |
| `--type-support` | усі 5 | 21 | — | `--primitive-font-family-text` `--primitive-font-weight-400` `--primitive-length-14` `--primitive-line-height-145` |
| `--type-tracking-display` | усі 5 | 12 | — | `--primitive-letter-spacing-n02` |
| `--type-tracking-nav` | усі 5 | 15 | — | `--primitive-letter-spacing-n03` |
| `--type-tracking-overline` | Анкета сумісності, Заявка | 2 | — | `--primitive-letter-spacing-07` |
| `--type-underline-offset` | усі 5 | 32 | — | `--primitive-letter-spacing-02` |
| `--z-below` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 13 | — | `--primitive-z-n1` |
| `--z-dock` | усі 5 | 5 | — | `--primitive-z-30` |
| `--z-overlay` | усі 5 | 7 | — | `--primitive-z-2` |
| `--z-raised` | Стрічка кімнат | 3 | — | `--primitive-z-1` |
| `--z-sheet` | Стрічка кімнат | 1 | — | `--primitive-z-950` |
| `--z-sheet-backdrop` | Стрічка кімнат | 1 | — | `--primitive-z-940` |

### Primitive-токени

Primitive напряму читають лише компоненти (геометрія, іконки, font-weight — `AGENTS.md`);
решта приходить через semantic.

| Токен | Екрани | Читають напряму (елементів) | Через |
|---|---|---|---|
| `--bp-desktop` | усі 5 (глобальне правило) | 105 | — |
| `--bp-listing-compact` | Стрічка кімнат | 1 | — |
| `--bp-tablet` | усі 5 (глобальне правило) | 37 | — |
| `--col-count-desktop` | Стрічка кімнат | 1 | — |
| `--col-count-tablet` | Стрічка кімнат | 1 | — |
| `--container-max` | усі 5 | 1 | `--size-detail-max` `--size-page-max` |
| `--grid-gap` | Стрічка кімнат | — | `--space-grid-gap` |
| `--primitive-color-amber-800` | Картка оголошення, Чати | — | `--color-waiting` `--color-waiting-background` |
| `--primitive-color-blue-700` | усі 5 | — | `--color-focus` |
| `--primitive-color-cream-050` | усі 5 | — | `--color-current-text` `--color-interactive-text-active` `--color-on-action` `--color-text-primary` |
| `--primitive-color-cream-100` | усі 5 | — | `--color-appbar-control` `--color-page-background` |
| `--primitive-color-cream-200` | Картка оголошення, Чати | — | `--color-waiting` `--color-waiting-background` |
| `--primitive-color-cream-300` | усі 5 | — | `--color-card-hover-background` `--color-claim-background` `--color-field-hover` `--color-interactive-surface-hover` `--color-text-primary-support` `--color-text-secondary` |
| `--primitive-color-cream-300-a15` | Стрічка кімнат, Анкета сумісності, Заявка | — | `--elevation-hover-secondary` |
| `--primitive-color-cream-350` | усі 5 | — | `--color-page-outer-background` |
| `--primitive-color-cream-400` | Стрічка кімнат, Анкета сумісності, Заявка, Чати | — | `--color-surface-sunken` |
| `--primitive-color-cream-500` | Картка оголошення | — | `--color-divider` |
| `--primitive-color-cream-a28` | усі 5 | — | `--color-scrollbar-thumb` |
| `--primitive-color-cream-a45` | усі 5 | — | `--color-scrollbar-thumb-hover` |
| `--primitive-color-current` | усі 5 | — | `--color-icon-current` |
| `--primitive-color-green-050` | Стрічка кімнат | — | `--color-info-background` |
| `--primitive-color-green-100` | усі 5 | — | `--color-card-active-background` `--color-divider` `--color-interactive-text-hover` `--color-trust` `--color-trust-background` |
| `--primitive-color-green-200` | усі 5 | — | `--color-accent` `--color-action` `--color-avatar-background` `--color-focus` `--color-interactive-surface-active` |
| `--primitive-color-green-300` | усі 5 | — | `--color-current-background` |
| `--primitive-color-green-500` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--color-action-surface-hover` |
| `--primitive-color-green-500-a15` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--elevation-hover` |
| `--primitive-color-green-600` | усі 5 | — | `--color-accent` `--color-action-surface` `--color-action-surface-hover` `--color-current-background` `--color-hairline` |
| `--primitive-color-green-600-a15` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--elevation-hover` |
| `--primitive-color-green-700` | усі 5 | — | `--color-action` `--color-action-surface` `--color-avatar-background` `--color-brand-mark` `--color-card-active-background` `--color-trust-background` |
| `--primitive-color-green-800` | Стрічка кімнат, Картка оголошення, Заявка | — | `--color-trust` |
| `--primitive-color-green-900` | усі 5 | — | `--color-action-surface-active` `--color-appbar-surface` `--color-card-background` `--color-card-hover-background` `--color-claim-background` `--color-current-text` `--color-field-hover` `--color-glass-background` `--color-info-background` `--color-interactive-surface-active` `--color-interactive-text-hover` `--color-page-outer-background` |
| `--primitive-color-ink-600` | усі 5 | — | `--color-text-secondary` |
| `--primitive-color-ink-700` | усі 5 | — | `--color-card-subdued-background` `--color-field-focus` `--color-interactive-surface-hover` `--color-surface-sunken` `--color-text-primary-support` |
| `--primitive-color-ink-700-a15` | Стрічка кімнат, Анкета сумісності, Заявка | — | `--elevation-hover-secondary` |
| `--primitive-color-ink-900` | усі 5 | — | `--color-action-surface-active` `--color-appbar-control` `--color-interactive-text-active` `--color-page-background` `--color-text-primary` |
| `--primitive-color-ink-a10` | Заявка | — | `--color-hairline` |
| `--primitive-color-ink-a28` | усі 5 | — | `--color-scrollbar-thumb` |
| `--primitive-color-ink-a45` | усі 5 | — | `--color-scrim` `--color-scrollbar-thumb-hover` |
| `--primitive-color-orange-700` | Чати | — | `--color-notification` |
| `--primitive-color-photo-a20` | Стрічка кімнат | — | `--color-media-hover-overlay` `--color-photo-scrim` |
| `--primitive-color-photo-a65` | Стрічка кімнат | — | `--color-photo-scrim` |
| `--primitive-color-red-050` | Стрічка кімнат, Картка оголошення | — | `--color-danger` `--color-danger-background` |
| `--primitive-color-red-700` | Стрічка кімнат, Картка оголошення | — | `--color-danger` `--color-danger-background` |
| `--primitive-color-transparent` | усі 5 | — | `--color-transparent` |
| `--primitive-color-white` | усі 5 | — | `--color-appbar-surface` `--color-card-background` `--color-card-subdued-background` `--color-field-focus` `--color-on-action` |
| `--primitive-color-white-a20` | Стрічка кімнат | — | `--color-media-hover-overlay` |
| `--primitive-color-white-a86` | Стрічка кімнат | — | `--color-glass-background` |
| `--primitive-duration-001` | усі 5 | — | `--dur-reduced` |
| `--primitive-duration-120` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--dur-fast` |
| `--primitive-duration-200` | Стрічка кімнат | — | `--dur-base` |
| `--primitive-duration-320` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--dur-hover` `--dur-slow` |
| `--primitive-ease-in-out` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--ease-standard` |
| `--primitive-ease-linear` | Стрічка кімнат | — | `--ease-loop` |
| `--primitive-ease-out` | Стрічка кімнат | — | `--ease-enter` |
| `--primitive-font-family-display` | усі 5 | — | `--type-appbar` `--type-brand` `--type-card-title` `--type-chip` `--type-control` `--type-control-compact` `--type-detail-title` `--type-field-label` `--type-nav` `--type-overline` `--type-page-title` `--type-page-title-wide` `--type-price` `--type-price-hero` `--type-section-title` |
| `--primitive-font-family-text` | усі 5 | — | `--type-body` `--type-footer` `--type-input` `--type-meta` `--type-support` |
| `--primitive-font-weight-400` | усі 5 | — | `--type-body` `--type-footer` `--type-input` `--type-meta` `--type-support` |
| `--primitive-font-weight-500` | Стрічка кімнат, Картка оголошення | 3 | — |
| `--primitive-font-weight-600` | усі 5 | 14 | `--type-field-label` `--type-nav` |
| `--primitive-font-weight-700` | усі 5 | 23 | `--type-appbar` `--type-card-title` `--type-chip` `--type-control` `--type-control-compact` `--type-overline` `--type-section-title` |
| `--primitive-font-weight-800` | усі 5 | — | `--type-brand` `--type-detail-title` `--type-page-title` `--type-page-title-wide` `--type-price` `--type-price-hero` |
| `--primitive-gradient-photo-top` | Стрічка кімнат | — | `--color-photo-scrim` |
| `--primitive-height-100dvh` | Стрічка кімнат | — | `--size-scrollport` |
| `--primitive-height-60dvh` | Стрічка кімнат | 1 | — |
| `--primitive-height-82dvh` | Стрічка кімнат | 1 | — |
| `--primitive-icon-back` | Картка оголошення, Анкета сумісності, Заявка | 3 | — |
| `--primitive-icon-brand` | усі 5 | 5 | — |
| `--primitive-icon-calendar` | Стрічка кімнат | 1 | — |
| `--primitive-icon-chat-empty` | Заявка | 1 | — |
| `--primitive-icon-chats` | усі 5 | 5 | — |
| `--primitive-icon-check` | Стрічка кімнат, Картка оголошення, Заявка | 9 | — |
| `--primitive-icon-close` | Стрічка кімнат | 1 | — |
| `--primitive-icon-down` | Стрічка кімнат | 3 | — |
| `--primitive-icon-home` | усі 5 | 15 | — |
| `--primitive-icon-pin` | усі 5 | 12 | — |
| `--primitive-icon-profile` | усі 5 | 5 | — |
| `--primitive-icon-shield` | Картка оголошення, Заявка | 6 | — |
| `--primitive-icon-shield-warning` | Картка оголошення | 1 | — |
| `--primitive-icon-tuning` | Стрічка кімнат | 1 | — |
| `--primitive-icon-warning` | Стрічка кімнат, Картка оголошення | 3 | — |
| `--primitive-length-0` | Стрічка кімнат | 1 | `--move-sm` |
| `--primitive-length-1` | усі 5 | 53 | — |
| `--primitive-length-10` | усі 5 (глобальне правило) | 12 | `--radius-control` `--radius-field` |
| `--primitive-length-11` | усі 5 | 6 | `--type-overline` `--type-size-badge` |
| `--primitive-length-12` | усі 5 (глобальне правило) | 24 | `--elevation-hover` `--elevation-hover-secondary` `--space-control-block` `--space-stack-md` `--type-chip` `--type-footer` `--type-nav` `--type-size-caption` |
| `--primitive-length-120` | Анкета сумісності, Заявка | 2 | — |
| `--primitive-length-13` | усі 5 | 4 | `--type-meta` |
| `--primitive-length-14` | усі 5 | 17 | `--radius-card` `--type-control-compact` `--type-field-label` `--type-support` |
| `--primitive-length-15` | усі 5 | — | `--type-appbar` `--type-body` `--type-control` |
| `--primitive-length-16` | усі 5 | 9 | `--radius-track` `--space-card-block` `--space-card-inline` `--space-control-inline` `--space-screen-gutter` `--space-section-gap` `--space-stack-lg` `--type-card-title` `--type-input` |
| `--primitive-length-17` | усі 5 | — | `--type-section-title` |
| `--primitive-length-18` | усі 5 | 1 | `--radius-hero` `--radius-sheet` `--size-choice-mark-compact` `--type-brand` `--type-price` |
| `--primitive-length-2` | усі 5 (глобальне правило) | 63 | `--space-stack-xxs` |
| `--primitive-length-20` | усі 5 | 24 | `--radius-context` `--type-detail-title` |
| `--primitive-length-22` | усі 5 | 11 | `--type-price-hero` |
| `--primitive-length-24` | усі 5 | 22 | `--space-detail-column-gap` `--space-scroll-end` `--space-stack-xl` `--space-tabbar-clearance` `--space-tabbar-edge` `--type-page-title` |
| `--primitive-length-280` | Стрічка кімнат, Картка оголошення | 2 | — |
| `--primitive-length-288` | Стрічка кімнат | — | `--size-split-list-min` |
| `--primitive-length-3` | усі 5 (глобальне правило) | 74 | — |
| `--primitive-length-30` | усі 5 | 14 | — |
| `--primitive-length-32` | усі 5 | — | `--size-choice-compact` `--space-stack-xxl` `--type-page-title-wide` |
| `--primitive-length-34` | Стрічка кімнат | 1 | — |
| `--primitive-length-360` | усі 5 | — | `--size-detail-aside` `--size-page-aside` `--size-panel-min` `--size-segmented-max` `--size-side-panel` `--size-split-list` |
| `--primitive-length-38` | усі 5 | 8 | — |
| `--primitive-length-390` | усі 5 | 11 | — |
| `--primitive-length-4` | усі 5 | 16 | `--elevation-hover` `--elevation-hover-secondary` `--move-sm` |
| `--primitive-length-44` | усі 5 | — | `--size-control-compact` `--size-tap` |
| `--primitive-length-48` | Стрічка кімнат, Картка оголошення, Заявка, Чати | 5 | — |
| `--primitive-length-480` | Стрічка кімнат | — | `--size-split-detail-min` |
| `--primitive-length-5` | усі 5 | 14 | — |
| `--primitive-length-50` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--size-control` |
| `--primitive-length-52` | Чати | 4 | — |
| `--primitive-length-58` | усі 5 | 15 | — |
| `--primitive-length-6` | усі 5 | 8 | `--space-stack-xs` |
| `--primitive-length-60` | усі 5 | 5 | — |
| `--primitive-length-608` | усі 5 | — | `--size-single-column` |
| `--primitive-length-7` | Стрічка кімнат, Картка оголошення | 6 | — |
| `--primitive-length-70` | усі 5 | — | `--size-tabbar` `--space-tabbar-clearance` |
| `--primitive-length-700` | усі 5 | 6 | — |
| `--primitive-length-72` | Анкета сумісності, Заявка | 4 | — |
| `--primitive-length-8` | усі 5 | 8 | `--radius-mark` `--space-stack-sm` |
| `--primitive-length-80` | Анкета сумісності, Заявка | 4 | — |
| `--primitive-length-84` | Анкета сумісності, Заявка | 2 | — |
| `--primitive-length-9` | Стрічка кімнат, Картка оголошення | 6 | — |
| `--primitive-length-96` | Стрічка кімнат | — | `--size-listing-thumb` |
| `--primitive-length-n1` | Стрічка кімнат, Анкета сумісності | 3 | — |
| `--primitive-length-n2` | Картка оголошення, Анкета сумісності, Заявка | 3 | — |
| `--primitive-letter-spacing-02` | усі 5 | — | `--type-underline-offset` |
| `--primitive-letter-spacing-07` | Анкета сумісності, Заявка | — | `--type-tracking-overline` |
| `--primitive-letter-spacing-n02` | усі 5 | — | `--type-tracking-display` |
| `--primitive-letter-spacing-n03` | усі 5 | — | `--type-tracking-nav` |
| `--primitive-line-height-0` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--type-leading-icon-only` |
| `--primitive-line-height-1` | усі 5 | — | `--type-brand` |
| `--primitive-line-height-115` | усі 5 | — | `--type-leading-nav` `--type-page-title` `--type-page-title-wide` `--type-price` `--type-price-hero` |
| `--primitive-line-height-120` | усі 5 | — | `--type-appbar` `--type-chip` `--type-detail-title` `--type-nav` `--type-overline` |
| `--primitive-line-height-130` | усі 5 | — | `--type-card-title` `--type-control` `--type-control-compact` `--type-section-title` |
| `--primitive-line-height-135` | Стрічка кімнат, Заявка | — | `--type-field-label` |
| `--primitive-line-height-140` | усі 5 | — | `--type-footer` |
| `--primitive-line-height-145` | усі 5 | — | `--type-meta` `--type-support` |
| `--primitive-line-height-150` | усі 5 | — | `--type-body` `--type-input` |
| `--primitive-opacity-55` | усі 5 | — | `--opacity-disabled` |
| `--primitive-opacity-60` | Стрічка кімнат | — | `--pulse-opacity` |
| `--primitive-radius-circle` | усі 5 | — | `--radius-circle` |
| `--primitive-radius-pill` | усі 5 | — | `--radius-pill` |
| `--primitive-scale-096` | Стрічка кімнат, Заявка | — | `--press-scale-sm` |
| `--primitive-scale-098` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--press-scale` |
| `--primitive-scale-100` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--press-scale` `--press-scale-sm` |
| `--primitive-width-105pct` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | 14 | — |
| `--primitive-width-22ch` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Чати | — | `--measure-headline` |
| `--primitive-width-50pct` | усі 5 | 23 | — |
| `--primitive-width-60ch` | усі 5 | — | `--measure-hint` |
| `--primitive-width-fr-072` | Анкета сумісності | 1 | — |
| `--primitive-width-fr-128` | Анкета сумісності | 1 | — |
| `--primitive-width-full` | усі 5 (глобальне правило) | 55 | — |
| `--primitive-z-1` | Стрічка кімнат | — | `--z-raised` |
| `--primitive-z-2` | усі 5 | — | `--z-overlay` |
| `--primitive-z-30` | усі 5 | — | `--z-dock` |
| `--primitive-z-940` | Стрічка кімнат | — | `--z-sheet-backdrop` |
| `--primitive-z-950` | Стрічка кімнат | — | `--z-sheet` |
| `--primitive-z-n1` | Стрічка кімнат, Картка оголошення, Анкета сумісності, Заявка | — | `--z-below` |

### Не читаються на жодному екрані

Зміна цих токенів 5 екранів не зачепить: на них не посилається жодне правило, що
застосовується до елементів карти, ані інший такий токен. Вони можуть працювати в docs, у
вітринах `ui/`, у станах, яких на екранах немає, або бути запасом:

`--ease-exit` `--measure-state` `--move-md` `--primitive-ease-in` `--primitive-icon-document` `--primitive-icon-forward` `--primitive-length-104` `--primitive-length-1120` `--primitive-length-56` `--primitive-length-64` `--primitive-width-32ch` `--primitive-width-42ch` `--type-size-support`
