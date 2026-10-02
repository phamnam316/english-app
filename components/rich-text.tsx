/**
 * Hiển thị chuỗi có đánh dấu đơn giản dùng trong ghi chú ngữ pháp: **đậm**, *nghiêng*.
 * Không dùng dangerouslySetInnerHTML: nội dung luôn được render như chữ thường.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
          return (
            <b key={i} className="font-semibold">
              {part.slice(2, -2)}
            </b>
          );
        }
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <i key={i}>{part.slice(1, -1)}</i>;
        return part;
      })}
    </>
  );
}

/** Đánh dấu từ đang học trong câu ví dụ (kể cả dạng chia: greet -> greeted), gạch chân màu đất nung */
export function HighlightWord({ sentence, word }: { sentence: string; word: string }) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = sentence.split(new RegExp(`(${escaped}[\\p{L}']*)`, "iu"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="word-mark font-semibold">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
