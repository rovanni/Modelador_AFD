/* Modais de texto, tabela de estados, validador e minimização */
// ----------------- MODAL DE PROMPT CUSTOMIZADO E RENOMEAÇÃO -----------------
function openPromptModal(title, desc, defaultValue, action, targetId = null) {
    document.getElementById('prompt-modal-title').textContent = title;
    document.getElementById('prompt-modal-desc').innerHTML = desc;
    
    const input = document.getElementById('prompt-modal-input');
    input.value = defaultValue;
    
    promptAction = action;
    promptTargetId = targetId;
    
    document.getElementById('prompt-modal').classList.remove('hidden');
    
    setTimeout(() => {
        input.focus();
        input.select();
    }, 50);
}

function closePromptModal() {
    document.getElementById('prompt-modal').classList.add('hidden');
    promptAction = null;
    promptTargetId = null;
}

function confirmPromptModal() {
    const inputVal = document.getElementById('prompt-modal-input').value.trim();
    
    if (promptAction === 'rename') {
        const success = renameState(promptTargetId, inputVal);
        if (success) {
            closePromptModal();
        }
    } else if (promptAction === 'add') {
        if (!inputVal) {
            showAlert("Erro ao adicionar", "O nome do estado não pode ser vazio.");
            return;
        }
        const regex = /^[a-zA-Z0-9_-]+$/;
        if (!regex.test(inputVal)) {
            showAlert("Erro ao adicionar", "O nome do estado deve conter apenas letras, números, underlines (_) e hifens (-).");
            return;
        }
        if (states.some(s => s.id === inputVal)) {
            showAlert("Erro ao adicionar", `Já existe um estado chamado "${inputVal}".`);
            return;
        }
        
        stopSimulation();
        addNewState(null, null, inputVal);
        closePromptModal();
    }
}

function handleAddStateClick() {
    stopSimulation();
    let nextIndex = 0;
    while (states.some(s => s.id === `q${nextIndex}`)) {
        nextIndex++;
    }
    const defaultId = `q${nextIndex}`;
    
    openPromptModal(
        "Adicionar Estado",
        "Digite o nome do novo estado:",
        defaultId,
        'add'
    );
}

function contextRenameState() {
    if (contextNode) {
        stopSimulation();
        openPromptModal(
            "Renomear Estado",
            `Digite o novo nome para o estado <strong class="text-cyan-600 dark:text-cyan-400 font-mono">${contextNode.id}</strong>:`,
            contextNode.id,
            'rename',
            contextNode.id
        );
    }
    hideContextMenu();
}

function renameState(oldId, newId) {
    newId = newId.trim();
    if (!newId) {
        showAlert("Erro ao renomear", "O nome do estado não pode ser vazio.");
        return false;
    }

    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(newId)) {
        showAlert("Erro ao renomear", "O nome do estado deve conter apenas letras, números, underlines (_) e hifens (-).");
        return false;
    }

    if (oldId !== newId && states.some(s => s.id === newId)) {
        showAlert("Erro ao renomear", `Já existe um estado chamado "${newId}".`);
        return false;
    }

    saveHistory();
    stopSimulation();

    // 1. Atualizar o ID do estado na lista de estados
    const stateObj = states.find(s => s.id === oldId);
    if (stateObj) {
        stateObj.id = newId;
    }

    // 2. Atualizar o initialStateId se necessário
    if (initialStateId === oldId) {
        initialStateId = newId;
    }

    // 3. Atualizar o acceptingStateIds se necessário
    const idx = acceptingStateIds.indexOf(oldId);
    if (idx !== -1) {
        acceptingStateIds[idx] = newId;
    }

    // 4. Atualizar transições
    if (transitions[oldId]) {
        transitions[newId] = transitions[oldId];
        delete transitions[oldId];
    }

    Object.keys(transitions).forEach(fromId => {
        Object.keys(transitions[fromId]).forEach(sym => {
            if (transitions[fromId][sym] === oldId) {
                transitions[fromId][sym] = newId;
            }
        });
    });

    // 5. Atualizar interface, canvas e salvar
    buildStateTable();
    redrawGraph();
    saveToLocalStorage();
    return true;
}

