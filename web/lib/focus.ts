// The deep-dive companies shown in the dashboard sections and searched by Ask Intelligence.
export const FOCUS_COMPANIES = ["cmp_cerebras", "cmp_aws", "cmp_meta", "cmp_microsoft", "cmp_tesla"];
export const FOCUS_SQL = `(${FOCUS_COMPANIES.map((c) => `'${c}'`).join(", ")})`;
