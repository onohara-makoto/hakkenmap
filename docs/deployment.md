# デプロイ・キャッシュ運用

本番 https://hakkenmap.org の構成と、キャッシュ方針・更新手順・反映後の確認項目。
（構築手順そのものは EC2 構築時の手順書を参照。ここは運用時に必要な内容に絞る）

## 構成（2026-10-14 に公開レスポンスで確認）

```
ブラウザ ──HTTPS──▶ CloudFront（+ AWS WAF） ──HTTP──▶ EC2: Nginx 1.28 (Ubuntu) ──▶ Next.js 16 (next start / PM2 :3000)
                                                                     │
                                                                     ├─▶ Supabase（Auth / Postgres / Storage）
                                                                     └─▶ Gemini API（/api/identify のみ）
```

| 確認方法 | 結果 |
|---|---|
| `via` / `x-amz-cf-pop` ヘッダー | CloudFront 経由（NRT） |
| `server` ヘッダー | `nginx/1.28.3 (Ubuntu)` |
| `x-cache`（HTML・`/_next/static/*` とも） | `Miss from cloudfront` → 全パス CachingDisabled |
| `/_next/static/*` の `cache-control` | `public, max-age=31536000, immutable`（Next.js 既定） |
| 8,192 バイト超の POST | **CloudFront が 403 を返す**（下記「既知の問題」） |

ブラウザから Supabase へは直接通信する（写真のアップロードと署名付きURLの取得）。写真はこの経路を通らない。

## 既知の問題: WAF が 8KB を超える POST を拒否している

`POST /api/identify` に 8,000 バイトの本文を送るとアプリに届き、9,000 バイトでは CloudFront の
`403 ERROR – The request could not be satisfied` になる。AWS WAF のマネージドルール
`AWSManagedRulesCommonRuleSet` の `SizeRestrictions_BODY`（本文 8KB 上限）と一致する。
**このままだと実際の写真（数百KB〜数MB）でのAI識別は本番で必ず失敗する。**

対応案（クラウド設定の変更なので、実施前に影響を確認すること）:

1. WAF の Web ACL で `AWSManagedRulesCommonRuleSet` の `SizeRestrictions_BODY` を **Count** に上書きする
2. その代わりに、次のカスタムルールを Common Rule Set より前に追加する
   - パスが `/api/identify` **以外**で、本文が 8KB を超える → Block（他のパスは従来どおり）
   - パスが `/api/identify` で、本文が 9MB を超える → Block（アプリ側の上限 8MB + 余裕）
3. 確認: 2MB のダミー本文を `POST /api/identify` に送り、403 ではなくアプリの応答（未ログインなら 401）が返ること

あわせて Nginx の `client_max_body_size`（既定 1MB）も引き上げる:

```nginx
# /etc/nginx/sites-available/hakkenmap の server { } 内
client_max_body_size 10m;
```

アプリ側でも送信前に画像を長辺 1600px に縮小しているが、HEIC など縮小できない形式はそのまま送られる。

## キャッシュ方針

| パス | 中身 | 推奨 CloudFront 設定 | 理由 |
|---|---|---|---|
| `/_next/static/*` | JS・CSS・フォント（ファイル名にハッシュ） | **CachingOptimized**（オリジンの `immutable` を尊重） | 内容が変わればファイル名が変わるので無期限にキャッシュしてよい。デプロイ直後に旧ページを開いている利用者にも旧チャンクを配れる |
| 既定（HTML・RSC・`/api/*`・`/home/*`） | ログイン状態で変わるページ、API | **CachingDisabled**（現状のまま）+ AllViewer | Cookie によって中身が変わる。Next.js も `private, no-store` を返す |
| `/_next/image*` | 画像最適化 | CachingDisabled（現状のまま） | クエリに写真の署名付きURL（トークン）が入るため、エッジに置かない |
| `/demo/*.svg`, `/icons/*` | `public/` の静的ファイル | 現状のままでよい（変える場合は CachingOptimized + 下記の無効化） | ファイル名にハッシュがないので、差し替え時は無効化が必要 |

