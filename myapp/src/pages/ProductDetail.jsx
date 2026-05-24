import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const ProductDetail = () => {
    const {category, id } = useParams(); 
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedGb, setSelectedGb] = useState(null);

    useEffect(() => {
        window.scrollTo(0,0);
        setProduct(null);
        axios.get(`http://localhost:5000/api/products/${category}/${id}`).then(res => {
            const data = res.data;
            setProduct(data);
            
            if (data.variants && data.variants.length > 0) {
                setSelectedVariant(data.variants[0]);
            }
            if (data.Gb && data.Gb.length > 0) {
                setSelectedGb(data.Gb[0]);
            }
        }).catch(err => console.error("Lỗi lấy chi tiết sản phẩm:", err));
    }, [id]);

    if (!product || !selectedVariant || !selectedGb) 
        return <div className="text-center mt-5 p-5"><h3>Đang tải dữ liệu sản phẩm...</h3></div>;

    return (
        <div className="container-fluid p-0"> 
            {/* PHẦN 1: MUA HÀNG (Ảnh và Lựa chọn) */}
            <div className="row g-0 align-items-stretch" style={{ minHeight: '90vh' }}>
                
                {/* CỘT TRÁI: ẢNH */}
                <div className="col-lg-5 d-flex align-items-center justify-content-center bg-white border-end">
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center p-4">
                        <img 
                            key={selectedVariant.img} 
                            src={selectedVariant.img} 
                            alt={product.name} 
                            className="fade-in img-fluid"
                            style={{ 
                                maxHeight: '75vh', 
                                objectFit: 'contain',
                                transition: 'all 0.5s ease-in-out'
                            }} 
                        />
                    </div>
                </div>

                {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
                <div className="col-lg-7 p-5 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="sticky-top" style={{ top: '2rem' }}>
                        <nav aria-label="breadcrumb" className="mb-2">
                            <Link to="/product" className="text-decoration-none small text-muted">← Quay lại sản phẩm</Link>
                        </nav>
                        
                        <h1 className="display-5 fw-bold mb-3" style={{ fontSize: '40px' }}>{product.name}</h1>
                        
                        <div className="mb-4">
                            <h2 className="text-danger fw-bold m-0" style={{ fontSize: '35px' }}>
                                {Number(selectedGb.price).toLocaleString()} <small style={{ fontSize: '24px' }}>VND</small>
                            </h2>
                            <span className="badge bg-success-subtle text-success mt-2">Còn hàng</span>
                        </div>

                        <hr className="my-4" />

                        {/* Chọn Dung lượng */}
                        <div className="mb-4">
                            <p className="fw-bold mb-3 text-uppercase small">Dung lượng: <span className="text-primary">{selectedGb.label}</span></p>
                            <div className="d-flex gap-2">
                                {product.Gb.map((g, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedGb(g)}
                                        className={`btn btn-lg py-3 ${selectedGb.label?.trim() === g.label?.trim() ? 'btn-primary shadow' : 'btn-outline-dark'}`}
                                        style={{ minWidth: '80px', borderRadius: '10px', fontWeight: '600', fontSize: '14px' }}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chọn Màu sắc */}
                        <div className="mb-5">
                            <p className="fw-bold mb-3 text-uppercase small">Màu sắc: <span className="text-muted">{selectedVariant.colorName}</span></p>
                            <div className="d-flex gap-3">
                                {product.variants.map((v, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedVariant(v)}
                                        title={v.colorName}
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            backgroundColor: v.colorCode,
                                            border: selectedVariant.colorName === v.colorName ? '4px solid #0071e3' : '2px solid #dee2e6',
                                            padding: '2px',
                                            transition: '0.2s transform'
                                        }}
                                        className={selectedVariant.colorName === v.colorName ? 'scale-110 shadow' : ''}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Box chọn phiên bản*/}
                        <div className="card border-0 bg-white rounded-4 p-4 mb-4 shadow-sm">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Phiên bản:</span>
                                <span className="fw-bold">{selectedGb.label}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Màu máy:</span>
                                <span className="fw-bold">{selectedVariant.colorName}</span>
                            </div>
                            <Link to="/contact" className="btn btn-primary btn-lg w-100 rounded-pill fw-bold py-3 shadow">
                                Liên hệ với chúng tôi để được tư vấn
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* PHẦN 2: MÔ TẢ SẢN PHẨM (Nằm bên dưới) */}
            <div className="container py-5 mt-4">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div div className ="p-5 bg-white rounded-4 shadow-sm border">
                            <h3 className="fw-bold mb-4 pb-2 border-bottom">Mô tả sản phẩm</h3>
                            <div className="product-description" style={{ lineHeight: '1.8', fontSize: '17px', color: '#444' }}>
                                {/* Render nội dung description từ database */}
                                {product.description ? (
                                    <p style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
                                ) : (
                                    <p className="text-muted italic">Đang cập nhật nội dung mô tả sản phẩm...</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-white rounded-4 shadow-sm border">
                            <h4 className="fw-bold mb-4 text-center">Thông số kỹ thuật</h4>
                            <table className="table table-hover border-top">
                                <tbody>
                                    {product.specifications && product.specifications.length > 0 ? (
                                        product.specifications.map((item, index) => (
                                            <tr key={index}>
                                                <td className="fw-bold text-muted py-3" style={{ width: '35%', fontSize: '14px' }}>
                                                    {item.key}
                                                </td>
                                                <td className="py-3" style={{ fontSize: '14px' }}>
                                                    {item.value}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="text-center text-muted py-4">
                                                Đang cập nhật thông số...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;