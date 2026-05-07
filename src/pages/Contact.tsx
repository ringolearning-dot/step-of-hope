import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '../lib/api';
import { FaInstagram, FaFacebookF, FaTiktok } from 'react-icons/fa';
import { FaCircleQuestion, FaHeart, FaPeopleGroup, FaCalendarDays, FaCamera, FaCirclePlay } from 'react-icons/fa6';

function SectionImage({ section, slot, fallback, className }: { section: string; slot: string; fallback: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!section || !slot) return;
    api.get(`/images/${section}/${slot}`).then(res => setSrc(getImageUrl(res.data.filename))).catch(() => {});
  }, [section, slot]);
  if (src) return <img src={src} alt={fallback} className={className} />;
  return (
    <div className={`bg-gradient-to-br from-navy/10 to-hope/10 flex items-center justify-center text-navy/30 text-sm font-body ${className}`}>
      {fallback}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const inquiryTypes = [
  {
    value: 'General',
    label: 'General Inquiry',
    icon: FaCircleQuestion,
    description: 'Have a question or just want to learn more about Step of Hope?',
    about: '',
    imageSlot: '',
  },
  {
    value: 'Donation',
    label: 'Donation Inquiry',
    icon: FaHeart,
    description: 'Questions about giving, tax receipts, or how your contribution makes an impact.',
    about: '',
    imageSlot: '',
  },
  {
    value: 'Volunteer',
    label: 'Volunteer Inquiry',
    icon: FaPeopleGroup,
    description: 'Interested in volunteering? Learn about opportunities and how to get started.',
    about: '',
    imageSlot: '',
  },
  {
    value: 'Event Booking',
    label: 'Event Booking',
    icon: FaCalendarDays,
    description: 'Book a photobooth, 360 booth, or photography for your event.',
    about: 'Step of Hope Foundation offers professional event services including photobooths, 360 video booths, and event photography. A portion of every booking directly supports children and families facing illness. Your celebration can help create another child\'s smile.',
    imageSlot: 'events/gallery1',
  },
  {
    value: 'photobooth',
    label: 'Photobooth Booking',
    icon: FaCamera,
    description: 'Book our photobooth for your wedding, birthday, graduation, or corporate event.',
    about: 'Our premium photobooth experience comes with custom backdrops, professional lighting, instant prints, and digital sharing. Perfect for weddings, birthdays, graduations, school events, and corporate gatherings. Every booking helps support Step of Hope Foundation\'s mission to bring joy and hope to children facing illness.',
    imageSlot: 'events/photobooth',
  },
  {
    value: '360booth',
    label: '360 Booth Booking',
    icon: FaCirclePlay,
    description: 'Book our 360 video booth for an unforgettable experience at your event.',
    about: 'Our 360 video booth captures stunning slow-motion videos from every angle, creating unforgettable shareable content for your guests. Available for weddings, corporate events, birthday parties, and special celebrations. A portion of every booking supports Step of Hope Foundation.',
    imageSlot: 'events/360booth',
  },
];

const contactSections = [
  { title: 'General Inquiries', description: 'Have a question or just want to learn more about Step of Hope? We would love to hear from you.', icon: FaCircleQuestion },
  { title: 'Donation Inquiries', description: 'Questions about giving, tax receipts, or how your contribution makes an impact.', icon: FaHeart },
  { title: 'Volunteer Inquiries', description: 'Interested in volunteering? Learn about opportunities and how to get started.', icon: FaPeopleGroup },
  { title: 'Event Booking Inquiries', description: 'Want to book a photobooth, 360 booth, or photography for your event? Reach out here.', icon: FaCalendarDays },
];

export default function Contact() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');

  const getInitialType = () => {
    if (!typeParam) return 'General';
    const match = inquiryTypes.find(t => t.value.toLowerCase() === typeParam.toLowerCase());
    return match ? match.value : 'General';
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    inquiryType: getInitialType(),
    message: '',
  });
  const [loading, setLoading] = useState(false);

  // Update form when URL type param changes
  useEffect(() => {
    if (typeParam) {
      const match = inquiryTypes.find(t => t.value.toLowerCase() === typeParam.toLowerCase());
      if (match) {
        setForm(prev => ({
          ...prev,
          inquiryType: match.value,
          subject: prev.subject || match.label,
        }));
      }
    }
  }, [typeParam]);

  const selectedType = inquiryTypes.find(t => t.value === form.inquiryType) || inquiryTypes[0];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', inquiryType: 'General', message: '' });
    } catch {
      toast.error('Unable to send your message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-warm min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-soft to-navy py-28 md:py-40">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/2 w-96 h-96 rounded-full bg-hope blur-[120px]" />
          <div className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full bg-hope-light blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
          >
            Get In <span className="text-hope-light">Touch</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-white/70 mt-6 max-w-3xl mx-auto leading-relaxed"
          >
            Whether you have a question, want to get involved, or are ready to book an event, we are
            here for you. Reach out and let us start a conversation.
          </motion.p>
        </div>
      </section>

      {/* Selected Type About Section */}
      {typeParam && selectedType.about && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white border-b border-gray-100"
        >
          <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              {/* Image */}
              <div className="order-2 md:order-1">
                <SectionImage
                  section={selectedType.imageSlot.split('/')[0]}
                  slot={selectedType.imageSlot.split('/')[1]}
                  fallback={selectedType.label}
                  className="w-full h-64 md:h-80 rounded-2xl object-cover"
                />
              </div>
              {/* Text */}
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-hope/10 flex items-center justify-center">
                    <selectedType.icon className="w-5 h-5 text-hope" />
                  </div>
                  <span className="font-body text-sm font-semibold text-hope uppercase tracking-wider">
                    {selectedType.label}
                  </span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-navy mb-4">
                  {selectedType.description}
                </h2>
                <p className="font-body text-navy/60 leading-relaxed text-base">
                  {selectedType.about}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Form - Left */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="lg:col-span-3"
          >
            <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-navy mb-2">
                Send Us a Message
              </h2>
              <p className="font-body text-navy/50 mb-10">
                Fill out the form and we will respond as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-navy/70 mb-2">
                      Name <span className="text-hope">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent"
                    />
                  </div>
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
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-navy/70 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium text-navy/70 mb-2">
                      Inquiry Type
                    </label>
                    <select
                      name="inquiryType"
                      value={form.inquiryType}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-white appearance-none cursor-pointer"
                    >
                      {inquiryTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected type info card */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
                  <selectedType.icon className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-body text-sm font-medium text-navy">{selectedType.label}</p>
                    <p className="font-body text-xs text-navy/50 mt-0.5">{selectedType.description}</p>
                  </div>
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-navy/70 mb-2">
                    Message <span className="text-hope">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-hope to-hope-light hover:from-hope-light hover:to-hope text-white font-display font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </motion.div>
          </motion.div>

          {/* Sidebar - Right */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Social Links */}
            <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-sm p-8">
              <h3 className="font-display text-xl font-bold text-navy mb-6">Follow Us</h3>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/stepofhopefoundation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl bg-navy/5 hover:bg-hope/10 flex items-center justify-center text-navy/50 hover:text-hope transition-all duration-300"
                >
                  <FaInstagram size={20} />
                </a>
                <a
                  href="https://www.facebook.com/stepofhopefoundation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl bg-navy/5 hover:bg-hope/10 flex items-center justify-center text-navy/50 hover:text-hope transition-all duration-300"
                >
                  <FaFacebookF size={18} />
                </a>
                <a
                  href="https://www.tiktok.com/@stepofhopefoundation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl bg-navy/5 hover:bg-hope/10 flex items-center justify-center text-navy/50 hover:text-hope transition-all duration-300"
                >
                  <FaTiktok size={18} />
                </a>
              </div>
            </motion.div>

            {/* Contact Sections */}
            {contactSections.map((section, i) => (
              <motion.div
                key={section.title}
                variants={fadeUp}
                className="bg-white rounded-2xl shadow-sm p-8"
                style={{ transitionDelay: `${(i + 1) * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <section.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-bold text-navy mb-1">{section.title}</h4>
                    <p className="font-body text-navy/50 text-sm leading-relaxed">{section.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
