import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Lottie from 'lottie-react'
import hopeRibbon from '../assets/lottie/hand_combine_gold.json'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center bg-bg-lavender overflow-hidden px-4 py-24"
      aria-label="Hero"
    >
      {/* Background SVG watermark ribbon */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none select-none"
        viewBox="0 0 800 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path d="M400 100C250 100 150 220 150 350c0 90 50 170 130 220l120 130 120-130c80-50 130-130 130-220 0-130-100-250-250-250z" fill="#C9901A"/>
        <path d="M400 150C270 150 180 255 180 350c0 75 42 142 108 184l112 120 112-120C578 492 620 425 620 350c0-95-90-200-220-200z" fill="#C9901A"/>
      </svg>

      {/* Hero Card */}
      <motion.div
        className="relative z-10 bg-white rounded-[2rem] shadow-[0_8px_60px_rgba(27,42,74,0.10)] max-w-2xl w-full mx-auto px-10 py-14 flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Lottie Ribbon Animation */}
        <motion.div
          className="mb-2 w-32 h-32"
          aria-hidden="true"
        >
          <Lottie animationData={hopeRibbon} loop={true} />
        </motion.div>

        <motion.h1
          className="font-display text-[clamp(2.2rem,6vw,4rem)] font-semibold text-gold leading-tight mb-5"
          {...fadeUp(0.15)}
        >
          Step by step,<br />we bring hope.
        </motion.h1>

        <motion.p
          className="text-navy-soft text-base leading-relaxed max-w-lg mb-8"
          {...fadeUp(0.3)}
        >
          Welcome to the Step of Hope Foundation — a growing mission to support children
          battling aggressive brain cancer and their families. Inspired by Serena's courage,
          we are building a community rooted in love, compassion, and action, so that no
          family ever walks this road alone.
        </motion.p>

        <motion.a
          href="#get-involved"
          className="inline-flex items-center gap-2 bg-gold text-white font-semibold px-8 py-3.5 rounded-full hover:bg-gold-light transition-all duration-200 hover:shadow-[0_0_24px_rgba(201,144,26,0.5)] focus-ring"
          {...fadeUp(0.45)}
        >
          Get Involved <ArrowRight size={18} />
        </motion.a>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gold opacity-60"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <ChevronDown size={28} />
      </motion.div>
    </section>
  )
}
