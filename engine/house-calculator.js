

/**
 * house-calculator.js
 *
 * 太陽星座を基準に、各天体が何ハウスに位置するか計算する。
 * ハウス方式：Whole Sign Solar Houses
 */

/**
 * 星座の並び順からハウス番号を計算する
 *
 * @param {number} userSignIndex 基準となる太陽星座の番号（0〜11）
 * @param {number} planetSignIndex 天体が位置する星座の番号（0〜11）
 * @returns {number} ハウス番号（1〜12）
 */
export function calculateHouse(userSignIndex, planetSignIndex) {
  if (
    !Number.isInteger(userSignIndex) ||
    userSignIndex < 0 ||
    userSignIndex > 11
  ) {
    throw new RangeError("userSignIndex must be an integer from 0 to 11");
  }

  if (
    !Number.isInteger(planetSignIndex) ||
    planetSignIndex < 0 ||
    planetSignIndex > 11
  ) {
    throw new RangeError("planetSignIndex must be an integer from 0 to 11");
  }

  return ((planetSignIndex - userSignIndex + 12) % 12) + 1;
}

/**
 * 12星座それぞれを基準に、全天体のハウスを計算する
 *
 * @param {Object} positions PositionCalculatorの計算結果
 * @returns {Object} 星座ごとの天体ハウス一覧
 */
export function calculateAllHouses(positions) {
  if (!positions || !positions.planets) {
    throw new TypeError("Invalid planet positions");
  }

  const planetEntries = Object.entries(positions.planets);

  if (planetEntries.length !== 10) {
    throw new Error("Exactly 10 planet positions are required");
  }

  const result = {};

  for (let userSignIndex = 0; userSignIndex < 12; userSignIndex++) {
    const planets = {};

    for (const [planetName, planetData] of planetEntries) {
      if (
        !planetData ||
        !Number.isInteger(planetData.sign_index) ||
        planetData.sign_index < 0 ||
        planetData.sign_index > 11
      ) {
        throw new Error(`Invalid sign_index for planet: ${planetName}`);
      }

      planets[planetName] = {
        sign_index: planetData.sign_index,
        house: calculateHouse(
          userSignIndex,
          planetData.sign_index
        )
      };
    }

    result[userSignIndex] = {
      user_sign_index: userSignIndex,
      planets
    };
  }

  return result;
}
