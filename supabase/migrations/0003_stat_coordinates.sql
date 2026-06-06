-- コートタップ入力（2タッチ）の落下地点座標。x,y は 0-100 の正規化座標。
alter table public.stats
  add column if not exists x real,
  add column if not exists y real;
