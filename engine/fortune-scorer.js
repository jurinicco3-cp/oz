
/**
 * fortune-scorer.js
 *
 * 12星座・4カテゴリの基本スコアを計算する。
 *
 * influence   : 天体配置から受ける影響度
 * favorability: 行動を後押しする象徴の度合い
 *
 * 数値は内部計算用。画面には直接表示しない。
 */

/**
 * 数値を指定範囲に収める
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 小数点以下1桁に丸める
 */
function roundScore(value) {
  return Math.round(value * 10) / 10;
}

/**
 * アスペクトの最大オーブを取得する
 */
function getAspectOrb(aspectType, configs) {
  const aspectSettings = configs.aspects.aspects.find(
    item => item.id === aspectType
  );

  if (aspectSettings && typeof aspectSettings.orb === "number") {
    return aspectSettings.orb;
  }

  // 設定が見つからない場合の初期値
  const defaults = {
    conjunction: 8,
    sextile: 4,
    square: 6,
    trine: 6,
    opposition: 8
  };

  return defaults[aspectType] ?? 6;
}

/**
 * 金運のサブカテゴリ重みをまとめる
 *
 * 5つの分野を別々の運勢にはせず、
 * ひとつの金運スコアに統合する。
 */
function getCategoryWeight(planet, category, rules) {
  const baseWeight =
    rules.category_weights[category]?.[planet] ?? 0;

  if (baseWeight === 0) {
    return 0;
  }

  if (category !== "money") {
    return baseWeight;
  }

  const subcategories = Object.values(
    rules.money_subcategory_weights
  );

  const planetWeights = subcategories
    .map(item => item[planet])
    .filter(weight => typeof weight === "number");

  if (planetWeights.length === 0) {
    return baseWeight;
  }

  const averageWeight =
    planetWeights.reduce((sum, weight) => sum + weight, 0) /
    planetWeights.length;

  return baseWeight * averageWeight;
}

/**
 * 1つのアスペクトから影響度を計算する
 */
function calculateAspectInfluence(
  state,
  planet,
  house,
  category,
  rules,
  configs
) {
  const planetWeight =
    rules.planet_weights[planet] ?? 0;

  const aspectWeight =
    rules.aspect_weights[state.aspectType] ?? 0;

  const categoryWeight =
    getCategoryWeight(planet, category, rules);

  const houseWeight =
    rules.house_weights[String(house)] ?? 0;

  if (
    planetWeight === 0 ||
    aspectWeight === 0 ||
    categoryWeight === 0 ||
    houseWeight === 0
  ) {
    return 0;
  }

  let orbFactor = 1;

  if (rules.event_influence.use_orb_decay) {
    const maxOrb = getAspectOrb(state.aspectType, configs);

    if (maxOrb > 0) {
      orbFactor = clamp(
        1 - state.orb / maxOrb,
        0,
        1
      );

      orbFactor = Math.max(
        orbFactor,
        rules.event_influence.minimum_influence
      );
    }
  }

  let motionFactor = 1;

  if (rules.event_influence.use_applying_separating) {
    if (state.motion === "applying") {
      motionFactor =
        rules.event_influence.applying_multiplier;
    } else if (state.motion === "separating") {
      motionFactor =
        rules.event_influence.separating_multiplier;
    }
  }

  return (
    planetWeight *
    aspectWeight *
    categoryWeight *
    houseWeight *
    orbFactor *
    motionFactor
  );
}

/**
 * アスペクトの性質を数値に変換する
 *
 * harmonious : 前向き
 * neutral    : 中立
 * challenging: 調整や慎重さが必要
 */
function getAspectNature(aspectType, rules) {
  const nature = rules.aspect_nature[aspectType];

  if (nature === "harmonious") return 1;
  if (nature === "challenging") return -1;

  return 0;
}

/**
 * 1つの星座・1つのカテゴリのスコアを計算する
 */

