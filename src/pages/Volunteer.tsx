import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { FaTent, FaHouseMedical, FaCamera, FaGift, FaHandHoldingDollar, FaHandshake, FaEarthAmericas } from 'react-icons/fa6';
import { IconType } from 'react-icons';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const opportunities: { id: string; label: string; icon: IconType; color: string; description: string }[] = [
  { id: 'events', label: 'Events', icon: FaTent, color: 'text-rose-500 bg-rose-50', description: 'Help set up and run our community events and fundraisers.' },
  { id: 'hospital-visits', label: 'Hospital Visits', icon: FaHouseMedical, color: 'text-emerald-500 bg-emerald-50', description: 'Bring smiles to children during hospital visits.' },
  { id: 'photography', label: 'Photography', icon: FaCamera, color: 'text-sky-500 bg-sky-50', description: 'Capture precious moments at our events and visits.' },
  { id: 'gift-drives', label: 'Gift Drives', icon: FaGift, color: 'text-red-500 bg-red-50', description: 'Help collect, organize, and deliver gifts to families.' },
  { id: 'fundraising', label: 'Fundraising', icon: FaHandHoldingDollar, color: 'text-amber-600 bg-amber-50', description: 'Support campaigns and donor outreach efforts.' },
  { id: 'sponsorships', label: 'Sponsorships', icon: FaHandshake, color: 'text-orange-500 bg-orange-50', description: 'Connect with businesses and community partners.' },
  { id: 'community-outreach', label: 'Community Outreach', icon: FaEarthAmericas, color: 'text-blue-500 bg-blue-50', description: 'Spread our mission and engage local communities.' },
];

export default function Volunteer() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    interests: [] as string[],
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const toggleInterest = (id: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (form.interests.length === 0) {
      toast.error('Please select at least one area of interest.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/volunteers', form);
      toast.success('Thank you for signing up! We will be in touch soon.');
      setForm({ firstName: '', lastName: '', email: '', phone: '', interests: [], message: '' });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-warm min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-soft to-navy py-28 md:py-40">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-hope blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-hope-light blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
          >
            Become Part Of <span className="text-hope-light">The Mission</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-white/70 mt-6 max-w-3xl mx-auto leading-relaxed"
          >
            Join our community of volunteers and help us create smiles, deliver hope, and make a
            meaningful difference in the lives of children and families.
          </motion.p>
        </div>
      </section>

      {/* Opportunities */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="font-display text-3xl md:text-5xl font-bold text-navy"
          >
            Volunteer Opportunities
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="font-body text-navy/60 mt-4 max-w-2xl mx-auto text-lg"
          >
            There are many ways to get involved. Choose the areas that match your passion and skills.
          </motion.p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-20">
          {opportunities.map((opp) => {
            const Icon = opp.icon;
            return (
              <motion.div
                key={opp.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${opp.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy mb-2">{opp.label}</h3>
                <p className="font-body text-navy/50 text-sm leading-relaxed">{opp.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Volunteer Form */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-navy mb-2">
              Sign Up to Volunteer
            </h3>
            <p className="font-body text-navy/50 mb-10">
              Fill out the form below and we will reach out with next steps.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-navy/70 mb-2">
                    First Name <span className="text-hope">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-navy/70 mb-2">
                    Last Name <span className="text-hope">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-navy/70 mb-2">
                    Email <span className="text-hope">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-navy/70 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent"
                  />
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block font-body text-sm font-medium text-navy/70 mb-3">
                  Areas of Interest <span className="text-hope">*</span>
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {opportunities.map((opp) => (
                    <label
                      key={opp.id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        form.interests.includes(opp.id)
                          ? 'border-hope bg-hope/5 shadow-sm'
                          : 'border-navy/10 hover:border-hope/30 hover:bg-hope/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.interests.includes(opp.id)}
                        onChange={() => toggleInterest(opp.id)}
                        className="w-4 h-4 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope"
                      />
                      <span className="font-body text-sm text-navy font-medium">{opp.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block font-body text-sm font-medium text-navy/70 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us a bit about yourself and why you would like to volunteer..."
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-hope to-hope-light hover:from-hope-light hover:to-hope text-white font-display font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Join Our Team'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
