const Joi = require("joi");

const phoneRegex = /^\+251[79]\d{8}$/; // Ethiopian phone format: +251 followed by 7 or 9 and 8 digits

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const equipmentCategories = [
  'MRI', 'CT_SCAN', 'DIALYSIS', 'ULTRASOUND', 'XRAY',
  'VENTILATOR', 'ECG', 'MAMMOGRAPHY', 'DEFIBRILLATOR', 'OTHER',
];

const daySchema = Joi.object({
  start: Joi.string().pattern(timeRegex).required()
    .messages({ "string.pattern.base": "start must be in HH:MM format (e.g., 08:00)" }),
  end: Joi.string().pattern(timeRegex).required()
    .messages({ "string.pattern.base": "end must be in HH:MM format (e.g., 17:00)" }),
  duration: Joi.number().integer().min(5).max(240).optional(),
  enabled: Joi.boolean().optional(),
}).custom((value, helpers) => {
  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  if (toMins(value.start) >= toMins(value.end)) {
    return helpers.error("any.custom", {
      message: `${helpers.state.path[0]}: start (${value.start}) must be before end (${value.end})`,
    });
  }
  return value;
});

const operatingHoursSchema = Joi.object({
  monday:    daySchema.optional(),
  tuesday:   daySchema.optional(),
  wednesday: daySchema.optional(),
  thursday:  daySchema.optional(),
  friday:    daySchema.optional(),
  saturday:  daySchema.optional(),
  sunday:    daySchema.optional(),
}).min(1).messages({ "object.min": "At least one day must be specified" });

