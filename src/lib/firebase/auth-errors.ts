// Map Firebase Auth error codes to friendly Japanese messages.
const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "メールアドレスの形式が正しくありません。",
  "auth/user-disabled": "このアカウントは無効化されています。",
  "auth/user-not-found": "メールアドレスまたはパスワードが違います。",
  "auth/wrong-password": "メールアドレスまたはパスワードが違います。",
  "auth/invalid-credential": "メールアドレスまたはパスワードが違います。",
  "auth/email-already-in-use": "このメールアドレスは既に登録されています。",
  "auth/weak-password": "パスワードは6文字以上にしてください。",
  "auth/too-many-requests": "試行回数が多すぎます。しばらくしてからお試しください。",
  "auth/network-request-failed": "ネットワークエラーが発生しました。",
};

export function authErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: unknown }).code);
    if (MESSAGES[code]) return MESSAGES[code];
  }
  if (err instanceof Error) return err.message;
  return "エラーが発生しました。";
}
