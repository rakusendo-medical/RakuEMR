# サーバ監視ツール

会計システム（弥生会計ネットワーク版）サーバ群の監視ツール。市販監視ツールの置き換えとして、
必要な項目に絞って自作したもの。

**PowerShell 5.1（Windows Server 標準）とタスクスケジューラのみで動く。** PowerShell 7、.NET の
追加ランタイム、外部モジュール（PSWindowsUpdate / SqlServer 等）、sqlcmd はいずれも不要。

---

## 1. このツールの目的

詳細な情報を集めることではなく、**異常に気づけること**。

この環境では過去に、次のすべてが「誰も気づかないまま」進行していた。

| 事象 | 状態 | 対応する監視項目 |
| --- | --- | --- |
| Windows Update | 踏み台サーバで 7 年 4 か月未適用 | WU |
| Defender | リアルタイム保護が無効、定義更新が 1 年以上停止 | DEF |
| 時刻同期 | 一度も成功しておらず 2 台で 1 分 28 秒のずれ | NTP |
| トランザクションログ | mdf 23.9GB に対し ldf 368.8GB まで肥大 | LDF |
| RDS デバイス CAL | 20 本が枯渇し一部端末が接続不能 | CAL |
| バックアップ | 成功しているかどうかが不明 | BKP |

設計判断に迷ったときの基準は「**この異常が起きたとき、3 人のうち誰かが気づけるか**」。
機能の豊富さより、気づけることを優先している。

### 設計原則

1. **プッシュ通知が主、ダッシュボードは補助。** 画面は「見に行かないと気づけない」構造なので、異常は通知で飛ばす。
2. **正常時も日次サマリを 1 通送る。** 異常時のみ通知する設計では、ツール自体が停止しても気づけない。
   「今日も届いた＝監視は生きている」を成立させるため、**日次サマリを無効にしないこと**。
3. **読み取り専用。** サービス再起動などの自動復旧アクションは実装していない。
   誤判定で会計システムを止めるリスクが便益を上回るため。
4. **依存を最小化。** PowerShell 5.1 標準機能のみ。ダッシュボードも外部 CDN を参照しない。
5. **設定は外出し。** 閾値・通知先・対象名はすべて `config.json` にあり、スクリプト本体を編集する必要はない。

---

## 2. 監視対象と構成

| 対象 | 構成 | 監視する項目 |
| --- | --- | --- |
| 弥生サーバ | 物理サーバ（HPE ProLiant） | SVC / DSK / RES / BKP / DB / DEF / NTP / EVT / WU / HW |
| Hyper-V ホスト | 物理サーバ（HPE ProLiant） | SVC / DSK / RES / DEF / NTP / EVT / WU / VM / HW |
| 踏み台サーバ | Hyper-V ゲスト VM | SVC / DSK / RES / DEF / NTP / EVT / WU / CAL |

**ホスト OS を監視対象から外さないこと。** ホストが未パッチだとゲストが無事でも意味がない。

ゲスト VM にはハードウェア監視（HW）を適用しない。温度・ファン・電源はホスト側の iLO で取得する。

### 監視項目一覧

| ID | 項目 | 頻度 | 既定の閾値 |
| --- | --- | --- | --- |
| SVC | サービス稼働 | 15 分 | 必須サービスの停止で Critical |
| DSK | ディスク空き容量 | 1 時間 | 空き率 20% で警告 / 10% で危険（容量 GB との OR 判定） |
| RES | CPU / メモリ使用率 | 1 時間 | 通知しない（ダッシュボード表示用。設定で有効化可） |
| EVT | イベントログ | 1 時間 | System / Application の Error・Critical |
| HW | ハードウェア（iLO） | 1 時間 | 温度・ファン・電源・RAID・IML |
| BKP | バックアップ鮮度 | 日次 | 24 時間更新なしで警告 / 48 時間で危険 |
| DB | ldf / 復旧モデル / 照合順序 | 日次 | ldf が mdf の 2 倍で警告 / 3 倍で危険 |
| DEF | Defender | 日次 | 保護無効で危険 / 定義 3 日で警告・7 日で危険 |
| NTP | 時刻同期 | 日次 | Free-running で危険 / ずれ 5 秒で警告・30 秒で危険 |
| WU | Windows Update | 日次 | 30 日で警告 / 45 日で危険 |
| CAL | RDS デバイス CAL | 日次 | 残 20% で警告 / 残 10% または残 2 本未満で危険 |
| VM | Hyper-V | 日次 | VM 停止で危険 / チェックポイント残存で警告 |

