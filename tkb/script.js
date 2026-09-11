/**
 * Công Cụ Xếp Thời Khóa Biểu UIT - Embedded Header Alignment & Panel Resizer
 * Author: Minh Sang
 */

// Global Application State
const appState = {
    rawRecords: [],
    sortedRecords: [],
    selectedClassIds: new Set(), // Set of selected record IDs
    currentStep: 1,
    autoSchedulerCombos: [],
    currentComboIndex: 0
};

// Period Timing Definitions
const PERIOD_TIMINGS = {
    1: "7:30 - 8:15",
    2: "8:15 - 9:00",
    3: "9:00 - 9:45",
    4: "10:00 - 10:45",
    5: "10:45 - 11:30",
    6: "13:00 - 13:45",
    7: "13:45 - 14:30",
    8: "14:30 - 15:15",
    9: "15:30 - 16:15",
    10: "16:15 - 17:00",
    11: "17:30 - 18:15",
    12: "18:15 - 19:00",
    13: "19:00 - 19:45",
    14: "19:45 - 20:30"
};

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop();
    setupPanelResizer();
    loadSidebarState();
    loadFromLocalStorage();
    
    // Auto load sample data on initial view if no upload yet
    if (window.SAMPLE_TKB_DATA && Array.isArray(window.SAMPLE_TKB_DATA)) {
        processParsedRecords(window.SAMPLE_TKB_DATA, "TKB_KHDT_14-08-2026_HK1_NH2026.xlsx");
    }
});

// Sidebar Collapse / Expand Toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    const toggleIcon = document.querySelector('.sidebar-toggle-btn i');
    if (!sidebar) return;

    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');

    if (toggleIcon) {
        if (isCollapsed) {
            toggleIcon.className = 'fa-solid fa-angles-right';
        } else {
            toggleIcon.className = 'fa-solid fa-angles-left';
        }
    }

    try {
        localStorage.setItem('uit_tkb_sidebar_collapsed', isCollapsed ? '1' : '0');
    } catch (e) {}
}

function loadSidebarState() {
    try {
        const isCollapsed = localStorage.getItem('uit_tkb_sidebar_collapsed') === '1';
        if (isCollapsed) {
            const sidebar = document.querySelector('.app-sidebar');
            const toggleIcon = document.querySelector('.sidebar-toggle-btn i');
            if (sidebar) sidebar.classList.add('collapsed');
            if (toggleIcon) toggleIcon.className = 'fa-solid fa-angles-right';
        }
    } catch (e) {}
}

// Setup Panel Drag Resizer Handle Bar (Zero-Lag Ghost Resizer Line)
function setupPanelResizer() {
    const resizer = document.getElementById('panel-resizer');
    const leftPanel = document.getElementById('center-table-panel');
    const rightPanel = document.getElementById('right-timetable-panel');
    const container = document.querySelector('.workspace-body');

    if (!resizer || !leftPanel || !rightPanel || !container) return;

    let isDragging = false;
    let startX = 0;
    let startLeftWidth = 0;
    let containerWidth = 0;
    let currentDx = 0;

    let ghostLine = document.getElementById('resizer-ghost-line');
    if (!ghostLine) {
        ghostLine = document.createElement('div');
        ghostLine.id = 'resizer-ghost-line';
        ghostLine.className = 'resizer-ghost-line';
        container.appendChild(ghostLine);
    }

    let overlay = document.getElementById('drag-active-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'drag-active-overlay';
        overlay.className = 'drag-active-overlay';
        document.body.appendChild(overlay);
    }

    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startLeftWidth = leftPanel.offsetWidth;
        containerWidth = container.offsetWidth;
        currentDx = 0;

        const resizerLeft = resizer.offsetLeft;
        ghostLine.style.left = `${resizerLeft}px`;
        ghostLine.style.transform = `translate3d(0, 0, 0)`;
        ghostLine.classList.add('active');

        resizer.classList.add('dragging');
        overlay.classList.add('active');
        document.body.style.cursor = 'col-resize';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rawDx = e.clientX - startX;
        const targetLeftWidth = startLeftWidth + rawDx;

        const minLeft = 280;
        const maxLeft = containerWidth - 320;
        const clampedLeftWidth = Math.max(minLeft, Math.min(targetLeftWidth, maxLeft));
        currentDx = clampedLeftWidth - startLeftWidth;

        ghostLine.style.transform = `translate3d(${currentDx}px, 0, 0)`;
    }, { passive: true });

    const stopDragging = () => {
        if (isDragging) {
            isDragging = false;

            const finalLeftWidth = startLeftWidth + currentDx;
            const leftPercent = (finalLeftWidth / containerWidth) * 100;

            leftPanel.style.flex = `0 0 ${leftPercent}%`;
            rightPanel.style.flex = `1 1 0%`;

            ghostLine.classList.remove('active');
            resizer.classList.remove('dragging');
            overlay.classList.remove('active');
            document.body.style.cursor = '';
        }
    };

    window.addEventListener('mouseup', stopDragging);
}

