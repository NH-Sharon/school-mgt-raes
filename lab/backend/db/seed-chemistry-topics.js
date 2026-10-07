/* Adds topics to the seeded Chemistry chapters, tags existing MCQs to those
   topics, and adds Creative Questions — so topic-based MCQ/CQ practice works
   immediately, without needing the LLM Book Analysis engine.
   Idempotent. Run: node db/seed-chemistry-topics.js */
require('dotenv').config();
const pool = require('../config/database');

// chapter title_en -> topics (bilingual) + creative questions
const PLAN = {
  'Acids, Bases and Salts': {
    topics: [
      { bn: 'এসিড ও ক্ষারের ধর্ম', en: 'Properties of Acids and Bases' },
      { bn: 'নিরপেক্ষীকরণ ও লবণ', en: 'Neutralization and Salts' },
      { bn: 'pH ও নির্দেশক', en: 'pH and Indicators' },
    ],
    cqs: [
      {
        stimulus_bn: 'একজন শিক্ষার্থী HCl দ্রবণে নীল লিটমাস কাগজ ডোবালে তা লাল হয়ে যায়। পরে সে ঐ দ্রবণে NaOH যোগ করতে থাকে।',
        stimulus_en: 'A student dips blue litmus paper into an HCl solution and it turns red. The student then keeps adding NaOH to the solution.',
        difficulty: 'medium', topicIndex: 1,
        parts: [
          { level: 'knowledge', marks: 1, bn: 'নিরপেক্ষীকরণ বিক্রিয়া কী?', en: 'What is a neutralization reaction?', ma_bn: 'এসিড ও ক্ষারের বিক্রিয়ায় লবণ ও পানি উৎপন্ন হওয়ার প্রক্রিয়াকে নিরপেক্ষীকরণ বলে।', ma_en: 'The reaction of an acid with a base to form salt and water is called neutralization.' },
          { level: 'comprehension', marks: 2, bn: 'নীল লিটমাস লাল হলো কেন?', en: 'Why did the blue litmus turn red?', ma_bn: 'HCl একটি এসিড; এসিড নীল লিটমাসকে লাল করে, তাই রঙ পরিবর্তন ঘটেছে।', ma_en: 'HCl is an acid, and acids turn blue litmus red, causing the colour change.' },
          { level: 'application', marks: 3, bn: 'NaOH যোগ করার সাথে সাথে দ্রবণের pH-এর কী পরিবর্তন হবে ব্যাখ্যা করো।', en: 'Explain how the pH of the solution changes as NaOH is added.', ma_bn: 'ক্ষার যোগ করায় H⁺ আয়ন কমে pH বাড়তে থাকে; নিরপেক্ষ বিন্দুতে pH=7 হয়, এরপর আরও যোগ করলে pH>7 হয়।', ma_en: 'Adding base consumes H⁺ ions, so pH rises; at the neutral point pH = 7, and further addition makes pH > 7.' },
          { level: 'higher', marks: 4, bn: 'সমীকরণসহ বিক্রিয়াটি লেখো এবং উৎপন্ন লবণটি অম্লীয়, ক্ষারীয় নাকি নিরপেক্ষ তা বিশ্লেষণ করো।', en: 'Write the balanced equation and analyse whether the salt formed is acidic, basic or neutral.', ma_bn: 'HCl + NaOH → NaCl + H₂O। NaCl শক্তিশালী এসিড ও শক্তিশালী ক্ষারের লবণ, তাই এটি নিরপেক্ষ (pH≈7)।', ma_en: 'HCl + NaOH → NaCl + H₂O. NaCl is the salt of a strong acid and strong base, so it is neutral (pH ≈ 7).' },
        ],
      },
      {
        stimulus_bn: 'গৃহস্থালিতে লেবুর রস (সাইট্রিক এসিড) এবং বেকিং সোডা (NaHCO₃) একসাথে মেশালে বুদবুদ ওঠে।',
        stimulus_en: 'In the kitchen, mixing lemon juice (citric acid) with baking soda (NaHCO₃) produces bubbles.',
        difficulty: 'basic', topicIndex: 0,
        parts: [
          { level: 'knowledge', marks: 1, bn: 'এসিডের দুটি সাধারণ ধর্ম লেখো।', en: 'State two common properties of acids.', ma_bn: 'এসিড টক স্বাদযুক্ত এবং নীল লিটমাসকে লাল করে।', ma_en: 'Acids taste sour and turn blue litmus red.' },
          { level: 'comprehension', marks: 2, bn: 'বুদবুদের কারণ কী?', en: 'What causes the bubbles?', ma_bn: 'এসিড ও কার্বনেট/বাইকার্বনেটের বিক্রিয়ায় CO₂ গ্যাস উৎপন্ন হয়, যা বুদবুদ আকারে বের হয়।', ma_en: 'The acid reacts with the bicarbonate to release CO₂ gas, seen as bubbles.' },
          { level: 'application', marks: 3, bn: 'কীভাবে প্রমাণ করবে গ্যাসটি CO₂?', en: 'How would you prove the gas is CO₂?', ma_bn: 'গ্যাসটি চুনের পানিতে চালালে তা ঘোলা হয়ে যায় — এটি CO₂-এর শনাক্তকরণ পরীক্ষা।', ma_en: 'Passing the gas through limewater turns it milky — the confirmatory test for CO₂.' },
          { level: 'higher', marks: 4, bn: 'এই বিক্রিয়ার ধরন ব্যাখ্যা করো এবং দৈনন্দিন জীবনে এর একটি প্রয়োগ লেখো।', en: 'Explain the type of this reaction and give one everyday application.', ma_bn: 'এটি এসিড-কার্বনেট বিক্রিয়া (গ্যাস উৎপাদনকারী)। কেক ফোলাতে বেকিং সোডা ব্যবহার এর একটি প্রয়োগ।', ma_en: 'It is an acid–carbonate (gas-evolving) reaction. Using baking soda to make cakes rise is one application.' },
        ],
      },
    ],
  },
  'Elements and the Periodic Table': {
    topics: [{ bn: 'পর্যায় ও গ্রুপ', en: 'Periods and Groups' }, { bn: 'পর্যায়বৃত্ত ধর্ম', en: 'Periodic Trends' }],
    cqs: [{
      stimulus_bn: 'আধুনিক পর্যায় সারণিতে মৌলসমূহ পারমাণবিক সংখ্যার ক্রমে সাজানো।',
      stimulus_en: 'In the modern periodic table, elements are arranged in order of atomic number.',
      difficulty: 'medium', topicIndex: 0,
      parts: [
        { level: 'knowledge', marks: 1, bn: 'পর্যায় ও গ্রুপ বলতে কী বোঝায়?', en: 'What do period and group mean?', ma_bn: 'অনুভূমিক সারি = পর্যায়, উলম্ব কলাম = গ্রুপ।', ma_en: 'A horizontal row is a period; a vertical column is a group.' },
        { level: 'comprehension', marks: 2, bn: 'একই গ্রুপের মৌলের ধর্ম প্রায় একই কেন?', en: 'Why do elements of the same group have similar properties?', ma_bn: 'একই গ্রুপের মৌলের যোজন ইলেকট্রন সংখ্যা সমান, তাই রাসায়নিক ধর্ম প্রায় একই।', ma_en: 'They have the same number of valence electrons, so their chemical properties are similar.' },
        { level: 'application', marks: 3, bn: 'পর্যায় বরাবর বামে থেকে ডানে পারমাণবিক ব্যাসার্ধের কী পরিবর্তন হয় এবং কেন?', en: 'How does atomic radius change left-to-right across a period and why?', ma_bn: 'ব্যাসার্ধ কমে, কারণ নিউক্লিয়ার আধান বাড়ায় ইলেকট্রন বেশি আকর্ষিত হয়।', ma_en: 'It decreases because increasing nuclear charge pulls the electrons in more strongly.' },
        { level: 'higher', marks: 4, bn: 'গ্রুপ-১ ও গ্রুপ-১৭ মৌলের সক্রিয়তার প্রবণতা তুলনা করো।', en: 'Compare the reactivity trends of Group 1 and Group 17 elements.', ma_bn: 'গ্রুপ-১-এ নিচে গেলে সক্রিয়তা বাড়ে (ইলেকট্রন হারানো সহজ), গ্রুপ-১৭-এ নিচে গেলে সক্রিয়তা কমে (ইলেকট্রন গ্রহণ কঠিন)।', ma_en: 'Group 1 reactivity increases down the group (easier to lose an electron); Group 17 reactivity decreases down the group (harder to gain an electron).' },
      ],
    }],
  },
  'Metallurgy': {
    topics: [{ bn: 'ধাতু নিষ্কাশন', en: 'Extraction of Metals' }, { bn: 'সক্রিয়তা সিরিজ', en: 'Reactivity Series' }],
    cqs: [{
      stimulus_bn: 'লোহা ব্লাস্ট ফার্নেসে কার্বন দিয়ে বিজারণের মাধ্যমে নিষ্কাশিত হয়, কিন্তু অ্যালুমিনিয়াম তড়িৎ বিশ্লেষণে নিষ্কাশিত হয়।',
      stimulus_en: 'Iron is extracted by carbon reduction in a blast furnace, but aluminium is extracted by electrolysis.',
      difficulty: 'advanced', topicIndex: 0,
      parts: [
        { level: 'knowledge', marks: 1, bn: 'ধাতুবিদ্যা কী?', en: 'What is metallurgy?', ma_bn: 'আকরিক থেকে ধাতু নিষ্কাশন ও প্রক্রিয়াকরণের বিজ্ঞানকে ধাতুবিদ্যা বলে।', ma_en: 'The science of extracting and processing metals from ores.' },
        { level: 'comprehension', marks: 2, bn: 'কার্বন দিয়ে সব ধাতু নিষ্কাশন করা যায় না কেন?', en: 'Why can not all metals be extracted using carbon?', ma_bn: 'কার্বনের চেয়ে বেশি সক্রিয় ধাতু কার্বন দিয়ে বিজারিত হয় না।', ma_en: 'Metals more reactive than carbon cannot be reduced by carbon.' },
        { level: 'application', marks: 3, bn: 'অ্যালুমিনিয়ামের জন্য তড়িৎ বিশ্লেষণ প্রয়োজন কেন?', en: 'Why is electrolysis needed for aluminium?', ma_bn: 'অ্যালুমিনিয়াম খুব সক্রিয়, কার্বন দিয়ে বিজারিত হয় না, তাই তড়িৎ শক্তি দিয়ে নিষ্কাশন করা হয়।', ma_en: 'Aluminium is very reactive and cannot be reduced by carbon, so electrical energy is used.' },
        { level: 'higher', marks: 4, bn: 'সক্রিয়তা সিরিজ কীভাবে নিষ্কাশন পদ্ধতি নির্ধারণে সাহায্য করে, উদাহরণসহ ব্যাখ্যা করো।', en: 'Explain with examples how the reactivity series determines the extraction method.', ma_bn: 'সিরিজে উপরের (সক্রিয়) ধাতু — তড়িৎ বিশ্লেষণ (Na, Al); মাঝের — কার্বন বিজারণ (Fe, Zn); নিচের — সরাসরি পাওয়া যায় (Au)।', ma_en: 'Top (reactive) metals → electrolysis (Na, Al); middle → carbon reduction (Fe, Zn); bottom → found native (Au).' },
      ],
    }],
  },
  'Chemical Bonding': {
    topics: [{ bn: 'আয়নিক বন্ধন', en: 'Ionic Bonding' }, { bn: 'সমযোজী বন্ধন', en: 'Covalent Bonding' }],
    cqs: [{
      stimulus_bn: 'NaCl-এ Na এবং Cl-এর মধ্যে ইলেকট্রন স্থানান্তর ঘটে, কিন্তু H₂O-এ পরমাণুগুলো ইলেকট্রন শেয়ার করে।',
      stimulus_en: 'In NaCl electrons transfer between Na and Cl, but in H₂O the atoms share electrons.',
      difficulty: 'medium', topicIndex: 0,
      parts: [
        { level: 'knowledge', marks: 1, bn: 'রাসায়নিক বন্ধন কী?', en: 'What is a chemical bond?', ma_bn: 'পরমাণুসমূহকে একত্রে ধরে রাখা আকর্ষণ বলকে রাসায়নিক বন্ধন বলে।', ma_en: 'The force of attraction that holds atoms together is a chemical bond.' },
        { level: 'comprehension', marks: 2, bn: 'আয়নিক ও সমযোজী বন্ধনের মূল পার্থক্য কী?', en: 'What is the key difference between ionic and covalent bonds?', ma_bn: 'আয়নিক বন্ধনে ইলেকট্রন স্থানান্তর হয়, সমযোজীতে ইলেকট্রন শেয়ার হয়।', ma_en: 'Ionic bonds involve electron transfer; covalent bonds involve electron sharing.' },
        { level: 'application', marks: 3, bn: 'আয়নিক যৌগের গলনাঙ্ক উচ্চ কেন?', en: 'Why do ionic compounds have high melting points?', ma_bn: 'আয়নসমূহের মধ্যে শক্তিশালী স্থির-তড়িৎ আকর্ষণ ভাঙতে বেশি শক্তি লাগে।', ma_en: 'Strong electrostatic attraction between ions needs a lot of energy to break.' },
        { level: 'higher', marks: 4, bn: 'অক্টেট নিয়ম ব্যবহার করে NaCl গঠন ব্যাখ্যা করো।', en: 'Use the octet rule to explain the formation of NaCl.', ma_bn: 'Na একটি ইলেকট্রন দিয়ে Na⁺ ও Cl একটি গ্রহণ করে Cl⁻ হয়; উভয়ে নিষ্ক্রিয় গ্যাসের স্থিতিশীল বিন্যাস অর্জন করে।', ma_en: 'Na loses one electron to form Na⁺ and Cl gains one to form Cl⁻; both achieve a stable noble-gas configuration.' },
      ],
    }],
  },
  'Introduction to Organic Chemistry': {
    topics: [{ bn: 'হাইড্রোকার্বন', en: 'Hydrocarbons' }, { bn: 'কার্যকরী মূলক', en: 'Functional Groups' }],
    cqs: [{
      stimulus_bn: 'মিথেন (CH₄) সবচেয়ে সরল হাইড্রোকার্বন, আর ইথানল (C₂H₅OH)-এ একটি -OH মূলক আছে।',
      stimulus_en: 'Methane (CH₄) is the simplest hydrocarbon, while ethanol (C₂H₅OH) contains an -OH group.',
      difficulty: 'medium', topicIndex: 1,
      parts: [
        { level: 'knowledge', marks: 1, bn: 'জৈব রসায়ন কী নিয়ে আলোচনা করে?', en: 'What does organic chemistry deal with?', ma_bn: 'কার্বনযুক্ত যৌগের গঠন ও বিক্রিয়া নিয়ে।', ma_en: 'The structure and reactions of carbon-containing compounds.' },
        { level: 'comprehension', marks: 2, bn: 'কার্যকরী মূলক বলতে কী বোঝায়?', en: 'What is a functional group?', ma_bn: 'অণুর যে অংশ এর রাসায়নিক ধর্ম নির্ধারণ করে (যেমন -OH), তাকে কার্যকরী মূলক বলে।', ma_en: 'The part of a molecule that determines its chemical properties (e.g. -OH).' },
        { level: 'application', marks: 3, bn: 'CH₄ ও C₂H₅OH-এর ধর্ম ভিন্ন কেন?', en: 'Why do CH₄ and C₂H₅OH have different properties?', ma_bn: 'ইথানলে -OH কার্যকরী মূলক থাকায় এটি পানিতে দ্রবণীয় ও ভিন্ন বিক্রিয়া দেখায়।', ma_en: 'Ethanol has the -OH functional group, making it water-soluble and chemically different.' },
        { level: 'higher', marks: 4, bn: 'সমগোত্রীয় শ্রেণি (homologous series) কী এবং এর দুটি বৈশিষ্ট্য লেখো।', en: 'What is a homologous series and state two of its features.', ma_bn: 'একই কার্যকরী মূলকযুক্ত ও CH₂ পার্থক্যে সাজানো যৌগের শ্রেণি; একই সাধারণ সংকেত ও ধীরে ধীরে পরিবর্তিত ভৌত ধর্ম এর বৈশিষ্ট্য।', ma_en: 'A family of compounds with the same functional group differing by CH₂; features: a common general formula and gradually changing physical properties.' },
      ],
    }],
  },
  'Electrochemistry': {
    topics: [{ bn: 'জারণ-বিজারণ', en: 'Redox Reactions' }, { bn: 'তড়িৎ বিশ্লেষণ', en: 'Electrolysis' }],
    cqs: [{
      stimulus_bn: 'একটি কোষে জিংক ইলেকট্রন হারায় এবং কপার আয়ন ইলেকট্রন গ্রহণ করে।',
      stimulus_en: 'In a cell, zinc loses electrons and copper ions gain electrons.',
      difficulty: 'advanced', topicIndex: 0,
      parts: [
        { level: 'knowledge', marks: 1, bn: 'জারণ ও বিজারণ কী?', en: 'What are oxidation and reduction?', ma_bn: 'ইলেকট্রন হারানো = জারণ, ইলেকট্রন গ্রহণ = বিজারণ।', ma_en: 'Loss of electrons = oxidation; gain of electrons = reduction.' },
        { level: 'comprehension', marks: 2, bn: 'এখানে কোনটি জারিত ও কোনটি বিজারিত হচ্ছে?', en: 'Which species is oxidised and which is reduced here?', ma_bn: 'জিংক জারিত (ইলেকট্রন হারায়), কপার আয়ন বিজারিত (ইলেকট্রন গ্রহণ)।', ma_en: 'Zinc is oxidised (loses electrons); copper ions are reduced (gain electrons).' },
        { level: 'application', marks: 3, bn: 'অ্যানোড ও ক্যাথোডে কী ঘটে লেখো।', en: 'State what happens at the anode and cathode.', ma_bn: 'অ্যানোডে জারণ (জিংক দ্রবীভূত), ক্যাথোডে বিজারণ (কপার সঞ্চিত) ঘটে।', ma_en: 'Oxidation at the anode (zinc dissolves); reduction at the cathode (copper deposits).' },
        { level: 'higher', marks: 4, bn: 'তড়িৎ বিশ্লেষণ ও তড়িৎ রাসায়নিক কোষের মধ্যে পার্থক্য বিশ্লেষণ করো।', en: 'Analyse the difference between electrolysis and an electrochemical cell.', ma_bn: 'কোষ রাসায়নিক শক্তিকে তড়িৎ শক্তিতে রূপান্তর করে (স্বতঃস্ফূর্ত); তড়িৎ বিশ্লেষণে তড়িৎ শক্তি দিয়ে অস্বতঃস্ফূর্ত বিক্রিয়া ঘটানো হয়।', ma_en: 'A cell converts chemical energy to electrical energy (spontaneous); electrolysis uses electrical energy to drive a non-spontaneous reaction.' },
      ],
    }],
  },
};

