# Патерн `listing-detail` — деталь оголошення

## Задача

Показати одне оголошення так, щоб людина спершу побачила головне (фото, ціну,
рівень перевірки), потім прочитала подробиці довіри й побуту і лише тоді
подала заявку — з попередженням про гроші поруч із дією.

## Поріг

5 сторінок з однаковою семантикою: `lesson-6/listing.html` і 4 варіанти
`listing-darnytskyi.html`, `listing-obolonskyi.html`, `listing-podilskyi.html`,
`listing-solomianskyi.html` (той самий екран «Картка оголошення» для інших
карток стрічки). Поріг README (3) досягнуто.

## Склад

| Частина | Компоненти |
|---|---|
| Каркас | `kit-detail` > `kit-detail__layout` (`layout.css`) |
| Фото | `kit-gallery kit-detail__media` (`gallery.css`, 4:3) |
| Зведення | `kit-detail__aside` > `kit-card kit-card--head`: `kit-headline`, `kit-meta--place`, `kit-chip--muted` (тип), `kit-price`, `kit-meta` (комуналка, актуальність), `kit-evidence-summary` або `kit-chip--error` |
| Заявка | `kit-section kit-detail__apply`: `kit-note--warning` → `kit-actions` з `kit-button--block` → `kit-hint` (що буде далі) → `kit-note--info` (межа прототипу) |
| Подробиці | `kit-detail__main` > `kit-card--section` у порядку: «Що саме перевірено» (`kit-trust-list` / `kit-chip--error`) → «Про кімнату» (`kit-kv`) → «Хто живе / здає» (`kit-person`, межа прототипу — один `kit-hint`) → «Побажання» (`kit-tags`) → «Опис» |

## Розмітка

```html
<main class="kit-shell__body">
  <div class="kit-detail">
    <div class="kit-detail__layout">
      <ul class="kit-gallery kit-detail__media" aria-label="Фото оголошення">…</ul>
      <div class="kit-detail__aside">
        <div class="kit-card kit-card--head">…</div>
        <section class="kit-section kit-detail__apply" aria-label="Заявка">…</section>
      </div>
      <div class="kit-detail__main">
        <section class="kit-card kit-card--section" aria-labelledby="…">…</section>
        …
      </div>
    </div>
  </div>
  <p class="kit-footer">…</p>
</main>
```

## Правила

- **Телефон (< 60rem ширини деталі):** одна колонка — фото → зведення →
  подробиці → заявка. Заявка візуально остання (`order`), бо рішення
  приймається після прочитаних доказів; у DOM вона стоїть одразу після
  зведення (скрінрідер чує ціну, перевірку й дію разом). Між зведенням і
  заявкою немає фокусованих елементів, тож порядок Tab збігається з видимим.
- **Планшет (рамка 768):** та сама одна колонка, але на всю ширину рамки
  (до `--size-detail-max`), фото 4:3 на всю ширину — без «острова» 608.
  Дві колонки тут не беремо: зміст поруч із зведенням 360 був би ≤ 352 px,
  тобто вужчий за телефон.
- **Десктоп (≥ 60rem ширини деталі; рамка 1024 і ширше):** дві колонки —
  фото й подробиці ліворуч, зведення + заявка праворуч (`--size-detail-aside`),
  sticky до верху області прокрутки. Проміжок колонок —
  `--space-detail-column-gap`, між картками — `--space-section-gap`.
- **Split-view стрічки:** той самий `<main>` у правій колонці `kit-split`
  завжди одна колонка (власний контейнер вимкнено в `layout.css`).
- Межа прототипу (профіль мешканця, збереження чернетки) подається
  звичайним текстом/нотаткою, без імітації вимкненого посилання.
- **Шапка на десктопі:** над деталлю — патерн `page-header`: біла шапка з
  навігацією («Пошук» поточний), breadcrumbs «Пошук › Кімната в … районі» і
  H1 з повною назвою (`kit-shell__title-wide`); у split-view стрічки вони не
  потрапляють — split підвантажує лише `<main>`.
- Анімацій немає; стани змінюються миттєво.

## Де вживається

`lesson-6/listing.html`, `listing-darnytskyi.html`, `listing-obolonskyi.html`,
`listing-podilskyi.html`, `listing-solomianskyi.html`; у split-view
`lesson-6/listings.html` (десктоп) — через підвантажений `<main>`. Жива
сторінка — `docs/layout.html#detail`.
