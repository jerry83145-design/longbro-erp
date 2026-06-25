# LINE Bot 串接規格

## 目標

LINE Bot 只做隆博ERP的手機前端，不直接產生正式帳。

使用者在 LINE 點選「新增支出」或「新增收入」後，打開一個手機版表單。表單欄位、下拉選單與 ERP 共用同一份雲端設定，送出後先進入 ERP 的「待處理事項」，由使用者確認後才正式入帳。

## 使用方式

### 主要流程

1. 使用者在 LINE 選單點「新增支出」或「新增收入」。
2. LINE 開啟手機版表單：`liff.html`。
3. 使用者用下拉選單與輸入框完成資料。
4. 送出後建立一筆 `lineDrafts` 草稿。
5. ERP 的「待處理事項」顯示 LINE 草稿。
6. 使用者確認後，才轉成正式收入或支出。

## 手機版表單欄位

### 支出

- 日期
- 金額
- 交易對象
- 項目 / 摘要
- 金流方式
- 支出帳戶
- 大類
- 中類
- 細項
- 預計付款日
- Google Drive 憑證連結
- 備註

### 收入

- 日期
- 金額
- 交易對象
- 項目 / 摘要
- 金流方式
- 收款帳戶
- 大類
- 中類
- 細項
- 預計收款日
- Google Drive 憑證連結
- 備註

## 下拉選單同步規則

手機版表單會讀取 Firestore：

```text
systemSettings / options
```

因此 ERP 裡新增的交易對象、金流方式、帳戶、大類、中類、細項，手機版表單也會同步看到。

如果手機版表單新增選項，也會寫回同一份設定，之後 ERP 也能看到。

## 草稿資料格式

手機版表單送出後，寫入 Firestore：

```text
lineDrafts
```

每筆草稿至少包含：

- `type`：`expense` 或 `income`
- `date`：交易日期
- `amount`：金額
- `counterparty`：交易對象
- `item`：項目 / 摘要
- `cashflow`：金流方式
- `account`：收付款帳戶
- `major`：大類
- `middle`：中類
- `minor`：細項
- `dueDate`：預計收付款日
- `voucherLinks`：Google Drive 憑證連結
- `note`：備註
- `status`：預設 `draft`
- `needsReview`：預設 `true`
- `source`：`line-liff`

## 目前版本

目前已先做出手機版表單原型：

```text
liff.html
```

本機測試網址：

```text
file:///C:/Users/Ray/Documents/%E6%9C%83%E8%A8%88/Codex%20projects/my-new-business/accounting-web/liff.html
```

正式部署後預計網址：

```text
https://jerry83145-design.github.io/longbro-erp/liff.html
```

## 之後接 LINE 時要做的事

1. 在 LINE Developers 建立 Messaging API Channel。
2. 建立 LIFF App，網址指向 GitHub Pages 的 `liff.html`。
3. 在 LINE 官方帳號選單放兩個入口：
   - 新增支出
   - 新增收入
4. 使用者點選後直接開手機表單。
5. 表單送出後回到 ERP 待處理事項確認。

## 暫不做的事

目前先不以「一句話記帳」為主，因為那會讓使用者需要記欄位格式，也比較容易漏資料。

一句話記帳可以保留成未來功能，例如：

```text
支出 1200 卡商 卡盒進貨
```

但目前第一版以手機版表單為主，會比較直覺、比較不容易填錯。
