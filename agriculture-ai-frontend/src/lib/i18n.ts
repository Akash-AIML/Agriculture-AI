export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

type Dict = {
  brand: string;
  brandSub: string;
  systemReady: string;
  nav: { disease: string; soil: string; crop: string; advice: string };

  disease: {
    title: string;
    subtitle: string;
    workflowId: string;
    dropTitle: string;
    dropHint: string;
    select: string;
    analyzing: string;
    result: string;
    confidence: string;
    urgency: string;
    urgencyLow: string;
    urgencyMid: string;
    urgencyHigh: string;
    action: string;
    reset: string;
    error: string;
  };

  soil: {
    title: string;
    subtitle: string;
    workflowId: string;
    dropTitle: string;
    dropHint: string;
    select: string;
    analyzing: string;
    result: string;
    confidence: string;
    properties: string;
    reset: string;
    error: string;
  };

  crop: {
    title: string;
    subtitle: string;
    n: string;
    p: string;
    k: string;
    temperature: string;
    humidity: string;
    ph: string;
    rainfall: string;
    acidic: string;
    alkaline: string;
    submit: string;
    submitting: string;
    ranked: string;
    match: string;
    error: string;
  };

  advice: {
    title: string;
    subtitle: string;
    context: string;
    noContext: string;
    ask: string;
    placeholder: string;
    streaming: string;
    error: string;
  };
};

const en: Dict = {
  brand: "TERRA·AI",
  brandSub: "Precision Agriculture",
  systemReady: "SYSTEM_READY.v2",
  nav: {
    disease: "Disease Detection",
    soil: "Soil Analysis",
    crop: "Crop Suggestion",
    advice: "Expert Advice",
  },
  disease: {
    title: "Plant Disease Detection",
    subtitle: "Upload a clear photo of the leaf surface for AI diagnosis.",
    workflowId: "AGRI-DIA-01",
    dropTitle: "Drop leaf photo here",
    dropHint: "JPEG or PNG up to 10 MB",
    select: "Select Photo",
    analyzing: "Analyzing…",
    result: "Detection Result",
    confidence: "Confidence",
    urgency: "Treatment Urgency",
    urgencyLow: "Low",
    urgencyMid: "Moderate",
    urgencyHigh: "High",
    action: "Recommended Action",
    reset: "New Scan",
    error: "Analysis failed. Check the backend is running.",
  },
  soil: {
    title: "Soil Analysis",
    subtitle: "Photograph the topsoil to classify texture and properties.",
    workflowId: "AGRI-SOIL-02",
    dropTitle: "Drop soil photo here",
    dropHint: "JPEG or PNG up to 10 MB",
    select: "Select Photo",
    analyzing: "Analyzing…",
    result: "Soil Class",
    confidence: "Confidence",
    properties: "Soil Properties",
    reset: "New Sample",
    error: "Analysis failed. Check the backend is running.",
  },
  crop: {
    title: "Crop Intelligence",
    subtitle: "Simulate conditions to find the optimal crop for your land.",
    n: "Nitrogen (N)",
    p: "Phosphorus (P)",
    k: "Potassium (K)",
    temperature: "Temperature (°C)",
    humidity: "Humidity (%)",
    ph: "Soil pH Level",
    rainfall: "Rainfall (mm)",
    acidic: "0.0 ACIDIC",
    alkaline: "14.0 ALKALINE",
    submit: "Generate Recommendations",
    submitting: "Computing…",
    ranked: "Ranked Suitability",
    match: "Match",
    error: "Recommendation failed. Check the backend is running.",
  },
  advice: {
    title: "Expert Advice",
    subtitle: "Combine your scans for a personalized, streamed recommendation.",
    context: "Context assembled",
    noContext: "Run a Disease, Soil, or Crop workflow first to build context.",
    ask: "Ask the advisor",
    placeholder: "Add a question or leave blank for a general briefing…",
    streaming: "Streaming…",
    error: "Advice stream failed. Check the backend and API key.",
  },
};

