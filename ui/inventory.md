# UI inventory «Кутка»

Джерело інвентарю — усі 60 продуктових HTML-екранів у `research/wireframes/` (15 сімей × основний, empty, error і loading стани) та звірка назв і scope із `sitemap.md`. Стан — після третього проходу уроку 7 (мова доведена до продуктового рівня: тіні, шкала, чотири голоси пігулок, ціна на фото; причини — `DESIGN.md`). Службові `research/wireframes/_nav.html` і `_template.html` теж переглянуто, але їхні sidebar, annotation, state switcher і рамка телефона не є частиною продукту.

У таблицях — лише патерни, які фактично присутні щонайменше на двох HTML-екранах. Колонка «Клас у кіті» вказує, чим компонент зібрано в `ui/kit.css` (вітрина — `ui/kit.html`); додаткові компоненти оболонки (`.kit-shell`, `.kit-footer`, `.kit-section`, `.kit-sheet`, `.kit-person`, `.kit-profile-*`) описані у вітрині. Запис `family*.html` означає реальні файли `family.html`, `family-empty.html`, `family-error.html` і `family-loading.html`, але в колонці «Стани» зазначено лише ті варіанти, де компонент справді стоїть.

## Навігація

| Компонент | На яких екранах зустрічається | Стани | Потрібне фото | Клас у кіті |
|---|---|---|---|---|
| Верхня панель екрана | Усі 60 продуктових `*.html` | коренева з назвою; вкладена з дією «Назад» | Ні | `.kit-shell__brand` (корінь: лаймова марка + «Куток», пігулка міста з піном; display-заголовок `h1.kit-headline` у тілі) · `.kit-shell__appbar` + `.kit-shell__title` (вкладені, прозорий; бренд-рядок тоді ховає сам кіт через `:has`) |
| Кнопка «Назад» | `signup-error.html`, `signup-loading.html`; `filters*.html`; `listing*.html` без `listings*`; `person*.html`; `profile-social-empty.html`, `profile-social-error.html`; `report*.html`; `review*.html` | default; pressed | Ні | `.kit-back` (біле коло 44px із тінню sm, стрілка Solar Linear) |
| Глобальний tab bar | 52 екрани: `chat*.html`, `chats*.html`, `filters*.html`, `listing*.html`, `listings*.html`, `my-listings*.html`, `person*.html`, `profile-edit*.html`, `profile-social*.html`, `report*.html`, `review*.html`, `seekers*.html` | active за поточним розділом (лайм); inactive; pressed; рольовий набір пунктів | Ні | `.kit-tabbar` (скло з blur, тінь lg) + `.kit-tab` (іконка Solar 24 + підпис 11; `--chats`, `--profile`, `--listings`, `--create` — лісове коло з тінню); господар — `.kit-tabbar--host` |
| Сегментований перемикач / локальні таби | `listings*.html`, `seekers*.html`, `filters*.html` | selected; unselected; disabled під час loading | Ні | `.kit-segmented` (заглиблена доріжка на всю ширину, активна пігулка біла з тінню sm; список або radiogroup) |
| Floating action «Фільтри» | `listings*.html`, `seekers*.html` | default; зберігається в empty, error і loading | Ні | `.kit-fab` (`[aria-disabled]` під час loading) |

## Картки й списки

