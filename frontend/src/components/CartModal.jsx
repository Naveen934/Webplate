import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CartModal = ({ isOpen, onClose, onAuthRequired }) => {
    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { user, token } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderMessage, setOrderMessage] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const handleCheckout = async () => {
        if (!user) {
            onAuthRequired();
            return;
        }

        setIsProcessing(true);
        setOrderMessage('');

        try {
            const orderData = {
                total_amount: cartTotal,
                items: cart.map(item => ({
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const response = await axios.post(`${API_URL}/orders/`, orderData);

            if (response.data.payment_url) {
                // Redirect to payment gateway
                window.location.href = response.data.payment_url;
                clearCart();
            } else {
                setOrderMessage(response.data.message || 'Order placed, but payment gateway is busy. We will contact you.');
                setTimeout(() => {
                    clearCart();
                    onClose();
                }, 5000);
            }
        } catch (err) {
            console.error("Checkout error", err);
            setOrderMessage('Failed to place order. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Your Cart</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {cart.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-6">Your cart is empty.</p>
                        <button onClick={onClose} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold">Start Shopping</button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 mb-8">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border">
                                            <img src={item.image_url || "https://placehold.co/100x100"} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{item.name}</h3>
                                            <p className="text-green-600 font-bold">₹{item.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center border rounded-lg bg-white">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 text-gray-500 hover:text-green-600">-</button>
                                            <span className="px-3 font-medium">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-gray-500 hover:text-green-600">+</button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl text-gray-600">Total Amount</span>
                                <span className="text-3xl font-extrabold text-green-600">₹{cartTotal}</span>
                            </div>

                            {orderMessage && (
                                <div className={`mb-6 p-4 rounded-xl text-center text-sm font-medium ${orderMessage.includes('failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {orderMessage}
                                </div>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition duration-300 text-white shadow-lg ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-green-200'}`}
                            >
                                {isProcessing ? 'Processing...' : (user ? 'Checkout & Pay' : 'Login to Checkout')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CartModal;
