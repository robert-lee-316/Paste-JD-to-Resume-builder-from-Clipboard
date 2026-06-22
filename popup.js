document.addEventListener("DOMContentLoaded", async () => {
    const logArea = document.getElementById("logArea");
    const clearButton = document.getElementById("clearButton");

    const scriptUrlInput = document.getElementById("scriptUrlInput");
    const contentTypeSelect = document.getElementById("contentTypeSelect");
    const visualTemplateSelect = document.getElementById("visualTemplateSelect");
    const saveAllSettingsButton = document.getElementById("saveAllSettingsButton");

    await loadSettings();
    await loadLogs();

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") return;

        if (changes.logs) {
            renderLogs(changes.logs.newValue || []);
        }

        if (changes.scriptUrl) {
            scriptUrlInput.value = changes.scriptUrl.newValue || "";
        }

        if (changes.contentType) {
            contentTypeSelect.value = changes.contentType.newValue || "Custom-260226";
        }

        if (changes.visualTemplate) {
            visualTemplateSelect.value = changes.visualTemplate.newValue || "Modern 2";
        }
    });

    saveAllSettingsButton.addEventListener("click", async () => {
        const scriptUrl = scriptUrlInput.value.trim();
        const contentType = contentTypeSelect.value;
        const visualTemplate = visualTemplateSelect.value;

        if (!scriptUrl) {
            appendLocalMessage("Google Apps Script URL cannot be empty.");
            return;
        }

        if (!scriptUrl.startsWith("https://script.google.com/macros/s/")) {
            appendLocalMessage("Invalid Google Apps Script URL.");
            return;
        }

        await chrome.storage.local.set({
            scriptUrl,
            contentType,
            visualTemplate
        });

        appendLocalMessage("Settings saved successfully.");
        appendLocalMessage(`Content Type: ${contentType}`);
        appendLocalMessage(`Visual Template: ${visualTemplate}`);
    });

    clearButton.addEventListener("click", async () => {
        await chrome.runtime.sendMessage({
            type: "CLEAR_LOGS"
        });

        logArea.value = "";
    });

    async function loadSettings() {
        const result = await chrome.storage.local.get([
            "scriptUrl",
            "contentType",
            "visualTemplate"
        ]);

        scriptUrlInput.value = result.scriptUrl || "";
        contentTypeSelect.value = result.contentType || "Custom-260226";
        visualTemplateSelect.value = result.visualTemplate || "Modern 2";
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