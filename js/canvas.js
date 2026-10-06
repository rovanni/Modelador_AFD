/* Desenho do grafo, arrastar/soltar, menu de contexto e modal de transição */
// ----------------- MOTOR DE DRAWING (CANVAS) -----------------
function redrawGraph(simActiveState = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
    drawTransitions(ctx, simActiveState);
    drawStates(ctx, simActiveState);
}

function drawGrid(c) {
    const dark = isDarkTheme();
    c.strokeStyle = dark ? '#0f172a' : '#f1f5f9';
    c.lineWidth = 1;
    const gridSpacing = 40;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    for (let x = 0; x < w; x += gridSpacing) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, h);
        c.stroke();
    }
    for (let y = 0; y < h; y += gridSpacing) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
    }
}

function drawTransitions(c, simActiveState) {
    const dark = isDarkTheme();
    states.forEach(fromNode => {
        // Junta transições que têm o mesmo destino para colocar no mesmo rótulo
        const destMap = {}; // { 'destId': ['0', '1'] }
        
        alphabet.forEach(sym => {
            const toId = transitions[fromNode.id]?.[sym];
            if (toId) {
                if (!destMap[toId]) destMap[toId] = [];
                destMap[toId].push(sym);
            }
        });

        Object.keys(destMap).forEach(toId => {
            const toNode = states.find(s => s.id === toId);
            if (!toNode) return;

            const label = destMap[toId].join(', ');
            const isTransitionActive = (simActiveState && simActiveState.from === fromNode.id && simActiveState.to === toId);

            if (fromNode.id === toId) {
                drawSelfLoop(c, fromNode, label, isTransitionActive);
            } else {
                // Verifica se existe transição bidirecional para arquear a linha
                const reverseExists = transitions[toId] && Object.values(transitions[toId]).includes(fromNode.id);
                drawEdge(c, fromNode, toNode, label, reverseExists, isTransitionActive);
            }
        });
    });
}

function drawSelfLoop(c, node, label, isActive) {
    const dark = isDarkTheme();
    const x = node.x;
    const y = node.y - nodeRadius;

    // Cores do tema adaptativo com alto contraste (WCAG AA/AAA)
    const lineStroke = isActive ? (dark ? '#22d3ee' : '#0891b2') : '#64748b';
    const textFill = isActive ? (dark ? '#22d3ee' : '#0e7490') : (dark ? '#f8fafc' : '#334155');

    c.strokeStyle = lineStroke;
    c.lineWidth = isActive ? 3 : 1.5;
    c.fillStyle = textFill;

    c.beginPath();
    // Loop em formato de bolha de ar na parte superior do nó
    c.arc(x, y - 12, 17, Math.PI * 0.1, Math.PI * 0.9, true);
    c.stroke();

    // Desenhar ponta da seta (com R=15 para centralizar perfeitamente no traço curvo)
    const arrowAngle = Math.PI * 0.1;
    const arrowX = x + 15 * Math.cos(arrowAngle);
    const arrowY = y - 9 + 15 * Math.sin(arrowAngle);
    drawArrowHead(c, arrowX, arrowY, Math.PI * 0.62);

    // Escrever o texto do símbolo
    c.font = "bold 13px 'Fira Code', monospace";
    c.textAlign = 'center';
    c.fillText(label, x, y - 32);
}

