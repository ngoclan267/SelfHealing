import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V8: Attribute + Context
const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors]     = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');

    const validate = () => {
        const newErrors = { name: '', phone: '', message: '' };
        let isValid = true;
        if (!formData.name.trim()) { newErrors.name = 'Vui lòng nhập họ và tên.'; isValid = false; }
        if (!formData.phone.trim()) { newErrors.phone = 'Vui lòng nhập số điện thoại.'; isValid = false; }
        else if (!/^\d{10}$/.test(formData.phone.trim())) { newErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.'; isValid = false; }
        if (!formData.message.trim()) { newErrors.message = 'Vui lòng nhập lời nhắn.'; isValid = false; }
        else if (formData.message.trim().length > 500) { newErrors.message = `Lời nhắn không được vượt quá 500 ký tự.`; isValid = false; }
        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await axios.post('http://localhost:5000/api/contact', formData);
            alert('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm! ^^');
            setFormData({ name: '', phone: '', message: '' });
            setErrors({ name: '', phone: '', message: '' });
        } catch (err) { alert('Có lỗi xảy ra, vui lòng thử lại!!!'); }
    };

    if (!token) {
        return (
            <div className="container mt-5">
                <div className="card p-5 text-center shadow border-0 rounded-4">
                    <h3 className="text-warning fw-bold">Vui lòng đăng nhập để tiếp tục</h3>
                    <p className="text-secondary">Tính năng liên hệ yêu cầu tài khoản đã xác thực.</p>
                    <div className="mt-3">
                        <Link to="/login" className="btn btn-warning px-4 rounded-pill text-white">Đến trang đăng nhập</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 card p-4 shadow rounded-4">
                    {/* Context: heading thay đổi */}
                    <h2 className="text-center mb-1">Hỗ trợ khách hàng</h2>
                    <p className="text-center text-muted small mb-4">Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ</p>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-3">
                            {/* Context: label thay đổi; Attribute: id thêm */}
                            <label className="form-label fw-semibold" htmlFor="input-cust-name">Tên khách hàng</label>
                            <input
                                type="text"
                                id="input-cust-name"
                                data-testid="contact-name_v8"
                                placeholder="Họ và tên đầy đủ"
                                className={`form-control rounded-3 ${errors.name ? 'is-invalid' : ''}`}
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                            {errors.name && <div className="invalid-feedback" data-testid="error-contact-name">{errors.name}</div>}
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold" htmlFor="input-cust-phone">Số điện thoại liên hệ</label>
                            <input
                                type="text"
                                id="input-cust-phone"
                                data-testid="contact-phone_v8"
                                placeholder="0901 234 567"
                                className={`form-control rounded-3 ${errors.phone ? 'is-invalid' : ''}`}
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                            {errors.phone && <div className="invalid-feedback" data-testid="error-contact-phone">{errors.phone}</div>}
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold" htmlFor="input-cust-msg">
                                Nội dung cần hỗ trợ
                                <span className="text-muted ms-2" style={{ fontSize: '0.85em' }}>({formData.message.length}/500)</span>
                            </label>
                            <input
                                type="text"
                                id="input-cust-msg"
                                data-testid="contact-mess_v8"
                                placeholder="Mô tả vấn đề bạn gặp phải..."
                                className={`form-control rounded-3 ${errors.message ? 'is-invalid' : ''}`}
                                value={formData.message}
                                onChange={(e) => handleChange('message', e.target.value)}
                            />
                            {errors.message && <div className="invalid-feedback" data-testid="error-contact-mess">{errors.message}</div>}
                        </div>

                        <div className="d-grid mb-3">
                            {/* Context: button text thay đổi; Attribute: id thêm */}
                            <button type="submit" id="submit-contact-btn" data-testid="btn-contact-submit_v8" className="btn btn-primary rounded-pill fw-bold py-2">
                                Gửi yêu cầu hỗ trợ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;