#!/usr/bin/env python3
"""Механічно розкочує канонічне дерево й узгоджені сторінки вайрфреймів."""

from __future__ import annotations

import argparse
from pathlib import Path
import re

ROOT = Path(__file__).parent
STATE_LABELS = ("успіх", "порожньо", "помилка", "завантаження")
STATE_SUFFIX = {"успіх": "", "порожньо": "-empty", "помилка": "-error", "завантаження": "-loading"}

GROUPS = [
    ("I", "Стати учасником Кутка"),
    ("II", "Мій профіль"),
    ("III", "Знайти кімнату або людину"),
    ("IV", "Розглянути варіант"),
    ("V", "Запропонувати кімнату"),
    ("VI", "Домовитися"),
    ("VII", "Після заселення"),
]

PAGES = [
    dict(code="I.1", title="Реєстрація і верифікація телефону", short="Реєстрація і верифікація телефону", base="signup", group="I", states=("успіх",)),
    dict(code="I.2", title="Вибір ролі: шукаю кімнату / маю кімнату / обидва", short="Вибір ролі", base="role", group="I", states=("успіх",)),
    dict(code="II.1", title="Створити / редагувати профіль", short="Створити / редагувати профіль", base="profile-edit", group="II", states=("успіх",)),
    dict(code="II.2", title="Додати соцлінк для верифікації", short="Додати соцлінк для верифікації", base="profile-social", group="II", states=("успіх",)),
    dict(code="III.1", title="Стрічка кімнат", short="Стрічка кімнат", base="listings", group="III", states=STATE_LABELS),
    dict(code="III.2", title="Стрічка людей-шукачів", short="Стрічка людей-шукачів", base="people", group="III", states=("успіх", "порожньо")),
    dict(code="III.3", title="Налаштувати фільтри", short="Налаштувати фільтри", base="filters", group="III", states=("успіх",)),
    dict(code="IV.1", title="Картка оголошення кімнати", short="Картка оголошення кімнати", base="listing", group="IV", states=("успіх", "помилка", "завантаження")),
    dict(code="IV.2", title="Картка профілю людини", short="Картка профілю людини", base="person", group="IV", states=STATE_LABELS),
    dict(code="V.1", title="Опублікувати оголошення", short="Опублікувати оголошення", base="new-listing", group="V", states=("успіх", "помилка", "завантаження")),
    dict(code="V.2", title="Мої оголошення", short="Мої оголошення", base="my-listings", group="V", states=("успіх", "порожньо")),
    dict(code="VI.1", title="Заявки і чати (список)", short="Заявки і чати", base="chats", group="VI", states=STATE_LABELS),
    dict(code="VI.2", title="Чат — переписка після взаємної згоди", short="Чат — переписка після взаємної згоди", base="chat", group="VI", states=("успіх",)),
    dict(code="VI.3", title="Поскаржитись / заблокувати", short="Поскаржитись / заблокувати", base="report", group="VI", states=("успіх",)),
    dict(code="VII.1", title="Залишити відгук", short="Залишити відгук", base="review", group="VII", states=("успіх",)),
]

BY_BASE = {page["base"]: page for page in PAGES}
MAIN = {"signup", "role", "listings", "filters", "listing", "chat"}


def filename(page: dict, state: str) -> str:
    return f'{page["base"]}{STATE_SUFFIX[state]}.html'


def all_filenames(page: dict) -> list[str]:
    return [filename(page, state) for state in page["states"]]


def tree_html(current: str | None, available: set[str]) -> str:
    index_node = '<a href="index.html">Куток · вайрфрейми</a>' if "index.html" in available else '<span>Куток · вайрфрейми</span>'
    lines = ['<nav class="wf-tree" aria-label="Екрани вайрфрейму">', f'  <h2>{index_node}</h2>', '  <ul>']
    for group, label in GROUPS:
        lines.append(f'    <li class="wf-tree-group">{group}. {label}</li>')
        for page in (item for item in PAGES if item["group"] == group):
            base_file = filename(page, "успіх")
            if base_file in available:
                lines.append(f'    <li><a class="wf-tree-node" href="{base_file}">{page["short"]}</a>')
            else:
                lines.append(f'    <li><span class="wf-tree-node wf-tree-todo">{page["short"]}</span>')
            lines.append('      <ul>')
            for state in page["states"]:
                target = filename(page, state)
                if target in available:
                    marker = ' class="is-current" aria-current="page"' if target == current else ''
                    lines.append(f'        <li><a href="{target}"{marker}>{state}</a></li>')
                else:
                    lines.append(f'        <li><span class="wf-tree-todo">{state}</span></li>')
            lines.extend(['      </ul>', '    </li>'])
    lines.extend(['  </ul>', '</nav>'])
    return "\n".join(lines)


def zone(name: str, body: str) -> str:
    return f'''<section data-zone="{name}">
  {body}
</section>'''


