import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        axios.get(`${API_URL}/products/`)
            .then(response => {
                setProducts(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching products:", error);
                setLoading(false);
            });
    }, []);

    const onAddToCart = (product) => {
        addToCart(product);
        // Optional: show a small toast or feedback
    };

    return (
        <section id="products" className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Our Premium Leaf Plates</h2>

                {loading ? (
                    <p className="text-center text-gray-500">Loading products...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map(product => (
                            <div key={product.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2">
                                <div className="relative overflow-hidden h-64">
                                    <img src={product.image_url || "https://placehold.co/400x300?text=Leaf+Plate"} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    {!product.is_available && (
                                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                            Out of Stock
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{product.description}</p>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                        <span className="text-2xl font-extrabold text-green-600">₹{product.price}</span>
                                        <button
                                            onClick={() => product.is_available && onAddToCart(product)}
                                            className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-300 ${product.is_available ? 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:shadow-green-200' : 'bg-gray-400 cursor-not-allowed'}`}
                                            disabled={!product.is_available}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductList;
