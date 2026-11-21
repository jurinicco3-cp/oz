
/**
 * event-builder.js
 *
 * 天体計算エンジンの結果から、
 * 運勢評価に使用する共通イベントを作成する。
 *
 * 複数回発生するアスペクトは、
 * それぞれ別のイベントとして登録する。
 */

export function buildEvents(aspects) {
  if (!Array.isArray(aspects)) {
    throw new TypeError("aspects must be an array");
  }

  const result = [];
  let eventNumber = 1;

  aspects.forEach((aspect, index) => {
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

    const exactEvents =
      Array.isArray(aspect.exactEvents) &&
      aspect.exactEvents.length > 0
        ? aspect.exactEvents
        : [{ exactTime, orb }];

    exactEvents.forEach((occurrence, occurrenceIndex) => {
      const eventOrb =
        typeof occurrence.orb === "number"
          ? occurrence.orb
          : orb;

      result.push({
        id: `event-${eventNumber++}`,
        planetA,
        planetB,
        aspectType,
        exactTime: occurrence.exactTime ?? null,
        orb: eventOrb,
        applying,
        occurrenceIndex: occurrenceIndex + 1,
        occurrenceCount: exactEvents.length
      });
    });
  });

  return result;
}