`/demo`・`/login` は静的生成されるが、Next.js が `max-age=0, must-revalidate` を返すため CDN では保持されない。
RSC のキャッシュキーには `_rsc` クエリが必要（[Next.js CDN Caching](https://nextjs.org/docs/app/guides/cdn-caching)）。
既定ビヘイビアを CachingDisabled にしている限り問題にならない。

### 設定変更の手順（`/_next/static/*` をキャッシュする場合）

1. CloudFront → 対象ディストリビューション → ビヘイビア → 「ビヘイビアを作成」
2. パスパターン `/_next/static/*`、オリジンは既存の EC2、ビューワープロトコル `Redirect HTTP to HTTPS`
3. キャッシュポリシー `CachingOptimized`、オリジンリクエストポリシーなし、許可メソッド `GET, HEAD`
4. 保存後、`curl -sI https://hakkenmap.org/_next/static/...js` を2回実行し、2回目が `x-cache: Hit from cloudfront` になることを確認

## 更新（デプロイ）手順

DB の変更を伴うリリースは **マイグレーション → アプリ** の順にする（このリリースの `photo_path` 列がそれに当たる）。

```bash
# 0. (必要なら) Supabase にマイグレーションを適用
#    SQL Editor で supabase/migrations/ の未適用ファイルを日付順に実行するか、
#    supabase link 済みなら: supabase db push

# 1. EC2
ssh hakkenmap
cd ~/hakkenmap
git pull
npm ci
npm run build          # 失敗したらここで止める（稼働中のプロセスはまだ旧ビルドで動いている）
pm2 restart hakkenmap

# 2. キャッシュの無効化
#    HTML は CachingDisabled、/_next/static はファイル名が変わるので通常は不要。
#    public/ のファイルを同じ名前で差し替えた場合だけ:
aws cloudfront create-invalidation --distribution-id <ID> --paths "/demo/*" "/icons/*"
```

`npm run build` は稼働中の `.next/` を上書きするため、再起動までの数十秒は旧ページの
遅延読み込みチャンクが 404 になることがある。`/_next/static/*` を CloudFront でキャッシュしておくと
エッジに残る旧チャンクで吸収できる。ダウンタイムをなくしたい場合はビルドを別ディレクトリで行い、
シンボリックリンクを切り替える。

## 反映後の確認項目

| # | 確認 | 期待結果 |
|---|---|---|
| 1 | `curl -s -o /dev/null -w "%{http_code}" -X POST https://hakkenmap.org/api/identify` | `401`（旧コードは 500） |
| 2 | 未ログインで https://hakkenmap.org/home | `/login` へリダイレクト |
| 3 | https://hakkenmap.org/demo をスマホ幅・PC幅で開く | 地図・14件の一覧・DEMO 表示。開発者ツールで `supabase.co` への通信がない |
| 4 | `/demo/log`, `/demo/demo-01`, `/demo/new` | 表示される。削除ボタンなし、保存ボタンは無効 |
| 5 | ログインして `/home` | 既存の記録と写真がすべて表示される（旧URLの記録も署名し直されて表示） |
| 6 | 写真を1枚記録 → 一覧 → 詳細 → 削除 | 成功。Supabase の Storage から該当ファイルも消えている |
| 7 | 写真で「AIで名前を調べる」 | 候補が出る（WAF 修正前は 403 で失敗する） |
| 8 | `pm2 logs hakkenmap --lines 50` | 起動エラーがない |
| 9 | Supabase → Advisors → Security | 新しい警告がない（`increment_identify_usage` の警告は想定内。docs/security.md 参照） |

## ロールバック

```bash
cd ~/hakkenmap && git checkout <前のコミット> && npm ci && npm run build && pm2 restart hakkenmap
```

`photo_path` マイグレーションは列の追加と値の補完だけで旧列 `photo_url` を残しているため、
アプリだけ戻しても旧コードは動く。ただし新コードで保存した記録は `photo_url` が空なので、
旧コードでは写真が表示されない（記録自体は残る。再度新コードに戻せば表示される）。
