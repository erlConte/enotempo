-- AlterTable Event: add capacity and status (for limited-seat booking and overbooking protection)
ALTER TABLE "Event" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Event" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'published';

-- AlterTable Reservation: add status (confirmed | cancelled)
ALTER TABLE "Reservation" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'confirmed';
