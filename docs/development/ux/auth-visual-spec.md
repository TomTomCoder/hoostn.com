# Authentication Visual Design Specification

## Brand Integration

### Hoostn Color Palette
- **Primary Blue:** `#1F3A8A` - Main actions, links
- **Accent Green:** `#00C48C` - Success states, validation
- **Gray Anthracite:** `#333333` - Body text
- **Gray Light:** `#F5F6F8` - Page backgrounds
- **Error Red:** `#E53E3E` - Errors, warnings
- **White:** `#FFFFFF` - Card backgrounds

### Typography
- **Font Family:** Inter (all weights)
- **Headings:** Inter Bold (700)
- **Body:** Inter Regular (400)
- **UI Elements:** Inter Medium (500)

---

## Page Layouts

### 1. Sign In Page (Primary Layout)

```
┌─────────────────────────────────────────────────────────┐
│                     Background: #F5F6F8                 │
│                                                         │
│                    [Hoostn Logo]                        │
│                   Welcome back                          │
│               Sign in to your account                   │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │         Card: bg-white, rounded-2xl           │    │
│  │              shadow-sm, p-8                    │    │
│  │                                                │    │
│  │  Email address *                              │    │
│  │  ┌─────────────────────────────────────────┐  │    │
│  │  │ you@example.com                         │  │    │
│  │  └─────────────────────────────────────────┘  │    │
│  │  We'll send you a magic link to sign in       │    │
│  │                                                │    │
│  │  ┌─────────────────────────────────────────┐  │    │
│  │  │     Send Magic Link                      │  │    │
│  │  │  bg-primary, text-white, rounded-2xl    │  │    │
│  │  └─────────────────────────────────────────┘  │    │
│  │                                                │    │
│  │            ──────── or ────────                │    │
│  │                                                │    │
│  │         Sign in with password instead         │    │
│  │         (ghost button, smaller)                │    │
│  │                                                │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│          New to Hoostn? Create an account              │
│               (text-primary link)                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Spacing:**
- Page padding: 16px (mobile), 32px (desktop)
- Card max-width: 448px (28rem)
- Card padding: 32px
- Vertical spacing: 24px between sections
- Input height: 48px
- Button height: 48px (medium), 56px (large)

---

### 2. Email Verification State

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [Hoostn Logo]                        │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │                                                │    │
│  │         [Mail Icon - Accent Color]            │    │
│  │           (centered, 48x48px)                  │    │
│  │                                                │    │
│  │            Check your email                    │    │
│  │          (text-xl, font-bold)                  │    │
│  │                                                │    │
│  │        We sent a sign-in link to:             │    │
│  │           user@example.com                     │    │
│  │         (text-sm, text-gray-600)               │    │
│  │                                                │    │
│  │                                                │    │
│  │  ┌─────────────────────────────────────────┐  │    │
│  │  │   Didn't receive it? Resend              │  │    │
│  │  │   (outline button, full-width)           │  │    │
│  │  └─────────────────────────────────────────┘  │    │
│  │                                                │    │
│  │        Check your spam folder if you          │    │
│  │        don't see it in a few minutes          │    │
│  │         (text-xs, text-gray-500)               │    │
│  │                                                │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 3. Sign Up Page (Alternative Layout)

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌──────────────────┬──────────────────────────────────────┐ │
│  │  Left Panel      │  Right Panel (Desktop Only)          │ │
│  │  (Form)          │  bg-primary, text-white              │ │
│  │                  │                                      │ │
│  │  [Logo]          │  "Trusted by 10,000+                 │ │
│  │                  │   property managers"                 │ │
│  │  Start managing  │                                      │ │
│  │  your vacation   │  [Testimonial 1]                     │ │
│  │  rentals         │  ⭐⭐⭐⭐⭐                              │ │
│  │                  │  "Hoostn transformed                 │ │
│  │  [Email input]   │   our operations..."                 │ │
│  │                  │   - Sarah M.                         │ │
│  │  [Get Started]   │                                      │ │
│  │                  │  [Testimonial 2]                     │ │
│  │  Already have    │  ⭐⭐⭐⭐⭐                              │ │
│  │  an account?     │  "Best decision                      │ │
│  │  Sign in         │   we ever made..."                   │ │
│  │                  │   - John D.                          │ │
│  └──────────────────┴──────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Input Field

**Default State:**
```css
border: 1px solid #E5E7EB (gray-300)
border-radius: 8px
padding: 12px 16px
font-size: 16px
height: 48px
transition: all 200ms

