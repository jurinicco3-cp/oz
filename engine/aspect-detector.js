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
 * 相対角度を -180〜180度に正規化する。
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
 * 2つの角度の差を -180〜180度に正規化する。
 */
function getSignedAngleDifference(angleA, angleB) {
  let difference = normalizeLongitude(
    angleA - angleB
  );

  if (difference > 180) {
    difference -= 360;
  }

  return difference;
}

/**
 * 指定時刻の相対角度を取得する。
 */
function getRelativeAngle(
  timestamp,
  planetA,
  planetB,
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

  return getSignedRelativeAngle(
    a.longitude,
    b.longitude
  );
}

/**
 * 指定区間の左端を基準にした連続相対角度を取得する。
 */
function getUnwrappedAngle(
  timestamp,
  leftTimestamp,
  leftAngle,
  planetA,
  planetB,
  calculatePositions
) {
  const angle = getRelativeAngle(
    timestamp,
    planetA,
    planetB,
    calculatePositions
  );

  return leftAngle + getSignedAngleDifference(
    angle,
    getRelativeAngle(
      leftTimestamp,
      planetA,
      planetB,
      calculatePositions
    )
  );
}

/**
 * アスペクトの正確な通過時刻を二分探索する。
 */
function refineAspectTime(
  left,
  right,
  leftAngle,
  target,
  planetA,
  planetB,
  calculatePositions
) {
  let leftValue = leftAngle - target;

  for (let i = 0; i < 60; i++) {
    const middle = (left + right) / 2;

    const middleAngle = getUnwrappedAngle(
      middle,
      left,
      leftAngle,
      planetA,
      planetB,
      calculatePositions
    );

    const middleValue = middleAngle - target;

    if (Math.abs(middleValue) < 0.000001) {
      left = middle;
      right = middle;
      break;
    }

    if (leftValue * middleValue <= 0) {
      right = middle;
    } else {
      left = middle;
      leftAngle = middleAngle;
      leftValue = middleValue;
    }
  }

  const timestamp = (left + right) / 2;

  const actualAngle = getRelativeAngle(
    timestamp,
    planetA,
    planetB,
    calculatePositions
  );

  const actualError = Math.abs(
    getSignedAngleDifference(
      actualAngle,
      normalizeLongitude(target)
    )
  );

  return {
    timestamp,
    orb: actualError
  };
}

/**
 * 指定期間内の正確なアスペクト時刻を探す。
 */
function findExactAspectTime(
  startDate,
  endDate,
  planetA,
  planetB,
  aspectType,
  calculatePositions,
  sampleMinutes = 30
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

  const targets = [];

  if (aspect.angle === 0) {
    targets.push(0);
  } else if (aspect.angle === 180) {
    targets.push(180);
  } else {
    targets.push(aspect.angle);
    targets.push(-aspect.angle);
  }

  const events = [];

  let previousTimestamp = start;
  let previousAngle = getRelativeAngle(
    start,
    planetA,
    planetB,
    calculatePositions
  );

  let bestOrb = Infinity;

  for (
    let timestamp = Math.min(start + step, end);
    ;
    timestamp = Math.min(timestamp + step, end)
  ) {
    const currentAngle = getRelativeAngle(
      timestamp,
      planetA,
      planetB,
      calculatePositions
    );

    const delta = getSignedAngleDifference(
      currentAngle,
      previousAngle
    );

    const currentUnwrapped = previousAngle + delta;

    for (const baseTarget of targets) {
      const minAngle = Math.min(
        previousAngle,
        currentUnwrapped
      );

      const maxAngle = Math.max(
        previousAngle,
        currentUnwrapped
      );

      const firstK = Math.ceil(
        (minAngle - baseTarget) / 360
      );

      const lastK = Math.floor(
        (maxAngle - baseTarget) / 360
      );

      for (let k = firstK; k <= lastK; k++) {
        const target = baseTarget + 360 * k;

        const leftValue = previousAngle - target;
        const rightValue = currentUnwrapped - target;

        if (
          leftValue * rightValue > 0 ||
          Math.abs(leftValue - rightValue) < 0.000000001
        ) {
          continue;
        }

        const refined = refineAspectTime(
          previousTimestamp,
          timestamp,
          previousAngle,
          target,
          planetA,
          planetB,
          calculatePositions
        );

        if (
          refined.orb <= 0.00001 &&
          !events.some(
            event =>
              Math.abs(
                event.timestamp - refined.timestamp
              ) < 1000
          )
        ) {
          events.push(refined);
        }
      }
    }

    const currentOrb = Math.min(
      ...targets.map(target => {
        const difference = getSignedAngleDifference(
          currentAngle,
          target
        );

        return Math.abs(difference);
      })
    );

    bestOrb = Math.min(bestOrb, currentOrb);

    previousTimestamp = timestamp;
    previousAngle = currentUnwrapped;

    if (timestamp === end) {
      break;
    }
  }

  events.sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const firstEvent = events.length > 0
    ? events[0]
    : null;

  return {
    planetA,
    planetB,
    aspectType,
    exactAngle: aspect.angle,
    orb: firstEvent ? firstEvent.orb : bestOrb,
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