function drawEdge(c, from, to, label, curved, isActive) {
    const dark = isDarkTheme();
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / dist;
    const uy = dy / dist;

    // Vetor perpendicular
    const px = -uy;
    const py = ux;

    // Cores com alto contraste (WCAG AA/AAA)
    const lineStroke = isActive ? (dark ? '#22d3ee' : '#0891b2') : '#64748b';
    const textFill = isActive ? (dark ? '#22d3ee' : '#0e7490') : (dark ? '#f8fafc' : '#334155');

    c.strokeStyle = lineStroke;
    c.lineWidth = isActive ? 3 : 1.5;
    c.fillStyle = textFill;

    if (curved) {
        // Desenha curva quadrática para transições bidirecionais
        const bend = 24; 
        const midX = (from.x + to.x) / 2 + px * bend;
        const midY = (from.y + to.y) / 2 + py * bend;

        // Encontra intersecção aproximada na borda do nó de destino
        const targetX = to.x - ux * nodeRadius + px * 6;
        const targetY = to.y - uy * nodeRadius + py * 6;
        const startX = from.x + ux * nodeRadius + px * 6;
        const startY = from.y + uy * nodeRadius + py * 6;

        c.beginPath();
        c.moveTo(startX, startY);
        c.quadraticCurveTo(midX, midY, targetX, targetY);
        c.stroke();

        // Ângulo aproximado de chegada
        const angle = Math.atan2(targetY - midY, targetX - midX);
        drawArrowHead(c, targetX, targetY, angle);

        // Texto do rótulo
        c.font = "bold 13px 'Fira Code', monospace";
        c.textAlign = 'center';
        c.fillText(label, midX + px * 4, midY + py * 4 + 4);
    } else {
        // Desenha linha reta comum
        const startX = from.x + ux * nodeRadius;
        const startY = from.y + uy * nodeRadius;
        const endX = to.x - ux * nodeRadius;
        const endY = to.y - uy * nodeRadius;

        c.beginPath();
        c.moveTo(startX, startY);
        c.lineTo(endX, endY);
        c.stroke();

        const angle = Math.atan2(endY - startY, endX - startX);
        drawArrowHead(c, endX, endY, angle);

        // Texto do rótulo ligeiramente deslocado
        const textX = (startX + endX) / 2 - px * 10;
        const textY = (startY + endY) / 2 - py * 10 + 4;
        c.font = "bold 13px 'Fira Code', monospace";
        c.textAlign = 'center';
        c.fillText(label, textX, textY);
    }
}

function drawArrowHead(c, x, y, angle) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - 10 * Math.cos(angle - 0.35), y - 10 * Math.sin(angle - 0.35));
    c.lineTo(x - 8 * Math.cos(angle), y - 8 * Math.sin(angle));
    c.lineTo(x - 10 * Math.cos(angle + 0.35), y - 10 * Math.sin(angle + 0.35));
    c.closePath();
    c.fill();
}

function drawStates(c, simActiveState) {
    const dark = isDarkTheme();
    states.forEach(node => {
        const isCurrent = (simActiveState && simActiveState.current === node.id);
        const isInitial = (node.id === initialStateId);
        const isFinal = acceptingStateIds.includes(node.id);

        // Definir cor e brilho baseado no estado ativo com conformidade WCAG AA/AAA
        let strokeStyle = dark ? '#64748b' : '#64748b';
        let glowColor = 'transparent';

        if (isCurrent) {
            strokeStyle = dark ? '#22d3ee' : '#0891b2';
            glowColor = dark ? 'rgba(34, 211, 238, 0.25)' : 'rgba(8, 145, 178, 0.15)';
        } else if (isFinal) {
            strokeStyle = dark ? '#34d399' : '#047857';
        }

        // Desenhar anel de brilho
        if (isCurrent) {
            c.beginPath();
            c.arc(node.x, node.y, nodeRadius + 5, 0, Math.PI * 2);
            c.fillStyle = glowColor;
            c.fill();
        }

        // Desenhar anel de seleção se estiver selecionado
        const isSelected = selectedStateIds.includes(node.id);
        if (isSelected) {
            c.save();
            c.beginPath();
            c.arc(node.x, node.y, nodeRadius + 5, 0, Math.PI * 2);
            c.strokeStyle = dark ? '#06b6d4' : '#0891b2';
            c.lineWidth = 2;
            c.setLineDash([4, 3]);
            c.stroke();
            c.restore();
        }

        // Círculo principal - Corrigido passando todos os 5 argumentos obrigatórios para o método 'arc'
        c.beginPath();
        c.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        c.fillStyle = dark ? '#1e293b' : '#ffffff';
        c.fill();
        c.strokeStyle = strokeStyle;
        c.lineWidth = isCurrent ? 3 : (isInitial ? 2.5 : 1.5);
        c.stroke();

        // Desenha círculo duplo se for de aceitação
        if (isFinal) {
            c.beginPath();
            c.arc(node.x, node.y, nodeRadius - 5, 0, Math.PI * 2);
            c.strokeStyle = strokeStyle;
            c.lineWidth = 1;
            c.stroke();
        }

        // Seta de estado inicial
        if (isInitial) {
            c.strokeStyle = dark ? '#64748b' : '#475569';
            c.lineWidth = 2;
            c.fillStyle = dark ? '#64748b' : '#475569';
            
            const startX = node.x - nodeRadius - 30;
            const endX = node.x - nodeRadius;
            c.beginPath();
            c.moveTo(startX, node.y);
            c.lineTo(endX, node.y);
            c.stroke();
            
            // Ponta da seta
            drawArrowHead(c, endX, node.y, 0);
        }

        // Rótulo do estado (com alto contraste WCAG)
        c.fillStyle = isCurrent ? (dark ? '#22d3ee' : '#0e7490') : (dark ? '#ffffff' : '#0f172a');
        const fontSize = getNodeFontSize(c, node.id, 14, nodeRadius);
        c.font = `bold ${fontSize}px 'Fira Code', monospace`;
        c.textAlign = 'center';
        c.fillText(node.id, node.x, node.y + (fontSize / 3));
    });
}

