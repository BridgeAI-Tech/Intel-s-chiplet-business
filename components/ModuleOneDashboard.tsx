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
  Sparkles,
  TrendingUp,
  Target,
  ShieldCheck,
  Search,
  ArrowUpRight,
  Clock,
  Flame,
  Check,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

interface Props {
  companies: any[];
  programmes: any[];
  hiringTrends: any[];
  postings: any[];
  suppliers: any[];
  milestones: any[];
}

export default function ModuleOneDashboard({
  companies,
  programmes,
  hiringTrends,
  postings,
  suppliers,
  milestones,
}: Props) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("cerebras");
  const [activeTab, setActiveTab] = useState<"profile" | "hiring" | "milestones" | "suppliers" | "assessment">("profile");
  const [industryFilter, setIndustryFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filtering companies based on industry filter & search query
  const filteredCompanies = companies.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q) || c.custom_silicon_summary.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (industryFilter === "All") return true;
    if (industryFilter === "Shortlist") return c.shortlisted === 1;
    if (industryFilter === "DeepDive") return c.id === "cerebras";
    if (industryFilter === "Hyperscaler") return ["aws", "google", "meta", "microsoft"].includes(c.id);
    if (industryFilter === "AI/HPC") return ["cerebras", "tenstorrent"].includes(c.id);
    if (industryFilter === "Automotive") return c.id === "tesla";
    if (industryFilter === "Networking/Telco") return ["cisco", "nokia"].includes(c.id);
    return true;
  });

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const companyProgrammes = programmes.filter((p) => p.company_id === selectedCompanyId);
  const companyTrends = hiringTrends.filter((t) => t.company_id === selectedCompanyId);
  const companyPostings = postings.filter((p) => {
    if (p.company_id !== selectedCompanyId) return false;
    if (roleFilter === "All") return true;
    return p.role_category === roleFilter;
  });
  const companySuppliers = suppliers.filter((s) => s.company_id === selectedCompanyId);
  const companyMilestones = milestones.filter((m) => m.company_id === selectedCompanyId);

  // Cerebras packaging hiring stats
  const isCerebras = selectedCompany.id === "cerebras";

  return (
    <div className="space-y-6 pb-12">
      {/* Module 1 Dedicated Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1b3b68] bg-gradient-to-r from-[#081a38] via-[#07152b] to-[#040c1a] p-6 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-[#0068B5]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#00C7FD] mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00C7FD] animate-pulse" />
              <span>MODULE 1 • EMERGING DEMAND RADAR</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">ACCOUNT & PROSPECT INTELLIGENCE</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-mono">100% Traceable Evidence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Custom Silicon & Chiplet Demand Radar
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Evaluating companies building in-house silicon, ASIC architectures, and advanced packaging to identify high-probability commercial opportunities for <strong>Intel Foundry (IFS 18A/3)</strong> and <strong>Intel Advanced Packaging (EMIB/Foveros)</strong>.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-[#0c1e38] border border-[#1d3d6b] text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Screened</div>
              <div className="text-lg font-black text-white font-mono">{companies.length} <span className="text-xs text-slate-400">Accounts</span></div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#0c1e38] border border-[#00C7FD]/40 text-right">
              <div className="text-[10px] uppercase font-bold text-[#00C7FD]">Shortlisted</div>
              <div className="text-lg font-black text-[#00C7FD] font-mono">5 <span className="text-xs text-cyan-300/80">Targets</span></div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#0c1e38] border border-amber-500/40 text-right">
              <div className="text-[10px] uppercase font-bold text-amber-300">Deep Dive</div>
              <div className="text-lg font-black text-amber-300 font-mono">Cerebras</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controller Bar */}
      <div className="p-4 rounded-xl border border-[#172d4c] bg-[#0c182c] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-md">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search account by name, domain, architecture (e.g. 'Cerebras', 'Trainium', 'Dojo')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#102038] border border-[#1e3960] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00C7FD]"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: "All", label: "All Screened (12)" },
            { id: "Shortlist", label: "Shortlisted (5)" },
            { id: "DeepDive", label: "Deep Dive: Cerebras" },
            { id: "Hyperscaler", label: "Hyperscalers" },
            { id: "AI/HPC", label: "AI / HPC" },
            { id: "Automotive", label: "Automotive" },
            { id: "Networking/Telco", label: "Networking" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setIndustryFilter(btn.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                industryFilter === btn.id
                  ? "bg-[#0068B5] text-white shadow-md shadow-[#0068B5]/30 border border-[#00C7FD]"
                  : "bg-[#102038] text-slate-300 hover:text-white hover:bg-[#142845] border border-[#172d4c]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Screened Companies List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#00C7FD]" />
              <span>Target Companies ({filteredCompanies.length})</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Ranked by Intel Fit</span>
          </div>

          <div className="space-y-2.5 max-h-[820px] overflow-y-auto pr-1">
            {filteredCompanies.map((c) => {
              const isSelected = c.id === selectedCompanyId;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCompanyId(c.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#112444] border-[#00C7FD] shadow-xl shadow-[#0068B5]/25 ring-1 ring-[#00C7FD]"
                      : "bg-[#0b172a]/80 border-[#172d4c] hover:border-[#1d3d6b] hover:bg-[#0e1d35]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        {c.id === "cerebras" && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            DEEP DIVE
                          </span>
                        )}
                        {c.shortlisted === 1 && c.id !== "cerebras" && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0068B5]/30 text-[#00C7FD] border border-[#0068B5]/50">
                            Shortlist
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{c.domain} • {c.headquarters.split(",")[0]}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black font-mono text-[#00C7FD]">
                        {c.intel_relevance_score}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono uppercase">Fit Score</div>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {c.custom_silicon_summary}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#162744] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 text-[10px] font-mono">{c.dev_maturity.split("/")[0]}</span>
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Account Deep-Dive Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Account Header Hero Card */}
          <div className="p-5 rounded-xl border border-[#1b3459] bg-[#0c1a32] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#162744] gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-black text-white">{selectedCompany.name}</h2>
                  <a
                    href={`https://${selectedCompany.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#00C7FD] hover:underline flex items-center space-x-1"
                  >
                    <span>{selectedCompany.domain}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  {isCerebras && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Module 1 Primary Deep-Dive Account
                    </span>
                  )}
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
                  <div className="text-[10px] uppercase font-bold text-slate-400">Intel Opportunity Score</div>
                  <div className="text-xl font-black text-[#00C7FD] font-mono">
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

            {/* Sub-Navigation Tabs for Deep-Dive */}
            <div className="flex space-x-1 border-b border-[#162744] pb-1 overflow-x-auto text-xs">
              {[
                { id: "profile", label: "1. Silicon & Technographics", icon: Cpu },
                { id: "hiring", label: "2. Hiring Intelligence (12M)", icon: Users },
                { id: "milestones", label: "3. Disclosures & SEC Signals", icon: FileText },
                { id: "suppliers", label: "4. Supplier Ecosystem", icon: Workflow },
                { id: "assessment", label: "5. Intel Assessment & Action", icon: Target },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-[#11233f] text-[#00C7FD] border-b-2 border-[#00C7FD]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#0e1c33]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: SILICON & TECHNOGRAPHICS */}
            {activeTab === "profile" && (
              <div className="space-y-4 pt-1">
                {/* Firmographic & Architectural Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#0e1d35] border border-[#172d4c] space-y-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                      Custom Silicon Architecture & Technical Scope
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {selectedCompany.custom_silicon_summary}
                    </p>
                    <div className="pt-2 border-t border-[#172d4c] flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Development Maturity:</span>
                      <strong className="text-[#00C7FD] font-mono">{selectedCompany.dev_maturity}</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0a1e38] border border-[#0068B5]/40 space-y-2">
                    <span className="font-bold text-[#00C7FD] uppercase tracking-wider text-[10px] block">
                      Primary Intel Foundry & Packaging Angle
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {selectedCompany.intel_relevance_summary}
                    </p>
                    <div className="pt-2 border-t border-[#0068B5]/30 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Recommended Next Move:</span>
                      <span className="font-bold text-white px-2 py-0.5 rounded bg-[#0068B5] text-[10px]">
                        {selectedCompany.action_tag}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Silicon Programmes / Chips under development */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#00C7FD]" />
                    <span>Active Silicon Programmes ({companyProgrammes.length})</span>
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {companyProgrammes.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl bg-[#0e1d35] border border-[#172d4c] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{p.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#16335c] text-cyan-300">
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{p.description}</p>
                        <div className="pt-2 border-t border-[#172d4c] grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                          <div>Process Node: <strong className="text-slate-200">{p.process_node}</strong></div>
                          <div>Packaging: <strong className="text-[#00C7FD]">{p.packaging_tech}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deep-Dive Spotlight for Cerebras */}
                {isCerebras && (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-amber-300 font-bold">
                      <Flame className="w-4 h-4" />
                      <span>Cerebras Deep-Dive Insight: The Wafer-Scale Packaging Paradox</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Cerebras's WSE-3 is a monolithic 21.5cm x 21.5cm wafer etched on TSMC 5nm. Because it is a single monolithic wafer, 
                      yield defect isolation and thermal dissipation (23kW power delivery) are pushing physical boundaries. 
                      Their upcoming Form S-1 SEC filing confirms that <strong>100% of their wafer fabrication and packaging is sole-sourced to TSMC</strong>. 
                      Intel's **EMIB (Embedded Multi-Die Interconnect Bridge)** and **Foveros Direct 3D** offer Cerebras a path to modular multi-die scaling, lowering defect costs while diversifying away from geopolitical single-source risk.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HIRING INTELLIGENCE */}
            {activeTab === "hiring" && (
              <div className="space-y-4 pt-1">
                {/* 12M Hiring Chart */}
                <div className="p-4 rounded-xl bg-[#0e1d35] border border-[#172d4c] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-[#00C7FD]" />
                        <span>12-Month Semiconductor Talent Acquisition Trend</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Synthesized over the last 12 months (Architecture vs. Physical Design vs. Packaging)
                      </p>
                    </div>

                    {isCerebras && (
                      <div className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                        Packaging Roles: +460% YoY
                      </div>
                    )}
                  </div>

                  {companyTrends.length > 0 ? (
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={companyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPackagingM1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00C7FD" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#00C7FD" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorPhysicalM1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorArchM1" x1="0" y1="0" x2="0" y2="1">
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
                          <Area type="monotone" dataKey="packaging_count" name="Packaging & Integration" stroke="#00C7FD" fillOpacity={1} fill="url(#colorPackagingM1)" />
                          <Area type="monotone" dataKey="physical_design_count" name="Physical Design" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPhysicalM1)" />
                          <Area type="monotone" dataKey="architecture_count" name="Architecture & System" stroke="#10b981" fillOpacity={1} fill="url(#colorArchM1)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-6 text-center">
                      Detailed hiring time-series data is tracked for shortlisted deep-dive entities.
                    </p>
                  )}
                </div>

                {/* Audited Requisitions Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#00C7FD]" />
                      <span>Audited Open Requisitions ({companyPostings.length})</span>
                    </span>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-slate-400">Filter Discipline:</span>
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-[#112444] border border-[#1b3b68] rounded px-2 py-1 text-slate-200 text-xs"
                      >
                        <option value="All">All Disciplines</option>
                        <option value="Packaging & Integration">Packaging & Integration</option>
                        <option value="Physical Design">Physical Design</option>
                        <option value="Design-for-Test">Design-for-Test</option>
                        <option value="Sourcing & Procurement">Sourcing & Procurement</option>
                        <option value="Manufacturing & Bring-up">Manufacturing</option>
                      </select>
                    </div>
                  </div>

                  {companyPostings.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-[#172d4c]">
                      <table className="w-full text-left text-xs bg-[#0c182c]">
                        <thead>
                          <tr className="border-b border-[#162744] text-slate-400 font-semibold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Job Title</th>
                            <th className="py-2.5 px-3">Role Discipline</th>
                            <th className="py-2.5 px-3">Seniority</th>
                            <th className="py-2.5 px-3">Location</th>
                            <th className="py-2.5 px-3">Posted</th>
                            <th className="py-2.5 px-3 text-right">Source Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#14233c]">
                          {companyPostings.map((j) => (
                            <tr key={j.id} className="hover:bg-[#11233f]/50">
                              <td className="py-3 px-3 font-bold text-white max-w-xs truncate">
                                {j.job_title}
                              </td>
                              <td className="py-3 px-3 text-[#00C7FD]">{j.role_category}</td>
                              <td className="py-3 px-3 text-slate-300">{j.seniority}</td>
                              <td className="py-3 px-3 text-slate-400">{j.location}</td>
                              <td className="py-3 px-3 font-mono text-[10px] text-slate-400">{j.posting_date}</td>
                              <td className="py-3 px-3 text-right">
                                <a
                                  href={j.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center space-x-1 font-semibold"
                                >
                                  <span>View Requisition</span>
                                  <ArrowUpRight className="w-3 h-3 ml-0.5" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      No open requisitions matching this filter for the selected company.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DISCLOSURES & SEC SIGNALS */}
            {activeTab === "milestones" && (
              <div className="space-y-3 pt-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#00C7FD]" />
                  <span>Audited Milestones & Filings ({companyMilestones.length})</span>
                </span>

                {companyMilestones.length > 0 ? (
                  <div className="space-y-3">
                    {companyMilestones.map((m) => (
                      <div key={m.id} className="p-4 rounded-xl bg-[#0e1d35] border border-[#172d4c] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{m.title}</span>
                          <span className="font-mono text-[10px] text-slate-400">{m.event_date}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{m.summary}</p>
                        <div className="p-2.5 rounded-lg bg-[#09172c] border border-[#1b3459] text-[11px] text-cyan-300">
                          <strong className="text-slate-400 block text-[10px] uppercase">Intel Implication:</strong>
                          {m.intel_implication}
                        </div>
                        <div className="pt-2 border-t border-[#172d4c] flex items-center justify-between text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-[#162c4c] text-emerald-300 font-semibold">{m.evidence_class}</span>
                          <a
                            href={m.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold"
                          >
                            <span>Open Official Record</span>
                            <ArrowUpRight className="w-3 h-3 ml-0.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No milestone records extracted for this company in the sample dataset.
                  </p>
                )}
              </div>
            )}

            {/* TAB 4: SUPPLIER ECOSYSTEM */}
            {activeTab === "suppliers" && (
              <div className="space-y-3 pt-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Workflow className="w-3.5 h-3.5 text-[#00C7FD]" />
                  <span>Reported Foundry, Packaging & EDA Ecosystem</span>
                </span>

                {companySuppliers.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-[#172d4c]">
                    <table className="w-full text-left text-xs bg-[#0c182c]">
                      <thead>
                        <tr className="border-b border-[#162744] text-slate-400 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Supplier Partner</th>
                          <th className="py-2.5 px-3">Relationship Type</th>
                          <th className="py-2.5 px-3">Node / Technology</th>
                          <th className="py-2.5 px-3">Commercial Stage</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#14233c]">
                        {companySuppliers.map((s, idx) => (
                          <tr key={idx} className="hover:bg-[#11233f]/50">
                            <td className="py-3 px-3 font-bold text-white">{s.supplier_name}</td>
                            <td className="py-3 px-3 text-slate-300">{s.relationship_type}</td>
                            <td className="py-3 px-3 text-[#00C7FD]">{s.technology}</td>
                            <td className="py-3 px-3 text-slate-400">{s.commercial_stage}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-[#162c4c] text-cyan-200">
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <a
                                href={s.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 inline-flex items-center space-x-1 font-semibold"
                              >
                                <span>Verify</span>
                                <ArrowUpRight className="w-3 h-3 ml-0.5" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Formal supplier relationships are unconfirmed or confidential for this account.
                  </p>
                )}
              </div>
            )}

            {/* TAB 5: INTEL RESEARCH ASSESSMENT & ACTION */}
            {activeTab === "assessment" && (
              <div className="space-y-4 pt-1 text-xs">
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#0d2242] to-[#08182f] border border-[#0068B5]/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center space-x-2">
                      <Target className="w-4 h-4 text-[#00C7FD]" />
                      <span>Commercial Qualification & Action Playbook</span>
                    </span>
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        selectedCompany.action_tag === "Escalate"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : selectedCompany.action_tag === "Campaign"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      }`}
                    >
                      Action Tag: {selectedCompany.action_tag}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-[#081528] border border-[#142948]">
                      <span className="text-slate-400 text-[10px] block">Development Maturity:</span>
                      <strong className="text-white text-xs mt-1 block">{selectedCompany.dev_maturity}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#081528] border border-[#142948]">
                      <span className="text-slate-400 text-[10px] block">Potential External Need:</span>
                      <strong className="text-cyan-300 text-xs mt-1 block">Advanced Packaging & Second-Source Fab</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#081528] border border-[#142948]">
                      <span className="text-slate-400 text-[10px] block">Target Intel Solution:</span>
                      <strong className="text-emerald-400 text-xs mt-1 block">EMIB / Foveros / Intel 18A</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#071322] border border-[#12243d] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Research Assessment Justification:</span>
                    <p className="text-slate-200 leading-relaxed">
                      {selectedCompany.intel_relevance_summary}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e1d35] border border-[#172d4c] space-y-2">
                  <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Evidence-Led Governance Rules Applied</span>
                  </span>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px] leading-relaxed">
                    <li>Indirect hiring and technical disclosures are treated as engineering maturity indicators—not confirmed purchase intent.</li>
                    <li>Company is evaluated on reported technical requirements rather than forced into unmatched Intel catalogue parts.</li>
                    <li>All supplier references cite publicly filed disclosures (SEC Form S-1, official technical blogs, or press statements).</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
