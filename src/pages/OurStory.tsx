import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import api, { getImageUrl } from '../lib/api';
import useContent from '../lib/useContent';

/* ------------------------------------------------------------------ */
/*  SectionImage – loads a CMS-managed image or shows a placeholder   */
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

  useEffect(() => {
    api
      .get(`/images/${section}/${slot}`)
      .then((res) => setSrc(res.data.public_url || getImageUrl(res.data.filename)))
      .catch(() => {});
  }, [section, slot]);

  if (src)
    return <img src={src} alt={fallback} className={className} loading="lazy" />;

  return (
    <div
      className={`bg-gradient-to-br from-navy/10 to-hope/10 flex items-center justify-center text-navy/30 text-sm ${className}`}
    >
      {fallback}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated wrapper – fades / slides in when scrolled into view      */
/* ------------------------------------------------------------------ */
function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Story section data                                                */
/* ------------------------------------------------------------------ */
interface StorySection {
  id: number;
  title: string;
  body: string[];
  imageSlot: string;
  imageFallback: string;
}

const sections: StorySection[] = [
  {
    id: 1,
    title: 'A Peaceful Life',
    body: [
      'In the hills of Lebanon, the Karam family lived a quiet, beautiful life. Days were filled with family gatherings, warm kitchens, and the sound of laughter echoing through the house.',
      'Serena was a joyful little girl, full of light and wonder, with a smile that could brighten even the greyest of days. Her baby sister Celine was just nine months old\u2009\u2014\u2009the family felt complete, their dreams stretching out before them like an open road.',
      'Life was peaceful. Life was full of hope.',
    ],
    imageSlot: 'section1',
    imageFallback: 'The Karam family in Lebanon',
  },
  {
    id: 2,
    title: 'The Night Everything Changed',
    body: [
      'December\u00a030,\u00a02020. Serena woke in the middle of the night, vomiting and disoriented. Her parents rushed her to the emergency room, hearts pounding, praying it was something simple.',
      'The tests came back normal. The doctors sent them home, reassuring them it would pass. New Year\u2019s Eve arrived\u2009\u2014\u2009but Serena didn\u2019t improve.',
      'Something wasn\u2019t right. A mother knows.',
    ],
    imageSlot: 'section2',
    imageFallback: 'The night everything changed',
  },
  {
    id: 3,
    title: 'The Diagnosis',
    body: [
      'January\u00a01,\u00a02021. The first day of a new year\u2009\u2014\u2009and the day their world shattered. A brain MRI revealed what no parent should ever have to hear.',
      'A tumor, nearly the size of a golf ball, was blocking the flow of fluid in Serena\u2019s brain. The pressure was dangerously high. Every minute mattered.',
      'Everything happened so fast. One moment they were a family celebrating the new year; the next, they were fighting for their daughter\u2019s life.',
    ],
    imageSlot: 'section3',
    imageFallback: 'The diagnosis',
  },
  {
    id: 4,
    title: 'The Hard Truth',
    body: [
      'Emergency surgery was performed in Lebanon. The surgeons did what they could, but the pathology report delivered the hardest blow of all: Atypical Teratoid Rhabdoid Tumor\u2009\u2014\u2009ATRT.',
      'It is one of the most aggressive pediatric brain tumors known to medicine. Rare. Relentless. The odds were stacked impossibly high against a little girl who had done nothing but bring joy into the world.',
      'The family made the only decision they could. They would seek the best treatment available\u2009\u2014\u2009in the United States.',
    ],
    imageSlot: 'section4',
    imageFallback: 'The hard truth',
  },
  {
    id: 5,
    title: 'The Separation',
    body: [
      'Cynthia, Serena\u2019s mother, traveled to America carrying the weight of the world\u2009\u2014\u2009her sick daughter in one arm, baby Celine in the other, and a heart left behind in Lebanon with her husband.',
      'COVID restrictions and immigration barriers kept the family apart. Serena\u2019s father waited\u2009\u2014\u2009one month, then six, then a year. It would be a year and a half before he could hold his daughters again.',
      'Through it all, Cynthia\u2019s strength never wavered. Alone in a foreign country, she became Serena\u2019s world\u2009\u2014\u2009her nurse, her advocate, her safe place. An incredible mother whose love knew no limits.',
    ],
    imageSlot: 'section5',
    imageFallback: 'The separation',
  },
  {
    id: 6,
    title: 'One Hand. One Heart.',
    body: [
      'When the news broke, Cynthia\u2019s sister Rana said five words that changed everything: \u201cI will never leave you.\u201d',
      'Rana and her husband Habib left their entire lives behind\u2009\u2014\u2009their home, their jobs, their comfort\u2009\u2014\u2009and followed Cynthia to America. Habib became a second father to Serena, caring for her through the darkest days. She calls him one of her \u201ctwo dads.\u201d',
      'That kind of love doesn\u2019t just support a family. It transforms everyone it touches.',
    ],
    imageSlot: 'section6',
    imageFallback: 'One hand, one heart',
  },
  {
    id: 7,
    title: 'Why Step Of Hope Exists',
    body: [
      'Through Serena\u2019s journey\u2009\u2014\u2009the hospitals, the waiting rooms, the endless treatments\u2009\u2014\u2009the family met other families fighting the same impossible fight. They saw the fear in other parents\u2019 eyes, the courage in other children\u2019s smiles.',
      'Step Of Hope was born from that shared struggle. A foundation built not from theory, but from lived experience, from sleepless nights and whispered prayers, from the belief that no family should face this darkness alone.',
      'Serena continues fighting today. And through her fight, a mission took root: to bring hope, smiles, and joy to every child and family walking this road.',
    ],
    imageSlot: 'section7',
    imageFallback: 'Why Step Of Hope exists',
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function OurStory() {
  const c = useContent('story');

  const dynamicSections = sections.map((s) => {
    const num = s.imageSlot.replace('section', '');
    const titleKey = `section${num}_title`;
    const textKey = `section${num}_text`;
    return {
      ...s,
      title: c[titleKey] || s.title,
      body: c[textKey] ? c[textKey].split('\n').filter(Boolean) : s.body,
    };
  });

  return (
    <main className="overflow-hidden">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative bg-[#1B2A4A] py-32 md:py-44 flex items-center justify-center text-center px-6">
        {/* subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,144,26,0.12)_0%,_transparent_70%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 max-w-3xl"
        >
          <p className="font-display italic text-[#C9901A] text-3xl sm:text-4xl md:text-5xl leading-snug tracking-wide">
            &ldquo;{c.hero_quote || 'Never Lose Hope. Keep On Fighting.'}&rdquo;
          </p>
        </motion.div>
      </section>

      {/* ── STORY SECTIONS WITH TIMELINE ─────────────────────── */}
      <div className="relative">
        {/* vertical gold timeline line (desktop only) */}
        <div
          aria-hidden
          className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-[#C9901A]/0 via-[#C9901A]/40 to-[#C9901A]/0"
        />

        {dynamicSections.map((s, i) => {
          const isEven = i % 2 === 0; // even = image LEFT, text RIGHT
          const bgColor = i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]';

          return (
            <section key={s.id} className={`${bgColor} relative`}>
              {/* timeline dot */}
              <div
                aria-hidden
                className="hidden lg:flex absolute left-1/2 top-24 -translate-x-1/2 z-10 w-4 h-4 rounded-full bg-[#C9901A] ring-4 ring-white shadow-md"
              />

              <div className="mx-auto max-w-7xl px-6 sm:px-10 py-20 md:py-28 lg:py-32">
                <div
                  className={`flex flex-col ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } items-center gap-12 lg:gap-20`}
                >
                  {/* IMAGE */}
                  <FadeIn
                    className="w-full lg:w-1/2"
                    delay={0.1}
                  >
                    <SectionImage
                      section="story"
                      slot={s.imageSlot}
                      fallback={s.imageFallback}
                      className="w-full aspect-[4/3] object-cover rounded-2xl shadow-xl"
                    />
                  </FadeIn>

                  {/* TEXT */}
                  <FadeIn
                    className="w-full lg:w-1/2"
                    delay={0.3}
                  >
                    {/* section number accent */}
                    <span className="inline-block font-display text-[#F2C94C]/60 text-7xl md:text-8xl leading-none select-none -mb-4">
                      {String(s.id).padStart(2, '0')}
                    </span>

                    <h2 className="font-display text-[#1B2A4A] text-3xl sm:text-4xl md:text-5xl mb-6 leading-tight">
                      {s.title}
                    </h2>

                    <div className="space-y-4">
                      {s.body.map((para, pi) => (
                        <p
                          key={pi}
                          className="font-body text-[#2C3E6B] text-base sm:text-lg leading-relaxed"
                        >
                          {para}
                        </p>
                      ))}
                    </div>

                    {/* CTA on the last section */}
                    {s.id === 7 && (
                      <div className="mt-10">
                        <p className="font-display italic text-[#C9901A] text-xl sm:text-2xl mb-8">
                          &ldquo;Never Lose Hope. Keep On Fighting.&rdquo;
                        </p>
                        <Link
                          to="/donate"
                          className="inline-block bg-[#C9901A] hover:bg-[#F2C94C] text-white hover:text-[#1B2A4A] font-display text-lg px-10 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                        >
                          Help Us Bring Hope
                        </Link>
                      </div>
                    )}
                  </FadeIn>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── CLOSING BAND ──────────────────────────────────────── */}
      <section className="bg-[#1B2A4A] py-20 md:py-28 text-center px-6">
        <FadeIn>
          <p className="font-display italic text-[#C9901A] text-2xl sm:text-3xl md:text-4xl max-w-2xl mx-auto leading-snug">
            Every child deserves a chance.
            <br />
            Every family deserves hope.
          </p>
        </FadeIn>
      </section>
    </main>
  );
}
