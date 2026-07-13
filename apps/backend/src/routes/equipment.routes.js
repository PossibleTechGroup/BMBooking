const express = require("express");
const EquipmentController = require("../controllers/equipment.controller");
const EquipmentBookingController = require("../controllers/equipment-booking.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const schemas = require("../config/validation");

const router = express.Router();

router.get("/search", EquipmentController.search);
router.get("/categories", EquipmentController.getCategories);
router.get("/detail/:id", EquipmentController.getDetail);
router.get("/announcements", EquipmentController.getAnnouncements);
router.get(
  "/:id/availability",
  EquipmentBookingController.getAvailability,
);

router.use(authMiddleware);

router.post(
  "/book",
  roleMiddleware(["patient"]),
  validate(schemas.createEquipmentBooking),
  EquipmentBookingController.createBooking,
);
router.get(
  "/bookings",
  roleMiddleware(["patient"]),
  EquipmentBookingController.getMyBookings,
);
router.patch(
  "/bookings/:id/cancel",
  roleMiddleware(["patient"]),
  EquipmentBookingController.cancelBooking,
);
router.patch(
  "/bookings/:id/reschedule",
  roleMiddleware(["patient"]),
  EquipmentBookingController.rescheduleBookingForPatient,
);

module.exports = router;
