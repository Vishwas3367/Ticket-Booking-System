import { hashPassword } from "../src/lib/password";
import { rowLabel } from "../src/lib/utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createVenueSeats(
  venueId: string,
  rows: number,
  cols: number,
  premiumRows: number
) {
  const seats = [];
  for (let r = 1; r <= rows; r++) {
    const category = r <= premiumRows ? "PREMIUM" : "STANDARD";
    for (let c = 1; c <= cols; c++) {
      seats.push({
        venueId,
        row: r,
        col: c,
        label: `${rowLabel(r)}${c}`,
        category,
      });
    }
  }
  await prisma.seat.createMany({ data: seats });
}

async function main() {
  await prisma.waitlistOffer.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.showSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.eventPrice.deleteMany();
  await prisma.event.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@ticketbox.local",
      name: "Platform Admin",
      role: "ADMIN",
      passwordHash: await hashPassword("Admin123!"),
    },
  });
  const organiser = await prisma.user.create({
    data: {
      email: "organiser@ticketbox.local",
      name: "Aria Events",
      role: "ORGANISER",
      passwordHash: await hashPassword("Organiser123!"),
    },
  });
  const customer = await prisma.user.create({
    data: {
      email: "customer@ticketbox.local",
      name: "Alex Patron",
      role: "CUSTOMER",
      passwordHash: await hashPassword("Customer123!"),
    },
  });
  const waiter = await prisma.user.create({
    data: {
      email: "waiter@ticketbox.local",
      name: "Jordan Waitlist",
      role: "CUSTOMER",
      passwordHash: await hashPassword("Customer123!"),
    },
  });

  const hall = await prisma.venue.create({
    data: {
      name: "Aurora Hall",
      address: "12 Marine Drive, Mumbai",
      rows: 8,
      cols: 12,
      adminId: admin.id,
    },
  });
  await createVenueSeats(hall.id, 8, 12, 2);

  const movieStart = new Date();
  movieStart.setDate(movieStart.getDate() + 3);
  movieStart.setHours(19, 0, 0, 0);

  const concertStart = new Date();
  concertStart.setDate(concertStart.getDate() + 10);
  concertStart.setHours(20, 30, 0, 0);

  const movie = await prisma.event.create({
    data: {
      organiserId: organiser.id,
      venueId: hall.id,
      title: "Midnight Express",
      type: "MOVIE",
      description: "A sold-out-ready thriller screening with premium front rows.",
      startsAt: movieStart,
      prices: {
        create: [
          { category: "PREMIUM", price: 45000 },
          { category: "STANDARD", price: 25000 },
        ],
      },
    },
  });

  const concert = await prisma.event.create({
    data: {
      organiserId: organiser.id,
      venueId: hall.id,
      title: "Neon Strings Live",
      type: "CONCERT",
      description: "An evening of indie rock under Aurora Hall's vaulted ceiling.",
      startsAt: concertStart,
      prices: {
        create: [
          { category: "PREMIUM", price: 75000 },
          { category: "STANDARD", price: 40000 },
        ],
      },
    },
  });

  const seats = await prisma.seat.findMany({ where: { venueId: hall.id } });
  for (const event of [movie, concert]) {
    await prisma.showSeat.createMany({
      data: seats.map((seat) => ({
        eventId: event.id,
        seatId: seat.id,
        status: "AVAILABLE",
      })),
    });
  }

  const studio = await prisma.venue.create({
    data: {
      name: "Preview Studio",
      address: "1 Demo Lane, Pune",
      rows: 2,
      cols: 4,
      adminId: admin.id,
    },
  });
  await createVenueSeats(studio.id, 2, 4, 1);

  const soldOutStart = new Date();
  soldOutStart.setDate(soldOutStart.getDate() + 2);
  soldOutStart.setHours(18, 0, 0, 0);

  const soldOut = await prisma.event.create({
    data: {
      organiserId: organiser.id,
      venueId: studio.id,
      title: "Sold-Out Short Film",
      type: "MOVIE",
      description: "Tiny hall used to demo waitlist offers after a cancellation.",
      startsAt: soldOutStart,
      prices: {
        create: [
          { category: "PREMIUM", price: 30000 },
          { category: "STANDARD", price: 15000 },
        ],
      },
    },
  });

  const studioSeats = await prisma.seat.findMany({ where: { venueId: studio.id } });
  const booking = await prisma.booking.create({
    data: {
      reference: "TB-DEMO-SOLDOUT",
      userId: customer.id,
      eventId: soldOut.id,
      status: "CONFIRMED",
      total: studioSeats.reduce((sum, s) => sum + (s.category === "PREMIUM" ? 30000 : 15000), 0),
    },
  });
  await prisma.showSeat.createMany({
    data: studioSeats.map((seat) => ({
      eventId: soldOut.id,
      seatId: seat.id,
      status: "BOOKED",
      bookingId: booking.id,
    })),
  });
  await prisma.waitlistEntry.create({
    data: {
      userId: waiter.id,
      eventId: soldOut.id,
      category: "STANDARD",
      status: "WAITING",
    },
  });

  console.log("Seeded demo users, venues, events, a sold-out show, and a waitlist entry.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
