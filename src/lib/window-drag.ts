export interface DragTarget {
  tagName?: string | null;
  dataset?: Record<string, string | undefined>;
  isContentEditable?: boolean;
  parentElement?: DragTarget | null;
}

const INTERACTIVE_TAG_NAMES = new Set([
  "A",
  "BUTTON",
  "INPUT",
  "OPTION",
  "SELECT",
  "TEXTAREA",
]);

function asDragTarget(target: EventTarget | DragTarget | null): DragTarget | null {
  if (!target || typeof target !== "object") {
    return null;
  }

  return target as DragTarget;
}

export function shouldStartWindowDrag(
  target: EventTarget | DragTarget | null,
): boolean {
  let current = asDragTarget(target);

  while (current) {
    if (current.dataset?.windowDragHandle === "true") {
      return true;
    }

    if (current.dataset?.noWindowDrag === "true") {
      return false;
    }

    if (current.isContentEditable) {
      return false;
    }

    const tagName = current.tagName?.toUpperCase();
    if (tagName && INTERACTIVE_TAG_NAMES.has(tagName)) {
      return false;
    }

    current = current.parentElement ?? null;
  }

  return true;
}
