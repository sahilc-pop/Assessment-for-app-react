# ProjectFlow - Collaborative Project Management Application



## SETUP-->
1. Clone the repo locally 
2. npm install
3. npm run dev

## Overview

ProjectFlow is a full-stack web application for collaborative project management with real-time capabilities. It features user authentication, project creation and management, task tracking with a Kanban board interface, and team collaboration tools. The application follows a modern monorepo structure with a React frontend, Express.js backend, PostgreSQL database, and WebSocket integration for real-time updates.

![WhatsApp Image 2025-08-15 at 01 08 11_0c343220](https://github.com/user-attachments/assets/6e184f44-30ed-4f63-9e6b-5f30d2041a1f)
![WhatsApp Image 2025-08-15 at 01 08 10_f4129f10](https://github.com/user-attachments/assets/fa6f2709-5cb8-4c54-b842-fcde0da1c10c)
![WhatsApp Image 2025-08-15 at 01 08 10_2a1602da](https://github.com/user-attachments/assets/f9e42454-87cc-46f1-8f89-aac7e771b527)
![WhatsApp Image 2025-08-15 at 01 08 10_67813129](https://github.com/user-attachments/assets/9eed01a0-fcf7-4c67-b986-c969ba0eabd5)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing, providing a simple alternative to React Router
- **State Management**: TanStack Query (React Query) for server state management, caching, and synchronization
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for type safety across the entire application
- **Database Layer**: Drizzle ORM with Neon serverless PostgreSQL for efficient database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Real-time Communication**: WebSocket server for live project updates and collaboration features
- **API Design**: RESTful endpoints with middleware for authentication and project permissions

### Database Design
- **Database**: PostgreSQL with Neon serverless hosting for scalability
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Core Entities**:
  - Users with profile information and authentication data
  - Projects with metadata, invite codes, and status tracking
  - Tasks with priority levels, status workflow, and assignment capabilities
  - Project memberships with role-based access control (owner/member)
- **Relationships**: Properly normalized with foreign key constraints and cascading deletes

### Authentication & Authorization
- **Strategy**: JWT tokens stored in localStorage with HTTP-only cookie fallback
- **Password Security**: Bcrypt hashing with salt rounds for secure password storage
- **Role-Based Access**: Project-level permissions with owner and member roles
- **Middleware Protection**: Route-level authentication and project access validation

### Real-time Features
- **WebSocket Integration**: Custom WebSocket server for live updates during project collaboration
- **Event Broadcasting**: Room-based messaging for project-specific real-time notifications
- **Auto-reconnection**: Client-side reconnection logic for robust connectivity
- **Live Updates**: Task status changes, project updates, and member activities broadcast instantly

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless database client for edge computing compatibility
- **drizzle-orm**: Modern TypeScript ORM with excellent type inference and performance
- **@tanstack/react-query**: Powerful data synchronization library for React applications

### UI and Styling
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Type-safe variant API for component styling
- **lucide-react**: Beautiful and consistent icon library

### Authentication & Security
- **jsonwebtoken**: JWT implementation for secure authentication tokens
- **bcrypt**: Industry-standard password hashing library
- **zod**: TypeScript-first schema validation library

### Development Tools
- **vite**: Next-generation frontend build tool with HMR and optimized bundling
- **tsx**: TypeScript execution environment for Node.js development
- **esbuild**: Fast JavaScript bundler for production builds

### Form Management
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for various schema libraries

The application uses a modern tech stack optimized for developer experience, type safety, and real-time collaboration features. The architecture separates concerns cleanly between frontend and backend while maintaining shared TypeScript types for consistency.

