import { Fragment, type ReactNode } from "react";

// Minimal Markdown for chat answers: paragraphs, "- " bullets, **bold** / *italic*, bold-only lines as
// subheadings, and [S1, S2] citation groups rendered as compact chips. No HTML is ever interpreted.

const CITE = /(\[[^\]]*S\d+[^\]]*\])/;

function Cites({ refs, turn }: { refs: string[]; turn: number }) {
  const shown = refs.slice(0, 3);
  const rest = refs.slice(3);
  const chip = "mx-px inline-block rounded bg-accent-soft px-1 align-[1px] font-mono text-[10px] font-semibold leading-4 text-accent no-underline hover:bg-accent hover:text-white";
  return (
    <span className="whitespace-nowrap">
      {shown.map((r) => <a key={r} href={`#t${turn}-${r}`} className={chip}>{r}</a>)}
      {rest.length > 0 && <a href={`#t${turn}-${rest[0]}`} title={rest.join(", ")} className={chip}>+{rest.length}</a>}
    </span>
  );
}

function inline(text: string, turn: number): ReactNode[] {
  return text.split(CITE).flatMap((part, i) => {
    if (CITE.test(part) && /^\[.*\]$/.test(part)) return [<Cites key={`c${i}`} refs={part.match(/S\d+/g) ?? []} turn={turn} />];
    return part.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((t, j) => {
      if (/^\*\*[^*]+\*\*$/.test(t)) return <strong key={`${i}-${j}`} className="font-semibold text-foreground">{t.slice(2, -2)}</strong>;
      if (/^\*[^*\s][^*]*\*$/.test(t)) return <em key={`${i}-${j}`}>{t.slice(1, -1)}</em>;
      return <Fragment key={`${i}-${j}`}>{t}</Fragment>;
    });
  });
}

export function Markdown({ text, turn }: { text: string; turn: number }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul${blocks.length}`} className="my-1.5 space-y-1.5">
        {list.map((li, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span>{inline(li, turn)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bullet) { list.push(bullet[1]); continue; }
    flush();
    if (!line) continue;
    const heading = line.match(/^#{1,6}\s+(.*)$/) ?? line.match(/^\*\*([^*]+)\*\*:?$/);
    if (heading) {
      blocks.push(<div key={`h${blocks.length}`} className="mt-3 mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">{heading[1].replace(/:$/, "")}</div>);
      continue;
    }
    blocks.push(<p key={`p${blocks.length}`} className="my-1">{inline(line, turn)}</p>);
  }
  flush();
  return <div className="text-sm leading-6">{blocks}</div>;
}
