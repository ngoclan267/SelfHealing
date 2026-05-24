import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditProduct = () => {
    const { category, id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/products/${category}/${id}`);
                setProduct(res.data);
            } catch (err) {
                alert("Không thể tải dữ liệu sản phẩm!");
            }
        };
        fetchProduct();
    }, [category, id]);

    const handleChange = (e) => {
        setProduct({ ...product, [e.target.name]: e.target.value });
    };

    const handleArrayChange = (index, field, subField, value) => {
        const updatedArray = [...product[field]] ||[];
        updatedArray[index] = { ...updatedArray[index], [subField]: value };
        setProduct({ ...product, [field]: updatedArray });
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
        try {
            await axios.put(`http://localhost:5000/api/products/${category}/${id}`, product, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Cập nhật thành công!");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi cập nhật!");
        }
    };

    if (!product) return <div className='text-center mt-5'>Đang tải dữ liệu...</div>;

    return (
        <div className='container mt-5 mb-5'>
            <h2 className='text-center mb-4 fw-bold text-uppercase'>Chỉnh sửa sản phẩm</h2>
            <form onSubmit={handleSubmit} className='card p-4 shadow-lg border-0 bg-light'>
                
                {/* 1. Thông tin cơ bản */}
                <section className='mb-4'>
                    <h5 className='border-bottom pb-2'>1. Thông tin cơ bản</h5>
                    <div className='row g-3'>
                        <div className='col-md-8'>
                            <label className='form-label fw-bold'>Tên sản phẩm</label>
                            <input type='text' name='name' className='form-control' value={product.name || ""} onChange={handleChange} />
                        </div>
                        <div className='col-md-4'>
                            <label className='form-label fw-bold'>Giá hiển thị (VNĐ)</label>
                            <input type='number' name='pr' className='form-control' value={product.pr || ""} onChange={handleChange} />
                        </div>
                    </div>
                </section>
                <section className='mb-4'>
                    <div className='col-md-12 mt-3'>
                        <label className='form-label fw-bold'>Mô tả chi tiết</label>
                        <textarea 
                            name='description' 
                            rows="5" 
                            className='form-control' 
                            value={product.description || ""} 
                            onChange={handleChange}
                            placeholder="Nhập giới thiệu chi tiết về sản phẩm..."
                        />
                    </div>
                </section>
                {/* 2. Thông số kỹ thuật */}
                <section className='mb-4'>
                    <h5 className="border-bottom pb-2 ">2. Thông số kỹ thuật</h5>
                    {product.specifications?.map((spec, index) => (
                        <div key={index} className="row g-2 mb-2">
                            <div className="col-5">
                                <input type="text" className="form-control" value={spec.key} placeholder="Tên thông số"
                                    onChange={(e) => handleArrayChange(index, 'specifications', 'key', e.target.value)} />
                            </div>
                            <div className="col-6">
                                <input type="text" className="form-control" value={spec.value} placeholder="Giá trị"
                                    onChange={(e) => handleArrayChange(index, 'specifications', 'value', e.target.value)} />
                            </div>
                            <div className="col-1">
                                <button type="button" className="btn btn-danger w-100" onClick={() => removeField('specifications', index)}>&times;</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addField('specifications', { key: "", value: "" })}>+ Thêm thông số</button>
                </section>

                {/* 3. Dung lượng */}
                <section className="mb-4">
                    <h5 className="border-bottom pb-2">3. Dung lượng (Gb)</h5>
                    {product.Gb?.map((item, index) => (
                        <div key={index} className="row g-2 mb-2">
                            <div className="col-5">
                                <input type="text" className="form-control" value={item.label} placeholder="Ví dụ: 256GB"
                                    onChange={(e) => handleArrayChange(index, 'Gb', 'label', e.target.value)} />
                            </div>
                            <div className="col-6">
                                <input type="number" className="form-control" value={item.price} placeholder="Giá cộng thêm"
                                    onChange={(e) => handleArrayChange(index, 'Gb', 'price', e.target.value)} />
                            </div>
                            <div className="col-1">
                                <button type="button" className="btn btn-danger w-100" onClick={() => removeField('Gb', index)}>&times;</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addField('Gb', { label: "", price: 0 })}>+ Thêm lựa chọn GB</button>
                </section>

                {/* 4. Màu sắc */}
                <section className="mb-4">
                    <h5 className="border-bottom pb-2 ">4. Biến thể màu sắc</h5>
                    {product.variants?.map((variant, index) => (
                        <div key={index} className="card p-3 mb-2 border-dashed bg-white">
                            <div className="row g-2 align-items-center">
                                <div className="col-md-3">
                                    <input type="text" className="form-control" value={variant.colorName} placeholder="Tên màu"
                                        onChange={(e) => handleArrayChange(index, 'variants', 'colorName', e.target.value)} />
                                </div>
                                <div className="col-md-2">
                                    <input type="color" className="form-control form-control-color w-100" value={variant.colorCode}
                                        onChange={(e) => handleArrayChange(index, 'variants', 'colorCode', e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <input type="text" className="form-control" value={variant.img} placeholder="Link ảnh màu sắc"
                                        onChange={(e) => handleArrayChange(index, 'variants', 'img', e.target.value)} />
                                </div>
                                <div className="col-md-1">
                                    <button type="button" className="btn btn-danger w-100" onClick={() => removeField('variants', index)}>&times;</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addField('variants', { colorName: "", colorCode: "#000000", img: "" })}>+ Thêm màu sắc</button>
                </section>
                <div className="row mt-4">
                    <div className="col-md-6">
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-lg w-100 rounded-pill">HỦY BỎ</button>
                        </div>
                        <div className="col-md-6">
                            <button type="submit" className="btn btn-dark btn-lg w-100 rounded-pill shadow">CẬP NHẬT SẢN PHẨM</button>
                        </div>
                    </div>
            </form>
        </div>
    );
};

export default EditProduct;