// ----------------- ARRASTAR E SOLTAR E GESTOS NO CANVAS -----------------
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseleave', handleMouseUp);
canvas.addEventListener('dblclick', handleDoubleClick);
canvas.addEventListener('contextmenu', handleContextMenu);

// Suporte a dispositivos móveis
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);

function getCanvasMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function handleMouseDown(evt) {
    const pos = getCanvasMousePos(evt);
    const clickedNode = states.find(s => {
        const dist = Math.sqrt((s.x - pos.x) ** 2 + (s.y - pos.y) ** 2);
        return dist <= nodeRadius + 10;
    });

    if (clickedNode) {
        saveHistory();
        if (evt.shiftKey || canvasMode === 'transition') {
            // Modo criar transição (não altera seleção de mover)
            isDrawingTransition = true;
            transitionSourceNode = clickedNode;
            transitionTempTargetPos = { x: pos.x, y: pos.y };
        } else {
            // Modo mover: gerencia seleção múltipla com Ctrl/Cmd ou clique simples
            const isCtrl = evt.ctrlKey || evt.metaKey;
            if (isCtrl) {
                if (selectedStateIds.includes(clickedNode.id)) {
                    selectedStateIds = selectedStateIds.filter(id => id !== clickedNode.id);
                } else {
                    selectedStateIds.push(clickedNode.id);
                }
            } else {
                if (!selectedStateIds.includes(clickedNode.id)) {
                    selectedStateIds = [clickedNode.id];
                }
            }
            
            selectedNode = clickedNode;
            isDragging = true;
            dragStartPos = { x: pos.x, y: pos.y };
            initialSelectedPositions = states
                .filter(s => selectedStateIds.includes(s.id))
                .map(s => ({ id: s.id, x: s.x, y: s.y }));
        }
        hideContextMenu();
    } else {
        // Clicou no vazio: limpa seleção
        selectedStateIds = [];
        hideContextMenu();
    }
    redrawGraph();
}

function handleMouseMove(evt) {
    const pos = getCanvasMousePos(evt);
    
    if (isDrawingTransition && transitionSourceNode) {
        transitionTempTargetPos = { x: pos.x, y: pos.y };
        redrawGraph();
        return;
    }

    if (!isDragging || !selectedNode) return;
    
    hasUserDragged = true;
    
    const padX = 35;
    const padYTop = 55;
    const padYBottom = 35;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const dx = pos.x - dragStartPos.x;
    const dy = pos.y - dragStartPos.y;

    initialSelectedPositions.forEach(initPos => {
        const s = states.find(node => node.id === initPos.id);
        if (s) {
            s.x = Math.max(padX, Math.min(w - padX, initPos.x + dx));
            s.y = Math.max(padYTop, Math.min(h - padYBottom, initPos.y + dy));
        }
    });

    redrawGraph();
}

