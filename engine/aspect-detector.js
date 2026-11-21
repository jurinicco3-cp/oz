/**
 * aspect-detector.js
 *
 * 天体同士の角度からアスペクトを検出する。
 */

const ASPECTS = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "sextile", angle: 60, orb: 4 },
  { type: "square", angle: 90, orb: 6 },
  { type: "trine", angle: 120, orb: 6 },
  { type: "opposition", angle: 180, orb: 8 }
];

/**
 * 0〜180度の範囲で2つの天体の角度差を求める。
 */
function getAngularDistance(longitudeA, longitudeB) {
  const difference = Math.abs(longitudeA - longitudeB) % 360;
  return Math.min(difference, 360 - difference);
}

/**
 * 2つの天体の間にあるアスペクトを判定する。
 */
function detectAspect(longitudeA, longitudeB) {
  if (
    typeof longitudeA !== "number" ||
    typeof longitudeB !== "number" ||
    !Number.isFinite(longitudeA) ||
    !Number.isFinite(longitudeB)
  ) {
    return null;
  }

  const angle = getAngularDistance(longitudeA, longitudeB);

  for (const aspect of ASPECTS) {
    const orb = Math.abs(angle - aspect.angle);

    if (orb <= aspect.orb) {
      return {
        aspectType: aspect.type,
        angle,
        exactAngle: aspect.angle,
        orb
      };
    }
  }

  return null;
}

// ブラウザから利用できるようにする。
window.AspectDetector = {
  detectAspect,
  getAngularDistance,
  aspects: ASPECTS
};
