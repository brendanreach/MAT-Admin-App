export const guideRuleVersion = {
  label: 'USA Taekwondo rules, 2026',
  verified: 'September 2026',
  note:
    'Rules change. Always check the tournament information packet and its designated forms before competing.',
}

// Registration steps grouped into phases. Keep each step to one or two short sentences.
export const registrationPhases = [
  {
    id: 'before',
    title: 'Before you register',
    steps: [
      {
        title: 'Check the tournament type',
        text: 'Open the tournament on the MAT Tournaments page. USA Taekwondo sanctioned events register through Sport:80; other events use their own link.',
      },
      {
        title: 'Create or log in to Sport:80',
        text: 'The athlete or parent needs a USA Taekwondo Sport:80 account with the athlete profile connected.',
        linkLabel: 'Open USA Taekwondo Sport:80',
        linkUrl: 'https://usataekwondo.sport80.com/',
      },
      {
        title: 'Keep the membership active',
        text: 'USATKD events need an active USA Taekwondo membership. An expired membership can block registration.',
      },
      {
        title: 'Check the athlete profile',
        text: 'Confirm name, date of birth, gender, belt rank and club are correct before you start.',
      },
    ],
  },
  {
    id: 'during',
    title: 'When you register',
    steps: [
      {
        title: 'Find the tournament',
        text: 'In Sport:80, open Events and find the tournament, or use the registration link MAT shares.',
      },
      {
        title: 'Pick your events',
        text: 'Choose events such as sparring (kyorugi), recognized poomsae, traditional poomsae or breaking. Not sure? Ask a MAT coach.',
      },
      {
        title: 'Confirm your division',
        text: 'Double-check competition age, rank, weight class and poomsae category. Mistakes can put the athlete in the wrong division.',
      },
      {
        title: 'Pay the entry fee',
        text: 'Entry fees are paid during registration. They are separate from MAT tuition and fees.',
      },
      {
        title: 'Beat the deadline',
        text: 'Many events have early, regular and late prices, and registration closes after the final deadline.',
      },
    ],
  },
  {
    id: 'after',
    title: 'After you register',
    steps: [
      {
        title: 'Watch for updates',
        text: 'Keep checking for the schedule, report times, weigh-in details, brackets, equipment rules and designated poomsae.',
      },
    ],
  },
]

export const nonUsatkdRegistrationNote =
  'Not every tournament uses Sport:80. For other events, follow the registration link and instructions from MAT or the tournament organizer. The MAT Tournaments page is always the place to start.'

export const tournamentDayGroups = [
  {
    id: 'night-before',
    title: 'The night before',
    items: [
      'Review the final schedule, report time, brackets and designated poomsae.',
      'Sparring: know your registered weight class before weigh-in.',
      'Poomsae: practice every form in your division’s pool, plus any designated forms.',
      'Pack your full dobok and all required competition gear.',
    ],
  },
  {
    id: 'at-venue',
    title: 'At the venue',
    items: [
      'Arrive early enough for check-in, weigh-in, equipment check, staging and warm-up.',
      'Listen for staging and ring announcements all day.',
      'Stay in touch with your MAT coaches so you know when and where to report.',
      'Don’t leave until you have confirmed all of your events are finished.',
    ],
  },
]

