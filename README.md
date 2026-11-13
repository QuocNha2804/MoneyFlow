# 💰 MoneyFlow — Ứng dụng Quản lý Tài chính Cá nhân Offline

Ứng dụng quản lý chi tiêu cá nhân 100% Offline xây dựng trên **React Native + Expo (TypeScript)**, thiết kế hiện đại với tông màu chủ đạo **Xanh lá (Emerald Green)**, hỗ trợ đầy đủ cả giao diện Sáng / Tối (Light / Dark Mode).

## ✨ Tính năng chính

- **Onboarding 3 bước**: Chọn đơn vị tiền tệ (`VND`, `USD`, `EUR`), mục tiêu tài chính ưu tiên, khởi tạo Ví Tiền mặt với số dư ban đầu và giờ nhắc nhở ghi chép hằng ngày.
- **Xác thực & Bảo mật Offline**:
  - Đăng ký / Đăng nhập / Quên mật khẩu lưu trữ cục bộ, mật khẩu được băm **SHA-256** (`expo-crypto`).
  - Khóa ứng dụng nhanh bằng **Vân tay / FaceID** (`expo-local-authentication`) hoặc **Mã PIN 4 số** khi mở lại app.
  - Phân tách dữ liệu độc lập theo từng tài khoản (`userId`).
- **Tab Tổng quan (Home)**:
  - Thẻ Tổng tài sản (Net Worth) có hiệu ứng đếm số (Count-up) + nút ẩn số dư `******` (Privacy Mode), dòng tiền tháng và % tăng/giảm so với tháng trước.
  - Thanh cuộn ngang các Ví, thanh **Nhập nhanh 1 chạm** (Quick Templates), tiến độ ngân sách tiêu biểu, nút nổi **Expandable FAB** và danh sách giao dịch gom theo ngày (hỗ trợ vuốt trái/phải để Xóa/Sửa).
- **Thêm / Sửa Giao dịch**:
  - Bàn phím số tích hợp máy tính (`+`, `-`, `×`, `÷`), chọn Ví / Chuyển khoản giữa các ví, chọn hoặc tạo nhanh Danh mục, gắn `#hashtag`, chụp/đính kèm ảnh hóa đơn (`expo-image-picker` + `expo-file-system`), gắn mục tiêu tài chính và thiết lập **Lặp lại định kỳ**.
- **Tab Ngân sách (Budgets)**:
  - Biểu đồ vòng (SVG Ring Chart), số tiền được phép tiêu mỗi ngày, thanh tiến độ tự đổi 4 mức màu, cảnh báo thông báo khi chạm mốc 80% & 100%, hỗ trợ cộng dồn số dư sang tháng sau (**Budget Rollover**).
- **Tab Báo cáo (Reports)**:
  - Lọc theo Tuần / Tháng / Năm và theo từng Ví, biểu đồ tròn (Donut), biểu đồ đường xu hướng 6–12 tháng, biểu đồ cột 7 ngày kèm đường trung bình, Top 5 danh mục và **Nhận xét thông minh tự động (Rule-based Insights)**.
- **Tab Mục tiêu (Goals)**:
  - Mục tiêu Tiết kiệm & Trả nợ, nạp tiền / thanh toán nợ trực tiếp, thông báo cột mốc 25%–100%, hiệu ứng **Pháo giấy (Confetti)** khi đạt 100% và **Dự báo ngày hoàn thành**.
- **Lịch & Tìm kiếm nâng cao**:
  - Lịch thu chi theo tháng (`react-native-calendars`) kèm check-in ghi bù ngày quá khứ; tìm kiếm đa chiều theo từ khóa, `#hashtag`, khoảng tiền, ví và danh mục.
- **Sao lưu & Xuất dữ liệu**:
  - Xuất / Nhập file `.json` (Gộp Merge hoặc Ghi đè Replace) và xuất báo cáo `.csv` chuẩn UTF-8 BOM mở trực tiếp bằng Excel.

## 🚀 Chạy dự án

```bash
npm install
npx expo start
```
