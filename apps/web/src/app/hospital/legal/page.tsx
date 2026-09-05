'use client';

import React, { useState } from 'react';
import { Shield, FileText } from 'lucide-react';
import { MedText } from '@/components/ui/med-text';

const PRIVACY_SECTIONS = [
  {
    heading: '1. Introduction',
    body: `Possible Technology P.L.C ("we," "us," or "our") operates the BM Booking healthcare management platform, including the BM Booking mobile application, web dashboards, Telegram bot and mini app, and related services (collectively, the "Platform").\n\nThis Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform. Please read this policy carefully.`,
  },
  {
    heading: '2. Information We Collect',
    subsections: [
      {
        sub: '2.1 Information You Provide',
        items: [
          'Account Information: full name, phone number, email address, username, and password.',
          'Profile Information: date of birth, gender, blood type, emergency contact details.',
          'Professional Information (doctors): specialization, license number, years of experience, bio, languages spoken, clinic name and address, profile pictures and introductory videos.',
          'Appointment Information: appointment dates and times, reasons for visit, notes, and file attachments.',
          'Payment Information: bank account details and mobile money account information (for doctors receiving payments). Payment card details are processed directly by our third-party payment processors and are not stored by us.',
          'Reviews and Ratings: feedback you provide about doctors.',
        ],
      },
      {
        sub: '2.2 Information Collected Automatically',
        items: [
          'Device Information: device type, operating system, and unique device identifiers.',
          'Usage Data: pages visited, features used, time spent on the Platform, and interaction data.',
          'Log Data: IP address, browser type, access times, and referring URLs.',
          'Cookies and Similar Technologies: see Section 8 (Cookies) below.',
        ],
      },
      {
        sub: '2.3 Information from Third Parties',
        items: [
          'Telegram: when you use our Telegram bot or mini app, we receive your Telegram user ID and chat interactions.',
          'Payment Processors: Chapa and Telebirr provide us with transaction confirmations and references.',
        ],
      },
    ],
  },
  {
    heading: '3. How We Use Your Information',
    items: [
      'To create and manage your account.',
      'To facilitate appointments between patients and doctors.',
      'To process payments and disbursements.',
      'To send appointment reminders and notifications via SMS (through AfroMessage) and push notifications.',
      'To enable communication between patients, doctors, receptionists, and administrators.',
      'To verify doctor credentials and licenses.',
      'To improve and optimize the Platform.',
      'To comply with legal obligations and enforce our Terms of Use.',
      'To detect and prevent fraud or abuse.',
    ],
  },
  {
    heading: '4. How We Share Your Information',
    body: 'We share your information only as described below:',
    table: {
      headers: ['Recipient', 'Purpose', 'Data Shared'],
      rows: [
        ['Cloudinary', 'Image and video hosting', 'Profile pictures, intro videos, appointment attachments'],
        ['AfroMessage', 'SMS notifications', 'Phone number, appointment details'],
        ['Chapa', 'Payment processing', 'Name, email, transaction amount, reference'],
        ['Telebirr', 'Payment processing', 'Transaction amounts and references'],
        ['Telegram', 'Bot and mini app functionality', 'Telegram user ID, chat messages'],
        ['Healthcare Providers', 'Appointment and care coordination', 'Patient name, contact details, medical information relevant to the appointment'],
      ],
    },
    footer: 'We do not sell your personal information to third parties.',
  },
  {
    heading: '5. Data Retention',
    body: 'We retain your personal information for as long as your account is active or as needed to provide you services. We may retain certain information longer to comply with legal obligations, resolve disputes, and enforce our agreements.',
  },
  {
    heading: '6. Data Security',
    body: 'We implement appropriate technical and organizational measures to protect your personal information, including:',
    items: [
      'Encryption of data in transit (TLS) and at rest.',
      'Secure authentication using JWT tokens and bcrypt password hashing.',
      'Regular security assessments.',
    ],
    footer: 'However, no method of transmission or storage is completely secure. We cannot guarantee absolute security.',
  },
  {
    heading: '7. Your Rights and Choices',
    body: 'Depending on applicable law, you may have the following rights:',
    items: [
      'Access: request a copy of the personal data we hold about you.',
      'Correction: request that we correct inaccurate or incomplete data.',
      'Deletion: request that we delete your personal data, subject to certain exceptions.',
      'Portability: request a copy of your data in a structured, machine-readable format.',
      'Withdraw Consent: where we rely on your consent, you may withdraw it at any time.',
    ],
    footer: 'To exercise any of these rights, please contact us at the email address below.',
  },
  {
    heading: '8. Cookies and Similar Technologies',
    body: 'We use cookies and similar tracking technologies to enhance your experience:',
    items: [
      'Essential Cookies: required for the Platform to function (e.g., authentication tokens, session management).',
      'Preference Cookies: remember your settings (e.g., time format, calendar preferences).',
      'Analytics Cookies: currently, we do not use third-party analytics cookies. If we implement analytics in the future, we will update this policy and seek your consent where required.',
    ],
    footer: 'You can control cookies through your browser settings. Disabling certain cookies may affect Platform functionality.',
  },
  {
    heading: "9. Children's Privacy",
    body: 'Our Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will take steps to delete it.',
  },
  {
    heading: '10. Changes to This Privacy Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform and updating the "Last updated" date at the top of this page.',
  },
  {
    heading: '11. Contact Us',
    body: 'If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:',
    footer: 'Possible Technology P.L.C\nEmail: placeholder@example.com',
  },
];

