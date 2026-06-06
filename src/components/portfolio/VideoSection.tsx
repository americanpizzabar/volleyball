"use client";

import { useMemo, useState } from "react";
import { useCollection } from "@/lib/useCollection";
import {
  addVideoComment,
  createVideo,
  deleteVideo,
  uploadVideo,
  videosByUserQuery,
} from "@/lib/db";
import { cryptoId } from "@/lib/court";
import type { GrowthVideo } from "@/lib/types";
import { EmptyState, Spinner } from "../ui";

interface Me {
  uid: string;
  name: string;
  isCoach: boolean;
}

export default function VideoSection({
  teamId,
  targetUid,
  targetName,
  canUpload,
  me,
}: {
  teamId: string;
  targetUid: string;
  targetName: string;
  canUpload: boolean;
  me: Me;
}) {
  const { data: videos } = useCollection<GrowthVideo>(
    () => videosByUserQuery(targetUid),
    [targetUid],
  );
  const sorted = useMemo(
    () => [...videos].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [videos],
  );

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("動画ファイルを選んでください。");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError("ファイルが大きすぎます（200MBまで）。短く撮影してください。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { url, path } = await uploadVideo(file, teamId, targetUid);
      await createVideo({
        teamId,
        userId: targetUid,
        userName: targetName,
        title: title.trim() || "無題の動画",
        skillTag: tag.trim(),
        url,
        storagePath: path,
        comments: [],
      });
      setFile(null);
      setTitle("");
      setTag("");
    } catch {
      setError("アップロードに失敗しました。Supabase Storageの設定をご確認ください。");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {canUpload && (
        <form onSubmit={handleUpload} className="card space-y-3">
          <p className="text-sm font-bold text-slate-700">動画をアップロード</p>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
          />
          <input
            className="input"
            placeholder="タイトル（例: サーブフォーム 6月）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input"
            placeholder="タグ（例: サーブ）"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="btn-primary w-full">
            {busy ? <Spinner /> : "アップロード"}
          </button>
          <p className="text-[11px] text-slate-400">
            ※ 200MBまで。過去の動画と並べて成長を比較できます。
          </p>
        </form>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon="🎥"
          title="まだ動画がありません"
          description={canUpload ? "フォーム動画を投稿して成長を記録しよう。" : undefined}
        />
      ) : (
        sorted.map((v) => (
          <VideoCard key={v.id} video={v} me={me} canDelete={canUpload || me.isCoach} />
        ))
      )}
    </div>
  );
}

function VideoCard({
  video,
  me,
  canDelete,
}: {
  video: GrowthVideo;
  me: Me;
  canDelete: boolean;
}) {
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!comment.trim()) return;
    setSending(true);
    await addVideoComment(video.id, {
      id: cryptoId(),
      authorId: me.uid,
      authorName: me.name + (me.isCoach ? "（指導者）" : ""),
      text: comment.trim(),
      at: Date.now(),
    });
    setComment("");
    setSending(false);
  }

  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-slate-900">{video.title}</p>
          <p className="text-xs text-slate-400">
            {video.skillTag && <span className="chip mr-1 bg-brand-100 text-brand-700">{video.skillTag}</span>}
            {video.createdAt
              ? new Date(video.createdAt).toLocaleDateString("ja-JP")
              : ""}
          </p>
        </div>
        {canDelete && (
          <button
            onClick={() => {
              if (confirm("この動画を削除しますか？")) deleteVideo(video);
            }}
            className="text-xs text-slate-400 hover:text-red-500"
          >
            削除
          </button>
        )}
      </div>

      <video controls preload="metadata" src={video.url} className="w-full rounded-xl bg-black" />

      <div className="space-y-1.5">
        {(video.comments ?? [])
          .sort((a, b) => a.at - b.at)
          .map((c) => (
            <div key={c.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-600">{c.authorName}</p>
              <p className="text-sm text-slate-700">{c.text}</p>
            </div>
          ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          className="input flex-1"
          placeholder={me.isCoach ? "ワンポイントアドバイス" : "コメント"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button onClick={send} disabled={sending} className="btn-primary px-3 py-2 text-xs">
          送信
        </button>
      </div>
    </div>
  );
}