function updateAlphabet() {
    const val = document.getElementById('alphabet-input').value;
    const parsed = val.split(',')
                     .map(s => s.trim())
                     .filter(s => s.length > 0);
    
    if (parsed.length === 0) {
        showAlert("Erro de Alfabeto", "O alfabeto precisa conter pelo menos um símbolo válido.");
        return;
    }

    saveHistory();
    alphabet = parsed;

    // Ajustar transições para se adequar ao novo alfabeto
    states.forEach(node => {
        const oldTrans = transitions[node.id] || {};
        transitions[node.id] = {};
        alphabet.forEach(sym => {
            transitions[node.id][sym] = oldTrans[sym] || node.id;
        });
    });

    buildStateTable();
    redrawGraph();
    saveToLocalStorage();
}

// Cria e adiciona um novo nó ao array de estados (com correção de ID duplicado ou com ID customizado)
function addNewState(x = null, y = null, customId = null) {
    saveHistory();
    let id = customId;
    if (!id) {
        let nextIndex = 0;
        while (states.some(s => s.id === `q${nextIndex}`)) {
            nextIndex++;
        }
        id = `q${nextIndex}`;
    }
    
    const container = document.getElementById('canvas-container');
    const padX = 35;
    const padYTop = 55;
    const padYBottom = 35;
    const w = container.clientWidth;
    const h = container.clientHeight;

    if (x === null) {
        x = (w / 2) + (Math.random() * 100 - 50);
    }
    if (y === null) {
        y = (h / 2) + (Math.random() * 100 - 50);
    }

    // Garante que novos estados respeitem os limites da tela
    x = Math.max(padX, Math.min(w - padX, x));
    y = Math.max(padYTop, Math.min(h - padYBottom, y));

    const newState = { id, x, y };
    states.push(newState);

    // Transições iniciais (loops no próprio estado)
    transitions[id] = {};
    alphabet.forEach(sym => {
        transitions[id][sym] = id;
    });

    if (states.length === 1 || !initialStateId) {
        initialStateId = id;
    }

    buildStateTable();
    redrawGraph();
    saveToLocalStorage();
}

function removeState(id) {
    if (states.length <= 1) {
        showAlert("Ação Negada", "O autômato precisa conter pelo menos um estado.");
        return;
    }

    saveHistory();
    selectedStateIds = selectedStateIds.filter(selId => selId !== id);
    // Remover do vetor principal de estados
    states = states.filter(s => s.id !== id);

    // Remover das aceitações
    acceptingStateIds = acceptingStateIds.filter(fId => fId !== id);

    // Se removeu o inicial, define outro como inicial
    if (initialStateId === id && states.length > 0) {
        initialStateId = states[0].id;
    }

    // Remover regras associadas
    delete transitions[id];

    // Ajustar transições que apontavam para este nó
    Object.keys(transitions).forEach(fromId => {
        Object.keys(transitions[fromId]).forEach(sym => {
            if (transitions[fromId][sym] === id) {
                transitions[fromId][sym] = fromId; // joga de volta para loop
            }
        });
    });

    buildStateTable();
    redrawGraph();
    saveToLocalStorage();
}

function toggleAcceptance(id) {
    saveHistory();
    const index = acceptingStateIds.indexOf(id);
    if (index > -1) {
        acceptingStateIds.splice(index, 1);
    } else {
        acceptingStateIds.push(id);
    }
    redrawGraph();
    saveToLocalStorage();
}

// Define o estado inicial da computação ativa
function setInitialState(id) {
    saveHistory();
    initialStateId = id;
    redrawGraph();
    saveToLocalStorage();
}

function changeTransition(fromState, symbol, destState) {
    saveHistory();
    if (transitions[fromState]) {
        transitions[fromState][symbol] = destState;
        redrawGraph();
        saveToLocalStorage();
    }
}

function clearAutomaton() {
    saveHistory();
    states = [];
    acceptingStateIds = [];
    initialStateId = "";
    transitions = {};
    addNewState();
    saveToLocalStorage();
}