| Компонент | На яких екранах зустрічається | Стани | Потрібне фото | Клас у кіті |
|---|---|---|---|---|
| Картка оголошення | `listings.html`, `my-listings.html`; споріднена картка людини в `seekers.html` | active; archived/closed; verified/unverified; pressed | Так — кімната або людина | `.kit-listing` (radius 22, тінь md) + `__media` (4:3, скрим + теплий тінт; всередині `.kit-price` як скляна пігулка і `.kit-avatar` з кільцем), `__photo` (`--portrait` для людини), `__body` (назва → `.kit-meta--place` з піном → `.kit-facts--inline` → `.kit-tags` → `__foot` з годинником і `.kit-button--link`); `--feed` для stretched link і натискання, `--closed`, `--loading` |
| Список карток | `listings.html`, `seekers.html`, `my-listings.html`, `chats.html` | populated; окремо реалізовані empty і loading | Залежить від карток | `.kit-list` |
| Картка-skeleton | `listings-loading.html`, `seekers-loading.html`, `my-listings-loading.html`, `chats-loading.html` | loading; варіанти room/person/conversation | Ні | `.kit-listing--loading` + `.kit-skeleton` (`--media`, `--avatar`, `--tag`, `--title`, `--price`, `--fact`, `--trust`, `--button`, `--field`, `--bubble`, `--gallery`) |
| Детальне медіа / фотогалерея | `listing*.html`, `person*.html`, `chat*.html`, `report*.html`, `review*.html`; також `chats-error.html`, `chats-loading.html`, `listing-new*.html` крім empty | main photo; gallery; placeholder/loading | Так | `.kit-gallery` (на всю ширину зі snap, кадри 20px із тінню md; + `.kit-skeleton--gallery`) |
| Аватар | `seekers.html`, `person.html`, `person-empty.html`; фото контакту також в `chat*.html`, `report*.html`, `review*.html` | photo; placeholder; loading | Так — людина | `.kit-avatar`, `.kit-avatar-pair`, `.kit-profile-avatar`, `.kit-appbar-avatar` |
| Бейдж верифікації / статусу | `chats.html`, `seekers.html`, `listing.html`, `listing-error.html`, `listing-loading.html`, `person.html`, `person-error.html`, `person-loading.html`, `profile-edit.html`, `profile-social.html`, `review.html` | verified; not verified; application/status variants | Ні | Доказ — `.kit-chip` (заповнений, з галочкою; `--error`, `--muted` без іконки, `--current`, `--video`, `--profile`); статус — `em` у `.kit-chat-copy` (uppercase 10px; `--active` лайм, прийнято зелений, `--waiting` бурштин, `--declined` червоний), `.kit-profile-status`, `.kit-profile-proof` |
| Факти картки | `listings.html`, `seekers.html`, `my-listings.html`, `chats.html`; `listing*.html`, `person*.html` | ціна, район/метро, дата, побутові факти | Ні | `.kit-facts--inline` у картках стрічки (підписи лише для читалки), `.kit-facts--grid` у деталях (плитки «підпис над значенням»), `.kit-facts--table` лишається для підсумків; `.kit-price`, `.kit-meta`; шапка деталей — `.kit-page-head` |
| Chip / тег | `listings.html`, `seekers.html`, `my-listings.html`; `listing*.html`, `person*.html`, `profile-edit-loading.html` | звичка/умова; applied filter; довіра; недоступний доказ | Ні | Звичка — `.kit-tags` > `.kit-tag` (контурна біла, 13/500; `--muted`); застосований фільтр — `.kit-tag--lime` або будь-який `.kit-tag` усередині `.kit-applied` (лайм м’який) |
| Доказ довіри / актуальності | `listing.html`, `listing-error.html`, `listing-loading.html`, `person.html`, `person-error.html`, `person-loading.html`, `profile-edit.html`, `profile-social.html`, `review.html` | verified; missing/unavailable; loading | Ні | `.kit-trust` > `.kit-trust__status` (годинник 14px, muted) + `.kit-trust__chips` (`--error`, `--muted`); список доказів — `.kit-trust-list` (галочка в зеленому колі, рядки з hairline) |

## Форми

