# Retro Neobrutalism UI - 手動測試指南

**分支**: `001-retro-neobrutalism-ui`  
**日期**: 2025-11-13  
**狀態**: Phase 1-4 程式碼實作完成，Phase 4-5 驗證待執行

---

## 📋 測試前準備

### 1. 啟動開發伺服器

```bash
# 確認使用 Node >= 20
nvm use v22.20.0

# 啟動開發伺服器
pnpm dev
```

### 2. 載入擴充功能

1. 開啟 Chrome 瀏覽器
2. 前往 `chrome://extensions`
3. 啟用「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇 `dist/chrome-mv3-dev` 資料夾

---

## ✅ Phase 4 驗證測試 (T035-T037)

### T035: 測試 prefers-reduced-motion 媒體查詢

**目標**: 驗證 motion-reduce 類別正確運作

**步驟**:

1. 開啟 side-panel (已使用共享 Button 元件)
2. 開啟 Chrome DevTools (F12)
3. 點擊 DevTools 右上角 「⋮」→「More tools」→「Rendering」
4. 在 Rendering 分頁找到「Emulate CSS media feature prefers-reduced-motion」
5. 選擇「prefers-reduced-motion: reduce」
6. 重新載入擴充功能
7. 懸停在按鈕上

**預期結果**:
- ✅ 按鈕不應有 translate 動畫（不上升）
- ✅ 應該只有顏色/不透明度變化（hover:opacity-90）
- ✅ 點擊按鈕時無按下動畫

**反向驗證**:
- 將設定改為「prefers-reduced-motion: no-preference」
- 重新載入擴充功能
- ✅ 懸停時按鈕應上升 1px (-translate-y-1)
- ✅ 點擊時按鈕應按下 (translate-y-0, shadow 消失)

---

### T036: Chrome DevTools Performance 驗證

**目標**: 驗證 60fps 流暢性，無 Recalculate Style 警告

**步驟**:

1. 開啟 side-panel
2. 開啟 Chrome DevTools → Performance 分頁
3. 點擊 Record (⚫️) 開始錄製
4. 在 side-panel 中反覆懸停和點擊按鈕 5-10 次
5. 停止錄製

**分析結果**:

1. 檢查 FPS 圖表 (頂部綠色線條)：
   - ✅ 應保持在 60 FPS 或接近 60 FPS
   - ❌ 如果有明顯掉幀（低於 30 FPS），需要優化

2. 檢查 Main Thread (主執行緒) 活動：
   - ✅ "Recalculate Style" 事件應該極少且短暫（< 5ms）
   - ✅ "Layout" 事件應該極少（理想為 0）
   - ❌ 如果有大量 "Recalculate Style" 或 "Layout"，表示有效能問題

3. 檢查 GPU 活動：
   - ✅ 應該看到 "Composite Layers" 活動（表示 GPU 加速生效）

**疑難排解**:
- 如果效能不佳，檢查 Button.tsx 是否有 `transform-gpu` 類別
- 確認動畫只使用 transform 和 opacity（不使用 width、height、margin 等）

---

### T037: 驗證動畫時間

**目標**: 所有過渡時間 100-300ms

**步驟**:

1. 開啟 side-panel
2. 開啟 Chrome DevTools → Elements 分頁
3. 選擇任一按鈕元素
4. 查看 Computed Styles（計算後樣式）
5. 找到 `transition-duration` 屬性

**預期值**:
- Button: ✅ `transition-duration: 100ms` (duration-fast)
- Card: ✅ `transition-duration: 200ms` (duration-200)
- Input: ✅ `transition-duration: 150ms` (duration-150)

**驗證動畫感覺**:
- 懸停按鈕時，上升效果應該「彈跳有力」（ease-neo-snap）
- 懸停卡片時，提升效果應該「平滑彈性」（ease-neo-pop）
- 聚焦輸入框時，下沉效果應該「快速精確」

---

## ✅ Phase 5 視覺一致性測試 (T038-T048)

### T038-T040: 手動視覺驗證元件

**Button 元件驗證 (T038)**:

1. 開啟所有擴充功能頁面：
   - popup (擴充功能圖示點擊)
   - side-panel (在網頁上點擊側邊面板圖示)
   - options (擴充功能管理頁面)
   - content-ui (網頁上的側邊欄)
   - new-tab (新分頁)

