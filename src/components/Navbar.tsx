import React, { useState } from 'react';
import { ShoppingCart, Search, Menu, User, Settings, PhoneCall, HelpCircle, Sun, Mic, ShieldAlert, ShoppingBag } from 'lucide-react';
import { CartItem, CompanySettings } from '../types';

interface NavbarProps {
  cart: CartItem[];
  onCartToggle: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAdminToggle: () => void;
  onPageChange: (page: string) => void;
  onResetSearch: () => void;
  isAdmin: boolean;
  settings: CompanySettings;
  currentUser: any;
  onLogout: () => void;
  onAuthTrigger: () => void;
  onProfileTrigger: () => void;
}

export default function Navbar({
  cart,
  onCartToggle,
  searchQuery,
  onSearchChange,
  onAdminToggle,
  onPageChange,
  onResetSearch,
  isAdmin,
  settings,
  currentUser,
  onLogout,
  onAuthTrigger,
  onProfileTrigger
}: NavbarProps) {
  const [isMicActive, setIsMicActive] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartValue = cart.reduce((sum, item) => sum + item.product.offerPrice * item.quantity, 0);

  const triggerVoiceSearch = () => {
    setIsMicActive(true);
    // Simulate smart audio listening
    const searchPhrases = ['Lenovo ThinkPad', 'WiFi Router', 'CP Plus CCTV Camera', 'Epson Printer', 'Wireless Mouse'];
    const randomPhrase = searchPhrases[Math.floor(Math.random() * searchPhrases.length)];
    
    setTimeout(() => {
      onSearchChange(randomPhrase);
      setIsMicActive(false);
    }, 1800);
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl font-sans">
      {/* Top Banner (Support & Links) */}
      <div className="bg-slate-950 px-4 sm:px-6 py-2 text-xs flex flex-col sm:flex-row justify-between items-center text-slate-400 gap-2 border-b border-slate-900">
        <div className="flex items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs"><PhoneCall className="w-3.5 h-3.5 text-amber-500" /> B2B Hotlines: {settings.phone}</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none w-full sm:w-auto justify-start sm:justify-end py-1 sm:py-0 whitespace-nowrap">
          <button
            onClick={() => { onResetSearch(); onPageChange('home'); }}
            className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-extrabold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Shop Now</span>
          </button>
          <span className="text-slate-700">•</span>
          <button onClick={() => onPageChange('shipping')} className="hover:text-amber-400 transition-colors cursor-pointer text-[11px] font-medium text-slate-350">Track Shipment</button>
          <span className="text-slate-700">•</span>
          <button onClick={() => onPageChange('about')} className="hover:text-amber-400 transition-colors cursor-pointer text-[11px] font-medium text-slate-350">Why {settings.shortName}?</button>
          <span className="text-slate-700">•</span>
          {currentUser ? (
            <div className="flex items-center gap-2 text-[11px] shrink-0">
              <button
                onClick={onProfileTrigger}
                className="flex items-center gap-1 text-slate-350 hover:text-amber-400 transition-colors cursor-pointer font-bold bg-amber-500/15 px-2 py-0.5 rounded text-[11px] border border-amber-500/10 hover:border-amber-500/30"
                title="View & Edit Your Customer Profile"
              >
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-400 font-extrabold">My Profile ({currentUser.name})</span>
              </button>
              <button
                onClick={onLogout}
                className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer hover:underline uppercase font-bold ml-1"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={onAuthTrigger}
              className="flex items-center gap-1 text-amber-500 hover:text-amber-400 cursor-pointer font-bold text-[11px]"
            >
              <User className="w-3.5 h-3.5" /> Sign In / Register
            </button>
          )}
          <span className="text-slate-700">•</span>
          <button
            onClick={onAdminToggle}
            className="flex items-center gap-1.5 text-amber-500 font-bold hover:text-amber-400 transition-colors cursor-pointer text-[11px]"
          >
            <Settings className="w-3.5 h-3.5" /> {isAdmin ? "Go to Admin Dashboard" : "Admin Panel Access"}
          </button>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
        {/* Mobile Header containing Logo & Cart/Invoice Buttons Side-by-side */}
        <div className="flex items-center justify-between gap-4 w-full md:w-auto">
          {/* Logo Shield */}
          <div
            onClick={() => { onResetSearch(); onPageChange('home'); }}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl flex items-center justify-center font-serif text-lg sm:text-xl font-black text-slate-950 font-sans shadow-lg group-hover:scale-105 transition-transform shrink-0">
              {settings.shortName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-sm sm:text-lg font-black tracking-widest text-white uppercase block leading-none">{settings.shortName}</span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 lowercase tracking-wider block mt-1">Enterprise & Retail India</span>
            </div>
          </div>

          {/* Cart and order logs for mobile (nested here and only visible on smaller screen viewport) */}
          <div className="flex md:hidden items-center gap-2.5">
            {currentUser ? (
              <button
                onClick={onProfileTrigger}
                className="flex flex-col text-right hover:text-amber-400 transition-colors cursor-pointer"
                title="View & Edit Your Customer Profile"
              >
                <span className="text-[9px] uppercase font-medium text-slate-400 block leading-none">Profile</span>
                <span className="text-[11px] font-extrabold text-amber-500 block mt-0.5 leading-none flex items-center justify-end gap-0.5">
                  <User className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{currentUser.name.split(' ')[0]}</span>
                </span>
              </button>
            ) : (
              <button
                onClick={onAuthTrigger}
                className="flex flex-col text-right hover:text-amber-400 transition-colors cursor-pointer"
                title="Sign In / Register"
              >
                <span className="text-[9px] uppercase font-medium text-slate-400 block leading-none">Account</span>
                <span className="text-[11px] font-extrabold text-amber-500 block mt-0.5 leading-none flex items-center justify-end gap-0.5">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Login</span>
                </span>
              </button>
            )}

            <span className="text-slate-800">•</span>

            <button
              onClick={() => onPageChange('orders')}
              className="text-slate-400 hover:text-amber-400 transition-colors text-right cursor-pointer"
            >
              <span className="text-[9px] uppercase font-medium text-slate-400 block leading-none">Invoices</span>
              <span className="text-[11px] font-bold text-slate-100 block mt-0.5 leading-none">Order Logs</span>
            </button>

            <button
              onClick={onCartToggle}
              className="bg-amber-500 text-slate-950 p-2 sm:p-2.5 rounded-xl flex items-center justify-center hover:bg-amber-600 transition-all relative font-bold cursor-pointer"
            >
              <ShoppingCart className="w-4.5 h-4.5 text-slate-950" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full leading-none">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Intelligent Search Center (Stretches fully on mobile/desktop) */}
        <div className="flex-1 max-w-2xl relative w-full">
          <div className="flex items-center bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder=""
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 px-4 py-2.5 outline-none text-xs font-semibold"
            />
            
            {/* Auto Suggestions indicator or voice search */}
            <div className="flex items-center gap-1 pr-3">
              <button
                onClick={triggerVoiceSearch}
                type="button"
                className={`p-1.5 rounded-lg text-slate-400 transition-all cursor-pointer ${isMicActive ? 'bg-red-500 text-white animate-ping' : 'hover:bg-slate-700 hover:text-white'}`}
                title={isMicActive ? "Listening for voice search query..." : "Voice search (AI Simulation)"}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => {}}
                className="p-2 text-slate-350 hover:text-white"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
          {isMicActive && (
            <div className="absolute top-12 left-0 right-0 bg-slate-850 p-2.5 rounded-lg border border-red-500/30 text-[10px] text-red-400 font-semibold flex items-center gap-2 z-50 shadow-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span>Listening for voice prompt... (e.g. Try saying "ThinkPad" or "Routers")</span>
            </div>
          )}
        </div>

        {/* Cart and Meta buttons for desktop screens (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-5 shrink-0">
          <button
            onClick={() => onPageChange('orders')}
            className="flex flex-col text-left hover:text-amber-400 transition-colors cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 uppercase leading-none font-medium text-slate-400">Invoice Records</span>
            <span className="text-xs font-bold mt-1 text-slate-100">Order Logs</span>
          </button>

          {/* Checkout Cart Button */}
          <button
            onClick={onCartToggle}
            className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl flex items-center gap-2.5 hover:bg-amber-600 transition-all relative font-bold text-xs uppercase cursor-pointer"
          >
            <div className="relative">
              <ShoppingCart className="w-4.5 h-4.5 text-slate-950" />
              {cartCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-red-600 outline-2 outline-amber-500 text-white font-black text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full leading-none">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-[9px] text-slate-850 leading-none">Cart Total</p>
              <p className="normal-case text-xs leading-none mt-0.5">₹{cartValue.toLocaleString('en-IN')}</p>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}