| Компонент | На яких екранах зустрічається | Стани | Потрібне фото | Клас у кіті |
|---|---|---|---|---|
| Кнопка дії (primary) | 46 екранів: форми, картки й recovery actions у `chat*`, `filters*`, `listing*`, `listings*`, `my-listings*`, `person*`, `profile-edit*`, `profile-social*`, `report*`, `review*`, `role*`, `seekers*`, `signup*` | default; pressed; disabled; submit/loading; full-width CTA | Ні | `.kit-button` (лісовий градієнт + лісова тінь, 50px, radius 16; `--block`, `--compact`, `:disabled`, `:active`); група — `.kit-actions` |
| Вторинна кнопка | `chat-error.html`; `chats-empty.html`, `chats-error.html`, `chats-loading.html`; `listing-error.html`; `listings-empty.html`, `listings-error.html`; `my-listings*.html`; `person-error.html`; `profile-edit*.html`; `profile-social*.html`; `role-error.html`; `seekers-empty.html`, `seekers-error.html`; `signup-error.html`, `signup-loading.html` | default; retry; cancel/back; destructive-context action | Ні | `.kit-button--secondary` (біла піднята з hairline, лісовий текст 700), `.kit-button--quiet`, `.kit-button--bordered`; текстова дія зі стрілкою Solar — `.kit-button--link`; пара дій у рядок — `.kit-actions--row` |
| Поле форми | `signup*.html`, `profile-edit*.html`, `profile-social*.html`, `filters*.html`, `listing-new*.html`, `listing.html`, `person.html`, `chat*.html`, `review*.html`, `report*.html` | empty; filled; focus (лісове кільце + ореол); invalid (рожева поверхня з рамкою); disabled/loading | Ні | `.kit-field` (заглиблене поле, radius 14; `--error` + `.kit-field__message`), `.kit-field-row` |
| Textarea | `profile-edit.html`; `listing.html`; `person.html`; `chat*.html`; `review*.html`; `report*.html` | empty/placeholder; filled; invalid; disabled/loading | Ні | `.kit-field textarea` |
| Select | `filters*.html`, `profile-edit*.html`, `listing-new*.html` | placeholder/default; selected; disabled/loading | Ні | `.kit-field--select`, дата — `.kit-field--date` |
| Checkbox / choice | `filters.html`, `profile-edit.html`, `listing-new-empty.html`, `report*.html` | checked; unchecked; disabled/loading | Ні | `.kit-choice`, `.kit-attachment` |
| Radio choice | `signup*.html`, `role*.html`, `profile-social*.html`, `filters*.html`, `listing-new*.html`, `report*.html` | selected; unselected; disabled; validation/error context | Ні | `.kit-choice`, з підказкою — `.kit-choice--stacked` + `.kit-choice__text`/`__hint`; сегмент — `.kit-segmented` radiogroup |
| Поле коду верифікації | `signup-loading.html`, `signup-error.html` | empty; filled; invalid | Ні | `.kit-code` (`--six` для 6 цифр за microcopy, `--error`) |
| Помічний текст поля/форми | 40 екранів у сімействах `chat`, `chats`, `filters`, `listing`, `listing-new`, `listings`, `my-listings`, `person`, `profile-edit`, `profile-social`, `report`, `review`, `role`, `seekers`, `signup` | instruction; validation hint; privacy/safety note | Ні | `.kit-hint`, `.kit-field__message`, `.kit-label`, `.kit-fieldset > legend` |

## Зворотний звʼязок

