import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors]     = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');

    // ── Validate từng field ───────────────────────────────────────
    const validate = () => {
        const newErrors = { name: '', phone: '', message: '' };
        let isValid = true;

        // Tên: bắt buộc, không chỉ space
        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập họ và tên.';
            isValid = false;
        }

        // Số điện thoại: bắt buộc, chỉ chứa số, độ dài 9-11 chữ số
        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại.';
            isValid = false;
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.';
            isValid = false;
        }

        // Lời nhắn: bắt buộc, không chỉ space, tối đa 500 ký tự
        if (!formData.message.trim()) {
            newErrors.message = 'Vui lòng nhập lời nhắn.';
            isValid = false;
        } else if (formData.message.trim().length > 500) {
            newErrors.message = `Lời nhắn không được vượt quá 500 ký tự (hiện tại: ${formData.message.trim().length}).`;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // ── Validate realtime khi người dùng gõ ──────────────────────
    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });

        // Xóa lỗi của field đó ngay khi người dùng bắt đầu sửa
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Chạy validate trước — không gọi API nếu lỗi
        if (!validate()) return;

        try {
            await axios.post('http://localhost:5000/api/contact', formData);
            alert('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm! ^^');
            setFormData({ name: '', phone: '', message: '' });
            setErrors({ name: '', phone: '', message: '' });
        } catch (err) {
            alert('Có lỗi xảy ra, vui lòng thử lại!!!');
        }
    };

    if (!token) {
        return (
            <div className="container mt-5">
                <div className="card p-5 text-center shadow-sm border-0">
                    <h3 className="text-danger fw-bold">Opps! Bạn chưa đăng nhập</h3>
                    <p className="text-muted">
                        Vui lòng đăng nhập để sử dụng tính năng gửi liên hệ.
                    </p>
                    <div className="mt-3">
                        <Link to="/login" className="btn btn-primary px-4 rounded-pill">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 card p-4 shadow">
                    <h2 className="text-center mb-4">Liên hệ với chúng tôi</h2>
                    <form onSubmit={handleSubmit} noValidate>

                        <div className="mb-3">
                            <label className="form-label">Họ và tên</label>
                            <input
                                type="text"
                                id="contact-name"
                                data-testid="contact-name"
                                placeholder="Nhập họ và tên của bạn"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                            {errors.name && (
                                <div className="invalid-feedback" data-testid="error-contact-name">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        {/* Số điện thoại */}
                        <div className="mb-3">
                            <label className="form-label">Số điện thoại</label>
                            <input
                                type="text"
                                id="contact-phone"
                                data-testid="contact-phone"
                                placeholder="Nhập số điện thoại (10 chữ số)"
                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                            {errors.phone && (
                                <div className="invalid-feedback" data-testid="error-contact-phone">
                                    {errors.phone}
                                </div>
                            )}
                        </div>

                        {/* Lời nhắn */}
                        <div className="mb-3">
                            <label className="form-label">
                                Lời nhắn
                                <span className="text-muted ms-2" style={{ fontSize: '0.85em' }}>
                                    ({formData.message.length}/500)
                                </span>
                            </label>
                            <input
                                type="text"
                                id="contact-mess"
                                data-testid="contact-mess"
                                placeholder="Nhập lời nhắn của bạn (tối đa 500 ký tự)"
                                className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                value={formData.message}
                                onChange={(e) => handleChange('message', e.target.value)}
                            />
                            {errors.message && (
                                <div className="invalid-feedback" data-testid="error-contact-mess">
                                    {errors.message}
                                </div>
                            )}
                        </div>

                        <div className="row justify-content-center mb-3">
                            <button
                                type="submit"
                                data-testid="btn-contact-submit"
                                className="btn btn-primary w-17 rounded-pill fw-bold"
                            >
                                Gửi thông tin
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;