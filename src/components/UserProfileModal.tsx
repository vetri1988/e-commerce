import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, MapPin, Building, Key, ShieldCheck, CheckCircle } from 'lucide-react';

interface UserProfileModalProps {
  currentUser: any;
  onClose: () => void;
  onUpdateSuccess: (updatedUser: any) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function UserProfileModal({ currentUser, onClose, onUpdateSuccess }: UserProfileModalProps) {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState(currentUser?.password || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [state, setState] = useState(currentUser?.state || 'Tamil Nadu');
  const [pincode, setPincode] = useState(currentUser?.pincode || '');
  const [gstin, setGstin] = useState(currentUser?.gstin || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !city || !pincode) {
      setErrorMsg('Please supply all mandatory fields.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
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
        const updatedUser = await response.json();
        setSuccessMsg('Profile updated successfully!');
        onUpdateSuccess(updatedUser);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to save changes.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="user-profile-modal-overlay" 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
    >
      <div 
        id="user-profile-modal-container" 
        className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-150 bg-slate-900 text-white flex justify-between items-center relative">
          <div>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-black tracking-widest px-2 py-0.5 rounded uppercase font-sans">
              Customer Profile Workspace
            </span>
            <h2 className="text-lg font-extrabold mt-1 text-white">
              View & Edit Your Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 font-extrabold text-xs rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4 text-xs font-semibold">
            {/* Name and Email */}
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
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium"
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
                    placeholder="customer@domain.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Password & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-550 block font-bold">Account Password *</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password passcode"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-550 block font-bold">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Mobile number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Deliver address */}
            <div className="space-y-1.5">
              <label className="text-slate-550 block font-bold">Delivery / Shipping Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street delivery address"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium resize-none"
                />
              </div>
            </div>

            {/* Dispatch Location Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-550 block font-bold">City / Town *</label>
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
                <label className="text-slate-550 block font-bold">State Jurisdiction *</label>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 text-slate-800 font-medium cursor-pointer"
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
                  maxLength={6}
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="560066"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* GST Details */}
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
                  onChange={e => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 33AAAAA1111A1Z1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-amber-500 text-slate-800 font-medium font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-[10.5px] text-amber-800 leading-normal font-semibold">
                By updating your parameters, your saved shipping details and tax attributes will be applied to your future checkout invoices dynamically.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold uppercase py-3 rounded-xl text-xs tracking-widest hover:-translate-y-px transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving General Updates...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
