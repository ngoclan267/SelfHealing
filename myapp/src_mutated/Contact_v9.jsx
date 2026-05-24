import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V9: Semantic + Structure changes
// Semantic: label texts changed, error messages reworded, button text changed, CTA text changed
// Structure: form fields reordered (phone before name), wrapper depth increased, error siblings changed
// data-testid: RENAMED to new slugs

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors] = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');

    const validate = () => {
        const newErrors = { name: '', phone: '', message: '' };
        let isValid = true;

        if (!formData.name.trim()) {
            // Semantic: error message text changed
            newErrors.name = 'Tên không được để trống.';
            isValid = false;
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Số điện thoại là bắt buộc.';
            isValid = false;
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Số điện thoại phải đủ 10 chữ số.';
            isValid = false;
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Nội dung không được để trống.';
            isValid = false;
        } else if (formData.message.trim().length > 500) {
            newErrors.message = `Nội dung quá dài (${formData.message.trim().length}/500 ký tự).`;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await axios.post('http://localhost:5000/api/contact', formData);
            alert('Gửi thành công! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
            setFormData({ name: '', phone: '', message: '' });
            setErrors({ name: '', phone: '', message: '' });
        } catch (err) {
            alert('Gửi thất bại, vui lòng thử lại sau!');
        }
    };

    if (!token) {
        return (
            // Structure: unauthorized view restructured from card to alert-style div
            <div className="container mt-5">
                <div className="alert alert-warning text-center p-5" role="alert">
                    {/* Semantic: heading text changed */}
                    <h3 className="alert-heading fw-bold">Yêu cầu xác thực</h3>
                    <p className="mb-3">
                        Bạn cần đăng nhập để có thể gửi liên hệ đến chúng tôi.
                    </p>
                    {/* Semantic: link text changed */}
                    <Link to="/login" className="btn btn-primary px-4 rounded-pill">
                        Đăng nhập để tiếp tục
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                {/* Structure: col width changed */}
                <div className="col-md-7">
                    <div className="card p-4 shadow">
                        {/* Semantic: heading text changed */}
                        <h2 className="text-center mb-4">Gửi yêu cầu hỗ trợ</h2>

                        <form onSubmit={handleSubmit} noValidate aria-label="Form liên hệ">

                            {/* Structure: FIELDS REORDERED — phone comes first now */}

                            {/* Số điện thoại — now FIRST */}
                            <div className="mb-3">
                                {/* Semantic: label text unchanged (still phone) but position changed */}
                                <label htmlFor="v9-phone" className="form-label">Số điện thoại liên hệ</label>
                                <div className="input-wrap">
                                    <input
                                        type="tel"
                                        id="v9-phone"
                                        data-testid="v9-contact-phone"
                                        placeholder="Số điện thoại (10 chữ số)"
                                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                    {/* Structure: error now inside input-wrap, was sibling */}
                                    {errors.phone && (
                                        <div className="invalid-feedback" data-testid="v9-error-phone">
                                            {errors.phone}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Họ tên — now SECOND */}
                            <div className="mb-3">
                                {/* Semantic: label text changed */}
                                <label htmlFor="v9-name" className="form-label">Họ tên đầy đủ</label>
                                <div className="input-wrap">
                                    <input
                                        type="text"
                                        id="v9-name"
                                        data-testid="v9-contact-name"
                                        placeholder="Nhập họ tên của bạn"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                    {errors.name && (
                                        <div className="invalid-feedback" data-testid="v9-error-name">
                                            {errors.name}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lời nhắn — still third */}
                            <div className="mb-3">
                                {/* Semantic: label text changed */}
                                <label htmlFor="v9-message" className="form-label">
                                    Nội dung cần hỗ trợ
                                    <span className="text-muted ms-2" style={{ fontSize: '0.85em' }}>
                                        ({formData.message.length}/500)
                                    </span>
                                </label>
                                {/* Structure: changed from input to textarea for semantic correctness */}
                                <textarea
                                    id="v9-message"
                                    data-testid="v9-contact-message"
                                    rows="3"
                                    placeholder="Mô tả vấn đề hoặc câu hỏi của bạn"
                                    className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                    value={formData.message}
                                    onChange={(e) => handleChange('message', e.target.value)}
                                />
                                {errors.message && (
                                    <div className="invalid-feedback" data-testid="v9-error-message">
                                        {errors.message}
                                    </div>
                                )}
                            </div>

                            {/* Structure: button wrapped in div.d-flex */}
                            <div className="d-flex justify-content-center mt-3">
                                {/* Semantic: button text changed */}
                                <button
                                    type="submit"
                                    data-testid="v9-contact-submit"
                                    className="btn btn-primary rounded-pill fw-bold px-5"
                                >
                                    Gửi yêu cầu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;