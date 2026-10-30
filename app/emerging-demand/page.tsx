import { query } from "@/lib/db";
import EmergingDemandView from "@/components/EmergingDemandView";

export const dynamic = "force-dynamic";

export default async function EmergingDemandPage() {
  const companies = await query<any>("SELECT * FROM companies ORDER BY intel_relevance_score DESC");
  const programmes = await query<any>("SELECT * FROM programmes");
  const hiringTrends = await query<any>("SELECT * FROM hiring_trends ORDER BY month ASC");
  const postings = await query<any>("SELECT * FROM hiring_postings ORDER BY posting_date DESC");
  const suppliers = await query<any>(`
    SELECT cs.*, s.name as supplier_name, s.category as supplier_category
    FROM company_suppliers cs
    JOIN suppliers s ON cs.supplier_id = s.id
  `);
  const milestones = await query<any>("SELECT * FROM technical_milestones ORDER BY event_date DESC");

  return (
    <EmergingDemandView
      initialCompanies={companies}
      initialProgrammes={programmes}
      initialHiringTrends={hiringTrends}
      initialPostings={postings}
      initialSuppliers={suppliers}
      initialMilestones={milestones}
    />
  );
}

