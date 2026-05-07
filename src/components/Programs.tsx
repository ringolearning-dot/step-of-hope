import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { Heart, DollarSign, Gift } from 'lucide-react'

const programs = [
  {
    Icon: Heart,
    title: "Serena's Support Circle",
    description:
      "A community offering emotional and financial support for children and families facing brain cancer — including care packages, hospital visits, one-on-one outreach, and direct aid during treatment.",
  },
  {
    Icon: DollarSign,
    title: 'Hope in Every Step Fund',
    description:
      "A dedicated assistance fund covering travel, lodging, medical costs, and basic needs for families going through cancer treatment — because healing should never come with debt.",
  },
  {
    Icon: Gift,
    title: 'Smiles Across the World',
    description:
      "A joy-giving program delivering surprise gifts, birthdays, celebrations, and laughter to children in hospitals — turning pain into play, and fear into comfort.",
  },
]

export default function Programs() {
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true })

  return (
    <section id="programs" className="bg-white py-24 px-4" ref={ref} aria-label="Our Programs">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-5xl font-semibold text-navy mb-3">Our Programs</h2>
          <div className="w-16 h-0.5 bg-gold mx-auto" aria-hidden="true" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {programs.map(({ Icon, title, description }, i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * (i + 1) }}
              className="group bg-card-peach rounded-3xl p-8 border-2 border-transparent hover:border-gold hover:shadow-[0_8px_30px_rgba(201,144,26,0.15)] hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              <div className="mb-5 inline-flex p-3 bg-gold/10 rounded-2xl">
                <Icon size={26} className="text-gold" aria-hidden="true" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-navy mb-3">{title}</h3>
              <p className="text-navy-soft text-sm leading-relaxed">{description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