def tabbar(current: str, owner: bool = False) -> str:
    search_href = "people.html" if current == "people" else "listings.html"
    items = [(search_href, "Пошук", "people" if current == "people" else "search"), ("chats.html", "Чати", "chats")]
    if owner:
        items.append(("my-listings.html", "Оголошення", "ads"))
    items.append(("profile-edit.html", "Профіль", "profile"))
    links = ''
    for href, label, key in items:
        current_attr = ' aria-current="page"' if key == current else ''
        links += f'<li><a href="{href}"{current_attr}>{label}</a></li>'
    return f'<nav aria-label="Глобальна навігація"><ul class="wf-tabbar">{links}</ul></nav>'


def search_switch(current: str) -> str:
    rooms_current = ' aria-current="page"' if current == "rooms" else ''
    people_current = ' aria-current="page"' if current == "people" else ''
    return f'''<nav aria-label="Тип пошуку"><ul class="wf-tabbar"><li><a href="listings.html"{rooms_current}>Кімнати</a></li><li><a href="people.html"{people_current}>Люди</a></li></ul></nav>'''


def state_switcher(page: dict, state: str) -> str:
    parts = []
    for label in page["states"]:
        if label == state:
            parts.append(f'<span class="is-current">{label}</span>')
        else:
            parts.append(f'<a href="{filename(page, label)}">{label}</a>')
    return "\n        ".join(parts)


def appbar(title: str, back: str | None = None) -> str:
    back_link = f'<a href="{back}">Назад</a>' if back else ''
    return f'<header class="wf-appbar">{back_link}<h2>{title}</h2></header>'


LISTINGS = (
    dict(
        title="Оболонь, 8&nbsp;500&nbsp;₴/міс",
        household="Кімната в 3-к квартирі · 2 співмешканці · заїзд з 1 вересня",
        metro="5 хв від метро Мінська",
        habits="не палимо · гостей кличемо зрідка",
        author="Олег, 29 · власник кімнати",
        trust=("телефон підтверджено", "Instagram підтверджено", "3 відгуки після заселення"),
        status="оголошення активне · оновлено 2 дні тому",
    ),
    dict(
        title="Позняки, 6&nbsp;200&nbsp;₴/міс",
        household="Кімната в 2-к квартирі · 1 співмешканка · заїзд з 15 вересня",
        metro="8 хв від метро Позняки",
        habits="є кішка · працюю з дому до 18:00",
        author="Настя, 26 · основна орендарка",
        trust=("телефон підтверджено",),
        status="оголошення активне · оновлено сьогодні",
    ),
    dict(
        title="Солом’янка біля Севастопольської площі, 11&nbsp;000&nbsp;₴/міс",
        household="Кімната в 4-к квартирі · 3 співмешканці · заїзд з 1 жовтня",
        metro="18 хв транспортом до метро Вокзальна",
        habits="прокидаємося рано · тварин не тримаємо",
        author="Тарас, 34 · співвласник квартири",
        trust=("телефон підтверджено", "LinkedIn підтверджено"),
        status="оголошення активне · оновлено 5 днів тому",
    ),
    dict(
        title="Нивки, 5&nbsp;400&nbsp;₴/міс",
        household="Кімната в 2-к квартирі · 0 співмешканців зараз · заїзд з 20 вересня",
        metro="7 хв від метро Нивки",
        habits="можна з собакою · вечірки не влаштовуємо",
        author="Юля, 24 · представниця орендодавця",
        trust=(),
        status="оголошення активне · оновлено 8 днів тому",
    ),
    dict(
        title="Лук’янівка, 9&nbsp;000&nbsp;₴/міс",
        household="Кімната в 4-к квартирі · 4 співмешканці, дві пари · можна заїжджати зараз",
        metro="10 хв від метро Лук’янівська",
        habits="прибираємо за графіком · гості лише за домовленістю",
        author="Сергій, 38 · орендар, що підселяє",
        trust=("телефон підтверджено", "5 відгуків після заселення"),
        status="оголошення активне · оновлено 12 днів тому",
    ),
)

PEOPLE = (
    dict(
        name="Марічка, 21 · студентка КНУ",
        search="Шукаю кімнату на Оболоні або Подолі, бюджет до 9&nbsp;000&nbsp;₴/міс.",
        habits=("охайність: важлива", "гості: зрідка", "не палю"),
        trust=("телефон підтверджено", "Instagram підтверджено"),
    ),
    dict(
        name="Андрій, 31 · backend-розробник",
        search="Шукаю кімнату на Солом’янці, бюджет до 11&nbsp;000&nbsp;₴/міс.",
        habits=("працюю з дому", "сова", "маю кота"),
        trust=("телефон підтверджено", "LinkedIn підтверджено", "2 відгуки після заселення"),
    ),
    dict(
        name="Ірина, 27 · бариста",
        search="Шукаю кімнату на Нивках або Сирці, бюджет до 6&nbsp;500&nbsp;₴/міс.",
        habits=("жайворонок", "без тварин", "не палю"),
        trust=("телефон підтверджено",),
    ),
    dict(
        name="Богдан, 24 · звукорежисер",
        search="Шукаю кімнату на Позняках або Осокорках, бюджет до 5&nbsp;000&nbsp;₴/міс.",
        habits=("репетирую лише у студії", "гості: щотижня", "порядок: за графіком"),
        trust=("Instagram підтверджено",),
    ),
    dict(
        name="Світлана, 36 · бухгалтерка",
        search="Шукаю кімнату на Лук’янівці або Дорогожичах, бюджет до 7&nbsp;800&nbsp;₴/міс.",
        habits=("працюю в офісі", "тиша після 22:00", "без тварин"),
        trust=(),
    ),
)


