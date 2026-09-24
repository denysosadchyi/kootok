# Архів раннього прототипу

2026-09-17: за запитом користувача у `lesson-6/` (alias
`beginners/source/prototype/`) лишено рівно чотири макети:
`listings.html`, `listing.html`, `compatibility-form.html`, `application.html`.

Решту 13 вихідних HTML збережено тут без зміни вмісту з розширенням
`.html.archived`: `chats`, `chat`, `profile`, `listings-empty`,
`listings-error`, `listings-loading`, `listing-error`, `listing-loading`,
`compatibility-form-error`, `compatibility-form-loading`, `application-error`,
`application-loading`, `application-sent`.

**Які саме байти лежать тут.** Архівні файли — незакомічений стан 17.09
(після міграції на `/kootok/tokens.css` + `/kootok/components/index.css`), а не
байти HEAD `05acc4c`. Версії HEAD — у git-історії
(`git show 05acc4c:beginners/source/prototype/<name>.html`).

Архів не має посилань у веб-навігації. Старі адреси сторінок більше не
існують; файли архіву є вихідними матеріалами, а не активними HTML-сторінками.

## Як відновити файл

1. Поверніть потрібний файл до `beginners/source/prototype/` і заберіть суфікс
   `.archived`: локальні assets та `_base.css` лишились там.
2. Замініть `/kootok/tokens.css` + `/kootok/components/index.css` на
   `/kootok/design-system/index.css` (старих файлів у корені більше немає).
3. Виправте відомі порушення (таблиця нижче) до того, як показувати сторінку.

## Відомі порушення у файлах

| Файл | Порушення | Канон |
|---|---|---|
| `chat.html.archived` | «92% сумісність» — числовий скор сумісності | заборонено брифом: «тільки фільтри», без алгоритмічного скору |
| `chat.html.archived`, `chats.html.archived` | ціна 8 500 грн | канонічний fixture — 7 500 грн |
| `chat.html.archived`, `profile.html.archived` | персона «Соломія» (паралельний бриф Beginners) | primary-персона — Марічка (`research/personas.md`) |
| `listings-error`, `listing-error`, `compatibility-form-error`, `application-error`, `application-sent`, `chats`, `chat` | звертання на «ви» («Перевірте», «Ваш», «вам») | на «ти» (`voice.md`) |

## Продуктові вайрфрейми уроку 4

60 вайрфреймів `research/wireframes/` заархівовано того ж дня (2026-09-17) в
`archive/product-wireframes/`.

## Фото й аватари уроку 6 (заархівовано 2026-09-24)

Після заміни на власний набір `visuals/` старі растри перенесено сюди без змін:

- `assets-original/listings/room-01.jpg` … `room-05.jpg` — фото кімнат, що
  стояли в `lesson-6/assets/listings/` (папку в прототипі прибрано);
- `assets-original/avatars-web/*.png` — зменшені 144px аватари з
  `lesson-6/assets/avatars/` (`mariia`, `nastia`, `oleh`, `solomiia`);
- `assets-original/avatars/*.png` — їхні повнорозмірні оригінали (були тут
  раніше).

Активні екрани на ці файли не посилаються; мапа нових зображень —
`visuals/manifest.md`.
