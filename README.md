## Han Store - MERN E-commerce

Han Store là website bán hàng online (quần áo, đồ gia dụng, phụ kiện) xây dựng với MERN Stack (MongoDB, Express, React, Node.js).

README này tóm tắt nhanh kiến trúc, tính năng chính và cách chạy dự án.

### Cấu trúc thư mục

- `backend/`: API Node.js + Express + MongoDB
- `frontend/`: React + Vite + Tailwind CSS

---

### Tính năng chính

- **Người dùng**

  - Đăng ký, đăng nhập, quên mật khẩu (OTP email), đổi mật khẩu.
  - Hồ sơ cá nhân: cập nhật thông tin, upload ảnh đại diện (Cloudinary) hoặc dùng URL ảnh.
  - Sổ địa chỉ: lưu nhiều địa chỉ, chọn địa chỉ mặc định.
  - Giỏ hàng:
    - Thêm/xóa/cập nhật số lượng, size, màu.
    - **Chọn một phần sản phẩm để thanh toán** (không bắt buộc tất cả), có nút **“Chọn tất cả”**.
  - Thanh toán:
    - Thanh toán COD hoặc ví MoMo.
    - Tự động tính phí ship theo tỉnh/thành (trụ sở tại Hà Nội).
    - Có thể yêu cầu xuất hóa đơn và lưu thông tin hóa đơn cho các lần sau.
    - Cho phép **hủy đơn** trong một khoảng thời gian khi đơn chưa giao (`CANCEL_WINDOW_MINUTES`).
  - Đơn hàng & đánh giá:
    - Xem lịch sử đơn hàng, trạng thái (PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED).
    - Khi đơn đã giao, có thể **đánh giá từng sản phẩm** trong đơn (sao + nội dung + ảnh).
    - Mỗi lần mua chỉ được đánh giá 1 lần cho mỗi sản phẩm, có thể xem/chỉnh sửa/xóa đánh giá.
    - Điểm `averageRating` và `totalReviews` của sản phẩm được cập nhật tự động.

- **Admin**
  - Đăng nhập admin, có khu vực `/admin` riêng (ẩn header/footer chính).
  - Dashboard:
    - Thống kê tổng quan, biểu đồ doanh thu, đơn hàng theo tháng/trạng thái (Recharts).
  - Quản lý sản phẩm:
    - Thêm / sửa / xóa sản phẩm.
    - Ảnh sản phẩm: nhập URL hoặc upload Cloudinary (kéo thả).
  - Quản lý đơn hàng:
    - Xem danh sách, cập nhật trạng thái (PENDING → CONFIRMED → SHIPPING → DELIVERED/CANCELLED).
  - Quản lý người dùng:
    - Xem danh sách user, phân quyền cơ bản.

---

### Cách chạy nhanh (local)

#### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # nếu có, hoặc tự tạo .env theo mục ENV
npm run dev
```

#### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Mặc định frontend chạy ở `http://localhost:5173`, backend ở `http://localhost:5000` (tùy `PORT`).

---

### Biến môi trường backend (`backend/.env`)

Tối thiểu nên có:

```bash
# Server
PORT=5000
MONGO_URI=mongodb://localhost:27017/han-store
CLIENT_URL=http://localhost:5173

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Email SMTP (gửi OTP và xác nhận đơn hàng)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# MoMo (nếu dùng thanh toán MoMo)
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
MOMO_REDIRECT_URL=http://localhost:5173/momo/return
MOMO_IPN_URL=http://localhost:5000/api/payments/momo/ipn

# Cloudinary (upload ảnh sản phẩm / avatar / review)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cửa sổ cho phép hủy đơn (phút)
CANCEL_WINDOW_MINUTES=30
```

#### Gợi ý cấu hình Gmail SMTP

1. Vào `https://myaccount.google.com/security`
2. Bật "2-Step Verification" nếu chưa bật.
3. Vào `https://myaccount.google.com/apppasswords`
4. Tạo App Password cho “Mail”, copy mật khẩu 16 ký tự → dán vào `SMTP_PASS`.

Nếu không cấu hình SMTP, hệ thống vẫn chạy nhưng không gửi được OTP và email xác nhận đơn hàng.

---

### Ghi chú khác

- Admin mặc định có thể tạo qua script `backend/src/scripts/createAdmin.js` (xem `backend/package.json` script `create-admin` nếu đã cấu hình).
- Một số chức năng (MoMo, Cloudinary) có cơ chế fallback:
  - Nếu Cloudinary chưa cấu hình, API upload sẽ trả thông báo để dùng URL ảnh thay thế.
  - Nếu MoMo thiếu config, API thanh toán sẽ báo lỗi chi tiết qua log.
