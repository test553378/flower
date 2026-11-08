# おはなやさんゲーム — GitHubへ配置するための簡単セット

このZIPは、既存のGitHubリポジトリの一番上のフォルダへファイルを配置できる構成になっています。

## Windows 11での配置
1. ZIPを右クリック →「すべて展開」。
2. 展開後のフォルダを開く。中に `public`、`docs`、このREADMEがあることを確認。
3. GitHub Desktopでゲームのリポジトリを選び、`Repository` → `Show in Explorer` でWindows上のリポジトリフォルダを開く。
4. 展開した `public` と `docs` を、リポジトリの一番上にコピー。既存の同名フォルダがあればフォルダの結合を選び、既存ファイルの上書きは内容を確認する。
5. GitHub Desktopで変更されたファイルを確認し、Summaryに「Add flower shop game artwork and specs」と入力。`Commit to ...` → `Push origin` を実行。
6. GitHubサイトでリポジトリを開き、 `public/assets/ohanayasan/flowers/tulip_red.png` と `docs/CODEX_INSTRUCTIONS.md` が存在するか確認。
7. Codexに `docs/おはなやさんゲーム_要件定義書_Ver1.0.md` と `docs/CODEX_INSTRUCTIONS.md` に従いゲームを実装するよう伝える。未確定仕様は質問させる。

## 配置される内容
- `public/assets/ohanayasan/` : 個別PNG61点、`asset_manifest.json`、`preview.html`
- `docs/` : 要件定義書、組み込み指示、画像対応表、制作状況、品質レポート

## 注意
- ZIPをそのままGitHubへ1ファイルとして入れるのではなく、展開した `public`・`docs` の中身を配置する。
- GitHub上にリポジトリがあるだけでは、Windowsからフォルダとして開けない。GitHub Desktopでクローンする。
- 過去のCodex作業が進行中であれば、変更を反映するブランチを確認する。
- BGMと効果音の音声ファイルはこの素材セットに含まれない。
- 店員全身・店内背景は専用の高解像度素材。それ以外の一部は切り出し画像で画質の限界がある。
