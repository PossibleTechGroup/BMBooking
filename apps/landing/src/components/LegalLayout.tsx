"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { Shield, ChevronUp } from "lucide-react";

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
    <main>
      <header style={{ background: "var(--ink)", padding: "4.5rem 2rem 5.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", padding: "5px 14px", borderRadius: "var(--r-pill)", fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "1.25rem" }}>
            <Shield size={12} />
            Legal Document
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: "0.75rem" }}>{title}</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", lineHeight: 1.5, maxWidth: 480, margin: "0 auto" }}>{subtitle}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>
              Effective: July 11, 2025
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>
              Last updated: July 11, 2025
            </span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "-2.5rem auto 0", padding: "0 1.25rem 4rem", display: "grid", gridTemplateColumns: "240px 1fr", gap: "1.5rem", position: "relative", zIndex: 2 }}>
        <aside style={{ position: "sticky", top: 72, alignSelf: "start", maxHeight: "calc(100vh - 90px)", overflowY: "auto" }}>
          <nav style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "1rem", boxShadow: "var(--shadow-card)" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-meta)", padding: "0 0.5rem 0.6rem", marginBottom: "0.4rem", borderBottom: "1px solid var(--border-light)" }}>On this page</div>
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                  borderRadius: "var(--r-sm)", fontSize: "0.78rem", fontWeight: 500,
                  color: activeId === item.id ? "#fff" : "var(--text-meta)",
                  background: activeId === item.id ? "var(--ink)" : "transparent",
                  textDecoration: "none", lineHeight: 1.35, marginBottom: 2,
                }}
              >
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 20, height: 20, borderRadius: 6, fontSize: "0.65rem", fontWeight: 700,
                  background: activeId === item.id ? "rgba(255,255,255,0.2)" : "var(--border-light)",
                  color: activeId === item.id ? "#fff" : "var(--text-meta)", flexShrink: 0,
                }}>{item.num}</span>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <article style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "2.5rem 3rem", boxShadow: "var(--shadow-lift)" }}>
          {children}
        </article>
      </div>

      <footer style={{ textAlign: "center", padding: "2rem 1.25rem", borderTop: "1px solid var(--border)", marginTop: "0.75rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
          &copy; 2025 Possible Technology P.L.C. All rights reserved.
          {" | "}
          <a href="https://possibletechplc.com" target="_blank" rel="noopener" style={{ color: "var(--slate)", textDecoration: "none", fontWeight: 500 }}>possibletechplc.com</a>
          {" | "}
          <Link href="/" style={{ color: "var(--slate)", textDecoration: "none", fontWeight: 500 }}>Home</Link>
          {" | "}
          <Link href="/privacy-policy" style={{ color: "var(--slate)", textDecoration: "none", fontWeight: 500 }}>Privacy Policy</Link>
          {" | "}
          <Link href="/terms-of-service" style={{ color: "var(--slate)", textDecoration: "none", fontWeight: 500 }}>Terms of Service</Link>
        </p>
      </footer>

      {showBtt && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", width: 40, height: 40, borderRadius: "50%", background: "var(--ink)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-lift)", zIndex: 50 }}
          aria-label="Back to top"
        >
          <ChevronUp size={18} />
        </button>
      )}
    </main>
  );
}