| Компонент | На яких екранах зустрічається | Стани | Потрібне фото | Клас у кіті |
|---|---|---|---|---|
| Порожній стан | `chat-empty.html`, `chats-empty.html`, `listing-empty.html`, `listings-empty.html`, `my-listings-empty.html`, `person-empty.html`, `review-empty.html`, `seekers-empty.html` | немає даних; немає результатів; ще немає активності; із recovery CTA | Ні | `.kit-state` + `.kit-state__icon` (колодязь 76px на градієнті м’ята → лайм; `--chat`, `--document`, `--shield`, `--profile`, `--closed`, `--success`), `.kit-state--compact` |
| Банер / блок помилки | `chat-error.html`, `chats-error.html`, `filters-error.html`, `listing-error.html`, `listing-new-error.html`, `listings-error.html`, `my-listings-error.html`, `person-error.html`, `profile-edit-error.html`, `profile-social-error.html`, `report-error.html`, `review-error.html`, `role-error.html`, `seekers-error.html`, `signup-error.html` | page error; inline validation; save/send/load failure; retry | Ні | `.kit-state--error`[role=alert] + `.kit-state-context`; `.kit-banner--error`; `.kit-note--error` |
| Loading state / progress block | `chat-loading.html`, `chats-loading.html`, `filters-loading.html`, `listing-loading.html`, `listing-new-loading.html`, `listings-loading.html`, `my-listings-loading.html`, `person-loading.html`, `profile-edit-loading.html`, `profile-social-loading.html`, `report-loading.html`, `review-loading.html`, `role-loading.html`, `seekers-loading.html`, `signup-loading.html` | progress message; disabled form; content skeleton (shimmer) | Ні | `.kit-skeleton*` (shimmer-градієнт, вимикається `prefers-reduced-motion`), `.kit-listing--loading`, disabled-поля й кнопки, `aria-busy` |
| Системне inline-повідомлення | `chat.html`, `profile-edit-error.html`, `profile-social-error.html`, `report.html`, `review.html`, `role-error.html`, `signup-error.html`, `signup-loading.html` | informational; safety; success; error | Ні | `.kit-note` (`--success`, `--warning`, `--error`), `.kit-banner` (`--info`), `.kit-message--system` |
| Підсумок застосованих умов | `chats-empty.html`, `chats-error.html`, `chats-loading.html`, `listing-new-error.html`, `listings-empty.html`, `my-listings-empty.html`, `seekers-empty.html` | applied filters/status; контекст порожнього чи помилкового стану | Ні | `.kit-applied` > `.kit-tags`; `.kit-recap` |

## Чат

| Компонент | На яких екранах зустрічається | Стани | Потрібне фото | Клас у кіті |
|---|---|---|---|---|
| Картка діалогу / заявки | `chats.html`; контекстна картка діалогу в `chats-error.html`, `chats-loading.html` | sent; accepted; declined; waiting; unread; pressed; error/loading context | Так — контакт або кімната | `.kit-chat-list` (на всю ширину, hairline між рядками) > `.kit-chat-row` (`--unread`, статус: `--active` лайм, `--waiting` бурштин, `--declined` червоний) + `.kit-chat-copy` (`strong` ім’я, `span` прев’ю, `small` > `em` статус-лейбл uppercase + оголошення), `.kit-chat-side` (`time`, `.kit-unread` глиняний) |
| Контекст розмови | `chat.html`, `chat-empty.html`, `chat-error.html`, `chat-loading.html` | room/person context; available while thread is empty, loading or failed | Так | `.kit-conversation-context` |
| Бульбашка чату | `chat.html`, `chat-loading.html`, `chat-error.html` | incoming; outgoing; system; history with send failure/loading | Ні | `.kit-messages` > `.kit-message` (вхідна біла з тінню sm; `--outgoing` лісовий градієнт; `--failed`; `--system` — м’ятна пігулка по центру) + `.kit-message__meta` |
| Composer повідомлення | `chat.html`, `chat-empty.html`, `chat-error.html`, `chat-loading.html` | empty; filled; disabled/sending; retry after error | Ні | `.kit-composer` (піднята біла поверхня, тінь lg) + `.kit-icon-button` (лісове коло) |

## Разове

Ці блоки мають лише один реальний продуктовий контекст; окремих класів у кіті вони не отримують, а збираються з наявних примітивів (жодного стилю на екрані):

- Завантажувач фото кімнати з upload-grid — `listing-new-empty.html` → `.kit-gallery` зі `.kit-skeleton--gallery` + `.kit-button--secondary`.
- Sticky action під час створення оголошення — `listing-new-empty.html` → `.kit-actions` + `.kit-button--block`.
- Toolbar дій над формою профілю — `profile-edit.html` → `.kit-actions`.
- Блок дій із фото профілю — `profile-edit.html` → `.kit-profile-hero` + `.kit-button--compact`.
- Великий media-стан закритого оголошення — `my-listings-error.html` → `.kit-listing--closed` + `.kit-state__icon--closed`.

Окремий sitemap-екран «Поскаржитись / заблокувати» не робить базові radio choice, checkbox, textarea чи кнопку разовими: ці компоненти також повторюються в інших сімействах.
