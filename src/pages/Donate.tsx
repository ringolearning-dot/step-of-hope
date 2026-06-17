import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useContent from '../lib/useContent';
import heroShared from '../assets/images/hero-shared.png';
import zelleQr from '../assets/images/zelle-qr.png';
import { FaGift, FaPalette, FaPeopleRoof, FaHouseMedical, FaPeopleGroup, FaFaceSmileBeam, FaStar, FaCreditCard } from 'react-icons/fa6';
import { IconType } from 'react-icons';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const presetAmounts = [25, 50, 100];

function calcProcessingFee(amount: number): number {
  // Stripe: 2.9% + $0.30 — solve for total: total = (amount + 0.30) / (1 - 0.029)
  if (amount <= 0) return 0;
  const total = (amount + 0.30) / (1 - 0.029);
  return Math.round((total - amount) * 100) / 100;
}

const impactItems: { icon: IconType; label: string; color: string }[] = [
  { icon: FaGift, label: 'Gifts and toys', color: 'text-red-500 bg-red-50' },
  { icon: FaPalette, label: 'Activity experiences', color: 'text-purple-500 bg-purple-50' },
  { icon: FaPeopleRoof, label: 'Family support', color: 'text-blue-500 bg-blue-50' },
  { icon: FaHouseMedical, label: 'Hospital visits', color: 'text-emerald-500 bg-emerald-50' },
  { icon: FaPeopleGroup, label: 'Community events', color: 'text-orange-500 bg-orange-50' },
  { icon: FaFaceSmileBeam, label: 'Smile packages', color: 'text-amber-500 bg-amber-50' },
  { icon: FaStar, label: 'Special celebrations', color: 'text-hope bg-hope/10' },
];

