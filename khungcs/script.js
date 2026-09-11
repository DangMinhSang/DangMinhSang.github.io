const curriculumData = [
    {
        semester: "Học kỳ 1",
        subjects: [
            { code: "IT001", name: "Nhập môn lập trình", lt: 3, th: 1, pre: [], type: "ĐC" },
            { code: "MA006", name: "Giải tích", lt: 4, th: 0, pre: [], type: "ĐC" },
            { code: "MA003", name: "Đại số tuyến tính", lt: 3, th: 0, pre: [], type: "ĐC" },
            { code: "CS005", name: "Giới thiệu ngành Khoa học Máy tính", lt: 1, th: 0, pre: [], type: "ĐC" },
            { code: "SS006", name: "Pháp luật đại cương", lt: 2, th: 0, pre: [], type: "ĐC" },
        ]
    },
    {
        semester: "Học kỳ 2",
        subjects: [
            { code: "IT002", name: "Lập trình hướng đối tượng", lt: 3, th: 1, pre: ["IT001"], type: "CSN" },
            { code: "IT003", name: "Cấu trúc dữ liệu và giải thuật", lt: 3, th: 1, pre: ["IT001"], type: "CSN" },
            { code: "IT012", name: "Tổ chức và Cấu trúc Máy tính II", lt: 3, th: 1, pre: [], type: "CSN" },
            { code: "MA004", name: "Cấu trúc rời rạc", lt: 4, th: 0, pre: [], type: "ĐC" },
            { code: "MA005", name: "Xác suất thống kê", lt: 3, th: 0, pre: ["MA006"], type: "ĐC" },
            { code: "PE231", name: "Giáo dục thể chất 1", lt: 0, th: 0, pre: [], type: "TC" },
            { code: "ENG01", name: "Anh văn 1", lt: 4, th: 0, pre: [], type: "ĐC" },
            { code: "ME001", name: "Giáo dục quốc phòng", lt: 0, th: 0, pre: [], type: "ĐC" },
        ]
    },
    {
        semester: "Học kỳ 3",
        subjects: [
            { code: "IT004", name: "Cơ sở dữ liệu", lt: 3, th: 1, pre: [], type: "CSN" },
            { code: "IT005", name: "Nhập môn mạng máy tính", lt: 3, th: 1, pre: [], type: "CSN" },
            { code: "IT007", name: "Hệ điều hành", lt: 3, th: 1, pre: ["IT012"], type: "CSN" },
            { code: "CS115", name: "Toán cho Khoa học máy tính", lt: 4, th: 0, pre: ["IT001"], type: "CN" },
            { code: "SS007", name: "Triết học Mác – Lênin", lt: 3, th: 0, pre: [], type: "ĐC" },
            { code: "PE232", name: "Giáo dục thể chất 2", lt: 0, th: 0, pre: ["PE231"], type: "TC" },
        ]
    },
    {
        semester: "Học kỳ 4",
        subjects: [
            { code: "CS112", name: "Phân tích và thiết kế thuật toán", lt: 3, th: 1, pre: ["IT003"], type: "CSN" },    
            { code: "CS111", name: "Nguyên lý và phương pháp lập trình", lt: 3, th: 1, pre: ["IT003"], type: "CSN" },
            { code: "CS523", name: "Cấu trúc dữ liệu và giải thuật nâng cao", lt: 3, th: 1, pre: ["IT003"], type: "CNTC" },
            { code: "CS106", name: "Trí tuệ nhân tạo", lt: 3, th: 1, pre: ["IT003"], type: "CSN" },
            { code: "SS004", name: "Kỹ năng nghề nghiệp", lt: 2, th: 0, pre: [], type: "ĐC" },
            { code: "SS008", name: "Kinh tế chính trị Mác – Lênin", lt: 2, th: 0, pre: [], type: "ĐC" },
        ]
    },
    {
        semester: "Học kỳ 5",
        subjects: [
            { code: "CS311", name: "Kỹ thuật lập trình trí tuệ nhân tạo", lt: 3, th: 1, pre: ["IT003"], type: "CN" },
            { code: "CS114", name: "Máy học", lt: 3, th: 1, pre: ["IT001", "MA003", "MA004"], type: "CN" },
            { code: "CS519", name: "Phương pháp luận nghiên cứu khoa học", lt: 3, th: 0, pre: [], type: "CNTC" },
            { code: "CS529", name: "Các vấn đề nghiên cứu và ứng dụng trong khoa học máy tính", lt: 4, th: 0, pre: [], type: "CNTC" },
            { code: "SS009", name: "Chủ nghĩa xã hội khoa học", lt: 2, th: 0, pre: [], type: "ĐC" },
            { code: "SS010", name: "Lịch sử Đảng Cộng sản Việt Nam", lt: 2, th: 0, pre: [], type: "ĐC" },
        ]
    },
    {
        semester: "Học kỳ 6",
        subjects: [
            { code: "CS211", name: "Trí tuệ nhân tạo nâng cao", lt: 3, th: 1, pre: ["CS106"], type: "CN" },
            { code: "CS315", name: "Máy học nâng cao", lt: 3, th: 1, pre: ["CS110"], type: "CN" },
            { code: "CS551", name: "Thực tập", lt: 2, th: 0, pre: [], type: "TTTN" },
            { code: "CS332", name: "Máy học trong Thị giác Máy tính", lt: 3, th: 1, pre: [], type: "CN" },
            { code: "SS003", name: "Tư tưởng Hồ Chí Minh", lt: 2, th: 0, pre: [], type: "ĐC" },
        ]
    },
    {
        semester: "Học kỳ 7",
        subjects: [
            { code: "CS505", name: "Khoá luận tốt nghiệp", lt: 10, th: 0, pre: [], type: "KLTN" },
        ]
    }
];

