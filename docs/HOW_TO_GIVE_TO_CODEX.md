# Codexへの渡し方（Windows 11向け）

## まずはZIPを展開
1. ダウンロードした `おはなやさんゲーム_Codex用画像素材一式_Ver1.1.zip` を右クリックし、**すべて展開**を選ぶ。
2. 展開先にできる `ohanayasan_assets` フォルダーを開く。中に `flowers`、`characters`、`wrapping`、`backgrounds` 等があることを確認。

## すでにGitHubリポジトリがある場合（推奨）
1. ゲームのGitHubリポジトリをWindows上で開く（VS Code、GitHub Desktop、またはGit管理のある作業フォルダー）。
2. リポジトリの `public/assets/ohanayasan/` を作成する（`public` が無ければ作る）。
3. 展開した `ohanayasan_assets/` 内の `characters/`、`flowers/`、`wrapping/`、`bouquet_examples/`、`backgrounds/`、`ui/`、`effects/` を `public/assets/ohanayasan/` にコピー。
4. 同じ場所へ `asset_manifest.json` をコピー。原画像の `sources/` はリポジトリに入れなくてもよい。
5. ZIP内 `CODEX_INSTRUCTIONS.md`、`ASSET_MAPPING.md`、`docs/おはなやさんゲーム_要件定義書_Ver1.0.md` はリポジトリの `docs/` フォルダーなどにコピーする。
6. GitHubに変更を **commit/push** する。ローカルフォルダーにコピーしただけではクラウド版Codexからは参照できない。
7. Codexで該当リポジトリを選び、次の文章を貼る。

> `docs/おはなやさんゲーム_要件定義書_Ver1.0.md` と `docs/CODEX_INSTRUCTIONS.md` に従って、`public/assets/ohanayasan/` の画像素材を初回版から使う「おはなやさん」Webゲームを作ってください。花・ラッピング素材は `asset_manifest.json` と `ASSET_MAPPING.md` を正として参照してください。まず未確定事項を洗い出し、ユーザー回答が必要な項目を質問してください。確定していない仕様を勝手に決めないでください。iPad第9世代 Safari 横向きでテストし、読み込み失敗画像や不足音源があれば一覧で報告してください。`

## まだリポジトリがない場合
1. GitHubで新しいリポジトリを作り、ローカルにcloneする。
2. 上の手順2〜7を行う。ZIPを渡すだけでCodexがGitHubに素材を保存できるとは限らない。

## 確認事項
- このZIPは**ゲーム用の画像素材集**です。実際のゲーム（HTML/CSS/JavaScript）やBGM/効果音そのものは含まれていません。
- 店員の全身立ち絵と販売店内背景は高解像度、その他の多くの切り出し素材は元画像の解像度が低く、品質確認が必要です。
- ゲーム仕様書には未確定事項（画面構成等）が残っているため、実装前に確認してください。
