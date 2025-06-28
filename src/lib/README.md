# Core Business Logic & Data Layer (`/src/lib`)

This directory is the heart of the Cheetah Payroll application's backend logic. It follows a sophisticated, multi-layer architecture designed for scalability, maintainability, and clear separation of concerns.

## Architectural Overview

The architecture is divided into distinct layers, and the flow of data and dependencies is strictly unidirectional:

**UI Layer (`/src/app`) -> Service Layer -> Data Access Layer -> Database**

This strict dependency rule ensures that layers are decoupled. For example, the Service Layer has no knowledge of the UI that calls it, and the Data Access Layer has no knowledge of the business logic it serves.

### Layers

1.  **Service Layer (`/services`)**
    *   **Responsibility:** Contains all core business logic. Services orchestrate complex operations, enforce business rules, and act as the primary interface for the UI layer.
    *   **Example:** `PayrollCalculationService` contains the logic for calculating payroll, while `StaffService` handles operations related to employees.

2.  **Data Access Layer (`/data-access`)**
    *   **Responsibility:** Provides a simplified API for all database operations (CRUD). This layer contains Data Access Objects (DAOs) that abstract away the specifics of Supabase queries.
    *   **Goal:** To completely isolate the rest of the application from the database. If we were to switch from Supabase to another database, this would be the only layer that needs significant changes.

3.  **Mapping Layer (`/mappings`)**
    *   **Responsibility:** Transforms data between different formats. Its primary use is to convert data objects from the database (often with `snake_case` fields) to the internal format used by the application (`camelCase` DTOs/types).
    *   **Benefit:** Decouples the public database schema from the internal data representation, allowing them to evolve independently.

4.  **Types Layer (`/types`)**
    *   **Responsibility:** Provides a single, authoritative source for all TypeScript type definitions and interfaces. Organizing types by feature (e.g., `company.ts`, `staff.ts`) ensures that the entire application shares a consistent and predictable data model.

## Important Considerations

*   **Circular Dependencies:** Avoid them at all costs. The ESLint configuration for this project is set up to detect and report circular dependencies between modules. A service should never import another service that imports the first service.
*   **Service Registry (`ServiceRegistry.ts`):** This file uses a Service Locator pattern to manage service instances. While this helps manage dependencies, avoid turning it into a "god object." Services should remain as decoupled as possible.