### 判定レベル

| レベル | 意味 | 通知 |
| --- | --- | --- |
| `OK` | 正常 | しない |
| `Skipped` | 設定で対象外 | しない |
| `Warning` | 警告 | する |
| `Unknown` | **収集できなかった** | する |
| `Critical` | 危険 | する |

`Unknown` を `Warning` より重く扱っているのは意図的。「収集できていない」＝「異常に気づけない」状態であり、
このツールが最も避けたい事象だから。サーバに到達できない、iLO が応答しない、といった状況は
黙って通り過ぎさせない。

---

## 3. 導入手順

### 3-1. 前提

- 監視を実行するサーバに PowerShell 5.1 があること（Windows Server 2016 以降は標準）
- 監視専用のローカルアカウントを 1 つ用意すること（後述の理由で SYSTEM は避けるのが無難）

### 3-2. 配置

`monitoring` フォルダ一式を監視を実行するサーバへコピーする。例: `C:\Monitoring\`

配置後のフォルダ構成:

```
monitoring/
├── README.md                    このファイル
├── config.sample.json           設定サンプル（全項目に注釈あり）
├── config.json                  実際の設定（sample をコピーして作る。Git 管理外）
├── Install-Credentials.ps1      資格情報の暗号化登録
├── Register-Tasks.ps1           タスクスケジューラへの登録／解除
├── Invoke-Monitor.ps1           エントリポイント
├── modules/                     各チェックのモジュール
├── tests/                       Pester テスト
├── state/                       判定履歴・通知抑制の状態（実行時生成）
└── logs/                        ログ（実行時生成）
```

### 3-3. 設定ファイルの作成

```powershell
cd C:\Monitoring
Copy-Item .\config.sample.json .\config.json
notepad .\config.json
```

`config.sample.json` は **全項目に注釈が付いている**。`"__"` で始まるキーが注釈で、
読込時に自動で除去されるため、残しても消しても動作は変わらない。

**保存時は必ず「UTF-8（BOM 付き）」を選ぶこと。** BOM が無いと PowerShell 5.1 が
日本語（パス・サービス名・通知文言）を文字化けさせる。メモ帳なら「名前を付けて保存」の
エンコード欄で `UTF-8 (BOM付き)` を選択する。

最低限、埋めるのは次の項目。

| 場所 | 内容 |
| --- | --- |
| `targets[].address` | 各サーバの IP アドレス（内部 DNS が無いため IP 推奨） |
| `targets[].checks.service.required` | 弥生関連の正確なサービス名（`services.msc` で確認） |
| `targets[].checks.backup.paths[].path` | 弥生バックアップの出力先 |
| `targets[].checks.database.serverInstance` | SQL Server の接続先（例 `.\YAYOI`） |
| `targets[].hardware.address` | iLO の IP アドレス |
| `notification.smtp` または `notification.backlog` | 通知先 |
| `dashboard.outputPath` | ダッシュボード HTML の出力先共有パス |

### 3-4. 資格情報の登録

**パスワードや API キーを設定ファイルやスクリプトに書かないこと。** 専用スクリプトで暗号化して保存する。

```powershell
# iLO
.\Install-Credentials.ps1 -Name ilo-yayoi  -UserName Administrator
.\Install-Credentials.ps1 -Name ilo-hvhost -UserName Administrator

# リモート収集用（ワークグループのため各サーバのローカル管理者）
.\Install-Credentials.ps1 -Name hv-host-admin -UserName Administrator
.\Install-Credentials.ps1 -Name bastion-admin -UserName Administrator

# SMTP 認証を使う場合
.\Install-Credentials.ps1 -Name smtp -UserName monitor@example.local

# Backlog を使う場合（ユーザー名不要。API キーのみ）
.\Install-Credentials.ps1 -Name backlog

