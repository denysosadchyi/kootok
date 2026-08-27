(function () {
  "use strict";

  if (window.top !== window.self) return;

  var base = "/kootok/";
  var path = decodeURI(location.pathname).replace(/\/$/, "/index.html");
  var mobileQuery = matchMedia("(max-width: 899px)");
  var collapseKey = "kootok-course-sidebar-collapsed";
  var groupKey = "kootok-course-group-";
  var previousFocus = null;
  var isPrototype = path.indexOf(base + "lesson-6/") === 0 || path.indexOf(base + "beginners/source/prototype/") === 0;

  var lessons = [
    { short: "01", label: "01 · Продукт і бриф", href: "index.html#lesson-1", paths: ["/kootok/index.html"] },
    { short: "02", label: "02 · Дослідження", href: "research.html", paths: ["/kootok/research.html", "/kootok/research/research.html"] },
    { short: "02", label: "02 · Персони та JTBD", href: "personas.html", paths: ["/kootok/personas.html", "/kootok/research/personas.html"] },
    { short: "03", label: "03 · Інформаційна архітектура", href: "ia.html", paths: ["/kootok/ia.html", "/kootok/research/ia.html"] },
    { short: "04", label: "04 · Вайрфрейми", href: "research/wireframes.html", paths: ["/kootok/research/wireframes.html"] },
    { short: "05", label: "05 · Voice & tone", href: "voice.md", paths: ["/kootok/voice.md"] },
    { short: "05", label: "05 · Мікрокопі", href: "microcopy.md", paths: ["/kootok/microcopy.md"] },
    { short: "06", label: "06 · Зелений двір", href: "lesson-6-concept.html", paths: ["/kootok/lesson-6-concept.html", "/kootok/beginners/source/concept.html"] }
  ];

  var states = [
    ["Стрічка · успіх", "listings.html"], ["Стрічка · порожньо", "listings-empty.html"],
    ["Стрічка · помилка", "listings-error.html"], ["Стрічка · очікування", "listings-loading.html"],
    ["Оголошення · успіх", "listing.html"], ["Оголошення · помилка", "listing-error.html"],
    ["Оголошення · очікування", "listing-loading.html"], ["Профіль · анкета", "compatibility-form.html"],
    ["Профіль · помилка", "compatibility-form-error.html"], ["Профіль · очікування", "compatibility-form-loading.html"],
    ["Заявка · успіх", "application.html"], ["Заявка · помилка", "application-error.html"],
    ["Заявка · очікування", "application-loading.html"]
  ].map(function (item) {
    return {
      short: item[1].replace(/\.html$/, "").slice(0, 2).toUpperCase(),
      label: item[0], href: "lesson-6/" + item[1],
      paths: [base + "lesson-6/" + item[1], base + "beginners/source/prototype/" + item[1]]
    };
  });

  function isCurrent(item) {
    if (item.href.indexOf("index.html") === 0 && (location.pathname === base || path === base + "index.html")) return true;
    return item.paths.indexOf(path) !== -1;
  }

  function link(item) {
    var current = isCurrent(item);
    return "<li><a class=\"course-shell__link\" data-short=\"" + item.short + "\" href=\"" + base + item.href + "\"" +
      (current ? " aria-current=\"page\"" : "") + "><span>" + item.label + "</span></a></li>";
  }

  function group(id, label, items, openByDefault) {
    var stored = localStorage.getItem(groupKey + id);
    var hasCurrent = items.some(isCurrent);
    var open = stored === null ? (openByDefault || hasCurrent) : stored === "1";
    return "<details class=\"course-shell__group\" data-group=\"" + id + "\"" + (open ? " open" : "") + ">" +
      "<summary data-short=\"" + (id === "lessons" ? "01–06" : "06") + "\"><span>" + label + "</span><span class=\"course-shell__chevron\" aria-hidden=\"true\"></span></summary>" +
      "<ul>" + items.map(link).join("") + "</ul></details>";
  }

  document.documentElement.classList.add("has-course-nav");
  if (localStorage.getItem(collapseKey) === "1") document.documentElement.classList.add("course-sidebar-collapsed");
  if (isPrototype) {
    document.body.classList.add("course-nav--prototype");
  }

  var main = document.querySelector("main");
  if (main && !main.id) main.id = "course-main";

  if (isPrototype && !document.querySelector(".prototype-device")) {
    var device = document.createElement("div");
    var deviceScreen = document.createElement("div");
    var deviceContent = document.createElement("div");
    var productHeader = document.querySelector(".product-header");
    device.className = "prototype-device";
    deviceScreen.className = "prototype-device__screen";
    deviceContent.className = "prototype-device__content";
    deviceScreen.setAttribute("data-device-screen", "390 × 844");
    Array.from(document.body.childNodes).forEach(function (node) {
      if (node !== productHeader) deviceContent.appendChild(node);
    });
    deviceScreen.appendChild(deviceContent);
    if (productHeader) deviceScreen.appendChild(productHeader);
    device.appendChild(deviceScreen);
    document.body.appendChild(device);
  }

  var sidebar = document.createElement("aside");
  sidebar.className = "course-shell";
  sidebar.id = "course-shell";
  sidebar.setAttribute("aria-label", "Матеріали курсу");
  sidebar.innerHTML =
    "<header class=\"course-shell__header\"><a class=\"course-shell__brand\" href=\"" + base + "\" aria-label=\"Куток — усі матеріали\">" +
      "<span class=\"course-shell__mark\" aria-hidden=\"true\">К</span><span class=\"course-shell__brand-copy\"><strong>Куток</strong><small>курс 01–06</small></span></a>" +
      "<button class=\"course-shell__close\" type=\"button\" aria-label=\"Закрити навігацію\">×</button></header>" +
    "<nav class=\"course-shell__tree\" aria-label=\"Навігація матеріалами курсу\">" +
      group("lessons", "Матеріали 01–06", lessons, true) + group("states", "06 · Продуктові стани", states, false) +
    "</nav><button class=\"course-shell__collapse\" type=\"button\" aria-controls=\"course-shell\"><span>Згорнути панель</span></button>";

  var mobileBar = document.createElement("header");
  mobileBar.className = "course-mobilebar";
  mobileBar.innerHTML = "<a href=\"" + base + "\" class=\"course-mobilebar__brand\">Куток · матеріали</a>" +
    "<button class=\"course-mobilebar__open\" type=\"button\" aria-controls=\"course-shell\" aria-expanded=\"false\"><span aria-hidden=\"true\"></span> Розділи</button>";

  var backdrop = document.createElement("div");
  backdrop.className = "course-shell__backdrop";
  backdrop.setAttribute("aria-hidden", "true");

  document.body.prepend(backdrop);
  document.body.prepend(sidebar);
  document.body.prepend(mobileBar);

  document.querySelectorAll("body > .mobtop, body > .mobile, .app > .sidebar").forEach(function (node) { node.remove(); });

  var openButton = mobileBar.querySelector(".course-mobilebar__open");
  var closeButton = sidebar.querySelector(".course-shell__close");
  var collapseButton = sidebar.querySelector(".course-shell__collapse");

  function setDrawer(open, restoreFocus) {
    document.documentElement.classList.toggle("course-drawer-open", open);
    openButton.setAttribute("aria-expanded", String(open));
    backdrop.setAttribute("aria-hidden", String(!open));
    if (mobileQuery.matches) {
      sidebar.toggleAttribute("inert", !open);
      sidebar.setAttribute("aria-hidden", String(!open));
    } else {
      sidebar.removeAttribute("inert");
      sidebar.removeAttribute("aria-hidden");
    }
    if (open) {
      previousFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : openButton;
      closeButton.focus();
    } else if (restoreFocus && previousFocus) {
      previousFocus.focus();
    }
  }

  function syncMode() {
    document.documentElement.classList.remove("course-drawer-open");
    openButton.setAttribute("aria-expanded", "false");
    backdrop.setAttribute("aria-hidden", "true");
    if (mobileQuery.matches) {
      sidebar.setAttribute("inert", "");
      sidebar.setAttribute("aria-hidden", "true");
    } else {
      sidebar.removeAttribute("inert");
      sidebar.removeAttribute("aria-hidden");
    }
  }

  openButton.addEventListener("click", function () { setDrawer(true, false); });
  closeButton.addEventListener("click", function () { setDrawer(false, true); });
  backdrop.addEventListener("click", function () { setDrawer(false, true); });
  collapseButton.addEventListener("click", function () {
    var collapsed = document.documentElement.classList.toggle("course-sidebar-collapsed");
    localStorage.setItem(collapseKey, collapsed ? "1" : "0");
    collapseButton.setAttribute("aria-expanded", String(!collapsed));
    collapseButton.querySelector("span").textContent = collapsed ? "Розгорнути панель" : "Згорнути панель";
  });

  sidebar.querySelectorAll(".course-shell__group").forEach(function (details) {
    details.addEventListener("toggle", function () { localStorage.setItem(groupKey + details.dataset.group, details.open ? "1" : "0"); });
  });

  document.addEventListener("keydown", function (event) {
    if (!mobileQuery.matches || !document.documentElement.classList.contains("course-drawer-open")) return;
    if (event.key === "Escape") { event.preventDefault(); setDrawer(false, true); return; }
    if (event.key !== "Tab") return;
    var focusable = Array.from(sidebar.querySelectorAll("a[href], button:not([disabled]), summary")).filter(function (node) { return node.getClientRects().length; });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  mobileQuery.addEventListener("change", syncMode);
  collapseButton.setAttribute("aria-expanded", String(!document.documentElement.classList.contains("course-sidebar-collapsed")));
  collapseButton.querySelector("span").textContent = document.documentElement.classList.contains("course-sidebar-collapsed") ? "Розгорнути панель" : "Згорнути панель";
  syncMode();
})();
