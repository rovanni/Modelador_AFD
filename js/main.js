/* Inicialização da página */
// ----------------- INICIALIZAÇÃO DA PÁGINA -----------------
window.addEventListener('load', () => {
    initTheme();
    initToolbarSize();
    setupCanvasSize();
    if (!loadFromLocalStorage()) {
        loadExample('ends1'); // Carrega padrão se não houver salvo
    }
    
    // Ouvir tecla Enter no input do modal de prompt
    document.getElementById('prompt-modal-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmPromptModal();
        }
    });

    // Registrar o ResizeObserver para o container do canvas
    const container = document.getElementById('canvas-container');
    if (container) {
        let resizeTimeout;
        const resizeObserver = new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const sizeChanged = setupCanvasSize();
                if (sizeChanged && !hasUserDragged && states.length > 0) {
                    centerGraphCoordinates();
                }
                redrawGraph();
            }, 50);
        });
        resizeObserver.observe(container);
    }
});

function setupCanvasSize() {
    const container = document.getElementById('canvas-container');
    if (!container) return false;
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.round(container.clientWidth * dpr);
    const targetHeight = Math.round(container.clientHeight * dpr);
    
    // Apenas atualiza se o tamanho físico realmente mudou, evitando loops infinitos
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.scale(dpr, dpr);
        return true;
    }
    return false;
}

// Alertas Customizados (Sem usar alert() nativo em iframes)
function showAlert(title, msg) {
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = msg;
    document.getElementById('custom-alert').classList.remove('hidden');
}
