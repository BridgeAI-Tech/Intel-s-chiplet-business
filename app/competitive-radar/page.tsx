import { query } from "@/lib/db";
import CompetitiveRadarView from "@/components/CompetitiveRadarView";

export const dynamic = "force-dynamic";

export default async function CompetitiveRadarPage() {
  const competitors = await query<any>("SELECT * FROM competitors");
  const events = await query<any>(`
    SELECT ce.*, c.name as competitor_name, c.category as competitor_category
    FROM competitive_events ce
    JOIN competitors c ON ce.competitor_id = c.id
    ORDER BY ce.event_date DESC
  `);
  const packagingTracker = await query<any>("SELECT * FROM chiplet_packaging_tracker");

  return (
    <CompetitiveRadarView
      initialCompetitors={competitors}
      initialEvents={events}
      initialPackagingTracker={packagingTracker}
    />
  );
}

