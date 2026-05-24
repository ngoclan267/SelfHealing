import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
    const navigate = useNavigate();
    const [product, setProduct] = useState({
        name: "", description: "", pr: 0, category: "iphone", image: "",
        specifications: [{ key: "", value: "" }], Gb: [{ label: "", price: 0 }],
        variants: [{ colorName: "", colorCode: "", img: "" }]
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
        } catch (err) { alert(err.response?.data?.message || "Lỗi"); }
    };
    return (
        <div className="container mt-5 mb-5">
            <h2 className="text-center mb-4 fw-bold text-uppercase">Đăng ký sản phẩm mới</h2>
            <form onSubmit={handleSubmit} className="card p-4 shadow-lg border-0 bg-light">
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">A. Thông tin nhận diện sản phẩm</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Tên hàng hoá</label>
                            <input type="text" id="ap-product-name" data-testid="v6-ap-name" name="productTitle"
                                aria-label="Tên hàng hoá cần đăng ký"
                                className="form-control" required onChange={handleChange} placeholder="VD: iPhone 16 Pro Max" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Phân loại</label>
                            <select id="ap-category" name="productCategory" data-testid="v6-ap-category"
                                aria-label="Chọn phân loại sản phẩm" className="form-select" onChange={handleChange}>
                                <option value="iphone">iPhone</option><option value="ipad">iPad</option>
                                <option value="macbook">Macbook</option><option value="airpods">Airpods</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Mức giá khởi điểm</label>
                            <input type="number" id="ap-product-price" name="basePrice" data-testid="v6-ap-price"
                                aria-label="Mức giá khởi điểm" className="form-control" required onChange={handleChange} />
                        </div>
                        <div className="col-md-3">
                            <input type="text" id="ap-product-img" name="imageUrl" data-testid="v6-ap-image"
                                aria-label="URL hình ảnh" placeholder="Đường dẫn ảnh" className="form-control" onChange={handleChange} />
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-bold">Giới thiệu sản phẩm</label>
                            <textarea id="ap-product-desc" name="productDescription" data-testid="v6-ap-description"
                                aria-label="Nội dung giới thiệu sản phẩm"
                                className="form-control" rows="3" onChange={handleChange}></textarea>
                        </div>
                    </div>
                </section>
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">B. Cấu hình kỹ thuật</h5>
                    {product.specifications.map((spec, index) => (
                        <div key={index} className="row g-2 mb-2" data-testid={"v6-ap-spec-row-" + index}>
                            <div className="col-5"><input type="text" placeholder="Tên thông số" data-testid={"v6-ap-spec-key-" + index} className="form-control" value={spec.key} onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)} /></div>
                            <div className="col-6"><input type="text" placeholder="Giá trị" data-testid={"v6-ap-spec-val-" + index} className="form-control" value={spec.value} onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)} /></div>
                            <div className="col-1"><button type="button" data-testid={"v6-ap-rm-spec-" + index} className="btn btn-danger w-100" onClick={() => removeField('specifications', index)}>×</button></div>
                        </div>
                    ))}
                    <button type="button" data-testid="v6-ap-add-spec" className="btn btn-sm btn-outline-primary" onClick={() => addField('specifications', { key: "", value: "" })}>+ Bổ sung thông số</button>
                </section>
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">C. Phiên bản lưu trữ</h5>
                    {product.Gb.map((item, index) => (
                        <div key={index} className="row g-2 mb-2" data-testid={"v6-ap-gb-row-" + index}>
                            <div className="col-5"><input type="text" placeholder="Dung lượng (256 GB...)" data-testid={"v6-ap-gb-label-" + index} className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)} /></div>
                            <div className="col-6"><input type="number" placeholder="Giá tương ứng" data-testid={"v6-ap-gb-price-" + index} className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)} /></div>
                            <div className="col-1"><button type="button" data-testid={"v6-ap-rm-gb-" + index} className="btn btn-danger w-100" onClick={() => removeField('Gb', index)}></button></div>
                        </div>
                    ))}
                    <button type="button" data-testid="v6-ap-add-gb" className="btn btn-sm btn-outline-primary" onClick={() => addField('Gb', { label: "", price: 0 })}>+ Thêm phiên bản lưu trữ</button>
                </section>
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">D. Tuỳ chọn màu sắc</h5>
                    {product.variants.map((variant, index) => (
                        <div key={index} className="card p-3 mb-3 border-dashed">
                            <div className="row g-2" data-testid={"v6-ap-variant-row-" + index}>
                                <div className="col-md-4"><input type="text" placeholder="Tên màu" data-testid={"v6-ap-variant-name-" + index} className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)} /></div>
                                <div className="col-md-3"><input type="color" data-testid={"v6-ap-variant-code-" + index} className="form-control form-control-color w-100 mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)} /></div>
                                <div className="col-md-4"><input type="text" placeholder="URL ảnh màu" data-testid={"v6-ap-variant-img-" + index} className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)} /></div>
                                <div className="col-md-1"><button type="button" data-testid={"v6-ap-rm-variant-" + index} className="btn btn-danger w-100" onClick={() => removeField('variants', index)}>×</button></div>
                            </div>
                        </div>
                    ))}
                    <button type="button" data-testid="v6-ap-add-variant" className="btn btn-sm btn-outline-primary" onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })}>+ Thêm màu sắc mới</button>
                </section>
                <hr />
                <button type="submit" data-testid="v6-ap-submit" aria-label="Xác nhận đăng sản phẩm"
                    className="btn btn-dark btn-lg w-100 rounded-pill shadow">XÁC NHẬN ĐĂNG SẢN PHẨM</button>
            </form>
        </div>
    );
};
export default AddProduct;