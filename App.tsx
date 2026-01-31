
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Language, 
  Currency, 
  AppSettings, 
  Product, 
  User, 
  Review 
} from './types';
import { TRANSLATIONS, INITIAL_PRODUCTS } from './constants';
import { generateProductDescription } from './services/geminiService';

// --- Helper Functions ---

const EX_RATE_USD_TO_CAD = 1.38;

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getFromStorage = (key: string, defaultValue: any) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const calculateAverageRating = (reviews: Review[]) => {
  if (!reviews || reviews.length === 0) return 5.0;
  const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
  return (sum / reviews.length).toFixed(1);
};

const getConvertedPrice = (price: number, currency: Currency) => {
  if (currency === Currency.CAD) {
    return Math.round(price * EX_RATE_USD_TO_CAD);
  }
  return price;
};

const formatPrice = (price: number, currency: Currency) => {
  const converted = getConvertedPrice(price, currency);
  const symbol = currency === Currency.USD ? '$' : 'C$';
  return `${symbol}${converted}`;
};

// --- Components ---

const Navbar: React.FC<{
  settings: AppSettings;
  user: User | null;
  onOpenSettings: () => void;
  onOpenSignIn: () => void;
  onSignOut: () => void;
  onOpenAdmin: () => void;
  onOpenCart: () => void;
  cartCount: number;
}> = ({ settings, user, onOpenSettings, onOpenSignIn, onSignOut, onOpenAdmin, onOpenCart, cartCount }) => {
  const t = TRANSLATIONS[settings.language];
  const isRtl = settings.language === Language.ARABIC;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <i className="fas fa-bolt text-xl"></i>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t.appName}
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
            <button 
              onClick={onOpenSettings}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <i className="fas fa-cog"></i>
            </button>
            <div className="relative">
              <button 
                onClick={onOpenCart}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                <i className="fas fa-shopping-cart"></i>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-primary text-[10px] text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
            {user?.isAdmin && (
              <button 
                onClick={onOpenAdmin}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg font-medium hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-800"
              >
                {t.admin}
              </button>
            )}
            {user ? (
              <button 
                onClick={onSignOut}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all"
              >
                {t.signOut}
              </button>
            ) : (
              <button 
                onClick={onOpenSignIn}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                {t.signIn}
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={onOpenCart} className="relative p-2 text-slate-600 dark:text-slate-400">
               <i className="fas fa-shopping-cart"></i>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-[10px] text-white rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
            </button>
            <button onClick={onOpenSettings} className="p-2 text-slate-600 dark:text-slate-400"><i className="fas fa-cog"></i></button>
            {user ? (
               <button onClick={onSignOut} className="p-2 text-red-600"><i className="fas fa-sign-out-alt"></i></button>
            ) : (
               <button onClick={onOpenSignIn} className="p-2 text-primary"><i className="fas fa-user"></i></button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const ProductCard: React.FC<{
  product: Product;
  settings: AppSettings;
  onClick: () => void;
}> = ({ product, settings, onClick }) => {
  const t = TRANSLATIONS[settings.language];
  const isRtl = settings.language === Language.ARABIC;
  const rating = calculateAverageRating(product.reviews);

  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-amber-500 shadow-sm border border-slate-200 dark:border-slate-700">
            <i className="fas fa-star text-xs"></i>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{rating}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg mb-1 truncate group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black text-primary">
            {formatPrice(product.price, settings.currency)}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {product.reviews.length} {t.reviews}
          </span>
        </div>
      </div>
    </div>
  );
};

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isRtl?: boolean;
}> = ({ isOpen, onClose, title, children, isRtl }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
          <h2 className="text-xl font-bold truncate pr-4">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors flex-shrink-0">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6 overflow-y-auto no-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  // Persistence Initialization
  const [settings, setSettings] = useState<AppSettings>(() => getFromStorage('texpress_settings', {
    language: Language.ENGLISH,
    currency: Currency.USD,
    isDarkMode: false
  }));
  const [products, setProducts] = useState<Product[]>(() => getFromStorage('texpress_products', INITIAL_PRODUCTS));
  const [cart, setCart] = useState<string[]>(() => getFromStorage('texpress_cart', []));
  const [user, setUser] = useState<User | null>(() => getFromStorage('texpress_user', null));
  
  // UI states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  const t = TRANSLATIONS[settings.language];
  const isRtl = settings.language === Language.ARABIC;

  // Derived state
  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);
  const cartProducts = useMemo(() => cart.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[], [cart, products]);

  // Persistence Effects
  useEffect(() => saveToStorage('texpress_settings', settings), [settings]);
  useEffect(() => saveToStorage('texpress_products', products), [products]);
  useEffect(() => saveToStorage('texpress_cart', cart), [cart]);
  useEffect(() => saveToStorage('texpress_user', user), [user]);

  // Reset active image when changing product
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedProductId]);

  // Dark mode effect
  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.isDarkMode]);

  const handleSignIn = () => {
    if (loginEmail && loginPass) {
      const newUser = { email: loginEmail, isAdmin: loginPass === '1212' };
      setUser(newUser);
      setIsSignInOpen(false);
      setLoginEmail('');
      setLoginPass('');
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setIsAdminOpen(false);
  };

  const addToCart = (productId: string) => {
    setCart(prev => [...prev, productId]);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleBuyNow = (product: Product) => {
    const priceStr = formatPrice(product.price, settings.currency);
    const message = encodeURIComponent(
        `Hello Texpress Admin!\n\nI want to buy this product:\nName: ${product.name}\nPrice: ${priceStr}\nWeight: ${product.weight} kg\n\nPlease contact me for payment and shipping details.`
    );
    window.open(`https://m.me/khaled.et.9?text=${message}`, '_blank');
  };

  const handleCheckoutCart = () => {
    if (cartProducts.length === 0) return;
    const itemsList = cartProducts.map(p => `- ${p.name} (${formatPrice(p.price, settings.currency)})`).join('\n');
    const totalRaw = cartProducts.reduce((sum, p) => sum + p.price, 0);
    const totalStr = formatPrice(totalRaw, settings.currency);
    const message = encodeURIComponent(
        `Hello Texpress Admin!\n\nI want to buy these items from my cart:\n${itemsList}\n\nTotal: ${totalStr}\n\nPlease contact me for payment.`
    );
    window.open(`https://m.me/khaled.et.9?text=${message}`, '_blank');
  };

  const handleAddReview = (productId: string) => {
    if (!user) {
      setIsSignInOpen(true);
      return;
    }
    if (!newReview.comment.trim()) return;

    const review: Review = {
      id: Date.now().toString(),
      userId: user.email,
      userName: user.email.split('@')[0],
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toLocaleDateString()
    };
    
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, reviews: [review, ...p.reviews] } : p
    ));
    setNewReview({ rating: 5, comment: '' });
  };

  const handleSaveProduct = async (p: Partial<Product>) => {
    if (editingProduct) {
      setProducts(prev => prev.map(item => item.id === editingProduct.id ? { ...item, ...p } as Product : item));
      setEditingProduct(null);
    } else {
      const desc = p.description || await generateProductDescription(p.name || '', p.price || 0, p.weight || 0);
      const newProd: Product = {
        id: Date.now().toString(),
        name: p.name || 'New Product',
        price: p.price || 0,
        weight: p.weight || 0,
        description: desc,
        images: p.images || ['https://picsum.photos/id/1/600/600'],
        attributes: p.attributes || [],
        reviews: [],
        category: 'General'
      };
      setProducts(prev => [...prev, newProd]);
      setIsAddingProduct(false);
    }
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setCart(prev => prev.filter(cid => cid !== id));
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 bg-slate-50 dark:bg-slate-900`}>
      <Navbar 
        settings={settings} 
        user={user} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onSignOut={handleSignOut}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cart.length}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-indigo-600 to-secondary p-8 md:p-16 mb-12 text-white">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              {settings.language === Language.ENGLISH ? 'Texpress: Fast & Elegant' : 
               settings.language === Language.ARABIC ? 'تيكسبرس: سريع وأنيق' : 
               'Texpress: Rapide & Élégant'}
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 font-medium">
              Discover the latest premium tech and fashion essentials curated for the modern lifestyle.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-white text-primary rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-black/20">
                Explore Collection
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
            <img 
              src="https://picsum.photos/id/6/800/800" 
              className="w-full h-full object-cover mix-blend-overlay opacity-30"
              alt="Hero"
            />
          </div>
        </section>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(p => (
            <ProductCard 
              key={p.id} 
              product={p} 
              settings={settings} 
              onClick={() => setSelectedProductId(p.id)} 
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-200 dark:border-slate-800 mt-20 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          ©️2026 TeXpress. All rights reserved
        </p>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProductId(null)} 
          title={selectedProduct.name}
          isRtl={isRtl}
        >
          <div className="space-y-6">
            {/* Professional Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-inner">
                <img 
                    src={selectedProduct.images[activeImageIndex]} 
                    className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-300" 
                    alt={selectedProduct.name} 
                />
              </div>
              {selectedProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {selectedProduct.images.map((img, i) => (
                        <button 
                            key={i} 
                            onClick={() => setActiveImageIndex(i)}
                            className={`w-20 h-20 flex-shrink-0 rounded-lg border-2 transition-all overflow-hidden ${activeImageIndex === i ? 'border-primary shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                            <img src={img} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-3xl font-black text-primary mb-1">
                  {formatPrice(selectedProduct.price, settings.currency)}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  {t.weight}: {selectedProduct.weight}{t.kg}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-800">
                <span className="text-amber-500 font-black">{calculateAverageRating(selectedProduct.reviews)}</span>
                <div className="flex gap-0.5 text-amber-400">
                  <i className="fas fa-star text-sm"></i>
                </div>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {selectedProduct.description}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { addToCart(selectedProduct.id); setIsCartOpen(true); }}
                className="py-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-cart-plus"></i> {t.addToCart}
              </button>
              <button 
                onClick={() => handleBuyNow(selectedProduct)}
                className="py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                <i className="fab fa-facebook-messenger"></i> {t.buyNow}
              </button>
            </div>

            {/* Reviews Section */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <i className="fas fa-comments text-primary"></i> {t.reviews} ({selectedProduct.reviews.length})
              </h3>
              
              <div className="space-y-4 mb-8">
                {selectedProduct.reviews.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 italic">No reviews yet. Be the first to review!</p>
                ) : (
                  selectedProduct.reviews.map(rev => (
                    <div key={rev.id} className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                {rev.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{rev.userName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{rev.date}</span>
                      </div>
                      <div className="flex gap-1 text-amber-400 text-[10px] mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <i key={i} className={`fas fa-star ${i < rev.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}></i>
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t.leaveReview}</p>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setNewReview({ ...newReview, rating: s })}
                      className={`text-2xl transition-all hover:scale-110 ${s <= newReview.rating ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200 dark:text-slate-700'}`}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
                <textarea 
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                  rows={3}
                  placeholder="Share your thoughts about this product..."
                />
                <button 
                  onClick={() => handleAddReview(selectedProduct.id)}
                  className="w-full py-4 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  {t.submit}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cart Modal */}
      <Modal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        title={t.cart}
        isRtl={isRtl}
      >
        <div className="space-y-4">
          {cartProducts.length === 0 ? (
            <div className="text-center py-12">
                <i className="fas fa-shopping-basket text-5xl text-slate-200 dark:text-slate-700 mb-4"></i>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{t.emptyCart}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {cartProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <img src={p.images[0]} className="w-16 h-16 object-cover rounded-lg" alt={p.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                      <p className="text-primary font-black">{formatPrice(p.price, settings.currency)}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(i)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-slate-500 font-medium">{t.total}</span>
                  <span className="text-2xl font-black text-primary">
                    {formatPrice(cartProducts.reduce((sum, p) => sum + p.price, 0), settings.currency)}
                  </span>
                </div>
                <button 
                  onClick={handleCheckoutCart}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fab fa-facebook-messenger text-xl"></i> Checkout via Messenger
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        title={t.settings}
        isRtl={isRtl}
      >
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-500 uppercase tracking-widest">{t.language}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: Language.ENGLISH, label: 'English' },
                { val: Language.ARABIC, label: 'العربية' },
                { val: Language.FRENCH, label: 'Français' }
              ].map(l => (
                <button 
                  key={l.val}
                  onClick={() => setSettings({ ...settings, language: l.val })}
                  className={`py-3 rounded-xl border-2 transition-all font-medium ${settings.language === l.val ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-500 uppercase tracking-widest">{t.currency}</label>
            <div className="grid grid-cols-2 gap-2">
              {[Currency.USD, Currency.CAD].map(c => (
                <button 
                  key={c}
                  onClick={() => setSettings({ ...settings, currency: c })}
                  className={`py-3 rounded-xl border-2 transition-all font-medium ${settings.currency === c ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-200">{t.darkMode}</span>
            <button 
              onClick={() => setSettings({ ...settings, isDarkMode: !settings.isDarkMode })}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.isDarkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-lg transition-transform duration-300 ${settings.isDarkMode ? (isRtl ? '-translate-x-6' : 'translate-x-6') : ''}`} />
            </button>
          </div>
        </div>
      </Modal>

      {/* Sign In Modal */}
      <Modal 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)} 
        title={t.signIn}
        isRtl={isRtl}
      >
        <div className="space-y-5">
          <div className="text-center mb-4">
              <i className="fas fa-user-circle text-5xl text-primary/20 mb-2"></i>
              <p className="text-slate-500 text-sm">Welcome back to Texpress</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-400">Email Address</label>
            <input 
              type="email" 
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-400">{t.password}</label>
            <input 
              type="password" 
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="••••••••"
            />
          </div>
          <button 
            onClick={handleSignIn}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.01] transition-all active:scale-95"
          >
            {t.signIn}
          </button>
        </div>
      </Modal>

      {/* Admin Panel Modal */}
      <Modal 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        title={`${t.admin} Dashboard`}
        isRtl={isRtl}
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
            <div>
                <h3 className="font-black text-indigo-700 dark:text-indigo-300">Total Products</h3>
                <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100">{products.length}</p>
            </div>
            <button 
              onClick={() => setIsAddingProduct(true)}
              className="px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20 flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> {t.addProduct}
            </button>
          </div>
          
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-primary/30 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <img src={p.images[0]} className="w-12 h-12 object-cover rounded-xl shadow-sm border border-slate-200 dark:border-slate-700" alt={p.name} />
                  <div>
                      <span className="block font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">{p.name}</span>
                      <span className="text-xs text-primary font-bold">{formatPrice(p.price, settings.currency)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingProduct(p)}
                    className="p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    onClick={() => deleteProduct(p.id)}
                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Add/Edit Product Modal */}
      {(isAddingProduct || editingProduct) && (
        <Modal 
          isOpen={true} 
          onClose={() => { setIsAddingProduct(false); setEditingProduct(null); (window as any)._tempImg = null; }} 
          title={editingProduct ? t.editProduct : t.addProduct}
          isRtl={isRtl}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-1 text-slate-500 uppercase tracking-widest">{t.name}</label>
              <input 
                defaultValue={editingProduct?.name || ''}
                id="pName"
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-500 uppercase tracking-widest">{t.price} (USD)</label>
                <input 
                  type="number"
                  defaultValue={editingProduct?.price || ''}
                  id="pPrice"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-500 uppercase tracking-widest">{t.weight}</label>
                <input 
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.weight || ''}
                  id="pWeight"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-500 uppercase tracking-widest">Description</label>
              <textarea 
                defaultValue={editingProduct?.description || ''}
                id="pDesc"
                rows={3}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                placeholder="Marketing description (leave empty for AI generation)"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-500 uppercase tracking-widest">Images (Select File)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <i className="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-2"></i>
                    <p className="text-xs text-slate-500">Click to upload product image</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          (window as any)._tempImg = reader.result;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <button 
              onClick={() => {
                const name = (document.getElementById('pName') as HTMLInputElement).value;
                const price = Number((document.getElementById('pPrice') as HTMLInputElement).value);
                const weight = Number((document.getElementById('pWeight') as HTMLInputElement).value);
                const description = (document.getElementById('pDesc') as HTMLTextAreaElement).value;
                const images = (window as any)._tempImg ? [(window as any)._tempImg] : (editingProduct?.images || ['https://picsum.photos/id/1/600/600']);
                handleSaveProduct({ name, price, weight, description, images });
              }}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold mt-4 shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              {t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* Floating Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-around items-center z-[90] rounded-[2rem] shadow-2xl">
        <button className="text-primary hover:scale-110 transition-transform"><i className="fas fa-home text-2xl"></i></button>
        <button className="text-slate-400 hover:scale-110 transition-transform"><i className="fas fa-search text-2xl"></i></button>
        <button className="relative text-slate-400 hover:scale-110 transition-transform" onClick={() => setIsCartOpen(true)}>
          <i className="fas fa-shopping-cart text-2xl"></i>
          {cart.length > 0 && <span className="absolute -top-1 -right-2 bg-primary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
        </button>
        <button onClick={() => setIsSettingsOpen(true)} className="text-slate-400 hover:scale-110 transition-transform"><i className="fas fa-cog text-2xl"></i></button>
        {user?.isAdmin && (
           <button onClick={() => setIsAdminOpen(true)} className="text-indigo-500 hover:scale-110 transition-transform"><i className="fas fa-user-shield text-2xl"></i></button>
        )}
      </div>
    </div>
  );
}
