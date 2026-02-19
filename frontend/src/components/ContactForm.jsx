import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ContactForm = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState('');
    const [contactInfo, setContactInfo] = useState({ phone: '', email: '' });

    useEffect(() => {
        axios.get(`${API_URL}/contact-info/`)
            .then(res => setContactInfo(res.data))
            .catch(err => console.error("Could not load contact info", err));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/contact/`, formData);
            setStatus('Message sent successfully!');
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            console.error("Error sending message:", error);
            const errorDetail = error.response?.data?.detail || 'Failed to send message. Please try again.';
            setStatus(errorDetail);
        }
    };

    return (
        <section id="contact" className="py-12 bg-green-50">
            <div className="container mx-auto px-4 max-w-4xl">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Contact Us</h2>

                {/* Contact Details */}
                <div className="flex flex-col md:flex-row gap-6 mb-10 justify-center">
                    <div className="flex items-center gap-3 bg-white rounded-lg shadow p-5 flex-1">
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Phone</p>
                            <a href={`tel:${contactInfo.phone}`} className="text-lg font-semibold text-gray-800 hover:text-green-600">
                                {contactInfo.phone}
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white rounded-lg shadow p-5 flex-1">
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Email</p>
                            <a href={`mailto:${contactInfo.email}`} className="text-lg font-semibold text-gray-800 hover:text-green-600">
                                {contactInfo.email}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                {status && <p className={`text-center mb-4 ${status.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{status}</p>}

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500" required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="message">Message</label>
                        <textarea id="message" name="message" value={formData.message} onChange={handleChange}
                            rows="4" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500" required></textarea>
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-full text-lg hover:bg-green-700 transition duration-300">
                        Send Message
                    </button>
                </form>
            </div>
        </section>
    );
};

export default ContactForm;
