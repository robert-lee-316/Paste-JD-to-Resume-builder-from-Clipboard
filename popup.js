document.addEventListener("DOMContentLoaded", async () => {
    const logArea = document.getElementById("logArea");
    const clearButton = document.getElementById("clearButton");

    const scriptUrlInput = document.getElementById("scriptUrlInput");
    const contentTypeSelect = document.getElementById("contentTypeSelect");
    const visualTemplateSelect = document.getElementById("visualTemplateSelect");
    const saveAllSettingsButton = document.getElementById("saveAllSettingsButton");
    const saveResult = document.getElementById("saveResult");

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
            showSaveResult("Google Apps Script URL cannot be empty.", "error");
            appendLocalMessage("Google Apps Script URL cannot be empty.");
            return;
        }

        if (!scriptUrl.startsWith("https://script.google.com/macros/s/")) {
            showSaveResult("Invalid Google Apps Script URL.", "error");
            appendLocalMessage("Invalid Google Apps Script URL.");
            return;
        }

        try {
            await chrome.storage.local.set({
                scriptUrl,
                contentType,
                visualTemplate
            });

            appendLocalMessage("Settings saved successfully.");
            appendLocalMessage(`Content Type: ${contentType}`);
            appendLocalMessage(`Visual Template: ${visualTemplate}`);

            await applySettingsToCurrentPage(contentType, visualTemplate);

            showSaveResult(
                `Saved and selected: ${contentType} / ${visualTemplate}`,
                "success"
            );

        } catch (error) {
            showSaveResult("Failed to save/apply settings.", "error");
            appendLocalMessage("Failed to save/apply settings.");
            console.error(error);
        }
    });

    clearButton.addEventListener("click", async () => {
        await chrome.runtime.sendMessage({
            type: "CLEAR_LOGS"
        });

        logArea.value = "";
    });

    async function applySettingsToCurrentPage(contentType, visualTemplate) {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (!tab || !tab.id) {
            appendLocalMessage("No active tab found.");
            return;
        }

        if (!tab.url || !tab.url.startsWith("https://resume.softloom.tech/generate")) {
            appendLocalMessage("Open resume.softloom.tech/generate to apply UI settings.");
            showSaveResult("Saved, but open Resume Builder page to apply UI.", "error");
            return;
        }

        chrome.tabs.sendMessage(
            tab.id,
            {
                type: "APPLY_TEMPLATE_SETTINGS",
                contentType,
                visualTemplate
            },
            response => {
                if (chrome.runtime.lastError) {
                    appendLocalMessage("Please refresh the Resume Builder page and try again.");
                    showSaveResult("Saved, but page needs refresh.", "error");
                    return;
                }

                if (response && response.success) {
                    appendLocalMessage("Content Type and Visual Template selected on page.");
                } else {
                    appendLocalMessage(response?.message || "Failed to select settings on page.");
                }
            }
        );
    }

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

    function showSaveResult(message, type) {
        saveResult.textContent = message;
        saveResult.className = `save-result ${type}`;

        setTimeout(() => {
            saveResult.style.display = "none";
            saveResult.textContent = "";
            saveResult.className = "save-result";
        }, 3000);
    }
});