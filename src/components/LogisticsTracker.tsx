import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Truck, CheckCircle2, Package, RefreshCw, Calendar, Phone, Mail, FileText, AlertTriangle } from 'lucide-react';
import { Order, CompanySettings } from '../types';

interface LogisticsTrackerProps {
  orders: Order[];
  settings: CompanySettings;
  onBack: () => void;
}

export default function LogisticsTracker({ orders, settings, onBack }: LogisticsTrackerProps) {
  const [query, setQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = () => {
    setErrorMsg('');
    setSearched(true);
    const cleanedQuery = query.trim().toLowerCase();

    if (!cleanedQuery) {
      setTrackedOrder(null);
      return;
    }

    // Try finding exact match in real active orders database
    const found = orders.find(
      o =>
        o.id.toLowerCase() === cleanedQuery ||
        o.orderNumber.toLowerCase() === cleanedQuery ||
        o.id.toLowerCase().includes(cleanedQuery) ||
        cleanedQuery.includes(o.id.toLowerCase())
    );

    if (found) {
      setTrackedOrder(found);
    } else {
      // If we don't find it, show warning or suggest recent orders
      setTrackedOrder(null);
      setErrorMsg('No active tracking records matched that tracking or invoice code. Try another value.');
    }
  };

  // Do not run on mount to prevent tracking empty query
  useEffect(() => {
    if (query) {
      handleTrack();
    }
  }, [orders]);

  // Status mapping and rendering helpers
  const getStatusSteps = (status: string) => {
    // Sequence of progression
    const sequence = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];
    
    // Determine active index
    let activeIndex = sequence.indexOf(status);
    if (activeIndex === -1) {
      // Handle legacy or cancellation states
      if (status === 'Cancelled') return { steps: sequence, activeIndex: -1, isCancelled: true };
      // Fallback first step
      activeIndex = 0;
    }
    
    return { steps: sequence, activeIndex, isCancelled: false };
  };

  const { steps, activeIndex, isCancelled } = trackedOrder 
    ? getStatusSteps(trackedOrder.status) 
    : { steps: [], activeIndex: -1, isCancelled: false };

  // Helper to render icon for each step
  const getStepIcon = (step: string) => {
    switch (step) {
      case 'Confirmed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'Packed':
        return <Package className="w-5 h-5" />;
      case 'Shipped':
        return <Truck className="w-5 h-5" />;
      case 'Delivered':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <RefreshCw className="w-5 h-5" />;
    }
  };

  return (
    <div id="logistics-tracker-panel" className="max-w-3xl mx-auto space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-slate-600 font-semibold select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <button 
            type="button"
            onClick={onBack} 
            className="text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 cursor-pointer text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Storefront
          </button>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-500" /> Logistics Carrier & SLA Tracking
          </h2>
          <p className="text-xs text-slate-400 font-medium font-sans">
            Once check out payment completes, our logistics desk indexes dynamic status updates here.
          </p>
        </div>

        {/* Dynamic customer care number */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2.5 text-right shrink-0">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Logistics Helpline</p>
          <a
            href={`tel:${settings.phone}`}
            className="text-slate-950 font-black text-sm flex items-center gap-1.5 justify-end mt-0.5 hover:text-amber-600 transition-colors"
          >
            <Phone className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{settings.phone}</span>
          </a>
        </div>
      </div>

      {/* Input tracker zone */}
      <div className="space-y-3">
        <label className="text-slate-800 text-xs block font-bold">Track Shipment Details</label>
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 focus-within:border-amber-500 transition-colors">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type Invoice ID (INV-XXXXXX) or Tracking Code..."
            className="w-full bg-transparent px-4 py-2.5 outline-none text-xs text-slate-800 font-bold"
            onKeyDown={e => {
              if (e.key === 'Enter') handleTrack();
            }}
          />
          <button 
            type="button"
            onClick={handleTrack} 
            className="bg-slate-900 hover:bg-black text-white font-extrabold uppercase tracking-widest text-[10.5px] px-6 rounded-xl transition-all cursor-pointer border border-slate-905"
          >
            Track Cargo
          </button>
        </div>
        
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Realtime tracked info details */}
      {searched && trackedOrder && (
        <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50 space-y-6 animate-fadeIn">
          {/* Header parameters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-150/60 pb-4">
            <div>
              <span className="text-[9px] bg-indigo-500 text-white font-black uppercase tracking-widest px-2 py-0.5 rounded font-sans">
                Active Fullfillment Track
              </span>
              <p className="text-sm font-black text-slate-900 mt-1">
                Invoice No: {trackedOrder.id}
              </p>
              {trackedOrder.orderNumber && (
                <p className="text-[10px] text-slate-400 font-medium">
                  Order Number: {trackedOrder.orderNumber}
                </p>
              )}
            </div>

            <div className="text-left sm:text-right font-medium">
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isCancelled ? 'bg-red-50 border-red-200 text-red-600' :
                trackedOrder.status === 'Delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                Fulfillment: {trackedOrder.status}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-sans">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Booked Date: {new Date(trackedOrder.date).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {/* Graphical fulfillment state timeline */}
          {isCancelled ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs text-center space-y-1">
              <p className="font-extrabold text-sm uppercase tracking-wider">Order Cancelled</p>
              <p className="font-medium">This dispatch cycle was revoked or cancelled by Admin. Refund issues will settle shortly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-800 font-bold uppercase tracking-wider">Orchestration Progress Lifecycle</p>
              
              <div className="relative pt-2 pb-6">
                {/* Horizontal line connector background */}
                <div className="absolute top-7 left-8 right-8 h-1 bg-slate-200 rounded -z-10 hidden sm:block" />
                
                {/* Steps layout bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2">
                  {steps.map((step, idx) => {
                    const isDone = idx <= activeIndex;
                    const isCurrent = idx === activeIndex;
                    
                    return (
                      <div key={step} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-center relative z-10">
                        {/* Step Circle Indicator */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                          isDone 
                            ? isCurrent 
                              ? 'bg-amber-500 border-amber-600 text-slate-950 scale-110 shadow-md animate-pulse'
                              : 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-200 text-slate-350'
                        }`}>
                          {getStepIcon(step)}
                        </div>

                        {/* Title details */}
                        <div className="text-left sm:text-center">
                          <p className={`text-xs font-extrabold tracking-tight ${
                            isDone ? 'text-slate-900' : 'text-slate-400'
                          }`}>
                            {step}
                          </p>
                          <p className="text-[9.5px] text-slate-450 font-normal leading-normal select-none">
                            {step === 'Confirmed' && 'System verified'}
                            {step === 'Packed' && 'Sourcing Hub packed'}
                            {step === 'Shipped' && 'Transit cargo dispatch'}
                            {step === 'Delivered' && 'SLA successfully closed'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Delivery consignee info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-150/60 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-slate-150">
              <p className="font-extrabold uppercase tracking-wide text-slate-400 text-[9px] mb-1.5">Consignee Attributes</p>
              <div className="space-y-1 font-medium text-slate-800">
                <p className="font-bold text-slate-900">{trackedOrder.shippingAddress.fullName}</p>
                <p>{trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.state} - {trackedOrder.shippingAddress.pincode}</p>
                {trackedOrder.shippingAddress.phone && <p>Contact: {trackedOrder.shippingAddress.phone}</p>}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-150 flex flex-col justify-between">
              <div>
                <p className="font-extrabold uppercase tracking-wide text-slate-400 text-[9px] mb-1.5">Cargo Manifest Content</p>
                <div className="text-slate-700 leading-normal font-sans text-[11px] font-semibold">
                  {trackedOrder.items?.map((it: any, index: number) => (
                    <p key={index} className="truncate select-none">
                      • {it.product?.name || it.productName || 'Electronics Equipment'} x {it.quantity}
                    </p>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 mt-2 flex justify-between items-baseline">
                <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider">Gross Invoice:</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono">
                  ₹{trackedOrder.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helper quick select if there are active customer orders */}
      {orders.length > 0 && (
        <div className="border-t border-slate-100 pt-5 space-y-2.5">
          <p className="text-slate-800 text-xs font-bold">Quick Track Active Invoices:</p>
          <div className="flex flex-wrap gap-2">
            {orders.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => { setQuery(o.id); setTimeout(() => handleTrack(), 50); }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer font-mono transition-all ${
                  query === o.id
                    ? 'bg-amber-500 border-amber-600 text-slate-950 font-extrabold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-205'
                }`}
              >
                {o.id} ({o.status})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic contact details */}
      <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-[11px] text-slate-450 font-semibold select-none">
        <p className="flex items-center gap-1">
          <Mail className="w-3.5 h-3.5 text-amber-500" />
          <span>Need rapid escalation? Mail us at: <b>{settings.email}</b></span>
        </p>
        <p>
          SLA Code Compliance verified under ISO standards.
        </p>
      </div>
    </div>
  );
}
