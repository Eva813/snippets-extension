#!/bin/bash
# Chrome 擴充功能上架版本創建腳本

echo "🚀 開始建立上架版本..."

# 檢查是否在正確目錄
if [[ ! -f "package.json" ]]; then
    echo "❌ 請在專案根目錄執行此腳本"
    exit 1
fi

# 載入 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 使用專案指定的 Node 版本
echo "📦 切換到專案指定的 Node 版本..."
nvm use

if [[ $? -ne 0 ]]; then
    echo "❌ Node 版本切換失敗"
    echo "💡 請確保已安裝 nvm 和 Node.js 22.12.0"
    exit 1
fi

echo "✅ Node 版本: $(node --version)"

# 1. 清理並構建
echo "📦 清理並構建..."
pnpm clean && pnpm build

if [[ $? -ne 0 ]]; then
    echo "❌ 構建失敗"
    exit 1
fi

# 2. 驗證構建
echo "🔍 驗證構建..."
if node scripts/verify-production-build.js; then
    echo "✅ 構建驗證通過"
else
    echo "❌ 構建驗證失敗，請檢查錯誤"
    exit 1
fi

# 3. 顯示版本號
echo "📋 當前版本："
VERSION=$(grep '"version"' dist/manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "Version: $VERSION"

# 4. 創建 ZIP
echo "📦 創建 ZIP 文件..."
cd dist
zip -r "../extension-$VERSION.zip" *
cd ..

# 5. 完成
if [[ -f "extension-$VERSION.zip" ]]; then
    echo "🎉 上架文件已準備完成：extension-$VERSION.zip"
    echo "📁 文件大小：$(ls -lh "extension-$VERSION.zip" | awk '{print $5}')"
    echo ""
    echo "📋 接下來的步驟："
    echo "1. 測試 extension-$VERSION.zip 在本地 Chrome"
    echo "2. 上傳到 Chrome Web Store"
    echo "3. 備份此版本的 zip 文件"
else
    echo "❌ ZIP 文件創建失敗"
    exit 1
fi
