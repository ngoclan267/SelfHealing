import { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// V7: Structure + Visual
// Structure: search bar and filter moved BELOW product grid; admin button inline with title; card layout 2-col instead of 4
// Visual: card bg changed, btn colors; data-testid đổi
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

    useEffect(()=>{ setRole(sessionStorage.getItem('role')); fetchProducts(); },[]);

    const fetchProducts = () => {
        setLoading(true);
        axios.get("http://localhost:5000/api/products").then(res=>{
            if (Array.isArray(res.data)){ setAllProducts(res.data); applyFilter(res.data, activeCategory); }
            setLoading(false);
        }).catch(err=>{ console.error("Lỗi kết nối!", err); setLoading(false); });
    };

    const applyFilter = (data, category) => setProducts(category === 'Tất cả' ? data : data.filter(p => p.category === category));
    const handleFilter = (category) => { setActiveCategory(category); applyFilter(allProducts, category); };
    const handleDelete = async (category, id) => {
        if(window.confirm("Bạn có chắc muốn xóa sản phẩm này?")){
            const token = sessionStorage.getItem('token');
            try { await axios.delete(`http://localhost:5000/api/products/${category}/${id}`, { headers:{Authorization:`Bearer ${token}`} }); alert("Xóa thành công!"); fetchProducts(); }
            catch(err) { alert(err.response?.data?.message || "Lỗi khi xóa"); }
        }
    };

    const searchedProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading) return <div className="text-center mt-5">Đang tải sản phẩm...</div>;

    return (
        <div className="container mt-4">
            {/* Structure: title + admin button in same flex row */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="fw-bold mb-0">Khám phá sản phẩm</h2>
                {role === 'admin' && (
                    <Link to="/admin/add-product" data-testid="product-add-btn" className="btn btn-success rounded-pill px-3 shadow">
                        + Thêm sản phẩm
                    </Link>
                )}
            </div>

            {/* Structure: filter ABOVE search (sibling order đổi) */}
            <div className="d-flex justify-content-center gap-2 mb-3">
                {['Tất cả', 'iphone', 'ipad', 'macbook', 'airpods'].map(cat => (
                    <button key={cat} data-testid={`category-${cat==='Tất cả'? 'all':cat}`} onClick={() => handleFilter(cat)}
                        className={`btn rounded-pill px-3 ${activeCategory===cat ? 'btn-dark' : 'btn-outline-secondary'}`}>
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="row justify-content-center mb-4">
                <div className="col-md-8">
                    <input type="text" data-testid="product-search" className="form-control rounded-pill px-4 shadow-sm"
                        placeholder="Tìm kiếm sản phẩm (Viết đúng chính tả...)" value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Structure: col-md-3 -> col-md-6 (2-col layout instead of 4) */}
            <div className="row">
                {searchedProducts.length > 0 ? (
                    searchedProducts.map(p => (
                        <div className="col-md-6 mb-4" key={p._id}>
                            <div className="card shadow-sm h-100 border-0 rounded-4 bg-light">
                                {/* Structure: image on left, body on right (horizontal card) */}
                                <div className="d-flex">
                                    <img src={p.image || (p.variants && p.variants[0]?.img) || "https://via.placeholder.com/150"} 
                                        className="rounded-start" alt={p.name} 
                                        style={{ width: "140px", height: "140px", objectFit: "contain", padding: "10px" }} />
                                    <div className="card-body">
                                        <h6 className="card-title fw-bold">{p.name}</h6>
                                        <p className="text-danger fw-bold">{Number(p.pr || p.price).toLocaleString()} VND</p>
                                        <Link to={`/product/${p.category}/${p._id}`} data-testid={`view-product-${p._id}`} className="btn btn-outline-dark btn-sm rounded-pill">
                                            Xem chi tiết
                                        </Link>
                                        {role === 'admin' && (
                                            <div className="d-flex gap-1 mt-2">
                                                <button onClick={() => handleDelete(p.category, p._id)} data-testid={`delete-product-${p._id}`} className='btn btn-danger btn-sm rounded-pill flex-fill'>Xóa</button>
                                                <button className='btn btn-warning btn-sm rounded-pill flex-fill' data-testid={`edit-product-${p._id}`} onClick={() => navigate(`/edit-product/${p.category}/${p._id}`)}>Sửa</button>
                                            </div>
                                        )}
                                    </div>
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