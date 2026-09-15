# ShiftLog

ShiftLog is a full-stack workforce operations application built for service
teams that need a structured way to manage shift handovers, recurring tasks,
operational activity, and manager review.

Built with Next.js, TypeScript, Supabase, and PostgreSQL, the application
explores role-based workflows, authenticated team environments, operational
logging, and database-backed task management.

## Problem Statement

Small service teams often rely on informal messages, paper notes, or scattered
documents to communicate operational context between shifts.

Important information can be lost between employees, unfinished tasks may lack
clear ownership, and managers may have limited visibility into what happened
during previous shifts.

ShiftLog provides a centralized workspace for recording shift activity,
managing recurring operational tasks, and giving managers visibility into
team operations.

## Target Users

- Frontline service employees completing daily operational tasks
- Shift leads documenting activity and handing work to the next shift
- Managers reviewing tasks, shift logs, and team activity

## Current Features

- User authentication with Supabase Auth
- Team onboarding and invitation workflows
- Role-based functionality for employees and managers
- Recurring operational task creation and management
- Manager-only task controls
- Task archive and restore functionality
- Shift logging and operational handovers
- Manager review workflows
- Protected application routes
- PostgreSQL-backed application data
- Supabase Row Level Security policies
- Responsive interface built with Next.js and Tailwind CSS

## Tech Stack

- **Framework:** Next.js App Router
- **Language:** TypeScript
- **Frontend:** React
- **Styling:** Tailwind CSS
- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **Security:** Row Level Security
- **Deployment:** Vercel

## Architecture

ShiftLog uses Next.js for the application layer and Supabase for authentication
and PostgreSQL-backed data storage.

Authenticated users operate within team-based workflows, while role-based
permissions determine which operations are available to employees and managers.

Database access is protected using Supabase Row Level Security policies so
application permissions are enforced at the data layer in addition to the
user interface.

## Engineering Focus

ShiftLog was built to explore engineering problems beyond basic CRUD,
including:

- Authentication and user onboarding
- Role-based authorization
- Team-based data access
- Database security with Row Level Security
- Manager and employee workflow separation
- Recurring task lifecycle management
- Archive and restore workflows
- Operational logging and review workflows

## Security Considerations

ShiftLog uses authenticated sessions and database-level access controls to
protect team data.

Security-related design decisions include:

- Supabase authentication for user identity
- Row Level Security for database access
- Role-based manager functionality
- Protected application routes
- Team-scoped application workflows
- Server-side handling of privileged operations where required
- Environment variables for sensitive configuration

## Development Status

ShiftLog is under active development.

The current application includes the core authentication, team, task,
shift-log, and manager-review workflows. Future development will focus on
testing, CI/CD, deployment improvements, monitoring, and additional operational
features.

## Future Improvements

- Expand automated testing with Jest and React Testing Library
- Add GitHub Actions CI validation
- Improve manager analytics and operational reporting
- Add richer shift activity visualization
- Improve audit and activity history
- Expand authorization and security testing
- Add production monitoring and logging
- Explore containerized deployment with Docker
