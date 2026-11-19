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
  function on(o, k) { return k === 'ex' ? o[k] === true : o[k] !== false; }   // 운동은 기본 꺼짐(켜야 true), 나머지는 기본 켜짐

  var css = document.createElement('style');
  css.textContent =
    '#setBack{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}' +
    '#setBox{width:100%;max-width:520px;max-height:88vh;overflow:auto;background:var(--surface);color:var(--fg);border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));box-sizing:border-box}' +
    '#setBox h2{margin:0;font-size:17px}' +
    '#setBox .top{position:sticky;top:-16px;z-index:3;display:flex;align-items:center;justify-content:space-between;margin:-16px -16px 8px;padding:12px 16px;background:var(--surface);border-bottom:1px solid var(--line)}' +
    '#setBox .top button{font:inherit;font-size:14px;font-weight:700;padding:6px 16px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--fg)}' +
    '#setBox .it{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)}' +
    '#setBox .it .t{flex:1}#setBox .it b{font-size:16px}#setBox .it small{display:block;color:var(--muted);font-size:12px;line-height:1.4;margin-top:2px}' +
    '#setBox .it.dis{opacity:.4}' +
    '#setBox .it select.exn{flex:none;width:92px;font:inherit;font-size:15px;padding:8px 6px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg)}' +
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
    '#setBox .pref .hd{margin:8px 0 2px}#setBox .pref .hd em{flex:1 1 0;min-width:0;box-sizing:border-box;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-style:normal;font-size:12px;font-weight:700;text-align:center;line-height:1.2;border-radius:6px}' +
    '#setBox .pref .hd em i{display:block;font-style:normal;font-weight:400;font-size:10px;line-height:1.2;color:var(--muted)}' +
    '#setBox .pref .hd .r1{background:var(--accent);color:var(--on-accent)}#setBox .pref .hd .r1 i{color:var(--on-accent);opacity:.85}' +
    '#setBox .pref .hd .r2{background:rgba(31,94,255,.18);color:var(--fg)}' +
    '#setBox .pref .hd .r3{background:rgba(120,130,145,.18);color:var(--muted)}' +
    '#setBox .pref select.r1{border:2px solid var(--accent);font-weight:700}#setBox .pref select.r2{border-color:rgba(31,94,255,.45)}#setBox .pref select.r3{opacity:.85}' +
    '#setBox .pref select{flex:1;min-width:0;font:inherit;font-size:15px;padding:8px 6px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg)}' +
    '#updPill{font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);font-weight:700}' +
    '#setBox .it{padding:8px 0}' +
    '#setBox .top .tb{display:flex;gap:6px;align-items:center}' +
    '#setBox .top .q{width:34px;height:34px;padding:0;border-radius:50%}#setBox .top .q[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}' +
    '#setBox .hq{margin-left:6px;width:20px;height:20px;padding:0;border-radius:50%;border:1px solid var(--muted);background:var(--surface);color:var(--muted);font:700 12px/1 var(--font-ui,inherit);vertical-align:middle}' +
    '#hpop{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:24px}' +
    '#hpop .hbox{max-width:340px;background:var(--surface);color:var(--fg);border-radius:16px;padding:16px 18px;box-shadow:0 10px 30px rgba(0,0,0,.3)}' +
    '#hpop .hbox b{font-size:16px}#hpop .hbox p{margin:8px 0;font-size:14px;line-height:1.55;color:var(--fg)}#hpop .hbox small{display:block;margin-top:6px;font-size:11px;color:var(--muted)}' +
    '#setBox .it .t{min-width:0}#setBox .it small.m{margin-top:1px;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#setBox .it small.m.ok{color:#2e7d32}#setBox .it small.m.bad{color:#c62828}#setBox .it small.m.new{color:var(--accent);font-weight:700}' +
    '#setBox .mini{flex:none;font:inherit;font-size:14px;padding:7px 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--fg)}' +
    '#setBox .mini.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:700}#setBox .mini:disabled{opacity:.45}' +
    '#purgeBack{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center}' +
    '#purgeBack .pgbox{width:100%;max-width:520px;max-height:80vh;overflow:auto;background:var(--surface);color:var(--fg);border-radius:16px 16px 0 0;padding:14px 16px calc(16px + env(safe-area-inset-bottom,0px));box-sizing:border-box}' +
    '#purgeBack .pgtop{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}#purgeBack h2{margin:0;font-size:17px}' +
    '#purgeBack .pgtop button{font:inherit;font-size:14px;font-weight:700;padding:6px 16px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--fg)}' +
    '#purgeBack .pglist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}' +
    '#purgeBack .pg{display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--bg);font-size:15px}#purgeBack .pg input{width:18px;height:18px}' +
    '#purgeBack .mini{font:inherit;font-size:15px;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--fg)}#purgeBack .mini:disabled{opacity:.45}' +
    '#purgeBack .mini.dng.arm{background:#c62828;border-color:#c62828;color:#fff;font-weight:700}' +
    '#cloudRow{gap:8px;flex-wrap:nowrap;align-items:center}#cloudOpen{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#setOpen,#updPill{flex:none;white-space:nowrap}';   // 한 줄 고정(글자가 길어져도 줄이 늘지 않게)
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
    var b = document.getElementById('updBtn'); b.disabled = true; say('확인 중…');
    fetch('./?c=' + Date.now(), { cache: 'reload' }).then(function (r) { return r.text(); }).then(function (t) {
      var m = t.match(/id="appVer"[^>]*>[^<]*?(\d+\.\d+\.\d+)/);
      if (!m) throw new Error('no version');
      latest = m[1]; b.disabled = false;
      if (newer(latest, curVer())) {
        say('새 버전 ' + latest + ' 나왔어요', 'new');
        b.textContent = '갱신'; b.className = 'mini pri';
        b.onclick = function () { doUpdate(); };
      } else {
        say('최신이에요 ✓ ' + curVer(), 'ok');
        b.textContent = '다시 받기'; b.className = 'mini';
        b.onclick = function () { doRefresh(); };
      }
    }).catch(function () {
      b.disabled = false; say('확인 실패 · 연결 확인', 'bad');
    });
  }
  // 같은 버전: 화면은 그대로 두고(설정 창 유지) 폰에 저장된 파일만 서버 최신본으로 다시 받아 둠. 다음에 앱을 열 때 적용돼요.
  function doRefresh() {
    var b = document.getElementById('updBtn'); if (b) b.disabled = true; say('받는 중…');
    Promise.all(['./', 'cloud.js', 'settings.js', 'sw.js'].map(function (f) { return fetch(f + '?c=' + Date.now(), { cache: 'reload' }).catch(function () {}); }))
      .then(function () { return navigator.serviceWorker ? navigator.serviceWorker.getRegistrations() : []; })
      .then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })
      .then(function () { return window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : null; })
      .then(function () { if (b) b.disabled = false; say('받아 뒀어요 ✓ 다음 실행 때 적용', 'ok'); })
      .catch(function () { if (b) b.disabled = false; say('받지 못했어요 · 연결 확인', 'bad'); });
  }
  function doUpdate() {
    var b = document.getElementById('updBtn'); if (b) b.disabled = true; say('갱신 중… 곧 다시 열려요');
    if (b) { try { sessionStorage.setItem('reopen-set-v1', '1'); } catch (e) {} }   // 설정에서 눌렀으면 새로 불러온 뒤 설정 창을 다시 엶
    var files = ['./', 'cloud.js', 'settings.js', 'sw.js'];
    Promise.all(files.map(function (f) { return fetch(f + (f === './' ? '?c=' : '?c=') + Date.now(), { cache: 'reload' }).catch(function () {}); }))   // 브라우저 임시 저장분(10분)을 건너뛰고 새로 받음
      .then(function () { return navigator.serviceWorker ? navigator.serviceWorker.getRegistrations() : []; })
      .then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })
      .then(function () { return window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : null; })
      .then(function () { location.replace(location.pathname + '?v=' + Date.now()); })   // 근무 기록(localStorage)은 건드리지 않음
      .catch(function () { if (b) b.disabled = false; say('갱신 실패 · 앱을 다시 열어 주세요', 'bad'); });
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
      if (!back) open();
      say('갱신 완료 ✓ ' + curVer(), 'ok');
      var m = document.getElementById('updMsg'); if (m && m.scrollIntoView) m.scrollIntoView({ block: 'center' });
    }, 30);
  })();

  var back = null;
  function close() { if (back) { back.remove(); back = null; } }
  function open() {
    back = document.createElement('div'); back.id = 'setBack';
    // 설정 창은 바깥을 눌러도 닫히지 않고, '닫기' 버튼으로만 닫음(실수로 닫히는 것 방지)
    document.body.appendChild(back);
    build();
  }
  // 설정을 바꾸면 화면을 새로 불러오지 않고 바로 적용 + 창 내용만 다시 그림(창은 닫히지 않음)
  function applyNow() { window.dispatchEvent(new Event('settingschanged')); build(); }
  // 지난 달 기록 정리: 이 폰의 데이터에서 고른 달 이전(포함)을 지움. 서버에는 '서버 저장'을 눌러야 반영돼요.
  // ----- 지난 기록: 기록이 있는 지난 달 목록 -----
  function pastMonths() {
    var all = {}; try { all = JSON.parse(localStorage.getItem('plan-inputs-v4')) || {}; } catch (e) {}
    var n = new Date(), cur = n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2);
    return Object.keys(all).filter(function (k) {
      if (!/^\d{4}-\d{2}$/.test(k) || k >= cur) return false;
      var m = all[k] || {};
      return !!m.fm || ['d', 'x', 'a', 'ax'].some(function (f) { return m[f] && Object.keys(m[f]).length; });   // 기록이 하나라도 있는 달만
    }).sort();
  }
  function openPurge() {
    var pm = pastMonths();
    var old = document.getElementById('purgeBack'); if (old) old.remove();
    var e = document.createElement('div'); e.id = 'purgeBack';
    var rows = pm.map(function (k) { return '<label class="pg"><input type="checkbox" value="' + k + '"><span>' + k.slice(0, 4) + '년 ' + (+k.slice(5)) + '월</span></label>'; }).join('');
    e.innerHTML = '<div class="pgbox"><div class="pgtop"><h2>지울 달 고르기</h2><button type="button" id="pgX">닫기</button></div>' +
      (pm.length ? '<div class="pglist">' + rows + '</div><button type="button" id="pgAll" class="mini" style="width:100%;margin:6px 0">전체 선택/해제</button>' +
        '<button type="button" id="pgGo" class="mini dng" style="width:100%" disabled>지우기</button>' : '<p>지울 지난 달 기록이 없어요.</p>') + '</div>';
    document.body.appendChild(e);
    function close2() { e.remove(); }
    e.addEventListener('click', function (ev) { if (ev.target === e) close2(); });
    document.getElementById('pgX').addEventListener('click', close2);
    if (!pm.length) return;
    var boxes = [].slice.call(e.querySelectorAll('input[type=checkbox]')), go = document.getElementById('pgGo'), armT = null;
    function sel() { return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; }); }
    function refresh() { var n = sel().length; go.disabled = !n; go.textContent = n ? n + '개월 지우기' : '지우기'; go.classList.remove('arm'); go.removeAttribute('data-arm'); }
    boxes.forEach(function (b) { b.addEventListener('change', refresh); });
    document.getElementById('pgAll').addEventListener('click', function () { var all = boxes.every(function (b) { return b.checked; }); boxes.forEach(function (b) { b.checked = !all; }); refresh(); });
    go.addEventListener('click', function () {
      var ks = sel(); if (!ks.length) return;
      if (go.getAttribute('data-arm') !== '1') {   // 첫 번째 누름: 한 번 더 확인
        go.setAttribute('data-arm', '1'); go.classList.add('arm'); go.textContent = '한 번 더 누르면 ' + ks.length + '개월이 지워져요';
        clearTimeout(armT); armT = setTimeout(refresh, 6000); return;
      }
      var all = {}; try { all = JSON.parse(localStorage.getItem('plan-inputs-v4')) || {}; } catch (e2) {}
      ks.forEach(function (k) { delete all[k]; });
      try { localStorage.setItem('plan-inputs-v4', JSON.stringify(all)); localStorage.removeItem('undo-stack-v1'); sessionStorage.setItem('restore-view-v1', '1'); } catch (e3) {}
      location.reload();
    });
  }

  var HELP = [
    ['약속', '평일 칸에서 눌러 표시해요. 그날은 8시간으로 고정돼요. 끄면 약속 단계가 빠져요.'],
    ['선호 근무시간', '"최대로 채우기"로 시작한 달에서, 월 최대 시간에 딱 맞는 조합 중 1순위를 가장 많이 써요. 시간이 많은 날은 월초로 모아요. 맞는 조합이 없으면 기존 방식으로 맞춰요. 필수로 시작한 달은 쓰이지 않고, 이미 정해진 날은 안 바뀌어요. 스위치를 꺼도 정한 값은 그대로 적용돼요.'],
    ['운동', '끄면 운동 칸과 "운동 n/7" 표시가 사라지고, 운동 횟수 조건 없이 근무시간만 배분해요.'],
    ['운동 목표 횟수', '한 달에 운동하려는 횟수예요(기본 7번). 토요일 운동도 들어가요. 모자라면 빨갛게 알려줘요.'],
    ['지난 기록 지우기', '누르면 지울 달을 고르는 창이 떠요. 이번 달과 앞으로의 달은 지우지 않고, 이 폰에 기록이 남아 있는 지난 달만 목록에 떠요(없으면 ‘지울 달 없음’). 이 폰에서 지워지고, 서버에도 지우려면 지운 뒤 ☁ 서버 저장을 눌러요. 저장 전에는 "저장 안 한 변경 되돌리기"로 복구할 수 있고, 저장하면 되돌릴 수 없어요. 기록이 없는 지난 달은 빈 달로 보여요.'],
    ['앱 업데이트', '새 버전이 있는지 확인해요. 갱신해도 근무 기록과 설정은 그대로 남아요.'],
    ['관리자', '사용자 관리와 월별 필수 근무시간을 입력하는 페이지예요. 관리자 비밀번호가 있어야 들어갈 수 있어요.']
  ];
  function hq(name) { return '<button type="button" class="hq" data-hq="' + name + '" aria-label="' + name + ' 설명">?</button>'; }
  function showHelp(name) {   // 항목별 도움말 팝업: 아무 데나 누르면 닫힘
    var old = document.getElementById('hpop'); if (old) old.remove();
    var t = ''; HELP.forEach(function (x) { if (x[0] === name) t = x[1]; });
    var e = document.createElement('div'); e.id = 'hpop';
    e.innerHTML = '<div class="hbox"><b>' + name + '</b><p>' + t + '</p><small>아무 데나 누르면 닫혀요</small></div>';
    e.addEventListener('click', function () { e.remove(); });
    document.body.appendChild(e);
  }
  function swRow(name, k, on_) { return '<div class="it"><div class="t"><b>' + name + '</b>' + hq(name) + '</div><button type="button" class="sw' + (on_ ? ' on' : '') + '" data-k="' + k + '" aria-label="' + name + '"></button></div>'; }
  function build() {
    var bx0 = document.getElementById('setBox'), prevTop = bx0 ? bx0.scrollTop : 0;
    var o = read();
    var h = '<div id="setBox"><div class="top"><h2>설정</h2><span class="tb"><button type="button" id="setClose2">닫기</button></span></div>';
    h += swRow('약속', 'dine', on(o, 'dine'));
    // 선호 근무시간: 스위치를 켜면 순위 칸이 열림
    var pf = o.pref || {}, pe = (pf.ex || [9, 10, 7]), pn = (pf.no || [10, 11, 8]), exOnS = on(o, 'ex'), pOpen = !!o.prefOpen;
    h += '<div class="it"><div class="t"><b>선호 근무시간</b>' + hq('선호 근무시간') + '</div><button type="button" class="sw' + (pOpen ? ' on' : '') + '" id="prefSw" aria-label="선호 근무시간 설정 열기"></button></div>';
    function opts(sel, lo, hi, none) { var s = none ? '<option value="">없음</option>' : ''; for (var v = lo; v <= hi; v++) s += '<option value="' + v + '"' + (+sel === v ? ' selected' : '') + '>' + v + '시간</option>'; return s; }
    var head = '<div class="pr hd"><span></span><em class="r1">1순위<i>가장 선호</i></em><em class="r2">2순위<i>다음 선호</i></em><em class="r3">3순위<i>그다음 선호</i></em></div>';
    var rowNo = function (label) { return '<div class="pr"><span>' + label + '</span><select class="r1" data-p="no0">' + opts(pn[0], 5, 13, false) + '</select><select class="r2" data-p="no1">' + opts(pn[1], 5, 13, true) + '</select><select class="r3" data-p="no2">' + opts(pn[2], 5, 13, true) + '</select></div>'; };
    var rowEx = '<div class="pr"><span>운동 있는 날</span><select class="r1" data-p="ex0">' + opts(pe[0], 5, 12, false) + '</select><select class="r2" data-p="ex1">' + opts(pe[1], 5, 12, true) + '</select><select class="r3" data-p="ex2">' + opts(pe[2], 5, 12, true) + '</select></div>';
    if (pOpen) h += '<div class="pref">' + head + (exOnS ? rowEx + rowNo('운동 없는 날') : rowNo('근무시간')) + '</div>';
    // 운동, 운동 목표 횟수(운동을 켠 경우에만)
    h += swRow('운동', 'ex', exOnS);
    if (exOnS) {
      var exNv = Math.min(12, Math.max(1, parseInt(o.exN, 10) || 7)), eo = ''; for (var q = 1; q <= 12; q++) eo += '<option value="' + q + '"' + (q === exNv ? ' selected' : '') + '>' + q + '번</option>';
      h += '<div class="it"><div class="t"><b>운동 목표 횟수</b>' + hq('운동 목표 횟수') + '</div><select class="exn" id="exNsel">' + eo + '</select></div>';
    }
    h += '<div class="it"><div class="t"><b>지난 기록 지우기</b>' + hq('지난 기록 지우기') + '</div><button type="button" class="mini" id="purgeOpen"' + (pastMonths().length ? '' : ' disabled') + '>' + (pastMonths().length ? '달 선택' : '지울 달 없음') + '</button></div>' +
      '<div class="it"><div class="t"><b>앱 업데이트</b>' + hq('앱 업데이트') + '<small class="m" id="updMsg">현재 ' + curVer() + '</small></div><button type="button" class="mini" id="updBtn">확인</button></div>' +
      '<div class="it"><div class="t"><b>관리자</b>' + hq('관리자') + '</div><button type="button" class="mini" id="admBtn">페이지 열기</button></div>' +
      '<button type="button" class="close" id="setClose">닫기</button></div>';
    back.innerHTML = h;
    var bx1 = document.getElementById('setBox'); if (bx1) bx1.scrollTop = prevTop;
    var exs = document.getElementById('exNsel');
    if (exs) exs.addEventListener('change', function () { var cur = read(), v = +exs.value; if (v === 7) delete cur.exN; else cur.exN = v; write(cur); applyNow(); });
    document.getElementById('setClose').addEventListener('click', close);
    document.getElementById('setClose2').addEventListener('click', close);   // 맨 위 닫기(스크롤해도 위에 붙어 있음)
    Array.prototype.forEach.call(back.querySelectorAll('.hq'), function (b) { b.addEventListener('click', function () { showHelp(b.getAttribute('data-hq')); }); });
    document.getElementById('updBtn').addEventListener('click', checkUpdate);
    document.getElementById('purgeOpen').addEventListener('click', openPurge);
    Array.prototype.forEach.call(back.querySelectorAll('.pref select'), function (sl) {
      sl.addEventListener('change', function () {
        var g = function (k) { var e = back.querySelector('select[data-p="' + k + '"]'); return e && e.value ? +e.value : null; };
        var cur = read(), no = [g('no0'), g('no1'), g('no2')].filter(Boolean), ex = back.querySelector('select[data-p="ex0"]') ? [g('ex0'), g('ex1'), g('ex2')].filter(Boolean) : ((cur.pref && cur.pref.ex) || [9, 10, 7]);   // 운동을 끈 상태면 기존 값을 그대로 보존
        cur.pref = { ex: ex, no: no }; write(cur); applyNow();
      });
    });
    document.getElementById('prefSw').addEventListener('click', function () { var cur = read(); if (cur.prefOpen) delete cur.prefOpen; else cur.prefOpen = true; write(cur); build(); });
    document.getElementById('admBtn').addEventListener('click', function () { location.href = 'admin.html'; });   // 같은 창에서 열고, 관리자 페이지의 '← 앱으로'로 돌아옴
    Array.prototype.forEach.call(back.querySelectorAll('.sw[data-k]'), function (b) {
      b.addEventListener('click', function () {
        var cur = read(), k = b.getAttribute('data-k');
        if (on(cur, k)) cur[k] = false; else if (k === 'ex') cur[k] = true; else delete cur[k];
        write(cur);
        applyNow();
      });
    });
  }
})();
