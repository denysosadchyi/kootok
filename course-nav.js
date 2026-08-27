(function () {
  "use strict";

  var base = "/kootok/";
  var path = location.pathname.replace(/\/$/, "/index.html");
  var states = [
    ["Стрічка · успіх", "lesson-6/listings.html"],
    ["Стрічка · порожньо", "lesson-6/listings-empty.html"],
    ["Стрічка · помилка", "lesson-6/listings-error.html"],
    ["Стрічка · очікування", "lesson-6/listings-loading.html"],
    ["Оголошення · успіх", "lesson-6/listing.html"],
    ["Оголошення · помилка", "lesson-6/listing-error.html"],
    ["Оголошення · очікування", "lesson-6/listing-loading.html"],
    ["Профіль · анкета", "lesson-6/compatibility-form.html"],
    ["Профіль · помилка", "lesson-6/compatibility-form-error.html"],
    ["Профіль · очікування", "lesson-6/compatibility-form-loading.html"],
    ["Заявка · успіх", "lesson-6/application.html"],
    ["Заявка · помилка", "lesson-6/application-error.html"],
    ["Заявка · очікування", "lesson-6/application-loading.html"]
  ];

  var lessons = [
    ["01 · Продукт і бриф", "index.html#lesson-1"],
    ["02 · Дослідження", "research.html"],
    ["02 · Персони та JTBD", "personas.html"],
    ["03 · Інформаційна архітектура", "ia.html"],
    ["04 · Вайрфрейми", "research/wireframes.html"],
    ["05 · Voice & tone", "voice.md"],
    ["05 · Мікрокопі", "microcopy.md"],
    ["06 · Зелений двір", "lesson-6-concept.html"]
  ];

  function item(label, href, stateItem) {
    var absolute = base + href;
    var currentPath = absolute.split("#")[0];
    var current = path === currentPath || (href === "index.html#lesson-1" && path === base + "index.html");
    return "<li><a class=\"course-nav__link\" href=\"" + absolute + "\"" +
      (current ? " aria-current=\"page\"" : "") + ">" + label + "</a></li>";
  }

  function tree(mobile) {
    return (mobile ? "<nav class=\"course-nav__mobile-panel\" aria-label=\"Навігація матеріалами курсу\">" : "") +
      "<p class=\"course-nav__group\">Навчальний маршрут</p>" +
      "<ul class=\"course-nav__list\">" + lessons.map(function (entry) { return item(entry[0], entry[1]); }).join("") + "</ul>" +
      "<p class=\"course-nav__group\">06 · Продуктові стани</p>" +
      "<ul class=\"course-nav__list course-nav__list--states\">" + states.map(function (entry) { return item(entry[0], entry[1], true); }).join("") + "</ul>" +
      (mobile ? "</nav>" : "");
  }

  document.documentElement.classList.add("has-course-nav");
  if (path === base + "index.html") document.body.classList.add("course-nav--root");
  if (path.indexOf(base + "lesson-6/") === 0) document.body.classList.add("course-nav--prototype");

  var desktop = document.createElement("nav");
  desktop.className = "course-nav";
  desktop.setAttribute("aria-label", "Навігація матеріалами курсу");
  desktop.innerHTML = "<a class=\"course-nav__brand\" href=\"" + base + "index.html\"><span class=\"course-nav__brand-mark\">К</span><span class=\"course-nav__brand-copy\"><strong>Куток</strong><span>матеріали 01–06</span></span></a>" + tree(false);

  var mobile = document.createElement("details");
  mobile.className = "course-nav__mobile";
  mobile.setAttribute("aria-label", "Навігація матеріалами курсу");
  mobile.innerHTML = "<summary><strong>Куток · матеріали 01–06</strong><span>Зміст</span></summary>" + tree(true);

  document.body.prepend(desktop, mobile);
})();
