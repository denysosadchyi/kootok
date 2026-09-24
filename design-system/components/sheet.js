/* Куток · поведінка bottom sheet (kit-sheet). Vanilla, без залежностей.
   Прогресивне покращення над <details class="kit-sheet" data-kit-sheet>:
   без скрипта details лишається в потоці сторінки й відкривається нативно
   (див. sheet.css, стан :not([data-kit-sheet-ready])). Скрипт:
   - робить details модальним діалогом (role="dialog", aria-modal, aria-labelledby
     на .kit-sheet__title), додає кнопку «Закрити» і backdrop, якщо їх немає;
   - відкриває шторку з тригерів [aria-controls="<id шторки>"], синхронізує aria-expanded;
   - тримає фокус усередині, закриває Escape, backdrop, «Закрити», submit і reset форми;
   - повертає фокус на тригер.
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

  function enhance(sheet) {
    if (sheet.hasAttribute("data-kit-sheet-ready")) return;
    if (!sheet.id) sheet.id = "kit-sheet-" + (++uid);
    var title = sheet.querySelector(".kit-sheet__title");
    if (title && !title.id) title.id = sheet.id + "-title";
    var label = title ? title.textContent.trim().toLowerCase() : "шторку";

    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
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
    var previous = null;

    function focusable() {
      return Array.prototype.slice.call(sheet.querySelectorAll("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href]"))
        .filter(function (node) { return node.getClientRects().length; });
    }
    function syncExpanded(open) {
      triggers.forEach(function (trigger) { trigger.setAttribute("aria-expanded", String(open)); });
    }
    function openSheet() {
      previous = document.activeElement;
      resetHorizontalScroll(sheet);
      sheet.open = true;
      document.documentElement.classList.add("kit-sheet-open");
      syncExpanded(true);
      close.focus();
    }
    function closeSheet() {
      if (!sheet.open) return;
      sheet.open = false;
      document.documentElement.classList.remove("kit-sheet-open");
      syncExpanded(false);
      var target = previous && previous.focus && previous !== document.body ? previous : triggers[0];
      if (target) target.focus({ preventScroll: true });
      resetHorizontalScroll(sheet);
    }

    triggers.forEach(function (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("click", openSheet);
    });
    close.addEventListener("click", closeSheet);
    backdrop.addEventListener("click", closeSheet);
    var summary = sheet.querySelector("summary");
    if (summary) summary.addEventListener("click", function (event) { event.preventDefault(); });
    sheet.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); closeSheet(); return; }
      if (event.key !== "Tab") return;
      var items = focusable();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    var form = sheet.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (event) { event.preventDefault(); closeSheet(); });
      // reset спрацьовує до скидання полів; закриваємо після нього.
      form.addEventListener("reset", function () { setTimeout(closeSheet, 0); });
    }
    sheet.setAttribute("data-kit-sheet-ready", "");
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll("details.kit-sheet[data-kit-sheet]"), enhance);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
