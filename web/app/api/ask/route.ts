import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { retrieve, type Doc } from "@/lib/retrieve";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-4-argon";
// Low thinking keeps the flagship model's grounding while roughly halving time to first word for chat.
const THINKING = (process.env.GEMINI_CHAT_THINKING?.toUpperCase() ?? "LOW") as ThinkingLevel;

const SYSTEM = `You answer questions for an Intel market-intelligence research project on custom silicon, chiplets, semiconductor manufacturing and advanced packaging. Answers are reviewed by a client, so accuracy matters more than completeness.

Rules:
1. Use ONLY the numbered records supplied. Do not add facts from your own knowledge.
2. Cite every factual sentence with the record reference in square brackets at the end of the sentence, e.g. [S3] or [S1, S4]. Cite at most 3 records per sentence, choosing the strongest. Do not cite records that do not support the sentence.
3. Keep the evidence class visible: say whether a point is a confirmed fact, a press-released intent (announced plan, not proof of completion) or a corroborated inference.
4. Do not claim buying intent, supplier selection or an Intel opportunity unless a record states it. Hiring postings are vacancies, not confirmed hires.
5. If the records do not answer the question, say so plainly and state what data is missing.
6. Format in Markdown and keep the whole answer under 220 words:
   - a direct answer of 1–3 sentences;
   - "**Key findings**" followed by at most 6 "- " bullets, one or two sentences each, starting with a **bold label**;
   - "**Implications for Intel**" followed by one short paragraph, or "Not established from the records." when no record supports one.
   Do not use headings (#), tables or nested bullets.`;

const cited = (answer: string) =>
  new Set([...answer.matchAll(/\[([^\]]*S\d+[^\]]*)\]/g)].flatMap((m) => m[1].match(/S\d+/g) ?? []));

export async function POST(request: Request) {
  const { question, company, stream } = (await request.json()) as { question?: string; company?: string; stream?: boolean };
  if (!question?.trim()) return Response.json({ error: "Ask a question." }, { status: 400 });
  if (!process.env.GEMINI_API_KEY) return Response.json({ error: "GEMINI_API_KEY is not configured." }, { status: 503 });

  // A question asked while a company is selected on the dashboard is retrieved for that company.
  const focus = company && !question.toLowerCase().includes(company.toLowerCase()) ? `${company} ` : "";
  const docs = await retrieve(focus + question);
  if (!docs.length) {
    const answer = "No stored records match this question, so it cannot be answered from the dataset.";
    return stream ? ndjson(async (send) => { send({ sources: [] }); send({ delta: answer }); }) : Response.json({ answer, sources: [] });
  }
  const context = docs.map((d) =>
    `[${d.ref}] ${d.kind} | company: ${d.company} | date: ${d.date ?? "undated"} | evidence: ${d.evidence_class ?? "n/a"}\n${d.title}\n${d.text}`,
  ).join("\n\n");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const req = { model: MODEL, contents: `Records:\n\n${context}\n\nQuestion: ${question}`, config: { systemInstruction: SYSTEM, temperature: 0, thinkingConfig: { thinkingLevel: THINKING } } };

  if (stream) {
    // NDJSON: {sources} first (the client keeps only the ones the answer cites), then {delta} chunks.
    return ndjson(async (send) => {
      send({ sources: docs });
      for await (const chunk of await ai.models.generateContentStream(req)) if (chunk.text) send({ delta: chunk.text });
    });
  }
  try {
    const answer = (await ai.models.generateContent(req)).text ?? "";
    const refs = cited(answer);
    return Response.json({ answer, sources: docs.filter((d) => refs.has(d.ref)) });
  } catch (e) {
    return Response.json({ error: `Model call failed: ${(e as Error).message}` }, { status: 502 });
  }
}

function ndjson(run: (send: (o: { sources?: Doc[]; delta?: string; error?: string }) => void) => Promise<void>) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (o: object) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      try {
        await run(send);
      } catch (e) {
        send({ error: `Model call failed: ${(e as Error).message}` });
      }
      controller.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache" } });
}
