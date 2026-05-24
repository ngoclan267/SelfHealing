import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
            alert("Sản phẩm đã được đăng bán thành công!");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.message || "Thêm sản phẩm thất bại");
        }
    };

    const sectionStyle = {
        background: '#f0f8f6',
        border: '1px solid #b2d8d0',
        borderRadius: '8px',
        padding: '28px',
        marginBottom: '24px'
    };

    const inputStyle = {
        width: '100%',
        border: '1px solid #b2d8d0',
        borderRadius: '6px',
        padding: '10px 14px',
        fontSize: '14px',
        background: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        color: '#1a3a35'
    };

    const labelStyle = {
        display: 'block',
        color: '#2a7a6a',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: '6px'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #e8f5f2 0%, #f0f8f6 100%)',
            padding: '40px 16px',
            fontFamily: "'Segoe UI', sans-serif"
        }}>
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>

                {/* BIẾN THỂ MÀU trước — đảo thứ tự section */}
                <div style={sectionStyle}>
                    <h5 style={{ color: '#1a5a4a', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 20px', paddingBottom: '12px', borderBottom: '2px solid #b2d8d0' }}>
                        ◈ PHỐI MÀU &amp; HÌNH ẢNH
                    </h5>
                    {product.variants.map((variant, index) => (
                        <div key={index} style={{ background: '#fff', border: '1px solid #d0ede8', borderRadius: '6px', padding: '16px', marginBottom: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '10px', alignItems: 'end' }}>
                                <div>
                                    <label style={labelStyle}>Tên màu</label>
                                    <input
                                        type="text"
                                        placeholder="VD: Titan Tự Nhiên"
                                        data-idx={index}
                                        data-group="variant"
                                        data-sub="colorName"
                                        style={inputStyle}
                                        onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Mã màu</label>
                                    <input
                                        type="color"
                                        data-idx={index}
                                        data-group="variant"
                                        data-sub="colorCode"
                                        style={{ ...inputStyle, width: '60px', height: '44px', padding: '4px' }}
                                        onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Link ảnh màu</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        data-idx={index}
                                        data-group="variant"
                                        data-sub="img"
                                        style={inputStyle}
                                        onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    data-action="remove-variant"
                                    onClick={() => removeField('variants', index)}
                                    style={{ background: '#e55', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer', fontSize: '16px' }}
                                >×</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" data-action="add-variant" onClick={() => addField('variants', { colorName: "", colorCode: "", img: "" })}
                        style={{ background: 'transparent', border: '1px dashed #2a7a6a', color: '#2a7a6a', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px' }}>
                        + Thêm phối màu
                    </button>
                </div>

                {/* DUNG LƯỢNG thứ hai — đảo thứ tự */}
                <div style={sectionStyle}>
                    <h5 style={{ color: '#1a5a4a', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 20px', paddingBottom: '12px', borderBottom: '2px solid #b2d8d0' }}>
                        ◈ CẤU HÌNH &amp; GIÁ BÁN
                    </h5>
                    {product.Gb.map((item, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end', marginBottom: '10px' }}>
                            <div>
                                <label style={labelStyle}>Cấu hình bộ nhớ</label>
                                <input
                                    type="text"
                                    placeholder="VD: 256 GB"
                                    data-idx={index}
                                    data-group="gb"
                                    data-sub="label"
                                    style={inputStyle}
                                    onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Đơn giá (VND)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    data-idx={index}
                                    data-group="gb"
                                    data-sub="price"
                                    style={inputStyle}
                                    onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)}
                                />
                            </div>
                            <button
                                type="button"
                                data-action="remove-gb"
                                onClick={() => removeField('Gb', index)}
                                style={{ background: '#e55', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer', alignSelf: 'end' }}
                            >×</button>
                        </div>
                    ))}
                    <button type="button" data-action="add-gb" onClick={() => addField('Gb', { label: "", price: 0 })}
                        style={{ background: 'transparent', border: '1px dashed #2a7a6a', color: '#2a7a6a', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px' }}>
                        + Thêm cấu hình
                    </button>
                </div>

                {/* THÔNG SỐ thứ ba */}
                <div style={sectionStyle}>
                    <h5 style={{ color: '#1a5a4a', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 20px', paddingBottom: '12px', borderBottom: '2px solid #b2d8d0' }}>
                        ◈ ĐẶC ĐIỂM KỸ THUẬT
                    </h5>
                    {product.specifications.map((spec, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end', marginBottom: '10px' }}>
                            <div>
                                <label style={labelStyle}>Tên đặc điểm</label>
                                <input
                                    type="text"
                                    placeholder="VD: Màn hình"
                                    data-idx={index}
                                    data-group="spec"
                                    data-sub="key"
                                    style={inputStyle}
                                    value={spec.key}
                                    onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Giá trị</label>
                                <input
                                    type="text"
                                    placeholder="VD: 6.9 inch OLED"
                                    data-idx={index}
                                    data-group="spec"
                                    data-sub="value"
                                    style={inputStyle}
                                    value={spec.value}
                                    onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)}
                                />
                            </div>
                            <button
                                type="button"
                                data-action="remove-spec"
                                onClick={() => removeField('specifications', index)}
                                style={{ background: '#e55', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer', alignSelf: 'end' }}
                            >×</button>
                        </div>
                    ))}
                    <button type="button" data-action="add-spec" onClick={() => addField('specifications', { key: "", value: "" })}
                        style={{ background: 'transparent', border: '1px dashed #2a7a6a', color: '#2a7a6a', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px' }}>
                        + Thêm đặc điểm
                    </button>
                </div>

                {/* THÔNG TIN CƠ BẢN cuối cùng — đảo thứ tự section */}
                <div style={sectionStyle}>
                    <h5 style={{ color: '#1a5a4a', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 20px', paddingBottom: '12px', borderBottom: '2px solid #b2d8d0' }}>
                        ◈ THÔNG TIN CHUNG
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={labelStyle}>Tên sản phẩm</label>
                            <input type="text" name="name" data-field="name" placeholder="VD: iPhone 16 Pro Max" style={inputStyle} required onChange={handleChange} />
                        </div>
                        <div>
                            <label style={labelStyle}>Giá khởi điểm</label>
                            <input type="number" name="pr" data-field="price" placeholder="0" style={inputStyle} required onChange={handleChange} />
                        </div>
                        <div>
                            <label style={labelStyle}>Phân loại</label>
                            <select name="category" data-field="category" style={inputStyle} onChange={handleChange}>
                                <option value="iphone">iPhone</option>
                                <option value="ipad">iPad</option>
                                <option value="macbook">MacBook</option>
                                <option value="airpods">AirPods</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Link ảnh đại diện</label>
                            <input type="text" name="image" data-field="image" placeholder="https://..." style={inputStyle} onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Giới thiệu sản phẩm</label>
                        <textarea name="description" data-field="desc" rows={4} placeholder="Mô tả ngắn gọn sản phẩm..." style={{ ...inputStyle, resize: 'vertical' }} onChange={handleChange} />
                    </div>
                </div>

                {/* Submit — context đổi, màu khác */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                        type="button"
                        data-action="publish"
                        onClick={handleSubmit}
                        style={{
                            background: 'linear-gradient(135deg, #1a5a4a, #2a8a6a)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '16px 64px',
                            fontSize: '14px',
                            fontWeight: '700',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(26,90,74,0.3)'
                        }}
                    >
                        ĐĂNG SẢN PHẨM LÊN HỆ THỐNG
                    </button>
                </div>

                {/* Tiêu đề ở DƯỚI CÙNG — đảo vị trí */}
                <div style={{ textAlign: 'center', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #b2d8d0' }}>
                    <p style={{ color: '#2a7a6a', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                        QUẢN TRỊ VIÊN
                    </p>
                    <h2 style={{ color: '#1a3a35', fontSize: '24px', fontWeight: '300', margin: 0 }}>
                        Thêm sản phẩm mới vào kho
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;