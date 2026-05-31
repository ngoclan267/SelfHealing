import { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// V4: Visual only - horizontal list cards, search with icon prefix, buttons styled differently
// data-testid prefix "v4-"
// UNCHANGED: text labels/button, id, name, placeholder, structure logic, context
// Visual changes vs original:
//   - Layout: horizontal list cards thay vì grid 4 cột
//   - Search: có icon prefix 🔍, border style khác
//   - Filter buttons: pill shape giữ nhưng màu nền trang trắng thuần, gap nhỏ hơn
//   - Add button: nằm inline cạnh search thay vì dòng riêng
//   - Product card: horizontal row (ảnh trái | tên giữa | giá+actions phải)
//   - Button styles: btn-dark thay vì btn-outline-dark cho "Xem chi tiết"

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

    useEffect(() => { setRole(sessionStorage.getItem('role')); fetchProducts(); }, []);

    const fetchProducts = () => {
        setLoading(true);
        axios.get("http://localhost:5000/api/products")
            .then(res => {
                if (Array.isArray(res.data)) { setAllProducts(res.data); applyFilter(res.data, activeCategory); }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const applyFilter = (data, cat) =>
        setProducts(cat === 'Tất cả' ? data : data.filter(p => p.category === cat));

    const handleFilter = (cat) => { setActiveCategory(cat); applyFilter(allProducts, cat); };

    const handleDelete = async (cat, id) => {
        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/products/${cat}/${id}`, {
                headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            });
            alert("Xóa thành công!"); fetchProducts();
        } catch (err) { alert(err.response?.data?.message || "Lỗi khi xóa"); }
    };

    const searched = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading) return <div className="text-center mt-5">Đang tải sản phẩm...</div>;

    return (
        // Visual: nền trắng thuần, không container-fluid
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
            <div className="container py-5">

                {/* Visual: title có border-left accent thay vì text-center */}
                <h2 className="mb-5 fw-bold" style={{ fontSize: '32px', borderLeft: '4px solid #007bff', paddingLeft: '16px' }}>
                    Khám phá sản phẩm
                </h2>

                {/* Visual: search + add button cùng hàng, search có icon prefix */}
                <div className="row align-items-center mb-4 g-3">
                    <div className="col-md-8">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0"
                                style={{ borderRight: 'none' }}>🔍</span>
                            <input
                                type="text"
                                id="search-input"
                                data-testid="v4-search-input"
                                className="form-control border-start-0 ps-0"
                                style={{ boxShadow: 'none', borderLeft: 'none' }}
                                placeholder="Tìm kiếm sản phẩm (Viết đúng chính tả...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {role === 'admin' && (
                        <div className="col-md-4 text-end">
                            <Link to="/admin/add-product" data-testid="v4-btn-add-product"
                                className="btn btn-success px-4"
                                style={{ borderRadius: '6px', fontWeight: '600' }}>
                                + Thêm sản phẩm mới
                            </Link>
                        </div>
                    )}
                </div>

                {/* Visual: filter buttons - vẫn là buttons nhưng style khác gốc:
                    - Không rounded-pill, dùng border-radius vuông hơn (6px)
                    - Active dùng màu #007bff solid thay vì btn-dark
                    - Inactive dùng nền xám nhạt thay vì btn-outline-dark
                    - Gap nhỏ hơn (gap-1 thay vì gap-2)
                    - justify-content-start thay vì center */}
                <div className="d-flex justify-content-start gap-1 mb-5 flex-wrap">
                    {['Tất cả',  'macbook','iphone', 'airpods', 'ipad'].map(cat => (
                        <button
                            key={cat}
                            data-testid={`v4-btn-filter-${cat === 'Tất cả' ? 'all' : cat}`}
                            onClick={() => handleFilter(cat)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: activeCategory === cat ? '#007bff' : '#f0f0f0',
                                color: activeCategory === cat ? '#fff' : '#555',
                                transition: 'all 0.15s'
                            }}
                        >
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Visual: horizontal list thay vì grid 4 cột */}
                <div className="d-flex flex-column gap-3">
                    {searched.length > 0 ? searched.map(p => (
                        <div key={p._id} className="card border-0 shadow-sm"
                            style={{ borderRadius: '8px', borderLeft: '3px solid #007bff' }}>
                            <div className="row g-0 align-items-center">
                                {/* Visual: ảnh nhỏ bên trái */}
                                <div className="col-3 col-md-2">
                                    <img
                                        src={p.image || (p.variants && p.variants[0]?.img) || "https://via.placeholder.com/150"}
                                        className="img-fluid"
                                        alt={p.name}
                                        style={{ height: '100px', objectFit: 'contain', padding: '10px' }}
                                    />
                                </div>

                                {/* Visual: tên + category badge giữa */}
                                <div className="col-5 col-md-6 px-3">
                                    <h6 className="fw-bold mb-1" style={{ fontSize: '15px' }}>{p.name}</h6>
                                    <span className="badge text-bg-light text-capitalize"
                                        style={{ fontSize: '11px' }}>{p.category}</span>
                                </div>

                                {/* Visual: giá + actions bên phải, căn phải */}
                                <div className="col-4 col-md-4 text-end pe-3 d-flex flex-column align-items-end gap-2">
                                    <span className="fw-bold text-danger"
                                        style={{ fontSize: '15px' }}>
                                        {Number(p.pr || p.price).toLocaleString()} VND
                                    </span>
                                    {/* Visual: btn-dark thay vì btn-outline-dark, border-radius vuông */}
                                    <Link to={`/product/${p.category}/${p._id}`}
                                        data-testid={`v4-btn-view-${p._id}`}
                                        className="btn btn-sm btn-dark px-3"
                                        style={{ borderRadius: '4px', fontSize: '13px' }}>
                                        Xem chi tiết
                                    </Link>
                                    {role === 'admin' && (
                                        <div className="d-flex gap-1">
                                            <button
                                                onClick={() => handleDelete(p.category, p._id)}
                                                data-testid={`v4-btn-delete-${p._id}`}
                                                className='btn btn-sm btn-outline-danger px-2'
                                                style={{ borderRadius: '4px', fontSize: '12px' }}>
                                                Xóa sản phẩm
                                            </button>
                                            <button
                                                data-testid={`v4-btn-edit-${p._id}`}
                                                className='btn btn-sm btn-outline-warning px-2'
                                                style={{ borderRadius: '4px', fontSize: '12px' }}
                                                onClick={() => navigate(`/edit-product/${p.category}/${p._id}`)}>
                                                Sửa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-5">
                            <p className="text-muted fs-5">Không có sản phẩm nào trong danh mục này.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
export default Products;