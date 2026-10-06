/*
  Ambiente de teste (sem navegador): carrega os scripts listados em index.html (na mesma ordem) dentro de um
  "document" simulado e devolve as funções/variáveis pedidas. Não testa o visual: para isso use tests/ui_checks.js.
*/
const fs = require('fs');
const path = require('path');

function loadApp(names, presets) {
    const root = path.join(__dirname, '..');
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const srcs = [...html.matchAll(/<script\s+src="([^"]+\.js)"/g)].map((m) => m[1]);
    const code = srcs.map((s) => fs.readFileSync(path.join(root, s), 'utf8')).join(String.fromCharCode(10));

    const ctxStub = new Proxy({}, {
        get: (t, k) => (k === 'measureText' ? () => ({ width: 20 }) : () => {}),
        set: () => true
    });
    const els = {};
    function makeEl(id) {
        const classes = new Set();
        const classList = {
                add: (...c) => c.forEach((x) => classes.add(x)),
                remove: (...c) => c.forEach((x) => classes.delete(x)),
                toggle: (c, f) => { const on = f === undefined ? !classes.has(c) : f; on ? classes.add(c) : classes.delete(c); return on; },
                contains: (c) => classes.has(c),
                replace: (a, b) => { classes.delete(a); classes.add(b); }
            };
        return {
            id, value: '', textContent: '', innerText: '', innerHTML: '', className: '', checked: false, disabled: false,
            style: {}, width: 800, height: 440, clientWidth: 800, clientHeight: 440, scrollTop: 0, scrollLeft: 0, offsetTop: 0,
            classList,
            appendChild() {}, removeChild() {}, insertBefore() {}, prepend() {},
            querySelectorAll() { return []; }, querySelector() { return null; },
            addEventListener() {}, removeEventListener() {},
            getContext() { return ctxStub; },
            toDataURL() { return 'data:image/png;base64,STUB'; },
            getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 440 }; },
            click() {}, select() {}, remove() {}, focus() {}, blur() {}, scrollIntoView() {},
            setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
            dataset: {}, children: [], options: [], parentNode: null, files: [],
            parentElement: { getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 440 }; }, clientWidth: 800, clientHeight: 440, style: {}, classList },
            closest() { return null; }, contains() { return false; }
        };
    }
    const listeners = { document: {}, window: {} };
    const documentStub = {
        getElementById(id) { if (!els[id]) { els[id] = makeEl(id); if (presets && presets[id] !== undefined) els[id].value = presets[id]; } return els[id]; },
        getElementsByName() { return []; },
        createElement(tag) { return makeEl('dyn-' + tag); },
        createTextNode() { return {}; },
        addEventListener(type, fn) { (listeners.document[type] = listeners.document[type] || []).push(fn); },
        removeEventListener() {},
        querySelector() { return null; }, querySelectorAll() { return []; },
        documentElement: makeEl('html'),
        body: { appendChild() {}, removeChild() {}, classList: makeEl('body').classList }
    };
    documentStub.documentElement.classList.add('dark');
    const windowStub = {
        addEventListener(type, fn) { (listeners.window[type] = listeners.window[type] || []).push(fn); },
        removeEventListener() {}, devicePixelRatio: 1, innerWidth: 1200, innerHeight: 900,
        matchMedia() { return { matches: false, addEventListener() {} }; }
    };
    const storage = {
        store: {},
        getItem(k) { return this.store[k] === undefined ? null : this.store[k]; },
        setItem(k, v) { this.store[k] = String(v); },
        removeItem(k) { delete this.store[k]; }
    };
    const hook = '\n;globalThis.__app = {' + names.map((n) =>
        `get ${n}(){return ${n}}, set ${n}(v){${n}=v}`).join(',') + ', LISTENERS};';
    const fn = new Function('document', 'window', 'navigator', 'URL', 'Blob', 'localStorage', 'requestAnimationFrame',
        'alert', 'LISTENERS', 'ResizeObserver', 'prompt', 'confirm', code + hook);
    class RO { observe() {} disconnect() {} }
    fn(documentStub, windowStub, {}, { createObjectURL() { return 'blob:x'; }, revokeObjectURL() {} }, class { constructor() {} },
        storage, (f) => { f(() => {}); }, () => {}, listeners, RO, () => '', () => true);
    return { app: globalThis.__app, els, listeners, storage, documentStub, fire: (type) => (listeners.window[type] || []).forEach((h) => h({})) };
}

/* Mini executor de testes: test(nome, funcao) / summary() */
function makeRunner() {
    let pass = 0, fail = 0;
    return {
        test(name, fn) {
            try {
                const r = fn();
                if (r === false) throw new Error('retornou false');
                pass++; console.log('PASS  ' + name);
            } catch (e) { fail++; console.log('FAIL  ' + name + '  -> ' + e.message); }
        },
        eq(a, b, msg) { if (a !== b) throw new Error((msg || 'esperado') + ': ' + JSON.stringify(b) + ' obtido: ' + JSON.stringify(a)); },
        summary() { console.log('\nRESUMO: PASS=' + pass + ' FAIL=' + fail); process.exitCode = fail ? 1 : 0; setTimeout(() => process.exit(), 50); }
    };
}

module.exports = { loadApp, makeRunner };
