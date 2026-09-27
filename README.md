# 心の天気予報 PWA — GitHub Pages 配置用

このフォルダの**中身をそのまま GitHub リポジトリ直下へコピー**してください。

```text
リポジトリ直下/
├─ index.html
├─ manifest.webmanifest
├─ sw.js
├─ .nojekyll
└─ icons/
   ├─ icon-192.png
   ├─ icon-512.png
   ├─ icon-maskable-512.png
   ├─ apple-touch-icon.png
   ├─ favicon-32.png
   └─ favicon-16.png
```

## GitHub Pages

1. 上記ファイルをリポジトリ直下へ置いて commit / push
2. GitHub の `Settings` → `Pages`
3. `Deploy from a branch` を選び、公開するブランチと `/ (root)` を指定
4. 公開された HTTPS URL を開く

`index.html` 内の PWA 関連パスは相対パスなので、`https://ユーザー名.github.io/リポジトリ名/` のようなプロジェクト Pages でも利用できます。

## 実装済み

- PWA マニフェスト
- Service Worker / オフラインキャッシュ
- 192px / 512px PWA アイコン
- maskable アイコン
- Apple Touch Icon
- 16px / 32px favicon
- `⚙ 連動設定` 横の `⚙ ダウンロード`
- 期間指定による JSON / CSV ダウンロード
- `moodLog` の記録を直近1年分だけ保持

## データについて

既存の保存キー `moodLog` を維持しています。ただし `localStorage` は配信元ごとに別管理なので、ローカルHTMLから GitHub Pages へ公開先を変えた場合、既存記録は自動移行されません。
