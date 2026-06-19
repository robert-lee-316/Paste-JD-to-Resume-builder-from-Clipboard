(function () {
    "use strict";

    const BUTTON_ID = "resume-builder-fixed-button";

    createFixedButton();

    document.addEventListener("keydown", async function (e) {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "v") {
            e.preventDefault();
            await runResumeBuilderTool();
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message || !message.type) return;

        if (message.type === "RUN_RESUME_BUILDER_TOOL") {
            runResumeBuilderTool()
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch(error => {
                    log("Error: " + error.message);
                    sendResponse({
                        success: false,
                        message: error.message
                    });
                });

            return true;
        }
    });

    function createFixedButton() {
        if (document.getElementById(BUTTON_ID)) {
            return;
        }

        const style = document.createElement("style");
        style.textContent = `
            #${BUTTON_ID} {
                position: fixed;
                right: 24px;
                bottom: 48px;
                z-index: 2147483647;

                width: 58px;
                height: 58px;
                border: none;
                border-radius: 50%;

                display: flex;
                align-items: center;
                justify-content: center;

                background:
                    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.35), transparent 32%),
                    linear-gradient(135deg, #3b82f6 0%, #7c3aed 55%, #9333ea 100%);

                color: #ffffff;
                font-size: 26px;
                cursor: pointer;

                box-shadow:
                    0 18px 36px rgba(59, 130, 246, 0.35),
                    0 8px 16px rgba(124, 58, 237, 0.22),
                    inset 0 1px 0 rgba(255, 255, 255, 0.35);

                transition:
                    transform 0.18s ease,
                    box-shadow 0.18s ease,
                    filter 0.18s ease;

                user-select: none;
                -webkit-user-select: none;
            }

            #${BUTTON_ID}:hover {
                transform: translateY(-3px) scale(1.06);
                filter: brightness(1.06);
                box-shadow:
                    0 22px 44px rgba(59, 130, 246, 0.45),
                    0 12px 22px rgba(124, 58, 237, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.45);
            }

            #${BUTTON_ID}:active {
                transform: translateY(0) scale(0.95);
                box-shadow:
                    0 10px 22px rgba(59, 130, 246, 0.35),
                    0 5px 12px rgba(124, 58, 237, 0.25),
                    inset 0 2px 6px rgba(15, 23, 42, 0.18);
            }

            #${BUTTON_ID}::after {
                content: "Generate && Append";
                position: absolute;
                right: 70px;
                top: 50%;
                transform: translateY(-50%) translateX(8px);

                padding: 8px 11px;
                border-radius: 9px;

                background: #0f172a;
                color: #ffffff;

                font-size: 12px;
                font-weight: 700;
                font-family: Arial, sans-serif;
                white-space: nowrap;

                opacity: 0;
                pointer-events: none;

                box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
                transition: all 0.18s ease;
            }

            #${BUTTON_ID}:hover::after {
                opacity: 1;
                transform: translateY(-50%) translateX(0);
            }
        `;

        document.head.appendChild(style);

        const button = document.createElement("button");
        button.id = BUTTON_ID;
        button.type = "button";
        button.textContent = "📋";
        button.title = "Generate && Append";

        button.addEventListener("click", async () => {
            await runResumeBuilderTool();
        });

        document.body.appendChild(button);
    }

    async function runResumeBuilderTool() {
        try {
            log("Reading clipboard...");

            const text = await navigator.clipboard.readText();

            let data;

            try {
                data = JSON.parse(text);
            } catch (err) {
                log("Clipboard is not valid JSON.");
                alert("Clipboard is not valid JSON.");
                return;
            }

            log("Clipboard JSON parsed successfully.");

            setInputValue('input[id="companyName"]', data.companyName);
            setInputValue('input[id="jobRole"]', data.jobTitle);
            setInputValue('input[type="url"]', data.jobLink);
            setTextareaValue('textarea[rows="8"]', data.JD);

            setEasyApplyCheckbox(data.method);
            selectResumeStyle();
            selectResumeVisualType();

            log("Form fields filled.");

            await wait(150);

            const checkedLabels = getCheckedTechStackLabels();

            data.labels = checkedLabels;
            data.labelsText = checkedLabels.join(", ");

            log("Tech Stack labels: " + (data.labelsText || "None"));

            const response = await chrome.runtime.sendMessage({
                type: "SEND_TO_SHEET",
                payload: data
            });

            if (!response || !response.success) {
                const message = response?.message || "Failed to send data.";
                log(message);
                alert("❌ " + message);
                return;
            }

            const result = response.result;

            if (result.success) {
                log(result.message || "Saved to Google Sheet successfully.");
                clickGenerateResume();
            } else {
                log(result.message || "Google Sheet save failed.");
                alert("❌ " + result.message);
            }

        } catch (err) {
            console.error(err);
            log("Error: " + err.message);
            alert("Error: " + err.message);
        }
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function clickGenerateResume() {
        const buttons = document.querySelectorAll("button");

        for (const button of buttons) {
            if (button.textContent.trim().includes("Generate Resume")) {
                if (!button.disabled) {
                    log("Clicking Generate Resume button.");
                    button.click();
                } else {
                    log("Generate Resume button is disabled.");
                }

                return;
            }
        }

        log("Generate Resume button not found.");
    }

    function selectResumeStyle() {
        const labels = document.querySelectorAll("label");

        for (const label of labels) {
            if (label.textContent.includes("Custom-260226")) {
                const radio = label.querySelector('input[type="radio"]');

                if (radio && !radio.checked) {
                    radio.click();
                    log("Selected resume style: Custom-260226.");
                }

                return;
            }
        }

        log("Resume style Custom-260226 not found.");
    }

    function selectResumeVisualType() {
        const select = document.querySelector("#resume-visual-type");

        if (!select) {
            log("Resume visual type select not found.");
            return;
        }

        setNativeValue(select, "modern2");
        log("Selected resume visual type: modern2.");
    }

    function setEasyApplyCheckbox(method) {
        const labels = document.querySelectorAll("label");

        for (const label of labels) {
            if (label.textContent.trim().includes("Easy Apply")) {
                const checkbox = label.querySelector('input[type="checkbox"]');

                if (!checkbox) {
                    log("Easy Apply checkbox input not found.");
                    return;
                }

                const shouldCheck = method === "Easy Apply";

                if (checkbox.checked !== shouldCheck) {
                    checkbox.click();
                }

                log("Easy Apply checkbox set to: " + shouldCheck);
                return;
            }
        }

        log("Easy Apply checkbox not found.");
    }

    function getCheckedTechStackLabels() {
        const techStackSection = [...document.querySelectorAll("label")]
            .find(label => label.textContent.trim() === "Tech Stack")
            ?.parentElement;

        if (!techStackSection) {
            log("Tech Stack section not found.");
            return [];
        }

        return [...techStackSection.querySelectorAll('input[type="checkbox"]:checked')]
            .map(checkbox =>
                checkbox.closest("label")
                    ?.querySelector("span.min-w-0")
                    ?.textContent
                    ?.trim()
            )
            .filter(Boolean);
    }

    function setInputValue(selector, value) {
        const el = document.querySelector(selector);

        if (!el || value === undefined || value === null) {
            log("Input not found or value empty: " + selector);
            return;
        }

        el.focus();
        setNativeValue(el, value);
    }

    function setTextareaValue(selector, value) {
        const el = document.querySelector(selector);

        if (!el || value === undefined || value === null) {
            log("Textarea not found or value empty: " + selector);
            return;
        }

        el.focus();
        setNativeValue(el, value);
    }

    function setNativeValue(el, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(el, "value")?.set;

        const prototype = Object.getPrototypeOf(el);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(el, value);
        } else if (valueSetter) {
            valueSetter.call(el, value);
        } else {
            el.value = value;
        }

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function log(message) {
        console.log("[Resume Builder Tool]", message);

        chrome.runtime.sendMessage({
            type: "ADD_LOG",
            message
        });
    }
})();
