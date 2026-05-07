import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import Lottie from 'lottie-react'
import serenaAnimation from '../assets/lottie/serena-ribbon.json'

export default function Story() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true })

  return (
    <section id="story" className="bg-bg-lavender py-24 px-4" ref={ref} aria-label="Serena's Story">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Lottie — slides in from left */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center order-2 md:order-1"
          aria-hidden="true"
        >
          <div className="w-72 h-72">
            <Lottie animationData={serenaAnimation} loop={true} />
          </div>
        </motion.div>

        {/* Text — slides in from right */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5 order-1 md:order-2"
        >
          <h2 className="font-display text-4xl font-semibold text-navy">Serena's Story</h2>
          <p className="text-navy-soft leading-relaxed text-[15px]">
            Serena was just a child when she was diagnosed with ATRT — a rare and aggressive
            brain cancer. Despite the overwhelming challenges, Serena faced every day with
            bravery and grace, inspiring everyone around her.
          </p>
          <p className="text-navy-soft leading-relaxed text-[15px]">
            Her journey is the heartbeat of this foundation. Through long treatments and
            hospital stays, Serena's spirit never gave up. Her legacy lives on as a reminder
            that every child deserves love, strength, and a team walking beside them.
          </p>
          <div className="w-16 h-0.5 bg-gold mt-2" aria-hidden="true" />
          <p className="font-display italic text-gold text-lg">
            "Every step taken in her name carries a family forward."
          </p>
        </motion.div>
      </div>
    </section>
  )
}
