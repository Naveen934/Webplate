import { useState } from 'react';
import axios from 'axios';

const ContactForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/contact/', formData);
            setStatus('Message sent successfully!');
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            console.error("Error sending message:", error);
            setStatus('Failed to send message. Please try again.');
        }
    };

    return (
        <section id="contact" className="py-12 bg-green-50">
            <div className="container mx-auto px-4 max-w-2xl">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Contact Us</h2>

                {status && <p className={`text-center mb-4 ${status.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{status}</p>}

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="message">Message</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="w-full btn-primary text-lg">
                        Send Message
                    </button>
                </form>
            </div>
        </section>
    );
};

export default ContactForm;