// ----------------- RENDERIZAÇÃO DA TABELA (UI) -----------------
function buildStateTable() {
    const tbody = document.getElementById('state-table-body');
    tbody.innerHTML = "";
    document.getElementById('state-count').textContent = states.length;

    states.forEach(node => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 dark:border-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition duration-150";
        tr.dataset.state = node.id;

        // Nome do nó com botão de renomear
        const tdName = document.createElement('td');
        tdName.className = "py-3 text-slate-800 dark:text-slate-200 code-font font-bold";
        
        const nameContainer = document.createElement('div');
        nameContainer.className = "flex items-center gap-1.5";
        
        const spanName = document.createElement('span');
        spanName.textContent = node.id;
        nameContainer.appendChild(spanName);
        
        const renameBtn = document.createElement('button');
        renameBtn.className = "text-slate-400 hover:text-cyan-500 transition-colors p-0.5";
        renameBtn.title = "Renomear estado";
        renameBtn.onclick = () => {
            stopSimulation();
            openPromptModal(
                "Renomear Estado",
                `Digite o novo nome para o estado <strong class="text-cyan-600 dark:text-cyan-400 font-mono">${node.id}</strong>:`,
                node.id,
                'rename',
                node.id
            );
        };
        renameBtn.innerHTML = `
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                `;
        nameContainer.appendChild(renameBtn);
        tdName.appendChild(nameContainer);
        tr.appendChild(tdName);

        // Checkbox Inicial
        const tdInit = document.createElement('td');
        tdInit.className = "py-3 text-center";
        tdInit.innerHTML = `
                    <input type="radio" name="initial-node" ${initialStateId === node.id ? 'checked' : ''} 
                           onchange="setInitialState('${node.id}')"
                           class="w-4 h-4 rounded-full text-cyan-500 focus:ring-cyan-500 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 cursor-pointer">
                `;
        tr.appendChild(tdInit);

        // Checkbox Final (Aceitação)
        const tdFinal = document.createElement('td');
        tdFinal.className = "py-3 text-center";
        tdFinal.innerHTML = `
                    <input type="checkbox" ${acceptingStateIds.includes(node.id) ? 'checked' : ''} 
                           onchange="toggleAcceptance('${node.id}')"
                           class="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 cursor-pointer">
                `;
        tr.appendChild(tdFinal);

        // Coluna das transições (Mapeia uma linha por símbolo do alfabeto)
        const tdTrans = document.createElement('td');
        tdTrans.className = "py-3 pl-3";
        
        const wrapper = document.createElement('div');
        wrapper.className = "flex flex-col gap-2";
        
        alphabet.forEach(sym => {
            const row = document.createElement('div');
            row.className = "flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400";
            row.dataset.sym = sym;
            row.innerHTML = `<span>Ao ler <strong class="text-cyan-600 dark:text-cyan-400 font-mono">${sym}</strong> vai para:</span>`;
            
            const select = document.createElement('select');
            select.className = "bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-slate-800 dark:text-slate-300 text-[10px] py-1 px-2 focus:border-cyan-500 outline-none code-font cursor-pointer";
            select.onchange = (e) => changeTransition(node.id, sym, e.target.value);
            
            states.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.id;
                select.appendChild(opt);
            });
            
            select.value = transitions[node.id]?.[sym] || node.id;
            row.appendChild(select);
            wrapper.appendChild(row);
        });
        tdTrans.appendChild(wrapper);
        tr.appendChild(tdTrans);

        // Ações de exclusão
        const tdActions = document.createElement('td');
        tdActions.className = "py-3 text-center";
        tdActions.innerHTML = `
                    <button onclick="removeState('${node.id}')" class="text-rose-600 dark:text-rose-500 hover:text-rose-400 transition" title="Excluir nó">
                        Excluir
                    </button>
                `;
        tr.appendChild(tdActions);

        tbody.appendChild(tr);
    });
    runDiagnostics();
}