const typeColors = {
    'DC': '#64748b', 'CSN': '#3b82f6', 'CN': '#8b5cf6', 'CNTC': '#14b8a6', 'DA': '#ef4444', 'TTTN': '#ef4444', 'KLTN': '#ef4444'
};

const world = document.getElementById('world');
const svgLayer = document.getElementById('connections-layer');
const tooltip = document.getElementById('subject-tooltip');

let state = { scale: 1, panning: false, pointX: 50, pointY: 50, startX: 0, startY: 0 };

function renderCurriculum() {
    let totalCredits = 0;
    world.innerHTML = `<svg id="connections-layer">${svgLayer.innerHTML}</svg>`;
    const newSvgLayer = document.getElementById('connections-layer');
    
    curriculumData.forEach((semester) => {
        const col = document.createElement('div');
        col.className = "semester-column pb-4";
        col.innerHTML = `
            <div class="bg-slate-50 p-4 rounded-t-lg border-b border-slate-100 font-bold text-slate-700 text-center mb-3 sticky top-0 z-10 shadow-sm">
                ${semester.semester}
            </div>
            <div class="px-3 space-y-3 flex-1"></div>
        `;
        const listContainer = col.querySelector('.px-3');
        semester.subjects.forEach(sub => {
            totalCredits += sub.lt + sub.th;
            const card = document.createElement('div');
            card.className = `subject-card p-3 rounded-lg shadow-sm relative cursor-pointer type-${sub.type}`;
            card.setAttribute('id', `card-${sub.code}`);
            card.onmouseenter = (e) => { highlightConnection(sub.code); showTooltip(e, sub); };
            card.onmouseleave = resetHighlights;
            card.onmousemove = moveTooltip;
            card.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${sub.code}</span>
                    <span class="text-[10px] font-bold badge-${sub.type} px-1.5 py-0.5 rounded ml-1 whitespace-nowrap">${sub.type}</span>
                </div>
                <h3 class="text-sm font-bold text-slate-800 leading-tight mb-2">${sub.name}</h3>
                <div class="flex items-center text-xs text-slate-500"><i class="far fa-clock mr-1.5"></i> ${sub.lt} + ${sub.th} TC</div>
            `;
            listContainer.appendChild(card);
        });
        world.appendChild(col);
    });
    document.getElementById('total-credits').innerText = totalCredits;
}

function findSubject(code) {
    for (const sem of curriculumData) {
        const sub = sem.subjects.find(s => s.code === code);
        if (sub) return sub;
    }
    return null;
}

function findSubjectWithSemester(code) {
    for (let i = 0; i < curriculumData.length; i++) {
        const sub = curriculumData[i].subjects.find(s => s.code === code);
        if (sub) return { subject: sub, semIndex: i };
    }
    return null;
}

function getAllPrerequisites(code, list = new Set()) {
    const sub = findSubject(code);
    if (!sub || !sub.pre) return list;
    sub.pre.forEach(preCode => {
        if (!list.has(preCode)) {
            list.add(preCode);
            getAllPrerequisites(preCode, list);
        }
    });
    return list;
}

function highlightConnection(code) {
    const card = document.getElementById(`card-${code}`);
    if (!card || card.classList.contains('highlight-target')) return;
    card.classList.add('highlight-target');
    const incomingLines = document.querySelectorAll(`.connection-line[data-to="${code}"]`);
    incomingLines.forEach(line => {
        line.classList.add('active');
        const fromCode = line.getAttribute('data-from');
        const fromCard = document.getElementById(`card-${fromCode}`);
        if (fromCard) {
            fromCard.classList.add('highlight-source');
            highlightConnection(fromCode); // Đệ quy
        }
    });
}

function resetHighlights() {
    document.querySelectorAll('.subject-card').forEach(el => el.classList.remove('highlight-source', 'highlight-target'));
    document.querySelectorAll('.connection-line').forEach(el => el.classList.remove('active'));
    tooltip.classList.add('hidden');
}

function showTooltip(e, sub) {
    const preCodes = getAllPrerequisites(sub.code);
    const preNames = Array.from(preCodes).map(code => {
        const s = findSubject(code);
        return `<span class="pre-item">${code}: ${s ? s.name : 'Chưa rõ'}</span>`;
    }).join('');
    tooltip.innerHTML = `
        <div class="tooltip-title">${sub.name}</div>
        <div class="tooltip-info"><strong>Mã:</strong> ${sub.code} | <strong>Tín chỉ:</strong> ${sub.lt + sub.th}</div>
        <div class="tooltip-info"><strong>Môn cần học trước:</strong><br>${preNames || '<span class="text-slate-400 italic">Không có</span>'}</div>
    `;
    tooltip.classList.remove('hidden');
    moveTooltip(e);
}

function moveTooltip(e) {
    let x = e.clientX + 20, y = e.clientY + 20;
    if (x + 280 > window.innerWidth) x = e.clientX - 290;
    if (y + 160 > window.innerHeight) y = e.clientY - 180;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function drawLine(startEl, endEl, fromCode, toCode, colorType) {
    const startRect = getRelativePos(startEl), endRect = getRelativePos(endEl);
    const fromInfo = findSubjectWithSemester(fromCode), toInfo = findSubjectWithSemester(toCode);
    const startX = startRect.x + startRect.width, startY = startRect.y + startRect.height / 2;
    const endX = endRect.x, endY = endRect.y + endRect.height / 2;
    const semDiff = toInfo.semIndex - fromInfo.semIndex;

    let d = (semDiff >= 2) ? 
        `M ${startX} ${startY} C ${startX + (endX-startX)*0.25} ${startY-(50+semDiff*40)}, ${endX - (endX-startX)*0.25} ${endY-(50+semDiff*40)}, ${endX} ${endY}` : 
        `M ${startX} ${startY} L ${endX} ${endY}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "connection-line");
    path.setAttribute("data-from", fromCode);
    path.setAttribute("data-to", toCode);
    path.style.stroke = typeColors[colorType] || '#94a3b8';
    path.setAttribute("marker-end", `url(#arrow-${colorType})`);
    document.getElementById('connections-layer').appendChild(path);
}

function drawAllConnections() {
    curriculumData.forEach(semester => {
        semester.subjects.forEach(sub => {
            if (sub.pre) sub.pre.forEach(preCode => {
                const fromEl = document.getElementById(`card-${preCode}`), toEl = document.getElementById(`card-${sub.code}`);
                if (fromEl && toEl) drawLine(fromEl, toEl, preCode, sub.code, (findSubject(preCode)?.type || 'DC'));
            });
        });
    });
}

function getRelativePos(el) {
    const rect = el.getBoundingClientRect(), wRect = world.getBoundingClientRect();
    return { x: (rect.left - wRect.left) / state.scale, y: (rect.top - wRect.top) / state.scale, width: rect.width / state.scale, height: rect.height / state.scale };
}

function updateTransform() { world.style.transform = `translate(${state.pointX}px, ${state.pointY}px) scale(${state.scale})`; }

const viewportEl = document.getElementById('viewport');
viewportEl.addEventListener('mousedown', (e) => { state.panning = true; state.startX = e.clientX - state.pointX; state.startY = e.clientY - state.pointY; viewportEl.style.cursor = 'grabbing'; });
window.addEventListener('mouseup', () => { state.panning = false; viewportEl.style.cursor = 'grab'; });
window.addEventListener('mousemove', (e) => { if (!state.panning) return; state.pointX = e.clientX - state.startX; state.pointY = e.clientY - state.startY; updateTransform(); });
viewportEl.addEventListener('wheel', (e) => { e.preventDefault(); const xs = (e.clientX - state.pointX) / state.scale, ys = (e.clientY - state.pointY) / state.scale; (e.deltaY < 0) ? (state.scale *= 1.1) : (state.scale /= 1.1); state.scale = Math.min(Math.max(state.scale, 0.2), 3); state.pointX = e.clientX - xs * state.scale; state.pointY = e.clientY - ys * state.scale; updateTransform(); });

function resetView() { state.scale = 1; state.pointX = 50; state.pointY = 50; updateTransform(); }
function zoomIn() { state.scale = Math.min(state.scale * 1.2, 3); updateTransform(); }
function zoomOut() { state.scale = Math.max(state.scale / 1.2, 0.2); updateTransform(); }

renderCurriculum();
setTimeout(() => { drawAllConnections(); updateTransform(); }, 100);