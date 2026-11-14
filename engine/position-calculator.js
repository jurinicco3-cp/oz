/**
 * position-calculator.js
 *
 * 12星座運勢エンジン用・天体位置計算モジュール
 *
 * 実行環境:
 * Browser
 *
 * 依存ライブラリ:
 * Astronomy Engine
 *
 * 読み込み順:
 * 1. astronomy/astronomy.browser.min.js
 * 2. engine/position-calculator.js
 */

(function (global) {
  "use strict";

  // ==========================================
  // 1. 12星座の定義
  // ==========================================

  const SIGNS = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces"
  ];

  // ==========================================
  // 2. 計算対象の天体
  // ==========================================

  const PLANETS = [
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

  // Astronomy Engineの天体定義
  const BODY_NAMES = {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto"
  };

  // ==========================================
  // 3. Astronomy Engineの確認
  // ==========================================

  function getAstronomy() {
    const astronomy = global.Astronomy;

    if (!astronomy) {
      throw new Error(
        "Astronomy Engineが読み込まれていません。"
      );
    }

    if (
      typeof astronomy.MakeTime !== "function" ||
      typeof astronomy.GeoVector !== "function" ||
      typeof astronomy.Ecliptic !== "function"
    ) {
      throw new Error(
        "Astronomy Engineの必要なAPIが見つかりません。"
      );
    }

    if (!astronomy.Body) {
      throw new Error(
        "Astronomy.Bodyが見つかりません。"
      );
    }

    return astronomy;
  }

  // ==========================================
  // 4. 天体名からBodyを取得
  // ==========================================

  function getBody(planetName) {
    const astronomy = getAstronomy();

    const bodyName = BODY_NAMES[planetName];

    if (!bodyName) {
      throw new Error(
        `未対応の天体名です: ${planetName}`
      );
    }

    const body = astronomy.Body[bodyName];

    if (body === undefined) {
      throw new Error(
        `Astronomy Engineに天体定義がありません: ${bodyName}`
      );
    }

    return body;
  }

  // ==========================================
  // 5. 黄経の正規化
  // ==========================================

  function normalizeLongitude(degrees) {
    if (!Number.isFinite(degrees)) {
      throw new Error(
        "黄経が有効な数値ではありません。"
      );
    }

    return ((degrees % 360) + 360) % 360;
  }

  // ==========================================
  // 6. 黄経から星座を判定
  // ==========================================

  function getSignPosition(longitude) {
    const normalized = normalizeLongitude(longitude);

    const signIndex = Math.floor(normalized / 30);

    const degreeInSign =
      normalized - signIndex * 30;

    return {
      sign: SIGNS[signIndex],
      sign_index: signIndex,
      degree_in_sign: Number(
        degreeInSign.toFixed(6)
      )
    };
  }

  // ==========================================
  // 7. 日時の正規化
  // ==========================================

  function normalizeDate(date) {
    const result =
      date instanceof Date
        ? new Date(date.getTime())
        : new Date(date);

    if (Number.isNaN(result.getTime())) {
      throw new Error(
        "有効な日時を指定してください。"
      );
    }

    return result;
  }

  // ==========================================
  // 8. 天体の地心黄経を取得
  // ==========================================

  function getEclipticLongitude(
    planetName,
    date
  ) {
    const astronomy = getAstronomy();

    const body = getBody(planetName);

    const time = astronomy.MakeTime(date);

    // 地球から見た天体の位置ベクトル
    const vector = astronomy.GeoVector(
      body,
      time,
      true
    );

    // 黄道座標に変換
    const ecliptic = astronomy.Ecliptic(vector);

    if (
      !ecliptic ||
      !Number.isFinite(ecliptic.elon)
    ) {
      throw new Error(
        `${planetName}の黄経を取得できませんでした。`
      );
    }

    return normalizeLongitude(ecliptic.elon);
  }

  // ==========================================
  // 9. 1天体の位置を計算
  // ==========================================

  function calculatePlanetPosition(
    planetName,
    date
  ) {
    const longitude = getEclipticLongitude(
      planetName,
      date
    );

    const signPosition =
      getSignPosition(longitude);

    return {
      longitude: Number(longitude.toFixed(6)),
      sign: signPosition.sign,
      sign_index: signPosition.sign_index,
      degree_in_sign:
        signPosition.degree_in_sign
    };
  }

  // ==========================================
  // 10. 10天体の位置を一括計算
  // ==========================================

  function calculatePositions(date) {
    getAstronomy();

    const targetDate = normalizeDate(date);

    const planets = {};

    for (const planetName of PLANETS) {
      planets[planetName] =
        calculatePlanetPosition(
          planetName,
          targetDate
        );
    }

    return {
      datetime: targetDate.toISOString(),

      coordinate_system:
        "geocentric_ecliptic",

      zodiac:
        "tropical",

      planets: planets
    };
  }

  // ==========================================
  // 11. 外部公開API
  // ==========================================

  global.PositionCalculator = Object.freeze({
    calculatePositions,
    calculatePlanetPosition,
    getEclipticLongitude,
    getSignPosition,
    normalizeLongitude,

    planets: Object.freeze(
      PLANETS.slice()
    ),

    signs: Object.freeze(
      SIGNS.slice()
    )
  });

})(window);