// Period Parser Function
function parsePeriodString(rawTiet) {
    if (!rawTiet) return ['*'];
    const tStr = String(rawTiet).trim();
    if (!tStr || tStr === '*') return ['*'];

    if (tStr === '121314') return [12, 13, 14];
    if (tStr === '1213') return [12, 13];
    if (tStr === '678910') return [6, 7, 8, 9, 10];
    if (tStr === '78910') return [7, 8, 9, 10];
    if (tStr === '910') return [9, 10];
    if (tStr === '12345') return [1, 2, 3, 4, 5];
    if (tStr === '1234') return [1, 2, 3, 4];
    if (tStr === '123') return [1, 2, 3];
    if (tStr === '12') return [1, 2];
    if (tStr === '23') return [2, 3];
    if (tStr === '2345') return [2, 3, 4, 5];
    if (tStr === '345') return [3, 4, 5];
    if (tStr === '45') return [4, 5];
    if (tStr === '67') return [6, 7];
    if (tStr === '678') return [6, 7, 8];
    if (tStr === '6789') return [6, 7, 8, 9];
    if (tStr === '78') return [7, 8];

    const result = [];
    for (let i = 0; i < tStr.length; i++) {
        const char = tStr[i];
        if (/\d/.test(char)) {
            result.push(parseInt(char, 10));
        }
    }
    return result.length > 0 ? result : ['*'];
}

// Parent LT Class Matching Helper
function getParentLtCode(cls, recordsList = appState.rawRecords) {
    if (cls.htgd === 'LT' || cls.sheet === 'LT') return cls.ma_lop;

    const ma_lop = cls.ma_lop;
    const sameSubjLt = recordsList.filter(r => r.ma_mh === cls.ma_mh && (r.htgd === 'LT' || r.sheet === 'LT'));

    const matchingLts = sameSubjLt.filter(lt => ma_lop.startsWith(lt.ma_lop + '.'));
    if (matchingLts.length > 0) {
        matchingLts.sort((a, b) => b.ma_lop.length - a.ma_lop.length);
        return matchingLts[0].ma_lop;
    }

    const parts = ma_lop.split('.');
    if (parts.length >= 3) {
        return parts.slice(0, -1).join('.');
    }
    return ma_lop;
}

// Sort Records: Practice classes (TH) placed IMMEDIATELY after corresponding Theory class (LT)
function sortClassRecords(records) {
    const recordsBySubj = {};
    records.forEach(r => {
        if (!recordsBySubj[r.ma_mh]) recordsBySubj[r.ma_mh] = [];
        recordsBySubj[r.ma_mh].push(r);
    });

    return [...records].sort((a, b) => {
        if (a.ma_mh !== b.ma_mh) return a.ma_mh.localeCompare(b.ma_mh);

        const parentLtA = getParentLtCode(a, recordsBySubj[a.ma_mh] || []);
        const parentLtB = getParentLtCode(b, recordsBySubj[b.ma_mh] || []);

        if (parentLtA !== parentLtB) return parentLtA.localeCompare(parentLtB);

        const isThA = (a.htgd !== 'LT' && a.sheet !== 'LT') ? 1 : 0;
        const isThB = (b.htgd !== 'LT' && b.sheet !== 'LT') ? 1 : 0;

        if (isThA !== isThB) return isThA - isThB;

        return a.ma_lop.localeCompare(b.ma_lop);
    });
}

// Drag & Drop Handlers
function setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) processExcelFile(files[0]);
    }, false);
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files && files.length > 0) processExcelFile(files[0]);
}

function loadSampleData(event) {
    if (event) event.stopPropagation();
    if (window.SAMPLE_TKB_DATA && Array.isArray(window.SAMPLE_TKB_DATA)) {
        processParsedRecords(window.SAMPLE_TKB_DATA, "TKB_KHDT_14-08-2026_HK1_NH2026.xlsx");
        goToStep(2);
    }
}

