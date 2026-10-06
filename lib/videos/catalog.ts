/**
 * Danh sách clip của trang Xem phim. Chỉ dùng video do kênh chính thức đăng và cho phép nhúng
 * (nhúng bằng trình phát của YouTube là đúng điều khoản; không tải video về).
 * Kiểm tra trước khi thêm clip: https://www.youtube.com/oembed?url=<link video>&format=json
 * phải trả JSON với author_url là kênh chính thức (trả 401 = video tắt nhúng).
 *
 * Phụ đề không nằm ở đây: ADMIN căn và lưu trong trang /videos/<slug>/studio (bảng VideoSubtitle).
 */

export interface CatalogClip {
  /** Dùng trong URL và làm khóa của bảng VideoSubtitle: đừng đổi sau khi đã có phụ đề */
  slug: string;
  youtubeId: string;
  title: string;
  originalTitle: string;
  series: string;
  episode: string;
  /** Tên trang của tập phim trên We Bare Bears Wiki: trang căn phụ đề dẫn tới <wikiPage>/Transcript để chép lời thoại */
  wikiPage: string;
  summary: string;
  /** Độ dài phần được phát (giây) */
  durationSec: number;
  /** Chỉ phát 1 đoạn của video dài (vd video tổng hợp): giây bắt đầu / kết thúc */
  startSec?: number;
  endSec?: number;
}

const WE_BARE_BEARS = "We Bare Bears";

export const VIDEO_CATALOG: CatalogClip[] = [
  {
    slug: "burrito-challenge",
    youtubeId: "dEbc5xeQOm0",
    title: "Thử thách burrito khổng lồ",
    originalTitle: "Bears Take on The Burrito Challenge!",
    series: WE_BARE_BEARS,
    episode: "Mùa 1, tập 7: Burrito",
    wikiPage: "Burrito",
    summary: "Ba anh em gấu đi ăn trưa và thử sức với thử thách ăn hết chiếc burrito khổng lồ.",
    durationSec: 79,
  },
  {
    slug: "rooms",
    youtubeId: "A7n-oIr3r_o",
    title: "Đổi phòng ngủ",
    originalTitle: "Panda Finds Grizz’s DVD…",
    series: WE_BARE_BEARS,
    episode: "Mùa 2, tập 6: Rooms",
    wikiPage: "Rooms",
    summary:
      "Ba anh em đổi phòng ngủ cho nhau một đêm và lộ ra bí mật của từng người, kể cả phòng tắm bí mật dưới lòng đất của Ice Bear.",
    durationSec: 265,
  },
  {
    slug: "chloe-and-ice-bear",
    youtubeId: "CjXdYNvD8mo",
    title: "Đêm ở viện bảo tàng",
    originalTitle: "Night at the Museum, Bear Style",
    series: WE_BARE_BEARS,
    episode: "Mùa 1, tập 23: Chloe and Ice Bear",
    wikiPage: "Chloe_and_Ice_Bear",
    summary: "Chloe và Ice Bear cùng nhau phiêu lưu một đêm ở viện bảo tàng San Francisco.",
    durationSec: 271,
  },
  {
    slug: "pigeons",
    youtubeId: "EiSaGry2RtQ",
    title: "Grizz và đàn bồ câu",
    originalTitle: "Grizz Joins a Cartel",
    series: WE_BARE_BEARS,
    episode: "Mùa 3, tập 31: Pigeons",
    wikiPage: "Pigeons",
    summary: "Grizz kết bạn với đàn bồ câu và thủ lĩnh Brenda, rồi lén phá luật thành phố để cho cả đàn ăn.",
    durationSec: 270,
  },
  {
    slug: "imaginary-friend",
    youtubeId: "DycrdfgH0KI",
    title: "Người bạn tưởng tượng",
    originalTitle: "Power Bears Assemble!",
    series: WE_BARE_BEARS,
    episode: "Mùa 4, tập 16: Imaginary Friend",
    wikiPage: "Imaginary_Friend",
    summary: "Ba chú gấu con nghĩ ra một người hùng tưởng tượng, nhưng trí tưởng tượng nhanh chóng gây rắc rối thật.",
    durationSec: 262,
  },
  {
    slug: "panda-2",
    youtubeId: "yxIZ246LOoU",
    title: "Panda và người bạn búp bê",
    originalTitle: "Baby Panda’s ONLY Friend is a Doll",
    series: WE_BARE_BEARS,
    episode: "Mùa 3, tập 32: Panda 2",
    wikiPage: "Panda_2",
    summary: "Panda con sống một mình ở khu bảo tồn, kết bạn với một con búp bê rồi lên kế hoạch trốn ra ngoài.",
    durationSec: 270,
  },
  {
    slug: "yuri-and-the-bear",
    youtubeId: "L9BnNXQ17QA",
    title: "Ice Bear và chú Yuri",
    originalTitle: "Ice Bear’s First Best Friend!",
    series: WE_BARE_BEARS,
    episode: "Mùa 2, tập 17: Yuri and the Bear",
    wikiPage: "Yuri_and_the_Bear",
    summary: "Ice Bear con sống một mình ở Bắc Cực cho tới khi gặp Yuri, người dạy cậu cách sinh tồn và thế nào là bạn bè.",
    durationSec: 270,
  },
];

export function findCatalogClip(slug: string): CatalogClip | undefined {
  return VIDEO_CATALOG.find((clip) => clip.slug === slug);
}

/** Ảnh thu nhỏ 16:9 (320x180) do YouTube cung cấp */
export function youtubeThumbnail(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`;
}

export function youtubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export function wikiTranscriptUrl(wikiPage: string): string {
  return `https://webarebears.fandom.com/wiki/${encodeURIComponent(wikiPage)}/Transcript`;
}
