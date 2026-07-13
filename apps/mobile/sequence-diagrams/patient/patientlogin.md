

When login succeeds, you save a **long-lived token** on the device (stored securely, not just in memory). Every time the app opens, it checks for that token silently in the background — if it's valid, the user goes straight to the home screen. They never see the login screen again.

**Updated login flow:**

```mermaid
flowchart TD
    A([App opens]) --> B{Saved session\non this device?}

    B -->|yes| C{Session still valid?}
    C -->|yes| N([Home screen])
    C -->|expired or tampered| D[Login screen]

    B -->|no| D

    D -->|Phone number| E[Enter phone number]
    D -->|Social| F[Google / Apple login]

    E --> G{Do you have an account?}
    F -->|confirmed| G
    G -->|no account found| H[Not registered\nGo to registration]

    G -->|yes| I[Send 6-digit code to phone]
    I --> J[Enter the code you received]
    J --> K{Is the code correct?}

    K -->|code expired| L[Code expired]
    L -.->|send a new code| I

    K -->|wrong code| M[Wrong code\n2 tries left]
    M -.->|send a new code| I
    M --> O{Too many wrong attempts?}
    O -->|yes| P[Locked out\nTry again in 30 minutes]

    K -->|correct| Q[Save session to device]
    Q --> N

    style Q fill:#EAF3DE,stroke:#3B6D11,color:#27500A
    style N fill:#E1F5EE,stroke:#0F6E56,color:#085041
    style H fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
    style L fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
    style M fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
    style P fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
```
 We save session for 90 days