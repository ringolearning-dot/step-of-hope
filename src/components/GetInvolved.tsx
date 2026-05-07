import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Lottie from 'lottie-react'
import involvedAnimation from '../assets/lottie/get-involved-chat-gold (1).json'

const items = [
  { label: 'Donate', detail: 'Every dollar provides urgent support to a child and their family.' },
  { label: 'Share', detail: 'Use your voice on social media to raise awareness and inspire action.' },
  { label: 'Volunteer', detail: 'Join us at events, help with outreach, or support a local family.' },
  { label: 'Give Joy', detail: 'Sponsor care packages, toys, or a celebration for a child in treatment.' },
]

export default function GetInvolved() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true })

  return (
    <section id="get-involved" className="bg-bg-lavender py-24 px-4" ref={ref} aria-label="Get Involved">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Lottie Animation */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:flex justify-center"
          aria-hidden="true"
        >
          <div className="w-80 h-80">
            <Lottie animationData={involvedAnimation} loop={true} />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div>
            <h2 className="font-display text-5xl font-semibold text-navy mb-3">Get Involved</h2>
            <p className="text-navy-soft text-[15px] leading-relaxed">
              Help us bring hope to the families who need it most. Here are meaningful ways
              you can make a difference today:
            </p>
          </div>

          <ul className="space-y-4" role="list">
            {items.map(({ label, detail }) => (
              <li key={label} className="flex gap-3 items-start">
                <CheckCircle2 size={20} className="text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-navy-soft text-[15px] leading-relaxed">
                  <strong className="text-navy font-semibold">{label}:</strong> {detail}
                </p>
              </li>
            ))}
          </ul>

          <p className="font-display italic text-gold text-lg">
            Together, we turn steps into support — and hope into healing.
          </p>

          <a
            href="#"
            className="inline-flex items-center gap-2 bg-gold text-white font-semibold px-8 py-3.5 rounded-full hover:bg-gold-light transition-all duration-200 hover:shadow-[0_0_24px_rgba(201,144,26,0.5)] focus-ring"
          >
            Donate Now <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
