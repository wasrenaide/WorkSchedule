/* 월 근무 앱 - 서버 저장/불러오기 (이름+PIN). Supabase RPC만 사용.
   앱 데이터(localStorage)를 통째로 서버에 저장/복원한다. 충돌은 version 비교로 막는다. */
(function () {
  var API = 'https://iqzswnpfxdjsnxlvisxf.supabase.co/rest/v1/rpc/';
  var KEY = 'sb_publishable_xL6Ih_CqeQ0PzfTJvJxMew_BtSMd68T';   // 공개 키(앱에 들어가도 되는 값)
  var SK = 'cloud-v1';
  var DATA_KEYS = { inputs: 'plan-inputs-v4', limit: 'plan-limit-v1', calc: 'calc-state-v1', settings: 'app-settings-v1' };
  var ERR = {
    bad_login: '이름 또는 PIN이 맞지 않아요.',
    locked: '5번 틀려서 10분간 잠겼어요. 잠시 뒤에 다시 해주세요.',
    duplicate: '같은 이름과 PIN이 이미 있어요. PIN(전화번호 뒷자리 등)을 바꿔보세요.',
    bad_name: '이름은 1~20자로 써주세요.',
    bad_pin: 'PIN은 숫자 4~8자리예요.',
    too_big: '데이터가 너무 커요.',
    network: '인터넷 연결을 확인해주세요.'
  };

  var st = readSt();
  function readSt() { try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch (e) { return {}; } }
  function writeSt() { try { localStorage.setItem(SK, JSON.stringify(st)); } catch (e) {} if (typeof paintName === 'function' && syncEl !== undefined) paintName(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function rpc(fn, args) {
    return fetch(API + fn, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    }).then(function (r) { return r.json(); }).catch(function () { return { ok: false, error: 'network' }; });
  }
  function errText(r) { return ERR[r.error] || ('오류: ' + (r.error || r.message || '알 수 없음')); }

  function collect() {
    var o = { v: 1 };
    Object.keys(DATA_KEYS).forEach(function (k) {
      var v = null; try { v = localStorage.getItem(DATA_KEYS[k]); } catch (e) {}
      if (v != null) o[k] = v;
    });
    return o;
  }
  function apply(o) {
    quiet = true;
    try { localStorage.removeItem('undo-stack-v1'); } catch (e) {}   // 불러오기/되돌리기로 데이터가 통째로 바뀌면 단계별 되돌리기 기록은 비움
    Object.keys(DATA_KEYS).forEach(function (k) {
      try { if (o && o[k] != null) localStorage.setItem(DATA_KEYS[k], o[k]); else if (k !== 'settings') localStorage.removeItem(DATA_KEYS[k]); } catch (e) {}   // 설정은 서버에 없으면(예전 저장본) 이 폰 설정을 그대로 둠
    });
    quiet = false;
  }

  /* ---------- 화면 ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#cloudRow{display:flex;justify-content:center;margin:2px 0 8px}' +
    '#cloudOpen{font:inherit;font-size:13px;padding:6px 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--fg)}' +
    '#cloudBack{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}' +
    '#cloudBox{width:100%;max-width:520px;max-height:88vh;overflow:auto;background:var(--surface);color:var(--fg);border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));box-sizing:border-box}' +
    '#cloudBox h2{margin:0 0 4px;font-size:17px}' +
    '#cloudBox p{margin:6px 0;font-size:13px;color:var(--muted);line-height:1.5}' +
    '#cloudBox input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:10px;margin:4px 0;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg)}' +
    '#cloudBox .row{display:flex;gap:8px;margin-top:8px}' +
    '#cloudBox button{flex:1;font:inherit;font-size:15px;padding:11px 8px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--fg)}' +
    '#cloudBox button.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:700}' +
    '#cloudBox .msg{font-size:14px;margin:8px 0;padding:8px 10px;border-radius:8px;background:var(--bg)}' +
    '#cloudBox .msg.bad{color:#c62828}' +
    '#cloudBox .msg.ok{color:#2e7d32}' +
    '#sync.cdirty{color:#e65100!important;font-weight:700!important}' +
    '#cloudOpen.dirty{background:#fff3e0;border-color:#ef6c00;color:#e65100;font-weight:700}' +
    '@media (prefers-color-scheme:dark){#cloudOpen.dirty{background:#3a2610;color:#ffb74d;border-color:#ef6c00}#sync.cdirty{color:#ffb74d!important}}' +
    '#cloudBar{display:none;position:absolute;z-index:6;box-sizing:border-box;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:4px 6px;background:var(--surface);color:var(--fg);border:1.5px solid #f59e0b;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.18);font-size:12px}' +
    '#cloudBar .t{display:flex;align-items:center;gap:6px;font-weight:700;color:#b45309;min-width:0;white-space:nowrap}' +
    '#cloudBar .t i{flex:none;width:8px;height:8px;border-radius:50%;background:#f59e0b}' +
    '#cloudBar .b{display:flex;align-items:center;gap:6px;flex:none}' +
    '#cloudBar button{font:inherit;font-size:13px;border:0;cursor:pointer}' +
    '#cloudBar .u{background:var(--bg);color:var(--fg);border:1px solid var(--line);padding:5px 12px;border-radius:999px}' +
    '#cloudBar .s{background:#f59e0b;color:#fff;font-weight:700;padding:5px 18px;border-radius:999px}' +
    '#cloudBar button:disabled{opacity:.6}' +
    '@media (prefers-color-scheme:dark){#cloudBar{border-color:#b87a14}#cloudBar .t{color:#ffcb7a}#cloudBar .s{background:#d98a0a}}' +
    'body.cbar #cloudBar{display:flex}';
  document.head.appendChild(css);

  var row = document.createElement('div');
  row.id = 'cloudRow';
  row.innerHTML = '<button id="cloudOpen" type="button"></button>';
  var foot = document.querySelector('.foot');
  if (foot && foot.parentNode) foot.parentNode.insertBefore(row, foot.nextSibling); else document.body.appendChild(row);
  var bar = document.createElement('div');
  bar.id = 'cloudBar';
  bar.innerHTML = '<span class="t"><i></i>저장 안 된 변경</span><span class="b"><button type="button" class="u" id="cloudBarUndo">되돌리기</button><button type="button" class="s" id="cloudBarBtn">저장</button></span>';
  var hd = document.querySelector('header');
  var calCard = document.querySelector('.card.calc');   // 달력 카드 안, 항상 비어 있는 마지막 줄 칸 위에 띄움(화면 크기가 안 바뀌게). 자리는 앱이 계산해서 정함
  if (calCard) calCard.appendChild(bar);
  else if (hd && hd.parentNode) hd.parentNode.insertBefore(bar, hd.nextSibling);
  else { bar.style.cssText = 'position:fixed;top:8px;left:12px;right:12px;z-index:40'; document.body.appendChild(bar); }
  document.getElementById('cloudBarBtn').addEventListener('click', quickSave);
  document.getElementById('cloudBarUndo').addEventListener('click', askUndo);
  function quickSave() {
    var b = document.getElementById('cloudBarBtn'); b.disabled = true; b.textContent = '저장 중…';
    var payload = collect();
    rpc('app_save', { p_name: st.name, p_pin: st.pin, p_data: payload, p_base: st.base || 0, p_force: false }).then(function (r) {
      b.disabled = false; b.textContent = '저장';
      if (r.ok) { writeSnap(payload); st.base = r.version; st.at = now(); st.atMs = Date.now(); writeSt(); savedReset(); return; }
      show('');
      if (r.error === 'conflict') conflict(r.version); else show(errText(r), true);
    });
  }
  /* ---------- 변경 되돌리기: 마지막 저장(또는 불러오기) 때의 사본으로 복원 ---------- */
  var SNAP = 'cloud-snap-v1';
  function writeSnap(o) { try { localStorage.setItem(SNAP, JSON.stringify(o)); } catch (e) {} }
  function readSnap() { try { return JSON.parse(localStorage.getItem(SNAP)); } catch (e) { return null; } }
  function clearSnap() { try { localStorage.removeItem(SNAP); } catch (e) {} }
  function canUndo() { return !!(st.name && isDirty() && (st.atMs || st.at)); }   // 한 번도 저장 안 했으면 되돌릴 곳이 없음
  function askUndo() {
    show('');
    var t = st.atMs ? stamp(st.atMs) : (st.at || '');
    back.firstChild.innerHTML = '<h2>변경을 되돌릴까요?</h2>' +
      '<p>저장하지 않은 변경을 버리고 마지막으로 저장한 상태' + (t ? '(' + esc(t) + ')' : '') + '로 돌아가요. 되돌린 뒤에는 다시 살릴 수 없어요.</p>' +
      '<div class="row"><button id="uYes" class="pri" type="button">되돌리기</button><button id="uNo" type="button">취소</button></div>';
    bind('uYes', doUndo);
    bind('uNo', close);
  }
  // 화면을 새로 불러오기 전에, 보던 달을 유지하라고 표시(plan.html 이 시작할 때 읽음)
  function keepView() { try { sessionStorage.setItem('restore-view-v1', '1'); } catch (e) {} }
  function doUndo() {
    var snap = readSnap();
    if (snap) { apply(snap); st.edited = 0; writeSt(); keepView(); location.reload(); return; }
    busy(true);   // 사본이 없으면(예전에 저장한 경우) 서버 저장본으로
    rpc('app_load', { p_name: st.name, p_pin: st.pin }).then(function (r) {
      if (!r.ok) { show(errText(r), true); return; }
      if (!r.data) { show('되돌릴 저장본이 서버에 없어요.', true); return; }
      apply(r.data); writeSnap(r.data); st.base = r.version; st.edited = 0; st.atMs = Date.now(); writeSt(); keepView(); location.reload();
    });
  }
  // 서버에 저장하면 단계별 되돌리기 기록을 비움(앱에 알림)
  function savedReset() { try { localStorage.removeItem('undo-stack-v1'); } catch (e) {} try { window.dispatchEvent(new Event('cloudsaved')); } catch (e) {} }
  // 비교용: 키 순서·빈 칸을 무시한 모양으로 바꿈
  function canon(s) {
    function prune(v) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        var o = {}; Object.keys(v).sort().forEach(function (k) { var p = prune(v[k]); if (p !== undefined) o[k] = p; });
        return Object.keys(o).length ? o : undefined;
      }
      return v;
    }
    try { return JSON.stringify(prune(JSON.parse(s))) || ''; } catch (e) { return s || ''; }
  }
  function sameAsSnap() {   // 되돌리기 등으로 마지막 저장 상태와 똑같아졌는지
    var snap = readSnap(); if (!snap) return false;
    var cur = collect();
    return canon(cur.inputs) === canon(snap.inputs) && canon(cur.settings) === canon(snap.settings);
  }
  function isDirty() {
    if (!st.name) return false;
    if ((st.edited || 0) > (st.atMs || 0)) return !sameAsSnap();
    if (!st.atMs && !st.at) { try { return localStorage.getItem(DATA_KEYS.inputs) !== null; } catch (e) { return false; } }
    return false;
  }
  function label() { var d = isDirty(), o = document.getElementById('cloudOpen');
    o.textContent = st.name ? (d ? '● 저장 필요 · ☁ ' + st.name : '☁ ' + st.name + ' · 저장/불러오기') : '☁ 서버 저장/불러오기';   // 저장 필요일 때는 짧게(줄이 바뀌어 화면이 흔들리지 않게)
    o.className = d ? 'dirty' : '';
    paintName(); }

  /* 제목 아래 작은 줄(#sync)에 '이름 · 서버 저장 시각'을 보여준다. 앱이 그 줄을 바꿔도 다시 덮어씀 */
  var syncEl = document.getElementById('sync'), mine = '', painting = false;
  function stamp(ms) { var d = new Date(ms); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function statusText() {
    if (!st.name) return '서버 저장 안 함';
    var t = st.atMs ? stamp(st.atMs) : st.at, d = isDirty();
    if (!t) return st.name + ' · ' + (d ? '● ' : '') + '서버에 저장 전';
    return d ? st.name + ' · ● 저장 필요 (마지막 ' + t + ')' : st.name + ' · 서버 저장 ' + t;
  }
  function paintName() {
    if (!syncEl) return;
    painting = true;
    mine = statusText();
    var d = isDirty();
    syncEl.textContent = mine; syncEl.hidden = false; syncEl.className = d ? 'cdirty' : '';
    var o = document.getElementById('cloudOpen');
    if (o && st.name) { o.className = d ? 'dirty' : ''; o.textContent = d ? '● 저장 필요 · ☁ ' + st.name : '☁ ' + st.name + ' · 저장/불러오기'; }
    document.body.classList.toggle('cbar', d);
    var u = document.getElementById('cloudBarUndo'); if (u) u.style.display = canUndo() ? '' : 'none';
    setTimeout(function () { painting = false; }, 0);
  }
  if (syncEl) {
    new MutationObserver(function () {
      if (painting || (syncEl.textContent === mine && !syncEl.hidden)) return;
      paintName();
    }).observe(syncEl, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  }
  // 근무 데이터가 바뀐 시각을 기억해서 '저장 필요'를 판단 (불러오기로 바뀐 건 제외)
  var quiet = false, origSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k) {
    origSet.apply(this, arguments);
    if (!quiet && this === window.localStorage && (k === DATA_KEYS.inputs || k === DATA_KEYS.settings) && st.name) { st.edited = Date.now(); writeSt(); setTimeout(function () { try { label(); } catch (e) {} }, 0); }
  };
  label();
  document.getElementById('cloudOpen').addEventListener('click', function () { show(''); });

  var back = null;
  function close() { if (back) { back.remove(); back = null; } }
  function show(msg, bad) {
    if (!back) {
      back = document.createElement('div'); back.id = 'cloudBack';
      back.innerHTML = '<div id="cloudBox"></div>';
      back.addEventListener('click', function (e) { if (e.target === back) close(); });
      document.body.appendChild(back);
    }
    var box = back.firstChild;
    var m = msg ? '<div class="msg ' + (bad ? 'bad' : 'ok') + '">' + esc(msg) + '</div>' : '';
    var note = '<p>※ 관리자가 문제 해결을 위해 저장된 데이터를 볼 수 있어요.</p>';
    if (!st.name) {
      box.innerHTML = '<h2>서버 저장/불러오기</h2>' +
        '<p>이름과 PIN(숫자 4~8자리, 전화번호 뒷자리 추천)으로 내 데이터를 서버에 저장하고, 다른 기기에서 불러올 수 있어요.</p>' + m +
        '<input id="cn" placeholder="이름" maxlength="20" autocomplete="off"><input id="cp" placeholder="PIN (숫자)" inputmode="numeric" maxlength="8" type="password" autocomplete="off">' +
        '<div class="row"><button id="cLogin" class="pri" type="button">로그인</button><button id="cReg" type="button">새로 가입</button></div>' +
        '<div class="row"><button id="cClose" type="button">닫기</button></div>' + note;
      bind('cLogin', function () { login(false); });
      bind('cReg', function () { login(true); });
    } else {
      box.innerHTML = '<h2>☁ ' + esc(st.name) + '</h2>' +
        '<p>서버 버전 ' + (st.base || 0) + (st.at ? ' · 마지막 ' + esc(st.at) : '') + '</p>' + m +
        '<div class="row"><button id="cSave" class="pri" type="button">서버에 저장</button><button id="cLoad" type="button">서버에서 불러오기</button></div>' +
        (canUndo() ? '<div class="row"><button id="cUndo" type="button">저장 안 된 변경 되돌리기</button></div>' : '') +
        '<div class="row"><button id="cPin" type="button">PIN 바꾸기</button><button id="cOut" type="button">로그아웃</button></div>' +
        '<div class="row"><button id="cClose" type="button">닫기</button></div>' +
        '<p>저장은 이 폰 데이터를 서버로 올려요. 불러오기는 서버 데이터로 이 폰을 바꿔요. 서버에 더 새 데이터가 있으면 저장이 막혀요.</p>' + note;
      bind('cSave', function () { doSave(false); });
      bind('cLoad', doLoad);
      bind('cUndo', askUndo);
      bind('cPin', changePin);
      bind('cOut', function () { if (confirm('로그아웃할까요? 이 폰의 근무 데이터는 그대로 남아요.')) { st = {}; clearSnap(); writeSt(); label(); show('로그아웃했어요.'); } });
    }
    bind('cClose', close);
  }
  function bind(id, fn) { var e = document.getElementById(id); if (e) e.addEventListener('click', fn); }
  function busy(on) { var b = document.querySelectorAll('#cloudBox button'); for (var i = 0; i < b.length; i++) b[i].disabled = on; }
  function now() { var d = new Date(); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  /* ---------- 월별 최소 근무시간(관리자 입력): 로그인 없이 읽고 폰에 보관, 안 되면 보관본/기본값 사용 ---------- */
  function fetchMins() {
    rpc('app_get_mins', {}).then(function (r) {
      if (!r || typeof r !== 'object' || r.code || r.message || r.ok === false) return;   // 서버 설정(SQL) 전이거나 오류면 무시
      try { localStorage.setItem('min-hours-v1', JSON.stringify(r)); } catch (e) {}
      window.dispatchEvent(new Event('minsupdated'));
    });
  }
  fetchMins();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') fetchMins(); });

  /* ---------- 동작 ---------- */
  function login(isReg) {
    var name = document.getElementById('cn').value.trim(), pin = document.getElementById('cp').value.trim();
    if (!name || !pin) { show('이름과 PIN을 입력해주세요.', true); return; }
    busy(true);
    var p = isReg ? rpc('app_register', { p_name: name, p_pin: pin }) : Promise.resolve({ ok: true });
    p.then(function (r) {
      if (!r.ok) { show(errText(r), true); return; }
      return rpc('app_load', { p_name: name, p_pin: pin }).then(function (l) {
        if (!l.ok) { show(errText(l), true); return; }
        clearSnap(); st = { name: name, pin: pin, base: 0 };   // 처음엔 0: 서버에 데이터가 있으면 첫 저장 때 충돌 안내가 뜸
        writeSt(); label();
        show(isReg ? '가입했어요! 이제 저장할 수 있어요.' : (l.version > 0 ? '로그인했어요. 서버에 저장된 데이터가 있어요(버전 ' + l.version + '). 불러오거나 덮어쓸 수 있어요.' : '로그인했어요.'));
      });
    });
  }

  function doSave(force) {
    busy(true);
    var payload = collect();
    rpc('app_save', { p_name: st.name, p_pin: st.pin, p_data: payload, p_base: st.base || 0, p_force: !!force }).then(function (r) {
      if (r.ok) { writeSnap(payload); st.base = r.version; st.at = now(); st.atMs = Date.now(); writeSt(); savedReset(); show('서버에 저장했어요. (버전 ' + r.version + ')'); return; }
      if (r.error === 'conflict') { conflict(r.version); return; }
      show(errText(r), true);
    });
  }
  function conflict(ver) {
    var box = back.firstChild;
    box.innerHTML = '<h2>충돌: 서버가 더 새로워요</h2>' +
      '<p>다른 기기에서 먼저 저장한 데이터(서버 버전 ' + ver + ')가 있어요. 이 상태로 저장하면 그 데이터가 사라져요.</p>' +
      '<div class="row"><button id="k1" class="pri" type="button">서버 것 불러오기</button></div>' +
      '<div class="row"><button id="k2" type="button">내 것으로 덮어쓰기</button><button id="k3" type="button">취소</button></div>';
    bind('k1', doLoad);
    bind('k2', function () { if (confirm('서버 데이터가 사라져요. 정말 덮어쓸까요?')) doSave(true); });
    bind('k3', function () { show(''); });
  }
  function doLoad() {
    busy(true);
    rpc('app_load', { p_name: st.name, p_pin: st.pin }).then(function (r) {
      if (!r.ok) { show(errText(r), true); return; }
      if (!r.data) { show('서버에 저장된 데이터가 아직 없어요.', true); return; }
      if (!confirm('이 폰의 데이터가 서버 데이터(버전 ' + r.version + ')로 바뀌어요. 계속할까요?')) { show(''); return; }
      apply(r.data); writeSnap(r.data); st.base = r.version; st.at = now(); st.atMs = Date.now(); st.edited = 0; writeSt();
      keepView(); location.reload();
    });
  }
  function changePin() {
    var np = prompt('새 PIN (숫자 4~8자리)');
    if (!np) return;
    busy(true);
    rpc('app_change_pin', { p_name: st.name, p_old: st.pin, p_new: np.trim() }).then(function (r) {
      if (!r.ok) { show(errText(r), true); return; }
      st.pin = np.trim(); writeSt(); show('PIN을 바꿨어요.');
    });
  }
})();
