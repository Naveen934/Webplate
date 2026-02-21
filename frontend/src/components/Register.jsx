import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Register = ({ onToggle, onClose }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        shipping_address: ''
    });
    const [error, setError] = useState('');
    const { register, login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(formData);
            await login(formData.email, formData.password);
            onClose();
        } catch (err) {
            console.error("Registration error details:", err.response?.data);

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (Array.isArray(detail)) {
                    // Handle FastAPI validation errors (422)
                    setError(detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', '));
                } else {
                    setError(detail);
                }
            } else {
                setError('Registration failed. Please check your connection or try again.');
            }
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Full Name *</label>
                    <input
                        type="text" required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Email *</label>
                    <input
                        type="email" required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Password *</label>
                    <input
                        type="password" required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1 flex justify-between">
                        <span>Phone Number *</span>
                        <span className="text-xs font-normal text-green-600">Required for delivery</span>
                    </label>
                    <input
                        type="tel" required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500 border-green-100"
                        placeholder="e.g. 9876543210"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1 flex justify-between">
                        <span>Shipping Address *</span>
                        <span className="text-xs font-normal text-green-600">Secure delivery</span>
                    </label>
                    <textarea
                        required rows="3"
                        value={formData.shipping_address}
                        onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500 border-green-100"
                        placeholder="House No, Street, Landmark, City, Pincode"
                    />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-xl font-bold transition duration-300 hover:bg-green-700 shadow-lg shadow-green-100">
                    Register & Continue
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account? {' '}
                <button onClick={onToggle} className="text-green-600 font-bold hover:underline">Login</button>
            </p>
        </div>
    );
};

export default Register;
