/* Куток · поведінка шторки фільтрів (kit-sheet). Vanilla, без залежностей.
   Прогресивне покращення над <details class="kit-sheet" data-kit-sheet>:
   без скрипта details лишається в потоці сторінки й відкривається нативно
   (див. sheet.css, стан :not([data-kit-sheet-ready])).

   Режим «шторка» (телефон і планшет, а також kit-sheet без --panel):
   - details стає модальним діалогом (role="dialog", aria-modal, aria-labelledby
     на .kit-sheet__title), додаються кнопка «Закрити» і backdrop, якщо їх немає;
   - шторку відкривають тригери [aria-controls="<id шторки>"], aria-expanded синхронізується;
   - фокус тримається всередині; Escape, backdrop, «Закрити», submit і reset закривають;
   - фокус повертається на тригер.
   Режим «панель» (kit-sheet--panel, контейнер оболонки від 64rem = --bp-desktop;
   прапорець --kit-sheet-mode: panel ставить sheet.css у @container):
   - details відкритий постійно, role="region" замість діалогу, без фокус-пастки;
   - тригери «Фільтри» і кнопка submit («Застосувати») приховані;
   - будь-яка зміна поля застосовується одразу; «Скинути» вимкнена, поки
     форма в типовому стані;
   - висота sticky-панелі — висота прокручуваного предка (--kit-scrollport-block).
   Режим перемикається сам, коли змінюється ширина контейнера (ResizeObserver).

   Фільтрація стрічки (лише форма з data-kit-filter-target="<id списку>"):
   кожен li списку несе data-filter-<поле>; поле форми з тим самим name
   порівнюється на рівність, price-min / price-max — як межі ціни, move-in —
   «заїзд не пізніше» (порожня дата в li = за домовленістю, підходить завжди).
   Порожнє значення атрибута в li означає «не вказано» і не відсіює картку.
   Лічильник (data-kit-filter-count) і порожній результат
   (data-kit-filter-empty) оновлюються; на списку спрацьовує подія
   kit-filter-change. У прототипі фільтр працює лише по завантажених картках.

   Анімацій немає: стан перемикається миттєво. Підключення:
   <script src="/kootok/design-system/components/sheet.js" defer></script> */
