# RentSphere Application Theme Plan

## Objective

Build one consistent, accessible, responsive theme system for the entire RentSphere frontend. Individual pages should use shared semantic theme values instead of maintaining separate hard-coded colors and styling rules.

The implementation is complete when every route works consistently in light and dark mode, the selected mode persists, all theme consumers are inside the provider, and the frontend passes lint, build, responsive, visual, and accessibility checks.

## 1. Define the Design Foundation

Create one central theme containing:

- Primary, secondary, success, warning, error, and information colors
- Light and dark background colors
- Primary, secondary, and disabled text colors
- Border and divider colors
- Typography scale
- Spacing scale
- Border-radius scale
- Shadows and elevation levels
- Transitions and motion durations
- Responsive breakpoints

Use semantic values such as `background.paper`, `text.secondary`, and `divider` instead of direct hexadecimal colors in feature components.

## 2. Improve the Color Mode Provider

The color mode provider should:

- Support `light`, `dark`, and optionally `system` modes
- Save the user's choice in `localStorage`
- Detect the operating-system color preference
- Avoid displaying the light theme briefly during dark-mode startup
- Update `document.documentElement.dataset.colorScheme`
- Expose `mode`, `setMode`, and `toggleColorMode`
- Wrap every component that calls `useColorMode`

Recommended provider structure:

```text
main.tsx
└── ColorModeProvider
    └── ThemeProvider
        └── CssBaseline
            └── AppScrollbars
                └── App
```

## 3. Build Light and Dark Palettes

### Light theme

- Use a bright page background
- Use white or softly tinted surfaces
- Provide dark, readable text
- Use subtle borders and shadows
- Maintain clear separation between the page and elevated content

### Dark theme

- Use dark blue or charcoal page backgrounds
- Clearly distinguish elevated surfaces
- Provide accessible light text
- Use softer borders
- Reduce shadow intensity where appropriate

Avoid relying on pure black and pure white throughout the interface.

## 4. Add Global MUI Component Overrides

Configure shared styling, sizes, variants, and interactive states for:

- `MuiButton`
- `MuiIconButton`
- `MuiCard`
- `MuiPaper`
- `MuiAppBar`
- `MuiDrawer`
- `MuiDialog`
- `MuiMenu`
- `MuiTextField`
- `MuiSelect`
- `MuiTable`
- `MuiTabs`
- `MuiChip`
- `MuiTooltip`
- `MuiAlert`
- `MuiSnackbar`
- `MuiPagination`
- `MuiSkeleton`

Define consistent hover, focus, selected, disabled, loading, and error states.

## 5. Refactor the Application Layout

Apply semantic theme values to:

- Page background
- Header surface
- Sidebar surface
- Borders and dividers
- Navigation hover state
- Selected navigation state
- Profile menu
- Notification menu
- Footer
- Mobile drawer
- OverlayScrollbars

Replace fixed values such as:

```tsx
bgcolor: '#0b1220'
color: '#ffffff'
border: '1px solid rgba(...)'
```

with MUI theme values or custom semantic tokens.

Preserve the current layout behavior where the main content is the page-level scrolling area while the header and desktop sidebar stay fixed. Sidebar navigation may keep its own internal scrollbar when its contents overflow.

## 6. Create Reusable Themed UI Components

Create shared components for interfaces repeated across multiple modules:

```text
shared/ui/
├── AppCard.tsx
├── AppPage.tsx
├── PageHeader.tsx
├── StatusChip.tsx
├── EmptyState.tsx
├── LoadingState.tsx
├── ErrorState.tsx
├── ConfirmDialog.tsx
├── DataTable.tsx
└── AppScrollbars.tsx
```

These components should prevent modules from implementing inconsistent cards, headings, status indicators, loading states, and error displays.

## 7. Refactor Every Feature Module

Apply the theme systematically to:

- Authentication
- Dashboard
- User management
- Organizations
- Properties
- Units
- Tenants
- Apartments and bookings
- Invoices
- Payments and Razorpay screens
- Approvals
- Reports
- Notifications
- Profile
- Assistant widget
- Error and not-found pages

For every module, review:

- Page backgrounds
- Cards and surfaces
- Tables
- Forms
- Dialogs
- Empty states
- Loading states
- Error messages
- Status colors
- Charts
- Mobile layouts

## 8. Standardize Forms

All forms should have consistent:

- Labels and placeholder colors
- Required-field indicators
- Focus outlines
- Validation errors
- Disabled controls
- Password visibility buttons
- Select menus
- Date inputs
- File uploads
- Submit and loading states

Changing themes must not reduce the visibility of field values, labels, focus indicators, or validation errors.

## 9. Standardize Tables

Tables should support both themes with:

- Themed headers
- Readable rows
- Row hover states
- Selected rows
- Dividers
- Sticky headers where appropriate
- Pagination
- Empty-result displays
- Loading skeletons
- Responsive mobile presentation

