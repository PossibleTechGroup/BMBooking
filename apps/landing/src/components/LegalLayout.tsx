"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { Shield, ChevronUp, Stethoscope } from "lucide-react";

interface TocItem { id: string; label: string; num: number; }
interface LegalLayoutProps {
  title: string;
  subtitle: string;
  toc: TocItem[];
  children: ReactNode;
}

export default function LegalLayout({ title, subtitle, toc, children }: LegalLayoutProps) {
  const [showBtt, setShowBtt] = useState(false);
  const [activeId, setActiveId] = useState("");
  const sectionsRef = useRef<Map<string, Element>>(new Map());

  useEffect(() => {
    const onScroll = () => setShowBtt(window.scrollY > 350);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-70px 0px -60% 0px", threshold: 0 }
    );
    sectionsRef.current.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const registerSection = (id: string) => (el: Element | null) => {
    if (el) sectionsRef.current.set(id, el);
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)" }}>
      {/* Navigation Bar with Logo */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--line)",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Brand Grouping (Left) */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <Stethoscope size={24} color="var(--accent)" />
          <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.03em" }}>BM-Booking</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--ink-soft)", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500, transition: "color 0.2s" }}>
            Home
          </Link>
          <Link href="/privacy-policy" style={{ color: "var(--ink-soft)", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>
            Privacy
          </Link>
          <Link href="/terms-of-service" style={{ color: "var(--ink-soft)", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>
            Terms
          </Link>
        </div>
      </nav>

      {/* Hero Header */}
      <header
        style={{
          background: "var(--bg)",
          padding: "4.5rem 2rem 6rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(16, 24, 40, 0.02) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          {/* Logo in header */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "var(--accent-soft)",
                border: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
              }}
            >
              <Shield size={24} color="var(--accent)" strokeWidth={2} />
            </div>
          </div>

          <div
            className="badge transition-custom"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--accent-soft)",
              border: "1px solid var(--line)",
              padding: "6px 16px",
              borderRadius: "var(--r-pill)",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "var(--ink-soft)",
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              marginBottom: "1.25rem",
            }}
          >
            Legal Document
          </div>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              marginBottom: "0.85rem",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              color: "var(--ink-soft)",
              fontSize: "1rem",
              fontWeight: 400,
              lineHeight: 1.55,
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            {subtitle}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-soft)" }}>
              Effective: July 11, 2025
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-soft)" }}>
              Last updated: July 11, 2025
            </span>
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <div
        style={{
          maxWidth: 1100,
          margin: "-2.5rem auto 0",
          padding: "0 1.25rem 4rem",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: "1.75rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Sidebar TOC */}
        <aside style={{ position: "sticky", top: 80, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <nav
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "16px",
              padding: "1.25rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "0.1em",
                color: "var(--ink-soft)",
                padding: "0 0.5rem 0.65rem",
                marginBottom: "0.5rem",
                borderBottom: "1px solid var(--line)",
              }}
            >
              On this page
            </div>
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: activeId === item.id ? 600 : 450,
                  color: activeId === item.id ? "var(--ink)" : "var(--ink-soft)",
                  background: activeId === item.id ? "var(--accent-soft)" : "transparent",
                  textDecoration: "none",
                  lineHeight: 1.35,
                  marginBottom: 2,
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    background: activeId === item.id ? "var(--accent)" : "var(--accent-soft)",
                    color: activeId === item.id ? "var(--surface)" : "var(--ink-soft)",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {item.num}
                </span>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Article */}
        <article
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "20px",
            padding: "2.75rem 3.25rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {children}
        </article>
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "2.5rem 1.25rem",
          borderTop: "1px solid var(--line)",
          marginTop: "0.75rem",
          background: "var(--surface)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background: "var(--accent-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Stethoscope size={12} color="var(--accent)" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>BM Booking</span>
          </Link>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontWeight: 450 }}>
          &copy; 2026 Possible Technology P.L.C. All rights reserved.
          {" · "}
          <a href="https://possibletechplc.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>possibletechplc.com</a>
          {" · "}
          <Link href="/" style={{ color: "var(--ink-soft)", textDecoration: "none", fontWeight: 500 }}>Home</Link>
          {" · "}
          <Link href="/privacy-policy" style={{ color: "var(--ink-soft)", textDecoration: "none", fontWeight: 500 }}>Privacy Policy</Link>
          {" · "}
          <Link href="/terms-of-service" style={{ color: "var(--ink-soft)", textDecoration: "none", fontWeight: 500 }}>Terms of Service</Link>
        </p>
      </footer>

      {/* Back to Top */}
      {showBtt && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-md)",
            zIndex: 50,
          }}
          aria-label="Back to top"
        >
          <ChevronUp size={18} />
        </button>
      )}

      {/* Responsive styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .legal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
