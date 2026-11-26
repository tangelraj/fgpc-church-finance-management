# FGPC Yelahanka Church Finance Management System

A web-based church finance management application developed using React and Django REST Framework.

## Features

- Secure administrator and staff login
- Church finance dashboard
- Family and member management
- Tithe and offering management
- Local and denomination fund management
- Expense management
- Automatic financial balance calculation
- Cash receipt generation
- Payment voucher generation
- Amount in words conversion
- PDF printing and downloading
- Financial reports
- Church profile and receipt settings
- SQLite database backup
- Administrator-only audit logs

## Technologies Used

**Frontend:** React, Vite, Axios, React Router, Lucide React, Recharts, CSS.

**Backend:** Python, Django, Django REST Framework, ReportLab, Num2Words, OpenPyXL.

**Database:** SQLite for local development. PostgreSQL planned for production.

## Project Structure

- church_backend — Django backend and REST APIs
- church_frontend — React frontend

## Security

Financial APIs require authentication. Database backups and custom audit logs are restricted to administrators.

Environment variables, financial databases, private media and backup archives are excluded from version control.

## Development Status

Local application development completed. Production configuration and security verification are in progress.

## Organization

Full Gospel Pentecostal Church — Yelahanka, Bangalore.

Private application for authorized church administration and financial management.