def trust_signals(items: tuple[str, ...]) -> str:
    if not items:
        return '<p class="wf-hint">телефон і соцлінк не підтверджені</p>'
    badges = ''.join(f'<li><span class="wf-badge">{item}</span></li>' for item in items)
    return f'<ul class="wf-chips">{badges}</ul>'


def listing_card(item: dict) -> str:
    return f'''<article class="wf-card">
  <span class="ph" role="img" aria-label="місце для фото кімнати"></span>
  <h3>{item["title"]}</h3>
  <p>{item["household"]}</p>
  <ul class="wf-facts"><li>{item["metro"]}</li><li>{item["habits"]}</li></ul>
  <p>{item["author"]}</p>
  {trust_signals(item["trust"])}
  <p class="wf-hint">{item["status"]}</p>
  <p><a class="wf-btn wf-btn-primary wf-btn-block" href="listing.html">Відкрити оголошення</a></p>
</article>'''


def person_card(item: dict) -> str:
    habits = ''.join(f'<li>{habit}</li>' for habit in item["habits"])
    return f'''<article class="wf-card">
  <span class="ph ph-avatar" role="img" aria-label="місце для фото профілю"></span>
  <h3>{item["name"]}</h3>
  <p>{item["search"]}</p>
  <ul class="wf-facts">{habits}</ul>
  {trust_signals(item["trust"])}
  <p><a class="wf-btn wf-btn-primary wf-btn-block" href="person.html">Відкрити профіль</a></p>
</article>'''


def list_items(items: tuple[dict, ...], renderer) -> str:
    return ''.join(f'<li>{renderer(item)}</li>' for item in items)


def loading_cards(count: int) -> str:
    card = '<article class="wf-card"><span class="ph" aria-hidden="true"></span><span class="sk sk-title"></span><span class="sk sk-80"></span><span class="sk sk-60"></span></article>'
    return card * count


def validate_feed_content() -> None:
    """Не дає генератору знову розкотити одну контентну заглушку N разів."""
    if len(LISTINGS) != 5 or len(PEOPLE) not in (4, 5):
        raise ValueError("Стрічки мають показувати 5 кімнат і 4–5 профілів")
    for items, unique_fields in (
        (LISTINGS, ("title", "household", "metro", "habits", "author", "status")),
        (PEOPLE, ("name", "search", "habits", "trust")),
    ):
        for field in unique_fields:
            values = [item[field] for item in items]
            if len(values) != len(set(values)):
                raise ValueError(f"Повторене поле {field!r} у контенті стрічки")
    unverified = [item for item in LISTINGS if not item["trust"]]
    if len(unverified) != 1:
        raise ValueError("Рівно одна кімната має бути без сигналів верифікації")


def content_listings(state: str) -> str:
    filters = zone("пошук і фільтри", '''<form action="listings.html" method="get"><label class="wf-field" for="area"><span>Район або метро</span><input id="area" name="area" value="Оболонь, Поділ"></label><button type="submit">Знайти</button></form><ul class="wf-chips"><li><span class="wf-chip wf-chip-on">5&nbsp;000–11&nbsp;000&nbsp;₴</span></li><li><span class="wf-chip wf-chip-on">заїзд з 1 вересня</span></li></ul><p><a class="wf-btn wf-btn-ghost wf-btn-block" href="filters.html">Змінити фільтри</a></p>''')
    if state == "успіх":
        body = f'<p>Знайдено 14 варіантів</p><ul class="wf-list">{list_items(LISTINGS, listing_card)}</ul>'
    elif state == "порожньо":
        body = '''<article class="wf-msg"><h3>Стрічка порожня: нічого не знайшлось</h3><p>Фільтри надто вузькі. Розшир їх і перевір стрічку ще раз.</p><a class="wf-btn wf-btn-primary" href="filters.html">Послабити фільтри</a></article><article class="wf-msg wf-msg-dead"><h3>Підходящих варіантів у Києві зараз немає</h3><p>Фільтри вже максимально широкі. Нових варіантів зараз немає — повернись до пошуку пізніше.</p><a class="wf-btn wf-btn-ghost" href="listings.html">Повернутися до пошуку</a></article>'''
    elif state == "помилка":
        body = '''<article class="wf-msg"><h3>Не вдалося завантажити стрічку</h3><p>Перевір з’єднання та повтори завантаження.</p><a class="wf-btn wf-btn-primary" href="listings.html">Спробувати ще</a></article>'''
    else:
        body = f'<p class="wf-hint">Завантажуємо варіанти в межах фільтра…</p><div class="wf-stack">{loading_cards(len(LISTINGS))}</div><button class="wf-btn-block" type="button" disabled>Завантажуємо стрічку…</button><p><a href="listings.html">Повернутися до стрічки</a></p>'
    results = zone("результати", body)
    return appbar("Пошук кімнати") + search_switch("rooms") + filters + results + tabbar("search")


