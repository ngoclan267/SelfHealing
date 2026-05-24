#!/bin/bash
VERSION=$1
SRC_DIR="../myapp/src/pages"
BASE_DIR="../myapp/src_mutated"

if [ -z "$VERSION" ]; then echo "Sử dụng: ./switch_ui.sh [v1|v2|v_hard|...]"; exit 1; fi

echo "Đang chuyển sang UI phiên bản $VERSION..."

cp "$BASE_DIR/Login_$VERSION.jsx" "$SRC_DIR/Login.jsx"
cp "$BASE_DIR/Register_$VERSION.jsx" "$SRC_DIR/Register.jsx"
cp "$BASE_DIR/Products_$VERSION.jsx" "$SRC_DIR/Products.jsx"
cp "$BASE_DIR/Contact_$VERSION.jsx" "$SRC_DIR/Contact.jsx"
cp "$BASE_DIR/addProduct_$VERSION.jsx" "$SRC_DIR/addProduct.jsx"
cp "$BASE_DIR/ProductDetail_$VERSION.jsx" "$SRC_DIR/ProductDetail.jsx"

echo "Xong! Reload React dev server để thấy thay đổi."