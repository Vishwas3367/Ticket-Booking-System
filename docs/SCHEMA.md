# Database schema

SQLite (Prisma). Production: set `provider = "postgresql"` and a Postgres `DATABASE_URL`.

## Tables

**User** — `id`, `email` unique, `passwordHash`, `name`, `role` (`CUSTOMER` | `ORGANISER` | `ADMIN`)

**Venue** — `name`, `address`, `rows`, `cols`, `adminId`

**Seat** — per venue cell: `row`, `col`, `label` (e.g. `A1`), `category` (`PREMIUM` | `STANDARD`). Unique `(venueId, row, col)`.

**Event** — organiser, venue, `title`, `type` (`MOVIE` | `CONCERT`), `description`, `startsAt`

**EventPrice** — unique `(eventId, category)`, `price` in paise/cents

**ShowSeat** — one row per seat per show: `status` (`AVAILABLE` | `HELD` | `BOOKED`), `heldByUserId`, `heldUntil`, `bookingId`. Unique `(eventId, seatId)`.

**Booking** — `reference` unique, `userId`, `eventId`, `status` (`CONFIRMED` | `CANCELLED`), `total`

**WaitlistEntry** — FIFO via `queuedAt`; `status` `WAITING` | `OFFERED` | `FULFILLED`

**WaitlistOffer** — `token` unique, JSON `showSeatIds`, `expiresAt`, `status` `OFFERED` | `ACCEPTED` | `EXPIRED`

## Relations

Venue 1—* Seat; Event 1—* ShowSeat → Seat; Booking 1—* ShowSeat; Event 1—* WaitlistEntry 1—* WaitlistOffer.
