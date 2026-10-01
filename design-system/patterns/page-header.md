# Патерн `page-header` — шапка продукту і заголовок сторінки (десктоп)

## Задача

На десктопі кожен екран — сторінка вебзастосунку, а не розтягнута мобілка:
людина бачить, де вона в продукті (шапка з навігацією і поточним розділом),
де саме в розділі (breadcrumbs на вкладених екранах) і як називається
сторінка (великий H1), а вміст стоїть під заголовком у тих самих краях.

## Поріг

9 сторінок з однаковою семантикою: «Стрічка кімнат» (`lesson-6/listings.html`),
«Картка оголошення» (`listing.html` + 4 `listing-<район>.html`), «Анкета
сумісності», «Заявка», «Чати» (`design-system/examples/chats.html`). Поріг
README (3) досягнуто.

## Склад

| Рядок (десктоп) | Компоненти |
|---|---|
| 1 — шапка продукту | `kit-shell__brand` (біла смуга `--color-appbar-surface`, бренд ліворуч) + один `kit-tabbar` на весь рядок: «Пошук · Чати · Київ» (`kit-tabbar__city`) по центру, «Профіль» праворуч (`kit-tabbar--dock` на кореневих, `kit-tabbar--header` на вкладених; поточна вкладка — розділ: «Пошук» для картки, анкети, заявки) |
| 2 — заголовок сторінки | кореневі: `kit-page-intro kit-shell__header` (`__heading`: H1 + мета; `__controls`: перемикач + пояснення); вкладені: `kit-shell__appbar` → `kit-breadcrumbs` + H1 `kit-shell__title` (`__title-wide`) |
| 3 — тіло | `kit-shell__body`: `kit-split` + панель `kit-sheet--panel` (стрічка), `kit-detail` (картка), `kit-columns` (анкета, заявка, чати) |

## Розмітка

```html
<div class="kit-shell">
  <header class="kit-shell__brand"><a href="listings.html" aria-label="Куток — на головну">Куток</a><span>Київ</span></header>
  <header class="kit-shell__appbar">
    <a class="kit-back" href="listing.html" aria-label="Назад до оголошення">…</a>
    <nav class="kit-breadcrumbs" aria-label="Навігаційний ланцюжок"><ol>
      <li><a href="listings.html">Пошук</a></li>
      <li><a href="listing.html">Кімната в Голосіївському районі</a></li>
      <li><a aria-current="page">Анкета сумісності</a></li>
    </ol></nav>
    <h1 class="kit-shell__title"><span class="kit-shell__title-compact">Сумісність</span><span class="kit-shell__title-wide">Анкета сумісності</span></h1>
  </header>
  <main class="kit-shell__body">…</main>
  <nav class="kit-tabbar kit-tabbar--header" aria-label="Основна навігація Кутка">…</nav>
</div>
```

Кореневий екран замість app bar має `<header class="kit-page-intro kit-shell__header">`
поза `<main>` (на десктопі він на всю ширину над панеллю фільтрів).

## Правила

- **Краї:** шапка, breadcrumbs, H1 і вміст — від одного лівого й до одного
  правого краю: оболонка ≤ `--size-page-max`, поле `--space-screen-gutter`.
  Бічна колонка всіх екранів — `--size-page-aside` (360).
- **Навігація по центру** — сітка nav `1fr · Пошук · Чати · Київ · 1fr`:
  група справді в центрі оболонки, «Профіль» у правій 1fr її не зсуває.
- **Один H1:** на вкладених екранах один H1 з двома написами (короткий для
  app bar телефона, повний для десктопа); видимий завжди один.
- **Телефон і планшет — без змін:** бренд + dock на кореневих; app bar з
  «Назад» на вкладених; breadcrumbs і `kit-tabbar--header` приховані.
- Брейдкрамс не дублює «Назад» на одній ширині; поточна ланка — не посилання.
- Анімацій немає.

## Де вживається

Усі 9 сторінок активного прототипу (див. «Поріг»). Жива документація —
`docs/shell.html#desktop`, `docs/shell.html#nested`, `docs/breadcrumbs.html`,
`docs/layout.html#page-intro`.