def content_signup(_: str) -> str:
    return appbar("Вхід у Куток") + zone("верифікація", '''<form><label class="wf-field" for="phone"><span>Номер телефону</span><input id="phone" type="tel" value="+380 67 123 45 67"></label><label class="wf-field" for="code"><span>Код із SMS</span><input id="code" inputmode="numeric" value="2481"></label><p class="wf-hint">Телефон буде позначено як підтверджений.</p><a class="wf-btn wf-btn-primary wf-btn-block" href="role.html">Підтвердити телефон</a></form>''')


def content_role(_: str) -> str:
    return appbar("Обери свою роль", "signup.html") + zone("вибір ролі", '''<form><fieldset><legend>Що ти зараз шукаєш?</legend><label><input type="radio" name="role" checked> Шукаю кімнату</label><br><label><input type="radio" name="role"> Маю кімнату</label><br><label><input type="radio" name="role"> Шукаю кімнату й можу запропонувати свою</label></fieldset><a class="wf-btn wf-btn-primary wf-btn-block" href="listings.html">Продовжити</a></form>''')


def content_filters(_: str) -> str:
    criteria = zone("критерії", '''<form><label class="wf-field" for="district"><span>Район</span><input id="district" value="Оболонь, Поділ"></label><label class="wf-field" for="budget"><span>Бюджет на місяць</span><input id="budget" value="5 000–11 000 ₴"></label><label class="wf-field" for="move"><span>Заїзд</span><input id="move" value="з 1 вересня"></label><fieldset><legend>Звички й довіра</legend><label><input type="checkbox" checked> охайність: важлива</label><br><label><input type="checkbox" checked> гості: зрідка</label><br><label><input type="checkbox"> тварини: є кіт</label><br><label><input type="checkbox" checked> не палю</label><br><label><input type="checkbox"> жайворонок / сова</label><br><label><input type="checkbox" checked> тільки з підтвердженим телефоном</label></fieldset><p>Знайдено 14 варіантів</p><a class="wf-btn wf-btn-primary wf-btn-block" href="listings.html">Застосувати до кімнат</a></form>''')
    people_return = zone("контекст людей", '''<p>Ті самі райони й побутові критерії можна застосувати до профілів шукачів.</p><a class="wf-btn wf-btn-ghost wf-btn-block" href="people.html">Застосувати до людей</a>''')
    return appbar("Налаштувати фільтри", "listings-empty.html") + criteria + people_return


def content_listing(state: str) -> str:
    summary = zone("кімната", '''<span class="ph" role="img" aria-label="місце для фото кімнати"></span><h3>Оболонь, 8&nbsp;500&nbsp;₴/міс</h3><p>Кімната в 3-к квартирі · 2 співмешканці · заїзд з 1 вересня</p><ul class="wf-facts"><li>5 хв від метро Мінська</li><li>меблі є</li><li>з тваринами можна</li></ul><p class="wf-hint">оголошення активне · оновлено 2 дні тому</p>''')
    trust = zone("сигнали довіри", '''<div class="wf-row"><span class="ph ph-avatar" role="img" aria-label="місце для фото Олега"></span><article class="wf-grow"><h3>Олег, 29 · власник кімнати</h3><p>Спокійний побут, гостей запрошую зрідка.</p></article></div><ul class="wf-chips"><li><span class="wf-badge">телефон підтверджено</span></li><li><span class="wf-badge">Instagram підтверджено</span></li><li><span class="wf-badge">3 відгуки після заселення</span></li></ul><ul class="wf-facts"><li>охайність: важлива</li><li>гості: зрідка</li><li>тварини: є кіт</li><li>не палю</li><li>жайворонок / сова</li></ul>''')
    if state == "успіх":
        body = '''<p>Оголошення й профіль автора вселяють довіру?</p><div class="wf-row"><a class="wf-btn wf-btn-ghost" href="listings.html">Ні, назад у стрічку</a><a class="wf-btn wf-btn-primary" href="listing-loading.html">Так, надіслати заявку</a></div>'''
    elif state == "помилка":
        body = '''<article class="wf-msg"><h3>Помилка: заявку не надіслано</h3><p>Збій не змінив оголошення. Повернись на картку й повтори дію.</p><a class="wf-btn wf-btn-primary" href="listing.html">Спробувати ще</a></article>'''
    else:
        body = '''<article class="wf-msg"><h3>Надсилання заявки…</h3><p>Статус надсилання:</p><button type="button" disabled>Надсилання заявки…</button><p><a href="listing-error.html">Стався збій</a> · <a href="#waiting">Заявку надіслано</a></p></article><article class="wf-msg" id="waiting"><h3>Очікуємо відповідь на заявку…</h3><p>Контакти відкриються після взаємної згоди.</p><button type="button" disabled>Очікуємо відповідь…</button><p><a href="chat.html">Заявку прийнято</a> · <a href="listings.html">Заявку відхилено</a></p><p><a href="listings.html">Немає відповіді — заявка протухла</a></p></article>'''
    action = zone("головна дія", body)
    return appbar("Картка оголошення", "listings.html") + summary + trust + action + tabbar("search")


