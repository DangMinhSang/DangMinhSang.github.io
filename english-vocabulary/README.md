# English Vocabulary — Translate & Learn

Ứng dụng web tĩnh để luyện dịch câu tiếng Anh sang tiếng Việt. Không cần backend, không cần database.

---

## 🚀 Bắt đầu nhanh

### 1. Tạo dữ liệu

```bash
python3 generate.py
```

Output:
```
✅ Generated data.json successfully.
   Total sentences : 35
   Topics          : Business, Daily Life, Education, ...
   Difficulties    : A1, A2, B1, B2, C1, C2
```

### 2. Mở website

Mở file `index.html` trong trình duyệt, **hoặc** dùng một static server:

```bash
# Python
python3 -m http.server 8080

# Node.js (nếu có npx)
npx serve .
```

Sau đó mở: http://localhost:8080/english-vocabulary/

---

## 📁 Cấu trúc project

```
english-vocabulary/
│
├── index.html      # Giao diện chính
├── style.css       # CSS (responsive, dark mode)
├── app.js          # Logic frontend (vanilla JS)
├── data.json       # Dữ liệu (do generate.py tạo ra)
├── generate.py     # Script tạo/cập nhật data.json
└── README.md       # File này
```

---

## ✏️ Thêm câu hỏi mới

**Chỉ cần sửa file `generate.py`.**

Mở `generate.py` và thêm vào list `sentences`:

```python
{
    "english": "She has just finished reading the book.",
    "vietnamese": "Cô ấy vừa mới đọc xong cuốn sách.",
    "keywords": ["finish", "reading", "book"],
    "difficulty": "A2",        # A1 / A2 / B1 / B2 / C1 / C2
    "topic": "Education",      # Xem danh sách topic bên dưới
    "note": "Present perfect"  # Ghi chú ngữ pháp (tùy chọn)
},
```

Sau đó chạy lại:

```bash
python3 generate.py
```

### Fields

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| `english` | ✅ | Câu tiếng Anh |
| `vietnamese` | ✅ | Bản dịch tiếng Việt (đáp án mẫu) |
| `difficulty` | ✅ | Cấp độ CEFR: `A1` `A2` `B1` `B2` `C1` `C2` |
| `topic` | ✅ | Chủ đề (xem danh sách bên dưới) |
| `keywords` | ➕ | Danh sách từ khóa quan trọng (dùng cho gợi ý) |
| `note` | ➕ | Ghi chú ngữ pháp, giải thích |

### Topics có sẵn

```
Daily Life, Education, Technology, Travel, Work,
Health, Food, Nature, Culture, Sports, Business,
Science, Art, Society, Politics, Economy
```

Bạn có thể thêm topic mới — filter sẽ tự động cập nhật từ `data.json`.

---

## 🎯 Tính năng

### Practice
- Hiển thị câu tiếng Anh, nhập bản dịch tiếng Việt
- **Check Answer** — so sánh và cho biết đúng / gần đúng / sai
- **🔊 Listen** — đọc câu tiếng Anh bằng Web Speech API
- **💡 Hint** — hiển thị từ khóa gợi ý
- **Sequential / 🔀 Random** — chọn chế độ học
- Filter theo **Difficulty** và **Topic**
- Progress bar theo dõi tiến độ phiên học

### Đánh giá đáp án
| Kết quả | Ngưỡng similarity |
|---------|-------------------|
| ✓ Correct | ≥ 85% |
| ~ Almost correct | 60–84% |
| ✗ Incorrect | < 60% |

Dùng thuật toán **Levenshtein edit distance** (không cần AI/API).

### History
- Lịch sử tất cả câu đã làm (lưu trong `localStorage`)
- Filter theo kết quả: All / Correct / Almost / Incorrect
- Xem câu trả lời của bạn vs đáp án mẫu

### Statistics
- Tổng số lần luyện tập
- Tỷ lệ đúng/gần đúng/sai
- Breakdown theo Difficulty và Topic
- Streak (chuỗi đúng liên tiếp) & Best streak

---

## ⌨️ Phím tắt

| Phím | Hành động |
|------|-----------|
| `Enter` | Check Answer / Next |
| `Shift+Enter` | Xuống dòng trong ô nhập |
| `→` (sau khi check) | Next câu |
| `L` | Listen (TTS) |

---

## 🛠 Cấu hình nâng cao

Mở `app.js`, tìm `CONFIG` ở đầu file:

```javascript
const CONFIG = {
  thresholds: {
    correct: 0.85,  // >= 85% → Correct
    almost:  0.60,  // >= 60% → Almost correct
  },
  maxHistory: 500,  // Số lần lưu tối đa trong localStorage
};
```

---

## 📝 Lưu ý

- Dữ liệu lịch sử và thống kê lưu trong **`localStorage`** của trình duyệt.
- Xóa localStorage (hoặc nhấn "Clear All" trong History) sẽ xóa toàn bộ lịch sử.
- Website hoàn toàn **static** — deploy được lên GitHub Pages, Netlify, Vercel, v.v.
- Không cần internet sau khi đã load (ngoại trừ Google Fonts).

---

## 🌐 Deploy lên GitHub Pages

Nếu repo của bạn là `username.github.io`, chỉ cần push toàn bộ thư mục `english-vocabulary/` lên và truy cập:

```
https://username.github.io/english-vocabulary/
```
