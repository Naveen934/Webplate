import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CartModal = ({ isOpen, onClose, onAuthRequired }) => {
    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { user, token } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderMessage, setOrderMessage] = useState('');
    const [paymentInfo, setPaymentInfo] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const handleCheckout = async () => {
        if (!user) {
            onAuthRequired();
            return;
        }

        setIsProcessing(true);
        setOrderMessage('');
        setPaymentInfo(null);

        try {
            const orderData = {
                total_amount: cartTotal,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                }))
            };

            const response = await axios.post(`${API_URL}/orders/`, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;

            if (data.upi_uri || data.payment_url) {
                // Show UPI payment options
                setPaymentInfo(data);
                clearCart();
            } else if (data.order_id) {
                setOrderMessage(data.message || 'Order placed successfully!');
                setTimeout(() => { clearCart(); onClose(); }, 5000);
            }
        } catch (err) {
            console.error("Checkout error:", err.response?.data);
            const errorMsg = err.response?.data?.detail;
            if (errorMsg && errorMsg.includes("Shipping address")) {
                setOrderMessage(
                    <span>
                        <strong>Incomplete Profile!</strong><br />
                        Please add your shipping address and phone number before placing an order.
                    </span>
                );
            } else {
                setOrderMessage(errorMsg || 'Failed to place order. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };


    if (!isOpen) return null;

    // Show UPI Payment screen after order is placed
    if (paymentInfo) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
                    <div className="mb-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Order Placed! 🎉</h2>
                        <p className="text-gray-500 mt-1">Order #{paymentInfo.order_id} • ₹{paymentInfo.upi_uri?.match(/am=([^&]+)/)?.[1] || ''}</p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-600 mb-1">Complete your payment via UPI</p>
                        <p className="font-bold text-green-700 text-lg">naveen1998726-1@okicici</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        {/* GPay button - works on mobile */}
                        <a
                            href={paymentInfo.gpay_url || paymentInfo.upi_uri}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 10.9v2.2h3.6c-.2 1-1.1 2.9-3.6 2.9-2.2 0-3.9-1.8-3.9-4s1.7-4 3.9-4c1.2 0 2.1.5 2.6 1l1.5-1.5C15 6.5 13.6 6 12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6c3.5 0 5.8-2.4 5.8-5.8 0-.4 0-.7-.1-1H12z" /></svg>
                            Pay with GPay / UPI App
                        </a>

                        {/* Generic UPI link */}
                        <a
                            href={paymentInfo.upi_uri}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition"
                        >
                            📱 Open UPI App
                        </a>
                    </div>

                    <p className="text-xs text-gray-400 mb-4">
                        On mobile: tap a button above to open your UPI app.<br />
                        On desktop: scan QR from your UPI app using the UPI ID above.
                    </p>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-sm underline"
                    >
                        Done / Close
                    </button>
                </div>
            </div>
        );
    }

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
                                <div className={`mb-6 p-4 rounded-xl text-center text-sm font-medium ${typeof orderMessage === 'string' && orderMessage.toLowerCase().includes('fail') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
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

