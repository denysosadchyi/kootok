/* Куток · поведінка поля дати (kit-field--date). Vanilla, прогресивне покращення.
   form.css ховає нативний індикатор календаря й малює іконку кіта, тому клік
   по полю відкриває нативний picker через showPicker(); без скрипта або без
   підтримки showPicker дата вводиться з клавіатури, як у звичайному полі.
   Підключення: <script src="/kootok/design-system/components/form.js" defer></script> */
(function () {
  "use strict";
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.kit-field--date input[type="date"]'), function (input) {
      input.addEventListener("click", function () {
        if (typeof input.showPicker !== "function") return;
        try { input.showPicker(); } catch (_) { /* Нативне введення лишається доступним. */ }
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
