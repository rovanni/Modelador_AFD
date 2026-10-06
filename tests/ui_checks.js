/*
  Testes de interface do Modelador de AFD.

  Como rodar: abra index.html no navegador, abra o console (F12), cole TODO este arquivo e tecle Enter.
  O resultado aparece no console (linhas PASS / FAIL e um resumo).
  Ao final, o exemplo "Termina em 1" é recarregado (o trabalho salvo no navegador é substituído por ele).
*/
(() => {
    const out = [];
    let pass = 0, fail = 0;
    const check = (name, cond, extra) => {
        if (cond) { pass++; out.push('PASS  ' + name); }
        else { fail++; out.push('FAIL  ' + name + (extra !== undefined ? '  -> ' + extra : '')); }
    };
    const $ = (id) => document.getElementById(id);
    const rect = () => canvas.getBoundingClientRect();
    const ev = (type, x, y, target, extra) => (target || window).dispatchEvent(
        new MouseEvent(type, Object.assign({ clientX: x, clientY: y, bubbles: true, button: 0 }, extra || {})));
    const at = (s) => ({ x: rect().left + s.x, y: rect().top + s.y });
    const snapPos = () => states.map((s) => Math.round(s.x) + ',' + Math.round(s.y)).join('|');

    // ---------- 1. mover e desfazer ----------
    loadExample('ends1');
    let s = states[0];
    const before = [s.x, s.y];
    let p = at(s);
    ev('mousedown', p.x, p.y, canvas); ev('mousemove', p.x + 70, p.y + 50, canvas); ev('mouseup', p.x + 70, p.y + 50, canvas);
    check('arrastar um estado o move', s.x !== before[0] || s.y !== before[1], [s.x, s.y]);
    undo();
    check('desfazer devolve o estado à posição original', states[0].x === before[0] && states[0].y === before[1], [states[0].x, states[0].y]);

    // ---------- 2. conectar com Shift ----------
    loadExample('ends1');
    const pa = at(states[0]), pb = at(states[1]);
    ev('mousedown', pa.x, pa.y, canvas, { shiftKey: true }); ev('mousemove', pb.x, pb.y, canvas); ev('mouseup', pb.x, pb.y, canvas);
    check('Shift+arrastar abre o modal de transição', !$('transition-modal').classList.contains('hidden'));
    closeTransitionModal();

    // ---------- 3. duplo clique ----------
    const n0 = states.length;
    canvas.dispatchEvent(new MouseEvent('dblclick', { clientX: rect().left + 300, clientY: rect().top + 60, bubbles: true }));
    check('duplo clique no vazio cria estado', states.length === n0 + 1, states.length);
    undo();
    const target = states[0]; const wasAcc = acceptingStateIds.includes(target.id); const pq = at(target);
    canvas.dispatchEvent(new MouseEvent('dblclick', { clientX: pq.x, clientY: pq.y, bubbles: true }));
    check('duplo clique no estado alterna aceitação', acceptingStateIds.includes(target.id) === !wasAcc);
    undo();

    // ---------- 4. modo criar transições e menu de contexto ----------
    toggleDrawMode();
    check('botão alterna para criar transições', canvasMode === 'transition');
    toggleDrawMode();
    check('botão volta para mover nós', canvasMode === 'drag');
    const pc = at(states[0]);
    canvas.dispatchEvent(new MouseEvent('contextmenu', { clientX: pc.x, clientY: pc.y, bubbles: true }));
    check('botão direito no estado abre o menu', !$('canvas-context-menu').classList.contains('hidden'));
    $('canvas-context-menu').classList.add('hidden');

    // ---------- 5. layouts ----------
    loadExample('even0');
    const p0 = snapPos();
    autoLayoutCircle(); const pcirc = snapPos();
    check('layout em círculo reposiciona', pcirc !== p0);
    layoutGrid(); const pgrid = snapPos();
    check('layout em grade reposiciona', pgrid !== pcirc);

    // ---------- 6. simulação passo a passo ----------
    loadExample('ends1');
    $('simulation-input').value = '1101';
    startStepByStep();
    check('passo a passo mostra o painel', !$('step-panel').classList.contains('hidden'));
    const marked = () => [...document.querySelectorAll('#state-table-body tr')].filter((r) => r.className.includes('ring-cyan-500/50'));
    check('tabela destaca a linha do estado atual', marked().length === 1 && marked()[0].dataset.state === stepState, marked().length);
    const symMarked = [...document.querySelectorAll('#state-table-body [data-sym]')].filter((e) => e.className.includes('bg-cyan-500/25'));
    check('tabela destaca o símbolo que será lido', symMarked.length === 1 && symMarked[0].dataset.sym === '1', symMarked.length);
    nextStep();
    check('avançar um passo muda o índice', stepIndex === 1, stepIndex);
    firstStep();
    check('ir ao início volta ao passo 0', stepIndex === 0 && stepHistory.length === 1);
    lastStep();
    check('ir ao fim mostra o veredito (ACEITA para 1101)', /ACEITA/.test($('simulation-feedback').textContent), $('simulation-feedback').textContent.slice(0, 50));
    check('ao terminar, o destaque da tabela é removido', marked().length === 0);
    startStepByStep();
    togglePlayPause();
    check('Play liga a reprodução', isPlaying === true);
    togglePlayPause();
    check('Pausar desliga a reprodução', isPlaying === false);
    stopSimulation();

    // ---------- 7. análise rápida e lote ----------
    $('simulation-input').value = '0101';
    runFastSimulation();
    check('análise rápida aceita 0101 (termina em 1)', /ACEITA/.test($('simulation-feedback').textContent));
    $('batch-input').value = '1\n01\n10\n0';
    runBatchSimulation();
    const rows = document.querySelectorAll('#batch-results-body tr').length;
    check('lote lista as 4 cadeias', rows === 4, rows);

    // ---------- 8. salvar no navegador ----------
    loadExample('even0');
    saveToLocalStorage();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('modelador_afd_state')); } catch (e) { /* ignora */ }
    check('autômato é salvo no navegador', !!saved && saved.states.length === states.length);
    loadExample('start1');
    check('loadFromLocalStorage restaura o salvo', loadFromLocalStorage() === true);

    // ---------- 9. exportações ----------
    loadExample('even0');
    exportToTikZ();
    const tex = $('latex-code-textarea').value;
    check('TikZ: sem cor inválida (slate-800)', !tex.includes('slate-'));
    check('TikZ: laços usam loop above', tex.includes('loop above'));
    check('documento .tex completo (standalone)', buildFullTeX(tex).includes('\\documentclass') && buildFullTeX(tex).includes('\\end{document}'));
    closeLatexModal();

    loadExample('ends1');
    const summary = 'RESUMO UI: PASS=' + pass + ' FAIL=' + fail;
    out.push(summary);
    console.log(out.join('\n'));
    return out.join('\n');
})()