2. 檢查使用共享 Button 元件的位置（目前僅 side-panel）：
   - ✅ 邊框寬度 2px，顏色黑色
   - ✅ 偏移陰影 4px 4px（shadow-retro）
   - ✅ 懸停時陰影增加到 8px 8px (shadow-retro-lg)
   - ✅ 點擊時陰影消失
   - ✅ primary 色彩 #3d7a57（深綠色）
   - ✅ accent 色彩 #c9a800（金黃色）

**Card 元件驗證 (T039)**:

檢查所有使用 Card 元件的位置：
- ✅ 邊框 2px 黑色
- ✅ 陰影 8px 8px (shadow-retro-lg)
- ✅ 圓角 5px (rounded-base)
- ✅ 懸停時陰影增加到 12px 12px (shadow-retro-xl)
- ✅ 懸停時向上移動 2px

**Input 元件驗證 (T040)**:

檢查所有使用 Input 元件的位置：
- ✅ 邊框 2px 黑色（或錯誤時為紅色 #d00000）
- ✅ 陰影 3px 4px (shadow-input)
- ✅ 聚焦時向下移動 1px
- ✅ 聚焦時陰影縮小到 1px 2px
- ✅ 聚焦環 4px，顏色 #3d7a57

---

### T041: 手動動畫驗證

開啟 side-panel，測試每個按鈕：

1. **懸停測試**:
   - ✅ 按鈕向上移動 1px (-translate-y-1)
   - ✅ 陰影從 4px 4px 增加到 8px 8px
   - ✅ 過渡時間約 100ms

2. **點擊測試**:
   - ✅ 按鈕回到原位 (translate-y-0)
   - ✅ 陰影完全消失 (shadow-none)
   - ✅ 有明顯「按下」感覺

3. **時間感知**:
   - ✅ 100ms 應該感覺「快速有力」
   - ❌ 如果感覺遲緩（> 300ms），檢查 duration 設定

---

### T042: 可訪問性驗證

**prefers-reduced-motion 測試**（重複 T035）:

1. Chrome DevTools → Rendering → Emulate prefers-reduced-motion: reduce
2. 重新載入所有擴充功能頁面
3. ✅ 所有動畫應停用或使用不透明度/顏色替代
4. ✅ 無 translate 動畫
5. ✅ 懸停時只有 opacity-90 效果

---

### T043: 焦點狀態驗證

**鍵盤導航測試**:

1. 開啟 side-panel
2. 按 Tab 鍵在元素間導航
3. 檢查每個可互動元素（按鈕、輸入框）：
   - ✅ 焦點環 4px 寬度 (ring-4)
   - ✅ 焦點環顏色 #3d7a57 (ring-ring)
   - ✅ 焦點環偏移 2px (ring-offset-2)
   - ✅ 焦點環清晰可見，邊界分明

---

### T044: 色彩對比度驗證

**Lighthouse Accessibility Audit**:

1. 建構專案: `pnpm build`
2. 載入生產版本擴充功能 (`dist/chrome-mv3-prod`)
3. 開啟任一擴充功能頁面（如 popup）
4. 開啟 Chrome DevTools → Lighthouse 分頁
5. 選擇「Accessibility」類別
6. 點擊「Analyze page load」

