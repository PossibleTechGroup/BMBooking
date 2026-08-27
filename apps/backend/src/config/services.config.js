/**
 * Master list of clinical services hospitals can provide and patients can search.
 * Used for: hospital registration service picker, patient service search, and
 * mapping doctors (by specialization) to the same service vocabulary.
 */
const SERVICES = [
  { key: "general", label: "General Checkup", suggestions: ["general", "checkup", "fitness", "general practitioner", "gp"] },
  { key: "dental", label: "Dental", suggestions: ["dental", "dentist", "teeth", "orthodontics", "dental clinic"] },
  { key: "orthopedics", label: "Orthopedics / Bone & Joint", suggestions: ["orthopedic", "orthopaedics", "bone", "joint", "fracture", "spine"] },
  { key: "cardiology", label: "Cardiology / Heart", suggestions: ["cardiology", "cardiac", "heart", "cardiologist"] },
  { key: "dermatology", label: "Dermatology / Skin", suggestions: ["dermatology", "dermatologist", "skin"] },
  { key: "eye_care", label: "Eye Care / Ophthalmology", suggestions: ["eye", "ophthalmology", "ophthalmologist", "vision", "optometry"] },
  { key: "neurology", label: "Neurology / Brain & Nerves", suggestions: ["neurology", "neurologist", "brain", "nerve", "neuro"] },
  { key: "ent", label: "ENT / Ear, Nose & Throat", suggestions: ["ent", "ear", "nose", "throat", "otorhinolaryngology"] },
  { key: "gastroenterology", label: "Gastroenterology / Digestive", suggestions: ["gastroenterology", "digestive", "stomach", "gastro"] },
  { key: "pediatrics", label: "Pediatrics / Children", suggestions: ["pediatrics", "paediatrics", "pediatrician", "child", "children"] },
  { key: "gynecology", label: "Gynecology / Women's Health", suggestions: ["gynecology", "gynaecology", "women", "obstetrics", "maternity"] },
  { key: "urology", label: "Urology", suggestions: ["urology", "urologist", "kidney", "urinary"] },
  { key: "psychiatry", label: "Psychiatry / Mental Health", suggestions: ["psychiatry", "psychiatrist", "mental health", "psychology"] },
  { key: "pulmonology", label: "Pulmonology / Lungs", suggestions: ["pulmonology", "lungs", "respiratory", "chest"] },
  { key: "laboratory", label: "Laboratory / Lab Tests", suggestions: ["laboratory", "lab", "blood test", "test", "x-ray", "radiology", "imaging"] },
  { key: "pharmacy", label: "Pharmacy", suggestions: ["pharmacy", "pharmacist", "medicine", "drugs"] },
  { key: "emergency", label: "Emergency / 24/7", suggestions: ["emergency", "urgent", "casualty", "accident", "24/7"] },
  { key: "maternity", label: "Maternity & Delivery", suggestions: ["maternity", "delivery", "birth", "labor"] },
];

const getServiceLabels = () => SERVICES.map((s) => s.label);

/**
 * Resolve arbitrary user input (service name from registration form or search) to
 * a canonical service label OR return the raw input when no match is found.
 */
const resolveServiceLabel = (input) => {
  const term = String(input || "").trim().toLowerCase();
  if (!term) return null;
  const match = SERVICES.find(
    (s) =>
      s.label.toLowerCase() === term ||
      // match the first word of the label (e.g. "Dental")
      s.suggestions.some((sug) => term.includes(sug) || sug.includes(term))
  );
  return match ? match.label : null;
};

module.exports = { SERVICES, getServiceLabels, resolveServiceLabel };
