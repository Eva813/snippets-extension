# PUBLISH.md

## Snippets Extension 自動化發布與部署指南

本專案已整合完整 CI/CD 流程，透過 GitHub Actions 自動建構、壓縮、發布 Release 並（可選）自動上傳至 Chrome Web Store。

---

## 觸發條件
- **推送標籤**：
  - 只要推送符合 `v*` 格式的 tag（如 `v1.0.0`），即會自動觸發發布流程。
  - 指令範例：
    ```sh
    git tag v1.0.0
    git push origin v1.0.0
    ```
- **手動觸發**：
  - 於 GitHub Actions 頁面選擇「自動化發布」→「Run workflow」→ 輸入版本號（如 v1.0.0）→ 執行。

---

## 自動化流程內容
1. **自動同步 manifest.json 版本號**
   - 會自動將 `chrome-extension/manifest.json` 的 version 欄位更新為本次發布版本號。
2. **建構所有頁面與套件**
   - 執行 `pnpm build`，產生所有必要產物。
3. **產生壓縮檔**
   - 將 `chrome-extension` 目錄內容壓縮為 zip 檔，檔名格式：`snippets-extension_版本號.zip`
4. **建立 GitHub Release**
   - 自動建立 Release，並附上 zip 檔。
5. **自動發布到 Chrome Web Store（可選）**
   - 若已設定金鑰，會自動上傳 zip 檔並發布。

---

## Chrome Web Store 自動發布設定

如需自動上傳至 Chrome Web Store，請於 GitHub 專案「Settings → Secrets and variables → Actions」新增下列 secrets：
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`
- `CHROME_EXTENSION_ID`

取得方式請參考[官方文件](https://developer.chrome.com/docs/webstore/using_webstore_api/#before-you-begin)或本專案 README。


1. `CHROME_CLIENT_ID` / `CHROME_CLIENT_SECRET` / `CHROME_REFRESH_TOKEN`
這三個是 Google OAuth 憑證，需用來呼叫 Chrome Web Store API。

到 Google Cloud Console（https://console.cloud.google.com/）
建立一個專案
    啟用「Chrome Web Store API」
    建立 OAuth 2.0 憑證（選擇「桌面應用程式」）
    取得 client_id 與 client_secret
    用這組憑證，依照官方文件產生 refresh_token（需用 Google 帳號登入並授權）

- CHROME_REFRESH_TOKEN 是 Google OAuth 2.0 的「refresh token」，用來讓自動化流程取得 Chrome Web Store API 的 access token。
- 用下列指令產生授權網址，並在瀏覽器開啟，登入你的 Google 帳號並授權：
```sh
open "https://accounts.google.com/o/oauth2/auth?client_id=你的CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code&scope=https://www.googleapis.com/auth/chromewebstore"

```
取得授權碼（code），然後用下列指令換取 refresh token：
```sh
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=你的CLIENT_ID" \
  -d "client_secret=你的CLIENT_SECRET" \
  -d "code=你的授權碼" \            
  -d "grant_type=authorization_code" \
  -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob" \
  https://oauth2.googleapis.com/token   
```


參考官方指南：
https://developer.chrome.com/docs/webstore/using_webstore_api/#before-you-begin



2. `CHROME_EXTENSION_ID`
   - 這是你的 Chrome 擴充套件 ID，可以在 Chrome Web Store 的擴充套件頁面找到。
   - 到 Chrome Web Store 開發者後台（https://chrome.google.com/webstore/devconsole）查看擴充套件資訊。


---

## 常見問題
- **manifest.json 版本號未同步？**
  - 請確認 workflow 有執行「自動同步 manifest.json 版本號」步驟。
- **Chrome Web Store 上傳失敗？**
  - 請檢查 secrets 是否正確、refresh_token 是否有效、API 權限是否開啟。
- **如何只發布 GitHub Release，不上傳 Chrome Web Store？**
  - 不設定 Chrome 相關 secrets 即可。

---

## 參考指令

### 發布新版本
```sh
git tag v1.2.3
git push origin v1.2.3
```

### 手動觸發 Actions
1. 前往 GitHub 專案頁面 → Actions → 選擇「自動化發布」
2. 點「Run workflow」
3. 輸入版本號（如 v1.2.3）
4. 執行

