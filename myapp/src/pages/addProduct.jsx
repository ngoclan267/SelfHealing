import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// V4: Visual only - each section is a white card, indigo accents, custom input styles
// data-testid prefix "v4-ap-"
// UNCHANGED: text labels/button, id, name, placeholder, structure DOM, context

const AddProduct = () => {
    const navigate = useNavigate();
    const [product, setProduct] = useState({
        name: "", description: "", pr: 0, category: "iphone", image: "",
        specifications: [{ key: "", value: "" }],
        Gb: [{ label: "", price: 0 }],
        variants: [{ colorName: "", colorCode: "", img: "" }]
    });
    const [errors] = useState({});
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
    const inp = { borderRadius: '6px', border: '1.5px solid #e2e8f0', padding: '10px 14px', fontSize: '14px', width: '100%' };
    const lbl = { fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' };
    const sectionHead = { color: '#667eea', borderBottom: '2px solid #667eea', paddingBottom: '8px', marginBottom: '20px' };
    const inpErr = {
        ...inp,
        border: "1.5px solid red"
    };

    const errTxt = {
        color: "red",
        fontSize: "12px",
        marginTop: "4px"
    };
    return (
        <div style={{ backgroundColor: '#f7fafc', minHeight: '100vh', padding: '40px 0' }}>
            <div className="container" style={{ maxWidth: '720px' }}>
                <h2 className="fw-bold mb-5 text-center" style={{ fontSize: '24px', color: '#2d3748' }}>Thêm sản phẩm mới</h2>
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
                        <h6 className="fw-bold" style={sectionHead}>1. Thông tin cơ bản</h6>
                        <div className="mb-3"><label style={lbl}>Tên sản phẩm</label><input type="text" data-testid="v4-ap-name" name="name" style={errors.name ? inpErr : inp} onChange={handleChange} placeholder="Ví dụ: iPhone 16 Pro Max" />
                            {errors.name && <p style={errTxt}>{errors.name}</p>}
                        </div>
                        <div className="row g-3 mb-3">
                            <div className="col-6"><label style={lbl}>Danh mục</label><select name="category" data-testid="v4-ap-category" style={inp} onChange={handleChange}><option value="iphone">iPhone</option><option value="ipad">iPad</option><option value="macbook">Macbook</option><option value="airpods">Airpods</option></select></div>
                            <div className="col-6"><label style={lbl}>Giá hiển thị</label><input type="number" name="pr" data-testid="v4-ap-price" style={errors.pr ? inpErr : inp} onChange={handleChange} min="0" />
                                {errors.pr && <p style={errTxt}>{errors.pr}</p>}
                            </div>
                        </div>
                        <div className="mb-3"><label style={lbl}>Link ảnh</label><input type="text" name="image" data-testid="v4-ap-image" style={inp} placeholder="Link ảnh" onChange={handleChange} /></div>
                        <div className="mb-3"><label style={lbl}>Mô tả sản phẩm</label><textarea name="description" data-testid="v4-ap-description" style={{ ...inp, resize: 'vertical' }} rows="3" onChange={handleChange}></textarea></div>
                    </div>

                    <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
                        <h6 className="fw-bold" style={sectionHead}>2. Thông số kỹ thuật (Specifications)</h6>
                        {product.specifications.map((spec, index) => (
                            <div key={index} className="d-flex gap-2 mb-2" data-testid={"v4-ap-spec-row-" + index}>
                                <input type="text" placeholder="Ví dụ: Màn hình" data-testid={"v4-ap-spec-key-" + index} style={{ ...inp, flex: 5 }} value={spec.key} onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)} />
                                <input type="text" placeholder="Ví dụ: 6.9 inch" data-testid={"v4-ap-spec-val-" + index} style={{ ...inp, flex: 6 }} value={spec.value} onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)} />
                                <button type="button" data-testid={"v4-ap-rm-spec-" + index} onClick={() => removeField('specifications', index)} style={{ background: '#fed7d7', border: 'none', borderRadius: '6px', padding: '0 12px', color: '#c53030', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
                            </div>
                        ))}
                        <button type="button" data-testid="v4-ap-add-spec" onClick={() => addField('specifications', { key: "", value: "" })} style={{ fontSize: '13px', color: '#667eea', background: 'none', border: '1px dashed #667eea', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer' }}>+ Thêm thông số</button>
                    </div>

                    <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
                        <h6 className="fw-bold" style={sectionHead}>3. Dung lượng (Gb)</h6>
                        {product.Gb.map((item, index) => (
                            <div key={index} className="d-flex gap-2 mb-2" data-testid={"v4-ap-gb-row-" + index}>
                                <input type="text" placeholder="Dung lượng (256 GB...)" data-testid={"v4-ap-gb-label-" + index} style={{ ...inp, flex: 5 }} onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)} />
                                <input type="number" placeholder="Giá tương ứng" data-testid={"v4-ap-gb-price-" + index} style={{ ...inp, flex: 6 }} onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)} />
                                <button type="button" data-testid={"v4-ap-rm-gb-" + index} onClick={() => removeField('Gb', index)} style={{ background: '#fed7d7', border: 'none', borderRadius: '6px', padding: '0 12px', color: '#c53030', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
                            </div>
                        ))}
                        <button type="button" data-testid="v4-ap-add-gb" onClick={() => addField('Gb', { label: "", price: 0 })} style={{ fontSize: '13px', color: '#667eea', background: 'none', border: '1px dashed #667eea', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer' }}>+ Thêm lựa chọn GB</button>
                    </div>

                    <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
                        <h6 className="fw-bold" style={sectionHead}>4. Biến thể màu sắc (Variants)</h6>
                        {product.variants.map((variant, index) => (
                            <div key={index} className="d-flex gap-2 mb-2 align-items-center" data-testid={"v4-ap-variant-row-" + index}>
                                <input type="text" placeholder="Tên màu (Titan...)" data-testid={"v4-ap-variant-name-" + index} style={{ ...inp, flex: 4 }} onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)} />
                                <input type="color" data-testid={"v4-ap-variant-code-" + index} style={{ width: '48px', height: '42px', border: '1.5px solid #e2e8f0', borderRadius: '6px', padding: '2px', cursor: 'pointer' }} onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)} />
                                <input type="text" placeholder="Link ảnh cho màu này" data-testid={"v4-ap-variant-img-" + index} style={{ ...inp, flex: 4 }} onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)} />
                                <button type="button" data-testid={"v4-ap-rm-variant-" + index} onClick={() => removeField('variants', index)} style={{ background: '#fed7d7', border: 'none', borderRadius: '6px', padding: '8px 12px', color: '#c53030', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
                            </div>
                        ))}
                        <button type="button" data-testid="v4-ap-add-variant" onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })} style={{ fontSize: '13px', color: '#667eea', background: 'none', border: '1px dashed #667eea', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer' }}>+ Thêm biến thể màu</button>
                    </div>

                    <button type="submit" data-testid="v4-ap-submit"
                        style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer' }}>
                        ĐĂNG BÁN SẢN PHẨM
                    </button>
                </form>
            </div>
        </div>
    );
};
export default AddProduct;