// Read Excel File
function processExcelFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const records = parseWorkbookToRecords(workbook);
            if (records.length === 0) {
                alert("Không tìm thấy dữ liệu hợp lệ trong file Excel!");
                return;
            }
            processParsedRecords(records, file.name);
            goToStep(2);
        } catch (err) {
            alert("Lỗi khi đọc file Excel!");
            console.error(err);
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseWorkbookToRecords(workbook) {
    const records = [];
    workbook.SheetNames.forEach((sheetName, sIdx) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (!rows || rows.length === 0) return;

        let headerIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 25); i++) {
            const rStr = rows[i].map(c => String(c).toUpperCase());
            if (rStr.includes('MÃ MH') || rStr.includes('MA MH') || rStr.includes('TÊN MÔN HỌC')) {
                headerIdx = i;
                break;
            }
        }
        if (headerIdx === -1) headerIdx = 7;

        const headers = rows[headerIdx].map(c => String(c).trim().toUpperCase());
        const colMap = {
            stt: headers.findIndex(h => h.includes('STT')),
            ma_mh: headers.findIndex(h => h.includes('MÃ MH') || h.includes('MA MH')),
            ma_lop: headers.findIndex(h => h.includes('LỚP') || h.includes('LOP')),
            ten_mh: headers.findIndex(h => h.includes('TÊN MÔN') || h.includes('TEN MON')),
            ten_gv: headers.findIndex(h => h.includes('GIẢNG VIÊN') || h.includes('TRỢ GIẢNG')),
            si_so: headers.findIndex(h => h.includes('SĨ SỐ') || h.includes('SI SO')),
            so_tc: headers.findIndex(h => h.includes('TC') || h.includes('TÍN CHỈ')),
            thuc_hanh: headers.findIndex(h => h.includes('THỰC HÀNH') || h.includes('THUC HANH')),
            htgd: headers.findIndex(h => h.includes('HTGD')),
            thu: headers.findIndex(h => h.includes('THỨ') || h.includes('THU')),
            tiet: headers.findIndex(h => h.includes('TIẾT') || h.includes('TIET')),
            cach_tuan: headers.findIndex(h => h.includes('TUẦN') || h.includes('TUAN')),
            phong: headers.findIndex(h => h.includes('PHÒNG') || h.includes('PHONG')),
            khoa: headers.findIndex(h => h.includes('KHÓA') || h.includes('KHOA'))
        };

        const sheetType = sIdx === 0 ? 'LT' : 'TH';

        for (let i = headerIdx + 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length < 3) continue;

            const ma_mh = colMap.ma_mh >= 0 ? String(r[colMap.ma_mh] || "").trim() : "";
            if (!ma_mh || ma_mh === "STT" || ma_mh === "MÃ MH") continue;

            const stt = colMap.stt >= 0 ? String(r[colMap.stt] || "").trim() : String(i);
            const ma_lop = colMap.ma_lop >= 0 ? String(r[colMap.ma_lop] || "").trim() : ma_mh;
            const ten_mh = colMap.ten_mh >= 0 ? String(r[colMap.ten_mh] || "").trim() : "";
            const ten_gv = colMap.ten_gv >= 0 ? String(r[colMap.ten_gv] || "").trim() : "";
            const si_so = colMap.si_so >= 0 ? String(r[colMap.si_so] || "").trim() : "";
            const so_tc_raw = colMap.so_tc >= 0 ? String(r[colMap.so_tc] || "").trim() : "0";
            const thuc_hanh_raw = colMap.thuc_hanh >= 0 ? String(r[colMap.thuc_hanh] || "").trim() : "0";
            const htgd = colMap.htgd >= 0 ? String(r[colMap.htgd] || "").trim() : sheetType;
            const thu = colMap.thu >= 0 ? String(r[colMap.thu] || "").trim() : "";
            const tiet_raw = colMap.tiet >= 0 ? String(r[colMap.tiet] || "").trim() : "";
            const cach_tuan = colMap.cach_tuan >= 0 ? String(r[colMap.cach_tuan] || "").trim() : "1";
            const phong = colMap.phong >= 0 ? String(r[colMap.phong] || "").trim() : "";
            const khoa = colMap.khoa >= 0 ? String(r[colMap.khoa] || "").trim() : "";

            const tiet_parsed = parsePeriodString(tiet_raw);

            records.push({
                id: `${ma_lop}_${htgd}_${stt}_${i}`,
                stt, ma_mh, ma_lop, ten_mh, ten_gv, si_so,
                so_tc: parseInt(so_tc_raw, 10) || 0,
                thuc_hanh: parseInt(thuc_hanh_raw, 10) || 0,
                htgd, thu, tiet_raw, tiet_parsed, cach_tuan, phong, khoa,
                sheet: sheetType
            });
        }
    });

    return records;
}

