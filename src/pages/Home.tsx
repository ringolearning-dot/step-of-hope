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
  HiUsers,
  HiCamera,
  HiCalendarDays,
  HiAcademicCap,
  HiHome,
  HiTrophy,
  HiBanknotes,
  HiHandRaised,
  HiMegaphone,
  HiMusicalNote,
  HiSun,
  HiShieldCheck,
  HiFire,
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

const pillars = [
  {
    emoji: '😊',
    title: 'Creating Smiles',
    color: 'from-hope/10 to-hope-light/5',
    accent: 'text-hope',
    border: 'border-hope/20',
    tagline:
      'We bring light to children facing serious illnesses through hospital visits, surprise gifts, and moments of pure joy.',
    programs: [
      {
        icon: HiHeart,
        title: 'Hospital Visits & Smile Missions',
        desc: 'We visit children in hospitals and treatment centers to bring joy, encouragement, and hope through gifts, activities, games, and personal interactions.',
      },
      {
        icon: HiGift,
        title: 'Hope Packages & Gifts',
        desc: 'Care packages filled with toys, books, crafts, blankets, and comfort items for children undergoing treatment or long hospital stays.',
      },
      {
        icon: HiCamera,
        title: 'A Smile for a Smile',
        desc: 'Children receive a free photo booth session and keepsake photos during hospital visits and events.',
      },
      {
        icon: HiAcademicCap,
        title: 'Back-to-School Smiles',
        desc: 'Backpacks, school supplies, and encouragement for children returning to school after treatment.',
      },
    ],
  },
  {
    emoji: '🎉',
    title: 'Creating Memories',
    color: 'from-gold/10 to-gold-light/5',
    accent: 'text-gold',
    border: 'border-gold/20',
    tagline:
      'Every child deserves magical moments. We create unforgettable celebrations, outings, and experiences for children and families.',
    programs: [
      {
        icon: HiCake,
        title: 'Dream Birthday Program',
        desc: 'Unforgettable birthday celebrations with decorations, entertainment, animators, photography, cakes, personalized gifts, and themed celebrations based on each child\u2019s dreams.',
      },
      {
        icon: HiCalendarDays,
        title: 'Holiday & Seasonal Celebrations',
        desc: 'Year-round events including Christmas, Easter egg hunts, Halloween costume events, Thanksgiving gatherings, Welcome Summer parties, and more.',
      },
      {
        icon: HiSun,
        title: 'Family Fun Days',
        desc: 'Uplifting activities for the whole family \u2014 nature walks, picnics, movie nights, arts & crafts, zoo visits, and community outings.',
      },
      {
        icon: HiStar,
        title: 'Wishes Come True',
        desc: 'Small wish-granting program where children can request something special \u2014 meeting a firefighter, visiting a police station, going to a baseball game, or having a superhero-themed day.',
      },
    ],
  },
  {
    emoji: '❤️',
    title: 'Creating Hope',
    color: 'from-navy/10 to-navy/5',
    accent: 'text-navy',
    border: 'border-navy/20',
    tagline:
      'We stand alongside families during their hardest moments \u2014 providing financial assistance, building community, and fundraising for the future.',
    programs: [
      {
        icon: HiBanknotes,
        title: 'Financial Assistance',
        desc: 'Helping families facing financial hardships with transportation expenses, medical-related needs, essential support services, and emergency assistance.',
      },
      {
        icon: HiUsers,
        title: 'Serena\u2019s Support Circle',
        desc: 'A support program connecting families facing similar challenges, allowing them to share experiences, resources, and encouragement.',
      },
      {
        icon: HiMegaphone,
        title: 'Community Events & Fundraisers',
        desc: 'Community events that raise awareness and funds so we can continue supporting children and families. Every dollar brings more smiles and hope.',
      },
      {
        icon: HiHandRaised,
        title: 'Hope Heroes',
        desc: 'Volunteer program where community members can sponsor a child, donate gifts, or participate in events.',
      },
      {
        icon: HiGift,
        title: 'Holiday Toy Drive',
        desc: 'Annual toy collection and distribution for children spending holidays in hospitals or recovering at home.',
      },
      {
        icon: HiFire,
        title: 'Longest Walk for Hope',
        desc: 'Awareness and fundraising walks that bring communities together while supporting children battling serious illnesses.',
      },
    ],
  },
];

/* ================================================================== */
/*  HOME PAGE                                                         */
/* ================================================================== */
export default function Home() {
  const c = useContent('home');

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
      {/*  4. WHAT WE DO — THREE PILLARS                               */}
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
            className="font-body text-navy/60 text-lg text-center max-w-3xl mx-auto mb-16 leading-relaxed"
          >
            Everything we do is built around three promises to the children and
            families we serve — to create smiles, memories, and lasting hope.
          </motion.p>

          <div className="space-y-16">
            {pillars.map((pillar) => (
              <motion.div key={pillar.title} variants={fadeUp}>
                {/* Pillar header */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-4xl">{pillar.emoji}</span>
                  <h3
                    className={`font-display text-2xl sm:text-3xl font-bold ${pillar.accent}`}
                  >
                    {pillar.title}
                  </h3>
                </div>
                <p className="font-body text-navy/60 leading-relaxed mb-8 max-w-3xl">
                  {pillar.tagline}
                </p>

                {/* Program cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pillar.programs.map((program) => (
                    <div
                      key={program.title}
                      className={`border ${pillar.border} rounded-2xl p-6 bg-gradient-to-br ${pillar.color} hover:shadow-lg transition-shadow group`}
                    >
                      <program.icon
                        className={`w-9 h-9 ${pillar.accent} mb-3 group-hover:scale-110 transition-transform`}
                      />
                      <h4 className="font-display text-lg font-bold text-navy mb-2">
                        {program.title}
                      </h4>
                      <p className="font-body text-navy/60 leading-relaxed text-sm">
                        {program.desc}
                      </p>
                    </div>
                  ))}
                </div>
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