# 確認
.\Install-Credentials.ps1 -List
```

> ### ⚠ 重要：暗号化文字列は「実行アカウント」と「実行マシン」に紐づく
>
> 暗号化には DPAPI（`ConvertFrom-SecureString`）を使っている。作成した暗号化文字列は
> **作成したアカウントで、作成したマシン上でしか復号できない。**
>
> したがって:
>
> - `Install-Credentials.ps1` は、**タスクスケジューラで監視を実行するアカウントで実行する**
> - **監視を動かすサーバ上で実行する**（別 PC で作ったものを持ち込んでも復号できない）
> - サーバを入れ替えたら、資格情報は登録し直す
> - 実行アカウントを変えたら、資格情報は登録し直す
>
> 「昨日まで動いていた iLO 監視が Unknown になった」というときは、まずこれを疑う。
> 次のコマンドで、現在のアカウントで復号できるかを確認できる。
>
> ```powershell
> .\Install-Credentials.ps1 -Name ilo-yayoi -Test
> ```

管理者アカウントで登録作業をしてから、別アカウントでタスクを動かす場合は、
そのアカウントでログオンして登録し直すか、`runas` で実行する。

```powershell
runas /user:.\svc-monitor "powershell.exe -NoProfile -File C:\Monitoring\Install-Credentials.ps1 -Name ilo-yayoi -UserName Administrator"
```

### 3-5. ワークグループ環境でのリモート収集の準備

ドメイン非参加のため、リモート収集には WinRM の設定が必要になる。
**収集サーバ側**で、リモート先を TrustedHosts に追加する。

```powershell
# 収集サーバ側（IP で指定する。内部 DNS が無いためホスト名は使わない）
Enable-PSRemoting -Force
Set-Item WSMan:\localhost\Client\TrustedHosts -Value '192.168.252.211,192.168.252.212' -Force
Get-Item WSMan:\localhost\Client\TrustedHosts
```

```powershell
# 監視される側（Hyper-V ホスト・踏み台）それぞれで
Enable-PSRemoting -Force
```

接続確認:

```powershell
$cred = Get-Credential   # 監視される側のローカル管理者
Invoke-Command -ComputerName 192.168.252.211 -Credential $cred -ScriptBlock { $env:COMPUTERNAME }
```

**リモート収集を使わない構成も選べる。** 各サーバに監視ツールを個別に配置し、それぞれ自分自身だけを
`mode: "local"` で監視する方法。WinRM の設定が不要で確実だが、日次サマリがサーバの台数分届く。
本ツールはどちらの構成でも動く。

### 3-6. 動作確認（タスク登録の前に）

```powershell
# 収集だけ試す（通知もダッシュボードも出さない）
.\Invoke-Monitor.ps1 -Cycle All -SkipNotification -SkipDashboard -Verbose

# 特定の対象・項目だけ試す
.\Invoke-Monitor.ps1 -Cycle All -TargetName YAYOI-SV -Only SVC,DSK -SkipNotification

# 通知を実際に飛ばす（まずここで届くことを確認する）
.\Invoke-Monitor.ps1 -Cycle All -SendSummary
```

ログは `logs\monitor-YYYYMMDD.log` に出る。

### 3-7. タスクスケジューラへの登録

```powershell
.\Register-Tasks.ps1 -Action Register -TaskUser '.\svc-monitor' -DailyAt 08:00

# 登録状況の確認
.\Register-Tasks.ps1 -Action Show

