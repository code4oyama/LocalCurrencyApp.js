# 地域通貨決済アプリ

Capacitor + バニラ JavaScript で構成した、地域通貨の送金・受取アプリです。  
QRコードを表示/スキャンして送金・受取を行います。

## LETS（Local Exchange Trading System）とは

LETS は、地域の参加者どうしが「相互の信用」をもとに取引を行う地域通貨の仕組みです。  
法定通貨の現金を直接やり取りしなくても、地域内で提供した価値（サービス・モノなど）を記録し、
必要なときに別の参加者から価値を受け取れるようにすることを目的としています。

### 仕組み

- 参加者ごとに取引記録（台帳）を持つ
- 取引時に「渡した側はプラス」「受け取った側はマイナス」として残高を更新する
- 単なる二者間の物々交換ではなく、ネットワーク全体で価値を循環させる
- 通常は地域内で使える範囲やルール（上限・用途など）を決めて運用する

このアプリでは、上記の考え方を学習・体験しやすい形にして、QRコードで送金/受取を記録します。

### 概要

LETS の狙いは、地域内の助け合いを可視化し、資源やスキルの循環を促進することです。  
一般的なポイント制度と異なり、参加者間の取引そのものを中心に設計される点が特徴です。

### 歴史

LETS は 1980 年代前半、カナダのマイケル・リントン（Michael Linton）による実践が広く知られています。  
その後、英国・豪州・欧州などに考え方が広がり、地域経済の補完手段としてさまざまな形で運用されてきました。  
近年は、紙の台帳や手書き記録に加え、デジタル台帳やモバイルアプリを使った地域通貨の試みも増えています。

## 機能

- 残高表示
- 取引履歴表示
- 送金QRを表示（相手がスキャンして受取）
- 受取QRを表示（相手がスキャンして送金）
- QRスキャンによる送金/受取（ネイティブ時は ML Kit を利用）
- QR画像の保存

## 技術スタック

- Capacitor
- バニラ JavaScript
- HTML / CSS
- QRCode（CDN読み込み）
- `@capacitor-mlkit/barcode-scanning`

## セットアップ

```bash
npm install
```

## Webで起動

```bash
npm run dev
```

`http://localhost:5173` を開いて動作確認します。

## iOS / Android での実行

```bash
npx cap add ios
npx cap add android
npm run cap:sync
npm run cap:open:ios
npm run cap:open:android
```

## 画面

- ホーム: 残高・履歴
- 送金: 送金QRの作成・保存
- 受取: 受取QRの作成・保存
- スキャン: カメラスキャン/手動入力

## 注意

- 初期残高は `10000 LC` です。
- データは `localStorage` に保存されます。
- 実運用向けの署名検証・改ざん対策・サーバー連携は未実装です。

## 画面ScreenShot

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin: 1.5em 0;">
  <img src="https://github.com/user-attachments/assets/f94db71c-e6d4-4b81-b5f8-52701a2bfa74" alt="ss1" style="width:25%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
  <img src="https://github.com/user-attachments/assets/25742523-12a9-4383-822b-de91d9239e9f" alt="ss2" style="width:25%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
  <img src="https://github.com/user-attachments/assets/df97411c-0251-4cf9-9afc-1af572acd07e" alt="ss3" style="width:25%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
  <img src="https://github.com/user-attachments/assets/8c6f4010-5726-4f9a-81b4-16e6203ade6e" alt="ss4" style="width:25%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
</div>
