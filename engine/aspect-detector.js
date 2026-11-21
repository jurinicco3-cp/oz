
/**
 * aspect-detector.js
 *
 * アスペクト検出・接近分離判定・
 * 正確なアスペクト時刻の探索
 */

const ASPECTS = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "sextile", angle: 60, orb: 4 },
  { type: "square", angle: 90, orb: 6 },
  { type: "trine", angle: 120, orb: 6 },
  { type: "opposition", angle: 180, orb: 8 }
];

function getAngularDistance(longitudeA, longitudeB) {
  const difference =
    Math.abs(longitudeA - longitudeB) % 360;

  return Math.min(difference, 360 - difference);
}

function detectAspect(longitudeA, longitudeB) {
  if (
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

  if (!values.every(Number.isFinite)) {
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

/**
 * 指定期間内でオーブが最小になる時刻を探す。
 *
 * calculatePositions(date) は
 * PositionCalculator.calculatePositions(date)
 * を渡す。
 *
 * exactTime は十分な精度で正確な角度に
 * 到達した場合だけ返す。
 */
function findExactAspectTime(
  startDate,
  endDate,
  planetA,
  planetB,
  aspectType,
  calculatePositions,
  sampleMinutes = 60
) {
  const aspect = ASPECTS.find(
    item => item.type === aspectType
  );

  if (!aspect) {
    throw new Error("Unknown aspect type");
  }

  if (
    !(startDate instanceof Date) ||
    !(endDate instanceof Date) ||
    !Number.isFinite(startDate.getTime()) ||
    !Number.isFinite(endDate.getTime()) ||
    endDate <= startDate
  ) {
    throw new TypeError("Invalid search period");
  }

  if (
    typeof calculatePositions !== "function" ||
    !Number.isFinite(sampleMinutes) ||
    sampleMinutes <= 0
  ) {
    throw new TypeError("Invalid search settings");
  }

  const start = startDate.getTime();
  const end = endDate.getTime();
  const step = sampleMinutes * 60 * 1000;

  function getOrb(timestamp) {
    const positions = calculatePositions(
      new Date(timestamp)
    );

    const a = positions.planets[planetA];
    const b = positions.planets[planetB];

    if (
      !a ||
      !b ||
      !Number.isFinite(a.longitude) ||
      !Number.isFinite(b.longitude)
    ) {
      throw new Error("Planet position not found");
    }

    const angle = getAngularDistance(
      a.longitude,
      b.longitude
    );

    return {
      timestamp,
      angle,
      orb: Math.abs(angle - aspect.angle)
    };
  }

  // 指定期間を一定間隔で調べる。
  let best = null;

  for (let time = start; time <= end; time += step) {
    const result = getOrb(time);

    if (!best || result.orb < best.orb) {
      best = result;
    }
  }

  // 終了時刻も必ず調べる。
  const last = getOrb(end);

  if (!best || last.orb < best.orb) {
    best = last;
  }

  // 最小値の周辺を細かく探索する。
  let left = Math.max(start, best.timestamp - step);
  let right = Math.min(end, best.timestamp + step);

  for (let i = 0; i < 40; i++) {
    const oneThird = (right - left) / 3;

    const t1 = left + oneThird;
    const t2 = right - oneThird;

    const orb1 = getOrb(t1).orb;
    const orb2 = getOrb(t2).orb;

    if (orb1 <= orb2) {
      right = t2;
    } else {
      left = t1;
    }
  }

  const refined = getOrb((left + right) / 2);

  if (refined.orb < best.orb) {
    best = refined;
  }

  return {
    planetA,
    planetB,
    aspectType,
    exactAngle: aspect.angle,
    orb: best.orb,
    exactTime:
      best.orb <= 0.001
        ? new Date(best.timestamp).toISOString()
        : null,
    found: best.orb <= 0.001
  };
}

window.AspectDetector = {
  detectAspect,
  detectApplying,
  findExactAspectTime,
  getAngularDistance,
  aspects: ASPECTS
};
