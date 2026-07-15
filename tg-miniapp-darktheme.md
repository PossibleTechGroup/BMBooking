# TG Mini App — Dark Theme

## Core CSS Variables (`html.dark`)

All overrides applied when `html.dark` class is active (set by `tg.js` based on `webapp.colorScheme`).

| Variable | Light Value | Dark Value | Notes |
|---|---|---|---|
| `--bg` | `#F9F7F2` | *from Telegram* | `--tg-theme-bg-color` auto-updates |
| `--text` | `#101828` | *from Telegram* | `--tg-theme-text-color` auto-updates |
| `--hint` | `#667085` | *from Telegram* | `--tg-theme-hint-color` auto-updates |
| `--link` | `#3E5C76` | *from Telegram* | `--tg-theme-link-color` auto-updates |
| `--button` | `#1A1A1A` | *from Telegram* | `--tg-theme-button-color` auto-updates |
| `--button-text` | `#ffffff` | *from Telegram* | `--tg-theme-button-text-color` auto-updates |
| `--secondary-bg` | `#F2F4F7` | *from Telegram* | `--tg-theme-secondary-bg-color` auto-updates |
| `--section-bg` | `#ffffff` | *from Telegram* | `--tg-theme-section-bg-color` auto-updates |
| `--section-separator` | `#E4E7EC` | *from Telegram* | `--tg-theme-section-separator-color` auto-updates |
| `--accent` | `#3E5C76` | **`#6B9AC4`** | Lighter blue for dark backgrounds |
| `--danger` | `#E53935` | **`#EF5350`** | Material dark-theme red |
| `--success` | `#027A48` | **`#4CAF50`** | Material dark-theme green |
| `--warning` | `#fb8c00` | **`#FFA726`** | Material dark-theme orange |
| `--border` | `#E4E7EC` | **`rgba(255,255,255,0.12)`** | Subtle white border |
| `--shadow` | `0 1px 3px rgba(0,0,0,0.08)` | **`0 1px 3px rgba(0,0,0,0.4)`** | Deeper shadow |
| `--text-primary` | `#101828` | **`#F0F0F0`** | Light text for readability |
| `--text-secondary` | `#667085` | **`#A0A0A0`** | Subdued but legible |
| `--surface` | `#FFFFFF` | **`#1E1E1E`** | Dark card surface |
| `--primary-dark` | `#1A1A1A` | **`#E0E0E0`** | Inverted for dark bg |
| `--secondary-accent` | `#3E5C76` | **`#6B9AC4`** | Matches accent |

## Status Badges

| Badge | Light BG | Light Text | Dark BG | Dark Text |
|---|---|---|---|---|
| `.badge-pending` | `#fff3e0` | `#e65100` | `rgba(255,152,0,0.15)` | `#FFB74D` |
| `.badge-accepted` | `#e3f2fd` | `#1565c0` | `rgba(33,150,243,0.15)` | `#64B5F6` |
| `.badge-completed` | `#e8f5e9` | `#2e7d32` | `rgba(76,175,80,0.15)` | `#81C784` |
| `.badge-declined` | `#fbe9e7` | `#c62828` | `rgba(244,67,54,0.15)` | `#EF5350` |
| `.badge-cancelled` | `#f5f5f5` | `#757575` | `rgba(158,158,158,0.15)` | `#9E9E9E` |

## Alerts

| Alert | Light BG | Light Border | Dark BG | Dark Border |
|---|---|---|---|---|
| `.alert-error` | `#fef3f2` | `#fee4e2` | `rgba(239,83,80,0.12)` | `rgba(239,83,80,0.25)` |
| `.alert-success` | `#e8f5e9` | `#c8e6c9` | `rgba(76,175,80,0.12)` | `rgba(76,175,80,0.25)` |
| `.alert-info` | `#e3f2fd` | `#bbdefb` | `rgba(33,150,243,0.12)` | `rgba(33,150,243,0.25)` |

## Component Colors (unchanged — use CSS variables)

