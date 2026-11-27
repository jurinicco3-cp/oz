
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

export function buildAdviceData(interpretations) {
  validateInterpretations(interpretations);

  const categories = buildCategoryAdviceData(interpretations);

  return {
    categories,
    summary: {
      interpretationCount: interpretations.length,
      categoryCount: Object.keys(categories).length,
      categories: Object.keys(categories)
    }
  };
}

