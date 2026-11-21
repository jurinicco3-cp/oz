/**
 * aspect-detector.js
 *
 * 天体同士の角度からアスペクトを検出し、
 * 接近・分離も判定する。
 */

const ASPECTS = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "sextile", angle: 60, orb: 4 },
  { type: "square", angle: 90, orb: 6 },
  { type: "trine", angle: 120, orb: 6 },
  { type: "opposition", angle: 180, orb: 8 }
];

/**
 * 角度を0〜180度の範囲で求める。
 */
function getAngularDistance(longitudeA, longitudeB) {
  const difference =
    Math.abs(longitudeA - longitudeB) % 360;

  return Math.min(difference, 360 - difference);
}

/**
 * アスペクトを検出する。
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

  const angle =
    getAngularDistance(longitudeA, longitudeB);

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

/**
 * 現在と未来のオーブを比較して、
 * 接近中か分離中かを判定する。
 */
function detectApplying(
  currentLongitudeA,
  currentLongitudeB,
  futureLongitudeA,
  futureLongitudeB,
  aspectType
) {
  const aspect = ASPECTS.find(
    item => item.type === aspectType
  );

  if (!aspect) {
    throw new Error("Unknown aspect type");
  }

  const values = [
    currentLongitudeA,
    currentLongitudeB,
    futureLongitudeA,
    futureLongitudeB
  ];

  if (
    !values.every(
      value =>
        typeof value === "number" &&
        Number.isFinite(value)
    )
  ) {
    throw new TypeError("Invalid longitude value");
  }

  const currentAngle = getAngularDistance(
    currentLongitudeA,
    currentLongitudeB
  );

  const futureAngle = getAngularDistance(
    futureLongitudeA,
    futureLongitudeB
  );

  const currentOrb = Math.abs(
    currentAngle - aspect.angle
  );

  const futureOrb = Math.abs(
    futureAngle - aspect.angle
  );

  if (Math.abs(currentOrb - futureOrb) < 0.000001) {
    return null;
  }

  return futureOrb < currentOrb;
}

// ブラウザから利用できるようにする。
window.AspectDetector = {
  detectAspect,
  detectApplying,
  getAngularDistance,
  aspects: ASPECTS
};
