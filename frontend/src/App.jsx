import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import ContactForm from './components/ContactForm';
import CartModal from './components/CartModal';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | null

  return (
    <div className="font-sans antialiased text-gray-900">
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setAuthMode('login')}
      />
      <Hero />
      <main>
        <div id="about" className="py-12 bg-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">About Us</h2>
            <p className="max-w-3xl mx-auto text-gray-600">
              We are dedicated to providing sustainable, eco-friendly dining solutions. Our leaf plates are made from naturally fallen leaves, processed without chemicals, and are fully biodegradable. Join us in reducing plastic waste and embracing a greener future.
            </p>
          </div>
        </div>
        <ProductList />
        <ContactForm />
      </main>

      {/* Modals */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onAuthRequired={() => setAuthMode('login')}
      />

      {authMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          {authMode === 'login' ? (
            <Login
              onToggle={() => setAuthMode('register')}
              onClose={() => setAuthMode(null)}
            />
          ) : (
            <Register
              onToggle={() => setAuthMode('login')}
              onClose={() => setAuthMode(null)}
            />
          )}
        </div>
      )}

      <footer className="bg-gray-800 text-white py-8 text-center">
        <p>&copy; {new Date().getFullYear()} Leaf Plate Sales. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
