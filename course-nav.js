(function () {
  "use strict";

  var themeKey = "kootok-color-theme";
  var themeQuery = matchMedia("(prefers-color-scheme: dark)");

  function savedTheme() {
    try {
      var value = localStorage.getItem(themeKey);
      return value === "dark" || value === "light" ? value : null;
    } catch (_) {
      return null;
    }
  }

  function preferredTheme() {
    return savedTheme() || (themeQuery.matches ? "dark" : "light");
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  /* Runs before the navigation DOM is built. With the shared script loaded in
     the head this is the earliest safe central hook; no page markup is cloned. */
  applyTheme(preferredTheme());

  if (window.top !== window.self) return;

  var base = "/kootok/";
  var path = decodeURI(location.pathname).replace(/\/$/, "/index.html");
  var mobileQuery = matchMedia("(max-width: 899px)");
  var collapseKey = "kootok-course-sidebar-collapsed";
  var groupKey = "kootok-course-group-";
  var previousFocus = null;
  var prototypeSource = base + "beginners/source/prototype/";
  var chatsScreen = base + "design-system/examples/chats.html";
  /* П'ятий екран сценарію — «Чати» (зібраний лише з кіта) — має ту саму курсову рамку. */
  var isPrototype = path.indexOf(base + "lesson-6/") === 0 || path.indexOf(prototypeSource) === 0 || path === chatsScreen;
  /* Один маршрут для family-панелі: джерельний шлях нормалізуємо до alias lesson-6/. */
  var routePath = path.indexOf(prototypeSource) === 0 ? base + "lesson-6/" + path.slice(prototypeSource.length) : path;

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* Стан панелі живе лише до перезавантаження. */ }
  }

  var tree = [
    {
      id: "research", short: "01–02", label: "Дослідження", open: true,
      items: [
        { short: "01", label: "Бриф продукту", href: "index.html#lesson-1", paths: ["/kootok/index.html"] },
        { short: "02", label: "Дослідження ринку", href: "research.html", paths: ["/kootok/research.html", "/kootok/research/research.html"] },
        { short: "02", label: "Персони і JTBD", href: "personas.html", paths: ["/kootok/personas.html", "/kootok/research/personas.html"] }
      ]
    },
    {
      id: "structure", short: "03–04", label: "Структура", open: true,
      items: [
        { short: "03", label: "Інформаційна архітектура", href: "ia.html", paths: ["/kootok/ia.html", "/kootok/research/ia.html"] },
        { short: "04", label: "Вайрфрейми · архів", href: "archive/product-wireframes/README.md", paths: ["/kootok/archive/product-wireframes/README.md"] }
      ]
    },
    {
      id: "text", short: "05", label: "Текст", open: true,
      items: [
        { short: "05", label: "Голос продукту", href: "voice.html", paths: ["/kootok/voice.html"] },
        { short: "05", label: "Мікрокопі", href: "microcopy.html", paths: ["/kootok/microcopy.html"] }
      ]
    },
    {
      id: "look", short: "06–08", label: "Вигляд", open: true,
      items: [
        { short: "06", label: "Концепт «Зелений двір»", href: "concept.md", paths: ["/kootok/concept.md"] },
        { short: "06", label: "Ранній прототип · 5 екранів", href: "lesson-6/listings.html", paths: ["/kootok/lesson-6/listings.html"], prototypeWorkspace: true },
        { short: "07", label: "Вітрина UI-кіта", href: "ui/kit.html", paths: ["/kootok/ui/kit.html"] },
        { short: "07", label: "Оболонка продукту", href: "ui/shell.html", paths: ["/kootok/ui/shell.html"] },
        { short: "08", label: "Дизайн-система", href: "design-system/docs/index.html", paths: ["/kootok/design-system/docs/index.html"] },
        { short: "08", label: "Токени", href: "ui/tokens.html", paths: ["/kootok/ui/tokens.html"] }
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
    var stored = safeGet(groupKey + node.id);
    var hasCurrent = node.items.some(isCurrent);
    var open = stored === null ? (node.open || hasCurrent) : stored === "1" || hasCurrent;
    return "<details class=\"course-shell__group\" data-group=\"" + node.id + "\"" + (open ? " open" : "") + ">" +
      "<summary data-short=\"" + node.short + "\"><span>" + node.label + "</span><span class=\"course-shell__chevron\" aria-hidden=\"true\"></span></summary>" +
      "<ul>" + node.items.map(link).join("") + "</ul></details>";
  }

  document.documentElement.classList.add("has-course-nav");
  if (safeGet(collapseKey) === "1") document.documentElement.classList.add("course-sidebar-collapsed");
  if (isPrototype) {
    document.body.classList.add("course-nav--prototype");
  }

  var main = document.querySelector("main");
  if (main && !main.id) main.id = "course-main";
  var skipTarget = main ? main.id : "course-main";

  if (isPrototype && !document.querySelector(".prototype-device")) {
    var device = document.createElement("div");
    var deviceScreen = document.createElement("div");
    var deviceContent = document.createElement("div");
    device.className = "prototype-device";
    deviceScreen.className = "prototype-device__screen";
    deviceContent.className = "prototype-device__content";
    deviceScreen.setAttribute("data-device-screen", "390 × 844");
    Array.from(document.body.childNodes).forEach(function (node) { deviceContent.appendChild(node); });
    deviceScreen.appendChild(deviceContent);
    var productDock = deviceContent.querySelector(".kit-tabbar--dock");
    if (productDock) {
      deviceScreen.classList.add("prototype-device__screen--with-dock");
      deviceContent.classList.add("prototype-device__content--with-dock");
      deviceScreen.appendChild(productDock);
    }
    deviceContent.scrollLeft = 0;
    device.appendChild(deviceScreen);
    document.body.appendChild(device);
  }

  function setupLessonWorkspace() {
    var device = document.querySelector(".prototype-device");
    if (!isPrototype || !device) return;
    var families = [
      ["Пошук", base + "lesson-6/listings.html"],
      ["Оголошення", base + "lesson-6/listing.html"],
      ["Сумісність", base + "lesson-6/compatibility-form.html"],
      ["Заявка", base + "lesson-6/application.html"],
      ["Чати", chatsScreen]
    ];
    var panel = document.createElement("aside");
    panel.className = "lesson-family-panel";
    panel.setAttribute("aria-labelledby", "lesson-family-title");
    panel.innerHTML = "<p class=\"course-family__title\" id=\"lesson-family-title\">Екрани уроку 6</p><nav aria-labelledby=\"lesson-family-title\">" + families.map(function (family) {
      var current = family[1] === routePath;
      return "<a href=\"" + family[1] + "\"" + (current ? " aria-current=\"page\"" : "") + ">" + family[0] + "</a>";
    }).join("") + "</nav>";
    if (device) {
      var workspace = document.createElement("div");
      workspace.className = "lesson-workspace";
      device.parentNode.insertBefore(workspace, device);
      workspace.appendChild(device);
      workspace.parentNode.insertBefore(panel, workspace);
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
    // Лише екрани прототипу: docs-зразки шторки статичні й не прив'язуються.
    var sheet = isPrototype ? document.querySelector("details.kit-sheet") : null;
    if (!sheet) return;

    sheet.id = "listing-filters-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-labelledby", "listing-filters-title");
    sheet.removeAttribute("open");
    var title = sheet.querySelector(".kit-sheet__title");
    if (title) title.id = "listing-filters-title";

    var close = document.createElement("button");
    close.className = "kit-sheet__close";
    close.type = "button";
    close.setAttribute("aria-label", "Закрити фільтри");
    close.textContent = "Закрити";
    sheet.insertBefore(close, sheet.querySelector(".kit-sheet__body"));

    var backdrop = document.createElement("button");
    backdrop.className = "kit-sheet-backdrop";
    backdrop.type = "button";
    backdrop.tabIndex = -1;
    backdrop.setAttribute("aria-label", "Закрити фільтри");

    var host = document.querySelector(".prototype-device__screen") || document.body;
    host.appendChild(backdrop);
    var triggers = Array.from(document.querySelectorAll('[aria-controls="' + sheet.id + '"]'));
    var previous = null;

    function resetHorizontalPosition() {
      [document.scrollingElement, document.documentElement, document.body,
        document.querySelector(".prototype-device__content"),
        document.querySelector(".prototype-device__screen")].forEach(function (node) {
        if (node) node.scrollLeft = 0;
      });
    }

    function focusable() {
      return Array.from(sheet.querySelectorAll("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href]"));
    }
    function syncExpanded(open) {
      triggers.forEach(function (trigger) { trigger.setAttribute("aria-expanded", String(open)); });
    }
    function openSheet() {
      previous = document.activeElement;
      resetHorizontalPosition();
      sheet.open = true;
      document.documentElement.classList.add("kit-sheet-open");
      syncExpanded(true);
      close.focus();
    }
    function closeSheet() {
      sheet.open = false;
      document.documentElement.classList.remove("kit-sheet-open");
      syncExpanded(false);
      if (previous && previous.focus) previous.focus({ preventScroll: true }); else if (triggers[0]) triggers[0].focus({ preventScroll: true });
      resetHorizontalPosition();
      requestAnimationFrame(resetHorizontalPosition);
    }

    triggers.forEach(function (trigger) { trigger.addEventListener("click", openSheet); });
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
      "<span class=\"course-shell__mark\" aria-hidden=\"true\">К</span><span class=\"course-shell__brand-copy\"><strong>Куток</strong><small>курс 01–08</small></span></a>" +
      "<button class=\"course-shell__close\" type=\"button\" aria-label=\"Закрити навігацію\"><span aria-hidden=\"true\"></span></button></header>" +
    "<nav class=\"course-shell__tree\" aria-label=\"Навігація матеріалами курсу\">" +
      tree.map(group).join("") +
    "</nav><div class=\"course-shell__actions\">" +
      "<button class=\"course-shell__theme\" type=\"button\" aria-pressed=\"false\"><span aria-hidden=\"true\"></span><b>Темна тема</b></button>" +
      "<button class=\"course-shell__collapse\" type=\"button\" aria-controls=\"course-shell\"><span>Згорнути панель</span></button></div>";

  var mobileBar = document.createElement("header");
  mobileBar.className = "course-mobilebar";
  mobileBar.innerHTML = "<a href=\"" + base + "\" class=\"course-mobilebar__brand\">Куток · матеріали</a>" +
    "<button class=\"course-mobilebar__open\" type=\"button\" aria-controls=\"course-shell\" aria-expanded=\"false\"><span aria-hidden=\"true\"></span> Розділи</button>";

  var backdrop = document.createElement("div");
  backdrop.className = "course-shell__backdrop";
  backdrop.setAttribute("aria-hidden", "true");

  var skip = document.createElement("a");
  skip.className = "course-skip";
  skip.href = "#" + skipTarget;
  skip.textContent = "До вмісту";

  document.body.prepend(backdrop);
  document.body.prepend(sidebar);
  document.body.prepend(mobileBar);
  if (!document.querySelector(".docs-skip, .course-skip")) document.body.prepend(skip);

  document.querySelectorAll(".mobtop, .mobile, .app > .sidebar").forEach(function (node) { node.remove(); });
  // На сторінці галереї власна панель проєкту зникає — сітка переходить у режим «дерево екранів + сцена».

  var openButton = mobileBar.querySelector(".course-mobilebar__open");
  var closeButton = sidebar.querySelector(".course-shell__close");
  var themeButton = sidebar.querySelector(".course-shell__theme");
  var collapseButton = sidebar.querySelector(".course-shell__collapse");

  function syncThemeButton() {
    var dark = document.documentElement.dataset.theme === "dark";
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.setAttribute("aria-label", dark ? "Увімкнути світлу тему" : "Увімкнути темну тему");
    themeButton.querySelector("b").textContent = dark ? "Світла тема" : "Темна тема";
  }

  themeButton.addEventListener("click", function () {
    var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(themeKey, next); } catch (_) { /* Theme still works for this page. */ }
    applyTheme(next);
    syncThemeButton();
  });

  themeQuery.addEventListener("change", function (event) {
    if (savedTheme()) return;
    applyTheme(event.matches ? "dark" : "light");
    syncThemeButton();
  });

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
    safeSet(collapseKey, collapsed ? "1" : "0");
    collapseButton.setAttribute("aria-expanded", String(!collapsed));
    collapseButton.querySelector("span").textContent = collapsed ? "Розгорнути панель" : "Згорнути панель";
  });

  sidebar.querySelectorAll(".course-shell__group").forEach(function (details) {
    details.addEventListener("toggle", function () { safeSet(groupKey + details.dataset.group, details.open ? "1" : "0"); });
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
  syncThemeButton();
  syncMode();
})();
