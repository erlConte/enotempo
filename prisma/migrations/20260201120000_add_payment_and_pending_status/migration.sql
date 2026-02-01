-- AlterTable Event: prezzo in centesimi (opzionale)
ALTER TABLE "Event" ADD COLUMN "priceCents" INTEGER;

-- AlterTable Reservation: stato pending_payment, codici pagamento, conferma
ALTER TABLE "Reservation" ADD COLUMN "confirmationCode" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN "paypalOrderId" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "paypalCaptureId" TEXT;
ALTER TABLE "Reservation" ALTER COLUMN "status" SET DEFAULT 'pending_payment';
ALTER TABLE "Reservation" ALTER COLUMN "guests" SET DEFAULT 1;

-- Unique index per confirmationCode (Prisma unique)
CREATE UNIQUE INDEX "Reservation_confirmationCode_key" ON "Reservation"("confirmationCode");
