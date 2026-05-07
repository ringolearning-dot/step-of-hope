import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import Lottie from 'lottie-react'
import missionAnimation from '../assets/lottie/animation-ribbon-gold.json'

export default function Mission() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true })

  return (
    <section id="mission" className="bg-white py-24 px-4" ref={ref} aria-label="Our Mission and Vision">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Lottie Animation */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center"
          aria-hidden="true"
        >
          <div className="w-72 h-72">
            <Lottie animationData={missionAnimation} loop={true} />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div>
            <h2 className="font-display text-4xl font-semibold text-navy mb-4">Our Mission</h2>
            <p className="text-navy-soft leading-relaxed text-[15px]">
              To provide emotional, financial, and logistical support to children battling
              aggressive pediatric brain cancers like ATRT — starting with Serena's story
              and expanding to families across the world.
            </p>
          </div>

          <div className="w-16 h-0.5 bg-gold" aria-hidden="true" />

          <div>
            <h2 className="font-display text-4xl font-semibold text-navy mb-4">Our Vision</h2>
            <p className="text-navy-soft leading-relaxed text-[15px]">
              A world where no child fights cancer alone — and where every family feels
              empowered, supported, and loved through love, advocacy, and bold action.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
