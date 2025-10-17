# Overview

This is a comprehensive CNG (Compressed Natural Gas) fleet conversion calculator built as a full-stack web application. The tool helps fleet managers and business decision-makers analyze the financial and operational impacts of converting their vehicle fleets from traditional gasoline/diesel to CNG. It provides detailed calculations for investment costs, payback periods, fuel savings, emissions reductions, and ROI analysis across different deployment strategies and time horizons.

The application features an interactive interface with configurable vehicle parameters, station configurations, fuel pricing, and multiple deployment strategies. Users can perform sensitivity analysis, compare different strategies, export comprehensive reports, and save/load strategy configurations for future reference.

# User Preferences

Preferred communication style: Simple, everyday language.
Number formatting: Currency values should display 2 decimal places, percentages should display 1 decimal place.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: React Context API with multiple specialized contexts (Calculator, Comparison, DarkMode, Tooltip)
- **Data Visualization**: Recharts library for interactive charts and graphs
- **Build Tool**: Vite for fast development and optimized production builds
- **Theme System**: Dynamic theme switching with JSON-based theme configuration

## Backend Architecture
- **Server**: Express.js with TypeScript for API endpoints
- **Development**: Hot module replacement via Vite middleware in development mode
- **Production**: Static file serving with Express for built client assets
- **Architecture Pattern**: Full-stack monorepo with shared types between client and server

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL for cloud hosting
- **Schema Management**: Drizzle migrations for database version control
- **Session Storage**: Connect-pg-simple for PostgreSQL-backed session management

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL storage backend
- **User Schema**: Basic user table with username/password authentication
- **Security**: Zod validation for input sanitization and type checking

## Core Business Logic
- **Calculator Engine**: Complex financial modeling for CNG conversion analysis including:
  - Multi-vehicle type support (Light, Medium, Heavy duty)
  - Dynamic annual miles parameters per vehicle type (configurable by user)
  - Station sizing and cost calculations based on fleet requirements
  - Configurable station markup percentage (0-100% in 5% increments, default 20%)
  - Fuel efficiency loss calculations for CNG conversion
  - Maintenance cost differentials between fuel types with diesel deduction factor (5¢/mile)
  - Emission reduction calculations with industry-standard factors
- **Deployment Strategies**: Multiple vehicle rollout strategies (Immediate, Phased, Aggressive, Deferred, Manual)
- **Sensitivity Analysis**: Real-time parameter variation analysis for decision support
- **Enhanced Comparison Tools**: 
  - Support for comparing up to 6 strategies simultaneously (increased from 4)
  - Multiple variations of the same strategy type with custom naming
  - Particularly useful for comparing different manual deployment schedules
  - Interactive charts showing operational metrics and fuel cost savings deltas

## External Dependencies

- **Database Hosting**: Neon Database for managed PostgreSQL
- **PDF Generation**: jsPDF and html2canvas for report exports
- **Date Handling**: date-fns for consistent date manipulation
- **Form Validation**: React Hook Form with Zod resolvers
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization
- **UI Components**: Radix UI primitives for accessible components
- **Build Tools**: esbuild for server bundling, PostCSS for CSS processing