export const terminology = [
  {
    term: 'Poomsae',
    definition:
      'A predetermined sequence of Taekwondo techniques performed in a specific order.',
  },
  {
    term: 'Kyorugi',
    definition:
      'The Korean term used for Taekwondo sparring competition.',
  },
  {
    term: 'Recognized Poomsae',
    definition:
      'WT-style competitive poomsae using recognized Taegeuk and black-belt forms from the compulsory form pool for the athlete’s division.',
  },
  {
    term: 'Compulsory Poomsae',
    definition:
      'The complete group of forms that may be selected for an athlete’s competition division.',
  },
  {
    term: 'Designated Poomsae',
    definition:
      'The specific form or forms selected from the compulsory pool for a tournament, round, or match.',
  },
  {
    term: 'Traditional Poomsae',
    definition:
      'A USATKD competition category where the permitted form or form set is based primarily on belt rank.',
  },
  {
    term: 'Dan',
    definition:
      'An adult black-belt rank designation.',
  },
  {
    term: 'Poom',
    definition:
      'A junior black-belt rank designation.',
  },
  {
    term: 'Geup',
    definition:
      'A color-belt rank designation before black belt.',
  },
  {
    term: 'World Class',
    definition:
      'The competitive black-belt pathway using the applicable USATKD and World Taekwondo rules.',
  },
  {
    term: 'Aspiring',
    definition:
      'USATKD competition divisions outside the World Class black-belt pathway, including applicable color-belt divisions.',
  },
  {
    term: 'Division',
    definition:
      'The competition grouping determined by factors such as age, rank, gender, weight, or event.',
  },
  {
    term: 'Staging',
    definition:
      'The area where athletes report and are organized before entering the competition area.',
  },
  {
    term: 'Weigh-in',
    definition:
      'The official process used to verify that a sparring athlete meets the registered weight division.',
  },
  {
    term: 'PSS',
    definition:
      'Protector and Scoring System. Electronic equipment used to register scoring in sparring.',
  },
  {
    term: 'Daedo',
    definition:
      'A brand of electronic Protector and Scoring System commonly used at Taekwondo tournaments.',
  },
]

export const poomsaeAgeDivisions = [
  {
    id: 'dragon',
    label: 'Dragon',
    ages: '6–7',
  },
  {
    id: 'tiger',
    label: 'Tiger',
    ages: '8–9',
  },
  {
    id: 'youth',
    label: 'Youth',
    ages: '10–11',
  },
  {
    id: 'cadet',
    label: 'Cadet',
    ages: '12–14',
  },
  {
    id: 'junior',
    label: 'Junior',
    ages: '15–17',
  },
  {
    id: 'under30',
    label: 'Under 30',
    ages: '18–30',
  },
  {
    id: 'under40',
    label: 'Under 40',
    ages: '31–40',
  },
  {
    id: 'under50',
    label: 'Under 50',
    ages: '41–50',
  },
  {
    id: 'under60',
    label: 'Under 60',
    ages: '51–60',
  },
  {
    id: 'under65',
    label: 'Under 65',
    ages: '61–65',
  },
  {
    id: 'over65',
    label: 'Over 65',
    ages: '66+',
  },
  {
    id: 'over70',
    label: 'Over 70',
    ages: '71+',
  },
]

export const recognizedColorBeltPoomsae = [
  {
    rank: 'Yellow',
    geup: '7th & 8th Geup',
    forms: ['Taegeuk 1 Jang', 'Taegeuk 2 Jang'],
  },
  {
    rank: 'Green',
    geup: '5th & 6th Geup',
    forms: [
      'Taegeuk 1 Jang',
      'Taegeuk 2 Jang',
      'Taegeuk 3 Jang',
      'Taegeuk 4 Jang',
    ],
  },
  {
    rank: 'Blue',
    geup: '3rd & 4th Geup',
    forms: [
      'Taegeuk 3 Jang',
      'Taegeuk 4 Jang',
      'Taegeuk 5 Jang',
      'Taegeuk 6 Jang',
    ],
  },
  {
    rank: 'Red',
    geup: '1st & 2nd Geup',
    forms: [
      'Taegeuk 4 Jang',
      'Taegeuk 5 Jang',
      'Taegeuk 6 Jang',
      'Taegeuk 7 Jang',
      'Taegeuk 8 Jang',
    ],
  },
]

