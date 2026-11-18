/**
 * mercury-retrograde-test.js
 *
 * 水星の逆行による星座境界の再通過テスト
 *
 * 依存:
 * PositionCalculator
 */

(function (global) {
  "use strict";

  function normalizeAngle(degrees) {
    return ((degrees % 360) + 360) % 360;
  }

  function getShortestAngleDifference(a, b) {
    return ((b - a + 540) % 360) - 180;
  }

  function getSignName(index) {
    return PositionCalculator.signs[index];
  }

  // 星座境界を越えた時刻を細かく絞り込む
  function refineCrossing(
    start,
    end,
    targetSignIndex
  ) {
    let low = start.getTime();
    let high = end.getTime();

    while (high - low > 1000) {
      const middle = Math.floor((low + high) / 2);
      const date = new Date(middle);

      const position =
        PositionCalculator.calculatePlanetPosition(
          "mercury",
          date
        );

      if (position.sign_index === targetSignIndex) {
        high = middle;
      } else {
        low = middle;
      }
    }

    return {
      bracket_start_utc: new Date(low).toISOString(),
      bracket_end_utc: new Date(high).toISOString(),
      estimated_utc: new Date(
        Math.floor((low + high) / 2)
      ).toISOString()
    };
  }

  // 指定期間の星座境界通過を調べる
  function scanCrossings(startDate, endDate) {
    const stepMilliseconds = 6 * 60 * 60 * 1000;

    const crossings = [];

    let previousDate = new Date(startDate);

    let previousPosition =
      PositionCalculator.calculatePlanetPosition(
        "mercury",
        previousDate
      );

    while (previousDate.getTime() < endDate.getTime()) {
      const nextTime = Math.min(
        previousDate.getTime() + stepMilliseconds,
        endDate.getTime()
      );

      const nextDate = new Date(nextTime);

      const nextPosition =
        PositionCalculator.calculatePlanetPosition(
          "mercury",
          nextDate
        );

      if (
        previousPosition.sign_index !==
        nextPosition.sign_index
      ) {
        const difference = getShortestAngleDifference(
          previousPosition.longitude,
          nextPosition.longitude
        );

        const direction = difference > 0 ? 1 : -1;

        const boundary = normalizeAngle(
          direction > 0
            ? nextPosition.sign_index * 30
            : previousPosition.sign_index * 30
        );

        const refined = refineCrossing(
          previousDate,
          nextDate,
          nextPosition.sign_index
        );

        crossings.push({
          direction:
            direction > 0 ? "direct" : "retrograde",

          direction_value: direction,

          boundary_longitude: boundary,

          from_sign: getSignName(
            previousPosition.sign_index
          ),

          to_sign: getSignName(
            nextPosition.sign_index
          ),

          ...refined
        });
      }

      previousDate = nextDate;
      previousPosition = nextPosition;
    }

    return crossings;
  }

  // 同じ境界で direct → retrograde → direct
  // となる3回の通過を探す
  function findRetrogradeRecrossing(crossings) {
    for (let i = 0; i < crossings.length - 2; i++) {
      const first = crossings[i];
      const second = crossings[i + 1];
      const third = crossings[i + 2];

      const sameBoundary =
        first.boundary_longitude ===
          second.boundary_longitude &&
        second.boundary_longitude ===
          third.boundary_longitude;

      const correctDirection =
        first.direction_value === 1 &&
        second.direction_value === -1 &&
        third.direction_value === 1;

      if (sameBoundary && correctDirection) {
        return {
          boundary_longitude:
            first.boundary_longitude,

          crossings: [
            first,
            second,
            third
          ]
        };
      }
    }

    return null;
  }

  function runTest() {
    if (!global.PositionCalculator) {
      throw new Error(
        "PositionCalculatorが読み込まれていません。"
      );
    }

    const startDate =
      new Date("2026-01-01T00:00:00Z");

    const endDate =
      new Date("2029-01-01T00:00:00Z");

    const crossings = scanCrossings(
      startDate,
      endDate
    );

    const result = findRetrogradeRecrossing(
      crossings
    );

    const report = {
      test_name:
        "Mercury Retrograde Zodiac Recrossing",

      test_period: {
        start_utc: startDate.toISOString(),
        end_utc: endDate.toISOString()
      },

      scan_interval_hours: 6,

      total_crossings: crossings.length,

      result: result ? "FOUND" : "NOT_FOUND",

      recrossing: result,

      all_crossings: crossings
    };

    console.log(
      "水星の逆行・再通過テスト結果"
    );

    console.log(report);

    console.log(
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  global.MercuryRetrogradeTest = Object.freeze({
    runTest
  });

})(window);
