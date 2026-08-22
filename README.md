# TicketBox — Ticket Booking System

Web app for movies and concerts: visual seat maps, time-limited holds, waitlists with auto-assignment on cancellation, and QR tickets by email.

Built from the *Ticket Booking System* specification (roles, holds, concurrency, waitlist offers, QR email).

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js Route Handlers
- **Database:** SQLite via Prisma (swap `DATABASE_URL` to PostgreSQL for production)
- **Auth:** JWT in an HTTP-only cookie; roles `CUSTOMER`, `ORGANISER`, `ADMIN`

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | customer@ticketbox.local | Customer123! |
| Waitlist demo | waiter@ticketbox.local | Customer123! |
| Organiser | organiser@ticketbox.local | Organiser123! |
| Admin | admin@ticketbox.local | Admin123! |

`Sold-Out Short Film` is fully booked with Jordan already on the STANDARD waitlist. Cancel Alex's booking as the customer to trigger an offer email (logged to the console if SMTP is unset).

## Environment

See `.env.example`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection (`file:./dev.db` locally) |
| `JWT_SECRET` | Signs session tokens |
| `HOLD_TTL_SECONDS` | Seat hold lifetime (default 600 = 10 minutes) |
| `WAITLIST_OFFER_SECONDS` | Waitlist offer lifetime |
| `APP_URL` | Used in waitlist email links |
| `CRON_SECRET` | Bearer token for `/api/cron/expire` |
| `SMTP_*` / `EMAIL_FROM` | Optional SMTP. If `SMTP_HOST` is empty, emails are logged to the server console; QR tickets still appear in **My tickets**. |

## Hosting

1. Push the repo to GitHub.
2. Create a [Vercel](https://vercel.com), [Render](https://render.com), or [Railway](https://railway.app) project from the repo.
3. For production, set `DATABASE_URL` to PostgreSQL, change the Prisma `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`, run migrations, then seed.
4. Set `JWT_SECRET`, `APP_URL`, SMTP (or Resend SMTP), and `CRON_SECRET`.
5. Schedule `GET /api/cron/expire` every minute (Vercel Cron, Render cron, or Railway cron) with `Authorization: Bearer $CRON_SECRET`.

Holds also expire on every seat/book/cancel request, so the app works without cron; cron is extra insurance.

## Docs in this repo

- [docs/API.md](docs/API.md) — HTTP API
- [docs/SCHEMA.md](docs/SCHEMA.md) — database schema
- [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) — holds, concurrency, waitlist (≤ 800 words)

## Seat hold and waitlist (short)

1. Selecting seats runs a transaction: each seat is updated **only if** `status = AVAILABLE`. If any update affects 0 rows, the whole hold rolls back (concurrency).
2. Holds store `heldUntil`. Reads and a cron job set expired `HELD` seats back to `AVAILABLE` (abandonment / TTL).
3. Sold-out categories can join a FIFO waitlist. Cancellation frees seats and offers the next waiter a time-limited link; missed offers go to the next in line.

## Zip deliverable

From the project parent folder:

```bash
cd "/Users/vishwaskumar/Documents/project"
zip -r TicketBox-source.zip "Ticket Booking System" -x "*/node_modules/*" -x "*/.next/*" -x "*/prisma/dev.db"
```
