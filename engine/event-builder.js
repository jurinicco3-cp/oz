/**
 * event-builder.js
 *
 * 天体計算エンジンの結果から、
 * 運勢評価に使用する共通イベントを作成する。
 *
 * この段階では運勢の良し悪しは判定しない。
 */

export function buildEvents(aspects) {
  if (!Array.isArray(aspects)) {
    throw new TypeError("aspects must be an array");
  }

  return aspects.map((aspect, index) => {
    const {
      planetA,
      planetB,
      aspectType,
      exactTime,
      orb,
      applying
    } = aspect;

    if (!planetA || !planetB || !aspectType) {
      throw new Error(
        `Invalid aspect data at index ${index}`
      );
    }

    if (typeof orb !== "number" || orb < 0) {
      throw new Error(
        `Invalid orb at index ${index}`
      );
    }

    if (typeof applying !== "boolean") {
      throw new Error(
        `Invalid applying value at index ${index}`
      );
    }

    return {
      id: `event-${index + 1}`,
      planetA,
      planetB,
      aspectType,
      exactTime: exactTime ?? null,
      orb,
      applying
    };
  });
}
