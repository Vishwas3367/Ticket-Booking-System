# API

All JSON. Authenticated routes use the `tbs_token` HTTP-only cookie from login/register.

## Auth

| Method | Path | Auth | Body / notes |
|---|---|---|---|
| POST | `/api/auth/register` | No | `{ name, email, password, role?: "CUSTOMER" \| "ORGANISER" }` |
| POST | `/api/auth/login` | No | `{ email, password }` |
| POST | `/api/auth/logout` | No | Clears cookie |
| GET | `/api/auth/me` | Cookie | `{ user }` |

## Venues (admin creates)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/venues` | No | List venues |
| GET | `/api/venues/:id` | No | Venue + seats |
| POST | `/api/venues` | ADMIN | `{ name, address, rows, cols, premiumRows }` generates a grid. Rows 1…premiumRows are `PREMIUM`, rest `STANDARD`. |
| PATCH | `/api/venues/:id` | ADMIN | `{ name?, address?, seats?: [{ id, category }] }` |
| DELETE | `/api/venues/:id` | ADMIN | Only if the venue has no events |

## Events

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/events?q=&type=` | No | Filter by search and `MOVIE` / `CONCERT` |
| POST | `/api/events` | ORGANISER or ADMIN | `{ title, type, description, venueId, startsAt, prices: [{ category, price }] }` clones venue seats into `ShowSeat` |
| GET | `/api/events/:id` | No | Event detail |
| GET | `/api/events/:id/seats` | Cookie optional | Visual map payload; your holds appear as `MINE` |
| POST | `/api/events/:id/hold` | CUSTOMER | `{ seatIds: string[] }` — TTL hold, exclusive |
| DELETE | `/api/events/:id/hold` | User | Release this user's holds (checkout leave) |
| POST | `/api/events/:id/book` | CUSTOMER | Converts current holds to a confirmed booking; optional `{ offerToken }` |
| POST | `/api/events/:id/waitlist` | CUSTOMER | `{ category }` when none available |
| GET | `/api/events/:id/summary` | Organiser of event or ADMIN | Revenue and bookings |
| GET | `/api/organiser/events` | ORGANISER / ADMIN | Own listings |

## Bookings and waitlist

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/bookings` | User | History + QR data URLs + waitlist |
| POST | `/api/bookings/:id/cancel` | Owner or ADMIN | Frees seats and triggers waitlist assignment |
| GET | `/api/waitlist/offers/:token` | Offered user | Offer details |

## Maintenance

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET/POST | `/api/cron/expire` | `Authorization: Bearer CRON_SECRET` | Expire holds and waitlist offers |
