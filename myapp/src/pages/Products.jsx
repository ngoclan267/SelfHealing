import { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// V8: Attribute + Context changes
// Attribute: id attrs added, name attrs changed, class tweaks, input types
// Context: page title changed, nearby labels/button texts changed, form context changed
// data-testid: REMOVED from all elements

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
        axios.get("http://localhost:5000/api/products").then(res => {
            if (Array.isArray(res.data)) {
                setAllProducts(res.data);
                applyFilter(res.data, activeCategory);
            }
            setLoading(false);
        }).catch(err => {
            console.error("Lỗi kết nối!", err);
            setLoading(false);
        });
    };

    const applyFilter = (data, category) => {
        if (category === 'Tất cả') {
            setProducts(data);
        } else {
            const filtered = data.filter(p => p.category === category);
            setProducts(filtered);
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

    const searchedProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="text-center mt-5">Đang tải sản phẩm...</div>;

    return (
        <div className="container mt-4" id="products-page">
            {/* Context: heading text changed */}
            <h2 className="mb-4 text-center fw-bold" id="page-heading">Danh sách sản phẩm</h2>

            {role === 'admin' && (
                <div className="text-center mb-4">
                    {/* Attribute: id added, Context: button label changed */}
                    <Link
                        to="/admin/add-product"
                        id="link-add-product"
                        className="btn btn-success rounded-pill px-4 shadow"
                    >
                        Thêm sản phẩm mới vào kho
                    </Link>
                </div>
            )}

            {/* Context: search section label changed */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-6">
                    <input
                        type="search"
                        id="product-search-box"
                        name="search"
                        className="form-control rounded-pill px-4 shadow-sm"
                        placeholder="Nhập tên sản phẩm muốn tìm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Context: filter bar context - labels unchanged (value semantic) but ids added */}
            <div className="d-flex justify-content-center gap-2 mb-5" id="category-filter-bar">
                {['Tất cả', 'iphone', 'ipad', 'macbook', 'airpods'].map(cat => (
                    <button
                        key={cat}
                        id={`filter-btn-${cat === 'Tất cả' ? 'all' : cat}`}
                        onClick={() => handleFilter(cat)}
                        className={`btn rounded-pill px-4 ${activeCategory === cat ? 'btn-dark' : 'btn-outline-dark'}`}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="row" id="product-grid">
                {searchedProducts.length > 0 ? (
                    searchedProducts.map(p => (
                        <div className="col-md-3 mb-4" key={p._id}>
                            <div className="card shadow-sm h-100 border-0" id={"product-card-" + p._id}>
                                <img
                                    src={p.image || (p.variants && p.variants[0]?.img) || "https://via.placeholder.com/150"}
                                    className="card-img-top"
                                    alt={p.name}
                                    style={{ height: "180px", objectFit: "contain", padding: "15px" }}
                                />
                                <div className="card-body text-center">
                                    <h6 className="card-title fw-bold">{p.name}</h6>
                                    <p className="text-danger fw-bold">
                                        {Number(p.pr || p.price).toLocaleString()} VND
                                    </p>
                                    {/* Attribute: id added */}
                                    <Link
                                        to={`/product/${p.category}/${p._id}`}
                                        id={"link-detail-" + p._id}
                                        className="btn btn-outline-dark btn-sm rounded-pill w-100"
                                    >
                                        Xem chi tiết
                                    </Link>
                                    {role === 'admin' && (
                                        <div className="d-flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleDelete(p.category, p._id)}
                                                id={"btn-remove-" + p._id}
                                                className='btn btn-danger btn-sm rounded-pill flex-fill'
                                            >
                                                Xóa
                                            </button>
                                            <button
                                                className='btn btn-warning btn-sm rounded-pill flex-fill'
                                                id={"btn-modify-" + p._id}
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
                        <p className="text-muted">Không tìm thấy sản phẩm phù hợp.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;