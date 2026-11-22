
import { buildTimeBlocks } from "./time-block-builder.js";
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

const ASPECT_TYPES = [
  { id: "conjunction", angle: 0, orb: 8 },
  { id: "sextile", angle: 60, orb: 4 },
  { id: "square", angle: 90, orb: 6 },
  { id: "trine", angle: 120, orb: 6 },
  { id: "opposition", angle: 180, orb: 8 }
];

/**
 * 10天体の全組み合わせからアスペクトを検出する
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

      const aspectConfig = ASPECT_TYPES.find(
        item => item.id === detected.aspectType
      );

      if (!aspectConfig) continue;

      const applying = aspectDetector.detectApplying(
        currentA.longitude,
        currentB.longitude,
        futureA.longitude,
        futureB.longitude,
        detected.aspectType
      );

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
 * 時間帯別スケジュールを作成する
 *
 * calculatePositions:
 * 指定日時の10天体位置を計算する関数
 *
 * aspectDetector:
 * AspectDetector
 *
 * configs:
 * 読み込み済みの設定データ
 */
export function buildScheduleBase(
  startTime,
  endTime,
  events,
  calculatePositions,
  aspectDetector,
  configs
) {
  if (typeof calculatePositions !== "function") {
    throw new TypeError(
      "calculatePositions must be a function"
    );
  }

  if (
    !aspectDetector ||
    typeof aspectDetector.detectAspect !== "function" ||
    typeof aspectDetector.detectApplying !== "function"
  ) {
    throw new TypeError(
      "Valid aspectDetector is required"
    );
  }

  if (!configs) {
    throw new TypeError("configs are required");
  }

  const blocks = buildTimeBlocks(events, {
    startTime,
    endTime,
    mergeSimultaneousEvents: true
  });

  const scheduledBlocks = blocks.map(block => {
    const midpointDate = new Date(block.midpoint);

    const positions = calculatePositions(midpointDate);

    const futurePositions = calculatePositions(
      new Date(midpointDate.getTime() + 60 * 60 * 1000)
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

    const fortuneData = buildFortuneData(
      aspects,
      positions,
      configs
    );

    return {
      ...block,
      positions,
      aspects,
      fortuneData
    };
  });

  return {
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    blockCount: scheduledBlocks.length,
    blocks: scheduledBlocks
  };
}
