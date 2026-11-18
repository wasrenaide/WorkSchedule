/* 월 근무 앱 - 설정 화면 (운동 / 회식·약속 켜고 끄기).
   저장 위치: localStorage 'app-settings-v1'  ({ex:false, dine:false} 중 끈 것만 false)
   plan.html 이 시작할 때 읽으므로, 바꾸면 화면을 다시 불러온다. 서버 저장/불러오기(cloud.js)에도 같이 담긴다. */
(function () {
  var KEY = 'app-settings-v1';
  var ITEMS = [
    { k: 'ex', name: '운동', desc: '끄면 운동 칸과 "운동 n/7" 표시가 모두 사라지고, 운동 횟수 조건 없이 근무시간만 배분해요.' },
    { k: 'dine', name: '회식/약속', desc: '운동과 따로 켜고 끌 수 있어요. 끄면 회식/약속 단계가 빠지고, 켜면 평일 칸에서 눌러 표시해요(그날 8시간 고정).' }
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
    '#cloudRow{gap:8px}';
  document.head.appendChild(css);

  var row = document.getElementById('cloudRow');
  if (!row) { row = document.createElement('div'); row.id = 'cloudRow'; row.style.cssText = 'display:flex;justify-content:center;margin:2px 0 8px'; document.body.appendChild(row); }
  var btn = document.createElement('button');
  btn.id = 'setOpen'; btn.type = 'button'; btn.textContent = '⚙ 설정';
  row.appendChild(btn);
  btn.addEventListener('click', open);

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
      '<button type="button" class="close" id="setClose">닫기</button></div>';
    back.innerHTML = h;
    document.body.appendChild(back);
    document.getElementById('setClose').addEventListener('click', close);
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