These components inherit dark theme correctly via CSS variables:

| Component | Property | Value (via variable) |
|---|---|---|
| `.btn-danger` | background | `var(--danger)` → `#EF5350` |
| `.btn-danger` | color | `#fff` |
| `.btn-outline` | color/border | `var(--link)` → from Telegram |
| `.sub-tab.active` | background | `var(--link)` → from Telegram |
| `.sub-tab.active` | color | `#fff` |
| `.slot-chip.selected` | border | `var(--link)` → from Telegram |
| `.slot-chip.selected` | background | `rgba(36,129,204,0.08)` |
| `.slot-chip.selected` | color | `var(--link)` → from Telegram |
| `.spinner` | border | `var(--border)` → `rgba(255,255,255,0.12)` |
| `.spinner` | border-top | `var(--link)` → from Telegram |
| `.pref-toggle.active` | border | `var(--text-primary)` → `#F0F0F0` |
| `.pref-toggle.active` | background | `var(--primary-dark)` → `#E0E0E0` |
| `.pref-toggle.active` | color | `#fff` |
| `.onboarding-btn-primary` | background | `var(--primary-dark)` → `#E0E0E0` |
| `.onboarding-btn-primary` | color | `#FFFFFF` |
| `.onboarding-dot.active` | background | `var(--primary-dark)` → `#E0E0E0` |
| `.profile-avatar-circle` | background | `var(--primary-dark)` → `#E0E0E0` |
| `.profile-avatar-circle` | color | `#fff` |
| `.success-screen .check-icon` | background | `var(--success)` → `#4CAF50` |
| `.success-screen .check-icon` | color | `#fff` |
| `.quick-action-icon` | background | `var(--secondary-bg)` → from Telegram |
| `.quick-action-icon` | color | `var(--text-secondary)` → `#A0A0A0` |
| `.empty-state-icon` | background | `var(--secondary-bg)` → from Telegram |
| `.empty-state-icon` | color | `var(--text-secondary)` → `#A0A0A0` |

## Inline JS Colors (now theme-aware)

| File | Element | Color | Usage |
|---|---|---|---|
| `booking.js` | paid span | `var(--success)` → `#4CAF50` | Payment confirmed text |
| `booking.js` | not-paid span | `var(--danger)` → `#EF5350` | Payment missing text |
| `equipment.js` | paid span | `var(--success)` → `#4CAF50` | Payment confirmed text |
| `appointments.js` | check SVG | `var(--success)` → `#4CAF50` | Checkmark icon stroke |
| `appointments.js` | x SVG | `var(--danger)` → `#EF5350` | X icon stroke |

## Telegram Theme Variables

In dark mode, Telegram injects darker values for all `--tg-theme-*` variables:

| Telegram Variable | Typical Dark Value |
|---|---|
| `--tg-theme-bg-color` | `#18222d` or similar dark |
| `--tg-theme-text-color` | `#ffffff` or `#f5f5f5` |
| `--tg-theme-hint-color` | `#6d7f8f` or similar muted |
| `--tg-theme-link-color` | `#6ab2f2` or similar bright blue |
| `--tg-theme-button-color` | `#2b5278` or similar |
| `--tg-theme-button-text-color` | `#ffffff` |
| `--tg-theme-secondary-bg-color` | `#0e1621` or similar darker |
| `--tg-theme-section-bg-color` | `#1b2b38` or similar |
| `--tg-theme-section-separator-color` | `#101921` or similar |

## Transition

```css
html { transition: background-color 0.3s ease, color 0.3s ease; }
html * { transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
```

## Known Issues

1. `color: #fff` on `.btn-danger`, `.sub-tab.active`, `.pref-toggle.active`, `.onboarding-btn-primary`, `.profile-avatar-circle`, `.success-screen .check-icon` — These are text-on-colored-background and are fine in both themes.
2. `rgba(26,26,26,0.2)` / `rgba(26,26,26,0.15)` on `.onboarding-btn-primary` shadows — Dark shadows work fine on both light and dark backgrounds.