export const recognizedBlackBeltPoomsae = [
  {
    divisions: ['Dragon', 'Tiger', 'Youth'],
    ages: '6–11',
    forms: [
      'Taegeuk 4 Jang',
      'Taegeuk 5 Jang',
      'Taegeuk 6 Jang',
      'Taegeuk 7 Jang',
      'Taegeuk 8 Jang',
      'Koryo',
      'Keumgang',
    ],
  },
  {
    divisions: ['Cadet'],
    ages: '12–14',
    forms: [
      'Taegeuk 4 Jang',
      'Taegeuk 5 Jang',
      'Taegeuk 6 Jang',
      'Taegeuk 7 Jang',
      'Taegeuk 8 Jang',
      'Koryo',
      'Keumgang',
      'Taebaek',
    ],
  },
  {
    divisions: ['Junior'],
    ages: '15–17',
    forms: [
      'Taegeuk 5 Jang',
      'Taegeuk 6 Jang',
      'Taegeuk 7 Jang',
      'Taegeuk 8 Jang',
      'Koryo',
      'Keumgang',
      'Taebaek',
      'Pyongwon',
    ],
  },
  {
    divisions: ['Under 30', 'Under 40'],
    ages: '18–40',
    forms: [
      'Taegeuk 7 Jang',
      'Taegeuk 8 Jang',
      'Koryo',
      'Keumgang',
      'Taebaek',
      'Pyongwon',
      'Shipjin',
      'Jitae',
    ],
  },
  {
    divisions: ['Under 50', 'Under 60'],
    ages: '41–60',
    forms: [
      'Taegeuk 8 Jang',
      'Koryo',
      'Keumgang',
      'Taebaek',
      'Pyongwon',
      'Shipjin',
      'Jitae',
      'Chonkwon',
    ],
  },
  {
    divisions: ['Under 65', 'Over 65', 'Over 70'],
    ages: '61+',
    forms: [
      'Koryo',
      'Keumgang',
      'Taebaek',
      'Pyongwon',
      'Shipjin',
      'Jitae',
      'Chonkwon',
      'Hansu',
    ],
  },
]

export const traditionalPoomsae = [
  {
    rank: 'Yellow',
    detail: '7th & 8th Geup',
    forms: ['Taegeuk 1 Jang', 'Taegeuk 2 Jang'],
  },
  {
    rank: 'Green',
    detail: '5th & 6th Geup',
    forms: ['Taegeuk 3 Jang', 'Taegeuk 4 Jang'],
  },
  {
    rank: 'Blue',
    detail: '3rd & 4th Geup',
    forms: ['Taegeuk 5 Jang', 'Taegeuk 6 Jang'],
  },
  {
    rank: 'Red',
    detail: '1st & 2nd Geup',
    forms: ['Taegeuk 7 Jang', 'Taegeuk 8 Jang'],
  },
  {
    rank: '1st Dan / Poom',
    detail: 'All ages',
    forms: ['Koryo'],
  },
  {
    rank: '2nd Dan / Poom',
    detail: 'All ages',
    forms: ['Keumgang'],
  },
  {
    rank: '3rd Dan / Poom',
    detail: 'All ages',
    forms: ['Taebaek'],
  },
  {
    rank: '4th Dan / Poom & Up',
    detail: 'Dragon, Tiger, Youth, Cadet, Junior',
    forms: ['Pyongwon'],
  },
  {
    rank: '4th Dan / Poom & Up',
    detail: 'Under 30',
    forms: ['Pyongwon', 'Shipjin', 'Jitae'],
  },
  {
    rank: '4th Dan / Poom & Up',
    detail: 'Under 40',
    forms: ['Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon'],
  },
  {
    rank: '4th Dan / Poom & Up',
    detail: 'Under 50 / Over 50',
    forms: [
      'Pyongwon',
      'Shipjin',
      'Jitae',
      'Chonkwon',
      'Hansu',
    ],
  },
]

