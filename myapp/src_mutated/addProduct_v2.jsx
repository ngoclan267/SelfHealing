import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// V2: Semantic changes only
// - Section titles, labels, button text thay đổi
// - "ĐĂNG BÁN SẢN PHẨM" -> "XÁC NHẬN ĐĂNG SẢN PHẨM"
// - "+ Thêm thông số" -> "+ Bổ sung thông số"
// - "+ Thêm lựa chọn GB" -> "+ Thêm phiên bản lưu trữ"
// - "+ Thêm biến thể màu" -> "+ Thêm màu sắc mới"
// - Section headings thay đổi
// - data-testid bị XÓA hoàn toàn

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
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setProduct({ ...product, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
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

    const validate = () => {
        const newErrors = {};
        if (!product.name.trim()) newErrors.name = "Tên hàng hoá không được để trống";
        if (!product.pr || Number(product.pr) <= 0) newErrors.pr = "Giá niêm yết phải lớn hơn 0";
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
        <div className="container mt-5 mb-5">
            <h2 className="text-center mb-4 fw-bold text-uppercase">Đăng sản phẩm lên hệ thống</h2>
            <form onSubmit={handleSubmit} className="card p-4 shadow-lg border-0 bg-light">

                <section className="mb-4">
                    <h5 className="border-bottom pb-2">A. Thông tin chính của sản phẩm</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Tên hàng hoá</label>
                            <input type="text" name="name" className={`form-control ${errors.name ? "is-invalid" : ""}`} onChange={handleChange} placeholder="Ví dụ: iPhone 16 Pro Max" />
                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Loại sản phẩm</label>
                            <select name="category" className="form-select" onChange={handleChange}>
                                <option value="iphone">iPhone</option>
                                <option value="ipad">iPad</option>
                                <option value="macbook">Macbook</option>
                                <option value="airpods">Airpods</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Giá niêm yết</label>
                            <input type="number" name="pr" className={`form-control ${errors.pr ? "is-invalid" : ""}`} onChange={handleChange} min="0" />
                            {errors.pr && <div className="invalid-feedback">{errors.pr}</div>}
                        </div>
                        <div className="col-md-3">
                            <input type="text" name="image" placeholder="URL hình ảnh đại diện" className="form-control" onChange={handleChange} />
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-bold">Giới thiệu sản phẩm</label>
                            <textarea name="description" className="form-control" rows="3" onChange={handleChange}></textarea>
                        </div>
                    </div>
                </section>

                <section className="mb-4">
                    <h5 className="border-bottom pb-2">B. Cấu hình & Thông số kỹ thuật</h5>
                    {product.specifications.map((spec, index) => (
                        <div key={index} className="row g-2 mb-2">
                            <div className="col-5">
                                <input type="text" placeholder="Tên thông số (VD: Chip)" className="form-control" value={spec.key} onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)} />
                            </div>
                            <div className="col-6">
                                <input type="text" placeholder="Chi tiết (VD: A18 Pro)" className="form-control" value={spec.value} onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)} />
                            </div>
                            <div className="col-1">
                                <button type="button" className="btn btn-danger w-100" onClick={() => removeField('specifications', index)}>×</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addField('specifications', { key: "", value: "" })}>+ Bổ sung thông số</button>
                </section>

                <section className="mb-4">
                    <h5 className="border-bottom pb-2">C. Phiên bản lưu trữ & Giá bán</h5>
                    {product.Gb.map((item, index) => (
                        <div key={index} className="row g-2 mb-2">
                            <div className="col-5">
                                <input type="text" placeholder="Dung lượng (VD: 512GB)" className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)} />
                            </div>
                            <div className="col-6">
                                <input type="number" placeholder="Mức giá cho phiên bản này" className="form-control" onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)} />
                            </div>
                            <div className="col-1">
                                <button type="button" className="btn btn-danger w-100" onClick={() => removeField('Gb', index)}>×</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addField('Gb', { label: "", price: 0 })}>+ Thêm phiên bản lưu trữ</button>
                </section>

                <section className="mb-4">
                    <h5 className="border-bottom pb-2">D. Tuỳ chọn màu sắc</h5>
                    {product.variants.map((variant, index) => (
                        <div key={index} className="card p-3 mb-3 border-dashed">
                            <div className="row g-2">
                                <div className="col-md-4">
                                    <input type="text" placeholder="Tên màu (VD: Desert Titanium)" className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)} />
                                </div>
                                <div className="col-md-3">
                                    <input type="color" className="form-control form-control-color w-100 mb-2" title="Chọn màu đại diện" onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)} />
                                </div>
                                <div className="col-md-4">
                                    <input type="text" placeholder="URL ảnh màu này" className="form-control mb-2" onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)} />
                                </div>
                                <div className="col-md-1">
                                    <button type="button" className="btn btn-danger w-100" onClick={() => removeField('variants', index)}>×</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })}>+ Thêm màu sắc mới</button>
                </section>

                <hr />
                <button type="submit" role="button" className="btn btn-dark btn-lg w-100 rounded-pill shadow">XÁC NHẬN ĐĂNG SẢN PHẨM</button>
            </form>
        </div>
    );
};

export default AddProduct;