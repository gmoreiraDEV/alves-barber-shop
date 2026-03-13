CREATE TABLE "WorkingHours" (
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("dayOfWeek")
);

INSERT INTO "WorkingHours" ("dayOfWeek", "isOpen", "startTime", "endTime")
VALUES
    (0, true, '08:00', '21:00'),
    (1, true, '08:00', '21:00'),
    (2, true, '08:00', '21:00'),
    (3, true, '08:00', '21:00'),
    (4, true, '08:00', '21:00'),
    (5, true, '08:00', '21:00'),
    (6, true, '08:00', '21:00');
