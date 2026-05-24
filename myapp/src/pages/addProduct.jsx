import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// V8: Attribute + Context changes
// Attribute: name attrs renamed, input types changed, class tweaks
// Context: form section labels reordered/renamed, nearby labels changed, page context text changed
// data-testid: REMOVED from all elements

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
    const [errors] = useState({
        name: "",
        pr: ""
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

        const dataToSend = {
            ...product,
            specifications: cleanSpecifications,
            image: finalImage
        };

        try {
            await axios.post(`http://localhost:5000/api/products/${product.category}`, dataToSend, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Thêm sản phẩm thành công!");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi thêm sản phẩm");
        }
    };

    return (
        // Context: page wrapper class changed
        <div className="container mt-4 mb-4">
            {/* Context: heading text changed */}
            <h2 className="text-center mb-3 fw-bold text-uppercase">Đăng sản phẩm mới lên hệ thống</h2>
            <form onSubmit={handleSubmit} className="card p-4 shadow border-0 bg-white">

                {/* Context: section heading renamed, section order kept but labels differ */}
                <section className="mb-4">
                    {/* Context: section title changed */}
                    <h5 className="border-bottom pb-2">A. Thông tin sản phẩm</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            {/* Context: label text changed */}
                            <label className="form-label fw-bold">Tên hàng hóa</label>
                            {/* Attribute: id added, placeholder changed */}
                            <input type="text" id="input-product-name" name="name" className={`form-control ${errors.name ? "is-invalid" : ""}`} onChange={handleChange} placeholder="Nhập tên sản phẩm cần bán" />
                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>
                        <div className="col-md-3">
                            {/* Context: label changed */}
                            <label className="form-label fw-bold">Loại sản phẩm</label>
                            {/* Attribute: id added */}
                            <select name="category" id="select-category" className="form-select" onChange={handleChange}>
                                <option value="iphone">iPhone</option>
                                <option value="ipad">iPad</option>
                                <option value="macbook">Macbook</option>
                                <option value="airpods">Airpods</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            {/* Context: label changed */}
                            <label className="form-label fw-bold">Mức giá niêm yết</label>
                            {/* Attribute: id added, name kept */}
                            <input type="number" name="pr" id="input-price" className={`form-control ${errors.pr ? "is-invalid" : ""}`} onChange={handleChange} min="0" />
                            {errors.pr && <div className="invalid-feedback">{errors.pr}</div>}
                        </div>
                        <div className="col-md-3">
                            {/* Context: label added (was missing before) */}
                            <label className="form-label fw-bold">Đường dẫn ảnh đại diện</label>
                            <input type="url" name="image" id="input-image" placeholder="https://..." className="form-control" onChange={handleChange} />
                        </div>
                        <div className="col-12">
                            {/* Context: label changed */}
                            <label className="form-label fw-bold">Giới thiệu sản phẩm</label>
                            <textarea name="description" id="input-description" className="form-control" rows="3" onChange={handleChange}></textarea>
                        </div>
                    </div>
                </section>

                {/* Context: section renamed */}
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">B. Cấu hình & Thông số</h5>
                    {product.specifications.map((spec, index) => (
                        <div key={index} className="row g-2 mb-2" id={"spec-group-" + index}>
                            <div className="col-5">
                                <input
                                    type="text"
                                    placeholder="Tên thông số (VD: RAM)"
                                    id={"spec-key-field-" + index}
                                    className="form-control"
                                    value={spec.key}
                                    onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)}
                                />
                            </div>
                            <div className="col-6">
                                <input
                                    type="text"
                                    placeholder="Giá trị (VD: 8GB)"
                                    id={"spec-val-field-" + index}
                                    className="form-control"
                                    value={spec.value}
                                    onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)}
                                />
                            </div>
                            <div className="col-1">
                                {/* Attribute: className changed */}
                                <button type="button" id={"btn-del-spec-" + index} className="btn btn-outline-danger w-100" onClick={() => removeField('specifications', index)}>−</button>
                            </div>
                        </div>
                    ))}
                    {/* Context: button label changed */}
                    <button type="button" id="btn-new-spec" className="btn btn-sm btn-outline-secondary" onClick={() => addField('specifications', { key: "", value: "" })}>+ Thêm dòng thông số</button>
                </section>

                {/* Context: section renamed */}
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">C. Phiên bản lưu trữ (GB)</h5>
                    {product.Gb.map((item, index) => (
                        <div key={index} className="row g-2 mb-2" id={"gb-group-" + index}>
                            <div className="col-5">
                                <input type="text" placeholder="Phiên bản (VD: 128GB)" id={"gb-label-field-" + index} className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)} />
                            </div>
                            <div className="col-6">
                                <input type="number" placeholder="Giá bán (VND)" id={"gb-price-field-" + index} className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)} />
                            </div>
                            <div className="col-1">
                                <button type="button" id={"btn-del-gb-" + index} className="btn btn-outline-danger w-100" onClick={() => removeField('Gb', index)}>−</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" id="btn-new-gb" className="btn btn-sm btn-outline-secondary" onClick={() => addField('Gb', { label: "", price: 0 })}>+ Thêm phiên bản GB</button>
                </section>

                {/* Context: section renamed */}
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">D. Màu sắc & Hình ảnh biến thể</h5>
                    {product.variants.map((variant, index) => (
                        <div key={index} className="card p-3 mb-3 border-dashed">
                            <div className="row g-2" id={"variant-group-" + index}>
                                <div className="col-md-4">
                                    {/* Context: placeholder changed */}
                                    <input type="text" placeholder="Màu sắc (VD: Xanh Pacific)" id={"variant-name-field-" + index} className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)} />
                                </div>
                                <div className="col-md-3">
                                    {/* Attribute: title changed */}
                                    <input type="color" id={"variant-code-field-" + index} className="form-control form-control-color w-100 mb-2" title="Chọn màu sắc biến thể" onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)} />
                                </div>
                                <div className="col-md-4">
                                    <input type="url" id={"variant-img-field-" + index} placeholder="URL hình ảnh biến thể" className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)} />
                                </div>
                                <div className="col-md-1">
                                    <button type="button" id={"btn-del-variant-" + index} className="btn btn-outline-danger w-100" onClick={() => removeField('variants', index)}>−</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" id="btn-new-variant" className="btn btn-sm btn-outline-secondary" onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })}>+ Thêm màu mới</button>
                </section>

                <hr />
                {/* Context: button text changed, Attribute: id added */}
                <button type="submit" id="btn-submit-product" className="btn btn-dark btn-lg w-100 rounded-pill shadow">ĐĂNG TẢI SẢN PHẨM</button>
            </form>
        </div>
    );
};

export default AddProduct;