/**
 * Amharic Search Query Helper
 * Handles detection, normalization, transliteration, and query expansion for Ge'ez / Amharic queries.
 */

// Comprehensive mapping of Ge'ez (Amharic) characters to Latin phonetic representations.
const AMHARIC_TO_ENGLISH_MAP = {
  // Consonant H
  'ሀ': 'ha', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'ha', 'ሄ': 'he', 'ህ': 'h', 'ሆ': 'ho',
  'ሐ': 'ha', 'ሑ': 'hu', 'ሒ': 'hi', 'ሓ': 'ha', 'ሔ': 'he', 'ሕ': 'h', 'ሖ': 'ho',
  'ኀ': 'ha', 'ኁ': 'hu', 'ኂ': 'hi', 'ኃ': 'ha', 'ኄ': 'he', 'ኅ': 'h', 'ኆ': 'ho',
  // Consonant L
  'ለ': 'le', 'ሉ': 'lu', 'ሊ': 'li', 'ላ': 'la', 'ሌ': 'le', 'ል': 'l', 'ሎ': 'lo', 'ሏ': 'lwa',
  // Consonant M
  'መ': 'me', 'ሙ': 'mu', 'ሚ': 'mi', 'ማ': 'ma', 'ሜ': 'me', 'ም': 'm', 'ሞ': 'mo', 'ሟ': 'mwa',
  // Consonant S
  'ሠ': 'se', 'ሡ': 'su', 'ሢ': 'si', 'ሣ': 'sa', 'ሤ': 'se', 'ሥ': 's', 'ሦ': 'so', 'ሧ': 'swa',
  'ሰ': 'se', 'ሱ': 'su', 'ሲ': 'si', 'ሳ': 'sa', 'ሴ': 'se', 'ስ': 's', 'ሶ': 'so', 'ሷ': 'swa',
  // Consonant R
  'ረ': 're', 'ሩ': 'ru', 'ሪ': 'ri', 'ራ': 'ra', 'ሬ': 're', 'ር': 'r', 'ሮ': 'ro', 'ሯ': 'rwa',
  // Consonant SH
  'ሸ': 'she', 'ሹ': 'shu', 'ሺ': 'shi', 'ሻ': 'sha', 'ሼ': 'she', 'ሽ': 'sh', 'ሾ': 'sho', 'ሿ': 'shwa',
  // Consonant Q/K
  'ቀ': 'ke', 'ቁ': 'ku', 'ቂ': 'ki', 'ቃ': 'ka', 'ቄ': 'ke', 'ቅ': 'k', 'ቆ': 'ko', 'ቋ': 'kwa',
  // Consonant B
  'በ': 'be', 'ቡ': 'bu', 'ቢ': 'bi', 'ባ': 'ba', 'ቤ': 'be', 'ብ': 'b', 'ቦ': 'bo', 'ቧ': 'bwa',
  // Consonant V
  'ቨ': 've', 'ቩ': 'vu', 'ቪ': 'vi', 'ቫ': 'va', 'ቬ': 've', 'ቭ': 'v', 'ቮ': 'vo', 'ቯ': 'vwa',
  // Consonant T
  'ተ': 'te', 'ቱ': 'tu', 'ቲ': 'ti', 'ታ': 'ta', 'ቴ': 'te', 'ት': 't', 'ቶ': 'to', 'ቷ': 'twa',
  // Consonant CH
  'ቸ': 'che', 'ቹ': 'chu', 'ቺ': 'chi', 'ቻ': 'cha', 'ቼ': 'che', 'ች': 'ch', 'ቾ': 'cho', 'ቿ': 'chwa',
  // Consonant N
  'ነ': 'ne', 'ኑ': 'nu', 'ኒ': 'ni', 'ና': 'na', 'ኔ': 'ne', 'ን': 'n', 'ኖ': 'no', 'ኗ': 'nwa',
  // Consonant NY
  'ኘ': 'nye', 'ኙ': 'nyu', 'ኚ': 'nyi', 'ኛ': 'nya', 'ኜ': 'nye', 'ኝ': 'ny', 'ኞ': 'nyo', 'ኟ': 'nywa',
  // Consonant A/E/O
  'አ': 'a', 'ኡ': 'u', 'ኢ': 'i', 'ኣ': 'a', 'ኤ': 'e', 'እ': 'e', 'ኦ': 'o', 'ኧ': 'e',
  'ዐ': 'a', 'ዑ': 'u', 'ዒ': 'i', 'ዓ': 'a', 'ዔ': 'e', 'ዕ': 'e', 'ዖ': 'o',
  // Consonant K
  'ከ': 'ke', 'ኩ': 'ku', 'ኪ': 'ki', 'ካ': 'ka', 'ኬ': 'ke', 'ክ': 'k', 'ኮ': 'ko', 'ኳ': 'kwa',
  // Consonant H variant
  'ኸ': 'he', 'ኹ': 'hu', 'ኺ': 'hi', 'ኻ': 'ha', 'ኼ': 'he', 'ኽ': 'h', 'ኾ': 'ho',
  // Consonant W
  'ወ': 'we', 'ዉ': 'wu', 'ዊ': 'wi', 'ዋ': 'wa', 'ዌ': 'we', 'ው': 'w', 'ዎ': 'wo',
  // Consonant Z
  'ዘ': 'ze', 'ዙ': 'zu', 'ዚ': 'zi', 'ዛ': 'za', 'ዜ': 'ze', 'ዝ': 'z', 'ዞ': 'zo', 'ዟ': 'zwa',
  // Consonant ZH
  'ዠ': 'zhe', 'ዡ': 'zhu', 'ዢ': 'zhi', 'ዣ': 'zha', 'ዤ': 'zhe', 'ዥ': 'zh', 'ዦ': 'zo', 'ዧ': 'zhwa',
  // Consonant Y
  'የ': 'ye', 'ዩ': 'yu', 'ዪ': 'yi', 'ያ': 'ya', 'ዬ': 'ye', 'ይ': 'y', 'ዮ': 'yo',
  // Consonant D
  'ደ': 'de', 'ዱ': 'du', 'ዲ': 'di', 'ዳ': 'da', 'ዴ': 'de', 'ድ': 'd', 'ዶ': 'do', 'ዷ': 'dwa',
  // Consonant J
  'ጀ': 'je', 'ጁ': 'ju', 'ጂ': 'ji', 'ጃ': 'ja', 'ጄ': 'je', 'ጅ': 'j', 'ጆ': 'jo', 'ጇ': 'jwa',
  // Consonant G
  'ገ': 'ge', 'ጉ': 'gu', 'ጊ': 'gi', 'ጋ': 'ga', 'ጌ': 'ge', 'ግ': 'g', 'ጎ': 'go', 'ጓ': 'gwa',
  // Consonant T' (ejective T)
  'ጠ': 'te', 'ጡ': 'tu', 'ጢ': 'ti', 'ጣ': 'ta', 'ጤ': 'te', 'ጥ': 't', 'ጦ': 'to', 'ጧ': 'twa',
  // Consonant CH' (ejective CH)
  'ጨ': 'che', 'ጩ': 'chu', 'ጪ': 'chi', 'ጫ': 'cha', 'ጬ': 'che', 'ጭ': 'ch', 'ጮ': 'cho', 'ጯ': 'chwa',
  // Consonant P' (ejective P)
  'ጰ': 'pe', 'ጱ': 'pu', 'ጲ': 'pi', 'ጳ': 'pa', 'ጴ': 'pe', 'ጵ': 'p', 'ጶ': 'po', 'ጷ': 'pwa',
  // Consonant TS
  'ጸ': 'tsa', 'ጹ': 'tsu', 'ጺ': 'tsi', 'ጻ': 'tsa', 'ጼ': 'tse', 'ጽ': 'ts', 'ጾ': 'tso', 'ጿ': 'tswa',
  'ፀ': 'tsa', 'ፁ': 'tsu', 'ፂ': 'tsi', 'ፃ': 'tsa', 'ፄ': 'tse', 'ፅ': 'ts', 'ፆ': 'tso',
  // Consonant F
  'ፈ': 'fe', 'ፉ': 'fu', 'ፊ': 'fi', 'ፋ': 'fa', 'ፌ': 'fe', 'ፍ': 'f', 'ፎ': 'fo', 'ፏ': 'fwa',
  // Consonant P
  'ፐ': 'pe', 'ፑ': 'pu', 'ፒ': 'pi', 'ፓ': 'pa', 'ፔ': 'pe', 'ፕ': 'p', 'ፖ': 'po', 'ፗ': 'pwa'
};