const worldClass = {
  senior: {
    male: [
      '-54 kg',
      '-58 kg',
      '-63 kg',
      '-68 kg',
      '-74 kg',
      '-80 kg',
      '-87 kg',
      '+87 kg',
    ],
    female: [
      '-46 kg',
      '-49 kg',
      '-53 kg',
      '-57 kg',
      '-62 kg',
      '-67 kg',
      '-73 kg',
      '+73 kg',
    ],
  },

  junior: {
    male: [
      '-45 kg',
      '-48 kg',
      '-51 kg',
      '-55 kg',
      '-59 kg',
      '-63 kg',
      '-68 kg',
      '-73 kg',
      '-78 kg',
      '+78 kg',
    ],
    female: [
      '-42 kg',
      '-44 kg',
      '-46 kg',
      '-49 kg',
      '-52 kg',
      '-55 kg',
      '-59 kg',
      '-63 kg',
      '-68 kg',
      '+68 kg',
    ],
  },

  cadet: {
    male: [
      '-33 kg',
      '-37 kg',
      '-41 kg',
      '-45 kg',
      '-49 kg',
      '-53 kg',
      '-57 kg',
      '-61 kg',
      '-65 kg',
      '+65 kg',
    ],
    female: [
      '-29 kg',
      '-33 kg',
      '-37 kg',
      '-41 kg',
      '-44 kg',
      '-47 kg',
      '-51 kg',
      '-55 kg',
      '-59 kg',
      '+59 kg',
    ],
  },
}

const aspiring = {
  senior: {
    male: ['-58 kg', '-68 kg', '-80 kg', '+80 kg'],
    female: ['-49 kg', '-57 kg', '-67 kg', '+67 kg'],
  },

  junior: {
    male: ['-48 kg', '-55 kg', '-63 kg', '-73 kg', '+73 kg'],
    female: ['-44 kg', '-49 kg', '-55 kg', '-63 kg', '+63 kg'],
  },

  cadet: {
    male: [
      '-37 kg',
      '-45 kg',
      '-49 kg',
      '-57 kg',
      '-65 kg',
      '+65 kg',
    ],
    female: [
      '-33 kg',
      '-37 kg',
      '-44 kg',
      '-51 kg',
      '-59 kg',
      '+59 kg',
    ],
  },

  youth: {
    male: ['-30 kg', '-35 kg', '-40 kg', '+40 kg'],
    female: ['-30 kg', '-35 kg', '-40 kg', '+40 kg'],
  },

  tiger: {
    male: ['-24 kg', '-28 kg', '-33 kg', '+33 kg'],
    female: ['-24 kg', '-28 kg', '-33 kg', '+33 kg'],
  },

  dragon: {
    male: ['-22 kg', '-25 kg', '+25 kg'],
    female: ['-22 kg', '-25 kg', '+25 kg'],
  },

  ultra: {
    male: ['-58 kg', '-68 kg', '-80 kg', '+80 kg'],
    female: ['-49 kg', '-57 kg', '-67 kg', '+67 kg'],
  },
}

export const sparringDivisions = [
  {
    id: 'dragon',
    label: 'Dragon',
    ages: '6–7',
    availableClasses: ['aspiring'],
  },
  {
    id: 'tiger',
    label: 'Tiger',
    ages: '8–9',
    availableClasses: ['aspiring'],
  },
  {
    id: 'youth',
    label: 'Youth',
    ages: '10–11',
    availableClasses: ['aspiring'],
  },
  {
    id: 'cadet',
    label: 'Cadet',
    ages: '12–14',
    availableClasses: ['world', 'aspiring'],
  },
  {
    id: 'junior',
    label: 'Junior',
    ages: '15–17',
    availableClasses: ['world', 'aspiring'],
  },
  {
    id: 'senior',
    label: 'Senior',
    ages: '17+',
    availableClasses: ['world', 'aspiring'],
  },
  {
    id: 'ultra',
    label: 'Ultra',
    ages: '33–45 / 46+',
    availableClasses: ['aspiring'],
  },
]

export function getSparringWeights(
  division,
  competitionClass,
  gender
) {
  if (competitionClass === 'world') {
    return worldClass[division]?.[gender] || []
  }

  return aspiring[division]?.[gender] || []
}


