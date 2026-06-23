# 球員卡團拆流水帳網頁

這是會計工作區的第一版流水帳網頁工具，目標是把原本 Excel 流水帳中常用的欄位搬到網頁上，讓支出、收入、憑證與待確認項目可以逐步整理到 Firebase。

## 第一版功能

- 使用 Google 登入。
- 只允許 `src/firebase-config.js` 內 `allowedEmails` 列出的帳號操作。
- 支出與收入切換輸入，兩邊的下拉選項分開管理。
- 日期使用年曆選擇，限制為 2026-01-01 到 2035-12-31。
- 交易對象、金流方式、帳戶、大類、中類、細項、備註以下拉選單為主。
- 項目／摘要與金額改為手動輸入。
- 下拉選項可以新增與修改，管理選項時只會修改目前所在的支出或收入欄位。
- 發票／收據檔案可上傳到 Firebase Storage。
- 流水帳紀錄存入 Firestore 的 `ledgerRecords` collection。
- 未附憑證者默認為無發票，並標記「待補憑證」。
- 有上傳憑證者自動標記為有發票。
- 若新紀錄有憑證，且偵測到同日期、同交易對象、同項目、同金額的前一筆無憑證紀錄，會跳出對比並詢問是否刪除前一筆。
- 首頁顯示本月支出、本月收入、本月筆數與待補憑證。

## Firebase 設定

1. 到 Firebase Console 建立專案：`ray-accounting`。
2. 建立 Web App。
3. 複製 Firebase config。
4. 修改 `src/firebase-config.js`。
5. Authentication 啟用 Google 登入。
6. Firestore 建立資料庫。
7. Storage 建立儲存空間。
8. 將 `firestore.rules` 與 `storage.rules` 貼到 Firebase 規則頁並發布。

## GitHub Pages 部署

1. 建立 GitHub repository：`accounting-web`。
2. 將本資料夾內容推上 GitHub。
3. 到 GitHub repository 的 Settings > Pages。
4. Source 選 GitHub Actions。
5. 推送到 `main` 後會自動部署。

## 會計資料規則

本工具目前只建立流水帳紀錄與憑證檔案索引，不會修改、覆蓋、重新命名或刪除原始資料。正式分類、分錄、營業稅判斷與 Excel 報表產出仍需後續逐步加入，且高風險判斷保留為待確認。