# 解除
.\Register-Tasks.ps1 -Action Unregister
```

登録されるタスクは 3 つ。

| タスク名 | 間隔 | 実行内容 |
| --- | --- | --- |
| `RakuEMR Monitor - Fast` | 15 分 | SVC |
| `RakuEMR Monitor - Hourly` | 1 時間 | DSK / RES / EVT / HW |
| `RakuEMR Monitor - Daily` | 日次（既定 08:00） | 全項目 + 日次サマリ送信 |

日次の時刻は、運用者が出勤して確認できる時刻に合わせること。

> **実行アカウントについて**
>
> `-TaskUser` を省略すると SYSTEM で登録されるが、SYSTEM は**ネットワーク越しの認証ができない**。
> リモート収集や共有フォルダへのダッシュボード出力を行う場合は、専用のローカルアカウントを指定する。
>
> 既定では S4U ログオン（パスワードを保存しない方式）で登録する。この方式ではネットワークリソースに
> アクセスできないため、リモート収集や共有フォルダ出力を使う場合は、登録後にタスクスケジューラの GUI で
> 該当タスクのプロパティを開き、「パスワードを保存して実行する」に切り替える必要がある。
>
> 手順: タスクスケジューラ → `\RakuEMR\` → タスクを右クリック → プロパティ →
> 「ユーザーがログオンしているかどうかにかかわらず実行する」を選択 → OK → パスワードを入力

---

## 4. 通知

### 経路の切り替え

`config.json` の `notification.channel` で切り替える。

| 値 | 動作 |
| --- | --- |
| `smtp` | メールで送る。異常はまとめて 1 通 |
| `backlog` | Backlog に課題として起票する。継続・解消は同じ課題へのコメント |
| `none` | 送らない（試験用） |

**Backlog を選ぶと対応履歴が課題に残る**ため、運用上は有利。アラート 1 件につき課題 1 件を起票し、
継続中の再通知と解消通知は同じ課題へのコメントとして追記される。1 つの事象の経緯が 1 か所にまとまる。

Backlog の `issueTypeId` は API で確認する。

```powershell
$apiKey = Read-Host '(Backlog の API キー)'
Invoke-RestMethod "https://example.backlog.jp/api/v2/projects/INFRA/issueTypes?apiKey=$apiKey" |
    Select-Object id, name
```

### 再通知の抑制

同じ異常が継続している間、通知は既定 6 時間間隔に抑える（`notification.renotifyIntervalHours`）。
フラッピングによる通知の洪水を防ぐため。

ただし**深刻度が上がったときは、抑制間隔を待たずに即座に通知する。**
（例: ディスクが Warning から Critical になった場合）

### 解消通知

異常が解消すると「解消しました」を通知する（`notification.notifyOnResolve`）。

**解消判定は「今回きちんと判定できた項目」に限っている。** サーバに到達できず収集に失敗した場合、
その項目のアラートは解消扱いにせず持ち越す。到達できないだけなのに「解消しました」と通知するのが
最悪の誤報だから。

### 日次サマリ

全項目の判定結果一覧を 1 通送る。**異常がゼロでも送る。**

これは「今日も届いた＝監視は生きている」を成立させるための仕組み。
異常時のみ通知する設計だと、ツール自体が止まったときに誰も気づけない。

**`notification.dailySummary.enabled` を `false` にしないこと。** 無効化すると、この安全装置が失われる。

---

## 5. ダッシュボード

`dashboard.outputPath` に単一の HTML ファイルを出力する。共有フォルダに置いてブラウザで開く。

- 外部 CDN を一切参照しない（CSS は埋め込み、グラフは SVG / CSS で自前描画）
- `dashboard.refreshSeconds` 秒ごとに自動リロード
- 信号色（緑 / 黄 / 赤）で状態を表示。`Unknown`（紫）と `Skipped`（灰）も区別する
- 履歴は `state\history.json` に直近 7 日分を保持（DB は使わない）

**ダッシュボードは補助である。** これがあることを理由に通知を軽視しないこと。
画面が更新されていない場合、監視ツール自体が停止している可能性がある。

---

## 6. 実機での確認手順

導入後、**各チェックが実際に通知を飛ばすことを一度は確認する。** 動かない監視は無いのと同じ。

確認中は再通知抑制が効くので、繰り返し試すときは通知状態をリセットする。

```powershell
Remove-Item .\state\notifications.json -ErrorAction SilentlyContinue
```

### 6-1. SVC：サービスを停止して通知されるか

```powershell
# 業務時間外に、影響の小さいサービスで試す
Stop-Service -Name SQLBrowser
.\Invoke-Monitor.ps1 -Cycle Fast
# → 通知が届くことを確認

Start-Service -Name SQLBrowser
.\Invoke-Monitor.ps1 -Cycle Fast
# → 「解消しました」が届くことを確認
```

`MSSQL$YAYOI` のような業務に直結するサービスでは試さないこと。

### 6-2. BKP：バックアップの日時を過去にして通知されるか

```powershell
# バックアップフォルダのコピーを作り、そこを一時的に監視対象にする方が安全
$target = 'D:\Backup\弥生\backup_test.zip'
(Get-Item -LiteralPath $target).LastWriteTime = (Get-Date).AddDays(-3)

