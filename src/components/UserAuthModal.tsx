import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, MapPin, Building, Key, ShieldCheck } from 'lucide-react';

interface UserAuthModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function UserAuthModal({ onClose, onSuccess }: UserAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter your email address and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (response.ok) {
        const userData = await response.json();
        onSuccess(userData);
        onClose();
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (e) {
      setErrorMsg('An error occurred. Check server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone || !address || !city || !pincode) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          address,
          city,
          state,
          pincode,
          gstin
        })
      });

      if (response.ok) {
        const userData = await response.json();
        alert('Registration successful! Logging you in.');
        onSuccess(userData);
        onClose();
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || 'Registration failed.');
      }
    } catch (e) {
      setErrorMsg('An error occurred during registration. Check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-fadeIn">
        
        {/* Header container */}
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center relative">
          <div>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-black tracking-widest px-2 py-0.5 rounded uppercase font-sans">
              Customer Account Hub
            </span>
            <h2 className="text-lg font-extrabold mt-1 text-white">
              {mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-50 border-b border-slate-100 font-sans text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-center font-bold uppercase tracking-wider transition-colors ${mode === 'login' ? 'text-amber-600 bg-white border-b-2 border-amber-500' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Customer Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-center font-bold uppercase tracking-wider transition-colors relative ${mode === 'register' ? 'text-amber-600 bg-white border-b-2 border-amber-500' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Create Account
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[65vh] space-y-4">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold p-3.5 rounded-xl border border-red-200/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-550 block font-bold">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="e.g. customer@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-550 block font-bold">Account Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Your Password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 border border-slate-850 hover:bg-black text-white font-extrabold uppercase py-3 rounded-lg text-xs tracking-widest hover:-translate-y-px transition-all shadow cursor-pointer active:translate-y-0 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Your Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold">
              
              {/* Partner Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-550 block font-bold">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium font-sans"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-550 block font-bold">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="customer@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-550 block font-bold">Choose Password *</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-550 block font-bold">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Dispatch Address */}
              <div className="space-y-1.5">
                <label className="text-slate-550 block font-bold">Delivery / Shipping Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Sector 4, HSR Layout, Block 2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium leading-normal"
                  />
                </div>
              </div>

              {/* City, State & Pincode */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-550 block font-bold">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-550 block font-bold">State *</label>
                  <select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 text-slate-800 font-bold"
                  >
                    {INDIAN_STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-550 block font-bold">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    placeholder="560066"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Tax GSTIN Optional */}
              <div className="space-y-1.5">
                <label className="text-slate-550 block font-bold flex items-center justify-between">
                  <span>GSTIN Number (For Business Tax Invoice)</span>
                  <span className="text-[10px] text-slate-400 font-normal normal-case">Optional</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                    placeholder="e.g. 33AAAAA1111A1Z1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-[10.5px] text-amber-800 leading-normal font-semibold">
                  By registering, your shipping address and contact details will be saved for quick checkout on all orders.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold uppercase py-3 rounded-xl text-xs tracking-widest hover:-translate-y-px transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-300 disabled:text-slate-550 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Register & Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
