import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V2: Semantic changes only
// - Title "Liên hệ với chúng tôi" -> "Gửi yêu cầu hỗ trợ"
// - Label "Họ và tên" -> "Tên của bạn"
// - Label "Số điện thoại" -> "Số ĐT liên lạc"
// - Label "Lời nhắn" -> "Nội dung cần hỗ trợ"
// - Button "Gửi thông tin" -> "Gửi yêu cầu"
// - Placeholder thay đổi ngữ nghĩa
// - data-testid bị XÓA hoàn toàn
// - role="form" thêm vào form

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors]     = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');

    const validate = () => {
        const newErrors = { name: '', phone: '', message: '' };
        let isValid = true;
        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập tên của bạn.';
            isValid = false;
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại.';
            isValid = false;
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.';
            isValid = false;
        }
        if (!formData.message.trim()) {
            newErrors.message = 'Vui lòng mô tả vấn đề cần hỗ trợ.';
            isValid = false;
        } else if (formData.message.trim().length > 500) {
            newErrors.message = `Nội dung không vượt quá 500 ký tự (hiện tại: ${formData.message.trim().length}).`;
            isValid = false;
        }
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
            alert('Yêu cầu của bạn đã được ghi nhận! Chúng tôi sẽ liên hệ sớm nhất.');
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
                    <h3 className="text-danger fw-bold">Phiên đăng nhập không tồn tại</h3>
                    <p className="text-muted">Bạn cần đăng nhập để gửi yêu cầu hỗ trợ.</p>
                    <div className="mt-3">
                        <Link to="/login" className="btn btn-primary px-4 rounded-pill">Đăng nhập ngay</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 card p-4 shadow">
                    <h2 className="text-center mb-4">Gửi yêu cầu hỗ trợ</h2>
                    <form onSubmit={handleSubmit} role="form" noValidate>

                        <div className="mb-3">
                            <label className="form-label">Tên của bạn</label>
                            <input
                                type="text"
                                id="contact-name"
                                placeholder="Họ và tên đầy đủ"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                            {errors.name && (
                                <div className="invalid-feedback">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Số ĐT liên lạc</label>
                            <input
                                type="text"
                                id="contact-phone"
                                placeholder="Số điện thoại để chúng tôi liên lạc"
                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                            {errors.phone && (
                                <div className="invalid-feedback">
                                    {errors.phone}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Nội dung cần hỗ trợ
                                <span className="text-muted ms-2" style={{ fontSize: '0.85em' }}>
                                    ({formData.message.length}/500)
                                </span>
                            </label>
                            <input
                                type="text"
                                id="contact-mess"
                                placeholder="Mô tả vấn đề bạn cần được hỗ trợ"
                                className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                value={formData.message}
                                onChange={(e) => handleChange('message', e.target.value)}
                            />
                            {errors.message && (
                                <div className="invalid-feedback">
                                    {errors.message}
                                </div>
                            )}
                        </div>

                        <div className="row justify-content-center mb-3">
                            <button
                                type="submit"
                                role="button"
                                className="btn btn-primary w-17 rounded-pill fw-bold"
                            >
                                Gửi yêu cầu
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;