// ミラクル・プレイ・ガチャ：活動でコインを貯めて「プロのコツ」を入手。
export type GachaRarity = "N" | "R" | "SR" | "UR";

export interface GachaReward {
  key: string;
  rarity: GachaRarity;
  emoji: string;
  title: string;
  text: string;
}

export const PULL_COST = 30;
// コイン獲得レート（保存済みデータから算出）
export const COIN_PER_JOURNAL = 10;
export const COIN_PER_NUTRITION = 5;

export const REWARDS: GachaReward[] = [
  // N
  { key: "n1", rarity: "N", emoji: "💧", title: "水分補給のコツ", text: "練習中はのどが渇く前に一口。集中力もパフォーマンスも落ちにくくなる。" },
  { key: "n2", rarity: "N", emoji: "🦵", title: "ストレッチ", text: "練習後30秒×太もも裏。翌日の疲れと怪我リスクがぐっと減る。" },
  { key: "n3", rarity: "N", emoji: "📣", title: "声出しの効果", text: "『カバー！』の一言で味方が一歩動ける。声は最速のトス。" },
  { key: "n4", rarity: "N", emoji: "👀", title: "観察のクセ", text: "サーバーの目線とトスの高さを見るだけで、コースは半分読める。" },
  // R
  { key: "r1", rarity: "R", emoji: "🏐", title: "助走の入り", text: "レフトは『外に開いてから斜めに入る』。最後の2歩を速く、大きく。" },
  { key: "r2", rarity: "R", emoji: "🤲", title: "Aパスの面", text: "面を相手に向け、ボールを『運ぶ』。腕を振らないほど安定する。" },
  { key: "r3", rarity: "R", emoji: "🧱", title: "リードブロック", text: "セッターの手が触れる瞬間にスタート。コミットせず『見て跳ぶ』。" },
  // SR
  { key: "sr1", rarity: "SR", emoji: "🎯", title: "効果的サーブ", text: "狙うは『継ぎ目』と『一番後ろの選手の足元』。崩せば相手の攻撃は単調になる。" },
  { key: "sr2", rarity: "SR", emoji: "🔥", title: "ブロックアウト", text: "相手ブロックが2枚なら、手の外側を狙って弾き出す。決定率が跳ね上がる。" },
  { key: "sr3", rarity: "SR", emoji: "⚡", title: "時間差の極意", text: "クイックの囮で1枚ひきつけてからのパイプ。テンポ差が最大の武器。" },
  // UR
  { key: "ur1", rarity: "UR", emoji: "👑", title: "【金言】準備の質", text: "試合は始まる前に8割決まる。レシーブの構え、声、ポジション。凡事徹底こそ最強。" },
  { key: "ur2", rarity: "UR", emoji: "💎", title: "【金言】メンタル", text: "ミスの後の1本が選手を決める。下を向く時間を捨て、次の準備に全集中。" },
];

const WEIGHT: Record<GachaRarity, number> = { N: 60, R: 25, SR: 12, UR: 3 };

const RARITIES: GachaRarity[] = ["N", "R", "SR", "UR"];

export function drawReward(): GachaReward {
  // まずレア度を重み抽選（N60/R25/SR12/UR3）→ そのレア度から均等に1枚。
  // （カード単位で重み付けするとレア度ごとの枚数差で確率が歪むため2段階で抽選する）
  const total = RARITIES.reduce((s, r) => s + WEIGHT[r], 0);
  let roll = Math.random() * total;
  let rarity: GachaRarity = "N";
  for (const r of RARITIES) {
    roll -= WEIGHT[r];
    if (roll <= 0) {
      rarity = r;
      break;
    }
  }
  const pool = REWARDS.filter((r) => r.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)] ?? REWARDS[0];
}

export function rewardByKey(key: string): GachaReward | undefined {
  return REWARDS.find((r) => r.key === key);
}

export const GACHA_RARITY_STYLE: Record<GachaRarity, { ring: string; bg: string }> = {
  N: { ring: "ring-slate-300", bg: "from-slate-100 to-slate-200" },
  R: { ring: "ring-blue-300", bg: "from-blue-100 to-blue-200" },
  SR: { ring: "ring-purple-300", bg: "from-purple-100 to-fuchsia-200" },
  UR: { ring: "ring-amber-300", bg: "from-amber-100 via-yellow-100 to-orange-200" },
};
