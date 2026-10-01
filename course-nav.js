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
      id: "product", short: "01", label: "Продукт", open: true,
      items: [
        { short: "01", label: "Бриф продукту", href: "index.html#lesson-1", paths: ["/kootok/index.html"] }
      ]
    },
    {
      id: "research", short: "02", label: "Дослідження", open: true,
      items: [
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
        { short: "06", label: "Активний прототип · 5 екранів", href: "lesson-6/listings.html", paths: ["/kootok/lesson-6/listings.html"], prototypeWorkspace: true },
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

  var dockHome = null;
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
      /* Місце dock в оболонці: у режимі «Десктоп» (1280 ≥ 64rem) він повертається
         в .kit-shell, щоб shell.css поставив таб-бар у рядок шапки. */
      dockHome = document.createComment(" kit-tabbar--dock ");
      productDock.parentNode.insertBefore(dockHome, productDock);
      deviceScreen.classList.add("prototype-device__screen--with-dock");
      deviceContent.classList.add("prototype-device__content--with-dock");
      deviceScreen.appendChild(productDock);
    }
    deviceContent.scrollLeft = 0;
    device.appendChild(deviceScreen);
    /* Сцена тримає масштабовані розміри рамки: transform: scale() не змінює
       layout-ширину екрана, тож container queries продукту бачать справжні 768/1280. */
    var deviceStage = document.createElement("div");
    deviceStage.className = "prototype-stage";
    deviceStage.appendChild(device);
    document.body.appendChild(deviceStage);
  }

  /* Курсовий перемикач пристроїв: лише змінює ширину рамки; екрани реагують самі. */
  var deviceKey = "kootok-prototype-device";
  var deviceModes = [
    { id: "phone", label: "Телефон", width: 390, maxHeight: 844 },
    { id: "tablet", label: "Планшет", width: 768, maxHeight: 1024 },
    { id: "desktop", label: "Десктоп", width: 1280, maxHeight: Infinity }
  ];
  function deviceMode(id) {
    return deviceModes.filter(function (mode) { return mode.id === id; })[0] || deviceModes[0];
  }
  var currentDevice = deviceMode(safeGet(deviceKey)).id;
  if (isPrototype) document.documentElement.dataset.prototypeDevice = currentDevice;

  function setupLessonWorkspace() {
    var device = document.querySelector(".prototype-device");
    if (!isPrototype || !device) return;
    var families = [
      ["Стрічка кімнат", base + "lesson-6/listings.html"],
      ["Картка оголошення", base + "lesson-6/listing.html"],
      ["Анкета сумісності", base + "lesson-6/compatibility-form.html"],
      ["Заявка", base + "lesson-6/application.html"],
      ["Чати", chatsScreen]
    ];
    var panel = document.createElement("aside");
    panel.className = "lesson-family-panel";
    panel.setAttribute("aria-labelledby", "lesson-family-title");
    /* Сторінки деталі інших оголошень (listing-<район>.html) — варіанти екрана
       «Картка оголошення», не окремі екрани: підсвічуємо той самий пункт. */
    var familyPath = routePath.replace(/\/lesson-6\/listing-[\w-]+\.html$/, "/lesson-6/listing.html");
    panel.innerHTML = "<p class=\"course-family__title\" id=\"lesson-family-title\">Активний прототип · 5 екранів</p><nav aria-labelledby=\"lesson-family-title\">" + families.map(function (family) {
      var current = family[1] === familyPath;
      return "<a href=\"" + family[1] + "\"" + (current ? " aria-current=\"page\"" : "") + ">" + family[0] + "</a>";
    }).join("") + "</nav>";
    var stage = device.closest(".prototype-stage") || device;
    var workspace = document.createElement("div");
    workspace.className = "lesson-workspace";
    stage.parentNode.insertBefore(workspace, stage);
    workspace.appendChild(stage);
    workspace.parentNode.insertBefore(panel, workspace);
    setupDeviceSwitcher(workspace, stage, device);
  }

  function setupDeviceSwitcher(workspace, stage, device) {
    var screen = device.querySelector(".prototype-device__screen");
    var switcher = document.createElement("div");
    switcher.className = "prototype-devices";
    switcher.setAttribute("role", "radiogroup");
    switcher.setAttribute("aria-label", "Ширина пристрою");
    switcher.innerHTML = deviceModes.map(function (mode) {
      return "<button class=\"prototype-devices__option prototype-devices__option--" + mode.id + "\" type=\"button\" role=\"radio\" data-device=\"" + mode.id +
        "\" aria-label=\"" + mode.label + "\" title=\"" + mode.label + " · " + mode.width + " px\"><span aria-hidden=\"true\"></span></button>";
    }).join("");
    workspace.insertBefore(switcher, stage);
    var options = Array.from(switcher.querySelectorAll("button"));
    var frameQuery = matchMedia("(min-width: 431px)");

    /* Масштаб: рамка планшета/десктопа має справжню layout-ширину 768/1280.
       Якщо центральна область вужча або нижча, рамку зменшуємо transform: scale(),
       а сцена (.prototype-stage) займає вже зменшені розміри — без горизонтального скролу. */
    function fit() {
      var mode = deviceMode(currentDevice);
      var style = document.documentElement.style;
      if (!frameQuery.matches || mode.id === "phone") {
        ["--prototype-scale", "--prototype-screen-height", "--prototype-stage-width", "--prototype-stage-height"].forEach(function (name) { style.removeProperty(name); });
        return;
      }
      var cs = getComputedStyle(workspace);
      var gap = parseFloat(cs.rowGap) || 0;
      var chrome = device.offsetWidth - screen.offsetWidth; /* рамка: padding + border */
      var availWidth = workspace.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var availHeight = window.innerHeight - Math.max(0, workspace.getBoundingClientRect().top + window.scrollY) -
        parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - switcher.offsetHeight - gap;
      var naturalWidth = mode.width + chrome;
      var scale = Math.min(1, Math.max(0.1, availWidth / naturalWidth));
      var screenHeight = Math.max(200, Math.min(mode.maxHeight, Math.floor(availHeight / scale - chrome)));
      style.setProperty("--prototype-scale", String(scale));
      style.setProperty("--prototype-screen-height", screenHeight + "px");
      style.setProperty("--prototype-stage-width", Math.floor(naturalWidth * scale) + "px");
      style.setProperty("--prototype-stage-height", Math.floor((screenHeight + chrome) * scale) + "px");
    }

    /* Телефон і планшет: dock поруч із прокручуваним вмістом, вміст закінчується над ним.
       Десктоп: dock в оболонці (таб-бар у шапці), clearance під dock не потрібен. */
    function placeDock() {
      var dock = screen.querySelector(".kit-tabbar--dock") || (dockHome && dockHome.parentNode ? dockHome.parentNode.querySelector(".kit-tabbar--dock") : null);
      if (!dock || !dockHome || !dockHome.parentNode) return;
      var content = screen.querySelector(".prototype-device__content");
      var inShell = frameQuery.matches && currentDevice === "desktop";
      if (inShell && dock.parentNode === screen) dockHome.parentNode.insertBefore(dock, dockHome.nextSibling);
      if (!inShell && dock.parentNode !== screen) screen.appendChild(dock);
      screen.classList.toggle("prototype-device__screen--with-dock", !inShell);
      content.classList.toggle("prototype-device__content--with-dock", !inShell);
    }

    function select(id, focus) {
      currentDevice = deviceMode(id).id;
      document.documentElement.dataset.prototypeDevice = currentDevice;
      options.forEach(function (option) {
        var checked = option.dataset.device === currentDevice;
        option.setAttribute("aria-checked", String(checked));
        option.tabIndex = checked ? 0 : -1;
        if (checked && focus) option.focus();
      });
      var mode = deviceMode(currentDevice);
      screen.setAttribute("data-device-screen", mode.id === "phone" ? "390 × 844" : mode.width + " px");
      placeDock();
      fit();
    }

    switcher.addEventListener("click", function (event) {
      var option = event.target.closest("button[data-device]");
      if (!option) return;
      safeSet(deviceKey, option.dataset.device);
      select(option.dataset.device, true);
    });
    switcher.addEventListener("keydown", function (event) {
      var index = options.indexOf(document.activeElement);
      if (index === -1) return;
      var next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % options.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = options.length - 1;
      if (next === null) return;
      event.preventDefault();
      safeSet(deviceKey, options[next].dataset.device);
      select(options[next].dataset.device, true);
    });

    select(currentDevice, false);
    if (window.ResizeObserver) new ResizeObserver(fit).observe(workspace);
    window.addEventListener("resize", fit);
    frameQuery.addEventListener("change", function () { placeDock(); fit(); });
  }

  setupLessonWorkspace();

  /* Продуктова поведінка (шторка фільтрів, date picker) живе в design-system/components/*.js;
     курсова оболонка лише будує рамку, навігацію й тему. */


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

  /* Статичні research-сторінки (уроки 2–3) мають власну sidebar/mobile-навігацію як
     fallback без JS; з курсовою панеллю вона зайва й прибирається. */
  document.querySelectorAll(".mobtop, .mobile, .app > .sidebar").forEach(function (node) { node.remove(); });

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
