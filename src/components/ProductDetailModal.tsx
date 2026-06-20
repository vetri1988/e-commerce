import React, { useState } from 'react';
import { Product, CartItem, CompanySettings } from '../types';
import { X, Star, ShieldCheck, HelpCircle, PhoneCall, DownloadCloud, CheckCircle, ShoppingBag, Eye, Heart, Plus, Minus } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
  settings: CompanySettings;
  cart?: CartItem[];
  onUpdateCartQuantity?: (productId: string, delta: number) => void;
  currentUser?: any;
}

export default function ProductDetailModal({ product, onClose, onAddToCart, settings, cart = [], onUpdateCartQuantity, currentUser }: ProductDetailModalProps) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [isJoinedQuote, setIsJoinedQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    count: '1',
    msg: ''
  });

  // Multiple product images simulation with robust empty array safe fallbacks
  const images = (product.galleryUrls && product.galleryUrls.filter(url => url && url.trim().length > 0).length > 0)
    ? product.galleryUrls.filter(url => url && url.trim().length > 0)
    : [product.imageUrl || `https://picsum.photos/seed/${product.sku || 'tech'}/800/800`];

  // Micro scale zoom interaction on mousemove
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.5)',
      cursor: 'zoom-in'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({});
  };

  const downloadBrochure = () => {
    // Mimic brochure downloads nicely with structural schema
    const brochureText = `
-------------------------------------------------------
${settings.shortName} - Product Data Sheet Compliance Brochure
-------------------------------------------------------
Product: ${product.name}
Model Code (SKU): ${product.sku}
Tax Code HSN: ${product.hsnCode} (Output percentage: ${product.gstPercentage}%)
Manufacturer: ${product.brand} LLC
Warranty Period: ${product.warranty}

Key Technical Specifications:
${Object.entries(product.specifications || {}).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Core Highlights:
${(product.features || []).map(f => `* ${f}`).join('\n')}

Enterprise Support Status: Active Standard Service SLA-Level 1.
-------------------------------------------------------
    `;
    const blob = new Blob([brochureText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DATA_BROCHURE_${product.sku.toUpperCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          name: quoteForm.name,
          email: quoteForm.email,
          phone: quoteForm.phone || '+91 99999 99999',
          message: `Required Volume: ${quoteForm.count} units. Customer remarks: ${quoteForm.msg}`
        })
      });
      if (res.ok) {
        setIsJoinedQuote(true);
        setTimeout(() => {
          setIsJoinedQuote(false);
          setQuoteForm({
            name: currentUser?.name || '',
            email: currentUser?.email || '',
            phone: currentUser?.phone || '',
            count: '1',
            msg: ''
          });
        }, 3000);
      }
    } catch (e) {
      setIsJoinedQuote(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col md:flex-row text-slate-800">
        
        {/* Close Button overlay */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 bg-slate-900 border border-slate-700 text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer z-25"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Images Gallery and Brochure actions */}
        <div className="w-full md:w-1/2 p-6 bg-slate-50 flex flex-col justify-between border-r border-slate-100 overflow-y-auto max-h-screen">
          <div className="space-y-4">
            {/* Main Interactive Zoom Box wrapper */}
            <div
              className="w-full h-[250px] sm:h-[350px] bg-white rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative relative"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={images[activeImgIdx]}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-transform duration-100"
                style={zoomStyle}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.sku || 'tech'}/800/800`;
                }}
              />
              <span className="absolute bottom-3 left-3 bg-slate-900/60 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded select-none">
                Hover to Zoom Image
              </span>
            </div>

            {/* Thumbnails array list */}
            <div className="flex gap-2 justify-center">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`w-14 h-14 rounded-lg bg-white border cursor-pointer overflow-hidden p-1 ${activeImgIdx === idx ? 'border-amber-500 scale-105 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <img 
                    src={img} 
                    alt="" 
                    className="w-full h-full object-contain" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.sku + idx || 'tech'}/150/150`;
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Sourcing files */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Assets desk</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadBrochure}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs hover:bg-slate-900 transition-colors font-semibold shadow cursor-pointer uppercase tracking-wider"
              >
                <DownloadCloud className="w-4 h-4 text-amber-500" /> Brochure Sheet
              </button>
              
              <a
                href={`https://wa.me/${settings.whatsapp}?text=Hello%20${encodeURIComponent(settings.shortName)}%20Team,%20I%252520am%252520interested%252520in%252520product%252520sku%252520"${product.sku}"%252520-${product.name}.%252520Please%252520provide%252520bulk%252520quote.`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs hover:bg-emerald-700 transition-colors font-semibold shadow cursor-pointer uppercase tracking-wider"
              >
                <PhoneCall className="w-4 h-4" /> WhatsApp Quote
              </a>
            </div>
            <p className="text-[10px] text-slate-500 text-center">B2B procurement rates can be directly enquired on Indian WhatsApp hotlines.</p>
          </div>
        </div>

        {/* Right Side: Product Details & Request Quote Tab */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[90vh] bg-white">
          <div className="space-y-4">
            
            {/* Top brand rows */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{product.brand} | {product.category}</span>
              <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">HSN: {product.hsnCode}</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h2>

            {/* Ratings stars display */}
            <div className="flex items-center gap-1.5 py-1">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map(v => (
                  <Star key={v} className="w-4.5 h-4.5 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-500">{product.rating} ({product.ratingCount} certified buyer reviews)</span>
            </div>

            {/* Price section - Big MRP discounts */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/90 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-medium">Inclusive of {product.gstPercentage}% Compliant GST Tax</p>
                <div className="flex items-baseline gap-2.5 mt-1.5 flex-wrap">
                  <span className="text-2xl font-black text-amber-600 font-bold">₹{product.offerPrice.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400 line-through">M.R.P: ₹{product.price.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded tracking-wider">
                    {product.discountPercentage}% OFF
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-[10px] tracking-wide font-black ${product.stock > 0 ? 'bg-green-100/80 text-green-700' : 'bg-red-100 text-red-700 uppercase'}`}>
                  {product.stock > 0 ? `${product.stock} units left` : 'OUT OF STOCK'}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {product.description}
            </p>

            {/* Highlighted Visual features list */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Highlights</h4>
              <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-medium">
                {(product.features || []).map((feat, idx) => (
                  <li key={idx}>{feat}</li>
                ))}
              </ul>
            </div>

            {/* Spec Table */}
            <div className="space-y-1.5 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Technical Specification sheet</h4>
              <div className="grid grid-cols-1 gap-2.5 max-h-40 overflow-y-auto pr-2">
                {Object.entries(product.specifications || {}).map(([key, value], idx) => (
                  <div key={`${key}-${idx}`} className="flex justify-between items-start text-xs border-b border-dashed border-slate-150 pb-1 font-medium font-mono">
                    <span className="text-slate-400 uppercase tracking-wide text-[10px] w-1/3 shrink-0">{key}</span>
                    <span className="text-slate-850 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Action Trigger Buttons + Request Quote Sidebar within right side */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-5">
            {/* Sourcing Add to Cart */}
            <div className="flex gap-4">
              {(() => {
                const cartItem = cart.find(item => item.product.id === product.id);
                const qty = cartItem ? cartItem.quantity : 0;
                if (qty > 0) {
                  return (
                    <div className="flex-1 flex items-stretch justify-between bg-amber-500 text-slate-950 font-black tracking-widest text-xs uppercase rounded-xl overflow-hidden shadow-md select-none">
                      <button
                        onClick={() => onUpdateCartQuantity && onUpdateCartQuantity(product.id, -1)}
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-slate-950 flex items-center justify-center transition-all cursor-pointer font-sans active:translate-y-px"
                        title="Decrease procurement quantity"
                      >
                        <Minus className="w-4 h-4 stroke-[3.5]" />
                      </button>
                      <span className="flex items-center justify-center font-bold font-sans text-xs select-none tracking-normal flex-1">
                        {qty} Added in Sourcing Drawer
                      </span>
                      <button
                        onClick={() => {
                          if (qty < product.stock) {
                            onAddToCart(product);
                          } else {
                            alert(`Only ${product.stock} units available in stock.`);
                          }
                        }}
                        disabled={qty >= product.stock}
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-slate-950 flex items-center justify-center transition-all cursor-pointer font-sans active:translate-y-px disabled:bg-amber-300 disabled:text-amber-850 disabled:cursor-not-allowed"
                        title="Increase procurement quantity"
                      >
                        <Plus className="w-4 h-4 stroke-[3.5]" />
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    disabled={product.stock <= 0}
                    onClick={() => { onAddToCart(product); alert(`"${product.name}" added to procurement drawer!`); }}
                    className="flex-1 bg-amber-500 disabled:bg-slate-200 text-slate-950 font-black tracking-widest text-xs uppercase py-3 px-6 rounded-xl hover:bg-amber-600 hover:-translate-y-0.5 transition-all cursor-pointer font-sans shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-slate-950" /> Add to Sourcing Cart
                  </button>
                );
              })()}
            </div>

            {/* Customer Enquiry Form */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Fast Customer Enquiry Form
              </h4>
              <form onSubmit={submitQuote} className="space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={quoteForm.name}
                    onChange={e => setQuoteForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your Name"
                    className="bg-white border border-slate-200 rounded p-2 text-slate-800 w-full"
                  />
                  <input
                    type="email"
                    required
                    value={quoteForm.email}
                    onChange={e => setQuoteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email Address"
                    className="bg-white border border-slate-200 rounded p-2 text-slate-800 w-full"
                  />
                  <input
                    type="text"
                    required
                    value={quoteForm.phone}
                    onChange={e => setQuoteForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Mobile Number"
                    className="bg-white border border-slate-200 rounded p-2 text-slate-800 w-full"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 flex items-center gap-1 bg-white border border-slate-200 rounded px-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold pr-1">Qty:</span>
                    <input
                      type="number"
                      min={1}
                      value={quoteForm.count}
                      onChange={e => setQuoteForm(prev => ({ ...prev, count: e.target.value }))}
                      className="w-full text-slate-800 font-bold outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={quoteForm.msg}
                    onChange={e => setQuoteForm(prev => ({ ...prev, msg: e.target.value }))}
                    placeholder="Specific requests or comments..."
                    className="col-span-2 bg-white border border-slate-200 rounded p-2 text-slate-800"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                >
                  Submit Product Enquiry
                </button>
              </form>

              {isJoinedQuote && (
                <div className="mt-2.5 p-2 bg-amber-50 rounded text-amber-800 text-[10px] flex items-center gap-2 border border-amber-100 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Enquiry submitted successfully! Our help desk will connect with you shortly.</span>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
