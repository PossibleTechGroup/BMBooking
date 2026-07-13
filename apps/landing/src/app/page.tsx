import Link from "next/link";
import { Shield, Clock, MapPin, CreditCard, User, Bell, Smartphone, MessageCircle } from "lucide-react";

const features = [
  { icon: Clock, title: "Book Appointments", desc: "Find doctors by specialty, pick a time, and confirm — in under a minute." },
  { icon: CreditCard, title: "Pay with Telebirr", desc: "Secure mobile payments — no cash, no cards, just your phone." },
  { icon: Shield, title: "Health Cards", desc: "Digital health records you can share with any doctor, anytime." },
  { icon: MapPin, title: "Find Equipment", desc: "Locate MRI, CT, ultrasound, and other medical tools near you." },
  { icon: User, title: "Your Profile", desc: "Manage your health info, blood type, emergency contacts, and more." },
  { icon: Bell, title: "Smart Reminders", desc: "Get notified about upcoming appointments and health updates." },
];

export default function Home() {
  return (
    <main>
      {/* Header */}
      <header style={{ background: "var(--ink)", padding: "4.5rem 2rem 5.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", padding: "5px 14px", borderRadius: "var(--r-pill)", fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "1.25rem" }}>
            <Smartphone size={12} />
            Mobile App
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: "0.75rem" }}>
            Get BM Booking
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", lineHeight: 1.5, maxWidth: 480, margin: "0 auto" }}>
            Book appointments, manage health cards, and access care — all from your phone.
          </p>
        </div>
      </header>

      {/* Download Cards */}
      <section style={{ maxWidth: 1100, margin: "-2.5rem auto 0", padding: "0 1.25rem 3rem", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Mobile App */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "2.5rem 2rem", boxShadow: "var(--shadow-lift)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", boxShadow: "0 8px 24px rgba(26,26,26,0.15)" }}>
              <Smartphone size={40} color="#fff" />
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>Your Health, One Tap Away</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text-body)", marginBottom: 0 }}>Find doctors, book instantly, pay with Telebirr, and track your appointments — wherever you are.</p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap", justifyContent: "center" }}>
              <a href="https://play.google.com/store/apps/details?id=com.bmbooking" target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: "var(--r-md)", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem", background: "var(--ink)", color: "#fff", border: "1px solid var(--ink)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"/></svg>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "rgba(255,255,255,0.6)", display: "block", lineHeight: 1 }}>Get it on</span>
                  <span style={{ display: "block", lineHeight: 1.2 }}>Google Play</span>
                </div>
              </a>
              <a href="https://apps.apple.com/app/bm-booking/id000000000" target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: "var(--r-md)", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.81 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.06 4.83 18.7 5.06 19.83 6.52C19.73 6.58 17.7 7.81 17.73 10.26C17.76 13.19 20.33 14.18 20.37 14.19C20.33 14.28 19.94 15.64 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "var(--text-meta)", display: "block", lineHeight: 1 }}>Download on the</span>
                  <span style={{ display: "block", lineHeight: 1.2 }}>App Store</span>
                </div>
              </a>
            </div>
          </div>

          {/* Telegram */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "2.5rem 2rem", boxShadow: "var(--shadow-lift)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "#2AABEE", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", boxShadow: "0 8px 24px rgba(42,171,238,0.2)" }}>
              <MessageCircle size={40} color="#fff" />
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>Or Use It in Telegram</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text-body)", marginBottom: 0 }}>No download needed. Open our bot in Telegram and start booking right away.</p>
            <a href="https://t.me/BMBookingBot" target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "1rem 1.25rem", marginTop: "1.25rem", textDecoration: "none", width: "100%", justifyContent: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#2AABEE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MessageCircle size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Open in Telegram</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-meta)" }}>Start booking in seconds</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem 3rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "1.25rem", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem", background: "var(--surface-alt)", border: "1px solid var(--border-light)" }}>
                <f.icon size={20} color="var(--slate)" />
              </div>
              <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.3rem" }}>{f.title}</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-meta)", lineHeight: 1.45 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Legal Footer */}
      <footer style={{ textAlign: "center", padding: "2rem 1.25rem", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
          &copy; 2025 Possible Technology P.L.C. All rights reserved.
          {" | "}
          <a href="https://possibletechplc.com" target="_blank" rel="noopener" style={{ color: "var(--slate)", textDecoration: "none", fontWeight: 500 }}>possibletechplc.com</a>
          {" | "}
          <Link href="/privacy-policy" style={{ color: "var(--slate)", textDecoration: "none", fontWeight: 500 }}>Privacy Policy</Link>
          {" | "}
          <Link href="/terms-of-service" style={{ color: "var(--slate)", textDecoration: "none", fontWeight: 500 }}>Terms of Service</Link>
        </p>
      </footer>
    </main>
  );
}