// ----------------- VALIDADOR DE DIAGNÓSTICOS DE CONSISTÊNCIA -----------------
function runDiagnostics() {
    const container = document.getElementById('validator-status');
    if (!container) return;
    container.innerHTML = "";

    const errors = [];
    const warnings = [];

    // 1. Verificar Estado Inicial
    if (!initialStateId || !states.some(s => s.id === initialStateId)) {
        errors.push("Nenhum estado inicial definido.");
    }

    // 2. Verificar Estados de Aceitação
    const validAccepting = acceptingStateIds.filter(fId => states.some(s => s.id === fId));
    if (validAccepting.length === 0) {
        warnings.push("Nenhum estado final (de aceitação) definido.");
    }

    // 3. Transições incompletas e/ou inválidas
    states.forEach(node => {
        const trans = transitions[node.id] || {};
        alphabet.forEach(sym => {
            const dest = trans[sym];
            if (!dest) {
                errors.push(`Estado <b>${node.id}</b> não possui transição para o símbolo '<b>${sym}</b>'.`);
            } else if (!states.some(s => s.id === dest)) {
                errors.push(`Estado <b>${node.id}</b> possui transição inválida para o estado '<b>${dest}</b>' ao ler '<b>${sym}</b>'.`);
            }
        });
    });

    // 4. Conectividade / Estados Inalcançáveis
    if (initialStateId && states.some(s => s.id === initialStateId)) {
        const reachable = new Set();
        const queue = [initialStateId];
        reachable.add(initialStateId);

        while (queue.length > 0) {
            const curr = queue.shift();
            const trans = transitions[curr] || {};
            alphabet.forEach(sym => {
                const dest = trans[sym];
                if (dest && states.some(s => s.id === dest)) {
                    if (!reachable.has(dest)) {
                        reachable.add(dest);
                        queue.push(dest);
                    }
                }
            });
        }

        const unreachable = states.filter(s => !reachable.has(s.id));
        if (unreachable.length > 0) {
            const names = unreachable.map(s => `<b>${s.id}</b>`).join(", ");
            warnings.push(`Estado(s) inalcançável(is) a partir do inicial: ${names}.`);
        }

        // 5. Estados Sumidouros (Não alcançam estado de aceitação)
        if (validAccepting.length > 0) {
            const canReachFinal = new Set();
            const finalQueue = [];
            validAccepting.forEach(fId => {
                canReachFinal.add(fId);
                finalQueue.push(fId);
            });

            while (finalQueue.length > 0) {
                const curr = finalQueue.shift();
                states.forEach(p => {
                    if (!canReachFinal.has(p.id)) {
                        const pTrans = transitions[p.id] || {};
                        let hasTrans = false;
                        for (let sym of alphabet) {
                            if (pTrans[sym] === curr) {
                                hasTrans = true;
                                break;
                            }
                        }
                        if (hasTrans) {
                            canReachFinal.add(p.id);
                            finalQueue.push(p.id);
                        }
                    }
                });
            }

            const deadEnds = states.filter(s => {
                if (canReachFinal.has(s.id)) return false;
                // Ignorar se for um estado de erro/lixeira padrão: todas as transições voltam para si mesmo
                const trans = transitions[s.id] || {};
                const isTrap = alphabet.every(sym => trans[sym] === s.id);
                return !isTrap;
            });
            if (deadEnds.length > 0) {
                const names = deadEnds.map(s => `<b>${s.id}</b>`).join(", ");
                warnings.push(`Estado(s) sumidouro (não alcança aceitação): ${names}.`);
            }
        }
    }

    // Renderizar resultados
    if (errors.length === 0 && warnings.length === 0) {
        const item = document.createElement('div');
        item.className = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2 font-medium";
        item.innerHTML = `
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Autômato Consistente e Completo! Pronto para simulação.</span>
                `;
        container.appendChild(item);
    } else {
        errors.forEach(err => {
            const item = document.createElement('div');
            item.className = "text-rose-600 dark:text-rose-455 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl text-xs flex items-start gap-2 font-medium";
            item.innerHTML = `
                        <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <span>${err}</span>
                    `;
            container.appendChild(item);
        });

        warnings.forEach(warn => {
            const item = document.createElement('div');
            item.className = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-xs flex items-start gap-2 font-medium";
            item.innerHTML = `
                        <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>${warn}</span>
                    `;
            container.appendChild(item);
        });
    }
}