.\Invoke-Monitor.ps1 -Cycle Daily -Only BKP -TargetName YAYOI-SV
# → 「バックアップが更新されていません」が Critical で届くことを確認
```

フォルダごと存在しない場合の確認（`config.json` のパスを一時的に誤った値にする）:

```powershell
# path を "D:\Backup\存在しないフォルダ" にして実行
.\Invoke-Monitor.ps1 -Cycle Daily -Only BKP
# → 「バックアップ出力先が存在しません」が Critical で届くことを確認
```

### 6-3. DSK：閾値を一時的に下げて通知されるか

```powershell
# config.json の warningFreePercent を 99、criticalFreePercent を 95 に変更
.\Invoke-Monitor.ps1 -Cycle Hourly -Only DSK
# → 全ボリュームが Critical で届くことを確認
# 確認後、閾値を元に戻して再実行し、「解消しました」が届くことを確認
```

### 6-4. HW：iLO の IP を誤った値にして、ハードウェア監視のみスキップされるか

```powershell
# config.json の targets[].hardware.address を "192.0.2.1"（到達しない IP）に変更
.\Invoke-Monitor.ps1 -Cycle All

# 確認すること:
#   1. HW が Unknown になり「iLO に接続できません」と通知されること
#   2. SVC / DSK / BKP など他の項目は正常に判定され続けていること
#   3. スクリプト全体がエラー終了していないこと（exit code が 0）
$LASTEXITCODE
```

ログでも確認できる。

```powershell
Get-Content .\logs\monitor-*.log -Tail 30 -Encoding UTF8
```

### 6-5. DB：復旧モデル・照合順序の相違が検出されるか

実際に変更するのは危険なので、**期待値の側を変えて検出ロジックを確認する。**

```powershell
# config.json の expectedRecoveryModel を "FULL" に変更（実際は SIMPLE のはず）
.\Invoke-Monitor.ps1 -Cycle Daily -Only DB
# → 「復旧モデルが想定と異なります」が届くことを確認
# 確認後、必ず "SIMPLE" に戻す
```

### 6-6. NTP：時刻同期の状態が正しく取れるか

```powershell
w32tm /query /source
w32tm /query /status
w32tm /stripchart /computer:ntp.nict.jp /samples:1 /dataonly

.\Invoke-Monitor.ps1 -Cycle Daily -Only NTP
# → 上記コマンドの結果と、通知／ログに出る値が一致することを確認
```

### 6-7. 日次サマリが正常時にも届くか

**これが最も重要な確認。** 異常がゼロの状態で実行する。

```powershell
.\Invoke-Monitor.ps1 -Cycle All -SendSummary
```

確認すること:

- 異常が 1 件も無くてもメール（または Backlog 課題）が届くこと
- 本文に全サーバ・全チェックの判定結果一覧が載っていること
- 「未解消の異常 (0 件) / なし」と表示されていること

タスク登録後は、翌朝に実際に届くことを確認する。
**届かなくなったら、それ自体が異常。** サーバではなく監視ツールを疑う。

### 6-8. ダッシュボードが生成されるか

```powershell
.\Invoke-Monitor.ps1 -Cycle All -SkipNotification
Invoke-Item (Get-Content .\config.json -Raw -Encoding UTF8 | ConvertFrom-Json).dashboard.outputPath
```

確認すること:

- 8 つのブロック（サマリ / ハードウェア / リソース / データベース / バックアップ / ライセンス / 保守状態 / 直近アラート）が表示される
- インターネットに接続していない端末でも表示が崩れないこと（外部 CDN を参照していないことの確認）
- 自動リロードされること

---

## 7. トラブル対応

### 通知が届かない

1. `logs\monitor-*.log` に `[notify]` の行があるか確認する

   ```powershell
   Select-String -Path .\logs\monitor-*.log -Pattern '\[notify\]' -Encoding UTF8 | Select-Object -Last 20
   ```

2. `notification.enabled` が `true` か、`channel` が正しいかを確認する
3. 抑制されているだけかもしれない。`state\notifications.json` の `lastNotifiedOn` を見る
4. SMTP に手動で疎通するか確認する

   ```powershell
   Test-NetConnection -ComputerName 192.168.252.250 -Port 25
   ```

5. 認証を使う場合、資格情報が復号できるか確認する

   ```powershell
   .\Install-Credentials.ps1 -Name smtp -Test
   ```

### 日次サマリが届かなくなった

**監視ツール自体が止まっている可能性が高い。** サーバの異常より先にこちらを疑う。

```powershell
# タスクの前回実行結果を見る（0 以外は失敗）
.\Register-Tasks.ps1 -Action Show

