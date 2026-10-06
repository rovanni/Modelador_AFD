/* Tema, barra de ferramentas, estado global do AFD e persistência (localStorage/JSON) */
document.getElementById('year-display').textContent = new Date().getFullYear();

// ----------------- CONTROLE DE TEMAS (CLARO E ESCURO) -----------------
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const hasDarkClass = document.documentElement.classList.contains('dark');
    
    if (savedTheme === 'light' || (!savedTheme && !hasDarkClass)) {
        setLightTheme();
    } else {
        setDarkTheme();
    }
}

function setLightTheme() {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    document.getElementById('theme-sun').classList.add('hidden');
    document.getElementById('theme-moon').classList.remove('hidden');
    redrawGraph();
}

function setDarkTheme() {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    document.getElementById('theme-moon').classList.add('hidden');
    document.getElementById('theme-sun').classList.remove('hidden');
    redrawGraph();
}

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        setLightTheme();
    } else {
        setDarkTheme();
    }
}

function isDarkTheme() {
    return document.documentElement.classList.contains('dark');
}

// ----------------- CONTROLE DO MODO DA BARRA DE FERRAMENTAS -----------------
function initToolbarSize() {
    const isCompact = localStorage.getItem('modelador_afd_compact_toolbar') === 'true';
    const toolbar = document.getElementById('graph-toolbar-controls');
    const toggleBtn = document.getElementById('btn-toggle-toolbar-size');
    const toggleText = document.getElementById('compact-toggle-text');
    
    if (isCompact && toolbar && toggleBtn && toggleText) {
        toolbar.classList.add('toolbar-compact');
        toggleBtn.classList.add('bg-cyan-500/10', 'border-cyan-500/30', 'text-cyan-600', 'dark:text-cyan-400');
        toggleText.textContent = "Modo Normal";
    }
}

function toggleToolbarSize() {
    const toolbar = document.getElementById('graph-toolbar-controls');
    const toggleBtn = document.getElementById('btn-toggle-toolbar-size');
    const toggleText = document.getElementById('compact-toggle-text');
    if (!toolbar) return;
    
    const isCompact = toolbar.classList.toggle('toolbar-compact');
    localStorage.setItem('modelador_afd_compact_toolbar', isCompact ? 'true' : 'false');
    
    if (toggleBtn && toggleText) {
        if (isCompact) {
            toggleBtn.classList.add('bg-cyan-500/10', 'border-cyan-500/30', 'text-cyan-600', 'dark:text-cyan-400');
            toggleText.textContent = "Modo Normal";
        } else {
            toggleBtn.classList.remove('bg-cyan-500/10', 'border-cyan-500/30', 'text-cyan-600', 'dark:text-cyan-400');
            toggleText.textContent = "Modo Compacto";
        }
    }
}

// ----------------- ESTADO GLOBAL DO AUTÔMATO -----------------
let alphabet = ['0', '1'];
let states = []; 
let initialStateId = "";
let acceptingStateIds = [];
let transitions = {}; // { 'stateId': { 'symbol': 'destId' } }
let selectedStateIds = [];
let dragStartPos = null;
let initialSelectedPositions = [];

// Histórico Desfazer/Refazer (Undo/Redo)
let historyStack = [];
let redoStack = [];

function saveHistory() {
    const currentSnapshot = JSON.stringify({
        alphabet: [...alphabet],
        states: JSON.parse(JSON.stringify(states)),
        initialStateId,
        acceptingStateIds: [...acceptingStateIds],
        transitions: JSON.parse(JSON.stringify(transitions)),
        hasManualLayout: hasUserDragged,
        selectedStateIds: [...selectedStateIds]
    });
    // Não adicionar snapshot redundante se for idêntico ao topo da pilha
    if (historyStack.length > 0 && historyStack[historyStack.length - 1] === currentSnapshot) {
        return;
    }
    historyStack.push(currentSnapshot);
    if (historyStack.length > 50) {
        historyStack.shift();
    }
    redoStack = [];
    updateUndoRedoButtons();
}

function restoreFromSnapshot(snapshotStr) {
    const snap = JSON.parse(snapshotStr);
    alphabet = snap.alphabet;
    states = snap.states;
    initialStateId = snap.initialStateId;
    acceptingStateIds = snap.acceptingStateIds;
    transitions = snap.transitions;
    hasUserDragged = snap.hasManualLayout || false;
    selectedStateIds = snap.selectedStateIds || [];

    document.getElementById('alphabet-input').value = alphabet.join(', ');
    buildStateTable();
    redrawGraph();
    saveToLocalStorage();
}

