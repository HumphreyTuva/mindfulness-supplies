# Architecture

## Overview
The Mindfulness Supplies Management System is built as a modern full-stack web application.

- The frontend is a React single-page application (SPA) that communicates with the backend over HTTPS.
- The backend is a Django REST Framework API that exposes branch-aware inventory and sales endpoints.
- Data is stored in SQLite for development, with support for clean deployment via PythonAnywhere and static delivery through Whitenoise.

## System Layers
- Users interact with the React SPA.
- The frontend sends requests to the Django REST API.
- The API enforces business logic, authentication, and role-based access.
- Inventory and sale records are persisted in the database.

## Technology Flow
```text
                Users                  │
                  ▼                  
       React Frontend (SPA)           │
         Axios / HTTPS                │
                  ▼                  
   Django REST Framework API         │
      Business Logic Layer            │
                  ▼                  
          SQLite Database             
```

## Key Components
- `frontend/`: React client with pages for login, dashboard, inventory, POS, and reporting.
- `backend/`: Django project containing the REST API and application models.
- `docs/`: Project documentation including API and deployment guides.
- `screenshots/`: Visual examples of the application user interface.

## Design Notes
- Branch-level inventory permissions allow admins and branch users to access only relevant data.
- Sales creation subtracts stock from branch inventory and records payment method, price, and totals.
- Custom JWT login returns additional user metadata for frontend routing and access control.
