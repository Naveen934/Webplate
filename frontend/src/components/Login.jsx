import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onToggle, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            onClose();
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Login</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                    <input
                        type="email" required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500"
                        placeholder="your@email.com"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                    <input
                        type="password" required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500"
                        placeholder="********"
                    />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold transition duration-300 hover:bg-green-700">
                    Sign In
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
                Don't have an account? {' '}
                <button onClick={onToggle} className="text-green-600 font-bold hover:underline">Register</button>
            </p>
        </div>
    );
};

export default Login;