(function () {
  "use strict";

  var uid = 0;

  function resetHorizontalScroll(sheet) {
    // Відкриття шторки не має зсувати сторінку чи рамку вбік (fixed-елемент
    // у предку з transform може спровокувати горизонтальний скрол).
    var node = sheet.parentElement;
    while (node) { node.scrollLeft = 0; node = node.parentElement; }
    if (document.scrollingElement) document.scrollingElement.scrollLeft = 0;
  }

  /* Висота області, в якій прокручується сторінка: найближчий предок з
     overflow-y auto/scroll (курсова рамка) або вікно. */
  function scrollportHeight(node) {
    var parent = node.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      var overflow = getComputedStyle(parent).overflowY;
      if (overflow === "auto" || overflow === "scroll") return parent.clientHeight;
      parent = parent.parentElement;
    }
    return window.innerHeight;
  }

  function groupDigits(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function fieldValue(form, name) {
    var field = form.elements[name];
    if (!field) return "";
    if (typeof RadioNodeList !== "undefined" && field instanceof RadioNodeList) return field.value;
    return field.value || "";
  }

  function isPristine(form) {
    return Array.prototype.every.call(form.elements, function (field) {
      if (field.type === "radio" || field.type === "checkbox") return field.checked === field.defaultChecked;
      if (field.tagName === "SELECT") return Array.prototype.every.call(field.options, function (option) { return option.selected === option.defaultSelected; });
      if (field.tagName === "INPUT" || field.tagName === "TEXTAREA") return field.value === field.defaultValue;
      return true;
    });
  }

  /* Рядок стану: «Тип · Район · Ціна» (+ «ще N» за іншими полями). */
  function stateText(form, fallback) {
    if (isPristine(form)) return fallback;
    var type = form.querySelector('input[name="type"]:checked');
    var district = fieldValue(form, "district");
    var min = fieldValue(form, "price-min");
    var max = fieldValue(form, "price-max");
    var price = "Будь-яка ціна";
    if (min && max) price = groupDigits(min) + "–" + groupDigits(max) + " грн";
    else if (min) price = "від " + groupDigits(min) + " грн";
    else if (max) price = "до " + groupDigits(max) + " грн";
    var parts = [type && type.getAttribute("data-kit-state") || "Усі типи", district || "Будь-який район", price];
    var known = { type: 1, district: 1, "price-min": 1, "price-max": 1 };
    var extra = 0;
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || known[field.name] || field.type === "submit" || field.type === "reset") return;
      if (field.value) extra++;
    });
    if (extra) parts.push("ще " + extra);
    return parts.join(" · ");
  }

  function matches(item, form) {
    var ok = true;
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!ok || !field.name || field.type === "submit" || field.type === "reset") return;
      if ((field.type === "radio" || field.type === "checkbox") && !field.checked) return;
      var value = field.value;
      if (!value || value === "all") return;
      if (field.name === "price-min" || field.name === "price-max") {
        var price = Number(item.getAttribute("data-filter-price"));
        if (!price) return;
        if (field.name === "price-min" && price < Number(value)) ok = false;
        if (field.name === "price-max" && price > Number(value)) ok = false;
        return;
      }
      var own = item.getAttribute("data-filter-" + field.name);
      if (own === null || own === "") return;
      if (field.name === "move-in") { if (own > value) ok = false; return; }
      if (own !== value) ok = false;
    });
    return ok;
  }

  function applyFilters(form, sheet) {
    var state = sheet.querySelector(".kit-sheet__state");
    if (state) {
      if (!state.hasAttribute("data-kit-default")) state.setAttribute("data-kit-default", state.textContent);
      state.textContent = stateText(form, state.getAttribute("data-kit-default"));
    }
    var list = document.getElementById(form.getAttribute("data-kit-filter-target") || "");
    if (!list) return;
    var items = Array.prototype.filter.call(list.children, function (node) { return node.tagName === "LI"; });
    var shown = 0;
    items.forEach(function (item) {
      var visible = matches(item, form);
      item.hidden = !visible;
      if (visible) shown++;
    });
    var count = document.getElementById(form.getAttribute("data-kit-filter-count") || "");
    if (count) {
      if (!count.hasAttribute("data-kit-default")) count.setAttribute("data-kit-default", count.textContent);
      count.textContent = isPristine(form) ? count.getAttribute("data-kit-default") : "Підходять: " + shown + " із " + items.length + " показаних";
    }
    var empty = document.getElementById(form.getAttribute("data-kit-filter-empty") || "");
    if (empty) empty.hidden = shown !== 0;
    list.dispatchEvent(new CustomEvent("kit-filter-change", { bubbles: true, detail: { shown: shown, total: items.length } }));
  }

  function enhance(sheet) {
    if (sheet.hasAttribute("data-kit-sheet-ready")) return;
    if (!sheet.id) sheet.id = "kit-sheet-" + (++uid);
    var title = sheet.querySelector(".kit-sheet__title");
    if (title && !title.id) title.id = sheet.id + "-title";
    var label = title ? title.textContent.trim().toLowerCase() : "шторку";

    if (title) sheet.setAttribute("aria-labelledby", title.id);
    sheet.removeAttribute("open");

    var close = sheet.querySelector(".kit-sheet__close");
    if (!close) {
      close = document.createElement("button");
      close.className = "kit-sheet__close";
      close.type = "button";
      close.setAttribute("aria-label", "Закрити " + label);
      close.textContent = "Закрити";
      sheet.insertBefore(close, sheet.querySelector(".kit-sheet__body"));
    }

    var backdrop = sheet.nextElementSibling;
    if (!backdrop || !backdrop.classList.contains("kit-sheet-backdrop")) {
      backdrop = document.createElement("button");
      backdrop.className = "kit-sheet-backdrop";
      backdrop.type = "button";
      backdrop.tabIndex = -1;
      backdrop.setAttribute("aria-label", "Закрити " + label);
      sheet.parentNode.insertBefore(backdrop, sheet.nextSibling);
    }

    var triggers = Array.prototype.slice.call(document.querySelectorAll('[aria-controls="' + sheet.id + '"]'));
    var form = sheet.querySelector("form");
    var submits = form ? Array.prototype.slice.call(form.querySelectorAll('button[type="submit"]')) : [];
    var resets = form ? Array.prototype.slice.call(form.querySelectorAll('button[type="reset"]')) : [];
    var filtering = !!(form && form.hasAttribute("data-kit-filter-target"));
    var previous = null;
    var panel = null;

    function focusable() {
      return Array.prototype.slice.call(sheet.querySelectorAll("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href]"))
        .filter(function (node) { return node.getClientRects().length; });
    }
    function syncExpanded(open) {
      triggers.forEach(function (trigger) { trigger.setAttribute("aria-expanded", String(open)); });
    }
    function syncReset() {
      var focused = resets.indexOf(document.activeElement) !== -1;
      resets.forEach(function (button) { button.disabled = panel ? isPristine(form) : false; });
      // Вимкнена «Скинути» губить фокус — переносимо його на перше поле форми.
      if (focused && resets.every(function (button) { return button.disabled; })) {
        var first = form.querySelector("input:not([type=hidden]),select,textarea");
        if (first) first.focus({ preventScroll: true });
      }
    }
    function openSheet() {
      if (panel) return;
      previous = document.activeElement;
      resetHorizontalScroll(sheet);
      sheet.open = true;
      document.documentElement.classList.add("kit-sheet-open");
      syncExpanded(true);
      close.focus();
    }
    function closeSheet(restoreFocus) {
      if (panel || !sheet.open) return;
      sheet.open = false;
      document.documentElement.classList.remove("kit-sheet-open");
      syncExpanded(false);
      if (restoreFocus !== false) {
        var target = previous && previous.focus && previous !== document.body ? previous : triggers[0];
        if (target) target.focus({ preventScroll: true });
      }
      resetHorizontalScroll(sheet);
    }

    function setMode(nextPanel) {
      if (panel === nextPanel) return;
      if (nextPanel && sheet.open) closeSheet(false);
      panel = nextPanel;
      if (panel) {
        sheet.setAttribute("role", "region");
        sheet.removeAttribute("aria-modal");
        sheet.open = true;
        document.documentElement.classList.remove("kit-sheet-open");
      } else {
        sheet.setAttribute("role", "dialog");
        sheet.setAttribute("aria-modal", "true");
        sheet.open = false;
        sheet.style.removeProperty("--kit-scrollport-block");
      }
      triggers.forEach(function (trigger) { trigger.hidden = panel; });
      submits.forEach(function (button) { button.hidden = panel; });
      syncExpanded(false);
      syncReset();
    }
    function sync() {
      var wantPanel = sheet.classList.contains("kit-sheet--panel") &&
        getComputedStyle(sheet).getPropertyValue("--kit-sheet-mode").trim() === "panel";
      setMode(wantPanel);
      if (panel) sheet.style.setProperty("--kit-scrollport-block", scrollportHeight(sheet) + "px");
    }

    triggers.forEach(function (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("click", openSheet);
    });
    close.addEventListener("click", function () { closeSheet(); });
    backdrop.addEventListener("click", function () { closeSheet(); });
    var summary = sheet.querySelector("summary");
    if (summary) summary.addEventListener("click", function (event) { event.preventDefault(); });
    sheet.addEventListener("keydown", function (event) {
      if (panel) return;
      if (event.key === "Escape") { event.preventDefault(); closeSheet(); return; }
      if (event.key !== "Tab") return;
      var items = focusable();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (filtering) applyFilters(form, sheet);
        closeSheet();
      });
      // reset спрацьовує до скидання полів; застосовуємо й закриваємо після нього.
      form.addEventListener("reset", function () {
        setTimeout(function () {
          if (filtering) applyFilters(form, sheet);
          syncReset();
          closeSheet();
        }, 0);
      });
      // Панель: кожна зміна поля — одразу в стрічку.
      var onChange = function () {
        if (!panel) return;
        if (filtering) applyFilters(form, sheet);
        syncReset();
      };
      form.addEventListener("input", onChange);
      form.addEventListener("change", onChange);
    }

    sync();
    if (window.ResizeObserver && sheet.parentElement) new ResizeObserver(sync).observe(sheet.parentElement);
    window.addEventListener("resize", sync);
    sheet.setAttribute("data-kit-sheet-ready", "");
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll("details.kit-sheet[data-kit-sheet]"), enhance);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
