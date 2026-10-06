# English App

Next.js 16 + next-auth v4 + Prisma 6 (PostgreSQL) + Tailwind v4.

## Chạy lần đầu

```bash
npm install
npm run db:up      # PostgreSQL trong Docker (cổng 5432)
npm run db:push    # tạo bảng theo prisma/schema.prisma
npm run db:seed    # khóa học + tài khoản mẫu
npm run build
npm start          # http://localhost:3000
```

Khi phát triển: `npm run dev` thay cho `build` + `start`.

Tài khoản có sẵn (mật khẩu đều là `123456`): `demo@example.com`, `usera@example.com` (User A),
`userb@example.com` (User B), `userc@example.com` (User C).

## Nội dung học

- **Tiếng Anh A1–A2 trong 30 ngày**: giáo án soạn tay, mỗi bài có từ mới, ghi chú ngữ pháp và bài tập (`prisma/data/a1-a2-30-days.ts`).
  6 bài chương 1 mở đầu bằng đoạn hội thoại tình huống (`story`) quanh quán cà phê của Lan.
- **Từ vựng A1 / A2 theo chủ đề**: 2307 từ của CEFR-J chia theo chủ đề, mỗi bài khoảng 10 từ có phiên âm, câu ví dụ kèm bản dịch
  và bài tập sinh tự động (`prisma/data/vocab-courses.ts`). Cách dựng bộ từ và nguồn dữ liệu: [scripts/vocab/README.md](scripts/vocab/README.md).

Dữ liệu từ vựng dùng CEFR-J Wordlist 1.5 (Yukio Tono, Tokyo University of Foreign Studies, CC BY-SA 4.0),
Wiktionary (CC BY-SA 4.0) và Tatoeba (CC BY 2.0 FR).

## Ôn tập và số liệu

- Mỗi từ có lịch ôn riêng cho từng người học (bảng `WordReview`, code ở `lib/review-schedule.ts`): học xong bài thì từ
  đến hạn ôn sau 1 ngày; ôn đúng lúc đến hạn thì giãn dần 1 → 3 → 7 → 14 → 30 → 60 ngày, trả lời sai thì quay về 1 ngày.
  Tự đánh giá Chưa nhớ / Hơi nhớ / Đã nhớ đặt hạn 1 / 3 / 7 ngày.
- **Ôn nhanh 2 phút** (`/practice/quick`) tự chọn một trò chơi và hỏi từ đến hạn trước.
- `npm run stats`: số người dùng, tỉ lệ quay lại sau 1 ngày / 7 ngày theo tuần đăng ký, và số người học, bài đạt, lượt ôn
  của từng ngày trong 14 ngày gần nhất.
  Muốn đo trên database thật (Neon), đặt biến `DATABASE_URL` thành chuỗi kết nối của Neon rồi chạy lệnh này.

Cấu hình trong `.env` (mẫu: `.env.example`). `GOOGLE_CLIENT_ID/SECRET` và `OPENAI_API_KEY` là tùy chọn:
thiếu Google thì ẩn nút đăng nhập Google, thiếu OpenAI thì nút nghe dùng giọng đọc của trình duyệt.

## Đưa lên mạng (Vercel + Neon)

1. vercel.com → đăng nhập bằng GitHub → **Add New → Project** → chọn repo này.
   Thêm biến môi trường `NEXTAUTH_SECRET` (chuỗi ngẫu nhiên, vd `openssl rand -base64 32`) → **Deploy**.
   Lần deploy đầu sẽ lỗi vì chưa có database, đó là bình thường.
2. Trong project → tab **Storage** → **Create Database** → **Neon** → chọn vùng **Singapore** → **Connect**.
   Neon tự thêm `DATABASE_URL` và `DATABASE_URL_UNPOOLED`.
3. Tab **Deployments** → deploy gần nhất → **Redeploy**.

Mỗi lần deploy, lệnh `vercel-build` tự cập nhật bảng (`prisma db push`) và đồng bộ nội dung khóa học (`prisma db seed`:
tạo khóa còn thiếu, cập nhật bài đã đổi nội dung, giữ nguyên tiến độ của người học).
Không cần đặt `NEXTAUTH_URL` trên Vercel. Code mới push lên nhánh `main` sẽ được Vercel tự deploy.
