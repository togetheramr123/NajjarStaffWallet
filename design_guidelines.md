# Design Guidelines: HON GROUP Employee Credit Management System

## Design Approach
**Selected System:** Material Design adapted for enterprise data management
**Rationale:** This is a data-heavy business application requiring clear information hierarchy, robust form patterns, and professional credibility. Material Design provides excellent dashboard components and RTL support for Arabic interface.

## Core Design Principles
1. **Professional Trust:** Clean, corporate aesthetic that conveys reliability
2. **Data Clarity:** Clear visual hierarchy for numbers, balances, and transaction histories
3. **Bilingual Excellence:** Seamless Arabic-English experience with proper RTL support
4. **Action Confidence:** Clear distinction between viewing data and taking actions (approve/reject/withdraw)

## Typography System
**Arabic Font:** Cairo or Tajawal (Google Fonts) - medium weight for body, bold for headings
**English Font:** Inter or Roboto (Google Fonts) - for mixed content
**Hierarchy:**
- Page titles: 2xl/3xl, bold
- Section headers: xl, semibold
- Data labels: sm, medium, uppercase tracking
- Values/numbers: lg/xl, bold (especially for balances)
- Body text: base, regular
- Helper text: sm, regular

## Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, 8, 16, 24
**Consistent patterns:** p-6 for cards, gap-4 for grids, space-y-6 for sections

## Component Library

### Welcome/Intro Page (Pre-Login)
- Full-viewport centered layout with HON GROUP logo prominent at top
- Inspirational message in elegant typography: "مجموعة النجار تسعى لخدمة كل عناصر العاملين - وأنت واحد منهم، بل أفضلهم"
- Professional background with subtle gradient or pattern
- Clear "تسجيل الدخول / Login" button at bottom center

### Dashboard Layout (Both Roles)
- Top navigation bar: Logo left (RTL: right), user profile/logout right (RTL: left)
- Sidebar navigation for Manager role (Employee Management, Credit Operations, Pending Requests, Reports)
- Main content area with white background cards on light gray backdrop

### Balance Display Cards
- Large, prominent balance number with currency label
- Clear visual distinction between "Current Balance" and "Available Balance" (after pending)
- Monthly service fee (50) shown as recurring deduction indicator
- Use bordered cards with subtle shadow

### Transaction History Table
- Striped rows for readability
- Columns: Date, Type, Amount, Beneficiary, Status, Attachment
- Status badges: Approved (green), Pending (yellow), Rejected (red), Service Fee (blue)
- Sortable headers, date range filters at top
- Pagination at bottom

### Withdrawal Request Form (Employee)
- Clear step-by-step layout
- Amount input with large, clear number field
- Beneficiary radio options: "لي شخصياً / For Myself" and "لأسرتي / For My Family"
- File upload area for attachment with drag-drop zone
- Summary preview before submission
- Clear "Submit Request" button

### Manager Approval Interface
- Three-column status board: Pending / Approved / Rejected
- Request cards showing: Employee name, amount, beneficiary, date, attachment link
- Quick actions: Approve (green), Reject (red), Modify (blue) buttons
- Reason/notes textarea for rejections or modifications

### Employee Management (Manager)
- Table view with search and filters
- Quick action buttons: Add Employee (primary), Edit, View Details
- Employee creation modal: Name, ID, Role/Permissions checkboxes, Initial Balance
- Permission toggles for different access levels

### Credit Operations (Manager)
- Add Credit form: Select employee, amount, reason/notes
- Adjust Balance form: Employee, adjustment amount (+ or -), reason
- Transaction log filtered by employee with export option

## RTL Support Requirements
- All layouts flip horizontally for Arabic
- Text alignment: right for Arabic, left for English
- Navigation: right-to-left flow
- Icons: mirror horizontally where directional (arrows, etc.)

## Images
**Welcome Page:** Professional workplace image or HON GROUP building exterior as background (subtle overlay for text readability)
**Dashboard Header:** Optional small banner image showing teamwork/construction theme

## Accessibility & Interaction
- All form inputs with clear labels in both languages
- Focus states with visible outline
- Hover states for interactive elements (subtle background change)
- Loading spinners for async operations
- Success/error toast notifications for actions
- Confirm dialogs for destructive actions (reject, delete)

## Data Visualization
- Simple bar charts for monthly transaction summaries
- Pie chart for credit distribution by department (if applicable)
- Line graph for balance trends over time
- Use red/blue from HON GROUP logo as primary chart colors