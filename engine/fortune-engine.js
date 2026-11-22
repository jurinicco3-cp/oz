import { buildEvents } from "./event-builder.js";
import { buildStates } from "./state-builder.js";
import { calculateAllHouses } from "./house-calculator.js";
import { calculateFortuneScores } from "./fortune-scorer.js";

/**
 * 占いエンジンの基本データを作成する
 *
 * aspects   : 検出されたアスペクト情報
 * positions : PositionCalculator.calculatePositions() の計算結果
 * configs   : config-loader.js で読み込んだ設定
 */
export function buildFortuneData(aspects, positions, configs) {
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

  // 現在の惑星状態を作成
  const states = buildStates(aspects);

  // 正確な成立時刻を持つイベントを作成
  const events = buildEvents(aspects);

  // 12星座それぞれのハウス情報を作成
  const houses = calculateAllHouses(positions);

  // 12星座分の基本情報をまとめる
  const signs = Object.values(houses).map(signData => ({
    userSignIndex: signData.user_sign_index,
    planets: signData.planets
  }));

  // 12星座×4カテゴリのスコアを計算
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