def content_chat(_: str) -> str:
    context = zone("контекст", '''<article class="wf-card"><h3>Оболонь, 8&nbsp;500&nbsp;₴/міс</h3><p>Заявку прийнято — чат відкрито</p><a href="listing.html">Переглянути оголошення</a></article>''')
    conversation = zone("переписка", '''<article class="wf-bubble"><p>Привіт! Кімната ще вільна. Перед переглядом нічого переказувати не треба.</p></article><article class="wf-bubble wf-bubble-me"><p>Добре, у суботу о 15:00 мені підходить.</p></article><form><label class="wf-field" for="message"><span>Повідомлення</span><textarea id="message">Домовились, побачимось у суботу.</textarea></label><button type="button">Надіслати</button></form><article class="wf-msg"><h3>Просять передоплату до перегляду кімнати?</h3><div class="wf-row"><a class="wf-btn wf-btn-ghost" href="report.html">Так — вимагають гроші наперед</a><a class="wf-btn wf-btn-primary" href="review.html">Ні — домовились про перегляд</a></div><p><a href="chats.html">Тиша або відмовки — розмова нічим не закінчилась</a></p></article><p><a href="my-listings.html">Мешканця знайдено — перейти до моїх оголошень</a></p>''')
    return appbar("Олег · Оболонь", "chats.html") + context + conversation + tabbar("chats")


def content_profile_edit(_: str) -> str:
    return appbar("Мій профіль") + zone("профіль", '''<form><span class="ph ph-avatar" role="img" aria-label="місце для фото Марічки"></span><label class="wf-field" for="name"><span>Ім’я та вік</span><input id="name" value="Марічка, 21"></label><label class="wf-field" for="about"><span>Про себе</span><textarea id="about">Студентка КНУ, шукаю спокійний дім на Оболоні або Подолі.</textarea></label><label class="wf-field" for="profile-budget"><span>Бюджет</span><input id="profile-budget" value="до 9&nbsp;000&nbsp;₴/міс"></label><label class="wf-field" for="profile-areas"><span>Райони інтересу</span><input id="profile-areas" value="Оболонь, Поділ"></label><fieldset><legend>Звички</legend><label><input type="checkbox" checked> охайність: важлива</label><br><label><input type="checkbox" checked> гості: зрідка</label><br><label><input type="checkbox" checked> тварини: є кіт</label><br><label><input type="checkbox" checked> не палю</label><br><label><input type="checkbox"> жайворонок / сова</label></fieldset><button class="wf-btn-primary wf-btn-block" type="button">Зберегти профіль</button></form>''') + zone("верифікація", '''<ul class="wf-chips"><li><span class="wf-badge">телефон підтверджено</span></li></ul><p><a class="wf-btn wf-btn-ghost wf-btn-block" href="profile-social.html">Додати соцлінк</a></p>''') + tabbar("profile")


def content_profile_social(_: str) -> str:
    return appbar("Верифікація соцлінком", "profile-edit.html") + zone("соцлінк", '''<form action="profile-edit.html" method="get"><label class="wf-field" for="network"><span>Соцмережа</span><select id="network"><option>Instagram</option><option>LinkedIn</option></select></label><label class="wf-field" for="social"><span>Посилання</span><input id="social" type="url" value="https://instagram.com/marichka"></label><p class="wf-hint">Посилання видно як сигнал довіри; пароль Куток не просить.</p><button class="wf-btn-primary wf-btn-block" type="submit">Підтвердити соцлінк</button></form>''') + zone("наслідок", '''<p>Після підтвердження у профілі з’явиться сигнал «Instagram підтверджено».</p><p><a href="profile-edit.html">Скасувати й повернутися до профілю</a></p>''') + tabbar("profile")


