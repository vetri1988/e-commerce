import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSlider from './components/HeroSlider';
import FlashMessage from './components/FlashMessage';
import ProductDetailModal from './components/ProductDetailModal';
import CheckoutModal from './components/CheckoutModal';
import InvoicePrintable from './components/InvoicePrintable';
import AdminPortal from './components/AdminPortal';
import UserAuthModal from './components/UserAuthModal';
import UserProfileModal from './components/UserProfileModal';
import GeneralEnquiryCard from './components/GeneralEnquiryCard';
import LogisticsTracker from './components/LogisticsTracker';
import { Product, Category, CartItem, Order, CompanySettings } from './types';
import { 
  ShoppingBag, 
  Heart, 
  HelpCircle, 
  PhoneCall, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Percent, 
  ShieldCheck, 
  ArrowLeft, 
  X, 
  Star, 
  Plus, 
  Minus, 
  TrendingUp, 
  Award, 
  Truck, 
  Sparkles,
  Search,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const THEMES: Record<string, {
  id: string;
  amber50: string;
  amber100: string;
  amber200: string;
  amber300: string;
  amber400: string;
  amber500: string;
  amber600: string;
  amber700: string;
  amber800: string;
  amber900: string;
  amber950: string;
  slate950: string;
  slate900: string;
  slate850: string;
  slate800: string;
  slate700: string;
}> = {
  csk: {
    id: 'csk',
    amber50: '#fffbeb',
    amber100: '#fef3c7',
    amber200: '#fde68a',
    amber300: '#fcd34d',
    amber400: '#fbbf24',
    amber500: '#f7d117',
    amber600: '#e0ab09',
    amber700: '#b58005',
    amber800: '#8f5f02',
    amber900: '#6b4301',
    amber950: '#3c2100',
    slate950: '#020b1e',
    slate900: '#06163a',
    slate850: '#0a1f4f',
    slate800: '#102a66',
    slate700: '#16367c'
  },
  rcb: {
    id: 'rcb',
    amber50: '#fef2f2',
    amber100: '#fee2e2',
    amber200: '#fecaca',
    amber300: '#fca5a5',
    amber400: '#f87171',
    amber500: '#ec1c24',
    amber600: '#dc2626',
    amber700: '#b91c1c',
    amber800: '#991b1b',
    amber900: '#7f1d1d',
    amber950: '#450a0a',
    slate950: '#0a0909',
    slate900: '#121111',
    slate850: '#1c1a1a',
    slate800: '#2c2929',
    slate700: '#3c3838'
  },
  mi: {
    id: 'mi',
    amber50: '#fdfbeb',
    amber100: '#fbf5c2',
    amber200: '#f7eb8b',
    amber300: '#f3dd50',
    amber400: '#f0d227',
    amber500: '#e2b400',
    amber600: '#bd9400',
    amber700: '#947200',
    amber800: '#705300',
    amber900: '#4a3700',
    amber950: '#2b2000',
    slate950: '#00102b',
    slate900: '#001b44',
    slate850: '#002966',
    slate800: '#003a91',
    slate700: '#004ebd'
  },
  forest: {
    id: 'forest',
    amber50: '#ecfdf5',
    amber100: '#d1fae5',
    amber200: '#a7f3d0',
    amber300: '#6ee7b7',
    amber400: '#34d399',
    amber500: '#10b981',
    amber600: '#059669',
    amber700: '#047857',
    amber800: '#065f46',
    amber900: '#064e3b',
    amber950: '#022c22',
    slate950: '#030805',
    slate900: '#07150d',
    slate850: '#102d1d',
    slate800: '#1a492e',
    slate700: '#236540'
  },
  cyberpunk: {
    id: 'cyberpunk',
    amber50: '#fff1f2',
    amber100: '#ffe4e6',
    amber200: '#fecdd3',
    amber300: '#fda4af',
    amber400: '#fb7185',
    amber500: '#ff007f',
    amber600: '#e11d48',
    amber700: '#be123c',
    amber800: '#9f1239',
    amber900: '#881337',
    amber950: '#4c0519',
    slate950: '#040208',
    slate900: '#0c0419',
    slate850: '#170830',
    slate800: '#240c4c',
    slate700: '#34116d'
  }
};

export default function App() {
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 180;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string>(() => {
    let id = localStorage.getItem('rstech_cart_id');
    if (!id) {
      id = 'cart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('rstech_cart_id', id);
    }
    return id;
  });
  const [favouriteList, setFavouriteList] = useState<string[]>([]);
  const [activePage, setActivePage] = useState<string>('home'); // 'home', 'orders', 'about', 'shipping'
  
  // Interface Overlays (drawer, modally)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isUserAuthModalOpen, setIsUserAuthModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('rstech_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Coupons
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Post checkout printable receipt
  const [recentOrderReceipt, setRecentOrderReceipt] = useState<Order | null>(null);
  const [isJustCheckedOut, setIsJustCheckedOut] = useState(false);

  // Search filter options
  const [brandFilter, setBrandFilter] = useState('All');
  const [priceSort, setPriceSort] = useState('default');

  // Master settings state
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "CromaTech India Private Limited",
    shortName: "CromaTech Depot",
    address: "No. 12, GST Road, Guindy, Chennai, Tamil Nadu, 600032",
    gstin: "33AAAAA1111A1Z1",
    phone: "+91 80 4920 1000",
    email: "orders@cromatech.co.in",
    whatsapp: "918049201000",
    adminPassword: "admin"
  });

  const fetchCatalog = async () => {
    try {
      const pRes = await fetch('/api/products');
      if (pRes.ok) setProducts(await pRes.json());

      const cRes = await fetch('/api/categories');
      if (cRes.ok) setCategories(await cRes.json());

      const oRes = await fetch('/api/orders');
      if (oRes.ok) setOrders(await oRes.json());

      const sRes = await fetch('/api/settings');
      if (sRes.ok) setSettings(await sRes.json());
    } catch (err) {
      console.error("Failed to load catalog resources", err);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Sync open cart items & user details to backend to track active/abandoned carts in real-time
  useEffect(() => {
    if (cart.length === 0) return;

    const syncCartWithServer = async () => {
      try {
        const cartTotal = calculateCartTotal();
        await fetch('/api/carts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: cartId,
            userId: currentUser?.id || null,
            userEmail: currentUser?.email || null,
            userPhone: currentUser?.phone || null,
            fullName: currentUser?.name || currentUser?.fullName || null,
            items: cart,
            totalAmount: cartTotal,
            status: 'active'
          })
        });
      } catch (err) {
        console.error("Cart synchronization with server failed", err);
      }
    };

    const debounceTimer = setTimeout(syncCartWithServer, 1000);
    return () => clearTimeout(debounceTimer);
  }, [cart, currentUser, cartId]);

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
    // Invalidate applied coupons if total changes and breaks minimum order
    if (couponApplied) {
      setCouponApplied(null);
      setCouponError('Total changed, please re-apply promo coupon.');
    }
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.offerPrice * item.quantity, 0);
  };

  const applyPromoCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    const cartTotal = calculateCartTotal();
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartTotal })
      });

      if (res.ok) {
        const result = await res.json();
        setCouponApplied({
          code: result.code,
          discountAmount: result.discountAmount
        });
        setCouponCode('');
      } else {
        const err = await res.json();
        setCouponError(err.error || 'Invalid coupon promotion code.');
      }
    } catch (e) {
      setCouponError('Invalid coupon promotion code.');
    }
  };

  const handleCheckoutSuccess = (finishedOrder: Order) => {
    // Deduct items locally for instant responsiveness
    setProducts(prev => prev.map(p => {
      const ordItem = finishedOrder.items.find(item => item.productId === p.id);
      if (ordItem) {
        return { ...p, stock: Math.max(0, p.stock - ordItem.quantity) };
      }
      return p;
    }));

    // Reset shopping session
    setCart([]);
    setCouponApplied(null);
    setIsCheckingOut(false);
    setIsCartOpen(false);

    // Refresh cart ID for subsequent shopping sessions
    const nextCartId = 'cart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('rstech_cart_id', nextCartId);
    setCartId(nextCartId);

    // Launch compliances Printable invoice instantly
    setIsJustCheckedOut(true);
    setRecentOrderReceipt(finishedOrder);
    fetchCatalog(); // Refresh catalog state from server
  };

  const toggleFavourite = (id: string) => {
    setFavouriteList(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Dynamic filter sets based on selections
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase();
    
    const keywords = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
                           p.name.toLowerCase().includes(keywords) || 
                           p.brand.toLowerCase().includes(keywords) || 
                           p.sku.toLowerCase().includes(keywords) ||
                           p.hsnCode.includes(keywords) ||
                           p.description.toLowerCase().includes(keywords);

    const matchesBrand = brandFilter === 'All' || p.brand.toLowerCase() === brandFilter.toLowerCase();

    return matchesCategory && matchesSearch && matchesBrand;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (priceSort === 'price-low') return a.offerPrice - b.offerPrice;
    if (priceSort === 'price-high') return b.offerPrice - a.offerPrice;
    if (priceSort === 'rating') return b.rating - a.rating;
    return 0; // Default listing sequence
  });

  // Extract unique brands list from currently loaded catalog
  const uniqueBrands = ['All', ...new Set(products.map(p => p.brand))];

  // Restrict order logs / history to logged-in user
  const userOrders = currentUser 
    ? orders.filter(o => o.shippingAddress?.email?.trim().toLowerCase() === currentUser.email?.trim().toLowerCase())
    : [];

  // If the admin button was pressed, render the standalone admin system interface
  const activeColorTheme = settings.colorTheme || 'csk';
  const theme = THEMES[activeColorTheme] || THEMES.csk;

  const themeStyleBlock = (
    <style dangerouslySetInnerHTML={{ __html: `
      :root {
        --color-amber-50: ${theme.amber50} !important;
        --color-amber-100: ${theme.amber100} !important;
        --color-amber-200: ${theme.amber200} !important;
        --color-amber-300: ${theme.amber300} !important;
        --color-amber-400: ${theme.amber400} !important;
        --color-amber-500: ${theme.amber500} !important;
        --color-amber-600: ${theme.amber600} !important;
        --color-amber-700: ${theme.amber700} !important;
        --color-amber-800: ${theme.amber800} !important;
        --color-amber-900: ${theme.amber900} !important;
        --color-amber-955: ${theme.amber950} !important;
        --color-amber-950: ${theme.amber950} !important;
        
        --color-slate-950: ${theme.slate950} !important;
        --color-slate-900: ${theme.slate900} !important;
        --color-slate-850: ${theme.slate850} !important;
        --color-slate-800: ${theme.slate800} !important;
        --color-slate-700: ${theme.slate700} !important;
      }
      
      .bg-amber-500:not([class*="/"]), 
      .bg-amber-400:not([class*="/"]), 
      .bg-amber-600:not([class*="/"]),
      [class*="bg-amber-500"]:not([class*="/"]),
      [class*="bg-amber-400"]:not([class*="/"]),
      [class*="bg-amber-600"]:not([class*="/"]) {
        --color-slate-950: ${theme.slate950} !important;
        color: ${theme.id === 'csk' ? '#020b1e' : '#ffffff'} !important;
      }

      .bg-amber-500:not([class*="/"]) svg, 
      .bg-amber-400:not([class*="/"]) svg, 
      .bg-amber-600:not([class*="/"]) svg,
      [class*="bg-amber-500"]:not([class*="/"]) svg,
      [class*="bg-amber-400"]:not([class*="/"]) svg,
      [class*="bg-amber-600"]:not([class*="/"]) svg {
        stroke: ${theme.id === 'csk' ? '#020b1e' : '#ffffff'} !important;
        color: ${theme.id === 'csk' ? '#020b1e' : '#ffffff'} !important;
      }

      select option {
        background-color: ${theme.slate900} !important;
        color: #ffffff !important;
      }

      /* Keep custom borders highlighted on focused fields */
      .focus\\:border-amber-500:focus {
        border-color: ${theme.amber500} !important;
      }
    `}} />
  );

  if (isAdminMode) {
    return (
      <>
        {themeStyleBlock}
        <AdminPortal 
          onOrderSelected={(o) => {
            setIsAdminMode(false);
            setRecentOrderReceipt(o);
          }}
          onClose={() => {
            setIsAdminMode(false);
            fetchCatalog();
          }} 
        />
      </>
    );
  }

  // If a payment just succeeded, view/print the compliance bill invoice directly
  if (recentOrderReceipt) {
    return (
      <>
        {themeStyleBlock}
        <InvoicePrintable 
          order={recentOrderReceipt} 
          settings={settings}
          isNewOrder={isJustCheckedOut}
          currentUserEmail={currentUser?.email}
          onClose={() => {
            setIsJustCheckedOut(false);
            setRecentOrderReceipt(null);
            setActivePage('orders');
            fetchCatalog();
          }} 
        />
      </>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans select-none overflow-x-hidden">
      {themeStyleBlock}
      
      {/* Navigation Topbar */}
      <Navbar
        cart={cart}
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        searchQuery={searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setActivePage('home'); }}
        onAdminToggle={() => setIsAdminMode(true)}
        onPageChange={(page) => { setActivePage(page); setSearchQuery(''); setActiveCategory('All'); }}
        onResetSearch={() => { setSearchQuery(''); setActiveCategory('All'); }}
        isAdmin={isAdminMode}
        settings={settings}
        currentUser={currentUser}
        onLogout={() => {
          localStorage.removeItem('rstech_user');
          setCurrentUser(null);
        }}
        onAuthTrigger={() => setIsUserAuthModalOpen(true)}
        onProfileTrigger={() => setIsUserProfileModalOpen(true)}
      />

      {/* Hero Banner Area (Home view only, without filtering queries actively) */}
      {activePage === 'home' && activeCategory === 'All' && !searchQuery && (
        <>
          {settings.flashMessage?.enabled && <FlashMessage text={settings.flashMessage.text} enabled={settings.flashMessage.enabled} />}
          <HeroSlider slides={settings.heroSlides} />
        </>
      )}

      {/* Main Dynamic Workspace Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <AnimatePresence mode="wait">
          
          {/* === VIEW A: ABOUT US === */}
          {activePage === 'about' && (
            <motion.div
              key="about-page"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto space-y-6 text-sm font-semibold text-slate-600 bg-white p-8 rounded-3xl border border-slate-200/60 shadow"
            >
              <button onClick={() => setActivePage('home')} className="text-amber-600 hover:underline flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back to Storefront
              </button>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise Compliance Standards</h2>
              <p>{settings.companyName || "CromaTech"} is India's leading procurement platform for corporate IT infrastructure, logistics, power units, and security ecosystems.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 font-sans uppercase">
                <div className="p-4 bg-slate-50 rounded-xl text-center border">
                  <Award className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-900 text-xs">ISO CERTIFIED</p>
                  <p className="text-[10px] text-slate-500 mt-1">SLA Standard Quality Logistics</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl text-center border">
                  <ShieldCheck className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-900 text-xs">18% GST INVOICES</p>
                  <p className="text-[10px] text-slate-500 mt-1">GSTR Compliant Filings</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl text-center border">
                  <Truck className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-900 text-xs">SECURE COURIER</p>
                  <p className="text-[10px] text-slate-500 mt-1">On-Site Corporate Drops</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* === VIEW B: SHIPMENT TRACKER === */}
          {activePage === 'shipping' && (
            <motion.div
              key="shipping-page"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <LogisticsTracker 
                orders={userOrders} 
                settings={settings} 
                onBack={() => setActivePage('home')} 
              />
            </motion.div>
          )}

              {/* === VIEW C: INVOICES LOGGING LIST === */}
              {activePage === 'orders' && (
                <motion.div
                  key="orders-page"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Compliant Invoices</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Click any record row to print/save official India GST Tax bill.</p>
                    </div>
                    <button onClick={() => setActivePage('home')} className="bg-slate-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer">
                      Return To Sourcing
                    </button>
                  </div>

                  {!currentUser ? (
                    <div className="text-center py-16 bg-white border border-dashed rounded-3xl text-slate-500 flex flex-col items-center justify-center gap-4">
                      <p className="italic font-medium text-xs">Please log in or register to view your secure invoice history.</p>
                      <button
                        onClick={() => setIsUserAuthModalOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm border border-amber-400/20"
                      >
                        Log In / Register Account
                      </button>
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed rounded-3xl text-slate-500 italic text-xs">
                      No invoice logs found for customer ({currentUser.email}). Register a check out payment purchase to generate one.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userOrders.map((o, idx) => (
                        <div key={`${o.id}-${idx}`} className="p-5 bg-white border border-slate-200/80 rounded-2xl flex justify-between items-start hover:border-amber-400 transition-all font-semibold animate-fadeIn">
                          <div className="space-y-1.5 text-xs text-slate-600 col-span-2">
                            <p className="text-[10px] bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded font-black uppercase w-fit">Tax compliance invoice</p>
                            <h4 className="font-extrabold text-slate-900 text-sm">{o.id}</h4>
                            <p>Date: {new Date(o.date).toLocaleDateString()}</p>
                            <p>Purchaser: {o.shippingAddress?.fullName}</p>
                            <p className="text-amber-600 font-black text-sm">Value: ₹{o.grandTotal?.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="text-right flex flex-col items-end justify-between h-20">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                              {o.paymentStatus}
                            </span>
                            <button
                              onClick={() => setRecentOrderReceipt(o)}
                              className="text-[10px] bg-slate-900 hover:bg-black text-white font-bold py-1 px-3 rounded uppercase tracking-wider cursor-pointer"
                            >
                              Print Bill
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

          {/* === VIEW D: HOME STOREFRONT === */}
          {activePage === 'home' && (
            <motion.div
              key="storefront"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              {/* Left sidebar: categories lists & Brand filters (Visible on desktop only) */}
              <aside className="w-full lg:w-64 space-y-6 shrink-0 lg:block hidden">
                
                {/* Categories Selector list */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-4">Device Categories</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveCategory('All'); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${activeCategory === 'All' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <span>All Products</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    {categories.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setActiveCategory(c.name); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${activeCategory.toLowerCase() === c.name.toLowerCase() ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <span className="truncate">{c.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand specific filters */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-xs font-semibold">
                  <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-3">Filter by Brand</h3>
                  <select
                    value={brandFilter}
                    onChange={e => setBrandFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-xl text-slate-700 outline-none focus:border-amber-500 text-xs font-bold"
                  >
                    <option value="All">All brands</option>
                    {uniqueBrands.filter(b => b !== 'All').map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Sorter Selector */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-xs font-semibold">
                  <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-3">Sort catalog by</h3>
                  <select
                    value={priceSort}
                    onChange={e => setPriceSort(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-xl text-slate-700 outline-none focus:border-amber-500 text-xs font-bold"
                  >
                    <option value="default">Default Listing Sequence</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Buyer Rated</option>
                  </select>
                </div>

                {/* General Customer Enquiry & Quotes Form */}
                <GeneralEnquiryCard currentUser={currentUser} />



              </aside>

              {/* Right main panel: grid of technical card catalog items */}
              <div className="flex-1 space-y-6">
                
                {/* Mobile top filter/category layout (Visible on mobile only) */}
                <div className="lg:hidden block space-y-4 animate-fadeIn">
                  {/* Category Pill Horizontal Scroll row */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[11px] uppercase font-black text-slate-400 tracking-wider">Device Categories</h3>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => scrollCategories('left')}
                          className="w-7 h-7 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-all cursor-pointer text-slate-500 active:scale-95"
                          title="Scroll left"
                          id="category-scroll-left"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollCategories('right')}
                          className="w-7 h-7 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-all cursor-pointer text-slate-500 active:scale-95"
                          title="Scroll right"
                          id="category-scroll-right"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div 
                      ref={categoryScrollRef}
                      className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none select-none whitespace-nowrap scroll-smooth"
                    >
                      <button
                        onClick={() => { setActiveCategory('All'); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shrink-0 ${activeCategory === 'All' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        id="category-all-btn"
                      >
                        <span>All Products</span>
                      </button>
                      {categories.map((c, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setActiveCategory(c.name); }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shrink-0 ${activeCategory.toLowerCase() === c.name.toLowerCase() ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'bg-slate-50 text-slate-650 hover:bg-slate-100'}`}
                          id={`category-btn-${idx}`}
                        >
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand select & Sorter select Side-by-side split row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2 block">Brand Partner</label>
                      <select
                        value={brandFilter}
                        onChange={e => setBrandFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-700 outline-none focus:border-amber-500 text-xs font-semibold cursor-pointer"
                      >
                        <option value="All">All brands</option>
                        {uniqueBrands.filter(b => b !== 'All').map((b, idx) => (
                          <option key={idx} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2 block">Sort Catalog</label>
                      <select
                        value={priceSort}
                        onChange={e => setPriceSort(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-700 outline-none focus:border-amber-500 text-xs font-semibold cursor-pointer"
                      >
                        <option value="default">Default Sequence</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Search result label */}
                {(searchQuery || activeCategory !== 'All' || brandFilter !== 'All') && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex justify-between items-center text-xs text-amber-900 font-bold">
                    <div>
                      Active selection: 
                      {activeCategory !== 'All' && <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded mx-1 uppercase">{activeCategory}</span>}
                      {brandFilter !== 'All' && <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded mx-1 uppercase">{brandFilter}</span>}
                      {searchQuery && <span className="bg-slate-900 text-white px-2 py-0.5 rounded mx-1">"{searchQuery}" Search</span>}
                    </div>
                    <button
                      onClick={() => { setSearchQuery(''); setActiveCategory('All'); setBrandFilter('All'); }}
                      className="text-amber-800 underline uppercase text-[10px] tracking-wider hover:text-amber-950"
                    >
                      Clear settings
                    </button>
                  </div>
                )}

                {sortedProducts.length === 0 ? (
                  <div className="text-center py-24 bg-white border rounded-3xl text-slate-500 italic font-semibold">
                    No electronics items matched your current filters. Tap another category circle.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {sortedProducts.map((p, idx) => {
                      const isFav = favouriteList.includes(p.id);
                      return (
                        <div
                          key={`${p.id}-${idx}`}
                          className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:scale-[1.015] hover:shadow-xl hover:border-amber-400 focus-within:border-amber-400 transition-all font-semibold font-sans relative group"
                        >
                          {/* Heart favourite toggle */}
                          <button
                            onClick={() => toggleFavourite(p.id)}
                            className={`absolute right-3.5 top-3.5 p-2 rounded-full border shadow-sm cursor-pointer z-10 transition-colors ${isFav ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-650'}`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>

                          {/* Image card head */}
                          <div
                            onClick={() => setSelectedProduct(p)}
                            className="bg-white h-[200px] flex items-center justify-center p-6 cursor-pointer overflow-hidden relative border-b border-slate-100"
                          >
                            <img src={p.imageUrl} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                            {p.isDeal && (
                              <span className="absolute bottom-3 left-3 bg-red-600 text-white font-black uppercase text-[8px] tracking-widest px-2 py-0.5 rounded">
                                Deal of the Day
                              </span>
                            )}
                          </div>

                          {/* Body with detailed brand price */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest">
                                <span>{p.brand}</span>
                                <span>HSN: {p.hsnCode}</span>
                              </div>
                              <h3
                                onClick={() => setSelectedProduct(p)}
                                className="font-extrabold text-sm text-slate-900 line-clamp-2 hover:text-amber-600 cursor-pointer transition-colors min-h-[36px]"
                              >
                                {p.name}
                              </h3>
                              
                              {/* Star Ratings rows */}
                              <div className="flex items-center gap-1 text-[10.5px] text-slate-500 font-bold py-0.5">
                                <div className="flex text-amber-400">
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                </div>
                                <span>{p.rating} ({p.ratingCount})</span>
                              </div>
                            </div>

                            {/* Price grid with discount calculations percentages */}
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-400 font-medium">Inclusive of {p.gstPercentage}% Tax</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-base font-black text-amber-600">₹{p.offerPrice.toLocaleString('en-IN')}</span>
                                <span className="text-xs text-slate-400 line-through">M.R.P: ₹{p.price.toLocaleString('en-IN')}</span>
                                <span className="text-[9px] font-black text-emerald-600">({p.discountPercentage}% OFF)</span>
                              </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex gap-2 pt-1 font-sans">
                              <button
                                onClick={() => setSelectedProduct(p)}
                                className="flex-1 bg-slate-900 text-white p-2 text-[10.5px] font-black uppercase rounded-xl hover:bg-black transition-colors cursor-pointer text-center animate-fadeIn"
                              >
                                Technical Specs
                              </button>
                              {(() => {
                                const cartItem = cart.find(item => item.product.id === p.id);
                                const qty = cartItem ? cartItem.quantity : 0;
                                if (qty > 0) {
                                  return (
                                    <div className="flex-1 flex items-stretch justify-between bg-amber-500 text-slate-950 rounded-xl overflow-hidden font-black text-[10.5px] animate-fadeIn border border-amber-600/20">
                                      <button
                                        onClick={() => handleUpdateCartQuantity(p.id, -1)}
                                        className="px-3 bg-amber-600 hover:bg-amber-700 text-slate-950 flex items-center justify-center transition-colors cursor-pointer select-none active:scale-95"
                                        title="Decrease quantity"
                                      >
                                        <Minus className="w-3 h-3 stroke-[3.5]" />
                                      </button>
                                      <span className="px-1 flex items-center justify-center font-black select-none text-center flex-1 text-slate-950">
                                        {qty} Added
                                      </span>
                                      <button
                                        onClick={() => {
                                          if (qty < p.stock) {
                                            handleAddToCart(p);
                                          } else {
                                            alert(`Only ${p.stock} units available in stock.`);
                                          }
                                        }}
                                        disabled={qty >= p.stock}
                                        className="px-3 bg-amber-600 hover:bg-amber-700 text-slate-950 flex items-center justify-center transition-colors cursor-pointer select-none active:scale-95 disabled:bg-amber-300 disabled:text-amber-800 disabled:cursor-not-allowed"
                                        title="Increase quantity"
                                      >
                                        <Plus className="w-3 h-3 stroke-[3.5]" />
                                      </button>
                                    </div>
                                  );
                                }
                                return (
                                  <button
                                    disabled={p.stock <= 0}
                                    onClick={() => handleAddToCart(p)}
                                    className="flex-1 bg-amber-500 disabled:bg-slate-200 text-slate-950 p-2 text-[10.5px] font-black uppercase rounded-xl hover:bg-amber-600 transition-colors cursor-pointer text-center animate-fadeIn"
                                  >
                                    {p.stock > 0 ? 'Buy Now' : 'Out Of Stock'}
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Mobile-only bottom B2B section (Appears under products list) */}
                <div className="lg:hidden block mt-8 animate-fadeIn">
                  <GeneralEnquiryCard currentUser={currentUser} />
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-4 sm:px-6 mt-16 text-xs font-semibold">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] md:text-xs">
          <p className="text-slate-450 text-center sm:text-left">
            © {new Date().getFullYear()} All Rights Reserved by RS TECH
          </p>
          <p className="text-slate-555 text-center sm:text-right font-medium">
            Designed and Developed by <span className="text-amber-500 font-bold">Brand Stack</span>
          </p>
        </div>
      </footer>



      {/* FLOATING WHATSAPP CHAT BUTTON (Requested feature!) */}
      <a
        href={`https://wa.me/${settings.whatsapp}?text=Hello%20${encodeURIComponent(settings.shortName)}%20procurements%20support%2520desk.%2520I%2520am%2520calling%2520from%2520the%2520website%2520listing.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-all group cursor-pointer border border-emerald-500"
        title={`Chat with ${settings.shortName} Support on WhatsApp`}
      >
        <MessageSquare className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold uppercase tracking-wider text-[10px] pl-0 group-hover:pl-2 whitespace-nowrap text-white leading-none">
          WhatsApp Support Desk
        </span>
      </a>

      {/* MODAL 1: PRODUCT FULL DETAILS INTERACTION */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          settings={settings}
          cart={cart}
          onUpdateCartQuantity={handleUpdateCartQuantity}
          currentUser={currentUser}
        />
      )}

      {/* MODAL 2: INTERACTIVE BACKWARD GST RECONCILED CHECKOUT */}
      {isCheckingOut && (
        <CheckoutModal
          cart={cart}
          cartTotal={calculateCartTotal()}
          couponApplied={couponApplied}
          onClose={() => setIsCheckingOut(false)}
          onSuccess={handleCheckoutSuccess}
          settings={settings}
          currentUser={currentUser}
          cartId={cartId}
        />
      )}

      {/* MODAL 2.5: BUSINESS PARTNER LOGIN / SIGN UP MODAL */}
      {isUserAuthModalOpen && (
        <UserAuthModal
          onClose={() => setIsUserAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('rstech_user', JSON.stringify(user));
          }}
        />
      )}

      {isUserProfileModalOpen && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setIsUserProfileModalOpen(false)}
          onUpdateSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('rstech_user', JSON.stringify(updatedUser));
          }}
        />
      )}

      {/* MODAL 3: SIDEBAR CART DRAWER SCREEN OVERLAY */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            
            {/* Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 p-6 flex flex-col justify-between text-slate-800"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-slate-900 tracking-tight text-base uppercase">Procurement Drawer</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items Looping list */}
              <div className="flex-1 overflow-y-auto my-4 divide-y divide-slate-150 pr-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-10 font-medium">
                    <ShoppingBag className="w-12 h-12 text-slate-200 mb-2 stroke-1" />
                    <p className="text-xs">Your sourcing cart is completely empty.</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex gap-4 py-4 items-start font-semibold text-xs">
                      <img src={item.product.imageUrl} alt="" className="w-12 h-12 object-contain bg-slate-50 rounded border" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-slate-405 text-[10px] font-medium">Brand: {item.product.brand} | HSN: {item.product.hsnCode}</p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateCartQuantity(item.product.id, -1)}
                            className="bg-slate-100 p-1 rounded hover:bg-slate-200 text-slate-650 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-black text-slate-900 text-xs">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQuantity(item.product.id, 1)}
                            className="bg-slate-100 p-1 rounded hover:bg-slate-200 text-slate-650 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-between items-end h-16 shrink-0">
                        <span className="font-bold text-slate-900 font-mono">₹{(item.product.offerPrice * item.quantity).toLocaleString('en-IN')}</span>
                        <button
                          onClick={() => handleUpdateCartQuantity(item.product.id, -item.quantity)}
                          className="text-[10px] text-red-500 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer footer values & Checkout Trigger */}
              {cart.length > 0 && (
                <div className="border-t border-slate-150 pt-4 space-y-4">
                  {/* Coupon layout fields helper */}
                  <div className="space-y-2">
                    <p className="text-slate-400 text-[10px] uppercase font-black uppercase tracking-wider">Apply Promotion Offer Code</p>
                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-amber-500 transition-colors">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="e.g. FESTIVE10"
                        className="bg-transparent text-xs text-slate-800 outline-none flex-1 px-2.5 font-mono uppercase font-bold"
                      />
                      <button
                        onClick={applyPromoCoupon}
                        className="bg-slate-900 text-white font-bold px-4 py-1.5 text-[10px] rounded-lg hover:bg-black transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
                    {couponApplied && (
                      <div className="p-2 bg-emerald-50 rounded border border-emerald-100 text-[10px] text-emerald-800 flex justify-between items-center font-bold font-mono">
                        <span>Code "{couponApplied.code}" Applied:</span>
                        <span>- ₹{couponApplied.discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Calculations breakdown quick info */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/60 font-semibold text-xs space-y-2.5">
                    <div className="flex justify-between items-center text-slate-500 text-[11px] font-medium">
                      <span>Line items Gross cost:</span>
                      <span>₹{calculateCartTotal().toLocaleString('en-IN')}</span>
                    </div>

                    {couponApplied && (
                      <div className="flex justify-between items-center text-green-600 text-[11px] font-bold">
                        <span>Applied discount savings:</span>
                        <span>- ₹{couponApplied.discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                      <span className="uppercase tracking-widest text-[9.5px]">Estimate Payable:</span>
                      <span className="text-base text-amber-600 font-bold">
                        ₹{Math.max(0, calculateCartTotal() - (couponApplied ? couponApplied.discountAmount : 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCheckingOut(true);
                      setIsCartOpen(false);
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black tracking-widest text-xs uppercase py-3.5 rounded-2xl transition-all shadow-md text-center block cursor-pointer"
                  >
                    Proceed To Logistics Checkout
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
