# BM Booking Backend Architecture

This document describes the high-level architecture of the BM Booking backend.

## System Overview

The backend is built using **Node.js** and **Express**, with **PostgreSQL** as the primary relational database. The entire environment is containerized using **Docker** for consistency across development and production.

### High-Level Diagram

```mermaid
flowchart TD
    %% Clients
    subgraph Clients ["Mobile Applications"]
        Patient["Patient App"]
        Doctor["Doctor App"]
    end

    %% Backend Layer
    subgraph Backend ["Express Server (Node.js)"]
        API["API Gateway / Routes"]
        Auth["Auth Middleware"]
        Controllers["Controllers"]
        Services["Business Logic Services"]
        Models["Prisma Models"]
        Libs["Libraries (JWT, Prisma Client)"]

        API --> Auth
        Auth --> Libs
        Auth --> Controllers
        Controllers --> Services
        Services --> Models
        Models --> Libs
    end

    %% Database Layer
    subgraph Storage ["Data Storage"]
        DB[("PostgreSQL DB")]
        Libs -- Query --> DB
    end

    %% Infrastructure
    subgraph Infrastructure ["Containerization"]
        Docker["Docker Compose"]
        Docker --> Backend
        Docker --> Storage
    end

    %% Configuration
    Env["env Configuration"]
    Env -.-> Backend

    %% Flow
    Patient -- REST --> API
    Doctor -- REST --> API
```

## Data Model Interaction (ERD)

The following diagram shows how the database entities interact with each other via Prisma.

```mermaid
flowchart TD
    User["User Model (id, phone, role)"]
    OTP["OTP Model (id, phone, code, verified)"]
    Profile["Doctor Profile (id, userId, fullName, status)"]

    User -- "1:1" --> Profile
    User -.->|linked by phone| OTP
```

## Layered Model Interaction

This diagram shows how data flows through the modular architecture layers:

```mermaid
graph LR
    Req[Client Request] --> Route[Routes]
    Route --> Ctrl[Controllers]
    Ctrl --> Svc[Services]
    Svc --> Model[Prisma Models]
    Model --> DB[(PostgreSQL)]

    Svc -.-> Lib[Libraries / JWT]
```