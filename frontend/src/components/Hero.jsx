const Hero = () => {
    return (
        <section id="home" className="pt-24 pb-12 bg-green-50">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 mb-8 md:mb-0">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
                        Eco-Friendly <span className="text-green-600">Leaf Plates</span>
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Sustainable, biodegradable, and natural. Make a positive impact on the environment with every meal.
                    </p>
                    <a href="#products" className="bg-green-600 text-white px-8 py-3 rounded-full text-xl hover:bg-green-700 transition duration-300">
                        Shop Now
                    </a>
                </div>
                <div className="md:w-1/2 flex justify-center">
                    <div className="w-80 h-80 bg-green-200 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-green-800 text-8xl">🌿</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
