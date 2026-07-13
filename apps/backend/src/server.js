require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth.routes");
const doctorRoutes = require("./routes/doctor.routes");
const adminRoutes = require("./routes/admin.routes");
const walletRoutes = require("./routes/wallet.routes");
const paymentMethodRoutes = require("./routes/payment-method.routes");
const patientRoutes = require("./routes/patient.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const paymentRoutes = require("./routes/payment.routes");
const notificationRoutes = require("./routes/notification.routes");
const equipmentRoutes = require("./routes/equipment.routes");
const receptionistRoutes = require("./routes/receptionist.routes");
const ReminderService = require("./services/reminder.service");
const telegramRoutes = require("./routes/telegram.routes");
const legalRoutes = require("./routes/legal.routes");

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production for security
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/hospitals', require('./routes/hospital.routes'));
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/legal', legalRoutes);

// WebSocket Connection Handling
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "BM Booking Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to BM Booking Backend API");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🔴 ERROR:", err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: statusCode === 500 ? "error" : "fail",
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start Server
const startServer = async () => {
  try {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    ReminderService.start();
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
