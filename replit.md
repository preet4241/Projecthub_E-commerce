# ProjectHub - Academic Project Marketplace

## Overview

ProjectHub is an e-commerce platform designed for buying and selling academic projects. It serves as a marketplace where students can browse, search, and purchase academic projects organized by subject and college. The platform features a shopping cart system, user management with ban functionality, and administrative controls.

The application is built as a full-stack web application with a Node.js/Express backend serving a vanilla JavaScript frontend. It uses PostgreSQL for persistent data storage and implements a RESTful API architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: Vanilla JavaScript, HTML5, CSS3

**Design Pattern**: Single Page Application (SPA) approach with dynamic content loading

- **Rationale**: Chosen for simplicity and minimal dependencies, avoiding the overhead of frontend frameworks while maintaining interactivity
- **Component Structure**: DOM manipulation through vanilla JS with modular functions for different features (cart, search, filters, admin panel)
- **State Management**: In-memory JavaScript objects (`cart`, `allProjects`, `favorites`) manage application state
- **UI/UX Features**:
  - Responsive mobile-first design with hamburger menu navigation
  - Real-time search with suggestions
  - Filter and dropdown systems for project categorization
  - Shopping cart with persistent count display
  - Modal-based interfaces for search and admin functions

**Pros**: Zero build step, fast development, minimal complexity
**Cons**: Limited scalability for complex state management, no component reusability framework

### Backend Architecture

**Technology Stack**: Node.js with Express.js v5.1.0

**Design Pattern**: Traditional MVC-inspired server architecture with route handlers and database queries

- **Rationale**: Express provides a lightweight, unopinionated framework suitable for building RESTful APIs quickly
- **Server Structure**: Single entry point (`index.js`) handles all routes, middleware, and database connections
- **API Design**: RESTful endpoints for CRUD operations on projects, users, and cart items
- **Middleware**: 
  - `express.static()` for serving frontend assets from `/public`
  - `express.json()` for parsing JSON request bodies

**Pros**: Simple to understand, fast setup, minimal abstraction
**Cons**: All logic in single file may become unwieldy as application grows, no clear separation of concerns

### Data Storage

**Database**: PostgreSQL

**Schema Design**: Relational database with three main tables:

1. **projects**: Stores academic project listings
   - Fields: id, subject, college, topic, price, file, downloads, created_at
   - Primary Key: Auto-incrementing serial ID
   
2. **users**: Manages user accounts
   - Fields: id, name, email, college, is_banned, created_at
   - Constraint: Unique email addresses
   - Feature: Ban functionality for administrative control
   
3. **cart_items**: Shopping cart persistence
   - Fields: id, project_id (foreign key reference to projects)
   - Enables cart state to survive page refreshes

**Connection Management**: PostgreSQL connection pooling via `pg` library

- **Rationale**: Connection pooling optimizes database performance by reusing connections
- **Configuration**: Uses environment variable `DATABASE_URL` with fallback to local development database

**Database Initialization**: Automatic table creation on application startup through `initDatabase()` function

**Pros**: ACID compliance, relational integrity, mature ecosystem
**Cons**: Requires separate PostgreSQL server setup and management

### Authentication & Authorization

**Current State**: No authentication system implemented

**Admin Access**: Secret code-based admin panel (`@hackerponline` search query)

- **Rationale**: Placeholder implementation for development/demonstration
- **Security Concern**: This is NOT production-ready and should be replaced with proper authentication

**User Management**: Users table exists with ban functionality, suggesting planned user account features

**Future Consideration**: Should implement proper authentication (JWT, sessions, or OAuth) before production deployment

### File Handling

**File Storage**: Projects table includes `file` field (VARCHAR 255)

- **Current Implementation**: File path/reference storage in database
- **Missing Component**: No visible file upload or storage mechanism in provided code
- **Assumption**: File upload functionality may be incomplete or in separate files not included

## External Dependencies

### NPM Packages

1. **express** (v5.1.0)
   - Purpose: Web application framework and HTTP server
   - Usage: Route handling, middleware, static file serving

2. **pg** (v8.16.3)
   - Purpose: PostgreSQL client for Node.js
   - Usage: Database connections, query execution, connection pooling

3. **@types/node** (v22.13.11)
   - Purpose: TypeScript type definitions for Node.js
   - Usage: Development dependency for IDE autocompletion (though project uses vanilla JS)

### Third-Party Services & APIs

1. **Chart.js** (CDN)
   - Source: `https://cdn.jsdelivr.net/npm/chart.js`
   - Purpose: Data visualization library (likely for admin dashboard or analytics)
   - Integration: Loaded via CDN in HTML

### Database

- **PostgreSQL**: Required external service
- **Connection**: Via connection string (environment variable or hardcoded localhost)
- **Default**: `postgresql://postgres:postgres@localhost:5432/projecthub`

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (optional, has default)
- `PORT`: Server port (defaults to 5000 if not set)

### Browser APIs Used

- LocalStorage/SessionStorage: Likely used for cart persistence (not visible in provided snippets)
- Fetch API: For AJAX requests to backend API
- DOM APIs: Extensive manipulation for dynamic UI updates