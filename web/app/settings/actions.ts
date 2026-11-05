"use server";

import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import type { Config } from "@/lib/scoring";

// Saving creates a new config version and makes it active; earlier versions stay in history and can be restored.
// Only weights, the rating-scale wording, tier thresholds, stage rules, confidence thresholds and the shortlist size
// are editable here. Ratings themselves are evidence-based and are not edited in the UI.

function num(form: FormData, key: string) {
  const v = Number(form.get(key));
  if (!Number.isFinite(v)) throw new Error(`${key} is not a number`);
  return v;
}

export async function saveConfig(form: FormData) {
  const row = await queryOne<{ version: string; config_json: string }>(
    "SELECT version, config_json FROM scoring_config WHERE active = 1 ORDER BY updated_at DESC LIMIT 1");
  const cfg = JSON.parse(row!.config_json) as Config;
  let error = "";
  try {
    cfg.dimensions = cfg.dimensions.map((d) => ({ ...d, weight: num(form, `w_${d.key}`) }));
    const total = cfg.dimensions.reduce((a, d) => a + d.weight, 0);
    if (cfg.dimensions.some((d) => d.weight < 0) || Math.abs(total - 100) > 0.001) throw new Error(`Weights must be 0 or more and add up to 100 (now ${total}).`);
    cfg.tiers = cfg.tiers.map((t) => ({ ...t, min_score: t.tier === cfg.tiers.length ? 0 : num(form, `t_${t.tier}`) }));
    const mins = [...cfg.tiers].sort((a, b) => a.tier - b.tier).map((t) => t.min_score);
    if (mins.some((m, i) => m < 0 || m > 100 || (i > 0 && m >= mins[i - 1]))) throw new Error("Tier thresholds must fall from Tier 1 to Tier 4, between 0 and 100.");
    cfg.rating_scale = cfg.rating_scale.map((r) => ({ ...r, meaning: String(form.get(`r_${r.rating}`) ?? r.meaning).trim() || r.meaning }));
    cfg.stage_rules = {
      ...cfg.stage_rules,
      min_supporting_records_above_stage_3: Math.max(1, Math.round(num(form, "stage_min_records"))),
      require_confirmed_fact_above_stage_3: form.get("stage_require_confirmed") === "on",
    };
    const high = num(form, "conf_high"), medium = num(form, "conf_medium");
    if (!(high > medium && medium >= 0 && high <= 100)) throw new Error("Confidence thresholds: High must be above Medium, both between 0 and 100%.");
    cfg.evidence_confidence = { ...cfg.evidence_confidence, high_min_primary_share: high / 100, medium_min_primary_share: medium / 100 };
    const smin = Math.round(num(form, "short_min")), smax = Math.round(num(form, "short_max"));
    if (!(smin >= 1 && smax >= smin && smax <= 20)) throw new Error("Shortlist size: minimum 1 or more, maximum not below minimum.");
    cfg.shortlist = { ...cfg.shortlist, shortlist_min: smin, shortlist_max: smax };
  } catch (e) {
    error = (e as Error).message;
  }
  if (error) redirect(`/settings?error=${encodeURIComponent(error)}`);

  const versions = await query<{ version: string }>("SELECT version FROM scoring_config");
  const n = versions.filter((v) => v.version.startsWith("v1.")).length + 1;
  const version = `v1.${n}`;
  const { version: _drop, ...body } = cfg as Config & { version?: string };
  void _drop;
  await query("UPDATE scoring_config SET active = 0");
  await query("INSERT INTO scoring_config (version, config_json, active, updated_at, updated_by) VALUES (?, ?, 1, ?, ?)",
    [version, JSON.stringify({ ...body, version }), new Date().toISOString().slice(0, 19) + "Z", String(form.get("by") || "settings page")]);
  redirect(`/settings?saved=${version}`);
}

export async function activateVersion(form: FormData) {
  const version = String(form.get("version"));
  const exists = await queryOne("SELECT 1 FROM scoring_config WHERE version = ?", [version]);
  if (!exists) redirect(`/settings?error=${encodeURIComponent("Unknown version")}`);
  await query("UPDATE scoring_config SET active = CASE WHEN version = ? THEN 1 ELSE 0 END", [version]);
  await query("UPDATE scoring_config SET updated_at = ? WHERE version = ?", [new Date().toISOString().slice(0, 19) + "Z", version]);
  redirect(`/settings?saved=${version}`);
}
