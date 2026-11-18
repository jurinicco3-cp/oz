/**
 * mercury-retrograde-verification.js
 * 水星の逆行・星座境界再通過の前後確認
 *
 * 依存:
 * - Astronomy Engine
 * - PositionCalculator
 */

(function (global) {
  "use strict";

  const TEST_CASES = [
    {
      name: "1回目：順行で魚座へ",
      crossing_utc: "2027-02-01T01:26:46.529Z",
      expected_before: "aquarius",
      expected_after: "pisces",
      before_side: "below",
      after_side: "above"
    },
    {
      name: "2回目：逆行で水瓶座へ戻る",
      crossing_utc: "2027-02-18T12:17:06.011Z",
      expected_before: "pisces",
      expected_after: "aquarius",
      before_side: "above",
      after_side: "below"
    },
    {
      name: "3回目：順行で再び魚座へ",
      crossing_utc: "2027-03-18T10:02:12.603Z",
      expected_before: "aquarius",
      expected_after: "pisces",
      before_side: "below",
      after_side: "above"
    }
  ];

  const BOUNDARY = 330;
  const OFFSET_MINUTES = 10;

  function getPosition(date) {
    return PositionCalculator.calculatePlanetPosition(
      "mercury",
      date
    );
  }

  function checkSide(longitude, expectedSide) {
    if (expectedSide === "below") {
      return longitude < BOUNDARY;
    }

    return longitude > BOUNDARY;
  }

  function verifyCase(testCase) {
    const crossingTime = new Date(testCase.crossing_utc);

    const beforeDate = new Date(
      crossingTime.getTime() -
      OFFSET_MINUTES * 60 * 1000
    );

    const afterDate = new Date(
      crossingTime.getTime() +
      OFFSET_MINUTES * 60 * 1000
    );

    const before = getPosition(beforeDate);
    const after = getPosition(afterDate);

    const beforeSignOK =
      before.sign === testCase.expected_before;

    const afterSignOK =
      after.sign === testCase.expected_after;

    const beforeLongitudeOK =
      checkSide(before.longitude, testCase.before_side);

    const afterLongitudeOK =
      checkSide(after.longitude, testCase.after_side);

    const passed =
      beforeSignOK &&
      afterSignOK &&
      beforeLongitudeOK &&
      afterLongitudeOK;

    return {
      name: testCase.name,
      crossing_utc: testCase.crossing_utc,
      boundary_longitude: BOUNDARY,

      before: {
        time_utc: beforeDate.toISOString(),
        sign: before.sign,
        longitude: before.longitude,
        expected_sign: testCase.expected_before,
        sign_check: beforeSignOK,
        longitude_check: beforeLongitudeOK
      },

      after: {
        time_utc: afterDate.toISOString(),
        sign: after.sign,
        longitude: after.longitude,
        expected_sign: testCase.expected_after,
        sign_check: afterSignOK,
        longitude_check: afterLongitudeOK
      },

      result: passed ? "PASS" : "FAIL"
    };
  }

  function runTest() {
    if (!global.PositionCalculator) {
      throw new Error(
        "PositionCalculatorが読み込まれていません。"
      );
    }

    const results = TEST_CASES.map(verifyCase);

    const passCount = results.filter(
      item => item.result === "PASS"
    ).length;

    const report = {
      test_name: "Mercury Retrograde Crossing Verification",
      test_date: new Date().toISOString(),
      planet: "mercury",
      boundary_longitude: BOUNDARY,
      offset_minutes: OFFSET_MINUTES,
      total_tests: results.length,
      passed: passCount,
      failed: results.length - passCount,
      overall_result:
        passCount === results.length ? "ALL_PASS" : "CHECK_REQUIRED",
      results
    };

    console.log("水星の逆行・再通過 前後検証結果");
    console.log(report);
    console.log(JSON.stringify(report, null, 2));

    return report;
  }

  global.MercuryRetrogradeVerification = Object.freeze({
    runTest
  });

})(window);
