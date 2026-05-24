import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminContacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchContacts = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:5000/api/admin/contacts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContacts(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Lỗi:", err);
            setLoading(false);
        }
    };

    useEffect(() => { fetchContacts(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa yêu cầu này?")) return;
        const token = sessionStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/admin/contacts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchContacts(); // Tải lại danh sách
        } catch (err) {
            alert("Lỗi khi xóa");
        }
    };

    if (loading) return <div className="text-center mt-5">Đang tải dữ liệu...</div>;

    return (
        <div className="container mt-5">
            <h2 className="mb-4 fw-bold"><i className="bi bi-envelope-paper"></i> Danh sách khách hàng liên hệ</h2>
            <div className="table-responsive shadow-sm rounded">
                <table className="table table-hover align-middle bg-white">
                    <thead className="table-dark">
                        <tr>
                            <th>Ngày gửi</th>
                            <th>Khách hàng</th>
                            <th>Số điện thoại</th>
                            <th>Lời nhắn</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map(c => (
                            <tr key={c._id}>
                                <td style={{fontSize: '0.85rem'}}>
                                    {new Date(c.createdAt).toLocaleString('vi-VN')}
                                </td>
                                <td className="fw-bold">{c.name}</td>
                                <td>
                                    <a href={`tel:${c.phone}`} className="btn btn-outline-primary btn-sm">
                                        <i className="bi bi-telephone"></i> {c.phone}
                                    </a>
                                </td>
                                <td><div style={{maxWidth: '300px'}}>{c.message}</div></td>
                                <td>
                                    <button onClick={() => handleDelete(c._id)} className="btn btn-danger btn-sm">
                                        <i className="bi bi-trash"></i> Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {contacts.length === 0 && <p className="text-center p-4">Chưa có yêu cầu liên hệ nào.</p>}
            </div>
        </div>
    );
};

export default AdminContacts;