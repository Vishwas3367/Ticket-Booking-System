# TicketBox — Ticket Booking System

Web app for movies and concerts: visual seat maps, time-limited holds, waitlists with auto-assignment on cancellation, and QR tickets by email.

Built from the **Ticket Booking System** specification (roles, holds, concurrency, waitlist offers, QR email).

## Live Demo

https://ticket-booking-system-chi-ruddy.vercel.app/

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js Route Handlers
- **Database:** PostgreSQL via Prisma + Neon
- **Auth:** JWT in an HTTP-only cookie; roles `CUSTOMER`, `ORGANISER`, `ADMIN`

## Setup

```bash
cp .env.example .env

npm install

npx prisma migrate dev

npm run db:seed

npm run dev
````

Open:

[http://localhost:3000](http://localhost:3000)

### Demo accounts

| Role          | Email                                                         | Password      |
| ------------- | ------------------------------------------------------------- | ------------- |
| Customer      | [customer@ticketbox.local](mailto:customer@ticketbox.local)   | Customer123!  |
| Waitlist demo | [waiter@ticketbox.local](mailto:waiter@ticketbox.local)       | Customer123!  |
| Organiser     | [organiser@ticketbox.local](mailto:organiser@ticketbox.local) | Organiser123! |
| Admin         | [admin@ticketbox.local](mailto:admin@ticketbox.local)         | Admin123!     |

`Sold-Out Short Film` is fully booked with Jordan already on the STANDARD waitlist. Cancel Alex's booking as the customer to trigger an offer email (logged to the console if SMTP is unset).

## Environment

See `.env.example`.

| Variable                 | Purpose                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string (Neon)                                                                                         |
| `JWT_SECRET`             | Signs session tokens                                                                                                        |
| `HOLD_TTL_SECONDS`       | Seat hold lifetime (default 600 = 10 minutes)                                                                               |
| `WAITLIST_OFFER_SECONDS` | Waitlist offer lifetime                                                                                                     |
| `APP_URL`                | Used in waitlist email links                                                                                                |
| `CRON_SECRET`            | Bearer token for `/api/cron/expire`                                                                                         |
| `SMTP_*` / `EMAIL_FROM`  | Optional SMTP. If `SMTP_HOST` is empty, emails are logged to the server console; QR tickets still appear in **My Tickets**. |

## Hosting

1. Push the repo to GitHub.

2. Create a Vercel project from the repository.

3. Set the production environment variables, including `DATABASE_URL` for the Neon PostgreSQL database, `JWT_SECRET`, `APP_URL`, `CRON_SECRET`, and the SMTP/email variables.

4. Deploy the application.

5. The production application is hosted on Vercel and uses PostgreSQL via Prisma and Neon for persistent database storage.

Holds also expire on every seat/book/cancel request, so the application can enforce the hold TTL without depending entirely on a scheduled cron job.

## Docs in this repo

* [docs/API.md](docs/API.md) — HTTP API
* [docs/SCHEMA.md](docs/SCHEMA.md) — database schema
* [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) — holds, concurrency, waitlist (≤ 800 words)

## Seat hold and waitlist (short)

1. Selecting seats runs a transaction: each seat is updated **only if** `status = AVAILABLE`. If any update affects 0 rows, the whole hold rolls back, preventing concurrent customers from holding the same seat.

2. Holds store `heldUntil`. Expired `HELD` seats can be released back to `AVAILABLE` during subsequent seat, booking, or cancellation requests, enforcing the configured TTL when a customer abandons checkout.

3. Sold-out categories can join a FIFO waitlist. Cancellation frees seats and offers the next waiter a time-limited link; missed or expired offers go to the next customer in line.

## Zip deliverable

From the project parent folder:

```bash
zip -r TicketBox-source.zip "Ticket Booking System" \
  -x "*/node_modules/*" \
  -x "*/.next/*" \
  -x "*/.env" \
  -x "*/.git/*"
```

````
