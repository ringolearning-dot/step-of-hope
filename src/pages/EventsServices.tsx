import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../lib/api';
import useContent from '../lib/useContent';

function SectionImage({ section, slot, fallback, className }: { section: string; slot: string; fallback: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => { api.get(`/images/${section}/${slot}`).then(res => setSrc(res.data.public_url || getImageUrl(res.data.filename))).catch(() => {}); }, [section, slot]);
  if (src) return <img src={src} alt={fallback} className={className} />;
  return <div className={`bg-gradient-to-br from-navy/10 to-hope/10 flex items-center justify-center text-navy/30 text-sm ${className}`}>{fallback}</div>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' } }),
};

const services = [
  {
    title: 'Photobooth',
    slot: 'photobooth',
    description: 'Classic and modern photobooth setups with custom backdrops, props, and instant prints that make every event unforgettable.',
    reserveLink: '/reserve/photobooth',
  },
  {
    title: '360 Video Booth',
    slot: '360booth',
    description: 'An immersive slow-motion 360-degree video experience that captures every angle and creates share-worthy content.',
    reserveLink: '/reserve/360booth',
  },
  {
    title: 'Event Photography',
    slot: 'photography',
    description: 'Professional event photography that tells the story of your celebration with candid and posed shots alike.',
    reserveLink: null,
  },
];

const galleryItems = [
  { slot: 'gallery1', label: 'Weddings' },
  { slot: 'gallery2', label: 'Birthdays' },
  { slot: 'gallery3', label: 'School Events' },
  { slot: 'gallery4', label: 'Corporate Events' },
  { slot: 'gallery5', label: "Children's Parties" },
];

export default function EventsServices() {
  const c = useContent('events');

  const dynamicServices = services.map((s) => ({
    ...s,
    title: c[`${s.slot === '360booth' ? '360booth' : s.slot}_title`] || s.title,
    description: c[`${s.slot === '360booth' ? '360booth' : s.slot}_text`] || s.description,
  }));

  return (
    <div className="bg-bg-warm min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-soft to-navy py-28 md:py-40">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-hope blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-hope-light blur-[100px]" />
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

      {/* Services */}
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
            Our Services
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="font-body text-navy/60 mt-4 max-w-2xl mx-auto text-lg"
          >
            Premium event experiences designed to capture memories and spread smiles.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {dynamicServices.map((service, i) => (
            <motion.div
              key={service.slot}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-30px' }}
              variants={fadeUp}
              custom={i}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500"
            >
              <SectionImage
                section="events"
                slot={service.slot}
                fallback={service.title}
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-8">
                <h3 className="font-display text-xl font-bold text-navy mb-3">{service.title}</h3>
                <p className="font-body text-navy/60 leading-relaxed mb-4">{service.description}</p>
                {service.reserveLink && (
                  <Link
                    to={service.reserveLink}
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-navy text-white font-display font-semibold text-sm rounded-lg hover:bg-navy-soft transition-colors duration-300"
                  >
                    Reserve Now
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
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
              Event Gallery
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="font-body text-navy/60 mt-4 max-w-2xl mx-auto text-lg"
            >
              A glimpse into the celebrations we have been a part of.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {galleryItems.map((item, i) => (
              <motion.div
                key={item.slot}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                variants={fadeUp}
                custom={i}
                className="relative group rounded-xl overflow-hidden aspect-[4/5]"
              >
                <SectionImage
                  section="events"
                  slot={item.slot}
                  fallback={item.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <span className="font-display text-white text-sm font-semibold">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="bg-gradient-to-br from-navy via-navy-soft to-navy rounded-3xl p-10 md:p-16 text-center"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display text-3xl md:text-5xl font-bold text-white"
            >
              Book Your Event
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="font-body text-white/70 mt-6 text-lg max-w-2xl mx-auto leading-relaxed"
            >
              A portion of every booking helps support children and families facing illness. When you
              celebrate with us, you are spreading hope.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
            >
              <Link
                to="/reserve/photobooth"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white text-navy font-display font-semibold rounded-xl hover:bg-white/90 transition-colors duration-300 shadow-lg"
              >
                Reserve Photobooth
              </Link>
              <Link
                to="/reserve/360booth"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-display font-semibold rounded-xl border-2 border-white hover:bg-white hover:text-navy transition-colors duration-300"
              >
                Reserve 360 Booth
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-display font-semibold rounded-xl border-2 border-white/50 hover:bg-white hover:text-navy transition-colors duration-300"
              >
                Contact Us
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
