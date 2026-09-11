let totalSeconds = 3600;
let isPaused = false;
let timerInterval = null;
let currentTestId = 'test-1';

document.addEventListener('DOMContentLoaded', () => {
    initTimer();
    loadAllDrafts();
});

function initTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        if (!isPaused && totalSeconds > 0) {
            totalSeconds--;
            updateTimerDisplay();
        } else if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            alert("Hết giờ làm bài phần Writing (60 phút)!");
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

function resetTimer() {
    totalSeconds = 3600;
    isPaused = false;
    const btn = document.getElementById('btn-timer-toggle');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm dừng';
    }
    updateTimerDisplay();
}

function switchTest(testId) {
    currentTestId = testId;
    document.querySelectorAll('.exam-content-area').forEach(sec => {
        sec.style.display = 'none';
    });
    const target = document.getElementById(testId);
    if (target) {
        target.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    document.querySelectorAll('.test-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(testId)) {
            btn.classList.add('active');
        }
    });
}

function updateWordCount(testId, taskNum) {
    const input = document.getElementById(`${testId}-t${taskNum}-input`);
    const countEl = document.getElementById(`${testId}-t${taskNum}-words`);
    const saveEl = document.getElementById(`${testId}-t${taskNum}-save`);
    
    if (!input || !countEl) return;
    
    const text = input.value.trim();
    const words = text.length === 0 ? 0 : text.split(/\s+/).filter(w => w.length > 0).length;
    countEl.textContent = words;
    
    const targetMin = taskNum === 1 ? 120 : 250;
    if (words >= targetMin) {
        countEl.style.color = '#16a34a';
    } else if (words >= targetMin * 0.7) {
        countEl.style.color = '#d97706';
    } else {
        countEl.style.color = '#6b7280';
    }
    
    localStorage.setItem(`vstep_writing_${testId}_t${taskNum}`, input.value);
    if (saveEl) {
        saveEl.style.opacity = '1';
        setTimeout(() => { saveEl.style.opacity = '0.5'; }, 1500);
    }
}

function loadAllDrafts() {
    for (let i = 1; i <= 10; i++) {
        const testId = `test-${i}`;
        [1, 2].forEach(taskNum => {
            const saved = localStorage.getItem(`vstep_writing_${testId}_t${taskNum}`);
            const input = document.getElementById(`${testId}-t${taskNum}-input`);
            if (saved && input) {
                input.value = saved;
                updateWordCount(testId, taskNum);
            }
        });
    }
}

function manualSave(testId) {
    [1, 2].forEach(taskNum => {
        const input = document.getElementById(`${testId}-t${taskNum}-input`);
        if (input) {
            localStorage.setItem(`vstep_writing_${testId}_t${taskNum}`, input.value);
        }
    });
    alert(`Đã lưu bài làm của ${testId.toUpperCase()} vào trình duyệt!`);
}

function clearDraft(testId) {
    if (confirm(`Bạn có chắc chắn muốn xóa bài làm của ${testId.toUpperCase()} để viết lại?`)) {
        [1, 2].forEach(taskNum => {
            const input = document.getElementById(`${testId}-t${taskNum}-input`);
            if (input) {
                input.value = '';
                localStorage.removeItem(`vstep_writing_${testId}_t${taskNum}`);
                updateWordCount(testId, taskNum);
            }
        });
    }
}
