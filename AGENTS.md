　<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 実装ワークフロー

機能追加・バグ修正など、コード変更を伴う作業はこの流れで進める。typo 修正などの小さな変更は省略してよい。

## エージェント構成

| エージェント | 役割 | コード変更 | 指示書 |
|---|---|---|---|
| メイン | 進行管理・ユーザーとのやりとり・コミット/PR | — | このファイル |
| planner | 設計計画 | しない (計画ファイルのみ書く) | `.agents/roles/planner.md` |
| implementer | 実装 | する | `.agents/roles/implementer.md` |
| verifier | lint / build / 動作確認 | しない | `.agents/roles/verifier.md` |
| reviewer | 設計・アーキテクチャ・セキュリティのレビュー | しない | `.agents/roles/reviewer.md` |

- 指示書の本体は `.agents/roles/` にある。Claude 用 (`.claude/agents/`) と Codex 用 (`.codex/agents/`) の定義は、そこを読ませるだけの薄いラッパー
- 役割を変えるときは `.agents/roles/` だけを編集する
- サブエージェントを使えない環境では、メインエージェントが各指示書を読んで順に実行する

## ループ

```
planner ──▶ (ユーザー確認) ──▶ implementer ──▶ verifier ──▶ reviewer
                                  ▲                │ NG          │ REQUEST_CHANGES
                                  └────────────────┴─────────────┘
                                         (最大3周)
```

1. **計画**: planner に issue / 要件を渡す。計画は `.claude/_docs/plans/` に保存される
2. **確認**: ユーザー確認事項があれば、メインがユーザーに聞く。方針が大きい場合も確認を取ってから実装へ進む
3. **実装**: implementer に計画ファイルを渡す
4. **検証**: verifier が lint / build / 動作確認。NG なら結果を implementer に戻す
5. **レビュー**: reviewer が差分をレビュー。`must` があれば指摘を implementer に戻す
6. **ループ上限**: 3周しても解消しない場合は止めて、残った問題をユーザーに報告する
7. **完了**: メインが結果をまとめる。コミット・PR 作成はユーザーの指示があってから行い、PR 本文は `.github/pull_request_template.md` に沿って書く。`should` / `nit` で見送ったものは PR の「レビュワーへのメモ」に残す

## メインエージェントのルール

- 各サブエージェントには、必要な入力 (計画ファイルのパス、前回の指摘) を明示して渡す
- サブエージェントの報告は鵜呑みにせず、差分や実行結果で確認してからユーザーに伝える
- 作業内容は `.claude/_docs/worklog/` に記録する

## 呼び出し方

- **Claude Code**: `planner` / `implementer` / `verifier` / `reviewer` サブエージェントを名前で呼ぶ
- **Codex**: カスタムエージェントは自動では使われないため、プロンプトで名前を指定して起動する (例: 「planner エージェントで #19 の計画を立てて」)
