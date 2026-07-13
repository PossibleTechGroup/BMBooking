```mermaid
flowchart TD

%% =========================
%% APP ENTRY
%% =========================

A([Doctor opens app])

A --> B{Existing session found?}

B -->|Yes| C{Doctor account status}

C -->|Approved| HOME([Doctor dashboard])
C -->|Pending Review| PENDING([Profile under admin review])
C -->|Rejected| REJECTED([Rejected - view reason])

REJECTED --> EDITPROFILE([Edit profile])
EDITPROFILE --> SUBMITREVIEW([Resubmit profile])

B -->|No session| PHONE([Enter phone number])

%% =========================
%% OTP FLOW
%% =========================

PHONE --> OTPSEND([Send OTP])
OTPSEND --> OTPINPUT([Enter OTP])

OTPINPUT --> OTPCHECK{Validate OTP}

OTPCHECK -->|Valid| PROFILESETUP([Profile setup])
OTPCHECK -->|Invalid| OTPINVALID([Invalid OTP])
OTPCHECK -->|Expired| OTPEXPIRED([OTP expired])

OTPINVALID --> OTPRETRY{Retry attempts left?}

OTPRETRY -->|Yes| OTPINPUT
OTPRETRY -->|No| LOCKED([Account locked])

OTPEXPIRED --> RESENDOTP([Resend OTP])
RESENDOTP --> OTPSEND

LOCKED --> WAITLOCK([Wait for unlock])
WAITLOCK --> PHONE

%% =========================
%% PROFILE SETUP
%% =========================

PROFILESETUP --> P1([Personal info])
P1 --> P2([Professional info])
P2 --> P3([Experience & bio])
P3 --> P4([Appointment fee])

P4 --> SUBMITREVIEW

%% =========================
%% ADMIN REVIEW
%% =========================

SUBMITREVIEW --> PENDING

PENDING --> ADMIN{Admin decision}

ADMIN -->|Approved| APPROVED([Approved doctor])
ADMIN -->|Rejected| REJECTED

%% =========================
%% POST-APPROVAL FLOW
%% =========================

APPROVED --> POSTSETUP([Post-approval setup])

POSTSETUP --> PAYSETUP([Payment methods])
PAYSETUP --> PAYVALID{Payment valid?}

PAYVALID -->|Invalid| PAYERROR([Invalid payment details])
PAYERROR --> PAYSETUP

PAYVALID -->|Valid| AVAILABILITY([Availability setup])

AVAILABILITY --> ACTIVE([Fully active account])

ACTIVE --> HOME

%% =========================
%% STYLING (COLORS RESTORED)
%% =========================

style HOME fill:#E1F5EE,stroke:#0F6E56,color:#085041
style ACTIVE fill:#DFF7E9,stroke:#1B7F5A,color:#0B4D38
style APPROVED fill:#EAF3DE,stroke:#3B6D11,color:#27500A

style PENDING fill:#FAEEDA,stroke:#854F0B,color:#633806

style OTPINVALID fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
style OTPEXPIRED fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
style LOCKED fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
style PAYERROR fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
style REJECTED fill:#FCEBEB,stroke:#A32D2D,color:#791F1F