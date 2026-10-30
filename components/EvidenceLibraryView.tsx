"use client";

import { useState } from "react";
import {
  BookOpen,
  Search,
  ExternalLink,
  Filter,
  CheckCircle2,
  Calendar,
  FileText,
  Building2,
  ShieldCheck
} from "lucide-react";

interface Props {
  initialEvidence: any[];
}

export default function EvidenceLibraryView({ initialEvidence }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSourceType, setSelectedSourceType] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedRecordId, setSelectedRecordId] = useState<string>(initialEvidence[0]?.id || "");

  const filteredEvidence = initialEvidence.filter((e) => {
    if (selectedSourceType !== "all" && !e.source_type.toLowerCase().includes(selectedSourceType.toLowerCase())) return false;
    if (selectedClass !== "all" && e.evidence_classification !== selectedClass) return false;
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const match =
        e.title?.toLowerCase().includes(term) ||
        e.excerpt?.toLowerCase().includes(term) ||
        e.linked_company?.toLowerCase().includes(term) ||
        e.source_name?.toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  const activeRecord = initialEvidence.find((e) => e.id === selectedRecordId) || initialEvidence[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl border border-[#1b3459] bg-[#0c1a32]/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>CENTRAL EVIDENCE & TRACEABILITY REPOSITORY</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Evidence Library</h2>
          <p className="text-xs text-slate-300">
            Every insight shown in the dashboards can be traced directly to primary disclosures, SEC filings, and audited source URLs.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-[#11233e] px-3 py-1.5 rounded-lg border border-[#1d3d6b]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Hallucinations Guarantee</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-[#172d4c] bg-[#0c182c] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords, companies, excerpts (e.g. 'CoWoS', 'Cerebras', '18A')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#102038] border border-[#1e3960] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00C7FD]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#102038] border border-[#1e3960] text-xs">
            <span className="text-slate-400">Type:</span>
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b172a]">All Sources</option>
              <option value="SEC" className="bg-[#0b172a]">SEC Filings</option>
              <option value="Press" className="bg-[#0b172a]">Press Releases</option>
              <option value="Earnings" className="bg-[#0b172a]">Earnings Calls</option>
              <option value="Blog" className="bg-[#0b172a]">Technical Blogs</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#102038] border border-[#1e3960] text-xs">
            <span className="text-slate-400">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b172a]">All Classes</option>
              <option value="Confirmed Fact" className="bg-[#0b172a]">Confirmed Fact</option>
              <option value="Corroborated Inference" className="bg-[#0b172a]">Corroborated Inference</option>
              <option value="Press-released Intent" className="bg-[#0b172a]">Press-released Intent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Split View: Records Table & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table of Evidence Records (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-1">
            <span>Matching Sources ({filteredEvidence.length})</span>
            <span>Click any record to inspect excerpt</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredEvidence.map((ev) => {
              const isSelected = ev.id === activeRecord?.id;
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedRecordId(ev.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#112444] border-[#00C7FD] ring-1 ring-[#00C7FD] shadow-lg shadow-[#0068B5]/20"
                      : "bg-[#0c1a32]/80 border-[#172d4c] hover:border-[#1d3d6b] hover:bg-[#0e1d35]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#00C7FD]" />
                      <span>{ev.linked_company}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{ev.publication_date}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 mt-1 line-clamp-1">
                    {ev.title}
                  </h4>

                  <p className="mt-1.5 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {ev.excerpt}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#162744] flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{ev.source_name} ({ev.source_type})</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#162c4c] text-emerald-300">
                      {ev.evidence_classification}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Record Inspector (5 cols) */}
        <div className="lg:col-span-5">
          <div className="p-5 rounded-xl border border-[#1b3459] bg-[#0c1a32] shadow-xl space-y-4 sticky top-24">
            <div className="pb-3 border-b border-[#162744]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] font-mono uppercase text-[#00C7FD]">
                  Record ID: {activeRecord.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeRecord.evidence_classification}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">
                {activeRecord.title}
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-[#0e1d35] border border-[#172d4c]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Linked Entity:</span>
                  <strong className="text-white">{activeRecord.linked_company}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Event Reference:</span>
                  <strong className="text-cyan-300">{activeRecord.linked_event}</strong>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block text-[10px]">Publication Date:</span>
                  <span className="text-slate-200 font-mono">{activeRecord.publication_date}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block text-[10px]">Source Type:</span>
                  <span className="text-slate-200">{activeRecord.source_type}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0a1e38] border border-[#0068B5]/40 space-y-1.5">
                <span className="font-bold text-[#00C7FD] uppercase tracking-wider text-[10px] block">
                  Original Audited Excerpt
                </span>
                <p className="text-slate-200 text-xs italic leading-relaxed">
                  "{activeRecord.excerpt}"
                </p>
              </div>

              <div className="pt-2 border-t border-[#162744] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{activeRecord.source_name}</span>
                <a
                  href={activeRecord.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded bg-[#0068B5] hover:bg-[#007cdb] text-white font-bold text-xs flex items-center space-x-1.5 transition"
                >
                  <span>Open Primary Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