**預期結果**:
- ✅ 無色彩對比度警告
- ✅ primary (#3d7a57) 與白色對比度 ≥ 4.51:1
- ✅ accent (#c9a800) 與黑色對比度 ≥ 6.71:1
- ✅ 所有文字對比度 ≥ 4.5:1（WCAG AA 標準）

---

### T045-T046: 跨瀏覽器驗證

**Chrome 測試 (T045)**:

1. 在 Chrome 中同時開啟所有擴充功能頁面
2. 檢查視覺一致性：
   - ✅ 所有按鈕邊框相同粗細（2px）
   - ✅ 所有陰影偏移相同（4px 4px）
   - ✅ 所有色彩相同（primary, accent）
   - ✅ 圓角相同（5px）

**Firefox 測試 (T046)**:

1. 建構 Firefox 版本: `pnpm build:firefox`
2. 載入 `dist/firefox-mv3-dev` 到 Firefox
3. 開啟所有擴充功能頁面
4. 重複 Chrome 的視覺檢查
5. ✅ 驗證 Chrome 和 Firefox 視覺完全一致

**常見差異**:
- Firefox 可能對 box-shadow 渲染略有不同
- 檢查 -moz- 前綴是否需要（Tailwind 應自動處理）

---

### T047: 響應式設計驗證

**寬度測試**:

1. 開啟 side-panel
2. 調整瀏覽器視窗寬度: 320px → 1920px
3. 檢查每個寬度：
   - ✅ 邊框始終 2px 粗
   - ✅ 陰影偏移不變（4px 4px）
   - ✅ 無版面破損
   - ✅ 文字不重疊
   - ✅ 按鈕可點擊（觸控區域足夠）

**建議測試寬度**:
- 320px (iPhone SE)
- 375px (iPhone 12/13)
- 768px (iPad)
- 1024px (桌面小螢幕)
- 1920px (Full HD)

---

### T048: 最終驗收

**建構與驗證**:

```bash
# 建構生產版本
pnpm build
pnpm build:firefox

# Lint 檢查
pnpm lint

# 型別檢查
pnpm type-check

# 建立發布壓縮檔
pnpm zip
pnpm zip:firefox
```

**預期結果**:
- ✅ 建構成功，無錯誤
- ✅ 無 lint 警告
- ✅ 型別檢查通過（devtools-panel 既有錯誤除外）
- ✅ 壓縮檔大小 < 5MB

**檢查壓縮檔大小**:

```bash
ls -lh dist/*.zip
```

---

## 📊 測試結果記錄表

複製此表格到測試報告中：

```markdown
| 測試 ID | 測試項目 | 狀態 | 備註 |
|---------|----------|------|------|
| T035 | prefers-reduced-motion | ⬜ | |
| T036 | Performance (60fps) | ⬜ | |
| T037 | 動畫時間驗證 | ⬜ | |
| T038 | Button 視覺一致性 | ⬜ | |
| T039 | Card 視覺一致性 | ⬜ | |
| T040 | Input 視覺一致性 | ⬜ | |
| T041 | 動畫行為驗證 | ⬜ | |
| T042 | 可訪問性驗證 | ⬜ | |
| T043 | 焦點狀態驗證 | ⬜ | |
| T044 | 色彩對比度 Lighthouse | ⬜ | |
| T045 | Chrome 跨頁面一致性 | ⬜ | |
| T046 | Firefox 視覺一致性 | ⬜ | |
| T047 | 響應式設計 | ⬜ | |
| T048 | 最終建構驗收 | ⬜ | |
```

**狀態符號**:
- ⬜ 待測試
- ✅ 通過
- ❌ 失敗
- ⚠️ 部分通過

---

## 🐛 常見問題與疑難排解

### 問題 1: 動畫不流暢（掉幀）

**原因**: GPU 加速未啟用或使用了會觸發 Layout 的屬性

**解決方案**:
1. 確認 Button.tsx 有 `transform-gpu` 類別
2. 檢查動畫只使用 `transform` 和 `opacity`
3. 避免使用 `width`、`height`、`margin`、`padding` 的動畫

### 問題 2: motion-reduce 無效

**原因**: 快取問題或 Tailwind 設定錯誤

**解決方案**:
1. 清除瀏覽器快取並重新載入擴充功能
2. 檢查 base.css 中有 `@media (prefers-reduced-motion: reduce)`
3. 驗證 Tailwind 配置有載入 base.css

### 問題 3: 色彩對比度未通過

**原因**: 色彩選擇不當或文字大小太小

**解決方案**:
1. 使用 WebAIM Contrast Checker 驗證色彩對比度
2. primary (#3d7a57) 已調整為符合 WCAG AA
3. accent (#c9a800) 已調整為符合 WCAG AA
4. 如需更深色彩，參考 research.md 決策 3

### 問題 4: Firefox 視覺與 Chrome 不一致

**原因**: 瀏覽器渲染差異

**解決方案**:
1. 檢查 box-shadow 值是否相同
2. 驗證 border-radius 單位一致
3. 使用 Firefox DevTools 檢查計算後樣式
4. 可能需要 -moz- 前綴（Tailwind 應自動處理）

---

## 📝 測試完成後

1. 更新 tasks.md，標記所有測試任務為 [X]
2. 記錄任何發現的問題到 GitHub Issues
3. 如果所有測試通過，準備合併到主分支
4. 建立 Pull Request，附上測試結果表格

---

**最後更新**: 2025-11-13  
**維護者**: Retro Neobrutalism UI 專案團隊