export default function Donate() {
  const c = useContent('donate');
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [coverFees, setCoverFees] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'zelle'>('card');

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Thank you for your generous donation! Your support brings hope to those who need it most.');
    }
    if (searchParams.get('canceled') === 'true') {
      toast('Donation was canceled. You can try again whenever you are ready.', { icon: '💛' });
    }
  }, [searchParams]);

  const baseAmount = amount ?? (customAmount ? parseFloat(customAmount) : 0);
  const fee = calcProcessingFee(baseAmount);
  const finalAmount = coverFees ? +(baseAmount + fee).toFixed(2) : baseAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseAmount || baseAmount < 1) {
      toast.error('Please select or enter a donation amount.');
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter your name and email.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/donations/create-session', {
        amount: finalAmount,
        isMonthly,
        name: name.trim(),
        email: email.trim(),
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Unable to process your donation right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-warm min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-soft to-navy py-28 md:py-40">
        <div className="absolute inset-0 z-0">
          <img src={heroShared} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/50 to-navy/70" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
          >
            {c.hero_title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-white/70 mt-6 max-w-3xl mx-auto leading-relaxed"
          >
            {c.hero_subtitle}
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Impact */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display text-3xl md:text-4xl font-bold text-navy"
            >
              Your Impact
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="font-body text-navy/60 mt-4 text-lg leading-relaxed"
            >
              Your donations go directly toward creating moments of happiness and relief for families
              in need. Here is how your support helps:
            </motion.p>

            <div className="mt-10 space-y-3">
              {impactItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    variants={fadeUp}
                    className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-body text-navy font-medium">{item.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Donation Form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            <motion.form
              variants={fadeUp}
              custom={0}
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-lg p-8 md:p-10"
            >
              <h3 className="font-display text-2xl font-bold text-navy mb-2">Make a Donation</h3>
              <p className="font-body text-navy/50 text-sm mb-8">
                Your contribution is secure and tax-deductible.
              </p>

              {/* Payment Method Toggle */}
              <div className="flex items-center gap-2 mb-8">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-display font-semibold text-sm transition-all duration-300 ${
                    paymentMethod === 'card'
                      ? 'border-navy bg-navy text-white shadow-md'
                      : 'border-navy/10 text-navy/50 hover:border-navy/30'
                  }`}
                >
                  <FaCreditCard className="w-4 h-4" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-display font-semibold text-sm transition-all duration-300 ${
                    paymentMethod === 'paypal'
                      ? 'border-[#FFD140] bg-[#FFD140] text-black shadow-md'
                      : 'border-navy/10 text-navy/50 hover:border-[#FFD140]/50'
                  }`}
                >
                  <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg" alt="" className="h-4" />
                  PayPal
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('zelle')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-display font-semibold text-sm transition-all duration-300 ${
                    paymentMethod === 'zelle'
                      ? 'border-[#6D1ED4] bg-[#6D1ED4] text-white shadow-md'
                      : 'border-navy/10 text-navy/50 hover:border-[#6D1ED4]/50'
                  }`}
                >
                  <svg viewBox="0 0 36 36" className="h-4 w-4" fill="none">
                    <path d="M23.4 6H12.6L6 18l6.6 12h10.8L30 18 23.4 6Z" fill={paymentMethod === 'zelle' ? '#fff' : '#6D1ED4'} />
                    <path d="M20.1 13.2h-5.7l-2.1 3.6 6.3 6.6h-4.2l2.1 3.6h5.7l2.1-3.6-6.3-6.6h4.2l-2.1-3.6Z" fill={paymentMethod === 'zelle' ? '#6D1ED4' : '#fff'} />
                  </svg>
                  Zelle
                </button>
              </div>

              {/* Card Payment (Stripe) */}
              {paymentMethod === 'card' && (
                <>
                  {/* Monthly Toggle */}
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <button
                      type="button"
                      onClick={() => setIsMonthly(false)}
                      className={`font-display font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 ${
                        !isMonthly
                          ? 'bg-navy text-white shadow-md'
                          : 'bg-navy/5 text-navy/50 hover:bg-navy/10'
                      }`}
                    >
                      One-Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMonthly(true)}
                      className={`font-display font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 ${
                        isMonthly
                          ? 'bg-navy text-white shadow-md'
                          : 'bg-navy/5 text-navy/50 hover:bg-navy/10'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>

                  {/* Amount Selection */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {presetAmounts.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAmount(preset);
                          setCustomAmount('');
                        }}
                        className={`font-display font-bold text-lg py-4 rounded-xl border-2 transition-all duration-300 ${
                          amount === preset
                            ? 'border-gold bg-gold/10 text-gold shadow-md'
                            : 'border-navy/10 text-navy/60 hover:border-gold/40 hover:bg-gold/5'
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="relative mb-8">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-bold text-navy/40 text-lg">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Custom amount"
                      value={customAmount}
                      onFocus={() => setAmount(null)}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setAmount(null);
                      }}
                      className="w-full pl-9 pr-4 py-4 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy text-lg transition-all duration-300 bg-transparent"
                    />
                  </div>

                  {/* Name & Email */}
                  <div className="space-y-4 mb-8">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-4 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-4 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent"
                    />
                  </div>

                  {/* Cover Fees Checkbox */}
                  <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={coverFees}
                      onChange={(e) => setCoverFees(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-navy/20 text-navy focus:ring-hope accent-navy flex-shrink-0"
                    />
                    <span className="font-body text-sm text-navy/70 leading-snug group-hover:text-navy transition-colors">
                      Cover processing fees so <strong>100%</strong> of my donation supports Step of Hope Foundation.
                    </span>
                  </label>

                  {/* Fee Breakdown */}
                  {baseAmount >= 1 && (
                    <div className="bg-navy/[0.03] rounded-xl p-4 mb-6 space-y-1.5 font-body text-sm">
                      <div className="flex justify-between text-navy/60">
                        <span>Donation</span>
                        <span>${baseAmount.toFixed(2)}</span>
                      </div>
                      {coverFees && (
                        <div className="flex justify-between text-navy/60">
                          <span>Processing fee</span>
                          <span>${fee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-display font-bold text-navy pt-1.5 border-t border-navy/10">
                        <span>Total charged</span>
                        <span>${finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-white font-display font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {loading ? 'Processing...' : `Donate $${finalAmount.toFixed(2)} ${isMonthly ? '/ month' : ''}`}
                  </button>
                  <p className="font-body text-navy/40 text-xs text-center mt-4">
                    Secure payment powered by Stripe. Your information is encrypted and protected.
                  </p>
                </>
              )}

              {/* PayPal Payment */}
              {paymentMethod === 'paypal' && (
                <div className="flex flex-col items-center gap-3">
                  <form action="https://www.paypal.com/ncp/payment/WQ8AGSX736JN4" method="post" target="_blank" className="w-full">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-[#FFD140] hover:bg-[#f0c430] text-black font-bold py-4 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg" alt="" className="h-5" />
                      Donate with PayPal
                    </button>
                  </form>
                  <div className="flex items-center gap-2">
                    <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="Accepted cards" className="h-5" />
                  </div>
                  <p className="font-body text-navy/40 text-xs flex items-center gap-1">
                    Powered by
                    <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="PayPal" className="h-3.5" />
                  </p>
                </div>
              )}

              {/* Zelle Payment */}
              {paymentMethod === 'zelle' && (
                <div className="flex flex-col items-center gap-4">
                  <p className="font-body text-navy/70 text-sm text-center leading-relaxed">
                    Scan the QR code below with your banking app to send your donation via Zelle.
                  </p>
                  <div className="bg-white border-2 border-navy/10 rounded-2xl p-4 shadow-sm">
                    <img
                      src={zelleQr}
                      alt="Zelle QR Code"
                      className="w-56 h-56 object-contain mx-auto"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-body text-navy/50 text-xs mb-1">Or send directly to:</p>
                    <p className="font-display font-bold text-navy text-base select-all">
                      stepofhopefoundation@gmail.com
                    </p>
                  </div>
                  <div className="bg-navy/[0.03] rounded-xl p-4 w-full">
                    <p className="font-body text-navy/60 text-xs text-center leading-relaxed">
                      After sending your Zelle payment, please include your name and "Donation" in the memo so we can properly acknowledge your generous contribution.
                    </p>
                  </div>
                </div>
              )}
            </motion.form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
