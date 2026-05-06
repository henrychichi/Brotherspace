import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types.ts';
import { api } from '../services/api.ts';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportSpaceProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onBack: () => void;
}

type PaymentMethod = 'CARD' | 'AIRTEL';

interface Country {
  name: string;
  code: string;
  flag: string;
  iso: string;
}

const AIRTEL_COUNTRIES: Country[] = [
  { name: 'Kenya', code: '+254', flag: 'ðŸ‡°ðŸ‡ª', iso: 'KE' },
  { name: 'Uganda', code: '+256', flag: 'ðŸ‡ºðŸ‡¬', iso: 'UG' },
  { name: 'Tanzania', code: '+255', flag: 'ðŸ‡¹ðŸ‡¿', iso: 'TZ' },
  { name: 'Rwanda', code: '+250', flag: 'ðŸ‡·ðŸ‡¼', iso: 'RW' },
  { name: 'Malawi', code: '+265', flag: 'ðŸ‡²ðŸ‡¼', iso: 'MW' },
  { name: 'Zambia', code: '+260', flag: 'ðŸ‡¿ðŸ‡²', iso: 'ZM' },
  { name: 'Nigeria', code: '+234', flag: 'ðŸ‡³ðŸ‡¬', iso: 'NG' },
];

const SupportSpace: React.FC<SupportSpaceProps> = ({ user, onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AIRTEL');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(AIRTEL_COUNTRIES[0]);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [ussdStep, setUssdStep] = useState<'IDLE' | 'AUTHORIZING' | 'PUSHING' | 'WAITING'>('IDLE');
  
  const cardElementRef = useRef<any>(null);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  
  const STRIPE_PUB_KEY = 'pk_test_51SUwc5DIKV6SbjDLIcl52teOmQiOj4wBwLHlTGpiLSSSXmJ5WamSLM0xTygbjY1p5uRAELQB6phFMru5uGmOrRyW00tGrEUFGF';

  useEffect(() => {
    let card: any;
    if (paymentMethod === 'CARD') {
      const initStripe = async () => {
        if ((window as any).Stripe) {
          try {
            const stripe = (window as any).Stripe(STRIPE_PUB_KEY);
            setStripeInstance(stripe);
            const elements = stripe.elements();
            const style = {
              base: {
                color: '#E6E8EB',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                '::placeholder': { color: '#6B7280' },
              },
              invalid: { color: '#EF4444', iconColor: '#EF4444' },
            };
            card = elements.create('card', { style, hidePostalCode: true });
            card.mount('#card-element');
            cardElementRef.current = card;
            setStripeLoaded(true);
          } catch (e) {
            console.error("Stripe initialization failed:", e);
            setError("The card payment gateway is currently unavailable.");
          }
        }
      };
      initStripe();
    }
    return () => { if (card) card.destroy(); };
  }, [paymentMethod]);

  const handleAirtelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError(null);
    setUssdStep('AUTHORIZING');

    // Simulate mobile money USSD flow
    setTimeout(() => {
      setUssdStep('PUSHING');
      setTimeout(() => {
        setUssdStep('WAITING');
        setTimeout(async () => {
          try {
            const updatedUser = user.trial_started_at 
              ? await api.completeMembershipPayment(user.id)
              : await api.setSupporterStatus(user.id, true);
            
            setIsSuccess(true);
            setUssdStep('IDLE');
            setTimeout(() => onSuccess(updatedUser), 2000);
          } catch (err: any) {
            setError(err.message || "A secure connection could not be established. Please try again.");
            setLoading(false);
            setUssdStep('IDLE');
          }
        }, 4000);
      }, 1500);
    }, 1000);
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeInstance || !cardElementRef.current) return;
    setLoading(true);
    setError(null);
    
    const { error: stripeError } = await stripeInstance.createToken(cardElementRef.current);
    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
    } else {
      setTimeout(async () => {
        try {
          const updatedUser = user.trial_started_at 
            ? await api.completeMembershipPayment(user.id)
            : await api.setSupporterStatus(user.id, true);
          setIsSuccess(true);
          setTimeout(() => onSuccess(updatedUser), 2000);
        } catch (err: any) {
          setError(err.message || "Payment authorization failed. Please check your card details.");
          setLoading(false);
        }
      }, 2000);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-brand-bg px-10 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-8 shadow-2xl">
          <svg className="w-12 h-12 text-brand-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </motion.div>
        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter text-white">Identity Verified</h2>
        <p className="text-brand-secondary text-base font-medium">Welcome to Vanguard, Brother. Your status is now active across the space.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-brand-bg overflow-y-auto no-scrollbar pb-12">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 p-6 flex items-center justify-between bg-brand-bg/95 backdrop-blur-md">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-brand-secondary hover:text-white transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-brand-surface rounded-full border border-white/5">
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary">Secure Portal</span>
        </div>
        <div className="w-10" />
      </header>

      <div className="px-6 py-4">
        {/* Value Proposition */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black mb-3 tracking-tighter uppercase italic text-brand-primary">Vanguard Elite</h1>
          <p className="text-brand-secondary text-sm font-semibold max-w-[280px] mx-auto leading-relaxed">
            Stand out in the space. Unlock priority reach, gold recognition, and private tools.
          </p>
        </div>

        {/* Professional Pricing Tier */}
        <div className="relative mb-10 overflow-hidden bg-gradient-to-br from-brand-surface to-brand-bg border border-white/10 rounded-[2.5rem] shadow-2xl p-8 group">
          <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none">
             <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          
          <div className="flex flex-col items-center relative z-10">
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-6">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Recommended Membership</span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-black tracking-tighter text-white">$49.99</span>
              <span className="text-brand-hint font-black text-sm uppercase tracking-widest">/Year</span>
            </div>
            
            <div className="w-full bg-amber-500 text-brand-bg p-4 rounded-2xl mb-8 flex items-center justify-between shadow-xl">
               <span className="font-black uppercase tracking-widest text-xs">First Month Free</span>
               <div className="flex items-center gap-1">
                 <span className="text-[10px] font-bold uppercase">Cancel Anytime</span>
               </div>
            </div>

            <p className="text-brand-secondary text-sm font-medium leading-relaxed mb-10 text-center px-4">
               Start your 30-day free trial today. No charges will be made until your trial period concludes.
            </p>
            
            <div className="w-full space-y-5 py-8 border-y border-white/5">
              {[
                { label: 'Gold Vanguard Badge', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                { label: 'Priority Support Reach', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                { label: 'Unlimited Private Connections', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' }
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-500 shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d={benefit.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span className="text-[14px] font-bold text-brand-primary tracking-tight">{benefit.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="flex p-1.5 bg-brand-surface rounded-[1.5rem] mb-10 border border-white/5 shadow-inner">
          <button 
            onClick={() => setPaymentMethod('AIRTEL')}
            className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${paymentMethod === 'AIRTEL' ? 'bg-red-600 text-white shadow-xl scale-[1.02]' : 'text-brand-hint hover:text-white'}`}
          >
            Airtel Money
          </button>
          <button 
            onClick={() => setPaymentMethod('CARD')}
            className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${paymentMethod === 'CARD' ? 'bg-brand-accent text-white shadow-xl scale-[1.02]' : 'text-brand-hint hover:text-white'}`}
          >
            Credit Card
          </button>
        </div>

        {/* Action Forms */}
        <AnimatePresence mode="wait">
          {paymentMethod === 'AIRTEL' ? (
            <motion.form 
              key="airtel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleAirtelSubmit} 
              className="space-y-8"
            >
              <div className="bg-brand-surface p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                 <label className="text-[11px] font-black text-brand-hint uppercase tracking-widest mb-6 block">Mobile Wallet Account</label>
                 
                 <div className="flex flex-col gap-6 relative">
                    <div className="flex items-center gap-4">
                      {/* Robust Country Picker */}
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setIsCountryPickerOpen(!isCountryPickerOpen)}
                          className="bg-brand-bg h-16 px-5 rounded-2xl font-black text-brand-primary border border-white/5 flex items-center gap-3 min-w-[110px] active:scale-95 transition-all shadow-inner"
                        >
                          <span className="text-2xl leading-none">{selectedCountry.flag}</span>
                          <span className="text-sm">{selectedCountry.code}</span>
                          <svg className={`w-4 h-4 text-brand-hint transition-transform ${isCountryPickerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>

                        <AnimatePresence>
                          {isCountryPickerOpen && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute bottom-full left-0 mb-4 w-64 z-50 bg-[#1e2127] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl"
                            >
                              <div className="max-h-64 overflow-y-auto no-scrollbar">
                                {AIRTEL_COUNTRIES.map((country) => (
                                  <button
                                    key={country.iso}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(country);
                                      setIsCountryPickerOpen(false);
                                    }}
                                    className={`w-full p-5 flex items-center justify-between transition-colors hover:bg-white/5 ${selectedCountry.iso === country.iso ? 'bg-red-600/10' : ''}`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <span className="text-2xl">{country.flag}</span>
                                      <span className="text-xs font-black text-brand-primary uppercase tracking-widest">{country.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-brand-accent">{country.code}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <input 
                        type="tel" 
                        placeholder="7XX XXX XXX" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 h-16 bg-brand-bg px-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600/50 text-xl font-black tracking-widest text-white shadow-inner"
                      />
                    </div>
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-20 bg-red-600 text-white rounded-3xl font-black text-lg shadow-[0_20px_40px_rgba(220,38,38,0.3)] flex items-center justify-center gap-4 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'START MY FREE TRIAL'
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCardSubmit} 
              className="space-y-8"
            >
              <div className="bg-brand-surface p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                 <label className="text-[11px] font-black text-brand-hint uppercase tracking-widest mb-6 block">Card Details</label>
                 <div id="card-element" className="p-5 bg-brand-bg rounded-2xl border border-white/5 shadow-inner"></div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !stripeLoaded}
                className="w-full h-20 bg-brand-accent text-white rounded-3xl font-black text-lg shadow-[0_20px_40px_rgba(58,122,254,0.3)] disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {loading ? 'AUTHORIZING...' : 'START FREE TRIAL'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
            <p className="text-red-400 text-sm font-black uppercase tracking-widest leading-relaxed">{error}</p>
          </motion.div>
        )}

        <div className="mt-16 pt-10 border-t border-white/5 flex flex-col items-center opacity-40">
           <div className="flex items-center gap-10 mb-8">
              <span className="text-[14px] font-black italic tracking-tighter text-white">airtel</span>
              <span className="text-[14px] font-black tracking-widest text-white">VISA</span>
              <span className="text-[14px] font-black tracking-widest text-white">stripe</span>
           </div>
           <p className="text-[10px] text-brand-hint uppercase font-black tracking-[0.3em] flex items-center gap-2">
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
             Military-Grade 256-bit Encryption
           </p>
        </div>
      </div>

      {/* Modern Payment Status Overlay */}
      <AnimatePresence>
        {ussdStep !== 'IDLE' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-bg/95 backdrop-blur-xl flex items-center justify-center p-10"
          >
            <div className="w-full max-w-sm text-center">
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_60px_rgba(220,38,38,0.5)] relative">
                 <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-red-600 rounded-full" 
                 />
                 <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">
                {ussdStep === 'AUTHORIZING' ? 'Authenticating' : ussdStep === 'PUSHING' ? 'Linking Account' : 'Action Required'}
              </h3>
              <p className="text-brand-secondary text-base leading-relaxed mb-12 font-medium">
                {ussdStep === 'WAITING' 
                  ? 'A secure payment prompt has been sent to your device. Please enter your Mobile Money PIN to authorize the trial.' 
                  : 'Establishing a secure encrypted connection with the mobile payment gateway...'}
              </p>
              {ussdStep === 'WAITING' && (
                <div className="flex justify-center gap-3">
                  {[0, 1, 2].map(i => (
                    <div 
                      key={i}
                      className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" 
                      style={{ animationDelay: `${i * 200}ms` }} 
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportSpace;
