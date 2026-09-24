# Патерн `apply-step` — крок анкети

**Задача.** Провести людину через коротку багатокрокову форму (анкета
сумісності = звички профілю, які вперше заповнюються inline у флоу заявки) так,
щоб вона бачила, скільки лишилось, могла повернутись назад і не втратила
відповіді.

**Де.** Три кроки анкети сумісності (`beginners/source/prototype/compatibility-form.html`,
alias `lesson-6/`): «Ритм дому», «Межі й звички», «Графік і знайомство». Однакова
семантика в трьох екземплярах — поріг патерна виконано.

## Склад

| Частина | Клас | Документація |
|---|---|---|
| Прогрес кроків | `kit-progress`, `kit-progress__meta`, `kit-progress__track`, `kit-progress__value` | `docs/progress.html` |
| Крок | `kit-step` (неактивні — `[hidden]`), `kit-step__intro` | `docs/layout.html` |
| Питання | `kit-fieldset` + `kit-choice` | `docs/form.html`, `docs/card.html` |
| Дії | `kit-actions kit-actions--split`: secondary «Назад» + primary «Зберегти й далі» | `docs/layout.html` |
| Статус чернетки | `kit-hint kit-draft-status` (role="status") | `docs/progress.html` |

## Розмітка

```html
<div class="kit-progress">
  <p class="kit-progress__meta"><strong>Ритм дому</strong><span>Крок 1 із 3</span></p>
  <div class="kit-progress__track" role="progressbar" aria-label="Крок анкети"
       aria-valuemin="1" aria-valuemax="3" aria-valuenow="1">
    <span class="kit-progress__value" style="width: 33.333%"></span>
  </div>
</div>
<div class="kit-step" id="step-1">
  <p class="kit-step__intro">Обери відповіді, які найточніше описують твій звичний день.</p>
  <fieldset class="kit-fieldset">…</fieldset>
  <div class="kit-actions kit-actions--split">
    <button class="kit-button kit-button--secondary" type="button">Назад</button>
    <button class="kit-button" type="button">Зберегти й далі</button>
  </div>
</div>
<div class="kit-step" id="step-2" hidden>…</div>
<p class="kit-hint kit-draft-status" role="status">Чернетка зберігається лише в цьому браузері.</p>
```

## Правила

- Один `kit-step` видимий; інші — з атрибутом `hidden` (глобальне
  `[hidden] { display: none !important }` у `base.css`).
- Номер кроку завжди словами («Крок 2 із 3»), не лише шириною смуги.
- На першому кроці «Назад» веде до картки оголошення; на останньому головна дія —
  «Зберегти й перейти до заявки».
- Підписи на «ти», без окличних знаків (`voice.md`).
- Жодних screen-only класів: усе з `components/`.
