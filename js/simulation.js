/* Motor de simulação (passo a passo) e testes em lote */
// ----------------- MOTOR DE SIMULAÇÃO (INTERATIVO) -----------------
function runFastSimulation() {
    const input = document.getElementById('simulation-input').value;
    const feedback = document.getElementById('simulation-feedback');
    
    if (states.length === 0) return;

    feedback.classList.remove('hidden');

    let current = initialStateId;
    let pathLog = `Ponto de partida em <b>${current}</b>.<br>`;
    let pathOk = true;

    for (let char of input) {
        if (!alphabet.includes(char)) {
            feedback.className = "mt-4 p-4 rounded-xl text-center font-bold text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
            feedback.innerHTML = `O caractere "${char}" não faz parte do alfabeto deste sistema.`;
            return;
        }

        const next = transitions[current]?.[char];
        if (!next) {
            pathOk = false;
            break;
        }
        pathLog += `Leu '${char}': <b>${current}</b> &rarr; <b>${next}</b><br>`;
        current = next;
    }

    const accepted = acceptingStateIds.includes(current) && pathOk;

    if (accepted) {
        feedback.className = "mt-4 p-4 rounded-xl text-center font-bold text-sm bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
        feedback.innerHTML = `✔ Cadeia ACEITA!<br><span class="font-normal text-xs text-slate-500 dark:text-slate-400">${pathLog}</span>`;
    } else {
        feedback.className = "mt-4 p-4 rounded-xl text-center font-bold text-sm bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/20";
        feedback.innerHTML = `✗ Cadeia REJEITADA!<br><span class="font-normal text-xs text-slate-500 dark:text-slate-400">${pathLog} finalizado em estado não-final (${current}).</span>`;
    }
}

function startStepByStep() {
    const input = document.getElementById('simulation-input').value;
    
    if (states.length === 0) return;
    if (input === "") {
        showAlert("Campo Vazio", "Por favor, digite uma cadeia de entrada para executar a simulação passo a passo.");
        return;
    }

    // Validar se todos caracteres são permitidos
    for (let char of input) {
        if (!alphabet.includes(char)) {
            showAlert("Alfabeto Inválido", `O símbolo "${char}" de sua cadeia não pertence ao alfabeto.`);
            return;
        }
    }

    // Parar qualquer play automático anterior
    stopPlayTimer();

    stepString = input;
    stepIndex = 0;
    stepState = initialStateId;
    stepHistory = [{ state: stepState, index: 0 }];
    
    document.getElementById('step-panel').classList.remove('hidden');
    document.getElementById('simulation-feedback').classList.add('hidden');
    
    updatePlayerButtons();
    updateStepDisplay();
}

function updateStepDisplay() {
    const display = document.getElementById('step-string-display');
    display.innerHTML = "";

    for (let i = 0; i < stepString.length; i++) {
        const span = document.createElement('span');
        span.textContent = stepString[i];
        if (i === stepIndex) {
            span.className = "text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500 dark:border-cyan-400 px-1 font-extrabold bg-cyan-500/10 rounded";
        } else {
            span.className = "px-0.5 text-slate-400 dark:text-slate-500";
        }
        display.appendChild(span);
    }

    const statusText = `Estado Atual: <strong class="text-slate-800 dark:text-white">${stepState}</strong> | Processados: ${stepIndex}/${stepString.length}`;
    document.getElementById('step-status').innerHTML = statusText;

    redrawGraph({ current: stepState });
    highlightTableStep();
}

/* Confere a tabela: destaca a linha do estado atual e a regra (símbolo) que será lida a seguir. */
function highlightTableStep() {
    const active = !document.getElementById('step-panel').classList.contains('hidden') && stepString !== '';
    const nextSym = (active && stepIndex < stepString.length) ? stepString[stepIndex] : null;
    const rowOn = ['bg-cyan-500/10', 'ring-1', 'ring-inset', 'ring-cyan-500/50'];
    const symOn = ['bg-cyan-500/25', 'rounded-md', 'px-1'];
    document.querySelectorAll('#state-table-body tr').forEach((tr) => {
        const isCurrent = active && tr.dataset.state === stepState;
        rowOn.forEach((c) => tr.classList.toggle(c, isCurrent));
        tr.querySelectorAll('[data-sym]').forEach((el) => {
            const on = isCurrent && nextSym !== null && el.dataset.sym === nextSym;
            symOn.forEach((c) => el.classList.toggle(c, on));
        });
    });
}

