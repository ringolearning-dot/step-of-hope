import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
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

const stats = [
  { label: 'Families Supported', value: '150+' },
  { label: 'Events Organized', value: '45' },
  { label: 'Smiles Created', value: '1,200+' },
  { label: 'Volunteers', value: '300+' },
]

const galleryItems = [
  { slot: 'photo1', fallback: 'Children Smiling' },
  { slot: 'photo2', fallback: 'Events' },
  { slot: 'photo3', fallback: 'Gifts' },
  { slot: 'photo4', fallback: 'Hospital Visits' },
  { slot: 'photo5', fallback: 'Family Moments' },
  { slot: 'photo6', fallback: 'Community Support' },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Impact() {
  const c = useContent('impact')
  const { ref: heroRef, inView: heroInView } = useInView({ threshold: 0.2, triggerOnce: true })
  const { ref: textRef, inView: textInView } = useInView({ threshold: 0.2, triggerOnce: true })
  const { ref: galleryRef, inView: galleryInView } = useInView({ threshold: 0.1, triggerOnce: true })
  const { ref: statsRef, inView: statsInView } = useInView({ threshold: 0.2, triggerOnce: true })
  const { ref: ctaRef, inView: ctaInView } = useInView({ threshold: 0.2, triggerOnce: true })

  return (
    <main className="bg-bg-warm">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden py-28 md:py-40"
      >
        <div className="absolute inset-0 z-0">
          <SectionImage
            section="home"
            slot="hero"
            fallback="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/50 to-navy/70" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.span
            className="inline-block font-body text-hope-light font-semibold tracking-widest uppercase text-sm mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            Our Impact
          </motion.span>
          <motion.h1
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
          >
            {c.hero_title}
          </motion.h1>
        </div>
      </section>

      {/* ── Text Block ───────────────────────────────────────────── */}
      <section ref={textRef} className="px-4 py-20 md:py-28">
        <motion.div
          className="max-w-3xl mx-auto text-center space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={textInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
        >
          <p className="font-body text-navy-soft leading-relaxed text-base md:text-lg">
            At Step of Hope Foundation, we focus on creating moments that matter. From hospital
            visits filled with laughter to community events that bring families together, every
            initiative is designed to remind children and their loved ones that they are not alone.
          </p>
          <p className="font-body text-navy-soft leading-relaxed text-base md:text-lg">
            We believe that even the smallest gesture can spark an extraordinary amount of joy. A
            handmade card, a warm embrace, a room full of volunteers singing happy birthday — these
            are the moments that transform a difficult journey into one of shared love and courage.
          </p>
          <div className="pt-4">
            <motion.blockquote
              className="relative bg-white rounded-2xl px-8 py-10 shadow-[0_4px_30px_rgba(27,42,74,0.06)] max-w-2xl mx-auto"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={textInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease }}
            >
              <div className="absolute -top-4 left-8 text-hope text-6xl font-display leading-none select-none">
                &ldquo;
              </div>
              <p className="font-display text-navy text-xl md:text-2xl font-semibold leading-snug italic">
                Our goal is simple: To create more smiles, more hope, and more unforgettable
                memories.
              </p>
            </motion.blockquote>
          </div>
        </motion.div>
      </section>

      {/* ── Gallery ──────────────────────────────────────────────── */}
      <section ref={galleryRef} className="bg-white px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            animate={galleryInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy mb-4">
              {c.gallery_heading}
            </h2>
            <div className="w-20 h-1 bg-hope rounded-full mx-auto" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item, i) => (
              <motion.div
                key={item.slot}
                className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(27,42,74,0.06)] hover:shadow-[0_8px_40px_rgba(27,42,74,0.12)] transition-shadow duration-300"
                initial={{ opacity: 0, y: 40 }}
                animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.08 * i, ease }}
              >
                <SectionImage
                  section="impact"
                  slot={item.slot}
                  fallback={item.fallback}
                  className="w-full aspect-[4/3] object-cover"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section ref={statsRef} className="px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy mb-4">
              Impact by the Numbers
            </h2>
            <div className="w-20 h-1 bg-hope rounded-full mx-auto" />
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="bg-white rounded-2xl p-8 text-center shadow-[0_4px_30px_rgba(27,42,74,0.06)]"
                initial={{ opacity: 0, y: 30 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * i, ease }}
              >
                <span className="block font-display text-4xl md:text-5xl font-bold text-hope mb-2">
                  {stat.value}
                </span>
                <span className="font-body text-navy-soft text-sm">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section ref={ctaRef} className="bg-navy px-4 py-20 md:py-24">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-6">
            Help Us Create More Smiles
          </h2>
          <p className="font-body text-white/70 leading-relaxed mb-10 max-w-xl mx-auto">
            Every contribution, no matter the size, translates directly into moments of joy for a
            child and their family. Together, we can make a lasting impact.
          </p>
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 bg-gold text-white font-semibold px-10 py-4 rounded-full text-lg hover:bg-gold-light transition-all duration-200 hover:shadow-[0_0_24px_rgba(201,144,26,0.5)]"
          >
            Donate Now
          </Link>
        </motion.div>
      </section>
    </main>
  )
}
