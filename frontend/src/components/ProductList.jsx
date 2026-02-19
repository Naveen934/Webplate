import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, use the environment variable for API URL
        // const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        // For now, hardcoding or using relative if proxy is set up
        // Using localhost for dev
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

    return (
        <section id="products" className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Our Premium Leaf Plates</h2>

                {loading ? (
                    <p className="text-center text-gray-500">Loading products...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {products.map(product => (
                            <div key={product.id} className="bg-gray-50 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                                <img src={product.image_url || "https://placehold.co/400x300?text=Leaf+Plate"} alt={product.name} className="w-full h-48 object-cover" />
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
                                    <p className="text-gray-600 mb-4">{product.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-2xl font-bold text-green-600">${product.price}</span>
                                        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300">
                                            Buy Now
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