# 直近のログを見る
Get-Content .\logs\monitor-*.log -Tail 50 -Encoding UTF8

# 手動で動かしてみる
.\Invoke-Monitor.ps1 -Cycle All -SendSummary -Verbose
```

タスクが「実行されていません」になっている場合は、実行アカウントのパスワード変更や
アカウントのロックを疑う。

### すべての項目が Unknown になる

対象サーバに到達できていない。

```powershell
Test-NetConnection -ComputerName 192.168.252.211 -Port 5985

# TrustedHosts の設定を確認
Get-Item WSMan:\localhost\Client\TrustedHosts

# 資格情報が復号できるか
.\Install-Credentials.ps1 -Name hv-host-admin -Test
```

`-Test` で「復号できません」と出る場合は、3-4 の警告を読み直すこと。
実行アカウントかマシンが登録時と変わっている。

### ハードウェア（HW）だけ Unknown になる

1. iLO に到達できるか

   ```powershell
   Test-NetConnection -ComputerName 192.168.252.220 -Port 443
   ```

2. 証明書エラーの可能性。iLO が自己署名証明書を使っている場合は
   `hardware.skipCertificateCheck` を `true` にする
3. Redfish のエンドポイントが機種と合っていない可能性。ブラウザで直接開いて確認する

   ```
   https://192.168.252.220/redfish/v1/Systems/1
   https://192.168.252.220/redfish/v1/Chassis/1/Thermal
   ```

   応答が返らないパスがあれば、`hardware.endpoints` を実機に合わせて修正する。
   不要なエンドポイントは空文字（`""`）にすればスキップされる。

4. iLO のアカウントに Redfish の参照権限があるか確認する

なお **HW が取れなくても他の監視は継続する。** 他の項目まで止まっていたら別の原因。

### 日本語が文字化けする

ファイルが UTF-8 BOM 付きで保存されていない。特に `config.json` を編集したときに起こりやすい。

```powershell
# BOM の有無を確認（EF BB BF で始まっていれば OK）
Format-Hex .\config.json | Select-Object -First 1
```

BOM 付きで保存し直す。

```powershell
$content = Get-Content .\config.json -Raw -Encoding UTF8
[System.IO.File]::WriteAllText(
    (Resolve-Path .\config.json),
    $content,
    (New-Object System.Text.UTF8Encoding($true)))
```

### 誤検知が多い項目がある

閾値の調整はすべて `config.json` で完結する。スクリプトは編集しない。

イベントログの既知の警告は `checks.eventLog.ignore` に追加する。
**除外には必ず `reason` を書くこと。** 理由の無い除外は、後から誰も妥当性を判断できなくなる。

```json
{
  "eventId": 10016,
  "logName": "System",
  "providerName": null,
  "reason": "DCOM 権限の既知の警告。2026-08-17 に業務影響なしと確認済み（担当: ○○）"
}
```

### 状態をリセットしたい

```powershell
# 通知の抑制状態（初回検知・最終通知時刻）をリセット
Remove-Item .\state\notifications.json

# 履歴（ダッシュボードのグラフ）をリセット
Remove-Item .\state\history.json