// Process Records
function processParsedRecords(records, filename) {
    appState.rawRecords = records;
    appState.sortedRecords = sortClassRecords(records);

    const fileLabel = document.getElementById('imported-filename');
    if (fileLabel) fileLabel.innerText = filename;

    const subjSet = new Set(records.map(r => r.ma_mh));
    let ltCount = 0, thCount = 0;
    records.forEach(r => { if (r.htgd === 'LT' || r.sheet === 'LT') ltCount++; else thCount++; });

    if (document.getElementById('stat-total-subjects')) document.getElementById('stat-total-subjects').innerText = subjSet.size.toLocaleString();
    if (document.getElementById('stat-total-classes')) document.getElementById('stat-total-classes').innerText = records.length.toLocaleString();
    if (document.getElementById('stat-lt-classes')) document.getElementById('stat-lt-classes').innerText = ltCount.toLocaleString();
    if (document.getElementById('stat-th-classes')) document.getElementById('stat-th-classes').innerText = thCount.toLocaleString();

    document.getElementById('footer-total-rows').innerText = records.length.toLocaleString();

    renderClassTable();
    renderTimetableGrid();
}

// Step Navigation
function goToStep(stepNum) {
    appState.currentStep = stepNum;

    const step1View = document.getElementById('step-1-view');
    const step2View = document.getElementById('step-2-view');
    const step3View = document.getElementById('step-3-view');

    const nav1 = document.getElementById('step-nav-1');
    const nav2 = document.getElementById('step-nav-2');
    const nav3 = document.getElementById('step-nav-3');

    step1View.classList.add('hidden');
    step2View.classList.add('hidden');
    if (step3View) step3View.classList.add('hidden');

    nav1.classList.remove('active');
    nav2.classList.remove('active');
    if (nav3) nav3.classList.remove('active');

    if (stepNum === 1) {
        step1View.classList.remove('hidden');
        nav1.classList.add('active');
    } else if (stepNum === 2) {
        step2View.classList.remove('hidden');
        nav2.classList.add('active');
        renderClassTable();
        renderTimetableGrid();
    } else if (stepNum === 3) {
        if (step3View) step3View.classList.remove('hidden');
        if (nav3) nav3.classList.add('active');
        renderStep3Summary();
    }
}

