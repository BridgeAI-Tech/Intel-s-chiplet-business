import { PageHeader } from "@/components/ui";
import { AskBox } from "./ask-box";

export default function AskPage() {
  return (
    <>
      <PageHeader title="Ask AI"
        subtitle="Answers are generated only from stored records and cite them; open any citation to inspect the source." />
      <AskBox />
    </>
  );
}
