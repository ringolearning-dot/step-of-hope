import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { HiSparkles, HiHeart, HiUserGroup, HiStar, HiHome, HiSun } from 'react-icons/hi2'
import api, { getImageUrl } from '../lib/api'
import useContent from '../lib/useContent'

/* ------------------------------------------------------------------ */
/*  SectionImage                                                       */
/* ------------------------------------------------------------------ */
function SectionImage({
  section,
  slot,
  fallback,
  className,
}: {
  section: string
  slot: string
  fallback: string
  className?: string
}) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    api
      .get(`/images/${section}/${slot}`)
      .then((res) => setSrc(res.data.public_url || getImageUrl(res.data.filename)))
      .catch(() => {})
  }, [section, slot])

  if (src) return <img src={src} alt={fallback} className={className} />
  return (
    <div
      className={`bg-gradient-to-br from-navy/10 to-hope/10 flex items-center justify-center text-navy/30 text-sm ${className}`}
    >
      {fallback}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const ease = [0.22, 1, 0.36, 1]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease },
})

const values = [
  {
    icon: HiSparkles,
    title: 'Hope',
    description:
      'We believe that hope is a powerful force. Even in the darkest moments, a spark of hope can illuminate the path forward for a child and their family.',
    color: 'from-hope/20 to-hope-light/20',
  },
  {
    icon: HiHeart,
    title: 'Compassion',
    description:
      'Every action we take is rooted in deep empathy. We walk alongside families, meeting them with kindness, understanding, and unconditional support.',
    color: 'from-rose-100 to-pink-50',
  },
  {
    icon: HiUserGroup,
    title: 'Community',
    description:
      'No family should face hardship alone. We foster a network of volunteers, donors, and supporters who come together to lift one another up.',
    color: 'from-blue-100 to-indigo-50',
  },
  {
    icon: HiStar,
    title: 'Joy',
    description:
      'We create moments of genuine happiness — laughter, play, and celebration — because every child deserves to simply be a child, no matter their diagnosis.',
    color: 'from-amber-100 to-yellow-50',
  },
  {
    icon: HiHome,
    title: 'Family',
    description:
      'Families are the heart of everything we do. We support not just the child, but every parent, sibling, and loved one walking this journey together.',
    color: 'from-emerald-100 to-green-50',
  },
  {
    icon: HiSun,
    title: 'Faith',
    description:
      'We hold an unwavering belief in brighter tomorrows. Faith guides our mission and reminds us that love and perseverance can move mountains.',
    color: 'from-orange-100 to-amber-50',
  },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MissionPage() {
  const c = useContent('mission')
  const { ref: heroRef, inView: heroInView } = useInView({ threshold: 0.2, triggerOnce: true })
  const { ref: missionRef, inView: missionInView } = useInView({ threshold: 0.2, triggerOnce: true })
  const { ref: visionRef, inView: visionInView } = useInView({ threshold: 0.2, triggerOnce: true })
  const { ref: valuesRef, inView: valuesInView } = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <main className="bg-bg-warm">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[60vh] flex items-center justify-center overflow-hidden px-4 py-32"
      >
        {/* Decorative background circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-hope/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-navy/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="relative z-10 text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease }}
        >
          <span className="inline-block font-body text-hope font-semibold tracking-widest uppercase text-sm mb-4">
            Step of Hope Foundation
          </span>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-navy leading-tight mb-6">
            {c.hero_title}
          </h1>
          <div className="w-20 h-1 bg-hope rounded-full mx-auto" />
        </motion.div>
      </section>

      {/* ── Mission Statement ────────────────────────────────────── */}
      <section ref={missionRef} className="px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={missionInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            <SectionImage
              section="mission"
              slot="hero"
              fallback="Our Mission"
              className="w-full aspect-[4/3] rounded-2xl object-cover"
            />
          </motion.div>

          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 40 }}
            animate={missionInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy">
              {c.mission_title}
            </h2>
            <div className="w-16 h-0.5 bg-hope" />
            {(c.mission_text || '').split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className={`font-body leading-relaxed text-[15px] ${i === 0 ? 'text-navy-soft md:text-base' : 'text-navy-soft/70'}`}>
                {para}
              </p>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Vision ───────────────────────────────────────────────── */}
      <section ref={visionRef} className="bg-white px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            className="space-y-6 order-2 md:order-1"
            initial={{ opacity: 0, x: -40 }}
            animate={visionInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy">
              {c.vision_title}
            </h2>
            <div className="w-16 h-0.5 bg-hope" />
            {(c.vision_text || '').split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className={`font-body leading-relaxed text-[15px] ${i === 0 ? 'text-navy-soft md:text-base' : 'text-navy-soft/70'}`}>
                {para}
              </p>
            ))}
          </motion.div>

          <motion.div
            className="order-1 md:order-2"
            initial={{ opacity: 0, x: 40 }}
            animate={visionInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease }}
          >
            <SectionImage
              section="mission"
              slot="vision"
              fallback="Our Vision"
              className="w-full aspect-[4/3] rounded-2xl object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────── */}
      <section ref={valuesRef} className="px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={valuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy mb-4">
              Our Core Values
            </h2>
            <div className="w-20 h-1 bg-hope rounded-full mx-auto mb-6" />
            <p className="font-body text-navy-soft max-w-2xl mx-auto leading-relaxed">
              These guiding principles shape every program, every visit, and every smile we create.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, i) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={value.title}
                  className="bg-white rounded-2xl p-8 shadow-[0_4px_30px_rgba(27,42,74,0.06)] hover:shadow-[0_8px_40px_rgba(27,42,74,0.12)] transition-shadow duration-300"
                  initial={{ opacity: 0, y: 40 }}
                  animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 * i, ease }}
                >
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-5`}
                  >
                    <Icon className="w-7 h-7 text-hope" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-navy mb-3">
                    {value.title}
                  </h3>
                  <p className="font-body text-navy-soft/80 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-navy px-4 py-20 md:py-24">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          {...fadeUp()}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-6">
            Join Us in Making a Difference
          </h2>
          <p className="font-body text-white/70 leading-relaxed mb-10 max-w-xl mx-auto">
            Whether you volunteer, donate, or simply share our story, every action creates a ripple
            of hope for a child in need.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/donate"
              className="inline-flex items-center gap-2 bg-gold text-white font-semibold px-8 py-3.5 rounded-full hover:bg-gold-light transition-all duration-200 hover:shadow-[0_0_24px_rgba(201,144,26,0.5)]"
            >
              Donate Now
            </Link>
            <Link
              to="/get-involved"
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-full hover:border-white/60 transition-all duration-200"
            >
              Get Involved
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
