# TG Mini App — Light Theme

## Core CSS Variables (`:root`)

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#F9F7F2` | Page background |
| `--text` | `#101828` | Primary text color |
| `--hint` | `#667085` | Secondary/hint text |
| `--link` | `#3E5C76` | Links and active accents |
| `--button` | `#1A1A1A` | Primary button background |
| `--button-text` | `#ffffff` | Primary button text |
| `--secondary-bg` | `#F2F4F7` | Secondary background (inputs, chips, avatars) |
| `--section-bg` | `#ffffff` | Card/section background |
| `--section-separator` | `#E4E7EC` | Section dividers |
| `--accent` | `#3E5C76` | Accent color |
| `--danger` | `#E53935` | Error / destructive actions |
| `--success` | `#027A48` | Success / positive actions |
| `--warning` | `#fb8c00` | Warnings |
| `--border` | `#E4E7EC` | Borders and dividers |
| `--shadow` | `0 1px 3px rgba(0,0,0,0.08)` | Box shadow |
| `--text-primary` | `#101828` | Strong/heading text |
| `--text-secondary` | `#667085` | Subdued text |
| `--surface` | `#FFFFFF` | Surface / card fill |
| `--primary-dark` | `#1A1A1A` | Dark button fills (onboarding, profile) |
| `--secondary-accent` | `#3E5C76` | Secondary accent |
| `--radius` | `12px` | Standard border radius |
| `--radius-sm` | `8px` | Small border radius |

## Status Badges

| Badge | Background | Text Color |
|---|---|---|
| `.badge-pending` | `#fff3e0` | `#e65100` |
| `.badge-accepted` | `#e3f2fd` | `#1565c0` |
| `.badge-completed` | `#e8f5e9` | `#2e7d32` |
| `.badge-declined` | `#fbe9e7` | `#c62828` |
| `.badge-cancelled` | `#f5f5f5` | `#757575` |

## Alerts

| Alert | Background | Text Color | Border |
|---|---|---|---|
| `.alert-error` | `#fef3f2` | `var(--danger)` | `#fee4e2` |
| `.alert-success` | `#e8f5e9` | `var(--success)` | `#c8e6c9` |
| `.alert-info` | `#e3f2fd` | `#1565c0` | `#bbdefb` |

## Component Colors

| Component | Property | Value |
|---|---|---|
| `.btn-danger` | background | `var(--danger)` |
| `.btn-danger` | color | `#fff` |
| `.btn-outline` | color/border | `var(--link)` |
| `.sub-tab.active` | background | `var(--link)` |
| `.sub-tab.active` | color | `#fff` |
| `.slot-chip.selected` | border | `var(--link)` |
| `.slot-chip.selected` | background | `rgba(36,129,204,0.08)` |
| `.slot-chip.selected` | color | `var(--link)` |
| `.spinner` | border | `var(--border)` |
| `.spinner` | border-top | `var(--link)` |
| `.pref-toggle.active` | border | `var(--text-primary)` |
| `.pref-toggle.active` | background | `var(--primary-dark)` |
| `.pref-toggle.active` | color | `#fff` |
| `.onboarding-btn-primary` | background | `var(--primary-dark)` |
| `.onboarding-btn-primary` | color | `#FFFFFF` |
| `.onboarding-btn-primary` | shadow | `rgba(26,26,26,0.2)` |
| `.onboarding-dot.active` | background | `var(--primary-dark)` |
| `.profile-avatar-circle` | background | `var(--primary-dark)` |
| `.profile-avatar-circle` | color | `#fff` |
| `.success-screen .check-icon` | background | `var(--success)` |
| `.success-screen .check-icon` | color | `#fff` |
| `.quick-action-icon` | background | `var(--secondary-bg)` |
| `.quick-action-icon` | color | `var(--text-secondary)` |
| `.empty-state-icon` | background | `var(--secondary-bg)` |
| `.empty-state-icon` | color | `var(--text-secondary)` |

## Inline JS Colors

| File | Element | Color | Usage |
|---|---|---|---|
| `booking.js` | paid span | `var(--success)` | Payment confirmed text |
| `booking.js` | not-paid span | `var(--danger)` | Payment missing text |
| `equipment.js` | paid span | `var(--success)` | Payment confirmed text |
| `appointments.js` | check SVG | `var(--success)` | Checkmark icon stroke |
| `appointments.js` | x SVG | `var(--danger)` | X icon stroke |

## Telegram Theme Variables

These are injected by the Telegram WebApp SDK and override the fallback values automatically:

| Telegram Variable | Fallback | Description |
|---|---|---|
| `--tg-theme-bg-color` | `#F9F7F2` | App background |
| `--tg-theme-text-color` | `#101828` | Main text |
| `--tg-theme-hint-color` | `#667085` | Hint text |
| `--tg-theme-link-color` | `#3E5C76` | Links |
| `--tg-theme-button-color` | `#1A1A1A` | Telegram main button |
| `--tg-theme-button-text-color` | `#ffffff` | Telegram main button text |
| `--tg-theme-secondary-bg-color` | `#F2F4F7` | Secondary background |
| `--tg-theme-section-bg-color` | `#ffffff` | Section background |
| `--tg-theme-section-separator-color` | `#E4E7EC` | Section separators |