function handleMouseUp(evt) {
    if (isDrawingTransition && transitionSourceNode) {
        isDrawingTransition = false;
        const pos = getCanvasMousePos(evt);
        const targetNode = states.find(s => {
            const dist = Math.sqrt((s.x - pos.x) ** 2 + (s.y - pos.y) ** 2);
            return dist <= nodeRadius + 10;
        });
        
        if (targetNode) {
            openTransitionConfigModal(transitionSourceNode.id, targetNode.id);
        }
        
        transitionSourceNode = null;
        redrawGraph();
    }

    if (isDragging) {
        isDragging = false;
        selectedNode = null;
        saveToLocalStorage(); // Salvar posições após arrastar
    }
}

function handleDoubleClick(evt) {
    const pos = getCanvasMousePos(evt);
    const clickedNode = states.find(s => {
        const dist = Math.sqrt((s.x - pos.x) ** 2 + (s.y - pos.y) ** 2);
        return dist <= nodeRadius + 10;
    });

    if (clickedNode) {
        // Clique duplo no estado alterna sua aceitação
        toggleAcceptance(clickedNode.id);
        buildStateTable();
    } else {
        // Clique duplo no vazio cria um estado ali
        addNewState(pos.x, pos.y);
    }
}

// ----------------- MENU DE CONTEXTO DO CANVAS (BOTÃO DIREITO) -----------------
function handleContextMenu(evt) {
    evt.preventDefault();
    const pos = getCanvasMousePos(evt);
    const clickedNode = states.find(s => {
        const dist = Math.sqrt((s.x - pos.x) ** 2 + (s.y - pos.y) ** 2);
        return dist <= nodeRadius + 10;
    });

    const menu = document.getElementById('canvas-context-menu');
    if (clickedNode) {
        contextNode = clickedNode;
        menu.style.left = `${evt.clientX + 5}px`;
        menu.style.top = `${evt.clientY + 5}px`;
        menu.classList.remove('hidden');
    } else {
        hideContextMenu();
    }
}

function hideContextMenu() {
    const menu = document.getElementById('canvas-context-menu');
    menu.classList.add('hidden');
    contextNode = null;
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('canvas-context-menu');
    if (menu && !menu.contains(e.target)) {
        hideContextMenu();
    }
});

function contextSetInitial() {
    if (contextNode) {
        setInitialState(contextNode.id);
        buildStateTable();
    }
    hideContextMenu();
}

function contextToggleAcceptance() {
    if (contextNode) {
        toggleAcceptance(contextNode.id);
        buildStateTable();
    }
    hideContextMenu();
}

function contextDeleteState() {
    if (contextNode) {
        removeState(contextNode.id);
    }
    hideContextMenu();
}

// ----------------- ALTERNADOR DE MODO DO CANVAS (DESENHAR/MOVER) -----------------
function toggleDrawMode() {
    const btn = document.getElementById('btn-draw-mode');
    const indicator = document.getElementById('draw-mode-indicator');
    const icon = document.getElementById('draw-mode-icon');
    const label = btn.querySelector('.btn-text');
    
    if (canvasMode === 'drag') {
        canvasMode = 'transition';
        indicator.className = "w-2 h-2 rounded-full bg-cyan-500 animate-pulse";
        btn.classList.add('border-cyan-500', 'text-cyan-500');
        btn.title = "Criar Transições (ou use Shift+Arrastar)";
        if (label) label.textContent = "Criar Transições";
        if (icon) {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>';
        }
    } else {
        canvasMode = 'drag';
        indicator.className = "w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500";
        btn.classList.remove('border-cyan-500', 'text-cyan-500');
        btn.title = "Mover Nós (ou use Shift+Arrastar)";
        if (label) label.textContent = "Mover Nós";
        if (icon) {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>';
        }
    }
}

// Eventos móveis adaptados
function handleTouchStart(evt) {
    if (evt.touches.length === 0) return;
    const touch = evt.touches[0];
    lastTouchPos = getCanvasMousePos(touch);
    
    // Impede rolagem apenas se estiver sobre um nó
    const clickedNode = states.find(s => {
        const dist = Math.sqrt((s.x - lastTouchPos.x) ** 2 + (s.y - lastTouchPos.y) ** 2);
        return dist <= nodeRadius + 15;
    });
    if (clickedNode) {
        evt.preventDefault();
        handleMouseDown(touch);
    }
}

