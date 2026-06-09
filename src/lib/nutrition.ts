// 栄養クエスト『マッスル・モンスター・バトル』のロジック。
// 食事入力 → 攻撃力(power) に変換し、週替わりボスをチームで討伐する。

export interface Food {
  key: string;
  label: string;
  emoji: string;
  power: number;
}

export const FOODS: Food[] = [
  { key: "protein", label: "タンパク質", emoji: "🍖", power: 20 },
  { key: "veg", label: "野菜・ビタミン", emoji: "🥦", power: 15 },
  { key: "dairy", label: "乳製品・カルシウム", emoji: "🥛", power: 12 },
  { key: "carb", label: "炭水化物", emoji: "🍙", power: 10 },
  { key: "fruit", label: "果物", emoji: "🍎", power: 8 },
  { key: "water", label: "水分", emoji: "💧", power: 5 },
];

export const FOOD_MAP: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.key, f]));

export interface Combo {
  label: string;
  mult: number;
  need: (keys: Set<string>) => boolean;
}

// 上から順に判定し、最初に一致したコンボを採用
const COMBOS: Combo[] = [
  { label: "完全栄養コンボ！", mult: 2.0, need: (k) => FOODS.every((f) => k.has(f.key)) },
  { label: "筋肉超回復コンボ！", mult: 1.5, need: (k) => k.has("protein") && k.has("veg") },
  { label: "エネルギー満タン！", mult: 1.3, need: (k) => k.has("protein") && k.has("carb") },
  { label: "骨太コンボ！", mult: 1.2, need: (k) => k.has("dairy") && k.has("veg") },
];

export function comboFor(keys: string[]): Combo | null {
  const set = new Set(keys);
  return COMBOS.find((c) => c.need(set)) ?? null;
}

/** 選んだ食事カテゴリ → 攻撃力（コンボ倍率込み）。 */
export function mealPower(keys: string[]): { power: number; combo: Combo | null } {
  const base = keys.reduce((sum, k) => sum + (FOOD_MAP[k]?.power ?? 0), 0);
  const combo = comboFor(keys);
  const power = Math.round(base * (combo?.mult ?? 1));
  return { power, combo };
}

// ===== 週・ボス =====
const DAY = 86400000;

/** その週(月曜始まり)の開始日 YYYY-MM-DD。 */
export function weekStart(d = new Date()): string {
  const day = (d.getDay() + 6) % 7; // 月=0
  const monday = new Date(d.getTime() - day * DAY);
  return monday.toISOString().slice(0, 10);
}

/** 通算の週インデックス（ボス選択用）。 */
export function weekIndex(d = new Date()): number {
  return Math.floor((d.getTime() - new Date("2020-01-06").getTime()) / (7 * DAY));
}

export interface Boss {
  name: string;
  emoji: string;
}
const BOSSES: Boss[] = [
  { name: "デブリ・ゴーレム", emoji: "🪨" },
  { name: "ねぼすけドラゴン", emoji: "🐉" },
  { name: "ジャンクキング", emoji: "🍔" },
  { name: "脱水デーモン", emoji: "🔥" },
  { name: "サボり魔王", emoji: "👹" },
];
export function bossForWeek(d = new Date()): Boss {
  return BOSSES[weekIndex(d) % BOSSES.length];
}

/** チーム人数に応じたボス最大HP。 */
export function bossMaxHp(memberCount: number): number {
  return Math.max(800, memberCount * 250);
}