async function main() {
  for (const [chapterTitle, cfg] of Object.entries(PLAN)) {
    const ch = await pool.query(`SELECT c.id FROM chapters c JOIN subjects s ON s.id=c.subject_id AND s.code='CHE' WHERE c.title_en = $1 LIMIT 1`, [chapterTitle]);
    if (!ch.rows.length) { console.log(`  = chapter "${chapterTitle}" not found, skipping`); continue; }
    const chapterId = ch.rows[0].id;

    // 1. Topics (idempotent by title_en)
    const topicIds = [];
    for (let i = 0; i < cfg.topics.length; i++) {
      const t = cfg.topics[i];
      let row = await pool.query('SELECT id FROM topics WHERE chapter_id = $1 AND title_en = $2', [chapterId, t.en]);
      if (!row.rows.length) {
        row = await pool.query(
          `INSERT INTO topics (chapter_id, title_bn, title_en, order_index, status) VALUES ($1,$2,$3,$4,'published') RETURNING id`,
          [chapterId, t.bn, t.en, i + 1]
        );
      }
      topicIds.push(row.rows[0].id);
    }

    // 2. Tag existing published MCQs round-robin across topics
    const qs = await pool.query(`SELECT id FROM questions WHERE chapter_id = $1 AND status = 'published' ORDER BY id`, [chapterId]);
    for (let i = 0; i < qs.rows.length; i++) {
      await pool.query('UPDATE questions SET topic_id = $1 WHERE id = $2', [topicIds[i % topicIds.length], qs.rows[i].id]);
    }

    // 3. Creative Questions (idempotent by stimulus_en)
    let cqAdded = 0;
    for (const cq of (cfg.cqs || [])) {
      const exists = await pool.query('SELECT id FROM cq_questions WHERE chapter_id = $1 AND stimulus_en = $2', [chapterId, cq.stimulus_en]);
      if (exists.rows.length) continue;
      const parts = cq.parts.map(p => ({
        level: p.level, marks: p.marks,
        question_bn: p.bn, question_en: p.en,
        model_answer_bn: p.ma_bn, model_answer_en: p.ma_en,
      }));
      await pool.query(
        `INSERT INTO cq_questions (chapter_id, topic_id, stimulus_bn, stimulus_en, parts, difficulty, status)
         VALUES ($1,$2,$3,$4,$5,$6,'published')`,
        [chapterId, topicIds[cq.topicIndex ?? 0], cq.stimulus_bn, cq.stimulus_en, JSON.stringify(parts), cq.difficulty]
      );
      cqAdded++;
    }
    console.log(`✓ ${chapterTitle}: ${topicIds.length} topics, ${qs.rows.length} MCQs tagged, ${cqAdded} CQ added`);
  }
  console.log('\nChemistry topics + CQ seed complete.');
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
