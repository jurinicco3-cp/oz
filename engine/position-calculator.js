/**
 * position-calculator.js
 *
 * ブラウザ用・天体位置計算エンジン
 * Astronomy Engine を利用して天体の黄経を取得する。
 *
 * 前提:
 * astronomy.browser.min.js が先に読み込まれていること。
 */

(function (global) {
  "use strict";

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

  /**
   * 角度を0〜360度に正規化する
   */
  function normalizeLongitude(degrees) {
    return ((degrees % 360) + 360) % 360;
  }

  /**
   * 黄経から星座と星座内の度数を取得する
   */
  function getSignPosition(longitude) {
    const normalized = normalizeLongitude(longitude);

    const signIndex = Math.floor(normalized / 30);

    return {
      sign: SIGNS[signIndex],
      degree_in_sign: Number(
        (normalized - signIndex * 30).toFixed(6)
      )
    };
  }

  /**
   * 日時をAstronomy Engine用のDateに変換する
   */
  function normalizeDate(date) {
    const result = date instanceof Date
      ? new Date(date.getTime())
      : new Date(date);

    if (Number.isNaN(result.getTime())) {
      throw new Error("有効な日時を指定してください。");
    }

    return result;
  }

  /**
   * 天体の地心黄経を取得する
   *
   * 黄道座標は日付に対応する真黄道・真春分点を基準とする。
   */
  function getEclipticLongitude(body, date) {
    const time = Astronomy.MakeTime(date);

    const equatorial = Astronomy.GeoVector(
      body,
      time,
      true
    );

    const ecliptic = Astronomy.Ecliptic(equatorial);

    return normalizeLongitude(ecliptic.elon);
  }

  /**
   * 10天体の位置を一括取得する
   */
  function calculatePositions(date) {
    if (typeof Astronomy === "undefined") {
      throw new Error(
        "Astronomy Engineが読み込まれていません。"
      );
    }

    const targetDate = normalizeDate(date);

    const result = {
      datetime: targetDate.toISOString(),
      coordinate_system: "geocentric_ecliptic",
      zodiac: "tropical",
      planets: {}
    };

    for (const planetName of PLANETS) {
      const body = Astronomy.Body[planetName];

      if (body === undefined) {
        throw new Error(
          `未対応の天体です: ${planetName}`
        );
      }

      const longitude = getEclipticLongitude(
        body,
        targetDate
      );

      const signPosition = getSignPosition(longitude);

      result.planets[planetName] = {
        longitude: Number(longitude.toFixed(6)),
        sign: signPosition.sign,
        degree_in_sign: signPosition.degree_in_sign
      };
    }

    return result;
  }

  /**
   * 外部から利用できるAPI
   */
  global.PositionCalculator = {
    calculatePositions,
    getSignPosition,
    normalizeLongitude,
    planets: PLANETS.slice()
  };

})(window);
