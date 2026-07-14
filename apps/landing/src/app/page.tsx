"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  User,
  Smartphone,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Search,
  Activity,
  Check,
  Menu,
  X,
  Star,
  Info,
  Stethoscope
} from "lucide-react";
import KineticGrid from "@/components/KineticGrid";

export default function Home() {
  const [activeTab, setActiveTab] = useState(2);
  const [isPaused, setIsPaused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Intersection Observer for How It Works
  const [howItWorksInView, setHowItWorksInView] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  // Modals state
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  
  // Hospital registration form state
  const [hospitalNameInput, setHospitalNameInput] = useState("");
  const [contactPersonInput, setContactPersonInput] = useState("");
  const [contactInfoInput, setContactInfoInput] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Hero section cursor tracking orb state
  const [orbPos, setOrbPos] = useState({ x: -1000, y: -1000 });
  const heroRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setOrbPos({ x, y });
  };

  const handleMouseLeave = () => {
    setOrbPos({ x: -1000, y: -1000 });
  };
  
  // Focus restoration state
  const [lastActiveElement, setLastActiveElement] = useState<HTMLElement | null>(null);

  // Cursor-reactive micro-interactions (magnetic buttons & card spotlight)
  useEffect(() => {
    // Disable on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    // Magnetic buttons
    const buttons = document.querySelectorAll('.btn');
    const handleBtnMouseMove = (e: MouseEvent) => {
      const btn = e.currentTarget as HTMLElement;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    };
    const handleBtnMouseLeave = (e: MouseEvent) => {
      const btn = e.currentTarget as HTMLElement;
      btn.style.transform = 'translate(0, 0)';
    };

    buttons.forEach(btn => {
      btn.addEventListener('mousemove', handleBtnMouseMove as any);
      btn.addEventListener('mouseleave', handleBtnMouseLeave as any);
    });

    // Spotlight cards
    const cards = document.querySelectorAll('.spotlight-card');
    const handleCardMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--spot-x', `${x}px`);
      card.style.setProperty('--spot-y', `${y}px`);
    };

    cards.forEach(card => {
      card.addEventListener('mousemove', handleCardMouseMove as any);
    });

    return () => {
      buttons.forEach(btn => {
        btn.removeEventListener('mousemove', handleBtnMouseMove as any);
        btn.removeEventListener('mouseleave', handleBtnMouseLeave as any);
      });
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleCardMouseMove as any);
      });
    };
  }, [
    isAppModalOpen,
    isBotModalOpen,
    isRegisterModalOpen,
    isComingSoonModalOpen,
    howItWorksInView,
  ]);

  // Splash Screen timer
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeSplash(true);
    }, 1100);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Escape key handler to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAppModalOpen(false);
        setIsBotModalOpen(false);
        setIsRegisterModalOpen(false);
        setIsComingSoonModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto rotate tabs every 5.5 seconds unless user manually interacts
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  // IntersectionObserver for How It Works Section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHowItWorksInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (howItWorksRef.current) {
      observer.observe(howItWorksRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Focus Restoration when modals open/close
  useEffect(() => {
    if (isAppModalOpen || isBotModalOpen || isRegisterModalOpen || isComingSoonModalOpen) {
      setLastActiveElement(document.activeElement as HTMLElement);
    } else {
      if (lastActiveElement) {
        lastActiveElement.focus();
      }
    }
  }, [isAppModalOpen, isBotModalOpen, isRegisterModalOpen, isComingSoonModalOpen]);

  // Focus trapping within active modals
  useEffect(() => {
    const activeModal = isAppModalOpen || isBotModalOpen || isRegisterModalOpen || isComingSoonModalOpen;
    if (!activeModal) return;

    const handleFocus = (e: FocusEvent) => {
      const modal = document.querySelector(".modal-card, .step-modal");
      if (modal && !modal.contains(e.target as Node)) {
        const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
        if (focusables.length > 0) {
          (focusables[0] as HTMLElement).focus();
        }
      }
    };

    document.addEventListener("focus", handleFocus, true);
    return () => document.removeEventListener("focus", handleFocus, true);
  }, [isAppModalOpen, isBotModalOpen, isRegisterModalOpen, isComingSoonModalOpen]);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    setIsPaused(true);
  };

  const handleSubmitHospitalApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalNameInput || !contactPersonInput || !contactInfoInput) {
      alert("Please fill in all fields.");
      return;
    }
    setIsSubmittingApp(true);
    try {
      const host = window.location.hostname;
      const port = window.location.port;
      let endpoint = '/api/hospital-applications';
      if (port === '3002' || port === '53404') {
        endpoint = `${window.location.protocol}//${host}:52400/api/hospital-applications`;
      } else {
        endpoint = `${window.location.protocol}//${window.location.host}/api/hospital-applications`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospitalName: hospitalNameInput,
          contactPerson: contactPersonInput,
          contactInfo: contactInfoInput,
        }),
      });

      if (response.ok) {
        window.open('https://telegram.me/bm_booking_bot', '_blank');
        setSubmitSuccess(true);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || 'Failed to submit request.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsAppModalOpen(false);
      setIsBotModalOpen(false);
      setIsRegisterModalOpen(false);
      setIsComingSoonModalOpen(false);
    }
  };



  return (
    <main style={{ minHeight: "100vh", position: "relative", backgroundColor: "var(--bg)" }} className="dev-grid-bg">
      {/* Splash Screen Loader */}
      {showSplash && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            transition: "opacity 0.5s ease-in-out, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            opacity: fadeSplash ? 0 : 1,
            transform: fadeSplash ? "scale(1.03)" : "scale(1)",
            pointerEvents: fadeSplash ? "none" : "all",
          }}
        >
          <div 
            className="logo-pulse"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
              textAlign: "center"
            }}
          >
            <img 
              src="/bm-booking.png" 
              alt="BM Booking Logo" 
              style={{ width: "220px", height: "auto", display: "block" }} 
            />
          </div>
        </div>
      )}

      {/* Telegram Announcement Banner */}
      <div 
        style={{
          background: "var(--accent-soft)",
          borderBottom: "1px solid var(--line)",
          padding: "0.55rem 1rem",
          textAlign: "center",
          fontSize: "0.8rem",
          fontWeight: 400,
          color: "var(--ink-soft)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          position: "relative",
          zIndex: 101,
        }}
      >
        <span>Subscribe to <a href="https://telegram.me/bm_booking" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>@bm_booking</a> on Telegram for the latest updates ↗</span>
      </div>

      {/* Floating Navigation Header */}
      <nav 
        className="glass transition-custom"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid var(--line)",
          padding: "0.85rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        {/* Brand Grouping (Left) */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <Stethoscope size={22} color="var(--accent)" />
          <span style={{ fontSize: "1.15rem", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em" }}>BM-Booking</span>
        </Link>

        {/* Anchor Grid (Center) */}
        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }} className="desktop-only">
          <a 
            href="#process"
            className="transition-custom"
            style={{
              color: "var(--ink-soft)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 400,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}
          >
            How It Works
          </a>
          <button 
            onClick={() => setIsBotModalOpen(true)}
            className="transition-custom"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              color: "var(--ink-soft)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 400,
              fontFamily: "var(--font)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}
          >
            Telegram Bot
          </button>
          <button 
            onClick={() => setIsAppModalOpen(true)}
            className="transition-custom"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              color: "var(--ink-soft)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 400,
              fontFamily: "var(--font)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}
          >
            Mobile App
          </button>
        </div>

        {/* Action Grouping (Right) */}
        <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => {
              setHospitalNameInput("");
              setContactPersonInput("");
              setContactInfoInput("");
              setSubmitSuccess(false);
              setIsRegisterModalOpen(true);
            }}
            className="btn btn-primary"
            style={{
              padding: "0 18px",
              fontSize: "0.85rem",
              height: "36px",
            }}
          >
            Register Hospital
          </button>
          <button
            onClick={() => setIsAppModalOpen(true)}
            className="btn btn-ghost"
            style={{
              padding: "0 18px",
              fontSize: "0.85rem",
              height: "36px",
            }}
          >
            Launch App
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: "none",
            border: "none",
            color: "var(--ink)",
            cursor: "pointer",
            display: "none"
          }}
          className="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div 
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--line)",
              padding: "1.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              zIndex: 99,
              boxShadow: "var(--shadow-lg)"
            }}
          >
            <a 
              href="#process"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: "var(--ink)",
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
              }}
            >
              Process
            </a>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                setIsBotModalOpen(true);
              }}
              style={{
                border: "none",
                background: "transparent",
                textAlign: "left",
                padding: 0,
                color: "var(--ink)",
                fontSize: "0.95rem",
                fontWeight: 500,
                fontFamily: "var(--font)",
              }}
            >
              Telegram Bot
            </button>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                setIsAppModalOpen(true);
              }}
              style={{
                border: "none",
                background: "transparent",
                textAlign: "left",
                padding: 0,
                color: "var(--ink)",
                fontSize: "0.95rem",
                fontWeight: 500,
                fontFamily: "var(--font)",
              }}
            >
              Mobile App
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setHospitalNameInput("");
                setContactPersonInput("");
                setContactInfoInput("");
                setSubmitSuccess(false);
                setIsRegisterModalOpen(true);
              }}
              className="btn btn-primary"
              style={{
                width: "100%",
                marginTop: "0.5rem",
                height: "36px",
              }}
            >
              Register Hospital
            </button>
          </div>
        )}
      </nav>

      {/* Global Responsive Overrides */}
      <style jsx global>{`
        @keyframes heroGlow {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          25% { transform: scale(1.05) translate(10px, -8px); opacity: 0.9; }
          50% { transform: scale(1.1) translate(-5px, 5px); opacity: 1; }
          75% { transform: scale(1.03) translate(8px, 3px); opacity: 0.7; }
        }
        .hero-text-glow {
          animation: heroGlow 8s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .hero-split {
            flex-direction: column !important;
            text-align: center !important;
          }
          .dashboard-split {
            flex-direction: column !important;
            height: auto !important;
          }
          .dashboard-left {
            width: 100% !important;
            padding: 1.5rem !important;
          }
          .dashboard-right {
            width: 100% !important;
            padding: 2rem 1.5rem !important;
            border-left: none !important;
            border-top: 1px solid var(--line) !important;
            display: flex;
            justify-content: center;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .telegram-split {
            flex-direction: column !important;
            padding: 2rem !important;
          }
          .telegram-icon-container {
            margin-top: 1rem !important;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "7rem 2rem 6rem",
          textAlign: "center",
        }}
      >
        {/* Kinetic Grid — desktop only */}
        {!isMobile && (
          <>
            <KineticGrid
              background="transparent"
              dotColor="#1A1A1A"
              lineColor="#3E5C76"
              trailColor="#3E5C76"
              spacing={36}
              radius={300}
              strength={3}
              trail={false}
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "100vw",
                height: "100%",
                pointerEvents: "auto",
              }}
            />
            {/* Antigravity Cursor Spotlight Orb */}
            <div 
              className="antigravity-orb" 
              style={{
                position: 'absolute',
                width: '450px',
                height: '450px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(26,26,26,0.06) 0%, rgba(26,26,26,0) 70%)',
                pointerEvents: 'none',
                zIndex: 0,
                transform: `translate3d(${orbPos.x - 225}px, ${orbPos.y - 225}px, 0)`,
                transition: 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          </>
        )}

        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto" }}>
          {/* Animated text background glow */}
          <div
            className="hero-text-glow"
            style={{
              position: "absolute",
              inset: "-60px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse at center, rgba(62,92,118,0.08) 0%, rgba(62,92,118,0) 70%)",
              pointerEvents: "none",
              zIndex: -1,
            }}
          />
          {/* Eyebrow badge */}
          <button
            onClick={() => setIsBotModalOpen(true)}
            className="badge transition-custom"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--accent-soft)",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--ink-soft)",
              marginBottom: "2.5rem",
              cursor: "pointer",
              border: "none"
            }}
          >
            <div 
              className="badge-dot" 
              style={{ 
                width: "6px", 
                height: "6px", 
                borderRadius: "50%", 
                background: "var(--accent)" 
              }} 
            />
            <span>Instant doctor booking through Telegram</span>
          </button>

          {/* Heading */}
          <h1
            className="hero-title"
            style={{
              marginBottom: "1.75rem",
              fontFamily: "var(--font)",
              fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
            }}
          >
            Book Specialists or
            <br />
            Manage Clinic Bookings
            <br />
            <span style={{ color: "var(--accent)" }}>All Inside Telegram</span>
          </h1>

          {/* Subhead */}
          <p
            className="hero-sub"
            style={{
              color: "var(--ink-soft)",
              fontSize: "18px",
              lineHeight: 1.5,
              fontWeight: 400,
              maxWidth: "600px",
              margin: "0 auto 3rem",
            }}
          >
            Your next clinical appointment is just a Telegram message away. No apps to download, no endless forms — just instant doctor scheduling and digital health cards for patients and forward-thinking clinics.
          </p>

          {/* Call to Actions (CTA row) */}
          <div
            className="cta-row"
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setIsBotModalOpen(true)}
              className="btn btn-primary"
            >
              <MessageCircle size={16} />
              <span>Use Telegram Bot</span>
              <ArrowRight size={16} />
            </button>
            
            <button
              onClick={() => {
                setHospitalNameInput("");
                setContactPersonInput("");
                setContactInfoInput("");
                setSubmitSuccess(false);
                setIsRegisterModalOpen(true);
              }}
              className="btn btn-secondary"
            >
              <Smartphone size={16} />
              <span>Register Hospital</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="process"
        ref={howItWorksRef}
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "2rem 2rem 7rem",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid var(--line)"
        }}
      >
        <h2 
          style={{ 
            fontSize: "2rem", 
            fontWeight: 700, 
            color: "var(--ink)", 
            letterSpacing: "-0.03em", 
            marginBottom: "3.5rem",
            marginTop: "3rem"
          }}
        >
          How It Works
        </h2>
        
        <div 
          className="features-grid"
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "2rem",
          }}
        >
          {/* Card 1 */}
          <div 
            className={`step-card spotlight-card ${howItWorksInView ? "in-view" : ""}`}
            style={{ 
              borderRadius: "16px",
            }}
          >
            <div 
              className="info-card-icon"
              style={{ 
                position: "relative"
              }}
            >
              <Search size={20} />
              <div className="icon-ping" />
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--ink-soft)", fontWeight: 500, display: "block", marginBottom: "0.25rem" }}>01. FIND & BOOK</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>Find a Doctor/Equipment</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5, fontWeight: 400 }}>
                Search and select verified medical professionals or equipment in real-time.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            className={`step-card spotlight-card ${howItWorksInView ? "in-view" : ""}`}
            style={{ 
              borderRadius: "16px",
            }}
          >
            <div 
              className="info-card-icon"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "8px"
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
                <div className="slot-dot"></div>
                <div className="slot-dot"></div>
                <div className="slot-dot"></div>
                <div className="slot-dot"></div>
                <div className="slot-dot selected"></div>
                <div className="slot-dot"></div>
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--ink-soft)", fontWeight: 500, display: "block", marginBottom: "0.25rem" }}>02. SELECT SLOT</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>Pick a Slot</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5, fontWeight: 400 }}>
                Choose a convenient appointment time or rental duration from the live schedule.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            className={`step-card spotlight-card ${howItWorksInView ? "in-view" : ""}`}
            style={{ 
              borderRadius: "16px",
            }}
          >
            <div className="info-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M4 12 L9 17 L20 6" 
                  stroke="var(--success)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="confirm-check" 
                />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--ink-soft)", fontWeight: 500, display: "block", marginBottom: "0.25rem" }}>03. SECURE & PAY</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>Confirm & Pay</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5, fontWeight: 400 }}>
                Authorize payment securely via Telebirr to receive your digital registration pass instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Traditional vs Modern contrast section */}
      <section 
        style={{ 
          background: "var(--surface)", 
          color: "var(--ink)", 
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          borderTop: "1px solid var(--line)"
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "7.5rem 2rem 8.5rem", textAlign: "center", position: "relative", zIndex: 1 }}>
          <p 
            style={{ 
              color: "var(--accent)", 
              fontWeight: 500, 
              fontSize: "0.9rem", 
              textTransform: "uppercase", 
              letterSpacing: "0.15em", 
              marginBottom: "1.25rem" 
            }}
          >
            The Healthcare Bottleneck
          </p>
          
          <h2 
            style={{ 
              fontSize: "clamp(2rem, 4.8vw, 3.2rem)", 
              fontWeight: 400, 
              color: "var(--ink)", 
              lineHeight: 1.15, 
              letterSpacing: "-0.04em", 
              marginBottom: "2rem" 
            }}
          >
            Hospital queues ignore your time.
            <br />
            Medical bookings shouldn't require cash checks.
          </h2>
          
          <p 
            style={{ 
              fontSize: "clamp(1.1rem, 2.2vw, 1.35rem)", 
              color: "var(--ink-soft)", 
              lineHeight: 1.65, 
              fontWeight: 400,
              maxWidth: "680px", 
              margin: "0 auto" 
            }}
          >
            General medical processes fumbled. Traditional clinical queues force long hours of waiting. BM Booking resolves this by bringing doctors, digital health credentials, and Telebirr wallet payments into a single, unified loop.
          </p>
        </div>
      </section>

      {/* Telegram Mini-App CTA Banner */}
      <section 
        id="telegram-bot"
        style={{
          maxWidth: "1000px",
          margin: "6rem auto",
          padding: "0 2rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="telegram-split glass transition-custom spotlight-card"
          style={{
            borderRadius: "var(--r-xl)",
            padding: "3.5rem 3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2.5rem",
          }}
        >
          {/* Left / Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
              <div 
                style={{ 
                  background: "var(--accent-soft)", 
                  width: "36px", 
                  height: "36px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}
              >
                <MessageCircle size={18} color="var(--accent)" />
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: 500, letterSpacing: "0.05em" }}>TELEGRAM MINI-APP</span>
            </div>

            <h3 style={{ fontSize: "1.9rem", fontWeight: 400, color: "var(--ink)", marginBottom: "0.75rem", letterSpacing: "-0.03em" }}>
              Prefer using Telegram?
            </h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6, maxWidth: "500px" }}>
              Skip the app store. Query medical slots, book consultations, and verify your health cards directly inside Telegram in a single loop.
            </p>
          </div>

          {/* Right / Button Action */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }} className="telegram-icon-container">
            <a
              href="https://t.me/BMBookingBot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 36px",
                height: "auto"
              }}
            >
              Open BM Booking Bot
              <ArrowRight size={18} />
            </a>
            <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontWeight: 500 }}>Direct link: <span style={{ fontFamily: "var(--font-mono)" }}>@BMBookingBot</span></span>
          </div>
        </div>
      </section>

      {/* Mobile App Download Final CTA */}
      <section 
        id="mobile-app"
        style={{ 
          background: "var(--bg)", 
          borderTop: "1px solid var(--line)", 
          padding: "6.5rem 2rem", 
          textAlign: "left" 
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "3rem" }} className="telegram-split">
          <div style={{ maxWidth: "600px" }}>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                fontWeight: 400,
                color: "var(--ink)",
                letterSpacing: "-0.04em",
                marginBottom: "1rem",
              }}
            >
              Take Control of Your Health Today
            </h2>
            <p
              style={{
                color: "var(--ink-soft)",
                fontSize: "1.05rem",
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Join thousands of patients who book clinical consultations and skip hospital queues with BM Booking.
            </p>
          </div>

          {/* Download Badges */}
          <div
            id="download"
            style={{
              display: "flex",
              gap: "1.25rem",
              justifyContent: "flex-start",
              flexWrap: "wrap",
              minWidth: "320px",
            }}
          >
            {/* Google Play */}
            <a
              href="https://play.google.com/store/apps/details?id=com.bmbooking"
              onClick={(e) => { e.preventDefault(); setIsComingSoonModalOpen(true); }}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 28px",
                borderRadius: "var(--r-md)",
                textDecoration: "none",
                fontSize: "0.9rem",
                background: "var(--accent)",
                color: "#ffffff",
                boxShadow: "var(--shadow-md)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
              </svg>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "0.6rem", display: "block", color: "rgba(255,255,255,0.6)", fontWeight: 500, lineHeight: 1 }}>GET IT ON</span>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600 }}>Google Play</span>
              </div>
            </a>

            {/* App Store */}
            <a
              href="https://apps.apple.com/app/bm-booking/id000000000"
              onClick={(e) => { e.preventDefault(); setIsComingSoonModalOpen(true); }}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 28px",
                borderRadius: "var(--r-md)",
                textDecoration: "none",
                fontSize: "0.9rem",
                background: "var(--surface)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow-sm)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.background = "var(--accent-soft)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.background = "var(--surface)";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.81 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.06 4.83 18.7 5.06 19.83 6.52C19.73 6.58 17.7 7.81 17.73 10.26C17.76 13.19 20.33 14.18 20.37 14.19C20.33 14.28 19.94 15.64 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "0.6rem", display: "block", color: "var(--ink-soft)", fontWeight: 500, lineHeight: 1 }}>DOWNLOAD ON THE</span>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600 }}>App Store</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "5rem 2rem 3.5rem",
          borderTop: "1px solid var(--line)",
          background: "var(--surface)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "4rem" }} className="features-grid">
          {/* Column 1 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <Stethoscope size={24} color="var(--accent)" />
              <span style={{ fontSize: "1.2rem", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em" }}>BM-Booking</span>
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", fontWeight: 400, lineHeight: 1.6, maxWidth: "260px" }}>
              Your digital health companion. Settle appointments, digital health registries, and Telebirr wallet pay-flows.
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
              Features
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {["Find & Book", "Digital Vitals", "Telebirr Pay", "Equipment Finder"].map(link => (
                <span key={link} style={{ color: "var(--ink-soft)", fontSize: "0.9rem", fontWeight: 400 }}>{link}</span>
              ))}
            </div>
          </div>

          {/* Column 3 */}
          <div>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
              Resources
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {["User Guides", "Telegram Bot", "API Reference", "Support Desk"].map(link => (
                <span key={link} style={{ color: "var(--ink-soft)", fontSize: "0.9rem", fontWeight: 400 }}>{link}</span>
              ))}
            </div>
          </div>

          {/* Column 4 */}
          <div>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
              Company
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <a href="https://possibletechplc.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink-soft)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 400 }}>possibletechplc.com</a>
              <Link href="/privacy-policy" style={{ color: "var(--ink-soft)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 400 }}>Privacy Policy</Link>
              <Link href="/terms-of-service" style={{ color: "var(--ink-soft)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 400 }}>Terms of Service</Link>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1100px", margin: "0 auto", borderTop: "1px solid var(--line)", paddingTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 400 }}>
            &copy; 2026 Possible Technology P.L.C. All rights reserved.
          </p>
          <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 400 }}>
            Developed by Possible Technology P.L.C.
          </span>
        </div>
      </footer>

      {/* General App Modal */}
      {isAppModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setIsAppModalOpen(false)}>
              <X size={16} />
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Smartphone size={20} color="var(--accent)" />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Get the Mobile App</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.4 }}>
                Keep your health cards synced, check diagnostic queues, and book specialists in Addis Ababa instantly.
              </p>
              
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0", background: "var(--accent-soft)", borderRadius: "12px" }}>
                <div style={{ background: "#ffffff", padding: "8px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                  <svg width="128" height="128" viewBox="0 0 100 100" fill="none">
                    <rect x="5" y="5" width="25" height="25" fill="var(--ink)" />
                    <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
                    <rect x="13" y="13" width="9" height="9" fill="var(--ink)" />

                    <rect x="70" y="5" width="25" height="25" fill="var(--ink)" />
                    <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
                    <rect x="78" y="13" width="9" height="9" fill="var(--ink)" />

                    <rect x="5" y="70" width="25" height="25" fill="var(--ink)" />
                    <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
                    <rect x="13" y="78" width="9" height="9" fill="var(--ink)" />

                    <rect x="40" y="10" width="8" height="8" fill="var(--ink)" />
                    <rect x="50" y="15" width="12" height="6" fill="var(--ink)" />
                    <rect x="45" y="30" width="10" height="10" fill="var(--ink)" />
                    <rect x="15" y="45" width="14" height="8" fill="var(--ink)" />
                    <rect x="35" y="50" width="8" height="12" fill="var(--ink)" />
                    <rect x="75" y="45" width="16" height="8" fill="var(--ink)" />
                    <rect x="70" y="65" width="10" height="12" fill="var(--ink)" />
                    <rect x="45" y="75" width="18" height="18" fill="var(--ink)" />
                    <rect x="55" y="70" width="8" height="8" fill="var(--ink)" />
                  </svg>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <a 
                  href="https://play.google.com/store" 
                  onClick={(e) => { e.preventDefault(); setIsAppModalOpen(false); setIsComingSoonModalOpen(true); }}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  Download on Google Play
                </a>
                <a 
                  href="https://apps.apple.com" 
                  onClick={(e) => { e.preventDefault(); setIsAppModalOpen(false); setIsComingSoonModalOpen(true); }}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-ghost"
                  style={{ width: "100%" }}
                >
                  Download on App Store
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Bot Modal */}
      {isBotModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setIsBotModalOpen(false)}>
              <X size={16} />
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageCircle size={20} color="var(--accent)" />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Telegram Integration</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.4 }}>
                Instant access without app stores. Query available appointments, check active tickets, and sync your health card in under 30 seconds.
              </p>
              
              <div style={{ background: "var(--accent-soft)", borderRadius: "12px", padding: "14px", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--ink-soft)" }}>Bot Handler:</span>
                  <span style={{ color: "var(--ink)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>@BMBookingBot</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--ink-soft)" }}>Features:</span>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>Vitals Sync, Telebirr Settle</span>
                </div>
              </div>

              <a 
                href="https://t.me/BMBookingBot" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                Launch Telegram Bot
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {isComingSoonModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setIsComingSoonModalOpen(false)}>
              <X size={16} />
            </button>
            <div className="modal-icon-circle">
              <Smartphone size={24} />
            </div>
            <h3>Coming Soon</h3>
            <p>
              The mobile app is in the works. In the meantime, book instantly through our Telegram bot — no download needed.
            </p>
            <a 
              href="https://t.me/BMBookingBot" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ width: "100%", textDecoration: "none" }}
            >
              Open Telegram Bot →
            </a>
          </div>
        </div>
      )}

      {/* Hospital Registration Modal */}
      {isRegisterModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="step-modal">
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                {!submitSuccess ? "Register Hospital" : ""}
              </h3>
              <button 
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  setSubmitSuccess(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-soft)",
                  padding: 0,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {!submitSuccess ? (
              <form onSubmit={handleSubmitHospitalApplication} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "14px", color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>
                  Onboard your facility to the Ketero ecosystem. Provide your details and connect with our Telegram registration bot.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px", fontWeight: 500 }}>
                      Hospital Name
                    </label>
                    <input 
                      type="text" 
                      required
                      value={hospitalNameInput}
                      onChange={e => setHospitalNameInput(e.target.value)}
                      placeholder="e.g. Black Lion Hospital"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "1px solid var(--line)",
                        background: "var(--surface)",
                        color: "var(--ink)",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px", fontWeight: 500 }}>
                      Contact Person
                    </label>
                    <input 
                      type="text" 
                      required
                      value={contactPersonInput}
                      onChange={e => setContactPersonInput(e.target.value)}
                      placeholder="e.g. Dr. Abebe Kebede"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "1px solid var(--line)",
                        background: "var(--surface)",
                        color: "var(--ink)",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px", fontWeight: 500 }}>
                      Contact Info (Phone or Email)
                    </label>
                    <input 
                      type="text" 
                      required
                      value={contactInfoInput}
                      onChange={e => setContactInfoInput(e.target.value)}
                      placeholder="e.g. +251 911 223 344 or admin@blacklion.com"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "1px solid var(--line)",
                        background: "var(--surface)",
                        color: "var(--ink)",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingApp}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    height: "46px",
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  {isSubmittingApp ? (
                    <>
                      <span className="spinner" style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block"
                      }} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    "Submit & Open Telegram Bot"
                  )}
                </button>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "10px 0 0" }}>
                <div style={{ 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "50%", 
                  backgroundColor: "var(--accent-soft)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "var(--accent)",
                  marginBottom: "16px" 
                }}>
                  <CheckCircle size={28} />
                </div>
                
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px" }}>
                  Request Sent
                </h3>
                
                <p style={{ fontSize: "14px", color: "var(--ink-soft)", lineHeight: 1.5, margin: "0 0 24px", maxWidth: "320px" }}>
                  Thanks — we've received your hospital's details. Our team will review and contact you shortly.
                </p>

                <button 
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setSubmitSuccess(false);
                  }}
                  className="btn btn-primary"
                  style={{ width: "100%", height: "46px" }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
