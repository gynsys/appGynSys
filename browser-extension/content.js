// Content script - Se inyecta automáticamente en todas las páginas
let inspectorInstance = null;

// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleInspector') {
        if (inspectorInstance) {
            inspectorInstance.toggle();
        } else {
            inspectorInstance = createInspector();
        }
        sendResponse({ isActive: inspectorInstance.isActive() });
    } else if (request.action === 'getStatus') {
        sendResponse({ isActive: inspectorInstance ? inspectorInstance.isActive() : false });
    }
    return true;
});

function createInspector() {
    const inspector = (function () {
        'use strict';

        // ==================== ESTADO GLOBAL ====================
        const state = {
            isActive: false,
            selectedElements: [],
            hoveredElement: null,
            measurementLines: [],
            elementLabels: []
        };

        // ==================== ESTILOS INYECTADOS ====================
        const injectStyles = () => {
            const styleId = 'dom-inspector-styles';
            if (document.getElementById(styleId)) return;

            const styles = `
                .dom-inspector-highlight {
                    outline: 3px solid #00ff88 !important;
                    outline-offset: 2px !important;
                    cursor: crosshair !important;
                    position: relative !important;
                }

                .dom-inspector-hover {
                    outline: 2px dashed #ff6b00 !important;
                    outline-offset: 1px !important;
                }

                .dom-inspector-label {
                    position: fixed;
                    background: rgba(0, 0, 0, 0.95);
                    color: #00ff88;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    pointer-events: none;
                    z-index: 999999;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                    border: 1px solid #00ff88;
                    line-height: 1.4;
                    max-width: 400px;
                }

                .dom-inspector-label-title {
                    color: #ffffff;
                    font-weight: bold;
                    margin-bottom: 4px;
                    border-bottom: 1px solid #00ff88;
                    padding-bottom: 4px;
                }

                .dom-inspector-label-item {
                    margin: 2px 0;
                }

                .dom-inspector-label-key {
                    color: #ff6b00;
                }

                .dom-inspector-line {
                    position: fixed;
                    background: #ff00ff;
                    z-index: 999998;
                    pointer-events: none;
                }

                .dom-inspector-line-label {
                    position: fixed;
                    background: #ff00ff;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    font-weight: bold;
                    z-index: 999999;
                    pointer-events: none;
                }

                .dom-inspector-panel {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.95);
                    border: 2px solid #00ff88;
                    border-radius: 8px;
                    padding: 16px;
                    z-index: 1000000;
                    font-family: 'Courier New', monospace;
                    min-width: 280px;
                    max-width: 400px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
                }

                .dom-inspector-panel h3 {
                    margin: 0 0 12px 0;
                    color: #00ff88;
                    font-size: 14px;
                    border-bottom: 1px solid #00ff88;
                    padding-bottom: 8px;
                }

                .dom-inspector-panel button {
                    background: #00ff88;
                    color: #000;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: bold;
                    margin: 4px 4px 4px 0;
                    transition: all 0.2s;
                }

                .dom-inspector-panel button:hover {
                    background: #00cc6a;
                    transform: translateY(-1px);
                }

                .dom-inspector-panel button:active {
                    transform: translateY(0);
                }

                .dom-inspector-panel button.danger {
                    background: #ff4444;
                    color: white;
                }

                .dom-inspector-panel button.danger:hover {
                    background: #cc0000;
                }

                .dom-inspector-panel button.secondary {
                    background: #666;
                    color: white;
                }

                .dom-inspector-info {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 8px;
                    border-radius: 4px;
                    margin-top: 8px;
                    font-size: 11px;
                    color: #ccc;
                }

                .dom-inspector-selection-list {
                    margin-top: 12px;
                    max-height: 150px;
                    overflow-y: auto;
                }

                .dom-inspector-selection-item {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 6px;
                    margin: 4px 0;
                    border-radius: 4px;
                    font-size: 11px;
                    color: #fff;
                    border-left: 3px solid #00ff88;
                }

                .dom-inspector-output {
                    margin-top: 12px;
                    background: rgba(0, 0, 0, 0.8);
                    border: 1px solid #00ff88;
                    border-radius: 4px;
                    padding: 12px;
                    max-height: 250px;
                    overflow-y: auto;
                    font-size: 11px;
                    color: #00ff88;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
            `;

            const styleElement = document.createElement('style');
            styleElement.id = styleId;
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        };

        // ==================== UTILIDADES ====================
        const getElementSelector = (element) => {
            if (element.id) return `#${element.id}`;

            let selector = element.tagName.toLowerCase();
            if (element.className) {
                const classes = Array.from(element.classList)
                    .filter(c => !c.startsWith('dom-inspector'))
                    .join('.');
                if (classes) selector += `.${classes}`;
            }
            return selector;
        };

        const getElementDimensions = (element) => {
            const rect = element.getBoundingClientRect();
            return {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                bottom: Math.round(rect.bottom)
            };
        };

        const getComputedStyles = (element) => {
            const computed = window.getComputedStyle(element);
            return {
                margin: computed.margin,
                marginTop: computed.marginTop,
                marginRight: computed.marginRight,
                marginBottom: computed.marginBottom,
                marginLeft: computed.marginLeft,
                padding: computed.padding,
                paddingTop: computed.paddingTop,
                paddingRight: computed.paddingRight,
                paddingBottom: computed.paddingBottom,
                paddingLeft: computed.paddingLeft,
                position: computed.position,
                top: computed.top,
                left: computed.left,
                right: computed.right,
                bottom: computed.bottom,
                display: computed.display,
                flexDirection: computed.flexDirection,
                justifyContent: computed.justifyContent,
                alignItems: computed.alignItems,
                gap: computed.gap,
                backgroundColor: computed.backgroundColor,
                color: computed.color,
                fontSize: computed.fontSize,
                fontWeight: computed.fontWeight,
                fontFamily: computed.fontFamily
            };
        };

        // ==================== VISUALIZACIÓN ====================
        const createLabel = (element, mouseX, mouseY) => {
            const label = document.createElement('div');
            label.className = 'dom-inspector-label';

            const selector = getElementSelector(element);
            const dims = getElementDimensions(element);
            const styles = getComputedStyles(element);

            label.innerHTML = `
                <div class="dom-inspector-label-title">${selector}</div>
                <div class="dom-inspector-label-item">
                    <span class="dom-inspector-label-key">Dimensiones:</span> ${dims.width}px × ${dims.height}px
                </div>
                <div class="dom-inspector-label-item">
                    <span class="dom-inspector-label-key">Padding:</span> ${styles.padding}
                </div>
                <div class="dom-inspector-label-item">
                    <span class="dom-inspector-label-key">Margin:</span> ${styles.margin}
                </div>
                <div class="dom-inspector-label-item">
                    <span class="dom-inspector-label-key">Position:</span> ${styles.position}
                </div>
                <div class="dom-inspector-label-item">
                    <span class="dom-inspector-label-key">Color:</span> <span style="display:inline-block;width:10px;height:10px;background:${styles.color};border:1px solid #fff;"></span> ${styles.color}
                </div>
                <div class="dom-inspector-label-item">
                    <span class="dom-inspector-label-key">Bg:</span> <span style="display:inline-block;width:10px;height:10px;background:${styles.backgroundColor};border:1px solid #fff;"></span> ${styles.backgroundColor}
                </div>
                ${styles.position !== 'static' ? `
                    <div class="dom-inspector-label-item">
                        <span class="dom-inspector-label-key">T/L:</span> ${styles.top} / ${styles.left}
                    </div>
                ` : ''}
            `;

            label.style.left = `${mouseX + 20}px`;
            label.style.top = `${mouseY + 20}px`;

            document.body.appendChild(label);
            return label;
        };

        const drawMeasurementLines = (elementA, elementB) => {
            const rectA = elementA.getBoundingClientRect();
            const rectB = elementB.getBoundingClientRect();

            const lines = [];

            if (rectA.right < rectB.left) {
                const line = createLine(rectA.right, rectA.top + rectA.height / 2, rectB.left, rectA.top + rectA.height / 2, 'horizontal');
                const distance = Math.round(rectB.left - rectA.right);
                const label = createLineLabel(distance, (rectA.right + rectB.left) / 2, rectA.top + rectA.height / 2);
                lines.push(line, label);
            } else if (rectB.right < rectA.left) {
                const line = createLine(rectB.right, rectB.top + rectB.height / 2, rectA.left, rectB.top + rectB.height / 2, 'horizontal');
                const distance = Math.round(rectA.left - rectB.right);
                const label = createLineLabel(distance, (rectB.right + rectA.left) / 2, rectB.top + rectB.height / 2);
                lines.push(line, label);
            }

            if (rectA.bottom < rectB.top) {
                const line = createLine(rectA.left + rectA.width / 2, rectA.bottom, rectA.left + rectA.width / 2, rectB.top, 'vertical');
                const distance = Math.round(rectB.top - rectA.bottom);
                const label = createLineLabel(distance, rectA.left + rectA.width / 2, (rectA.bottom + rectB.top) / 2);
                lines.push(line, label);
            } else if (rectB.bottom < rectA.top) {
                const line = createLine(rectB.left + rectB.width / 2, rectB.bottom, rectB.left + rectB.width / 2, rectA.top, 'vertical');
                const distance = Math.round(rectA.top - rectB.bottom);
                const label = createLineLabel(distance, rectB.left + rectB.width / 2, (rectB.bottom + rectA.top) / 2);
                lines.push(line, label);
            }

            state.measurementLines = lines;
        };

        const createLine = (x1, y1, x2, y2, direction) => {
            const line = document.createElement('div');
            line.className = 'dom-inspector-line';

            if (direction === 'horizontal') {
                line.style.left = `${Math.min(x1, x2)}px`;
                line.style.top = `${y1 - 1}px`;
                line.style.width = `${Math.abs(x2 - x1)}px`;
                line.style.height = '2px';
            } else {
                line.style.left = `${x1 - 1}px`;
                line.style.top = `${Math.min(y1, y2)}px`;
                line.style.width = '2px';
                line.style.height = `${Math.abs(y2 - y1)}px`;
            }

            document.body.appendChild(line);
            return line;
        };

        const createLineLabel = (distance, x, y) => {
            const label = document.createElement('div');
            label.className = 'dom-inspector-line-label';
            label.textContent = `${distance}px`;
            label.style.left = `${x}px`;
            label.style.top = `${y}px`;
            label.style.transform = 'translate(-50%, -50%)';
            document.body.appendChild(label);
            return label;
        };

        const clearVisuals = () => {
            document.querySelectorAll('.dom-inspector-highlight, .dom-inspector-hover').forEach(el => {
                el.classList.remove('dom-inspector-highlight', 'dom-inspector-hover');
            });

            state.elementLabels.forEach(label => label.remove());
            state.elementLabels = [];

            state.measurementLines.forEach(line => line.remove());
            state.measurementLines = [];
        };

        // ==================== GENERADOR DE PROMPTS ====================
        const generatePrompt = () => {
            if (state.selectedElements.length === 0) {
                return "⚠️ No hay elementos seleccionados.";
            }

            let prompt = "# Instrucción Técnica para IA\n\n";

            state.selectedElements.forEach((element, index) => {
                const selector = getElementSelector(element);
                const dims = getElementDimensions(element);
                const styles = getComputedStyles(element);

                prompt += `## Elemento ${index + 1}: \`${selector}\`\n\n`;

                // Extract text content for easier search
                const text = element.innerText.replace(/\s+/g, ' ').trim().substring(0, 60);
                if (text) {
                    prompt += `**Texto:** "${text}${element.innerText.length > 60 ? '...' : ''}"\n`;
                }

                prompt += `**Dimensiones:** ${dims.width}px × ${dims.height}px\n\n`;

                prompt += `**Espaciado:**\n`;
                prompt += `- Padding: ${styles.padding} (T:${styles.paddingTop} R:${styles.paddingRight} B:${styles.paddingBottom} L:${styles.paddingLeft})\n`;
                prompt += `- Margin: ${styles.margin} (T:${styles.marginTop} R:${styles.marginRight} B:${styles.marginBottom} L:${styles.marginLeft})\n\n`;

                prompt += `**Posición:** ${styles.position}`;
                if (styles.position !== 'static') {
                    prompt += ` (T:${styles.top} L:${styles.left})`;
                }
                prompt += `\n\n`;

                if (styles.display.includes('flex')) {
                    prompt += `**Flexbox:** ${styles.display}, direction:${styles.flexDirection}, justify:${styles.justifyContent}, align:${styles.alignItems}, gap:${styles.gap}\n\n`;
                }

                prompt += `**Estilos Visuales:**\n`;
                prompt += `- Background: \`${styles.backgroundColor}\`\n`;
                prompt += `- Color: \`${styles.color}\`\n`;
                prompt += `- Typography: ${styles.fontSize} ${styles.fontWeight} ${styles.fontFamily}\n\n`;

                if (element.parentElement) {
                    const parentSelector = getElementSelector(element.parentElement);
                    prompt += `**Contexto (Padre):** \`${parentSelector}\`\n\n`;
                }

                prompt += `---\n\n`;
            });

            if (state.selectedElements.length === 2) {
                const rectA = state.selectedElements[0].getBoundingClientRect();
                const rectB = state.selectedElements[1].getBoundingClientRect();

                const horizontalDist = rectA.right < rectB.left
                    ? Math.round(rectB.left - rectA.right)
                    : (rectB.right < rectA.left ? Math.round(rectA.left - rectB.right) : 0);

                const verticalDist = rectA.bottom < rectB.top
                    ? Math.round(rectB.top - rectA.bottom)
                    : (rectB.bottom < rectA.top ? Math.round(rectA.top - rectB.bottom) : 0);

                if (horizontalDist > 0 || verticalDist > 0) {
                    prompt += `## Distancias\n\n`;
                    if (horizontalDist > 0) prompt += `- Horizontal: **${horizontalDist}px**\n`;
                    if (verticalDist > 0) prompt += `- Vertical: **${verticalDist}px**\n`;
                    prompt += `\n---\n\n`;
                }
            }

            return prompt;
        };

        // ==================== EVENT HANDLERS ====================
        const handleMouseMove = (e) => {
            if (!state.isActive) return;

            const element = e.target;

            if (element.closest('.dom-inspector-panel') ||
                element.classList.contains('dom-inspector-label') ||
                element.classList.contains('dom-inspector-line') ||
                element.classList.contains('dom-inspector-line-label')) {
                return;
            }

            if (state.hoveredElement && state.hoveredElement !== element) {
                state.hoveredElement.classList.remove('dom-inspector-hover');
            }

            if (!state.selectedElements.includes(element)) {
                element.classList.add('dom-inspector-hover');
            }

            state.hoveredElement = element;
        };

        const handleClick = (e) => {
            if (!state.isActive) return;

            const element = e.target;

            if (element.closest('.dom-inspector-panel')) return;

            e.preventDefault();
            e.stopPropagation();

            if (element.classList.contains('dom-inspector-label') ||
                element.classList.contains('dom-inspector-line') ||
                element.classList.contains('dom-inspector-line-label')) {
                return;
            }

            element.classList.remove('dom-inspector-hover');

            if (!state.selectedElements.includes(element)) {
                state.selectedElements.push(element);
                element.classList.add('dom-inspector-highlight');

                const label = createLabel(element, e.clientX, e.clientY);
                state.elementLabels.push(label);

                if (state.selectedElements.length === 2) {
                    drawMeasurementLines(state.selectedElements[0], state.selectedElements[1]);
                }

                updatePanel();
            }
        };

        // ==================== PANEL DE CONTROL ====================
        let panel = null;
        let outputDiv = null;

        const createPanel = () => {
            panel = document.createElement('div');
            panel.className = 'dom-inspector-panel';
            panel.innerHTML = `
                <h3>🔍 DOM Inspector Pro</h3>
                <button id="dom-inspector-clear" class="secondary">Limpiar Selección</button>
                <button id="dom-inspector-copy">Copiar Instrucción</button>
                <button id="dom-inspector-close" class="danger">Cerrar</button>
                <div class="dom-inspector-info">
                    Elementos: <span id="dom-inspector-count">0</span>
                </div>
                <div class="dom-inspector-selection-list" id="dom-inspector-list"></div>
                <div class="dom-inspector-output" id="dom-inspector-output"></div>
            `;

            document.body.appendChild(panel);

            document.getElementById('dom-inspector-clear').addEventListener('click', clearSelection);
            document.getElementById('dom-inspector-copy').addEventListener('click', copyPrompt);
            document.getElementById('dom-inspector-close').addEventListener('click', () => toggleInspector());

            outputDiv = document.getElementById('dom-inspector-output');
        };

        const updatePanel = () => {
            document.getElementById('dom-inspector-count').textContent = state.selectedElements.length;

            const listDiv = document.getElementById('dom-inspector-list');
            listDiv.innerHTML = '';

            state.selectedElements.forEach((el, index) => {
                const item = document.createElement('div');
                item.className = 'dom-inspector-selection-item';
                item.textContent = `${index + 1}. ${getElementSelector(el)}`;
                listDiv.appendChild(item);
            });

            if (state.selectedElements.length > 0) {
                outputDiv.textContent = generatePrompt();
            } else {
                outputDiv.textContent = '';
            }
        };

        const clearSelection = () => {
            state.selectedElements = [];
            clearVisuals();
            updatePanel();
        };

        const copyPrompt = () => {
            const prompt = generatePrompt();
            navigator.clipboard.writeText(prompt).then(() => {
                const button = document.getElementById('dom-inspector-copy');
                const original = button.textContent;
                button.textContent = '✓ Copiado!';
                setTimeout(() => {
                    button.textContent = original;
                }, 2000);
            });
        };

        const toggleInspector = () => {
            state.isActive = !state.isActive;

            if (state.isActive) {
                injectStyles();
                createPanel();
                document.body.style.cursor = 'crosshair';
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('click', handleClick, true);
            } else {
                clearSelection();
                document.body.style.cursor = 'default';
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('click', handleClick, true);
                panel?.remove();
                panel = null;
            }
        };

        return {
            toggle: toggleInspector,
            isActive: () => state.isActive
        };
    })();

    return inspector;
}
