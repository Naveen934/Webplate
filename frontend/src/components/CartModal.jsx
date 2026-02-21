import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────
// UPI Payment Screen (shown after order is placed)
// ─────────────────────────────────────────────────────────────
const PaymentScreen = ({ paymentInfo, onClose }) => {
    const [utr, setUtr] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [confirmError, setConfirmError] = useState('');

    // Generate QR code URL via Google Charts API (no library needed)
    const qrUrl = paymentInfo.upi_uri
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentInfo.upi_uri)}`
        : null;

    // Amount from UPI URI param
    const amount = paymentInfo.upi_uri?.match(/[?&]am=([^&]+)/)?.[1] || '';

    const handleConfirmPayment = async () => {
        const cleaned = utr.trim().replace(/\s/g, '');

        // Client-side: real UPI UTR is always exactly 12 digits
        if (!/^\d{12}$/.test(cleaned)) {
            setConfirmError(
                'UTR must be exactly 12 digits. Open GPay / PhonePe → Transaction History → tap the payment → copy the 12-digit UTR/reference number.'
            );
            return;
        }

        setSubmitting(true);
        setConfirmError('');
        try {
            await axios.post(`${API_URL}/orders/${paymentInfo.order_id}/confirm`, {
                utr_number: cleaned,
            });
            setConfirmed(true);
        } catch (err) {
            // Show the exact error from the backend
            const msg = err.response?.data?.detail || 'Failed to submit. Please try again.';
            setConfirmError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (confirmed) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
                <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Submitted! 🎉</h2>
                    <p className="text-gray-500 text-sm mb-2">Order #{paymentInfo.order_id}</p>
                    <p className="text-gray-500 text-sm mb-6">
                        Your UTR <span className="font-mono font-bold text-gray-700">{utr}</span> has been recorded.<br />
                        We'll confirm your order shortly.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
            {/* Full-screen on mobile, card on desktop */}
            <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Complete Payment</h2>
                        <p className="text-xs text-gray-400">Order #{paymentInfo.order_id}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-4">
                    {/* Amount badge */}
                    <div className="text-center mb-5">
                        <span className="text-4xl font-extrabold text-green-600">₹{amount}</span>
                        <p className="text-gray-500 text-sm mt-1">Pay to <strong>naveen1998726-1@okicici</strong></p>
                    </div>

                    {/* QR Code */}
                    {qrUrl && (
                        <div className="flex flex-col items-center mb-5">
                            <div className="border-4 border-green-500 rounded-2xl p-2 bg-white shadow-md">
                                <img
                                    src={qrUrl}
                                    alt="UPI QR Code"
                                    className="w-48 h-48 rounded-lg"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Scan with any UPI app</p>
                        </div>
                    )}

                    {/* App buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <a
                            href={paymentInfo.upi_uri}
                            className="flex flex-col items-center justify-center py-3 px-2 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition"
                        >
                            <span className="text-2xl mb-1">💳</span>
                            <span className="text-xs font-bold text-blue-700">GPay / PhonePe</span>
                            <span className="text-xs text-blue-500">Tap to open app</span>
                        </a>
                        <a
                            href={`intent://pay?pa=naveen1998726-1@okicici&pn=Naveen&am=${amount}&cu=INR&tn=Order%20${paymentInfo.order_id}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`}
                            className="flex flex-col items-center justify-center py-3 px-2 bg-orange-50 border-2 border-orange-200 rounded-xl hover:bg-orange-100 transition"
                        >
                            <span className="text-2xl mb-1">🟠</span>
                            <span className="text-xs font-bold text-orange-700">Any UPI App</span>
                            <span className="text-xs text-orange-500">Android / iOS</span>
                        </a>
                    </div>

                    {/* UPI ID copy */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">UPI ID</p>
                            <p className="font-mono font-bold text-gray-700 text-sm">naveen1998726-1@okicici</p>
                        </div>
                        <button
                            onClick={() => navigator.clipboard.writeText('naveen1998726-1@okicici')}
                            className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition"
                        >
                            Copy
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-4">
                        <div className="border-t border-gray-200" />
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-xs text-gray-400">
                            After paying, enter your UTR
                        </span>
                    </div>

                    {/* UTR Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            UTR / Reference Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={12}
                            value={utr}
                            onChange={(e) => {
                                // Only allow digits
                                setUtr(e.target.value.replace(/\D/g, ''));
                                setConfirmError('');
                            }}
                            placeholder="12-digit UTR (e.g. 407123456789)"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-green-500 transition"
                        />
                        {/* Live digit counter */}
                        <p className={`text-xs mt-1 ${utr.length === 12 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                            {utr.length}/12 digits {utr.length === 12 ? '✓' : ''}
                        </p>
                        {confirmError && (
                            <p className="text-red-500 text-xs mt-1.5 leading-relaxed">{confirmError}</p>
                        )}
                        <div className="mt-2 bg-blue-50 rounded-lg p-2.5 text-xs text-blue-700">
                            <p className="font-semibold mb-0.5">📱 How to find your UTR:</p>
                            <p>GPay: Open app → Transactions → tap payment → see "UPI transaction ID"</p>
                            <p>PhonePe: History → tap payment → "Transaction ID" (12 digits)</p>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirmPayment}
                        disabled={submitting}
                        className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition disabled:opacity-60 mb-3"
                    >
                        {submitting ? 'Submitting...' : "✅ I've Paid — Submit UTR"}
                    </button>

                    <button onClick={onClose} className="w-full text-gray-400 text-sm hover:text-gray-600 py-2">
                        I'll pay later
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Cart Modal
// ─────────────────────────────────────────────────────────────
const CartModal = ({ isOpen, onClose, onAuthRequired }) => {
    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { user, token } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderMessage, setOrderMessage] = useState('');
    const [paymentInfo, setPaymentInfo] = useState(null);

    const handleCheckout = async () => {
        if (!user) { onAuthRequired(); return; }

        setIsProcessing(true);
        setOrderMessage('');
        setPaymentInfo(null);

        try {
            const orderData = {
                total_amount: cartTotal,
                items: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
            };
            const response = await axios.post(`${API_URL}/orders/`, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            if (data.upi_uri || data.payment_url) {
                setPaymentInfo(data);
                clearCart();
            } else if (data.order_id) {
                setOrderMessage(data.message || 'Order placed!');
                setTimeout(() => { clearCart(); onClose(); }, 4000);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail;
            if (errorMsg?.includes('Shipping address')) {
                setOrderMessage('❌ Please add your shipping address and phone number in your profile before ordering.');
            } else {
                setOrderMessage(errorMsg || 'Failed to place order. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;
    if (paymentInfo) return <PaymentScreen paymentInfo={paymentInfo} onClose={onClose} />;

    return (
        /* Mobile: slide up from bottom. Desktop: centered modal */
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
            <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-y-auto max-h-[92vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center px-5 pt-5 pb-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800">Your Cart 🛒</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-4">
                    {cart.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-5xl mb-4">🛒</p>
                            <p className="text-gray-500 mb-6 font-medium">Your cart is empty</p>
                            <button onClick={onClose} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition">
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Items */}
                            <div className="space-y-3 mb-5">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-14 h-14 bg-white rounded-lg overflow-hidden border flex-shrink-0">
                                            <img src={item.image_url || 'https://placehold.co/100x100'} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                                            <p className="text-green-600 font-bold text-sm">₹{item.price}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <div className="flex items-center border rounded-lg bg-white">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1 text-gray-500 hover:text-green-600 font-bold">−</button>
                                                <span className="px-2 font-medium text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1 text-gray-500 hover:text-green-600 font-bold">+</button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total + Checkout */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-5">
                                    <span className="text-lg text-gray-600 font-medium">Total</span>
                                    <span className="text-3xl font-extrabold text-green-600">₹{cartTotal}</span>
                                </div>

                                {orderMessage && (
                                    <div className={`mb-4 p-4 rounded-xl text-center text-sm font-medium ${orderMessage.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        {orderMessage}
                                    </div>
                                )}

                                <button
                                    onClick={handleCheckout}
                                    disabled={isProcessing}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition text-white shadow-lg ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {isProcessing ? '⏳ Processing...' : (user ? '🔒 Checkout & Pay' : '🔑 Login to Checkout')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartModal;