def content_people(state: str) -> str:
    filters = zone("фільтри", '''<ul class="wf-chips"><li><span class="wf-chip wf-chip-on">Оболонь, Поділ</span></li><li><span class="wf-chip wf-chip-on">не палить</span></li></ul><p><a class="wf-btn wf-btn-ghost" href="filters.html">Змінити фільтри</a></p>''')
    if state == "успіх":
        body = f'<p>Знайдено 8 профілів</p><ul class="wf-list">{list_items(PEOPLE, person_card)}</ul>'
    else:
        body = '''<article class="wf-msg"><h3>Підходящих шукачів поки немає</h3><p>Розшир фільтри, щоб побачити більше людей.</p><a class="wf-btn wf-btn-primary" href="filters.html">Розширити фільтри</a></article><article class="wf-msg"><h3>Кімната й далі порожня, оренду покриває сам</h3><p>Фільтри вже максимально широкі, а підходящих профілів немає.</p><a href="my-listings.html">Повернутися до моїх оголошень</a></article>'''
    return appbar("Люди шукають кімнату") + search_switch("people") + filters + zone("результати", body) + tabbar("people", True)


def content_person(state: str) -> str:
    summary = zone("профіль", '''<div class="wf-row"><span class="ph ph-avatar" role="img" aria-label="місце для фото Марічки"></span><article class="wf-grow"><h3>Марічка, 21 · студентка КНУ</h3><p>Шукаю кімнату на Оболоні або Подолі, бюджет до 9&nbsp;000&nbsp;₴.</p></article></div><ul class="wf-facts"><li>охайність: важлива</li><li>гості: зрідка</li><li>тварини: є кіт</li><li>не палю</li><li>жайворонок / сова</li></ul><ul class="wf-chips"><li><span class="wf-badge">телефон підтверджено</span></li><li><span class="wf-badge">Instagram підтверджено</span></li></ul>''')
    if state == "успіх":
        reviews = '''<ul class="wf-list"><li><article class="wf-card"><h3>Спокійна й відповідальна співмешканка</h3><p>Ірина, 27 · жили разом 8 місяців</p><p>Домовленостей дотримувалась, побут ділили чесно.</p></article></li><li><article class="wf-card"><h3>Завжди попереджала про гостей</h3><p>Дмитро, 25 · спільна оренда у 2025 році</p><p>Поважала тишу ввечері й завчасно узгоджувала гостей.</p></article></li><li><article class="wf-card"><h3>Добре дбала про квартиру й кота</h3><p>Олена, 30 · колишня власниця кімнати</p><p>Після виїзду залишила кімнату охайною та повернула ключі вчасно.</p></article></li></ul><div class="wf-row"><a class="wf-btn wf-btn-primary" href="person-loading.html">Запропонувати кімнату</a><a class="wf-btn wf-btn-ghost" href="people.html">Не підходить</a></div>'''
    elif state == "порожньо":
        reviews = '<article class="wf-msg"><h3>Немає відгуків після заселення</h3><p>Орієнтуйся на підтверджений телефон, соцлінк і заповнені звички.</p><a class="wf-btn wf-btn-primary" href="person-loading.html">Все одно запропонувати кімнату</a> <a href="people.html">Назад у стрічку</a></article>'
    elif state == "помилка":
        reviews = '<article class="wf-msg"><h3>Заявку відхилено</h3><p>Марічка не погодилась оселитися. Повернись до інших шукачів.</p><a class="wf-btn wf-btn-primary" href="people.html">Переглянути інших людей</a></article>'
    else:
        reviews = '<article class="wf-msg"><h3>Очікуємо відповідь на заявку…</h3><p>Профіль отримає пропозицію кімнати на Оболоні за 8&nbsp;500&nbsp;₴/міс.</p><button type="button" disabled>Очікуємо відповідь…</button><p><a href="chat.html">Погодились оселитися</a> · <a href="person-error.html">Заявку відхилено</a></p><p><a href="people.html">Немає відповіді — повернутися до стрічки</a></p></article>'
    return appbar("Профіль людини", "people.html") + summary + zone("відгуки і дія", reviews) + tabbar("people", True)


def content_new_listing(state: str) -> str:
    invalid = state == "помилка"
    price = "" if invalid else "8&nbsp;500&nbsp;₴"
    date = "" if invalid else "1 вересня"
    invalid_attr = ' aria-invalid="true"' if invalid else ''
    form_body = f'''<form><span class="ph" role="img" aria-label="місце для фото кімнати"></span><label class="wf-field" for="new-area"><span>Район і метро</span><input id="new-area" value="Оболонь · 5 хв від метро Мінська"></label><label class="wf-field" for="price"><span>Ціна на місяць</span><input id="price" value="{price}"{invalid_attr}></label><label class="wf-field" for="date"><span>Дата заїзду</span><input id="date" value="{date}"{invalid_attr}></label><label class="wf-field" for="conditions"><span>Умови кімнати</span><textarea id="conditions">Меблі є, з тваринами можна.</textarea></label><fieldset><legend>Побажання до співмешканця</legend><label><input type="checkbox" checked> охайність: важлива</label><br><label><input type="checkbox" checked> гості: зрідка</label><br><label><input type="checkbox"> тварини: є кіт</label><br><label><input type="checkbox" checked> не палю</label><br><label><input type="checkbox"> жайворонок / сова</label></fieldset></form>'''
    form = zone("оголошення", form_body)
    if state == "успіх":
        body = '<p>Усі обов’язкові поля заповнені.</p><a class="wf-btn wf-btn-primary wf-btn-block" href="new-listing-loading.html">Опублікувати оголошення</a>'
    elif state == "помилка":
        body = '<article class="wf-msg"><h3>Помилка: перевірте поля форми</h3><p>Додай дату заїзду та ціну, потім повтори публікацію.</p><a class="wf-btn wf-btn-primary" href="new-listing.html">Виправити поля</a></article>'
    else:
        body = '<article class="wf-msg"><h3>Публікуємо оголошення…</h3><p>Після збереження оголошення стане активним.</p><button type="button" disabled>Публікуємо оголошення…</button><p><a href="my-listings.html">Показати опубліковане оголошення</a></p></article>'
    return appbar("Нове оголошення", "my-listings.html") + form + zone("публікація", body) + tabbar("ads", True)


