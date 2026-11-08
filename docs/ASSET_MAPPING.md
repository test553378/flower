# 画像素材対応表（2026年11月8日）

## 画像一覧とデータの関係

相対パスは `public/assets/ohanayasan/` 以下。表示する名前・値段・本数は画像に埋め込まずゲーム側で描画してください。

| ID | 画面の名前 | 単価 | PNG相対パス |
|---|---|---:|---|
| `carnation_pink` | ピンクのカーネーション | 200えん | `flowers/carnation_pink.png` |
| `cosmos_purple` | むらさきのコスモス | 100えん | `flowers/cosmos_purple.png` |
| `gerbera_orange` | オレンジのガーベラ | 200えん | `flowers/gerbera_orange.png` |
| `gerbera_white` | しろのガーベラ | 200えん | `flowers/gerbera_white.png` |
| `marguerite_white` | しろのマーガレット | 100えん | `flowers/marguerite_white.png` |
| `rose_pink` | ピンクのバラ | 300えん | `flowers/rose_pink.png` |
| `rose_white` | しろのバラ | 300えん | `flowers/rose_white.png` |
| `sunflower_yellow` | きいろのひまわり | 200えん | `flowers/sunflower_yellow.png` |
| `tulip_red` | あかのチューリップ | 100えん | `flowers/tulip_red.png` |
| `tulip_yellow` | きいろのチューリップ | 100えん | `flowers/tulip_yellow.png` |

## ステージ別の確定在庫

| ステージ | 合計 | 組み合わせ（ID×本数） |
|---|---:|---|
| 1 | 10 | `tulip_red`×4、`rose_pink`×3、`sunflower_yellow`×3 |
| 2 | 12 | `tulip_red`×3、`rose_pink`×3、`sunflower_yellow`×3、`gerbera_white`×3 |
| 3 | 15 | `tulip_red`×3、`tulip_yellow`×2、`rose_pink`×3、`sunflower_yellow`×2、`gerbera_white`×2、`cosmos_purple`×3 |
| 4 | 18 | `tulip_red`×3、`rose_pink`×3、`rose_white`×2、`sunflower_yellow`×3、`gerbera_orange`×3、`cosmos_purple`×2、`marguerite_white`×2 |
| 5 | 20 | `tulip_red`×3、`rose_pink`×3、`rose_white`×2、`sunflower_yellow`×2、`gerbera_orange`×3、`cosmos_purple`×2、`marguerite_white`×2、`carnation_pink`×3 |

## キャラクター

- 店員：`characters/player/fullbody_welcome.png` と `characters/player/{smile,happy,trouble}.png`。全身イラストには花束が最初から描かれています。
- お客さん：女の子2人（`girl_orange`、`girl_blue`）、男の子2人（`boy_green`、`boy_glasses`）。各 `smile`、`happy`、`trouble`。

## ラッピング

- 包装紙：`wrapping/paper_{pink,lightblue,yellow,purple,green}.png`。
- リボン：`wrapping/ribbon_{red,pink,yellow,lightblue,purple}.png`。
- 完成見本：`bouquet_examples/*.png` は**装飾見本のみ**。完成花束の種類が任意であるため、実際の花は `flowers/*.png` を組み合わせて描画。

## 背景・補助イラスト

- タイトル：`backgrounds/title_storefront.png`
- 販売画面：`backgrounds/shop_interior.png`（専用生成の高解像度）
- ステージクリア：`backgrounds/stage_clear.png`
- 最終クリア：`backgrounds/final_clear.png`
- 自由制作：`backgrounds/free_mode.png`
- コレクション：`backgrounds/collection_soft.png`
- UI：`ui/*.png`。操作ボタンの文字は HTML/CSS で重ねる。
- 装飾：`effects/*.png`。

## 画像品質について

背景と店員の全身素材以外は、生成したコンタクトシートから個別に切り出した画像を主に利用しています。512×512 PNGにしてあっても元の描画解像度が512×512だったわけではありません。端の切れや小さな描画の乱れを実機で確認してください。

## 素材以外に必要なもの

- BGM・効果音の音源ファイル（今回のZIPには含めていません）。日本語音声はブラウザー内蔵読み上げ機能を利用。
- ゲーム本体のHTML/CSS/JS（Codexが実装）。
