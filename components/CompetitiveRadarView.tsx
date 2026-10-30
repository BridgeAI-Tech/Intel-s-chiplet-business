"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Layers,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  Zap,
  TrendingUp,
  Cpu,
  Handshake,
  AlertTriangle
} from "lucide-react";

interface Props {
  initialCompetitors: any[];
  initialEvents: any[];
  initialPackagingTracker: any[];
}

export default function CompetitiveRadarView({
  initialCompetitors,
  initialEvents,
  initialPackagingTracker,
}: Props) {
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>("all");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEvents[0]?.id || "");

  const filteredEvents = initialEvents.filter((ev) => {
    if (selectedCompetitorId !== "all" && ev.competitor_id !== selectedCompetitorId) return false;
    if (selectedEventType !== "all" && !ev.event_type.toLowerCase().includes(selectedEventType.toLowerCase())) return false;
    return true;
  });

  const activeEvent = initialEvents.find((e) => e.id === selectedEventId) || initialEvents[0];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#1b3459] bg-[#0c1a32]/90">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>MODULE 2 • COMPETITIVE MOVEMENT RADAR</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Competitor Intelligence & Intel Implications
          </h2>
          <p className="text-xs text-slate-300">
            Track leading foundry, ASIC, packaging, and architecture movements affecting Intel Foundry and packaging market share.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#11233e] border border-[#1d3c68] text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-[#00C7FD]" />
            <span className="font-semibold text-slate-400">Competitor:</span>
            <select
              value={selectedCompetitorId}
              onChange={(e) => setSelectedCompetitorId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b172a]">All Competitors ({initialCompetitors.length})</option>
              {initialCompetitors.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0b172a]">
                  {c.name} ({c.category.split(" ")[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#11233e] border border-[#1d3c68] text-xs text-slate-300">
            <span className="font-semibold text-slate-400">Event Type:</span>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b172a]">All Event Types</option>
              <option value="packaging" className="bg-[#0b172a]">Packaging / Capacity</option>
              <option value="design win" className="bg-[#0b172a]">Design Wins</option>
              <option value="product" className="bg-[#0b172a]">Product Launches</option>
              <option value="ecosystem" className="bg-[#0b172a]">Ecosystem & IP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Special Arm Context Banner as required by Brief Section 6.1 */}
      <div className="p-4 rounded-xl border border-[#1e4470] bg-gradient-to-r from-[#0d223f] to-[#09182d] flex items-start space-x-3 text-xs shadow-md">
        <Handshake className="w-5 h-5 text-[#00C7FD] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-white flex items-center space-x-2">
            <span>Special Ecosystem Classification: Arm Holdings</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#0068B5]/40 text-cyan-200 border border-[#0068B5]/50">
              Intel Chiplet Alliance Partner
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Arm is classified as an <strong>IP / Architecture competitor and ecosystem collaborator</strong>, NOT a direct Intel Foundry competitor. Arm Neoverse CSS V3 is optimized for <strong>Intel 18A</strong> and UCIe interfaces, enabling third-party cloud customers to manufacture Arm silicon on Intel Foundry.
          </p>
        </div>
      </div>

      {/* Competitor Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {initialCompetitors.slice(0, 4).map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedCompetitorId(c.id === selectedCompetitorId ? "all" : c.id)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedCompetitorId === c.id
                ? "bg-[#112444] border-[#00C7FD] ring-1 ring-[#00C7FD]"
                : "bg-[#0c1a32]/80 border-[#172d4c] hover:border-[#1d3d6b]"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white">{c.name}</span>
              <span className="text-[10px] text-cyan-300 font-mono">{c.category.split("/")[0]}</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
              {c.intel_competitive_overlap}
            </p>
          </div>
        ))}
      </div>

      {/* Event Register & Event Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Event Register Table (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Competitive Event Register ({filteredEvents.length})
            </span>
            <span className="text-[11px] text-slate-500">Click to examine Intel implications</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredEvents.map((ev) => {
              const isSelected = ev.id === activeEvent?.id;
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#122547] border-[#00C7FD] ring-1 ring-[#00C7FD] shadow-lg shadow-[#0068B5]/20"
                      : "bg-[#0c1a32]/80 border-[#172d4c] hover:border-[#1d3d6b] hover:bg-[#0e1d35]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold uppercase text-[#00C7FD] text-[11px]">
                        {ev.competitor_name}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 font-medium text-[11px]">{ev.event_type}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{ev.event_date}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                    {ev.event_title}
                  </h4>

                  <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {ev.excerpt}
                  </p>

                  <div className="mt-3 pt-2 border-t border-[#162744] flex items-center justify-between text-[11px]">
                    <span className="text-cyan-300/80">Tech: {ev.packaging_tech || ev.architecture_or_node}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ev.priority === "High"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      Priority: {ev.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Event Detail & Intel Response (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-[#1b3459] bg-[#0c1a32] shadow-xl space-y-4">
            <div className="pb-3 border-b border-[#162744]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-bold text-amber-400 uppercase">
                  {activeEvent.competitor_name} Development
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeEvent.evidence_class}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                {activeEvent.event_title}
              </h3>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2">
                <span>Date: <strong className="text-slate-200">{activeEvent.event_date}</strong></span>
                <span>•</span>
                <span>Partner/Customer: <strong className="text-slate-200">{activeEvent.customer_or_partner}</strong></span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0e1d35] border border-[#172d4c]">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                  Disclosed Evidence Excerpt
                </span>
                <p className="text-slate-200 italic leading-relaxed">
                  "{activeEvent.excerpt}"
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0a1e38] border border-[#0068B5]/40 space-y-1">
                <span className="font-bold text-[#00C7FD] uppercase tracking-wider text-[10px] block">
                  Potential Intel Implication
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {activeEvent.intel_implication}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#14233c] border border-amber-500/30 space-y-1">
                <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px] block">
                  Recommended Intel Competitive Response
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {activeEvent.competitive_response}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-[#162744]">
                <span>Status: <strong className="text-slate-200">{activeEvent.commercial_stage}</strong></span>
                <a
                  href={activeEvent.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#00C7FD] hover:underline flex items-center space-x-1"
                >
                  <span>Official Source Record</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chiplet & Advanced Packaging Tracker Section */}
      <div className="p-5 rounded-xl border border-[#1b3459] bg-[#0c1a32] shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#162744] mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#00C7FD]" />
            <div>
              <h3 className="text-sm font-bold text-white">Chiplet & Advanced Packaging Ecosystem Tracker</h3>
              <p className="text-[11px] text-slate-400">
                Comparing 2.5D, 3D Hybrid Bonding, and Wafer-Level packaging across TSMC, Samsung, and Intel
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 bg-[#112444] px-2 py-0.5 rounded border border-[#1b3b68]">
            CoWoS vs EMIB vs I-Cube
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#162744] text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Technology Name</th>
                <th className="py-2.5 px-3">Architecture Type</th>
                <th className="py-2.5 px-3">Target Programme / Customer</th>
                <th className="py-2.5 px-3">Commercial Status</th>
                <th className="py-2.5 px-3 text-right">Intel Equivalent Alternative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14233c]">
              {initialPackagingTracker.map((pt) => (
                <tr key={pt.id} className="hover:bg-[#11233f]/50">
                  <td className="py-3 px-3 font-bold text-white">{pt.competitor_or_company}</td>
                  <td className="py-3 px-3 font-mono text-[#00C7FD]">{pt.technology}</td>
                  <td className="py-3 px-3 text-slate-300">{pt.packaging_type}</td>
                  <td className="py-3 px-3 text-slate-300">{pt.programme} ({pt.partner})</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#162c4c] text-cyan-200">
                      {pt.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-400">
                    {pt.intel_alternative}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
