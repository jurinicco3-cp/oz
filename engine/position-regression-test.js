
(function (global) {
  "use strict";

  const LIMIT_ARCSEC = 60;

  // JPL Horizons Observer Table の基準値
  // 日時はすべて UTC
  const BASELINES = [
    {
      date: "2026-06-14T03:00:00Z",
      reference: {
        sun:     { longitude: 83.0982230 },
        moon:    { longitude: 68.8091368 },
        mercury: { longitude: 107.5015588 },
        venus:   { longitude: 120.7870509 },
        mars:    { longitude: 49.4079749 },
        jupiter: { longitude: 116.6380875 },
        saturn:  { longitude: 13.2468941 },
        uranus:  { longitude: 62.8116108 },
        neptune: { longitude: 4.2699420 }
      }
    },
    {
      date: "2026-11-14T03:00:00Z",
      reference: {
        sun:     { longitude: 231.7494506, latitude: -0.0000499 },
        moon:    { longitude: 285.0494989, latitude: -3.2476470 },
        mercury: { longitude: 215.0532467, latitude: 2.1119382 },
        venus:   { longitude: 202.8638734, latitude: -1.6338628 },
        mars:    { longitude: 144.9250974, latitude: 1.8896765 },
        jupiter: { longitude: 145.7062828, latitude: 0.7368139 },
        saturn:  { longitude: 8.5668489, latitude: -2.6482548 },
        uranus:  { longitude: 64.1668979, latitude: -0.1497916 },
        neptune: { longitude: 1.8434385, latitude: -1.4084899 }
      }
    },
    {
      date: "2027-02-20T03:00:00Z",
      reference: {
        sun:     { longitude: 331.2367942, latitude: 0.0000374 },
        moon:    { longitude: 139.5217443, latitude: 0.0961382 },
        mercury: { longitude: 328.1729294, latitude: 3.7133270 },
        venus:   { longitude: 289.1945768, latitude: 1.3422203 },
        mars:    { longitude: 150.5834774, latitude: 4.4603971 },
        jupiter: { longitude: 140.8450893, latitude: 1.0660895 },
        saturn:  { longitude: 12.1053734, latitude: -2.2863943 },
        uranus:  { longitude: 61.7428431, latitude: -0.1276165 },
        neptune: { longitude: 2.8901801, latitude: -1.3515009 }
      }
    }
  ];

  function longitudeDifferenceArcsec(a, b) {
    let difference = Math.abs(a - b);
    difference = Math.min(difference, 360 - difference);
    return difference * 3600;
  }

  function latitudeDifferenceArcsec(a, b) {
    return Math.abs(a - b) * 3600;
  }

  function runTest() {
    if (!global.PositionCalculator) {
      throw new Error("PositionCalculatorが読み込まれていません。");
    }

    const details = [];

    for (const baseline of BASELINES) {
      const date = new Date(baseline.date);

      const calculated =
        global.PositionCalculator.calculatePositions(date);

      for (const [body, reference] of Object.entries(baseline.reference)) {
        const actual = calculated.planets[body];

        if (!actual) {
          details.push({
            date: baseline.date,
            body,
            coordinate: "position",
            passed: false,
            error: "計算結果がありません"
          });
          continue;
        }

        const longitudeDiff = longitudeDifferenceArcsec(
          actual.longitude,
          reference.longitude
        );

        details.push({
          date: baseline.date,
          body,
          coordinate: "longitude",
          reference: reference.longitude,
          actual: actual.longitude,
          difference_arcsec: Number(longitudeDiff.toFixed(5)),
          passed:
            Number.isFinite(longitudeDiff) &&
            longitudeDiff <= LIMIT_ARCSEC
        });

        if (reference.latitude !== undefined) {
          const latitudeDiff = latitudeDifferenceArcsec(
            actual.latitude,
            reference.latitude
          );

          details.push({
            date: baseline.date,
            body,
            coordinate: "latitude",
            reference: reference.latitude,
            actual: actual.latitude,
            difference_arcsec: Number(latitudeDiff.toFixed(5)),
            passed:
              Number.isFinite(latitudeDiff) &&
              latitudeDiff <= LIMIT_ARCSEC
          });
        }
      }
    }

    const passedCount = details.filter(item => item.passed).length;
    const failedCount = details.length - passedCount;

    const longitudeTests = details.filter(
      item => item.coordinate === "longitude"
    );

    const latitudeTests = details.filter(
      item => item.coordinate === "latitude"
    );

    function averageDifference(items) {
      if (items.length === 0) return null;

      return Number((
        items.reduce((sum, item) => sum + item.difference_arcsec, 0) /
        items.length
      ).toFixed(5));
    }

    function maximumDifference(items) {
      if (items.length === 0) return null;

      return Number(Math.max(
        ...items.map(item => item.difference_arcsec)
      ).toFixed(5));
    }

    return {
      test_name: "Planet Position Automatic Regression Test",
      test_date: new Date().toISOString(),
      reference: "JPL Horizons Observer Table",
      threshold_arcseconds: LIMIT_ARCSEC,
      test_epochs: BASELINES.length,
      total_tests: details.length,
      passed: passedCount,
      failed: failedCount,
      overall_result: failedCount === 0 ? "ALL_PASS" : "FAILED",
      longitude_summary: {
        count: longitudeTests.length,
        average_difference_arcsec:
          averageDifference(longitudeTests),
        maximum_difference_arcsec:
          maximumDifference(longitudeTests)
      },
      latitude_summary: {
        count: latitudeTests.length,
        average_difference_arcsec:
          averageDifference(latitudeTests),
        maximum_difference_arcsec:
          maximumDifference(latitudeTests)
      },
      details,
      notes: [
        "比較対象はJPL Horizonsの地心・見かけの黄道座標です。",
        "JPLとAstronomy Engineでは補正モデルが異なるため、差は純粋な計算誤差を意味しません。",
        "60秒角はプロジェクト独自の合格基準です。",
        "2026-06-14は経度のみを検証しています。"
      ]
    };
  }

  global.PositionRegressionTest = {
    runTest
  };

})(window);