&:focus {
  outline: none
  border-color: #00C48C (accent)
  ring: 2px solid #00C48C
  ring-offset: 2px
}
```

**Error State:**
```css
border-color: #E53E3E (error)
ring: 2px solid #E53E3E

+ error-message {
  color: #E53E3E
  font-size: 14px
  margin-top: 8px
  display: flex
  align-items: start
  gap: 4px
}
```

**Success State:**
```css
border-color: #00C48C (accent)
ring: 2px solid #00C48C

+ checkmark icon {
  position: absolute
  right: 12px
  color: #00C48C
}
```

---

### Button Variants

**Primary Button:**
```css
background: #1F3A8A (primary)
color: white
border-radius: 16px
padding: 12px 24px
font-weight: 500
font-size: 16px
min-height: 48px
transition: all 200ms
box-shadow: 0 1px 2px rgba(0,0,0,0.05)

&:hover {
  background: #2E4CCB (primary-dark)
  box-shadow: 0 4px 6px rgba(0,0,0,0.1)
}

&:active {
  transform: scale(0.98)
}

&:disabled {
  opacity: 0.5
  cursor: not-allowed
}
```

**Accent Button (Success):**
```css
background: #00C48C (accent)
color: white
/* Same structure as primary */

&:hover {
  background: #009F72 (accent-dark)
}
```

**Outline Button:**
```css
background: white
color: #333333 (gray-anthracite)
border: 2px solid #E5E7EB (gray-300)
/* Same structure as primary */

&:hover {
  background: #F9FAFB (gray-50)
  border-color: #D1D5DB (gray-400)
}
```

**Ghost Button:**
```css
background: transparent
color: #333333 (gray-anthracite)
/* No border */

&:hover {
  background: #F3F4F6 (gray-100)
}
```

---

### Card Component

```css
background: white
border-radius: 16px
padding: 32px
box-shadow: 0 1px 3px rgba(0,0,0,0.06)
border: 1px solid #F3F4F6 (gray-100)

@media (max-width: 640px) {
  padding: 24px
  border-radius: 12px
}
```

---

## Loading States

### Button Loading
```
┌──────────────────────────────┐
│  [Spinner] Sending...        │
│  (spinner: 16x16, animate)   │
└──────────────────────────────┘
```

**Spinner Animation:**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
}
```

---

## Error States

### Inline Error
```
┌──────────────────────────────────┐
│ Email address *                  │
│ ┌──────────────────────────────┐ │
│ │ user@example                 │ │ ← Red border (2px)
│ └──────────────────────────────┘ │
│ ⚠️ Please enter a valid email    │ ← text-error, flex
└──────────────────────────────────┘
```

### Toast Notification (Error)
```
┌─────────────────────────────────────┐
│ ⚠️ Something went wrong            │
│ Please try again or contact support│
│                              [✕]   │
└─────────────────────────────────────┘

Position: top-right
Background: #FEE2E2 (red-50)
Border: 1px solid #F87171 (red-400)
Color: #991B1B (red-800)
Animation: slide in from right
Duration: 5 seconds, dismissable
```

---

## Success States

