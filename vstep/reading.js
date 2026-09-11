const ANSWER_KEY = {
    1: 'D', 2: 'D', 3: 'A', 4: 'A', 5: 'A', 6: 'C', 7: 'C', 8: 'D', 9: 'A', 10: 'B',
    11: 'D', 12: 'C', 13: 'B', 14: 'B', 15: 'C', 16: 'B', 17: 'D', 18: 'A', 19: 'C', 20: 'A',
    21: 'B', 22: 'D', 23: 'D', 24: 'B', 25: 'A', 26: 'A', 27: 'D', 28: 'C', 29: 'D', 30: 'A',
    31: 'C', 32: 'D', 33: 'D', 34: 'A', 35: 'B', 36: 'B', 37: 'D', 38: 'D', 39: 'B', 40: 'C'
};

let userAnswers = {};
let totalSeconds = 3600;
let isPaused = false;
let timerInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initTimer();
});

function initTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        if (!isPaused && totalSeconds > 0) {
            totalSeconds--;
            updateTimerDisplay();
        } else if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            alert("Đã hết 60 phút làm bài Reading! Hệ thống sẽ tự động chấm điểm.");
            submitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const el = document.getElementById('timer');
    if (el) {
        el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        if (totalSeconds < 300) {
            el.style.color = '#dc2626';
        } else {
            el.style.color = '';
        }
    }
}

function toggleTimer() {
    isPaused = !isPaused;
    const btn = document.getElementById('btn-timer-toggle');
    if (btn) {
        btn.innerHTML = isPaused ? '<i class="fa-solid fa-play"></i> Tiếp tục' : '<i class="fa-solid fa-pause"></i> Tạm dừng';
    }
}

function recordAnswer(qNum, value) {
    userAnswers[qNum] = value;
    const palBtn = document.getElementById(`pal-btn-${qNum}`);
    if (palBtn) {
        palBtn.classList.add('answered');
    }
    const count = Object.keys(userAnswers).length;
    const countEl = document.getElementById('answered-count');
    if (countEl) countEl.textContent = count;
    
    const fillEl = document.getElementById('progress-fill');
    if (fillEl) fillEl.style.width = `${(count / 40) * 100}%`;
}

function scrollToQuestion(qNum) {
    const el = document.getElementById(`q-card-${qNum}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-focus');
        setTimeout(() => el.classList.remove('highlight-focus'), 1200);
    }
}

function submitExam() {
    clearInterval(timerInterval);
    let correct = 0;

    for (let q = 1; q <= 40; q++) {
        const correctAns = ANSWER_KEY[q];
        const userAns = userAnswers[q];
        const card = document.getElementById(`q-card-${q}`);
        const palBtn = document.getElementById(`pal-btn-${q}`);
        const feedback = document.getElementById(`feedback-${q}`);

        // Reset previous feedback styles
        ['A', 'B', 'C', 'D'].forEach(opt => {
            const row = document.getElementById(`opt-label-${q}-${opt}`);
            if (row) {
                row.classList.remove('ans-correct', 'ans-wrong');
            }
        });

        // Highlight correct option
        const correctRow = document.getElementById(`opt-label-${q}-${correctAns}`);
        if (correctRow) correctRow.classList.add('ans-correct');

        if (userAns === correctAns) {
            correct++;
            if (palBtn) {
                palBtn.classList.remove('pal-wrong');
                palBtn.classList.add('pal-correct');
            }
            if (feedback) {
                feedback.style.display = 'block';
                feedback.className = 'q-feedback-line feedback-correct';
                feedback.innerHTML = `<i class="fa-solid fa-check"></i> Đúng! Đáp án là <strong>${correctAns}</strong>`;
            }
        } else {
            if (userAns) {
                const userRow = document.getElementById(`opt-label-${q}-${userAns}`);
                if (userRow) userRow.classList.add('ans-wrong');
            }
            if (palBtn) {
                palBtn.classList.remove('pal-correct');
                palBtn.classList.add('pal-wrong');
            }
            if (feedback) {
                feedback.style.display = 'block';
                feedback.className = 'q-feedback-line feedback-wrong';
                feedback.innerHTML = `<i class="fa-solid fa-xmark"></i> Sai! Bạn chọn <strong>${userAns || 'Chưa trả lời'}</strong>. Đáp án đúng là <strong>${correctAns}</strong>`;
            }
        }
    }

    // Determine CEFR level
    // VSTEP Reading scale: 0-40 -> 0-10 -> B1 (4.0-5.5), B2 (6.0-8.0), C1 (8.5-10.0)
    const scale10 = ((correct / 40) * 10).toFixed(1);
    let level = 'Chưa đạt B1';
    let badgeClass = 'level-fail';
    if (scale10 >= 8.5) {
        level = 'Trình độ C1 (Xuất sắc)';
        badgeClass = 'level-c1';
    } else if (scale10 >= 6.0) {
        level = 'Trình độ B2 (Đạt chuẩn)';
        badgeClass = 'level-b2';
    } else if (scale10 >= 4.0) {
        level = 'Trình độ B1 (Đạt yêu cầu)';
        badgeClass = 'level-b1';
    }

    const modal = document.getElementById('score-result-card');
    const scoreNum = document.getElementById('score-number');
    const levelText = document.getElementById('score-level-text');
    if (modal && scoreNum && levelText) {
        modal.style.display = 'block';
        scoreNum.textContent = `${correct} / 40 (${scale10} điểm)`;
        levelText.textContent = level;
        levelText.className = `score-level-badge ${badgeClass}`;
        modal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function resetExam() {
    if (confirm("Bạn có chắc chắn muốn làm lại bài thi từ đầu?")) {
        userAnswers = {};
        totalSeconds = 3600;
        isPaused = false;
        
        document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
        document.querySelectorAll('.palette-btn').forEach(b => {
            b.className = 'palette-btn';
        });
        document.querySelectorAll('.option-row').forEach(row => {
            row.classList.remove('ans-correct', 'ans-wrong');
        });
        document.querySelectorAll('.q-feedback-line').forEach(f => f.style.display = 'none');
        
        const countEl = document.getElementById('answered-count');
        if (countEl) countEl.textContent = '0';
        const fillEl = document.getElementById('progress-fill');
        if (fillEl) fillEl.style.width = '0%';
        const modal = document.getElementById('score-result-card');
        if (modal) modal.style.display = 'none';

        initTimer();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
