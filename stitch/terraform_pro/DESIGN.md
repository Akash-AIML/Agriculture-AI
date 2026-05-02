# Design System Specification: The Cultivated Ledger

## 1. Overview & Creative North Star
This design system moves beyond the utility of a standard farming tool to create a premium, editorial-grade digital environment. We define our Creative North Star as **"The Digital Agronomist."** 

The aesthetic avoids the "cluttered dashboard" trope in favor of a sophisticated, high-contrast layout that mirrors the precision of modern agriculture and the tactile nature of the field. We achieve this through **Intentional Asymmetry**—where large-scale typography meets tight, data-rich modules—and **Tonal Layering**, replacing rigid lines with organic shifts in light and depth. The goal is to make the farmer feel like an executive of the land, not just a user of a tool.

---

## 2. Color Strategy & Visual Soul
The palette is rooted in the earth, utilizing deep forest greens, fertile browns, and soft clay transitions to build trust and legibility.

### The "No-Line" Rule
To achieve a high-end, bespoke feel, **this design system prohibits the use of 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts or subtle tonal transitions.
*   **Implementation:** A section containing weather data should use `surface_container_low` (#eff6e9) placed directly against a `surface` (#f5fcef) background.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-translucent materials. 
*   **Layer 0 (Base):** `surface` (#f5fcef)
*   **Layer 1 (Sectioning):** `surface_container` (#e9f0e4)
*   **Layer 2 (Interactive Elements):** `surface_container_highest` (#dee5d8)
By nesting these tiers, we create "soft depth" that guides the eye without the visual noise of traditional grids.

### The "Glass & Gradient" Rule
For floating action elements or high-priority modals, use **Glassmorphism**. Apply `surface_tint` (#3a6843) at 80% opacity with a `20px` backdrop blur. 
*   **Signature Textures:** Main Call-to-Actions (CTAs) should utilize a subtle linear gradient transitioning from `primary` (#315f3b) to `primary_container` (#497851) at a 135-degree angle. This adds a "weighted" feel that flat colors lack.

---

## 3. Typography: Editorial Authority
We use a dual-typeface system to balance high-end character with technical precision.

*   **The Display & Headline (Manrope):** Used for large-scale storytelling and primary data points. `display-lg` (3.5rem) should be used with tight letter-spacing (-0.02em) to create a bold, authoritative "editorial" look.
*   **The Technical Body (Inter):** Used for all functional data. Inter provides the necessary legibility for outdoor use in high-glare environments.
*   **Hierarchy Tip:** Pair a `headline-lg` in Manrope with a `label-md` in Inter directly above it (all-caps, 0.05em tracking) to create a sophisticated, labeled-data aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often too "digital." To maintain an organic, Agri-Tech feel, we use **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking." Place a `surface_container_lowest` (#ffffff) card on a `surface_container_low` (#eff6e9) background to create a crisp, natural lift.
*   **Ambient Shadows:** If a floating element (like a FAB) requires a shadow, use a large blur (24px) with the shadow color set to `on_surface` (#171d16) at 6% opacity. This mimics natural, overcast daylight.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in Dark Mode), use the `outline_variant` (#bfcaba) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Signature Components

### Buttons
*   **Primary:** Pill-shaped (`full` roundedness), using the signature gradient. Text is `on_primary` (#ffffff) using `title-sm`.
*   **Secondary:** `surface_container_high` (#e3eade) background with `primary` (#315f3b) text. No border.
*   **States:** On press, the element should scale down to 98% rather than just changing color, providing a tactile, premium response.

### Cards & Data Modules
*   **Rule:** Forbid divider lines. 
*   **Structure:** Use `spacing-6` (1.5rem) as the standard internal padding. Separate different data types (e.g., Soil Moisture vs. Temperature) by placing them in separate `surface_container` blocks with a `spacing-2` gap.

### Input Fields
*   **Style:** Use a "filled" style with `surface_variant` (#dee5d8). The bottom-indicator should be a `2px` line of `outline` (#707a6c), which animates to `primary` (#315f3b) on focus.
*   **Roundedness:** `md` (0.375rem) to maintain a professional, architectural feel.

### Agri-Tech Custom Components
*   **Growth Trackers:** Use non-linear, organic progress bars. Instead of a flat bar, use a series of staggered `primary` dots that follow a slight curve, echoing the organic growth of plants.
*   **Weather Gauges:** Use Glassmorphism containers for 7-day forecasts, allowing the background "Earth" tones to bleed through the "Sky" data.

---

## 6. Do’s and Don’ts

### Do:
*   **Use White Space as a Tool:** Use `spacing-12` (3rem) to separate major content groups. This gives the "High-End Editorial" breathing room.
*   **Apply Intentional Asymmetry:** Align headline text to the left, but place supporting labels or icons on a slightly offset grid to the right to create visual interest.
*   **Optimize for Sunlight:** Ensure the contrast between `on_surface` and `surface` remains high to support farmers in the field.

### Don’t:
*   **Don’t use 1px Dividers:** They clutter the interface and make it feel like a generic spreadsheet.
*   **Don’t use Pure Black Shadows:** They feel "dirty" against earthy tones. Always tint shadows with the `on_surface` color.
*   **Don’t Over-Round Everything:** While buttons are `full` rounded, keep cards and containers at `xl` (0.75rem) or `lg` (0.5rem) to maintain a sense of structural integrity.