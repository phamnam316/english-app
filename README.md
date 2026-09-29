# English App

Next.js 16 + next-auth v4 + Prisma 6 (PostgreSQL) + Tailwind v4.

## Chạy lần đầu

```bash
npm install
npm run db:up      # PostgreSQL trong Docker (cổng 5432)
npm run db:push    # tạo bảng theo prisma/schema.prisma
npm run db:seed    # dữ liệu mẫu + tài khoản demo@example.com / 123456
npm run build
npm start          # http://localhost:3000
```

Khi phát triển: `npm run dev` thay cho `build` + `start`.

Cấu hình trong `.env` (mẫu: `.env.example`). `GOOGLE_CLIENT_ID/SECRET` và `OPENAI_API_KEY` là tùy chọn:
thiếu Google thì ẩn nút đăng nhập Google, thiếu OpenAI thì nút nghe dùng giọng đọc của trình duyệt.
