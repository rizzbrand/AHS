# Assign Home Solutions — Operations Platform

Initial implementation scaffold based on the client's Business System & Team Build Brief.

## Current build
- Admin operations dashboard
- Work-order queue spanning DMG / 24 Asset / Guardian / Lula / Direct sources
- Controlled field-work interface
- Photo-compliance gate before job closure
- Role/permission model foundation
- Prisma/PostgreSQL data model for users, customers, properties, work orders, assignments, field uploads and audit events

## Next build steps
1. Connect PostgreSQL + Prisma migrations.
2. Add secure authentication and role-based authorization.
3. Implement real work-order CRUD and assignment flows.
4. Add field photo storage and EXIF/timestamp validation.
5. Add audit trail and mandatory checklist rules.
6. Integrate JobTread / source platforms based on confirmed APIs and credentials.
7. Add SOP/training module.
8. Add contractor onboarding and verification.

## Run
```bash
npm install
npm run dev
```
