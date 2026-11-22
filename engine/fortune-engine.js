
import { buildEvents } from "./event-builder.js";
import { buildStates } from "./state-builder.js";
import { calculateAllHouses } from "./house-calculator.js";
import { calculateFortuneScores } from "./fortune-scorer.js";

/**
 * 占いエンジンの基本データを作成する
 *
 * aspects      : 時間帯ごとのアスペクト情報
 * positions    : 天体位置の計算結果
 * configs      : 読み込んだ設定
 * eventRecords : 正確な成立時刻を持つイベント情報（省略可能）
 */
export function buildFortuneData(
  aspects,
  positions,
  configs,
  eventRecords = null
) {
  if (!Array.isArray(aspects)) {
    throw new TypeError("aspects must be an array");
  }

  if (
    !positions ||
    !positions.planets ||
    typeof positions.planets !== "object"
  ) {
    throw new TypeError("Invalid planet positions");
  }

  if (!configs || !configs.scoringRules) {
    throw new TypeError("Scoring configs are required");
  }

  if (
    eventRecords !== null &&
    !Array.isArray(eventRecords)
  ) {
    throw new TypeError("eventRecords must be an array or null");
  }

  // 現在の惑星状態を作成
  const states = buildStates(aspects);

  // 外部イベントがあればそちらを使用する
  // 省略された場合は従来どおりアスペクト情報から作成
  const events = buildEvents(
    eventRecords === null ? aspects : eventRecords
  );

  // 12星座それぞれのハウス情報を作成
  const houses = calculateAllHouses(positions);

  // 12星座分の基本情報をまとめる
  const signs = Object.values(houses).map(signData => ({
    userSignIndex: signData.user_sign_index,
    planets: signData.planets
  }));

  // 12星座×4カテゴリーのスコアを計算
  const scoreData = calculateFortuneScores(
    {
      datetime: positions.datetime || null,
      states,
      houses
    },
    configs
  );

  return {
    datetime: positions.datetime || null,
    states,
    events,
    houses,
    signs,
    scores: scoreData.signs,
    summary: {
      stateCount: states.length,
      eventCount: events.length,
      signCount: signs.length,
      planetCount: Object.keys(positions.planets).length,
      scoreSignCount: scoreData.summary.signCount,
      scoreCategoryCount: scoreData.summary.categoryCount
    }
  };
}