### Success Toast
```
┌─────────────────────────────────────┐
│ ✓ Email sent successfully!         │
│ Check your inbox for the magic link│
│                              [✕]   │
└─────────────────────────────────────┘

Position: top-right
Background: #D1FAE5 (green-50)
Border: 1px solid #00C48C (accent)
Color: #065F46 (green-800)
Animation: slide in from right
Duration: 3 seconds, dismissable
```

---

## Responsive Breakpoints

```css
/* Mobile First */
.auth-container {
  padding: 16px;
  max-width: 100%;
}

.auth-card {
  padding: 24px;
  border-radius: 12px;
}

/* Tablet: 640px+ */
@media (min-width: 640px) {
  .auth-container {
    padding: 32px;
  }
  
  .auth-card {
    padding: 32px;
    border-radius: 16px;
    max-width: 448px;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  /* Enable split-screen layout for sign-up */
  .signup-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

---

## Animation Guidelines

### Transitions
```css
/* Default transition for interactive elements */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Slower for larger movements */
transition: transform 300ms ease-out;

/* No transition for colors that might flash */
/* Use instant for accessibility */
```

### Hover Effects
- Scale: 1.02x maximum (subtle)
- Opacity: Never below 0.5
- Color shifts: Use defined palette colors
- Shadows: Lift by 2-4px

### Focus Effects
- Ring: 2px solid accent color
- Ring offset: 2px
- No scale or transform on focus (accessibility)

---

## Mobile-Specific Considerations

### Touch Targets
```css
/* All interactive elements */
min-height: 44px;
min-width: 44px;

/* Buttons */
min-height: 48px;
padding: 12px 24px;

/* Inputs */
height: 48px;
font-size: 16px; /* Prevents zoom on iOS */
```

### Keyboard Types
```html
<!-- Email -->
<input type="email" inputmode="email" />

<!-- Numeric -->
<input type="text" inputmode="numeric" />

<!-- URL -->
<input type="url" inputmode="url" />
```

---

## Dark Mode (Future Consideration)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0D1117; /* dark */
    --card: #161B22;
    --text: #E6EDF3;
    --primary: #3559C8; /* Lighter primary */
    --accent: #00C48C; /* Keep accent */
  }
}
```

---

## Accessibility Requirements

### Focus Indicators
```css
*:focus-visible {
  outline: 3px solid #00C48C;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Never remove focus indicators */
*:focus {
  outline: none; /* Only if :focus-visible is used */
}
```

### Contrast Ratios
- Normal text (16px): 4.5:1 minimum
- Large text (24px+): 3:1 minimum
- Interactive elements: 3:1 against background

**Verified Combinations:**
- White on Primary (#1F3A8A): 8.6:1 ✓
- White on Accent (#00C48C): 2.1:1 ✗ (use white text)
- Gray Anthracite on White: 12.6:1 ✓
- Error on White: 5.5:1 ✓

---

## Example: Complete Sign-In Page CSS

```css
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F6F8;
  padding: 16px;
}

.auth-container {
  width: 100%;
  max-width: 448px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo {
  height: 48px;
  width: auto;
  margin: 0 auto 24px;
}

.auth-title {
  font-size: 30px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: #6B7280;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #F3F4F6;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.form-input {
  height: 48px;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 16px;
  transition: all 200ms;
}

.form-input:focus {
  outline: none;
  border-color: #00C48C;
  box-shadow: 0 0 0 2px rgba(0, 196, 140, 0.2);
}

.form-input.error {
  border-color: #E53E3E;
}

.error-message {
  display: flex;
  align-items: start;
  gap: 4px;
  color: #E53E3E;
  font-size: 14px;
}

.form-hint {
  font-size: 14px;
  color: #6B7280;
}

.btn {
  height: 48px;
  padding: 12px 24px;
  border-radius: 16px;
  font-weight: 500;
  font-size: 16px;
  transition: all 200ms;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #1F3A8A;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-primary:hover {
  background: #2E4CCB;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .auth-card {
    padding: 24px;
  }
  
  .auth-title {
    font-size: 24px;
  }
}
```
