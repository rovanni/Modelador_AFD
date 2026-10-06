/* Exportação PNG e LaTeX (TikZ) */
// ----------------- EXPORTAÇÃO PARA PNG (ALTA RESOLUÇÃO) -----------------
function exportToPNG(theme) {
    const tempCanvas = document.createElement('canvas');
    const dpr = 2; // Duplica resolução para LaTeX / Impressão
    tempCanvas.width = canvas.width * dpr / (window.devicePixelRatio || 1);
    tempCanvas.height = canvas.height * dpr / (window.devicePixelRatio || 1);
    
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.scale(dpr, dpr);

    let bgStyle = "transparent";
    let stateLabelColor = "#f1f5f9";
    let stateBorderColor = "#475569";
    let transitionColor = "#64748b";
    let textFontColor = "#94a3b8";

    if (theme === 'dark') {
        bgStyle = "#0f172a";
    } else if (theme === 'light') {
        bgStyle = "#ffffff";
        stateLabelColor = "#0f172a";
        stateBorderColor = "#94a3b8";
        transitionColor = "#475569";
        textFontColor = "#1e293b";
    }

    if (bgStyle !== "transparent") {
        tempCtx.fillStyle = bgStyle;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    // Desenha as transições no canvas de exportação
    states.forEach(fromNode => {
        const destMap = {};
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
            tempCtx.strokeStyle = transitionColor;
            tempCtx.lineWidth = 1.5;
            tempCtx.fillStyle = textFontColor;

            if (fromNode.id === toId) {
                const x = fromNode.x;
                const y = fromNode.y - nodeRadius;
                tempCtx.beginPath();
                tempCtx.arc(x, y - 12, 17, Math.PI * 0.1, Math.PI * 0.9, true);
                tempCtx.stroke();
                
                // Desenha a ponta da seta do laço centralizada perfeitamente no PNG
                const arrowAngle = Math.PI * 0.1;
                const arrowX = x + 15 * Math.cos(arrowAngle);
                const arrowY = y - 10 + 15 * Math.sin(arrowAngle);
                drawArrowHead(tempCtx, arrowX, arrowY, Math.PI * 0.62);

                tempCtx.font = "bold 13px 'Fira Code', monospace";
                tempCtx.textAlign = 'center';
                tempCtx.fillText(label, x, y - 32);
            } else {
                const reverseExists = transitions[toId] && Object.values(transitions[toId]).includes(fromNode.id);
                const dx = toNode.x - fromNode.x;
                const dy = toNode.y - fromNode.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const ux = dx / dist;
                const uy = dy / dist;
                const px = -uy;
                const py = ux;

                if (reverseExists) {
                    const bend = 24;
                    const midX = (fromNode.x + toNode.x) / 2 + px * bend;
                    const midY = (fromNode.y + toNode.y) / 2 + py * bend;
                    const targetX = toNode.x - ux * nodeRadius + px * 6;
                    const targetY = toNode.y - uy * nodeRadius + py * 6;
                    const startX = fromNode.x + ux * nodeRadius + px * 6;
                    const startY = fromNode.y + uy * nodeRadius + py * 6;

                    tempCtx.beginPath();
                    tempCtx.moveTo(startX, startY);
                    tempCtx.quadraticCurveTo(midX, midY, targetX, targetY);
                    tempCtx.stroke();

                    const angle = Math.atan2(targetY - midY, targetX - midX);
                    drawArrowHead(tempCtx, targetX, targetY, angle);

                    tempCtx.font = "bold 13px 'Fira Code', monospace";
                    tempCtx.textAlign = 'center';
                    tempCtx.fillText(label, midX + px * 4, midY + py * 4 + 4);
                } else {
                    const startX = fromNode.x + ux * nodeRadius;
                    const startY = fromNode.y + uy * nodeRadius;
                    const endX = toNode.x - ux * nodeRadius;
                    const endY = toNode.y - uy * nodeRadius;

                    tempCtx.beginPath();
                    tempCtx.moveTo(startX, startY);
                    tempCtx.lineTo(endX, endY);
                    tempCtx.stroke();

                    const angle = Math.atan2(endY - startY, endX - startX);
                    drawArrowHead(tempCtx, endX, endY, angle);

                    const textX = (startX + endX) / 2 - px * 10;
                    const textY = (startY + endY) / 2 - py * 10 + 4;
                    tempCtx.font = "bold 13px 'Fira Code', monospace";
                    tempCtx.textAlign = 'center';
                    tempCtx.fillText(label, textX, textY);
                }
            }
        });
    });

    // Desenha os estados no canvas de exportação
    states.forEach(node => {
        const isInitial = (node.id === initialStateId);
        const isFinal = acceptingStateIds.includes(node.id);
        const borderC = isFinal ? '#10b981' : stateBorderColor;

        tempCtx.beginPath();
        tempCtx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        tempCtx.fillStyle = theme === 'light' ? '#ffffff' : '#1e293b';
        tempCtx.fill();
        tempCtx.strokeStyle = borderC;
        tempCtx.lineWidth = isInitial ? 2.5 : 1.5;
        tempCtx.stroke();

        if (isFinal) {
            tempCtx.beginPath();
            tempCtx.arc(node.x, node.y, nodeRadius - 5, 0, Math.PI * 2);
            tempCtx.strokeStyle = borderC;
            tempCtx.lineWidth = 1;
            tempCtx.stroke();
        }

        if (isInitial) {
            tempCtx.strokeStyle = transitionColor;
            tempCtx.lineWidth = 2;
            tempCtx.fillStyle = transitionColor;
            const startX = node.x - nodeRadius - 30;
            const endX = node.x - nodeRadius;
            tempCtx.beginPath();
            tempCtx.moveTo(startX, node.y);
            tempCtx.lineTo(endX, node.y);
            tempCtx.stroke();
            drawArrowHead(tempCtx, endX, node.y, 0);
        }

        tempCtx.fillStyle = stateLabelColor;
        const fontSize = getNodeFontSize(tempCtx, node.id, 14, nodeRadius);
        tempCtx.font = `bold ${fontSize}px 'Fira Code', monospace`;
        tempCtx.textAlign = 'center';
        tempCtx.fillText(node.id, node.x, node.y + (fontSize / 3));
    });

    const link = document.createElement('a');
    link.download = `afd-${theme}-export.png`;
    link.href = tempCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ----------------- EXPORTAÇÃO PARA LATEX (TIKZ) -----------------
