import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import Lottie from 'lottie-react';
import {
  HiHeart,
  HiSparkles,
  HiUserGroup,
  HiGift,
  HiCake,
  HiStar,
  HiCamera,
  HiCalendarDays,
  HiHome,
  HiMegaphone,
  HiSun,
  HiShieldCheck,
} from 'react-icons/hi2';
import api, { getImageUrl } from '../lib/api';
import useContent from '../lib/useContent';
import handCombineAnim from '../assets/lottie/hand_combine_gold.json';
import chatPeopleAnim from '../assets/lottie/get-involved-chat-gold (1).json';

/* ------------------------------------------------------------------ */
/*  Reusable SectionImage – pulls admin-uploaded images or shows      */
/*  a placeholder gradient.                                           */
/* ------------------------------------------------------------------ */
function SectionImage({
  section,
  slot,
  fallback,
  className,
}: {
  section: string;
  slot: string;
  fallback: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  useEffect(() => {
    api
      .get(`/images/${section}/${slot}`)
      .then((res) => {
        setSrc(res.data.public_url || getImageUrl(res.data.filename));
        setMimeType(res.data.mime_type || null);
      })
      .catch(() => {});
  }, [section, slot]);

  if (src) {
    if (mimeType?.startsWith('video/')) {
      return (
        <video
          src={src}
          className={className}
          autoPlay
          loop
          muted
          playsInline
        />
      );
    }
    return <img src={src} alt={fallback} className={className} />;
  }
  return (
    <div
      className={`bg-gradient-to-br from-navy/10 to-hope/10 flex items-center justify-center text-navy/30 text-sm ${className}`}
    >
      {fallback}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                 */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */
const impactCards = [
  {
    icon: null as any,
    lottie: handCombineAnim,
    title: 'Hope',
    text: 'We bring emotional support and joyful experiences to children and families facing illness.',
    color: '',
  },
  {
    icon: HiSparkles,
    lottie: null as any,
    title: 'Smiles',
    text: 'From surprise gifts to unforgettable events, we create moments children will never forget.',
    color: 'text-hope',
  },
  {
    icon: HiUserGroup,
    lottie: null as any,
    title: 'Community',
    text: 'We stand hand in hand with families during their hardest moments.',
    color: 'text-navy',
  },
];

const programs = [
  {
    icon: HiHeart,
    title: 'Hospital Visits',
    desc: 'Bringing smiles, gifts, games, and companionship to children during hospital stays.',
    color: 'from-hope/10 to-hope-light/5',
    accent: 'text-hope',
    border: 'border-hope/20',
  },
  {
    icon: HiCake,
    title: 'Dream Birthdays',
    desc: 'Creating unforgettable birthday celebrations with decorations, entertainment, photobooths, cakes, and special surprises.',
    color: 'from-gold/10 to-gold-light/5',
    accent: 'text-gold',
    border: 'border-gold/20',
  },
  {
    icon: HiCalendarDays,
    title: 'Seasonal Events',
    desc: 'Christmas parties, Easter egg hunts, Welcome Summer, Welcome Fall, Halloween, Fourth of July, and other community celebrations.',
    color: 'from-hope/10 to-hope-light/5',
    accent: 'text-hope',
    border: 'border-hope/20',
  },
  {
    icon: HiGift,
    title: 'Hope Packages',
    desc: 'Comfort kits, toys, books, blankets, and care packages for children and families.',
    color: 'from-gold/10 to-gold-light/5',
    accent: 'text-gold',
    border: 'border-gold/20',
  },
  {
    icon: HiHome,
    title: 'Family Support',
    desc: 'Supporting parents and siblings through difficult medical journeys.',
    color: 'from-navy/10 to-navy/5',
    accent: 'text-navy',
    border: 'border-navy/20',
  },
  {
    icon: HiSun,
    title: 'Community Adventures',
    desc: 'Small hikes, walks, zoo trips, aquarium visits, and family outings that create lasting memories.',
    color: 'from-hope/10 to-hope-light/5',
    accent: 'text-hope',
    border: 'border-hope/20',
  },
  {
    icon: HiStar,
    title: 'Emergency Smiles Program',
    desc: 'Helping fulfill special wishes and creating meaningful moments for children facing serious illnesses.',
    color: 'from-gold/10 to-gold-light/5',
    accent: 'text-gold',
    border: 'border-gold/20',
  },
];

/* ================================================================== */
/*  HOME PAGE                                                         */
/* ================================================================== */
export default function Home() {
  const c = useContent('home');
  const ic = useContent('impact');

  return (
    <main className="overflow-hidden">
      {/* ============================================================ */}
      {/*  1. HERO                                                     */}
      {/* ============================================================ */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background — admin-uploaded image or placeholder */}
        <div className="absolute inset-0 z-0">
          <SectionImage
            section="home"
            slot="hero"
            fallback="Hero Background"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6"
          >
            {c.hero_title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="font-body text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            {c.hero_subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/donate"
              className="inline-block bg-gold hover:bg-gold-light text-white font-body font-semibold px-8 py-3.5 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Donate Now
            </Link>
            <Link
              to="/our-story"
              className="inline-block border-2 border-white text-white hover:bg-white/10 font-body font-semibold px-8 py-3.5 rounded-full text-lg transition-colors"
            >
              Read Serena's Story
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SLOGAN                                                       */}
      {/* ============================================================ */}
      <section className="bg-navy pt-6 pb-28">
        <div className="text-center px-6">
          <p className="font-display text-xl sm:text-2xl font-bold text-white tracking-wide">
            Never Lose Hope. Keep On Fighting.
          </p>
          <p className="font-body text-white/60 text-sm mt-1">
            Every Child Deserves a Reason to Smile.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  2. IMPACT CARDS                                             */}
      {/* ============================================================ */}
      <section className="relative z-20 -mt-24 pb-20">
        <AnimatedSection className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {impactCards.map((card) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow p-8 text-center group"
            >
              {card.lottie ? (
                <div className="w-14 h-14 mx-auto mb-4 group-hover:scale-110 transition-transform lottie-color-shuffle">
                  <Lottie animationData={card.lottie} loop />
                </div>
              ) : (
                <card.icon
                  className={`w-12 h-12 mx-auto mb-4 ${card.color} group-hover:scale-110 transition-transform`}
                />
              )}
              <h3 className="font-display text-2xl font-bold text-navy mb-3">
                {card.title}
              </h3>
              <p className="font-body text-navy/70 leading-relaxed">
                {card.text}
              </p>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* ============================================================ */}
      {/*  3. STORY PREVIEW                                            */}
      {/* ============================================================ */}
      <section className="bg-bg-warm py-20 md:py-28">
        <AnimatedSection className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div variants={fadeUp} className="order-2 md:order-1">
            <SectionImage
              section="home"
              slot="story-preview"
              fallback="Family Image"
              className="w-full h-80 md:h-[28rem] rounded-2xl object-cover shadow-lg"
            />
          </motion.div>

          {/* Text */}
          <motion.div variants={fadeUp} className="order-1 md:order-2">
            <span className="font-body text-hope font-semibold tracking-wider uppercase text-sm">
              Our Story
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-navy mt-2 mb-6 leading-tight">
              {c.story_heading}
            </h2>
            <p className="font-body text-navy/70 leading-relaxed mb-4">
              {c.story_text1}
            </p>
            <p className="font-body text-navy/70 leading-relaxed mb-8">
              {c.story_text2}
            </p>
            <Link
              to="/our-story"
              className="inline-block bg-navy hover:bg-navy-soft text-white font-body font-semibold px-7 py-3 rounded-full transition-colors shadow-md hover:shadow-lg"
            >
              Read Full Story
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ============================================================ */}
      {/*  4. WHAT WE DO                                                */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 bg-white">
        <AnimatedSection className="max-w-6xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-6">
            <span className="font-body text-hope font-semibold tracking-wider uppercase text-sm">
              Our Mission in Action
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-navy mt-2 leading-tight">
              What We Do
            </h2>
          </motion.div>
          <motion.p
            variants={fadeUp}
            className="font-body text-navy/60 text-lg text-center max-w-4xl mx-auto mb-16 leading-relaxed"
          >
            Through hospital visits, dream birthdays, seasonal events, hope packages, family support, and community activities, Step of Hope brings smiles, comfort, and hope to children facing difficult medical journeys.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <motion.div
                key={program.title}
                variants={fadeUp}
                className={`border ${program.border} rounded-2xl p-6 bg-gradient-to-br ${program.color} hover:shadow-lg transition-shadow group`}
              >
                <program.icon
                  className={`w-9 h-9 ${program.accent} mb-3 group-hover:scale-110 transition-transform`}
                />
                <h4 className="font-display text-lg font-bold text-navy mb-2">
                  {program.title}
                </h4>
                <p className="font-body text-navy/60 leading-relaxed text-sm">
                  {program.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ============================================================ */}
      {/*  IMPACT COUNTER                                               */}
      {/* ============================================================ */}
      <section className="bg-bg-warm py-20 md:py-28">
        <AnimatedSection className="max-w-5xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="font-body text-hope font-semibold tracking-wider uppercase text-sm">
              Our Impact
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-navy mt-2">
              Making a Difference
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: ic.stat1_value || '50+', label: ic.stat1_label || 'Children Supported' },
              { value: ic.stat2_value || '30+', label: ic.stat2_label || 'Hospital Visits' },
              { value: ic.stat3_value || '15+', label: ic.stat3_label || 'Birthdays Celebrated' },
              { value: ic.stat4_value || '500+', label: ic.stat4_label || 'Smiles Created' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="text-center"
              >
                <p className="font-display text-4xl sm:text-5xl font-bold text-hope mb-2">
                  {stat.value}
                </p>
                <p className="font-body text-navy/60 text-sm">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ============================================================ */}
      {/*  VOLUNTEER IMPACT                                             */}
      {/* ============================================================ */}
      <section className="bg-white py-20 md:py-28">
        <AnimatedSection className="max-w-6xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="font-body text-hope font-semibold tracking-wider uppercase text-sm">
              Get Involved
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-navy mt-2 mb-4">
              Volunteer With Us
            </h2>
            <p className="font-body text-navy/60 text-lg max-w-2xl mx-auto leading-relaxed">
              There are many ways to make a difference. Find a role that fits your skills and passion.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: HiHeart, title: 'Hospital Visitor', desc: 'Visit children in hospitals to bring joy, companionship, and hope during their treatment.' },
              { icon: HiCalendarDays, title: 'Event Volunteer', desc: 'Help organize and run seasonal events, community celebrations, and fundraisers.' },
              { icon: HiCake, title: 'Birthday Team', desc: 'Help create dream birthday celebrations for children facing illness.' },
              { icon: HiCamera, title: 'Photographer / Videographer', desc: 'Capture special moments at events, hospital visits, and celebrations.' },
              { icon: HiMegaphone, title: 'Fundraiser', desc: 'Help raise funds and awareness for Step of Hope programs and missions.' },
              { icon: HiShieldCheck, title: 'Corporate Sponsor', desc: 'Partner with Step of Hope to create lasting impact through corporate giving.' },
            ].map((role) => (
              <motion.div
                key={role.title}
                variants={fadeUp}
                className="bg-bg-warm rounded-2xl p-6 hover:shadow-lg transition-shadow group"
              >
                <role.icon className="w-9 h-9 text-hope mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-display text-lg font-bold text-navy mb-2">{role.title}</h4>
                <p className="font-body text-navy/60 leading-relaxed text-sm">{role.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div variants={fadeUp} className="text-center mt-10">
            <Link
              to="/volunteer"
              className="inline-block bg-hope hover:bg-hope-light text-white font-body font-semibold px-8 py-3.5 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Apply to Volunteer
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ============================================================ */}
      {/*  SPONSOR A PROGRAM                                            */}
      {/* ============================================================ */}
      <section className="bg-bg-warm py-20 md:py-28">
        <AnimatedSection className="max-w-5xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="font-body text-gold font-semibold tracking-wider uppercase text-sm">
              Sponsorship Opportunities
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-navy mt-2 mb-4">
              Sponsor a Program
            </h2>
            <p className="font-body text-navy/60 text-lg max-w-2xl mx-auto leading-relaxed">
              Your sponsorship directly funds the programs that bring hope and happiness to children and families.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Hope Package', amount: '$100', desc: 'Sponsor a comfort kit filled with toys, books, and blankets for a child.' },
              { title: 'Hospital Visit', amount: '$250', desc: 'Fund a complete hospital visit with gifts, games, and activities.' },
              { title: 'Dream Birthday', amount: '$500', desc: 'Give a child an unforgettable birthday celebration.' },
              { title: 'Seasonal Event', amount: 'Custom', desc: 'Sponsor a community event like Christmas parties or Easter egg hunts.' },
            ].map((tier) => (
              <motion.div
                key={tier.title}
                variants={fadeUp}
                className="bg-white rounded-2xl border border-navy/10 p-6 text-center hover:shadow-xl transition-shadow group"
              >
                <p className="font-display text-3xl font-bold text-gold mb-2">{tier.amount}</p>
                <h4 className="font-display text-lg font-bold text-navy mb-2">{tier.title}</h4>
                <p className="font-body text-navy/60 leading-relaxed text-sm mb-4">{tier.desc}</p>
                <Link
                  to="/donate"
                  className="inline-block bg-navy hover:bg-navy-soft text-white font-body font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
                >
                  Sponsor Now
                </Link>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ============================================================ */}
      {/*  Subtle motivational quote                                   */}
      {/* ============================================================ */}
      <section className="bg-bg-warm py-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="text-center px-6"
        >
          <div className="w-28 h-28 mx-auto mb-4 lottie-color-shuffle">
            <Lottie animationData={chatPeopleAnim} loop />
          </div>
          <p className="font-display text-2xl sm:text-3xl italic text-navy/40">
            "Never Lose Hope. Keep On Fighting."
          </p>
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/*  5. PHOTOBOOTH SECTION                                       */}
      {/* ============================================================ */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-navy via-navy-soft to-navy overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-hope/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-hope-light/10 rounded-full blur-3xl" />

        <AnimatedSection className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <motion.span
            variants={fadeUp}
            className="font-body text-hope-light font-semibold tracking-wider uppercase text-sm"
          >
            Photobooth &amp; 360 Booth Services
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-6 leading-tight"
          >
            {c.photobooth_heading}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-body text-white/80 text-lg leading-relaxed max-w-2xl mx-auto mb-10"
          >
            {c.photobooth_text}
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/events"
              className="inline-block bg-hope hover:bg-hope-light text-white font-body font-semibold px-8 py-3.5 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Book Services
            </Link>
            <Link
              to="/events"
              className="inline-block border-2 border-white/60 text-white hover:bg-white/10 font-body font-semibold px-8 py-3.5 rounded-full text-lg transition-colors"
            >
              Learn More
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ============================================================ */}
      {/*  6. YNO SECTION                                              */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 bg-white">
        <AnimatedSection className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp}>
            <SectionImage
              section="home"
              slot="yno-preview"
              fallback="YNO App Preview"
              className="w-full h-72 md:h-96 rounded-2xl object-cover shadow-lg"
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <span className="font-body text-hope font-semibold tracking-wider uppercase text-sm">
              YNO Platform
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-navy mt-2 mb-6 leading-tight">
              {c.yno_heading}
            </h2>
            <p className="font-body text-navy/70 leading-relaxed mb-8">
              {c.yno_text}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/yno"
                className="inline-block bg-navy hover:bg-navy-soft text-white font-body font-semibold px-7 py-3 rounded-full transition-colors shadow-md hover:shadow-lg"
              >
                Learn About YNO
              </Link>
              <Link
                to="/donate"
                className="inline-block border-2 border-navy text-navy hover:bg-navy/5 font-body font-semibold px-7 py-3 rounded-full transition-colors"
              >
                Support The Mission
              </Link>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ============================================================ */}
      {/*  7. FINAL CTA                                                */}
      {/* ============================================================ */}
      <section className="relative py-24 md:py-32">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <SectionImage
            section="home"
            slot="cta"
            fallback="CTA Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy/90 to-navy/70" />
        </div>

        <AnimatedSection className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <motion.h2
            variants={fadeUp}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6"
          >
            {c.cta_heading}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-body text-white/80 text-lg leading-relaxed max-w-2xl mx-auto mb-10"
          >
            {c.cta_text}
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/donate"
              className="inline-block bg-gold hover:bg-gold-light text-white font-body font-semibold px-8 py-3.5 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Donate Today
            </Link>
            <Link
              to="/volunteer"
              className="inline-block border-2 border-white/60 text-white hover:bg-white/10 font-body font-semibold px-8 py-3.5 rounded-full text-lg transition-colors"
            >
              Become A Volunteer
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>
    </main>
  );
}
