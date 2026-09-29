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

## Đưa lên mạng (Vercel + Neon)

1. vercel.com → đăng nhập bằng GitHub → **Add New → Project** → chọn repo này.
   Thêm biến môi trường `NEXTAUTH_SECRET` (chuỗi ngẫu nhiên, vd `openssl rand -base64 32`) → **Deploy**.
   Lần deploy đầu sẽ lỗi vì chưa có database, đó là bình thường.
2. Trong project → tab **Storage** → **Create Database** → **Neon** → chọn vùng **Singapore** → **Connect**.
   Neon tự thêm `DATABASE_URL` và `DATABASE_URL_UNPOOLED`.
3. Tab **Deployments** → deploy gần nhất → **Redeploy**.

Mỗi lần deploy, lệnh `vercel-build` tự cập nhật bảng (`prisma db push`) và nạp các khóa học còn thiếu (`prisma db seed`).
Không cần đặt `NEXTAUTH_URL` trên Vercel. Code mới push lên nhánh `main` sẽ được Vercel tự deploy.
