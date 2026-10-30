import { query } from "@/lib/db";
import EvidenceLibraryView from "@/components/EvidenceLibraryView";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const evidence = await query<any>("SELECT * FROM evidence_repository ORDER BY publication_date DESC");

  return <EvidenceLibraryView initialEvidence={evidence} />;
}

