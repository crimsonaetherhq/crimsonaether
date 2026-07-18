/* ============================================================
   CRIMSON AETHER — READER ENGINE
   Reads window.CA_SLUG (set by each chapter page), pulls the
   chapter from chapters.js, and builds the vertical reader.
   ============================================================ */

(function () {
  "use strict";

  var found = window.CA_findChapter(window.CA_SLUG);
  if (!found) {
    document.body.innerHTML =
      '<p style="padding:120px 24px;text-align:center;font-family:serif;color:#efe4cc;">' +
      'This chapter could not be found. <a href="/chapters/" style="color:#c9a84c;">Browse all chapters</a>.</p>';
    return;
  }
  var chapter = found.ch;
  var index = found.index;
  var chapters = window.CA_CHAPTERS;
  var prev = index > 0 ? chapters[index - 1] : null;
  var next = index < chapters.length - 1 ? chapters[index + 1] : null;

  /* ── storage helpers (fail silently if blocked) ── */
  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  /* ── build chrome ── */
  var $ = function (sel) { return document.querySelector(sel); };

  var titleEl = $(".chrome-title");
  titleEl.innerHTML = '<span class="ch-num">Ch. ' + chapter.num + "</span>" + chapter.title;

  var select = $(".chapter-select");
  chapters.forEach(function (c) {
    var opt = document.createElement("option");
    opt.value = c.slug;
    opt.textContent = "Ch. " + c.num + " — " + c.title;
    if (c.slug === chapter.slug) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", function () {
    window.location.href = "/chapter/" + select.value + "/";
  });

  /* ── opening plate ── */
  $(".plate-title").textContent = chapter.title;
  $(".plate-meta").textContent = "Chapter " + chapter.num + " · " + chapter.images.length + " panels";

  /* ── panel strip ── */
  var strip = $(".panel-strip");
  chapter.images.forEach(function (file, i) {
    var img = document.createElement("img");
    img.className = "panel";
    img.alt = chapter.title + " — panel " + (i + 1);
    img.src = "/" + encodeURIComponent(file);
    img.loading = i < 2 ? "eager" : "lazy";
    img.decoding = "async";
    function markLoaded() { img.classList.add("loaded"); img.removeAttribute("data-loading"); }
    if (i >= 2) img.setAttribute("data-loading", "");
    if (img.complete && img.naturalWidth > 0) markLoaded();
    else { img.addEventListener("load", markLoaded); img.addEventListener("error", markLoaded); }
    strip.appendChild(img);
  });

  /* ── width modes ── */
  var MODES = ["fit", "comfort", "wide"];
  var savedMode = read("ca-width-mode");
  var mode = MODES.indexOf(savedMode) !== -1 ? savedMode : "comfort";
  function applyMode(m) {
    mode = m;
    MODES.forEach(function (x) { strip.classList.remove("mode-" + x); });
    strip.classList.add("mode-" + m);
    document.querySelectorAll(".width-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-mode") === m);
    });
    store("ca-width-mode", m);
  }
  document.querySelectorAll(".width-btn").forEach(function (b) {
    b.addEventListener("click", function () { applyMode(b.getAttribute("data-mode")); });
  });
  applyMode(mode);

  /* ── end of chapter ── */
  var endWrap = $(".chapter-end");
  var endHtml = '<div class="end-thread"></div>';
  if (next) {
    endHtml +=
      '<p class="end-label">Continue the story</p>' +
      '<a class="next-card" href="/chapter/' + next.slug + '/">' +
      '<img class="next-cover" src="' + window.CA_coverOf(next) + '" alt="" loading="lazy" decoding="async">' +
      '<span class="next-overlay">' +
      '<span class="next-kicker">Next · Chapter ' + next.num + "</span>" +
      '<span class="next-title">' + next.title + "</span>" +
      "</span></a>";
  } else {
    endHtml +=
      '<p class="fin-mark">TO BE CONTINUED</p>' +
      '<p class="end-label">You are caught up. Follow <a href="https://x.com/finalfAIntasy" target="_blank" rel="noopener" style="color:var(--gold);text-decoration:none;">@finalfAIntasy</a> for new chapters.</p>';
  }
  endHtml += '<div class="end-row">';
  if (prev) {
    endHtml +=
      '<a class="end-btn" href="/chapter/' + prev.slug + '/">' +
      '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>Previous</a>';
  }
  endHtml += '<a class="end-btn" href="/chapters/">All chapters</a>';
  endHtml +=
    '<button class="end-btn js-share" type="button">' +
    '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/></svg>Share</button>';
  endHtml += "</div>";
  endWrap.innerHTML = endHtml;
  var nc = endWrap.querySelector(".next-cover");
  if (nc && next) nc.onerror = function () { window.CA_coverFallback(nc, next); };

  /* ── floating prev/next ── */
  var prevBtn = $(".float-btn.prev");
  var nextBtn = $(".float-btn.next");
  if (prev) { prevBtn.href = "/chapter/" + prev.slug + "/"; } else { prevBtn.classList.add("disabled"); }
  if (next) { nextBtn.href = "/chapter/" + next.slug + "/"; } else { nextBtn.classList.add("disabled"); }

  /* ── mobile dock ── */
  var dock = $(".reader-dock");
  var dockPrev = $(".dock-btn.d-prev");
  var dockNext = $(".dock-btn.d-next");
  if (dock) {
    if (prev) { dockPrev.href = "/chapter/" + prev.slug + "/"; } else { dockPrev.classList.add("disabled"); }
    if (next) { dockNext.href = "/chapter/" + next.slug + "/"; } else { dockNext.classList.add("disabled"); }
  }

  /* ── share ── */
  var toast = $(".share-toast");
  function shareUrl() {
    var c = document.querySelector('link[rel="canonical"]');
    return c ? c.href : window.location.href;
  }
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 1800);
  }
  window.CA_share = function () {
    var url = shareUrl();
    var payload = { title: "Crimson Aether — Ch. " + chapter.num + ": " + chapter.title, url: url };
    if (typeof gtag === "function") gtag("event", "share", { method: "reader", content_type: "chapter", item_id: chapter.slug });
    if (navigator.share) {
      navigator.share(payload).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { showToast("Link copied"); }, function () { showToast(url); });
    } else {
      window.prompt("Copy this link:", url);
    }
  };
  document.querySelectorAll(".js-share").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); window.CA_share(); });
  });

  /* ── crimson thread progress + chrome auto-hide ── */
  var fill = $(".thread-fill");
  var chrome = $(".reader-chrome");
  var floatNav = $(".float-nav");
  var pill = $(".panel-pill");
  var lastY = window.scrollY;
  var completed = false;
  var preloaded = false;
  var panels = strip.querySelectorAll(".panel");

  function setChromeHidden(hidden) {
    chrome.classList.toggle("hidden", hidden);
    floatNav.classList.toggle("hidden", hidden);
    if (dock) dock.classList.toggle("hidden", hidden);
    if (pill) pill.classList.toggle("show", hidden);
  }

  function updatePill() {
    if (!pill || !panels.length) return;
    var mid = window.scrollY + window.innerHeight * 0.5;
    var cur = 1;
    for (var i = 0; i < panels.length; i++) {
      var top = panels[i].offsetTop;
      if (top <= mid) cur = i + 1; else break;
    }
    pill.innerHTML = '<span class="pill-gold">' + cur + "</span> / " + panels.length;
  }

  function docHeight() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
  }

  function onScroll() {
    var y = window.scrollY;
    var h = docHeight();
    var pct = h > 0 ? Math.min(100, (y / h) * 100) : 0;
    fill.style.width = pct + "%";

    /* hide chrome scrolling down, show scrolling up */
    if (y > lastY + 6 && y > 140) {
      setChromeHidden(true);
    } else if (y < lastY - 6 || y < 140) {
      setChromeHidden(false);
    }
    lastY = y;
    updatePill();

    /* warm up the next chapter as the reader approaches the end */
    if (!preloaded && next && pct >= 78) {
      preloaded = true;
      var warm = new Image();
      warm.src = "/" + encodeURIComponent(next.images[0]);
    }

    /* save resume position (percent) */
    store("ca-pos-" + chapter.slug, String(Math.round(pct)));
    store("ca-last-chapter", chapter.slug);

    /* GA4: chapter_complete once per visit at 92% */
    if (!completed && pct >= 92 && typeof gtag === "function") {
      completed = true;
      gtag("event", "chapter_complete", {
        chapter_number: chapter.num,
        chapter_title: chapter.title
      });
    }
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }
  }, { passive: true });

  /* tap anywhere on a panel toggles the chrome (immersive mode) */
  strip.addEventListener("click", function (e) {
    if (e.target.classList.contains("panel")) {
      setChromeHidden(!chrome.classList.contains("hidden"));
    }
  });

  /* ── resume where the reader left off ── */
  var saved = parseInt(read("ca-pos-" + chapter.slug) || "0", 10);
  if (saved > 4 && saved < 90) {
    window.addEventListener("load", function () {
      window.scrollTo({ top: (saved / 100) * docHeight(), behavior: "instant" in window ? "instant" : "auto" });
    });
  }

  /* ── keyboard: ← previous chapter, → next chapter ── */
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
    if (e.key === "ArrowRight" && next) window.location.href = "/chapter/" + next.slug + "/";
    if (e.key === "ArrowLeft" && prev) window.location.href = "/chapter/" + prev.slug + "/";
  });

  updatePill();
  onScroll();
})();
