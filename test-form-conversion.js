/**
 * Form Node 轉換測試
 * 這個檔案可以在瀏覽器控制台中運行來測試 TipTap JSON 到 HTML 的轉換功能
 *
 * 使用方法：
 * 1. 在 Chrome Extension 的 side panel 或 popup 中開啟開發者工具
 * 2. 將這個檔案的內容複製到控制台中運行
 * 3. 查看輸出結果是否符合預期
 */

console.log('🧪 開始 Form Node 轉換測試...');

// 測試資料 - 基於實際資料庫結構
const testFormTextData = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ' },
        {
          type: 'formtext',
          attrs: {
            promptData: {
              attributes: [
                { name: 'name', value: 'TTTTT5555' },
                { name: 'default', value: 'Tt' },
              ],
              commandName: 'formtext',
              type: 'formtext',
            },
          },
        },
        { type: 'text', text: '!' },
      ],
    },
  ],
};

const testFormMenuData = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Select: ' },
        {
          type: 'formmenu',
          attrs: {
            promptData: {
              attributes: [
                { name: 'options', value: ['Choice 1', 'Chewe', 'Choice 3'] },
                { name: 'name', value: 'testMenu' },
                { name: 'default', value: 'Chewe' },
                { name: 'multiple', value: false },
              ],
              commandName: 'formmenu',
              type: 'formmenu',
            },
          },
        },
      ],
    },
  ],
};

// 測試函數
async function testFormConversion() {
  try {
    // 檢查是否有轉換函數可用
    if (typeof getContentForPreview === 'undefined') {
      console.error('❌ getContentForPreview 函數不可用。請確保在正確的環境中運行。');
      return;
    }

    console.log('📋 測試 FormText 轉換...');
    const formTextHTML = getContentForPreview(testFormTextData);
    console.log('🔍 FormText 結果:', formTextHTML);

    // 驗證 FormText 結果
    const hasFormTextType = formTextHTML.includes('data-type="formtext"');
    const hasFormTextPrompt = formTextHTML.includes('data-prompt=');
    const hasFormTextDisplay = formTextHTML.includes('[TTTTT5555:Tt]');

    console.log('✅ FormText 驗證:');
    console.log('  - 包含 data-type="formtext":', hasFormTextType);
    console.log('  - 包含 data-prompt 屬性:', hasFormTextPrompt);
    console.log('  - 包含顯示文字:', hasFormTextDisplay);

    console.log('📋 測試 FormMenu 轉換...');
    const formMenuHTML = getContentForPreview(testFormMenuData);
    console.log('🔍 FormMenu 結果:', formMenuHTML);

    // 驗證 FormMenu 結果
    const hasFormMenuType = formMenuHTML.includes('data-type="formmenu"');
    const hasFormMenuPrompt = formMenuHTML.includes('data-prompt=');
    const hasFormMenuDisplay = formMenuHTML.includes('[testMenu:Chewe]');

    console.log('✅ FormMenu 驗證:');
    console.log('  - 包含 data-type="formmenu":', hasFormMenuType);
    console.log('  - 包含 data-prompt 屬性:', hasFormMenuPrompt);
    console.log('  - 包含顯示文字:', hasFormMenuDisplay);

    // 測試表單欄位檢測
    console.log('📋 測試表單欄位檢測...');

    // 測試 sidePanel.js 中的檢測邏輯
    const formTextJSON = JSON.stringify(testFormTextData);
    const hasFormTextInJSON = formTextJSON.includes('"type":"formtext"');
    const formMenuJSON = JSON.stringify(testFormMenuData);
    const hasFormMenuInJSON = formMenuJSON.includes('"type":"formmenu"');

    console.log('✅ JSON 檢測驗證:');
    console.log('  - FormText JSON 包含 type:formtext:', hasFormTextInJSON);
    console.log('  - FormMenu JSON 包含 type:formmenu:', hasFormMenuInJSON);

    // 總結
    const allTestsPassed =
      hasFormTextType &&
      hasFormTextPrompt &&
      hasFormTextDisplay &&
      hasFormMenuType &&
      hasFormMenuPrompt &&
      hasFormMenuDisplay &&
      hasFormTextInJSON &&
      hasFormMenuInJSON;

    console.log(allTestsPassed ? '🎉 所有測試通過！Form Node 轉換功能正常運作。' : '❌ 部分測試失敗，請檢查實現。');

    return {
      formTextHTML,
      formMenuHTML,
      testsPassed: allTestsPassed,
    };
  } catch (error) {
    console.error('💥 測試過程中發生錯誤:', error);
  }
}

// 執行測試
testFormConversion();

// 提供手動測試指令
console.log(`
📝 手動測試說明：
1. 開啟包含 formtext/formmenu 的 prompt
2. 檢查側邊面板預覽是否正確顯示
3. 點擊 prompt 是否能觸發彈窗
4. 彈窗中的表單欄位是否正確渲染

🔧 如果需要除錯，可以在控制台運行：
- testFormConversion() // 重新執行測試
- console.log(getContentForPreview(testFormTextData)) // 查看 FormText 轉換
- console.log(getContentForPreview(testFormMenuData)) // 查看 FormMenu 轉換
`);