function handleTouchMove(evt) {
    if (evt.touches.length === 0) return;
    const touch = evt.touches[0];
    lastTouchPos = getCanvasMousePos(touch);
    if (isDragging || isDrawingTransition) {
        evt.preventDefault();
        handleMouseMove(touch);
    }
}

function handleTouchEnd(evt) {
    if (isDrawingTransition && transitionSourceNode) {
        isDrawingTransition = false;
        const targetNode = states.find(s => {
            const dist = Math.sqrt((s.x - lastTouchPos.x) ** 2 + (s.y - lastTouchPos.y) ** 2);
            return dist <= nodeRadius + 15;
        });
        
        if (targetNode) {
            openTransitionConfigModal(transitionSourceNode.id, targetNode.id);
        }
        transitionSourceNode = null;
        redrawGraph();
    }

    if (isDragging) {
        isDragging = false;
        selectedNode = null;
        saveToLocalStorage();
    }
}

// Auto-Organizar nós em círculo geométrico
function autoLayoutCircle() {
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

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const layoutRadius = targets.length <= 1 ? 0 : Math.min(w, h) * 0.28;

    targets.sort((a, b) => a.id.localeCompare(b.id));

    targets.forEach((node, idx) => {
        const theta = (2 * Math.PI * idx) / targets.length - Math.PI / 2;
        node.x = cx + layoutRadius * Math.cos(theta);
        node.y = cy + layoutRadius * Math.sin(theta);
    });

    if (targets.length === states.length) {
        hasUserDragged = false;
    } else {
        hasUserDragged = true;
    }

    redrawGraph();
    saveToLocalStorage();
}

// ----------------- MODAL DE TRANSIÇÃO VISUAL -----------------
function openTransitionConfigModal(fromId, toId) {
    modalFromState = fromId;
    modalToState = toId;
    modalSelectedSymbols = [];

    // Preenche com símbolos que já transicionam de origem para destino
    alphabet.forEach(sym => {
        if (transitions[fromId]?.[sym] === toId) {
            modalSelectedSymbols.push(sym);
        }
    });

    const desc = document.getElementById('transition-modal-desc');
    desc.innerHTML = `Ligar transição de <strong class="text-cyan-600 dark:text-cyan-400 font-mono">${fromId}</strong> para <strong class="text-cyan-600 dark:text-cyan-400 font-mono">${toId}</strong> nos seguintes símbolos:`;

    const container = document.getElementById('transition-symbols-container');
    container.innerHTML = "";

    alphabet.forEach(sym => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = getSymbolBtnClass(sym);
        btn.textContent = sym;
        btn.onclick = () => toggleModalSymbol(sym, btn);
        container.appendChild(btn);
    });

    document.getElementById('transition-modal').classList.remove('hidden');
}

function getSymbolBtnClass(sym) {
    const isActive = modalSelectedSymbols.includes(sym);
    const base = "px-4 py-2.5 rounded-xl font-bold font-mono text-sm transition ";
    if (isActive) {
        return base + "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 border border-transparent";
    } else {
        return base + "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50";
    }
}

function toggleModalSymbol(sym, btn) {
    const index = modalSelectedSymbols.indexOf(sym);
    if (index > -1) {
        modalSelectedSymbols.splice(index, 1);
    } else {
        modalSelectedSymbols.push(sym);
    }
    btn.className = getSymbolBtnClass(sym);
}

function closeTransitionModal() {
    document.getElementById('transition-modal').classList.add('hidden');
}

function confirmTransitionConfig() {
    saveHistory();
    if (!transitions[modalFromState]) {
        transitions[modalFromState] = {};
    }

    // Mapeia os símbolos ativos. Símbolos desmarcados que antes iam para modalToState voltam a ser auto-loops
    alphabet.forEach(sym => {
        if (modalSelectedSymbols.includes(sym)) {
            transitions[modalFromState][sym] = modalToState;
        } else if (transitions[modalFromState][sym] === modalToState) {
            transitions[modalFromState][sym] = modalFromState;
        }
    });

    buildStateTable();
    redrawGraph();
    saveToLocalStorage();
    closeTransitionModal();
}
