/**
 * Ghép Câu & Luyện AI - Main Client Application Logic
 * Pure client-side static web application with Gemini & OpenRouter API integration, File Attachments (Images, PDF, Word, TXT) sent directly to AI, Reading Passages, KaTeX Math & Excel
 */

document.addEventListener('DOMContentLoaded', () => {
    // LocalStorage Keys
    const LS_GEMINI_KEY = 'gemini_api_key';
    const LS_OPENROUTER_KEY = 'openrouter_api_key';
    const LS_HISTORY_KEY = 'ghepcau_history_list';

    // Configure PDF.js worker URL
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // State Variables
    let currentQuestions = [];
    let currentReadingPassage = '';
    let userAnswers = {};
    let lastPrompt = '';
    let lastEvaluations = null;
    let attachedFiles = [];

    // DOM Elements - Key Modal
    const keyModal = document.getElementById('key-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const openrouterKeyInput = document.getElementById('openrouter-key-input');
    const btnToggleKeyModal = document.getElementById('btn-toggle-key-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSaveKey = document.getElementById('btn-save-key');
    const btnClearKey = document.getElementById('btn-clear-key');
    const btnToggleShowKey = document.getElementById('btn-toggle-show-key');
    const btnToggleShowOpenRouterKey = document.getElementById('btn-toggle-show-openrouter-key');
    const keyStatusText = document.getElementById('key-status-text');
    const keyStatusDot = document.getElementById('key-status-dot');
    const geminiBadgeStatus = document.getElementById('gemini-badge-status');
    const openrouterBadgeStatus = document.getElementById('openrouter-badge-status');

    // DOM Elements - Advanced Key Toggle
    const btnToggleAdvancedKeys = document.getElementById('btn-toggle-advanced-keys');
    const advancedKeySection = document.getElementById('advanced-key-section');
    const advancedChevron = document.getElementById('advanced-chevron');

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

    // DOM Elements - File Attachment & Multiple files / Paste
    const promptFileInput = document.getElementById('prompt-file-input');
    const btnAttachFile = document.getElementById('btn-attach-file');
    const attachedFilesContainer = document.getElementById('attached-files-container');
    const attachedFilesList = document.getElementById('attached-files-list');
    const attachedFilesCount = document.getElementById('attached-files-count');
    const btnClearAllFiles = document.getElementById('btn-clear-all-files');

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

    // DOM Elements - Reading Passage
    const readingPassageContainer = document.getElementById('reading-passage-container');
    const readingPassageContent = document.getElementById('reading-passage-content');

    // DOM Elements - Generator & Excel & Chips
    const generatorForm = document.getElementById('generator-form');
    const promptInput = document.getElementById('prompt-input');
    const modelSelect = document.getElementById('model-select');
    const btnGenerate = document.getElementById('btn-generate');
    const chipBtns = document.querySelectorAll('.chip-btn');
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
       KaTeX Math Rendering Helper
       ========================================================================== */
    function renderMathInContainer(container) {
        if (window.renderMathInElement && container) {
            try {
                window.renderMathInElement(container, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false },
                        { left: "\\(", right: "\\)", display: false },
                        { left: "\\[", right: "\\]", display: true }
                    ],
                    throwOnError: false
                });
            } catch (e) {
                console.warn("KaTeX Math Rendering warning:", e);
            }
        }
    }

    /* ==========================================================================
       File Attachment & Image Paste & Base64 Data URL Convertor
       ========================================================================== */
    btnAttachFile.addEventListener('click', () => {
        promptFileInput.click();
    });

    promptFileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        addAttachedFiles(files);
        promptFileInput.value = ''; // Reset to allow selecting the same file again
    });

    if (btnClearAllFiles) {
        btnClearAllFiles.addEventListener('click', () => {
            clearAllAttachedFiles();
        });
    }

    function addAttachedFiles(files) {
        if (!files || files.length === 0) return;

        let addedCount = 0;
        for (const file of files) {
            // Avoid exact duplicates
            const isDuplicate = attachedFiles.some(f =>
                f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
            );
            if (!isDuplicate) {
                if (file.size > 25 * 1024 * 1024) {
                    showToast(`File "${file.name}" quá lớn (>25MB). Vui lòng chọn file nhỏ hơn.`, 'error');
                    continue;
                }
                attachedFiles.push(file);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            renderAttachedFilesList();
        }
    }

    function removeAttachedFile(index) {
        if (index >= 0 && index < attachedFiles.length) {
            const removed = attachedFiles.splice(index, 1)[0];
            if (removed && removed._previewUrl) {
                URL.revokeObjectURL(removed._previewUrl);
            }
            renderAttachedFilesList();
        }
    }

    function clearAllAttachedFiles() {
        attachedFiles.forEach(f => {
            if (f._previewUrl) URL.revokeObjectURL(f._previewUrl);
        });
        attachedFiles = [];
        promptFileInput.value = '';
        renderAttachedFilesList();
    }

    function renderAttachedFilesList() {
        if (!attachedFilesContainer || !attachedFilesList) return;

        if (attachedFiles.length === 0) {
            attachedFilesContainer.classList.add('hidden');
            btnAttachFile.innerHTML = '<i class="fa-solid fa-paperclip"></i> Đính Kèm File (Ảnh, PDF, Word, TXT...)';
            return;
        }

        attachedFilesContainer.classList.remove('hidden');
        btnAttachFile.innerHTML = '<i class="fa-solid fa-plus"></i> Đính kèm thêm file...';
        if (attachedFilesCount) {
            attachedFilesCount.textContent = attachedFiles.length;
        }

        attachedFilesList.innerHTML = '';

        attachedFiles.forEach((file, index) => {
            const badge = document.createElement('div');
            badge.className = 'file-badge';

            let iconHtml = '';
            if (file.type.startsWith('image/')) {
                if (!file._previewUrl) {
                    file._previewUrl = URL.createObjectURL(file);
                }
                iconHtml = `<img src="${file._previewUrl}" alt="${escapeHtml(file.name)}" class="file-badge-thumb" />`;
            } else {
                const ext = file.name.split('.').pop().toLowerCase();
                if (ext === 'pdf') {
                    iconHtml = '<i class="fa-solid fa-file-pdf file-badge-icon file-icon-pdf"></i>';
                } else if (ext === 'docx' || ext === 'doc') {
                    iconHtml = '<i class="fa-solid fa-file-word file-badge-icon file-icon-word"></i>';
                } else if (['txt', 'md', 'json', 'csv'].includes(ext)) {
                    iconHtml = '<i class="fa-solid fa-file-lines file-badge-icon file-icon-text"></i>';
                } else {
                    iconHtml = '<i class="fa-solid fa-file file-badge-icon"></i>';
                }
            }

            badge.innerHTML = `
                ${iconHtml}
                <span class="file-badge-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                <span class="file-badge-size">(${formatFileSize(file.size)})</span>
                <button type="button" class="btn-icon-inside-badge" data-index="${index}" title="Gỡ file này">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            const removeBtn = badge.querySelector('.btn-icon-inside-badge');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeAttachedFile(index);
            });

            attachedFilesList.appendChild(badge);
        });
    }

    // Image Paste Handler for prompt input & form
    function handleImagePaste(e) {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const newImageFiles = [];

        // Check clipboardData.items (standard for screenshots/canvas/browser copy)
        if (clipboardData.items && clipboardData.items.length > 0) {
            for (let i = 0; i < clipboardData.items.length; i++) {
                const item = clipboardData.items[i];
                if (item.type && item.type.startsWith('image/')) {
                    const blob = item.getAsFile();
                    if (blob) {
                        const ext = blob.type.split('/')[1]?.replace('+xml', '') || 'png';
                        const count = attachedFiles.length + newImageFiles.length + 1;
                        const now = new Date();
                        const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
                        const customFile = new File([blob], `anh_dan_${timeStr}_${count}.${ext}`, {
                            type: blob.type,
                            lastModified: Date.now()
                        });
                        newImageFiles.push(customFile);
                    }
                }
            }
        }

        // Check clipboardData.files if items didn't produce files
        if (newImageFiles.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
            for (let i = 0; i < clipboardData.files.length; i++) {
                const file = clipboardData.files[i];
                if (file.type && file.type.startsWith('image/')) {
                    newImageFiles.push(file);
                }
            }
        }

        if (newImageFiles.length > 0) {
            // If clipboard only had images and no text, prevent default paste
            const text = clipboardData.getData('text/plain');
            if (!text || !text.trim()) {
                e.preventDefault();
            }

            addAttachedFiles(newImageFiles);
            showToast(`Đã dán ${newImageFiles.length} hình ảnh vào yêu cầu!`, 'success');
        }
    }

    promptInput.addEventListener('paste', handleImagePaste);

    if (generatorForm) {
        generatorForm.addEventListener('paste', (e) => {
            if (e.target === promptInput) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            handleImagePaste(e);
        });
    }

    // Drag & Drop files directly onto prompt textarea
    const promptTextareaWrapper = promptInput.closest('.textarea-wrapper') || promptInput;
    ['dragenter', 'dragover'].forEach(eventName => {
        promptTextareaWrapper.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            promptTextareaWrapper.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        promptTextareaWrapper.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            promptTextareaWrapper.classList.remove('drag-over');
        }, false);
    });

    promptTextareaWrapper.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            addAttachedFiles(Array.from(dt.files));
            showToast(`Đã nhận ${dt.files.length} file đính kèm!`, 'success');
        }
    });

    // Toast Notification Helper
    function showToast(message, type = 'info') {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        const iconClass = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info');
        toast.innerHTML = `
            <i class="fa-solid ${iconClass}"></i>
            <span>${escapeHtml(message)}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            // Check if image and needs resizing
            if (file.type.startsWith('image/')) {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    const MAX_DIM = 2048;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_DIM || height > MAX_DIM || file.size > 3 * 1024 * 1024) {
                        if (width > height) {
                            if (width > MAX_DIM) {
                                height = Math.round(height * (MAX_DIM / width));
                                width = MAX_DIM;
                            }
                        } else {
                            if (height > MAX_DIM) {
                                width = Math.round(width * (MAX_DIM / height));
                                height = MAX_DIM;
                            }
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                        const dataUrl = canvas.toDataURL(mimeType, 0.88);
                        const base64 = dataUrl.split(',')[1];
                        resolve({
                            name: file.name,
                            dataUrl: dataUrl,
                            base64: base64,
                            mimeType: mimeType
                        });
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                        const dataUrl = reader.result;
                        const base64 = dataUrl.split(',')[1];
                        resolve({
                            name: file.name,
                            dataUrl: dataUrl,
                            base64: base64,
                            mimeType: file.type || 'image/jpeg'
                        });
                    };
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    const reader = new FileReader();
                    reader.onload = () => {
                        const dataUrl = reader.result;
                        const base64 = dataUrl.split(',')[1];
                        resolve({
                            name: file.name,
                            dataUrl: dataUrl,
                            base64: base64,
                            mimeType: file.type || 'image/jpeg'
                        });
                    };
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                };
                img.src = url;
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;
                const base64 = dataUrl.split(',')[1];
                let mime = file.type;
                if (!mime) {
                    const ext = file.name.split('.').pop().toLowerCase();
                    if (ext === 'pdf') mime = 'application/pdf';
                    else mime = 'application/octet-stream';
                }
                resolve({
                    name: file.name,
                    dataUrl: dataUrl,
                    base64: base64,
                    mimeType: mime
                });
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    async function extractTextFromFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();

        // PDF Text Extraction
        if (ext === 'pdf') {
            if (!window.pdfjsLib) return '';
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += `[Trang ${i}]\n${pageText}\n\n`;
            }
            return fullText.trim();
        }

        // Word (.docx) Extraction
        if (ext === 'docx' || ext === 'doc') {
            if (!window.mammoth) return '';
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            return result.value.trim();
        }

        // Text files
        if (['txt', 'md', 'json', 'csv'].includes(ext)) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => resolve('');
                reader.readAsText(file);
            });
        }

        return '';
    }

    /* ==========================================================================
       1. API Keys & Advanced Toggle Logic
       ========================================================================== */
    function getStoredGeminiKey() {
        return localStorage.getItem(LS_GEMINI_KEY) || '';
    }

    function getStoredOpenRouterKey() {
        return localStorage.getItem(LS_OPENROUTER_KEY) || '';
    }

    function updateKeyStatusUI() {
        const geminiKey = getStoredGeminiKey();
        const openrouterKey = getStoredOpenRouterKey();

        const hasGemini = geminiKey && geminiKey.trim().length > 10;
        const hasOpenRouter = openrouterKey && openrouterKey.trim().length > 10;

        if (hasGemini) {
            geminiBadgeStatus.textContent = 'Đã lưu';
            geminiBadgeStatus.className = 'key-tag-badge valid';
            apiKeyInput.value = geminiKey;
        } else {
            geminiBadgeStatus.textContent = 'Chưa lưu';
            geminiBadgeStatus.className = 'key-tag-badge invalid';
            apiKeyInput.value = '';
        }

        if (hasOpenRouter) {
            openrouterBadgeStatus.textContent = 'Đã lưu';
            openrouterBadgeStatus.className = 'key-tag-badge valid';
            openrouterKeyInput.value = openrouterKey;
            advancedKeySection.classList.remove('hidden');
            if (advancedChevron) advancedChevron.className = 'fa-solid fa-chevron-up';
        } else {
            openrouterBadgeStatus.textContent = 'Chưa lưu';
            openrouterBadgeStatus.className = 'key-tag-badge invalid';
            openrouterKeyInput.value = '';
        }

        if (hasGemini && hasOpenRouter) {
            keyStatusText.textContent = 'Gemini & OpenRouter API';
            keyStatusDot.className = 'dot dot-valid';
        } else if (hasGemini) {
            keyStatusText.textContent = 'Gemini API (Đã cài)';
            keyStatusDot.className = 'dot dot-valid';
        } else if (hasOpenRouter) {
            keyStatusText.textContent = 'OpenRouter API (Đã cài)';
            keyStatusDot.className = 'dot dot-valid';
        } else {
            keyStatusText.textContent = 'Chưa nhập API Key';
            keyStatusDot.className = 'dot dot-invalid';
        }

        updateModelSelectOptions(hasGemini, hasOpenRouter);
    }

    function updateModelSelectOptions(hasGemini, hasOpenRouter) {
        modelSelect.innerHTML = '';

        if (!hasGemini && !hasOpenRouter) {
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

        if (hasOpenRouter) {
            const group = document.createElement('optgroup');
            group.label = 'OpenRouter (Nâng cao)';

            const opt4 = document.createElement('option');
            opt4.value = 'deepseek/deepseek-chat';
            opt4.textContent = 'DeepSeek V3 / Chat (OpenRouter)';

            const opt5 = document.createElement('option');
            opt5.value = 'meta-llama/llama-3.3-70b-instruct';
            opt5.textContent = 'Llama 3.3 70B (OpenRouter)';

            group.appendChild(opt4);
            group.appendChild(opt5);
            modelSelect.appendChild(group);
        }
    }

    // Toggle Advanced Section
    btnToggleAdvancedKeys.addEventListener('click', () => {
        const isHidden = advancedKeySection.classList.contains('hidden');
        if (isHidden) {
            advancedKeySection.classList.remove('hidden');
            if (advancedChevron) advancedChevron.className = 'fa-solid fa-chevron-up';
        } else {
            advancedKeySection.classList.add('hidden');
            if (advancedChevron) advancedChevron.className = 'fa-solid fa-chevron-down';
        }
    });

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
        const openrouterVal = openrouterKeyInput.value.trim();

        if (geminiVal) localStorage.setItem(LS_GEMINI_KEY, geminiVal);
        else localStorage.removeItem(LS_GEMINI_KEY);

        if (openrouterVal) localStorage.setItem(LS_OPENROUTER_KEY, openrouterVal);
        else localStorage.removeItem(LS_OPENROUTER_KEY);

        updateKeyStatusUI();
        closeKeyModal();
        hideError();
    });

    btnClearKey.addEventListener('click', () => {
        localStorage.removeItem(LS_GEMINI_KEY);
        localStorage.removeItem(LS_OPENROUTER_KEY);
        updateKeyStatusUI();
        closeKeyModal();
    });

    btnToggleShowKey.addEventListener('click', () => {
        const currentType = apiKeyInput.getAttribute('type');
        apiKeyInput.setAttribute('type', currentType === 'password' ? 'text' : 'password');
        btnToggleShowKey.innerHTML = currentType === 'password' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    btnToggleShowOpenRouterKey.addEventListener('click', () => {
        const currentType = openrouterKeyInput.getAttribute('type');
        openrouterKeyInput.setAttribute('type', currentType === 'password' ? 'text' : 'password');
        btnToggleShowOpenRouterKey.innerHTML = currentType === 'password' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const promptText = btn.getAttribute('data-prompt');
            if (promptText) {
                promptInput.value = promptText;
                promptInput.focus();
            }
        });
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
                } catch (e2) { }
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
       4. Unified AI LLM API Call Helper (Gemini / OpenRouter Router)
       ========================================================================== */
    async function callLLMAPI(systemInstruction, userPrompt, model, responseSchema = null, filesData = []) {
        if (!model) {
            openKeyModal();
            throw new Error('Chưa có API Key nào được cài đặt. Vui lòng nhập Gemini Key để bắt đầu sử dụng.');
        }

        if (model.startsWith('gemini')) {
            return await callGeminiAPI(systemInstruction, userPrompt, model, responseSchema, filesData);
        } else {
            return await callOpenRouterAPI(systemInstruction, userPrompt, model, filesData);
        }
    }

    // Google Gemini API Call (Direct Multimodal inlineData support for multiple files)
    async function callGeminiAPI(systemInstruction, userPrompt, model, responseSchema, filesData) {
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

        const parts = [
            { text: systemInstruction + '\n\n' + userPrompt }
        ];

        // Attach Base64 files as Gemini inlineData!
        const fileList = Array.isArray(filesData) ? filesData : (filesData ? [filesData] : []);
        for (const fileItem of fileList) {
            if (fileItem && fileItem.base64 && fileItem.mimeType) {
                const mime = fileItem.mimeType;
                // Gemini supports image/*, application/pdf, audio/*, video/*
                if (mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('audio/') || mime.startsWith('video/')) {
                    parts.push({
                        inlineData: {
                            mimeType: mime,
                            data: fileItem.base64
                        }
                    });
                }
            }
        }

        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: parts
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

    // OpenRouter API Call (Multimodal Vision / Image URL support for multiple images)
    async function callOpenRouterAPI(systemInstruction, userPrompt, model, filesData) {
        const apiKey = getStoredOpenRouterKey();
        if (!apiKey) {
            openKeyModal();
            advancedKeySection.classList.remove('hidden');
            throw new Error('Bạn chưa cài đặt OpenRouter API Key. Vui lòng mở Cấu Hình Key -> Nâng Cao để nhập.');
        }

        const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

        const fileList = Array.isArray(filesData) ? filesData : (filesData ? [filesData] : []);
        const imageFiles = fileList.filter(f => f && f.dataUrl && f.mimeType && f.mimeType.startsWith('image/'));

        let userMessageContent = userPrompt;
        if (imageFiles.length > 0) {
            userMessageContent = [
                { type: "text", text: userPrompt },
                ...imageFiles.map(img => ({
                    type: "image_url",
                    image_url: { url: img.dataUrl }
                }))
            ];
        }

        const payload = {
            model: model,
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userMessageContent }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://DangMinhSang.github.io/ghepcau',
                'X-Title': 'GhepCau AI'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Lỗi OpenRouter API HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const contentText = data.choices?.[0]?.message?.content;
        if (!contentText) {
            throw new Error('Phản hồi từ OpenRouter API rỗng.');
        }

        return contentText;
    }

    /* ==========================================================================
       4b. Public Google Translate API (Free / Unauthenticated)
       ========================================================================== */
    /**
     * Translate text using public Google Translate endpoint (no API key required).
     * @param {string} text - Source text to translate.
     * @param {string} targetLang - BCP-47 language code, default 'vi' (Vietnamese).
     * @param {string} sourceLang - BCP-47 source language code, default 'auto'.
     * @returns {Promise<string>} Translated text.
     */
    async function translateWithGoogleAPI(text, targetLang = 'vi', sourceLang = 'auto') {
        const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Lỗi kết nối Google Translate (${response.status})`);
        }

        const data = await response.json();
        if (data && data[0] && Array.isArray(data[0])) {
            const translatedText = data[0].map(item => item[0]).filter(Boolean).join('');
            if (translatedText) return translatedText;
        }

        throw new Error('Google Translate không trả về kết quả.');
    }

    /* ==========================================================================
       5. Generate Questions Flow (Direct File Payload + Text Extractor)
       ========================================================================== */
    const questionGenerationSchema = {
        type: "OBJECT",
        properties: {
            topic: { type: "STRING" },
            reading_passage: { type: "STRING" },
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
        if (!promptText && attachedFiles.length === 0) {
            showError('Thiếu thông tin', 'Vui lòng nhập yêu cầu (prompt) hoặc đính kèm file / dán ảnh tài liệu.');
            return;
        }

        const selectedModel = modelSelect.value;
        if (!selectedModel) {
            openKeyModal();
            showError('Thiếu API Key', 'Bạn chưa cài đặt API Key nào. Vui lòng nhập Gemini Key để bắt đầu sử dụng.');
            return;
        }

        lastPrompt = promptText;
        let finalUserPrompt = promptText || "Hãy phân tích các file/hình ảnh đính kèm và tạo bài tập phù hợp.";
        const filesData = [];

        if (attachedFiles.length > 0) {
            try {
                showLoading('Đang Chuẩn Bị File...', `Đang xử lý ${attachedFiles.length} file tài liệu/ảnh cho AI...`);
                for (let i = 0; i < attachedFiles.length; i++) {
                    const file = attachedFiles[i];
                    showLoading('Đang Chuẩn Bị File...', `Đang nạp file (${i + 1}/${attachedFiles.length}): ${file.name}...`);
                    const fileData = await fileToBase64(file);
                    filesData.push(fileData);

                    // Extract text if document file
                    const isDoc = !file.type.startsWith('image/');
                    if (isDoc) {
                        const text = await extractTextFromFile(file);
                        if (text && text.length > 0) {
                            finalUserPrompt += `\n\nNỘI DUNG VĂN BẢN TRÍCH XUẤT TỪ FILE "${file.name}":\n"""\n${text.substring(0, 15000)}\n"""`;
                        }
                    }
                }
            } catch (fileErr) {
                hideLoading();
                showError('Lỗi Đọc File', fileErr.message);
                return;
            }
        }

        const systemPrompt = `Bạn là một chuyên gia giáo dục xuất sắc. Nhiệm vụ của bạn là dựa theo yêu cầu người dùng và file đính kèm (ảnh, PDF, tài liệu...) để tạo bộ câu hỏi phù hợp.

QUY TẮC CÔNG THỨC TOÁN HỌC (LaTeX):
- Nếu bài tập liên quan đến Toán học, Vật lý, Hóa học: Hãy sử dụng cú pháp LaTeX trong cặp dấu $...$ (inline) hoặc $$...$$ (display) cho mọi công thức, căn thức, tích phân, phân số... Ví dụ: $\\sqrt{x^2+1}$, $\\int_0^1 f(x)dx$, $\\frac{a}{b}$.

QUY TẮC BÀI ĐỌC HỂU (READING PASSAGE):
- Hãy TỰ ĐỘNG PHÂN TÍCH xem prompt hoặc file đính kèm có chứa bài đọc/đoạn văn tham chiếu (ví dụ: task reading B1, bài đọc hiểu, văn bản dịch thuật, bài tập đọc phân tích...) hay không.
- Nếu CẦN BÀI ĐỌC hoặc có tệp bài đọc: Hãy điền nội dung bài đọc vào trường "reading_passage".
- Nếu KHÔNG CẦN BÀI ĐỌC: Đặt "reading_passage" là rỗng "".

Định dạng trả về BẮT BUỘC tuân thủ cấu trúc JSON:
{
  "topic": "Tên chủ đề bài làm",
  "reading_passage": "Nội dung bài đọc (nếu có, hoặc rỗng nếu không cần)",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Nội dung câu hỏi...",
      "options": {
        "A": "Phương án A",
        "B": "Phương án B",
        "C": "Phương án C",
        "D": "Phương án D"
      },
      "hint": "Gợi ý (nếu có)"
    }
  ]
}`;

        try {
            showLoading('AI Đang Tạo Bộ Câu Hỏi...', `Đang truyền dữ liệu file và xử lý prompt với ${selectedModel}...`);
            btnGenerate.disabled = true;

            const rawResponse = await callLLMAPI(systemPrompt, finalUserPrompt, selectedModel, questionGenerationSchema, filesData);
            const parsedData = parseAIJsonResponse(rawResponse);

            if (!parsedData.questions || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
                throw new Error('AI không tạo được danh sách câu hỏi hợp lệ. Vui lòng thử lại với prompt rõ ràng hơn.');
            }

            currentQuestions = parsedData.questions;
            currentReadingPassage = parsedData.reading_passage || '';
            userAnswers = {};

            renderQuestionsUI(parsedData.topic || 'Bộ Câu Hỏi AI', currentQuestions, currentReadingPassage);

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

    /* Render UI câu hỏi & Bài đọc hiểu (nếu có) & Trigger KaTeX */
    function renderQuestionsUI(topic, questions, readingPassage = '') {
        quizTopicTitle.textContent = topic;
        quizQuestionCount.textContent = `${questions.length} câu hỏi`;

        const quizColumnsLayout = document.querySelector('.quiz-columns-layout');
        const passageColumn = document.querySelector('.passage-column');

        if (readingPassage && readingPassage.trim() !== '') {
            readingPassageContent.innerHTML = escapeHtml(readingPassage);
            readingPassageContainer.classList.remove('hidden');
            if (passageColumn) passageColumn.classList.remove('hidden');
            if (quizColumnsLayout) quizColumnsLayout.classList.remove('no-passage');
        } else {
            readingPassageContent.innerHTML = '';
            readingPassageContainer.classList.add('hidden');
            if (passageColumn) passageColumn.classList.add('hidden');
            if (quizColumnsLayout) quizColumnsLayout.classList.add('no-passage');
        }

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

        // Render KaTeX Math Formulas
        renderMathInContainer(quizSection);
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

        let systemPrompt = `Bạn là một giáo viên chấm bài AI cực kỳ công bằng và chu đáo.
Hãy chấm điểm các câu trả lời trắc nghiệm ABCD và tự luận sau đây trên thang điểm 10.`;

        if (currentReadingPassage) {
            systemPrompt += `\nĐÂY LÀ BÀI ĐỌC HỂU THAM CHIẾU (READING PASSAGE):\n"""\n${currentReadingPassage}\n"""\nHãy chấm điểm dựa trên nội dung đoạn văn bài đọc này.`;
        }

        systemPrompt += `\n\nYÊU CẦU CHẤM ĐIỂM & TOÁN HỌC:
1. Nếu có công thức Toán học/Lý/Hóa: Viết công thức trong cặp dấu $...$ theo chuẩn LaTeX.
2. Với câu trắc nghiệm ABCD: Đối chiếu đáp án. Nếu đúng -> 10 điểm, giải thích tại sao đúng. Nếu sai -> 0 điểm, chỉ rõ đáp án đúng.
3. Với câu tự luận: Chấm trên thang điểm 10, giải thích NGẮN GỌN và đưa ra gợi ý cách sửa/đáp án gợi ý tốt nhất.
4. Trả về đúng định dạng JSON:
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

        // Trigger KaTeX Math formulas on results page
        renderMathInContainer(resultsSection);
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
            readingPassage: currentReadingPassage,
            questionCount: currentQuestions.length,
            averageScore: Number(lastEvaluations.average_score || 0).toFixed(1),
            overallFeedback: lastEvaluations.overall_feedback || '',
            questions: currentQuestions,
            userAnswers: userAnswers,
            evaluations: lastEvaluations
        };

        historyList.unshift(record);
        saveStoredHistory(historyList);

        btnSaveToHistory.innerHTML = '<i class="fa-solid fa-check"></i> Đã Lưu Vô Lịch Sử!';
        btnSaveToHistory.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        setTimeout(() => {
            btnSaveToHistory.innerHTML = '<i class="fa-solid fa-bookmark"></i> Lưu Vào Lịch Sử';
            btnSaveToHistory.style.background = '';
        }, 2000);
    });

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

            const hasPassage = item.readingPassage && item.readingPassage.trim() !== '';

            card.innerHTML = `
                <div class="history-card-header">
                    <div class="history-topic">${escapeHtml(item.topic)} ${hasPassage ? '<span class="type-badge mc" style="font-size:0.7rem; margin-left:6px;"><i class="fa-solid fa-book-open"></i> Bài đọc</span>' : ''}</div>
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

        historyListContainer.querySelectorAll('.btn-load-hist').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const list = getStoredHistory();
                const record = list.find(r => r.id === id);
                if (record) {
                    currentQuestions = record.questions || [];
                    currentReadingPassage = record.readingPassage || '';
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

        historyListContainer.querySelectorAll('.btn-delete-hist').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                let list = getStoredHistory();
                list = list.filter(r => r.id !== id);
                saveStoredHistory(list);
                renderHistoryListUI();
            });
        });

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
            const row = {
                "STT": idx + 1,
                "Loại câu hỏi": q.type === 'multiple_choice' ? 'Trắc nghiệm ABCD' : 'Tự luận',
                "Câu hỏi": q.question,
                "Bài làm người dùng": record.userAnswers[q.id] || '',
                "Điểm AI (Thang 10)": Number(ev.score || 0).toFixed(1),
                "Giải thích ngắn gọn": ev.explanation || '',
                "Đáp án đúng / Gợi ý": ev.improvement || ''
            };

            if (idx === 0 && record.readingPassage) {
                row["Đoạn văn bài đọc (Reading Passage)"] = record.readingPassage;
            }

            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Lich_su_bai_lam");
        XLSX.writeFile(workbook, `Lich_su_${record.topic.replace(/[^a-zA-Z0-9_]/g, '_')}.xlsx`);
    }

    /* ==========================================================================
       8. EXCEL IMPORT & EXPORT FEATURES (SheetJS)
       ========================================================================== */

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

            if (idx === 0 && currentReadingPassage) {
                row["Đoạn văn bài đọc (Reading Passage)"] = currentReadingPassage;
            }

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
                currentReadingPassage = '';

                if (jsonData[0] && (jsonData[0]['Đoạn văn bài đọc (Reading Passage)'] || jsonData[0]['Reading Passage'] || jsonData[0]['Bài đọc'])) {
                    currentReadingPassage = String(jsonData[0]['Đoạn văn bài đọc (Reading Passage)'] || jsonData[0]['Reading Passage'] || jsonData[0]['Bài đọc']);
                }

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
                renderQuestionsUI(`Bộ Câu Hỏi Nhập Từ Excel (${file.name})`, currentQuestions, currentReadingPassage);

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
            const row = {
                "STT": idx + 1,
                "Loại câu hỏi": q.type === 'multiple_choice' ? 'Trắc nghiệm ABCD' : 'Tự luận',
                "Câu hỏi": q.question,
                "Bài làm người dùng": userAnswers[q.id] || '',
                "Điểm AI (Thang 10)": Number(ev.score || 0).toFixed(1),
                "Giải thích ngắn gọn": ev.explanation || '',
                "Đáp án đúng / Gợi ý": ev.improvement || ''
            };

            if (idx === 0 && currentReadingPassage) {
                row["Đoạn văn bài đọc (Reading Passage)"] = currentReadingPassage;
            }

            return row;
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
        renderQuestionsUI(quizTopicTitle.textContent, currentQuestions, currentReadingPassage);
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

    /* ==========================================================================
       10. TEXT ANNOTATION & TRANSLATION FEATURE (Reading Passage)
           - Highlight (yellow background)
           - Underline (blue underline)
           - Remove: if text has both → remove both
           - Translate to Vietnamese via AI API
       ========================================================================== */
    (function initPassageAnnotations() {
        const passageContent  = document.getElementById('reading-passage-content');
        const toolbar         = document.getElementById('annotation-toolbar');
        const hlBtn           = document.getElementById('btn-annotate-highlight');
        const ulBtn           = document.getElementById('btn-annotate-underline');
        const rmBtn           = document.getElementById('btn-annotate-remove');
        const rmDivider       = document.getElementById('annot-remove-divider');
        const trBtn           = document.getElementById('btn-annotate-translate');
        const popup           = document.getElementById('translate-popup');
        const popupText       = document.getElementById('translate-popup-text');
        const popupSource     = document.getElementById('translate-source-text');
        const popupCloseBtn   = document.getElementById('btn-translate-close');

        if (!toolbar || !passageContent) return;

        let savedRange    = null;
        let selectedText  = '';
        let toolbarVisible = false;

        /* ---- Helpers ---- */
        function hideToolbar() {
            toolbar.classList.add('hidden');
            toolbarVisible = false;
        }

        function hidePopup() {
            popup.classList.add('hidden');
        }

        /** Find the nearest .hl-annotation ancestor within passageContent */
        function getAnnotationAncestor(node) {
            let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
            while (el && el !== passageContent) {
                if (el.classList && el.classList.contains('hl-annotation')) return el;
                el = el.parentElement;
            }
            return null;
        }

        /**
         * Check if the entire range is within ONE annotation span.
         * Returns that span or null.
         */
        function getEnclosingAnnotation(range) {
            const startSpan = getAnnotationAncestor(range.startContainer);
            const endSpan   = getAnnotationAncestor(range.endContainer);
            if (startSpan && startSpan === endSpan) return startSpan;
            return null;
        }

        /** Collect all .hl-annotation spans that overlap with the given range */
        function getOverlappingAnnotations(range) {
            const spans = Array.from(passageContent.querySelectorAll('.hl-annotation'));
            return spans.filter(span => {
                const spanRange = document.createRange();
                spanRange.selectNodeContents(span);
                return range.compareBoundaryPoints(Range.END_TO_START, spanRange) < 0 &&
                       range.compareBoundaryPoints(Range.START_TO_END, spanRange) > 0;
            });
        }

        /** Unwrap a span: move its children before it, then remove it */
        function unwrapSpan(span) {
            const parent = span.parentNode;
            if (!parent) return;
            while (span.firstChild) parent.insertBefore(span.firstChild, span);
            parent.removeChild(span);
            parent.normalize();
        }

        /** Wrap the current savedRange with a span bearing the given className(s) */
        function applyAnnotation(classes) {
            if (!savedRange) return;
            // Restore selection
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);

            const range = sel.getRangeAt(0);
            if (!passageContent.contains(range.commonAncestorContainer)) return;

            const span = document.createElement('span');
            span.className = 'hl-annotation ' + classes.join(' ');

            try {
                // surroundContents works when range doesn't split existing elements
                range.surroundContents(span);
            } catch (_) {
                // Fallback for complex selections (e.g. crossing multiple nodes)
                const fragment = range.extractContents();
                span.appendChild(fragment);
                range.insertNode(span);
            }

            sel.removeAllRanges();
        }

        /* ---- Show toolbar above selection ---- */
        function positionAndShowToolbar(rect, hasAnnotation, hasHL, hasUL) {
            // Update button states
            hlBtn.classList.toggle('active', hasHL);
            ulBtn.classList.toggle('active', hasUL);

            const showRemove = hasAnnotation && (hasHL || hasUL);
            rmBtn.classList.toggle('hidden', !showRemove);
            rmDivider.classList.toggle('hidden', !showRemove);

            toolbar.classList.remove('hidden');
            toolbarVisible = true;

            // Force layout to get real width
            const tbW = toolbar.offsetWidth || 270;
            const tbH = toolbar.offsetHeight || 44;

            let left = rect.left + rect.width / 2 - tbW / 2;
            let top  = rect.top - tbH - 12;

            // Clamp horizontally
            left = Math.max(8, Math.min(left, window.innerWidth - tbW - 8));
            // If not enough space above, show below
            if (top < 8) top = rect.bottom + 12;

            toolbar.style.left = left + 'px';
            toolbar.style.top  = top  + 'px';
        }

        /* ---- Detect selection on mouseup ---- */
        document.addEventListener('mouseup', (e) => {
            // Ignore clicks inside toolbar or popup
            if (toolbar.contains(e.target) || popup.contains(e.target)) return;

            // Small delay so browser finalises the selection
            setTimeout(() => {
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                    hideToolbar();
                    return;
                }

                const range = sel.getRangeAt(0);
                selectedText = sel.toString().trim();

                // Only activate for text inside the reading passage
                if (!passageContent.contains(range.commonAncestorContainer)) {
                    hideToolbar();
                    return;
                }

                savedRange = range.cloneRange();

                const enclosing = getEnclosingAnnotation(range);
                const hasHL = !!(enclosing && enclosing.classList.contains('hl-highlight'));
                const hasUL = !!(enclosing && enclosing.classList.contains('hl-underline'));

                positionAndShowToolbar(range.getBoundingClientRect(), !!enclosing, hasHL, hasUL);
            }, 10);
        });

        /* ---- Hide when clicking completely outside ---- */
        document.addEventListener('mousedown', (e) => {
            if (!toolbar.contains(e.target) &&
                !popup.contains(e.target) &&
                !passageContent.contains(e.target)) {
                hideToolbar();
                hidePopup();
                savedRange = null;
            }
        });

        /* ---- Highlight button ---- */
        hlBtn.addEventListener('mousedown', (e) => e.preventDefault()); // keep selection
        hlBtn.addEventListener('click', () => {
            if (!savedRange) return;
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
            const range = sel.getRangeAt(0);

            const enclosing = getEnclosingAnnotation(range);
            if (enclosing) {
                if (enclosing.classList.contains('hl-highlight')) {
                    // Toggle off highlight
                    enclosing.classList.remove('hl-highlight');
                    if (!enclosing.classList.contains('hl-underline')) unwrapSpan(enclosing);
                } else {
                    enclosing.classList.add('hl-highlight');
                }
            } else {
                applyAnnotation(['hl-highlight']);
            }
            sel.removeAllRanges();
            hideToolbar();
            hidePopup();
        });

        /* ---- Underline button ---- */
        ulBtn.addEventListener('mousedown', (e) => e.preventDefault());
        ulBtn.addEventListener('click', () => {
            if (!savedRange) return;
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
            const range = sel.getRangeAt(0);

            const enclosing = getEnclosingAnnotation(range);
            if (enclosing) {
                if (enclosing.classList.contains('hl-underline')) {
                    // Toggle off underline
                    enclosing.classList.remove('hl-underline');
                    if (!enclosing.classList.contains('hl-highlight')) unwrapSpan(enclosing);
                } else {
                    enclosing.classList.add('hl-underline');
                }
            } else {
                applyAnnotation(['hl-underline']);
            }
            sel.removeAllRanges();
            hideToolbar();
            hidePopup();
        });

        /* ---- Remove button (shown only when annotation exists) ---- */
        rmBtn.addEventListener('mousedown', (e) => e.preventDefault());
        rmBtn.addEventListener('click', () => {
            if (!savedRange) return;
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
            const range = sel.getRangeAt(0);

            // Remove the enclosing annotation span
            const enclosing = getEnclosingAnnotation(range);
            if (enclosing) unwrapSpan(enclosing);

            // Also remove any other overlapping spans (multi-span removal)
            getOverlappingAnnotations(range).forEach(unwrapSpan);

            sel.removeAllRanges();
            hideToolbar();
            hidePopup();
        });

        /* ---- Translate button ---- */
        trBtn.addEventListener('mousedown', (e) => e.preventDefault());
        trBtn.addEventListener('click', async () => {
            if (!selectedText) return;

            // Show popup in loading state immediately
            popupText.className = 'translate-popup-text loading';
            popupText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang dịch...';
            popupSource.textContent = '"' + selectedText.substring(0, 120) + (selectedText.length > 120 ? '…' : '') + '"';
            popup.classList.remove('hidden');

            // Position popup below toolbar
            const tbRect = toolbar.getBoundingClientRect();
            const popW   = popup.offsetWidth || 320;
            let pLeft = tbRect.left + tbRect.width / 2 - popW / 2;
            let pTop  = tbRect.bottom + 10;
            pLeft = Math.max(8, Math.min(pLeft, window.innerWidth - popW - 8));
            popup.style.left = pLeft + 'px';
            popup.style.top  = pTop  + 'px';

            trBtn.disabled = true;

            try {
                // Use Google Cloud Translation API v2 (dedicated, fast, accurate)
                const translation = await translateWithGoogleAPI(selectedText, 'vi');
                popupText.className = 'translate-popup-text';
                popupText.textContent = translation;

            } catch (err) {
                popupText.className = 'translate-popup-text';
                popupText.innerHTML = `<span style="color:#dc3545"><i class="fa-solid fa-circle-exclamation"></i> ${escapeHtml(err.message)}</span>`;
            } finally {
                trBtn.disabled = false;
            }
        });

        /* ---- Close translate popup ---- */
        if (popupCloseBtn) {
            popupCloseBtn.addEventListener('click', () => {
                hidePopup();
            });
        }

    })(); // end initPassageAnnotations

    // Initialize UI status & History count badge
    updateKeyStatusUI();
    updateHistoryBadge();
});
