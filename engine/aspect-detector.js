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

function normalizeLongitude(longitude) {
  return ((longitude % 360) + 360) % 360;
}

function getAngularDistance(longitudeA, longitudeB) {
  const difference = Math.abs(
    normalizeLongitude(longitudeA) -
    normalizeLongitude(longitudeB)
  );

  return Math.min(difference, 360 - difference);
}

function detectAspect(longitudeA, longitudeB) {
  if (
    !Number.isFinite(longitudeA) ||
    !Number.isFinite(longitudeB)
  ) {
    return null;
  }

  const angle = getAngularDistance(
    longitudeA,
    longitudeB
  );

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

  const currentOrb = Math.abs(
    getAngularDistance(
      currentLongitudeA,
      currentLongitudeB
    ) - aspect.angle
  );

  const futureOrb = Math.abs(
    getAngularDistance(
      futureLongitudeA,
      futureLongitudeB
    ) - aspect.angle
  );

  if (Math.abs(currentOrb - futureOrb) < 0.000001) {
    return null;
  }

  return futureOrb < currentOrb;
}

/**
 * 2つの天体の相対角度を計算する。
 * -180度から180度の範囲に正規化する。
 */
function getSignedRelativeAngle(longitudeA, longitudeB) {
  let difference = normalizeLongitude(
    longitudeA - longitudeB
  );

  if (difference > 180) {
    difference -= 360;
  }

  return difference;
}

/**
 * 指定時刻のアスペクト角度との差を計算する。
 */
function getAspectError(
  timestamp,
  planetA,
  planetB,
  aspect,
  calculatePositions
) {
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

  const relativeAngle = getSignedRelativeAngle(
    a.longitude,
    b.longitude
  );

  const targets = aspect.angle === 0
    ? [0]
    : aspect.angle === 180
      ? [180]
      : [aspect.angle, -aspect.angle];

  let bestError = null;

  for (const target of targets) {
    const error = relativeAngle - target;

    if (
      bestError === null ||
      Math.abs(error) < Math.abs(bestError)
    ) {
      bestError = error;
    }
  }

  // 角度の境界をまたぐ場合に備えて正規化する。
  while (bestError > 180) bestError -= 360;
  while (bestError < -180) bestError += 360;

  return {
    timestamp,
    relativeAngle,
    error: bestError,
    orb: Math.abs(bestError)
  };
}

/**
 * 符号が変わる区間を二分探索する。
 */
function refineAspectTime(
  left,
  right,
  planetA,
  planetB,
  aspect,
  calculatePositions
) {
  let leftResult = getAspectError(
    left,
    planetA,
    planetB,
    aspect,
    calculatePositions
  );

  let rightResult = getAspectError(
    right,
    planetA,
    planetB,
    aspect,
    calculatePositions
  );

  if (
    leftResult.error * rightResult.error > 0
  ) {
    return null;
  }

  for (let i = 0; i < 60; i++) {
    const middle = (left + right) / 2;

    const middleResult = getAspectError(
      middle,
      planetA,
      planetB,
      aspect,
      calculatePositions
    );

    if (Math.abs(middleResult.error) < 0.000001) {
      return middleResult;
    }

    if (
      leftResult.error * middleResult.error <= 0
    ) {
      right = middle;
      rightResult = middleResult;
    } else {
      left = middle;
      leftResult = middleResult;
    }
  }

  return getAspectError(
    (left + right) / 2,
    planetA,
    planetB,
    aspect,
    calculatePositions
  );
}

/**
 * 指定期間内の正確なアスペクト時刻を探す。
 *
 * sampleMinutes:
 * 探索時の初期間隔（分）
 *
 * 戻り値:
 * found = true の場合は exactTime に時刻を返す。
 * events には期間内で検出した通過時刻を返す。
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

  const events = [];
  let previous = getAspectError(
    start,
    planetA,
    planetB,
    aspect,
    calculatePositions
  );

  let best = previous;

  for (
    let timestamp = Math.min(start + step, end);
    timestamp <= end;
    timestamp = Math.min(timestamp + step, end)
  ) {
    const current = getAspectError(
      timestamp,
      planetA,
      planetB,
      aspect,
      calculatePositions
    );

    if (current.orb < best.orb) {
      best = current;
    }

    // 正確な角度を通過した区間を検出する。
    if (
      previous.error === 0 ||
      current.error === 0 ||
      previous.error * current.error < 0
    ) {
      const refined = refineAspectTime(
        previous.timestamp,
        current.timestamp,
        planetA,
        planetB,
        aspect,
        calculatePositions
      );

      if (
        refined &&
        refined.orb <= 0.000001
      ) {
        const duplicate = events.some(
          event =>
            Math.abs(
              event.timestamp - refined.timestamp
            ) < 1000
        );

        if (!duplicate) {
          events.push(refined);
        }
      }
    }

    previous = current;

    if (timestamp === end) break;
  }

  const firstEvent = events.length > 0
    ? events[0]
    : null;

  return {
    planetA,
    planetB,
    aspectType,
    exactAngle: aspect.angle,
    orb: firstEvent ? firstEvent.orb : best.orb,
    exactTime: firstEvent
      ? new Date(firstEvent.timestamp).toISOString()
      : null,
    found: events.length > 0,
    events: events.map(event => ({
      exactTime: new Date(
        event.timestamp
      ).toISOString(),
      orb: event.orb
    }))
  };
}

window.AspectDetector = {
  detectAspect,
  detectApplying,
  findExactAspectTime,
  getAngularDistance,
  aspects: ASPECTS
};
