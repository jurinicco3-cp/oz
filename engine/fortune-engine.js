
import { buildEvents } from "./event-builder.js";
import { buildStates } from "./state-builder.js";
import { calculateAllHouses } from "./house-calculator.js";

/**
 * fortune-engine.js
 *
 * 占いエンジンの基本データを統合する。
 *
 * aspects:
 * 現在検出されたアスペクト情報
 *
 * positions:
 * PositionCalculator.calculatePositions() の計算結果
 */

/**
 * 占いエンジンの基本データを作成する
 */
export function buildFortuneData(aspects, positions) {
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

  // 現在の惑星状態を作成
  const states = buildStates(aspects);

  // 正確な成立時刻を持つイベントを作成
  const events = buildEvents(aspects);

  // 12星座それぞれのハウス情報を作成
  const houses = calculateAllHouses(positions);

  // 12星座分の情報をまとめる
  const signs = Object.values(houses).map(signData => ({
    userSignIndex: signData.user_sign_index,
    planets: signData.planets
  }));

  return {
    datetime: positions.datetime || null,

    states,

    events,

    houses,

    signs,

    summary: {
      stateCount: states.length,
      eventCount: events.length,
      signCount: signs.length,
      planetCount: Object.keys(positions.planets).length
    }
  };
}
