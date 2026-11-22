
const CONFIG_PATHS = {
  signs: "../config/signs.json",
  planets: "../config/planets.json",
  aspects: "../config/aspects.json",
  houses: "../config/houses.json",
  fortuneCategories: "../config/fortune-categories.json",
  scoringRules: "../config/scoring-rules.json"
};

/**
 * 6つの設定ファイルを読み込む
 */
export async function loadConfigs() {
  const entries = await Promise.all(
    Object.entries(CONFIG_PATHS).map(
      async ([key, path]) => {
        const response = await fetch(path);

        if (!response.ok) {
          throw new Error(
            `設定ファイルの読み込みに失敗しました: ${path} (${response.status})`
          );
        }

        const data = await response.json();

        return [key, data];
      }
    )
  );

  const configs = Object.fromEntries(entries);

  validateConfigs(configs);

  return configs;
}

/**
 * 設定ファイルの基本構造を確認する
 */
export function validateConfigs(configs) {
  const requiredKeys = [
    "signs",
    "planets",
    "aspects",
    "houses",
    "fortuneCategories",
    "scoringRules"
  ];

  for (const key of requiredKeys) {
    if (!configs[key]) {
      throw new Error(`設定が不足しています: ${key}`);
    }
  }

  if (!Array.isArray(configs.signs.signs) ||
      configs.signs.signs.length !== 12) {
    throw new Error("星座設定は12星座必要です");
  }

  if (!Array.isArray(configs.planets.planets) ||
      configs.planets.planets.length !== 10) {
    throw new Error("惑星設定は10天体必要です");
  }

  if (!Array.isArray(configs.aspects.aspects) ||
      configs.aspects.aspects.length !== 5) {
    throw new Error("アスペクト設定は5種類必要です");
  }

  if (!Array.isArray(configs.houses.houses) ||
      configs.houses.houses.length !== 12) {
    throw new Error("ハウス設定は12個必要です");
  }

  if (!Array.isArray(configs.fortuneCategories.categories) ||
      configs.fortuneCategories.categories.length !== 4) {
    throw new Error("運勢カテゴリは4種類必要です");
  }

  if (!configs.scoringRules.scoring ||
      !configs.scoringRules.category_weights) {
    throw new Error("スコアリング設定の構造が不正です");
  }

  return true;
}

