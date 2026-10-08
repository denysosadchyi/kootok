# Куток

Пошук співмешканців і вільних кімнат у Києві в мові «Зелений двір»: світлий
мобільний простір, де «кожний факт довіри названий, кожний стан пояснює
наступний крок» ([concept.md](concept.md)).

Це дизайн-документація, дизайн-система й статичний HTML-прототип, не
production-код: стек продукту ще не обрано.

## Куди йти по відповідь

| Питання | Файл |
|---|---|
| Що будуємо і для кого | [CLAUDE.md](CLAUDE.md) |
| Як тут працювати, що є каноном | [AGENTS.md](AGENTS.md) |
| Чому саме так: ринок, персони, jobs | [research/](research/) |
| Які екрани й як між ними ходять | [sitemap.md](sitemap.md), [flows.md](flows.md) |
| Як виглядає і чому | [DESIGN.md](DESIGN.md), [concept.md](concept.md) |
| Який компонент, токен, стан | [design-system/docs/index.html](design-system/docs/index.html) |
| Як поводиться екран: стани, валідація | [handoff/README.md](handoff/README.md) |
| З чого зібраний екран | [handoff/map.md](handoff/map.md) |
| Що перевірити з доступності | [handoff/a11y.md](handoff/a11y.md) |
| Який текст і як писати новий | [microcopy.md](microcopy.md), [voice.md](voice.md) |
| Що відкрито й що далі | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) |

## Як запустити

Онлайн нічого запускати не треба: живий сайт — <https://denysosadchyi.github.io/kootok/>
(посилання на showcase і прототип — у [handoff/README.md](handoff/README.md)).

Локально потрібні лише Python 3 і git. Сторінки посилаються на абсолютні шляхи
`/kootok/...`, тому тека клону має називатися `kootok`, а сервер піднімається з
її батьківської теки:

```sh
git clone https://github.com/denysosadchyi/kootok.git kootok
python3 -m http.server 8000        # з теки, де лежить kootok/
# відкрити http://127.0.0.1:8000/kootok/index.html
```

[`index.html`](index.html) — єдина веб-точка входу до всіх артефактів.
Збирання немає: це статичні HTML/CSS/JS без залежностей.

### QA

Для перевірок потрібні Node.js 22+ і headless Chromium (Chrome). Скрипти в
[`scripts/`](scripts/) ходять у браузер через сирий CDP, без npm-залежностей;
origin передається без `/kootok`. Playwright у проєкті заборонений.

```sh
chromium --headless=new --remote-debugging-port=9222 about:blank &   # або google-chrome
node scripts/audit-local-links.mjs http://127.0.0.1:8000
KOOTOOK_CDP_PORT=9222 node scripts/qa-lesson-8.mjs http://127.0.0.1:8000
KOOTOOK_CDP_PORT=9222 node scripts/qa-reduced-motion.mjs http://127.0.0.1:8000
node scripts/build-handoff-map.mjs   # перезібрати handoff/map.md після зміни екранів чи токенів
```

Обовʼязкові після кожного batch — перші дві перевірки; решта `scripts/qa-*.mjs`
перевіряють окремі теми (responsive, картки, DOM-baseline). Що саме
перевіряється — у коді скриптів. Сайт на GitHub Pages оновлюється сам після
push у `main` ([`.github/workflows/pages.yml`](.github/workflows/pages.yml)).

## Продукт і рішення

Бриф — [CLAUDE.md](CLAUDE.md): проблема, персона Марічка, main job, ключові
рішення, відкриті питання. Правила роботи для людей і агентів —
[AGENTS.md](AGENTS.md).

Дослідження — [research/research.md](research/research.md) (ринок),
[research/personas.md](research/personas.md),
[research/jtbd.md](research/jtbd.md) і
[research/audit.md](research/audit.md) (що підтверджено, а що гіпотеза);
`research/*.html` — ті самі матеріали як сторінки.

Інформаційна архітектура — [sitemap.md](sitemap.md) (сутності, екрани,
навігація) і [flows.md](flows.md) (4 флоу з тупиками). Голос продукту —
[voice.md](voice.md).

## Дизайн-система і showcase

Канон — [`design-system/`](design-system/): єдина точка входу
[`index.css`](design-system/index.css), токени
[`tokens.css`](design-system/tokens.css), модулі
[`components/`](design-system/components/), композиції
[`patterns/`](design-system/patterns/README.md) і жива документація
[`docs/`](design-system/docs/index.html) у двох темах. Мова й правила
застосування — [DESIGN.md](DESIGN.md), обґрунтування — [concept.md](concept.md).

Вітрини [`ui/kit.html`](ui/kit.html), [`ui/tokens.html`](ui/tokens.html),
[`ui/shell.html`](ui/shell.html) оглядові, не канон. Фото й аватари —
[`visuals/manifest.md`](visuals/manifest.md).

Активний прототип — 5 екранів: 4 макети [`lesson-6/`](lesson-6/)
(= `beginners/source/prototype/`, правила шару —
[`_rules.md`](beginners/source/prototype/_rules.md)) і «Чати»
[`design-system/examples/chats.html`](design-system/examples/chats.html).

## Специфікація поведінки

[`handoff/README.md`](handoff/README.md) — те, чого не видно в макетах: флоу,
стани, валідація полів, відкриті питання. Специфікація посилається на кіт і
копі, а не дублює їх.

## Карта відповідностей

[`handoff/map.md`](handoff/map.md) — з чого зібраний кожен екран: компоненти,
токени, ключі microcopy, і зворотний список «токен → екрани». Сюди — перед
зміною токена чи компонента.

## Чекліст доступності

[`handoff/a11y.md`](handoff/a11y.md) — що перевірити на кожному екрані перед
передачею в розробку.

## Тексти

[`microcopy.md`](microcopy.md) — ключі текстів активних екранів;
[`voice.md`](voice.md) — як писати нові. Хендофф посилається на ці файли, а не
копіює тексти.

## Стан і беклог

Відкриті пункти й журнал робіт — [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
(розділ «Поточний стан»). Прогалини кіта —
[design-system/backlog.md](design-system/backlog.md), прогалини хендоффу —
[handoff/onboarding-gaps.md](handoff/onboarding-gaps.md).

## Історія й службове

Не активні сторінки й не канон:

- `archive/` — вайрфрейми уроку 4, ранні макети уроку 6, порівняння напрямів.
- `beginners/` — знімок ранніх уроків; чинне в ньому лише `source/prototype/`.
- `lesson-6-concept.html`, `ia.html`, `research.html`, `personas.html`,
  `screens` — символьні посилання для старих адрес.
- `animations/` — інвентар моментів руху, чернетка для відбору.
- `responsive/` — аудит ширини екранів, таблиця рішень.
- `.impeccable/`, `PRODUCT.md` — службові дані skill impeccable.
- `figmosha2/` — локальний Figma-міст, поза git цього проєкту.
- `tmp/` — тимчасові файли агентів, поза git.