// Render Table in center-table-panel
function renderClassTable() {
    const tbody = document.getElementById('class-table-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const filterSubj = (document.getElementById('filter-subject-input')?.value || '').toLowerCase().trim();
    const filterClass = (document.getElementById('filter-class-input')?.value || '').toLowerCase().trim();
    const filterTeacher = (document.getElementById('filter-teacher-input')?.value || '').toLowerCase().trim();
    const filterDay = (document.getElementById('filter-day-input')?.value || '').trim();
    const filterTiet = (document.getElementById('filter-tiet-input')?.value || '').trim();

    const filtered = appState.sortedRecords.filter(r => {
        if (filterSubj && !r.ma_mh.toLowerCase().includes(filterSubj) && !r.ten_mh.toLowerCase().includes(filterSubj)) return false;
        if (filterClass && !r.ma_lop.toLowerCase().includes(filterClass)) return false;
        if (filterTeacher && !r.ten_gv.toLowerCase().includes(filterTeacher)) return false;
        if (filterDay && r.thu !== filterDay) return false;
        if (filterTiet && !r.tiet_raw.includes(filterTiet)) return false;
        return true;
    });

    document.getElementById('footer-rows-count').innerText = filtered.length.toLocaleString();

    const selectedBySubj = {};
    appState.selectedClassIds.forEach(id => {
        const c = appState.rawRecords.find(r => r.id === id);
        if (c) {
            if (!selectedBySubj[c.ma_mh]) selectedBySubj[c.ma_mh] = { lt: null, th: null };
            if (c.htgd === 'LT' || c.sheet === 'LT') selectedBySubj[c.ma_mh].lt = c;
            else selectedBySubj[c.ma_mh].th = c;
        }
    });

    filtered.forEach(cls => {
        const isChecked = appState.selectedClassIds.has(cls.id);
        let isConflicted = false;
        const subjSel = selectedBySubj[cls.ma_mh];

        if (subjSel && subjSel.lt) {
            const selectedLtCode = subjSel.lt.ma_lop;
            const parentLtCode = getParentLtCode(cls);

            if (cls.htgd === 'LT' || cls.sheet === 'LT') {
                if (cls.ma_lop !== selectedLtCode) isConflicted = true;
            } else {
                if (parentLtCode !== selectedLtCode) isConflicted = true;
            }
        }

        if (!isConflicted && !isChecked) {
            if (checkTimeOverlapWithOtherSubjects(cls)) {
                isConflicted = true;
            }
        }

        const tr = document.createElement('tr');
        tr.className = `${isChecked ? 'selected-row' : ''} ${isConflicted && !isChecked ? 'conflicted-row' : ''}`;
        tr.onclick = () => handleRowSelectionClick(cls);

        const isTh = (cls.htgd !== 'LT' && cls.sheet !== 'LT');

        tr.innerHTML = `
            <td class="checkbox-col" onclick="event.stopPropagation();">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="handleRowSelectionClick({id:'${cls.id}'})" class="checkbox-input">
            </td>
            <td class="font-bold text-slate-800">${cls.ma_mh} – ${cls.ten_mh}</td>
            <td class="font-bold text-slate-900 ${isTh ? 'pl-4 text-amber-700' : ''}">${cls.ma_lop}</td>
            <td>${cls.ten_gv || '-'}</td>
            <td class="text-center font-bold">${cls.thu || '*'}</td>
            <td class="text-center font-mono">${cls.tiet_raw || '*'}</td>
        `;

        tbody.appendChild(tr);
    });

    updateFooterStats();
}

function filterClassTable() {
    renderClassTable();
}

function updateFooterStats() {
    const selectedClasses = Array.from(appState.selectedClassIds)
        .map(id => appState.rawRecords.find(r => r.id === id))
        .filter(Boolean);

    document.getElementById('footer-selected-count').innerText = selectedClasses.length;

    let totalCredits = 0;
    selectedClasses.forEach(c => {
        totalCredits += (c.so_tc || 0);
    });

    document.getElementById('footer-credit-count').innerText = totalCredits;
}

function checkTimeOverlapWithOtherSubjects(classObj) {
    if (!classObj.thu || classObj.thu === '*' || classObj.tiet_parsed.includes('*')) return null;

    for (const selId of appState.selectedClassIds) {
        const selClass = appState.rawRecords.find(r => r.id === selId);
        if (!selClass || selClass.id === classObj.id) continue;
        if (selClass.ma_mh === classObj.ma_mh) continue;

        if (checkClassesOverlap(classObj, selClass)) {
            return selClass;
        }
    }
    return null;
}

function checkClassesOverlap(classA, classB) {
    if (!classA.thu || !classB.thu || classA.thu === '*' || classB.thu === '*') return false;
    if (classA.thu !== classB.thu) return false;
    if (classA.tiet_parsed.includes('*') || classB.tiet_parsed.includes('*')) return false;

    const setA = new Set(classA.tiet_parsed);
    for (const p of classB.tiet_parsed) {
        if (setA.has(p)) return true;
    }
    return false;
}

// Handle Selection and Dependency Rules
function handleRowSelectionClick(classParam) {
    const targetId = typeof classParam === 'string' ? classParam : classParam.id;
    const cls = appState.rawRecords.find(r => r.id === targetId);
    if (!cls) return;

    const isCurrentlySelected = appState.selectedClassIds.has(cls.id);

    if (isCurrentlySelected) {
        appState.selectedClassIds.delete(cls.id);

        if (cls.htgd === 'LT' || cls.sheet === 'LT') {
            appState.selectedClassIds.forEach(selId => {
                const selC = appState.rawRecords.find(r => r.id === selId);
                if (selC && selC.ma_mh === cls.ma_mh && selC.id !== cls.id) {
                    appState.selectedClassIds.delete(selId);
                }
            });
        }
    } else {
        const isTh = (cls.htgd !== 'LT' && cls.sheet !== 'LT');

        if (isTh) {
            const parentLtCode = getParentLtCode(cls);
            const matchingLt = appState.rawRecords.find(r => r.ma_mh === cls.ma_mh && (r.htgd === 'LT' || r.sheet === 'LT') && r.ma_lop === parentLtCode);

            if (!matchingLt) {
                alert(`⚠️ Không tìm thấy lớp lý thuyết tương ứng với lớp thực hành [${cls.ma_lop}]!`);
                return;
            }

            const ltConflict = checkTimeOverlapWithOtherSubjects(matchingLt);
            if (ltConflict) {
                alert(`⚠️ Trùng lịch học! Lớp lý thuyết tương ứng [${matchingLt.ma_lop}] bị trùng Thứ ${matchingLt.thu} (Tiết ${matchingLt.tiet_raw}) với lớp [${ltConflict.ma_lop} - ${ltConflict.ten_mh}] đã chọn!`);
                return;
            }

            const thConflict = checkTimeOverlapWithOtherSubjects(cls);
            if (thConflict) {
                alert(`⚠️ Trùng lịch học! Lớp thực hành [${cls.ma_lop}] bị trùng Thứ ${cls.thu} (Tiết ${cls.tiet_raw}) với lớp [${thConflict.ma_lop} - ${thConflict.ten_mh}] đã chọn!`);
                return;
            }

            appState.selectedClassIds.forEach(selId => {
                const selC = appState.rawRecords.find(r => r.id === selId);
                if (selC && selC.ma_mh === cls.ma_mh) {
                    appState.selectedClassIds.delete(selId);
                }
            });

            appState.selectedClassIds.add(matchingLt.id);
            appState.selectedClassIds.add(cls.id);

        } else {
            const ltConflict = checkTimeOverlapWithOtherSubjects(cls);
            if (ltConflict) {
                alert(`⚠️ Trùng lịch học! Lớp lý thuyết [${cls.ma_lop}] bị trùng Thứ ${cls.thu} (Tiết ${cls.tiet_raw}) với lớp [${ltConflict.ma_lop} - ${ltConflict.ten_mh}] đã chọn!`);
                return;
            }

            appState.selectedClassIds.forEach(selId => {
                const selC = appState.rawRecords.find(r => r.id === selId);
                if (selC && selC.ma_mh === cls.ma_mh) {
                    appState.selectedClassIds.delete(selId);
                }
            });

            appState.selectedClassIds.add(cls.id);
        }
    }

    saveToLocalStorage();
    renderClassTable();
    renderTimetableGrid();
}

// Render Visual Timetable Grid
function renderTimetableGrid() {
    const tbody = document.getElementById('tkb-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const selectedClasses = Array.from(appState.selectedClassIds)
        .map(id => appState.rawRecords.find(r => r.id === id))
        .filter(Boolean);

    const scheduledClasses = selectedClasses.filter(c => c.thu && c.thu !== '*' && !c.tiet_parsed.includes('*'));
    const unscheduledClasses = selectedClasses.filter(c => !c.thu || c.thu === '*' || c.tiet_parsed.includes('*'));

    const occupied = {};
    for (let day = 2; day <= 7; day++) occupied[day] = {};

    scheduledClasses.forEach(cls => {
        const day = parseInt(cls.thu, 10);
        if (isNaN(day) || day < 2 || day > 7) return;

        const periods = cls.tiet_parsed.filter(p => typeof p === 'number').sort((a, b) => a - b);
        if (periods.length === 0) return;

        const startPeriod = periods[0];
        const spanLength = periods.length;

        occupied[day][startPeriod] = {
            isStart: true,
            span: spanLength,
            classObj: cls
        };

        for (let i = 1; i < periods.length; i++) {
            occupied[day][periods[i]] = { isStart: false };
        }
    });

    const daysList = [2, 3, 4, 5, 6, 7];

    for (let p = 1; p <= 10; p++) {
        const tr = document.createElement('tr');

        const timeTd = document.createElement('td');
        timeTd.className = "time-cell";
        timeTd.innerHTML = `<div class="p-name">Tiết ${p}</div><div>(${PERIOD_TIMINGS[p] || ''})</div>`;
        tr.appendChild(timeTd);

        daysList.forEach(day => {
            const cellInfo = occupied[day][p];

            if (cellInfo) {
                if (cellInfo.isStart) {
                    const td = document.createElement('td');
                    td.rowSpan = cellInfo.span;

                    const cls = cellInfo.classObj;
                    const isConflicted = checkTimeOverlapWithOtherSubjects(cls) !== null;

                    td.innerHTML = `
                        <div class="timetable-card hover:border-rose-400 cursor-pointer group" onclick="handleRowSelectionClick({id: '${cls.id}'})" title="Nhấp để xóa môn [${cls.ma_lop} - ${cls.ten_mh}] (${cls.so_tc} TC) khỏi Thời khóa biểu">
                            <div class="card-code flex items-center justify-between gap-1">
                                <span>${cls.ma_lop} ${isConflicted ? '<span class="warning-icon">⚠️ .</span>' : ''}</span>
                                <div class="flex items-center gap-1">
                                    <span class="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1 rounded font-bold">${cls.so_tc} TC</span>
                                    <span class="text-rose-500 hover:text-rose-700 opacity-60 group-hover:opacity-100 font-bold text-xs" title="Xóa môn này">×</span>
                                </div>
                            </div>
                            <div class="card-name">${cls.ten_mh}</div>
                            <div class="card-teacher">${cls.ten_gv || ''}</div>
                            <div class="card-room">${cls.phong || '*'}</div>
                            <div class="card-dates">BĐ: NaN-NaN-NaN<br>KT: NaN-NaN-NaN</div>
                        </div>
                    `;
                    tr.appendChild(td);
                }
            } else {
                tr.appendChild(document.createElement('td'));
            }
        });

        tbody.appendChild(tr);
    }

    renderUnscheduledStarList(unscheduledClasses);
}

// Render Unscheduled Star * Classes
function renderUnscheduledStarList(list) {
    const container = document.getElementById('unscheduled-list');
    if (!container) return;

    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<p class="text-slate-400 italic text-xs">Chưa có môn * nào được chọn.</p>`;
        return;
    }

    list.forEach(cls => {
        const isConflicted = checkTimeOverlapWithOtherSubjects(cls) !== null;
        const card = document.createElement('div');
        card.className = "timetable-card hover:border-rose-400 cursor-pointer group";
        card.title = `Nhấp để xóa môn [${cls.ma_lop} - ${cls.ten_mh}] (${cls.so_tc} TC) khỏi Thời khóa biểu`;
        card.onclick = () => handleRowSelectionClick(cls);
        card.innerHTML = `
            <div class="card-code flex items-center justify-between gap-1">
                <span>${cls.ma_lop} ${isConflicted ? '<span class="warning-icon">⚠️ .</span>' : ''}</span>
                <div class="flex items-center gap-1">
                    <span class="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-1 rounded font-bold">${cls.so_tc} TC</span>
                    <span class="text-rose-500 hover:text-rose-700 opacity-60 group-hover:opacity-100 font-bold text-xs" title="Xóa môn này">×</span>
                </div>
            </div>
            <div class="card-name">${cls.ten_mh}</div>
            <div class="card-teacher">${cls.ten_gv || ''}</div>
            <div class="card-room">*</div>
            <div class="card-dates">BĐ: NaN-NaN-NaN<br>KT: NaN-NaN-NaN</div>
        `;
        container.appendChild(card);
    });
}

// Step 3 Summary & Script Generator
function renderStep3Summary() {
    const tbody = document.getElementById('summary-step3-tbody');
    const scriptInput = document.getElementById('script-code-input');
    if (!tbody) return;

    tbody.innerHTML = '';

    const selectedClasses = Array.from(appState.selectedClassIds)
        .map(id => appState.rawRecords.find(r => r.id === id))
        .filter(Boolean);

    const classCodes = selectedClasses.map(c => c.ma_lop);
    if (scriptInput) scriptInput.value = classCodes.join(', ');

    selectedClasses.forEach((cls, idx) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50";
        tr.innerHTML = `
            <td class="p-2.5 font-bold">${idx + 1}</td>
            <td class="p-2.5 font-bold text-blue-600">${cls.ma_lop}</td>
            <td class="p-2.5">${cls.ten_mh}</td>
            <td class="p-2.5">${cls.ten_gv || '-'}</td>
            <td class="p-2.5 font-bold">${cls.thu || '*'}</td>
            <td class="p-2.5 font-mono">${cls.tiet_raw}</td>
            <td class="p-2.5 font-bold">${cls.phong || '*'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function copyClassListScript() {
    const input = document.getElementById('script-code-input');
    if (input && input.value) {
        navigator.clipboard.writeText(input.value);
        alert("Đã sao chép danh sách mã lớp!");
    }
}

// Clear All
function clearAllSelected() {
    if (appState.selectedClassIds.size === 0) return;
    if (confirm("Bạn có chắc chắn muốn xóa tất cả các lớp đã chọn?")) {
        appState.selectedClassIds.clear();
        saveToLocalStorage();
        renderClassTable();
        renderTimetableGrid();
    }
}

// Export PNG
function exportTimetableAsImage() {
    const captureArea = document.getElementById('timetable-capture-area');
    if (!captureArea || typeof html2canvas === 'undefined') return;

    html2canvas(captureArea, {
        backgroundColor: '#ffffff',
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `ThoiKhoaBieu_UIT.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// Auto Scheduler
function openAutoScheduler() {
    const listContainer = document.getElementById('auto-scheduler-subjects-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const subjMap = new Map();
    appState.rawRecords.forEach(r => subjMap.set(r.ma_mh, r.ten_mh));

    subjMap.forEach((ten_mh, ma_mh) => {
        const lbl = document.createElement('label');
        lbl.className = "flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer";
        lbl.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="checkbox" value="${ma_mh}" class="auto-subj-checkbox">
                <span class="font-bold text-slate-800">${ma_mh}</span> - <span>${ten_mh}</span>
            </div>
        `;
        listContainer.appendChild(lbl);
    });

    openModal('auto-scheduler-modal');
}

function runAutoSchedulerAlgorithm() {
    const checked = Array.from(document.querySelectorAll('.auto-subj-checkbox:checked')).map(cb => cb.value);
    if (checked.length === 0) {
        alert("Vui lòng chọn ít nhất 1 môn!");
        return;
    }

    const combos = [];
    const subjectsList = checked.map(code => appState.rawRecords.filter(r => r.ma_mh === code));

    function backtrack(idx, currentCombo) {
        if (idx >= subjectsList.length) {
            combos.push([...currentCombo]);
            return;
        }
        for (const cls of subjectsList[idx]) {
            let conflict = false;
            for (const c of currentCombo) {
                if (checkClassesOverlap(cls, c)) { conflict = true; break; }
            }
            if (!conflict) {
                currentCombo.push(cls);
                backtrack(idx + 1, currentCombo);
                currentCombo.pop();
            }
        }
    }

    backtrack(0, []);
    appState.autoSchedulerCombos = combos;
    appState.currentComboIndex = 0;

    const countLabel = document.getElementById('auto-scheduler-results-count');
    const navigator = document.getElementById('auto-scheduler-navigator');

    if (combos.length === 0) {
        countLabel.innerHTML = `<span class="text-rose-600 font-bold">Không tìm thấy phương án xếp lớp không trùng!</span>`;
        navigator.classList.add('hidden');
    } else {
        countLabel.innerHTML = `<span class="text-emerald-700 font-bold">Tìm thấy ${combos.length} phương án hợp lệ!</span>`;
        navigator.classList.remove('hidden');
        renderComboPreview();
    }
}

function renderComboPreview() {
    const combos = appState.autoSchedulerCombos;
    const idx = appState.currentComboIndex;
    const label = document.getElementById('combo-nav-label');
    const details = document.getElementById('combo-preview-details');

    if (!combos || combos.length === 0) return;

    label.innerText = `Phương án ${idx + 1} / ${combos.length}`;
    details.innerHTML = combos[idx].map(c => `<div><strong>${c.ma_lop}</strong>: ${c.ten_mh} (Thứ ${c.thu || '*'}, Tiết ${c.tiet_raw})</div>`).join('');
}

function prevCombo() {
    if (appState.currentComboIndex > 0) {
        appState.currentComboIndex--;
        renderComboPreview();
    }
}

function nextCombo() {
    if (appState.currentComboIndex < appState.autoSchedulerCombos.length - 1) {
        appState.currentComboIndex++;
        renderComboPreview();
    }
}

function applyCurrentCombo() {
    const combos = appState.autoSchedulerCombos;
    const idx = appState.currentComboIndex;
    if (!combos || combos.length === 0) return;

    appState.selectedClassIds.clear();
    combos[idx].forEach(c => appState.selectedClassIds.add(c.id));

    saveToLocalStorage();
    renderClassTable();
    renderTimetableGrid();
    closeModal('auto-scheduler-modal');
}

// Modal Handlers
function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('open');
}

function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('open');
}

function closeModalOnOutside(event, modalId) {
    if (event.target.id === modalId) closeModal(modalId);
}

// LocalStorage Persistence
function saveToLocalStorage() {
    try {
        localStorage.setItem('uit_tkb_selected_ids', JSON.stringify(Array.from(appState.selectedClassIds)));
    } catch (e) {}
}

function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('uit_tkb_selected_ids');
        if (stored) {
            const ids = JSON.parse(stored);
            if (Array.isArray(ids)) appState.selectedClassIds = new Set(ids);
        }
    } catch (e) {}
}
