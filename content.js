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

            setInputValue("#companyName", data.companyName);
            setInputValue("#jobRole", data.jobTitle);
            setInputValue('input[type="url"]', data.jobLink);

            setTextareaValue(
                '#jobDescription, textarea[placeholder="Paste the job description here..."], textarea[rows="6"]',
                data.JD || data.jobDescription || data.description
            );

            setEasyApplyCheckbox(data.method);

            const settings = await getTemplateSettings();

            selectContentType(settings.contentType);
            selectVisualTemplate(settings.visualTemplate);

            log("Form fields filled.");

            await wait(300);

            const checkedLabels = getCheckedTechStackLabels();

            data.labels = checkedLabels;
            data.labelsText = checkedLabels.join(", ");

            log("Tech Stack labels: " + (data.labelsText || "None"));

            // const response = await chrome.runtime.sendMessage({
            //     type: "SEND_TO_SHEET",
            //     payload: data
            // });

            if (!response || !response.success) {
                const message = response?.message || "Failed to send data.";
                log(message);
                alert("❌ " + message);
                return;
            }

            const result = response.result;

            if (result.success) {
                log(result.message || "Saved to Google Sheet successfully.");
                await clickGenerateResume();
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

    async function getTemplateSettings() {
        const result = await chrome.storage.local.get([
            "contentType",
            "visualTemplate"
        ]);

        return {
            contentType: result.contentType || "Custom-260226",
            visualTemplate: result.visualTemplate || "Modern 2"
        };
    }

    function selectContentType(contentType) {
        const targetText = contentType || "Custom-260226";

        const radioButtons = [
            ...document.querySelectorAll('button[role="radio"][id^="content-type-"]')
        ];

        const targetRadio = radioButtons.find(radio => {
            const label = document.querySelector(`label[for="${escapeCss(radio.id)}"]`);

            if (!label) return false;

            const title =
                label.querySelector(".text-foreground")?.textContent?.trim() ||
                label.textContent?.trim();

            return title && title.includes(targetText);
        });

        if (!targetRadio) {
            log(`Content Type not found: ${targetText}`);
            return;
        }

        const isChecked =
            targetRadio.getAttribute("aria-checked") === "true" ||
            targetRadio.getAttribute("data-state") === "checked";

        if (!isChecked) {
            targetRadio.click();
            log(`Selected Content Type: ${targetText}`);
        } else {
            log(`Content Type already selected: ${targetText}`);
        }
    }

    function selectVisualTemplate(visualTemplate) {
        const targetText = visualTemplate || "Modern 2";

        const buttons = [...document.querySelectorAll('button[type="button"]')];

        const targetButton = buttons.find(button => {
            const title = button.querySelector("p.font-medium")?.textContent?.trim();
            return title === targetText;
        });

        if (!targetButton) {
            log(`Visual Template not found: ${targetText}`);
            return;
        }

        const card = targetButton.querySelector('[data-slot="card"]');

        const isSelected =
            card?.className?.includes("border-primary") ||
            !!targetButton.querySelector("svg.lucide-check");

        if (!isSelected) {
            targetButton.click();
            log(`Selected Visual Template: ${targetText}`);
        } else {
            log(`Visual Template already selected: ${targetText}`);
        }
    }

    function setEasyApplyCheckbox(method) {
        const switchButton = document.querySelector(
            '#easy-apply, button[role="switch"][id="easy-apply"]'
        );

        if (!switchButton) {
            log("Easy Apply switch not found.");
            return;
        }

        const normalizedMethod = String(method || "").trim();

        let shouldCheck = false;

        if (normalizedMethod === "Easy Apply") {
            shouldCheck = true;
        }

        if (normalizedMethod === "Apply") {
            shouldCheck = false;
        }

        const isChecked =
            switchButton.getAttribute("aria-checked") === "true" ||
            switchButton.getAttribute("data-state") === "checked";

        if (isChecked !== shouldCheck) {
            switchButton.click();
            log(`Easy Apply switch changed to: ${shouldCheck ? "ON" : "OFF"}`);
        } else {
            log(`Easy Apply switch already ${shouldCheck ? "ON" : "OFF"}`);
        }
    }

    function getCheckedTechStackLabels() {
        const checkedButtons = [
            ...document.querySelectorAll(
                'button[role="checkbox"][id^="tech-stack-"][aria-checked="true"], button[role="checkbox"][id^="tech-stack-"][data-state="checked"]'
            )
        ];

        const labels = checkedButtons
            .map(button => {
                const id = button.id;
                const label = document.querySelector(`label[for="${escapeCss(id)}"]`);
                return label?.textContent?.trim();
            })
            .filter(Boolean);

        return labels;
    }

    async function clickGenerateResume() {
        await wait(800);

        const buttons = [...document.querySelectorAll("button")];

        const generateButton = buttons.find(button =>
            button.textContent.trim().includes("Generate Resume")
        );

        if (!generateButton) {
            log("Generate Resume button not found.");
            return;
        }

        if (generateButton.disabled || generateButton.getAttribute("aria-disabled") === "true") {
            log("Generate Resume button is disabled.");
            return;
        }

        log("Clicking Generate Resume button.");
        generateButton.click();
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
        el.dispatchEvent(new Event("blur", { bubbles: true }));
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function escapeCss(value) {
        if (window.CSS && typeof window.CSS.escape === "function") {
            return window.CSS.escape(value);
        }

        return String(value).replace(/["\\]/g, "\\$&");
    }

    function log(message) {
        console.log("[Resume Builder Tool]", message);

        try {
            chrome.runtime.sendMessage({
                type: "ADD_LOG",
                message
            }, () => {
                if (chrome.runtime.lastError) {
                    console.warn("[Resume Builder Tool] Log send failed:", chrome.runtime.lastError.message);
                }
            });
        } catch (err) {
            console.warn("[Resume Builder Tool] Log error:", err);
        }
    }
})();