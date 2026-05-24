import { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// V5: Context only - breadcrumb, page subtitle, category description, product count badge
// data-testid DELETED completely
// UNCHANGED: text labels/button, id, name, placeholder, structure, visual

const Products = () => {
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const typeFromUrl = new URLSearchParams(location.search).get('type') || "Tất cả";
    const [activeCategory, setActiveCategory] = useState(typeFromUrl);
    const [role, setRole] = useState(sessionStorage.getItem('role'));

    const categoryDesc = {
        'Tất cả': 'Toàn bộ sản phẩm Apple chính hãng',
        'iphone': 'Điện thoại iPhone mới nhất từ Apple',
        'ipad': 'Máy tính bảng iPad mọi phân khúc',
        'macbook': 'Laptop MacBook Air và MacBook Pro',
        'airpods': 'Tai nghe AirPods và AirPods Pro'
    };

    useEffect(() => { setRole(sessionStorage.getItem('role')); fetchProducts(); }, []);
    const fetchProducts = () => {
        setLoading(true);
        axios.get("http://localhost:5000/api/products")
            .then(res => { if (Array.isArray(res.data)) { setAllProducts(res.data); applyFilter(res.data, activeCategory); } setLoading(false); })
            .catch(() => setLoading(false));
    };
    const applyFilter = (data, cat) => setProducts(cat === 'Tất cả' ? data : data.filter(p => p.category === cat));
    const handleFilter = (cat) => { setActiveCategory(cat); applyFilter(allProducts, cat); };
    const handleDelete = async (cat, id) => {
        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try { await axios.delete(`http://localhost:5000/api/products/${cat}/${id}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } }); alert("Xóa thành công!"); fetchProducts(); }
        catch (err) { alert(err.response?.data?.message || "Lỗi khi xóa"); }
    };
    const searched = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading) return <div className="text-center mt-5">Đang tải sản phẩm...</div>;

    return (
        <div className="container mt-4">
            {/* Context: breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb small">
                    <li className="breadcrumb-item"><a href="/">Trang chủ</a></li>
                    <li className="breadcrumb-item active">Sản phẩm</li>
                </ol>
            </nav>
            <h2 className="mb-2 text-center fw-bold">Khám phá sản phẩm</h2>
            {/* Context: page subtitle */}
            <p className="text-center text-muted mb-4 small">Sản phẩm Apple chính hãng, bảo hành 12 tháng tại cửa hàng</p>
            {role === 'admin' && (
                <div className="text-center mb-4">
                    <Link to="/admin/add-product" className="btn btn-success rounded-pill px-4 shadow">
                        <i className="bi bi-plus-lg"></i> + Thêm sản phẩm mới
                    </Link>
                </div>
            )}
            <div className="row justify-content-center mb-4">
                <div className="col-md-6">
                    <input type="text" id="search-input"
                        className="form-control rounded-pill px-4 shadow-sm"
                        placeholder="Tìm kiếm sản phẩm (Viết đúng chính tả...)"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="d-flex justify-content-center gap-2 mb-2">
                {['Tất cả', 'iphone', 'ipad', 'macbook', 'airpods'].map(cat => (
                    <button key={cat} onClick={() => handleFilter(cat)}
                        className={`btn rounded-pill px-4 ${activeCategory === cat ? 'btn-dark' : 'btn-outline-dark'}`}>
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>
            {/* Context: category description & count */}
            <div className="text-center mb-4">
                <small className="text-muted">{categoryDesc[activeCategory]} — <strong>{searched.length}</strong> sản phẩm</small>
            </div>
            <div className="row">
                {searched.length > 0 ? searched.map(p => (
                    <div className="col-md-3 mb-4" key={p._id}>
                        <div className="card shadow-sm h-100 border-0">
                            <img src={p.image || (p.variants && p.variants[0]?.img) || "https://via.placeholder.com/150"}
                                className="card-img-top" alt={p.name}
                                style={{ height: "180px", objectFit: "contain", padding: "15px" }} />
                            <div className="card-body text-center">
                                <h6 className="card-title fw-bold">{p.name}</h6>
                                <p className="text-danger fw-bold">{Number(p.pr || p.price).toLocaleString()} VND</p>
                                <Link to={`/product/${p.category}/${p._id}`} className="btn btn-outline-dark btn-sm rounded-pill w-100">Xem chi tiết</Link>
                                {role === 'admin' && (
                                    <div className="d-flex gap-2 mt-2">
                                        <button onClick={() => handleDelete(p.category, p._id)} className='btn btn-danger btn-sm rounded-pill flex-fill'>Xóa sản phẩm</button>
                                        <button className='btn btn-warning btn-sm rounded-pill flex-fill' onClick={() => navigate(`/edit-product/${p.category}/${p._id}`)}>Sửa</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center w-100 mt-5"><p className="text-muted">Không có sản phẩm nào trong danh mục này.</p></div>
                )}
            </div>
            {/* Context: footer note */}
            <div className="text-center mt-4 mb-5">
                <small className="text-muted">Giá có thể thay đổi theo thời điểm. Liên hệ để được báo giá chính xác nhất.</small>
            </div>
        </div>
    );
};
export default Products;