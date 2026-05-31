#!/bin/bash
VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Cần truyền version: v1|v2|v3|v4|v5|v6|v7|v8|v9|v10|v11|v12"
  exit 1
fi

cp_if_exists() {
    if [ -f "$1" ]; then
        cp "$1" "$2"
    else
        echo "Bỏ qua (không tìm thấy): $1"
    fi
}

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$BASE_DIR/../../myapp/src/pages"

echo "Đang chuyển sang UI $VERSION..."

cp_if_exists "$BASE_DIR/Login_$VERSION.jsx"      "$SRC_DIR/Login.jsx"
cp_if_exists "$BASE_DIR/Register_$VERSION.jsx"   "$SRC_DIR/Register.jsx"
cp_if_exists "$BASE_DIR/Products_$VERSION.jsx"   "$SRC_DIR/Products.jsx"
cp_if_exists "$BASE_DIR/Contact_$VERSION.jsx"    "$SRC_DIR/Contact.jsx"
cp_if_exists "$BASE_DIR/addProduct_$VERSION.jsx" "$SRC_DIR/addProduct.jsx"

echo "Xong!"
sleep 2