let timerId = null;
let currentPhase = 'idle'; // 'prep', 'speak', 'idle'
let countdown = 0;

function switchSpeakTest(testId) {
    stopCurrentTimer();
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

function toggleSampleAnswer(elemId) {
    const box = document.getElementById(elemId);
    if (box) {
        if (box.style.display === 'none' || box.style.display === '') {
            box.style.display = 'block';
        } else {
            box.style.display = 'none';
        }
    }
}

function runPracticeTimer(contextId, prepSeconds, speakSeconds) {
    stopCurrentTimer();
    const displayEl = document.getElementById('active-speak-timer');
    const badgeEl = document.getElementById('speak-phase-badge');

    currentPhase = 'prep';
    countdown = prepSeconds;
    badgeEl.textContent = `Chuẩn bị: ${countdown}s`;
    badgeEl.className = 'speaking-phase-badge phase-prep';
    updateDisplay(countdown);

    timerId = setInterval(() => {
        countdown--;
        if (currentPhase === 'prep') {
            if (countdown > 0) {
                badgeEl.textContent = `Chuẩn bị: ${countdown}s`;
                updateDisplay(countdown);
            } else {
                currentPhase = 'speak';
                countdown = speakSeconds;
                badgeEl.textContent = `ĐANG NÓI...`;
                badgeEl.className = 'speaking-phase-badge phase-speak';
                updateDisplay(countdown);
                playBeep();
            }
        } else if (currentPhase === 'speak') {
            if (countdown > 0) {
                updateDisplay(countdown);
            } else {
                stopCurrentTimer();
                badgeEl.textContent = 'Hoàn thành bài nói!';
                badgeEl.className = 'speaking-phase-badge phase-done';
                playBeep();
            }
        }
    }, 1000);
}

function updateDisplay(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const el = document.getElementById('active-speak-timer');
    if (el) {
        el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

function stopCurrentTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
    currentPhase = 'idle';
    const badgeEl = document.getElementById('speak-phase-badge');
    if (badgeEl) {
        badgeEl.textContent = 'Sẵn sàng';
        badgeEl.className = 'speaking-phase-badge';
    }
    updateDisplay(0);
}

function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log("AudioContext not allowed without user interaction");
    }
}