def content_my_listings(state: str) -> str:
    if state == "успіх":
        body = '<ul class="wf-list"><li><article class="wf-card"><h3>Оболонь, 8&nbsp;500&nbsp;₴/міс</h3><p>оголошення активне · оновлено 2 дні тому</p><p>7 заявок · 2 активні чати</p><a href="people.html">Шукати мешканця серед профілів</a> <button type="button">Закрити оголошення</button></article></li><li><article class="wf-card"><h3>Позняки, 6&nbsp;200&nbsp;₴/міс</h3><p>оголошення закрито · мешканця знайдено</p><button type="button">Знову зробити активним</button></article></li></ul>'
    else:
        body = '<article class="wf-msg"><h3>Оголошення ще немає</h3><p>Опублікуй кімнату, щоб шукачі побачили район, ціну й умови.</p><a class="wf-btn wf-btn-primary" href="new-listing.html">Опублікувати оголошення</a></article>'
    return appbar("Мої оголошення") + zone("перелік", body) + tabbar("ads", True)


def content_chats(state: str) -> str:
    if state == "успіх":
        body = '<ul class="wf-list"><li><article class="wf-card"><h3>Олег · Оболонь, 8&nbsp;500&nbsp;₴/міс</h3><p>Заявку прийнято — чат відкрито</p><a class="wf-btn wf-btn-primary" href="chat.html">Відкрити чат</a></article></li><li><article class="wf-card"><h3>Настя · Позняки, 6&nbsp;200&nbsp;₴/міс</h3><p>Очікуємо відповідь на заявку…</p><a href="chats-loading.html">Перевірити стан</a></article></li><li><article class="wf-card"><h3>Тарас · Солом’янка, 11&nbsp;000&nbsp;₴/міс</h3><p>Заявка протухла без відповіді</p><a href="listings.html">Шукати інший варіант</a></article></li><li><article class="wf-card"><h3>Юля · Нивки, 5&nbsp;400&nbsp;₴/міс</h3><p>Чат замовк, домовленості немає</p><a href="listings.html">Повернутися до пошуку</a></article></li></ul>'
    elif state == "порожньо":
        body = '<article class="wf-msg"><h3>Заявок ще не надсилали</h3><p>Знайди кімнату й надішли першу заявку автору.</p><a class="wf-btn wf-btn-primary" href="listings.html">Перейти до стрічки кімнат</a></article>'
    elif state == "помилка":
        body = '<article class="wf-msg"><h3>Заявку відхилено</h3><p>Ця лінія спілкування завершена, але в стрічці є інші варіанти.</p><a class="wf-btn wf-btn-primary" href="listings.html">Повернутися до пошуку</a></article>'
    else:
        body = '<article class="wf-msg"><h3>Очікуємо відповідь на заявку…</h3><p>Відповіді від автора ще немає.</p><button type="button" disabled>Очікуємо відповідь…</button><p><a href="chat.html">Заявку прийнято</a> · <a href="chats-error.html">Заявку відхилено</a></p></article><article class="wf-msg wf-msg-dead"><h3>Заявка протухла без відповіді</h3><p>Ця лінія завершена без відповіді.</p><a href="listings.html">Шукати інший варіант</a></article>'
    return appbar("Заявки і чати") + zone("список розмов", body) + tabbar("chats")


def content_report(_: str) -> str:
    reason = zone("причина", '''<fieldset><legend>Що сталося?</legend><label><input type="radio" name="reason" checked> Вимагають гроші наперед</label><br><label><input type="radio" name="reason"> Фейкове оголошення</label><br><label><input type="radio" name="reason"> Образи або спам</label></fieldset><label class="wf-field" for="details"><span>Деталі для модерації</span><textarea id="details">Автор просить передоплату до перегляду кімнати.</textarea></label>''')
    result = zone("результат", '''<p><b>Безпечно уникнула шахрайства, контакт розірвано.</b></p><p>Олег не зможе писати тобі, а модерація отримає скаргу.</p><button class="wf-btn-primary wf-btn-block" type="submit">Надіслати скаргу й заблокувати</button><p><a href="chat.html">Скасувати й повернутися в чат</a></p>''')
    return appbar("Безпека розмови", "chat.html") + f'<form action="chats.html" method="get">{reason}{result}</form>'


