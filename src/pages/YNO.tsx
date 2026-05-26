import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  HiCpuChip,
  HiMagnifyingGlass,
  HiUsers,
  HiSquares2X2,
} from 'react-icons/hi2'
import api, { getImageUrl } from '../lib/api'

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

const features = [
  {
    icon: HiCpuChip,
    title: 'AI-Powered Organization',
    description:
      'Smart algorithms automatically categorize and organize your life, so you can focus on what truly matters.',
  },
  {
    icon: HiMagnifyingGlass,
    title: 'Instant Search',
    description:
      'Find anything in seconds with lightning-fast, context-aware search that understands what you are looking for.',
  },
  {
    icon: HiUsers,
    title: 'Family Management',
    description:
      'Coordinate schedules, share lists, and keep the whole family connected and in sync effortlessly.',
  },
  {
    icon: HiSquares2X2,
    title: 'Smart Categories',
    description:
      'Intelligent tagging and grouping adapt to your habits, making everything intuitive and easy to find.',
  },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function YNO() {
  const { ref: heroRef, inView: heroInView } = useInView({ threshold: 0.2, triggerOnce: true })
  const { ref: aboutRef, inView: aboutInView } = useInView({ threshold: 0.2, triggerOnce: true })
  const { ref: featuresRef, inView: featuresInView } = useInView({ threshold: 0.1, triggerOnce: true })
  const { ref: impactRef, inView: impactInView } = useInView({ threshold: 0.2, triggerOnce: true })

  return (
    <main className="bg-bg-warm">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-soft to-navy py-28 md:py-40"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-hope blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-hope-light blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.span
            className="inline-block font-body text-hope-light font-semibold tracking-widest uppercase text-sm mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            Powered by Purpose
          </motion.span>
          <motion.h1
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
          >
            Technology<br className="hidden sm:block" /> With Purpose
          </motion.h1>
          <motion.p
            className="font-body text-lg md:text-xl text-white/70 mt-6 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease }}
          >
            YNO is more than an app — it is a platform built to simplify your life while supporting
            a cause that changes lives.
          </motion.p>
        </div>
      </section>

      {/* ── About + Phone Mockup ─────────────────────────────────── */}
      <section ref={aboutRef} className="px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* Phone Mockup */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, x: -40 }}
            animate={aboutInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            <div className="relative w-[280px] md:w-[300px]">
              {/* Phone frame */}
              <div className="relative bg-navy rounded-[3rem] p-3 shadow-[0_20px_60px_rgba(27,42,74,0.25)]">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-navy rounded-b-2xl z-10" />
                {/* Screen */}
                <div className="bg-gradient-to-br from-hope/20 via-bg-warm to-hope-light/20 rounded-[2.4rem] aspect-[9/19] flex items-center justify-center overflow-hidden">
                  <div className="text-center px-6">
                    <div className="w-16 h-16 bg-hope/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="font-display text-hope text-2xl font-bold">Y</span>
                    </div>
                    <p className="font-display text-navy font-semibold text-lg mb-1">YNO</p>
                    <p className="font-body text-navy-soft/60 text-xs">App Preview</p>
                  </div>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute -inset-8 bg-hope/10 rounded-full blur-3xl -z-10 pointer-events-none" />
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 40 }}
            animate={aboutInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy">
              What is YNO?
            </h2>
            <div className="w-16 h-0.5 bg-hope" />
            <p className="font-body text-navy-soft leading-relaxed text-[15px] md:text-base">
              YNO is an intelligent organization platform designed to help individuals and families
              manage their daily lives with ease. Powered by cutting-edge AI, YNO learns your
              preferences, anticipates your needs, and keeps everything — from grocery lists to
              family schedules — beautifully organized in one place.
            </p>
            <p className="font-body text-navy-soft/70 leading-relaxed text-[15px]">
              Built with the belief that technology should serve a greater purpose, YNO channels a
              portion of every subscription to directly fund Step of Hope Foundation programs,
              turning everyday convenience into lasting impact.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#"
                className="inline-flex items-center gap-2 bg-hope text-white font-semibold px-8 py-3.5 rounded-full hover:bg-hope-light transition-all duration-200 hover:shadow-[0_0_24px_rgba(91,141,190,0.5)]"
              >
                Download YNO
              </a>
              <Link
                to="/donate"
                className="inline-flex items-center gap-2 border-2 border-navy/20 text-navy font-semibold px-8 py-3.5 rounded-full hover:border-navy/40 transition-all duration-200"
              >
                Support The Mission
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section ref={featuresRef} className="bg-white px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy mb-4">
              Smart Features, Simple Living
            </h2>
            <div className="w-20 h-1 bg-hope rounded-full mx-auto mb-6" />
            <p className="font-body text-navy-soft max-w-2xl mx-auto leading-relaxed">
              YNO combines powerful AI with an intuitive interface to make organization effortless.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  className="flex gap-6 bg-bg-warm rounded-2xl p-8"
                  initial={{ opacity: 0, y: 40 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 * i, ease }}
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-hope/20 to-hope-light/20 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-hope" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-navy mb-2">
                      {feature.title}
                    </h3>
                    <p className="font-body text-navy-soft/80 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Impact Section ───────────────────────────────────────── */}
      <section ref={impactRef} className="px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="relative bg-navy rounded-3xl px-8 md:px-16 py-16 md:py-20 text-center overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={impactInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-hope/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-hope/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-hope/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <span className="font-display text-hope text-3xl font-bold">Y</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-6">
                Technology That Gives Back
              </h2>
              <p className="font-body text-white/80 leading-relaxed text-base md:text-lg max-w-2xl mx-auto mb-4">
                A portion of every YNO subscription directly supports Step of Hope Foundation,
                funding hospital visits, family events, and programs that bring joy to children
                facing serious illnesses.
              </p>
              <p className="font-body text-hope-light leading-relaxed max-w-xl mx-auto mb-10">
                When you choose YNO, you are not just organizing your life — you are helping a child
                smile.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 bg-hope text-white font-semibold px-8 py-3.5 rounded-full hover:bg-hope-light transition-all duration-200 hover:shadow-[0_0_24px_rgba(91,141,190,0.5)]"
                >
                  Download YNO
                </a>
                <Link
                  to="/donate"
                  className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-full hover:border-white/60 transition-all duration-200"
                >
                  Support The Mission
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
