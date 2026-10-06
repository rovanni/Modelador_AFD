const { loadApp, makeRunner } = require('./_harness.js');
const { test, eq, summary } = makeRunner();

const NAMES = ['loadExample', 'runFastSimulation', 'startStepByStep', 'nextStep', 'prevStep', 'firstStep', 'lastStep',
    'stepIndex', 'stepState', 'stepHistory', 'exportToTikZ', 'buildFullTeX', 'saveToLocalStorage', 'loadFromLocalStorage',
    'states', 'transitions', 'alphabet', 'initialStateId', 'acceptingStateIds', 'undo', 'autoLayoutCircle', 'layoutGrid',
    'minimizeAutomaton', 'exportToJSON', 'exportToPNG', 'runBatchSimulation'];
const { app, documentStub, storage, fire } = loadApp(NAMES, {});
const el = (id) => documentStub.getElementById(id);
fire('load');

function verdict(word) {
    el('simulation-input').value = word;
    el('simulation-feedback').innerHTML = '';
    app.runFastSimulation();
    const h = el('simulation-feedback').innerHTML;
    if (h.includes('ACEITA!')) return true;
    if (h.includes('REJEITADA!')) return false;
    throw new Error('sem veredito: ' + h.slice(0, 60));
}

const ex = {
    ends1: { acc: ['1', '01', '111', '0101'], rej: ['', '0', '10', '110'] },
    even0: { acc: ['', '1', '00', '0101', '1001', '100', '010'], rej: ['0', '000', '10', '0111'] },
    start1: { acc: ['1', '10', '111', '1000'], rej: ['', '0', '01', '001'] }
};
for (const [key, c] of Object.entries(ex)) {
    app.loadExample(key);
    for (const w of c.acc) test(`${key}: aceita "${w}"`, () => eq(verdict(w), true));
    for (const w of c.rej) test(`${key}: rejeita "${w}"`, () => eq(verdict(w), false));
}

app.loadExample('ends1');
test('passo a passo: ir ao fim mostra o veredito', () => {
    el('simulation-input').value = '1101';
    app.startStepByStep();
    app.lastStep();
    return el('simulation-feedback').innerHTML.includes('ACEITA');
});
test('passo a passo: ir ao início volta ao primeiro estado', () => {
    el('simulation-input').value = '1101';
    app.startStepByStep();
    app.nextStep(); app.nextStep();
    app.firstStep();
    return app.stepIndex === 0 && app.stepState === app.initialStateId && app.stepHistory.length === 1;
});
test('passo a passo: voltar 1 passo', () => {
    el('simulation-input').value = '10';
    app.startStepByStep();
    app.nextStep();
    const idx = app.stepIndex;
    app.prevStep();
    return idx === 1 && app.stepIndex === 0;
});

test('minimização reduz estados equivalentes (4 -> 2)', () => {
    app.loadExample('ends1');
    app.states = ['q0', 'q1', 'q2', 'q3'].map((id, i) => ({ id, x: 100 + i * 120, y: 200 }));
    app.alphabet = ['0', '1'];
    app.transitions = { q0: { 0: 'q2', 1: 'q1' }, q2: { 0: 'q0', 1: 'q3' }, q1: { 0: 'q2', 1: 'q3' }, q3: { 0: 'q0', 1: 'q1' } };
    app.initialStateId = 'q0';
    app.acceptingStateIds = ['q1', 'q3'];
    app.minimizeAutomaton();
    return app.states.length === 2;
});

test('salvar e restaurar o trabalho', () => {
    app.loadExample('even0');
    app.saveToLocalStorage();
    const n = app.states.length;
    app.loadExample('start1');
    storage.store.modelador_afd_state = JSON.stringify({ alphabet: ['0', '1'], states: [{ id: 'qa', x: 10, y: 10 }, { id: 'qb', x: 50, y: 50 }], initialStateId: 'qa', acceptingStateIds: ['qb'], transitions: { qa: { 0: 'qa', 1: 'qb' }, qb: { 0: 'qa', 1: 'qb' } } });
    return app.loadFromLocalStorage() === true && app.states.length === 2 && app.states[0].id === 'qa' && n > 0;
});

app.loadExample('even0');
app.exportToTikZ();
const tex = el('latex-code-textarea').value;
console.log('--- amostra TikZ:', JSON.stringify(tex.slice(0, 700)));
test('TikZ: sem cor inválida (slate-800)', () => !tex.includes('slate-'));
test('TikZ: nomes de estado em modo matemático', () => tex.includes('$\\mathit{qPar}$') && !/[(]q[A-Za-z]+[)] at .*[{]\$q[A-Za-z]+\$[}]/.test(tex));
test('TikZ: laços usam loop above', () => tex.includes('loop above'));
test('documento .tex completo (standalone)', () => { const t = app.buildFullTeX(tex); return t.includes('\\documentclass') && t.includes('\\begin{tikzpicture}') && t.includes('\\end{document}'); });
test('PNG claro: exporta sem erro', () => { app.exportToPNG('light'); return true; });

summary();