# 直近の判定結果をリセット
Remove-Item .\state\last-results.json
```

`state` フォルダを消しても設定と資格情報以外は失われない。
ただし **`state\credentials` を消すと資格情報も消える**ので注意。

---

## 8. 変更の加え方

### 閾値を変える

`config.json` のみ。スクリプトは編集しない。変更後は手動実行で確認する。

```powershell
.\Invoke-Monitor.ps1 -Cycle All -SkipNotification -Verbose
```

### 監視項目を追加する

1. `modules\Check-<名前>.psm1` を作る。既存モジュールと同じ 3 層構成にする
   - `Get-<名前>Finding` … **判定ロジック。外部依存を持たない純粋関数**（テスト可能にするため）
   - `Get-<名前>Data` … 収集。`Invoke-MonitorScriptBlock` でローカル / リモートを吸収する
   - `Invoke-<名前>Check` … 上記 2 つを繋ぎ、`New-CheckResult` を返す
2. `Invoke-Monitor.ps1` の `$checkRegistry` に 1 行追加する
3. `config.sample.json` に設定と注釈を追加する
4. `tests\` に判定ロジックのテストを追加する
5. `tests\Quality.Tests.ps1` の必須ファイル一覧に追加する

**検知キー（`New-CheckFinding -Key`）に測定値や時刻を含めないこと。**
再通知抑制と解消判定はキーの同一性で成立しているため、実行のたびに変わる値を含めると
毎回「新しい異常」として通知され続ける。

### テストの実行

```powershell
# Pester 5 が必要（初回のみ）
Install-Module Pester -MinimumVersion 5.0 -Scope CurrentUser -Force -SkipPublisherCheck

Invoke-Pester -Path .\tests
```

`tests\Quality.Tests.ps1` は成果物そのものを検証する。

- 全スクリプトの構文検証
- PowerShell 7.x 専用の構文・コマンドレット引数を使っていないこと
- 外部モジュール（PSWindowsUpdate / Invoke-Sqlcmd 等）に依存していないこと
- 日本語を含むファイルが UTF-8 BOM 付きであること
- 認証情報を平文で埋め込んでいないこと
- PSScriptAnalyzer の指摘が無いこと（未導入環境ではスキップ）

静的解析を単体で実行する場合:

```powershell
Install-Module PSScriptAnalyzer -Scope CurrentUser -Force
Invoke-ScriptAnalyzer -Path . -Recurse -Settings .\PSScriptAnalyzerSettings.psd1
```

---

## 9. 実装していないこと

意図的に実装していない。追加を検討する際は理由を踏まえること。

| 項目 | 理由 |
| --- | --- |
| Windows サービスとしての常駐 | タスクスケジューラで十分。障害切り分けが複雑になる |
| 自動復旧アクション（サービス再起動等） | 誤判定で会計システムを止めるリスクが便益を上回る |
| エージェントの相互監視・クラスタ構成 | 3 台規模には過剰 |
| 外部 SaaS 連携 | 外向き通信に制限がある。オンプレで完結させる |
| データベース（SQLite 等）への履歴保存 | JSON / CSV で足りる。依存を増やさない |
| 認証情報の平文保存 | 禁止 |
| Windows Update の未適用件数のオンライン照会 | 外向き通信の制限で実行が長時間ブロックされうる。最終適用日のみ見る |

---

## 10. コマンド早見表

```powershell
# 全項目を実行（通知あり・日次サマリあり）
.\Invoke-Monitor.ps1 -Cycle All -SendSummary

# 収集だけ確認（通知・ダッシュボードなし）
.\Invoke-Monitor.ps1 -Cycle All -SkipNotification -SkipDashboard -Verbose

# 特定の項目・対象だけ
.\Invoke-Monitor.ps1 -Cycle All -Only BKP,DB -TargetName YAYOI-SV

# 資格情報
.\Install-Credentials.ps1 -Name <名前> -UserName <ユーザー>   # 登録
.\Install-Credentials.ps1 -List                               # 一覧
.\Install-Credentials.ps1 -Name <名前> -Test                  # 復号確認
.\Install-Credentials.ps1 -Name <名前> -Remove                # 削除

# タスク
.\Register-Tasks.ps1 -Action Register -TaskUser '.\svc-monitor' -DailyAt 08:00
.\Register-Tasks.ps1 -Action Show
.\Register-Tasks.ps1 -Action Unregister

# ログ
Get-Content .\logs\monitor-*.log -Tail 50 -Encoding UTF8

# テスト
Invoke-Pester -Path .\tests
```
