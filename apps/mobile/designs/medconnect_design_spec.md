# MedConnect Hub Design System Specification

This document outlines the visual architecture and design tokens for the MedConnect Hub mobile application, blending **Telegram's** functional layout with **Claude.ai's** sophisticated, light-toned aesthetic.

## 1. Core Visual Philosophy
- **Architecture:** Telegram-inspired messaging and marketplace structure.
- **Tone:** Minimalist, clinical, and high-trust.
- **Interactions:** "Liquid Glass" effects for buttons and transitions (iPhone 17 style).

## 2. Color Palette (Claude-esque Light Tones)
A "Paper & Ink" approach focusing on high legibility and soft contrast.

| Element | Hex Code | Description |
| :--- | :--- | :--- |
| **Primary Background** | `#F9F7F2` | Warm, paper-like off-white. |
| **Surface (Cards/Bubbles)** | `#FFFFFF` | Pure white for clear elevation. |
| **Primary Accent** | `#1A1A1A` | Deep charcoal for headers and primary buttons. |
| **Secondary Accent** | `#3E5C76` | Muted slate blue for specialized interactions. |
| **Text (Primary)** | `#101828` | High-contrast dark grey. |
| **Text (Secondary)** | `#667085` | Soft grey for metadata and captions. |
| **Success/Status** | `#027A48` | Clinical emerald green for availability. |

## 3. Typography
The system uses clean, modern sans-serif fonts to ensure clarity in a dense marketplace.

- **Primary Font:** **Inter** (or **Geist Sans**)
- **Secondary/System:** **SF Pro Display** (for iOS consistency)
- **Styles:**
  - **Headings:** Semibold, tight tracking, `#101828`.
  - **Body:** Regular, 16px, line-height 1.5, `#344054`.
  - **Metadata:** Medium, 12px, `#667085`.

## 4. UI Components (Telegram Logic)

### Chat-style Notifications
The appointment updates follow the Telegram message bubble architecture:
- **Tail-less Bubbles:** Modern, rounded-lg corners (12px to 16px).
- **Bubble Colors:** Outgoing/System in `#FFFFFF` with a 1px `#E4E7EC` border. Incoming in a very soft tint of the accent color.
- **Checkmarks:** Double-tick status for read receipts on medical updates.

### Buttons & Inputs
- **Primary Buttons:** Solid `#1A1A1A` with white text. Slightly rounded (8px) to mirror Claude’s UI.
- **Liquid Effect:** On hover/press, buttons should exhibit a "bubblish" expansion or a refractive glass-glow effect.
- **Input Fields:** Bottom-aligned Telegram-style text bar with minimalist icons (paperclip, camera) in `#98A2B3`.

## 5. Navigation Architecture
- **Bottom Navigation:** Fixed 4-tab bar (Chats, Contacts, Services, Settings).
- **Visuals:** Thin-line icons (2px stroke) that morph into filled states when active.
- **Density:** 6amMart-style marketplace grids for "Services" using the same refined typography.

## 6. Iconography
- **Style:** Linear, minimalist icons with rounded caps.
- **Stroke Weight:** 1.5pt to 2.0pt.
- **Color:** Deep charcoal or slate grey.

---
*Created for: Abel Ashine*
