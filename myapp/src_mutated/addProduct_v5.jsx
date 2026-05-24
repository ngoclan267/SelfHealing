import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// V5: Context only - breadcrumb, section descriptions, nearby helper text near each field
// data-testid DELETED completely
// UNCHANGED: text labels/button, id, name, placeholder, structure, visual

const AddProduct = () => {
    const navigate = useNavigate();
    const [product, setProduct] = useState({
        name: "", description: "", pr: 0, category: "iphone", image: "",
        specifications: [{ key: "", value: "" }],
        Gb: [{ label: "", price: 0 }],
        variants: [{ colorName: "", colorCode: "", img: "" }]
    });
    const [errors] = useState({
        name: "",
        pr: ""
    });
    const handleChange = (e) => setProduct({ ...product, [e.target.name]: e.target.value });
    const handleArrayChange = (index, field, subField, value) => {
        setProduct(prev => { const a = [...prev[field]]; a[index] = { ...a[index], [subField]: value }; return { ...prev, [field]: a }; });
    };
    const addField = (field, def) => setProduct({ ...product, [field]: [...product[field], def] });
    const removeField = (field, index) => setProduct({ ...product, [field]: product[field].filter((_, i) => i !== index) });
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = sessionStorage.getItem('token');
        const clean = product.specifications.filter(s => s.key.trim() && s.value.trim());
        const img = Array.isArray(product.image) ? product.image : [product.image];
        try {
            await axios.post(`http://localhost:5000/api/products/${product.category}`, { ...product, specifications: clean, image: img }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Thêm sản phẩm thành công!"); navigate("/");
        } catch (err) { alert(err.response?.data?.message || "Lỗi khi thêm sản phẩm"); }
    };
    return (
        <div className="container mt-5 mb-5">
            {/* Context: breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb small">
                    <li className="breadcrumb-item"><a href="/">Trang chủ</a></li>
                    <li className="breadcrumb-item"><a href="/product">Sản phẩm</a></li>
                    <li className="breadcrumb-item active">Thêm mới</li>
                </ol>
            </nav>
            <h2 className="text-center mb-2 fw-bold text-uppercase">Thêm sản phẩm mới</h2>
            {/* Context: page description */}
            <p className="text-center text-muted mb-4 small">Điền đầy đủ thông tin để sản phẩm hiển thị đúng trên trang bán hàng</p>
            <form onSubmit={handleSubmit} className="card p-4 shadow-lg border-0 bg-light">
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">1. Thông tin cơ bản</h5>
                    {/* Context: section description */}
                    <p className="text-muted small mb-3">Thông tin này hiển thị trực tiếp trên trang danh sách sản phẩm.</p>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Tên sản phẩm</label>
                            <small className="text-muted d-block mb-1">VD: iPhone 16 Pro Max 256GB</small>
                            <input type="text" name="name" className={`form-control ${errors.name ? "is-invalid" : ""}`} onChange={handleChange} placeholder="Ví dụ: iPhone 16 Pro Max" />
                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Danh mục</label>
                            <small className="text-muted d-block mb-1">Chọn đúng để lọc chính xác</small>
                            <select name="category" className="form-select" onChange={handleChange}>
                                <option value="iphone">iPhone</option>
                                <option value="ipad">iPad</option>
                                <option value="macbook">Macbook</option>
                                <option value="airpods">Airpods</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Giá hiển thị</label>
                            <small className="text-muted d-block mb-1">Giá thấp nhất, đơn vị VND</small>
                            <input type="number" name="pr" className={`form-control ${errors.pr ? "is-invalid" : ""}`} onChange={handleChange} min="0" />
                            {errors.pr && <div className="invalid-feedback">{errors.pr}</div>}
                        </div>
                        <div className="col-md-3">
                            <small className="text-muted d-block mb-1">URL ảnh đại diện sản phẩm</small>
                            <input type="text" name="image" placeholder="Link ảnh" className="form-control" onChange={handleChange} />
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-bold">Mô tả sản phẩm</label>
                            <small className="text-muted d-block mb-1">Tối đa 2000 ký tự, nên mô tả điểm nổi bật</small>
                            <textarea name="description" className="form-control" rows="3" onChange={handleChange}></textarea>
                        </div>
                    </div>
                </section>
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">2. Thông số kỹ thuật (Specifications)</h5>
                    <p className="text-muted small mb-3">Thêm các thông số như chip, RAM, màn hình... để khách hàng so sánh.</p>
                    {product.specifications.map((spec, index) => (
                        <div key={index} className="row g-2 mb-2" data-testid={"spec-row-" + index}>
                            <div className="col-5"><input type="text" placeholder="Ví dụ: Màn hình" className="form-control" value={spec.key} onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)} /></div>
                            <div className="col-6"><input type="text" placeholder="Ví dụ: 6.9 inch" className="form-control" value={spec.value} onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)} /></div>
                            <div className="col-1"><button type="button" className="btn btn-danger w-100" onClick={() => removeField('specifications', index)}>×</button></div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addField('specifications', { key: "", value: "" })}>+ Thêm thông số</button>
                </section>
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">3. Dung lượng (Gb)</h5>
                    <p className="text-muted small mb-3">Mỗi dung lượng có thể có mức giá khác nhau.</p>
                    {product.Gb.map((item, index) => (
                        <div key={index} className="row g-2 mb-2" data-testid={"gb-row-" + index}>
                            <div className="col-5"><input type="text" placeholder="Dung lượng (256 GB...)" className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)} /></div>
                            <div className="col-6"><input type="number" placeholder="Giá tương ứng" className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)} /></div>
                            <div className="col-1"><button type="button" className="btn btn-danger w-100" onClick={() => removeField('Gb', index)}>×</button></div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addField('Gb', { label: "", price: 0 })}>+ Thêm lựa chọn GB</button>
                </section>
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">4. Biến thể màu sắc (Variants)</h5>
                    <p className="text-muted small mb-3">Mỗi màu sắc cần có ảnh riêng để hiển thị khi chọn màu.</p>
                    {product.variants.map((variant, index) => (
                        <div key={index} className="card p-3 mb-3 border-dashed">
                            <div className="row g-2" data-testid={"variant-row-" + index}>
                                <div className="col-md-4"><input type="text" placeholder="Tên màu (Titan...)" className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)} /></div>
                                <div className="col-md-3"><input type="color" className="form-control form-control-color w-100 mb-2" title="Chọn mã màu" onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)} /></div>
                                <div className="col-md-4"><input type="text" placeholder="Link ảnh cho màu này" className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)} /></div>
                                <div className="col-md-1"><button type="button" className="btn btn-danger w-100" onClick={() => removeField('variants', index)}>×</button></div>
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })}>+ Thêm biến thể màu</button>
                </section>
                <hr />
                {/* Context: disclaimer before submit */}
                <small className="text-muted d-block text-center mb-3">Sau khi đăng, sản phẩm sẽ hiển thị ngay trên trang. Kiểm tra kỹ trước khi xác nhận.</small>
                <button type="submit" className="btn btn-dark btn-lg w-100 rounded-pill shadow">ĐĂNG BÁN SẢN PHẨM</button>
            </form>
        </div>
    );
};
export default AddProduct;