function updatePlayerButtons() {
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    const playPauseBtn = document.getElementById('play-pause-btn');

    if (prevBtn) prevBtn.disabled = (stepHistory.length <= 1);
    if (playPauseBtn) {
        if (isPlaying) {
            playPauseBtn.innerHTML = "⏸ Pausar";
            playPauseBtn.className = "bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold py-1.5 px-4 rounded-xl transition flex items-center gap-1 shadow-sm shadow-amber-500/10";
        } else {
            playPauseBtn.innerHTML = "▶ Play";
            playPauseBtn.className = "bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold py-1.5 px-4 rounded-xl transition flex items-center gap-1 shadow-sm shadow-cyan-500/10";
        }
    }
}

function stopPlayTimer() {
    isPlaying = false;
    if (playIntervalTimer) {
        clearInterval(playIntervalTimer);
        playIntervalTimer = null;
    }
}

function togglePlayPause() {
    if (isPlaying) {
        stopPlayTimer();
        updatePlayerButtons();
    } else {
        isPlaying = true;
        updatePlayerButtons();
        // Avança imediatamente
        nextStep();
        playIntervalTimer = setInterval(() => {
            if (document.getElementById('step-panel').classList.contains('hidden')) {
                stopPlayTimer();
                return;
            }
            nextStep();
        }, 1200);
    }
}

/* Volta ao início da simulação passo a passo. */
function firstStep() {
    if (stepHistory.length === 0) return;
    stopPlayTimer();
    stepHistory = [stepHistory[0]];
    stepState = stepHistory[0].state;
    stepIndex = stepHistory[0].index;
    document.getElementById('simulation-feedback').classList.add('hidden');
    document.getElementById('step-panel').classList.remove('hidden');
    updateStepDisplay();
    updatePlayerButtons();
}

/* Executa tudo até o fim e mostra o veredito. */
function lastStep() {
    if (stepHistory.length === 0) return;
    stopPlayTimer();
    while (stepIndex < stepString.length) {
        const next = transitions[stepState]?.[stepString[stepIndex]];
        if (!next) break;
        stepState = next;
        stepIndex++;
        stepHistory.push({ state: stepState, index: stepIndex });
    }
    updateStepDisplay();
    updatePlayerButtons();
    nextStep();   // mostra "aceita/rejeita" (ou o aviso de transição indefinida)
}

function prevStep() {
    if (stepHistory.length <= 1) return;
    
    stopPlayTimer();
    stepHistory.pop(); // Remove o estado atual
    
    const prev = stepHistory[stepHistory.length - 1];
    stepState = prev.state;
    stepIndex = prev.index;

    updateStepDisplay();
    updatePlayerButtons();
}

function nextStep() {
    if (stepIndex >= stepString.length) {
        stopPlayTimer();
        const isAccepted = acceptingStateIds.includes(stepState);
        const feedback = document.getElementById('simulation-feedback');
        
        feedback.classList.remove('hidden');
        document.getElementById('step-panel').classList.add('hidden');

        if (isAccepted) {
            feedback.className = "mt-4 p-4 rounded-xl text-center font-bold text-sm bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
            feedback.innerHTML = `✔ Simulação concluída: Cadeia ACEITA no estado ${stepState}.`;
        } else {
            feedback.className = "mt-4 p-4 rounded-xl text-center font-bold text-sm bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/20";
            feedback.innerHTML = `✗ Simulação concluída: Cadeia REJEITADA no estado não-final ${stepState}.`;
        }

        redrawGraph();
        highlightTableStep();
        return;
    }

    const symbol = stepString[stepIndex];
    const next = transitions[stepState]?.[symbol];

    if (!next) {
        stopPlayTimer();
        const feedback = document.getElementById('simulation-feedback');
        feedback.classList.remove('hidden');
        document.getElementById('step-panel').classList.add('hidden');
        feedback.className = "mt-4 p-4 rounded-xl text-center font-bold text-sm bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/20";
        feedback.innerHTML = `✗ Simulação abortada: Não há transição definida de <b>${stepState}</b> com o símbolo '${symbol}'.`;
        redrawGraph();
        highlightTableStep();
        return;
    }

    redrawGraph({ 
        current: next,
        from: stepState,
        to: next
    });

    stepState = next;
    stepIndex++;
    stepHistory.push({ state: stepState, index: stepIndex });

    setTimeout(() => {
        updateStepDisplay();
        updatePlayerButtons();
    }, 300);
}

