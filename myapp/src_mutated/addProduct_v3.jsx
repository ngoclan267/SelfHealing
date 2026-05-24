import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// V3: Structure only changes
// - Mỗi section bọc thêm <article>
// - Spec row: div.row -> div.spec-entry > div.spec-key-col + div.spec-val-col + div.spec-action
// - Gb row: tương tự div.gb-entry
// - Variant row: thêm wrap div.variant-card-inner
// - Submit button nằm trong footer.form-footer thay vì ngay sau <hr>
// - data-testid đổi prefix "v3-ap-"

const AddProduct = () => {
    const navigate = useNavigate();
    const [product, setProduct] = useState({
        name: "", description: "", pr: 0, category: "iphone", image: "",
        specifications: [{ key: "", value: "" }],
        Gb: [{ label: "", price: 0 }],
        variants: [{ colorName: "", colorCode: "", img: "" }]
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setProduct({ ...product, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
    };

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

    const validate = () => {
        const newErrors = {};
        if (!product.name.trim()) newErrors.name = "Tên sản phẩm không được để trống";
        if (!product.pr || Number(product.pr) <= 0) newErrors.pr = "Giá hiển thị phải lớn hơn 0";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        const token = sessionStorage.getItem('token');
        const cleanSpecifications = product.specifications.filter(s => s.key.trim() && s.value.trim());
        const finalImage = Array.isArray(product.image) ? product.image : [product.image];
        try {
            await axios.post(`http://localhost:5000/api/products/${product.category}`,
                { ...product, specifications: cleanSpecifications, image: finalImage },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Thêm sản phẩm thành công!");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi thêm sản phẩm");
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <h2 className="text-center mb-4 fw-bold text-uppercase">Thêm sản phẩm mới</h2>
            <form onSubmit={handleSubmit} className="card p-4 shadow-lg border-0 bg-light">

                {/* Section 1 */}
                <article className="section-article mb-4">
                    <section>
                        <h5 className="border-bottom pb-2">1. Thông tin cơ bản</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Tên sản phẩm</label>
                                <input type="text" data-testid="v3-ap-name" name="name" className={`form-control ${errors.name ? "is-invalid" : ""}`} onChange={handleChange} placeholder="Ví dụ: iPhone 16 Pro Max" />
                                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-bold">Danh mục</label>
                                <select name="category" data-testid="v3-ap-category" className="form-select" onChange={handleChange}>
                                    <option value="iphone">iPhone</option>
                                    <option value="ipad">iPad</option>
                                    <option value="macbook">Macbook</option>
                                    <option value="airpods">Airpods</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-bold">Giá hiển thị</label>
                                <input type="number" name="pr" data-testid="v3-ap-price" className={`form-control ${errors.pr ? "is-invalid" : ""}`} onChange={handleChange} min="0" />
                                {errors.pr && <div className="invalid-feedback">{errors.pr}</div>}
                            </div>
                            <div className="col-md-3">
                                <input type="text" name="image" data-testid="v3-ap-image" placeholder="Link ảnh" className="form-control" onChange={handleChange} />
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-bold">Mô tả sản phẩm</label>
                                <textarea name="description" data-testid="v3-ap-description" className="form-control" rows="3" onChange={handleChange}></textarea>
                            </div>
                        </div>
                    </section>
                </article>

                {/* Section 2 - Specs */}
                <article className="section-article mb-4">
                    <section>
                        <h5 className="border-bottom pb-2">2. Thông số kỹ thuật (Specifications)</h5>
                        {product.specifications.map((spec, index) => (
                            <div key={index} className="spec-entry d-flex gap-2 mb-2" data-testid={"v3-ap-spec-row-" + index}>
                                <div className="spec-key-col flex-grow-1" style={{ flex: '5' }}>
                                    <input type="text" placeholder="Ví dụ: Màn hình" data-testid={"v3-ap-spec-key-" + index} className="form-control" value={spec.key} onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)} />
                                </div>
                                <div className="spec-val-col flex-grow-1" style={{ flex: '6' }}>
                                    <input type="text" placeholder="Ví dụ: 6.9 inch" data-testid={"v3-ap-spec-val-" + index} className="form-control" value={spec.value} onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)} />
                                </div>
                                <div className="spec-action" style={{ flex: '1' }}>
                                    <button type="button" data-testid={"v3-ap-rm-spec-" + index} className="btn btn-danger w-100" onClick={() => removeField('specifications', index)}>×</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" data-testid="v3-ap-add-spec" className="btn btn-sm btn-outline-primary" onClick={() => addField('specifications', { key: "", value: "" })}>+ Thêm thông số</button>
                    </section>
                </article>

                {/* Section 3 - Gb */}
                <article className="section-article mb-4">
                    <section>
                        <h5 className="border-bottom pb-2">3. Dung lượng (Gb)</h5>
                        {product.Gb.map((item, index) => (
                            <div key={index} className="gb-entry d-flex gap-2 mb-2" data-testid={"v3-ap-gb-row-" + index}>
                                <div className="gb-label-col flex-grow-1" style={{ flex: '5' }}>
                                    <input type="text" placeholder="Dung lượng (256 GB...)" data-testid={"v3-ap-gb-label-" + index} className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)} />
                                </div>
                                <div className="gb-price-col flex-grow-1" style={{ flex: '6' }}>
                                    <input type="number" placeholder="Giá tương ứng" data-testid={"v3-ap-gb-price-" + index} className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)} />
                                </div>
                                <div className="gb-action" style={{ flex: '1' }}>
                                    <button type="button" data-testid={"v3-ap-rm-gb-" + index} className="btn btn-danger w-100" onClick={() => removeField('Gb', index)}>×</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" data-testid="v3-ap-add-gb" className="btn btn-sm btn-outline-primary" onClick={() => addField('Gb', { label: "", price: 0 })}>+ Thêm lựa chọn GB</button>
                    </section>
                </article>

                {/* Section 4 - Variants */}
                <article className="section-article mb-4">
                    <section>
                        <h5 className="border-bottom pb-2">4. Biến thể màu sắc (Variants)</h5>
                        {product.variants.map((variant, index) => (
                            <div key={index} className="card p-3 mb-3 border-dashed">
                                <div className="variant-card-inner">
                                    <div className="row g-2" data-testid={"v3-ap-variant-row-" + index}>
                                        <div className="col-md-4">
                                            <input type="text" placeholder="Tên màu (Titan...)" data-testid={"v3-ap-variant-name-" + index} className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)} />
                                        </div>
                                        <div className="col-md-3">
                                            <input type="color" data-testid={"v3-ap-variant-code-" + index} className="form-control form-control-color w-100 mb-2" title="Chọn mã màu" onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)} />
                                        </div>
                                        <div className="col-md-4">
                                            <input type="text" data-testid={"v3-ap-variant-img-" + index} placeholder="Link ảnh cho màu này" className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)} />
                                        </div>
                                        <div className="col-md-1">
                                            <button type="button" data-testid={"v3-ap-rm-variant-" + index} className="btn btn-danger w-100" onClick={() => removeField('variants', index)}>×</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" data-testid="v3-ap-add-variant" className="btn btn-sm btn-outline-primary" onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })}>+ Thêm biến thể màu</button>
                    </section>
                </article>

                <hr />
                <footer className="form-footer">
                    <button type="submit" data-testid="v3-ap-submit" className="btn btn-dark btn-lg w-100 rounded-pill shadow">ĐĂNG BÁN SẢN PHẨM</button>
                </footer>
            </form>
        </div>
    );
};

export default AddProduct;