# Overview

This is a Hebrew-language web application for managing vehicle arrangements and employee transportation scheduling. The system provides three main scheduling views: daily arrangements, holiday arrangements, and weekend arrangements. The application uses Firebase Firestore for real-time data synchronization and is built with a modern React frontend and Express backend.

The application supports:
- Real-time collaborative editing of vehicle assignments
- Employee and vehicle management with autocomplete
- Status group tracking for employees not assigned to vehicles
- Date-based scheduling with calendar integration
- Hebrew RTL (right-to-left) interface

# User Preferences

Preferred communication style: Simple, everyday language.
Preferred language: Hebrew (עברית)

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling

**Routing**: wouter for client-side routing with three main routes:
- `/` - Daily arrangements page
- `/holiday` - Holiday arrangements page  
- `/weekend` - Weekend arrangements page

**State Management**: 
- React hooks for local component state
- TanStack Query for server state management
- Real-time Firebase Firestore subscriptions for data synchronization

**Styling Approach**:
- Tailwind CSS v4 with custom theme configuration
- RTL (right-to-left) support for Hebrew language
- Custom CSS variables for theming (defined in index.css)
- Heebo and Inter font families

**Key Design Patterns**:
- Component composition with reusable UI primitives
- Custom hooks for mobile detection and toast notifications
- Autocomplete inputs for employee and vehicle selection
- Debounced writes (800ms) to Firestore to reduce network calls

## Backend Architecture

**Framework**: Express.js with TypeScript

**Server Setup**:
- HTTP server created with Node's http module
- Vite development middleware integration for HMR in development
- Static file serving for production builds
- Custom logging middleware for request tracking

**Database Schema** (PostgreSQL with Drizzle ORM):
- Users table with username/password authentication
- Schema defined in `shared/schema.ts`
- Currently using in-memory storage implementation (`MemStorage`)
- Drizzle configured for PostgreSQL but not yet connected

**API Structure**:
- Routes registered in `server/routes.ts`
- All application routes prefixed with `/api`
- Storage interface abstraction for CRUD operations

**Build Process**:
- ESBuild bundles server code with selective dependency bundling
- Vite builds client code
- Production server serves pre-built static files

## Data Storage Solutions

**Primary Database**: Firebase Firestore (not PostgreSQL as suggested by Drizzle config)

**Collections Structure**:
- `daily_arrangements` - Daily vehicle and status arrangements
- `holiday_arrangements` - Holiday-specific vehicle arrangements  
- `weekend_arrangements` - Weekend departure/arrival arrangements

**Document ID Formats**:
- Daily: `YYYY-MM-DD`
- Holiday: `YYYY-MM-DD`
- Weekend: `departure_YYYY-MM-DD_arrival_YYYY-MM-DD`

**Data Models**:
- `Vehicle`: number, driver, passengers array, optional note
- `StatusGroup`: status string, employees array
- `DailyArrangement`: dropOffVehicles, pickUpVehicles, statusGroups
- `HolidayArrangement`: vehicles array
- `WeekendArrangement`: departure vehicles, arrival vehicles, dates

**Real-time Sync Pattern**:
- Firestore `onSnapshot` subscriptions for live updates
- Automatic document creation if not exists
- Debounced saves to reduce write operations
- Optimistic UI updates with local state

## Authentication and Authorization

**Firebase Authentication**: 
- Anonymous authentication enabled
- Auto sign-in on application load
- No user management or role-based access control implemented
- Future PostgreSQL user schema exists but unused

## External Dependencies

**Firebase Services**:
- Firebase SDK v9+ (modular)
- Firestore for real-time database
- Firebase Authentication for anonymous users
- Environment variables required:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`

**Database (Configured but Unused)**:
- Neon Database serverless PostgreSQL driver
- Drizzle ORM for schema management
- `DATABASE_URL` environment variable expected

**UI and Styling**:
- Radix UI component primitives
- Tailwind CSS v4 with inline configuration
- Lucide React for icons
- date-fns for date manipulation with Hebrew locale

**Development Tools**:
- Replit-specific Vite plugins (cartographer, dev-banner, runtime-error-modal)
- Custom meta images plugin for OpenGraph tags
- TypeScript with path aliases (@, @shared, @assets)

**Deployment**:
- Designed for Replit deployment
- Custom Vite plugin updates meta tags with Replit domain
- Static asset serving from client/public directory