/* AI 결과물 감리사 — 발표 내비게이션 & 애니메이션 (의존성 없음) */
(function () {
  "use strict";

  var deck = document.getElementById("deck");
  var slides = Array.prototype.slice.call(deck.querySelectorAll(".slide"));
  var indicator = document.getElementById("indicator-current");
  var TOTAL = slides.length;

  var current = 0;       // 현재 섹션 인덱스 — 옵저버가 관측해서 갱신 (휠 스크롤과 동기화)
  var navLock = false;   // 프로그래매틱 스크롤 진행 중 키 입력 무시
  var navTimer = null;
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 섹션 이동 ---------- */

  function goTo(index) {
    var i = Math.max(0, Math.min(TOTAL - 1, index));
    if (i === current) return;
    navLock = true;
    clearTimeout(navTimer);
    // scrollend 미지원 브라우저 대비 타임아웃 폴백
    navTimer = setTimeout(function () { navLock = false; }, 800);
    slides[i].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  deck.addEventListener("scrollend", function () {
    navLock = false;
    clearTimeout(navTimer);
  });

  /* ---------- 키보드 내비게이션 (발표 클리커 호환: PageUp/Down 포함) ---------- */

  var NEXT_KEYS = ["ArrowRight", "ArrowDown", "PageDown"];
  var PREV_KEYS = ["ArrowLeft", "ArrowUp", "PageUp"];

  window.addEventListener("keydown", function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;

    // 버튼·링크·토글에 포커스가 있을 때 Space/Enter는 본래 동작 유지
    var t = ev.target;
    var tag = t && t.tagName;
    if (
      (ev.key === " " || ev.key === "Enter") &&
      (tag === "A" || tag === "BUTTON" || tag === "SUMMARY" ||
       tag === "INPUT" || tag === "TEXTAREA")
    ) {
      return;
    }

    var handled = true;
    if (NEXT_KEYS.indexOf(ev.key) !== -1 || (ev.key === " " && !ev.shiftKey)) {
      if (!navLock) goTo(current + 1);
    } else if (PREV_KEYS.indexOf(ev.key) !== -1 || (ev.key === " " && ev.shiftKey)) {
      if (!navLock) goTo(current - 1);
    } else if (ev.key === "Home") {
      goTo(0);
    } else if (ev.key === "End") {
      goTo(TOTAL - 1);
    } else if (ev.key === "b" || ev.key === "B") {
      // 발표자용: 데모 실패 시 'B' 키로 섹션 8 백업 자료 즉시 토글
      var backup = document.querySelector(".demo-backup");
      if (backup) backup.open = !backup.open;
      handled = false;
    } else {
      handled = false;
    }
    if (handled) ev.preventDefault();
  });

  /* ---------- 섹션 관측: 인디케이터 + 1회성 애니메이션 ---------- */

  var animated = new Set();

  function reveal(slide) {
    if (animated.has(slide)) return;
    animated.add(slide);
    slide.classList.add("is-visible");
    var counters = slide.querySelectorAll("[data-countup]");
    for (var i = 0; i < counters.length; i++) startCountUp(counters[i]);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var idx = slides.indexOf(entry.target);
          if (idx !== -1) {
            current = idx;
            indicator.textContent = idx + 1;
          }
          reveal(entry.target);
        });
      },
      { root: deck, threshold: 0.5 }
    );
    slides.forEach(function (s) { io.observe(s); });
  } else {
    // 미지원 환경: 전부 즉시 표시
    slides.forEach(reveal);
  }

  /* ---------- 숫자 카운트업 (rAF, ease-out) ---------- */

  function startCountUp(el) {
    var target = parseInt(el.getAttribute("data-countup"), 10) || 0;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = parseInt(el.getAttribute("data-duration"), 10) || 2000;

    function render(value) {
      el.textContent = prefix + value.toLocaleString("ko-KR") + suffix;
    }

    if (reduceMotion || !window.requestAnimationFrame) {
      render(target);
      return;
    }

    var start = null;
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      render(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
