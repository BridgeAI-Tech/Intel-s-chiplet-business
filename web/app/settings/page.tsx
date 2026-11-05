import Link from "next/link";
import { Panel, SectionTitle } from "@/components/dash";
import { Table, Td } from "@/components/ui";
import { activeConfig, configHistory } from "@/lib/scoring";
import { activateVersion, saveConfig } from "./actions";

const input = "w-20 rounded border border-border bg-surface px-2 py-1 text-right tabular-nums";

export default async function Settings({ searchParams }: PageProps<"/settings">) {
  const sp = await searchParams;
  const [cfg, history] = await Promise.all([activeConfig(), configHistory()]);
  const saved = typeof sp.saved === "string" ? sp.saved : null;
  const error = typeof sp.error === "string" ? sp.error : null;
  return (
    <>
      <div className="mb-3 text-xs"><Link href="/?tab=assessment" className="text-accent">← Scoring & shortlist</Link></div>
      <SectionTitle title="Scoring settings" scope={`Active: ${cfg.version}`}>
        The scoring calculation, rating scale and qualification thresholds from the research framework (Version 1). Saving
        creates a new version and re-scores every company straight away — the evidence-based ratings stay the same, only
        the weights and thresholds applied to them change. Earlier versions can be restored below.
      </SectionTitle>
      {saved && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Saved — version {saved} is now active and all scores use it.</div>}
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Not saved: {error}</div>}

      <form action={saveConfig} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Dimension weights (%)" note="Must add up to 100. Overall score = Σ (rating ÷ 5 × weight).">
            <div className="space-y-2">
              {cfg.dimensions.map((d) => (
                <label key={d.key} className="flex items-center justify-between gap-3 text-sm">
                  <span>{d.label}<span className="block text-xs text-muted">{d.evaluate}</span></span>
                  <input name={`w_${d.key}`} type="number" step="0.5" min="0" max="100" defaultValue={d.weight} className={input} />
                </label>
              ))}
            </div>
          </Panel>
          <div className="space-y-4">
            <Panel title="Score tiers" note="Minimum score for each tier; Tier 4 is everything below Tier 3.">
              <div className="space-y-2">
                {cfg.tiers.map((t) => (
                  <label key={t.tier} className="flex items-center justify-between gap-3 text-sm">
                    <span>Tier {t.tier} — {t.label}</span>
                    {t.tier === cfg.tiers.length ? <span className="text-xs text-muted">below Tier {t.tier - 1}</span>
                      : <input name={`t_${t.tier}`} type="number" min="0" max="100" defaultValue={t.min_score} className={input} />}
                  </label>
                ))}
              </div>
            </Panel>
            <Panel title="Prospect shortlist size">
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">Minimum <input name="short_min" type="number" min="1" defaultValue={cfg.shortlist.shortlist_min} className={input} /></label>
                <label className="flex items-center gap-2">Maximum <input name="short_max" type="number" min="1" defaultValue={cfg.shortlist.shortlist_max} className={input} /></label>
              </div>
            </Panel>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Rating scale (1–5)" note="Wording shown with each rating.">
            <div className="space-y-2">
              {cfg.rating_scale.map((r) => (
                <label key={r.rating} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0"><b>{r.rating}</b> {r.label}</span>
                  <input name={`r_${r.rating}`} defaultValue={r.meaning} className="flex-1 rounded border border-border bg-surface px-2 py-1" />
                </label>
              ))}
            </div>
          </Panel>
          <Panel title="Evidence rules" note="Applied by the assessment run; changes take effect on the next run.">
            <div className="space-y-3 text-sm">
              <label className="flex items-center justify-between gap-3">
                <span>Stage 4–5: minimum supporting records</span>
                <input name="stage_min_records" type="number" min="1" defaultValue={cfg.stage_rules.min_supporting_records_above_stage_3} className={input} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Stage 4–5: require at least one confirmed fact</span>
                <input name="stage_require_confirmed" type="checkbox" defaultChecked={cfg.stage_rules.require_confirmed_fact_above_stage_3} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>High confidence: primary-source share at least (%)</span>
                <input name="conf_high" type="number" min="0" max="100" defaultValue={Math.round(cfg.evidence_confidence.high_min_primary_share * 100)} className={input} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Medium confidence: primary-source share at least (%)</span>
                <input name="conf_medium" type="number" min="0" max="100" defaultValue={Math.round(cfg.evidence_confidence.medium_min_primary_share * 100)} className={input} />
              </label>
            </div>
          </Panel>
        </div>

        <div className="flex items-center gap-3">
          <input name="by" placeholder="Your name (for the change log)" className="w-64 rounded border border-border bg-surface px-2 py-1.5 text-sm" />
          <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">Save as new version</button>
        </div>
      </form>

      <div className="mt-6">
        <Panel title="Version history">
          <Table head={["Version", "Saved", "By", ""]}>
            {history.map((h) => (
              <tr key={h.version}>
                <Td className="font-medium">{h.version}{h.active ? <span className="ml-2 text-xs text-emerald-700">active</span> : null}</Td>
                <Td>{h.updated_at.replace("T", " ").replace("Z", "")}</Td>
                <Td>{h.updated_by ?? "—"}</Td>
                <Td>{!h.active && (
                  <form action={activateVersion}><input type="hidden" name="version" value={h.version} />
                    <button className="text-xs text-accent hover:underline">Restore this version</button></form>)}</Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
