import Link from "next/link";
import {
  Shield,
  Clock,
  MapPin,
  CreditCard,
  User,
  Bell,
  Smartphone,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Zap,
  Heart,
} from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Download the App",
    desc: "Get BM Booking from Google Play or the App Store in seconds.",
  },
  {
    num: "02",
    title: "Find a Doctor",
    desc: "Browse specialists, read profiles, and pick the right doctor for you.",
  },
  {
    num: "03",
    title: "Book & Pay",
    desc: "Choose a time slot and pay securely with Telebirr — done.",
  },
];

const features = [
  {
    icon: Clock,
    title: "Book Appointments",
    desc: "Find doctors by specialty, pick a time, and confirm — in under a minute.",
  },
  {
    icon: CreditCard,
    title: "Pay with Telebirr",
    desc: "Secure mobile payments — no cash, no cards, just your phone.",
  },
  {
    icon: Shield,
    title: "Health Cards",
    desc: "Digital health records you can share with any doctor, anytime.",
  },
  {
    icon: MapPin,
    title: "Find Equipment",
    desc: "Locate MRI, CT, ultrasound, and other medical tools near you.",
  },
  {
    icon: User,
    title: "Your Profile",
    desc: "Manage your health info, blood type, emergency contacts, and more.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    desc: "Get notified about upcoming appointments and health updates.",
  },
];

const stats = [
  { value: "50+", label: "Partner Clinics" },
  { value: "200+", label: "Doctors" },
  { value: "10k+", label: "Patients Served" },
  { value: "4.8", label: "App Rating" },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <header
        style={{
          background: "var(--ink)",
          padding: "6rem 2rem 7rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "5px 14px",
              borderRadius: "var(--r-pill)",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              marginBottom: "1.5rem",
            }}
          >
            <Smartphone size={12} />
            Mobile App
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
            }}
          >
            Your Health,
            <br />
            One Tap Away
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "1.05rem",
              lineHeight: 1.6,
              maxWidth: 480,
              margin: "0 auto 2rem",
            }}
          >
            Book appointments, manage health cards, and access care — all from
            your phone.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="https://play.google.com/store/apps/details?id=com.bmbooking"
              target="_blank"
              rel="noopener"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 28px",
                borderRadius: "var(--r-md)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                background: "#fff",
                color: "var(--ink)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
              </svg>
              <div style={{ textAlign: "left" }}>
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 500,
                    color: "rgba(0,0,0,0.5)",
                    display: "block",
                    lineHeight: 1,
                  }}
                >
                  Get it on
                </span>
                <span style={{ display: "block", lineHeight: 1.2 }}>
                  Google Play
                </span>
              </div>
            </a>
            <a
              href="https://apps.apple.com/app/bm-booking/id000000000"
              target="_blank"
              rel="noopener"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 28px",
                borderRadius: "var(--r-md)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.81 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.06 4.83 18.7 5.06 19.83 6.52C19.73 6.58 17.7 7.81 17.73 10.26C17.76 13.19 20.33 14.18 20.37 14.19C20.33 14.28 19.94 15.64 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
              <div style={{ textAlign: "left" }}>
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.6)",
                    display: "block",
                    lineHeight: 1,
                  }}
                >
                  Download on the
                </span>
                <span style={{ display: "block", lineHeight: 1.2 }}>
                  App Store
                </span>
              </div>
            </a>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <section
        style={{
          maxWidth: 900,
          margin: "-3rem auto 0",
          padding: "0 1.25rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "var(--border)",
            borderRadius: "var(--r-xl)",
            overflow: "hidden",
            boxShadow: "var(--shadow-lift)",
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "var(--surface)",
                padding: "1.5rem 1rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1.2,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-meta)",
                  marginTop: "0.25rem",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "5rem 1.25rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--success-bg)",
              color: "var(--success)",
              padding: "5px 14px",
              borderRadius: "var(--r-pill)",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
              marginBottom: "1rem",
            }}
          >
            <Zap size={12} />
            Simple Process
          </div>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            How It Works
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
          {steps.map((s) => (
            <div key={s.num} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--ink)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                {s.num}
              </div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: "0.5rem",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-body)",
                  lineHeight: 1.55,
                  maxWidth: 250,
                  margin: "0 auto",
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "5rem 1.25rem",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--success-bg)",
                color: "var(--success)",
                padding: "5px 14px",
                borderRadius: "var(--r-pill)",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase" as const,
                marginBottom: "1rem",
              }}
            >
              <Heart size={12} />
              Everything You Need
            </div>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
              }}
            >
              Built for Your Health
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.25rem",
            }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: "1.75rem 1.5rem",
                  textAlign: "center",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border-light)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <f.icon size={22} color="var(--slate)" />
                </div>
                <h3
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: "0.4rem",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-meta)",
                    lineHeight: 1.5,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telegram CTA */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "5rem 1.25rem",
        }}
      >
        <div
          style={{
            background: "var(--ink)",
            borderRadius: "var(--r-xl)",
            padding: "3.5rem 2rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#2AABEE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              boxShadow: "0 8px 24px rgba(42,171,238,0.3)",
            }}
          >
            <MessageCircle size={32} color="#fff" />
          </div>
          <h2
            style={{
              fontSize: "clamp(1.3rem, 3vw, 1.75rem)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
            }}
          >
            Prefer Telegram?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.95rem",
              lineHeight: 1.5,
              maxWidth: 420,
              margin: "0 auto 2rem",
            }}
          >
            No app download needed. Open our Telegram bot and start booking
            right away.
          </p>
          <a
            href="https://t.me/BMBookingBot"
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "#2AABEE",
              color: "#fff",
              borderRadius: "var(--r-md)",
              padding: "14px 32px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: "0 4px 16px rgba(42,171,238,0.3)",
            }}
          >
            Open in Telegram
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: "center", padding: "3rem 1.25rem 5rem" }}>
        <h2
          style={{
            fontSize: "clamp(1.3rem, 3vw, 1.75rem)",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: "0.75rem",
          }}
        >
          Take Control of Your Health Today
        </h2>
        <p
          style={{
            color: "var(--text-body)",
            fontSize: "0.95rem",
            maxWidth: 440,
            margin: "0 auto 2rem",
            lineHeight: 1.55,
          }}
        >
          Join thousands of patients who book appointments and manage their
          health with BM Booking.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            {
              href: "https://play.google.com/store/apps/details?id=com.bmbooking",
              label: "Get on Google Play",
              style: {
                background: "var(--ink)",
                color: "#fff" as const,
                border: "1px solid var(--ink)",
              },
            },
            {
              href: "https://apps.apple.com/app/bm-booking/id000000000",
              label: "Download on App Store",
              style: {
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              },
            },
          ].map((b) => (
            <a
              key={b.label}
              href={b.href}
              target="_blank"
              rel="noopener"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: "var(--r-md)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                ...b.style,
              }}
            >
              <CheckCircle size={16} />
              {b.label}
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "2rem 1.25rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        <p style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
          &copy; 2025 Possible Technology P.L.C. All rights reserved.
          {" | "}
          <a
            href="https://possibletechplc.com"
            target="_blank"
            rel="noopener"
            style={{
              color: "var(--slate)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            possibletechplc.com
          </a>
          {" | "}
          <Link
            href="/privacy-policy"
            style={{
              color: "var(--slate)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Privacy Policy
          </Link>
          {" | "}
          <Link
            href="/terms-of-service"
            style={{
              color: "var(--slate)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Terms of Service
          </Link>
        </p>
      </footer>
    </main>
  );
}
