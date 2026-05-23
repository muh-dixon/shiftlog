# ShiftLog Schema Plan

This document outlines the initial data model for ShiftLog. It is a planning artifact only and does not include SQL, Supabase migrations, API routes, or implementation code.

## Relationship Overview

Primary operating flow:

```text
users
  |
  v
teams
  |
  v
shifts
  |
  v
shift_logs
```

Supporting management flow:

```text
teams
  |
  v
recurring_tasks

shift_logs
  |
  v
manager_flags
```

## users

### Purpose

Represents people who use ShiftLog, including frontline staff, shift leads, and managers.

### Fields

- Unique user identifier
- Team reference
- Display name
- Email address
- Role
- Account status
- Creation timestamp
- Update timestamp

### Example Fields and Data Types

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary identifier for each user |
| `teamId` | UUID | References the team the MVP user belongs to |
| `name` | Text | Display name shown across the app |
| `email` | Text | User email address |
| `role` | Enum/Text | Example values: `staff`, `lead`, `manager` |
| `status` | Enum/Text | Example values: `active`, `inactive` |
| `createdAt` | Timestamp | When the user record was created |
| `updatedAt` | Timestamp | When the user record was last updated |

### Relationships

- A user belongs to one team in the MVP model.
- A user may create many shifts.
- A user may author many shift logs.
- A user may create or resolve manager flags.

### Why the Table Exists

ShiftLog needs a consistent way to associate operational activity with the person responsible for it. Even before authentication is implemented, the product model depends on users as authors, assignees, leads, and managers.

## teams

### Purpose

Represents a service team or work group that shares shifts, handovers, recurring tasks, and manager visibility.

### Fields

- Unique team identifier
- Team name
- Optional location or department
- Team status
- Creation timestamp
- Update timestamp

### Example Fields and Data Types

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary identifier for each team |
| `name` | Text | Team name, such as `Front Desk` or `Evening Support` |
| `location` | Text | Optional site, branch, or department label |
| `status` | Enum/Text | Example values: `active`, `archived` |
| `createdAt` | Timestamp | When the team record was created |
| `updatedAt` | Timestamp | When the team record was last updated |

### Relationships

- A team has many users.
- A team has many shifts.
- A team owns many shift logs through shifts.
- A team has many recurring tasks.
- A team can have many manager flags through shift logs.

### Why the Table Exists

Teams are the main boundary for operations in ShiftLog. They keep handovers, tasks, and management review scoped to the group that actually needs that information.

## shifts

### Purpose

Represents a scheduled or completed morning, afternoon, or closing work period for a team.

### Fields

- Unique shift identifier
- Team reference
- Shift owner or lead reference
- Shift type
- Service date
- Start time
- End time
- Shift status
- Creation timestamp
- Update timestamp

### Example Fields and Data Types

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary identifier for each shift |
| `teamId` | UUID | References the team responsible for the shift |
| `leadUserId` | UUID | References the user leading or closing the shift |
| `type` | Enum/Text | Example values: `morning`, `afternoon`, `closing` |
| `serviceDate` | Date/Text | Operating date for the shift |
| `startsAt` | Timestamp | Scheduled or actual shift start |
| `endsAt` | Timestamp | Scheduled or actual shift end |
| `status` | Enum/Text | Example values: `scheduled`, `active`, `completed`, `cancelled` |
| `createdAt` | Timestamp | When the shift record was created |
| `updatedAt` | Timestamp | When the shift record was last updated |

### Relationships

- A shift belongs to one team.
- A shift may have one lead user.
- A shift has many shift logs.

### Why the Table Exists

Shifts provide the time-based container for handover activity. They make it possible to organize notes, incidents, open work, and follow-up items around a specific operating period.

## shift_logs

### Purpose

Represents structured handover data recorded during a shift.

### Fields

- Unique log identifier
- Team reference
- Shift reference
- Author reference
- Submission or review status
- Completed tasks
- Outstanding tasks
- Equipment issues
- Customer incidents
- Free-text notes
- Manager attention state
- Creation timestamp
- Update timestamp