const ta: Dict = {
  brand: "TERRA·AI",
  brandSub: "துல்லிய வேளாண்மை",
  systemReady: "கணினி_தயார்.v2",
  nav: {
    disease: "நோய் கண்டறிதல்",
    soil: "மண் பகுப்பாய்வு",
    crop: "பயிர் பரிந்துரை",
    advice: "நிபுணர் ஆலோசனை",
  },
  disease: {
    title: "தாவர நோய் கண்டறிதல்",
    subtitle: "இலையின் தெளிவான புகைப்படத்தை பதிவேற்றவும்.",
    workflowId: "AGRI-DIA-01",
    dropTitle: "இலை படத்தை இங்கே விடுங்கள்",
    dropHint: "JPEG அல்லது PNG, 10 MB வரை",
    select: "புகைப்படம் தேர்ந்தெடு",
    analyzing: "பகுப்பாய்வு…",
    result: "கண்டறிதல் முடிவு",
    confidence: "நம்பகத்தன்மை",
    urgency: "சிகிச்சை அவசரம்",
    urgencyLow: "குறைவு",
    urgencyMid: "நடுத்தரம்",
    urgencyHigh: "அதிகம்",
    action: "பரிந்துரைக்கப்பட்ட நடவடிக்கை",
    reset: "புதிய ஸ்கேன்",
    error: "பகுப்பாய்வு தோல்வி. பின்தள சேவையை சரிபார்க்கவும்.",
  },
  soil: {
    title: "மண் பகுப்பாய்வு",
    subtitle: "மண்ணின் மேற்பரப்பை புகைப்படம் எடுக்கவும்.",
    workflowId: "AGRI-SOIL-02",
    dropTitle: "மண் படத்தை இங்கே விடுங்கள்",
    dropHint: "JPEG அல்லது PNG, 10 MB வரை",
    select: "புகைப்படம் தேர்ந்தெடு",
    analyzing: "பகுப்பாய்வு…",
    result: "மண் வகை",
    confidence: "நம்பகத்தன்மை",
    properties: "மண் பண்புகள்",
    reset: "புதிய மாதிரி",
    error: "பகுப்பாய்வு தோல்வி.",
  },
  crop: {
    title: "பயிர் நுண்ணறிவு",
    subtitle: "உங்கள் நிலத்திற்கு சிறந்த பயிரை கண்டறியவும்.",
    n: "நைட்ரஜன் (N)",
    p: "பாஸ்பரஸ் (P)",
    k: "பொட்டாசியம் (K)",
    temperature: "வெப்பநிலை (°C)",
    humidity: "ஈரப்பதம் (%)",
    ph: "மண் pH",
    rainfall: "மழை (mm)",
    acidic: "0.0 அமிலம்",
    alkaline: "14.0 காரம்",
    submit: "பரிந்துரைகளை உருவாக்கு",
    submitting: "கணக்கிடுகிறது…",
    ranked: "தரவரிசை",
    match: "பொருத்தம்",
    error: "பரிந்துரை தோல்வி.",
  },
  advice: {
    title: "நிபுணர் ஆலோசனை",
    subtitle: "உங்கள் தரவை சேர்த்து தனிப்பயன் ஆலோசனை பெறுங்கள்.",
    context: "தொகுக்கப்பட்ட சூழல்",
    noContext: "முதலில் ஒரு பணிப்பாய்வை இயக்கவும்.",
    ask: "ஆலோசகரிடம் கேளுங்கள்",
    placeholder: "கேள்வியை சேர்க்கவும் அல்லது காலியாக விடவும்…",
    streaming: "ஸ்ட்ரீமிங்…",
    error: "ஆலோசனை தோல்வி.",
  },
};

const hi: Dict = {
  brand: "TERRA·AI",
  brandSub: "सटीक कृषि",
  systemReady: "सिस्टम_तैयार.v2",
  nav: {
    disease: "रोग पहचान",
    soil: "मिट्टी विश्लेषण",
    crop: "फसल सुझाव",
    advice: "विशेषज्ञ सलाह",
  },
  disease: {
    title: "पौध रोग पहचान",
    subtitle: "एआई निदान के लिए पत्ती की स्पष्ट तस्वीर अपलोड करें।",
    workflowId: "AGRI-DIA-01",
    dropTitle: "पत्ती की तस्वीर यहाँ छोड़ें",
    dropHint: "JPEG या PNG, 10 MB तक",
    select: "फोटो चुनें",
    analyzing: "विश्लेषण…",
    result: "निदान परिणाम",
    confidence: "विश्वास",
    urgency: "उपचार तात्कालिकता",
    urgencyLow: "कम",
    urgencyMid: "मध्यम",
    urgencyHigh: "उच्च",
    action: "अनुशंसित कार्रवाई",
    reset: "नई स्कैन",
    error: "विश्लेषण विफल। बैकएंड जांचें।",
  },
  soil: {
    title: "मिट्टी विश्लेषण",
    subtitle: "मिट्टी की सतह की तस्वीर लें।",
    workflowId: "AGRI-SOIL-02",
    dropTitle: "मिट्टी की तस्वीर यहाँ छोड़ें",
    dropHint: "JPEG या PNG, 10 MB तक",
    select: "फोटो चुनें",
    analyzing: "विश्लेषण…",
    result: "मिट्टी वर्ग",
    confidence: "विश्वास",
    properties: "मिट्टी के गुण",
    reset: "नया नमूना",
    error: "विश्लेषण विफल।",
  },
  crop: {
    title: "फसल बुद्धिमत्ता",
    subtitle: "अपनी भूमि के लिए सबसे उपयुक्त फसल खोजें।",
    n: "नाइट्रोजन (N)",
    p: "फास्फोरस (P)",
    k: "पोटैशियम (K)",
    temperature: "तापमान (°C)",
    humidity: "आर्द्रता (%)",
    ph: "मिट्टी pH",
    rainfall: "वर्षा (mm)",
    acidic: "0.0 अम्लीय",
    alkaline: "14.0 क्षारीय",
    submit: "सिफारिशें बनाएँ",
    submitting: "गणना हो रही है…",
    ranked: "क्रमबद्ध उपयुक्तता",
    match: "मिलान",
    error: "सिफारिश विफल।",
  },
  advice: {
    title: "विशेषज्ञ सलाह",
    subtitle: "व्यक्तिगत सलाह के लिए अपने डेटा को संयोजित करें।",
    context: "संदर्भ तैयार",
    noContext: "पहले कोई वर्कफ़्लो चलाएँ।",
    ask: "सलाहकार से पूछें",
    placeholder: "प्रश्न जोड़ें या खाली छोड़ दें…",
    streaming: "स्ट्रीमिंग…",
    error: "सलाह विफल।",
  },
};

