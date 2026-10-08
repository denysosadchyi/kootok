/* Куток · поведінка split-view (kit-split). Vanilla, без залежностей.
   Прогресивне покращення над <div class="kit-split" data-kit-split>: без
   скрипта (і нижче 64rem контейнера оболонки) посилання карток ведуть на
   повні сторінки деталі. Скрипт від 64rem (прапорець --kit-split-enabled
   виставляє split-view.css у @container kit-shell-frame):
   - клік на картку [data-kit-split-key] (посилання всередині неї) не
     переходить на сторінку, а підвантажує її <main> (fetch того ж origin) у
     .kit-split__content; прибирає службовий футер, знижує h2 → h3 під
     заголовок правої колонки, додає префікс до id, щоб не зіткнутися з id
     стрічки; заголовок колонки — <title> сторінки без «Куток — »;
   - вибрана картка отримує aria-current="true" на посиланні заголовка
     (стан «вибрано» у listing.css), решта — без нього;
   - адреса: ?<param>=<ключ> через history.pushState; «Назад»/«Вперед» браузера
     відновлюють вибір (popstate); пряме посилання з параметром на десктопі
     одразу відкриває split, на вужчих ширинах параметр ігнорується;
   - «Закрити» (.kit-split__close) і Escape повертають сітку, фокус — на
     посилання картки;
   - якщо фільтр (sheet.js, подія kit-filter-change) сховав вибрану картку,
     split закривається;
   - висота sticky-колонок — висота прокручуваного предка (--kit-scrollport-block);
     колонки-панелі (kit-split--panels) — до низу області мінус поля, ≥ --size-panel-min.
   Рух (DESIGN.md «Анімація», робота — звʼязок список → деталь; лише transform
   і opacity, тривалості й криві — з токенів через getComputedStyle):
   - перше відкриття (клік, «Назад»/«Вперед»): деталь виростає з вибраної
     картки (FLIP: translate + scale + opacity), картки переїжджають із сітки в
     колонку (FLIP: translate + opacity), --dur-slow;
   - закриття: картки так само переїжджають назад у сітку, деталь зникає одразу;
   - зміна картки при відкритій деталі: вміст проявляється (атрибут
     data-kit-split-enter, рух — у split-view.css);
   - відкриття з адреси при завантаженні сторінки — без руху;
   - prefers-reduced-motion: руху немає зовсім — ні переїздів і росту (WAAPI),
     ні CSS-прояви (data-kit-split-enter не ставиться): деталь одразу стоїть
     на місці з opacity 1. Навіть 0.01 мс прояви дали б один кадр із
     opacity 0 — блимання замість миттєвої зміни.
   Завантаження (робота — статус процесу): поки вміст підвантажується, деталь
   має aria-busy="true", а поверх вибраної картки видно текст
   .kit-split__status (role="status", aria-live="polite"; текст — атрибут
   data-kit-split-loading кореня або «Завантажуємо…»). Статус зʼявляється й
   ховається разом з aria-busy в усіх режимах руху; без зменшеного руху старий
   вміст відкритої деталі ще й рівно пульсує (split-view.css). Скрипт не чекає
   animationend/transitionend, тож тривалість ≈0 нічого не ламає. Підключення:
   <script src="/kootok/design-system/components/split-view.js" defer></script> */