/* Símbolo seguro em texto LaTeX: ε vira $\varepsilon$ e caracteres especiais são escapados. */
function texSym(sym) {
    const str = String(sym);
    if (str === 'ε') return '$\\varepsilon$';
    return str.replace(/\\/g, '\\textbackslash{}').replace(/([#%&_{}$^~])/g, '\\$1');
}
/* Nome de estado em modo matemático: q0 -> $q_{0}$ */
function texStateName(name) {
    const m = String(name).match(/^(.*?)(\d+)$/);
    const base = (m && m[1]) ? m[1] : String(name);
    const sub = (m && m[1]) ? '_{' + m[2] + '}' : '';
    const esc = base.replace(/([#%&_{}$^~])/g, '\\$1');
    return '$' + (esc.length > 1 ? '\\mathit{' + esc + '}' : esc) + sub + '$';   // q0 -> $q_{0}$, qPar -> $\mathit{qPar}$
}

function exportToTikZ() {
    if (states.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    states.forEach(s => {
        if (s.x < minX) minX = s.x;
        if (s.x > maxX) maxX = s.x;
        if (s.y < minY) minY = s.y;
        if (s.y > maxY) maxY = s.y;
    });

    const scale = 100.0;

    let tikz = "";
    tikz += "% Preâmbulo sugerido:\n";
    tikz += "% \\usepackage[utf8]{inputenc}  \\usepackage[T1]{fontenc}  \\usepackage{tikz}\n";
    tikz += "% \\usetikzlibrary{automata, positioning, arrows.meta}\n\n";
    tikz += "\\begin{tikzpicture}[shorten >=1pt, node distance=2cm, on grid, auto, >=stealth, \n";
    tikz += "    every state/.style={draw=black, fill=white, minimum size=1cm},\n";
    tikz += "    initial text={}]\n\n";

    tikz += "  % Estados\n";
    states.forEach(node => {
        const isInitial = (node.id === initialStateId);
        const isFinal = acceptingStateIds.includes(node.id);
        
        let opts = "state";
        if (isInitial) opts += ", initial";
        if (isFinal) opts += ", accepting";
        
        const tx = ((node.x - minX) / scale).toFixed(2);
        const ty = (-(node.y - minY) / scale).toFixed(2);

        tikz += `  \\node[${opts}] (${node.id}) at (${tx}, ${ty}) {${texStateName(node.id)}};\n`;
    });
    tikz += "\n";

    tikz += "  % Transições\n";
    
    const edgeGroups = {};
    states.forEach(node => {
        const trans = transitions[node.id] || {};
        alphabet.forEach(sym => {
            const dest = trans[sym];
            if (dest) {
                const key = `${node.id}->${dest}`;
                if (!edgeGroups[key]) {
                    edgeGroups[key] = [];
                }
                edgeGroups[key].push(sym);
            }
        });
    });

    const keys = Object.keys(edgeGroups);
    if (keys.length > 0) {
        tikz += "  \\path[->] \n";
        keys.forEach((key, idx) => {
            const [from, to] = key.split("->");
            const symbols = edgeGroups[key].map(texSym).join(", ");
            
            let edgeOpts = "";
            if (from === to) {
                edgeOpts = "loop above";
            } else {
                const reverseKey = `${to}->${from}`;
                if (edgeGroups[reverseKey]) {
                    edgeOpts = "bend left";
                } else {
                    edgeOpts = "bend left=10";
                }
            }

            const endChar = (idx === keys.length - 1) ? ";" : "";
            tikz += `    (${from}) edge[${edgeOpts}] node {${symbols}} (${to})${endChar}\n`;
        });
    }

    tikz += "\\end{tikzpicture}";

    document.getElementById('latex-code-textarea').value = tikz;
    
    const btn = document.getElementById('copy-latex-btn');
    if (btn) {
        btn.innerHTML = "Copiar Código";
        btn.className = "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-5 rounded-xl transition text-xs shadow-md shadow-cyan-500/10";
    }
    
    document.getElementById('latex-export-modal').classList.remove('hidden');
}

/* Documento completo e compilável (classe standalone), a partir do código TikZ mostrado no modal. */
function buildFullTeX(tikz) {
    return [
        '\\documentclass[border=10pt,varwidth]{standalone}',
        '\\usepackage[utf8]{inputenc}',
        '\\usepackage[T1]{fontenc}',
        '\\usepackage{tikz}',
        '\\usetikzlibrary{automata,positioning,arrows.meta}',
        '\\begin{document}',
        tikz,
        '\\end{document}',
        ''
    ].join('\n');
}

function downloadFullTeX() {
    const tikz = document.getElementById('latex-code-textarea').value;
    const blob = new Blob([buildFullTeX(tikz)], { type: 'text/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'afd.tex';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function closeLatexModal() {
    document.getElementById('latex-export-modal').classList.add('hidden');
}

function copyLatexCode() {
    const textarea = document.getElementById('latex-code-textarea');
    textarea.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copy-latex-btn');
    if (btn) {
        btn.innerHTML = "✓ Copiado!";
        btn.className = "bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-5 rounded-xl transition text-xs shadow-md shadow-emerald-500/10";
        
        setTimeout(() => {
            btn.innerHTML = "Copiar Código";
            btn.className = "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-5 rounded-xl transition text-xs shadow-md shadow-cyan-500/10";
        }, 2000);
    }
}
