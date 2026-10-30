# Intel Chiplet Market Signals Radar (Modules 1 & 2 POC)

Web application for **Intel Commercial Marketing & Intel Foundry Services (IFS)** that tracks emerging custom-silicon demand signals, ranks potential chiplet customers, monitors competitor moves across packaging and wafer manufacturing, and provides a RAG-powered analytical chat interface backed by an audited SQLite database.

---

## 🚀 Key Features

### Module 1: Emerging Demand Radar (Account & Prospect Intelligence)
- **12 Screened Companies & Shortlisted Targets:** Focus on Cerebras Systems (Deep-Dive candidate), AWS (Annapurna Labs), Meta Platforms, Microsoft Azure, and Tesla.
- **Engineering Hiring Intelligence:** Dynamic 12-month trend charts across 8 key role disciplines (Architecture, RTL, Physical Design, Verification, DFT, Packaging & Heterogeneous Integration, Manufacturing, Sourcing).
- **Silicon Programme & Disclosures:** Custom architectures (WSE-3, Trainium 2, MTIA v2, Maia 100, Dojo D1/D2).
- **Supplier & Ecosystem Mapping:** Foundry, packaging, and ASIC design relationships (TSMC, Samsung, Broadcom, Marvell).

### Module 2: Competitive Movement Radar (Competitive Intelligence)
- **Competitor Tracking:** TSMC, Samsung Foundry, Broadcom, Marvell, AMD, NVIDIA, and Arm.
- **Arm Strategic Positioning:** Tagged as an IP/Architecture Partner & Intel Chiplet Alliance participant (Arm Neoverse CSS V3 on Intel 18A).
- **Chiplet & Advanced Packaging Tracker:** Compares TSMC CoWoS, Samsung I-Cube/X-Cube, and Intel EMIB & Foveros 3D.
- **Event Register:** 100% traceable developments with Intel implications and recommended competitive responses.

### Traceable Evidence Library & Ask AI (RAG)
- **Zero Hallucination Traceability:** Every insight is linked to SEC Form S-1 filings, earnings transcripts, or official corporate disclosures.
- **Ask AI Interface:** Queries the full SQLite backend dynamically with citations.

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **Visualizations:** Recharts (Interactive Area & Trend Charts)
- **Database:** Embedded SQLite via `@libsql/client` (bundled in repository, zero config, 100% Vercel compatible)

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database (Optional - Pre-seeded `intel_signals.db` is already committed)
```bash
npm run seed
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## ☁️ Deploying to Vercel

This project is optimized for 1-click deployment on **Vercel**:

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Intel Chiplet Market Signals UI with SQLite"
   git push origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import the `Intel-s-chiplet-business` repository.
4. Keep the default settings (Next.js preset) and click **Deploy**.
5. The SQLite database `intel_signals.db` is bundled into the deployment and queried serverlessly!
