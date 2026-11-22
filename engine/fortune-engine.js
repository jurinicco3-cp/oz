
import { buildEvents } from "./event-builder.js";
import { buildStates } from "./state-builder.js";

/**
 * 占いエンジンの基本データを統合する
 *
 * aspects:
 * 現在検出されたアスペクト情報
 */
export function buildFortuneData(aspects) {
  if (!Array.isArray(aspects)) {
    throw new TypeError("aspects must be an array");
  }

  const states = buildStates(aspects);
  const events = buildEvents(aspects);

  return {
    states,
    events,
    summary: {
      stateCount: states.length,
      eventCount: events.length
    }
  };
}
