# Bộ từ vựng A1–A2

Tạo file `prisma/data/vocab/a1-a2.json` (2307 từ) mà seed dùng để dựng khóa "Từ vựng A1/A2 theo chủ đề".

```bash
npx tsx scripts/vocab/fetch-sources.ts   # tải dữ liệu nguồn vào scripts/vocab/.cache (không đưa lên git)
npx tsx scripts/vocab/build-vocab.ts     # gộp nguồn + áp dụng chỉnh sửa -> prisma/data/vocab/a1-a2.json
npm run db:seed                          # đưa vào database
```

## Nguồn dữ liệu

| Dữ liệu | Nguồn | Giấy phép |
| --- | --- | --- |
| Danh sách từ, từ loại, cấp độ A1/A2, chủ đề | [CEFR-J Wordlist 1.5](https://github.com/openlanguageprofiles/olp-en-cefrj), Yukio Tono, Tokyo University of Foreign Studies | CC BY-SA 4.0 |
| Phiên âm IPA (giọng Anh), nghĩa tiếng Việt gợi ý | [Wiktionary](https://en.wiktionary.org) qua bản trích xuất của [kaikki.org](https://kaikki.org) | CC BY-SA 4.0 |
| Câu ví dụ tiếng Anh và bản dịch tiếng Việt | [Tatoeba](https://tatoeba.org) | CC BY 2.0 FR |

Trích dẫn theo yêu cầu của CEFR-J: *"CEFR-J Wordlist Version 1.5". Compiled by Yukio Tono, Tokyo University of Foreign Studies.*

Mỗi từ trong `a1-a2.json` có trường `exampleSource`: `tatoeba:<id>` là câu lấy từ Tatoeba
(xem tại `https://tatoeba.org/sentences/show/<id>`), `authored` là câu tự viết thay cho câu nguồn chưa phù hợp.

## Chỉnh sửa

Không sửa tay `a1-a2.json`. Sửa trong `prisma/data/vocab/overrides/*.json` (áp dụng theo thứ tự tên file, file sau ghi đè
file trước) rồi chạy lại `build-vocab.ts`:

- `01`–`06`: nghĩa tiếng Việt đã soát lại cho người mới học
- `07`: phiên âm bổ sung
- `08`, `09`: câu ví dụ và bản dịch cho từ chưa có câu Anh–Việt, câu trùng nhau hoặc sai nghĩa
- `10-review-*`: bản dịch Tatoeba đã sửa, câu không phù hợp (thành ngữ, sai nghĩa của từ, bạo lực…) được thay bằng câu tự viết

Chỉ ghi `exampleVi` thì vẫn giữ câu Tatoeba (bản dịch được biên tập lại); ghi `example` khác câu gốc thì câu được tính là tự viết.
Phần dữ liệu đã biên tập được chia sẻ theo cùng giấy phép CC BY-SA 4.0.
