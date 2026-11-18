/* 월 근무 앱 - 설정 화면 (운동 / 회식·약속 켜고 끄기).
   저장 위치: localStorage 'app-settings-v1'  ({ex:false, dine:false} 중 끈 것만 false)
   plan.html 이 시작할 때 읽으므로, 바꾸면 화면을 다시 불러온다. 서버 저장/불러오기(cloud.js)에도 같이 담긴다. */
(function () {
  var KEY = 'app-settings-v1';
  var ITEMS = [
    { k: 'ex', name: '운동', desc: '끄면 운동 칸과 "운동 n/7" 표시가 모두 사라지고, 운동 횟수 조건 없이 근무시간만 배분해요.' },
    { k: 'dine', name: '약속', desc: '운동과 따로 켜고 끌 수 있어요. 끄면 약속 단계가 빠지고, 켜면 평일 칸에서 눌러 표시해요(그날 8시간 고정).' }
  ];

  function read() { try { var o = JSON.parse(localStorage.getItem(KEY)); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function write(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function on(o, k) { return o[k] !== false; }

  var css = document.createElement('style');
  css.textContent =
    '#setBack{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}' +
    '#setBox{width:100%;max-width:520px;max-height:88vh;overflow:auto;background:var(--surface);color:var(--fg);border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));box-sizing:border-box}' +
    '#setBox h2{margin:0 0 6px;font-size:17px}' +
    '#setBox .it{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)}' +
    '#setBox .it .t{flex:1}#setBox .it b{font-size:16px}#setBox .it small{display:block;color:var(--muted);font-size:12px;line-height:1.4;margin-top:2px}' +
    '#setBox .it.dis{opacity:.4}' +
    '#setBox .sw{position:relative;width:50px;height:30px;flex:none;border-radius:15px;border:0;background:var(--line);padding:0}' +
    '#setBox .sw::after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .15s}' +
    '#setBox .sw.on{background:var(--accent)}#setBox .sw.on::after{left:23px}' +
    '#setBox .close{width:100%;margin-top:12px;font:inherit;font-size:15px;padding:11px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--fg)}' +
    '#setBox p{margin:8px 0 0;font-size:12px;color:var(--muted);line-height:1.5}' +
    '#setOpen{font:inherit;font-size:13px;padding:6px 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--fg)}' +
    '#setBox .upd{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}' +
    '#setBox .upd b{font-size:16px}' +
    '#setBox .upd .m{display:block;margin:4px 0 8px;font-size:13px;color:var(--muted);line-height:1.5}' +
    '#setBox .upd .m.ok{color:#2e7d32}#setBox .upd .m.bad{color:#c62828}#setBox .upd .m.new{color:var(--accent);font-weight:700}' +
    '#setBox .upd button{width:100%;font:inherit;font-size:15px;padding:11px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--fg)}' +
    '#setBox .upd button.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:700}' +
    '#setBox .upd button:disabled{opacity:.5}' +
    '#setBox .pref{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}' +
    '#setBox .pref b{font-size:16px}#setBox .pref small{display:block;color:var(--muted);font-size:12px;line-height:1.45;margin:2px 0 8px}' +
    '#setBox .pref .pr{display:flex;align-items:center;gap:6px;margin:6px 0}#setBox .pref .pr span{flex:none;width:92px;font-size:13px}' +
    '#setBox .pref .hd{margin:8px 0 2px}#setBox .pref .hd em{flex:1;min-width:0;font-style:normal;font-size:12px;font-weight:700;text-align:center;line-height:1.2;border-radius:6px;padding:3px 0}' +
    '#setBox .pref .hd em i{display:block;font-style:normal;font-weight:400;font-size:10px;color:var(--muted)}' +
    '#setBox .pref .hd .r1{background:var(--accent);color:var(--on-accent)}#setBox .pref .hd .r1 i{color:var(--on-accent);opacity:.85}' +
    '#setBox .pref .hd .r2{background:rgba(31,94,255,.18);color:var(--fg)}' +
    '#setBox .pref .hd .r3{background:rgba(120,130,145,.18);color:var(--muted)}' +
    '#setBox .pref select.r1{border:2px solid var(--accent);font-weight:700}#setBox .pref select.r2{border-color:rgba(31,94,255,.45)}#setBox .pref select.r3{opacity:.85}' +
    '#setBox .pref select{flex:1;min-width:0;font:inherit;font-size:15px;padding:8px 6px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg)}' +
    '#updPill{font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);font-weight:700}' +
    '#cloudRow{gap:8px;flex-wrap:wrap;row-gap:6px}';
  document.head.appendChild(css);

  var row = document.getElementById('cloudRow');
  if (!row) { row = document.createElement('div'); row.id = 'cloudRow'; row.style.cssText = 'display:flex;justify-content:center;margin:2px 0 8px'; document.body.appendChild(row); }
  var btn = document.createElement('button');
  btn.id = 'setOpen'; btn.type = 'button'; btn.textContent = '⚙ 설정';
  row.appendChild(btn);
  btn.addEventListener('click', open);

  /* ---------- 앱 업데이트: 서버의 최신 버전 확인 → 오래된 저장 파일을 비우고 새로 불러오기(근무 기록·설정은 그대로) ---------- */
  function curVer() {
    var e = document.getElementById('appVer'), m = e && e.textContent.match(/(\d+\.\d+\.\d+)/);
    return m ? m[1] : '알 수 없음';
  }
  function newer(a, b) {   // a 가 b 보다 새로우면 true
    var x = a.split('.').map(Number), y = b.split('.').map(Number);
    for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); }
    return false;
  }
  function say(t, cls) { var m = document.getElementById('updMsg'); if (m) { m.textContent = t; m.className = 'm ' + (cls || ''); } }
  var latest = null;
  function checkUpdate() {
    var b = document.getElementById('updBtn'); b.disabled = true; say('확인하는 중…');
    fetch('./?c=' + Date.now(), { cache: 'reload' }).then(function (r) { return r.text(); }).then(function (t) {
      var m = t.match(/id="appVer"[^>]*>[^<]*?(\d+\.\d+\.\d+)/);
      if (!m) throw new Error('no version');
      latest = m[1]; b.disabled = false;
      if (newer(latest, curVer())) {
        say('새 버전이 나왔어요 (' + latest + '). 근무 기록과 설정은 그대로 남아요.', 'new');
        b.textContent = '지금 갱신하기'; b.className = 'pri';
        b.onclick = function () { doUpdate(); };
      } else {
        say('가장 최신 버전이에요 ✓ (' + curVer() + ')', 'ok');
        b.textContent = '그래도 다시 불러오기'; b.className = '';
        b.onclick = function () { doUpdate(); };
      }
    }).catch(function () {
      b.disabled = false; say('확인하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.', 'bad');
    });
  }
  function doUpdate() {
    var b = document.getElementById('updBtn'); if (b) b.disabled = true; say('갱신하는 중… 잠시 뒤 앱이 다시 열려요.');
    if (b) { try { sessionStorage.setItem('reopen-set-v1', '1'); } catch (e) {} }   // 설정에서 눌렀으면 새로 불러온 뒤 설정 창을 다시 엶
    var files = ['./', 'cloud.js', 'settings.js', 'sw.js'];
    Promise.all(files.map(function (f) { return fetch(f + (f === './' ? '?c=' : '?c=') + Date.now(), { cache: 'reload' }).catch(function () {}); }))   // 브라우저 임시 저장분(10분)을 건너뛰고 새로 받음
      .then(function () { return navigator.serviceWorker ? navigator.serviceWorker.getRegistrations() : []; })
      .then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })
      .then(function () { return window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : null; })
      .then(function () { location.replace(location.pathname + '?v=' + Date.now()); })   // 근무 기록(localStorage)은 건드리지 않음
      .catch(function () { if (b) b.disabled = false; say('갱신하지 못했어요. 앱을 완전히 종료했다가 다시 열어 주세요.', 'bad'); });
  }

  // 새 버전이 있으면 달력 아래 줄에 알림 버튼을 띄움 (30분에 한 번만 확인, 실패하면 조용히 무시)
  function autoCheck() {
    try { var last = +localStorage.getItem('upd-check-v1') || 0; if (Date.now() - last < 30 * 60 * 1000) return; localStorage.setItem('upd-check-v1', String(Date.now())); } catch (e) {}
    fetch('./?c=' + Date.now(), { cache: 'reload' }).then(function (r) { return r.text(); }).then(function (t) {
      var m = t.match(/id="appVer"[^>]*>[^<]*?(\d+\.\d+\.\d+)/);
      if (!m || !newer(m[1], curVer()) || document.getElementById('updPill')) return;
      var row = document.getElementById('cloudRow'), b = document.createElement('button');
      b.id = 'updPill'; b.type = 'button'; b.textContent = '⬆ 새 버전 ' + m[1] + ' 갱신';
      b.addEventListener('click', function () { b.disabled = true; b.textContent = '갱신하는 중…'; doUpdate(); });
      if (row) row.appendChild(b);
    }).catch(function () {});
  }
  setTimeout(autoCheck, 3000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') autoCheck(); });

  // 설정에서 '갱신/다시 불러오기'를 눌러 화면이 새로 불러와졌으면 설정 창을 닫힌 채로 두지 않고 다시 연다
  (function () {
    var f = null; try { f = sessionStorage.getItem('reopen-set-v1'); sessionStorage.removeItem('reopen-set-v1'); } catch (e) {}
    if (!f) return;
    setTimeout(function () {
      open();
      say('다시 불러왔어요 ✓ 지금 쓰는 버전 ' + curVer(), 'ok');
      var m = document.getElementById('updMsg'); if (m && m.scrollIntoView) m.scrollIntoView({ block: 'center' });
    }, 400);
  })();

  var back = null;
  function close() { if (back) { back.remove(); back = null; } }
  function open() {
    var o = read();
    back = document.createElement('div'); back.id = 'setBack';
    // 설정 창은 바깥을 눌러도 닫히지 않고, '닫기' 버튼으로만 닫음(실수로 닫히는 것 방지)
    var h = '<div id="setBox"><h2>설정</h2>';
    ITEMS.forEach(function (it) {
      var dis = it.needs && !on(o, it.needs);
      h += '<div class="it' + (dis ? ' dis' : '') + '"><div class="t"><b>' + it.name + '</b><small>' + it.desc + '</small></div>' +
        '<button type="button" class="sw' + (on(o, it.k) ? ' on' : '') + '" data-k="' + it.k + '" ' + (dis ? 'disabled' : '') + ' aria-label="' + it.name + '"></button></div>';
    });
    var pf = o.pref || {}, pe = (pf.ex || [9, 10, 7]), pn = (pf.no || [10, 11, 8]);
    function opts(sel, lo, hi, none) { var s = none ? '<option value="">없음</option>' : ''; for (var v = lo; v <= hi; v++) s += '<option value="' + v + '"' + (+sel === v ? ' selected' : '') + '>' + v + '시간</option>'; return s; }
    h += '<div class="pref"><b>선호 근무시간</b><small>"최대로 채우기"로 시작한 달에서, 월 최대 시간에 딱 맞는 조합 중 <b>1순위를 가장 많이</b> 써요. 시간이 많은 날은 월초로 모으고 적은 날은 말일 쪽에 둬요(예: 앞쪽 11시간, 뒤쪽 10시간). 맞는 조합이 없으면 기존 방식으로 맞춰요. 최소로 시작한 달은 평일 8시간이라 쓰이지 않아요. 이미 정해진 날은 바뀌지 않아요.</small>' +
      '<div class="pr hd"><span></span><em class="r1">1순위<i>가장 선호</i></em><em class="r2">2순위</em><em class="r3">3순위<i>가장 낮음</i></em></div>' +
      '<div class="pr"><span>운동 있는 날</span><select class="r1" data-p="ex0">' + opts(pe[0], 5, 12, false) + '</select><select class="r2" data-p="ex1">' + opts(pe[1], 5, 12, true) + '</select><select class="r3" data-p="ex2">' + opts(pe[2], 5, 12, true) + '</select></div>' +
      '<div class="pr"><span>운동 없는 날</span><select class="r1" data-p="no0">' + opts(pn[0], 5, 13, false) + '</select><select class="r2" data-p="no1">' + opts(pn[1], 5, 13, true) + '</select><select class="r3" data-p="no2">' + opts(pn[2], 5, 13, true) + '</select></div>' +
      '<small>왼쪽일수록 선호가 높아요(1순위가 가장 높음). 기본값은 운동 있는 날 9·10·7시간, 운동 없는 날 10·11·8시간이에요(새로 최대로 채우기를 고른 달부터 적용). 여기서 직접 바꾸면 최대로 채우는 모든 달에 적용돼요.</small></div>';
    h += '<p>바꾸면 화면이 다시 불러와져요. 이미 입력한 근무시간은 지워지지 않아요. 설정은 서버에 저장할 때 같이 저장돼요.</p>' +
      '<div class="upd"><b>앱 업데이트</b><span class="m" id="updMsg">지금 쓰는 버전 ' + curVer() + '</span>' +
      '<button type="button" id="updBtn">최신 버전 확인하기</button></div>' +
      '<div class="upd"><b>관리자</b><span class="m">사용자 관리와 월별 최소 근무시간을 입력하는 곳이에요. 관리자 비밀번호가 있어야 들어갈 수 있어요.</span>' +
      '<button type="button" id="admBtn">관리자 페이지 열기</button></div>' +
      '<button type="button" class="close" id="setClose">닫기</button></div>';
    back.innerHTML = h;
    document.body.appendChild(back);
    document.getElementById('setClose').addEventListener('click', close);
    document.getElementById('updBtn').addEventListener('click', checkUpdate);
    Array.prototype.forEach.call(back.querySelectorAll('.pref select'), function (sl) {
      sl.addEventListener('change', function () {
        var g = function (k) { var e = back.querySelector('select[data-p="' + k + '"]'); return e && e.value ? +e.value : null; };
        var cur = read(), ex = [g('ex0'), g('ex1'), g('ex2')].filter(Boolean), no = [g('no0'), g('no1'), g('no2')].filter(Boolean);
        cur.pref = { ex: ex, no: no }; write(cur); location.reload();
      });
    });
    document.getElementById('admBtn').addEventListener('click', function () { location.href = 'admin.html'; });   // 같은 창에서 열고, 관리자 페이지의 '← 앱으로'로 돌아옴
    Array.prototype.forEach.call(back.querySelectorAll('.sw'), function (b) {
      b.addEventListener('click', function () {
        var cur = read(), k = b.getAttribute('data-k');
        if (on(cur, k)) cur[k] = false; else delete cur[k];
        write(cur);
        location.reload();
      });
    });
  }
})();