### Example Fields and Data Types

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary identifier for each log entry |
| `teamId` | UUID | References the team that owns the log |
| `shiftId` | UUID | References the shift this log belongs to |
| `userId` | UUID | References the user who wrote the log |
| `status` | Enum/Text | Example values: `draft`, `submitted`, `reviewed` |
| `completedTasks` | Array | Tasks completed during the shift |
| `outstandingTasks` | Array | Tasks that need to carry into the next shift |
| `equipmentIssues` | Array | Equipment problems and service impact |
| `customerIncidents` | Array | Customer incidents and follow-up needs |
| `notes` | Text | Free-text handover notes |
| `managerAttentionState` | Enum/Text | Example values: `none`, `requested`, `flagged`, `resolved` |
| `createdAt` | Timestamp | When the log was created |
| `updatedAt` | Timestamp | When the log was last updated |

### Relationships

- A shift log belongs to one team.
- A shift log belongs to one shift.
- A shift log is authored by one user.
- A shift log may have zero or more manager flags.

### Why the Table Exists

Shift logs are the core handover record. They capture completed work, outstanding work, equipment issues, customer incidents, notes, and manager attention needs that must survive between team members, shifts, and manager reviews.

## recurring_tasks

### Purpose

Represents repeatable opening, closing, or service tasks that a team needs to remember and reset by shift.

### Fields

- Unique recurring task identifier
- Team reference
- Task title
- Task description
- Shift types where the task applies
- Priority
- Task status
- Creation timestamp
- Update timestamp

### Example Fields and Data Types

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary identifier for each recurring task |
| `teamId` | UUID | References the team that owns the task |
| `title` | Text | Short task name |
| `description` | Text | Optional detail for completing the task |
| `shiftTypes` | Array | Example values: `morning`, `afternoon`, `closing` |
| `priority` | Enum/Text | Example values: `low`, `normal`, `high` |
| `status` | Enum/Text | Example values: `active`, `paused`, `archived` |
| `createdAt` | Timestamp | When the recurring task was created |
| `updatedAt` | Timestamp | When the recurring task was last updated |

### Relationships

- A recurring task belongs to one team.
- A recurring task may inform future shift logs or generated checklist items that reset by shift.

### Why the Table Exists

Recurring tasks reduce repeated manual setup for predictable operational work. They also help managers and shift leads standardize what must be checked or handed over each shift.

## manager_flags

### Purpose

Represents escalated issues that need manager attention, review, or follow-up.

### Fields

- Unique manager flag identifier
- Shift log reference
- Team reference
- Creator reference
- Assigned manager reference
- Reason
- Priority
- Status
- Resolution notes
- Creation timestamp
- Update timestamp
- Resolution timestamp

### Example Fields and Data Types

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary identifier for each manager flag |
| `shiftLogId` | UUID | References the shift log being flagged |
| `teamId` | UUID | References the team where the issue occurred |
| `createdByUserId` | UUID | References the user who raised the flag |
| `assignedManagerUserId` | UUID | Optional reference to the manager responsible for review |
| `reason` | Text | Short explanation for the flag |
| `priority` | Enum/Text | Example values: `normal`, `high`, `urgent` |
| `status` | Enum/Text | Example values: `open`, `reviewing`, `resolved`, `dismissed` |
| `resolutionNotes` | Text | Optional manager notes after review |
| `createdAt` | Timestamp | When the flag was created |
| `updatedAt` | Timestamp | When the flag was last updated |
| `resolvedAt` | Timestamp | When the flag was resolved, if applicable |

### Relationships

- A manager flag belongs to one shift log.
- A manager flag belongs to one team.
- A manager flag is created by one user.
- A manager flag may be assigned to one manager user.

### Why the Table Exists

Manager flags separate normal handover history from items that need escalation. This gives managers a focused review queue without losing the context of the original shift log.
