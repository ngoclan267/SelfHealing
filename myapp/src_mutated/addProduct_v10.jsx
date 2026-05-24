import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// V10: Attribute + Semantic + Structure (Heavy)
// Attribute: input types changed (url for image/img fields), name attrs, autocomplete, min attrs
// Semantic: all section titles/labels/placeholders/button texts completely changed
// Structure: Basic Info section now LAST (sections reordered 2→3→4→1), 
//            remove buttons changed to icons, add buttons moved to section headers
// data-testid: RENAMED with totally different slugs (no descriptive keywords)

const AddProduct = () => {
    const navigate = useNavigate();
    const [product, setProduct] = useState({
        name: "",
        description: "",
        pr: 0,
        category: "iphone",
        image: "",
        specifications: [{ key: "", value: "" }],
        Gb: [{ label: "", price: 0 }],
        variants: [{ colorName: "", colorCode: "", img: "" }]
    });

    const handleChange = (e) => setProduct({ ...product, [e.target.name]: e.target.value });

    const handleArrayChange = (index, field, subField, value) => {
        setProduct(prev => {
            const arr = [...prev[field]];
            arr[index] = { ...arr[index], [subField]: value };
            return { ...prev, [field]: arr };
        });
    };

    const addField = (field, defaultValue) =>
        setProduct({ ...product, [field]: [...product[field], defaultValue] });

    const removeField = (field, index) =>
        setProduct({ ...product, [field]: product[field].filter((_, i) => i !== index) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = sessionStorage.getItem('token');
        const cleanSpecs = product.specifications.filter(s => s.key.trim() && s.value.trim());
        const finalImg = Array.isArray(product.image) ? product.image : [product.image];
        const payload = { ...product, specifications: cleanSpecs, image: finalImg };

        try {
            await axios.post(`http://localhost:5000/api/products/${product.category}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Đã lưu sản phẩm thành công!");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.message || "Lưu thất bại");
        }
    };

    return (
        <div className="py-5 bg-light min-vh-100">
            <div className="container">
                {/* Semantic: page title changed */}
                <h1 className="text-center mb-5 fw-bold fs-3 text-uppercase letter-spacing-2">
                    Bảng điều khiển - Thêm hàng
                </h1>

                <form onSubmit={handleSubmit} aria-label="Biểu mẫu đăng sản phẩm" noValidate>
                    <div className="row g-4">

                        {/* Structure: LEFT COLUMN — sections reordered */}
                        <div className="col-lg-7">

                            {/* Structure: Section Specs now FIRST (was 2nd) */}
                            <div className="card border-0 shadow-sm rounded-4 mb-4">
                                <div className="card-header bg-dark text-white rounded-top-4 d-flex justify-content-between align-items-center">
                                    {/* Semantic: section title changed */}
                                    <h6 className="mb-0 fw-bold">Thông số kỹ thuật</h6>
                                    {/* Structure: Add button moved to header (was at bottom) */}
                                    <button
                                        type="button"
                                        data-testid="ctrl-01"
                                        className="btn btn-sm btn-outline-light"
                                        onClick={() => addField('specifications', { key: "", value: "" })}
                                    >+ Thêm</button>
                                </div>
                                <div className="card-body p-3">
                                    {product.specifications.map((spec, index) => (
                                        <div key={index} className="input-group mb-2" data-testid={"row-spec-" + index}>
                                            <input
                                                type="text"
                                                placeholder="Thuộc tính"
                                                data-testid={"cell-a-" + index}
                                                className="form-control"
                                                value={spec.key}
                                                onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Giá trị"
                                                data-testid={"cell-b-" + index}
                                                className="form-control"
                                                value={spec.value}
                                                onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)}
                                            />
                                            {/* Attribute: button now icon-only */}
                                            <button
                                                type="button"
                                                data-testid={"rm-spec-" + index}
                                                className="btn btn-outline-danger"
                                                aria-label="Xóa thông số"
                                                onClick={() => removeField('specifications', index)}
                                            >🗑</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Structure: Section Gb now SECOND (was 3rd) */}
                            <div className="card border-0 shadow-sm rounded-4 mb-4">
                                <div className="card-header bg-dark text-white rounded-top-4 d-flex justify-content-between align-items-center">
                                    {/* Semantic: title changed */}
                                    <h6 className="mb-0 fw-bold">Bảng giá theo dung lượng</h6>
                                    <button
                                        type="button"
                                        data-testid="ctrl-02"
                                        className="btn btn-sm btn-outline-light"
                                        onClick={() => addField('Gb', { label: "", price: 0 })}
                                    >+ Thêm</button>
                                </div>
                                <div className="card-body p-3">
                                    {product.Gb.map((item, index) => (
                                        <div key={index} className="input-group mb-2" data-testid={"row-gb-" + index}>
                                            <input
                                                type="text"
                                                placeholder="Dung lượng"
                                                data-testid={"cell-c-" + index}
                                                className="form-control"
                                                onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Giá (VND)"
                                                data-testid={"cell-d-" + index}
                                                className="form-control"
                                                min={0}
                                                onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                data-testid={"rm-gb-" + index}
                                                className="btn btn-outline-danger"
                                                aria-label="Xóa tùy chọn"
                                                onClick={() => removeField('Gb', index)}
                                            >🗑</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Structure: RIGHT COLUMN */}
                        <div className="col-lg-5">

                            {/* Structure: Section Variants now THIRD (was 4th) */}
                            <div className="card border-0 shadow-sm rounded-4 mb-4">
                                <div className="card-header bg-dark text-white rounded-top-4 d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0 fw-bold">Tùy chọn màu sắc</h6>
                                    <button
                                        type="button"
                                        data-testid="ctrl-03"
                                        className="btn btn-sm btn-outline-light"
                                        onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })}
                                    >+ Thêm</button>
                                </div>
                                <div className="card-body p-3">
                                    {product.variants.map((variant, index) => (
                                        <div key={index} className="border rounded-3 p-2 mb-2" data-testid={"row-var-" + index}>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <input
                                                    type="color"
                                                    data-testid={"cell-e-" + index}
                                                    className="form-control form-control-color"
                                                    style={{ width: '50px' }}
                                                    title="Mã màu"
                                                    onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Tên màu"
                                                    data-testid={"cell-f-" + index}
                                                    className="form-control form-control-sm"
                                                    onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    data-testid={"rm-var-" + index}
                                                    className="btn btn-sm btn-outline-danger"
                                                    aria-label="Xóa màu"
                                                    onClick={() => removeField('variants', index)}
                                                >🗑</button>
                                            </div>
                                            {/* Attribute: type changed to url */}
                                            <input
                                                type="url"
                                                data-testid={"cell-g-" + index}
                                                placeholder="https://... (ảnh màu này)"
                                                className="form-control form-control-sm"
                                                onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Structure: Basic Info section now LAST (was 1st), moved to right column */}
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-dark text-white rounded-top-4">
                                    {/* Semantic: title changed */}
                                    <h6 className="mb-0 fw-bold">Hồ sơ sản phẩm</h6>
                                </div>
                                <div className="card-body p-3">
                                    {/* Semantic: label changed */}
                                    <label htmlFor="prd-name" className="form-label small fw-bold">Tên hàng</label>
                                    <input
                                        type="text"
                                        id="prd-name"
                                        name="name"
                                        data-testid="field-name"
                                        className="form-control mb-2"
                                        placeholder="Ví dụ: iPhone 17 Pro"
                                        required
                                        onChange={handleChange}
                                    />

                                    <label htmlFor="prd-cat" className="form-label small fw-bold">Danh mục</label>
                                    <select
                                        id="prd-cat"
                                        name="category"
                                        data-testid="field-category"
                                        className="form-select mb-2"
                                        onChange={handleChange}
                                    >
                                        <option value="iphone">iPhone</option>
                                        <option value="ipad">iPad</option>
                                        <option value="macbook">Macbook</option>
                                        <option value="airpods">Airpods</option>
                                    </select>

                                    <label htmlFor="prd-price" className="form-label small fw-bold">Giá niêm yết</label>
                                    <input
                                        type="number"
                                        id="prd-price"
                                        name="pr"
                                        data-testid="field-price"
                                        className="form-control mb-2"
                                        min={0}
                                        required
                                        onChange={handleChange}
                                    />

                                    <label htmlFor="prd-img" className="form-label small fw-bold">URL ảnh bìa</label>
                                    {/* Attribute: type changed to url */}
                                    <input
                                        type="url"
                                        id="prd-img"
                                        name="image"
                                        data-testid="field-img"
                                        placeholder="https://..."
                                        className="form-control mb-2"
                                        onChange={handleChange}
                                    />

                                    <label htmlFor="prd-desc" className="form-label small fw-bold">Mô tả ngắn</label>
                                    <textarea
                                        id="prd-desc"
                                        name="description"
                                        data-testid="field-desc"
                                        className="form-control"
                                        rows={3}
                                        placeholder="Mô tả sản phẩm..."
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Semantic: submit button text changed */}
                    <div className="text-center mt-4">
                        <button
                            type="submit"
                            data-testid="publish-btn"
                            className="btn btn-dark btn-lg px-5 rounded-pill shadow"
                        >
                            LƯU & XUẤT BẢN SẢN PHẨM
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProduct;