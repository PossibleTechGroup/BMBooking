import LegalLayout from "@/components/LegalLayout";
import {
  User,
  FileText,
  Activity,
  Share2,
  Clock,
  Lock,
  CheckCircle,
  Cookie,
  Users,
  MapPin,
  ExternalLink,
  Globe,
  Edit,
  Mail,
  Shield,
  AlertTriangle,
  Info,
} from "lucide-react";

const toc = [
  { id: "s1", label: "Data Controller", num: 1 },
  { id: "s2", label: "Information We Collect", num: 2 },
  { id: "s3", label: "How We Use Your Data", num: 3 },
  { id: "s4", label: "How We Share Your Data", num: 4 },
  { id: "s5", label: "Data Retention", num: 5 },
  { id: "s6", label: "Data Security", num: 6 },
  { id: "s7", label: "Your Rights", num: 7 },
  { id: "s8", label: "Cookies & Tracking", num: 8 },
  { id: "s9", label: "Children\u2019s Privacy", num: 9 },
  { id: "s10", label: "Location Services", num: 10 },
  { id: "s11", label: "Third-Party Services", num: 11 },
  { id: "s12", label: "International Data Transfers", num: 12 },
  { id: "s13", label: "Changes to This Policy", num: 13 },
  { id: "s14", label: "Contact Us", num: 14 },
];

const sectionHeadStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: "0.85rem",
  paddingBottom: "0.65rem",
  borderBottom: "1px solid var(--line)",
};
const iconStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: "8px",
  background: "var(--accent-soft)",
  color: "var(--ink)",
  flexShrink: 0,
};
const h2Style = {
  fontSize: "1.15rem",
  fontWeight: 650,
  color: "var(--ink)",
  letterSpacing: "-0.015em",
  lineHeight: 1.2,
};
const h3Style = {
  fontSize: "0.92rem",
  fontWeight: 600,
  color: "var(--ink)",
  margin: "1.1rem 0 0.4rem",
};
const pStyle = {
  fontSize: "0.9rem",
  color: "var(--ink-soft)",
  marginBottom: "0.75rem",
  lineHeight: 1.65,
  fontWeight: 400,
};
const liStyle = {
  fontSize: "0.9rem",
  color: "var(--ink-soft)",
  lineHeight: 1.6,
  marginBottom: 4,
  fontWeight: 400,
};
const ulStyle = {
  marginLeft: "1.25rem",
  marginBottom: "0.85rem",
};
const tableStyle = {
  width: "100%",
  borderCollapse: "separate" as const,
  borderSpacing: 0,
  margin: "0.85rem 0",
  border: "1px solid var(--line)",
  borderRadius: "12px",
  overflow: "hidden",
  fontSize: "0.85rem",
};
const thStyle = {
  background: "var(--accent-soft)",
  fontWeight: 600,
  color: "var(--ink)",
  textAlign: "left" as const,
  padding: "0.65rem 0.85rem",
  borderBottom: "1px solid var(--line)",
  fontSize: "0.82rem",
};
const tdStyle = {
  padding: "0.6rem 0.85rem",
  color: "var(--ink-soft)",
  borderBottom: "1px solid var(--line)",
  verticalAlign: "top" as const,
  lineHeight: 1.5,
  fontWeight: 400,
};

const calloutStyle = {
  display: "flex",
  alignItems: "flex-start" as const,
  gap: 10,
  padding: "0.85rem 1rem",
  borderRadius: "12px",
  background: "var(--accent-soft)",
  border: "1px solid var(--line)",
  margin: "0.85rem 0",
};

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How BM Booking collects, uses, and protects your personal and health information."
      toc={toc}
    >
      <section id="s1">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <User size={16} />
          </div>
          <h2 style={h2Style}>1. Data Controller</h2>
        </div>
        <p style={pStyle}>The entity responsible for your personal data is:</p>
        <p style={pStyle}>
          <strong>Possible Technology P.L.C</strong>
          <br />
          Website:{" "}
          <a href="https://possibletechplc.com" target="_blank" rel="noopener" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
            possibletechplc.com
          </a>
          <br />
          Email:{" "}
          <a href="mailto:possiblework2026@gmail.com" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
            possiblework2026@gmail.com
          </a>
        </p>
      </section>

      <section id="s2">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <FileText size={16} />
          </div>
          <h2 style={h2Style}>2. Information We Collect</h2>
        </div>
        <h3 style={h3Style}>2.1 Account &amp; Identity Information</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Full name, phone number, email address, username, and password
          </li>
          <li style={liStyle}>
            Date of birth, gender, blood type, emergency contact details
          </li>
          <li style={liStyle}>
            Professional credentials, license number, specialization, bio, and
            languages spoken (doctors)
          </li>
          <li style={liStyle}>
            Profile photographs and introductory videos (doctors)
          </li>
          <li style={liStyle}>Clinic name and address (doctors)</li>
        </ul>
        <h3 style={h3Style}>2.2 Health &amp; Medical Information</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Appointment records, booking history, and consultation details
          </li>
          <li style={liStyle}>
            Medical equipment usage and booking records
          </li>
          <li style={liStyle}>
            Reasons for visit, notes, and file attachments
          </li>
          <li style={liStyle}>
            Reviews and ratings you provide about doctors
          </li>
        </ul>
        <h3 style={h3Style}>2.3 Payment Information</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Transaction records for appointment fees and equipment bookings
          </li>
          <li style={liStyle}>
            Bank account details and mobile money account information (for
            doctors receiving payments)
          </li>
          <li style={liStyle}>
            Telebirr and Chapa payment identifiers \u2014 we do not store full
            payment card or mobile money credentials
          </li>
          <li style={liStyle}>
            Doctor wallet balances and withdrawal requests
          </li>
        </ul>
        <h3 style={h3Style}>2.4 Device &amp; Location Information</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Device type, operating system, and unique device identifiers
          </li>
          <li style={liStyle}>
            Approximate or precise location data (when you grant permission) for
            finding nearby hospitals and equipment
          </li>
          <li style={liStyle}>
            IP address, browser type, access times, and referring URLs
          </li>
        </ul>
        <h3 style={h3Style}>2.5 Usage Data</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Pages visited, features used, time spent on the Platform, and
            interaction patterns
          </li>
          <li style={liStyle}>
            Search queries (e.g., doctor names, specialties, equipment types)
          </li>
          <li style={liStyle}>
            Push notification preferences and engagement
          </li>
        </ul>
        <h3 style={h3Style}>2.6 Information from Third Parties</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Telegram:</strong> When you use our Telegram bot or mini app,
            we receive your Telegram user ID and chat interactions
          </li>
          <li style={liStyle}>
            <strong>Payment Processors:</strong> Chapa and Telebirr provide
            transaction confirmations and references
          </li>
        </ul>
      </section>

      <section id="s3">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <Activity size={16} />
          </div>
          <h2 style={h2Style}>3. How We Use Your Data</h2>
        </div>
        <p style={pStyle}>We use your information to:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Provide the Service:</strong> Process appointment bookings,
            manage doctor schedules, facilitate payments, and enable equipment
            discovery
          </li>
          <li style={liStyle}>
            <strong>Account Management:</strong> Create and maintain your account,
            verify your identity via OTP, and manage your profile
          </li>
          <li style={liStyle}>
            <strong>Communications:</strong> Send appointment confirmations,
            reminders, status updates, and service-related notifications via SMS
            and in-app notifications
          </li>
          <li style={liStyle}>
            <strong>Doctor Onboarding:</strong> Review and approve doctor
            profiles, verify credentials, and manage the approval workflow
          </li>
          <li style={liStyle}>
            <strong>Payments:</strong> Process transactions through Telebirr and
            Chapa, manage doctor wallets, and track payouts
          </li>
          <li style={liStyle}>
            <strong>Improvement:</strong> Analyze usage patterns to improve our
            platform, features, and user experience
          </li>
          <li style={liStyle}>
            <strong>Safety &amp; Compliance:</strong> Detect and prevent fraud,
            enforce our Terms of Service, and comply with legal obligations
          </li>
          <li style={liStyle}>
            <strong>Recommendations:</strong> Provide personalized doctor
            suggestions based on your preferences and history
          </li>
        </ul>
      </section>

      <section id="s4">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <Share2 size={16} />
          </div>
          <h2 style={h2Style}>4. How We Share Your Data</h2>
        </div>
        <p style={pStyle}>We may share your information with:</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Recipient</th>
              <th style={thStyle}>Purpose</th>
              <th style={thStyle}>Data Shared</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>
                <strong>Cloudinary</strong>
              </td>
              <td style={tdStyle}>Image and video hosting</td>
              <td style={tdStyle}>
                Profile pictures, intro videos, appointment attachments
              </td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>AfroMessage</strong>
              </td>
              <td style={tdStyle}>SMS notifications</td>
              <td style={tdStyle}>Phone number, appointment details</td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Chapa</strong>
              </td>
              <td style={tdStyle}>Payment processing</td>
              <td style={tdStyle}>Name, email, transaction amount, reference</td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Telebirr</strong>
              </td>
              <td style={tdStyle}>Payment processing</td>
              <td style={tdStyle}>Transaction amounts and references</td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Telegram</strong>
              </td>
              <td style={tdStyle}>Bot and mini app functionality</td>
              <td style={tdStyle}>Telegram user ID, chat messages</td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Healthcare Providers</strong>
              </td>
              <td style={tdStyle}>Appointment and care coordination</td>
              <td style={tdStyle}>
                Patient name, contact details, relevant medical information
              </td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Reception Staff</strong>
              </td>
              <td style={tdStyle}>Hospital appointment management</td>
              <td style={tdStyle}>
                Appointment details at their assigned hospitals
              </td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Administrators</strong>
              </td>
              <td style={tdStyle}>Support, moderation, and compliance</td>
              <td style={tdStyle}>As needed for platform operations</td>
            </tr>
          </tbody>
        </table>
        <div style={calloutStyle}>
          <Shield
            size={16}
            style={{ color: "var(--ink-soft)", flexShrink: 0, marginTop: 1 }}
          />
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 400 }}>
            We do <strong>not</strong> sell your personal data to third parties
            for advertising or marketing purposes.
          </p>
        </div>
      </section>

      <section id="s5">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <Clock size={16} />
          </div>
          <h2 style={h2Style}>5. Data Retention</h2>
        </div>
        <p style={pStyle}>
          We retain your personal data for as long as your account is active or
          as needed to provide the Service. Specifically:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Account data:</strong> Retained until you request account
            deletion
          </li>
          <li style={liStyle}>
            <strong>Appointment records:</strong> Retained for a minimum of 5
            years for medical record-keeping purposes
          </li>
          <li style={liStyle}>
            <strong>Payment records:</strong> Retained as required by Ethiopian
            financial regulations
          </li>
          <li style={liStyle}>
            <strong>Usage data:</strong> Anonymized after 24 months
          </li>
        </ul>
        <p style={pStyle}>
          When data is no longer needed, it is securely deleted or anonymized.
        </p>
      </section>

      <section id="s6">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <Lock size={16} />
          </div>
          <h2 style={h2Style}>6. Data Security</h2>
        </div>
        <p style={pStyle}>
          We implement industry-standard security measures including:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Encryption of data in transit (TLS/HTTPS) and at rest
          </li>
          <li style={liStyle}>
            Secure authentication with OTP verification and JWT tokens
          </li>
          <li style={liStyle}>Bcrypt password hashing</li>
          <li style={liStyle}>
            Role-based access controls across all user types
          </li>
          <li style={liStyle}>
            Regular security audits and vulnerability assessments
          </li>
          <li style={liStyle}>
            Secure hosting infrastructure with Docker containerization
          </li>
        </ul>
        <div style={calloutStyle}>
          <AlertTriangle
            size={16}
            style={{ color: "var(--ink-soft)", flexShrink: 0, marginTop: 1 }}
          />
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 400 }}>
            While we strive to protect your data, no method of transmission or
            storage is 100% secure. We cannot guarantee absolute security.
          </p>
        </div>
      </section>

      <section id="s7">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <CheckCircle size={16} />
          </div>
          <h2 style={h2Style}>7. Your Rights</h2>
        </div>
        <p style={pStyle}>
          You have the following rights regarding your personal data:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Access:</strong> Request a copy of the personal data we hold
            about you
          </li>
          <li style={liStyle}>
            <strong>Correction:</strong> Request correction of inaccurate or
            incomplete data
          </li>
          <li style={liStyle}>
            <strong>Deletion:</strong> Request deletion of your personal data,
            subject to legal retention requirements
          </li>
          <li style={liStyle}>
            <strong>Data Portability:</strong> Request your data in a structured,
            commonly used, machine-readable format
          </li>
          <li style={liStyle}>
            <strong>Withdraw Consent:</strong> Withdraw consent for data
            processing at any time (this may affect Service availability)
          </li>
          <li style={liStyle}>
            <strong>Object to Processing:</strong> Object to processing based on
            legitimate interests
          </li>
        </ul>
        <p style={pStyle}>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:possiblework2026@gmail.com" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
            possiblework2026@gmail.com
          </a>
          .
        </p>
      </section>

      <section id="s8">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <Cookie size={16} />
          </div>
          <h2 style={h2Style}>8. Cookies &amp; Tracking</h2>
        </div>
        <p style={pStyle}>
          Our web dashboards and Telegram Mini App may use cookies and similar
          technologies to:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Essential Cookies:</strong> Required for the Platform to
            function (e.g., authentication tokens, session management)
          </li>
          <li style={liStyle}>
            <strong>Preference Cookies:</strong> Remember your settings (e.g.,
            time format, calendar preferences)
          </li>
          <li style={liStyle}>
            <strong>Analytics Cookies:</strong> Currently, we do not use
            third-party analytics cookies. If we implement analytics in the
            future, we will update this policy and seek your consent where
            required
          </li>
        </ul>
        <p style={pStyle}>
          You can control cookie settings through your browser. Disabling
          certain cookies may affect Platform functionality.
        </p>
      </section>

      <section id="s9">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <Users size={16} />
          </div>
          <h2 style={h2Style}>9. Children&apos;s Privacy</h2>
        </div>
        <p style={pStyle}>
          The Service is not intended for children under the age of 18. We do not
          knowingly collect personal data from children. If a parent or guardian
          becomes aware that their child has provided us with personal data,
          please contact us immediately. We will take steps to delete such
          information promptly.
        </p>
        <p style={pStyle}>
          For patients under 18, a parent or legal guardian must create and
          manage the account on their behalf.
        </p>
      </section>

      <section id="s10">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <MapPin size={16} />
          </div>
          <h2 style={h2Style}>10. Location Services</h2>
        </div>
        <p style={pStyle}>
          With your permission, we collect location data to:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>Show nearby hospitals and medical equipment</li>
          <li style={liStyle}>
            Provide directions via integrated Google Maps
          </li>
          <li style={liStyle}>Improve search results based on proximity</li>
        </ul>
        <p style={pStyle}>
          You can disable location services at any time through your device
          settings. Disabling location may affect certain features of the
          Service.
        </p>
      </section>

      <section id="s11">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <ExternalLink size={16} />
          </div>
          <h2 style={h2Style}>11. Third-Party Services</h2>
        </div>
        <p style={pStyle}>
          The Service integrates with third-party services that have their own
          privacy policies:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Telebirr</strong> \u2014 Mobile money payment processing
          </li>
          <li style={liStyle}>
            <strong>Chapa</strong> \u2014 Payment gateway
          </li>
          <li style={liStyle}>
            <strong>Google Maps</strong> \u2014 Location and mapping services
          </li>
          <li style={liStyle}>
            <strong>Telegram</strong> \u2014 Mini App platform and bot
          </li>
          <li style={liStyle}>
            <strong>Expo</strong> \u2014 Push notification services
          </li>
          <li style={liStyle}>
            <strong>Cloudinary</strong> \u2014 Image and video hosting
          </li>
        </ul>
        <p style={pStyle}>
          We encourage you to review the privacy policies of these third-party
          services.
        </p>
      </section>

      <section id="s12">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <Globe size={16} />
          </div>
          <h2 style={h2Style}>12. International Data Transfers</h2>
        </div>
        <p style={pStyle}>
          Your data is primarily stored and processed in Ethiopia. If data is
          transferred to or processed in other countries, we ensure appropriate
          safeguards are in place to protect your information in accordance with
          this Privacy Policy.
        </p>
      </section>

      <section id="s13">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <Edit size={16} />
          </div>
          <h2 style={h2Style}>13. Changes to This Policy</h2>
        </div>
        <p style={pStyle}>
          We may update this Privacy Policy from time to time. We will notify you
          of significant changes by:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Posting the updated policy on the Service with a new &quot;Last
            Updated&quot; date
          </li>
          <li style={liStyle}>
            Sending an in-app notification or SMS for material changes
          </li>
        </ul>
        <p style={pStyle}>
          Your continued use of the Service after changes are posted constitutes
          acceptance of the updated policy.
        </p>
      </section>

      <section id="s14">
        <div style={sectionHeadStyle}>
          <div style={iconStyle}>
            <Mail size={16} />
          </div>
          <h2 style={h2Style}>14. Contact Us</h2>
        </div>
        <p style={pStyle}>
          If you have any questions, concerns, or requests regarding this Privacy
          Policy or our data practices, please contact us:
        </p>
        <p style={pStyle}>
          <strong>Possible Technology P.L.C</strong>
          <br />
          Email:{" "}
          <a href="mailto:possiblework2026@gmail.com" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
            possiblework2026@gmail.com
          </a>
          <br />
          Website:{" "}
          <a href="https://possibletechplc.com" target="_blank" rel="noopener" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
            possibletechplc.com
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
