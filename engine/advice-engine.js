
const CATEGORY_PLANET_WEIGHTS = {
  overall: {
    sun: 1.0, moon: 1.2, mercury: 1.0, venus: 0.9,
    mars: 0.9, jupiter: 0.8, saturn: 0.8,
    uranus: 0.7, neptune: 0.7, pluto: 0.7
  },
  love: {
    moon: 1.2, venus: 1.3, mars: 0.9,
    mercury: 0.9, jupiter: 0.8, saturn: 0.7
  },
  money: {
    venus: 1.2, jupiter: 1.2, saturn: 1.0,
    mercury: 1.0, mars: 0.8, pluto: 0.9, uranus: 0.8
  },
  work: {
    sun: 1.2, mercury: 1.2, mars: 1.0,
    saturn: 1.1, jupiter: 0.9, moon: 0.8
  }
};

const CATEGORY_KEYWORDS = {
  overall: [
    "自己表現", "感情", "思考", "成長", "変化",
    "意欲", "責任", "理想", "洞察"
  ],
  love: [
    "愛情", "魅力", "好意", "安心感", "心地よさ",
    "共感", "信頼", "深い結びつき", "感情表現"
  ],
  money: [
    "豊かさ", "価値観", "計画", "判断", "現実性",
    "拡大", "資産", "調査", "継続"
  ],
  work: [
    "思考", "計画", "判断", "実行力", "努力",
    "集中力", "責任", "継続", "発展"
  ]
};

const CATEGORY_LABELS = {
  overall: "総合運",
  love: "恋愛運",
  money: "金運",
  work: "仕事運"
};

// ハウスが象徴する日常生活のテーマ
const HOUSE_THEMES = {
  1: "自分自身・行動・自己表現",
  2: "お金・所有物・価値観",
  3: "会話・学習・身近な人",
  4: "家庭・居場所・心の基盤",
  5: "恋愛・楽しみ・創造性",
  6: "仕事・習慣・日々の管理",
  7: "対人関係・パートナーシップ",
  8: "共有財産・深い関係・変化",
  9: "学び・探求・視野の広がり",
  10: "社会的役割・キャリア・目標",
  11: "友人・仲間・将来の希望",
  12: "休息・内省・心の整理"
};

// カテゴリーごとのハウスの重要度
const CATEGORY_HOUSE_WEIGHTS = {
  overall: {
    1: 1.0, 2: 0.8, 3: 0.8, 4: 1.0,
    5: 1.0, 6: 0.9, 7: 0.9, 8: 0.9,
    9: 0.8, 10: 1.0, 11: 0.9, 12: 0.8
  },
  love: {
    1: 0.7, 2: 0.7, 4: 0.8, 5: 1.3,
    7: 1.2, 8: 1.1, 11: 0.8
  },
  money: {
    2: 1.3, 6: 0.8, 8: 1.2,
    10: 1.0, 11: 0.9
  },
  work: {
    2: 0.8, 3: 0.8, 6: 1.3,
    9: 0.7, 10: 1.3, 11: 0.9
  }
};

function validateInterpretations(interpretations) {
  if (!Array.isArray(interpretations)) {
    throw new TypeError("interpretations must be an array");
  }

  for (const item of interpretations) {
    if (
      !item ||
      !Array.isArray(item.planets) ||
      !Array.isArray(item.keywords)
    ) {
      throw new TypeError("Invalid interpretation data");
    }
  }
}

function getCategoryRelevance(item, category) {
  const planetWeights = CATEGORY_PLANET_WEIGHTS[category];
  const keywords = CATEGORY_KEYWORDS[category];

  const planetScore = item.planets.reduce(
    (total, planet) => total + (planetWeights[planet] || 0),
    0
  );

  const keywordScore = item.keywords.reduce(
    (total, keyword) => total + (keywords.includes(keyword) ? 0.5 : 0),
    0
  );

  return planetScore + keywordScore;
}

function getHouseContexts(item, signHouses) {
  return item.planets.map(planet => {
    const planetData = signHouses.planets[planet];

    if (!planetData || !Number.isInteger(planetData.house)) {
      throw new Error(`Invalid house data for planet: ${planet}`);
    }

    return {
      planet,
      house: planetData.house,
      theme: HOUSE_THEMES[planetData.house]
    };
  });
}

function getHouseRelevance(houseContexts, category) {
  const weights = CATEGORY_HOUSE_WEIGHTS[category];

  return houseContexts.reduce(
    (total, context) => total + (weights[context.house] || 0),
    0
  );
}

function buildSignCategoryAdvice(
  interpretations,
  signHouses,
  category
) {
  const ranked = interpretations
    .map(item => {
      const houseContexts = getHouseContexts(item, signHouses);

      const planetRelevance = getCategoryRelevance(
        item,
        category
      );

      const houseRelevance = getHouseRelevance(
        houseContexts,
        category
      );

      return {
        interpretation: item,
        houseContexts,
        relevance: planetRelevance + houseRelevance
      };
    })
    .filter(item => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  return {
    category,
    label: CATEGORY_LABELS[category],
    themes: ranked.map(item => ({
      planets: item.interpretation.planets,
      aspectType: item.interpretation.aspectType,
      theme: item.interpretation.theme,
      interpretation: item.interpretation.combinationInterpretation,
      aspectInterpretation: item.interpretation.aspectInterpretation,
      opportunity: item.interpretation.opportunity,
      caution: item.interpretation.caution,
      keywords: item.interpretation.keywords,
      houseContexts: item.houseContexts,
      relevance: Number(item.relevance.toFixed(2))
    }))
  };
}

export function buildCategoryAdviceData(interpretations) {
  validateInterpretations(interpretations);

  const categories = {};

  for (const category of Object.keys(CATEGORY_LABELS)) {
    const ranked = interpretations
      .map(item => ({
        interpretation: item,
        relevance: getCategoryRelevance(item, category)
      }))
      .filter(item => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);

    categories[category] = {
      category,
      label: CATEGORY_LABELS[category],
      themes: ranked.map(item => ({
        planets: item.interpretation.planets,
        aspectType: item.interpretation.aspectType,
        theme: item.interpretation.theme,
        interpretation: item.interpretation.combinationInterpretation,
        aspectInterpretation: item.interpretation.aspectInterpretation,
        opportunity: item.interpretation.opportunity,
        caution: item.interpretation.caution,
        keywords: item.interpretation.keywords,
        relevance: Number(item.relevance.toFixed(2))
      }))
    };
  }

  return categories;
}

export function buildAdviceData(interpretations, houses = null) {
  validateInterpretations(interpretations);

  const categories = buildCategoryAdviceData(interpretations);

  const result = {
    categories,
    summary: {
      interpretationCount: interpretations.length,
      categoryCount: Object.keys(categories).length,
      categories: Object.keys(categories)
    }
  };

  // 12星座ごとの個別アドバイスデータを作成
  if (houses !== null) {
    const signs = {};

    for (let signIndex = 0; signIndex < 12; signIndex++) {
      const signHouses = houses[signIndex];

      if (!signHouses || !signHouses.planets) {
        throw new Error(`Missing house data for sign: ${signIndex}`);
      }

      const signCategories = {};

      for (const category of Object.keys(CATEGORY_LABELS)) {
        signCategories[category] = buildSignCategoryAdvice(
          interpretations,
          signHouses,
          category
        );
      }

      signs[signIndex] = {
        signIndex,
        categories: signCategories
      };
    }

    result.signs = signs;
    result.summary.signCount = 12;
  }

  return result;
}