const schemas = {
  // Auth Schemas
  requestOTP: Joi.object({
    phone: Joi.string().regex(phoneRegex).required().messages({
      "string.pattern.base":
        "Phone number must be a valid Ethiopian number (+251...)",
    }),
    role: Joi.string().valid("patient", "doctor", "receptionist").optional(),
    isRegistration: Joi.boolean().default(false),
  }),

  createPatientByReceptionist: Joi.object({
    phone: Joi.string().regex(phoneRegex).required().messages({
      "string.pattern.base": "Phone number must be a valid Ethiopian number (+251...)",
    }),
    fullName: Joi.string().min(2).max(100).required(),
    gender: Joi.string().valid("male", "female").optional(),
    dateOfBirth: Joi.date().iso().optional(),
    emergencyContact: Joi.string().optional(),
  }),

  verifyOTP: Joi.object({
    phone: Joi.string().regex(phoneRegex).required(),
    code: Joi.string().length(6).required(),
    role: Joi.string().valid("patient", "doctor", "receptionist").optional(),
    isRegistration: Joi.boolean().default(false),
  }),

  receptionistLogin: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),

  createSchedule: Joi.object({
    doctorId: Joi.number().required(),
    date: Joi.date().iso().required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    slotDuration: Joi.number().integer().min(1).default(30),
    maxPatientsPerSlot: Joi.number().integer().min(1).default(1),
    repeatWeeks: Joi.number().integer().min(1).max(1560).optional(),
    daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
    repeatEndDate: Joi.date().iso().optional(),
    isActive: Joi.boolean().optional(),
    clinicRoom: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional(),
  }),

  createSelfSchedule: Joi.object({
    date: Joi.date().iso().required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    slotDuration: Joi.number().integer().min(1).default(30),
    maxPatientsPerSlot: Joi.number().integer().min(1).default(1),
    repeatWeeks: Joi.number().integer().min(1).max(1560).optional(),
    daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
    repeatEndDate: Joi.date().iso().optional(),
    isActive: Joi.boolean().optional(),
    clinicRoom: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional(),
    hospitalId: Joi.number().allow(null).optional(),
  }),

  updateSchedule: Joi.object({
    doctorId: Joi.number().optional(),
    date: Joi.date().iso().optional(),
    startTime: Joi.date().iso().optional(),
    endTime: Joi.date().iso().optional(),
    slotDuration: Joi.number().integer().min(1).optional(),
    maxPatientsPerSlot: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().optional(),
    clinicRoom: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional(),
  }),

  registerDoctorByReceptionist: Joi.object({
    fullName: Joi.string().min(3).max(100).required(),
    phone: Joi.string().regex(phoneRegex).required(),
    email: Joi.string().email().optional().allow(null, ''),
    specialization: Joi.string().max(100).optional().allow(null, ''),
    licenseNumber: Joi.string().max(100).optional().allow(null, ''),
    experienceYears: Joi.number().integer().min(0).optional(),
    bio: Joi.string().max(2000).optional().allow(null, ''),
    profilePicture: Joi.any().optional(),
    introVideo: Joi.any().optional(),
  }),

  assignDoctorHospital: Joi.object({
    hospitalId: Joi.number().integer().required(),
  }),

  // Doctor Profile Schema
  doctorProfile: Joi.object({
    fullName: Joi.string().min(3).max(100).required(),
    specialization: Joi.string().min(2).max(100).required(),
    specializations: Joi.alternatives().try(
      Joi.array().items(Joi.string()).min(1).max(2),
      Joi.string().allow('') // JSON string from FormData
    ).optional(),
    experienceYears: Joi.number().integer().min(0).max(60).required(),
    bio: Joi.string().min(10).max(1000).required(),
    clinicName: Joi.string().max(100).allow('').optional(),
    clinicAddress: Joi.string().max(200).allow('').optional(),
    languages: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string(), // For form-data
    ).optional(),
    licenseNumber: Joi.string().required(),
    availability: Joi.any().optional(),
    hospitalId: Joi.number().integer().optional(),
    // Files are validated by multer, but we can check the body parts here
    profilePicture: Joi.any(),
    introVideo: Joi.any(),
    removeIntroVideo: Joi.string().optional(),
  }),

  updateAvailability: Joi.object({
    availability: Joi.array().items(Joi.object({
      id: Joi.string().optional(),
      day: Joi.string().required(),
      startTime: Joi.string().required(),
      endTime: Joi.string().required(),
      location: Joi.string().required()
    })).min(1).required()
  }),

  // Appointment Schemas
  createAppointment: Joi.object({
    doctorId: Joi.number().required(),
    dateTime: Joi.date().iso().required(),
    fee: Joi.number().min(0).required(),
    reason: Joi.string().max(200).allow('').optional(),
    issueCategory: Joi.string().allow(null, '').optional(),
    notes: Joi.string().max(1000).allow('').optional(),
    attachments: Joi.array().items(Joi.string()),
    slotId: Joi.number().integer().optional(),
    paymentMethod: Joi.string().valid('service_fee', 'full', 'card').optional(),
    cardId: Joi.number().integer().optional(),
    paidCardFee: Joi.boolean().optional(),
    otherPatientDetails: Joi.object({
      fullName: Joi.string().min(2).max(100).required(),
      phone: Joi.string().regex(/^\+251[79]\d{8}$/).required().messages({
        "string.pattern.base": "Phone number must be a valid Ethiopian number (+251...)",
      }),
      gender: Joi.string().custom((val, helpers) => {
        const lower = val.toLowerCase();
        if (!['male', 'female'].includes(lower)) {
          return helpers.error('any.invalid');
        }
        return lower;
      }).optional(),
      dateOfBirth: Joi.date().iso().optional(),
      bloodType: Joi.string().valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-").optional(),
    }).optional(),
  }),

  createAppointmentForPatient: Joi.object({
    patientId: Joi.number().required(),
    doctorId: Joi.number().required(),
    dateTime: Joi.date().iso().required(),
    fee: Joi.number().min(0).optional(),
    reason: Joi.string().max(200).allow('').optional(),
    issueCategory: Joi.string().allow(null, '').optional(),
    notes: Joi.string().max(1000).allow('').optional(),
    slotId: Joi.number().integer().optional(),
    paymentMethod: Joi.string().valid('service_fee', 'full', 'card', 'none').optional(),
    cardId: Joi.number().integer().optional(),
    paidCardFee: Joi.boolean().optional(),
    cardFeeAmount: Joi.number().min(0).optional(),
    templateId: Joi.number().integer().optional(),
  }),

  approveAppointment: Joi.object({
    slotId: Joi.number().integer().optional(),
  }),

  declineAppointment: Joi.object({
    reason: Joi.string().min(3).max(500).required(),
  }),

  receptionistDenyAppointment: Joi.object({
    reason: Joi.string().min(3).max(500).required(),
  }),

  createEquipmentBooking: Joi.object({
    equipmentId: Joi.number().required(),
    dateTime: Joi.date().iso().required(),
    notes: Joi.string().max(500).optional(),
    fee: Joi.number().min(0).optional(),
  }),

  declineEquipmentBooking: Joi.object({
    reason: Joi.string().min(3).max(500).required(),
  }),

  createEquipment: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    category: Joi.string().valid(...equipmentCategories).required(),
    hospitalId: Joi.number().required(),
    price: Joi.number().min(0).optional(),
    operatingHours: operatingHoursSchema.optional(),
    duration: Joi.number().integer().min(10).default(30),
    isOperational: Joi.boolean().default(true),
    description: Joi.string().max(1000).optional(),
    photo: Joi.any(),
  }),

  createEquipmentByReceptionist: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    category: Joi.string().valid(...equipmentCategories).required(),
    price: Joi.number().min(0).optional(),
    operatingHours: Joi.any(),
    duration: Joi.number().integer().min(10).default(30),
    isOperational: Joi.boolean().default(true),
    description: Joi.string().max(1000).optional(),
    photo: Joi.any(),
  }),

  createEquipmentBookingByReceptionist: Joi.object({
    patientId: Joi.number().integer().required(),
    equipmentId: Joi.number().integer().required(),
    dateTime: Joi.date().iso().required(),
    fee: Joi.number().min(0).optional(),
    notes: Joi.string().max(500).allow(null, '').optional(),
  }),

  updateEquipment: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    category: Joi.string().optional(),
    operatingHours: operatingHoursSchema.optional(),
    duration: Joi.number().integer().min(10).optional(),
    isOperational: Joi.boolean().optional(),
    price: Joi.number().min(0).optional().allow(null),
    description: Joi.string().max(1000).optional(),
    photo: Joi.any(),
    hospitalId: Joi.number().optional(),
  }),

  createEquipmentAnnouncement: Joi.object({
    title: Joi.string().min(2).max(200).required(),
    message: Joi.string().min(5).max(1000).required(),
    category: Joi.string().required(),
    hospitalId: Joi.number().optional(),
    equipmentId: Joi.number().optional(),
  }),

  rescheduleAppointment: Joi.object({
    dateTime: Joi.date().iso().required(),
  }),

  updateAppointmentNotes: Joi.object({
    notes: Joi.string().max(1000).allow(null, '').optional(),
    reason: Joi.string().max(200).allow(null, '').optional(),
    issueCategory: Joi.string().allow(null, '').optional(),
  }).min(1),

  rescheduleEquipmentBooking: Joi.object({
    dateTime: Joi.date().iso().required(),
  }),

  updateEquipmentBookingNotes: Joi.object({
    notes: Joi.string().max(500).allow(null, '').optional(),
  }).min(1),

  createHospital: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    cardPrice: Joi.number().min(0).required(),
    address: Joi.string().max(500).allow(null, '').optional(),
    phone: Joi.string().max(30).allow(null, '').optional(),
    email: Joi.string().email().allow(null, '').optional(),
    latitude: Joi.number().min(-90).max(90).allow(null).optional(),
    longitude: Joi.number().min(-180).max(180).allow(null).optional(),
    image: Joi.string().allow(null, '').optional(),
  }),

  updateHospital: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    cardPrice: Joi.number().min(0).optional(),
    address: Joi.string().max(500).allow(null, '').optional(),
    phone: Joi.string().max(30).allow(null, '').optional(),
    email: Joi.string().email().allow(null, '').optional(),
    latitude: Joi.number().min(-90).max(90).allow(null).optional(),
    longitude: Joi.number().min(-180).max(180).allow(null).optional(),
    image: Joi.string().allow(null, '').optional(),
  }).min(1),

  updateReceptionist: Joi.object({
    username: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(50).optional()
      .messages({ "string.pattern.base": "Username may only contain letters, numbers, and underscores" }),
    password: Joi.string().min(8).optional(),
    hospitalId: Joi.number().integer().optional(),
    phone: Joi.string().regex(phoneRegex).optional().allow(null, ''),
    email: Joi.string().email().optional().allow(null, ''),
  }).min(1).messages({ "object.min": "At least one field must be provided for update" }),

  createReceptionist: Joi.object({
    username: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(50).required()
      .messages({ "string.pattern.base": "Username may only contain letters, numbers, and underscores" }),
    password: Joi.string().min(8).required(),
    hospitalId: Joi.number().integer().required(),
    phone: Joi.string().regex(phoneRegex).optional(),
    email: Joi.string().email().optional(),
  }),

  updateHospitalCardPrice: Joi.object({
    cardPrice: Joi.number().min(0).required(),
  }),

  // Card template schemas
  createCardTemplate: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    price: Joi.number().min(0).required(),
  }),

  updateCardTemplate: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    price: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional(),
  }).min(1),

  // Patient card schemas
  issueCard: Joi.object({
    patientId: Joi.number().integer().required(),
    templateId: Joi.number().integer().optional(),
    expiresAt: Joi.date().iso().optional(),
    price: Joi.number().min(0).optional(),
    isPaid: Joi.boolean().optional(),
  }),

  extendCard: Joi.object({
    expiresAt: Joi.date().iso().required(),
  }),

  // Service fee schema
  setServiceFee: Joi.object({
    amount: Joi.number().min(0).allow(null).required(),
  }),

  createFollowUp: Joi.object({
    dateTime: Joi.date().iso().required(),
    slotId: Joi.number().integer().optional(),
    reason: Joi.string().max(200).allow('').optional(),
    issueCategory: Joi.string().allow(null, '').optional(),
    notes: Joi.string().max(1000).allow('').optional(),
  }),

  reorderAppointments: Joi.object({
    doctorId: Joi.number().integer().required(),
    date: Joi.date().iso().required(),
    orderedSlots: Joi.array().items(Joi.number().integer().allow(null)).min(1).required(),
  }),
};

module.exports = schemas;
