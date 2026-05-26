import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// V11 Changes:
// [Visual]      - Page wrapper: added backgroundColor '#f5f6fa', minHeight style
// [Visual]      - Form card: changed className from "card p-4 shadow-lg border-0 bg-light" → added inline boxShadow, backgroundColor '#fff', borderRadius '16px'
// [Visual]      - Submit button: btn-dark → btn-primary, added inline style (fontSize, letterSpacing)
// [Visual]      - Section headings (h5): added inline style color '#444', fontSize '1rem'
// [Visual]      - Remove buttons: btn-danger → btn-outline-danger
// [Visual]      - Add-more buttons: changed to btn-outline-secondary (from btn-outline-primary)
// [Context]     - Page title: "Thêm sản phẩm mới" → "Đăng sản phẩm lên hệ thống"
// [Context]     - Section 1 heading: "1. Thông tin cơ bản" → "1. Thông tin chung"
// [Context]     - Label "Tên sản phẩm" → "Tên hàng hóa"; "Danh mục" → "Loại sản phẩm"; "Giá hiển thị" → "Giá bán"
// [Context]     - Submit button text: "ĐĂNG BÁN SẢN PHẨM" → "XÁC NHẬN ĐĂNG SẢN PHẨM"
// [Context]     - Placeholder texts throughout updated to different Vietnamese text
// [Context]     - Section 2 heading: "2. Thông số kỹ thuật (Specifications)" → "2. Chi tiết kỹ thuật"
// [Context]     - Section 3 heading: "3. Dung lượng (Gb)" → "3. Tùy chọn bộ nhớ"
// [Context]     - Section 4 heading: "4. Biến thể màu sắc (Variants)" → "4. Phiên bản màu"
// [Attribute]   - data-testid="product-name" → data-id="name"
// [Attribute]   - data-testid="product-category" → data-id="category"
// [Attribute]   - data-testid="product-price" → data-id="price"
// [Attribute]   - data-testid="priduct-image" → data-id="image" (also fixing typo)
// [Attribute]   - data-testid="product-description" → data-id="description"
// [Attribute]   - data-testid="btn-add-product" (submit) → removed testid entirely
// [Attribute]   - data-testid="btn-add-spec" → data-action="add-spec"
// [Attribute]   - data-testid="btn-add-gb" → data-action="add-gb"
// [Attribute]   - data-testid="btn-add-variant" → data-action="add-variant"
// [Attribute]   - spec/gb/variant row & sub-field testids: renamed from data-testid to data-row / data-cell

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
            alert("Thêm sản phẩm thành công!");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi thêm sản phẩm");
        }
    };

    return (
        <div
            className="container mt-5 mb-5"
            style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', padding: '20px', borderRadius: '8px' }}
        >
            <h2
                className="text-center mb-4 fw-bold text-uppercase"
                style={{ letterSpacing: '1px', color: '#2d2d2d' }}
            >
                Đăng sản phẩm lên hệ thống
            </h2>

            <form
                onSubmit={handleSubmit}
                className="card p-4 border-0"
                style={{
                    boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
                    backgroundColor: '#fff',
                    borderRadius: '16px'
                }}
            >
                {/* Section 1: Thông tin chung */}
                <section className="mb-4">
                    <h5
                        className="border-bottom pb-2"
                        style={{ color: '#444', fontSize: '1rem' }}
                    >
                        1. Thông tin chung
                    </h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Tên hàng hóa</label>
                            <input
                                type="text"
                                data-id="name"
                                name="name"
                                className="form-control"
                                required
                                onChange={handleChange}
                                placeholder="Tên sản phẩm cần đăng bán"
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Loại sản phẩm</label>
                            <select
                                name="category"
                                data-id="category"
                                className="form-select"
                                onChange={handleChange}
                            >
                                <option value="iphone">iPhone</option>
                                <option value="ipad">iPad</option>
                                <option value="macbook">Macbook</option>
                                <option value="airpods">Airpods</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Giá bán</label>
                            <input
                                type="number"
                                name="pr"
                                data-id="price"
                                className="form-control"
                                required
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-md-3">
                            <input
                                type="text"
                                name="image"
                                data-id="image"
                                placeholder="URL hình ảnh đại diện"
                                className="form-control"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-bold">Mô tả chi tiết sản phẩm</label>
                            <textarea
                                name="description"
                                data-id="description"
                                className="form-control"
                                rows="3"
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>
                </section>

                {/* Section 2: Chi tiết kỹ thuật */}
                <section className="mb-4">
                    <h5
                        className="border-bottom pb-2"
                        style={{ color: '#444', fontSize: '1rem' }}
                    >
                        2. Chi tiết kỹ thuật
                    </h5>
                    {product.specifications.map((spec, index) => (
                        <div key={index} className="row g-2 mb-2" data-row={"spec-" + index}>
                            <div className="col-5">
                                <input
                                    type="text"
                                    placeholder="Thuộc tính (Màn hình, RAM...)"
                                    data-cell={"spec-key-" + index}
                                    className="form-control"
                                    value={spec.key}
                                    onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)}
                                />
                            </div>
                            <div className="col-6">
                                <input
                                    type="text"
                                    placeholder="Giá trị tương ứng"
                                    data-cell={"spec-value-" + index}
                                    className="form-control"
                                    value={spec.value}
                                    onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)}
                                />
                            </div>
                            <div className="col-1">
                                <button
                                    type="button"
                                    data-cell={"remove-spec-" + index}
                                    className="btn btn-outline-danger w-100"
                                    onClick={() => removeField('specifications', index)}
                                >×</button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        data-action="add-spec"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => addField('specifications', { key: "", value: "" })}
                    >
                        + Thêm thuộc tính
                    </button>
                </section>

                {/* Section 3: Tùy chọn bộ nhớ */}
                <section className="mb-4">
                    <h5
                        className="border-bottom pb-2"
                        style={{ color: '#444', fontSize: '1rem' }}
                    >
                        3. Tùy chọn bộ nhớ
                    </h5>
                    {product.Gb.map((item, index) => (
                        <div key={index} className="row g-2 mb-2" data-row={"gb-" + index}>
                            <div className="col-5">
                                <input
                                    type="text"
                                    placeholder="Dung lượng (128GB, 256GB...)"
                                    data-cell={"gb-label-" + index}
                                    className="form-control"
                                    onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)}
                                />
                            </div>
                            <div className="col-6">
                                <input
                                    type="number"
                                    placeholder="Giá bán cho dung lượng này"
                                    data-cell={"gb-price-" + index}
                                    className="form-control"
                                    onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)}
                                />
                            </div>
                            <div className="col-1">
                                <button
                                    type="button"
                                    data-cell={"remove-gb-" + index}
                                    className="btn btn-outline-danger w-100"
                                    onClick={() => removeField('Gb', index)}
                                >×</button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        data-action="add-gb"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => addField('Gb', { label: "", price: 0 })}
                    >
                        + Thêm tùy chọn dung lượng
                    </button>
                </section>

                {/* Section 4: Phiên bản màu */}
                <section className="mb-4">
                    <h5
                        className="border-bottom pb-2"
                        style={{ color: '#444', fontSize: '1rem' }}
                    >
                        4. Phiên bản màu
                    </h5>
                    {product.variants.map((variant, index) => (
                        <div key={index} className="card p-3 mb-3">
                            <div className="row g-2" data-row={"variant-" + index}>
                                <div className="col-md-4">
                                    <input
                                        type="text"
                                        placeholder="Tên màu (Đen, Trắng, Titan...)"
                                        data-cell={"variant-colorname-" + index}
                                        className="form-control mb-2"
                                        onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <input
                                        type="color"
                                        data-cell={"variant-colorcode-" + index}
                                        className="form-control form-control-color w-100 mb-2"
                                        title="Chọn mã màu sắc"
                                        onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <input
                                        type="text"
                                        data-cell={"variant-img-" + index}
                                        placeholder="Đường dẫn ảnh màu này"
                                        className="form-control mb-2"
                                        onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-1">
                                    <button
                                        type="button"
                                        data-cell={"remove-variant-" + index}
                                        className="btn btn-outline-danger w-100"
                                        onClick={() => removeField('variants', index)}
                                    >×</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        data-action="add-variant"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })}
                    >
                        + Thêm phiên bản màu
                    </button>
                </section>

                <hr />
                <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 rounded-pill shadow"
                    style={{ fontSize: '1rem', letterSpacing: '1px' }}
                >
                    XÁC NHẬN ĐĂNG SẢN PHẨM
                </button>
            </form>
        </div>
    );
};

export default AddProduct;