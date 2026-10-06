/* Exemplos clássicos */
// ----------------- CARREGADOR DE EXEMPLOS CLÁSSICOS -----------------
const examples = {
    ends1: {
        alphabet: ['0', '1'],
        states: [
            { id: 'q0', x: 130, y: 150 },
            { id: 'q1', x: 340, y: 150 }
        ],
        initialState: 'q0',
        accepting: ['q1'],
        transitions: {
            'q0': { '0': 'q0', '1': 'q1' },
            'q1': { '0': 'q0', '1': 'q1' }
        }
    },
    even0: {
        alphabet: ['0', '1'],
        states: [
            { id: 'qPar', x: 130, y: 150 },
            { id: 'qImp', x: 340, y: 150 }
        ],
        initialState: 'qPar',
        accepting: ['qPar'],
        transitions: {
            'qPar': { '0': 'qImp', '1': 'qPar' },
            'qImp': { '0': 'qPar', '1': 'qImp' }
        }
    },
    start1: {
        alphabet: ['0', '1'],
        states: [
            { id: 'q0', x: 100, y: 150 },
            { id: 'qAcc', x: 260, y: 70 },
            { id: 'qErr', x: 260, y: 230 }
        ],
        initialState: 'q0',
        accepting: ['qAcc'],
        transitions: {
            'q0': { '0': 'qErr', '1': 'qAcc' },
            'qAcc': { '0': 'qAcc', '1': 'qAcc' },
            'qErr': { '0': 'qErr', '1': 'qErr' }
        }
    }
};

function loadExample(key) {
    saveHistory();
    stopSimulation();
    const ex = examples[key];
    if (!ex) return;

    alphabet = [...ex.alphabet];
    document.getElementById('alphabet-input').value = alphabet.join(', ');

    states = JSON.parse(JSON.stringify(ex.states));
    initialStateId = ex.initialState;
    acceptingStateIds = [...ex.accepting];
    transitions = JSON.parse(JSON.stringify(ex.transitions));

    // Centraliza o grafo dinamicamente conforme o tamanho do canvas do usuário
    centerGraphCoordinates();

    buildStateTable();
    redrawGraph();
    saveToLocalStorage();
}

function centerGraphCoordinates() {
    if (states.length === 0) return;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    states.forEach(s => {
        if (s.x < minX) minX = s.x;
        if (s.x > maxX) maxX = s.x;
        if (s.y < minY) minY = s.y;
        if (s.y > maxY) maxY = s.y;
    });
    const graphW = maxX - minX;
    const graphH = maxY - minY;
    const graphCX = minX + graphW / 2;
    const graphCY = minY + graphH / 2;

    // Usa as dimensões de layout reais do canvas (que são idênticas às do container)
    const w = canvas.clientWidth > 100 ? canvas.clientWidth : 500;
    const h = canvas.clientHeight > 100 ? canvas.clientHeight : 300;
    const canvasCX = w / 2;
    const canvasCY = h / 2;

    let dx = canvasCX - graphCX;
    let dy = canvasCY - graphCY;

    // Fatores de margem de segurança contra corte nas bordas
    const padX = 35;
    const padYTop = 55;
    const padYBottom = 35;

    // Limita o deslocamento de forma que os nós não saiam completamente das margens se couberem.
    // Se o grafo inteiro for maior que a tela (menos as margens), centraliza simetricamente.
    if (graphW <= w - 2 * padX) {
        const minDx = padX - minX;
        const maxDx = w - padX - maxX;
        dx = Math.max(minDx, Math.min(maxDx, dx));
    }
    if (graphH <= h - padYTop - padYBottom) {
        const minDy = padYTop - minY;
        const maxDy = h - padYBottom - maxY;
        dy = Math.max(minDy, Math.min(maxDy, dy));
    }

    // Aplica a translação de forma rígida a todos os nós (sem clamping individual nos nós)
    states.forEach(s => {
        s.x += dx;
        s.y += dy;
    });
}

function manualCenterGraph() {
    if (states.length === 0) return;
    saveHistory();
    hasUserDragged = false; // Permite que o sistema volte a ajudar no auto-alinhamento dinâmico
    centerGraphCoordinates();
    redrawGraph();
    saveToLocalStorage();
}

// Funções auxiliares para layout/organização
function getNodesToLayout() {
    if (selectedStateIds.length > 0) {
        return states.filter(s => selectedStateIds.includes(s.id));
    }
    return states;
}

function alignHorizontal() {
    const targets = getNodesToLayout();
    if (targets.length <= 1) return;
    saveHistory();
    const avgY = targets.reduce((sum, s) => sum + s.y, 0) / targets.length;
    targets.forEach(s => { s.y = avgY; });
    hasUserDragged = true;
    redrawGraph();
    saveToLocalStorage();
}

function alignVertical() {
    const targets = getNodesToLayout();
    if (targets.length <= 1) return;
    saveHistory();
    const avgX = targets.reduce((sum, s) => sum + s.x, 0) / targets.length;
    targets.forEach(s => { s.x = avgX; });
    hasUserDragged = true;
    redrawGraph();
    saveToLocalStorage();
}

// Distribuir horizontalmente mantendo o menor X e maior X originais
function distributeHorizontal() {
    const targets = getNodesToLayout();
    if (targets.length <= 2) return;
    saveHistory();
    targets.sort((a, b) => a.x - b.x);
    const minX = targets[0].x;
    const maxX = targets[targets.length - 1].x;
    const step = (maxX - minX) / (targets.length - 1);
    targets.forEach((s, idx) => {
        s.x = minX + idx * step;
    });
    hasUserDragged = true;
    redrawGraph();
    saveToLocalStorage();
}

// Distribuir verticalmente mantendo o menor Y e maior Y originais
function distributeVertical() {
    const targets = getNodesToLayout();
    if (targets.length <= 2) return;
    saveHistory();
    targets.sort((a, b) => a.y - b.y);
    const minY = targets[0].y;
    const maxY = targets[targets.length - 1].y;
    const step = (maxY - minY) / (targets.length - 1);
    targets.forEach((s, idx) => {
        s.y = minY + idx * step;
    });
    hasUserDragged = true;
    redrawGraph();
    saveToLocalStorage();
}

function layoutGrid() {
    const targets = getNodesToLayout();
    if (targets.length === 0) return;
    saveHistory();

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    targets.forEach(s => {
        if (s.x < minX) minX = s.x;
        if (s.x > maxX) maxX = s.x;
        if (s.y < minY) minY = s.y;
        if (s.y > maxY) maxY = s.y;
    });
    const cx = minX === Infinity ? canvas.clientWidth / 2 : (minX + maxX) / 2;
    const cy = minY === Infinity ? canvas.clientHeight / 2 : (minY + maxY) / 2;

    const cols = Math.ceil(Math.sqrt(targets.length));
    const rows = Math.ceil(targets.length / cols);
    const spacingX = 140;
    const spacingY = 120;

    targets.sort((a, b) => {
        if (Math.abs(a.y - b.y) < 30) return a.x - b.x;
        return a.y - b.y;
    });

    const startX = cx - ((cols - 1) * spacingX) / 2;
    const startY = cy - ((rows - 1) * spacingY) / 2;

    targets.forEach((s, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        s.x = startX + c * spacingX;
        s.y = startY + r * spacingY;
    });

    hasUserDragged = true;
    redrawGraph();
    saveToLocalStorage();
}
