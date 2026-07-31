/**
 * Ghép Câu & Luyện AI - Main Client Application Logic
 * Pure client-side static web application with Gemini & OpenAI API integration, Excel & History
 */

document.addEventListener('DOMContentLoaded', () => {
    // LocalStorage Keys
    const LS_GEMINI_KEY = 'gemini_api_key';
    const LS_OPENAI_KEY = 'openai_api_key';
    const LS_HISTORY_KEY = 'ghepcau_history_list';

    // State Variables
    let currentQuestions = [];
    let userAnswers = {};
    let lastPrompt = '';
    let lastEvaluations = null;

    // DOM Elements - Key Modal
    const keyModal = document.getElementById('key-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const openaiKeyInput = document.getElementById('openai-key-input');
    const btnToggleKeyModal = document.getElementById('btn-toggle-key-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSaveKey = document.getElementById('btn-save-key');
    const btnClearKey = document.getElementById('btn-clear-key');
    const btnToggleShowKey = document.getElementById('btn-toggle-show-key');
    const btnToggleShowOpenAIKey = document.getElementById('btn-toggle-show-openai-key');
    const keyStatusText = document.getElementById('key-status-text');
    const keyStatusDot = document.getElementById('key-status-dot');
    const geminiBadgeStatus = document.getElementById('gemini-badge-status');
    const openaiBadgeStatus = document.getElementById('openai-badge-status');

    // DOM Elements - History Modal
    const historyModal = document.getElementById('history-modal');
    const btnOpenHistory = document.getElementById('btn-open-history');
    const btnCloseHistoryModal = document.getElementById('btn-close-history-modal');
    const btnCloseHistoryFooter = document.getElementById('btn-close-history-footer');
    const btnClearHistoryAll = document.getElementById('btn-clear-history-all');
    const historyListContainer = document.getElementById('history-list-container');
    const historyCountBadge = document.getElementById('history-count-badge');
    const btnSaveToHistory = document.getElementById('btn-save-to-history');

    // DOM Elements - Excel Export Modal
    const excelExportModal = document.getElementById('excel-export-modal');
    const btnCloseExportModal = document.getElementById('btn-close-export-modal');
    const btnExportNoAnswers = document.getElementById('btn-export-no-answers');
    const btnExportWithAnswers = document.getElementById('btn-export-with-answers');

    // DOM Elements - Sections
    const promptSection = document.getElementById('prompt-section');
    const quizSection = document.getElementById('quiz-section');
    const resultsSection = document.getElementById('results-section');
    const loadingSpinner = document.getElementById('loading-spinner');
    const loadingTitle = document.getElementById('loading-title');
    const loadingSub = document.getElementById('loading-sub');
    const errorBanner = document.getElementById('error-banner');
    const errorTitle = document.getElementById('error-title');
    const errorMsg = document.getElementById('error-msg');
    const btnDismissError = document.getElementById('btn-dismiss-error');

    // DOM Elements - Generator & Excel
    const generatorForm = document.getElementById('generator-form');
    const promptInput = document.getElementById('prompt-input');
    const modelSelect = document.getElementById('model-select');
    const btnGenerate = document.getElementById('btn-generate');
    const btnImportExcel = document.getElementById('btn-import-excel');
    const excelFileInput = document.getElementById('excel-file-input');
    const btnExportQuestionsExcel = document.getElementById('btn-export-questions-excel');
    const btnExportResultsExcel = document.getElementById('btn-export-results-excel');

    // DOM Elements - Quiz Form
    const answersForm = document.getElementById('answers-form');
    const quizTopicTitle = document.getElementById('quiz-topic-title');
    const quizQuestionCount = document.getElementById('quiz-question-count');
    const questionsContainer = document.getElementById('questions-container');
    const btnResetQuiz = document.getElementById('btn-reset-quiz');
    const btnSubmitAnswers = document.getElementById('btn-submit-answers');

    // DOM Elements - Results Section
    const overallScoreBadge = document.getElementById('overall-score-badge');
    const overallScoreNum = document.getElementById('overall-score-num');
    const overallHeadline = document.getElementById('overall-headline');
    const overallFeedbackText = document.getElementById('overall-feedback-text');
    const evaluationsContainer = document.getElementById('evaluations-container');
    const btnRetrySame = document.getElementById('btn-retry-same');
    const btnCreateNew = document.getElementById('btn-create-new');

    /* ==========================================================================
       1. API Keys & Dynamic Model Select Logic
       ========================================================================== */
    function getStoredGeminiKey() {
        return localStorage.getItem(LS_GEMINI_KEY) || '';
    }

    function getStoredOpenAIKey() {
        return localStorage.getItem(LS_OPENAI_KEY) || '';
    }

    function updateKeyStatusUI() {
        const geminiKey = getStoredGeminiKey();
        const openaiKey = getStoredOpenAIKey();

        const hasGemini = geminiKey && geminiKey.trim().length > 10;
        const hasOpenAI = openaiKey && openaiKey.trim().length > 10;

        // Update modal badges
        if (hasGemini) {
            geminiBadgeStatus.textContent = 'Đã lưu';
            geminiBadgeStatus.className = 'key-tag-badge valid';
            apiKeyInput.value = geminiKey;
        } else {
            geminiBadgeStatus.textContent = 'Chưa lưu';
            geminiBadgeStatus.className = 'key-tag-badge invalid';
            apiKeyInput.value = '';
        }

        if (hasOpenAI) {
            openaiBadgeStatus.textContent = 'Đã lưu';
            openaiBadgeStatus.className = 'key-tag-badge valid';
            openaiKeyInput.value = openaiKey;
        } else {
            openaiBadgeStatus.textContent = 'Chưa lưu';
            openaiBadgeStatus.className = 'key-tag-badge invalid';
            openaiKeyInput.value = '';
        }

        // Update Header Button Status
        if (hasGemini && hasOpenAI) {
            keyStatusText.textContent = 'Gemini & OpenAI API';
            keyStatusDot.className = 'dot dot-valid';
        } else if (hasGemini) {
            keyStatusText.textContent = 'Gemini API (Đã cài)';
            keyStatusDot.className = 'dot dot-valid';
        } else if (hasOpenAI) {
            keyStatusText.textContent = 'OpenAI API (Đã cài)';
            keyStatusDot.className = 'dot dot-valid';
        } else {
            keyStatusText.textContent = 'Chưa nhập API Key';
            keyStatusDot.className = 'dot dot-invalid';
        }

        // Rebuild dynamic Model Select options
        updateModelSelectOptions(hasGemini, hasOpenAI);
    }

    function updateModelSelectOptions(hasGemini, hasOpenAI) {
        modelSelect.innerHTML = '';

        if (!hasGemini && !hasOpenAI) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = '⚠️ Chưa nhập API Key (Bấm vào nút Key ở góc phải để nhập)';
            modelSelect.appendChild(opt);
            return;
        }

        if (hasGemini) {
            const group = document.createElement('optgroup');
            group.label = 'Google Gemini';

            const opt1 = document.createElement('option');
            opt1.value = 'gemini-2.5-flash';
            opt1.textContent = 'Gemini 2.5 Flash (Khuyên dùng - Nhanh & Mới nhất)';

            const opt2 = document.createElement('option');
            opt2.value = 'gemini-1.5-flash';
            opt2.textContent = 'Gemini 1.5 Flash (Ổn định)';

            group.appendChild(opt1);
            group.appendChild(opt2);
            modelSelect.appendChild(group);
        }

        if (hasOpenAI) {
            const group = document.createElement('optgroup');
            group.label = 'OpenAI';

            const opt1 = document.createElement('option');
            opt1.value = 'gpt-4o-mini';
            opt1.textContent = 'GPT-4o Mini (Nhanh & Tiết kiệm)';

            const opt2 = document.createElement('option');
            opt2.value = 'gpt-4o';
            opt2.textContent = 'GPT-4o (Thông minh & Chính xác nhất)';

            const opt3 = document.createElement('option');
            opt3.value = 'gpt-3.5-turbo';
            opt3.textContent = 'GPT-3.5 Turbo (Cơ bản)';

            group.appendChild(opt1);
            group.appendChild(opt2);
            group.appendChild(opt3);
            modelSelect.appendChild(group);
        }
    }

    function openKeyModal() {
        keyModal.classList.remove('hidden');
        apiKeyInput.focus();
    }

    function closeKeyModal() {
        keyModal.classList.add('hidden');
    }

    btnToggleKeyModal.addEventListener('click', openKeyModal);
    btnCloseModal.addEventListener('click', closeKeyModal);

    btnSaveKey.addEventListener('click', () => {
        const geminiVal = apiKeyInput.value.trim();
        const openaiVal = openaiKeyInput.value.trim();

        if (geminiVal) localStorage.setItem(LS_GEMINI_KEY, geminiVal);
        else localStorage.removeItem(LS_GEMINI_KEY);

        if (openaiVal) localStorage.setItem(LS_OPENAI_KEY, openaiVal);
        else localStorage.removeItem(LS_OPENAI_KEY);

        updateKeyStatusUI();
        closeKeyModal();
        hideError();
    });

    btnClearKey.addEventListener('click', () => {
        localStorage.removeItem(LS_GEMINI_KEY);
        localStorage.removeItem(LS_OPENAI_KEY);
        updateKeyStatusUI();
        closeKeyModal();
    });

    btnToggleShowKey.addEventListener('click', () => {
        const currentType = apiKeyInput.getAttribute('type');
        apiKeyInput.setAttribute('type', currentType === 'password' ? 'text' : 'password');
        btnToggleShowKey.innerHTML = currentType === 'password' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    btnToggleShowOpenAIKey.addEventListener('click', () => {
        const currentType = openaiKeyInput.getAttribute('type');
        openaiKeyInput.setAttribute('type', currentType === 'password' ? 'text' : 'password');
        btnToggleShowOpenAIKey.innerHTML = currentType === 'password' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    /* ==========================================================================
       2. Error Handling & Loading Helpers
       ========================================================================== */
    function showError(title, message) {
        errorTitle.textContent = title;
        errorMsg.textContent = message;
        errorBanner.classList.remove('hidden');
    }

    function hideError() {
        errorBanner.classList.add('hidden');
    }

    btnDismissError.addEventListener('click', hideError);

    function showLoading(title, sub) {
        loadingTitle.textContent = title || 'Đang xử lý...';
        loadingSub.textContent = sub || 'Vui lòng chờ trong giây lát';
        loadingSpinner.classList.remove('hidden');
    }

    function hideLoading() {
        loadingSpinner.classList.add('hidden');
    }

    /* ==========================================================================
       3. Robust JSON Parsing & Repair Helper
       ========================================================================== */
    function parseAIJsonResponse(rawText) {
        if (!rawText) throw new Error('Không nhận được dữ liệu từ AI API.');

        let cleaned = rawText.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
        }

        try {
            return JSON.parse(cleaned);
        } catch (e1) {
            const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch (e2) {}
            }

            let sanitized = cleaned.replace(/[\u0000-\u001F]+/g, (char) => {
                if (char === '\n') return '\\n';
                if (char === '\r') return '\\r';
                if (char === '\t') return '\\t';
                return '';
            });

            sanitized = sanitized.replace(/,\s*([\}\]])/g, '$1');

            try {
                return JSON.parse(sanitized);
            } catch (e3) {
                const repaired = autoCloseJSON(sanitized);
                try {
                    return JSON.parse(repaired);
                } catch (e4) {
                    console.error("Failed parsing AI output:", rawText);
                    throw new Error('Dữ liệu AI trả về chưa đúng định dạng JSON chuẩn. Chi tiết: ' + rawText.substring(0, 120));
                }
            }
        }
    }

    function autoCloseJSON(str) {
        let openBrackets = [];
        let inString = false;
        let isEscaped = false;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (isEscaped) {
                isEscaped = false;
                continue;
            }
            if (char === '\\') {
                isEscaped = true;
                continue;
            }
            if (char === '"') {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (char === '{' || char === '[') {
                    openBrackets.push(char);
                } else if (char === '}' || char === ']') {
                    openBrackets.pop();
                }
            }
        }

        let result = str;
        if (inString) {
            result += '"';
        }
        while (openBrackets.length > 0) {
            const last = openBrackets.pop();
            result += (last === '{' ? '}' : ']');
        }
        return result;
    }

    /* ==========================================================================
       4. Unified AI LLM API Call Helper (Gemini / OpenAI Router)
       ========================================================================== */
    async function callLLMAPI(systemInstruction, userPrompt, model, responseSchema = null) {
        if (!model) {
            openKeyModal();
            throw new Error('Chưa có API Key nào được cài đặt. Vui lòng nhập Gemini hoặc OpenAI API Key để tiếp tục.');
        }

        if (model.startsWith('gemini')) {
            return await callGeminiAPI(systemInstruction, userPrompt, model, responseSchema);
        } else if (model.startsWith('gpt')) {
            return await callOpenAIAPI(systemInstruction, userPrompt, model);
        } else {
            throw new Error(`Mô hình "${model}" không được hỗ trợ.`);
        }
    }

    // Google Gemini API Call
    async function callGeminiAPI(systemInstruction, userPrompt, model, responseSchema) {
        const apiKey = getStoredGeminiKey();
        if (!apiKey) {
            openKeyModal();
            throw new Error('Bạn chưa cài đặt Gemini API Key. Vui lòng mở nút Key để nhập.');
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const generationConfig = {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
        };

        if (responseSchema) {
            generationConfig.responseSchema = responseSchema;
        }

        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: systemInstruction + '\n\n' + userPrompt }
                    ]
                }
            ],
            generationConfig: generationConfig
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Lỗi HTTP Gemini API ${response.status}: ${response.statusText}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.[0]?.text) {
            throw new Error('Phản hồi từ Gemini API rỗng hoặc bị chặn bởi bộ lọc an toàn.');
        }

        return candidate.content.parts[0].text;
    }

    // OpenAI API Call
    async function callOpenAIAPI(systemInstruction, userPrompt, model) {
        const apiKey = getStoredOpenAIKey();
        if (!apiKey) {
            openKeyModal();
            throw new Error('Bạn chưa cài đặt OpenAI API Key. Vui lòng mở nút Key để nhập.');
        }

        const endpoint = 'https://api.openai.com/v1/chat/completions';

        const payload = {
            model: model,
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Lỗi OpenAI API HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const contentText = data.choices?.[0]?.message?.content;
        if (!contentText) {
            throw new Error('Phản hồi từ OpenAI API rỗng.');
        }

        return contentText;
    }

    /* ==========================================================================
       5. Generate Questions Flow
       ========================================================================== */
    const questionGenerationSchema = {
        type: "OBJECT",
        properties: {
            topic: { type: "STRING" },
            questions: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        id: { type: "INTEGER" },
                        type: { type: "STRING" },
                        question: { type: "STRING" },
                        options: {
                            type: "OBJECT",
                            properties: {
                                A: { type: "STRING" },
                                B: { type: "STRING" },
                                C: { type: "STRING" },
                                D: { type: "STRING" }
                            }
                        },
                        hint: { type: "STRING" }
                    },
                    required: ["id", "type", "question"]
                }
            }
        },
        required: ["topic", "questions"]
    };

    generatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const promptText = promptInput.value.trim();
        if (!promptText) {
            showError('Thiếu câu lệnh', 'Vui lòng nhập yêu cầu (prompt) để AI tạo câu hỏi.');
            return;
        }

        const selectedModel = modelSelect.value;
        if (!selectedModel) {
            openKeyModal();
            showError('Thiếu API Key', 'Bạn chưa cài đặt API Key nào. Vui lòng nhập Gemini hoặc OpenAI API Key.');
            return;
        }

        lastPrompt = promptText;

        const systemPrompt = `Bạn là một chuyên gia giáo dục xuất sắc. Nhiệm vụ của bạn là dựa theo yêu cầu người dùng để tạo ra danh sách câu hỏi.
Bạn hãy TỰ ĐỘNG PHÂN TÍCH và quyết định xem từng câu hỏi nên là loại TRẮC NGHIỆM ("multiple_choice") hay TỰ LUẬN/GHÉP CÂU ("essay").

Định dạng trả về BẮT BUỘC tuân thủ cấu trúc JSON:
{
  "topic": "Tên chủ đề câu hỏi ngắn gọn",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Nội dung câu hỏi...",
      "options": {
        "A": "Đáp án A",
        "B": "Đáp án B",
        "C": "Đáp án C",
        "D": "Đáp án D"
      },
      "hint": "Gợi ý định hướng (nếu có)"
    }
  ]
}`;

        try {
            showLoading('AI Đang Tạo Bộ Câu Hỏi...', `Đang xử lý yêu cầu với mô hình ${selectedModel}...`);
            btnGenerate.disabled = true;

            const rawResponse = await callLLMAPI(systemPrompt, `Yêu cầu tạo câu hỏi: ${promptText}`, selectedModel, questionGenerationSchema);
            const parsedData = parseAIJsonResponse(rawResponse);

            if (!parsedData.questions || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
                throw new Error('AI không tạo được danh sách câu hỏi hợp lệ. Vui lòng thử lại với prompt rõ ràng hơn.');
            }

            currentQuestions = parsedData.questions;
            userAnswers = {};
            renderQuestionsUI(parsedData.topic || 'Bộ Câu Hỏi AI', currentQuestions);

            // Switch view
            promptSection.classList.add('hidden');
            quizSection.classList.remove('hidden');
            resultsSection.classList.add('hidden');

            window.scrollTo({ top: quizSection.offsetTop - 30, behavior: 'smooth' });

        } catch (err) {
            showError('Lỗi Tạo Câu Hỏi', err.message);
        } finally {
            hideLoading();
            btnGenerate.disabled = false;
        }
    });

    /* Render UI câu hỏi */
    function renderQuestionsUI(topic, questions) {
        quizTopicTitle.textContent = topic;
        quizQuestionCount.textContent = `${questions.length} câu hỏi`;
        questionsContainer.innerHTML = '';

        questions.forEach((q, index) => {
            const qCard = document.createElement('div');
            qCard.className = 'question-card';
            const isMC = q.type === 'multiple_choice' && q.options;

            const existingAnswer = userAnswers[q.id] || q.importedAnswer || '';

            let bodyHtml = '';
            if (isMC) {
                const optA = q.options.A || q.options.a || '';
                const optB = q.options.B || q.options.b || '';
                const optC = q.options.C || q.options.c || '';
                const optD = q.options.D || q.options.d || '';

                const valA = `A: ${optA}`;
                const valB = `B: ${optB}`;
                const valC = `C: ${optC}`;
                const valD = `D: ${optD}`;

                const isCheckedA = existingAnswer === valA || existingAnswer.startsWith('A:') || existingAnswer === 'A' || existingAnswer === optA;
                const isCheckedB = existingAnswer === valB || existingAnswer.startsWith('B:') || existingAnswer === 'B' || existingAnswer === optB;
                const isCheckedC = existingAnswer === valC || existingAnswer.startsWith('C:') || existingAnswer === 'C' || existingAnswer === optC;
                const isCheckedD = existingAnswer === valD || existingAnswer.startsWith('D:') || existingAnswer === 'D' || existingAnswer === optD;

                bodyHtml = `
                    <div class="mc-options-grid" data-id="${q.id}">
                        <label class="mc-option-card ${isCheckedA ? 'selected' : ''}">
                            <input type="radio" name="question_${q.id}" value="${escapeHtml(valA)}" ${isCheckedA ? 'checked' : ''}>
                            <span class="opt-key">A</span>
                            <span class="opt-text">${escapeHtml(optA)}</span>
                        </label>
                        <label class="mc-option-card ${isCheckedB ? 'selected' : ''}">
                            <input type="radio" name="question_${q.id}" value="${escapeHtml(valB)}" ${isCheckedB ? 'checked' : ''}>
                            <span class="opt-key">B</span>
                            <span class="opt-text">${escapeHtml(optB)}</span>
                        </label>
                        <label class="mc-option-card ${isCheckedC ? 'selected' : ''}">
                            <input type="radio" name="question_${q.id}" value="${escapeHtml(valC)}" ${isCheckedC ? 'checked' : ''}>
                            <span class="opt-key">C</span>
                            <span class="opt-text">${escapeHtml(optC)}</span>
                        </label>
                        <label class="mc-option-card ${isCheckedD ? 'selected' : ''}">
                            <input type="radio" name="question_${q.id}" value="${escapeHtml(valD)}" ${isCheckedD ? 'checked' : ''}>
                            <span class="opt-key">D</span>
                            <span class="opt-text">${escapeHtml(optD)}</span>
                        </label>
                    </div>
                `;
            } else {
                bodyHtml = `
                    <div class="form-group">
                        <textarea class="answer-textarea" data-id="${q.id}" rows="3" placeholder="Nhập câu trả lời hoặc câu đã ghép của bạn vào đây...">${escapeHtml(existingAnswer)}</textarea>
                    </div>
                `;
            }

            let hintHtml = '';
            if (q.hint && q.hint.trim() !== '') {
                hintHtml = `
                    <div class="hint-wrapper">
                        <button type="button" class="btn-hint-toggle" data-id="${q.id}">
                            <i class="fa-regular fa-lightbulb"></i> <span class="hint-btn-text">Xem gợi ý</span>
                        </button>
                        <div id="hint-box-${q.id}" class="hint-box hidden">
                            <i class="fa-solid fa-lightbulb"></i> <strong>Gợi ý:</strong> ${escapeHtml(q.hint)}
                        </div>
                    </div>
                `;
            }

            qCard.innerHTML = `
                <div class="question-card-header">
                    <div class="header-meta">
                        <span class="question-num">Câu ${index + 1}</span>
                        <span class="type-badge ${isMC ? 'mc' : 'essay'}">${isMC ? 'Trắc nghiệm ABCD' : 'Tự luận / Ghép câu'}</span>
                    </div>
                </div>
                <div class="question-title">${escapeHtml(q.question)}</div>
                ${hintHtml}
                ${bodyHtml}
            `;

            questionsContainer.appendChild(qCard);
        });

        // Event listeners for radio option cards
        questionsContainer.querySelectorAll('.mc-option-card').forEach(card => {
            card.addEventListener('click', () => {
                const radio = card.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    const parentGrid = card.closest('.mc-options-grid');
                    parentGrid.querySelectorAll('.mc-option-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                }
            });
        });

        // Event listeners for Hint Toggle Buttons
        questionsContainer.querySelectorAll('.btn-hint-toggle').forEach(btn => {
            btn.addEventListener('click', (evt) => {
                evt.preventDefault();
                const qId = btn.getAttribute('data-id');
                const hintBox = document.getElementById(`hint-box-${qId}`);
                const hintTextSpan = btn.querySelector('.hint-btn-text');

                if (hintBox) {
                    const isHidden = hintBox.classList.contains('hidden');
                    if (isHidden) {
                        hintBox.classList.remove('hidden');
                        if (hintTextSpan) hintTextSpan.textContent = 'Ẩn gợi ý';
                    } else {
                        hintBox.classList.add('hidden');
                        if (hintTextSpan) hintTextSpan.textContent = 'Xem gợi ý';
                    }
                }
            });
        });
    }

    function captureUserAnswers() {
        currentQuestions.forEach(q => {
            if (q.type === 'multiple_choice' && q.options) {
                const checked = questionsContainer.querySelector(`input[name="question_${q.id}"]:checked`);
                if (checked) {
                    userAnswers[q.id] = checked.value;
                }
            } else {
                const ta = questionsContainer.querySelector(`textarea[data-id="${q.id}"]`);
                if (ta) {
                    userAnswers[q.id] = ta.value.trim();
                }
            }
        });
    }

    /* ==========================================================================
       6. Submit Answers & Grade Flow
       ========================================================================== */
    const evaluationSchema = {
        type: "OBJECT",
        properties: {
            overall_feedback: { type: "STRING" },
            average_score: { type: "NUMBER" },
            evaluations: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        id: { type: "INTEGER" },
                        score: { type: "NUMBER" },
                        explanation: { type: "STRING" },
                        improvement: { type: "STRING" }
                    },
                    required: ["id", "score", "explanation", "improvement"]
                }
            }
        },
        required: ["overall_feedback", "average_score", "evaluations"]
    };

    answersForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        captureUserAnswers();
        let answeredCount = 0;

        currentQuestions.forEach(q => {
            const ans = userAnswers[q.id];
            if (ans && ans !== '(Chưa chọn đáp án trắc nghiệm)' && ans !== '(Bỏ trống câu trả lời tự luận)') {
                answeredCount++;
            }
        });

        if (answeredCount === 0) {
            showError('Chưa trả lời', 'Vui lòng chọn đáp án trắc nghiệm hoặc nhập câu trả lời cho ít nhất một câu hỏi.');
            return;
        }

        const selectedModel = modelSelect.value;
        if (!selectedModel) {
            openKeyModal();
            showError('Thiếu API Key', 'Vui lòng chọn mô hình và cài đặt API Key.');
            return;
        }

        const qaList = currentQuestions.map(q => ({
            id: q.id,
            type: q.type || 'essay',
            question: q.question,
            options: q.options || null,
            user_answer: userAnswers[q.id] || '(Chưa trả lời)'
        }));

        const systemPrompt = `Bạn là một giáo viên chấm bài AI cực kỳ công bằng và chu đáo.
Hãy chấm điểm các câu trả lời trắc nghiệm ABCD và tự luận sau đây trên thang điểm 10.

YÊU CẦU CHẤM ĐIỂM:
1. Với câu trắc nghiệm ABCD: Đối chiếu đáp án. Nếu đúng -> 10 điểm, giải thích tại sao đúng. Nếu sai -> 0 điểm, chỉ rõ đáp án đúng.
2. Với câu tự luận: Chấm trên thang điểm 10, giải thích NGẮN GỌN và đưa ra gợi ý cách sửa/đáp án gợi ý tốt nhất.
3. Trả về đúng định dạng JSON:
{
  "overall_feedback": "Nhận xét tổng quan ngắn gọn 1-2 câu",
  "average_score": 8.5,
  "evaluations": [
    {
      "id": 1,
      "score": 10.0,
      "explanation": "Giải thích ngắn...",
      "improvement": "Đáp án chuẩn / Gợi ý ngắn..."
    }
  ]
}`;

        const userContent = `Danh sách câu hỏi và bài làm của học viên:\n${JSON.stringify(qaList, null, 2)}`;

        try {
            showLoading('AI Đang Chấm Điểm...', `Đang phân tích bài làm với mô hình ${selectedModel}...`);
            btnSubmitAnswers.disabled = true;

            const rawResponse = await callLLMAPI(systemPrompt, userContent, selectedModel, evaluationSchema);
            const evalResult = parseAIJsonResponse(rawResponse);
            lastEvaluations = evalResult;

            renderResultsUI(evalResult, qaList);

            // Switch view
            quizSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');

            window.scrollTo({ top: resultsSection.offsetTop - 30, behavior: 'smooth' });

        } catch (err) {
            showError('Lỗi Chấm Điểm', err.message);
        } finally {
            hideLoading();
            btnSubmitAnswers.disabled = false;
        }
    });

    function renderResultsUI(evalResult, qaList) {
        const avgScore = Number(evalResult.average_score || 0).toFixed(1);
        overallScoreNum.textContent = avgScore;

        if (avgScore >= 8.5) {
            overallHeadline.textContent = '🎉 Xuất Sắc! Bạn Đạt Điểm Rất Cao';
            overallScoreBadge.style.borderColor = 'var(--emerald-green)';
        } else if (avgScore >= 6.5) {
            overallHeadline.textContent = '👍 Tốt! Bài Làm Tương Đối Hoàn Thiện';
            overallScoreBadge.style.borderColor = 'var(--primary-cyan)';
        } else if (avgScore >= 5.0) {
            overallHeadline.textContent = '⚡ Đạt Yêu Cầu - Cần Cải Thiện Thêm';
            overallScoreBadge.style.borderColor = 'var(--amber-gold)';
        } else {
            overallHeadline.textContent = '💪 Đừng Nản Lòng! Hãy Xem Gợi Ý Và Thử Lại';
            overallScoreBadge.style.borderColor = 'var(--rose-red)';
        }

        overallFeedbackText.textContent = evalResult.overall_feedback || 'Đã hoàn thành bài đánh giá.';

        evaluationsContainer.innerHTML = '';
        const evalsMap = {};
        if (evalResult.evaluations) {
            evalResult.evaluations.forEach(item => { evalsMap[item.id] = item; });
        }

        qaList.forEach((item, index) => {
            const ev = evalsMap[item.id] || { score: 0, explanation: 'Chưa có nhận xét.', improvement: 'N/A' };
            const score = Number(ev.score || 0).toFixed(1);

            let scoreClass = 'score-low';
            if (score >= 8) scoreClass = 'score-high';
            else if (score >= 6) scoreClass = 'score-med';

            const evalCard = document.createElement('div');
            evalCard.className = 'eval-card';
            evalCard.innerHTML = `
                <div class="eval-header">
                    <div class="header-meta">
                        <span class="question-num">Câu ${index + 1}</span>
                        <span class="type-badge ${item.type === 'multiple_choice' ? 'mc' : 'essay'}">${item.type === 'multiple_choice' ? 'Trắc nghiệm ABCD' : 'Tự luận'}</span>
                    </div>
                    <span class="score-tag ${scoreClass}">${score} / 10 Điểm</span>
                </div>
                <div class="question-title">${escapeHtml(item.question)}</div>
                <div class="user-answer-review">
                    <strong>Đã chọn / Trả lời:</strong> ${escapeHtml(item.user_answer)}
                </div>
                <div class="feedback-box">
                    <div class="explanation-col">
                        <h4><i class="fa-solid fa-circle-info"></i> Giải thích ngắn gọn:</h4>
                        <p>${escapeHtml(ev.explanation)}</p>
                    </div>
                    <div class="improvement-col">
                        <h4><i class="fa-solid fa-circle-check"></i> Đáp án đúng / Gợi ý cách sửa:</h4>
                        <p>${escapeHtml(ev.improvement)}</p>
                    </div>
                </div>
            `;
            evaluationsContainer.appendChild(evalCard);
        });
    }

    /* ==========================================================================
       7. HISTORY FEATURE (Local Storage - User Manual Save)
       ========================================================================== */
    function getStoredHistory() {
        try {
            const raw = localStorage.getItem(LS_HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveStoredHistory(list) {
        localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(list));
        updateHistoryBadge();
    }

    function updateHistoryBadge() {
        const list = getStoredHistory();
        if (list.length > 0) {
            historyCountBadge.textContent = list.length;
            historyCountBadge.classList.remove('hidden');
        } else {
            historyCountBadge.classList.add('hidden');
        }
    }

    // Manual Save Button Event
    btnSaveToHistory.addEventListener('click', () => {
        if (!currentQuestions || currentQuestions.length === 0 || !lastEvaluations) {
            showError('Không có dữ liệu', 'Bạn cần hoàn thành và có kết quả chấm điểm trước khi lưu vào lịch sử.');
            return;
        }

        const historyList = getStoredHistory();
        const record = {
            id: 'hist_' + Date.now(),
            timestamp: new Date().toLocaleString('vi-VN'),
            topic: quizTopicTitle.textContent || 'Bộ câu hỏi AI',
            prompt: lastPrompt,
            questionCount: currentQuestions.length,
            averageScore: Number(lastEvaluations.average_score || 0).toFixed(1),
            overallFeedback: lastEvaluations.overall_feedback || '',
            questions: currentQuestions,
            userAnswers: userAnswers,
            evaluations: lastEvaluations
        };

        // Add to beginning of array
        historyList.unshift(record);
        saveStoredHistory(historyList);

        // Feedback alert button
        btnSaveToHistory.innerHTML = '<i class="fa-solid fa-check"></i> Đã Lưu Vô Lịch Sử!';
        btnSaveToHistory.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        setTimeout(() => {
            btnSaveToHistory.innerHTML = '<i class="fa-solid fa-bookmark"></i> Lưu Vào Lịch Sử';
            btnSaveToHistory.style.background = '';
        }, 2000);
    });

    // Open / Close History Modal
    btnOpenHistory.addEventListener('click', () => {
        renderHistoryListUI();
        historyModal.classList.remove('hidden');
    });

    btnCloseHistoryModal.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });
    btnCloseHistoryFooter.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    btnClearHistoryAll.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử bài làm đã lưu?')) {
            saveStoredHistory([]);
            renderHistoryListUI();
        }
    });

    function renderHistoryListUI() {
        const list = getStoredHistory();
        historyListContainer.innerHTML = '';

        if (list.length === 0) {
            historyListContainer.innerHTML = `
                <div class="empty-history-text">
                    <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;"></i>
                    <p>Chưa có lịch sử bài làm nào được lưu.</p>
                    <small>Sau khi hoàn thành bài làm, bạn có thể tự bấm nút "Lưu Vào Lịch Sử" để lưu trữ.</small>
                </div>
            `;
            return;
        }

        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-card';

            const score = Number(item.averageScore || 0).toFixed(1);
            let scoreClass = 'score-low';
            if (score >= 8) scoreClass = 'score-high';
            else if (score >= 6) scoreClass = 'score-med';

            card.innerHTML = `
                <div class="history-card-header">
                    <div class="history-topic">${escapeHtml(item.topic)}</div>
                    <span class="score-tag ${scoreClass}">${score} / 10 Điểm</span>
                </div>
                <div class="history-meta-info">
                    <span><i class="fa-regular fa-calendar"></i> ${item.timestamp}</span>
                    <span><i class="fa-solid fa-list-check"></i> ${item.questionCount} câu hỏi</span>
                </div>
                <div class="history-actions-row">
                    <button type="button" class="btn btn-outline btn-load-hist" data-id="${item.id}">
                        <i class="fa-solid fa-eye"></i> Xem Lại Bài Làm
                    </button>
                    <button type="button" class="btn btn-excel-outline btn-export-hist" data-id="${item.id}">
                        <i class="fa-solid fa-file-excel"></i> Excel
                    </button>
                    <button type="button" class="btn btn-danger-ghost btn-delete-hist" data-id="${item.id}">
                        <i class="fa-solid fa-trash-can"></i> Xóa
                    </button>
                </div>
            `;

            historyListContainer.appendChild(card);
        });

        // Event listener for "Xem Lại Bài Làm"
        historyListContainer.querySelectorAll('.btn-load-hist').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const list = getStoredHistory();
                const record = list.find(r => r.id === id);
                if (record) {
                    currentQuestions = record.questions || [];
                    userAnswers = record.userAnswers || {};
                    lastEvaluations = record.evaluations || null;

                    renderResultsUI(lastEvaluations, currentQuestions.map(q => ({
                        id: q.id,
                        type: q.type || 'essay',
                        question: q.question,
                        options: q.options || null,
                        user_answer: userAnswers[q.id] || '(Chưa trả lời)'
                    })));

                    historyModal.classList.add('hidden');
                    promptSection.classList.add('hidden');
                    quizSection.classList.add('hidden');
                    resultsSection.classList.remove('hidden');

                    window.scrollTo({ top: resultsSection.offsetTop - 30, behavior: 'smooth' });
                }
            });
        });

        // Event listener for "Xóa"
        historyListContainer.querySelectorAll('.btn-delete-hist').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                let list = getStoredHistory();
                list = list.filter(r => r.id !== id);
                saveStoredHistory(list);
                renderHistoryListUI();
            });
        });

        // Event listener for "Xuất Excel" from History
        historyListContainer.querySelectorAll('.btn-export-hist').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const list = getStoredHistory();
                const record = list.find(r => r.id === id);
                if (record && record.questions) {
                    exportHistoryRecordToExcel(record);
                }
            });
        });
    }

    function exportHistoryRecordToExcel(record) {
        const evalsMap = {};
        if (record.evaluations && record.evaluations.evaluations) {
            record.evaluations.evaluations.forEach(item => { evalsMap[item.id] = item; });
        }

        const exportData = record.questions.map((q, idx) => {
            const ev = evalsMap[q.id] || { score: 0, explanation: '', improvement: '' };
            return {
                "STT": idx + 1,
                "Loại câu hỏi": q.type === 'multiple_choice' ? 'Trắc nghiệm ABCD' : 'Tự luận',
                "Câu hỏi": q.question,
                "Bài làm người dùng": record.userAnswers[q.id] || '',
                "Điểm AI (Thang 10)": Number(ev.score || 0).toFixed(1),
                "Giải thích ngắn gọn": ev.explanation || '',
                "Đáp án đúng / Gợi ý": ev.improvement || ''
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Lich_su_bai_lam");
        XLSX.writeFile(workbook, `Lich_su_${record.topic.replace(/[^a-zA-Z0-9_]/g, '_')}.xlsx`);
    }

    /* ==========================================================================
       8. EXCEL IMPORT & EXPORT FEATURES (SheetJS)
       ========================================================================== */
    
    // Open Export Options Modal
    btnExportQuestionsExcel.addEventListener('click', () => {
        if (!currentQuestions || currentQuestions.length === 0) {
            showError('Không có dữ liệu', 'Chưa có câu hỏi nào để xuất Excel.');
            return;
        }
        excelExportModal.classList.remove('hidden');
    });

    btnCloseExportModal.addEventListener('click', () => {
        excelExportModal.classList.add('hidden');
    });

    btnExportNoAnswers.addEventListener('click', () => {
        excelExportModal.classList.add('hidden');
        exportQuestionsToExcel(false);
    });

    btnExportWithAnswers.addEventListener('click', () => {
        excelExportModal.classList.add('hidden');
        captureUserAnswers();
        exportQuestionsToExcel(true);
    });

    function exportQuestionsToExcel(includeAnswers) {
        const exportData = currentQuestions.map((q, idx) => {
            const row = {
                "STT": idx + 1,
                "Loại câu hỏi": q.type === 'multiple_choice' ? 'Trắc nghiệm ABCD' : 'Tự luận / Ghép câu',
                "Câu hỏi": q.question,
                "Phương án A": q.options ? q.options.A || '' : '',
                "Phương án B": q.options ? q.options.B || '' : '',
                "Phương án C": q.options ? q.options.C || '' : '',
                "Phương án D": q.options ? q.options.D || '' : '',
                "Gợi ý": q.hint || ''
            };

            if (includeAnswers) {
                row["Bài làm / Câu trả lời"] = userAnswers[q.id] || '';
            }

            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        const sheetName = includeAnswers ? "De_bai_va_bai_lam" : "Danh_sach_cau_hoi";
        const fileName = includeAnswers ? "Bo_cau_hoi_va_bai_lam_GhepCau_AI.xlsx" : "Bo_cau_hoi_GhepCau_AI.xlsx";

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, fileName);
    }

    // Import Excel File
    btnImportExcel.addEventListener('click', () => {
        excelFileInput.click();
    });

    excelFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (!jsonData || jsonData.length === 0) {
                    showError('File Trống', 'File Excel không chứa câu hỏi nào.');
                    return;
                }

                userAnswers = {};

                const importedQuestions = jsonData.map((row, idx) => {
                    const typeRaw = String(row['Loại câu hỏi'] || row['Type'] || '').toLowerCase();
                    const isMC = typeRaw.includes('trắc nghiệm') || typeRaw.includes('multiple') || (row['Phương án A'] || row['Option A']);

                    let options = null;
                    if (isMC) {
                        options = {
                            A: String(row['Phương án A'] || row['Option A'] || 'A'),
                            B: String(row['Phương án B'] || row['Option B'] || 'B'),
                            C: String(row['Phương án C'] || row['Option C'] || 'C'),
                            D: String(row['Phương án D'] || row['Option D'] || 'D')
                        };
                    }

                    const importedAnswer = String(
                        row['Bài làm / Câu trả lời'] || 
                        row['Bài làm'] || 
                        row['Câu trả lời'] || 
                        row['User Answer'] || 
                        row['Answer'] || 
                        ''
                    ).trim();

                    if (importedAnswer) {
                        userAnswers[idx + 1] = importedAnswer;
                    }

                    return {
                        id: idx + 1,
                        type: isMC ? 'multiple_choice' : 'essay',
                        question: String(row['Câu hỏi'] || row['Question'] || `Câu hỏi ${idx + 1}`),
                        options: options,
                        hint: row['Gợi ý'] || row['Hint'] || '',
                        importedAnswer: importedAnswer
                    };
                });

                currentQuestions = importedQuestions;
                renderQuestionsUI(`Bộ Câu Hỏi Nhập Từ Excel (${file.name})`, currentQuestions);

                // Switch UI to quiz
                promptSection.classList.add('hidden');
                quizSection.classList.remove('hidden');
                resultsSection.classList.add('hidden');
                hideError();

                window.scrollTo({ top: quizSection.offsetTop - 30, behavior: 'smooth' });

            } catch (err) {
                showError('Lỗi Đọc File Excel', 'Không thể nạp file Excel: ' + err.message);
            } finally {
                excelFileInput.value = '';
            }
        };

        reader.readAsBinaryString(file);
    });

    // Export Results & Evaluation to Excel
    btnExportResultsExcel.addEventListener('click', () => {
        if (!currentQuestions || currentQuestions.length === 0 || !lastEvaluations) {
            showError('Không có kết quả', 'Chưa có kết quả chấm điểm để xuất Excel.');
            return;
        }

        const evalsMap = {};
        if (lastEvaluations.evaluations) {
            lastEvaluations.evaluations.forEach(item => { evalsMap[item.id] = item; });
        }

        const exportData = currentQuestions.map((q, idx) => {
            const ev = evalsMap[q.id] || { score: 0, explanation: '', improvement: '' };
            return {
                "STT": idx + 1,
                "Loại câu hỏi": q.type === 'multiple_choice' ? 'Trắc nghiệm ABCD' : 'Tự luận',
                "Câu hỏi": q.question,
                "Bài làm người dùng": userAnswers[q.id] || '',
                "Điểm AI (Thang 10)": Number(ev.score || 0).toFixed(1),
                "Giải thích ngắn gọn": ev.explanation || '',
                "Đáp án đúng / Gợi ý": ev.improvement || ''
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ket_qua_cham_diem");
        XLSX.writeFile(workbook, "Bang_diem_GhepCau_AI.xlsx");
    });

    /* ==========================================================================
       9. Navigation & Reset Handlers
       ========================================================================== */
    btnResetQuiz.addEventListener('click', () => {
        quizSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        promptSection.classList.remove('hidden');
        hideError();
    });

    btnRetrySame.addEventListener('click', () => {
        captureUserAnswers();
        resultsSection.classList.add('hidden');
        quizSection.classList.remove('hidden');
        renderQuestionsUI(quizTopicTitle.textContent, currentQuestions);
        hideError();
        window.scrollTo({ top: quizSection.offsetTop - 30, behavior: 'smooth' });
    });

    btnCreateNew.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        quizSection.classList.add('hidden');
        promptSection.classList.remove('hidden');
        hideError();
        promptInput.focus();
    });

    // Helper: HTML Escape
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initialize UI status & History count badge
    updateKeyStatusUI();
    updateHistoryBadge();
});