const TERMS_SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    body: `By accessing or using the BM Booking healthcare management platform (the "Platform"), operated by Possible Technology P.L.C ("we," "us," or "our"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree, do not use the Platform.`,
  },
  {
    heading: '2. Description of the Platform',
    body: 'BM Booking is a healthcare management platform that connects patients, doctors, hospital receptionists, and hospital administrators. The Platform facilitates:',
    items: [
      'Appointment scheduling and management.',
      'Doctor profile and schedule management.',
      'Hospital and clinic administration.',
      'Medical equipment booking.',
      'Secure communication between users.',
      'Payment processing for services.',
    ],
  },
  {
    heading: '3. User Roles and Eligibility',
    subsections: [
      {
        sub: '3.1 Eligibility',
        body: 'You must be at least 18 years old to use the Platform. By using the Platform, you represent that you meet this requirement.',
      },
      {
        sub: '3.2 User Roles',
        body: 'The Platform supports the following user roles:',
        items: [
          'Patient: an individual seeking healthcare services.',
          'Doctor: a licensed healthcare professional providing services.',
          'Receptionist: a hospital or clinic staff member managing appointments.',
          'Administrator: a hospital or clinic administrator managing the facility\'s presence on the Platform.',
        ],
      },
    ],
  },
  {
    heading: '4. Account Registration and Security',
    subsections: [
      {
        sub: '4.1 Registration',
        body: 'You must create an account to use the Platform. You agree to provide accurate, current, and complete information during registration and to keep this information updated.',
      },
      {
        sub: '4.2 Account Security',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.',
      },
      {
        sub: '4.3 Account Termination',
        body: 'We reserve the right to suspend or terminate accounts that violate these Terms or applicable law.',
      },
    ],
  },
  {
    heading: '5. Doctor Verification and Responsibilities',
    subsections: [
      {
        sub: '5.1 Verification',
        body: 'Doctors must provide accurate license and credential information. We may verify this information with relevant authorities. We do not guarantee the accuracy of credential information provided by doctors.',
      },
      {
        sub: '5.2 Doctor Responsibilities',
        body: 'Doctors are responsible for:',
        items: [
          'Maintaining accurate and up-to-date profile information.',
          'Honoring appointments made through the Platform.',
          'Providing professional, ethical healthcare services.',
          'Complying with all applicable laws and regulations governing medical practice in Ethiopia.',
        ],
      },
    ],
  },
  {
    heading: '6. Appointments and Payments',
    subsections: [
      {
        sub: '6.1 Appointment Booking',
        body: 'Patients may book appointments with doctors through the Platform. Appointment times are subject to confirmation by the doctor or their receptionist.',
      },
      {
        sub: '6.2 Fees and Payments',
        items: [
          'Service fees are displayed at the time of booking.',
          'Payments are processed through our third-party payment processors (Chapa and Telebirr).',
          'We do not store payment card details.',
          'Doctors are responsible for providing accurate payment information to receive disbursements.',
        ],
      },
      {
        sub: '6.3 Cancellations and Refunds',
        body: 'Cancellation and refund policies are displayed at the time of booking and may vary by healthcare provider.',
      },
    ],
  },
  {
    heading: '7. User Conduct',
    body: 'You agree not to:',
    items: [
      'Use the Platform for any unlawful purpose.',
      'Impersonate any person or entity.',
      'Submit false or misleading information.',
      'Interfere with the operation of the Platform.',
      'Attempt to access another user\'s account.',
      'Use the Platform to harass, abuse, or harm others.',
      'Reverse engineer, decompile, or disassemble the Platform.',
    ],
  },
  {
    heading: '8. Medical Disclaimer',
    body: 'The Platform is a scheduling and communication tool only. We do not provide medical advice, diagnosis, or treatment. The quality of healthcare services provided by doctors is solely the responsibility of the doctor. Always seek the advice of a qualified healthcare provider with any questions regarding a medical condition.',
  },
  {
    heading: '9. Intellectual Property',
    body: 'The Platform and its content, including software, design, text, images, and logos, are owned by Possible Technology P.L.C or its licensors. You may not reproduce, distribute, modify, or create derivative works without our express written permission.',
  },
  {
    heading: '10. Third-Party Services',
    body: 'The Platform integrates with third-party services including Cloudinary (media hosting), AfroMessage (SMS), Chapa (payment processing), Telebirr (payment processing), and Telegram (bot and mini app). Your use of these services is subject to their respective terms and privacy policies. We are not responsible for the actions of these third parties.',
  },
  {
    heading: '11. Limitation of Liability',
    body: 'To the maximum extent permitted by applicable law:',
    items: [
      'The Platform is provided "as is" without warranties of any kind, express or implied.',
      'We are not liable for any indirect, incidental, special, consequential, or punitive damages.',
      'Our total liability for any claim arising from your use of the Platform shall not exceed the amount you have paid us in the twelve (12) months preceding the claim.',
      'We are not liable for the actions or omissions of doctors, hospitals, or other users.',
    ],
  },
  {
    heading: '12. Indemnification',
    body: 'You agree to indemnify and hold harmless Possible Technology P.L.C, its officers, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from your use of the Platform or violation of these Terms.',
  },
  {
    heading: '13. Governing Law and Dispute Resolution',
    body: 'These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Any disputes arising from these Terms or your use of the Platform shall be resolved through:',
    orderedItems: [
      'Negotiation: the parties shall first attempt to resolve the dispute through good-faith negotiation.',
      'Mediation: if negotiation fails, the parties shall attempt mediation with a mutually agreed mediator.',
      'Courts: if mediation fails, the dispute shall be submitted to the competent courts of Addis Ababa, Ethiopia.',
    ],
  },
  {
    heading: '14. Changes to These Terms',
    body: 'We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Platform and updating the "Last updated" date. Your continued use of the Platform after the changes take effect constitutes your acceptance of the new Terms.',
  },
  {
    heading: '15. Contact Us',
    body: 'For questions about these Terms, please contact us at:',
    footer: 'Possible Technology P.L.C\nEmail: placeholder@example.com',
  },
];

type Doc = 'privacy' | 'terms';

interface SectionDef {
  heading: string;
  body?: string;
  items?: string[];
  orderedItems?: string[];
  footer?: string;
  table?: { headers: string[]; rows: string[][] };
  subsections?: { sub: string; body?: string; items?: string[] }[];
}

function SectionBlock({ section }: { section: SectionDef }) {
  return (
    <section className="mb-10">
      <h2 className="text-[17px] font-semibold text-primary mb-3 pb-2 border-b border-border">{section.heading}</h2>
      {section.body && <p className="text-text-secondary leading-relaxed mb-3 text-[14px] whitespace-pre-line">{section.body}</p>}
      {section.items && (
        <ul className="list-disc pl-5 flex flex-col gap-1.5 mb-3">
          {section.items.map((item, i) => (
            <li key={i} className="text-text-secondary text-[14px] leading-relaxed">{item}</li>
          ))}
        </ul>
      )}
      {section.orderedItems && (
        <ol className="list-decimal pl-5 flex flex-col gap-1.5 mb-3">
          {section.orderedItems.map((item, i) => (
            <li key={i} className="text-text-secondary text-[14px] leading-relaxed">{item}</li>
          ))}
        </ol>
      )}
      {section.table && (
        <div className="overflow-x-auto mb-3">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {section.table.headers.map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 bg-foreground/5 text-text font-semibold border-b border-border whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`py-2.5 px-3 align-top ${ci === 0 ? 'text-text font-medium' : 'text-text-secondary'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section.subsections?.map((sub) => (
        <div key={sub.sub} className="mt-4 pl-3 border-l-2 border-border">
          <h3 className="text-[14px] font-semibold text-text mb-2">{sub.sub}</h3>
          {sub.body && <p className="text-text-secondary text-[13px] leading-relaxed mb-2">{sub.body}</p>}
          {sub.items && (
            <ul className="list-disc pl-5 flex flex-col gap-1 mb-2">
              {sub.items.map((item, i) => (
                <li key={i} className="text-text-secondary text-[13px] leading-relaxed">{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {section.footer && (
        <p className="mt-3 text-text-secondary text-[13px] leading-relaxed whitespace-pre-line">{section.footer}</p>
      )}
    </section>
  );
}

export default function HospitalLegalPage() {
  const [active, setActive] = useState<Doc>('privacy');

  const tabs: { id: Doc; label: string; icon: typeof Shield; updated: string }[] = [
    { id: 'privacy', label: 'Privacy Policy', icon: Shield, updated: 'June 17, 2026' },
    { id: 'terms', label: 'Terms of Use', icon: FileText, updated: 'June 17, 2026' },
  ];

  const sections = active === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  return (
    <div className="p-5 lg:p-6 max-w-4xl mx-auto animate-fade">
      <div className="mb-6">
        <MedText as="h2" className="text-[20px] text-primary">Legal Documents</MedText>
        <MedText as="p" className="text-text-secondary mt-1 text-[13px]">
          Policies and terms governing the use of the BM Booking platform.
        </MedText>
      </div>

      <div className="flex gap-2 mb-6 bg-surface border border-border rounded-xl p-1.5 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium transition-all ${
                isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-foreground/5'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-sm px-6 py-6">
        <div className="flex items-start justify-between gap-3 mb-8 pb-5 border-b border-border flex-wrap">
          <div>
            <h2 className="text-[18px] font-bold text-primary">{tabs.find((t) => t.id === active)?.label}</h2>
            <p className="text-text-secondary text-[12px] mt-1">Last updated: {tabs.find((t) => t.id === active)?.updated}</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary bg-blue/10 border border-blue/20 rounded-full px-3 py-1">
            <Shield size={12} />
            Possible Technology P.L.C
          </span>
        </div>

        <div>
          {(sections as SectionDef[]).map((section) => (
            <SectionBlock key={section.heading} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}