const prisma = require("../lib/prisma");
const WalletService = require("./wallet.service");
const { NotificationService, NOTIFICATION_TYPES } = require("./notification.service");
const SmsService = require("./sms.service");
const ReceptionistService = require("./receptionist.service");
const { generateConfirmationCode } = require("../utils/confirmationCode");
const { formatEthiopianLocalDateTimeDual } = require("../utils/dateFormat");
const {
  getRecommendationsForCategory,
  getAllCategories,
} = require("../config/recommendations.config");

const AppointmentService = {
  // ─── Patient Actions ───────────────────────────────────────────────

  createAppointment: async (patientId, data, isReceptionist = false) => {
    let status = "accepted";

    // Handle "Book for Someone Else" - register or find patient on-the-fly
    let actualPatientId = patientId;
    let bookedById = null;

    if (data.otherPatientDetails) {
      const { fullName, phone, gender, dateOfBirth, bloodType } = data.otherPatientDetails;
      const normalizedGender = gender ? gender.toLowerCase() : null;

      // Check if a user with this phone already exists
      let otherUser = await prisma.user.findUnique({ where: { phone } });

      if (otherUser) {
        actualPatientId = otherUser.id;

        // If the current user has booked for this patient before, update their profile
        const hasBookedBefore = await prisma.appointment.findFirst({
          where: {
            patientId: otherUser.id,
            bookedById: patientId,
          },
        });

        if (hasBookedBefore) {
          await prisma.patientProfile.update({
            where: { userId: otherUser.id },
            data: {
              fullName: fullName || undefined,
              gender: normalizedGender || undefined,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
              bloodType: bloodType || undefined,
            },
          });
        }
      } else {
        // Register new patient on-the-fly
        otherUser = await prisma.user.create({
          data: {
            phone,
            role: "patient",
          },
        });

          await prisma.patientProfile.create({
            data: {
              userId: otherUser.id,
              fullName: fullName || null,
              gender: normalizedGender || null,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            bloodType: bloodType || null,
          },
        });

        actualPatientId = otherUser.id;
      }

      bookedById = patientId;
    }

    // Validate doctor is approved
    const feeDoctor = await prisma.doctorProfile.findUnique({
      where: { id: data.doctorId },
      select: { hospitalId: true, status: true },
    });
    if (!feeDoctor) throw new Error("Doctor not found");
    if (feeDoctor.status !== 'Approved') {
      throw new Error("Cannot book an appointment with a doctor whose profile is not yet approved");
    }

    const createData = {
      patientId: actualPatientId,
      bookedById,
      doctorId: data.doctorId,
      dateTime: new Date(data.dateTime),
      fee: isReceptionist ? 0 : (data.fee ?? 0),
      reason: data.reason || null,
      issueCategory: data.issueCategory || null,
      notes: data.notes || null,
      attachments: data.attachments || null,
      status,
      paymentMethod: isReceptionist ? 'none' : (data.paymentMethod || "service_fee"),
    };
    if (data.slotId) {
      createData.slotId = data.slotId;
      if (!isReceptionist) {
        try {
          await ReceptionistService.validateSlotCapacity(
            data.slotId,
            data.doctorId,
            data.dateTime,
          );
        } catch (err) {
          throw new Error(
            err.message === "This slot is already full"
              ? "This slot is already full"
              : err.message,
          );
        }
      }
    }

    if (!isReceptionist) {
      if (feeDoctor?.hospitalId) {
        const feeHospital = await prisma.hospital.findUnique({
          where: { id: feeDoctor.hospitalId },
          select: { cardPrice: true },
        });
        if (feeHospital) {
          createData.fee = Number(feeHospital.cardPrice);
        }
      }

      // Validate card if payment method is "card" and cardId is provided
      if (data.paymentMethod === "card" && data.cardId) {
        const card = await prisma.card.findUnique({
          where: { id: data.cardId },
          include: { hospital: true },
        });
        if (!card) throw new Error("Card not found");
        if (!card.isActive) throw new Error("Card is not active");
        if (card.expiresAt < new Date()) throw new Error("Card has expired");
        if (card.patientId !== patientId) throw new Error("Card does not belong to this patient");

        // Verify card's hospital matches the doctor's hospital
        const doctor = await prisma.doctorProfile.findUnique({
          where: { id: data.doctorId },
          select: { hospitalId: true },
        });
        if (!doctor) throw new Error("Doctor not found");
        if (card.hospitalId !== doctor.hospitalId) {
          throw new Error("Card is not valid for this doctor's hospital");
        }

        createData.cardId = data.cardId;
      }

      // Auto-issue an unpaid card for the patient if they don't have one for this hospital
      if (!createData.cardId) {
        const doctor = await prisma.doctorProfile.findUnique({
          where: { id: data.doctorId },
          select: { hospitalId: true },
        });
        if (doctor && doctor.hospitalId) {
          // Check if patient already has an active card for this hospital
          const existingCard = await prisma.card.findFirst({
            where: {
              patientId,
              hospitalId: doctor.hospitalId,
              isActive: true,
              expiresAt: { gt: new Date() },
            },
          });

          if (!existingCard) {
            // Get hospital card price and active templates
            const hospital = await prisma.hospital.findUnique({
              where: { id: doctor.hospitalId },
              include: { cardTemplates: { where: { isActive: true }, take: 1 } },
            });

            let cardPrice = Number(hospital?.cardPrice || 0);
            let cardName = "Hospital Visit Card";
            let validityDays = hospital?.cardTemplates?.[0]?.validityDays ?? 365;
            if (hospital?.cardTemplates && hospital.cardTemplates.length > 0) {
              cardPrice = Number(hospital.cardTemplates[0].price);
              cardName = hospital.cardTemplates[0].name || cardName;
              validityDays = hospital.cardTemplates[0].validityDays ?? 365;
            }

            let code;
            let attempts = 0;
            while (attempts < 10) {
              code = ReceptionistService.generateCardCode();
              const existing = await prisma.card.findUnique({ where: { code } });
              if (!existing) break;
              attempts++;
            }

            if (code) {
              const isPaid = data.paidCardFee === true || data.paidCardFee === 'true';
              const issuedAt = new Date();
              const expiresAt = new Date(issuedAt);
              expiresAt.setDate(expiresAt.getDate() + validityDays);

              const newCard = await prisma.card.create({
                data: {
                  code,
                  name: cardName,
                  hospitalId: doctor.hospitalId,
                  patientId,
                  price: cardPrice,
                  isPaid,
                  validityDays,
                  issuedAt,
                  activatedAt: isPaid ? issuedAt : null,
                  expiresAt,
                },
              });

              createData.cardId = newCard.id;
            }
          } else {
            // Link the existing card
            createData.cardId = existingCard.id;
          }
        }
      }
    }

    // Generate unique confirmation code
    let confirmationCode;
    let codeAttempts = 0;
    while (codeAttempts < 10) {
      confirmationCode = generateConfirmationCode();
      const existing = await prisma.appointment.findUnique({ where: { confirmationCode } });
      if (!existing) break;
      codeAttempts++;
    }
    if (!confirmationCode) throw new Error("Failed to generate unique confirmation code");
    createData.confirmationCode = confirmationCode;

    const appointment = await prisma.appointment.create({
      data: createData,
    });

    // Notify the doctor (non-blocking)
    try {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { id: data.doctorId },
        select: { userId: true },
      });
      const notifyPatientId = data.otherPatientDetails ? actualPatientId : patientId;
      const patient = await prisma.patientProfile.findUnique({
        where: { userId: notifyPatientId },
        select: { fullName: true },
      });
      if (doctor) {
        await NotificationService.notifyAppointmentBooked(
          doctor.userId,
          patient?.fullName,
          appointment.id,
        );
      }
    } catch (err) {
      console.error(
        "[NOTIFICATION] Failed to notify on appointment create:",
        err.message,
      );
    }

    // Notify the hospital admin(s) when a patient books (non-blocking)
    try {
      if (feeDoctor?.hospitalId) {
        const doctorInfo = await prisma.doctorProfile.findUnique({
          where: { id: data.doctorId },
          select: { fullName: true },
        });
        const notifyPatientId = data.otherPatientDetails ? actualPatientId : patientId;
        const patient = await prisma.patientProfile.findUnique({
          where: { userId: notifyPatientId },
          select: { fullName: true },
        });
        await NotificationService.notifyHospitalAppointmentBooked(
          feeDoctor.hospitalId,
          patient?.fullName,
          doctorInfo?.fullName,
          appointment.id,
        );
      }
    } catch (err) {
      console.error(
        "[NOTIFICATION] Failed to notify hospital on appointment create:",
        err.message,
      );
    }

    // Notify receptionist(s) of the hospital (non-blocking)
    try {
      if (feeDoctor?.hospitalId) {
        const doctorInfo = await prisma.doctorProfile.findUnique({
          where: { id: data.doctorId },
          select: { fullName: true, specialization: true },
        });
        const notifyPatientId = data.otherPatientDetails ? actualPatientId : patientId;
        const patient = await prisma.patientProfile.findUnique({
          where: { userId: notifyPatientId },
          select: { fullName: true },
        });
        await NotificationService.notifyReceptionistsAppointmentBooked({
          hospitalId: feeDoctor.hospitalId,
          patientName: patient?.fullName,
          doctorName: doctorInfo?.fullName,
          specialization: doctorInfo?.specialization,
          dateTime: appointment.dateTime,
          isPaid: appointment.isPaid,
          status: appointment.status,
          appointmentId: appointment.id,
        });
      }
    } catch (err) {
      console.error(
        "[NOTIFICATION] Failed to notify receptionist on appointment create:",
        err.message,
      );
    }

    // Notify the patient (non-blocking) - every time an appointment is created
    try {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { id: data.doctorId },
        select: {
          fullName: true,
          userId: true,
          specialization: true,
          hospital: { select: { name: true, address: true } },
        },
      });
      const notifyPatientId = data.otherPatientDetails ? actualPatientId : patientId;
      const patient = await prisma.patientProfile.findUnique({
        where: { userId: notifyPatientId },
        select: { fullName: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: notifyPatientId },
        select: { phone: true },
      });

      const patientName = patient?.fullName || 'Patient';
      const doctorName = doctor?.fullName || 'Doctor';
      const details = {
        specialization: doctor?.specialization,
        hospitalName: doctor?.hospital?.name,
        hospitalAddress: doctor?.hospital?.address,
        fee: Number(appointment.fee),
        confirmationCode: appointment.confirmationCode,
      };

      // Push notification to actual patient
      await NotificationService.notifyAppointmentCreated(
        notifyPatientId,
        doctorName,
        patientName,
        data.dateTime,
        appointment.id,
        details,
      );

      // SMS notification to actual patient
      if (user?.phone) {
        await SmsService.sendAppointmentConfirmation(
          user.phone,
          patientName,
          doctorName,
          data.dateTime,
          doctor?.specialization,
          doctor?.hospital?.name,
          Number(appointment.fee),
          appointment.confirmationCode,
        );
      }

      // If booked for someone else, also notify the sponsor
      if (data.otherPatientDetails) {
        const sponsor = await prisma.patientProfile.findUnique({
          where: { userId: patientId },
          select: { fullName: true },
        });
        await NotificationService.notifyAppointmentCreated(
          patientId,
          doctorName,
          `${patientName} (booked by ${sponsor?.fullName || 'you'})`,
          data.dateTime,
          appointment.id,
          details,
        );
      }
    } catch (err) {
      console.error(
        "[NOTIFICATION] Failed to notify patient on appointment create:",
        err.message,
      );
    }

    return appointment;
  },

  createAppointmentForPatient: async (patientId, data) => {
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { id: true, role: true },
    });

    if (!patient || patient.role !== "patient") {
      throw new Error("Patient not found");
    }

    if (data.slotId) {
      await ReceptionistService.validateSlotCapacity(
        data.slotId,
        data.doctorId,
        data.dateTime,
      );
    }

    return await AppointmentService.createAppointment(patientId, data, true);
  },

  getPatientAppointments: async (patientId) => {
    return await prisma.appointment.findMany({
      where: {
        OR: [
          { patientId },
          { bookedById: patientId },
        ],
      },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: {
              select: {
                fullName: true,
                gender: true,
                bloodType: true,
                dateOfBirth: true,
              },
            },
          },
        },
        bookedBy: {
          select: {
            id: true,
            patientProfile: {
              select: { fullName: true },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            profilePicture: true,
            clinicName: true,
            hospital: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { dateTime: "desc" },
    });
  },

  // ─── Doctor Actions ────────────────────────────────────────────────

  getDoctorAppointments: async (doctorId, filters = {}) => {
    const where = { doctorId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      where.dateTime = { gte: start, lte: end };
    }
    if (filters.from && filters.to) {
      where.dateTime = {
        gte: new Date(filters.from),
        lte: new Date(filters.to),
      };
    }

    return await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: {
              select: {
                fullName: true,
                gender: true,
                bloodType: true,
                dateOfBirth: true,
              },
            },
          },
        },
        bookedBy: {
          select: {
            id: true,
            patientProfile: {
              select: { fullName: true },
            },
          },
        },
        followUps: {
          select: { id: true },
        },
      },
      orderBy: { dateTime: "asc" },
    });
  },

  acceptAppointment: async (appointmentId, doctorId) => {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
    });
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.reviewedByReceptionistId)
      throw new Error("Appointment already reviewed by receptionist");
    if (appointment.status !== "pending")
      throw new Error("Appointment is not pending");

    const result = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "accepted",
      },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
        bookedBy: {
          select: {
            id: true,
            patientProfile: { select: { fullName: true } },
          },
        },
        doctor: {
          select: {
            fullName: true,
            specialization: true,
            hospital: { select: { name: true } },
          },
        },
      },
    });

    // Notify the patient (non-blocking)
    try {
      await NotificationService.notifyAppointmentAccepted(
        result.patient.id,
        result.doctor?.fullName,
        appointmentId,
      );
    } catch (err) {
      console.error(
        "[NOTIFICATION] Failed to notify on appointment accept:",
        err.message,
      );
    }

    // SMS notification to patient
    try {
      if (result.patient?.phone) {
        const patientName = result.patient?.patientProfile?.fullName || 'Patient';
        await SmsService.sendAppointmentConfirmation(
          result.patient.phone,
          patientName,
          result.doctor?.fullName || 'Doctor',
          result.dateTime,
          result.doctor?.specialization,
          result.doctor?.hospital?.name,
          Number(result.fee),
          result.confirmationCode,
        );
      }
    } catch (err) {
      console.error("[SMS] Failed to send accept SMS:", err.message);
    }

    return result;
  },

  declineAppointment: async (appointmentId, doctorId, reason) => {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
    });
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.reviewedByReceptionistId)
      throw new Error("Appointment already reviewed by receptionist");
    if (appointment.status !== "pending")
      throw new Error("Appointment is not pending");

    const result = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "declined",
        declineReason: reason || null,
      },
      include: {
        patient: { select: { id: true } },
        doctor: { select: { fullName: true } },
      },
    });

    // Notify the patient (non-blocking)
    try {
      await NotificationService.notifyAppointmentDeclined(
        result.patient.id,
        result.doctor?.fullName,
        appointmentId,
        reason,
      );
    } catch (err) {
      console.error(
        "[NOTIFICATION] Failed to notify on appointment decline:",
        err.message,
      );
    }

    // SMS notification to patient
    try {
      const patient = await prisma.user.findUnique({
        where: { id: result.patient.id },
        select: { phone: true },
      });
      if (patient?.phone) {
        const patientProfile = await prisma.patientProfile.findUnique({
          where: { userId: result.patient.id },
          select: { fullName: true },
        });
        await SmsService.sendAppointmentDeclined(
          patient.phone,
          patientProfile?.fullName || 'Patient',
          result.doctor?.fullName || 'Doctor',
          reason,
        );
      }
    } catch (err) {
      console.error("[SMS] Failed to send decline SMS:", err.message);
    }

    return result;
  },

  completeAppointment: async (appointmentId, doctorId) => {
    return await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId, doctorId },
        include: { doctor: true },
      });

      if (!appointment) throw new Error("Appointment not found");
      if (appointment.status === "completed")
        throw new Error("Appointment already completed");

      // 1. Update Appointment Status
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "completed", isPaid: true },
        include: {
          patient: { select: { id: true } },
          doctor: { select: { fullName: true } },
        },
      });

      // 2. Credit Doctor's Wallet
      await WalletService.creditWallet(
        appointment.doctorId,
        appointment.fee,
        `Earnings from Appointment #${appointmentId}`,
      );

      // 3. Notify the patient (non-blocking, outside transaction)
      try {
        await NotificationService.notifyAppointmentCompleted(
          updatedAppointment.patient.id,
          updatedAppointment.doctor?.fullName,
          appointmentId,
        );
      } catch (err) {
        console.error(
          "[NOTIFICATION] Failed to notify on appointment complete:",
          err.message,
        );
      }

      return updatedAppointment;
    });
  },

  // ─── Calendar Data ─────────────────────────────────────────────────

  getCalendarData: async (doctorId, month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        dateTime: { gte: startDate, lte: endDate },
        status: { in: ["pending", "accepted", "completed"] },
      },
      select: {
        id: true,
        dateTime: true,
        status: true,
      },
      orderBy: { dateTime: "asc" },
    });

    // Group by date
    const grouped = {};
    for (const apt of appointments) {
      const dateKey = apt.dateTime.toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          total: 0,
          pending: 0,
          accepted: 0,
          completed: 0,
        };
      }
      grouped[dateKey].total++;
      grouped[dateKey][apt.status]++;
    }

    return Object.values(grouped);
  },

  // ─── Export Data ───────────────────────────────────────────────────

  getExportData: async (doctorId, date) => {
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    return await prisma.appointment.findMany({
      where: {
        doctorId,
        dateTime: { gte: dayStart, lte: dayEnd },
        status: { in: ["accepted", "completed"] },
      },
      include: {
        patient: {
          select: {
            phone: true,
            patientProfile: {
              select: {
                fullName: true,
                gender: true,
                bloodType: true,
                dateOfBirth: true,
              },
            },
          },
        },
        bookedBy: {
          select: {
            id: true,
            patientProfile: {
              select: { fullName: true },
            },
          },
        },
      },
      orderBy: { dateTime: "asc" },
    });
  },

  // ─── Recommendations ──────────────────────────────────────────────

  getCategories: () => {
    return getAllCategories();
  },

  getRecommendations: (category) => {
    return getRecommendationsForCategory(category);
  },

  // ─── Stats ─────────────────────────────────────────────────────────

  getDoctorStats: async (doctorId) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todayAppointments,
      todaySchedules,
      pendingRequests,
      upcomingAppointments,
      upcomingSchedules,
    ] = await Promise.all([
      prisma.appointment.count({
        where: {
          doctorId,
          dateTime: { gte: todayStart, lte: todayEnd },
          status: "accepted",
        },
      }),
      prisma.doctorSchedule.count({
        where: {
          doctorId,
          isActive: true,
          date: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.appointment.count({
        where: { doctorId, status: "pending" },
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          dateTime: { gte: now },
          status: { in: ["accepted", "pending"] },
        },
      }),
      prisma.doctorSchedule.count({
        where: {
          doctorId,
          isActive: true,
          date: { gte: todayStart },
        },
      }),
    ]);

    return {
      todayAppointments: todayAppointments,
      pendingRequests,
      upcomingTotal: upcomingAppointments,
    };
  },

  // ─── Follow-Up ─────────────────────────────────────────────────

  createFollowUp: async (parentAppointmentId, doctorId, data, hospitalId = null) => {
    let parent;
    const notificationInclude = {
      patient: { include: { patientProfile: true } },
      doctor: { include: { hospital: true } },
    };
    if (hospitalId) {
      parent = await prisma.appointment.findUnique({
        where: { id: parentAppointmentId },
        include: notificationInclude,
      });
      if (!parent) throw new Error("Appointment not found");
      if (parent.status !== "completed")
        throw new Error("Follow-up can only be scheduled from a completed consultation");
      if (parent.doctor.hospitalId !== hospitalId)
        throw new Error("Appointment does not belong to your hospital");
      doctorId = parent.doctor.id;
    } else {
      parent = await prisma.appointment.findFirst({
        where: { id: parentAppointmentId, doctorId },
        include: notificationInclude,
      });
      if (!parent) throw new Error("Appointment not found");
      if (parent.status !== "completed")
        throw new Error("Follow-up can only be scheduled from a completed consultation");
    }

    let confirmationCode;
    let attempts = 0;
    while (attempts < 10) {
      confirmationCode = generateConfirmationCode();
      const existing = await prisma.appointment.findUnique({ where: { confirmationCode } });
      if (!existing) break;
      attempts++;
    }
    if (!confirmationCode) throw new Error("Failed to generate unique confirmation code");

    const followUp = await prisma.appointment.create({
      data: {
        patientId: parent.patientId,
        bookedById: parent.bookedById,
        doctorId,
        dateTime: new Date(data.dateTime),
        fee: 0,
        reason: data.reason || null,
        issueCategory: data.issueCategory || null,
        notes: data.notes || null,
        slotId: data.slotId || null,
        status: "accepted",
        paymentMethod: "service_fee",
        parentAppointmentId,
        confirmationCode,
      },
      include: {
        patient: { include: { patientProfile: true } },
        bookedBy: { include: { patientProfile: true } },
      },
    });

    // Send notifications (non-blocking)
    try {
      const patientName = parent.patient?.patientProfile?.fullName || "Patient";
      const doctorName = parent.doctor?.fullName || "Doctor";
      const details = {
        specialization: parent.doctor?.specialization,
        hospitalName: parent.doctor?.hospital?.name,
        hospitalAddress: parent.doctor?.hospital?.address,
        confirmationCode: followUp.confirmationCode,
      };

      await NotificationService.notifyFollowUpScheduled(
        parent.patientId,
        doctorName,
        patientName,
        followUp.dateTime,
        followUp.id,
        parent.id,
        details,
      );

      if (parent.patient?.phone) {
        const formattedDate = formatEthiopianLocalDateTimeDual(followUp.dateTime);
        const spec = parent.doctor?.specialization ? ` (${parent.doctor.specialization})` : "";
        const loc = parent.doctor?.hospital?.name ? ` at ${parent.doctor.hospital.name}` : "";
        const codeStr = followUp.confirmationCode || "";
        let smsMsg = `Dear ${patientName}, your follow-up with Dr. ${doctorName}${spec} has been scheduled${loc} on ${formattedDate}. Code: ${codeStr}. Please arrive 20 min early.`;
        SmsService.sendSms(parent.patient.phone, smsMsg).catch(() => {});
      }
    } catch (err) {
      console.error("[FOLLOW-UP] Failed to send notification:", err.message);
    }

    return followUp;
  },

  // ─── Patient Cancel / Reschedule ───────────────────────────────────

  cancelAppointment: async (appointmentId, patientId) => {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [
          { patientId },
          { bookedById: patientId },
        ],
      },
      include: {
        doctor: { select: { fullName: true, userId: true, specialization: true } },
        patient: { select: { phone: true, patientProfile: { select: { fullName: true } } } },
        bookedBy: { select: { phone: true, patientProfile: { select: { fullName: true } } } },
      },
    });

    if (!appointment) throw new Error("Appointment not found");
    if (appointment.status === "completed" || appointment.status === "cancelled" || appointment.status === "declined") {
      throw new Error("Appointment cannot be cancelled in its current state");
    }

    const result = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "cancelled" },
    });

    // Notify doctor (non-blocking)
    try {
      const patientName = appointment.patient?.patientProfile?.fullName || "Patient";
      const doctorName = appointment.doctor?.fullName || "Doctor";
      await NotificationService.create(
        appointment.doctor.userId,
        NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
        "Appointment Cancelled",
        `${patientName} has cancelled their appointment with you.`,
        { appointmentId },
      );
    } catch (err) {
      console.error("[NOTIFICATION] Failed to notify on cancel:", err.message);
    }

    // SMS to patient (non-blocking)
    try {
      const patientName = appointment.patient?.patientProfile?.fullName || "Patient";
      const doctorName = appointment.doctor?.fullName || "Doctor";
      await SmsService.sendAppointmentCancelled(
        appointment.patient?.phone,
        patientName,
        doctorName,
        appointment.doctor?.specialization,
      );
    } catch (err) {
      console.error("[SMS] Failed to send cancel SMS:", err.message);
    }

    // SMS to booker if different from patient (non-blocking)
    if (appointment.bookedById !== appointment.patientId) {
      try {
        const bookerName = appointment.bookedBy?.patientProfile?.fullName || "Patient";
        const doctorName = appointment.doctor?.fullName || "Doctor";
        const patientName = appointment.patient?.patientProfile?.fullName || "Patient";
        const msg = `Dear ${bookerName}, the appointment for ${patientName} with Dr. ${doctorName} has been cancelled.`;
        await SmsService.sendSms(appointment.bookedBy?.phone, msg);
      } catch (err) {
        console.error("[SMS] Failed to send cancel SMS to booker:", err.message);
      }
    }

    return result;
  },

  rescheduleAppointment: async (appointmentId, patientId, newDateTime, slotId) => {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [
          { patientId },
          { bookedById: patientId },
        ],
      },
      include: {
        doctor: { select: { fullName: true, userId: true, specialization: true, hospital: { select: { name: true } } } },
        patient: { select: { phone: true, patientProfile: { select: { fullName: true } } } },
        bookedBy: { select: { phone: true, patientProfile: { select: { fullName: true } } } },
      },
    });

    if (!appointment) throw new Error("Appointment not found");
    if (appointment.status !== "pending" && appointment.status !== "accepted") {
      throw new Error("Appointment cannot be rescheduled in its current state");
    }

    const updateData = { dateTime: new Date(newDateTime) };
    if (slotId) updateData.slotId = slotId;

    const result = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });

    // Notify doctor (non-blocking)
    try {
      const patientName = appointment.patient?.patientProfile?.fullName || "Patient";
      const doctorName = appointment.doctor?.fullName || "Doctor";
      const formattedDate = formatEthiopianLocalDateTimeDual(newDateTime);
      await NotificationService.create(
        appointment.doctor.userId,
        NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED,
        "Appointment Rescheduled",
        `${patientName} has rescheduled their appointment with you to ${formattedDate}.`,
        { appointmentId, newDateTime },
      );
    } catch (err) {
      console.error("[NOTIFICATION] Failed to notify on reschedule:", err.message);
    }

    // SMS to patient (non-blocking)
    try {
      const patientName = appointment.patient?.patientProfile?.fullName || "Patient";
      const doctorName = appointment.doctor?.fullName || "Doctor";
      await SmsService.sendAppointmentRescheduled(
        appointment.patient?.phone,
        patientName,
        doctorName,
        newDateTime,
        appointment.doctor?.specialization,
        appointment.doctor?.hospital?.name,
        result.confirmationCode,
      );
    } catch (err) {
      console.error("[SMS] Failed to send reschedule SMS:", err.message);
    }

    // SMS to booker if different from patient (non-blocking)
    if (appointment.bookedById !== appointment.patientId) {
      try {
        const bookerName = appointment.bookedBy?.patientProfile?.fullName || "Patient";
        const doctorName = appointment.doctor?.fullName || "Doctor";
        const patientName = appointment.patient?.patientProfile?.fullName || "Patient";
        const formattedDate = formatEthiopianLocalDateTimeDual(newDateTime);
        const msg = `Dear ${bookerName}, the appointment for ${patientName} with Dr. ${doctorName} has been rescheduled to ${formattedDate}. Please arrive 20 min early.`;
        await SmsService.sendSms(appointment.bookedBy?.phone, msg);
      } catch (err) {
        console.error("[SMS] Failed to send reschedule SMS to booker:", err.message);
      }
    }

    return result;
  },
};

module.exports = AppointmentService;
