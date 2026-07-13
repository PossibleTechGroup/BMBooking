import LegalLayout from "@/components/LegalLayout";
import {
  BookOpen,
  CheckCircle,
  User,
  Activity,
  Calendar,
  DollarSign,
  Stethoscope,
  Wrench,
  Star,
  ShieldAlert,
  Shield,
  AlertTriangle,
  Users,
  LogOut,
  Globe,
  Edit,
  FileText,
  Mail,
  Info,
} from "lucide-react";

const toc = [
  { id: "s1", label: "Definitions", num: 1 },
  { id: "s2", label: "Eligibility", num: 2 },
  { id: "s3", label: "Account & Security", num: 3 },
  { id: "s4", label: "Service Description", num: 4 },
  { id: "s5", label: "Booking & Cancellation", num: 5 },
  { id: "s6", label: "Payment Terms", num: 6 },
  { id: "s7", label: "Doctor Terms", num: 7 },
  { id: "s8", label: "Equipment Finder", num: 8 },
  { id: "s9", label: "Reviews & Ratings", num: 9 },
  { id: "s10", label: "Prohibited Conduct", num: 10 },
  { id: "s11", label: "Intellectual Property", num: 11 },
  { id: "s12", label: "Disclaimers", num: 12 },
  { id: "s13", label: "Liability Limits", num: 13 },
  { id: "s14", label: "Indemnification", num: 14 },
  { id: "s15", label: "Termination", num: 15 },
  { id: "s16", label: "Governing Law", num: 16 },
  { id: "s17", label: "Modifications", num: 17 },
  { id: "s18", label: "Severability", num: 18 },
  { id: "s19", label: "Entire Agreement", num: 19 },
  { id: "s20", label: "Contact Us", num: 20 },
];

const sectionHeadStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: "0.85rem",
  paddingBottom: "0.65rem",
  borderBottom: "1px solid var(--border)",
};
const iconStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: "var(--r-sm)",
  background: "var(--ink)",
  color: "#fff",
  flexShrink: 0,
};
const h2Style = {
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "var(--text)",
  letterSpacing: "-0.015em",
  lineHeight: 1.2,
};
const h3Style = {
  fontSize: "0.88rem",
  fontWeight: 600,
  color: "var(--text)",
  margin: "1.1rem 0 0.4rem",
};
const pStyle = {
  fontSize: "0.88rem",
  color: "var(--text-body)",
  marginBottom: "0.75rem",
  lineHeight: 1.6,
};
const liStyle = {
  fontSize: "0.88rem",
  color: "var(--text-body)",
  lineHeight: 1.55,
  marginBottom: 4,
};
const ulStyle = {
  marginLeft: "1.25rem",
  marginBottom: "0.85rem",
};

function SectionHead({
  icon,
  icon: Icon,
  num,
  title,
}: {
  icon: React.ReactNode;
  num: number;
  title: string;
}) {
  return (
    <div style={sectionHeadStyle}>
      <div style={iconStyle}>{icon}</div>
      <h2 style={h2Style}>
        {num}. {title}
      </h2>
    </div>
  );
}