// WT compulsory poomsae, black belts. Taeback in the WT chart is the same form as Taebaek.
const taegeuk = (...numbers) => numbers.map((number) => `Taegeuk ${number} Jang`)
const WT_PALGWE_TO_HANSU = ['Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon', 'Hansu']

const wtIndividualPoomsae = [
  { title: 'Dragon / Tiger / Youth', detail: 'Ages 6–11', forms: [...taegeuk(2, 3, 4, 5, 6, 7, 8), 'Koryo'] },
  { title: 'Cadet', detail: 'Ages 12–14', forms: [...taegeuk(4, 5, 6, 7, 8), ...WT_PALGWE_TO_HANSU.slice(0, 3)] },
  { title: 'Junior', detail: 'Ages 15–17', forms: [...taegeuk(5, 6, 7, 8), ...WT_PALGWE_TO_HANSU.slice(0, 4)] },
  { title: 'Under 30 / Under 40', detail: 'Ages 18–40', forms: [...taegeuk(7, 8), ...WT_PALGWE_TO_HANSU.slice(0, 6)] },
  { title: 'Under 50', detail: 'Ages 41–50', forms: [...taegeuk(8), ...WT_PALGWE_TO_HANSU.slice(0, 7)] },
  { title: 'Under 60 / Under 65 / Over 65 / Over 70', detail: 'Ages 51+', forms: WT_PALGWE_TO_HANSU },
]

// Pairs and team divisions use identical lists in the WT chart.
const wtPairsTeamsPoomsae = [
  { title: 'Cadet', detail: 'Pairs and teams', forms: [...taegeuk(4, 5, 6, 7, 8), ...WT_PALGWE_TO_HANSU.slice(0, 3)] },
  { title: 'Junior', detail: 'Pairs and teams', forms: [...taegeuk(4, 5, 6, 7, 8), ...WT_PALGWE_TO_HANSU.slice(0, 4)] },
  { title: 'Under 30', detail: 'Pairs and teams', forms: [...taegeuk(6, 7, 8), ...WT_PALGWE_TO_HANSU.slice(0, 6)] },
  { title: 'Under 50', detail: 'Pairs and teams', forms: [...taegeuk(8), ...WT_PALGWE_TO_HANSU.slice(0, 7)] },
  { title: 'Under 60', detail: 'Pairs and teams', forms: WT_PALGWE_TO_HANSU },
  { title: 'Over 60', detail: 'Pairs and teams', forms: WT_PALGWE_TO_HANSU },
]

// AAU compulsory poomsae. AAU spells Chonkwon as "Cheonkwon"; same form.
const AAU_BLACK = WT_PALGWE_TO_HANSU

const aauIndividualPoomsae = [
  { title: 'Minor', detail: 'Ages 9 and under', forms: [...taegeuk(3, 4, 5, 6, 7, 8), 'Koryo'] },
  { title: 'Youth', detail: 'Ages 10–11', forms: [...taegeuk(4, 5, 6, 7, 8), ...AAU_BLACK.slice(0, 2)] },
  { title: 'Cadet', detail: 'Ages 12–14', forms: [...taegeuk(4, 5, 6, 7, 8), ...AAU_BLACK.slice(0, 3)] },
  { title: 'Junior', detail: 'Ages 15–17', forms: [...taegeuk(5, 6, 7, 8), ...AAU_BLACK.slice(0, 4)] },
  { title: 'Under 30 / Under 40', detail: 'Ages 18–40', forms: [...taegeuk(7, 8), ...AAU_BLACK.slice(0, 6)] },
  { title: 'Under 50', detail: 'Ages 41–50', forms: [...taegeuk(8), ...AAU_BLACK.slice(0, 7)] },
  { title: 'Under 60 / Under 65 / Over 65', detail: 'Ages 51+', forms: AAU_BLACK },
]

