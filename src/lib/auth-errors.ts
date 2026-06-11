// Map Neon Auth (Better Auth) errors to friendly Japanese messages.
const RULES: { test: RegExp; message: string }[] = [
  { test: /invalid (login credentials|email or password)|invalid credentials/i, message: "メールアドレスまたはパスワードが違います。" },
  { test: /email not (confirmed|verified)|verify your email/i, message: "メールアドレスの確認が完了していません。確認メールをご確認ください。" },
  { test: /user already (registered|exists)|already.*exists|existing user/i, message: "このメールアドレスは既に登録されています。" },
  { test: /password.*(at least|too short|minimum)|weak|at least 6/i, message: "パスワードは6文字以上にしてください。" },
  { test: /unable to validate email|invalid email/i, message: "メールアドレスの形式が正しくありません。" },
  { test: /rate limit|too many/i, message: "試行回数が多すぎます。しばらくしてからお試しください。" },
  { test: /network|fetch|failed to fetch/i, message: "ネットワークエラーが発生しました。" },
];

export function authErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  for (const r of RULES) if (r.test.test(msg)) return r.message;
  return msg || "エラーが発生しました。";
}
