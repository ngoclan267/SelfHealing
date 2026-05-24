#!/bin/bash
# Dùng: bash switch_ui.sh [v1|v2|v3|v4|v7|v8|v9|v10|v11]
VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Cần truyền version: v1|v2|v3|v4|v5|v6|v7|v8|v9|v10|v11|v12"
  exit 1
fi

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$BASE_DIR/../../myapp/src/pages"

echo "Đang chuyển sang UI $VERSION..."

cp "$BASE_DIR/Login_$VERSION.jsx" "$SRC_DIR/Login.jsx"
cp "$BASE_DIR/Register_$VERSION.jsx" "$SRC_DIR/Register.jsx"
cp "$BASE_DIR/Products_$VERSION.jsx" "$SRC_DIR/Products.jsx"
cp "$BASE_DIR/Contact_$VERSION.jsx" "$SRC_DIR/Contact.jsx"
cp "$BASE_DIR/addProduct_$VERSION.jsx" "$SRC_DIR/addProduct.jsx"
echo "Xong! Reload React dev server để thấy thay đổi."