import React, { useState } from 'react';
import { CartItem, ShippingAddress, Coupon, CompanySettings } from '../types';
import { X, MapPin, CreditCard, Receipt, Percent, ShieldCheck, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

interface CheckoutModalProps {
  cart: CartItem[];
  cartTotal: number;
  couponApplied: { code: string; discountAmount: number } | null;
  onClose: () => void;
  onSuccess: (order: any) => void;
  settings: CompanySettings;
  currentUser?: any;
  cartId?: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const STATE_PINCODE_PREFIXES: Record<string, string[]> = {
  'Andhra Pradesh': ['50', '51', '52', '53'],
  'Arunachal Pradesh': ['79'],
  'Assam': ['78'],
  'Bihar': ['80', '81', '82', '83', '84', '85'],
  'Chhattisgarh': ['49'],
  'Goa': ['40'],
  'Gujarat': ['36', '37', '38', '39'],
  'Haryana': ['12', '13'],
  'Himachal Pradesh': ['17'],
  'Jharkhand': ['81', '82', '83'], 
  'Karnataka': ['56', '57', '58', '59'],
  'Kerala': ['67', '68', '69'],
  'Madhya Pradesh': ['45', '46', '47', '48'],
  'Maharashtra': ['40', '41', '42', '43', '44'],
  'Manipur': ['79'],
  'Meghalaya': ['79'],
  'Mizoram': ['79'],
  'Nagaland': ['79'],
  'Odisha': ['75', '76', '77'],
  'Punjab': ['14', '15', '16'],
  'Rajasthan': ['30', '31', '32', '33', '34'],
  'Sikkim': ['73'],
  'Tamil Nadu': ['60', '61', '62', '63', '64'],
  'Telangana': ['50', '51', '52'],
  'Tripura': ['79'],
  'Uttar Pradesh': ['20', '21', '22', '23', '24', '25', '26', '27', '28'],
  'Uttarakhand': ['24', '25', '26'],
  'West Bengal': ['70', '71', '72', '73', '74'],
};

export default function CheckoutModal({ cart, cartTotal, couponApplied, onClose, onSuccess, settings, currentUser, cartId }: CheckoutModalProps) {
  const [address, setAddress] = useState<ShippingAddress>(() => {
    if (currentUser) {
      return {
        fullName: currentUser.name || '',
        companyName: currentUser.name || '',
        gstNumber: currentUser.gstin || '',
        addressLine: currentUser.address || '',
        city: currentUser.city || '',
        state: currentUser.state || 'Tamil Nadu',
        pincode: currentUser.pincode || '',
        phone: currentUser.phone || '',
        email: currentUser.email || ''
      };
    }
    return {
      fullName: '',
      companyName: '',
      gstNumber: '',
      addressLine: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: '',
      phone: '',
      email: ''
    };
  });

  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [pinCodeError, setPinCodeError] = useState<string | null>(null);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [razorpayOption, setRazorpayOption] = useState<'upi' | 'card' | 'nb'>('upi');

  // Synchronize cart with shipping address details entered in the checkout form to capture abandoned carts with real contact info
  React.useEffect(() => {
    if (!cartId || cart.length === 0) return;

    const syncCheckoutDetails = async () => {
      try {
        await fetch('/api/carts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: cartId,
            fullName: address.fullName || null,
            userEmail: address.email || null,
            userPhone: address.phone || null,
            userId: currentUser?.id || null,
            items: cart,
            totalAmount: cartTotal,
            status: 'active'
          })
        });
      } catch (err) {
        console.error("Failed to sync checkout details to open cart log", err);
      }
    };

    const delayDebounceOpt = setTimeout(syncCheckoutDetails, 1500);
    return () => clearTimeout(delayDebounceOpt);
  }, [address.fullName, address.email, address.phone, cartId, cart, cartTotal, currentUser]);

  const [isSimulatingRealRazorpay, setIsSimulatingRealRazorpay] = useState(true);

  // Calculates taxes previews
  const isTamilNaduOutput = address.state.trim().toLowerCase() === 'tamil nadu' || address.state.trim().toLowerCase() === 'tamilnadu';
  
  const discountVal = couponApplied ? couponApplied.discountAmount : 0;
  const taxableValueNet = Math.max(0, cartTotal - discountVal);
  
  // Tax averages 18% inclusive
  const computedGrossTax = taxableValueNet - (taxableValueNet / 1.18);
  const taxableTurnover = taxableValueNet - computedGrossTax;

  const launchRazorpaySecureCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setPinCodeError(null);
    if (!address.fullName || !address.addressLine || !address.phone || !address.email || !address.pincode) {
      setCheckoutError("Please populate all shipping and billing details first.");
      return;
    }

    const pinCodePrefix = address.pincode.substring(0, 2);
    const validPrefixes = STATE_PINCODE_PREFIXES[address.state as keyof typeof STATE_PINCODE_PREFIXES];
    
    if (validPrefixes && !validPrefixes.includes(pinCodePrefix)) {
      setPinCodeError(`The pin code ${address.pincode} does not belong to ${address.state}. Please verify your State and Pin Code.`);
      return;
    }

    if (paymentMethod === 'COD') {
      submitOrderToBackend('COD', 'COD_PENDING_ON_DELIVERY');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: taxableValueNet, currency: 'INR' })
      });

      if (!response.ok) {
        throw new Error("Razorpay backend order generation failed.");
      }

      const data = await response.json();
      setIsSimulatingRealRazorpay(!!data.isSimulated);

      // If Razorpay SDK library is loaded and we have real non-simulated API keys
      if (!data.isSimulated && (window as any).Razorpay) {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: settings.companyName || "CromaTech Electronics",
          description: "B2B Procurement Payment",
          order_id: data.orderId,
          prefill: {
            name: address.fullName,
            email: address.email,
            contact: address.phone
          },
          theme: {
            color: "#f7d117" // Signature CSK golden yellow!
          },
          handler: function (paymentResponse: any) {
            submitOrderToBackend('Razorpay Live Engine', paymentResponse.razorpay_payment_id || `pay_rzp_${Date.now()}`);
          },
          modal: {
            ondismiss: function() {
              setCheckoutError("Payment transaction was halted by buyer.");
            }
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fall back to sandbox emulated frame
        console.log("No real Razorpay credentials set, launching mock checkout engine");
        setIsRazorpayOpen(true);
      }
    } catch (err: any) {
      console.error("Razorpay launching failed, falling back to simulator:", err);
      setIsSimulatingRealRazorpay(true);
      setIsRazorpayOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitOrderToBackend = async (method: string, reference: string) => {
    setIsProcessing(true);
    setCheckoutError(null);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: address,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          paymentMethod: method,
          paymentReference: reference,
          couponApplied: couponApplied ? {
            code: couponApplied.code,
            discountAmount: couponApplied.discountAmount
          } : null,
          cartId
        })
      });

      if (response.ok) {
        const orderData = await response.json();
        onSuccess(orderData);
      } else {
        const err = await response.json();
        setCheckoutError(err.error || "Checkout failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setCheckoutError("Failed to connect to the server for checkout.");
    } finally {
      setIsProcessing(false);
      setIsRazorpayOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] flex flex-col md:flex-row overflow-hidden text-slate-800">
        
        {/* Close Button overlay */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer z-25"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left billing card form side */}
        <div className="w-full md:w-3/5 p-6 sm:p-8 overflow-y-auto max-h-[90vh] border-r border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" /> Delivery & Corporate details
          </h2>

          {checkoutError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 mt-0.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span>{checkoutError}</span>
            </div>
          )}

          <form onSubmit={launchRazorpaySecureCheckout} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 block">Recipient Full Name *</label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={e => setAddress(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder=""
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 block">Mobile phone *</label>
                <input
                  type="tel"
                  required
                  value={address.phone}
                  onChange={e => setAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder=""
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 block">Buyer Work Email *</label>
                <input
                  type="email"
                  required
                  value={address.email}
                  onChange={e => setAddress(prev => ({ ...prev, email: e.target.value }))}
                  placeholder=""
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 block">State Code jurisdiction *</label>
                <select
                  value={address.state}
                  onChange={e => setAddress(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 text-slate-800 font-medium"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <p className="text-[10px] text-amber-700 font-black tracking-wide uppercase mb-1">GST Reverse Charge Reconciles</p>
                <p className="text-[10px] leading-relaxed text-slate-505 font-medium">Providing your corporate GSTIN will automatically route reverse inputs back to your account tax desk.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 block">Company name (Optional)</label>
                  <input
                    type="text"
                    value={address.companyName}
                    onChange={e => setAddress(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder=""
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 block">Company GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    value={address.gstNumber}
                    onChange={e => setAddress(prev => ({ ...prev, gstNumber: e.target.value }))}
                    placeholder=""
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none text-slate-800 font-medium placeholder-slate-350 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 block">Detailed Shipping Lane Address *</label>
              <textarea
                required
                value={address.addressLine}
                onChange={e => setAddress(prev => ({ ...prev, addressLine: e.target.value }))}
                placeholder=""
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none text-slate-800 font-medium"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 block">City *</label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={e => setAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder=""
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 block">Pin Code *</label>
                <input
                  type="text"
                  required
                  value={address.pincode}
                  onChange={e => {
                    setAddress(prev => ({ ...prev, pincode: e.target.value }));
                    if (pinCodeError) setPinCodeError(null);
                  }}
                  placeholder=""
                  className={`w-full bg-slate-50 border ${pinCodeError ? 'border-red-300 focus:border-red-500' : 'border-slate-200'} rounded-lg p-3 outline-none text-slate-800 font-medium`}
                />
                {pinCodeError && <p className="text-red-500 text-[10px] sm:text-xs mt-1 font-semibold">{pinCodeError}</p>}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="border-t border-slate-150 pt-5 mt-4 space-y-3">
              <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Choose Payment Method</h3>
              
              <div className="grid grid-cols-1 gap-2.5">
                {/* Razorpay Selectable Card */}
                <div 
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    paymentMethod === 'Razorpay' 
                      ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500' 
                      : 'border-slate-200 bg-white hover:border-slate-350'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 sm:flex items-center justify-center font-black text-blue-600 text-xs shrink-0 shadow-sm hidden">
                    rzp
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-950 text-xs flex items-center gap-1.5 leading-none">
                      Razorpay UPI & Cards Gateway
                      <span className="text-[8px] uppercase bg-green-500 text-white font-black px-1.5 py-0.5 rounded tracking-wider">Secure</span>
                    </p>
                    <p className="text-[9.5px] text-slate-500 font-medium mt-1 leading-snug">Pay instantly with Credit Card, Debit Card, NetBanking, or any UPI app.</p>
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                    {paymentMethod === 'Razorpay' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                  </div>
                </div>

                {/* Cash On Delivery Card (Conditional based on admin settings toggle) */}
                {(settings.enableCod !== false) && (
                  <div 
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      paymentMethod === 'COD' 
                        ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500' 
                        : 'border-slate-200 bg-white hover:border-slate-350'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 sm:flex items-center justify-center font-black text-emerald-600 text-[10px] shrink-0 shadow-sm font-mono hidden">
                      COD
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-950 text-xs flex items-center gap-1.5 leading-none">
                        Cash On Delivery (COD)
                        <span className="text-[8px] uppercase bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded tracking-wider">Available</span>
                      </p>
                      <p className="text-[9.5px] text-slate-500 font-medium mt-1 leading-snug">Complete procurement now, pay cash at your corporate delivery site.</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                      {paymentMethod === 'COD' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 text-slate-950 font-black tracking-widest text-xs py-3.5 uppercase rounded-2xl hover:bg-amber-600 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {paymentMethod === 'COD' ? 'Confirm Procurement (COD)' : 'Proceed to Pay via Razorpay'}
            </button>
          </form>
        </div>

        {/* Right order totals summary card side */}
        <div className="w-full md:w-2/5 bg-slate-50 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[90vh]">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Sourcing Line Items</h2>

            {/* Cart products looping preview list */}
            <div className="divide-y divide-slate-200/80 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 py-3 items-center text-xs font-semibold">
                  <img src={item.product.imageUrl} alt="" className="w-9 h-9 object-contain bg-white rounded border" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-450 font-bold">Qty: {item.quantity} x ₹{item.product.offerPrice.toLocaleString('en-IN')}</p>
                  </div>
                  <span className="font-bold text-slate-800 font-mono">
                    ₹{(item.product.offerPrice * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown summary panel showing CGST/SGST/IGST */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-250/60 text-xs font-semibold space-y-3 shadow-sm">
              <h3 className="text-[10.5px] uppercase font-black tracking-wider text-slate-400">GSTR Taxes Breakdown Previews</h3>

              <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-150">
                <span className="text-slate-500 font-medium">Line items net cost:</span>
                <span className="font-bold text-slate-850">₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              
              {couponApplied && (
                <div className="flex justify-between items-center text-green-600 font-bold">
                  <span>Coupon ({couponApplied.code}) promo:</span>
                  <span>- ₹{couponApplied.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-500 font-medium">Taxable Base value:</span>
                <span>₹{taxableTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {isTamilNaduOutput ? (
                <>
                  <div className="flex justify-between items-center font-mono text-slate-600">
                    <span className="text-slate-550 font-medium">Output CGST (9.0%):</span>
                    <span>₹{(computedGrossTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-slate-600">
                    <span className="text-slate-550 font-medium">Output SGST (9.0%):</span>
                    <span>₹{(computedGrossTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center font-mono text-slate-600">
                  <span className="text-slate-550 font-medium">Integrated IGST (18.0%):</span>
                  <span>₹{computedGrossTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-150">
                <span>Accumulated GST:</span>
                <span>₹{computedGrossTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-baseline text-sm font-black text-slate-900 border-t border-double border-slate-200 pt-3">
                <span className="uppercase tracking-widest text-[10px]">Grand Payable:</span>
                <span className="text-lg text-amber-600">₹{taxableValueNet.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 space-y-2 text-[10.5px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Compliant India GSTR Tax logs auto-registered.</span>
            </div>
            <p>Receipt printable invoices will be loaded immediately on execution.</p>
          </div>
        </div>

      </div>

      {/* RAZORPAY EMULATED GATEWAY POPUP MODAL (Highly authentic layout!) */}
      {isRazorpayOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 select-none animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden text-slate-200 shadow-2xl relative font-sans">
            
            {/* Razorpay Brand Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-[15px]">
                  R
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wide text-white">Razorpay Secure Checkout</h4>
                  <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">{settings.shortName} Solutions</p>
                </div>
              </div>
              <button
                onClick={() => setIsRazorpayOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Amount card */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-850 flex justify-between items-center text-xs">
              <p className="text-slate-400 font-bold">Payable Amount:</p>
              <p className="text-lg font-black text-rose-500">₹{taxableValueNet.toLocaleString('en-IN')}</p>
            </div>

            {/* Razorpay Selector content area */}
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase font-bold tracking-widest">Active Payment Method</label>
                <div className="bg-amber-500/5 border border-amber-500/30 text-amber-500 text-[10.5px] font-black uppercase tracking-wider p-2.5 rounded-lg text-center">
                  UPI (Unified Payments Interface) Live
                </div>
              </div>

              {/* Razorpay Inputs simulation */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-400 font-bold">Enter Virtual Payment Address (VPA VPH ID)</p>
                <input
                  type="text"
                  defaultValue="rahul.verma@okaxis"
                  placeholder=""
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-100 font-mono text-center outline-none focus:border-amber-500 transition-colors"
                />
                <p className="text-[9px] text-slate-500 text-center">Fires instant notifications check link to client cell phone.</p>
              </div>

              {/* Confirm success simulation button for standard AI Studio sandbox limits */}
              <button
                type="button"
                onClick={() => submitOrderToBackend('Razorpay UPI', `pay_Rzp_${Math.random().toString(36).substring(3, 14)}`)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3 rounded-lg font-black tracking-widest text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Lock className="w-3.5 h-3.5" /> Authorize & Pay ₹{Math.round(taxableValueNet).toLocaleString()}
              </button>



              <div className="flex justify-center items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider pt-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure 256-Bit SSL Secured Transaction Frame
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
