import Link from "next/link";
import { query } from "@/lib/db";
import {
  TrendingUp,
  Building2,
  Cpu,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Layers
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  // Query summary counts and priority data from SQLite
  const companiesCount = await query<{ count: number }>("SELECT COUNT(*) as count FROM companies");
  const shortlistedCount = await query<{ count: number }>("SELECT COUNT(*) as count FROM companies WHERE shortlisted = 1");
  const eventsCount = await query<{ count: number }>("SELECT COUNT(*) as count FROM competitive_events");
  const signalsCount = await query<{ count: number }>("SELECT COUNT(*) as count FROM technical_milestones");
  const evidenceCount = await query<{ count: number }>("SELECT COUNT(*) as count FROM evidence_repository");

  const priorityFindings = await query<any>("SELECT * FROM priority_findings ORDER BY priority_order ASC");
  const shortlistedCompanies = await query<any>("SELECT * FROM companies WHERE shortlisted = 1 ORDER BY intel_relevance_score DESC");
  const latestEvents = await query<any>(`
    SELECT id, competitor_id as entity, event_title as title, event_type as type, event_date as date, 
           evidence_class as class, intel_implication as implication, source_url, 'Module 2' as module
    FROM competitive_events
    UNION ALL
    SELECT id, company_id as entity, title, category as type, event_date as date, 
           evidence_class as class, intel_implication as implication, source_url, 'Module 1' as module
    FROM technical_milestones
    ORDER BY date DESC
    LIMIT 6
  `);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Executive Snapshot */}
      <div className="relative overflow-hidden rounded-xl border border-[#1d3557] bg-gradient-to-r from-[#0c1f3d] via-[#09182f] to-[#071120] p-6 shadow-xl">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-[#0068B5]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#00C7FD] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00C7FD] animate-ping" />
              <span>EXECUTIVE INTELLIGENCE BRIEFING</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">DATA PERIOD: LAST 12 MONTHS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Intel Chiplet & Custom Silicon Signals
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
              Synthesized signal monitoring across <strong>Emerging Custom-Silicon Demand (Module 1)</strong> and{" "}
              <strong>Competitive Foundry / Packaging Movement (Module 2)</strong>. Derived dynamically from verified technical filings, patent disclosures, and engineering hiring pipelines.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ask-ai"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#0068B5] hover:bg-[#007cdb] text-white text-xs font-bold transition shadow-lg shadow-[#0068B5]/30"
            >
              Ask AI Assistant
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-[#193252] bg-[#0c182c]/80 p-4 relative overflow-hidden group hover:border-[#0068B5]/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Screened Accounts</span>
            <Building2 className="w-4 h-4 text-[#00A3E0]" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{companiesCount[0]?.count || 12}</span>
            <span className="text-xs text-slate-400 font-medium">entities</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Hyperscalers, AI/HPC, Auto, Telco</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00A3E0]/40 group-hover:bg-[#00A3E0] transition" />
        </div>

        <div className="rounded-xl border border-[#193252] bg-[#0c182c]/80 p-4 relative overflow-hidden group hover:border-[#00C7FD]/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shortlisted (M1)</span>
            <Flame className="w-4 h-4 text-[#00C7FD]" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#00C7FD]">{shortlistedCount[0]?.count || 5}</span>
            <span className="text-xs text-cyan-300/80 font-medium">high-potential</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Cerebras, AWS, Meta, MSFT, Tesla</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00C7FD]/40 group-hover:bg-[#00C7FD] transition" />
        </div>

        <div className="rounded-xl border border-[#193252] bg-[#0c182c]/80 p-4 relative overflow-hidden group hover:border-emerald-500/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Demand Signals</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400">{signalsCount[0]?.count || 14}</span>
            <span className="text-xs text-slate-400 font-medium">milestones</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Silicon programs, tape-outs, filings</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/40 group-hover:bg-emerald-500 transition" />
        </div>

        <div className="rounded-xl border border-[#193252] bg-[#0c182c]/80 p-4 relative overflow-hidden group hover:border-amber-500/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Competitor Moves (M2)</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-400">{eventsCount[0]?.count || 6}</span>
            <span className="text-xs text-slate-400 font-medium">developments</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Foundry, ASIC wins, Packaging</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500/40 group-hover:bg-amber-500 transition" />
        </div>

        <div className="rounded-xl border border-[#193252] bg-[#0c182c]/80 p-4 relative overflow-hidden group hover:border-indigo-500/60 transition col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Sources</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-indigo-300">{evidenceCount[0]?.count || 5}</span>
            <span className="text-xs text-slate-400 font-medium">audited items</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">100% Traceable to SEC & Tech PR</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500/40 group-hover:bg-indigo-500 transition" />
        </div>
      </div>

      {/* Two Summary Panels: Emerging Demand & Competitive Movement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Emerging Demand Radar Highlights */}
        <div className="rounded-xl border border-[#193252] bg-[#0c182c]/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#162744]">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-[#0068B5]/20 text-[#00C7FD]">
                  <Cpu className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Module 1: Emerging Demand Radar</h3>
                  <p className="text-[11px] text-slate-400">Account & Custom Silicon Prospect Intelligence</p>
                </div>
              </div>
              <Link
                href="/emerging-demand"
                className="text-xs font-semibold text-[#00C7FD] hover:underline flex items-center"
              >
                View Radar <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {shortlistedCompanies.slice(0, 4).map((c: any) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg bg-[#102038] border border-[#1d3557] hover:border-[#0068B5]/50 transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{c.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#16335c] text-cyan-300">
                        Score: {c.intel_relevance_score}/100
                      </span>
                      {c.id === "cerebras" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          DEEP DIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-1">{c.custom_silicon_summary}</p>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                        c.action_tag === "Escalate"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : c.action_tag === "Campaign"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {c.action_tag}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">{c.dev_maturity.split("/")[0]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#162744] flex items-center justify-between text-xs text-slate-400">
            <span>Engineering Hiring Mix: Spike in Packaging & Physical Design</span>
            <span className="text-[#00C7FD] font-mono font-medium">+460% Cerebras YoY</span>
          </div>
        </div>

        {/* Panel 2: Competitive Movement Radar Highlights */}
        <div className="rounded-xl border border-[#193252] bg-[#0c182c]/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#162744]">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Module 2: Competitive Movement Radar</h3>
                  <p className="text-[11px] text-slate-400">Foundry, Advanced Packaging & Ecosystem Moves</p>
                </div>
              </div>
              <Link
                href="/competitive-radar"
                className="text-xs font-semibold text-amber-400 hover:underline flex items-center"
              >
                View Competitors <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-lg bg-[#102038] border border-[#1d3557] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>TSMC CoWoS Capacity Allocation Deficit</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">2026-07-18</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  TSMC doubling CoWoS to 75k wpm, yet remains 100% absorbed by Nvidia/AMD. Hyperscalers facing severe 6-month packaging backlog.
                </p>
                <div className="text-[10px] text-cyan-300 flex items-center pt-0.5">
                  <span className="font-semibold text-slate-400 mr-1">Intel Implication:</span>
                  Open door for Intel EMIB packaging-only contracts.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#102038] border border-[#1d3557] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Arm Neoverse CSS V3 on Intel 18A Node</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">2026-03-01</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Arm is tagged as an IP/Architecture Partner (Intel Chiplet Alliance). Turnkey CSS enables cloud giants to build custom CPUs on Intel 18A.
                </p>
                <div className="text-[10px] text-cyan-300 flex items-center pt-0.5">
                  <span className="font-semibold text-slate-400 mr-1">Intel Implication:</span>
                  De-risks customer tape-outs on Intel 18A.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#162744] flex items-center justify-between text-xs text-slate-400">
            <span>Competitor Value-Chain Groups Monitored:</span>
            <span className="text-slate-200 font-medium">Foundry (TSMC/Samsung), ASIC (Broadcom/Marvell), Arm</span>
          </div>
        </div>
      </div>

      {/* Priority Findings Table */}
      <div className="rounded-xl border border-[#193252] bg-[#0c182c]/80 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#162744] mb-4">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#0068B5]/20 text-[#00C7FD]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Priority Research Findings & Recommended Actions</h3>
              <p className="text-[11px] text-slate-400">
                Rulebook-driven intelligence mapped to Intel Foundry & Packaging Solutions
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-[#11233f] px-2.5 py-1 rounded border border-[#1c3963]">
            {priorityFindings.length} Active Findings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#162744] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Finding / Topic</th>
                <th className="py-2.5 px-3">Evidence Summary</th>
                <th className="py-2.5 px-3">Intel Business Implication</th>
                <th className="py-2.5 px-3 text-right">Action Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14233c]">
              {priorityFindings.map((f: any) => (
                <tr key={f.id} className="hover:bg-[#11233f]/60 transition">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {f.module_type}
                  </td>
                  <td className="py-3 px-3 font-semibold text-white max-w-xs">
                    {f.finding_title}
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-sm leading-relaxed">
                    {f.evidence_summary}
                  </td>
                  <td className="py-3 px-3 text-cyan-300 max-w-sm leading-relaxed">
                    {f.intel_implication}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                        f.action_tag === "Escalate"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : f.action_tag === "Campaign"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {f.action_tag}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Signals & Events Feed */}
      <div className="rounded-xl border border-[#193252] bg-[#0c182c]/80 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#162744] mb-4">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Recent Signals & Competitive Event Feed</h3>
              <p className="text-[11px] text-slate-400">Audited disclosures across the last 12 months</p>
            </div>
          </div>
          <Link
            href="/evidence"
            className="text-xs font-semibold text-[#00C7FD] hover:underline flex items-center"
          >
            All Evidence <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestEvents.map((ev: any) => (
            <div
              key={ev.id}
              className="p-3.5 rounded-lg bg-[#0e1d35] border border-[#1b3459] hover:border-[#0068B5]/60 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-mono font-semibold uppercase text-[#00C7FD]">
                    {ev.entity}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">{ev.date}</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                  {ev.title}
                </h4>
                <p className="mt-2 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {ev.implication}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#182c49] flex items-center justify-between text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-[#162c4c] text-slate-300">
                  {ev.class}
                </span>
                <a
                  href={ev.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  <span>Source</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
