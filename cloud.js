/* 월 근무 앱 - 서버 저장/불러오기 (이름+PIN). Supabase RPC만 사용.
   앱 데이터(localStorage)를 통째로 서버에 저장/복원한다. 충돌은 version 비교로 막는다. */
(function () {
  var API = 'https://iqzswnpfxdjsnxlvisxf.supabase.co/rest/v1/rpc/';
  var KEY = 'sb_publishable_xL6Ih_CqeQ0PzfTJvJxMew_BtSMd68T';   // 공개 키(앱에 들어가도 되는 값)
  var SK = 'cloud-v1';
  var DATA_KEYS = { inputs: 'plan-inputs-v4', limit: 'plan-limit-v1', calc: 'calc-state-v1' };
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
  function writeSt() { try { localStorage.setItem(SK, JSON.stringify(st)); } catch (e) {} }
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
    Object.keys(DATA_KEYS).forEach(function (k) {
      try { if (o && o[k] != null) localStorage.setItem(DATA_KEYS[k], o[k]); else localStorage.removeItem(DATA_KEYS[k]); } catch (e) {}
    });
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
    '#cloudBox .msg.ok{color:#2e7d32}';
  document.head.appendChild(css);

  var row = document.createElement('div');
  row.id = 'cloudRow';
  row.innerHTML = '<button id="cloudOpen" type="button"></button>';
  var foot = document.querySelector('.foot');
  if (foot && foot.parentNode) foot.parentNode.insertBefore(row, foot.nextSibling); else document.body.appendChild(row);
  function label() { document.getElementById('cloudOpen').textContent = st.name ? '☁ ' + st.name + ' · 저장/불러오기' : '☁ 서버 저장/불러오기'; }
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
        '<div class="row"><button id="cPin" type="button">PIN 바꾸기</button><button id="cOut" type="button">로그아웃</button></div>' +
        '<div class="row"><button id="cClose" type="button">닫기</button></div>' +
        '<p>저장은 이 폰 데이터를 서버로 올려요. 불러오기는 서버 데이터로 이 폰을 바꿔요. 서버에 더 새 데이터가 있으면 저장이 막혀요.</p>' + note;
      bind('cSave', function () { doSave(false); });
      bind('cLoad', doLoad);
      bind('cPin', changePin);
      bind('cOut', function () { if (confirm('로그아웃할까요? 이 폰의 근무 데이터는 그대로 남아요.')) { st = {}; writeSt(); label(); show('로그아웃했어요.'); } });
    }
    bind('cClose', close);
  }
  function bind(id, fn) { var e = document.getElementById(id); if (e) e.addEventListener('click', fn); }
  function busy(on) { var b = document.querySelectorAll('#cloudBox button'); for (var i = 0; i < b.length; i++) b[i].disabled = on; }
  function now() { var d = new Date(); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

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
        st = { name: name, pin: pin, base: 0 };   // 처음엔 0: 서버에 데이터가 있으면 첫 저장 때 충돌 안내가 뜸
        writeSt(); label();
        show(isReg ? '가입했어요! 이제 저장할 수 있어요.' : (l.version > 0 ? '로그인했어요. 서버에 저장된 데이터가 있어요(버전 ' + l.version + '). 불러오거나 덮어쓸 수 있어요.' : '로그인했어요.'));
      });
    });
  }

  function doSave(force) {
    busy(true);
    rpc('app_save', { p_name: st.name, p_pin: st.pin, p_data: collect(), p_base: st.base || 0, p_force: !!force }).then(function (r) {
      if (r.ok) { st.base = r.version; st.at = now(); writeSt(); show('서버에 저장했어요. (버전 ' + r.version + ')'); return; }
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
      apply(r.data); st.base = r.version; st.at = now(); writeSt();
      location.reload();
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
