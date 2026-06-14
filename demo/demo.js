/* 감리사 워크벤치 (Auditor's Workbench) — Claude API 브라우저 직접 호출 */
(function () {
  "use strict";

  var API_URL = "https://api.anthropic.com/v1/messages";
  var MODEL = "claude-opus-4-8";
  var KEY_STORAGE = "audit_api_key";

  /* ---------- 샘플 문서: 가짜 판례가 섞인 변호사 의견서 ----------
     실제 보도 사건(2025, 발표 섹션 4 참조)을 모티프로 한 시연용 가상 문서.
     환각 판례 · 조작 통계 · 과잉 단정 · 위험 조언을 의도적으로 포함해
     감리 시스템의 검증 카테고리 전체가 시연되도록 설계됨. */

  var SAMPLE_DOC = [
    "법률 의견서",
    "",
    "수신: 주식회사 ○○테크 대표이사",
    "제목: 근로자 부당해고 구제신청 사건 관련 법률 검토",
    "작성: 법무법인 △△ (본 의견서 초안은 AI 법률 보조 시스템으로 작성되었음)",
    "",
    "1. 검토 배경",
    "귀사가 2025년 11월 단행한 영업직 근로자 3인에 대한 해고 처분과 관련하여, 부당해고 구제신청이 인용될 가능성을 검토하였습니다.",
    "",
    "2. 관련 판례 검토",
    "대법원은 2019. 3. 14. 선고 2018다312456 판결에서 \"경영상 이유에 의한 해고는 사용자가 해고 회피 노력을 다하였음을 입증하지 못하는 한 무효\"라고 판시한 바 있습니다. 또한 대법원 2021. 7. 22. 선고 2020두99871 전원합의체 판결은 영업실적 부진만을 이유로 한 통상해고를 정당하다고 인정하였으므로, 본 사안에 직접 원용할 수 있습니다.",
    "서울고등법원 2022나205634 판결 역시 동일한 취지로, 6개월 연속 실적 미달 근로자에 대한 해고를 유효하다고 판단하였습니다.",
    "",
    "3. 통계적 근거",
    "고용노동부 2024년 통계에 따르면 부당해고 구제신청의 인용률은 12.3%에 불과하므로, 귀사가 패소할 확률은 통계적으로 매우 낮습니다.",
    "",
    "4. 결론",
    "위 판례와 통계에 비추어 볼 때, 본 건 해고는 100% 적법하며 구제신청은 기각될 것이 확실합니다. 별도의 해고 회피 노력 입증자료는 준비하지 않으셔도 무방합니다.",
  ].join("\n");

  /* ---------- 오프라인 백업 결과 (2026. 6. 12. 실제 API 분석 기록) ----------
     발표장 인터넷 장애 시 샘플 문서에 한해 이 기록으로 즉시 전환한다. */

  var OFFLINE_RESULT = {
    document_type: "법률 의견서",
    summary: "AI 법률 보조 시스템이 작성한 부당해고 구제신청 관련 법률 검토 의견서로, 영업직 근로자 3인 해고의 적법성을 판단하고 있다. 다수의 판례와 통계를 근거로 해고가 적법하며 구제신청이 기각될 것이라 단정하고 있으나, 인용된 판례·통계의 실존 여부가 의심되고 법적으로 위험한 단정과 조언이 다수 포함되어 있다.",
    findings: [
      { category: "환각 의심", severity: "높음", quote: "2019. 3. 14. 선고 2018다312456 판결", issue: "판례 번호 형식은 그럴듯하나 실제 존재 여부를 확인할 수 없는 가공 판례로 의심된다.", recommendation: "대법원 종합법률정보에서 사건번호와 판시사항을 직접 대조 확인하고, 확인되지 않으면 인용을 삭제해야 한다." },
      { category: "환각 의심", severity: "높음", quote: "대법원 2021. 7. 22. 선고 2020두99871 전원합의체 판결은 영업실적 부진만을 이유로 한 통상해고를 정당하다고 인정하였으므로", issue: "실존이 확인되지 않는 전원합의체 판례이며, 판시 내용이 확립된 노동법리(해고의 정당한 이유 요구)와 정면으로 배치된다.", recommendation: "해당 판례의 실존과 판시 내용을 검증하고, 해고 정당성 요건 법리를 정확히 반영하도록 전면 수정해야 한다." },
      { category: "환각 의심", severity: "중간", quote: "서울고등법원 2022나205634 판결", issue: "하급심 판례 번호의 실존 여부를 확인할 수 없으며, 판시 취지가 임의로 구성된 것일 가능성이 있다.", recommendation: "판례 원문을 확보해 인용 내용의 정확성을 검증하고, 미확인 시 근거에서 제외한다." },
      { category: "환각 의심", severity: "중간", quote: "고용노동부 2024년 통계에 따르면 부당해고 구제신청의 인용률은 12.3%에 불과하므로", issue: "구체적 수치의 출처가 모호하고 실존 통계인지 확인할 수 없다. 전체 통계를 특정 사건의 승소 확률로 환원하는 것은 통계적 오류다.", recommendation: "고용노동부 공식 통계 원자료로 수치를 확인하고, 일반 통계를 개별 사건 예측에 직접 적용하지 않도록 한다." },
      { category: "논리 오류", severity: "중간", quote: "해고 회피 노력을 다하였음을 입증하지 못하는 한 무효", issue: "앞에서는 해고 회피 노력 입증이 필요하다는 판례를 인용하면서, 결론에서는 입증자료를 준비하지 않아도 된다고 하여 자체 모순된다.", recommendation: "경영상 해고와 통상해고 법리를 구분하고, 입증책임에 관한 논리 일관성을 확보해야 한다." },
      { category: "편향·과잉 단정", severity: "높음", quote: "본 건 해고는 100% 적법하며 구제신청은 기각될 것이 확실합니다", issue: "법률 의견에서 '100%', '확실' 같은 절대적 단정은 부적절하며, 의뢰인에게 잘못된 확신을 심어 손해를 초래할 수 있다.", recommendation: "승소 가능성을 개연성·리스크 평가 형태로 서술하고, 불확실성과 반대 가능성을 명시해야 한다." },
      { category: "법적 리스크", severity: "높음", quote: "별도의 해고 회피 노력 입증자료는 준비하지 않으셔도 무방합니다", issue: "입증자료 미준비 권고는 실제 소송에서 사용자에게 치명적 패소 요인이 될 수 있는 위험한 조언이다.", recommendation: "해고의 정당성을 뒷받침할 모든 증거자료를 충실히 준비하도록 반대 방향으로 조언해야 한다." },
    ],
    trust_score: 24,
    verdict: "사용 불가",
    overall_assessment: "실존이 확인되지 않는 판례 3건과 출처 불명 통계가 핵심 근거로 사용되었고, 결론은 과잉 단정과 위험한 조언을 포함한다. 이 문서를 그대로 사용할 경우 법적 책임 문제가 발생할 수 있어 사용 불가로 판정한다. 모든 인용의 실존 검증과 결론 전면 재작성이 필요하다.",
  };

  /* ---------- 감리 결과 JSON 스키마 (structured outputs) ---------- */

  var AUDIT_SCHEMA = {
    type: "object",
    properties: {
      document_type: {
        type: "string",
        description: "문서 유형 (예: 법률 의견서, 계약서, 보고서, 코드 설명)",
      },
      summary: { type: "string", description: "문서 내용 2~3문장 요약" },
      findings: {
        type: "array",
        description: "발견된 문제 목록. 문제가 없으면 빈 배열",
        items: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["환각 의심", "사실 불일치", "편향·과잉 단정", "법적 리스크", "논리 오류", "기타"],
            },
            severity: { type: "string", enum: ["높음", "중간", "낮음"] },
            quote: {
              type: "string",
              description: "문제가 되는 구절을 원문에서 글자 그대로 짧게 인용 (반드시 원문에 존재하는 문자열)",
            },
            issue: { type: "string", description: "무엇이 왜 문제인지 설명" },
            recommendation: { type: "string", description: "감리사 관점의 권고 조치" },
          },
          required: ["category", "severity", "quote", "issue", "recommendation"],
          additionalProperties: false,
        },
      },
      trust_score: {
        type: "integer",
        description: "0~100 신뢰 점수. 높음 위험 1건당 큰 폭 감점",
      },
      verdict: { type: "string", enum: ["사용 승인", "조건부 승인", "사용 불가"] },
      overall_assessment: { type: "string", description: "감리사 종합 의견 2~4문장" },
    },
    required: ["document_type", "summary", "findings", "trust_score", "verdict", "overall_assessment"],
    additionalProperties: false,
  };

  var SYSTEM_PROMPT = [
    "당신은 'AI 결과물 감리사(AI Output Auditor)'의 분석 엔진이다.",
    "AI가 생성한 문서를 검증하여 환각, 사실 불일치, 편향, 법적 리스크를 평가하고 신뢰 점수를 산출한다.",
    "",
    "검증 기준:",
    "1. 환각 의심: 인용된 판례 번호, 법령, 논문, 통계, 출처가 실존한다고 확신할 수 없으면 '환각 의심'으로 분류한다. 판례 번호의 형식이 그럴듯해도 실제 존재를 확인할 수 없으면 반드시 지적한다. 알고 있는 실제 판례·법리와 어긋나는 주장도 지적한다.",
    "2. 편향·과잉 단정: '100%', '확실하다', '~할 필요가 없다' 같은 법적·사실적 단정, 한쪽에 유리하게 치우친 서술을 지적한다.",
    "3. 법적 리스크: 해당 문서를 그대로 사용했을 때 발생할 수 있는 법적 위험을 평가한다.",
    "4. quote 필드는 반드시 원문에 그대로 존재하는 문자열을 짧게 인용한다 (하이라이트 매칭에 사용됨).",
    "",
    "점수 기준 (엄격히 적용할 것):",
    "- 90~100 (사용 승인): 문제 없음 또는 '낮음' 위험만 존재",
    "- 70~89 (조건부 승인): '중간' 위험 1~3건, '높음' 위험 없음",
    "- 40~69 (사용 불가): '높음' 위험 1~2건 또는 '중간' 위험 4건 이상",
    "- 0~39 (사용 불가): '높음' 위험 3건 이상이거나 핵심 결론이 환각·오류에 기반",
    "'높음' 위험은 건당 최소 15점 이상 감점하고, 실존이 확인되지 않는 판례·출처 인용은 원칙적으로 '높음'으로 분류한다.",
    "모든 출력은 한국어로 작성한다.",
  ].join("\n");

  /* ---------- DOM ---------- */

  function $(id) { return document.getElementById(id); }

  var screens = {
    input: $("screen-input"),
    loading: $("screen-loading"),
    result: $("screen-result"),
  };
  var reportWrap = $("report-wrap");
  var appEl = $("app");

  // reviews: 발견 사항별 감리사 검토 상태 ("accepted" | "rejected" | null)
  var state = { doc: "", result: null, reportNo: "", reviews: [], offline: false };

  /* ---------- 화면 전환 + 스테퍼 ---------- */

  function showScreen(name, step) {
    Object.keys(screens).forEach(function (k) { screens[k].hidden = k !== name; });
    reportWrap.hidden = name !== "report";
    appEl.style.display = name === "report" ? "none" : "";
    if (name === "report") reportWrap.hidden = false;
    setStep(step);
    window.scrollTo(0, 0);
  }

  function setStep(step) {
    var items = document.querySelectorAll(".stepper__step");
    items.forEach(function (li) {
      var n = parseInt(li.dataset.step, 10);
      li.classList.toggle("is-active", n === step);
      li.classList.toggle("is-done", n < step);
    });
  }

  /* ---------- API 키 설정 ---------- */

  var settingsPanel = $("settings-panel");
  var keyInput = $("input-api-key");
  var keyStatus = $("key-status");

  // HTTP 헤더에는 ASCII만 허용 — 한글·공백·보이지 않는 문자가 섞이면 fetch가 거부함
  var VALID_KEY_RE = /^[\x21-\x7E]+$/;

  // URL 해시로 키 전달: #key=sk-ant-... → localStorage에 저장 후 해시 제거
  (function injectKeyFromHash() {
    var hash = location.hash;
    if (!hash) return;
    var match = hash.match(/[#&]key=([^&]+)/);
    if (!match) return;
    var key = decodeURIComponent(match[1]).replace(/[\s​-‍﻿]+/g, "");
    if (VALID_KEY_RE.test(key)) {
      localStorage.setItem(KEY_STORAGE, key);
    }
    // 브라우저 주소창·히스토리에서 키 제거
    if (history.replaceState) {
      history.replaceState(null, "", location.pathname + location.search);
    } else {
      location.hash = "";
    }
  })();

  function getKey() { return localStorage.getItem(KEY_STORAGE) || ""; }

  function refreshKeyStatus() {
    var key = getKey();
    if (key) {
      keyStatus.textContent = "✓ 키 저장됨 (" + key.slice(0, 12) + "…" + key.slice(-4) + ")";
      keyStatus.className = "settings__status ok";
    } else {
      keyStatus.textContent = "저장된 키가 없습니다. 감리 실행에는 API 키가 필요합니다.";
      keyStatus.className = "settings__status bad";
    }
  }

  $("btn-settings").addEventListener("click", function () {
    settingsPanel.hidden = !settingsPanel.hidden;
    refreshKeyStatus();
  });
  $("btn-save-key").addEventListener("click", function () {
    var v = keyInput.value.replace(/[\s​-‍﻿]+/g, "");
    if (!v) { refreshKeyStatus(); return; }
    if (!VALID_KEY_RE.test(v)) {
      keyStatus.textContent = "✗ 키에 허용되지 않는 문자(한글 또는 특수문자)가 섞여 있습니다.";
      keyStatus.className = "settings__status bad";
      return;
    }
    localStorage.setItem(KEY_STORAGE, v);

    // PIN이 있으면 서버에도 저장
    var pin = $("input-pin").value.trim();
    if (pin.length >= 4) {
      fetch("/api/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin, apiKey: v }),
      }).then(function (r) { return r.json(); }).then(function () {
        keyStatus.textContent = "✓ 키 저장 완료 (로컬 + 서버). 다른 기기에서 PIN으로 불러올 수 있습니다.";
        keyStatus.className = "settings__status ok";
      }).catch(function () {
        keyStatus.textContent = "✓ 로컬 저장 완료. 서버 저장 실패 — 서버가 실행 중인지 확인하세요.";
        keyStatus.className = "settings__status ok";
      });
    } else if (pin.length > 0) {
      keyStatus.textContent = "✓ 로컬 저장 완료. PIN은 4자 이상이어야 서버에 저장됩니다.";
      keyStatus.className = "settings__status ok";
    }

    keyInput.value = "";
    $("input-pin").value = "";
    refreshKeyStatus();
  });

  // PIN으로 서버에서 키 불러오기
  $("btn-load-key").addEventListener("click", function () {
    var pin = $("input-pin-load").value.trim();
    if (!pin) {
      keyStatus.textContent = "✗ PIN을 입력해주세요.";
      keyStatus.className = "settings__status bad";
      return;
    }
    keyStatus.textContent = "불러오는 중…";
    keyStatus.className = "settings__status";
    fetch("/api/key?pin=" + encodeURIComponent(pin))
      .then(function (r) {
        if (!r.ok) throw new Error(r.status === 404 ? "not_found" : "error");
        return r.json();
      })
      .then(function (data) {
        localStorage.setItem(KEY_STORAGE, data.apiKey);
        $("input-pin-load").value = "";
        refreshKeyStatus();
        keyStatus.textContent = "✓ 서버에서 키를 불러와 저장했습니다!";
        keyStatus.className = "settings__status ok";
      })
      .catch(function (e) {
        if (e.message === "not_found") {
          keyStatus.textContent = "✗ 해당 PIN에 저장된 키가 없습니다.";
        } else {
          keyStatus.textContent = "✗ 서버 연결 실패 — 서버가 실행 중인지 확인하세요.";
        }
        keyStatus.className = "settings__status bad";
      });
  });

  $("btn-clear-key").addEventListener("click", function () {
    localStorage.removeItem(KEY_STORAGE);
    refreshKeyStatus();
  });

  /* ---------- 화면 1: 입력 ---------- */

  var docInput = $("input-doc");
  var charCount = $("char-count");
  var inputError = $("input-error");

  docInput.addEventListener("input", function () {
    charCount.textContent = docInput.value.length.toLocaleString("ko-KR") + "자";
  });

  $("btn-sample").addEventListener("click", function () {
    docInput.value = SAMPLE_DOC;
    docInput.dispatchEvent(new Event("input"));
    inputError.hidden = true;
    hideOfflineButton();
    // 라이브 시연 동선 단축: 로드 즉시 '감리 시작'에 포커스 → Enter 한 번이면 시작
    $("btn-audit").focus();
  });

  $("input-file").addEventListener("change", function (ev) {
    var file = ev.target.files && ev.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      docInput.value = String(reader.result || "");
      docInput.dispatchEvent(new Event("input"));
    };
    reader.readAsText(file);
    ev.target.value = "";
  });

  function showInputError(msg) {
    inputError.textContent = msg;
    inputError.hidden = false;
  }

  /* ---------- 화면 2: 분석 (API 호출) ---------- */

  var loadingTimer = null;

  function animateLoadingSteps() {
    var items = document.querySelectorAll("#loading-steps li");
    items.forEach(function (li) { li.classList.remove("is-done", "is-now"); });
    var i = 0;
    items[0].classList.add("is-now");
    loadingTimer = setInterval(function () {
      if (i < items.length - 1) {
        items[i].classList.remove("is-now");
        items[i].classList.add("is-done");
        i++;
        items[i].classList.add("is-now");
      }
    }, 2600);
  }

  function stopLoadingSteps() {
    clearInterval(loadingTimer);
    loadingTimer = null;
  }

  $("btn-audit").addEventListener("click", function () {
    inputError.hidden = true;
    var doc = docInput.value.trim();
    if (!doc) { showInputError("감리할 문서를 입력해주세요."); return; }
    if (doc.length > 50000) { showInputError("문서가 너무 깁니다 (50,000자 이하). 핵심 부분만 잘라서 넣어주세요."); return; }
    if (!getKey()) {
      showInputError("API 키가 설정되지 않았습니다. 우측 상단 'API 설정'에서 키를 저장해주세요.");
      settingsPanel.hidden = false;
      refreshKeyStatus();
      return;
    }
    state.doc = doc;
    // 발표장 인터넷 장애 대비 1단계: 오프라인 감지 시 샘플 문서는 발표자 개입 없이
    // 사전 분석 기록으로 자동 전환. (2단계: API 호출 실패 시 비상 버튼 노출 — catch 참조)
    if (!navigator.onLine && doc === SAMPLE_DOC) {
      runOfflineFallback();
      return;
    }
    runAudit(doc);
  });

  function runOfflineFallback() {
    showScreen("loading", 2);
    animateLoadingSteps();
    setTimeout(function () {
      stopLoadingSteps();
      state.result = OFFLINE_RESULT;
      state.offline = true;
      renderResult(OFFLINE_RESULT);
      $("doc-summary").textContent = "[오프라인 모드 — 2026. 6. 12. 실제 분석 기록] " + $("doc-summary").textContent;
      showScreen("result", 3);
    }, 1600);
  }

  var offlineBtn = $("btn-offline");
  offlineBtn.addEventListener("click", function () {
    inputError.hidden = true;
    hideOfflineButton();
    docInput.value = SAMPLE_DOC;
    state.doc = SAMPLE_DOC;
    runOfflineFallback();
  });
  function hideOfflineButton() { offlineBtn.hidden = true; }

  function runAudit(doc) {
    showScreen("loading", 2);
    animateLoadingSteps();

    fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": getKey(),
        "anthropic-version": "2023-06-01",
        // Anthropic 공식 브라우저 직접 호출(CORS) 헤더 — SDK의 dangerouslyAllowBrowser 옵션이
        // 설정하는 것과 동일. 실호출 테스트 완료 (2026. 6. 12.)
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        output_config: { format: { type: "json_schema", schema: AUDIT_SCHEMA } },
        messages: [
          {
            role: "user",
            content: "다음 AI 생성 문서를 감리하라.\n\n<document>\n" + doc + "\n</document>",
          },
        ],
      }),
    })
      .then(function (res) {
        return res.json().then(function (body) { return { status: res.status, body: body }; });
      })
      .then(function (r) {
        if (r.status !== 200) throw apiError(r.status, r.body);
        if (r.body.stop_reason === "refusal") {
          throw new Error("모델이 이 문서의 분석을 거부했습니다. 다른 문서로 시도해주세요.");
        }
        if (r.body.stop_reason === "max_tokens") {
          throw new Error("분석 결과가 너무 길어 잘렸습니다. 더 짧은 문서로 시도해주세요.");
        }
        var textBlock = (r.body.content || []).find(function (b) { return b.type === "text"; });
        if (!textBlock) throw new Error("응답에서 분석 결과를 찾지 못했습니다.");
        return JSON.parse(textBlock.text);
      })
      .then(function (result) {
        stopLoadingSteps();
        state.result = result;
        renderResult(result);
        showScreen("result", 3);
      })
      .catch(function (err) {
        stopLoadingSteps();
        showScreen("input", 1);
        showInputError("감리 분석에 실패했습니다.\n" + (err && err.message ? err.message : String(err)));
        // 네트워크·API 장애 시 비상 탈출구 노출 (사전 분석 기록으로 시연 지속)
        offlineBtn.hidden = false;
      });
  }

  function apiError(status, body) {
    var detail = body && body.error && body.error.message ? body.error.message : "";
    var msg;
    if (status === 401) msg = "API 키가 유효하지 않습니다 (401). 'API 설정'에서 키를 확인해주세요.";
    else if (status === 403) msg = "API 키에 권한이 없습니다 (403).";
    else if (status === 429) msg = "요청 한도를 초과했습니다 (429). 잠시 후 다시 시도해주세요.";
    else if (status === 529 || status >= 500) msg = "API 서버가 혼잡합니다 (" + status + "). 잠시 후 다시 시도해주세요.";
    else msg = "API 오류 (" + status + ")";
    if (detail) msg += "\n상세: " + detail;
    return new Error(msg);
  }

  /* ---------- 화면 3: 결과 렌더링 ---------- */

  var SEV_CLASS = { "높음": "high", "중간": "mid", "낮음": "low" };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function renderResult(r) {
    // 신뢰 점수 링
    var score = Math.max(0, Math.min(100, r.trust_score | 0));
    var bar = $("score-bar");
    var circumference = 326.7;
    var color = score >= 90 ? "#16A34A" : score >= 60 ? "#D97706" : "#F96167";
    bar.style.stroke = color;
    bar.style.strokeDashoffset = circumference; // 리셋
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bar.style.strokeDashoffset = String(circumference * (1 - score / 100));
      });
    });
    animateNumber($("score-num"), score, 1300);

    // 판정 배지
    var badge = $("verdict-badge");
    badge.textContent = r.verdict;
    badge.className = "verdict " +
      (r.verdict === "사용 승인" ? "verdict--good" : r.verdict === "조건부 승인" ? "verdict--mid" : "verdict--bad");

    $("overall-assessment").textContent = r.overall_assessment;
    $("doc-summary").textContent = "[" + r.document_type + "] " + r.summary;
    $("finding-count").textContent = r.findings.length ? "— " + r.findings.length + "건 발견" : "— 문제 없음";

    // 발견 사항 카드 (감리사 검토 버튼 포함 — AI 분석은 제안일 뿐, 확정은 사람이 한다)
    state.reviews = r.findings.map(function () { return null; });
    var list = $("findings-list");
    list.innerHTML = r.findings.map(function (f, i) {
      var sev = SEV_CLASS[f.severity] || "low";
      return '<div class="finding finding--' + sev + '" data-idx="' + i + '">' +
        '<div class="finding__head">' +
        '<span class="finding__cat">' + escapeHtml(f.category) + "</span>" +
        '<span class="finding__sev finding__sev--' + sev + '">위험도 ' + escapeHtml(f.severity) + "</span>" +
        '<span class="finding__review">' +
        '<button type="button" class="rev-btn rev-btn--ok" data-idx="' + i + '" data-act="accept">✓ 인정</button>' +
        '<button type="button" class="rev-btn rev-btn--no" data-idx="' + i + '" data-act="reject">✕ 제외</button>' +
        "</span>" +
        "</div>" +
        '<p class="finding__quote">“' + escapeHtml(f.quote) + "”</p>" +
        '<p class="finding__issue">' + escapeHtml(f.issue) + "</p>" +
        '<p class="finding__rec"><b>권고:</b> ' + escapeHtml(f.recommendation) + "</p>" +
        "</div>";
    }).join("") || '<p class="panel__desc">발견된 문제가 없습니다.</p>';
    updateReviewUI();

    // 원문 하이라이트 (긴 인용부터 매칭해 중첩 방지)
    var html = escapeHtml(state.doc);
    r.findings
      .slice()
      .sort(function (a, b) { return b.quote.length - a.quote.length; })
      .forEach(function (f) {
        var q = escapeHtml(f.quote);
        if (!q) return;
        var idx = html.indexOf(q);
        if (idx === -1) return;
        var sev = SEV_CLASS[f.severity] || "low";
        html = html.slice(0, idx) +
          '<mark class="hl--' + sev + '">' + q + "</mark>" +
          html.slice(idx + q.length);
      });
    $("doc-view").innerHTML = html;
  }

  function animateNumber(el, target, duration) {
    var start = null;
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- 감리사 검토 (human-in-the-loop) ---------- */

  $("findings-list").addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest(".rev-btn") : null;
    if (!btn) return;
    var i = parseInt(btn.getAttribute("data-idx"), 10);
    state.reviews[i] = btn.getAttribute("data-act") === "accept" ? "accepted" : "rejected";
    updateReviewUI();
  });

  $("btn-accept-rest").addEventListener("click", function () {
    state.reviews = state.reviews.map(function (v) { return v || "accepted"; });
    updateReviewUI();
  });

  function updateReviewUI() {
    var total = state.reviews.length;
    var decided = state.reviews.filter(function (v) { return v !== null; }).length;

    document.querySelectorAll("#findings-list .finding").forEach(function (card) {
      var i = parseInt(card.getAttribute("data-idx"), 10);
      var v = state.reviews[i];
      card.classList.toggle("is-rejected", v === "rejected");
      card.classList.toggle("is-accepted", v === "accepted");
      var ok = card.querySelector(".rev-btn--ok");
      var no = card.querySelector(".rev-btn--no");
      if (ok) ok.classList.toggle("is-on", v === "accepted");
      if (no) no.classList.toggle("is-on", v === "rejected");
    });

    var progress = $("review-progress");
    var reportBtn = $("btn-report");
    if (total === 0) {
      progress.textContent = "검토할 발견 사항 없음 — 바로 발행 가능";
      reportBtn.disabled = false;
    } else if (decided < total) {
      progress.innerHTML = "감리사 검토 <b>" + decided + " / " + total + "</b> — 전 항목 확정 후 발행 가능";
      reportBtn.disabled = true;
    } else {
      var acc = state.reviews.filter(function (v) { return v === "accepted"; }).length;
      progress.innerHTML = "✓ 검토 완료 — 인정 <b>" + acc + "</b> · 제외 <b>" + (total - acc) + "</b>";
      reportBtn.disabled = false;
    }
    $("btn-accept-rest").hidden = total === 0 || decided === total;
  }

  $("btn-restart").addEventListener("click", function () {
    showScreen("input", 1);
  });

  /* ---------- 화면 4: 감리 보고서 ---------- */

  $("btn-report").addEventListener("click", function () {
    if ($("btn-report").disabled) return;
    renderReport(state.result);
    showScreen("report", 4);
  });
  $("btn-report-back").addEventListener("click", function () {
    showScreen("result", 3);
  });
  $("btn-print").addEventListener("click", function () {
    window.print();
  });

  function renderReport(r) {
    var now = new Date();
    if (!state.reportNo) {
      state.reportNo = "AUD-" +
        now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
        "-" + pad(now.getHours()) + pad(now.getMinutes());
    }
    var dateStr = now.getFullYear() + "년 " + (now.getMonth() + 1) + "월 " + now.getDate() + "일";

    $("report-no").textContent = state.reportNo;
    $("report-date").textContent = dateStr;
    $("report-date-footer").textContent = dateStr;
    $("report-doctype").textContent = r.document_type;
    $("report-score").textContent = r.trust_score + " / 100";
    $("report-verdict").textContent = r.verdict;
    $("report-summary").textContent = r.summary;
    $("report-overall").textContent = r.overall_assessment;

    // 감리 방식 기록 — AI는 1차 분석, 확정·책임은 감리사
    var total = r.findings.length;
    var accepted = r.findings.filter(function (_, i) { return state.reviews[i] === "accepted"; });
    var rejected = total - accepted.length;
    $("report-review").textContent = total === 0
      ? "AI 1차 분석 (발견 사항 없음) + 감리사 최종 확인"
      : "AI 1차 분석 " + total + "건 → 감리사 항목별 검토 확정: 인정 " + accepted.length + "건 · 제외 " + rejected + "건";

    var tbody = $("report-findings").querySelector("tbody");
    tbody.innerHTML = accepted.map(function (f) {
      var sev = SEV_CLASS[f.severity] || "low";
      return "<tr>" +
        "<td>" + escapeHtml(f.category) + "</td>" +
        '<td class="sev sev--' + sev + '">' + escapeHtml(f.severity) + "</td>" +
        '<td class="quote">“' + escapeHtml(f.quote) + "”</td>" +
        "<td>" + escapeHtml(f.issue) + "<br><b>권고:</b> " + escapeHtml(f.recommendation) + "</td>" +
        "</tr>";
    }).join("") || '<tr><td colspan="4">감리사가 확정한 발견 사항 없음</td></tr>';
    if (rejected > 0) {
      tbody.innerHTML += '<tr><td colspan="4" class="quote">※ AI가 제안한 ' + rejected + "건은 감리사 검토에서 제외됨</td></tr>";
    }
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- 초기화 ---------- */

  refreshKeyStatus();
  if (!getKey()) settingsPanel.hidden = false;
})();
