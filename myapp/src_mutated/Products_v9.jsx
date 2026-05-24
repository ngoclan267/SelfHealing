import { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// V9: Semantic + Structure changes
// Semantic: heading text changed, button labels changed, placeholder changed, empty state text changed
// Structure: filter bar moved BELOW search (was above), admin buttons order swapped (Edit before Delete)
// data-testid: RENAMED

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
        if (category === 'Tất cả') setProducts(data);
        else setProducts(data.filter(p => p.category === category));
    };

    const handleFilter = (category) => {
        setActiveCategory(category);
        applyFilter(allProducts, category);
    };

    const handleDelete = async (category, id) => {
        if (window.confirm("Xác nhận xóa sản phẩm này?")) {
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

    if (loading) return <div className="text-center mt-5">Đang tải...</div>;

    return (
        <div className="container mt-4">
            {/* Semantic: heading text changed */}
            <h2 className="mb-4 text-center fw-bold">Tất cả sản phẩm</h2>

            {role === 'admin' && (
                <div className="text-center mb-4">
                    {/* Semantic: link text changed */}
                    <Link to="/admin/add-product" data-testid="v9-btn-new-product" className="btn btn-success rounded-pill px-4 shadow">
                        Đăng sản phẩm mới
                    </Link>
                </div>
            )}

            {/* Structure: Search bar — now wrapped in extra div.search-section */}
            <div className="search-section mb-4">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <input
                            type="text"
                            data-testid="v9-search"
                            className="form-control rounded-pill px-4 shadow-sm"
                            // Semantic: placeholder changed
                            placeholder="Tìm kiếm theo tên sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Structure: Filter bar now BELOW search (swapped position vs v1) */}
            <div className="d-flex justify-content-center gap-2 mb-5">
                {['Tất cả', 'iphone', 'ipad', 'macbook', 'airpods'].map(cat => (
                    <button
                        key={cat}
                        data-testid={`v9-filter-${cat === 'Tất cả' ? 'all' : cat}`}
                        onClick={() => handleFilter(cat)}
                        className={`btn rounded-pill px-4 ${activeCategory === cat ? 'btn-dark' : 'btn-outline-dark'}`}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

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
                                    <h6 className="card-title fw-bold">{p.name}</h6>
                                    <p className="text-danger fw-bold">
                                        {Number(p.pr || p.price).toLocaleString()} VND
                                    </p>
                                    {/* Semantic: link text changed */}
                                    <Link
                                        to={`/product/${p.category}/${p._id}`}
                                        data-testid={`v9-view-${p._id}`}
                                        className="btn btn-outline-dark btn-sm rounded-pill w-100"
                                    >
                                        Chi tiết sản phẩm
                                    </Link>
                                    {role === 'admin' && (
                                        // Structure: Edit button now BEFORE Delete button (swapped order)
                                        <div className="d-flex gap-2 mt-2">
                                            <button
                                                className='btn btn-warning btn-sm rounded-pill flex-fill'
                                                data-testid={`v9-edit-${p._id}`}
                                                onClick={() => navigate(`/edit-product/${p.category}/${p._id}`)}
                                            >
                                                Chỉnh sửa
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.category, p._id)}
                                                data-testid={`v9-delete-${p._id}`}
                                                className='btn btn-danger btn-sm rounded-pill flex-fill'
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center w-100 mt-5">
                        {/* Semantic: empty state text changed */}
                        <p className="text-muted">Không tìm thấy sản phẩm nào.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;