// ----------------- ALGORITMO DE MINIMIZAÇÃO DE AFD -----------------
function minimizeAutomaton() {
    if (states.length === 0) return;
    
    // Verificar estado inicial e erros de consistência
    if (!initialStateId || !states.some(s => s.id === initialStateId)) {
        showAlert("Erro de Validação", "Por favor, defina um estado inicial antes de realizar a minimização.");
        return;
    }

    // Verificar se há transições incompletas
    let hasIncomplete = false;
    for (let node of states) {
        const trans = transitions[node.id] || {};
        for (let sym of alphabet) {
            if (!trans[sym] || !states.some(s => s.id === trans[sym])) {
                hasIncomplete = true;
                break;
            }
        }
        if (hasIncomplete) break;
    }

    if (hasIncomplete) {
        showAlert("Transições Incompletas", "Por favor, certifique-se de que todas as transições para todos os símbolos do alfabeto estejam preenchidas antes de minimizar.");
        return;
    }

    // Início do Algoritmo de Minimização
    // 1. Filtrar inalcançáveis
    const reachable = new Set();
    const queue = [initialStateId];
    reachable.add(initialStateId);

    while (queue.length > 0) {
        const curr = queue.shift();
        const trans = transitions[curr] || {};
        alphabet.forEach(sym => {
            const dest = trans[sym];
            if (dest && states.some(s => s.id === dest)) {
                if (!reachable.has(dest)) {
                    reachable.add(dest);
                    queue.push(dest);
                }
            }
        });
    }

    const reachableStates = states.filter(s => reachable.has(s.id));
    const initialCount = states.length;

    // 2. Particionamento inicial (Finais vs Não-Finais)
    let partition = [];
    const finalGroup = reachableStates.filter(s => acceptingStateIds.includes(s.id)).map(s => s.id);
    const nonFinalGroup = reachableStates.filter(s => !acceptingStateIds.includes(s.id)).map(s => s.id);
    
    if (finalGroup.length > 0) partition.push(finalGroup);
    if (nonFinalGroup.length > 0) partition.push(nonFinalGroup);

    if (partition.length === 0) return; // Vazio

    // 3. Refinamento de partição
    let changed = true;
    while (changed) {
        changed = false;
        let nextPartition = [];
        for (let group of partition) {
            if (group.length <= 1) {
                nextPartition.push(group);
                continue;
            }
            
            let subGroups = [];
            for (let stateId of group) {
                let placed = false;
                for (let sub of subGroups) {
                    const rep = sub[0];
                    let equivalent = true;
                    for (let sym of alphabet) {
                        const dest1 = transitions[stateId]?.[sym];
                        const dest2 = transitions[rep]?.[sym];
                        
                        const gIdx1 = partition.findIndex(g => g.includes(dest1));
                        const gIdx2 = partition.findIndex(g => g.includes(dest2));
                        if (gIdx1 !== gIdx2) {
                            equivalent = false;
                            break;
                        }
                    }
                    if (equivalent) {
                        sub.push(stateId);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    subGroups.push([stateId]);
                }
            }
            nextPartition.push(...subGroups);
            if (subGroups.length > 1) {
                changed = true;
            }
        }
        partition = nextPartition;
    }

    // Se o número de classes é igual ao número de estados alcançáveis e já não havia inalcançáveis
    if (partition.length === reachableStates.length && reachableStates.length === states.length) {
        showAlert("Já Minimizado", "O autômato já está em sua forma mínima (todos os estados são distinguíveis e alcançáveis).");
        return;
    }

    // Salvamos histórico ANTES de fazer a alteração
    saveHistory();

    // Realizar a substituição
    const stateToNewId = {};
    partition.forEach(group => {
        group.sort();
        const newId = group.join("");
        group.forEach(oldId => {
            stateToNewId[oldId] = newId;
        });
    });

    const newStates = [];
    const newTransitions = {};
    let newInitialStateId = "";
    const newAcceptingStateIds = [];

    partition.forEach(group => {
        const newId = group.join("");
        
        // Média de posições
        let sumX = 0, sumY = 0;
        group.forEach(oldId => {
            const s = states.find(x => x.id === oldId);
            if (s) {
                sumX += s.x;
                sumY += s.y;
            }
        });
        const avgX = sumX / group.length;
        const avgY = sumY / group.length;

        newStates.push({
            id: newId,
            x: avgX,
            y: avgY
        });

        if (group.includes(initialStateId)) {
            newInitialStateId = newId;
        }

        const containsAccepting = group.some(oldId => acceptingStateIds.includes(oldId));
        if (containsAccepting) {
            newAcceptingStateIds.push(newId);
        }

        newTransitions[newId] = {};
        const rep = group[0];
        alphabet.forEach(sym => {
            const oldDest = transitions[rep]?.[sym];
            if (oldDest) {
                newTransitions[newId][sym] = stateToNewId[oldDest];
            }
        });
    });

    // Atualizar variáveis globais
    states = newStates;
    transitions = newTransitions;
    initialStateId = newInitialStateId;
    acceptingStateIds = newAcceptingStateIds;

    // Recalcular posições
    centerGraphCoordinates();

    buildStateTable();
    redrawGraph();
    saveToLocalStorage();

    showAlert("Minimização Concluída", `O autômato foi minimizado com sucesso de ${initialCount} para ${newStates.length} estados.`);
}
