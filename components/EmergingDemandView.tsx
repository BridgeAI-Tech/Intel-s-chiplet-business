"use client";

import { useState } from "react";
import {
  Building2,
  Cpu,
  Users,
  Layers,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  Workflow,
  Sparkles
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";

interface Props {
  initialCompanies: any[];
  initialProgrammes: any[];
  initialHiringTrends: any[];
  initialPostings: any[];
  initialSuppliers: any[];
  initialMilestones: any[];
}

export default function EmergingDemandView({
  initialCompanies,
  initialProgrammes,
  initialHiringTrends,
  initialPostings,
  initialSuppliers,
  initialMilestones,
}: Props) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("cerebras");
  const [industryFilter, setIndustryFilter] = useState<string>("All");
  const [roleCategoryFilter, setRoleCategoryFilter] = useState<string>("All");

  // Filter companies
  const filteredCompanies = initialCompanies.filter((c) => {
    if (industryFilter === "All") return true;
    if (industryFilter === "Shortlisted") return c.shortlisted === 1;
    if (industryFilter === "Hyperscalers") return ["aws", "google", "meta", "microsoft"].includes(c.id);
    if (industryFilter === "AI/HPC") return ["cerebras", "tenstorrent"].includes(c.id);
    if (industryFilter === "Automotive") return c.id === "tesla";
    if (industryFilter === "Networking/Telco") return ["cisco", "nokia"].includes(c.id);
    return true;
  });

  const selectedCompany = initialCompanies.find((c) => c.id === selectedCompanyId) || initialCompanies[0];
  const companyProgrammes = initialProgrammes.filter((p) => p.company_id === selectedCompanyId);
  const companyTrends = initialHiringTrends.filter((t) => t.company_id === selectedCompanyId);
  const companyPostings = initialPostings.filter((p) => {
    if (p.company_id !== selectedCompanyId) return false;
    if (roleCategoryFilter === "All") return true;
    return p.role_category === roleCategoryFilter;
  });
  const companySuppliers = initialSuppliers.filter((s) => s.company_id === selectedCompanyId);
  const companyMilestones = initialMilestones.filter((m) => m.company_id === selectedCompanyId);

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#1b3459] bg-[#0c1a32]/90">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#00C7FD]">
            <Cpu className="w-3.5 h-3.5" />
            <span>MODULE 1 • PROSPECT & ACCOUNT INTELLIGENCE</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Emerging Demand Radar</h2>
          <p className="text-xs text-slate-300">
            Identify companies building or expanding custom-silicon capabilities and map them to Intel Foundry & Packaging solutions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#11233e] border border-[#1d3c68] text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-[#00C7FD]" />
            <span className="font-semibold text-slate-400">Industry:</span>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-[#0b172a]">All ({initialCompanies.length})</option>
              <option value="Shortlisted" className="bg-[#0b172a]">Shortlisted Only (5)</option>
              <option value="Hyperscalers" className="bg-[#0b172a]">Hyperscalers</option>
              <option value="AI/HPC" className="bg-[#0b172a]">AI / HPC Pioneers</option>
              <option value="Automotive" className="bg-[#0b172a]">Automotive (Tesla)</option>
              <option value="Networking/Telco" className="bg-[#0b172a]">Networking & Telco</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Company Master List & Deep-Dive Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Company Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Screened Companies ({filteredCompanies.length})
            </span>
            <span className="text-[11px] text-slate-500">Select to inspect profile</span>
          </div>

          <div className="space-y-2 max-h-[780px] overflow-y-auto pr-1">
            {filteredCompanies.map((c) => {
              const isSelected = c.id === selectedCompanyId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompanyId(c.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#112444] border-[#00C7FD] shadow-lg shadow-[#0068B5]/20 ring-1 ring-[#00C7FD]"
                      : "bg-[#0b172a]/80 border-[#172d4c] hover:border-[#1d3d6b] hover:bg-[#0e1d35]"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        {c.shortlisted === 1 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#0068B5]/30 text-[#00C7FD] border border-[#0068B5]/50">
                            Shortlist
                          </span>
                        )}
                        {c.id === "cerebras" && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Deep Dive
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{c.headquarters}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-[#00C7FD]">
                        {c.intel_relevance_score}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">/100</span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {c.custom_silicon_summary}
                  </p>

                  <div className="mt-3 pt-2 border-t border-[#162744] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">{c.dev_maturity.split("/")[0]}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.action_tag === "Escalate"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : c.action_tag === "Campaign"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {c.action_tag}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Dive Detail View (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Selected Company Header Card */}
          <div className="p-5 rounded-xl border border-[#1b3459] bg-[#0c1a32] shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#162744] gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-black text-white">{selectedCompany.name}</h3>
                  <a
                    href={`https://${selectedCompany.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#00C7FD] hover:underline flex items-center space-x-1"
                  >
                    <span>{selectedCompany.domain}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                  <span>HQ: <strong className="text-slate-200">{selectedCompany.headquarters}</strong></span>
                  <span>•</span>
                  <span>Employees: <strong className="text-slate-200">{selectedCompany.employee_range}</strong></span>
                  <span>•</span>
                  <span>Role: <strong className="text-cyan-300">{selectedCompany.role_in_research}</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Intel Relevance</div>
                  <div className="text-lg font-black text-[#00C7FD] font-mono">
                    {selectedCompany.intel_relevance_score} <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    selectedCompany.action_tag === "Escalate"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : selectedCompany.action_tag === "Campaign"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  }`}
                >
                  {selectedCompany.action_tag}
                </div>
              </div>
            </div>

            {/* Custom Silicon Summary & Intel Opportunity Mapping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#0e1d35] border border-[#172d4c]">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
                  Custom Silicon Capabilities & Architecture
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {selectedCompany.custom_silicon_summary}
                </p>
                <div className="mt-2 text-[11px] text-slate-400">
                  Maturity: <span className="text-[#00C7FD] font-semibold">{selectedCompany.dev_maturity}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#09213d] border border-[#0068B5]/40">
                <span className="font-bold text-[#00C7FD] uppercase tracking-wider text-[10px] block mb-1">
                  Intel Offering & Business Opportunity
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {selectedCompany.intel_relevance_summary}
                </p>
                <div className="mt-2 text-[11px] text-cyan-300">
                  Target Offering: <span className="font-semibold text-white">Intel 18A / EMIB / Foveros Direct</span>
                </div>
              </div>
            </div>
          </div>

          {/* Silicon Programmes / Chips Under Development */}
          {companyProgrammes.length > 0 && (
            <div className="p-5 rounded-xl border border-[#1b3459] bg-[#0c1a32]">
              <div className="flex items-center space-x-2 mb-3">
                <Cpu className="w-4 h-4 text-[#00C7FD]" />
                <h4 className="text-sm font-bold text-white">Active Silicon Programmes & Architectures</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {companyProgrammes.map((p) => (
                  <div key={p.id} className="p-3.5 rounded-lg bg-[#0e1d35] border border-[#172d4c] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{p.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#16335c] text-cyan-300">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{p.description}</p>
                    <div className="pt-2 border-t border-[#172d4c] grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                      <div>Node: <strong className="text-slate-200">{p.process_node}</strong></div>
                      <div>Packaging: <strong className="text-slate-200">{p.packaging_tech}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hiring Intelligence: Trends & Role Mix */}
          <div className="p-5 rounded-xl border border-[#1b3459] bg-[#0c1a32] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#162744] gap-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#00C7FD]" />
                <div>
                  <h4 className="text-sm font-bold text-white">Engineering Hiring Intelligence (Last 12 Months)</h4>
                  <p className="text-[11px] text-slate-400">Tracking capability buildout across semiconductor disciplines</p>
                </div>
              </div>

              {companyTrends.length > 0 && (
                <div className="text-xs text-slate-400 font-mono">
                  Active Talent Openings: <strong className="text-[#00C7FD]">{companyTrends[companyTrends.length - 1]?.total_count || 0}</strong>
                </div>
              )}
            </div>

            {companyTrends.length > 0 ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={companyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPackaging" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C7FD" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00C7FD" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPhysical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorArch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#162c4a" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0b172a", borderColor: "#1e3a5f", borderRadius: "8px", fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                    <Area type="monotone" dataKey="packaging_count" name="Packaging & Integration" stroke="#00C7FD" fillOpacity={1} fill="url(#colorPackaging)" />
                    <Area type="monotone" dataKey="physical_design_count" name="Physical Design" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPhysical)" />
                    <Area type="monotone" dataKey="architecture_count" name="System Architecture" stroke="#10b981" fillOpacity={1} fill="url(#colorArch)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                Hiring trend data is currently synthesized for shortlisted deep-dive companies (Cerebras, AWS, Meta).
              </p>
            )}

            {/* Filterable Job Postings Table */}
            {companyPostings.length > 0 && (
              <div className="pt-3 border-t border-[#162744]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-300">Audited Job Requisitions</span>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">Filter Role:</span>
                    <select
                      value={roleCategoryFilter}
                      onChange={(e) => setRoleCategoryFilter(e.target.value)}
                      className="bg-[#112444] border border-[#1b3b68] rounded px-2 py-1 text-slate-200 text-xs"
                    >
                      <option value="All">All Roles</option>
                      <option value="Packaging & Integration">Packaging & Integration</option>
                      <option value="Physical Design">Physical Design</option>
                      <option value="Design-for-Test">Design-for-Test</option>
                      <option value="Sourcing & Procurement">Sourcing</option>
                      <option value="Manufacturing & Bring-up">Manufacturing</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#162744] text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="py-2 px-2.5">Job Title</th>
                        <th className="py-2 px-2.5">Category</th>
                        <th className="py-2 px-2.5">Seniority</th>
                        <th className="py-2 px-2.5">Location</th>
                        <th className="py-2 px-2.5">Posted</th>
                        <th className="py-2 px-2.5 text-right">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14233c]">
                      {companyPostings.map((j) => (
                        <tr key={j.id} className="hover:bg-[#11233f]/50">
                          <td className="py-2.5 px-2.5 font-bold text-white max-w-xs truncate">
                            {j.job_title}
                          </td>
                          <td className="py-2.5 px-2.5 text-[#00C7FD]">{j.role_category}</td>
                          <td className="py-2.5 px-2.5 text-slate-300">{j.seniority}</td>
                          <td className="py-2.5 px-2.5 text-slate-400">{j.location}</td>
                          <td className="py-2.5 px-2.5 font-mono text-[10px] text-slate-400">{j.posting_date}</td>
                          <td className="py-2.5 px-2.5 text-right">
                            <a
                              href={j.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 inline-flex items-center space-x-1"
                            >
                              <span>View</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Supplier & Ecosystem Relationships */}
          <div className="p-5 rounded-xl border border-[#1b3459] bg-[#0c1a32]">
            <div className="flex items-center space-x-2 mb-3">
              <Workflow className="w-4 h-4 text-[#00C7FD]" />
              <h4 className="text-sm font-bold text-white">Reported Supplier & Ecosystem Relationships</h4>
            </div>

            {companySuppliers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#162744] text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-2 px-2.5">Supplier</th>
                      <th className="py-2 px-2.5">Relationship Type</th>
                      <th className="py-2 px-2.5">Technology / Node</th>
                      <th className="py-2 px-2.5">Commercial Stage</th>
                      <th className="py-2 px-2.5">Status</th>
                      <th className="py-2 px-2.5 text-right">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14233c]">
                    {companySuppliers.map((s, idx) => (
                      <tr key={idx} className="hover:bg-[#11233f]/50">
                        <td className="py-2.5 px-2.5 font-bold text-white">{s.supplier_name}</td>
                        <td className="py-2.5 px-2.5 text-slate-300">{s.relationship_type}</td>
                        <td className="py-2.5 px-2.5 text-[#00C7FD]">{s.technology}</td>
                        <td className="py-2.5 px-2.5 text-slate-400">{s.commercial_stage}</td>
                        <td className="py-2.5 px-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#162c4c] text-cyan-200">
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-right">
                          <a
                            href={s.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center space-x-1"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-2">
                No formal supplier relationships disclosed publicly in the current sample for this entity.
              </p>
            )}
          </div>

          {/* Technical Milestones & Supporting Evidence */}
          <div className="p-5 rounded-xl border border-[#1b3459] bg-[#0c1a32]">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-4 h-4 text-[#00C7FD]" />
              <h4 className="text-sm font-bold text-white">Audited Signals & Regulatory Disclosures</h4>
            </div>

            <div className="space-y-3">
              {companyMilestones.map((m) => (
                <div key={m.id} className="p-3.5 rounded-lg bg-[#0e1d35] border border-[#172d4c] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{m.title}</span>
                    <span className="font-mono text-[10px] text-slate-400">{m.event_date}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{m.summary}</p>
                  <div className="text-[10px] text-cyan-300 flex items-center pt-1">
                    <span className="font-semibold text-slate-400 mr-1">Intel Implication:</span>
                    {m.intel_implication}
                  </div>
                  <div className="pt-2 border-t border-[#172d4c] flex items-center justify-between text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-[#162c4c] text-emerald-300">{m.evidence_class}</span>
                    <a
                      href={m.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      <span>Audited Source</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