function stopSimulation() {
    stopPlayTimer();
    document.getElementById('step-panel').classList.add('hidden');
    redrawGraph();
    highlightTableStep();
}

// ----------------- ABAS E SIMULAÇÃO EM LOTE -----------------
function switchSimTab(tab) {
    const singleBtn = document.getElementById('tab-sim-single');
    const batchBtn = document.getElementById('tab-sim-batch');
    const singlePanel = document.getElementById('sim-single-panel');
    const batchPanel = document.getElementById('sim-batch-panel');

    if (tab === 'single') {
        singleBtn.className = "px-4 py-2 text-xs font-bold border-b-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 transition-all uppercase tracking-wider";
        batchBtn.className = "px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all uppercase tracking-wider";
        singlePanel.classList.remove('hidden');
        batchPanel.classList.add('hidden');
    } else {
        batchBtn.className = "px-4 py-2 text-xs font-bold border-b-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 transition-all uppercase tracking-wider";
        singleBtn.className = "px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all uppercase tracking-wider";
        batchPanel.classList.remove('hidden');
        singlePanel.classList.add('hidden');
        stopSimulation();
    }
}

function runBatchSimulation() {
    const inputVal = document.getElementById('batch-input').value;
    const container = document.getElementById('batch-results-container');
    const tbody = document.getElementById('batch-results-body');
    
    if (states.length === 0) return;
    
    const lines = inputVal.split('\n')
                         .map(line => line.trim())
                         .filter(line => line.length > 0);
                         
    if (lines.length === 0) {
        showAlert("Entrada Vazia", "Insira pelo menos uma cadeia para realizar o teste em lote.");
        return;
    }

    tbody.innerHTML = "";
    container.classList.remove('hidden');

    lines.forEach(string => {
        let current = initialStateId;
        let pathOk = true;
        let invalidChar = null;

        for (let char of string) {
            if (!alphabet.includes(char)) {
                pathOk = false;
                invalidChar = char;
                break;
            }
            const next = transitions[current]?.[char];
            if (!next) {
                pathOk = false;
                break;
            }
            current = next;
        }

        const accepted = pathOk && acceptingStateIds.includes(current);
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition duration-150 border-b border-slate-100 dark:border-slate-900/40";

        const tdString = document.createElement('td');
        tdString.className = "py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider";
        tdString.textContent = string;
        tr.appendChild(tdString);

        const tdDetails = document.createElement('td');
        tdDetails.className = "py-3 px-4 text-slate-500 dark:text-slate-400";
        if (invalidChar) {
            tdDetails.innerHTML = `<span class="text-amber-500 font-semibold">Símbolo inválido: "${invalidChar}"</span>`;
        } else if (!pathOk) {
            tdDetails.innerHTML = `<span class="text-rose-500 font-semibold">Transição indefinida</span>`;
        } else {
            tdDetails.innerHTML = `Terminou no estado <strong class="font-mono text-slate-700 dark:text-slate-300 font-bold">${current}</strong>`;
        }
        tr.appendChild(tdDetails);

        const tdStatus = document.createElement('td');
        tdStatus.className = "py-3 px-4 text-center";
        if (accepted) {
            tdStatus.innerHTML = `
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            Aceito
                        </span>
                    `;
        } else {
            tdStatus.innerHTML = `
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-455 border border-rose-200 dark:border-rose-500/20">
                            Rejeitado
                        </span>
                    `;
        }
        tr.appendChild(tdStatus);
        tbody.appendChild(tr);
    });
}