// Pair and team divisions use identical lists in the AAU chart.
const aauPairsTeamsPoomsae = [
  { title: 'Youth', detail: 'Ages 8–11', forms: [...taegeuk(4, 5, 6, 7, 8), ...AAU_BLACK.slice(0, 2)] },
  { title: 'Cadet', detail: 'Ages 12–14', forms: [...taegeuk(4, 5, 6, 7, 8), ...AAU_BLACK.slice(0, 3)] },
  { title: 'Junior', detail: 'Ages 15–17', forms: [...taegeuk(5, 6, 7, 8), ...AAU_BLACK.slice(0, 4)] },
  { title: 'Under 30', detail: 'Ages 18–30', forms: [...taegeuk(7, 8), ...AAU_BLACK.slice(0, 6)] },
  { title: 'Under 50', detail: 'Ages 31–50', forms: [...taegeuk(8), ...AAU_BLACK.slice(0, 7)] },
  { title: 'Under 60 / Over 60', detail: 'Ages 51+', forms: AAU_BLACK },
]

const aauColorBeltPoomsae = [
  { title: 'Intermediate · Tyke / Minor', detail: 'Green, purple, blue · ages 9 and under', forms: taegeuk(2, 3, 4, 5) },
  { title: 'Intermediate · Youth and up', detail: 'Green, purple, blue · ages 10+', forms: taegeuk(2, 3, 4, 5, 6) },
  { title: 'Advanced · Tyke / Minor', detail: 'Brown, red · ages 9 and under', forms: taegeuk(3, 4, 5, 6, 7) },
  { title: 'Advanced · Youth and up', detail: 'Brown, red · ages 10+', forms: taegeuk(3, 4, 5, 6, 7, 8) },
]

// Required forms by organization. Each category lists cards of
// { title, detail, forms }. An organization with no categories shows a
// "being added" notice until its official lists are filled in.
export const formOrganizations = [
  {
    id: 'usatkd',
    label: 'USA Taekwondo',
    short: 'USATKD',
    description: 'USATKD-sanctioned events, including state and national championships.',
    categories: [
      {
        id: 'recognized-black',
        label: 'Recognized · Black Belt',
        cardLabel: 'Division',
        items: recognizedBlackBeltPoomsae.map((item) => ({
          title: item.divisions.join(' / '),
          detail: `Ages ${item.ages}`,
          forms: item.forms,
        })),
      },
      {
        id: 'recognized-color',
        label: 'Recognized · Color Belt',
        cardLabel: 'Belt',
        items: recognizedColorBeltPoomsae.map((item) => ({
          title: item.rank,
          detail: item.geup,
          forms: item.forms,
        })),
      },
      {
        id: 'traditional',
        label: 'Traditional',
        cardLabel: 'Rank',
        items: traditionalPoomsae.map((item) => ({
          title: item.rank,
          detail: item.detail,
          forms: item.forms,
        })),
      },
    ],
  },
  {
    id: 'wt',
    label: 'World Taekwondo',
    short: 'WT',
    description: 'International and WT-ranked events, such as G-ranked opens.',
    categories: [
      {
        id: 'individual',
        label: 'Individual · Black Belt',
        cardLabel: 'Division',
        items: wtIndividualPoomsae,
      },
      {
        id: 'pairs-teams',
        label: 'Pairs & Teams · Black Belt',
        cardLabel: 'Division',
        items: wtPairsTeamsPoomsae,
      },
    ],
  },
  {
    id: 'aau',
    label: 'AAU Taekwondo',
    short: 'AAU',
    description: 'AAU events, including AAU state and national championships.',
    categories: [
      {
        id: 'individual',
        label: 'Individual · Black Belt',
        cardLabel: 'Division',
        items: aauIndividualPoomsae,
      },
      {
        id: 'pairs-teams',
        label: 'Pairs & Teams · Black Belt',
        cardLabel: 'Division',
        items: aauPairsTeamsPoomsae,
      },
      {
        id: 'color',
        label: 'Color Belt',
        cardLabel: 'Level',
        note: 'Intermediate is green, purple and blue belts. Advanced is brown and red belts. AAU may combine divisions at an event.',
        items: aauColorBeltPoomsae,
      },
    ],
  },
]
