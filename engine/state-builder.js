
/**
 * state-builder.js
 *
 * 現在の天体計算結果とアスペクト検出結果から、
 * 現在の惑星状態を作成する。
 *
 * 未来の正確な成立イベントは扱わない。
 */

export function buildStates(aspects) {
  if (!Array.isArray(aspects)) {
    throw new TypeError("aspects must be an array");
  }

  return aspects.map((aspect, index) => {
    const {
      planetA,
      planetB,
      aspectType,
      orb,
      applying
    } = aspect;

    if (!planetA || !planetB || !aspectType) {
      throw new Error(
        `Invalid aspect data at index ${index}`
      );
    }

    if (
      typeof orb !== "number" ||
      !Number.isFinite(orb) ||
      orb < 0
    ) {
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
      id: `state-${index + 1}`,
      planetA,
      planetB,
      aspectType,
      orb,
      motion: applying ? "applying" : "separating"
    };
  });
}
