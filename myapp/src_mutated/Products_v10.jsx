import { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Products = () => {
    const [products, setProducts] = useState([]); // Danh sách hiển thị sau khi lọc
    const [allProducts, setAllProducts] = useState([]); // Lưu toàn bộ data gốc từ server
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] =useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const typeFromUrl = queryParams.get('type') || "Tất cả"; 
    const [activeCategory, setActiveCategory]=useState(typeFromUrl);
    const [role, setRole] = useState(sessionStorage.getItem('role'));

    useEffect(()=>{
        const storedRole=sessionStorage.getItem('role');
        setRole(storedRole);
        fetchProducts();
    },[]);
    const fetchProducts=()=>{
        setLoading(true);
        axios.get("http://localhost:5000/api/products").then(res=>{
            if (Array.isArray(res.data)){
                setAllProducts(res.data);
                applyFilter(res.data,activeCategory);
            }
            setLoading(false);
        })
        .catch(err=>{
            console.error("Lỗi kết nối!",err);
            setLoading(false);
        });
    };
    const applyFilter=(data, category)=>{
        if(category==='Tất cả'){
            setProducts(data);
        }
        else{
            const filtered =data.filter(p=>p.category===category);
            setProducts(filtered);
        }
    };
    const handleFilter=(category)=>{
        setActiveCategory(category);
        applyFilter(allProducts,category);
    };
    const handleDelete=async(category,id)=>{
        if(window.confirm("Bạn có chắc muốn xóa sản phẩm này?")){
            const token=sessionStorage.getItem('token');
            try{
                await axios.delete(`http://localhost:5000/api/products/${category}/${id}`,{
                    headers:{Authorization:`Bearer ${token}`}
                });
                alert("Xóa thành công!");
                fetchProducts();
            }
            catch(err){
                alert(err.response?.data?.message||"Lỗi khi xóa");
            }
        }
    };
    const searchedProducts=products.filter(p=>p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading) return <div className="text-center mt-5">Đang tải sản phẩm...</div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-center fw-bold">Khám phá sản phẩm</h2>
            {role === 'admin' && (
                <div className="text-center mb-4">
                    <Link to="/admin/add-product" data-testid="btn-add-product_v10" className="btn btn-success rounded-pill px-4 shadow">
                        <i className="bi bi-plus-lg"></i> + Thêm sản phẩm mới
                    </Link>
                </div>
            )}
            {/*Thanh tìm kiếm */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-6">
                    <input 
                        type="text" 
                        
                        className="form-control rounded-pill px-4 shadow-sm" 
                        placeholder="Tìm kiếm sản phẩm (Viết đúng chính tả...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            {/* Bộ lọc nhanh (Tabs) */}
            <div className="d-flex justify-content-center gap-2 mb-5">
                {['Tất cả', 'ipad', 'macbook', 'iphone', 'airpods'].map(cat => (
                    <div className="btn-wrapper"><button 
                        key={cat}
                        onClick={() => handleFilter(cat)}
                        className={`btn rounded-pill px-4 ${activeCategory===cat ? 'btn-dark' : 'btn-outline-dark'}`}
                    >
                        {cat.toUpperCase()}
                    </button></div>
                ))}
            </div>
            {/*Sản phẩm hiển thị */}
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
                                    {/* Link chuyển đến chi tiết, kèm theo category để server biết đường tìm */}
                                    <Link to={`/product/${p.category}/${p._id}`} data-testid={`btn-view-${p._id}`} className="btn btn-outline-dark btn-sm rounded-pill w-100">
                                        Xem chi tiết
                                    </Link>
                                    {role === 'admin' && (
                                        <div className="d-flex gap-2 mt-2"> 
                                            {/* Nút Xóa */}
                                            <div className="btn-wrapper"><button 
                                                onClick={() => handleDelete(p.category, p._id)}
                                                data-testid={`btn-delete-${p._id}`} 
                                                className='btn btn-danger btn-sm rounded-pill flex-fill'
                                            >
                                                Xóa sản phẩm
                                            </button></div>

                                            {/* Nút Sửa*/}
                                            <div className="btn-wrapper"><button 
                                                className='btn btn-warning btn-sm rounded-pill flex-fill' 
                                                data-testid={`btn-edit-${p._id}`}
                                                onClick={() => navigate(`/edit-product/${p.category}/${p._id}`)}
                                            >
                                                Sửa
                                            </button></div>
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