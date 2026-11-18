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
    '#cloudRow{gap:8px}';
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
    var b = document.getElementById('updBtn'); b.disabled = true; say('갱신하는 중… 잠시 뒤 앱이 다시 열려요.');
    var files = ['./', 'cloud.js', 'settings.js', 'sw.js'];
    Promise.all(files.map(function (f) { return fetch(f + (f === './' ? '?c=' : '?c=') + Date.now(), { cache: 'reload' }).catch(function () {}); }))   // 브라우저 임시 저장분(10분)을 건너뛰고 새로 받음
      .then(function () { return navigator.serviceWorker ? navigator.serviceWorker.getRegistrations() : []; })
      .then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })
      .then(function () { return window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : null; })
      .then(function () { location.replace(location.pathname + '?v=' + Date.now()); })   // 근무 기록(localStorage)은 건드리지 않음
      .catch(function () { b.disabled = false; say('갱신하지 못했어요. 앱을 완전히 종료했다가 다시 열어 주세요.', 'bad'); });
  }

  var back = null;
  function close() { if (back) { back.remove(); back = null; } }
  function open() {
    var o = read();
    back = document.createElement('div'); back.id = 'setBack';
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    var h = '<div id="setBox"><h2>설정</h2>';
    ITEMS.forEach(function (it) {
      var dis = it.needs && !on(o, it.needs);
      h += '<div class="it' + (dis ? ' dis' : '') + '"><div class="t"><b>' + it.name + '</b><small>' + it.desc + '</small></div>' +
        '<button type="button" class="sw' + (on(o, it.k) ? ' on' : '') + '" data-k="' + it.k + '" ' + (dis ? 'disabled' : '') + ' aria-label="' + it.name + '"></button></div>';
    });
    h += '<p>바꾸면 화면이 다시 불러와져요. 이미 입력한 근무시간은 지워지지 않아요. 설정은 서버에 저장할 때 같이 저장돼요.</p>' +
      '<div class="upd"><b>앱 업데이트</b><span class="m" id="updMsg">지금 쓰는 버전 ' + curVer() + '</span>' +
      '<button type="button" id="updBtn">최신 버전 확인하기</button></div>' +
      '<button type="button" class="close" id="setClose">닫기</button></div>';
    back.innerHTML = h;
    document.body.appendChild(back);
    document.getElementById('setClose').addEventListener('click', close);
    document.getElementById('updBtn').addEventListener('click', checkUpdate);
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
