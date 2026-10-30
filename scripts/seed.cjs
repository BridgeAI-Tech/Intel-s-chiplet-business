const { createClient } = require("@libsql/client");
const path = require("path");

const dbUrl = process.env.DATABASE_URL || `file:${path.join(__dirname, "..", "intel_signals.db")}`;
const client = createClient({ url: dbUrl });

async function seed() {
  console.log("Creating tables and seeding database...");

  // Execute schema creation
  const statements = [
    `CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      headquarters TEXT,
      employee_range TEXT,
      linkedin_url TEXT,
      parent_company TEXT,
      subsidiaries TEXT,
      business_units TEXT,
      role_in_research TEXT,
      custom_silicon_summary TEXT,
      dev_maturity TEXT,
      intel_relevance_score INTEGER,
      intel_relevance_summary TEXT,
      action_tag TEXT,
      shortlisted INTEGER DEFAULT 0
    );`,

    `CREATE TABLE IF NOT EXISTS programmes (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      name TEXT NOT NULL,
      type TEXT,
      architecture TEXT,
      process_node TEXT,
      packaging_tech TEXT,
      status TEXT,
      description TEXT,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );`,

    `CREATE TABLE IF NOT EXISTS hiring_trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT,
      month TEXT,
      architecture_count INTEGER,
      rtl_logic_count INTEGER,
      physical_design_count INTEGER,
      verification_count INTEGER,
      dft_count INTEGER,
      packaging_count INTEGER,
      manufacturing_count INTEGER,
      total_count INTEGER,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );`,

    `CREATE TABLE IF NOT EXISTS hiring_postings (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      job_title TEXT NOT NULL,
      normalized_title TEXT,
      role_category TEXT,
      seniority TEXT,
      location TEXT,
      department TEXT,
      posting_date TEXT,
      first_observed_date TEXT,
      status TEXT,
      keywords TEXT,
      source_url TEXT,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );`,

    `CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      capabilities TEXT,
      domain TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS company_suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT,
      supplier_id TEXT,
      relationship_type TEXT,
      technology TEXT,
      commercial_stage TEXT,
      status TEXT,
      source_url TEXT,
      FOREIGN KEY(company_id) REFERENCES companies(id),
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    );`,

    `CREATE TABLE IF NOT EXISTS technical_milestones (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      programme_id TEXT,
      title TEXT NOT NULL,
      category TEXT,
      event_date TEXT,
      pub_date TEXT,
      summary TEXT,
      evidence_class TEXT,
      intel_implication TEXT,
      source_url TEXT,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );`,

    `CREATE TABLE IF NOT EXISTS competitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      category TEXT,
      value_chain_role TEXT,
      capabilities TEXT,
      intel_competitive_overlap TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS competitive_events (
      id TEXT PRIMARY KEY,
      competitor_id TEXT,
      event_title TEXT NOT NULL,
      event_type TEXT,
      event_date TEXT,
      pub_date TEXT,
      customer_or_partner TEXT,
      chip_or_programme TEXT,
      architecture_or_node TEXT,
      packaging_tech TEXT,
      commercial_stage TEXT,
      evidence_class TEXT,
      excerpt TEXT,
      source_url TEXT,
      intel_implication TEXT,
      competitive_response TEXT,
      priority TEXT,
      FOREIGN KEY(competitor_id) REFERENCES competitors(id)
    );`,

    `CREATE TABLE IF NOT EXISTS chiplet_packaging_tracker (
      id TEXT PRIMARY KEY,
      competitor_or_company TEXT NOT NULL,
      technology TEXT,
      programme TEXT,
      partner TEXT,
      packaging_type TEXT,
      status TEXT,
      intel_alternative TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS evidence_repository (
      id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_type TEXT,
      title TEXT,
      publication_date TEXT,
      event_date TEXT,
      excerpt TEXT,
      evidence_classification TEXT,
      linked_company TEXT,
      linked_event TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS priority_findings (
      id TEXT PRIMARY KEY,
      module_type TEXT,
      finding_title TEXT NOT NULL,
      answer_summary TEXT,
      evidence_summary TEXT,
      intel_implication TEXT,
      action_tag TEXT,
      priority_order INTEGER
    );`
  ];

  for (const stmt of statements) {
    await client.execute(stmt);
  }

  // Clear existing rows to allow idempotency
  await client.execute("DELETE FROM companies");
  await client.execute("DELETE FROM programmes");
  await client.execute("DELETE FROM hiring_trends");
  await client.execute("DELETE FROM hiring_postings");
  await client.execute("DELETE FROM suppliers");
  await client.execute("DELETE FROM company_suppliers");
  await client.execute("DELETE FROM technical_milestones");
  await client.execute("DELETE FROM competitors");
  await client.execute("DELETE FROM competitive_events");
  await chiplet_packaging_tracker_clear();
  await client.execute("DELETE FROM evidence_repository");
  await client.execute("DELETE FROM priority_findings");

  async function chiplet_packaging_tracker_clear() {
    await client.execute("DELETE FROM chiplet_packaging_tracker");
  }

  console.log("Inserting Companies...");
  const companies = [
    {
      id: "cerebras",
      name: "Cerebras Systems",
      domain: "cerebras.net",
      headquarters: "Sunnyvale, California, USA",
      employee_range: "450-600",
      linkedin_url: "https://www.linkedin.com/company/cerebras-systems",
      parent_company: "Independent",
      subsidiaries: "Cerebras Technologies India Pvt Ltd",
      business_units: "Hardware Engineering, Silicon Systems, AI Software",
      role_in_research: "Deep-Dive Candidate / AI HPC Prospect",
      custom_silicon_summary: "Developer of the Wafer-Scale Engine (WSE-3), a single 21.5cm x 21.5cm wafer containing 4 trillion transistors and 900,000 AI cores. Facing extreme packaging, cooling, and wafer-level yield challenges.",
      dev_maturity: "Volume Production / Next-Gen Architecture",
      intel_relevance_score: 94,
      intel_relevance_summary: "Prime candidate for Intel Advanced Packaging and Foundry. Intel EMIB/Foveros multi-die or wafer-scale assembly provides alternative to TSMC 5nm single-wafer bottleneck. Potential 18A / advanced packaging customer.",
      action_tag: "Escalate",
      shortlisted: 1
    },
    {
      id: "aws",
      name: "Amazon Web Services (AWS)",
      domain: "aws.amazon.com",
      headquarters: "Seattle, Washington, USA",
      employee_range: "100,000+",
      linkedin_url: "https://www.linkedin.com/company/amazon-web-services",
      parent_company: "Amazon.com, Inc.",
      subsidiaries: "Annapurna Labs",
      business_units: "Annapurna Labs, EC2 Core Hardware, AI Infrastructure",
      role_in_research: "Shortlisted Strategic Account / Existing Partner",
      custom_silicon_summary: "In-house accelerator and CPU design via Annapurna Labs: Trainium 2, Inferentia 2, and Graviton 4. Moving aggressively towards multi-die chiplet interconnects.",
      dev_maturity: "Volume Deployment & Next-Gen R&D",
      intel_relevance_score: 96,
      intel_relevance_summary: "Intel officially co-announced custom AWS AI fabric chips on Intel 18A and Intel 3 nodes. Strategic relationship expansion opportunity across advanced packaging (EMIB) and custom packaging.",
      action_tag: "Message",
      shortlisted: 1
    },
    {
      id: "meta",
      name: "Meta Platforms",
      domain: "meta.com",
      headquarters: "Menlo Park, California, USA",
      employee_range: "65,000-75,000",
      linkedin_url: "https://www.linkedin.com/company/meta",
      parent_company: "Meta Platforms, Inc.",
      subsidiaries: "Oculus, Reality Labs",
      business_units: "Infrastructure Hardware, Silicon & Systems Group, Reality Labs",
      role_in_research: "Shortlisted Target / In-house Hyperscaler",
      custom_silicon_summary: "Developing Meta Training and Inference Accelerator (MTIA v1, MTIA v2 Artemis) with Broadcom / TSMC. Rapidly scaling internal silicon design team for Llama training and inference.",
      dev_maturity: "Design & Initial Deployment",
      intel_relevance_score: 88,
      intel_relevance_summary: "Meta is actively seeking second-source foundry and packaging capacity to escape TSMC CoWoS allocation constraints. High fit for Intel 18A-P and Foveros 3D.",
      action_tag: "Campaign",
      shortlisted: 1
    },
    {
      id: "microsoft",
      name: "Microsoft",
      domain: "microsoft.com",
      headquarters: "Redmond, Washington, USA",
      employee_range: "200,000+",
      linkedin_url: "https://www.linkedin.com/company/microsoft",
      parent_company: "Microsoft Corporation",
      subsidiaries: "Azure Silicon, GitHub, LinkedIn",
      business_units: "Azure Hardware Systems & Infrastructure, Strategic Missions and Tech",
      role_in_research: "Shortlisted Strategic Account / Confirmed IFS Customer",
      custom_silicon_summary: "Custom Azure Maia 100 AI accelerator and Cobalt 100 128-core Arm CPU. Multi-billion dollar commitment to Intel Foundry on Intel 18A announced at IFS Direct Connect.",
      dev_maturity: "Volume Deployment & 18A Co-development",
      intel_relevance_score: 98,
      intel_relevance_summary: "Anchor customer for Intel 18A foundry. Key focus is tracking execution milestones, advanced packaging integration, and expanding into next-gen Maia 200.",
      action_tag: "Watchlist",
      shortlisted: 1
    },
    {
      id: "tesla",
      name: "Tesla",
      domain: "tesla.com",
      headquarters: "Austin, Texas, USA",
      employee_range: "120,000+",
      linkedin_url: "https://www.linkedin.com/company/tesla",
      parent_company: "Tesla, Inc.",
      subsidiaries: "Tesla Motors, Grohmann Automation",
      business_units: "Autopilot Hardware, Dojo Supercomputer, Optimus Robotics",
      role_in_research: "Shortlisted Automotive / AI Prospect",
      custom_silicon_summary: "In-house D1 Dojo chiplet tiles (25-chip multi-die System-on-Wafer via TSMC InFO-SoW) and upcoming AI5 (HW5) 3nm autonomous driving processor. Known for dual-sourcing TSMC and Samsung.",
      dev_maturity: "High Maturity / Multi-die Production",
      intel_relevance_score: 86,
      intel_relevance_summary: "Elon Musk confirmed exploration of dual-sourcing and domestic US manufacturing. Intel EMIB/Foveros packaging and Intel 18A provide geographically resilient alternative for Dojo/AI5.",
      action_tag: "Campaign",
      shortlisted: 1
    },
    {
      id: "google",
      name: "Google (Alphabet)",
      domain: "google.com",
      headquarters: "Mountain View, California, USA",
      employee_range: "180,000+",
      linkedin_url: "https://www.linkedin.com/company/google",
      parent_company: "Alphabet Inc.",
      subsidiaries: "DeepMind, Google Cloud",
      business_units: "Google Systems Research, Cloud TPU Systems, Custom Silicon",
      role_in_research: "Screened Hyperscaler / Strategic Customer",
      custom_silicon_summary: "TPU v5e, TPU v5p, TPU v6 (Trillium), and Axion Arm server CPUs. Longstanding design partnership with Broadcom.",
      dev_maturity: "Industry Benchmark / Production",
      intel_relevance_score: 82,
      intel_relevance_summary: "Expanded partnership with Intel (April 2026) for custom IPU and Xeon co-development. Target for heterogeneous chiplet integration with Intel Foundry.",
      action_tag: "Message",
      shortlisted: 0
    },
    {
      id: "tenstorrent",
      name: "Tenstorrent",
      domain: "tenstorrent.com",
      headquarters: "Toronto, Canada & Santa Clara, USA",
      employee_range: "250-400",
      linkedin_url: "https://www.linkedin.com/company/tenstorrent",
      parent_company: "Independent (Led by Jim Keller)",
      subsidiaries: "Tenstorrent Inc., Tenstorrent Japan",
      business_units: "Processor Architecture, AI Software, RISC-V IP",
      role_in_research: "Screened AI / Chiplet Pioneer",
      custom_silicon_summary: "Pioneering modular RISC-V and chiplet-based AI processors: Wormhole, Blackhole, and Ascalon. Strong proponent of open chiplet interconnects (UCIe).",
      dev_maturity: "Tape-out & Early Production",
      intel_relevance_score: 91,
      intel_relevance_summary: "Strong ideological alignment with Intel on open chiplet ecosystems (UCIe). Tenstorrent recently contracted Samsung Foundry 4nm, but remains open to Intel EMIB packaging.",
      action_tag: "Campaign",
      shortlisted: 0
    },
    {
      id: "cisco",
      name: "Cisco Systems",
      domain: "cisco.com",
      headquarters: "San Jose, California, USA",
      employee_range: "80,000+",
      linkedin_url: "https://www.linkedin.com/company/cisco",
      parent_company: "Cisco Systems, Inc.",
      subsidiaries: "Acacia Communications, Leaba Semiconductor",
      business_units: "Silicon One, Cloud & Data Center Networking",
      role_in_research: "Screened Networking Silicon Prospect",
      custom_silicon_summary: "Cisco Silicon One unified networking architecture (G200, P100) using 5nm/3nm and co-packaged optics (CPO).",
      dev_maturity: "High Maturity / Production",
      intel_relevance_score: 79,
      intel_relevance_summary: "Potential user of Intel Optical I/O and EMIB packaging for next-generation 51.2T and 102.4T network switches.",
      action_tag: "Watchlist",
      shortlisted: 0
    },
    {
      id: "apple",
      name: "Apple",
      domain: "apple.com",
      headquarters: "Cupertino, California, USA",
      employee_range: "160,000+",
      linkedin_url: "https://www.linkedin.com/company/apple",
      parent_company: "Apple Inc.",
      subsidiaries: "Apple Silicon, BedRock",
      business_units: "Hardware Technologies, Silicon Engineering Group",
      role_in_research: "Screened Benchmark / TSMC Lead Customer",
      custom_silicon_summary: "M-series (M4 Max/Ultra) and A-series processors using UltraFusion custom multi-die 2.5D packaging with 2.5TB/s bandwidth.",
      dev_maturity: "Global Benchmark",
      intel_relevance_score: 45,
      intel_relevance_summary: "Exclusively committed to TSMC N3E/N2. Extremely low near-term foundry conversion probability; serves as packaging architecture benchmark.",
      action_tag: "Watchlist",
      shortlisted: 0
    },
    {
      id: "samsung_elec",
      name: "Samsung Electronics",
      domain: "samsung.com",
      headquarters: "Suwon, South Korea",
      employee_range: "270,000+",
      linkedin_url: "https://www.linkedin.com/company/samsung-electronics",
      parent_company: "Samsung Group",
      subsidiaries: "Samsung Semiconductor",
      business_units: "System LSI, Memory Division",
      role_in_research: "Screened Benchmark & Competitor",
      custom_silicon_summary: "Exynos mobile application processors, Mach-1 AI inference accelerator, and proprietary HBM-PIM memory architectures.",
      dev_maturity: "Integrated Device Manufacturer",
      intel_relevance_score: 40,
      intel_relevance_summary: "IDM competitor in foundry and packaging. Potential cross-licensing or memory partner rather than foundry customer.",
      action_tag: "Competitive Response",
      shortlisted: 0
    },
    {
      id: "nokia",
      name: "Nokia",
      domain: "nokia.com",
      headquarters: "Espoo, Finland",
      employee_range: "85,000+",
      linkedin_url: "https://www.linkedin.com/company/nokia",
      parent_company: "Nokia Corporation",
      subsidiaries: "Nokia Bell Labs",
      business_units: "Mobile Networks, Cloud & Network Services",
      role_in_research: "Screened Telecom Prospect",
      custom_silicon_summary: "ReefShark System-on-Chip (SoC) for 5G base stations. Transitioned from FPGAs to custom ASICs.",
      dev_maturity: "Commercial Deployment",
      intel_relevance_score: 72,
      intel_relevance_summary: "Existing collaborator with Intel on Xeon processors for vRAN; prospective customer for Intel Foundry telecom edge custom silicon.",
      action_tag: "Message",
      shortlisted: 0
    },
    {
      id: "ibm",
      name: "IBM",
      domain: "ibm.com",
      headquarters: "Armonk, New York, USA",
      employee_range: "280,000+",
      linkedin_url: "https://www.linkedin.com/company/ibm",
      parent_company: "International Business Machines Corp.",
      subsidiaries: "Red Hat, IBM Research",
      business_units: "Systems, IBM Research - Semiconductor Technology",
      role_in_research: "Screened Enterprise Prospect",
      custom_silicon_summary: "Telum II mainframe processor and Spyre AI accelerator on Samsung 5nm with dual-chip packaging and high-speed coherent interconnects.",
      dev_maturity: "Production & Next-Gen R&D",
      intel_relevance_score: 76,
      intel_relevance_summary: "Albany NanoTech research ally. Good candidate for Intel 18A-P enterprise mainframe and AI accelerator manufacturing.",
      action_tag: "Watchlist",
      shortlisted: 0
    }
  ];

  for (const c of companies) {
    await client.execute({
      sql: `INSERT INTO companies (id, name, domain, headquarters, employee_range, linkedin_url, parent_company, subsidiaries, business_units, role_in_research, custom_silicon_summary, dev_maturity, intel_relevance_score, intel_relevance_summary, action_tag, shortlisted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [c.id, c.name, c.domain, c.headquarters, c.employee_range, c.linkedin_url, c.parent_company, c.subsidiaries, c.business_units, c.role_in_research, c.custom_silicon_summary, c.dev_maturity, c.intel_relevance_score, c.intel_relevance_summary, c.action_tag, c.shortlisted]
    });
  }

  console.log("Inserting Programmes...");
  const programmes = [
    { id: "p_wse3", company_id: "cerebras", name: "Wafer-Scale Engine 3 (WSE-3)", type: "AI Accelerator", architecture: "Wafer-scale monolithic mesh (900k cores)", process_node: "TSMC 5nm", packaging_tech: "Proprietary Wafer-Level Packaging (InFO-SoW competitor)", status: "Active Production", description: "World's largest commercial AI chip; 4 trillion transistors with 44GB on-wafer SRAM." },
    { id: "p_trn2", company_id: "aws", name: "Trainium 2", type: "AI Training Accelerator", architecture: "Custom Annapurna Architecture (4x compute of Trn1)", process_node: "TSMC 4nm / Intel 18A Planned", packaging_tech: "Advanced 2.5D Multi-die with HBM3e", status: "Ramping Deployment", description: "Targeted at 100,000-chip cluster training for Anthropic and AWS Bedrock." },
    { id: "p_grv4", company_id: "aws", name: "Graviton 4", type: "Server CPU", architecture: "Arm Neoverse V2", process_node: "TSMC 5nm", packaging_tech: "Multi-die Chiplet (Core + I/O dies)", status: "Active Deployment", description: "96 Neoverse V2 cores, 12 DDR5 channels, multi-die interconnect." },
    { id: "p_mtia2", company_id: "meta", name: "MTIA v2 (Artemis)", type: "AI Inference Accelerator", architecture: "Custom SIMD / RISC-V Control Grid", process_node: "TSMC 5nm", packaging_tech: "2.5D with 128GB LPDDR5 / HBM", status: "Data Center Rollout", description: "Custom ASIC tailored to PyTorch and ranking/recommendation models." },
    { id: "p_maia100", company_id: "microsoft", name: "Azure Maia 100", type: "AI Accelerator", architecture: "Custom Deep Learning Vector Processor", process_node: "TSMC 5nm", packaging_tech: "CoWoS-S with HBM2e (105B transistors)", status: "Active Deployment", description: "Dedicated silicon for OpenAI GPT-4 inference on Azure." },
    { id: "p_dojo_d1", company_id: "tesla", name: "Dojo D1 / Training Tile", type: "AI Training Processor", architecture: "Custom 64-bit SIMD Array", process_node: "TSMC 7nm / 5nm", packaging_tech: "System-on-Wafer (25 dies interconnected)", status: "Volume Deployment", description: "Modular tile architecture delivering 9 PFLOPS BF16 per tile." },
    { id: "p_ai5", company_id: "tesla", name: "AI5 (Hardware 5)", type: "Autonomous Driving SoC", architecture: "Custom Neural Processing Unit + CPU", process_node: "TSMC 3nm / Samsung 2nm Dual-Source", packaging_tech: "Advanced Fan-Out / 2.5D", status: "In Development", description: "Next-gen FSD chip engineered for sub-100W real-time vision inference." }
  ];

  for (const p of programmes) {
    await client.execute({
      sql: `INSERT INTO programmes (id, company_id, name, type, architecture, process_node, packaging_tech, status, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.company_id, p.name, p.type, p.architecture, p.process_node, p.packaging_tech, p.status, p.description]
    });
  }

  console.log("Inserting Hiring Trends (Last 12 Months)...");
  const months = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
  
  // Cerebras trend (rising in packaging & physical design as next gen scales)
  const cerebrasCounts = [
    [4, 6, 8, 7, 3, 5, 2],
    [5, 7, 9, 8, 4, 6, 3],
    [6, 8, 11, 10, 5, 8, 4],
    [7, 9, 13, 11, 6, 9, 5],
    [8, 11, 15, 12, 7, 12, 6],
    [9, 12, 16, 14, 8, 14, 7],
    [11, 14, 18, 15, 9, 16, 8],
    [12, 15, 20, 16, 10, 18, 9],
    [14, 16, 22, 18, 11, 21, 10],
    [15, 17, 24, 19, 12, 23, 11],
    [16, 18, 25, 21, 13, 26, 12],
    [18, 20, 27, 22, 14, 28, 14]
  ];

  for (let i = 0; i < months.length; i++) {
    const c = cerebrasCounts[i];
    const total = c.reduce((a, b) => a + b, 0);
    await client.execute({
      sql: `INSERT INTO hiring_trends (company_id, month, architecture_count, rtl_logic_count, physical_design_count, verification_count, dft_count, packaging_count, manufacturing_count, total_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["cerebras", months[i], c[0], c[1], c[2], c[3], c[4], c[5], c[6], total]
    });
  }

  // AWS hiring trend
  const awsCounts = [
    [18, 24, 30, 28, 14, 18, 10],
    [20, 26, 32, 30, 15, 19, 12],
    [22, 28, 35, 33, 16, 21, 13],
    [24, 31, 38, 35, 18, 24, 15],
    [26, 33, 40, 38, 20, 26, 17],
    [28, 36, 43, 40, 22, 29, 19],
    [30, 39, 45, 42, 24, 32, 21],
    [32, 42, 48, 45, 26, 35, 23],
    [35, 44, 52, 48, 28, 38, 25],
    [37, 46, 55, 50, 30, 41, 27],
    [39, 49, 58, 53, 32, 44, 29],
    [42, 52, 62, 56, 34, 48, 32]
  ];

  for (let i = 0; i < months.length; i++) {
    const c = awsCounts[i];
    const total = c.reduce((a, b) => a + b, 0);
    await client.execute({
      sql: `INSERT INTO hiring_trends (company_id, month, architecture_count, rtl_logic_count, physical_design_count, verification_count, dft_count, packaging_count, manufacturing_count, total_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["aws", months[i], c[0], c[1], c[2], c[3], c[4], c[5], c[6], total]
    });
  }

  // Meta hiring trend
  const metaCounts = [
    [8, 12, 16, 14, 6, 8, 4],
    [9, 14, 18, 16, 7, 9, 5],
    [11, 16, 20, 18, 8, 11, 6],
    [12, 18, 22, 20, 9, 13, 7],
    [14, 20, 25, 22, 10, 15, 8],
    [16, 23, 28, 25, 12, 18, 10],
    [18, 25, 31, 28, 14, 21, 11],
    [20, 28, 35, 30, 15, 24, 13],
    [22, 31, 38, 33, 17, 27, 15],
    [24, 34, 42, 36, 19, 31, 17],
    [27, 37, 46, 39, 21, 35, 19],
    [30, 41, 50, 43, 23, 40, 22]
  ];

  for (let i = 0; i < months.length; i++) {
    const c = metaCounts[i];
    const total = c.reduce((a, b) => a + b, 0);
    await client.execute({
      sql: `INSERT INTO hiring_trends (company_id, month, architecture_count, rtl_logic_count, physical_design_count, verification_count, dft_count, packaging_count, manufacturing_count, total_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["meta", months[i], c[0], c[1], c[2], c[3], c[4], c[5], c[6], total]
    });
  }

  console.log("Inserting Detailed Job Postings...");
  const postings = [
    {
      id: "cer_job_01",
      company_id: "cerebras",
      job_title: "Principal Advanced Packaging Architect",
      normalized_title: "Packaging Architect",
      role_category: "Packaging & Integration",
      seniority: "Staff / Principal",
      location: "Sunnyvale, CA",
      department: "Hardware Systems Engineering",
      posting_date: "2026-09-18",
      first_observed_date: "2026-09-19",
      status: "Active",
      keywords: "Wafer-level packaging, 3D integration, thermal interface material, multi-die interconnect",
      source_url: "https://www.cerebras.net/careers/principal-packaging-architect"
    },
    {
      id: "cer_job_02",
      company_id: "cerebras",
      job_title: "Senior Physical Design Engineer - Sub-3nm",
      normalized_title: "Physical Design Engineer",
      role_category: "Physical Design",
      seniority: "Senior",
      location: "Sunnyvale, CA",
      department: "Silicon Engineering",
      posting_date: "2026-10-04",
      first_observed_date: "2026-10-05",
      status: "Active",
      keywords: "Place and route, clock tree synthesis, static timing analysis, 3nm/2nm FinFET/GAA",
      source_url: "https://www.cerebras.net/careers/sr-physical-design-engineer"
    },
    {
      id: "cer_job_03",
      company_id: "cerebras",
      job_title: "Silicon DFT Technical Lead",
      normalized_title: "DFT Engineer",
      role_category: "Design-for-Test",
      seniority: "Lead",
      location: "Sunnyvale, CA",
      department: "Silicon Engineering",
      posting_date: "2026-08-12",
      first_observed_date: "2026-08-14",
      status: "Active",
      keywords: "Scan compression, BIST, wafer-level sorting, high-volume defect isolation",
      source_url: "https://www.cerebras.net/careers/dft-tech-lead"
    },
    {
      id: "aws_job_01",
      company_id: "aws",
      job_title: "Sr. Silicon Packaging Engineer - Multi-Die Systems",
      normalized_title: "Packaging Engineer",
      role_category: "Packaging & Integration",
      seniority: "Senior",
      location: "Austin, TX / Cupertino, CA",
      department: "Annapurna Labs",
      posting_date: "2026-10-12",
      first_observed_date: "2026-10-13",
      status: "Active",
      keywords: "EMIB, CoWoS, 2.5D substrate, HBM3e signal integrity, UCIe die-to-die",
      source_url: "https://amazon.jobs/en/jobs/2789120/sr-silicon-packaging-engineer"
    },
    {
      id: "aws_job_02",
      company_id: "aws",
      job_title: "Principal Foundry Sourcing Manager",
      normalized_title: "Sourcing Manager",
      role_category: "Sourcing & Procurement",
      seniority: "Principal",
      location: "Seattle, WA",
      department: "Global Infrastructure Supply Chain",
      posting_date: "2026-09-02",
      first_observed_date: "2026-09-03",
      status: "Active",
      keywords: "Wafer supply agreements, foundry capacity allocation, advanced packaging OSAT contracts",
      source_url: "https://amazon.jobs/en/jobs/2754199/principal-foundry-sourcing"
    },
    {
      id: "meta_job_01",
      company_id: "meta",
      job_title: "Director of Silicon Foundry & OSAT Operations",
      normalized_title: "Foundry Operations Director",
      role_category: "Manufacturing & Bring-up",
      seniority: "Director",
      location: "Menlo Park, CA",
      department: "Infrastructure Hardware Silicon",
      posting_date: "2026-10-01",
      first_observed_date: "2026-10-02",
      status: "Active",
      keywords: "Foundry tape-out, wafer fab yield management, CoWoS allocation, secondary foundry onboarding",
      source_url: "https://www.metacareers.com/jobs/8941203/silicon-foundry-osat-director"
    }
  ];

  for (const post of postings) {
    await client.execute({
      sql: `INSERT INTO hiring_postings (id, company_id, job_title, normalized_title, role_category, seniority, location, department, posting_date, first_observed_date, status, keywords, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [post.id, post.company_id, post.job_title, post.normalized_title, post.role_category, post.seniority, post.location, post.department, post.posting_date, post.first_observed_date, post.status, post.keywords, post.source_url]
    });
  }

  console.log("Inserting Suppliers...");
  const suppliers = [
    { id: "tsmc", name: "TSMC", category: "External Foundry & Packaging", capabilities: "N5, N4, N3, N2, CoWoS-S/R/L, SoIC 3D", domain: "tsmc.com" },
    { id: "samsung_foundry", name: "Samsung Foundry", category: "External Foundry & Packaging", capabilities: "4nm, 3nm GAA, I-Cube, X-Cube", domain: "semiconductor.samsung.com" },
    { id: "broadcom", name: "Broadcom", category: "Custom ASIC Design Service", capabilities: "High-speed SerDes, XPU design, Co-packaged optics", domain: "broadcom.com" },
    { id: "marvell", name: "Marvell Technology", category: "Custom ASIC & Compute", capabilities: "Custom AI accelerators, 3nm platform, electro-optics", domain: "marvell.com" },
    { id: "amkor", name: "Amkor Technology", category: "OSAT & Packaging", capabilities: "2.5D, Fan-out, advanced flip chip", domain: "amkor.com" },
    { id: "synopsys", name: "Synopsys", category: "EDA & IP", capabilities: "UCIe PHY IP, HBM3 controller, verification tools", domain: "synopsys.com" }
  ];

  for (const s of suppliers) {
    await client.execute({
      sql: `INSERT INTO suppliers (id, name, category, capabilities, domain)
            VALUES (?, ?, ?, ?, ?)`,
      args: [s.id, s.name, s.category, s.capabilities, s.domain]
    });
  }

  console.log("Inserting Company Suppliers Relationships...");
  const compSuppliers = [
    { company_id: "cerebras", supplier_id: "tsmc", relationship_type: "Exclusive Wafer Fabrication & InFO Packaging", technology: "TSMC 5nm Custom Wafer-Scale Process", commercial_stage: "Volume Production", status: "Active Contract", source_url: "https://www.cerebras.net/press-release/cerebras-wse3" },
    { company_id: "aws", supplier_id: "tsmc", relationship_type: "Foundry & CoWoS Packaging", technology: "TSMC 4nm/3nm, CoWoS-S", commercial_stage: "Volume Production", status: "Active (Seeking Secondary Source)", source_url: "https://aws.amazon.com/blogs/aws/announcing-trainium2" },
    { company_id: "aws", supplier_id: "marvell", relationship_type: "ASIC Co-Design Partner", technology: "Custom interconnect & memory subsystems", commercial_stage: "Volume Production", status: "Active Long-term Partner", source_url: "https://www.marvell.com/company/newsroom" },
    { company_id: "meta", supplier_id: "broadcom", relationship_type: "Custom ASIC Co-Development", technology: "MTIA architecture & PCIe/interconnect", commercial_stage: "Production & Next-gen R&D", status: "Active", source_url: "https://about.fb.com/news/2024/04/introducing-our-next-generation-infrastructure-hardware" },
    { company_id: "meta", supplier_id: "tsmc", relationship_type: "Foundry & Advanced Packaging", technology: "5nm wafer fab and CoWoS", commercial_stage: "Deployment", status: "Constrained Capacity", source_url: "https://about.fb.com/news/2024/04/introducing-our-next-generation-infrastructure-hardware" },
    { company_id: "tesla", supplier_id: "tsmc", relationship_type: "System-on-Wafer Packaging & Fab", technology: "7nm/5nm Dojo D1 tiles, InFO-SoW", commercial_stage: "Volume Deployment", status: "Active Contract", source_url: "https://ir.tesla.com" }
  ];

  for (const cs of compSuppliers) {
    await client.execute({
      sql: `INSERT INTO company_suppliers (company_id, supplier_id, relationship_type, technology, commercial_stage, status, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [cs.company_id, cs.supplier_id, cs.relationship_type, cs.technology, cs.commercial_stage, cs.status, cs.source_url]
    });
  }

  console.log("Inserting Technical Milestones...");
  const milestones = [
    {
      id: "tm_01",
      company_id: "cerebras",
      programme_id: "p_wse3",
      title: "Cerebras Unveils WSE-3 Wafer-Scale Processor Delivering 125 PFLOPS",
      category: "Product Launch",
      event_date: "2026-03-13",
      pub_date: "2026-03-13",
      summary: "Cerebras announced the WSE-3, doubling performance over WSE-2 using TSMC 5nm while maintaining the single wafer form factor. Emphasized lack of external memory bottlenecks.",
      evidence_class: "Confirmed Fact",
      intel_implication: "Cerebras is running into the physical limits of single-wafer lithography and reticle stitching. Intel EMIB/Foveros 3D multi-die assembly offers a far lower risk, higher yielding path for WSE-4.",
      source_url: "https://www.cerebras.net/press-release/cerebras-announces-third-generation-wafer-scale-engine"
    },
    {
      id: "tm_02",
      company_id: "cerebras",
      programme_id: "p_wse3",
      title: "Cerebras Files S-1 Registration Statement Indicating Supply Chain Concentration",
      category: "Filings & Disclosures",
      event_date: "2026-09-30",
      pub_date: "2026-10-02",
      summary: "Cerebras S-1 IPO filing highlights single-source reliance on TSMC for all wafer manufacturing and packaging as a primary business risk factor.",
      evidence_class: "Confirmed Fact",
      intel_implication: "High urgency for Cerebras to qualify a qualified second foundry/packaging source to appease institutional investors before or post IPO. Direct opening for Intel Foundry Services.",
      source_url: "https://www.sec.gov/edgar/data/cerebras"
    },
    {
      id: "tm_03",
      company_id: "aws",
      programme_id: "p_trn2",
      title: "AWS and Intel Announce Strategic Co-Investment in Custom Silicon on 18A",
      category: "Manufacturing Partnership",
      event_date: "2026-09-16",
      pub_date: "2026-09-16",
      summary: "Intel and AWS announced a multi-year, multi-billion-dollar framework where Intel Foundry will manufacture custom AI fabric silicon for AWS on Intel 18A, alongside Intel 3 custom chips.",
      evidence_class: "Confirmed Fact",
      intel_implication: "Validates Intel 18A readiness for hyperscale cloud workloads. Creates baseline to cross-sell EMIB packaging for Trainium 3 / Graviton 5.",
      source_url: "https://www.intel.com/content/www/us/en/newsroom/news/intel-aws-collaboration.html"
    },
    {
      id: "tm_04",
      company_id: "meta",
      programme_id: "p_mtia2",
      title: "Meta Deploys Second-Generation MTIA v2 Silicon in Production Clusters",
      category: "Product Launch",
      event_date: "2026-04-10",
      pub_date: "2026-04-10",
      summary: "Meta announced deployment of MTIA v2 'Artemis' across its AI data centers, demonstrating 3x improvement in compute density for PyTorch ad ranking.",
      evidence_class: "Confirmed Fact",
      intel_implication: "Meta is rapidly advancing its silicon autonomy. With TSMC CoWoS backlogged by Nvidia, Meta represents the strongest hyperscaler prospect for Intel Foveros packaging pilot.",
      source_url: "https://about.fb.com/news/2024/04/introducing-our-next-generation-infrastructure-hardware"
    }
  ];

  for (const m of milestones) {
    await client.execute({
      sql: `INSERT INTO technical_milestones (id, company_id, programme_id, title, category, event_date, pub_date, summary, evidence_class, intel_implication, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [m.id, m.company_id, m.programme_id, m.title, m.category, m.event_date, m.pub_date, m.summary, m.evidence_class, m.intel_implication, m.source_url]
    });
  }

  console.log("Inserting Competitors (Module 2)...");
  const competitors = [
    {
      id: "broadcom",
      name: "Broadcom",
      domain: "broadcom.com",
      category: "Custom ASIC Provider",
      value_chain_role: "Custom ASIC Design, High-speed SerDes, Co-Packaged Optics",
      capabilities: "3nm/2nm custom XPU design, 200G SerDes, high-density 2.5D packaging integration",
      intel_competitive_overlap: "Competes against Intel Foundry ASIC and internal accelerator lines by dominating Google TPU, Meta MTIA, and Bytedance custom silicon pipelines."
    },
    {
      id: "marvell",
      name: "Marvell Technology",
      domain: "marvell.com",
      category: "Custom ASIC Provider",
      value_chain_role: "Custom AI Accelerators, Electro-Optics, Interconnect",
      capabilities: "Modular 3nm custom ASIC platform, 3.2T optical engines, UCIe chiplet die-to-die IP",
      intel_competitive_overlap: "Direct rival in custom cloud silicon; co-developer of AWS Trainium and Tier-2 hyperscaler ASICs."
    },
    {
      id: "tsmc",
      name: "TSMC",
      domain: "tsmc.com",
      category: "External Pure-Play Foundry",
      value_chain_role: "Leading-Edge Wafer Fabrication & Advanced Packaging (CoWoS, SoIC)",
      capabilities: "N3P, N2 nanosheet GAA, A16 with Super Power Rail, CoWoS-S/L capacity expanding to 75k wpm",
      intel_competitive_overlap: "Intel Foundry's primary rival across leading-edge wafer manufacturing and advanced packaging worldwide."
    },
    {
      id: "samsung_foundry",
      name: "Samsung Foundry",
      domain: "semiconductor.samsung.com",
      category: "External Foundry & Packaging",
      value_chain_role: "GAA Wafer Fab & Turnkey Packaging (I-Cube, X-Cube, HBM3e/4)",
      capabilities: "SF3 3nm GAA, SF2 2nm, 2.5D I-Cube packaging with turnkey in-house HBM supply",
      intel_competitive_overlap: "Aggressively pricing 4nm/3nm GAA against Intel 18A; landed Tenstorrent and Tesla second-source agreements."
    },
    {
      id: "amd",
      name: "AMD",
      domain: "amd.com",
      category: "Merchant Semiconductor Vendor",
      value_chain_role: "Data Center GPU & CPU (MI300X, EPYC), Chiplet Pioneer",
      capabilities: "TSMC SoIC 3D hybrid bonding, modular 3D chiplet stacking, ROCm software stack",
      intel_competitive_overlap: "Direct competitor to Intel Xeon and Gaudi; pioneer in multi-die chiplet commercialization."
    },
    {
      id: "nvidia",
      name: "NVIDIA",
      domain: "nvidia.com",
      category: "Merchant Semiconductor Vendor",
      value_chain_role: "AI Acceleration, NVLink Interconnect, Full-stack Systems",
      capabilities: "Blackwell B200 dual-die CoWoS-L integration, NVLink 5, 208B transistors",
      intel_competitive_overlap: "Dominates AI data center market; massive CoWoS consumption limits packaging supply for potential Intel packaging customers."
    },
    {
      id: "arm",
      name: "Arm Holdings",
      domain: "arm.com",
      category: "IP & Architecture / Ecosystem Partner",
      value_chain_role: "Compute Subsystem (CSS) IP, Architecture Licensing",
      capabilities: "Neoverse V3/N3 cores, UCIe chiplet standard contributor, Intel Chiplet Alliance Partner",
      intel_competitive_overlap: "Architecture competitor to x86, BUT strategic Intel Foundry & Chiplet Alliance partner for Arm Neoverse on Intel 18A."
    }
  ];

  for (const comp of competitors) {
    await client.execute({
      sql: `INSERT INTO competitors (id, name, domain, category, value_chain_role, capabilities, intel_competitive_overlap)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [comp.id, comp.name, comp.domain, comp.category, comp.value_chain_role, comp.capabilities, comp.intel_competitive_overlap]
    });
  }

  console.log("Inserting Competitive Developments (Module 2 Events)...");
  const compEvents = [
    {
      id: "ce_01",
      competitor_id: "tsmc",
      event_title: "TSMC Doubles CoWoS Advanced Packaging Capacity Target for 2026",
      event_type: "Capacity Expansion & Packaging",
      event_date: "2026-07-18",
      pub_date: "2026-07-19",
      customer_or_partner: "NVIDIA, AMD, Broadcom, AWS",
      chip_or_programme: "CoWoS-S / CoWoS-L Lines in Taichung & Chiayi",
      architecture_or_node: "Silicon Interposer / 2.5D",
      packaging_tech: "CoWoS-L (Local Silicon Interconnect)",
      commercial_stage: "Factory Construction & Tool Install",
      evidence_class: "Confirmed Fact",
      excerpt: "TSMC Chairman CC Wei confirmed that CoWoS capacity will more than double in 2025 and again in 2026, reaching over 70,000 wafers per month to satisfy unprecedented AI demand.",
      source_url: "https://www.tsmc.com/english/investorRelations/quarterly_results",
      intel_implication: "Even with doubling, TSMC CoWoS remains oversubscribed, locking out mid-tier AI chiplet players (Cerebras, Tenstorrent) and leaving hyperscalers desperate for Intel EMIB packaging allocation.",
      competitive_response: "Aggressively market Intel Foundry advanced packaging as standalone service (Packaging-only option for non-Intel wafer customers).",
      priority: "High"
    },
    {
      id: "ce_02",
      competitor_id: "broadcom",
      event_title: "Broadcom Secures Third Major Cloud Customer for 3nm Custom AI ASIC",
      event_type: "Design Win",
      event_date: "2026-06-06",
      pub_date: "2026-06-06",
      customer_or_partner: "Confidential Tier-1 Hyperscaler (Corroborated as ByteDance / Meta)",
      chip_or_programme: "Custom AI XPU with Co-Packaged Optics",
      architecture_or_node: "TSMC 3nm (N3P)",
      packaging_tech: "2.5D High-Density Substrate",
      commercial_stage: "Design Win / Pre-production",
      evidence_class: "Confirmed Fact",
      excerpt: "Broadcom CEO Hock Tan announced the addition of a third multi-billion-dollar custom AI accelerator customer on its 3nm platform, slated for volume ramp in late 2025/early 2026.",
      source_url: "https://investors.broadcom.com/financial-information/quarterly-results",
      intel_implication: "Broadcom's stronghold on hyperscaler custom silicon proves that cloud titans prefer turnkey ASIC design partners over raw foundry contracts unless foundry provides superior packaging.",
      competitive_response: "Partner with independent ASIC design houses (Faraday, VeriSilicon) to offer turnkey Intel 18A design enablement.",
      priority: "High"
    },
    {
      id: "ce_03",
      competitor_id: "marvell",
      event_title: "Marvell Showcases 3nm Custom Compute Infrastructure Platform with UCIe",
      event_type: "Product & Architecture",
      event_date: "2026-04-16",
      pub_date: "2026-04-16",
      customer_or_partner: "Amazon Annapurna & Google Cloud",
      chip_or_programme: "Accelerated Custom Compute Platform",
      architecture_or_node: "TSMC 3nm",
      packaging_tech: "UCIe 2.0 Die-to-Die Interconnect",
      commercial_stage: "Production Qualified",
      evidence_class: "Confirmed Fact",
      excerpt: "Marvell demonstrated its comprehensive 3nm custom ASIC platform featuring UCIe-compliant interconnects, 240Tbps switching, and integrated HBM3e memory controllers.",
      source_url: "https://www.marvell.com/company/newsroom/marvell-accelerates-custom-ai-silicon-leadership.html",
      intel_implication: "Direct validation of UCIe chiplet standard. Marvell is capturing the custom silicon middle-layer that Intel's IFS Accelerator alliance seeks to address.",
      competitive_response: "Drive Intel Chiplet Alliance interoperability testing with Marvell dies to allow hybrid packages (Marvell I/O die + Intel 18A compute die).",
      priority: "Medium"
    },
    {
      id: "ce_04",
      competitor_id: "samsung_foundry",
      event_title: "Samsung Foundry Signs Tenstorrent for 4nm RISC-V AI Chiplets in Taylor, Texas",
      event_type: "Design Win & Manufacturing",
      event_date: "2026-02-14",
      pub_date: "2026-02-15",
      customer_or_partner: "Tenstorrent",
      chip_or_programme: "Tenstorrent Blackhole Chiplet",
      architecture_or_node: "SF4X (4nm HPC)",
      packaging_tech: "I-Cube 2.5D with 8-high HBM",
      commercial_stage: "Tape-out Confirmed",
      evidence_class: "Confirmed Fact",
      excerpt: "Tenstorrent selected Samsung Foundry to manufacture its next-generation AI chiplets using the 4nm process at Samsung's Taylor, Texas facility, leveraging Samsung's turnkey 2.5D packaging.",
      source_url: "https://news.samsung.com/global/samsung-foundry-secures-tenstorrent-design-win",
      intel_implication: "Tenstorrent's Jim Keller selected Samsung primarily due to aggressive pricing and turnkey packaging bundling, demonstrating how packaging wins foundry deals.",
      competitive_response: "Approach Tenstorrent with packaging-only proposal for Ascalon RISC-V compute cores using Intel EMIB.",
      priority: "High"
    },
    {
      id: "ce_05",
      competitor_id: "arm",
      event_title: "Arm Unveils Neoverse CSS V3 and Deepens Intel Chiplet Alliance Integration",
      event_type: "Ecosystem & Architecture",
      event_date: "2026-03-01",
      pub_date: "2026-03-01",
      customer_or_partner: "Intel Foundry, Microsoft, AWS",
      chip_or_programme: "Arm Neoverse CSS V3 / Poseidon",
      architecture_or_node: "Intel 18A / TSMC 3nm",
      packaging_tech: "UCIe Standard Chiplet Die",
      commercial_stage: "IP Availability",
      evidence_class: "Confirmed Fact",
      excerpt: "Arm announced Neoverse Compute Subsystems (CSS) V3 optimized for Intel 18A and UCIe interfaces, enabling partners to integrate Arm cores into custom multi-die chiplet packages effortlessly.",
      source_url: "https://www.arm.com/company/news/2024/02/arm-neoverse-css-next-generation",
      intel_implication: "Arm is not a foundry competitor; this development is a major positive catalyst for Intel Foundry. It allows any cloud customer to manufacture custom Arm CPUs on Intel 18A with near-zero design friction.",
      competitive_response: "Market joint Intel-Arm reference designs to hyperscalers seeking alternatives to AMD EPYC and Nvidia Grace.",
      priority: "High"
    },
    {
      id: "ce_06",
      competitor_id: "amd",
      event_title: "AMD Announces Instinct MI350 Series with 3nm Compute and 3D Hybrid Bonding",
      event_type: "Product Launch",
      event_date: "2026-06-03",
      pub_date: "2026-06-04",
      customer_or_partner: "Microsoft Azure, Oracle Cloud",
      chip_or_programme: "Instinct MI350X / CDNA 4",
      architecture_or_node: "TSMC 3nm",
      packaging_tech: "3D SoIC + CoWoS-L (288GB HBM3e)",
      commercial_stage: "Sampling in Q4 2025 / Q1 2026",
      evidence_class: "Confirmed Fact",
      excerpt: "Lisa Su unveiled the MI350 series, citing 35x inference performance boost using CDNA 4 architecture built on 3nm with 3D stacking and 288GB of HBM3e.",
      source_url: "https://ir.amd.com/news-events/press-releases",
      intel_implication: "Highlights the rapid industry shift to 3D die stacking. Intel's Foveros Direct (hybrid bonding) is technologically equal to TSMC SoIC, offering a proven counter-narrative for merchant GPUs.",
      competitive_response: "Publish technical whitepaper comparing Intel Foveros Direct interconnect density against TSMC SoIC for AI accelerators.",
      priority: "Medium"
    }
  ];

  for (const ce of compEvents) {
    await client.execute({
      sql: `INSERT INTO competitive_events (id, competitor_id, event_title, event_type, event_date, pub_date, customer_or_partner, chip_or_programme, architecture_or_node, packaging_tech, commercial_stage, evidence_class, excerpt, source_url, intel_implication, competitive_response, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [ce.id, ce.competitor_id, ce.event_title, ce.event_type, ce.event_date, ce.pub_date, ce.customer_or_partner, ce.chip_or_programme, ce.architecture_or_node, ce.packaging_tech, ce.commercial_stage, ce.evidence_class, ce.excerpt, ce.source_url, ce.intel_implication, ce.competitive_response, ce.priority]
    });
  }

  console.log("Inserting Chiplet & Advanced Packaging Tracker...");
  const packagingTracker = [
    { id: "pk_01", competitor_or_company: "TSMC", technology: "CoWoS-L", programme: "Nvidia Blackwell B200 / AMD MI350", partner: "Nvidia, AMD", packaging_type: "2.5D with Local Silicon Interconnect", status: "Severe Shortage / Heavy Ramp", intel_alternative: "Intel EMIB (Embedded Multi-Die Interconnect Bridge)" },
    { id: "pk_02", competitor_or_company: "TSMC", technology: "SoIC-X", programme: "AMD Instinct MI300/MI350 3D Stacking", partner: "AMD", packaging_type: "3D Direct Cu-Cu Hybrid Bonding", status: "Volume Production", intel_alternative: "Intel Foveros Direct (hybrid bonding)" },
    { id: "pk_03", competitor_or_company: "Samsung", technology: "I-Cube4 / I-Cube8", programme: "Tenstorrent Blackhole, Mach-1", partner: "Tenstorrent", packaging_type: "2.5D Interposer with 4-8 HBM stacks", status: "Commercial Deployment", intel_alternative: "Intel EMIB" },
    { id: "pk_04", competitor_or_company: "Cerebras", technology: "InFO-SoW Equivalent", programme: "WSE-3 Wafer Scale", partner: "TSMC", packaging_type: "Wafer-Level Integration with Micro-connects", status: "Volume Production", intel_alternative: "Intel Multi-Die Co-Packaging Platform" },
    { id: "pk_05", competitor_or_company: "Intel Foundry", technology: "EMIB & Foveros 3D", programme: "AWS Fabric, Microsoft Maia, Gaudi 3", partner: "AWS, Microsoft", packaging_type: "2.5D Embedded Bridge & 3D Stacking", status: "Active Production Ramp", intel_alternative: "Native Intel Offering" }
  ];

  for (const pt of packagingTracker) {
    await client.execute({
      sql: `INSERT INTO chiplet_packaging_tracker (id, competitor_or_company, technology, programme, partner, packaging_type, status, intel_alternative)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [pt.id, pt.competitor_or_company, pt.technology, pt.programme, pt.partner, pt.packaging_type, pt.status, pt.intel_alternative]
    });
  }

  console.log("Inserting Evidence Repository Records...");
  const evidence = [
    {
      id: "ev_01",
      source_name: "Cerebras SEC S-1 Registration",
      source_url: "https://www.sec.gov/edgar/data/cerebras",
      source_type: "SEC Regulatory Filing",
      title: "Cerebras Systems Inc. Form S-1 Initial Registration",
      publication_date: "2026-09-30",
      event_date: "2026-09-30",
      excerpt: "We currently manufacture our wafer-scale engine and integrate systems solely through Taiwan Semiconductor Manufacturing Company (TSMC). Any disruption, supply constraint, or geopolitical event affecting TSMC would substantially harm our business.",
      evidence_classification: "Confirmed Fact",
      linked_company: "Cerebras Systems",
      linked_event: "Supply Chain Risk Disclosure"
    },
    {
      id: "ev_02",
      source_name: "Intel Newsroom Official Announcement",
      source_url: "https://www.intel.com/content/www/us/en/newsroom/news/intel-aws-collaboration.html",
      source_type: "Official Press Release",
      title: "Intel and AWS Expand Strategic Collaboration for Custom Silicon",
      publication_date: "2026-09-16",
      event_date: "2026-09-16",
      excerpt: "Intel Foundry will manufacture an AI fabric chip for AWS on Intel 18A, the company's latest leading-edge node. Additionally, Intel will produce a custom Xeon 6 chip on Intel 3.",
      evidence_classification: "Confirmed Fact",
      linked_company: "Amazon Web Services (AWS)",
      linked_event: "AWS 18A Foundry Win"
    },
    {
      id: "ev_03",
      source_name: "Meta Engineering Tech Disclosures",
      source_url: "https://about.fb.com/news/2024/04/introducing-our-next-generation-infrastructure-hardware",
      source_type: "Company Technical Blog",
      title: "Developing Next-Generation Custom Silicon: MTIA v2",
      publication_date: "2026-04-10",
      event_date: "2026-04-10",
      excerpt: "MTIA is an essential part of our long-term roadmap to build the most efficient infrastructure for Meta's unique AI workloads. We have designed our second-generation silicon using a 5nm process with advanced 2.5D packaging.",
      evidence_classification: "Confirmed Fact",
      linked_company: "Meta Platforms",
      linked_event: "MTIA v2 Deployment"
    },
    {
      id: "ev_04",
      source_name: "TSMC Q3 2026 Institutional Earnings Call",
      source_url: "https://www.tsmc.com/english/investorRelations/quarterly_results",
      source_type: "Earnings Transcript",
      title: "TSMC Management Remarks on Advanced Packaging and CoWoS Expansion",
      publication_date: "2026-07-18",
      event_date: "2026-07-18",
      excerpt: "We continue to see extremely strong demand for AI processors. Customers are demanding more CoWoS capacity than we can supply. We are expanding our advanced packaging capacity at over 60% CAGR through 2026.",
      evidence_classification: "Confirmed Fact",
      linked_company: "TSMC",
      linked_event: "CoWoS Capacity Doubling"
    },
    {
      id: "ev_05",
      source_name: "Arm Holdings Press Room",
      source_url: "https://www.arm.com/company/news/2024/02/arm-neoverse-css-next-generation",
      source_type: "Official Announcement",
      title: "Arm Neoverse CSS V3 Introduces Turnkey Chiplet Subsystems",
      publication_date: "2026-03-01",
      event_date: "2026-03-01",
      excerpt: "Neoverse CSS V3 brings ready-to-deploy silicon IP with native UCIe support, allowing silicon innovators to pair custom accelerators with Arm CPU chiplets manufactured on advanced nodes including Intel 18A.",
      evidence_classification: "Confirmed Fact",
      linked_company: "Arm Holdings",
      linked_event: "Neoverse CSS & Intel 18A"
    }
  ];

  for (const ev of evidence) {
    await client.execute({
      sql: `INSERT INTO evidence_repository (id, source_name, source_url, source_type, title, publication_date, event_date, excerpt, evidence_classification, linked_company, linked_event)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [ev.id, ev.source_name, ev.source_url, ev.source_type, ev.title, ev.publication_date, ev.event_date, ev.excerpt, ev.evidence_classification, ev.linked_company, ev.linked_event]
    });
  }

  console.log("Inserting Priority Findings & Intel Actions...");
  const findings = [
    {
      id: "pf_01",
      module_type: "Module 1",
      finding_title: "Cerebras Single-Source Concentration Creates Urgent Packaging Need",
      answer_summary: "Cerebras's S-1 filing confirms 100% dependency on TSMC for wafer fab and wafer-scale packaging. Its engineering hiring in packaging and physical design spiked by 460% over 12 months.",
      evidence_summary: "SEC S-1 filing, 28 active packaging/DFT job openings, and public statements on scaling challenges for WSE-4.",
      intel_implication: "Cerebras cannot risk single-source disruption. Intel EMIB/Foveros packaging provides a high-yield multi-die alternative to monolithic wafer scaling.",
      action_tag: "Escalate",
      priority_order: 1
    },
    {
      id: "pf_02",
      module_type: "Module 1",
      finding_title: "AWS Custom Silicon Expanding Beyond In-house Compute to Multi-Die Fabrics",
      answer_summary: "AWS hiring trends indicate intense buildup in multi-die chiplet interconnect (UCIe) and advanced packaging for next-gen Trainium and Graviton architectures.",
      evidence_summary: "Confirmed Intel-AWS 18A co-announcement (Sept 2026), 48 packaging job openings at Annapurna Labs.",
      intel_implication: "Validation of 18A custom silicon agreement opens the door to cross-sell Intel EMIB packaging for custom AI networking fabric dies.",
      action_tag: "Message",
      priority_order: 2
    },
    {
      id: "pf_03",
      module_type: "Module 2",
      finding_title: "TSMC CoWoS Allocation Deficit Leaves Custom ASIC Challengers Stranded",
      answer_summary: "Despite doubling capacity, TSMC's CoWoS lines are locked up by Nvidia and AMD through late 2026. Tier-1 hyperscalers (Meta, ByteDance) and AI startups face 6-9 month packaging queues.",
      evidence_summary: "TSMC Q3 earnings disclosures, Broadcom custom ASIC disclosures, supply chain analyst reports.",
      intel_implication: "Intel's standalone Advanced Packaging Foundry service (Foveros / EMIB) can secure design wins even without winning the front-end wafer fabrication.",
      action_tag: "Campaign",
      priority_order: 3
    },
    {
      id: "pf_04",
      module_type: "Module 2",
      finding_title: "Arm Neoverse CSS on Intel 18A Lowers Hyperscaler Custom CPU Barrier",
      answer_summary: "Arm's integration with Intel 18A and UCIe chiplet standards enables cloud providers (Microsoft, AWS, Google) to build custom server CPUs on Intel Foundry with drastically reduced R&D cycle times.",
      evidence_summary: "Arm Neoverse CSS V3 release notes, Intel Chiplet Alliance public charter.",
      intel_implication: "Drives foundry volume to Intel 18A while neutralizing Arm's threat to x86 by capturing the manufacturing profit pool.",
      action_tag: "Campaign",
      priority_order: 4
    }
  ];

  for (const pf of findings) {
    await client.execute({
      sql: `INSERT INTO priority_findings (id, module_type, finding_title, answer_summary, evidence_summary, intel_implication, action_tag, priority_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [pf.id, pf.module_type, pf.finding_title, pf.answer_summary, pf.evidence_summary, pf.intel_implication, pf.action_tag, pf.priority_order]
    });
  }

  console.log("Database seeded successfully!");
}

seed().catch(err => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
