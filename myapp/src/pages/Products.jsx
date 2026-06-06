import { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// V3: Structure only changes
// - Search input wrap thêm div.search-container > div.search-inner
// - Filter buttons nằm trong nav > ul > li thay vì div.d-flex
// - Product cards: card-body wrap thêm div.product-info
// - Admin buttons wrap thêm div.admin-controls > div.btn-row
// - "Thêm sản phẩm" nằm trong header.page-header thay vì div.text-center
// - data-testid đổi prefix "v3-prod-"

const Products = () => {
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const typeFromUrl = queryParams.get('type') || "Tất cả";
    const [activeCategory, setActiveCategory] = useState(typeFromUrl);
    const [role, setRole] = useState(sessionStorage.getItem('role'));

    useEffect(() => {
        setRole(sessionStorage.getItem('role'));
        fetchProducts();
    }, []);

    const fetchProducts = () => {
        setLoading(true);
        axios.get("http://localhost:5000/api/products").then(res => {
            if (Array.isArray(res.data)) {
                setAllProducts(res.data);
                applyFilter(res.data, activeCategory);
            }
            setLoading(false);
        }).catch(err => { console.error("Lỗi kết nối!", err); setLoading(false); });
    };

    const applyFilter = (data, category) => {
        setProducts(category === 'Tất cả' ? data : data.filter(p => p.category === category));
    };

    const handleFilter = (category) => {
        setActiveCategory(category);
        applyFilter(allProducts, category);
    };

    const handleDelete = async (category, id) => {
        if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
            const token = sessionStorage.getItem('token');
            try {
                await axios.delete(`http://localhost:5000/api/products/${category}/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Xóa thành công!");
                fetchProducts();
            } catch (err) {
                alert(err.response?.data?.message || "Lỗi khi xóa");
            }
        }
    };

    const searchedProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading) return <div className="text-center mt-5">Đang tải sản phẩm...</div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-center fw-bold">Khám phá sản phẩm</h2>

            {role === 'admin' && (
                <header className="page-header text-center mb-4">
                    <div className="header-actions">
                        <Link to="/admin/add-product" data-testid="v3-prod-btn-add" className="btn btn-success rounded-pill px-4 shadow">
                            <i className="bi bi-plus-lg"></i> + Thêm sản phẩm mới
                        </Link>
                    </div>
                </header>
            )}

            {/* Search */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-6">
                    <div className="search-container">
                        <div className="search-inner">
                            <input
                                type="text"
                                id="search-input"
                                data-testid="v3-prod-search"
                                className="form-control rounded-pill px-4 shadow-sm"
                                placeholder="Tìm kiếm sản phẩm (Viết đúng chính tả...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter nav */}
            <nav className="filter-nav d-flex justify-content-center mb-5">
                <ul className="list-unstyled d-flex gap-2 mb-0">
                    {['Tất cả', 'iphone', 'ipad', 'macbook', 'airpods'].map(cat => (
                        <li key={cat}>
                            <button
                                data-testid={`v3-prod-filter-${cat === 'Tất cả' ? 'all' : cat}`}
                                onClick={() => handleFilter(cat)}
                                className={`btn rounded-pill px-4 ${activeCategory === cat ? 'btn-dark' : 'btn-outline-dark'}`}
                            >
                                {cat.toUpperCase()}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Products */}
            <div className="row">
                {searchedProducts.length > 0 ? (
                    searchedProducts.map(p => (
                        <div className="col-md-3 mb-4" key={p._id}>
                            <div className="card shadow-sm h-100 border-0">
                                <img
                                    src={p.image || (p.variants && p.variants[0]?.img) || "https://via.placeholder.com/150"}
                                    className="card-img-top"
                                    alt={p.name}
                                    style={{ height: "180px", objectFit: "contain", padding: "15px" }}
                                />
                                <div className="card-body text-center">
                                    <div className="product-info">
                                        <h6 className="card-title fw-bold">{p.name}</h6>
                                        <p className="text-danger fw-bold">
                                            {Number(p.pr || p.price).toLocaleString()} VND
                                        </p>
                                    </div>
                                    <Link to={`/product/${p.category}/${p._id}`} data-testid={`v3-prod-view-${p._id}`} className="btn btn-outline-dark btn-sm rounded-pill w-100">
                                        Xem chi tiết
                                    </Link>
                                    {role === 'admin' && (
                                        <div className="admin-controls mt-2">
                                            <div className="btn-row d-flex gap-2">
                                                <button
                                                    onClick={() => handleDelete(p.category, p._id)}
                                                    data-testid={`v3-prod-delete-${p._id}`}
                                                    className='btn btn-danger btn-sm rounded-pill flex-fill'
                                                >
                                                    Xóa sản phẩm
                                                </button>
                                                <button
                                                    className='btn btn-warning btn-sm rounded-pill flex-fill'
                                                    data-testid={`v3-prod-edit-${p._id}`}
                                                    onClick={() => navigate(`/edit-product/${p.category}/${p._id}`)}
                                                >
                                                    Sửa
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center w-100 mt-5">
                        <p className="text-muted">Không có sản phẩm nào trong danh mục này.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;