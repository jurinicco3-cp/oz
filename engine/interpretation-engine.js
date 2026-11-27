
export function interpretAspect(aspect, configs) {
  if (!aspect || typeof aspect !== "object") {
    throw new TypeError("aspect must be an object");
  }

  if (!configs || !configs.interpretationRules || !configs.planetCombinations) {
    throw new TypeError("Interpretation configs are required");
  }

  const { interpretationRules, planetCombinations } = configs;

  const planetA = aspect.planetA;
  const planetB = aspect.planetB;
  const aspectType = aspect.aspectType;

  if (typeof planetA !== "string" || typeof planetB !== "string") {
    throw new TypeError("Aspect planets are required");
  }

  if (typeof aspectType !== "string") {
    throw new TypeError("aspectType is required");
  }

  // 天体の順番に左右されず、同じ組み合わせを検索する
  const combinationKey = [planetA, planetB].sort().join("_");

  const combination =
    planetCombinations.combination_rules[combinationKey];

  const aspectMeaning =
    interpretationRules.aspect_meanings[aspectType];

  if (!combination) {
    throw new Error(`Unknown planet combination: ${combinationKey}`);
  }

  if (!aspectMeaning) {
    throw new Error(`Unknown aspect type: ${aspectType}`);
  }

  return {
    planets: [planetA, planetB],
    aspectType,
    theme: combination.theme,
    combinationInterpretation: combination.interpretation,
    aspectTheme: aspectMeaning.theme,
    aspectInterpretation: aspectMeaning.interpretation,
    opportunity: aspectMeaning.opportunity,
    caution: aspectMeaning.caution,
    keywords: [
      ...combination.keywords
    ]
  };
}

export function interpretAspects(aspects, configs) {
  if (!Array.isArray(aspects)) {
    throw new TypeError("aspects must be an array");
  }

  return aspects.map(aspect => interpretAspect(aspect, configs));
}
