
const CATEGORY_INTRODUCTIONS = {
  overall: "今日の全体的なテーマは、",
  love: "人との関わりでは、",
  money: "お金や持ち物については、",
  work: "仕事や日々の役割では、"
};

const ADVICE_TEMPLATES = {
  opportunity: [
    "{theme}というテーマが意識されやすい時間帯です。{opportunity}",
    "{theme}に目を向けてみましょう。{opportunity}",
    "{theme}を活かすきっかけになりそうです。{opportunity}"
  ],
  caution: [
    "{caution}",
    "一方で、{caution}",
    "意識したいのは、{caution}"
  ]
};

const CATEGORY_ACTIONS = {
  overall: "自分のペースを大切にして、無理のない一歩を選んでみましょう。",
  love: "相手の気持ちだけでなく、自分の素直な思いも大切にしてみましょう。",
  money: "大きな判断は情報を確認し、無理のない範囲で考えてみましょう。",
  work: "優先順位を整理して、できることから取り組んでみましょう。"
};

function selectTemplate(templates, index) {
  return templates[index % templates.length];
}

function replacePlaceholders(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] ?? "";
  });
}

function buildThemeText(theme, index) {
  const template = selectTemplate(
    ADVICE_TEMPLATES.opportunity,
    index
  );

  return replacePlaceholders(template, theme);
}

function buildCautionText(theme, index) {
  const template = selectTemplate(
    ADVICE_TEMPLATES.caution,
    index
  );

  return replacePlaceholders(template, theme);
}

function validateCategoryData(categoryData) {
  if (!categoryData || typeof categoryData !== "object") {
    throw new TypeError("categoryData is required");
  }

  const requiredCategories = ["overall", "love", "money", "work"];

  for (const category of requiredCategories) {
    const data = categoryData[category];

    if (!data || !Array.isArray(data.themes)) {
      throw new TypeError(`Invalid category data: ${category}`);
    }
  }
}

export function generateCategoryAdvice(category, categoryData) {
  if (!CATEGORY_INTRODUCTIONS[category]) {
    throw new Error(`Unknown category: ${category}`);
  }

  const data = categoryData[category];

  if (!data || !Array.isArray(data.themes)) {
    throw new TypeError(`Invalid category data: ${category}`);
  }

  if (data.themes.length === 0) {
    return {
      category,
      label: data.label,
      introduction: CATEGORY_INTRODUCTIONS[category],
      mainAdvice: "この時間帯は、特定のテーマに強く偏らず、普段のペースを大切に過ごしてみましょう。",
      caution: "焦って結論を出さず、状況を落ち着いて見てみましょう。",
      action: CATEGORY_ACTIONS[category],
      themes: []
    };
  }

  const selectedThemes = data.themes.slice(0, 2);

  const mainAdvice = selectedThemes.map((theme, index) => {
    return buildThemeText({
      theme: theme.theme,
      opportunity: theme.opportunity
    }, index);
  }).join(" ");

  const caution = buildCautionText(
    {
      caution: selectedThemes[0].caution
    },
    0
  );

  return {
    category,
    label: data.label,
    introduction: CATEGORY_INTRODUCTIONS[category],
    mainAdvice,
    caution,
    action: CATEGORY_ACTIONS[category],
    themes: selectedThemes.map(theme => ({
      theme: theme.theme,
      planets: theme.planets,
      aspectType: theme.aspectType
    }))
  };
}

export function generateAllAdvice(categoryData) {
  validateCategoryData(categoryData);

  const advice = {};

  for (const category of ["overall", "love", "money", "work"]) {
    advice[category] = generateCategoryAdvice(
      category,
      categoryData
    );
  }

  return {
    advice,
    summary: {
      categoryCount: Object.keys(advice).length,
      generated: true
    }
  };
}
