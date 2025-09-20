# Restaurant Management System

## Overview
This is a modern restaurant management system built with Next.js, TypeScript, and Supabase. The application provides comprehensive functionality for restaurant operations including order management, staff administration, and receipt generation.

## Architecture
- **Frontend**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI with Tailwind CSS
- **Deployment**: Replit Autoscale

## Key Features
- **Multi-role Authentication**: Admin and waiter roles with different access levels
- **Order Management**: Complete order lifecycle from creation to completion
- **Menu Management**: Dynamic menu item management for admins
- **Receipt Generation**: Automated receipt creation and printing
- **Staff Management**: User creation and management for restaurant staff
- **Real-time Updates**: Live order status updates

## Project Structure
- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable UI components organized by feature
- `/lib` - Utility functions, database, and authentication logic
- `/public` - Static assets and images
- `/scripts` - Database migration scripts

## Database Setup
The project uses Supabase for authentication and database management. Database tables are defined in the `/scripts` directory with SQL migration files.

## Environment Variables
The following environment variables are required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Development
The development server runs on port 5000 with hot reload enabled. The project is configured for the Replit environment with proper host settings.

## Deployment
Configured for Replit Autoscale deployment with automatic scaling based on traffic.

## Recent Changes
- **2025-09-20**: Migrated from Firebase to Supabase
- **2025-09-20**: Configured for Replit environment
- **2025-09-20**: Set up production deployment configuration

## User Roles
- **Admin**: Full access to menu management, staff creation, order oversight, and analytics
- **Waiter**: Order creation, management, and customer service functions