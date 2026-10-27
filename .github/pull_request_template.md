## 概要

<!-- 何を・なぜ変更したか (1〜3行) -->

Closes #

## 変更内容

-

## 確認方法

- [ ] ローカルで動作確認した
- [ ] `npm run lint` / `npm run build` が通る
- [ ] UI変更はスクリーンショットを添付 (モバイル / デスクトップ)

---

## レビュー観点チェックリスト

### クラス設計 / コンポーネント設計

- [ ] 1つのコンポーネント・関数が1つの責務に収まっている
- [ ] 命名が役割を表している (既存の命名規則に沿っている)
- [ ] Props / 型が最小限で、`any` や不要な optional を増やしていない
- [ ] 重複ロジックを共通化した (または既存の共通処理を再利用した)
- [ ] 状態は必要な最小範囲に置いている (不要なグローバル / 親への持ち上げがない)
- [ ] Server Component / Client Component (`'use client'`) の切り分けが適切
- [ ] 今必要な問題だけを解いている (将来を見越した過剰設計・不要な抽象化がない)
- [ ] 他の人が素早く読める複雑さに収まっている (深いネスト・長い関数がない)
- [ ] 振る舞いの変更にテストを追加・更新した (壊れたら落ちるテストになっている)
- [ ] コメントは「何か」ではなく「なぜ」を書いている
- [ ] PRは1つの目的に絞った小さな単位になっている

### アーキテクチャ

- [ ] レイヤーの責務を守っている (UI / `app/lib` のデータアクセス / API Route)
- [ ] Supabase へのアクセスは既存の `lib` 経由で、画面から直接散らばらせていない
- [ ] 依存の向きが一方向で、循環参照がない
- [ ] エラー時の挙動を考慮した (失敗を「データなし」と混同しない / ローディング・空状態)
- [ ] DBスキーマ変更がある場合、`supabase/` にマイグレーションを含め、既存データへの影響を確認した
- [ ] パフォーマンス劣化がない (不要な再取得・再レンダリング・大きな画像の扱い)
- [ ] Next.js の仕様は `node_modules/next/dist/docs/` のガイドを確認した
- [ ] 認証・認可・DBアクセスは server-only の層 (Data Access Layer) に集約し、API Route / Server Action はそこを呼ぶ薄い層になっている
- [ ] クライアントへ返す値は必要なフィールドだけに絞っている (DBレコードをそのまま返さない)
- [ ] 全体設計に無理がない (この変更はこのコードベースに属するか、既存の仕組みで足りないか)

### セキュリティ

- [ ] 秘密情報 (APIキー・トークン・`.env*`) をコミットしていない
- [ ] `NEXT_PUBLIC_` に秘密情報を載せていない (サーバー専用キーはサーバー側のみ)
- [ ] API Route で認証・認可を確認している (ユーザー本人のデータのみ操作可能)
- [ ] 入力値 (フォーム / クエリ / アップロード) をサーバー側で検証している
- [ ] Supabase の RLS / Storage ポリシーで、他ユーザーのデータにアクセスできない
- [ ] アップロードファイルの種別・サイズを制限している
- [ ] 位置情報・写真など個人情報をログや外部サービスへ不用意に出していない
- [ ] 外部API (Gemini 等) 呼び出しにレート制限・エラーハンドリングがある
- [ ] `dangerouslySetInnerHTML` や未エスケープの出力を使っていない
- [ ] API Route / Server Action はページ側のチェックに頼らず、各エントリポイント内で認証を再確認している (直接リクエストされうる公開入口として扱う)
- [ ] リソースごとに所有者チェックをしている (IDOR対策: クライアントから受け取るIDだけで操作せず、本人確認はセッションから導く)
- [ ] 新規テーブルはRLSを有効化し、ポリシーを定義した (「全員許可」になっていない)
- [ ] Storageのポリシーはテーブルとは別に設定している (バケットが意図せず公開になっていない / ユーザー別フォルダで制限)
- [ ] `service_role` / secret キーはサーバー側のみで使い、クライアントへ渡していない
- [ ] マイグレーション後に Supabase の Security Advisor を確認した
- [ ] エラーメッセージやレスポンスに内部情報 (スタックトレース・SQL・キー) を含めていない
- [ ] ログに個人情報・トークン・位置情報の生データを残していない
- [ ] LLM (Gemini) への入力にユーザー入力を使う場合、プロンプトインジェクションを想定し、出力を検証してから使っている
- [ ] 追加した依存パッケージは必要最小限で、信頼できるもの (`npm audit` で重大な警告がない)
- [ ] 差分が既存のセキュリティ対策を弱めていない (検証・認可・設定の削除や緩和がない)

<!--
参考:
- OWASP Secure Code Review Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html
- OWASP LLM Prompt Injection Prevention: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
- Next.js Data Security: https://nextjs.org/docs/app/guides/data-security
- Supabase Production Checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Google Engineering Practices (What to look for): https://google.github.io/eng-practices/review/reviewer/looking-for.html
-->

## レビュワーへのメモ

<!-- 特に見てほしい点・懸念点・今回やらなかったこと -->
