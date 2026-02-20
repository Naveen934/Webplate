import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = ({ onOpenCart, onOpenAuth }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const { cartCount } = useCart();

    return (
        <nav className="bg-white shadow-md fixed w-full z-50">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <a href="#" className="text-2xl font-bold text-green-700">LeafPlate</a>

                <div className="hidden md:flex space-x-8 items-center">
                    <a href="#home" className="text-gray-600 hover:text-green-600">Home</a>
                    <a href="#about" className="text-gray-600 hover:text-green-600">About</a>
                    <a href="#products" className="text-gray-600 hover:text-green-600">Our Plates</a>
                    <a href="#contact" className="text-gray-600 hover:text-green-600">Contact</a>

                    <button onClick={onOpenCart} className="relative p-2 text-gray-600 hover:text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {user ? (
                        <div className="flex items-center space-x-3 border-l pl-6 ml-2">
                            <span className="text-sm font-semibold text-gray-700">{user.full_name.split(' ')[0]}</span>
                            <button onClick={logout} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-bold transition-all">Logout</button>
                        </div>
                    ) : (
                        <button onClick={onOpenAuth} className="bg-green-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition-all">Sign In</button>
                    )}
                </div>

                <button
                    className="md:hidden text-gray-600 focus:outline-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div className="md:hidden bg-white border-t">
                    <a href="#home" className="block px-4 py-2 text-gray-600 hover:bg-green-50" onClick={() => setIsOpen(false)}>Home</a>
                    <a href="#about" className="block px-4 py-2 text-gray-600 hover:bg-green-50" onClick={() => setIsOpen(false)}>About</a>
                    <a href="#products" className="block px-4 py-2 text-gray-600 hover:bg-green-50" onClick={() => setIsOpen(false)}>Our Plates</a>
                    <a href="#contact" className="block px-4 py-2 text-gray-600 hover:bg-green-50" onClick={() => setIsOpen(false)}>Contact</a>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
