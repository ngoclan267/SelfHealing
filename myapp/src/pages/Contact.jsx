import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V3: Structure only changes
// - Form fields wrapped thêm 1 lớp div.field-wrapper
// - Label + Input không cùng level div nữa mà label trong div.label-area, input trong div.control-area
// - Button submit nằm trong div.actions > div.primary-action thay vì row.justify-content-center
// - Error messages đổi thành span thay vì div (vẫn cùng class)
// - data-testid XÓA hoàn toàn ở label/errors, đổi prefix "v3-ct-" ở inputs và button

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
        } catch (err) {
            alert('Có lỗi xảy ra, vui lòng thử lại!!!');
        }
    };

    if (!token) {
        return (
            <div className="container mt-5">
                <div className="card p-5 text-center shadow-sm border-0">
                    <h3 className="text-danger fw-bold">Opps! Bạn chưa đăng nhập</h3>
                    <p className="text-muted">Vui lòng đăng nhập để sử dụng tính năng gửi liên hệ.</p>
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
                    <h2 className="text-center mb-4">Liên hệ với chúng tôi</h2>
                    <form onSubmit={handleSubmit} noValidate>

                        <div className="field-wrapper mb-3">
                            <div className="label-area">
                                <label className="form-label">Họ và tên</label>
                            </div>
                            <div className="control-area">
                                <input
                                    type="text"
                                    id="contact-name"
                                    data-testid="v3-ct-name"
                                    placeholder="Nhập họ và tên của bạn"
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                                {errors.name && (
                                    <span className="invalid-feedback d-block">
                                        {errors.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="field-wrapper mb-3">
                            <div className="label-area">
                                <label className="form-label">Số điện thoại</label>
                            </div>
                            <div className="control-area">
                                <input
                                    type="text"
                                    id="contact-phone"
                                    data-testid="v3-ct-phone"
                                    placeholder="Nhập số điện thoại (10 chữ số)"
                                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                />
                                {errors.phone && (
                                    <span className="invalid-feedback d-block">
                                        {errors.phone}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="field-wrapper mb-3">
                            <div className="label-area">
                                <label className="form-label">
                                    Lời nhắn
                                    <span className="text-muted ms-2" style={{ fontSize: '0.85em' }}>
                                        ({formData.message.length}/500)
                                    </span>
                                </label>
                            </div>
                            <div className="control-area">
                                <input
                                    type="text"
                                    id="contact-mess"
                                    data-testid="v3-ct-message"
                                    placeholder="Nhập lời nhắn của bạn (tối đa 500 ký tự)"
                                    className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                    value={formData.message}
                                    onChange={(e) => handleChange('message', e.target.value)}
                                />
                                {errors.message && (
                                    <span className="invalid-feedback d-block">
                                        {errors.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="actions mt-3">
                            <div className="primary-action text-center">
                                <button
                                    type="submit"
                                    data-testid="v3-ct-btn-submit"
                                    className="btn btn-primary w-17 rounded-pill fw-bold"
                                >
                                    Gửi thông tin
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;