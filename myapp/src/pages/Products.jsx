import { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// V2: Semantic changes only
// - Heading "Khám phá sản phẩm" -> "Danh sách hàng hoá"
// - Button text "Thêm sản phẩm mới" -> "Tạo sản phẩm"
// - Filter buttons: "TẤT CẢ" -> "Tất cả danh mục", "IPHONE" -> "Apple iPhone" v.v.
// - "Xem chi tiết" -> "Chi tiết sản phẩm"
// - "Xóa sản phẩm" -> "Gỡ khỏi danh sách"
// - "Sửa" -> "Chỉnh sửa"
// - data-testid bị XÓA hoàn toàn
// - Placeholder tìm kiếm đổi text

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

    const categoryLabels = {
        'Tất cả': 'Tất cả danh mục',
        'iphone': 'Apple iPhone',
        'ipad': 'Apple iPad',
        'macbook': 'MacBook',
        'airpods': 'AirPods'
    };

    useEffect(()=>{
        const storedRole = sessionStorage.getItem('role');
        setRole(storedRole);
        fetchProducts();
    },[]);

    const fetchProducts = () => {
        setLoading(true);
        axios.get("http://localhost:5000/api/products").then(res=>{
            if (Array.isArray(res.data)){
                setAllProducts(res.data);
                applyFilter(res.data, activeCategory);
            }
            setLoading(false);
        }).catch(err=>{
            console.error("Lỗi kết nối!", err);
            setLoading(false);
        });
    };

    const applyFilter = (data, category) => {
        if(category === 'Tất cả') setProducts(data);
        else setProducts(data.filter(p => p.category === category));
    };

    const handleFilter = (category) => {
        setActiveCategory(category);
        applyFilter(allProducts, category);
    };

    const handleDelete = async (category, id) => {
        if(window.confirm("Xác nhận gỡ sản phẩm này khỏi danh sách?")){
            const token = sessionStorage.getItem('token');
            try{
                await axios.delete(`http://localhost:5000/api/products/${category}/${id}`,{
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Đã gỡ sản phẩm thành công!");
                fetchProducts();
            } catch(err){
                alert(err.response?.data?.message || "Lỗi khi xóa");
            }
        }
    };

    const searchedProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading) return <div className="text-center mt-5">Đang tải sản phẩm...</div>;
    
    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-center fw-bold">Danh sách hàng hoá</h2>
            {role === 'admin' && (
                <div className="text-center mb-4">
                    <Link to="/admin/add-product" className="btn btn-success rounded-pill px-4 shadow">
                        <i className="bi bi-plus-lg"></i> Tạo sản phẩm
                    </Link>
                </div>
            )}
            <div className="row justify-content-center mb-4">
                <div className="col-md-6">
                    <input 
                        type="text" 
                        id="search-input"
                        className="form-control rounded-pill px-4 shadow-sm" 
                        placeholder="Gõ tên hàng hoá cần tìm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="d-flex justify-content-center gap-2 mb-5">
                {['Tất cả', 'iphone', 'ipad', 'macbook', 'airpods'].map(cat => (
                    <button 
                        key={cat}
                        onClick={() => handleFilter(cat)}
                        className={`btn rounded-pill px-4 ${activeCategory === cat ? 'btn-dark' : 'btn-outline-dark'}`}
                    >
                        {categoryLabels[cat]}
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
                                    <Link to={`/product/${p.category}/${p._id}`} className="btn btn-outline-dark btn-sm rounded-pill w-100">
                                        Chi tiết sản phẩm
                                    </Link>
                                    {role === 'admin' && (
                                        <div className="d-flex gap-2 mt-2"> 
                                            <button 
                                                onClick={() => handleDelete(p.category, p._id)}
                                                className='btn btn-danger btn-sm rounded-pill flex-fill'
                                            >
                                                Gỡ khỏi danh sách
                                            </button>
                                            <button 
                                                className='btn btn-warning btn-sm rounded-pill flex-fill' 
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
                        <p className="text-muted">Không tìm thấy hàng hoá phù hợp.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;