import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useContent from '../lib/useContent';
import { FaGift, FaPalette, FaPeopleRoof, FaHouseMedical, FaPeopleGroup, FaFaceSmileBeam, FaStar } from 'react-icons/fa6';
import { IconType } from 'react-icons';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const presetAmounts = [25, 50, 100];

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

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Thank you for your generous donation! Your support brings hope to those who need it most.');
    }
    if (searchParams.get('canceled') === 'true') {
      toast('Donation was canceled. You can try again whenever you are ready.', { icon: '💛' });
    }
  }, [searchParams]);

  const finalAmount = amount ?? (customAmount ? parseFloat(customAmount) : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 1) {
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
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-hope blur-[120px]" />
          <div className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full bg-hope-light blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-white font-display font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {loading ? 'Processing...' : `Donate ${finalAmount ? `$${finalAmount}` : ''} ${isMonthly ? '/ month' : ''}`}
              </button>

              <p className="font-body text-navy/40 text-xs text-center mt-4">
                Secure payment powered by Stripe. Your information is encrypted and protected.
              </p>
            </motion.form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
