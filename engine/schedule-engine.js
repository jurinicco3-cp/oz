
import { buildTimeBlocks } from "./time-block-builder.js";

/**
 * 時間帯別スケジュールの基本データを作成する
 *
 * startTime : 1日の開始日時
 * endTime   : 1日の終了日時
 * events    : その日の天体イベント
 */
export function buildScheduleBase(
  startTime,
  endTime,
  events,
  calculatePositions
) {
  if (typeof calculatePositions !== "function") {
    throw new TypeError(
      "calculatePositions must be a function"
    );
  }

  // 1日を時間帯に分割
  const blocks = buildTimeBlocks(events, {
    startTime,
    endTime,
    mergeSimultaneousEvents: true
  });

  // 各時間帯の中央時刻で天体位置を計算
  const scheduledBlocks = blocks.map(block => {
    const positions = calculatePositions(
      new Date(block.midpoint)
    );

    if (
      !positions ||
      !positions.planets ||
      Object.keys(positions.planets).length !== 10
    ) {
      throw new Error(
        "10天体の位置情報を取得できませんでした。"
      );
    }

    return {
      ...block,
      positions
    };
  });

  return {
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    blockCount: scheduledBlocks.length,
    blocks: scheduledBlocks
  };
}
