import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, Mail, User, Phone, MessageSquare } from 'lucide-react';

interface GeneralEnquiryCardProps {
  currentUser?: any;
}

export default function GeneralEnquiryCard({ currentUser }: GeneralEnquiryCardProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync with currentUser when logged in
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) {
      setErrorMsg('Please populate all fields.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: null,
          productName: 'General Customer Request / Quote',
          name,
          email,
          phone,
          message,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
        setMessage('');
        setTimeout(() => {
          setIsSubmitted(false);
        }, 5000);
      } else {
        setErrorMsg('Failed to submit. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Reference check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="general-enquiry-card"
      className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs select-none"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-600">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-slate-900 font-extrabold text-sm tracking-tight">Need a Custom Quote?</h4>
          <p className="text-[10px] text-slate-400 font-medium">Send us a direct enquiry or question</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="relative">
          <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Full Name"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 pl-8 outline-none focus:border-amber-500 font-semibold text-slate-800"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 pl-8 outline-none focus:border-amber-500 font-semibold text-slate-800"
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile Number"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 pl-8 outline-none focus:border-amber-500 font-semibold text-slate-800"
          />
        </div>

        <div>
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Briefly describe your requirements (e.g. customized desktop setups, delivery schedule, quantity bulk orders...)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:border-amber-500 text-[11px] font-semibold text-slate-800 resize-none leading-relaxed"
          />
        </div>

        {errorMsg && (
          <p className="text-red-600 font-bold text-[10px]">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-extrabold uppercase py-2.5 rounded-xl text-[10.5px] tracking-wider transition-all shadow-sm cursor-pointer border border-amber-500/15"
        >
          {isLoading ? 'Submitting...' : 'Submit General Enquiry'}
        </button>
      </form>

      {isSubmitted && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-emerald-800 text-[10px] leading-relaxed font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Thank you! Your enquiry has been received and reflects in our system. We will reply shortly!</span>
        </div>
      )}
    </div>
  );
}
