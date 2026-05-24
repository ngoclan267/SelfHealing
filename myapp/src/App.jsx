import {useState, useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import Introduct from "./pages/Introduct";
import Products from "./pages/Products";
import Login from "./pages/Login";
import Register from "./pages/Register"
import ProductDetail from "./pages/ProductDetail";
import AddProduct from "./pages/addProduct";
import EditProduct from "./pages/EditProduct";
import Contact from "./pages/Contact";
import AdminContacts from "./pages/AdminContacts";
const Navbar = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const role = sessionStorage.getItem('role');
  const logout = () => {
    sessionStorage.clear(); 
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Phone Shop</Link>
        <div className="navbar-nav ms-auto">
          <Link className="nav-link" to="/">Giới thiệu</Link>
          <Link className="nav-link" to="/product">Sản phẩm</Link>
          {role==="admin"&&(
            <Link className="nav-link" to="/admin/contacts">Quản lý liên hệ</Link>
          )}
          {token ? (
            <button className="btn btn-link nav-link" onClick={logout} style={{ textDecoration: 'none' }}>
              Đăng xuất
            </button>
          ) : (
            <Link className="nav-link" to="/login">Đăng nhập</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  const [role, setRole]=useState(sessionStorage.getItem('role'));
  useEffect(()=>{
    const storedRole=sessionStorage.getItem('role');
    setRole(storedRole);
  },[]);
  return (
    <Router>
      <Navbar /> 
      <Routes>
        <Route path='/' element={<Introduct/>}/>
        <Route path='/product' element={<Products />} />
        <Route path="/product/:category/:id" element={<ProductDetail />} />
        <Route path='/login' element={<Login />} />
        <Route path="/register" element={<Register />}/>
        <Route path="/admin/add-product" element={role === 'admin' ? <AddProduct /> : <Navigate to="/" />} />
        <Route path="/edit-product/:category/:id" element={role === 'admin' ? <EditProduct /> : <Navigate to="/" />} />
        <Route path="/contact" element={<Contact/>}/>
        <Route path="/admin/contacts" element={role === 'admin' ? <AdminContacts /> : <Navigate to="/" />} />z
      </Routes>
    </Router>
  );
}

export default App;