Avoid hard-coded white table backgrounds.

## 10. Theme Charts and Data Visualizations

Make the following chart elements theme-aware:

- Axis labels
- Grid lines
- Tooltips
- Legends
- Series colors
- Empty states
- Hover and selected states

Use a stable visualization palette so a category retains the same meaning in light and dark modes.

## 11. Handle Third-Party Interfaces

Review components that are not automatically controlled by MUI:

- Razorpay Checkout
- PDF viewer
- Generated PDF documents
- OverlayScrollbars
- Charts
- Native browser inputs
- Toast notifications

Razorpay's hosted checkout has limited theme control, but the payment screen surrounding it should follow the application theme.

PDF exports should normally use a print-friendly light design regardless of the currently selected application mode.

## 12. Meet Accessibility Requirements

Verify:

- WCAG AA text contrast
- Visible keyboard focus
- Complete keyboard navigation
- Screen-reader labels
- Correct heading hierarchy
- Error messages linked to their input fields
- Statuses that do not rely on color alone
- Reduced-motion preference support
- Sufficient button and touch-target sizes

Theme switching must never create unreadable text, invisible controls, or missing focus indicators.

## 13. Add Responsive Theme Behavior

Test at these viewport ranges:

- 320–480 px mobile
- 600–900 px tablet
- 1024–1440 px desktop
- Large and ultra-wide displays

Confirm that:

- The sidebar and mobile drawer work correctly
- Dialogs fit inside the viewport
- Tables do not expand the entire page
- Main content remains the only page-level scrolling area
- Menus stay inside the viewport
- Text and controls remain readable at every supported size

## 14. Remove Hard-Coded Styling

Search the frontend for:

- Hexadecimal colors
- `rgb()` and `rgba()` values
- Direct `white` and `black` values
- Inline shadows
- Repeated border-radius values
- Repeated spacing values

Move repeated styling into theme tokens, component variants, or shared UI components. Keep direct colors only when they represent a fixed external identity, such as a brand logo or official payment-provider asset.

## 15. Testing and Validation

Add or perform tests for:

- Switching between light and dark mode
- Persisting the selected mode after a reload
- System-theme detection
- Protected and public layouts
- Dialogs and menus in both modes
- Forms, tables, and charts
- Main-content scrolling
- Mobile drawer behavior
- Payment screens
- Keyboard navigation
- Accessibility and contrast

Run the frontend validation commands:

```powershell
npm run lint
npm run build
npm run test
```

Also perform a visual review of every route in both light and dark modes.

## 16. Recommended Implementation Order

1. Create theme tokens and palettes.
2. Improve `ColorModeProvider`.
3. Add global MUI component overrides.
4. Refactor the application layout and navigation.
5. Create shared themed UI components.
6. Refactor authentication pages.
7. Refactor the dashboard.
8. Standardize forms and tables.
9. Refactor property and tenant modules.
10. Refactor invoice and payment modules.
11. Refactor reports and charts.
12. Refactor dialogs, menus, and notifications.
13. Complete the responsive review.
14. Complete the accessibility review.
15. Remove remaining hard-coded styling.
16. Run final lint, build, testing, and visual validation.

## 17. Suggested Module-Wise Commits

```text
feat(theme): establish semantic light and dark theme tokens
feat(theme): persist color mode and support system preference
style(layout): apply theme tokens to application shell
style(ui): add reusable themed components
style(auth): theme authentication screens
style(dashboard): theme dashboard cards and charts
style(properties): theme property and unit workflows
style(tenants): theme tenant management workflows
style(finance): theme invoices and payments
style(tables): standardize themed data tables
style(forms): standardize themed form controls
style(responsive): refine mobile and tablet layouts
fix(a11y): improve theme contrast and keyboard focus
refactor(theme): remove remaining hard-coded colors
test(theme): verify light and dark application states
```

## Definition of Done

- Every frontend route works in light and dark modes.
- Theme selection persists after refreshing or reopening the application.
- System mode responds to operating-system preference changes.
- No component calls `useColorMode` outside `ColorModeProvider`.
- Feature components use semantic theme tokens instead of repeated hard-coded colors.
- Shared components provide consistent cards, pages, status indicators, forms, tables, dialogs, and state displays.
- Main content remains the page-level scroll container while the application shell stays fixed.
- Forms, tables, charts, dialogs, menus, and notifications are readable in both modes.
- Mobile, tablet, desktop, and ultra-wide layouts have been reviewed.
- Keyboard navigation, focus states, contrast, and reduced-motion behavior meet accessibility requirements.
- Razorpay, PDF, chart, scrollbar, and notification integrations have been reviewed.
- Lint, type checking, tests, and production build pass.
- Every route has received a final visual review in both themes.
