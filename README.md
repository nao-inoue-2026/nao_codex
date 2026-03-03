# SaaS Approach List Builder (MVP)

Next.js(App Router) + TypeScript + Tailwind で作成した、企業向けアプローチリスト作成アプリです。

## セットアップ

```bash
npm install
npm run dev
```

## 機能

- 入力フォーム（company_name, raw_web_info, our_product など）
- サーバーサイド生成 API (`/api/generate`) と JSON/Zod 検証
- 生成結果カード表示 + コピーボタン
- 履歴保存 (`data/history.json`) と一覧・検索・詳細表示

## 補足

- `OPENAI_API_KEY` がある場合は OpenAI API を使用します。
- 未設定時はデモ用フォールバック生成を返します。
