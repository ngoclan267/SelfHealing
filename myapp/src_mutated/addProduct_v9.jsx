import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// V9: Semantic + Structure changes
// Semantic: all user-visible text changed, aria-labels added, option values described differently
// Structure: sections reordered (Variants before Gb), wrapper elements changed, nesting depth increased
// data-testid: RENAMED with "v9-" prefix and slug changes

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

    const handleChange = (e) => {
        setProduct({ ...product, [e.target.name]: e.target.value });
    };

    const handleArrayChange = (index, field, subField, value) => {
        setProduct(prev => {
            const updatedArray = [...prev[field]];
            updatedArray[index] = { ...updatedArray[index], [subField]: value };
            return { ...prev, [field]: updatedArray };
        });
    };

    const addField = (field, defaultValue) => {
        setProduct({ ...product, [field]: [...product[field], defaultValue] });
    };

    const removeField = (field, index) => {
        const updatedArray = product[field].filter((_, i) => i !== index);
        setProduct({ ...product, [field]: updatedArray });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = sessionStorage.getItem('token');
        const cleanSpecifications = product.specifications.filter(
            spec => spec.key.trim() !== "" && spec.value.trim() !== ""
        );
        const finalImage = Array.isArray(product.image) ? product.image : [product.image];
        const dataToSend = { ...product, specifications: cleanSpecifications, image: finalImage };

        try {
            await axios.post(`http://localhost:5000/api/products/${product.category}`, dataToSend, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Sản phẩm đã được đăng thành công!");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại");
        }
    };

    return (
        <main className="py-5">
            <div className="container">
                {/* Semantic: heading text changed */}
                <h2 className="text-center mb-4 fw-bold text-uppercase">Quản lý & Đăng sản phẩm</h2>

                <form onSubmit={handleSubmit} aria-label="Form thêm sản phẩm mới">
                    <div className="card p-4 shadow-lg border-0 bg-light">

                        {/* Section 1: Basic Info — structure: extra div.info-block wrapper added */}
                        <section className="mb-4">
                            {/* Semantic: section title changed */}
                            <h5 className="border-bottom pb-2">1. Thông tin định danh sản phẩm</h5>
                            <div className="info-block">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        {/* Semantic: label changed */}
                                        <label className="form-label fw-bold">Tên thương mại</label>
                                        <input
                                            type="text"
                                            data-testid="v9-name"
                                            name="name"
                                            className="form-control"
                                            required
                                            onChange={handleChange}
                                            placeholder="Tên sản phẩm đầy đủ"
                                            aria-label="Tên sản phẩm"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        {/* Semantic: label changed */}
                                        <label className="form-label fw-bold">Phân loại</label>
                                        <select
                                            name="category"
                                            data-testid="v9-category"
                                            className="form-select"
                                            onChange={handleChange}
                                            aria-label="Danh mục sản phẩm"
                                        >
                                            <option value="iphone">iPhone</option>
                                            <option value="ipad">iPad</option>
                                            <option value="macbook">Macbook</option>
                                            <option value="airpods">Airpods</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        {/* Semantic: label changed */}
                                        <label className="form-label fw-bold">Giá khởi điểm (VND)</label>
                                        <input
                                            type="number"
                                            name="pr"
                                            data-testid="v9-price"
                                            className="form-control"
                                            required
                                            onChange={handleChange}
                                            aria-label="Giá hiển thị"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        {/* Semantic: label added */}
                                        <label className="form-label fw-bold">Link ảnh chính</label>
                                        <input
                                            type="text"
                                            name="image"
                                            data-testid="v9-image"
                                            placeholder="URL hình ảnh"
                                            className="form-control"
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-12">
                                        {/* Semantic: label changed */}
                                        <label className="form-label fw-bold">Mô tả & giới thiệu</label>
                                        <textarea
                                            name="description"
                                            data-testid="v9-description"
                                            className="form-control"
                                            rows="3"
                                            onChange={handleChange}
                                            aria-label="Mô tả sản phẩm"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Specifications */}
                        <section className="mb-4">
                            {/* Semantic: section title changed */}
                            <h5 className="border-bottom pb-2">2. Cấu hình chi tiết</h5>
                            {product.specifications.map((spec, index) => (
                                // Structure: spec row wrapped in extra div.spec-item
                                <div key={index} className="spec-item">
                                    <div className="row g-2 mb-2" data-testid={"v9-spec-row-" + index}>
                                        <div className="col-5">
                                            <input
                                                type="text"
                                                // Semantic: placeholder changed
                                                placeholder="Tên thông số"
                                                data-testid={"v9-spec-key-" + index}
                                                className="form-control"
                                                value={spec.key}
                                                onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <input
                                                type="text"
                                                placeholder="Giá trị thông số"
                                                data-testid={"v9-spec-val-" + index}
                                                className="form-control"
                                                value={spec.value}
                                                onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-1">
                                            {/* Semantic: button text changed */}
                                            <button type="button" data-testid={"v9-del-spec-" + index} className="btn btn-danger w-100" onClick={() => removeField('specifications', index)}>✕</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Semantic: button text changed */}
                            <button type="button" data-testid="v9-add-spec" className="btn btn-sm btn-outline-primary" onClick={() => addField('specifications', { key: "", value: "" })}>+ Bổ sung thông số</button>
                        </section>

                        {/* Structure: SECTIONS REORDERED — Variants (Section 3) now before Gb (Section 4) */}

                        {/* Section 3: Variants (was Section 4) */}
                        <section className="mb-4">
                            {/* Semantic: section title changed */}
                            <h5 className="border-bottom pb-2">3. Màu sắc & Hình ảnh</h5>
                            {product.variants.map((variant, index) => (
                                <div key={index} className="card p-3 mb-3">
                                    <div className="row g-2" data-testid={"v9-variant-row-" + index}>
                                        <div className="col-md-4">
                                            <input type="text" placeholder="Tên màu (VD: Đen Obsidian)" data-testid={"v9-variant-name-" + index} className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)} />
                                        </div>
                                        <div className="col-md-3">
                                            <input type="color" data-testid={"v9-variant-code-" + index} className="form-control form-control-color w-100 mb-2" title="Màu sắc" onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)} />
                                        </div>
                                        <div className="col-md-4">
                                            <input type="text" data-testid={"v9-variant-img-" + index} placeholder="Link ảnh biến thể màu" className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)} />
                                        </div>
                                        <div className="col-md-1">
                                            <button type="button" data-testid={"v9-del-variant-" + index} className="btn btn-danger w-100" onClick={() => removeField('variants', index)}>✕</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" data-testid="v9-add-variant" className="btn btn-sm btn-outline-primary" onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })}>+ Thêm màu sắc</button>
                        </section>

                        {/* Section 4: Gb (was Section 3) */}
                        <section className="mb-4">
                            {/* Semantic: section title changed */}
                            <h5 className="border-bottom pb-2">4. Tùy chọn dung lượng & Bảng giá</h5>
                            {product.Gb.map((item, index) => (
                                <div key={index} className="row g-2 mb-2" data-testid={"v9-gb-row-" + index}>
                                    <div className="col-5">
                                        <input type="text" placeholder="Dung lượng (VD: 512 GB)" data-testid={"v9-gb-label-" + index} className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)} />
                                    </div>
                                    <div className="col-6">
                                        <input type="number" placeholder="Mức giá (VND)" data-testid={"v9-gb-price-" + index} className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)} />
                                    </div>
                                    <div className="col-1">
                                        <button type="button" data-testid={"v9-del-gb-" + index} className="btn btn-danger w-100" onClick={() => removeField('Gb', index)}>✕</button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" data-testid="v9-add-gb" className="btn btn-sm btn-outline-primary" onClick={() => addField('Gb', { label: "", price: 0 })}>+ Thêm mức dung lượng</button>
                        </section>

                        <hr />
                        {/* Semantic: submit button text changed */}
                        <button type="submit" data-testid="v9-submit" className="btn btn-dark btn-lg w-100 rounded-pill shadow">XÁC NHẬN & ĐĂNG SẢN PHẨM</button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default AddProduct;