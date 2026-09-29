/** Tiện ích cho phím tắt bàn phím */

/** Người dùng đang gõ trong ô nhập liệu -> không bắt phím tắt */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Phím được nhấn khi đang ở trong hộp thoại (Dialog) -> để hộp thoại tự xử lý */
export function isInsideDialog(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("[role='dialog']") !== null;
}

/** Nút/link đang được focus: Enter sẽ tự "click" phần tử đó, không xử lý thêm lần nữa */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("button, a, [role='button']") !== null;
}