function undo() {
    if (historyStack.length === 0) return;
    const currentSnapshot = JSON.stringify({
        alphabet: [...alphabet],
        states: JSON.parse(JSON.stringify(states)),
        initialStateId,
        acceptingStateIds: [...acceptingStateIds],
        transitions: JSON.parse(JSON.stringify(transitions))
    });
    redoStack.push(currentSnapshot);
    const prev = historyStack.pop();
    restoreFromSnapshot(prev);
    updateUndoRedoButtons();
}

function redo() {
    if (redoStack.length === 0) return;
    const currentSnapshot = JSON.stringify({
        alphabet: [...alphabet],
        states: JSON.parse(JSON.stringify(states)),
        initialStateId,
        acceptingStateIds: [...acceptingStateIds],
        transitions: JSON.parse(JSON.stringify(transitions))
    });
    historyStack.push(currentSnapshot);
    const next = redoStack.pop();
    restoreFromSnapshot(next);
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.disabled = (historyStack.length === 0);
    if (btnRedo) btnRedo.disabled = (redoStack.length === 0);
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    if (e.key === 'Escape') {
        selectedStateIds = [];
        redrawGraph();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === 'z' || e.key === 'Z') {
            e.preventDefault();
            undo();
        } else if (e.key === 'y' || e.key === 'Y') {
            e.preventDefault();
            redo();
        }
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        redo();
    }
});

// Variáveis de Rendering e Interação
const canvas = document.getElementById('automaton-canvas');
const ctx = canvas.getContext('2d');
let selectedNode = null;
let isDragging = false;
let mousePos = { x: 0, y: 0 };
const nodeRadius = 26;
function getNodeFontSize(c, text, baseSize = 14, maxRadius = 26) {
    let fontSize = baseSize;
    c.font = `bold ${fontSize}px 'Fira Code', monospace`;
    const maxAllowedWidth = maxRadius * 2 - 10;
    while (fontSize > 6 && c.measureText(text).width > maxAllowedWidth) {
        fontSize -= 0.5;
        c.font = `bold ${fontSize}px 'Fira Code', monospace`;
    }
    return fontSize;
}

// Variáveis de Transição Visual (Shift + Arrastar ou Modo Desenho)
let canvasMode = 'drag'; // 'drag' ou 'transition'
let isDrawingTransition = false;
let transitionSourceNode = null;
let transitionTempTargetPos = { x: 0, y: 0 };
let lastTouchPos = { x: 0, y: 0 };

// Variáveis do Menu de Contexto Canvas
let contextNode = null;

// Variáveis do Modal de Transição
let modalFromState = "";
let modalToState = "";
let modalSelectedSymbols = [];

// Variáveis do Modal de Prompt Customizado
let promptAction = null; // 'rename' ou 'add'
let promptTargetId = null; // para identificar o estado que está sendo renomeado

// Variáveis do Simulador Passo a Passo
let stepInterval = null;
let stepState = null;
let stepIndex = 0;
let stepString = "";
let stepHistory = [];
let isPlaying = false;
let playIntervalTimer = null;

let hasUserDragged = false;

// ----------------- PERSISTÊNCIA (LOCAL STORAGE / JSON) -----------------
function saveToLocalStorage() {
    const data = {
        alphabet,
        states,
        initialStateId,
        acceptingStateIds,
        transitions,
        hasManualLayout: hasUserDragged
    };
    localStorage.setItem('modelador_afd_state', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('modelador_afd_state');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            alphabet = data.alphabet || ['0', '1'];
            document.getElementById('alphabet-input').value = alphabet.join(', ');
            states = data.states || [];
            initialStateId = data.initialStateId || "";
            acceptingStateIds = data.acceptingStateIds || [];
            transitions = data.transitions || {};
            hasUserDragged = data.hasManualLayout || false;
            
            if (states.length > 0) {
                buildStateTable();
                redrawGraph();
                return true;
            }
        } catch (e) {
            console.error("Erro ao carregar do localStorage", e);
        }
    }
    return false;
}

function exportToJSON() {
    const data = {
        alphabet,
        states,
        initialStateId,
        acceptingStateIds,
        transitions,
        hasManualLayout: hasUserDragged
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `automato-afd.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.alphabet || !data.states || !data.transitions) {
                throw new Error("Formato inválido de arquivo JSON.");
            }

            stopSimulation();
            alphabet = data.alphabet;
            document.getElementById('alphabet-input').value = alphabet.join(', ');
            states = data.states;
            initialStateId = data.initialStateId || "";
            acceptingStateIds = data.acceptingStateIds || [];
            transitions = data.transitions;
            hasUserDragged = data.hasManualLayout || false;

            buildStateTable();
            redrawGraph();
            saveToLocalStorage();
            showAlert("Projeto Carregado", "O autômato foi importado com sucesso!");
        } catch (err) {
            showAlert("Erro de Importação", "Arquivo JSON inválido: " + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Limpar input
}

function closeAlert() {
    document.getElementById('custom-alert').classList.add('hidden');
}
