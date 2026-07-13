/**
 * Issue Category → Recommended Documents Configuration
 * 
 * Each category maps to a list of optional documents that patients 
 * are recommended to bring or upload when booking an appointment.
 * These are suggestions, not requirements.
 */
const recommendations = {
  general: {
    label: 'General Checkup',
    icon: 'fitness-outline',
    documents: [
      { key: 'blood_test', label: 'Blood Test Results', description: 'Recent CBC or blood panel (within 3 months)' },
      { key: 'medical_history', label: 'Medical History Summary', description: 'List of current medications and past conditions' },
      { key: 'vitals', label: 'Recent Vitals Record', description: 'Blood pressure, heart rate readings if available' }
    ]
  },
  dental: {
    label: 'Dental',
    icon: 'happy-outline',
    documents: [
      { key: 'dental_xray', label: 'Dental X-Ray', description: 'Panoramic or periapical X-ray if available' },
      { key: 'dental_history', label: 'Previous Dental Records', description: 'Past treatment records from other dentists' }
    ]
  },
  orthopedics: {
    label: 'Orthopedics / Bone & Joint',
    icon: 'body-outline',
    documents: [
      { key: 'mri', label: 'MRI Scan', description: 'Recent MRI of the affected area' },
      { key: 'xray', label: 'X-Ray', description: 'X-ray images of the affected area' },
      { key: 'blood_test', label: 'Blood Test Results', description: 'CBC and inflammatory markers' },
      { key: 'ct_scan', label: 'CT Scan', description: 'CT scan if previously done' }
    ]
  },
  cardiology: {
    label: 'Cardiology / Heart',
    icon: 'heart-outline',
    documents: [
      { key: 'ecg', label: 'ECG/EKG Report', description: 'Recent electrocardiogram' },
      { key: 'echo', label: 'Echocardiogram', description: 'Heart ultrasound report' },
      { key: 'blood_test', label: 'Blood Test', description: 'Lipid panel and cardiac markers' },
      { key: 'stress_test', label: 'Stress Test Report', description: 'Treadmill or pharmacological stress test' }
    ]
  },
  dermatology: {
    label: 'Dermatology / Skin',
    icon: 'color-palette-outline',
    documents: [
      { key: 'skin_photos', label: 'Photos of Affected Area', description: 'Clear photos showing the skin condition' },
      { key: 'biopsy', label: 'Biopsy Results', description: 'Skin biopsy report if previously done' },
      { key: 'allergy_test', label: 'Allergy Test Results', description: 'Patch test or blood allergy panel' }
    ]
  },
  eye_care: {
    label: 'Eye Care / Ophthalmology',
    icon: 'eye-outline',
    documents: [
      { key: 'eye_exam', label: 'Previous Eye Exam', description: 'Most recent eye examination report' },
      { key: 'prescription', label: 'Current Glasses/Lens Prescription', description: 'Your current prescription if you wear corrective lenses' },
      { key: 'oct_scan', label: 'OCT Scan', description: 'Optical coherence tomography if available' }
    ]
  },
  neurology: {
    label: 'Neurology / Brain & Nerves',
    icon: 'flash-outline',
    documents: [
      { key: 'mri_brain', label: 'Brain MRI', description: 'Recent MRI of the brain' },
      { key: 'eeg', label: 'EEG Report', description: 'Electroencephalogram results' },
      { key: 'ct_brain', label: 'Brain CT Scan', description: 'CT scan of the head' },
      { key: 'nerve_study', label: 'Nerve Conduction Study', description: 'EMG/NCS report if available' }
    ]
  },
  ent: {
    label: 'ENT / Ear, Nose & Throat',
    icon: 'ear-outline',
    documents: [
      { key: 'hearing_test', label: 'Hearing Test (Audiogram)', description: 'Recent audiometry results' },
      { key: 'ct_sinus', label: 'Sinus CT Scan', description: 'CT scan of sinuses if available' },
      { key: 'allergy_test', label: 'Allergy Test Results', description: 'Allergy panel results' }
    ]
  },
  gastroenterology: {
    label: 'Gastroenterology / Digestive',
    icon: 'nutrition-outline',
    documents: [
      { key: 'endoscopy', label: 'Endoscopy Report', description: 'Upper or lower endoscopy results' },
      { key: 'ultrasound', label: 'Abdominal Ultrasound', description: 'Abdominal ultrasound report' },
      { key: 'blood_test', label: 'Blood Test', description: 'Liver function, amylase, lipase panels' },
      { key: 'stool_test', label: 'Stool Test Results', description: 'Recent stool analysis' }
    ]
  },
  pediatrics: {
    label: 'Pediatrics / Children',
    icon: 'people-outline',
    documents: [
      { key: 'vaccination_card', label: 'Vaccination Card', description: "Child's immunization record" },
      { key: 'growth_chart', label: 'Growth Chart', description: 'Height and weight tracking records' },
      { key: 'birth_record', label: 'Birth Record', description: 'Birth certificate or hospital records' }
    ]
  },
  gynecology: {
    label: 'Gynecology / Women\'s Health',
    icon: 'female-outline',
    documents: [
      { key: 'ultrasound', label: 'Pelvic Ultrasound', description: 'Recent pelvic ultrasound report' },
      { key: 'pap_smear', label: 'Pap Smear Results', description: 'Most recent cervical screening' },
      { key: 'hormonal_panel', label: 'Hormonal Panel', description: 'Blood hormone level tests' }
    ]
  },
  urology: {
    label: 'Urology',
    icon: 'medkit-outline',
    documents: [
      { key: 'ultrasound', label: 'Kidney/Bladder Ultrasound', description: 'Renal ultrasound report' },
      { key: 'urine_test', label: 'Urine Analysis', description: 'Recent urinalysis results' },
      { key: 'psa_test', label: 'PSA Test', description: 'Prostate-specific antigen test for men' }
    ]
  },
  psychiatry: {
    label: 'Psychiatry / Mental Health',
    icon: 'pulse-outline',
    documents: [
      { key: 'medical_history', label: 'Medication History', description: 'List of current and past psychiatric medications' },
      { key: 'referral', label: 'Referral Letter', description: 'Referral from primary care or other specialist' },
      { key: 'assessment', label: 'Previous Assessment', description: 'Any past psychological evaluations' }
    ]
  },
  pulmonology: {
    label: 'Pulmonology / Lungs',
    icon: 'cloud-outline',
    documents: [
      { key: 'chest_xray', label: 'Chest X-Ray', description: 'Recent chest radiograph' },
      { key: 'pft', label: 'Pulmonary Function Test', description: 'Spirometry or PFT results' },
      { key: 'ct_chest', label: 'Chest CT Scan', description: 'CT scan of the chest' }
    ]
  }
};

/**
 * Get all available issue categories (for the patient to select from)
 */
const getAllCategories = () => {
  return Object.entries(recommendations).map(([key, value]) => ({
    key,
    label: value.label,
    icon: value.icon
  }));
};

/**
 * Get recommended documents for a specific category
 */
const getRecommendationsForCategory = (category) => {
  const cat = recommendations[category];
  if (!cat) return null;
  return {
    category: category,
    label: cat.label,
    documents: cat.documents
  };
};

module.exports = { recommendations, getAllCategories, getRecommendationsForCategory };