// Amharic specialties dictionary
const SPECIALTY_TRANSLATIONS = {
  'ልብ': 'Cardiology',
  'ካርዲዮሎጂ': 'Cardiology',
  'ካርዲዮ': 'Cardiology',
  'ልብ ህክምና': 'Cardiology',
  'የልብ': 'Cardiology',
  'የልብ ህክምና': 'Cardiology',
  'ቆዳ': 'Dermatology',
  'ደርማቶሎጂ': 'Dermatology',
  'የቆዳ': 'Dermatology',
  'የቆዳ ህክምና': 'Dermatology',
  'ነርቭ': 'Neurology',
  'ኒውሮሎጂ': 'Neurology',
  'የነርቭ': 'Neurology',
  'የነርቭ ህክምና': 'Neurology',
  'ህፃናት': 'Pediatrics',
  'ህጻናት': 'Pediatrics',
  'ፔዲያትሪክስ': 'Pediatrics',
  'የህፃናት': 'Pediatrics',
  'የህፃናት ህክምና': 'Pediatrics',
  'የህጻናት': 'Pediatrics',
  'የህጻናት ህክምና': 'Pediatrics',
  'ጥርስ': 'Dentistry',
  'የጥርስ': 'Dentistry',
  'የጥርስ ህክምና': 'Dentistry',
  'ዴንት': 'Dentistry',
  'አጠቃላይ': 'General',
  'አጠቃላይ ሃኪም': 'General',
  'አጠቃላይ ሀኪም': 'General',
  'አጥንት': 'Orthopedics',
  'የአጥንት': 'Orthopedics',
  'የአጥንት ህክምና': 'Orthopedics',
  'ኦርቶፔዲክስ': 'Orthopedics',
  'አይን': 'Ophthalmology',
  'የአይን': 'Ophthalmology',
  'የአይን ህክምና': 'Ophthalmology',
  'ኦፍታልሞሎጂ': 'Ophthalmology',
  'ቀዶ ጥገና': 'Surgery',
  'ቀዶጥገና': 'Surgery',
  'ሰርጀሪ': 'Surgery',
  'ማህፀን': 'Gynecology',
  'ማህጸን': 'Gynecology',
  'የማህፀን': 'Gynecology',
  'የማህፀንና ፅንስ': 'Gynecology',
  'የማህፀንና ፅንስ ህክምና': 'Gynecology',
  'የማህጸን': 'Gynecology',
  'ጋይናኮሎጂ': 'Gynecology'
};

