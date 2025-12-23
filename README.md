## Han Store - MERN E-commerce

Han Store là website bán hàng online (quần áo, đồ gia dụng, phụ kiện) xây dựng với MERN Stack (MongoDB, Express, React, Node.js).

README này chỉ tóm tắt. Phần dưới câu trả lời trong ChatGPT sẽ giải thích chi tiết kiến trúc, ERD, API và hướng dẫn deploy.

### Cấu trúc thư mục (tối thiểu)

- `backend/`: API Node.js + Express + MongoDB
- `frontend/`: React + Vite + Tailwind UI

### Chạy nhanh (sau khi cài code đầy đủ)

- Backend:
  - `cd backend`
  - `npm install`
  - Tạo file `.env` (xem mục ENV bên dưới)
  - `npm run dev`

- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run dev`

### Cấu hình Email (SMTP) để gửi OTP và email xác nhận đơn hàng

Thêm các biến sau vào file `backend/.env`:

```bash
# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
```

**Hướng dẫn cấu hình Gmail:**

1. Vào [Google Account Security](https://myaccount.google.com/security)
2. Bật "2-Step Verification" nếu chưa bật
3. Tạo "App Password":
   - Vào [App Passwords](https://myaccount.google.com/apppasswords)
   - Chọn "Mail" và "Other (Custom name)" → đặt tên "Han Store"
   - Copy mật khẩu 16 ký tự → dán vào `SMTP_PASS`
4. Dùng email của bạn làm `SMTP_USER`

**Các dịch vụ email khác:**

- **SendGrid**: `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`
- **Mailgun**: `SMTP_HOST=smtp.mailgun.org`, `SMTP_PORT=587`
- **Outlook**: `SMTP_HOST=smtp-mail.outlook.com`, `SMTP_PORT=587`

**Lưu ý:** Nếu không cấu hình email, hệ thống vẫn hoạt động nhưng sẽ không gửi được OTP và email xác nhận đơn hàng.


