
/**
 * 1日の時間帯を作成する
 *
 * 天体イベントの発生時刻を境界として、
 * 1日を複数の時間帯に分割する。
 */

export function buildTimeBlocks(events, options = {}) {
  if (!Array.isArray(events)) {
    throw new TypeError("events must be an array");
  }

  const {
    startTime,
    endTime,
    mergeSimultaneousEvents = true
  } = options;

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new TypeError("Invalid startTime or endTime");
  }

  if (start >= end) {
    throw new RangeError(
      "startTime must be earlier than endTime"
    );
  }

  // 1日の開始・終了時刻を境界として登録
  const boundaries = [
    start.getTime(),
    end.getTime()
  ];

  // 1日の範囲内にある天体イベントを追加
  events.forEach(event => {
    const eventTime = new Date(event.exactTime);

    if (Number.isNaN(eventTime.getTime())) {
      throw new TypeError(
        "Invalid event exactTime"
      );
    }

    const time = eventTime.getTime();

    if (time > start.getTime() && time < end.getTime()) {
      boundaries.push(time);
    }
  });

  // 時刻順に並べる
  boundaries.sort((a, b) => a - b);

  // 同時刻の境界をまとめる
  const uniqueBoundaries = mergeSimultaneousEvents
    ? boundaries.filter(
        (time, index) =>
          index === 0 || time !== boundaries[index - 1]
      )
    : boundaries;

  // 境界と境界の間を時間帯にする
  const blocks = [];

  for (
    let i = 0;
    i < uniqueBoundaries.length - 1;
    i++
  ) {
    const blockStart = uniqueBoundaries[i];
    const blockEnd = uniqueBoundaries[i + 1];

    blocks.push({
      id: `block-${i + 1}`,
      startTime: new Date(blockStart).toISOString(),
      endTime: new Date(blockEnd).toISOString(),
      midpoint: new Date(
        blockStart + (blockEnd - blockStart) / 2
      ).toISOString()
    });
  }

  return blocks;
}