def content_review(_: str) -> str:
    experience = zone("досвід", '''<article class="wf-card"><h3>Олег, 29 · власник кімнати</h3><p>Оболонь, 8&nbsp;500&nbsp;₴/міс · заселення підтверджено</p></article><label class="wf-field" for="review"><span>Що варто знати майбутнім співмешканцям?</span><textarea id="review">Оголошення відповідало кімнаті, про умови домовились чесно.</textarea></label><label><input type="checkbox" checked> Умови оголошення були правдивими</label>''')
    publish = zone("публікація", '''<p><b>Оселилася безпечно, лишила чесний відгук.</b></p><p>Відгук з’явиться у профілі Олега та вплине на бейдж «перевірено».</p><button class="wf-btn-primary wf-btn-block" type="submit">Опублікувати відгук</button>''')
    return appbar("Відгук після заселення", "chat.html") + f'<form action="person.html" method="get">{experience}{publish}</form>'


CONTENT = {
    "listings": content_listings, "signup": content_signup, "role": content_role,
    "filters": content_filters, "listing": content_listing, "chat": content_chat,
    "profile-edit": content_profile_edit, "profile-social": content_profile_social,
    "people": content_people, "person": content_person, "new-listing": content_new_listing,
    "my-listings": content_my_listings, "chats": content_chats,
    "report": content_report, "review": content_review,
}


def render_page(page: dict, state: str, available: set[str]) -> str:
    current = filename(page, state)
    tree = tree_html(current, available)
    # `.wf-btn` уже повноширинна; старий `.wf-btn-block` не повертаємо у HTML.
    main = (CONTENT[page["base"]](state)
            .replace(" wf-btn-block", "")
            .replace(' class="wf-btn-block"', ""))
    return f'''<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Куток · {page["title"]} · {state}</title>
  <link rel="stylesheet" href="wireframe.css">
  <link rel="stylesheet" href="wf-shell.css">
</head>
<body>
<div class="wf">
{tree}
  <div class="wf-screen">
    <h1>{page["title"]}</h1>
    <nav class="wf-states" aria-label="Стани екрана">
      {state_switcher(page, state)}
    </nav>
    <div class="wf-canvas">
      <main class="wf-device">
{main}
      </main>
    </div>
  </div>
</div>
</body>
</html>
'''


def render_index(available: set[str]) -> str:
    groups = []
    for group, label in GROUPS:
        items = []
        for page in (item for item in PAGES if item["group"] == group):
            states = ''.join(f'<li><a href="{filename(page, state)}">{state}</a></li>' for state in page["states"])
            items.append(f'<li><strong>{page["title"]}</strong><ul>{states}</ul></li>')
        groups.append(f'<section data-zone="розділ {group.lower()}"><h2>{group}. {label}</h2><ul>{"".join(items)}</ul></section>')
    return f'''<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Куток · Всі вайрфрейми</title>
  <link rel="stylesheet" href="wireframe.css">
  <link rel="stylesheet" href="wf-shell.css">
</head>
<body>
<div class="wf">
{tree_html(None, available)}
  <div class="wf-screen wf-screen-index">
    <h1>Всі екрани і стани</h1>
    <main class="wf-index">{"".join(groups)}</main>
  </div>
</div>
</body>
</html>
'''


def targets_for(stage: int) -> list[dict]:
    if stage == 5:
        return [BY_BASE["listings"]]
    if stage in (6, 7):
        return [page for page in PAGES if page["base"] in MAIN]
    return PAGES


def build(stage: int) -> None:
    validate_feed_content()
    targets = targets_for(stage)
    available = {name for page in targets for name in all_filenames(page)}
    if stage >= 8:
        available.add("index.html")
    (ROOT / "_tree.html").write_text(tree_html(None, available) + "\n", encoding="utf-8")
    for page in targets:
        for state in page["states"]:
            html = render_page(page, state, available)
            if stage == 7:
                def disable_missing(match: re.Match[str]) -> str:
                    target = match.group(2).split('#', 1)[0]
                    if target in available:
                        return match.group(0)
                    label = re.sub(r'<[^>]+>', '', match.group(4))
                    return f'<span class="is-absent" title="екран буде додано на кроці 08">{label}</span>'
                html = re.sub(r'<a([^>]*?)href="([^"#]+\.html(?:#[^"]*)?)"([^>]*)>(.*?)</a>', disable_missing, html, flags=re.S)
            (ROOT / filename(page, state)).write_text(html, encoding="utf-8")
    if stage >= 8:
        (ROOT / "index.html").write_text(render_index(available), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=int, choices=(5, 6, 7, 8), required=True)
    build(parser.parse_args().stage)
