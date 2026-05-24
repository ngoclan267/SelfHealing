import { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// V11 Changes:
// [Visual]      - Page wrapper: added background '#f7f8fc', padding style
// [Visual]      - Product card: removed "border-0", added inline style (border, boxShadow tweak)
// [Visual]      - Product image: height changed "180px" → "200px", background color added
// [Visual]      - Filter tab buttons: changed inactive style from btn-outline-dark → btn-outline-secondary
// [Visual]      - Admin "Add" button: btn-success → btn-dark, different px padding
// [Visual]      - Price text: kept text-danger but added inline fontWeight style
// [Context]     - Page heading: "Khám phá sản phẩm" → "Danh sách sản phẩm"
// [Context]     - Search placeholder: "Tìm kiếm sản phẩm (Viết đúng chính tả...)" → "Nhập tên sản phẩm cần tìm..."
// [Context]     - Admin add-product button text: "+ Thêm sản phẩm mới" → "Thêm hàng mới"
// [Context]     - Empty state message: "Không có sản phẩm nào trong danh mục này." → "Chưa có sản phẩm nào phù hợp."
// [Context]     - "Xem chi tiết" button → "Chi tiết sản phẩm"
// [Context]     - "Xóa sản phẩm" → "Xóa"; "Sửa" → "Chỉnh sửa"
// [Attribute]   - data-testid="search-input" → data-qa="search-box"
// [Attribute]   - data-testid="btn-add-product" (admin link) → data-qa="add-product-btn"
// [Attribute]   - data-testid="btn-filter-all" → data-filter="all"
// [Attribute]   - data-testid="btn-filter-iphone" → data-filter="iphone" (pattern applies to all)
// [Attribute]   - data-testid="btn-view-{id}" → data-action="view" (no id in testid)
// [Attribute]   - data-testid="btn-delete-{id}" → data-action="delete"
// [Attribute]   - data-testid="btn-edit-{id}" → data-action="edit"
// [Attribute]   - Filter button data-testid pattern changed; now uses data-filter attribute instead

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
        const storedRole = sessionStorage.getItem('role');
        setRole(storedRole);
        fetchProducts();
    }, []);

    const fetchProducts = () => {
        setLoading(true);
        axios.get("http://localhost:5000/api/products")
            .then(res => {
                if (Array.isArray(res.data)) {
                    setAllProducts(res.data);
                    applyFilter(res.data, activeCategory);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi kết nối!", err);
                setLoading(false);
            });
    };

    const applyFilter = (data, category) => {
        if (category === 'Tất cả') {
            setProducts(data);
        } else {
            setProducts(data.filter(p => p.category === category));
        }
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

    const searchedProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center mt-5">Đang tải sản phẩm...</div>;

    return (
        <div
            className="container mt-4"
            style={{ background: '#f7f8fc', padding: '16px', borderRadius: '8px' }}
        >
            <h2 className="mb-4 text-center fw-bold">Danh sách sản phẩm</h2>

            {role === 'admin' && (
                <div className="text-center mb-4">
                    <Link
                        to="/admin/add-product"
                        data-qa="add-product-btn"
                        className="btn btn-dark rounded-pill px-5 shadow"
                    >
                        Thêm hàng mới
                    </Link>
                </div>
            )}

            {/* Search bar */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-6">
                    <input
                        type="text"
                        data-qa="search-box"
                        className="form-control rounded-pill px-4 shadow-sm"
                        placeholder="Nhập tên sản phẩm cần tìm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter tabs */}
            <div className="d-flex justify-content-center gap-2 mb-5">
                {['Tất cả', 'iphone', 'ipad', 'macbook', 'airpods'].map(cat => (
                    <button
                        key={cat}
                        data-filter={cat === 'Tất cả' ? 'all' : cat}
                        onClick={() => handleFilter(cat)}
                        className={`btn rounded-pill px-4 ${activeCategory === cat ? 'btn-dark' : 'btn-outline-secondary'}`}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Product grid */}
            <div className="row">
                {searchedProducts.length > 0 ? (
                    searchedProducts.map(p => (
                        <div className="col-md-3 mb-4" key={p._id}>
                            <div
                                className="card h-100"
                                style={{
                                    border: '1px solid #e4e6ea',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
                                }}
                            >
                                <img
                                    src={p.image || (p.variants && p.variants[0]?.img) || "https://via.placeholder.com/150"}
                                    className="card-img-top"
                                    alt={p.name}
                                    style={{
                                        height: "200px",
                                        objectFit: "contain",
                                        padding: "15px",
                                        background: '#fafafa'
                                    }}
                                />
                                <div className="card-body text-center">
                                    <h6 className="card-title fw-bold">{p.name}</h6>
                                    <p className="text-danger" style={{ fontWeight: 700 }}>
                                        {Number(p.pr || p.price).toLocaleString()} VND
                                    </p>
                                    <Link
                                        to={`/product/${p.category}/${p._id}`}
                                        data-action="view"
                                        className="btn btn-outline-dark btn-sm rounded-pill w-100"
                                    >
                                        Chi tiết sản phẩm
                                    </Link>
                                    {role === 'admin' && (
                                        <div className="d-flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleDelete(p.category, p._id)}
                                                data-action="delete"
                                                className="btn btn-danger btn-sm rounded-pill flex-fill"
                                            >
                                                Xóa
                                            </button>
                                            <button
                                                className="btn btn-warning btn-sm rounded-pill flex-fill"
                                                data-action="edit"
                                                onClick={() => navigate(`/edit-product/${p.category}/${p._id}`)}
                                            >
                                                Chỉnh sửa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center w-100 mt-5">
                        <p className="text-muted">Chưa có sản phẩm nào phù hợp.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;