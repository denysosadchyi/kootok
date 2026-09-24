# Backlog дизайн-системи

## Закрито (2026-09-24)

- **Шторка фільтрів** — `components/sheet.css` (`kit-sheet*`, `kit-sheet-backdrop`,
  `html.kit-sheet-open`), docs: `docs/sheet.html`. Раніше жила в
  `_base.css` прототипу.
- **Прогрес кроків і статус чернетки** — `components/progress.css`
  (`kit-progress*`, `kit-draft-status`), docs: `docs/progress.html`.
- **Крок форми й розділені дії** — `kit-step`, `kit-step__intro`,
  `kit-actions--split` у `components/layout.css`; перший патерн
  `patterns/apply-step.md`.
- **Мета-стан прототипу** — `kit-card--prototype` (замість `kit-prototype-result`).
- **Dock за IA** — `kit-tabbar` 3 пункти (шукачка); таби «Сумісність», «Заявка» й
  кнопку «Додати» з dock прибрано.
- **Іконки select/date** — mask у `currentColor`; 4 SVG з вшитим кольором видалено.
- **Глобальний `[hidden]`** — у `base.css`.
- **Анімації прибрано (2026-09-24)** — анімацій у продукті немає: токени тривалості видалено, шторка відкривається миттєво.

## Прибрано: «лише те, що в макетах» (2026-09-24)

Правило: у системі (CSS, docs, токени, іконки, вітрини `ui/`) лишається тільки те,
що використовують 5 макетів — `lesson-6/{listings,listing,compatibility-form,application}.html`
і `examples/chats.html` (разом із розміткою, яку додає `course-nav.js`). Стани
використаних компонентів (hover/active/focus-visible/disabled, помилка поля) лишено в
обох темах. Прибране відновлюється з git, якщо з'явиться в макеті.

- **Модулі (17 → 16):** `skeleton.css` + `docs/skeleton.html` — станів
  завантаження в макетах немає.
- **Компоненти й елементи:** `kit-card--hero`, `kit-hero-fact`, `kit-profile-proof`,
  `kit-profile-status`, `kit-card--tint`; бульбашки `kit-messages`/`kit-message*`,
  `kit-composer`, `kit-icon-button` (екрана розмови немає); OTP `kit-code*`;
  `kit-fab` (дублював кнопку «Фільтри» в toolbar і перекривав картки — тригер тепер
  лише кнопка в toolbar); `kit-appbar-avatar`, `kit-shell__action`, `kit-req`,
  `kit-choice__text`, `kit-choice__hint`, `kit-state-context`, утиліти `kit-nowrap`,
  `kit-compact`, `kit-label`, `kit-card__title` (роль card-title лишається за
  `fieldset > legend`; docs-хром має власний `docs-card-title`).
- **Варіанти:** `kit-button--quiet`, `kit-actions--row`, `kit-shell--bare`,
  `kit-tabbar--host`, `kit-tab--listings`, `kit-tag--muted`, `kit-tag--lime`,
  `kit-chip--current`, `kit-note--success`, `kit-note--error`, `kit-state--error`,
  `kit-state__icon--shield|--profile|--closed` (і базова іконка filter),
  `kit-listing--closed`, `kit-listing__photo--portrait`, `kit-listing__foot`,
  `kit-avatar--xs`, `kit-gallery--inset`, `kit-choice--stacked`,
  `kit-chat-row--declined`, `kit-trust-list li.is-missing`, radio-варіант
  `kit-segmented`, `h2.kit-meta`, `kit-person__name:last-child`.
- **Стани «disabled» для статичного вмісту:** рядки «Чатів» тепер статичні
  `div.kit-chat-row` звичайного вигляду замість вимкнених посилань;
  `.kit-chat-row[aria-disabled]` і `.kit-listing[aria-disabled]` прибрано. Вимкненими
  лишаються лише справжні контроли: таб «Профіль», сегмент «Люди», посилання
  «Профіль Марії».
- **Токени (252 → 218; з двома новими appbar-токенами — 220; після пізніших
  правок і semantic-ролей `--type-*`/`--measure-*`/`--z-*` зараз 131 primitive +
  114 semantic = 245, рахує `ui/tokens.html`):** 34 невжиті —
  `--color-action-surface-deep`, `--color-hero-surface`, `--color-on-action-secondary`,
  `--color-avatar-ring`, `--color-avatar-overlay`, `--color-skeleton-background`,
  `--radius-bubble`, `--radius-bubble-tail`, `--radius-composer`, 2 градієнти,
  2 кольори з альфою, 3 довжини, 10 відносних ширин і 8 icon-токенів
  (`listings` лишився файлом — його споживає `--primitive-icon-document`).
- **Іконки (21 → 14 SVG; разом із власним `brand.svg` у `tokens/icons/` зараз 15):** `add`, `plus`, `send`, `success`, `closed`, `danger`,
  `filter`.
- **Нові рішення в тому ж batch:** appbar — біла панель на всю ширину
  (`--color-appbar-surface`) з «Назад» кольору полотна (`--color-appbar-control`);
  рядок прикріпленої анкети `kit-application-choice` (__title, __meta, «Змінити»
  secondary compact 44px) замість chip + сирого посилання.

## Відкрито

- **Зображення без місця в кіті** — `visuals/manifest.md` передбачає аватар
  Марічки (авторка анкети й заявок на «Сумісності», «Заявці», «Чатах») і фото
  кімнат Дмитра й Мар'яни як контекст рядка чату. Файли вже лежать у
  `lesson-6/assets/{avatars,rooms}/`, але чинні компоненти не мають для них
  слоту: потрібен варіант `kit-chat-row` з мініатюрою кімнати й композиція
  «від кого заявка» — спершу в `components/` + `docs/` в обох темах, потім на
  екранах.
- **Desktop-адаптація** — продуктове полотно поки 390px; адаптив до десктопу не
  спроєктовано.
- **Темна тема** — `[data-theme="dark"]` лишається stress-test семантичного шару,
  не прийнятою продуктовою темою.
- **Залишкові primitive у components** — окремі `font-size` через
  `--primitive-length-*` (час/мета в чаті, лічильник непрочитаного, trust-list)
  ще не зведені до `--type-*` ролей.
- **Маршрути чатів і профілю** — у `examples/chats.html` рядки чатів статичні
  (`div.kit-chat-row`), таб «Профіль» — `aria-disabled` без `href`; після появи
  екранів додати реальні посилання (рядок стає `a.kit-chat-row[href]`).
