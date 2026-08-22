# System design

TicketBox keeps a **per-show seat row** (`ShowSeat`) rather than mutating a shared venue layout. Each event clones the venue grid so two movies in the same hall do not share availability. Status is `AVAILABLE`, `HELD`, or `BOOKED`. The frontend draws that grid and polls `/api/events/:id/seats` every three seconds so holds, bookings, and releases show up without a websocket layer (which is awkward on serverless hosts).

## Seat hold and TTL

When a customer selects seats, the API replaces any previous hold they own on that show, then writes `HELD`, `heldByUserId`, and `heldUntil = now + HOLD_TTL_SECONDS` (default ten minutes). Leaving the event page calls `DELETE` on the hold so abandoned checkouts free the map immediately.

TTL is enforced in two places. First, **lazy expiry**: every map, hold, book, and cancel path runs `expireHoldsAndOffers()`, which sets `HELD` rows with `heldUntil < now` back to `AVAILABLE` and clears the holder. Second, **`/api/cron/expire`** can run on a schedule so seats free even if nobody is browsing. That combination matches “scheduler or database-level expiry” without depending on a single worker.

Held seats are advertised as unavailable to everyone except the holder (`MINE` on their map). The checkout panel counts down from `heldUntil`. If they confirm after expiry, booking fails and they must select again.

## Concurrency

Two browsers must not both hold or book the same seat. Availability checks alone are not enough: both could read `AVAILABLE` and both write. TicketBox therefore updates **conditionally inside a Prisma interactive transaction**.

For each requested id the statement is: `updateMany where id AND eventId AND status = AVAILABLE`. If `count !== 1`, the transaction throws and rolls back, including any seats already flipped in that attempt. The client gets HTTP 409 and refreshes the map.

Booking uses the same idea: only seats still `HELD` by **this user** become `BOOKED`. A racing expiry or a second device cannot convert a seat they no longer hold. SQLite serializes writers; PostgreSQL would add row locks. The `WHERE status = …` predicate is what makes simultaneous attempts fail-closed on either engine.

## Waitlist auto-assignment

A customer may join a waitlist for a **category** only when that category has zero `AVAILABLE` seats. Entries are FIFO on `queuedAt`. Duplicate active rows for the same user/event/category are rejected.

On cancel, the booking becomes `CANCELLED` and its `ShowSeat` rows return to `AVAILABLE`. The server then calls `assignWaitlistSeats(eventId, category)` for each freed category. That function takes the oldest `WAITING` entry and tries to hold **one** matching available seat for them (`HELD` + `heldUntil` = offer deadline). It marks the entry `OFFERED`, stores a `WaitlistOffer` with a secret token and JSON seat ids, and emails a link (`APP_URL/waitlist/offer/:token`).

The waitlisted customer must complete checkout before the offer clock runs out. Completing booking with `offerToken` marks the offer `ACCEPTED` and the entry `FULFILLED`.

## Time-limited offers

If they ignore the mail, cron/lazy expiry finds `OFFERED` rows with `expiresAt < now`. Those offers become `EXPIRED`, the seats are released if still held, and the waiter is put back to `WAITING` with **`queuedAt = now`** (end of the queue) so a no-show does not block the line forever. `assignWaitlistSeats` then runs again for the next person.

That is the full loop the spec asks for: hold with TTL and auto-release, exclusive seat writes, waitlist on sell-out, and a time-boxed offer chain after cancellation. QR codes encode the booking reference; SMTP sends them when configured, and the ticket page always shows the same QR so demos work without a mail vendor.
