import { TicketDetailView } from "@/modules/tickets/views/TicketDetailView";

export default async function ChamadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDetailView ticketId={id} />;
}
