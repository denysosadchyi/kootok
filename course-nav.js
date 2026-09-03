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
  var isWireframeWorkspace = path === base + "research/wireframes.html";

  var tree = [
    {
      id: "foundation", short: "01–03", label: "Основа продукту", open: true,
      items: [
        { short: "01", label: "Продукт і бриф", href: "index.html#lesson-1", paths: ["/kootok/index.html"] },
        { short: "02", label: "Дослідження ринку", href: "research.html", paths: ["/kootok/research.html", "/kootok/research/research.html"] },
        { short: "02", label: "Персони та JTBD", href: "personas.html", paths: ["/kootok/personas.html", "/kootok/research/personas.html"] },
        { short: "03", label: "Інформаційна архітектура", href: "ia.html", paths: ["/kootok/ia.html", "/kootok/research/ia.html"] }
      ]
    },
    {
      id: "structure", short: "04–05", label: "Структура і текст", open: true,
      items: [
        { short: "04", label: "Вайрфрейми", href: "research/wireframes.html", paths: ["/kootok/research/wireframes.html"] },
        { short: "05", label: "Voice & tone", href: "voice.html", paths: ["/kootok/voice.html"] },
        { short: "05", label: "Мікрокопі", href: "microcopy.html", paths: ["/kootok/microcopy.html"] }
      ]
    },
    {
      id: "visual", short: "06", label: "Візуальна мова", open: true,
      items: [
        { short: "06", label: "Концепт «Зелений двір»", href: "lesson-6-concept.html", paths: ["/kootok/lesson-6-concept.html", "/kootok/beginners/source/concept.html"] },
        { short: "06", label: "Прототип уроку 6", href: "lesson-6/listings.html", paths: ["/kootok/lesson-6/listings.html"], prototypeWorkspace: true }
      ]
    },
    {
      id: "kit", short: "07", label: "UI-кіт", open: true,
      items: [
        { short: "07", label: "Вітрина кіта", href: "ui/kit.html", paths: ["/kootok/ui/kit.html"] },
        { short: "07", label: "Оболонка продукту", href: "ui/shell.html", paths: ["/kootok/ui/shell.html"] }
      ]
    }
  ];

  function isCurrent(item) {
    if (item.href.indexOf("index.html") === 0 && (location.pathname === base || path === base + "index.html")) return true;
    if (item.prototypeWorkspace && isPrototype) return true;
    return item.paths.indexOf(path) !== -1;
  }

  function link(item) {
    var current = isCurrent(item);
    return "<li><a class=\"course-shell__link\" data-short=\"" + item.short + "\" href=\"" + base + item.href + "\"" +
      (current ? " aria-current=\"page\"" : "") + "><span>" + item.label + "</span></a></li>";
  }

  function group(node) {
    var stored = localStorage.getItem(groupKey + node.id);
    var hasCurrent = node.items.some(isCurrent);
    var open = stored === null ? (node.open || hasCurrent) : stored === "1" || hasCurrent;
    return "<details class=\"course-shell__group\" data-group=\"" + node.id + "\"" + (open ? " open" : "") + ">" +
      "<summary data-short=\"" + node.short + "\"><span>" + node.label + "</span><span class=\"course-shell__chevron\" aria-hidden=\"true\"></span></summary>" +
      "<ul>" + node.items.map(link).join("") + "</ul></details>";
  }

  document.documentElement.classList.add("has-course-nav");
  if (localStorage.getItem(collapseKey) === "1") document.documentElement.classList.add("course-sidebar-collapsed");
  if (isPrototype) {
    document.body.classList.add("course-nav--prototype");
  }
  if (isWireframeWorkspace) document.body.classList.add("course-nav--wireframes");

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

  function setupStateSwitcher() {
    var currentFile = path.split("/").pop();
    var families = [
      [["listings.html", "Успіх"], ["listings-empty.html", "Порожньо"], ["listings-error.html", "Помилка"], ["listings-loading.html", "Завантаження"]],
      [["listing.html", "Успіх"], ["listing-error.html", "Помилка"], ["listing-loading.html", "Завантаження"]],
      [["compatibility-form.html", "Успіх"], ["compatibility-form-error.html", "Помилка"], ["compatibility-form-loading.html", "Завантаження"]],
      [["application.html", "Успіх"], ["application-error.html", "Помилка"], ["application-loading.html", "Завантаження"], ["application-sent.html", "Надіслано"]]
    ];
    var family = families.find(function (items) { return items.some(function (item) { return item[0] === currentFile; }); });
    if (!family) return null;
    var nav = document.createElement("nav");
    nav.className = "state-switcher";
    nav.setAttribute("aria-label", "Стани екрана");
    nav.innerHTML = family.map(function (item) {
      return "<a href=\"" + item[0] + "\"" + (item[0] === currentFile ? " aria-current=\"page\"" : "") + ">" + item[1] + "</a>";
    }).join("");
    return nav;
  }

  function setupLessonWorkspace() {
    var device = document.querySelector(".prototype-device");
    var currentFile = path.split("/").pop();
    var families = [
      ["Пошук", "listings.html", ["listings.html", "listings-empty.html", "listings-error.html", "listings-loading.html"]],
      ["Оголошення", "listing.html", ["listing.html", "listing-error.html", "listing-loading.html"]],
      ["Сумісність", "compatibility-form.html", ["compatibility-form.html", "compatibility-form-error.html", "compatibility-form-loading.html"]],
      ["Заявка", "application.html", ["application.html", "application-error.html", "application-loading.html", "application-sent.html"]],
      ["Чати", "chats.html", ["chats.html"]], ["Розмова", "chat.html", ["chat.html"]], ["Профіль", "profile.html", ["profile.html"]]
    ];
    var panel = document.createElement("aside");
    panel.className = "lesson-family-panel";
    panel.setAttribute("aria-label", "Екрани уроку 6");
    panel.innerHTML = "<h2>Екрани уроку 6</h2><nav>" + families.map(function (family) {
      var current = family[2].indexOf(currentFile) !== -1;
      return "<a href=\"" + base + "lesson-6/" + family[1] + "\"" + (current ? " aria-current=\"page\"" : "") + ">" + family[0] + "</a>";
    }).join("") + "</nav>";
    if (device) {
      var workspace = document.createElement("div");
      workspace.className = "lesson-workspace";
      device.parentNode.insertBefore(workspace, device);
      var switcher = setupStateSwitcher();
      if (switcher) workspace.appendChild(switcher);
      workspace.appendChild(device);
      workspace.parentNode.insertBefore(panel, workspace);
    } else if (isWireframeWorkspace) {
      document.body.prepend(panel);
      var app = document.querySelector(".app");
      if (app) {
        app.className = "wireframe-overview";
        app.innerHTML = "<main><p class=\"wireframe-overview__eyebrow\">Урок 04 · інтерактивні вайрфрейми</p><h1>Сторінки продукту «Куток»</h1><p>Огляд сімейств екранів уроку 6. Відкрий потрібний маршрут і перемикай його стани над прототипом.</p><ul>" + families.map(function (family) { return "<li><a href=\"/kootok/lesson-6/" + family[1] + "\"><strong>" + family[0] + "</strong><span>Відкрити інтерактивний маршрут</span></a></li>"; }).join("") + "</ul></main>";
      }
    }
  }

  setupLessonWorkspace();

  document.querySelectorAll(".product-nav__link--create").forEach(function (link) {
    link.textContent = "";
    link.setAttribute("aria-label", "Додати оголошення");
  });

  document.querySelectorAll(".trust-chips > span").forEach(function (chip) {
    var label = chip.textContent.toLowerCase();
    if (label.indexOf("відео") !== -1) chip.dataset.trust = "video";
    else if (label.indexOf("профіль") !== -1) chip.dataset.trust = "profile";
  });

  document.querySelectorAll('input[type="date"]').forEach(function (input) {
    input.addEventListener("click", function () {
      if (typeof input.showPicker === "function") {
        try { input.showPicker(); } catch (_) { /* Native fallback remains available. */ }
      }
    });
  });

  function setupFilterSheet() {
    var sheet = document.querySelector("details.filters");
    if (!sheet) return;

    sheet.id = "listing-filters-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-labelledby", "listing-filters-title");
    sheet.removeAttribute("open");
    var title = sheet.querySelector(".summary-label");
    if (title) title.id = "listing-filters-title";

    var close = document.createElement("button");
    close.className = "filters-close";
    close.type = "button";
    close.setAttribute("aria-label", "Закрити фільтри");
    close.textContent = "Закрити";
    sheet.insertBefore(close, sheet.querySelector(".filters-body"));

    var fab = document.createElement("button");
    fab.className = "filters-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Відкрити фільтри");
    fab.setAttribute("aria-controls", sheet.id);
    fab.setAttribute("aria-expanded", "false");
    fab.innerHTML = "<span aria-hidden=\"true\"></span>";

    var backdrop = document.createElement("button");
    backdrop.className = "filters-backdrop";
    backdrop.type = "button";
    backdrop.tabIndex = -1;
    backdrop.setAttribute("aria-label", "Закрити фільтри");

    var host = document.querySelector(".prototype-device__screen") || document.body;
    host.appendChild(backdrop);
    host.appendChild(fab);
    var previous = null;

    function focusable() {
      return Array.from(sheet.querySelectorAll("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[href]"));
    }
    function openSheet() {
      previous = document.activeElement;
      sheet.open = true;
      document.documentElement.classList.add("filters-sheet-open");
      fab.setAttribute("aria-expanded", "true");
      close.focus();
    }
    function closeSheet() {
      sheet.open = false;
      document.documentElement.classList.remove("filters-sheet-open");
      fab.setAttribute("aria-expanded", "false");
      if (previous && previous.focus) previous.focus(); else fab.focus();
    }

    fab.addEventListener("click", openSheet);
    close.addEventListener("click", closeSheet);
    backdrop.addEventListener("click", closeSheet);
    sheet.querySelector("summary").addEventListener("click", function (event) { event.preventDefault(); });
    sheet.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); closeSheet(); return; }
      if (event.key !== "Tab") return;
      var items = focusable();
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    var form = sheet.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (event) { event.preventDefault(); closeSheet(); });
      form.addEventListener("reset", function () { requestAnimationFrame(closeSheet); });
    }
  }

  setupFilterSheet();

  var sidebar = document.createElement("aside");
  sidebar.className = "course-shell";
  sidebar.id = "course-shell";
  sidebar.setAttribute("aria-label", "Матеріали курсу");
  sidebar.innerHTML =
    "<header class=\"course-shell__header\"><a class=\"course-shell__brand\" href=\"" + base + "\" aria-label=\"Куток — усі матеріали\">" +
      "<span class=\"course-shell__mark\" aria-hidden=\"true\">К</span><span class=\"course-shell__brand-copy\"><strong>Куток</strong><small>курс 01–07</small></span></a>" +
      "<button class=\"course-shell__close\" type=\"button\" aria-label=\"Закрити навігацію\"><span aria-hidden=\"true\"></span></button></header>" +
    "<nav class=\"course-shell__tree\" aria-label=\"Навігація матеріалами курсу\">" +
      tree.map(group).join("") +
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
