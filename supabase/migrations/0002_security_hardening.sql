-- セキュリティアドバイザ対応（Supabase advisors の WARN を解消）

-- 公開バケットでの一覧化を防ぐ（公開URLでの取得には SELECT ポリシー不要）
drop policy if exists "videos_obj_select" on storage.objects;

-- RLS ヘルパーは authenticated のみ実行可能に（anon からの RPC 実行を排除）
revoke execute on function public.my_team_id() from public;
revoke execute on function public.my_role()    from public;
revoke execute on function public.is_coach()   from public;
revoke execute on function public.is_staff()   from public;
grant execute on function public.my_team_id() to authenticated;
grant execute on function public.my_role()    to authenticated;
grant execute on function public.is_coach()   to authenticated;
grant execute on function public.is_staff()   to authenticated;

-- トリガー関数は RPC から実行不可に（トリガー経由のみ）
revoke execute on function public.handle_new_user() from public;
