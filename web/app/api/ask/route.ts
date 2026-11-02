import { GoogleGenAI } from "@google/genai";
import { retrieve } from "@/lib/retrieve";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-4-argon";

const SYSTEM = `You answer questions for an Intel market-intelligence research project on custom silicon, chiplets, semiconductor manufacturing and advanced packaging. Answers are reviewed by a client, so accuracy matters more than completeness.

Rules:
1. Use ONLY the numbered records supplied. Do not add facts from your own knowledge.
2. Cite every factual sentence with the record reference in square brackets, e.g. [S3]. Do not cite records that do not support the sentence.
3. Keep the evidence class visible: say whether a point is a confirmed fact, a press-released intent (announced plan, not proof of completion) or a corroborated inference.
4. Do not claim buying intent, supplier selection or an Intel opportunity unless a record states it. Hiring postings are vacancies, not confirmed hires.
5. If the records do not answer the question, say so plainly and state what data is missing.
6. Structure: a short direct answer, then "Key findings" as bullets, then "Implications for Intel" only if the records support any (otherwise write "Not established from the records."). Plain text with simple bullets.`;

export async function POST(request: Request) {
  const { question } = (await request.json()) as { question?: string };
  if (!question?.trim()) return Response.json({ error: "Ask a question." }, { status: 400 });
  if (!process.env.GEMINI_API_KEY) return Response.json({ error: "GEMINI_API_KEY is not configured." }, { status: 503 });

  const docs = await retrieve(question);
  if (!docs.length) {
    return Response.json({ answer: "No stored records match this question, so it cannot be answered from the dataset.", sources: [] });
  }
  const context = docs.map((d) =>
    `[${d.ref}] ${d.kind} | company: ${d.company} | date: ${d.date ?? "undated"} | evidence: ${d.evidence_class ?? "n/a"}\n${d.title}\n${d.text}`,
  ).join("\n\n");

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: `Records:\n\n${context}\n\nQuestion: ${question}`,
      config: { systemInstruction: SYSTEM, temperature: 0 },
    });
    const answer = res.text ?? "";
    // Citations may be grouped, e.g. "[S1, S2, S8]".
    const cited = new Set([...answer.matchAll(/\[([^\]]*S\d+[^\]]*)\]/g)].flatMap((m) => m[1].match(/S\d+/g) ?? []));
    return Response.json({ answer, sources: docs.filter((d) => cited.has(d.ref)) });
  } catch (e) {
    return Response.json({ error: `Model call failed: ${(e as Error).message}` }, { status: 502 });
  }
}
