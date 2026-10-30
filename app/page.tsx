import { query } from "@/lib/db";
import ModuleOneDashboard from "@/components/ModuleOneDashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Query all Module 1 entities from SQLite database
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
    <>
      {/* 
        ========================================================================
        MODULE 1: EMERGING DEMAND RADAR (ACCOUNT / PROSPECT INTELLIGENCE)
        Now active on primary UI with full sample data and deep-dive analysis.
        ========================================================================
      */}
      <ModuleOneDashboard
        companies={companies}
        programmes={programmes}
        hiringTrends={hiringTrends}
        postings={postings}
        suppliers={suppliers}
        milestones={milestones}
      />

      {/*
        ========================================================================
        PREVIOUS MULTI-MODULE OVERVIEW DASHBOARD (COMMENTED OUT AS REQUESTED)
        ========================================================================

        <div className="space-y-8 pb-12 opacity-50 pointer-events-none hidden">
          <div className="rounded-xl border border-[#1d3557] bg-[#0c1f3d] p-6">
            <h2>Executive Intelligence Briefing (Multi-Module Overview)</h2>
          </div>
        </div>
      */}
    </>
  );
}
