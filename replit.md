# HSN GROUP Employee Credit Management System

## Overview

This is an employee credit management system for HSN GROUP, designed to manage employee balances, withdrawal requests, and financial transactions. The system supports two user roles: employees who can view their balance and request withdrawals, and managers who can approve/reject requests and manage employee accounts.

The application is built as a full-stack TypeScript application with a React frontend and Express backend, featuring bilingual support (Arabic/English) with RTL layout support for Arabic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: Shadcn/ui components built on Radix UI primitives
- Material Design-inspired aesthetic adapted for enterprise data management
- Comprehensive component library including dialogs, forms, tables, cards, and navigation
- Tailwind CSS for styling with custom design tokens

**State Management**: 
- TanStack Query (React Query) for server state management
- Context API for authentication state
- Local component state with React hooks

**Routing**: Wouter for client-side routing

**Key Design Patterns**:
- Component-based architecture with reusable UI components
- Form handling with React Hook Form and Zod validation
- Separation of concerns between presentational and container components
- Custom hooks for shared logic (authentication, mobile detection, toasts)

**Bilingual Support**:
- Arabic as primary language with RTL layout support
- English as secondary language
- Cairo/Tajawal fonts for Arabic, Inter/Roboto for English
- RTL-aware component positioning

### Backend Architecture

**Framework**: Express.js with TypeScript

**Authentication**: 
- Passport.js with local strategy
- Session-based authentication using express-session
- Password hashing with Node.js crypto (scrypt)
- Session storage can use either memory store or PostgreSQL

**API Design**:
- RESTful endpoints organized by feature
- JSON request/response format
- File upload support via Multer for attachments
- Centralized error handling

**Key Backend Patterns**:
- Repository pattern via storage abstraction (IStorage interface)
- Separation of auth, routing, and business logic
- Middleware-based request processing
- Environment-based configuration

### Data Storage

**Database**: PostgreSQL

**ORM**: Drizzle ORM
- Type-safe database queries
- Schema-first approach with migrations
- Integration with Zod for validation

**Schema Design**:
- `users` table: Employee and manager accounts with role-based access
- `transactions` table: All financial transactions (withdrawals, deposits, adjustments, service fees)
- `withdrawal_requests` table: Employee withdrawal requests with approval workflow
- `service_fee_log` table: Monthly service fee tracking

**Key Features**:
- UUID primary keys for security
- Enums for type safety (roles, statuses, transaction types)
- Foreign key relationships for data integrity
- Timestamp tracking for audit trails

### Authentication & Authorization

**Authentication Mechanism**:
- Session-based authentication with secure cookies
- Password hashing using scrypt with salt
- Timing-safe password comparison

**Authorization**:
- Role-based access control (employee vs manager)
- Protected routes requiring authentication
- Role-specific API endpoints

### File Management

**Upload Handling**:
- Multer middleware for multipart form data
- File storage in local `uploads` directory
- Unique filename generation to prevent collisions
- Attachment support for withdrawal requests

### Business Logic

**Monthly Service Fees**:
- Automatic 50 EGP monthly service fee deduction
- Scheduled via node-cron to run on the 1st of each month at 00:05
- Also runs on server startup to catch any missed fees
- Service fee tracking in separate log table
- Prevention of duplicate charges per month (idempotent)
- Implementation: server/scheduler.ts

**Balance Management**:
- Real-time balance calculations
- Pending amount tracking for unapproved withdrawals
- Available balance = current balance - pending withdrawals
- Manager-initiated balance adjustments with audit trail
- Overdraw protection: system prevents approving withdrawals exceeding available balance

**Withdrawal Workflow**:
1. Employee submits withdrawal request with attachment
2. Request enters pending status
3. Manager reviews and can approve, reject, or modify amount
4. Upon approval, balance is updated and transaction recorded
5. Rejection maintains original balance with reason logged

### Build & Deployment

**Development**:
- Vite dev server with HMR for frontend
- TSX for running TypeScript server in development
- Separate client and server development modes

**Production Build**:
- Frontend: Vite builds optimized static assets
- Backend: esbuild bundles server with selective dependency bundling
- Single production command serves both static files and API

**Configuration**:
- Environment variables for database connection
- Path aliases for clean imports (@/, @shared/)
- TypeScript strict mode enabled

## External Dependencies

### Database
- **PostgreSQL**: Primary relational database
- Connection via `pg` driver with connection pooling
- Database URL configured via environment variable

### Third-Party Services
- **Drizzle ORM**: Database ORM and query builder
- **Passport.js**: Authentication middleware
- **Express Session**: Session management (with optional PostgreSQL store via connect-pg-simple)

### UI Libraries
- **Radix UI**: Unstyled accessible component primitives
- **Shadcn/ui**: Pre-built component patterns
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Recharts**: Chart and data visualization library

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation for forms and API
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Development Tools
- **TypeScript**: Type safety across stack
- **Vite**: Frontend build tool and dev server
- **esbuild**: Backend bundler for production
- **TSX**: TypeScript execution for development

### File Handling
- **Multer**: Multipart form data and file upload handling

### Utilities
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional className utilities
- **nanoid**: Unique ID generation