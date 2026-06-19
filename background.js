const DEFAULT_SCRIPT_URL = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === "SEND_TO_SHEET") {
        sendToSheet(message.payload)
            .then(result => {
                sendResponse({
                    success: true,
                    result
                });
            })
            .catch(error => {
                sendResponse({
                    success: false,
                    message: error.message || "Failed to connect to Google Apps Script"
                });
            });

        return true;
    }

    if (message.type === "ADD_LOG") {
        addLog(message.message);
        sendResponse({ success: true });
        return true;
    }

    if (message.type === "CLEAR_LOGS") {
        chrome.storage.local.set({ logs: [] });
        sendResponse({ success: true });
        return true;
    }

    if (message.type === "SAVE_SCRIPT_URL") {
        saveScriptUrl(message.url)
            .then(() => sendResponse({ success: true }))
            .catch(error => {
                sendResponse({
                    success: false,
                    message: error.message
                });
            });

        return true;
    }

    if (message.type === "GET_SCRIPT_URL") {
        getScriptUrl()
            .then(url => {
                sendResponse({
                    success: true,
                    url
                });
            })
            .catch(error => {
                sendResponse({
                    success: false,
                    message: error.message
                });
            });

        return true;
    }
});

async function sendToSheet(data) {
    const scriptUrl = await getScriptUrl();

    if (!scriptUrl) {
        throw new Error("Google Apps Script URL is empty. Please set it in the extension popup.");
    }

    await addLog("Sending data to Google Sheet...");
    await addLog("Using Script URL: " + scriptUrl);

    const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
        redirect: "follow"
    });

    const text = await response.text();

    await addLog("Google Apps Script response: " + text);

    try {
        return JSON.parse(text);
    } catch (err) {
        throw new Error("Server returned invalid JSON: " + text);
    }
}

async function saveScriptUrl(url) {
    const cleanUrl = String(url || "").trim();

    if (!cleanUrl) {
        throw new Error("Script URL cannot be empty.");
    }

    if (!cleanUrl.startsWith("https://script.google.com/macros/s/")) {
        throw new Error("Invalid Google Apps Script URL.");
    }

    await chrome.storage.local.set({
        scriptUrl: cleanUrl
    });

    await addLog("Google Apps Script URL saved.");
}

async function getScriptUrl() {
    const result = await chrome.storage.local.get(["scriptUrl"]);
    return result.scriptUrl || DEFAULT_SCRIPT_URL;
}

async function addLog(message) {
    const time = new Date().toLocaleTimeString();

    const result = await chrome.storage.local.get(["logs"]);
    const logs = result.logs || [];

    logs.push(`[${time}] ${message}`);

    if (logs.length > 300) {
        logs.shift();
    }

    await chrome.storage.local.set({ logs });
}
