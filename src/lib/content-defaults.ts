/** Default text content for every editable field on the site.
 *  Admin sees these as starting values; public pages fall back to them
 *  when no override exists in the database. */

const DEFAULTS: Record<string, Record<string, string>> = {
  home: {
    hero_title: 'Every Child Deserves A Reason To Smile',
    hero_subtitle:
      "Step of Hope Foundation brings hope, joy, emotional support, and unforgettable moments to children and families facing illness and difficult medical journeys. Born from one family's fight, our mission is to remind every child they are never alone.",
    story_heading: 'The Journey That Started Step Of Hope',
    story_text1:
      "Step of Hope was born from the courageous journey of Serena Karam, a brave little girl whose fight against illness inspired an entire community. Through her story, the Karam family witnessed first-hand the power of hope, compassion, and small acts of kindness during the most difficult moments life can bring.",
    story_text2:
      'Determined to turn their experience into something meaningful, they founded Step of Hope Foundation — so that no child or family would ever have to walk that road alone.',
    photobooth_heading: 'Your Smile Can Create Another Smile',
    photobooth_text:
      "Book our professional photobooth and 360 booth for your next event. Every booking directly supports our mission — turning moments of fun into moments of hope for children and families who need it most. Capture memories while making a difference.",
    yno_heading: 'Organize Your Life. Help A Child Smile.',
    yno_text:
      "YNO is our innovative organizational platform designed to simplify your daily life. Every subscription and interaction on YNO directly supports the Step of Hope Foundation's programs — so while you plan, organize, and stay on top of your tasks, you're also giving hope to a child in need.",
    cta_heading:
      "Born From One Family's Fight. Built To Bring Hope To Many Others.",
    cta_text:
      'Whether you donate, volunteer, or simply share our story — you become part of a movement that turns pain into purpose and hardship into hope. Together, we can make sure no child faces their fight alone.',
  },
  story: {
    hero_quote: 'Never Lose Hope. Keep On Fighting.',
    section1_title: 'A Peaceful Life',
    section1_text:
      "In the hills of Lebanon, the Karam family lived a quiet, beautiful life. Days were filled with family gatherings, warm kitchens, and the sound of laughter echoing through the house.\n\nSerena was a joyful little girl, full of light and wonder, with a smile that could brighten even the greyest of days. Her baby sister Celine was just nine months old\u2009\u2014\u2009the family felt complete, their dreams stretching out before them like an open road.\n\nLife was peaceful. Life was full of hope.",
    section2_title: 'The Night Everything Changed',
    section2_text:
      "December\u00a030,\u00a02020. Serena woke in the middle of the night, vomiting and disoriented. Her parents rushed her to the emergency room, hearts pounding, praying it was something simple.\n\nThe tests came back normal. The doctors sent them home, reassuring them it would pass. New Year\u2019s Eve arrived\u2009\u2014\u2009but Serena didn\u2019t improve.\n\nSomething wasn\u2019t right. A mother knows.",
    section3_title: 'The Diagnosis',
    section3_text:
      "January\u00a01,\u00a02021. The first day of a new year\u2009\u2014\u2009and the day their world shattered. A brain MRI revealed what no parent should ever have to hear.\n\nA tumor, nearly the size of a golf ball, was blocking the flow of fluid in Serena\u2019s brain. The pressure was dangerously high. Every minute mattered.\n\nEverything happened so fast. One moment they were a family celebrating the new year; the next, they were fighting for their daughter\u2019s life.",
    section4_title: 'The Hard Truth',
    section4_text:
      "Emergency surgery was performed in Lebanon. The surgeons did what they could, but the pathology report delivered the hardest blow of all: Atypical Teratoid Rhabdoid Tumor\u2009\u2014\u2009ATRT.\n\nIt is one of the most aggressive pediatric brain tumors known to medicine. Rare. Relentless. The odds were stacked impossibly high against a little girl who had done nothing but bring joy into the world.\n\nThe family made the only decision they could. They would seek the best treatment available\u2009\u2014\u2009in the United States.",
    section5_title: 'The Separation',
    section5_text:
      "Cynthia, Serena\u2019s mother, traveled to America carrying the weight of the world\u2009\u2014\u2009her sick daughter in one arm, baby Celine in the other, and a heart left behind in Lebanon with her husband.\n\nCOVID restrictions and immigration barriers kept the family apart. Serena\u2019s father waited\u2009\u2014\u2009one month, then six, then a year. It would be a year and a half before he could hold his daughters again.\n\nThrough it all, Cynthia\u2019s strength never wavered. Alone in a foreign country, she became Serena\u2019s world\u2009\u2014\u2009her nurse, her advocate, her safe place. An incredible mother whose love knew no limits.",
    section6_title: 'One Hand. One Heart.',
    section6_text:
      "When the news broke, Cynthia\u2019s sister Rana said five words that changed everything: \u201cI will never leave you.\u201d\n\nRana and her husband Habib left their entire lives behind\u2009\u2014\u2009their home, their jobs, their comfort\u2009\u2014\u2009and followed Cynthia to America. Habib became a second father to Serena, caring for her through the darkest days. She calls him one of her \u201ctwo dads.\u201d\n\nThat kind of love doesn\u2019t just support a family. It transforms everyone it touches.",
    section7_title: 'Why Step Of Hope Exists',
    section7_text:
      "Through Serena\u2019s journey\u2009\u2014\u2009the hospitals, the waiting rooms, the endless treatments\u2009\u2014\u2009the family met other families fighting the same impossible fight. They saw the fear in other parents\u2019 eyes, the courage in other children\u2019s smiles.\n\nStep Of Hope was born from that shared struggle. A foundation built not from theory, but from lived experience, from sleepless nights and whispered prayers, from the belief that no family should face this darkness alone.\n\nSerena continues fighting today. And through her fight, a mission took root: to bring hope, smiles, and joy to every child and family walking this road.",
  },
  mission: {
    hero_title: 'Our Mission & Vision',
    hero_subtitle:
      'Guided by compassion, driven by purpose — everything we do is rooted in the belief that no child should face illness alone.',
    mission_title: 'Our Mission',
    mission_text:
      "To bring joy, emotional support, hope, and meaningful experiences to children and families facing serious illnesses and difficult medical journeys.\n\nWe believe that every child deserves to feel the warmth of compassion and the power of community, especially during life's most challenging chapters. Through dedicated programs and heartfelt outreach, we aim to lighten the burden and brighten the days of those who need it most.",
    vision_title: 'Our Vision',
    vision_text:
      'A world where every child fighting illness feels loved, supported, remembered, and never alone.\n\nWe envision a future where compassion knows no boundaries, where communities rally around families in need, and where every child\'s spirit is nurtured with love and encouragement regardless of the obstacles they face.',
  },
  impact: {
    hero_title: 'Our Impact',
    hero_subtitle:
      'Every smile tells a story. See the moments that remind us why we do what we do.',
    gallery_heading: 'Moments of Hope',
  },
  events: {
    hero_title: 'Events & Services',
    hero_subtitle:
      'Book our professional services for your next event. Every booking directly supports our mission.',
    photobooth_title: 'Photo Booth',
    photobooth_text:
      'Our premium photo booth captures unforgettable moments with fun props, instant prints, and digital sharing. Perfect for weddings, birthdays, and corporate events.',
    '360booth_title': '360 Booth',
    '360booth_text':
      'Step onto our 360 platform and let the camera spin around you, creating stunning slow-motion videos. A showstopper at any event.',
    photography_title: 'Photography',
    photography_text:
      'Professional photography services to capture every meaningful moment of your event with artistry and care.',
  },
  donate: {
    hero_title: 'Make A Difference Today',
    hero_subtitle:
      'Your generosity brings hope, joy, and unforgettable moments to children and families facing illness.',
  },
};

export default DEFAULTS;
