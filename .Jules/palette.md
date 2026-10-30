## 2025-02-24 - [Micro-UX] Notification Toast Accessibility
**Learning:** The global notification toast close button was missing an ARIA label and focus styles. Screen readers wouldn't announce its purpose, and keyboard users couldn't see when it was focused.
**Action:** When adding icon-only buttons (`<button><Icon /></button>`), always ensure an `aria-label` is present and add `focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none rounded-md` (or equivalent Tailwind ring classes) so the focus state is clearly visible.
