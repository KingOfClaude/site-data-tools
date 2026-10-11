const $ = s => document.querySelector(s);
let tab, url, host;

const say = (t, bad) => { $('#msg').textContent = t; $('#msg').className = bad ? 'bad' : ''; };
const save = (name, text, type) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name.replace(/[^\w.-]+/g, '_'); a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
const run = (func, allFrames = false) =>
  chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames }, func }).then(r => r.map(x => x.result).filter(Boolean));

// These run inside the page
const readLS = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; };
const readHidden = () => [...document.querySelectorAll('input[type="hidden" i]')].map(i => [i.name || i.id || '(unnamed)', i.value]);
const clearLS = () => { const n = localStorage.length; localStorage.clear(); return n; };

const cookies = () => chrome.cookies.getAll({ url });
const getLS = async () => (await run(readLS))[0] || {};
const getHidden = async () => (await run(readHidden, true)).flat();

const guard = fn => async () => { try { await fn(); } catch (e) { say(e.message || String(e), true); } };

// Wipe buttons need a second click within 3 seconds
function arm(btn, fn) {
  let t;
  btn.onclick = guard(async () => {
    if (btn.dataset.armed) { clearTimeout(t); delete btn.dataset.armed; btn.textContent = btn.dataset.label; return fn(); }
    btn.dataset.armed = 1; btn.textContent = 'Click again to confirm';
    t = setTimeout(() => { delete btn.dataset.armed; btn.textContent = btn.dataset.label; }, 3000);
  });
}
function label(id, text) { const b = $('#' + id); b.dataset.label = text; if (!b.dataset.armed) b.textContent = text; }

async function refresh() {
  const [c, l, h] = await Promise.all([cookies().catch(() => []), getLS().catch(() => ({})), getHidden().catch(() => [])]);
  const nl = Object.keys(l).length;
  label('lsx', `Export localStorage (${nl}) → JSON`);
  label('ckx', `Export cookies (${c.length}) → JSON`);
  label('hid', `Extract hidden inputs (${h.length}) → TXT`);
  label('ckw', `Wipe cookies (${c.length})`);
  label('lsw', `Wipe localStorage (${nl})`);
}

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!/^https?:/.test(tab?.url || '')) {
    say('Open a regular http(s) page first.', true);
    document.querySelectorAll('button').forEach(b => { b.disabled = true; b.textContent = b.id; });
    return;
  }
  url = tab.url; host = new URL(url).hostname; $('#site').textContent = host;
  $('#vo').checked = localStorage.getItem('valuesOnly') === '1';
  $('#vo').onchange = e => localStorage.setItem('valuesOnly', e.target.checked ? '1' : '0');

  $('#lsx').onclick = guard(async () => {
    const d = await getLS(), n = Object.keys(d).length;
    if (!n) return say('No localStorage on this page.');
    save(`${host}-localstorage.json`, JSON.stringify(d, null, 2), 'application/json'); say(`Exported ${n} localStorage items.`);
  });
  $('#ckx').onclick = guard(async () => {
    const c = await cookies();
    if (!c.length) return say('No cookies for this site.');
    save(`${host}-cookies.json`, JSON.stringify(c, null, 2), 'application/json'); say(`Exported ${c.length} cookies.`);
  });
  $('#hid').onclick = guard(async () => {
    const h = await getHidden();
    if (!h.length) return say('No hidden inputs on this page.');
    const text = h.map(([k, v]) => $('#vo').checked ? v : `${k}=${v}`).join('\n');
    save(`${host}-hidden-inputs.txt`, text, 'text/plain'); say(`Extracted ${h.length} hidden inputs.`);
  });
  arm($('#ckw'), async () => {
    const c = await cookies();
    await Promise.all(c.map(k => chrome.cookies.remove({
      url: (k.secure ? 'https://' : 'http://') + k.domain.replace(/^\./, '') + k.path, name: k.name, storeId: k.storeId })));
    say(`Wiped ${c.length} cookies.`); refresh();
  });
  arm($('#lsw'), async () => {
    const n = (await run(clearLS))[0] ?? 0; say(`Wiped ${n} localStorage items.`); refresh();
  });
  refresh();
}
init();
