
import { buildTimeBlocks } from "./time-block-builder.js";
import { buildEvents } from "./event-builder.js";
import { buildFortuneData } from "./fortune-engine.js";

const PLANET_NAMES = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto"
];

/**
 * 指定した1日分の正確なアスペクトイベントを探す
 */
function findDailyAspectEvents(
  startTime,
  endTime,
  calculatePositions,
  aspectDetector
) {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (
    !Number.isFinite(startDate.getTime()) ||
    !Number.isFinite(endDate.getTime()) ||
    startDate >= endDate
  ) {
    throw new TypeError("Invalid daily search period");
  }

  if (
    !aspectDetector ||
    typeof aspectDetector.findExactAspectTime !== "function" ||
    !Array.isArray(aspectDetector.aspects)
  ) {
    throw new TypeError("Valid aspectDetector is required");
  }

  // 同じ日時の天体位置を何度も計算しないようにする
  const positionCache = new Map();

  const cachedCalculatePositions = date => {
    const timestamp = date.getTime();

    if (!Number.isFinite(timestamp)) {
      throw new TypeError("Invalid calculation date");
    }

    if (!positionCache.has(timestamp)) {
      positionCache.set(
        timestamp,
        calculatePositions(date)
      );
    }

    return positionCache.get(timestamp);
  };

  const aspectRecords = [];

  // 10天体の45通りの組み合わせを調べる
  for (let i = 0; i < PLANET_NAMES.length; i++) {
    for (let j = i + 1; j < PLANET_NAMES.length; j++) {
      const planetA = PLANET_NAMES[i];
      const planetB = PLANET_NAMES[j];

      // 5種類のアスペクトを調べる
      for (const aspect of aspectDetector.aspects) {
        const searchResult =
          aspectDetector.findExactAspectTime(
            startDate,
            endDate,
            planetA,
            planetB,
            aspect.type,
            cachedCalculatePositions,
            30
          );

        if (!searchResult.found) {
          continue;
        }

        aspectRecords.push({
          planetA,
          planetB,
          aspectType: aspect.type,
          orb: searchResult.orb,
          exactEvents: searchResult.events
        });
      }
    }
  }

  // 正確なイベント時刻を整理する
  const events = buildEvents(aspectRecords);

  return {
    events,
    calculationCount: positionCache.size
  };
}

/**
 * 時間帯ごとにアスペクトを検出する
 */
function detectAllAspects(
  positions,
  futurePositions,
  aspectDetector
) {
  const aspects = [];

  for (let i = 0; i < PLANET_NAMES.length; i++) {
    for (let j = i + 1; j < PLANET_NAMES.length; j++) {
      const planetA = PLANET_NAMES[i];
      const planetB = PLANET_NAMES[j];

      const currentA = positions.planets[planetA];
      const currentB = positions.planets[planetB];
      const futureA = futurePositions.planets[planetA];
      const futureB = futurePositions.planets[planetB];

      if (
        !currentA ||
        !currentB ||
        !futureA ||
        !futureB
      ) {
        throw new Error("天体の位置情報が不足しています。");
      }

      const detected = aspectDetector.detectAspect(
        currentA.longitude,
        currentB.longitude
      );

      if (!detected) continue;

      const applying = aspectDetector.detectApplying(
        currentA.longitude,
        currentB.longitude,
        futureA.longitude,
        futureB.longitude,
        detected.aspectType
      );

      // 接近・分離を判定できない場合はスコア計算から除外
      if (applying === null) continue;

      aspects.push({
        planetA,
        planetB,
        aspectType: detected.aspectType,
        orb: detected.orb,
        applying
      });
    }
  }

  return aspects;
}

/**
 * 1日分の時間帯別スケジュールを作成する
 *
 * startTime:
 * 1日の開始日時（日本時間の午前0時）
 *
 * endTime:
 * 翌日の開始日時（日本時間の午前0時）
 */
export function buildScheduleBase(
  startTime,
  endTime,
  calculatePositions,
  aspectDetector,
  configs
) {
  if (typeof calculatePositions !== "function") {
    throw new TypeError(
      "calculatePositions must be a function"
    );
  }

  if (!configs) {
    throw new TypeError("configs are required");
  }

  // 1日分の実際の天体イベントを検索
  const eventData = findDailyAspectEvents(
    startTime,
    endTime,
    calculatePositions,
    aspectDetector
  );

  const events = eventData.events;

  // 実際のイベント時刻で1日を分割
  const blocks = buildTimeBlocks(events, {
    startTime,
    endTime,
    mergeSimultaneousEvents: true
  });

  // 各時間帯の運勢データを計算
  const scheduledBlocks = blocks.map(block => {
    const midpointDate = new Date(block.midpoint);

    const positions = calculatePositions(midpointDate);

    const futurePositions = calculatePositions(
      new Date(
        midpointDate.getTime() + 60 * 60 * 1000
      )
    );

    if (
      !positions ||
      !positions.planets ||
      Object.keys(positions.planets).length !== 10 ||
      !futurePositions ||
      !futurePositions.planets ||
      Object.keys(futurePositions.planets).length !== 10
    ) {
      throw new Error(
        "10天体の位置情報を取得できませんでした。"
      );
    }

    const aspects = detectAllAspects(
      positions,
      futurePositions,
      aspectDetector
    );

    // この時間帯に属するイベントだけを取り出す
    // 境界時刻ちょうどのイベントは、後の時間帯に所属させる
    const blockEvents = events.filter(event => {
      const eventTime = new Date(event.exactTime).getTime();
      const blockStart = new Date(block.startTime).getTime();
      const blockEnd = new Date(block.endTime).getTime();

      return eventTime >= blockStart && eventTime < blockEnd;
    });

    const fortuneData = buildFortuneData(
      aspects,
      positions,
      configs,
      blockEvents
    );
    return {
      ...block,
      positions,
      aspects,
      events: blockEvents,
      fortuneData
    };
  });

  return {
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    eventCount: events.length,
    positionCalculationCount: eventData.calculationCount,
    events,
    blockCount: scheduledBlocks.length,
    blocks: scheduledBlocks
  };
}
