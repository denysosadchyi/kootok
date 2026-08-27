# Implementation plan

| Вимога | Status | Owner | Evidence |
|---|---|---|---|
| Зелений канон «Зелений двір»: `#365c4f`, `#4f7969`, Golos Text + Onest, без фіолетових ознак | done | `/root/green_mobile_lesson6` | `beginners/source/concept.html`, `concept.md`, `prototype/_base.css`; scan фіолетових lesson HTML/CSS tokens: 0 |
| Mobile-first композиція для 390 px; desktop як акуратне розширення/службова оболонка | done | `/root/green_mobile_lesson6` | `.impeccable/review/qa-mobile-*.png`, `qa-desktop-listings-empty.png` |
| Єдина дизайн-система на всіх 13 сторінках станів уроку 6 | done | `/root/green_mobile_lesson6` | `beginners/source/prototype/*.html` (13/13), спільний `_base.css` |
| Продуктова навігація «Пошук / Чати / Оголошення / Профіль / Додати» на всіх 13 сторінках | done | `/root/green_mobile_lesson6` | 13/13 navigation blocks; 5 links, 1 active; mobile target 72.8×70 px; Solar assets |
| Спільне навчальне дерево 01–06 на root, research і lesson 6; mobile drawer + desktop sidebar | done | `/root/green_mobile_lesson6` | `course-nav.css/js`; 19 HTML includes; `qa-mobile-course-open.png`, `qa-desktop-course-research.png` |
| Усі файлові правки виконують агенти; root лише координує і перевіряє | done | `/root/green_mobile_lesson6` | `AGENTS.md` |
| URL, screenshots, responsive та a11y перевірки | done | `/root/green_mobile_lesson6` | 13/13 lesson URLs і representative root/research/concept = HTTP 200; 0 horizontal overflow at 390; theme/focus/reduced-motion; Impeccable detector виконано (degraded parser; findings лише в incumbent root/research styles/copy) |

План є живим: кожна наступна користувацька правка спочатку фіксується тут, після чого root делегує її агенту й очікує статус.

## Known limitations

- Impeccable detector працював у degraded regex mode через відсутні HTML/CSS parser modules; його incumbent findings у root/research зафіксовані як undercount, не як clean bill of health.
- Незалежний finish reviewer не завершився у відведене вікно передачі й був зупинений за вказівкою root; повторний reviewer не запускався. Візуальні докази перевірено агентом вручну по одному файлу.