export default function TermsOfService() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Rules and guidelines governing your use of the BM Booking healthcare platform."
      toc={toc}
    >
      {/* Section 1 – Definitions */}
      <section id="s1">
        <SectionHead icon={<BookOpen size={16} />} num={1} title="Definitions" />
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>&quot;Service&quot;</strong> refers to the BM Booking
            platform, including the mobile app, web dashboards, Telegram Mini
            App, and API.
          </li>
          <li style={liStyle}>
            <strong>&quot;User,&quot; &quot;you,&quot; &quot;your&quot;</strong>{" "}
            refers to any individual accessing or using the Service, including
            patients, doctors, reception staff, and administrators.
          </li>
          <li style={liStyle}>
            <strong>&quot;Patient&quot;</strong> refers to a user who books
            appointments, discovers medical equipment, or uses healthcare
            services through the platform.
          </li>
          <li style={liStyle}>
            <strong>&quot;Doctor&quot;</strong> refers to a licensed healthcare
            professional registered on the platform.
          </li>
          <li style={liStyle}>
            <strong>&quot;Reception Staff&quot;</strong> refers to hospital staff
            who manage appointments and walk-in bookings.
          </li>
          <li style={liStyle}>
            <strong>&quot;Admin&quot;</strong> refers to platform administrators
            who manage the Service.
          </li>
          <li style={liStyle}>
            <strong>&quot;Content&quot;</strong> refers to text, images, videos,
            reviews, and any other material posted on the Service.
          </li>
        </ul>
      </section>

      {/* Section 2 – Eligibility */}
      <section id="s2">
        <SectionHead
          icon={<CheckCircle size={16} />}
          num={2}
          title="Eligibility"
        />
        <p style={pStyle}>To use the Service, you must:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Be at least 18 years of age, or have parental/guardian consent if
            under 18.
          </li>
          <li style={liStyle}>
            Have the legal capacity to enter into binding agreements.
          </li>
          <li style={liStyle}>
            Provide accurate and complete registration information.
          </li>
          <li style={liStyle}>
            Not be barred from using the Service under applicable law.
          </li>
        </ul>
        <p style={pStyle}>
          Doctors must additionally hold a valid medical license recognized in
          Ethiopia.
        </p>
      </section>

      {/* Section 3 – Account Registration & Security */}
      <section id="s3">
        <SectionHead
          icon={<User size={16} />}
          num={3}
          title="Account Registration & Security"
        />
        <h3 style={h3Style}>3.1 Registration</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Patients:</strong> Register via phone number and OTP
            verification. Complete your profile with name, date of birth, gender,
            blood type, and emergency contact.
          </li>
          <li style={liStyle}>
            <strong>Doctors:</strong> Register via phone number, complete
            professional onboarding (credentials, specialization, bio,
            availability), and await admin approval before offering services.
          </li>
          <li style={liStyle}>
            <strong>Reception Staff & Admins:</strong> Register via email and
            password as provisioned by the platform.
          </li>
        </ul>
        <h3 style={h3Style}>3.2 Account Security</h3>
        <p style={pStyle}>You are responsible for:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Maintaining the confidentiality of your account credentials
          </li>
          <li style={liStyle}>
            All activities that occur under your account
          </li>
          <li style={liStyle}>
            Immediately notifying us of any unauthorized access or security
            breach
          </li>
        </ul>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "0.85rem 1rem",
            borderRadius: "var(--r-md)",
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            margin: "0.85rem 0",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "var(--slate)", flexShrink: 0, marginTop: 1 }}
          />
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-body)" }}>
            We reserve the right to suspend or terminate accounts that show signs
            of unauthorized use.
          </p>
        </div>
        <h3 style={h3Style}>3.3 One Account Per Person</h3>
        <p style={pStyle}>
          Each individual may maintain only one account. Duplicate accounts may be
          merged or removed at our discretion.
        </p>
      </section>

      {/* Section 4 – Service Description */}
      <section id="s4">
        <SectionHead
          icon={<Activity size={16} />}
          num={4}
          title="Service Description"
        />
        <p style={pStyle}>
          BM Booking is a healthcare platform that provides:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Appointment Booking:</strong> Search for doctors by name or
            specialty, view schedules, and book appointments with integrated
            payment.
          </li>
          <li style={liStyle}>
            <strong>Medical Equipment Finder:</strong> Discover and book medical
            equipment (MRI, dialysis, etc.) at partnered hospitals.
          </li>
          <li style={liStyle}>
            <strong>Doctor Management:</strong> Profile creation, availability
            scheduling, and patient management for healthcare professionals.
          </li>
          <li style={liStyle}>
            <strong>Payment Processing:</strong> Secure payments via Telebirr and
            Chapa for appointment fees and equipment bookings.
          </li>
          <li style={liStyle}>
            <strong>Reviews & Ratings:</strong> Patient feedback on doctor
            consultations.
          </li>
          <li style={liStyle}>
            <strong>Notifications:</strong> Appointment confirmations, reminders,
            and status updates via SMS and in-app notifications.
          </li>
        </ul>
      </section>

      {/* Section 5 – Appointment Booking & Cancellation */}
      <section id="s5">
        <SectionHead
          icon={<Calendar size={16} />}
          num={5}
          title="Appointment Booking & Cancellation"
        />
        <h3 style={h3Style}>5.1 Booking</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Patients can book available time slots shown on a doctor&apos;s
            schedule.
          </li>
          <li style={liStyle}>
            Booking is confirmed only after successful payment of the
            consultation fee.
          </li>
          <li style={liStyle}>
            A confirmation notification is sent via SMS and in-app notification.
          </li>
        </ul>
        <h3 style={h3Style}>5.2 Cancellation & Rescheduling</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Patients may cancel or request rescheduling up to{" "}
            <strong>24 hours</strong> before the appointment time.
          </li>
          <li style={liStyle}>
            Cancellations within 24 hours may result in partial or no refund, as
            determined by the platform&apos;s refund policy.
          </li>
          <li style={liStyle}>
            Doctors may decline or reschedule appointments with reasonable
            notice.
          </li>
        </ul>
        <h3 style={h3Style}>5.3 No-Show Policy</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            If a patient fails to attend a confirmed appointment without prior
            cancellation, the consultation fee may be forfeited.
          </li>
          <li style={liStyle}>
            Repeated no-shows may result in account restrictions.
          </li>
        </ul>
        <h3 style={h3Style}>5.4 Walk-In Bookings</h3>
        <p style={pStyle}>
          Reception staff may create walk-in bookings on behalf of patients
          visiting a hospital. Walk-in appointments are subject to the same
          cancellation and no-show policies.
        </p>
      </section>

      {/* Section 6 – Payment Terms */}
      <section id="s6">
        <SectionHead
          icon={<DollarSign size={16} />}
          num={6}
          title="Payment Terms"
        />
        <h3 style={h3Style}>6.1 Payment Methods</h3>
        <p style={pStyle}>The Service supports payment via:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Telebirr:</strong> Ethiopian mobile money service
          </li>
          <li style={liStyle}>
            <strong>Chapa:</strong> Payment gateway supporting multiple payment
            methods
          </li>
        </ul>
        <h3 style={h3Style}>6.2 Fees</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Consultation fees are set by individual doctors and displayed before
            booking.
          </li>
          <li style={liStyle}>
            Visit card prices are set per hospital and may vary.
          </li>
          <li style={liStyle}>
            All fees are displayed in Ethiopian Birr (ETB).
          </li>
        </ul>
        <h3 style={h3Style}>6.3 Refunds</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Refunds for cancelled appointments are processed within{" "}
            <strong>5-7 business days</strong> to the original payment method.
          </li>
          <li style={liStyle}>
            Refund eligibility depends on the timing of cancellation and the
            applicable refund policy at the time of booking.
          </li>
        </ul>
        <h3 style={h3Style}>6.4 Doctor Wallets</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Earnings from consultations are credited to the doctor&apos;s in-app
            wallet.
          </li>
          <li style={liStyle}>
            Doctors may request withdrawals, subject to platform processing times
            and minimum threshold requirements.
          </li>
        </ul>
      </section>

      {/* Section 7 – Doctor-Specific Terms */}
      <section id="s7">
        <SectionHead
          icon={<Stethoscope size={16} />}
          num={7}
          title="Doctor-Specific Terms"
        />
        <h3 style={h3Style}>7.1 Onboarding & Approval</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Doctors must complete a multi-step onboarding process including
            professional details, profile photo, availability schedule, and
            hospital assignment.
          </li>
          <li style={liStyle}>
            All doctor profiles are reviewed and approved by platform
            administrators before becoming active.
          </li>
          <li style={liStyle}>
            We reserve the right to reject or revoke approval for profiles that
            do not meet our standards or contain misleading information.
          </li>
        </ul>
        <h3 style={h3Style}>7.2 Doctor Obligations</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Maintain accurate and up-to-date professional information.
          </li>
          <li style={liStyle}>
            Honor confirmed appointments or provide timely notice of
            cancellation/rescheduling.
          </li>
          <li style={liStyle}>
            Maintain appropriate medical licensure and professional standards.
          </li>
          <li style={liStyle}>
            Respond to patient inquiries in a timely manner.
          </li>
        </ul>
        <h3 style={h3Style}>7.3 Availability Management</h3>
        <p style={pStyle}>
          Doctors are responsible for maintaining their weekly availability
          schedule. Failure to update availability may result in missed
          appointments and patient dissatisfaction.
        </p>
      </section>

      {/* Section 8 – Medical Equipment Finder */}
      <section id="s8">
        <SectionHead
          icon={<Wrench size={16} />}
          num={8}
          title="Medical Equipment Finder"
        />
        <ul style={ulStyle}>
          <li style={liStyle}>
            The platform provides information about medical equipment available at
            partnered hospitals.
          </li>
          <li style={liStyle}>
            Equipment listings are for informational purposes and subject to
            availability.
          </li>
          <li style={liStyle}>
            BM Booking does not guarantee the accuracy of equipment listings or
            the quality of medical services provided by hospitals.
          </li>
          <li style={liStyle}>
            Equipment bookings require reception confirmation before they are
            finalized.
          </li>
        </ul>
      </section>

      {/* Section 9 – Reviews & Ratings */}
      <section id="s9">
        <SectionHead
          icon={<Star size={16} />}
          num={9}
          title="Reviews & Ratings"
        />
        <ul style={ulStyle}>
          <li style={liStyle}>
            Patients may leave reviews and ratings (1-5 stars) after completed
            appointments.
          </li>
          <li style={liStyle}>
            Reviews must be honest, relevant, and not contain offensive,
            defamatory, or misleading content.
          </li>
          <li style={liStyle}>
            We reserve the right to remove reviews that violate these Terms.
          </li>
          <li style={liStyle}>
            Doctors may respond to reviews but may not retaliate against patients
            for negative feedback.
          </li>
          <li style={liStyle}>
            Aggregate ratings are displayed publicly on doctor profiles.
          </li>
        </ul>
      </section>

      {/* Section 10 – Prohibited Conduct */}
      <section id="s10">
        <SectionHead
          icon={<ShieldAlert size={16} />}
          num={10}
          title="Prohibited Conduct"
        />
        <p style={pStyle}>You agree not to:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Use the Service for any unlawful purpose or in violation of any
            regulations
          </li>
          <li style={liStyle}>
            Impersonate another person or misrepresent your identity or
            qualifications
          </li>
          <li style={liStyle}>
            Post false, misleading, or defamatory content
          </li>
          <li style={liStyle}>
            Attempt to gain unauthorized access to any part of the Service or
            other users&apos; accounts
          </li>
          <li style={liStyle}>
            Interfere with or disrupt the Service, servers, or networks
          </li>
          <li style={liStyle}>
            Harvest or collect personal information of other users without their
            consent
          </li>
          <li style={liStyle}>
            Use automated tools (bots, scrapers) to access or interact with the
            Service
          </li>
          <li style={liStyle}>
            Circumvent any security features, rate limits, or access controls
          </li>
          <li style={liStyle}>
            Offer medical advice outside the scope of a confirmed consultation
            through the platform
          </li>
          <li style={liStyle}>
            Manipulate ratings, reviews, or booking records
          </li>
        </ul>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "0.85rem 1rem",
            borderRadius: "var(--r-md)",
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            margin: "0.85rem 0",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "var(--slate)", flexShrink: 0, marginTop: 1 }}
          />
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-body)" }}>
            Violation of these prohibitions may result in immediate account
            suspension or termination without prior notice.
          </p>
        </div>
      </section>

      {/* Section 11 – Intellectual Property */}
      <section id="s11">
        <SectionHead
          icon={<Shield size={16} />}
          num={11}
          title="Intellectual Property"
        />
        <h3 style={h3Style}>11.1 Our Intellectual Property</h3>
        <p style={pStyle}>
          All content, features, design, code, logos, and trademarks associated
          with BM Booking are the exclusive property of the platform and are
          protected by applicable intellectual property laws. You may not copy,
          modify, distribute, or reverse-engineer any part of the Service without
          our written consent.
        </p>
        <h3 style={h3Style}>11.2 User Content</h3>
        <p style={pStyle}>
          By posting content (reviews, profile information, etc.) on the Service,
          you grant us a non-exclusive, worldwide, royalty-free license to use,
          display, reproduce, and distribute that content in connection with
          operating and improving the Service.
        </p>
      </section>

      {/* Section 12 – Disclaimers */}
      <section id="s12">
        <SectionHead
          icon={<Info size={16} />}
          num={12}
          title="Disclaimers"
        />
        <ul style={ulStyle}>
          <li style={liStyle}>
            The Service is provided &quot;as is&quot; and &quot;as available&quot;
            without warranties of any kind, whether express or implied.
          </li>
          <li style={liStyle}>
            We do not guarantee uninterrupted, error-free, or secure operation of
            the Service.
          </li>
          <li style={liStyle}>
            The Service is a platform for connecting patients with healthcare
            providers. We are <strong>not</strong> a medical provider and do not
            provide medical advice, diagnosis, or treatment.
          </li>
          <li style={liStyle}>
            Any medical advice or treatment is solely between the patient and the
            healthcare provider.
          </li>
          <li style={liStyle}>
            We do not endorse or guarantee the quality, qualifications, or
            availability of any doctor or hospital listed on the platform.
          </li>
          <li style={liStyle}>
            Information about medical equipment is provided for convenience and
            may not be current or complete.
          </li>
        </ul>
      </section>

      {/* Section 13 – Limitation of Liability */}
      <section id="s13">
        <SectionHead
          icon={<FileText size={16} />}
          num={13}
          title="Limitation of Liability"
        />
        <p style={pStyle}>
          To the maximum extent permitted by applicable law:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            BM Booking shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of the
            Service.
          </li>
          <li style={liStyle}>
            Our total liability for any claims related to the Service shall not
            exceed the amount you paid to us in the 12 months preceding the
            claim, or ETB 1,000, whichever is greater.
          </li>
          <li style={liStyle}>
            We are not liable for damages resulting from third-party services
            (Telebirr, Chapa, Google Maps, Telegram) integrated into the
            platform.
          </li>
          <li style={liStyle}>
            We are not liable for any harm arising from medical decisions made
            based on information on the platform.
          </li>
        </ul>
      </section>

      {/* Section 14 – Indemnification */}
      <section id="s14">
        <SectionHead
          icon={<Users size={16} />}
          num={14}
          title="Indemnification"
        />
        <p style={pStyle}>
          You agree to indemnify, defend, and hold harmless BM Booking, its
          officers, directors, employees, and agents from and against any claims,
          liabilities, damages, losses, and expenses (including reasonable legal
          fees) arising from:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>Your use of the Service</li>
          <li style={liStyle}>Your violation of these Terms</li>
          <li style={liStyle}>
            Your violation of any rights of a third party
          </li>
          <li style={liStyle}>
            Any content you submit or transmit through the Service
          </li>
        </ul>
      </section>

      {/* Section 15 – Account Termination */}
      <section id="s15">
        <SectionHead
          icon={<LogOut size={16} />}
          num={15}
          title="Account Termination"
        />
        <h3 style={h3Style}>15.1 By You</h3>
        <p style={pStyle}>
          You may delete your account at any time through the app settings or by
          contacting support. Account deletion is permanent and may take up to 30
          days to process.
        </p>
        <h3 style={h3Style}>15.2 By Us</h3>
        <p style={pStyle}>We may suspend or terminate your account if:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            You violate these Terms or any applicable policy
          </li>
          <li style={liStyle}>
            Your conduct poses a risk to the Service or other users
          </li>
          <li style={liStyle}>We are required to do so by law</li>
          <li style={liStyle}>The Service is discontinued</li>
        </ul>
        <p style={pStyle}>
          Upon termination, your right to use the Service ceases immediately. We
          may retain certain data as required by law or for legitimate business
          purposes.
        </p>
      </section>

      {/* Section 16 – Governing Law & Dispute Resolution */}
      <section id="s16">
        <SectionHead
          icon={<Globe size={16} />}
          num={16}
          title="Governing Law & Dispute Resolution"
        />
        <p style={pStyle}>
          These Terms are governed by and construed in accordance with the laws
          of the Federal Democratic Republic of Ethiopia.
        </p>
        <p style={pStyle}>
          Any dispute arising from or relating to these Terms or the Service
          shall first be resolved through good-faith negotiation. If negotiation
          fails, disputes shall be submitted to the competent courts of Addis
          Ababa, Ethiopia.
        </p>
      </section>

      {/* Section 17 – Modifications to These Terms */}
      <section id="s17">
        <SectionHead
          icon={<Edit size={16} />}
          num={17}
          title="Modifications to These Terms"
        />
        <p style={pStyle}>
          We reserve the right to modify these Terms at any time. We will notify
          you of material changes by:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Posting the updated Terms on the Service with a new &quot;Last
            Updated&quot; date
          </li>
          <li style={liStyle}>
            Sending an in-app notification or SMS for significant changes
          </li>
        </ul>
        <p style={pStyle}>
          Continued use of the Service after changes take effect constitutes
          acceptance of the revised Terms. If you do not agree to the modified
          Terms, you must stop using the Service.
        </p>
      </section>

      {/* Section 18 – Severability */}
      <section id="s18">
        <SectionHead
          icon={<Activity size={16} />}
          num={18}
          title="Severability"
        />
        <p style={pStyle}>
          If any provision of these Terms is found to be unenforceable or
          invalid, that provision shall be limited or eliminated to the minimum
          extent necessary, and the remaining provisions shall remain in full
          force and effect.
        </p>
      </section>

      {/* Section 19 – Entire Agreement */}
      <section id="s19">
        <SectionHead
          icon={<FileText size={16} />}
          num={19}
          title="Entire Agreement"
        />
        <p style={pStyle}>
          These Terms, together with our Privacy Policy, constitute the entire
          agreement between you and BM Booking regarding the use of the Service
          and supersede all prior agreements and understandings.
        </p>
      </section>

      {/* Section 20 – Contact Us */}
      <section id="s20">
        <SectionHead
          icon={<Mail size={16} />}
          num={20}
          title="Contact Us"
        />
        <p style={pStyle}>
          If you have any questions about these Terms, please contact us:
        </p>
        <p style={pStyle}>
          <strong>Possible Technology P.L.C</strong>
          <br />
          Email:{" "}
          <a href="mailto:possiblework2026@gmail.com">
            possiblework2026@gmail.com
          </a>
          <br />
          Website:{" "}
          <a
            href="https://possibletechplc.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            possibletechplc.com
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