export function calculateCategoryScore(
  states,
  housePlanets,
  category,
  configs
) {
  if (!Array.isArray(states)) {
    throw new TypeError("states must be an array");
  }

  if (!housePlanets || typeof housePlanets !== "object") {
    throw new TypeError("Invalid house planet data");
  }

  const rules = configs.scoringRules;
  const scoreRange = rules.scoring.score_range;

  let totalInfluence = 0;
  let maximumInfluence = 0;
  let favorabilityTotal = 0;
  let contributingAspectCount = 0;

  for (const state of states) {
    const planets = [state.planetA, state.planetB];
    let stateContributed = false;

    for (const planet of planets) {
      const planetHouse = housePlanets[planet];

      if (!planetHouse) continue;

      const weight = calculateAspectInfluence(
        state,
        planet,
        planetHouse.house,
        category,
        rules,
        configs
      );

      if (weight <= 0) continue;

      const maximumWeight =
        (rules.planet_weights[planet] ?? 0) *
        (rules.aspect_weights[state.aspectType] ?? 0) *
        getCategoryWeight(planet, category, rules) *
        (rules.house_weights[String(planetHouse.house)] ?? 0);

      totalInfluence += weight;
      maximumInfluence += maximumWeight;

      favorabilityTotal +=
        weight * getAspectNature(state.aspectType, rules);

      stateContributed = true;
    }

    // このカテゴリに実際に影響したアスペクトだけ数える
    if (stateContributed) {
      contributingAspectCount++;
    }
  }

  const influence =
    maximumInfluence > 0
      ? (totalInfluence / maximumInfluence) * 100
      : 0;

  const favorability =
    totalInfluence > 0
      ? scoreRange.neutral +
        (favorabilityTotal / totalInfluence) * 20
      : scoreRange.neutral;

  return {
    influence: roundScore(
      clamp(influence, scoreRange.min, scoreRange.max)
    ),
    favorability: roundScore(
      clamp(favorability, scoreRange.min, scoreRange.max)
    ),
    aspectCount: contributingAspectCount
  };
}

  // 影響度：最大値を100とする
  const influence =
    maximumInfluence > 0
      ? (totalInfluence / maximumInfluence) * 100
      : 0;

  // 好調度：中立50を基準に評価する
  const favorability =
    totalInfluence > 0
      ? scoreRange.neutral +
        (favorabilityTotal / totalInfluence) * 20
      : scoreRange.neutral;

  return {
    influence: roundScore(
      clamp(influence, scoreRange.min, scoreRange.max)
    ),
    favorability: roundScore(
      clamp(favorability, scoreRange.min, scoreRange.max)
    ),
    aspectCount: states.length
  };
}

/**
 * 12星座すべての4カテゴリを計算する
 */
export function calculateFortuneScores(
  fortuneData,
  configs
) {
  if (!fortuneData || !Array.isArray(fortuneData.states)) {
    throw new TypeError("Invalid fortune data");
  }

  if (!fortuneData.houses) {
    throw new TypeError("House data is required");
  }

  if (!configs || !configs.scoringRules) {
    throw new TypeError("Scoring rules are required");
  }

  const categories = [
    "overall",
    "love",
    "money",
    "work"
  ];

  const signs = configs.signs.signs;

  if (!Array.isArray(signs) || signs.length !== 12) {
    throw new Error("Exactly 12 signs are required");
  }

  const results = signs.map((sign, signIndex) => {
    const houseData = fortuneData.houses[signIndex];

    if (!houseData || !houseData.planets) {
      throw new Error(
        `Missing house data for sign index ${signIndex}`
      );
    }

    const categoryScores = {};

    for (const category of categories) {
      categoryScores[category] = calculateCategoryScore(
        fortuneData.states,
        houseData.planets,
        category,
        configs
      );
    }

    return {
      signIndex,
      signId: sign.id,
      signName: sign.name,
      categories: categoryScores
    };
  });

  return {
    datetime: fortuneData.datetime || null,
    signs: results,
    summary: {
      signCount: results.length,
      categoryCount: categories.length
    }
  };
}