const te: Dict = {
  brand: "TERRA·AI",
  brandSub: "ఖచ్చిత వ్యవసాయం",
  systemReady: "సిస్టమ్_రెడీ.v2",
  nav: {
    disease: "వ్యాధి గుర్తింపు",
    soil: "నేల విశ్లేషణ",
    crop: "పంట సూచన",
    advice: "నిపుణుల సలహా",
  },
  disease: {
    title: "మొక్క వ్యాధి గుర్తింపు",
    subtitle: "AI నిర్ధారణ కోసం ఆకు ఫోటోను అప్‌లోడ్ చేయండి.",
    workflowId: "AGRI-DIA-01",
    dropTitle: "ఆకు ఫోటోను ఇక్కడ వదలండి",
    dropHint: "JPEG లేదా PNG, 10 MB వరకు",
    select: "ఫోటో ఎంచుకోండి",
    analyzing: "విశ్లేషిస్తోంది…",
    result: "గుర్తింపు ఫలితం",
    confidence: "విశ్వాసం",
    urgency: "చికిత్స అత్యవసరం",
    urgencyLow: "తక్కువ",
    urgencyMid: "మధ్యస్థం",
    urgencyHigh: "అధిక",
    action: "సిఫార్సు చేయబడిన చర్య",
    reset: "కొత్త స్కాన్",
    error: "విశ్లేషణ విఫలం.",
  },
  soil: {
    title: "నేల విశ్లేషణ",
    subtitle: "నేల ఉపరితలం ఫోటో తీయండి.",
    workflowId: "AGRI-SOIL-02",
    dropTitle: "నేల ఫోటోను ఇక్కడ వదలండి",
    dropHint: "JPEG లేదా PNG, 10 MB వరకు",
    select: "ఫోటో ఎంచుకోండి",
    analyzing: "విశ్లేషిస్తోంది…",
    result: "నేల తరగతి",
    confidence: "విశ్వాసం",
    properties: "నేల లక్షణాలు",
    reset: "కొత్త నమూనా",
    error: "విశ్లేషణ విఫలం.",
  },
  crop: {
    title: "పంట మేధస్సు",
    subtitle: "మీ భూమికి అనువైన పంటను కనుగొనండి.",
    n: "నత్రజని (N)",
    p: "భాస్వరం (P)",
    k: "పొటాషియం (K)",
    temperature: "ఉష్ణోగ్రత (°C)",
    humidity: "తేమ (%)",
    ph: "నేల pH",
    rainfall: "వర్షపాతం (mm)",
    acidic: "0.0 ఆమ్లం",
    alkaline: "14.0 క్షారం",
    submit: "సిఫార్సులను రూపొందించండి",
    submitting: "గణిస్తోంది…",
    ranked: "ర్యాంక్ చేసిన అనుకూలత",
    match: "సరిపోలిక",
    error: "సిఫార్సు విఫలం.",
  },
  advice: {
    title: "నిపుణుల సలహా",
    subtitle: "వ్యక్తిగత సలహా కోసం మీ డేటాను కలపండి.",
    context: "సందర్భం సిద్ధం",
    noContext: "మొదట ఒక వర్క్‌ఫ్లోను అమలు చేయండి.",
    ask: "సలహాదారుని అడగండి",
    placeholder: "ప్రశ్న జోడించండి లేదా ఖాళీగా ఉంచండి…",
    streaming: "స్ట్రీమింగ్…",
    error: "సలహా విఫలం.",
  },
};

export const TRANSLATIONS: Record<LangCode, Dict> = { en, ta, hi, te };
