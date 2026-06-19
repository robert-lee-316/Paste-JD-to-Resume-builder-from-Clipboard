document.addEventListener("DOMContentLoaded", async () => {
    const logArea = document.getElementById("logArea");
    const clearButton = document.getElementById("clearButton");
    const scriptUrlInput = document.getElementById("scriptUrlInput");
    const saveScriptUrlButton = document.getElementById("saveScriptUrlButton");

    await loadScriptUrl();
    await loadLogs();

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && changes.logs) {
            renderLogs(changes.logs.newValue || []);
        }

        if (areaName === "local" && changes.scriptUrl) {
            scriptUrlInput.value = changes.scriptUrl.newValue || "";
        }
    });

    saveScriptUrlButton.addEventListener("click", async () => {
        const url = scriptUrlInput.value.trim();

        chrome.runtime.sendMessage(
            {
                type: "SAVE_SCRIPT_URL",
                url
            },
            response => {
                if (chrome.runtime.lastError) {
                    appendLocalMessage("Failed to save URL.");
                    return;
                }

                if (response && response.success) {
                    appendLocalMessage("Google Apps Script URL saved.");
                } else {
                    appendLocalMessage(response?.message || "Failed to save URL.");
                }
            }
        );
    });

    clearButton.addEventListener("click", async () => {
        await chrome.runtime.sendMessage({
            type: "CLEAR_LOGS"
        });

        logArea.value = "";
    });

    async function loadScriptUrl() {
        chrome.runtime.sendMessage(
            {
                type: "GET_SCRIPT_URL"
            },
            response => {
                if (chrome.runtime.lastError) {
                    appendLocalMessage("Failed to load Script URL.");
                    return;
                }

                if (response && response.success) {
                    scriptUrlInput.value = response.url || "";
                }
            }
        );
    }

    async function loadLogs() {
        const result = await chrome.storage.local.get(["logs"]);
        renderLogs(result.logs || []);
    }

    function renderLogs(logs) {
        logArea.value = logs.join("\n");
        logArea.scrollTop = logArea.scrollHeight;
    }

    function appendLocalMessage(message) {
        const time = new Date().toLocaleTimeString();
        logArea.value += `[${time}] ${message}\n`;
        logArea.scrollTop = logArea.scrollHeight;
    }
});
