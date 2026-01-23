// Helper to execute script and retry message
async function ensureContentScriptAndSendMessage(tabId, message) {
    try {
        // Try sending message first
        const response = await chrome.tabs.sendMessage(tabId, message).catch(() => null);
        if (response) return response;

        // If failed, inject script and retry
        // Verify we have permissions first (avoid scripting execution on restricted urls)
        // Note: 'activeTab' permission handles most cases, but chrome:// urls will fail.

        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });

        // Retry message after injection
        // Give a tiny execution window for the listener to register
        await new Promise(r => setTimeout(r, 50));
        return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
        console.error("Connection failed:", error);
        return { error: true, details: error.message };
    }
}

document.getElementById('toggleBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
        document.querySelector('.status').textContent = '⚠️ Página restringida';
        return;
    }

    const response = await ensureContentScriptAndSendMessage(tab.id, { action: 'toggleInspector' });

    if (response && response.isActive !== undefined) {
        updateUI(response.isActive);
    } else if (response && response.error) {
        document.querySelector('.status').textContent = '⚠️ Error: Refresca la página';
    }
});

function updateUI(isActive) {
    const btn = document.getElementById('toggleBtn');
    const statusSpan = document.querySelector('.status');

    if (isActive) {
        btn.textContent = 'Desactivar Inspector';
        btn.classList.add('active');
        statusSpan.textContent = 'Activo ✓';
        statusSpan.classList.remove('inactive');
        statusSpan.classList.add('active');
    } else {
        btn.textContent = 'Activar Inspector';
        btn.classList.remove('active');
        statusSpan.textContent = 'Inactivo';
        statusSpan.classList.remove('active');
        statusSpan.classList.add('inactive');
    }
}

// Check status on popup open
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (!tabs[0] || tabs[0].url.startsWith('chrome://')) return;

    try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' });
        if (response && response.isActive !== undefined) {
            updateUI(response.isActive);
        }
    } catch (e) {
        // Ignore errors on initial check - script might not be there yet/page not ready
        console.log("Initial check failed (expected if script not injected):", e);
    }
});