(function () {
  "use strict";

  function scrollParent(node) {
    var parent = node.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      var overflow = getComputedStyle(parent).overflowY;
      if (overflow === "auto" || overflow === "scroll") return parent;
      parent = parent.parentElement;
    }
    return null;
  }

  /* Висота sticky-колонок — висота видимої області прокрутки (рамка або
     вікно). Колонки-панелі (split-view.css) беруть її мінус два поля, але не
     нижче --size-panel-min. Раніше від неї віднімали все, що стоїть під split
     (футер, а через розтягнутий рядок оболонки — і висоту панелі фільтрів):
     на низькому вікні це давало зворотний зв'язок і колонки стискалися до 0. */
  function columnHeight(root) {
    var parent = scrollParent(root);
    return parent ? parent.clientHeight : window.innerHeight;
  }

  function enhance(root) {
    if (root.hasAttribute("data-kit-split-ready")) return;
    var param = root.getAttribute("data-kit-split-param") || "item";
    var detail = root.querySelector(".kit-split__detail");
    var content = detail && detail.querySelector(".kit-split__content");
    var title = detail && detail.querySelector(".kit-split__title");
    var close = detail && detail.querySelector(".kit-split__close");
    if (!detail || !content || !title) return;
    var defaultTitle = title.textContent;

    var entries = {};
    Array.prototype.forEach.call(root.querySelectorAll("[data-kit-split-key]"), function (item) {
      var key = item.getAttribute("data-kit-split-key");
      var main = item.querySelector("h3 a[href]") || item.querySelector("a[href]");
      if (!key || !main) return;
      entries[key] = { key: key, item: item, link: main, href: main.getAttribute("href"), cache: null };
    });

    var current = null;
    var token = 0;

    /* Текстовий статус завантаження: створюється один раз і живе в корені, щоб
       live-регіон існував до першої зміни. Позиція — над вибраною карткою
       (--kit-split-status-top/-left відносно кореня, split-view.css). */
    var status = root.querySelector(".kit-split__status");
    if (!status) {
      status = document.createElement("p");
      status.className = "kit-split__status";
      root.appendChild(status);
    }
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.hidden = true;
    var loadingText = root.getAttribute("data-kit-split-loading") || status.textContent.trim() || "Завантажуємо…";
    status.textContent = "";

    function busy(entry) {
      detail.setAttribute("aria-busy", "true");
      var rootBox = root.getBoundingClientRect();
      var itemBox = entry.item.getBoundingClientRect();
      root.style.setProperty("--kit-split-status-top", (itemBox.top - rootBox.top) + "px");
      root.style.setProperty("--kit-split-status-left", (itemBox.left - rootBox.left) + "px");
      status.hidden = false;
      status.textContent = loadingText;
    }
    function idle() {
      detail.removeAttribute("aria-busy");
      status.hidden = true;
      status.textContent = "";
    }

    function enabled() {
      return getComputedStyle(root).getPropertyValue("--kit-split-enabled").trim() === "1";
    }
    function keyFromUrl() {
      var key = new URLSearchParams(location.search).get(param);
      return key && entries[key] ? key : null;
    }
    function urlFor(key) {
      var url = new URL(location.href);
      if (key) url.searchParams.set(param, key); else url.searchParams.delete(param);
      return url.pathname + url.search + url.hash;
    }

    function load(entry) {
      if (!entry.cache) {
        var url = new URL(entry.href, location.href);
        entry.cache = fetch(url.href, { credentials: "same-origin" })
          .then(function (response) { if (!response.ok) throw new Error(String(response.status)); return response.text(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, "text/html");
            var main = doc.querySelector("main");
            if (!main) throw new Error("no main");
            var fragment = document.createDocumentFragment();
            Array.prototype.forEach.call(main.children, function (node) {
              if (node.classList.contains("kit-footer")) return;
              fragment.appendChild(document.importNode(node, true));
            });
            var holder = document.createElement("div");
            holder.appendChild(fragment);
            // Адреси — відносно сторінки деталі, не стрічки.
            Array.prototype.forEach.call(holder.querySelectorAll("[src],[href]"), function (node) {
              ["src", "href"].forEach(function (attr) {
                var value = node.getAttribute(attr);
                if (!value || value.charAt(0) === "#") return;
                var resolved = new URL(value, url);
                node.setAttribute(attr, resolved.origin === location.origin ? resolved.pathname + resolved.search + resolved.hash : resolved.href);
              });
            });
            // id з префіксом + оновлені посилання на них.
            var prefix = "split-" + entry.key + "-";
            Array.prototype.forEach.call(holder.querySelectorAll("[id]"), function (node) { node.id = prefix + node.id; });
            Array.prototype.forEach.call(holder.querySelectorAll("[aria-labelledby],[aria-describedby],[for]"), function (node) {
              ["aria-labelledby", "aria-describedby", "for"].forEach(function (attr) {
                var value = node.getAttribute(attr);
                if (value) node.setAttribute(attr, value.split(/\s+/).map(function (id) { return prefix + id; }).join(" "));
              });
            });
            // Заголовок колонки — h2, тож заголовки деталі на рівень нижче.
            Array.prototype.forEach.call(holder.querySelectorAll("h2"), function (h2) {
              var h3 = document.createElement("h3");
              Array.prototype.forEach.call(h2.attributes, function (attr) { h3.setAttribute(attr.name, attr.value); });
              while (h2.firstChild) h3.appendChild(h2.firstChild);
              h2.parentNode.replaceChild(h3, h2);
            });
            var heading = (doc.title || "").replace(/^Куток\s*[—-]\s*/, "").trim();
            return { nodes: Array.prototype.slice.call(holder.childNodes), title: heading || defaultTitle };
          });
        entry.cache.catch(function () { entry.cache = null; });
      }
      return entry.cache;
    }

    /* Токени руху з CSS (DESIGN.md «Анімація»): JS не тримає власних чисел.
       null — рух вимкнено (prefers-reduced-motion) або WAAPI недоступний. */
    function reducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    function motionTokens() {
      if (!detail.animate || reducedMotion()) return null;
      var style = getComputedStyle(root);
      return {
        slow: parseFloat(style.getPropertyValue("--dur-slow")) || 0,
        standard: style.getPropertyValue("--ease-standard").trim(),
        enter: style.getPropertyValue("--ease-enter").trim()
      };
    }

    function visibleItems() {
      return Array.prototype.filter.call(root.querySelectorAll("[data-kit-split-key]"), function (item) { return !item.closest("[hidden]"); });
    }

    function measure(items) {
      return items.map(function (item) { return item.getBoundingClientRect(); });
    }

    /* FLIP (лише transform і opacity): картки, які перестрибнули з сітки в
       колонку (або назад), переїжджають зі старого місця на нове; розмір
       змінюється одразу, а вміст картки проявляється, тож зміна форми не різка. */
    function flipItems(items, before, motion) {
      items.forEach(function (item, index) {
        var from = before[index];
        var to = item.getBoundingClientRect();
        var dx = from.left - to.left;
        var dy = from.top - to.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        item.animate([
          { transform: "translate(" + dx + "px, " + dy + "px)", opacity: 0.5 },
          { transform: "none", opacity: 1 }
        ], { duration: motion.slow, easing: motion.standard });
      });
    }

    /* Деталь «виростає» з вибраної картки: стартує з її прямокутника
       (translate + scale від лівого верхнього кута) і прозорості, приходить
       на своє місце. Звʼязок картка → колонка деталі. */
    function growFrom(from, motion) {
      var to = detail.getBoundingClientRect();
      if (!to.width || !to.height) return;
      detail.animate([
        { transformOrigin: "0 0", transform: "translate(" + (from.left - to.left) + "px, " + (from.top - to.top) + "px) scale(" + (from.width / to.width) + ", " + (from.height / to.height) + ")", opacity: 0 },
        { transformOrigin: "0 0", transform: "none", opacity: 1 }
      ], { duration: motion.slow, easing: motion.enter });
    }

    /* Перезапуск появи: атрибут знімається, примусовий reflow, ставиться знову —
       CSS-анімація стартує заново на кожен вибір. */
    function enter(node) {
      detail.removeAttribute("data-kit-split-enter");
      content.removeAttribute("data-kit-split-enter");
      void node.offsetWidth;
      node.setAttribute("data-kit-split-enter", "");
    }

    function markCurrent(key) {
      Object.keys(entries).forEach(function (name) {
        var link = entries[name].link;
        if (name === key) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
      });
    }

    /* Вибрана картка має лишитися видимою в лівій колонці (у сітці вона могла
       бути нижче). Прокручуємо лише саму колонку, не сторінку й не рамку:
       scrollIntoView зрушив би й зовнішній контейнер, і шапка вилетіла б угору. */
    function revealInList(item) {
      var list = root.querySelector(".kit-split__list");
      if (!list || list.scrollHeight <= list.clientHeight) return;
      var itemBox = item.getBoundingClientRect();
      var listBox = list.getBoundingClientRect();
      if (itemBox.top < listBox.top || itemBox.height > listBox.height) list.scrollTop += itemBox.top - listBox.top;
      else if (itemBox.bottom > listBox.bottom) list.scrollTop += itemBox.bottom - listBox.bottom;
    }

    function setScrollport() {
      root.style.setProperty("--kit-scrollport-block", columnHeight(root) + "px");
    }

    function open(key, options) {
      var entry = entries[key];
      if (!entry) return;
      options = options || {};
      var mine = ++token;
      busy(entry);
      load(entry).then(function (result) {
        if (mine !== token) return;
        current = key;
        content.replaceChildren.apply(content, result.nodes.map(function (node) { return node.cloneNode(true); }));
        title.textContent = result.title;
        var wasOpen = root.getAttribute("data-kit-split-state") === "open";
        var motion = options.animate && !wasOpen ? motionTokens() : null;
        var items = motion ? visibleItems() : [];
        var before = measure(items);
        var cardBox = motion ? entry.item.getBoundingClientRect() : null;
        root.setAttribute("data-kit-split-state", "open");
        detail.hidden = false;
        idle();
        detail.scrollTop = 0;
        markCurrent(key);
        setScrollport();
        revealInList(entry.item);
        if (motion) {
          flipItems(items, before, motion);
          growFrom(cardBox, motion);
        } else if ((wasOpen || options.animate) && !reducedMotion()) enter(wasOpen ? content : detail);
        if (options.history === "push") history.pushState({ kitSplit: key }, "", urlFor(key));
        else if (options.history === "replace") history.replaceState({ kitSplit: key }, "", urlFor(key));
        if (options.focus) title.focus({ preventScroll: true });
      }, function () {
        if (mine !== token) return;
        idle();
        // Вміст не підвантажився — відкриваємо повну сторінку, як без скрипта.
        if (options.fallback !== false) location.href = entry.href;
      });
    }

    function shut(options) {
      options = options || {};
      token++;
      idle();
      var previous = current;
      current = null;
      var motion = options.animate && root.getAttribute("data-kit-split-state") === "open" ? motionTokens() : null;
      var items = motion ? visibleItems() : [];
      var before = measure(items);
      root.removeAttribute("data-kit-split-state");
      detail.hidden = true;
      content.replaceChildren();
      title.textContent = defaultTitle;
      markCurrent(null);
      if (motion) flipItems(items, before, motion);
      if (options.history === "push") history.pushState({ kitSplit: null }, "", urlFor(null));
      else if (options.history === "replace") history.replaceState({ kitSplit: null }, "", urlFor(null));
      if (options.focus && previous && entries[previous]) entries[previous].link.focus({ preventScroll: false });
    }

    root.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest("a[href]");
      var item = link && link.closest("[data-kit-split-key]");
      if (!item || !root.contains(item) || !enabled()) return;
      var key = item.getAttribute("data-kit-split-key");
      if (!entries[key]) return;
      event.preventDefault();
      if (key === current) { title.focus({ preventScroll: true }); return; }
      open(key, { history: "push", focus: true, animate: true });
    });
    if (close) close.addEventListener("click", function () { shut({ history: "push", focus: true, animate: true }); });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || event.defaultPrevented || !current || !enabled()) return;
      if (document.documentElement.classList.contains("kit-sheet-open")) return;
      event.preventDefault();
      shut({ history: "push", focus: true, animate: true });
    });
    window.addEventListener("popstate", function () {
      if (!enabled()) return;
      var key = keyFromUrl();
      if (key && key !== current) open(key, { fallback: false, animate: true });
      else if (!key && current) shut({ focus: true, animate: true });
    });
    root.addEventListener("kit-filter-change", function () {
      if (current && entries[current] && entries[current].item.closest("li[hidden]")) shut({ history: "replace" });
    });

    var wasEnabled = null;
    function sync() {
      var now = enabled();
      if (now) setScrollport();
      if (now === wasEnabled) return;
      wasEnabled = now;
      if (now) {
        var key = keyFromUrl();
        if (key && key !== current) open(key, { fallback: false });
      } else if (current) {
        // Нижче десктопа split немає: деталь ховається, позначка «вибрано» знімається,
        // адреса лишається — повернення до десктопа відновить вибір.
        shut({});
      }
    }

    sync();
    /* Висоту області прокрутки стежимо і на самій області: рамка (курсова чи
       вікно) може змінити висоту, не змінивши розміру кореня, — тоді
       --kit-scrollport-block лишався б застарілим (у рамці «Десктоп» — 844
       замість 1008) і виправлявся б лише при відкритті деталі, а колонка
       стрибала б по висоті через кілька кадрів після появи. */
    if (window.ResizeObserver) {
      var observer = new ResizeObserver(sync);
      observer.observe(root);
      var scroller = scrollParent(root);
      if (scroller) observer.observe(scroller);
    }
    window.addEventListener("resize", sync);
    root.setAttribute("data-kit-split-ready", "");
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll(".kit-split[data-kit-split]"), enhance);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
