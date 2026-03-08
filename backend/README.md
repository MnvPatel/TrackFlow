# Task & Project Tracking Portal

A **role-based project tracking and reporting platform** that allows organizations to manage projects, assign tasks, track employee submissions, collaborate through comments, and provide clients with transparent progress updates.

The system supports **Admins, Employees, and Clients**, enabling structured task workflows, approval mechanisms, analytics dashboards, and notification systems.

---

# Features

## Role-Based Access Control (RBAC)

### Admin
- Create, edit, and delete projects
- Assign team members to projects
- Create and assign tasks
- Review and approve/reject work submissions
- Monitor analytics and employee performance
- Convert client issues into tasks

### Employee
- View assigned projects and tasks
- Submit work updates with media (image/video)
- Track progress and deadlines
- Collaborate via comments

### Client
- View their assigned projects
- Monitor task progress and submissions
- Comment on tasks
- Raise issues that admins can convert into tasks

---

# Core Modules

## Authentication System
- JWT authentication
- Refresh tokens
- OTP-based verification
- Password hashing with bcrypt
- Role-based authorization

## Project Management
- Admin creates projects
- Assigns clients and employees
- Track project completion percentage
- Milestones support

## Task Management
- Tasks belong to projects
- Assign employees
- Set deadlines and priorities
- Track status transitions

## Work Submission
Employees submit:
- Work description
- Completion percentage
- Media attachments

Admins can:
- Approve
- Reject
- Request rework

## Comments
Supports:
- Task-level discussions
- Internal project comments
- Reply threads

## Issue Tracking
Clients can raise issues.

Admins can convert issues → tasks.

## Notifications
Automatic notifications triggered when:

- Task assigned
- Work submitted
- Work approved/rejected
- Comments added
- Issues created

## Analytics
Dashboards for:

### Admin
- Project statistics
- Task completion metrics
- Employee performance

### Employee
- Assigned tasks
- Completed tasks
- Deadlines

### Client
- Project progress
- Task completion overview

---

# Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript

### Database
- PostgreSQL
- Prisma ORM

### Caching
- Redis

### Authentication
- JWT
- Refresh Tokens
- OTP verification

### Infrastructure
- Docker
- Docker Compose

### Storage
- Media upload support (Cloudinary / AWS S3 compatible)

---

# System Architecture