// Amharic medical equipment and category translations
const EQUIPMENT_CATEGORY_TRANSLATIONS = {
  'ኤምአርአይ': 'MRI',
  'ኤም አር አይ': 'MRI',
  'ሲቲ ስካን': 'CT_SCAN',
  'ሲቲስካን': 'CT_SCAN',
  'ሲቲ': 'CT_SCAN',
  'ዳያሊሲስ': 'DIALYSIS',
  'የኩላሊት': 'DIALYSIS',
  'አልትራሳውንድ': 'ULTRASOUND',
  'አልትራ ሳውንድ': 'ULTRASOUND',
  'ኤክስሬይ': 'XRAY',
  'ኤክስ ሬይ': 'XRAY',
  'ቬንቲሌተር': 'VENTILATOR',
  'የመተንፈሻ': 'VENTILATOR',
  'ኢሲጂ': 'ECG',
  'የልብ መለኪያ': 'ECG',
  'ማሞግራፊ': 'MAMMOGRAPHY',
  'ጡት መመርመሪያ': 'MAMMOGRAPHY',
  'ዲፊብሪሌተር': 'DEFIBRILLATOR',
  'ሌላ': 'OTHER'
};

// Amharic Hospital / Clinic Names
const HOSPITAL_TRANSLATIONS = {
  'ጥቁር አንበሳ': 'Black Lion',
  'ጥቁርአንበሳ': 'Black Lion',
  'ቅዱስ ጳውሎስ': 'Paul',
  'ጳውሎስ': 'Paul',
  'ዘውዲቱ': 'Zewditu',
  'የካ': 'Yeka',
  'ራስ ደስታ': 'Ras Desta',
  'ደስታ': 'Desta',
  'አንዋር': 'Anwar',
  'አሚን': 'Amin',
  'ሀያት': 'Hayat',
  'ላንድማርክ': 'Landmark',
  'አል ፈውስ': 'Al Fewse',
  'በተል': 'Bethel',
  'ቤቴል': 'Bethel',
  'BM Booking': 'BM Booking'
};

/**
 * Checks if a string contains any Amharic/Ge'ez script characters.
 * @param {string} text - The input string to check.
 * @returns {boolean} True if Amharic characters are detected.
 */
const hasAmharic = (text) => {
  if (typeof text !== 'string') return false;
  return /[\u1200-\u137F\u2D80-\u2DDF\u1380-\u139F]/.test(text);
};

/**
 * Strips titles/honorifics from names in both Amharic and English.
 * E.g., "ዶ/ር ዳዊት" -> "ዳዊት", "Dr. Dawit" -> "Dawit".
 * @param {string} text - The input text.
 * @returns {string} The cleaned name.
 */
const cleanTitle = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/^(ዶክተር|ዶ\/ር|ዶር|ዶክተር፡|ዶ፡ር)\.?\s*/i, '')
    .replace(/^(dr|doctor)\.?\s*/i, '')
    .trim();
};

/**
 * Transliterates Amharic text into standard Latin characters phonetic representation.
 * @param {string} text - The input Amharic string.
 * @returns {string} The transliterated Latin string.
 */
const transliterateAmharicToEnglish = (text) => {
  if (typeof text !== 'string') return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += AMHARIC_TO_ENGLISH_MAP[char] || char;
  }
  return result;
};

