# Патерн `split-view` — список і деталь поруч

**Задача.** Дати людині переглядати набір однотипних об'єктів і після кожного
повертатися до списку без переходу між сторінками. На телефоні цикл Flow 1
(`flows.md`) — «картка → не вселяє довіру → назад → наступна картка» (J → C);
на десктопі ширина дозволяє тримати стрічку ліворуч, а вибране оголошення
відкривати праворуч.

**Де.** «Стрічка кімнат» (`beginners/source/prototype/listings.html`, alias
`lesson-6/`), від контейнера оболонки 64rem (`--bp-desktop`). Рішення
користувача 2026-09-24 (`responsive/width-audit.md`, рішення 5).

**Поріг патерну ще не досягнуто.** README вимагає щонайменше 3 сторінки або 3
екземпляри з однаковою семантикою; зараз split-view — лише на одному екрані.
Патерн винесено за рішенням користувача, щоб наступне вживання не
вигадувало власну розкладку. Наступний кандидат — «Чати» (список заявок +
переписка), коли в прототипі з'явиться екран VI.2.

## Склад

| Частина | Клас | Документація |
|---|---|---|
| Обгортка списку й деталі | `kit-split` (`data-kit-split`, `data-kit-split-param`, стан `data-kit-split-state="open"`) | `docs/split-view.html` |
| Список | `kit-section kit-split__list` + `ul.kit-list` з `li[data-kit-split-key]` | `docs/listing.html` |
| Картка | `kit-listing`, стан «вибрано» — `aria-current="true"` на посиланні заголовка | `docs/listing.html#states` |
| Деталь | `kit-split__detail` (`hidden`), `kit-split__head`, `kit-split__title` (`tabindex="-1"`), `kit-split__content` | `docs/split-view.html` |
| «Закрити» | `kit-button kit-button--secondary kit-button--compact kit-split__close` | `docs/button.html` |
| Фільтри поруч | `kit-sheet kit-sheet--panel` (постійна панель від 64rem) | `docs/sheet.html` |
| Поведінка | `components/split-view.js` (+ `components/sheet.js` для фільтрів) | `docs/split-view.html#states` |

## Розмітка

```html
<div class="kit-split" data-kit-split data-kit-split-param="listing">
  <section class="kit-section kit-split__list" aria-labelledby="listings-heading">
    <h2 id="listings-heading" class="kit-sr-only">Оголошення кімнат</h2>
    <ul class="kit-list" id="listings-list">
      <li data-kit-split-key="solomianskyi" data-filter-district="Солом'янський" …>
        <article class="kit-listing">…
          <h3><a href="listing-solomianskyi.html">Кімната в 2-кімнатній</a> …</h3>
        </article>
      </li>
    </ul>
  </section>
  <section class="kit-split__detail" id="listing-detail" aria-labelledby="listing-detail-title" hidden>
    <header class="kit-split__head">
      <h2 class="kit-split__title" id="listing-detail-title" tabindex="-1">Оголошення</h2>
      <button type="button" class="kit-button kit-button--secondary kit-button--compact kit-split__close" aria-label="Закрити оголошення">Закрити</button>
    </header>
    <div class="kit-split__content"></div>
  </section>
</div>
<script src="/kootok/design-system/components/split-view.js" defer></script>
```

## Правила

- Деталь праворуч — не окрема розмітка, а `<main>` тієї самої сторінки, що
  відкривається на телефоні (`listing.html`, `listing-<район>.html`): скрипт
  підвантажує її (fetch того ж origin), прибирає службовий футер, знижує `h2`
  до `h3` під заголовком колонки й додає префікс до `id`. Одна правда про
  перевірки на всіх ширинах.
- Посилання картки завжди веде на повну сторінку: без скрипта, нижче 64rem і
  якщо вміст не підвантажився — працює звичайний перехід.
- Ліва колонка — одна картка: `clamp(--size-split-list-min, 100% −
  --size-split-detail-min − gap, --size-split-list)` = 288–360 px; деталь не
  вужча за 480, поки ліва колонка може стискатися. Панель фільтрів
  `kit-sheet--panel` лишається ліворуч: «фільтри | колонка оголошень | деталь».
- «Подати заявку» в деталі веде на анкету й заявку повними сторінками.
- Вибрана картка — current-стан (лайм, як активний пункт навігації), не
  окремий колір; решта карток без змін.
- Анімацій немає: стан змінюється миттєво.

## Поведінка

| Стан | Як потрапити | Що видно |
|---|---|---|
| Сітка | за замовчуванням; «Закрити»; Escape; «Назад» до адреси без параметра | `kit-list` у 2–3 колонки, деталі немає |
| Split | клік або Enter на картці; пряме посилання `listings.html?listing=<ключ>`; «Назад»/«Вперед» до адреси з параметром | ліворуч картки в одну колонку, вибрана — `aria-current="true"`; праворуч деталь; колонки прокручуються незалежно (sticky, висота — область прокрутки) |
| Закрито | «Закрити», Escape, фільтр сховав вибрану картку | повернення до сітки; фокус — на посилання картки |

- **Фокус.** Відкриття — фокус на заголовок деталі (`tabindex="-1"`), далі Tab
  веде в «Закрити» і вміст деталі. Закриття — фокус на посилання картки.
- **Адреса.** Кожен вибір і закриття — `history.pushState` з
  `?<param>=<ключ>`; `popstate` відновлює стан. Зміна фільтра, що ховає
  вибране, — `replaceState` без параметра.
- **Брейкпоінт.** Прапорець `--kit-split-enabled: 1` виставляє
  `split-view.css` у `@container kit-shell-frame (min-width: 64rem) /* =
  --bp-desktop */`; скрипт читає його з `getComputedStyle` при кожній зміні
  розміру (ResizeObserver). Не `@media`: у курсовій рамці 390 / 768 / 1280
  ширина вікна не дорівнює ширині екрана. Нижче порога деталь схована, а
  параметр адреси нічого не ламає.

## Коли не брати

Кроки й форми (анкета — `apply-step`, заявка), короткі одноразові екрани і
список без деталі (чати, поки немає переписки) лишаються однією колонкою.
