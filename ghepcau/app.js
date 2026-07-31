/**
 * Ghép Câu & Luyện AI - Main Client Application Logic
 * Pure client-side static web application with Gemini REST API & SheetJS Excel integration
 */

document.addEventListener('DOMContentLoaded', () => {
    // LocalStorage Keys
    const LS_KEY = 'gemini_api_key';

    // State Variables
    let currentQuestions = [];
    let userAnswers = {};
    let lastPrompt = '';
    let lastEvaluations = null;

    // DOM Elements - Key Modal
    const keyModal = document.getElementById('key-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const btnToggleKeyModal = document.getElementById('btn-toggle-key-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSaveKey = document.getElementById('btn-save-key');
    const btnClearKey = document.getElementById('btn-clear-key');
    const btnToggleShowKey = document.getElementById('btn-toggle-show-key');
    const keyStatusText = document.getElementById('key-status-text');
    const keyStatusDot = document.getElementById('key-status-dot');

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
       1. API Key Management
       ========================================================================== */
    function getStoredApiKey() {
        return localStorage.getItem(LS_KEY) || '';
    }

    function updateKeyStatusUI() {
        const key = getStoredApiKey();
        if (key && key.trim().length > 10) {
            keyStatusText.textContent = 'API Key Đã Lưu';
            keyStatusDot.className = 'dot dot-valid';
            apiKeyInput.value = key;
        } else {
            keyStatusText.textContent = 'Chưa nhập API Key';
            keyStatusDot.className = 'dot dot-invalid';
            apiKeyInput.value = '';
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
        const keyVal = apiKeyInput.value.trim();
        if (!keyVal) {
            showError('Thiếu thông tin', 'Vui lòng nhập Gemini API Key hợp lệ.');
            return;
        }
        localStorage.setItem(LS_KEY, keyVal);
        updateKeyStatusUI();
        closeKeyModal();
        hideError();
    });

    btnClearKey.addEventListener('click', () => {
        localStorage.removeItem(LS_KEY);
        updateKeyStatusUI();
        closeKeyModal();
    });

    btnToggleShowKey.addEventListener('click', () => {
        const currentType = apiKeyInput.getAttribute('type');
        if (currentType === 'password') {
            apiKeyInput.setAttribute('type', 'text');
            btnToggleShowKey.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        } else {
            apiKeyInput.setAttribute('type', 'password');
            btnToggleShowKey.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
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
        if (!rawText) throw new Error('Không nhận được dữ liệu từ Gemini AI.');

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
       4. Gemini API Call Helper with responseSchema
       ========================================================================== */
    async function callGeminiAPI(systemInstruction, userPrompt, model = 'gemini-2.5-flash', responseSchema = null) {
        const apiKey = getStoredApiKey();
        if (!apiKey) {
            openKeyModal();
            throw new Error('Bạn chưa cài đặt API Key. Vui lòng nhập Gemini API Key để tiếp tục.');
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
            const errMsg = errData.error?.message || `Lỗi HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.[0]?.text) {
            throw new Error('Phản hồi từ Gemini API rỗng hoặc bị chặn bởi bộ lọc an toàn.');
        }

        return candidate.content.parts[0].text;
    }

    /* ==========================================================================
       5. Generate Questions Flow (Trắc nghiệm ABCD & Tự luận)
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

        const selectedModel = modelSelect.value || 'gemini-2.5-flash';
        lastPrompt = promptText;

        const systemPrompt = `Bạn là một chuyên gia giáo dục xuất sắc. Nhiệm vụ của bạn là dựa theo yêu cầu người dùng để tạo ra danh sách câu hỏi.
Bạn hãy TỰ ĐỘNG PHÂN TÍCH và quyết định xem từng câu hỏi nên là loại TRẮC NGHIỆM ("multiple_choice") hay TỰ LUẬN/GHÉP CÂU ("essay").

Định dạng trả về BẮT BUỘC tuân thủ cấu trúc JSON:
- "topic": tên chủ đề
- "questions": mảng danh sách các câu hỏi.
Nút "multiple_choice" bắt buộc đi kèm object "options" gồm 4 phương án {"A": "...", "B": "...", "C": "...", "D": "..."}.`;

        try {
            showLoading('AI Đang Tạo Bộ Câu Hỏi...', `Đang phân tích prompt và tạo trắc nghiệm / tự luận...`);
            btnGenerate.disabled = true;

            const rawResponse = await callGeminiAPI(systemPrompt, `Yêu cầu tạo câu hỏi: ${promptText}`, selectedModel, questionGenerationSchema);
            const parsedData = parseAIJsonResponse(rawResponse);

            if (!parsedData.questions || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
                throw new Error('AI không tạo được danh sách câu hỏi hợp lệ. Vui lòng thử lại với prompt rõ ràng hơn.');
            }

            currentQuestions = parsedData.questions;
            userAnswers = {}; // Clear previous answers for new prompt
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

    /* Render UI câu hỏi (Trắc nghiệm ABCD & Tự luận với nút Nút Gợi Ý) */
    function renderQuestionsUI(topic, questions) {
        quizTopicTitle.textContent = topic;
        quizQuestionCount.textContent = `${questions.length} câu hỏi`;
        questionsContainer.innerHTML = '';

        questions.forEach((q, index) => {
            const qCard = document.createElement('div');
            qCard.className = 'question-card';
            const isMC = q.type === 'multiple_choice' && q.options;

            // Existing user answer or imported answer
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

            // Hint HTML with Toggle Button
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

        // Add visual click listener for MC Radio buttons
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

        // Add Hint Toggle click listeners
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

    /* Helper: Capture Current User Inputs into userAnswers object */
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

        const selectedModel = modelSelect.value || 'gemini-2.5-flash';

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
3. Giải thích và gợi ý phải viết NGẮN GỌN, DỄ HỂU, tránh dài dòng.`;

        const userContent = `Danh sách câu hỏi và bài làm của học viên:\n${JSON.stringify(qaList, null, 2)}`;

        try {
            showLoading('AI Đang Chấm Điểm...', 'Kiểm tra đáp án trắc nghiệm & đánh giá bài tự luận...');
            btnSubmitAnswers.disabled = true;

            const rawResponse = await callGeminiAPI(systemPrompt, userContent, selectedModel, evaluationSchema);
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
       7. EXCEL IMPORT & EXPORT FEATURES (SheetJS)
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

    // Option 1: Export WITHOUT Answers
    btnExportNoAnswers.addEventListener('click', () => {
        excelExportModal.classList.add('hidden');
        exportQuestionsToExcel(false);
    });

    // Option 2: Export WITH Answers
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

                userAnswers = {}; // Reset previous user answers

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
       8. Navigation & Reset Handlers
       ========================================================================== */
    btnResetQuiz.addEventListener('click', () => {
        quizSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        promptSection.classList.remove('hidden');
        hideError();
    });

    // FIX REQUIREMENT 1: Keep user answers when clicking "Làm lại đề này"
    btnRetrySame.addEventListener('click', () => {
        captureUserAnswers(); // Ensure latest answers are saved
        resultsSection.classList.add('hidden');
        quizSection.classList.remove('hidden');
        renderQuestionsUI(quizTopicTitle.textContent, currentQuestions); // Re-render preserving answers
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

    // Initialize UI status
    updateKeyStatusUI();
});