/**
 * Generates common phonetic spelling variants for a given transliterated string
 * to catch phonetic spelling differences.
 * @param {string} latinText - The transliterated name in Latin.
 * @returns {string[]} An array of phonetic spelling variations.
 */
const getPhoneticVariants = (latinText) => {
  const normalized = latinText.toLowerCase().trim();
  const variants = new Set([normalized]);

  // Simplify double letters (e.g. nn -> n, ss -> s)
  const singleConsonants = normalized.replace(/([a-z])\1+/g, '$1');
  variants.add(singleConsonants);

  // Common letter mappings
  if (normalized.includes('w')) variants.add(normalized.replace(/w/g, 'v'));
  if (normalized.includes('v')) variants.add(normalized.replace(/v/g, 'w'));
  if (normalized.includes('y')) variants.add(normalized.replace(/y/g, 'i'));
  if (normalized.includes('i')) variants.add(normalized.replace(/i/g, 'y'));

  // Common consonant maps
  if (normalized.includes('c')) variants.add(normalized.replace(/c/g, 'k'));
  if (normalized.includes('q')) variants.add(normalized.replace(/q/g, 'k'));
  if (normalized.includes('k')) {
    variants.add(normalized.replace(/k/g, 'c'));
    variants.add(normalized.replace(/k/g, 'q'));
  }

  // Common Ethiopian Name/Term mappings
  if (normalized === 'yohans' || normalized === 'yohanes') {
    variants.add('yohannes');
    variants.add('yohanis');
  }
  if (normalized === 'dawit') {
    variants.add('davit');
  }
  if (normalized === 'beruk' || normalized === 'brek' || normalized === 'bruk') {
    variants.add('brook');
    variants.add('bruk');
    variants.add('beruk');
  }
  if (normalized === 'tegest' || normalized === 'tegeset' || normalized === 'tigist') {
    variants.add('tigist');
    variants.add('tegest');
  }
  if (normalized === 'tadese' || normalized === 'tades') {
    variants.add('tadesse');
    variants.add('tadasa');
  }
  if (normalized.includes('girmay')) {
    variants.add(normalized.replace('girmay', 'germay'));
  }
  if (normalized.includes('germay')) {
    variants.add(normalized.replace('germay', 'girmay'));
  }

  return Array.from(variants);
};

/**
 * Translates a search specialty or returns the original term.
 * @param {string} text - The input search specialty.
 * @returns {string} The translated specialty name (or original if not found).
 */
const translateSpecialty = (text) => {
  if (typeof text !== 'string') return '';
  const cleaned = text.trim();
  return SPECIALTY_TRANSLATIONS[cleaned] || cleaned;
};

/**
 * Translates an equipment category search term.
 * @param {string} text - The equipment search term.
 * @returns {string} The matching EquipmentCategory enum (or original).
 */
const translateEquipmentCategory = (text) => {
  if (typeof text !== 'string') return '';
  const cleaned = text.trim();
  return EQUIPMENT_CATEGORY_TRANSLATIONS[cleaned] || cleaned;
};

/**
 * Translates an Amharic hospital/facility name.
 * @param {string} text - The search input hospital name.
 * @returns {string} The translated hospital name (or original).
 */
const translateHospital = (text) => {
  if (typeof text !== 'string') return '';
  const cleaned = text.trim();
  return HOSPITAL_TRANSLATIONS[cleaned] || cleaned;
};

/**
 * Expands a search query into a comprehensive array of alternative search terms
 * to match against database records.
 * @param {string} query - The raw query string from the user.
 * @returns {string[]} An array of alternative query strings.
 */
const expandQuery = (query) => {
  if (!query || typeof query !== 'string') return [];
  const cleaned = cleanTitle(query);
  const terms = new Set([query, cleaned]);

  // Translate specialty & hospital name
  const specialtyTranslated = SPECIALTY_TRANSLATIONS[cleaned];
  if (specialtyTranslated) terms.add(specialtyTranslated);

  const hospitalTranslated = HOSPITAL_TRANSLATIONS[cleaned];
  if (hospitalTranslated) terms.add(hospitalTranslated);

  const equipCatTranslated = EQUIPMENT_CATEGORY_TRANSLATIONS[cleaned];
  if (equipCatTranslated) terms.add(equipCatTranslated);

  // If Amharic is detected, transliterate and expand phonetically
  if (hasAmharic(cleaned)) {
    const transliterated = transliterateAmharicToEnglish(cleaned);
    const variants = getPhoneticVariants(transliterated);
    variants.forEach(variant => terms.add(variant));
  }

  return Array.from(terms).filter(Boolean);
};

module.exports = {
  hasAmharic,
  cleanTitle,
  transliterateAmharicToEnglish,
  getPhoneticVariants,
  translateSpecialty,
  translateEquipmentCategory,
  translateHospital,
  expandQuery
};
