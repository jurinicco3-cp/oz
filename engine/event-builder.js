
/**
 * event-builder.js
 *
 * 正確なアスペクト成立時刻から
 * イベントデータを作成する。
 *
 * 現在の惑星状態はここでは扱わない。
 */

export function buildEvents(aspects) {
  if (!Array.isArray(aspects)) {
    throw new TypeError("aspects must be an array");
  }

  const candidates = [];

  aspects.forEach((aspect, index) => {
    const {
      planetA,
      planetB,
      aspectType,
      exactTime,
      exactEvents,
      orb
    } = aspect;

    if (!planetA || !planetB || !aspectType) {
      throw new Error(
        `Invalid aspect data at index ${index}`
      );
    }

    if (typeof orb !== "number" || !Number.isFinite(orb) || orb < 0) {
      throw new Error(
        `Invalid orb at index ${index}`
      );
    }

    // 正確な発生時刻があるものだけを対象にする。
    // exactEvents がない旧形式にも対応する。
    const occurrences = Array.isArray(exactEvents)
      ? exactEvents
      : exactTime
        ? [{ exactTime, orb }]
        : [];

    occurrences.forEach((occurrence, occurrenceIndex) => {
      if (!occurrence.exactTime) {
        throw new Error(
          `Missing exactTime at aspect ${index}, occurrence ${occurrenceIndex}`
        );
      }

      const timestamp = new Date(occurrence.exactTime).getTime();

      if (!Number.isFinite(timestamp)) {
        throw new Error(
          `Invalid exactTime at aspect ${index}, occurrence ${occurrenceIndex}`
        );
      }

      const eventOrb =
        typeof occurrence.orb === "number"
          ? occurrence.orb
          : orb;

      if (!Number.isFinite(eventOrb) || eventOrb < 0) {
        throw new Error(
          `Invalid event orb at aspect ${index}, occurrence ${occurrenceIndex}`
        );
      }

      candidates.push({
        planetA,
        planetB,
        aspectType,
        exactTime: new Date(timestamp).toISOString(),
        orb: eventOrb < 0.00001 ? 0 : eventOrb,
        occurrenceIndex: occurrenceIndex + 1,
        occurrenceCount: occurrences.length
      });
    });
  });

  // すべての惑星ペアのイベントを日時順に並べる。
  candidates.sort((a, b) =>
    new Date(a.exactTime) - new Date(b.exactTime)
  );

  // 日時順に一意のIDを付ける。
  return candidates.map((event, index) => ({
    id: `event-${index + 1}`,
    ...event
  }));
}
