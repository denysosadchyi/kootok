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
   - висота sticky-колонок — висота прокручуваного предка (--kit-scrollport-block).
   Анімацій немає: стан змінюється миттєво. Підключення:
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

  /* Висота sticky-колонок: видима область прокрутки мінус те, що стоїть під
     split у кінці сторінки (футер, нижні поля). Інакше, докрутивши до кінця,
     колонки впираються в межу своєї обгортки й заголовок деталі йде вгору. */
  function columnHeight(root) {
    var parent = scrollParent(root);
    var viewport = parent ? parent.clientHeight : window.innerHeight;
    var end = parent ? parent.scrollHeight : document.documentElement.scrollHeight;
    var top = parent ? parent.getBoundingClientRect().top - parent.scrollTop : -window.scrollY;
    var below = Math.max(0, end - (root.getBoundingClientRect().bottom - top));
    return Math.max(0, viewport - below);
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
      detail.setAttribute("aria-busy", "true");
      load(entry).then(function (result) {
        if (mine !== token) return;
        current = key;
        content.replaceChildren.apply(content, result.nodes.map(function (node) { return node.cloneNode(true); }));
        title.textContent = result.title;
        root.setAttribute("data-kit-split-state", "open");
        detail.hidden = false;
        detail.removeAttribute("aria-busy");
        detail.scrollTop = 0;
        markCurrent(key);
        setScrollport();
        revealInList(entry.item);
        if (options.history === "push") history.pushState({ kitSplit: key }, "", urlFor(key));
        else if (options.history === "replace") history.replaceState({ kitSplit: key }, "", urlFor(key));
        if (options.focus) title.focus({ preventScroll: true });
      }, function () {
        if (mine !== token) return;
        detail.removeAttribute("aria-busy");
        // Вміст не підвантажився — відкриваємо повну сторінку, як без скрипта.
        if (options.fallback !== false) location.href = entry.href;
      });
    }

    function shut(options) {
      options = options || {};
      token++;
      var previous = current;
      current = null;
      root.removeAttribute("data-kit-split-state");
      detail.hidden = true;
      content.replaceChildren();
      title.textContent = defaultTitle;
      markCurrent(null);
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
      open(key, { history: "push", focus: true });
    });
    if (close) close.addEventListener("click", function () { shut({ history: "push", focus: true }); });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || event.defaultPrevented || !current || !enabled()) return;
      if (document.documentElement.classList.contains("kit-sheet-open")) return;
      event.preventDefault();
      shut({ history: "push", focus: true });
    });
    window.addEventListener("popstate", function () {
      if (!enabled()) return;
      var key = keyFromUrl();
      if (key && key !== current) open(key, { fallback: false });
      else if (!key && current) shut({ focus: true });
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
    if (window.ResizeObserver) new ResizeObserver(sync).observe(root);
    window.addEventListener("resize", sync);
    root.setAttribute("data-kit-split-ready", "");
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll(".kit-split[data-kit-split]"), enhance);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
