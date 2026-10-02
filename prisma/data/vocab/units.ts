/**
 * Chương của bộ từ vựng A1–A2: theo nhãn chủ đề của CEFR-J; từ không có chủ đề xếp theo từ loại.
 * Dùng chung cho scripts/vocab/build-vocab.ts (gán chương) và prisma/data/vocab-courses.ts (tạo khóa học).
 */
export interface VocabUnit {
  key: string;
  title: string;
  /** Nhãn chủ đề của CEFR-J thuộc chương này */
  topics?: string[];
}

export const VOCAB_UNITS: VocabUnit[] = [
  { key: "personal", title: "Bản thân và đất nước", topics: ["Personal information", "Personal identification", "Nationalities and countries"] },
  { key: "family", title: "Gia đình và bạn bè", topics: ["Family life", "Relations with other people"] },
  { key: "numbers", title: "Số đếm" },
  { key: "home", title: "Nhà cửa và đồ vật", topics: ["Objects and rooms", "House and home, environment"] },
  { key: "food", title: "Đồ ăn thức uống", topics: ["Food and drink"] },
  { key: "clothes", title: "Quần áo và màu sắc", topics: ["Clothes", "Colours"] },
  { key: "town", title: "Thành phố và mua sắm", topics: ["Things in the town, shops and shopping", "Shopping", "Services", "Places"] },
  { key: "school", title: "Trường học và ngôn ngữ", topics: ["Education", "Books and literature", "Language"] },
  { key: "work", title: "Công việc", topics: ["Work and Jobs"] },
  {
    key: "free-time",
    title: "Sở thích và giải trí",
    topics: ["Hobbies and pastimes", "Leisure activities", "Free time, entertainment", "Media", "Film", "Arts", "Art", "Hobbies and lifestyles"],
  },
  { key: "travel", title: "Du lịch và đi lại", topics: ["Travel and services vocab", "Ways of travelling", "Ways of traveling", "Holidays", "Travel"] },
  { key: "health", title: "Sức khỏe và cơ thể", topics: ["Health and body care"] },
  { key: "daily", title: "Cuộc sống hằng ngày", topics: ["Daily life", "News, lifestyles and current affairs"] },
  { key: "weather", title: "Thời tiết và thiên nhiên", topics: ["Weather"] },
  { key: "verbs", title: "Động từ thông dụng" },
  { key: "adjectives", title: "Tính từ thông dụng", topics: ["Adjectives: personality, description, feelings"] },
  { key: "adverbs", title: "Trạng từ thông dụng" },
  { key: "nouns", title: "Danh từ thông dụng" },
  { key: "function", title: "Đại từ, giới từ và từ nối" },
];
