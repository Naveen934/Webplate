import { useState } from 'react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-white shadow-md fixed w-full z-10">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <a href="#" className="text-2xl font-bold text-green-700">LeafPlate</a>

                <div className="hidden md:flex space-x-8">
                    <a href="#home" className="text-gray-600 hover:text-green-600">Home</a>
                    <a href="#about" className="text-gray-600 hover:text-green-600">About</a>
                    <a href="#products" className="text-gray-600 hover:text-green-600">Our Plates</a>
                    <a href="#contact" className="text-gray-600 hover:text-green-600">Contact</a>
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
