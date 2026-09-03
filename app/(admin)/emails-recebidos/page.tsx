import React from "react";
import { prisma } from "@/lib/prisma";
import EmailsManagementClient from "@/modules/emails/EmailsManagementClient";

export const dynamic = "force-dynamic";

export default async function EmailsTestePage() {
  const emails = await prisma.processedEmail.findMany({
    orderBy: { processedAt: 'desc' },
    include: { ticket: { select: { ticketNumber: true } } },
    take: 50,
  });

  return <EmailsManagementClient initialEmails={emails} />;
}
