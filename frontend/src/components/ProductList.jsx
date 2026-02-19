import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [orderForm, setOrderForm] = useState({ customer_name: '', customer_email: '', quantity: 1 });
    const [orderStatus, setOrderStatus] = useState('');

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

    const handlePurchase = async (e) => {
        e.preventDefault();
        setOrderStatus('Processing...');
        try {
            await axios.post(`${API_URL}/orders/`, {
                ...orderForm,
                product_id: selectedProduct.id,
                product_name: selectedProduct.name
            });
            setOrderStatus('Order placed successfully! We will contact you soon.');
            setTimeout(() => {
                setSelectedProduct(null);
                setOrderStatus('');
                setOrderForm({ customer_name: '', customer_email: '', quantity: 1 });
            }, 3000);
        } catch (error) {
            console.error("Error placing order:", error);
            setOrderStatus('Failed to place order. Please try again.');
        }
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
                                            onClick={() => product.is_available && setSelectedProduct(product)}
                                            className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-300 ${product.is_available ? 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:shadow-green-200' : 'bg-gray-400 cursor-not-allowed'}`}
                                            disabled={!product.is_available}
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Purchase Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Complete Purchase</h3>
                            <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-green-50 rounded-xl">
                            <p className="text-green-800 font-semibold mb-1">Product: {selectedProduct.name}</p>
                            <p className="text-green-600 font-bold">Price: ₹{selectedProduct.price}</p>
                        </div>

                        {orderStatus && (
                            <div className={`mb-6 p-4 rounded-xl text-center text-sm font-medium ${orderStatus.includes('success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {orderStatus}
                            </div>
                        )}

                        {!orderStatus.includes('success') && (
                            <form onSubmit={handlePurchase}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Your Name</label>
                                    <input
                                        type="text" required
                                        value={orderForm.customer_name}
                                        onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                                    <input
                                        type="email" required
                                        value={orderForm.customer_email}
                                        onChange={(e) => setOrderForm({ ...orderForm, customer_email: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500"
                                        placeholder="Enter your email"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
                                    <input
                                        type="number" min="1" required
                                        value={orderForm.quantity}
                                        onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition duration-300">
                                    Place Order
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default ProductList;
