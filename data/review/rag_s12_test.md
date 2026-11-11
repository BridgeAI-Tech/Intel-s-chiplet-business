# Brief section 12 RAG test — 2026-11-11

Each example question from the brief was asked through Ask Intelligence (`/api/ask`).

## Result

**12 of 12 answers pass every automatic check.**

| Question | Result | Cites ≥2 records | Every source has URL | Every source dated | Evidence class stated | No unsupported intent | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Module 1 Q1 | PASS | yes | yes | yes | yes | yes | 44 |
| Module 1 Q2 | PASS | yes | yes | yes | yes | yes | 21 |
| Module 1 Q3 | PASS | yes | yes | yes | yes | yes | 14 |
| Module 1 Q4 | PASS | yes | yes | yes | yes | yes | 21 |
| Module 1 Q5 | PASS | yes | yes | yes | yes | yes | 37 |
| Module 1 Q6 | PASS | yes | yes | yes | yes | yes | 10 |
| Module 2 Q1 | PASS | yes | yes | yes | yes | yes | 15 |
| Module 2 Q2 | PASS | yes | yes | yes | yes | yes | 30 |
| Module 2 Q3 | PASS | yes | yes | yes | yes | yes | 22 |
| Module 2 Q4 | PASS | yes | yes | yes | yes | yes | 22 |
| Module 2 Q5 | PASS | yes | yes | yes | yes | yes | 20 |
| Module 2 Q6 | PASS | yes | yes | yes | yes | yes | 11 |

## Module 1 Q1. Which companies show the strongest evidence of building custom-silicon capabilities?

Based on the records, hyperscalers **Microsoft**, **Meta**, and **AWS**—alongside **Tesla** and custom-platform providers **Broadcom**, **Marvell**, and **Arm**—show the strongest evidence of building custom-silicon capabilities through deployed chips, multi-generation roadmaps, and active engineering vacancies [S1, S7, S36, S42, S47, S57, S76].

**Key findings**
- **Microsoft**: Confirmed facts show Microsoft deployed its TSMC 3nm Maia 200 AI chip, Arm-based Cobalt 200 CPU, and an in-house security chip, alongside a multi-chiplet TSMC N2P Maia 300 planned for 2027 [S32, S36, S38, S52, S70]. It also listed 187 silicon job vacancies (not confirmed hires) across verification, physical design, RTL, architecture, and sourcing [S76, S78, S81, S85, S86].
- **Meta**: Confirmed facts show Meta detailed its multi-chiplet MTIA 300 and MTIA 400 accelerators and co-developed the Arm AGI CPU [S17, S33, S42]. Press-released intents include the 2027 MTIA 500 and a multi-gigawatt Broadcom co-development partnership, paired with 135 silicon vacancies [S31, S34, S77, S82, S83, S84, S92].
- **AWS**: Confirmed facts establish AWS deployed its 3nm Trainium3, Arm-based Graviton5, and Nitro custom silicon using Synopsys EDA tools [S47, S50, S63, S75]. Press-released intents detail Trainium4 for 2027 with NVIDIA NVLink Fusion integration, alongside 108 silicon vacancies [S40, S49, S80, S87, S88, S89, S90, S91].
- **Tesla**: Confirmed facts show Tesla taped out its AI5 chip on Samsung's 2nm process, also uses TSMC for AI5, and continues Dojo 3 development [S46, S57, S58]. Press-released intents target 2027/2028 production for AI5/AI6 and a $20B TeraFab, with 39 manufacturing/bring-up vacancies [S39, S41, S60, S79].
- **Broadcom, Marvell, and Arm**: Confirmed facts show Broadcom and Marvell provide custom XPU/ASIC platforms (with Marvell developing down to 2nm), while Arm built an end-to-end operations organization to deliver production silicon [S1, S6, S7].

**Implications for Intel**
Press-released intents confirm existing Intel relationships with two of the most active custom-silicon builders: Microsoft plans to produce a chip design on the Intel 18A process [S97], and AWS has a multi-year, multi-billion-dollar collaboration with Intel encompassing 18A and a custom Xeon 6 chip on Intel 3 [S96].

**Cited sources:**

- [S1] Broadcom · 2025-12-18 · confirmed_fact · [Broadcom Custom Silicon Solutions and custom XPUs for AI and high-performance computing](https://www.sec.gov/Archives/edgar/data/1730168/000173016825000121/avgo-20251102.htm)
- [S6] Arm · 2026-07-16 · confirmed_fact · [Arm establishes operations organization and supply chain to deliver production silicon](https://newsroom.arm.com/blog/inside-arms-transition-from-ip-to-silicon)
- [S7] Marvell · 2026-03-11 · confirmed_fact · [Custom ASIC platform, advanced packaging, and 5nm, 3nm, and 2nm designs](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000011/mrvl-20260131.htm)
- [S17] Arm · 2026-03-24 · confirmed_fact · [Meta serves as lead partner and co-developer for Arm AGI CPU](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000050/exhibit991-march24finalarm.htm)
- [S31] Meta · 2027 · press_released_intent · [Meta announces MTIA 500 multi-chiplet AI accelerator scheduled for mass deployment in 2027](https://ai.meta.com/blog/meta-mtia-scale-ai-chips-for-billions/)
- [S32] Microsoft · 2027 · press_released_intent · [Microsoft announces third-generation Maia 300 in-house AI chip on TSMC N2P with chiplet architecture](https://www.theverge.com/news/1009465/microsoft-maia-300-chip-improvements-rollout)
- [S33] Meta · 2026-08-25 · confirmed_fact · [Meta details MTIA 400 inference accelerator with multi-chiplet package, RISC-V cores, and HBM3e](https://www.servethehome.com/metas-mtia-custom-ai-silicon-at-hot-chips-2026/)
- [S34] Meta · 2026-04-15 · press_released_intent · [Meta partners with Broadcom to develop multiple generations of MTIA chips](https://www.datacenterdynamics.com/en/news/meta-partners-with-broadcom-for-development-of-multiple-generations-of-mtia-chips/)
- [S36] Microsoft · 2026-01-26 · confirmed_fact · [Microsoft introduces Maia 200 AI inference accelerator fabricated on TSMC 3nm process](https://blogs.microsoft.com/blog/2026/01/26/maia-200-the-ai-accelerator-built-for-inference/)
- [S38] Microsoft · 2025-11-18 · confirmed_fact · [Microsoft announces Azure Cobalt 200 CPU built on Arm Neoverse CSS V3](https://newsroom.arm.com/blog/microsoft-azure-cobalt-200-arm-neoverse-css-v3)
- [S39] Tesla · 2028 · press_released_intent · [Tesla progresses development of custom-designed AI6 inference chip with production planned for 2028](https://assets-ir.tesla.com/tesla-contents/IR/TSLA-Q4-2025-Update.pdf)
- [S40] AWS · 2027 · press_released_intent · [AWS discloses Trainium4 capabilities and 2027 expected delivery](https://press.aboutamazon.com/2026/2/openai-and-amazon-announce-strategic-partnership)
- [S41] Tesla · 2027 · press_released_intent · [Tesla progresses development of custom-designed AI5 inference chip with production planned for 2027](https://assets-ir.tesla.com/tesla-contents/IR/TSLA-Q4-2025-Update.pdf)
- [S42] Meta · 2026-08-25 · confirmed_fact · [Meta details MTIA 300 DLRM training accelerator architecture at Hot Chips 2026](https://www.servethehome.com/metas-mtia-custom-ai-silicon-at-hot-chips-2026/)
- [S46] Tesla · 2026-01-20 · confirmed_fact · [Tesla AI5 chip design is in good shape and made by TSMC](https://techcrunch.com/2026/01/20/elon-musk-says-teslas-restarted-dojo3-will-be-for-space-based-ai-compute/)
- [S47] AWS · 2025-12-04 · confirmed_fact · [AWS integrates Graviton, Nitro, and Trainium3 custom chips on unified Trainium3 compute sled](https://newsroom.arm.com/blog/arm-converged-ai-data-center-aws-graviton5)
- [S49] AWS · 2025-12-02 · press_released_intent · [AWS collaborates with NVIDIA to integrate Trainium4, Graviton CPUs and EFAs with NVIDIA NVLink Fusion](https://developer.nvidia.com/blog/aws-integrates-ai-infrastructure-with-nvidia-nvlink-fusion-for-trainium4-deployment/)
- [S50] AWS · 2025-12-02 · confirmed_fact · [AWS announces general availability of Amazon EC2 Trn3 UltraServers powered by 3nm Trainium3 AI chip](https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-ec2-trn3-ultraservers/)
- [S52] Microsoft · 2026-10-13 · confirmed_fact · [Microsoft integrates in-house security chip Azure Integrated HSM in all new datacenter servers](https://azure.microsoft.com/en-us/blog/infrastructure-for-the-frontier-era-scaling-intelligence-through-open-industry-collaboration/)
- [S57] Tesla · 2026-07-13 · confirmed_fact · [Tesla AI5 chip reaches tape-out at Samsung Foundry on 2nm process](https://www.tomshardware.com/tech-industry/artificial-intelligence/teslas-ai5-with-2nm-class-node-tapes-out-at-samsung-foundry-production-starts-soon-months-after-tsmc-tape-out)
- [S58] Tesla · 2026-04-22 · confirmed_fact · [Tesla continues custom silicon development with Dojo 3](https://ir.tesla.com/_flysystem/s3/sec/000162828026026551/tsla-20260422-gen.pdf)
- [S60] Tesla · 2026-04-07 · press_released_intent · [SpaceX, xAI, and Tesla plan $20bn TeraFab factory to build AI16 and D3 chips](https://www.datacenterdynamics.com/en/news/anant-nivarti-rejoins-tesla-to-lead-silicon-engineering-including-ai6-and-dojo-3/)
- [S63] AWS · 2026-10-26 · confirmed_fact · [AWS ↔ Synopsys](https://www.synopsys.com/blogs/chip-design/vcs-delivers-faster-verification-aws-graviton5.html)
- [S70] Microsoft · 2026-10-12 · confirmed_fact · [Microsoft ↔ TSMC](https://azure.microsoft.com/en-us/blog/deep-dive-into-azure-maia-300-architecture/)
- [S75] AWS · 2026-06-10 · confirmed_fact · [AWS ↔ Arm](https://aws.amazon.com/blogs/aws/now-available-amazon-ec2-m9g-and-m9gd-instances-powered-by-new-aws-graviton5-processors/)
- [S76] Microsoft · 2026-11-08 · n/a · [Microsoft: 80 silicon postings in verification_validation](https://apply.careers.microsoft.com/careers/job/1970393557054107?hl=en)
- [S77] Meta · 2026-11-05 · n/a · [Meta: 58 silicon postings in verification_validation](https://www.metacareers.com/profile/job_details/1825002068624801)
- [S78] Microsoft · 2026-11-04 · n/a · [Microsoft: 40 silicon postings in physical_design](https://apply.careers.microsoft.com/careers/job/1970393557054124?hl=en)
- [S79] Tesla · 2026-09-29 · n/a · [Tesla: 39 silicon postings in manufacturing_bringup_product](https://www.linkedin.com/jobs/view/4481766520/)
- [S80] AWS · 2026-11-01 · n/a · [AWS: 37 silicon postings in verification_validation](https://www.amazon.jobs/en/jobs/10594018/chip-validation-software-student)
- [S81] Microsoft · 2026-11-09 · n/a · [Microsoft: 29 silicon postings in rtl_logic_design](https://apply.careers.microsoft.com/careers/job/1970393556867397?hl=en)
- [S82] Meta · 2026-11-04 · n/a · [Meta: 24 silicon postings in rtl_logic_design](https://www.metacareers.com/profile/job_details/1883872846321140)
- [S83] Meta · 2026-11-10 · n/a · [Meta: 22 silicon postings in architecture_system_design](https://www.metacareers.com/profile/job_details/1560905132724186)
- [S84] Meta · 2026-10-29 · n/a · [Meta: 21 silicon postings in physical_design](https://www.metacareers.com/jobs/1823027662342331)
- [S85] Microsoft · 2026-10-23 · n/a · [Microsoft: 20 silicon postings in architecture_system_design](https://www.linkedin.com/jobs/view/4446590142/)
- [S86] Microsoft · 2026-10-23 · n/a · [Microsoft: 18 silicon postings in sourcing_supplier_mgmt](https://microsoft.eightfold.ai/careers/job/1970393557045747)
- [S87] AWS · 2026-10-23 · n/a · [AWS: 17 silicon postings in rtl_logic_design](https://www.amazon.jobs/en/jobs/10584934/chip-design-engineer-nitro-team)
- [S88] AWS · 2026-10-22 · n/a · [AWS: 16 silicon postings in physical_design](https://www.amazon.jobs/en/jobs/10588281/physical-design-engineer)
- [S89] AWS · 2026-10-18 · n/a · [AWS: 15 silicon postings in architecture_system_design](https://www.amazon.jobs/en/jobs/10586201/principal-software-engineer)
- [S90] AWS · 2026-10-29 · n/a · [AWS: 12 silicon postings in manufacturing_bringup_product](https://www.amazon.jobs/en/jobs/10592136/senior-equipment-engineer-annapurna-labs)
- [S91] AWS · 2026-10-30 · n/a · [AWS: 11 silicon postings in packaging_integration](https://www.amazon.jobs/en/jobs/10591564/thermal-mechanical-engineer-annapurna-labs-ai-silicon-packaging)
- [S92] Meta · 2026-10-28 · n/a · [Meta: 10 silicon postings in sourcing_supplier_mgmt](https://www.metacareers.com/profile/job_details/3333103890230916)
- [S96] AWS · 2024-09-16 · press_released_intent · [AWS — existing_relationship](https://press.aboutamazon.com/aws/2024/9/intel-and-aws-expand-strategic-collaboration-helping-advance-u-s-based-chip-manufacturing)
- [S97] Microsoft · 2024-02-21 · press_released_intent · [Microsoft — existing_relationship](https://www.intel.com/content/www/us/en/newsroom/news/foundry-news-roadmaps-updates.html)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 1 Q2. What changes have occurred in engineering hiring and role mix over the last 12 months?

The provided records do not measure period-over-period changes in hiring volume or role mix because prior-year baseline data is missing. However, hiring aggregates (which represent vacancies, not confirmed hires) from November 2025 to November 2026 show silicon engineering demand concentrated in verification, physical design, and manufacturing bring-up, alongside confirmed M&A-driven engineering additions [S7, S32, S35].

**Key findings**
- **Verification and validation dominance**: Unconfirmed vacancy aggregates between late 2025 and November 2026 show verification and validation as the largest category for Microsoft (102 postings), Meta (57), AWS (43), and Cerebras (13) [S32, S34, S36].
- **Microsoft role mix**: Across 227 tracked silicon vacancies, Microsoft's demand beyond verification (102) focuses on physical design (64) and RTL/logic design (29) [S32, S33, S37], plus packaging integration (15), DFT/test (9), and sourcing (8) [S43, S49, S51].
- **AWS and Meta role mix**: Meta's remaining vacancies span RTL/logic design (25), physical design (22), and architecture (11) [S38, S39, S48]. AWS's remaining vacancies are split across physical design (17), manufacturing bring-up (15), RTL (15), architecture (13), and packaging (12) [S40, S41, S42].
- **Tesla manufacturing focus**: As a confirmed fact, Tesla began recruiting for its "Terafab" project, posting nine advanced chipmaking roles in Taiwan and a fab infrastructure manager role [S18, S27], alongside 52 tracked manufacturing/bring-up vacancies [S35].
- **Competitor M&A talent additions**: Confirmed facts show Arm acquired DreamBig's networking engineering expertise and Marvell acquired Polariton's silicon photonics team [S6, S7]. As press-released intent, Marvell also agreed to acquire XConn's switching engineering team [S1, S10].

**Implications for Intel**
Not established from the records.

**Cited sources:**

- [S1] Marvell · 2026-02-10 · press_released_intent · [Marvell Advances UALink Scale-Up Switching Roadmap with XConn Technology](https://investor.marvell.com/news-events/press-releases/detail/1007/marvell-completes-acquisition-of-xconn-technologies)
- [S6] Arm · 2026-07-01 · confirmed_fact · [Arm completes acquisition of DreamBig Semiconductor, Inc.](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000114/arm-20260630.htm)
- [S7] Marvell · 2026-04-22 · confirmed_fact · [Marvell Announces Acquisition of Polariton Technologies](https://investor.marvell.com/news-events/press-releases/detail/1020/marvell-announces-acquisition-of-polariton-technologies-advancing-optical-performance-scaling-to-3-2t-and-beyond)
- [S10] Marvell · 2026-01-06 · press_released_intent · [Marvell enters definitive agreement to acquire XConn Technologies](https://investor.marvell.com/news-events/press-releases/detail/1004/marvell-to-acquire-xconn-technologies-expanding-leadership-in-ai-data-center-connectivity)
- [S18] Tesla · 2026-04-17 · confirmed_fact · [Tesla posts nine semiconductor engineering roles in Taiwan for Terafab project](https://www.reuters.com/business/autos-transportation/tesla-seeks-taiwan-chip-engineers-terafab-project-2026-04-17/)
- [S27] Tesla · 2026-03-19 · confirmed_fact · [Tesla hiring Technical Program Manager for semiconductor infrastructure and Terafab project](https://www.tomshardware.com/tech-industry/semiconductors/tesla-hiring-semiconductor-fabs-construction-manager-elon-musks-ambitious-terafab-project-begins)
- [S32] Microsoft · 2026-11-08 · n/a · [Microsoft: 102 silicon postings in verification_validation](https://apply.careers.microsoft.com/careers/job/1970393557054107?hl=en)
- [S33] Microsoft · 2026-11-09 · n/a · [Microsoft: 64 silicon postings in physical_design](https://apply.careers.microsoft.com/careers/job/1970393557054124?hl=en)
- [S34] Meta · 2026-11-05 · n/a · [Meta: 57 silicon postings in verification_validation](https://www.metacareers.com/profile/job_details/1825002068624801)
- [S35] Tesla · 2026-10-20 · n/a · [Tesla: 52 silicon postings in manufacturing_bringup_product](https://www.linkedin.com/jobs/view/4481766520/)
- [S36] AWS · 2026-11-01 · n/a · [AWS: 43 silicon postings in verification_validation](https://www.amazon.jobs/en/jobs/10594018/chip-validation-software-student)
- [S37] Microsoft · 2026-11-09 · n/a · [Microsoft: 29 silicon postings in rtl_logic_design](https://apply.careers.microsoft.com/careers/job/1970393556867397?hl=en)
- [S38] Meta · 2026-11-04 · n/a · [Meta: 25 silicon postings in rtl_logic_design](https://www.metacareers.com/profile/job_details/1883872846321140)
- [S39] Meta · 2026-10-29 · n/a · [Meta: 22 silicon postings in physical_design](https://www.metacareers.com/jobs/1823027662342331)
- [S40] AWS · 2026-10-25 · n/a · [AWS: 17 silicon postings in physical_design](https://www.amazon.jobs/en/jobs/10588281/physical-design-engineer)
- [S41] AWS · 2026-10-29 · n/a · [AWS: 15 silicon postings in manufacturing_bringup_product](https://www.amazon.jobs/en/jobs/10592136/senior-equipment-engineer-annapurna-labs)
- [S42] AWS · 2026-10-23 · n/a · [AWS: 15 silicon postings in rtl_logic_design](https://www.amazon.jobs/en/jobs/10584934/chip-design-engineer-nitro-team)
- [S43] Microsoft · 2026-10-30 · n/a · [Microsoft: 15 silicon postings in packaging_integration](https://www.linkedin.com/jobs/view/4477675712/)
- [S48] Meta · 2026-10-09 · n/a · [Meta: 11 silicon postings in architecture_system_design](https://www.metacareers.com/profile/job_details/1560905132724186)
- [S49] Microsoft · 2026-11-04 · n/a · [Microsoft: 9 silicon postings in dft_test](https://microsoft.eightfold.ai/careers/job/1970393556998676)
- [S51] Microsoft · 2026-10-19 · n/a · [Microsoft: 8 silicon postings in sourcing_supplier_mgmt](https://microsoft.eightfold.ai/careers/job/1970393557045747)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 1 Q3. Which companies show evidence of moving from early development towards external ecosystem engagement?

Several companies—specifically Microsoft, Meta, AWS, AMD, and Marvell/Mojo Vision—show evidence of transitioning internal or early-stage silicon and interconnect developments into external ecosystem, open-source, or commercial engagements [S1, S7, S38, S39, S47, S56]. 

**Key findings**
- **Microsoft:** Confirmed facts show Microsoft evolved its internal Azure Integrated HSM architecture into Project Tessera, an open-source silicon initiative with Marvell, Oracle, and OCP [S37, S38]. Additionally, Microsoft has 7 open sourcing and supplier management job vacancies (not confirmed hires) [S74].
- **Meta:** As confirmed facts, Meta open-sourced its internal RCCLX GPU communications library for AMD platforms and partnered with NVIDIA and cloud providers to standardize its Flattened Planar Fabric [S39, S56]. Meta also posted 5 sourcing/supplier management and 6 manufacturing/bringup job vacancies [S75, S78].
- **AWS:** Press-released intent indicates AWS is in early-stage talks to sell its internal Trainium AI chips externally to third parties [S47]. Confirmed facts also show AWS and Cerebras partnering on heterogeneous disaggregated inference [S41].
- **AMD:** Press-released intent shows AMD developing its Helion AI rack blueprint with ecosystem partners to contribute to OCP [S1]. Confirmed facts also show AMD collaborating with ASE and SPIL to qualify 2.5D EFB packaging for "Venice" CPUs [S5].
- **Marvell & Mojo Vision:** A confirmed fact establishes that after over a year of development, the companies entered a multi-generational agreement to provide micro-LED optical interconnects to hyperscale customers [S7].
- **Arm:** As press-released intent, Arm is engaging ecosystem partners to explore moving beyond IP into chiplets and complete chip solutions [S4].

**Implications for Intel**
Press-released intent from September 2024 establishes an existing multi-year, multi-billion-dollar collaboration between Intel and AWS for 18A and Custom Xeon 6 chips on Intel 3 [S88]. No other implications for Intel are established from the records.

**Cited sources:**

- [S1] AMD · 2026-11 · press_released_intent · [AMD introduces AMD Helion agentic AI rack blueprint](https://ir.amd.com/news-events/press-releases/detail/1301/introducing-amd-helion-agentic-ai-compute-at-rack-scale)
- [S4] Arm · 2026-05-26 · press_released_intent · [Arm plans to explore and develop RTL-based CSSs, GDSII-based CSSs, chiplets and complete chip solutions](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000097/arm-20260331.htm)
- [S5] AMD · 2026-05-21 · confirmed_fact · [AMD collaborates with ASE and SPIL to develop and qualify wafer-based 2.5D EFB packaging for Venice CPUs](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S7] Marvell · 2026-03-12 · confirmed_fact · [Marvell and Mojo Vision enter multi-generational agreement to develop micro-LED optical interconnects](https://investor.marvell.com/news-events/press-releases/detail/1012/marvell-and-mojo-vision-collaborate-to-develop-next-generation-high-density-micro-led-connectivity-solutions)
- [S37] Microsoft · 2026-10-13 · confirmed_fact · [Microsoft, Marvell, and Oracle introduce open-source Tessera Integrated HSM initiative](https://azure.microsoft.com/en-us/blog/infrastructure-for-the-frontier-era-scaling-intelligence-through-open-industry-collaboration/)
- [S38] Microsoft · 2026-10-13 · confirmed_fact · [Microsoft announces Project Tessera open-source Integrated HSM initiative with Marvell, Oracle, and OCP](https://azure.microsoft.com/en-us/blog/advancing-hardware-security-with-open-source-integrated-hsm-technology/)
- [S39] Meta · 2026-10-12 · confirmed_fact · [Meta collaborated with NVIDIA on Flattened Planar Fabric using NVIDIA Spectrum-X Multiplane](https://engineering.fb.com/2026/10/12/open-source/ocp-summit-2026-powering-ai-with-open-innovations-in-scale-up-scale-out-and-scale-across-networks/)
- [S41] Cerebras · 2026-08-19 · confirmed_fact · [Cerebras works with AMD and AWS Trainium on disaggregated inference for CS-4](https://newsletter.semianalysis.com/p/cerebrass-next-generation-cs-4-fast)
- [S47] AWS · 2026-06-18 · press_released_intent · [AWS in early-stage talks to sell Trainium AI chips to other companies](https://techcrunch.com/2026/06/18/amazon-hopes-to-challenge-nvidia-more-directly-by-selling-its-ai-chips/)
- [S56] Meta · 2026-02-24 · confirmed_fact · [Meta open-sources RCCLX GPU communications library optimized for AMD Instinct MI300X and MI300/MI350 GPUs](https://engineering.fb.com/2026/02/24/data-center-engineering/rrcclx-innovating-gpu-communications-amd-platforms-meta/)
- [S74] Microsoft · 2026-10-23 · n/a · [Microsoft: 7 silicon postings in sourcing_supplier_mgmt](https://microsoft.eightfold.ai/careers/job/1970393557045747)
- [S75] Meta · 2026-10-06 · n/a · [Meta: 6 silicon postings in manufacturing_bringup_product](https://www.metacareers.com/profile/job_details/939474918844068)
- [S78] Meta · 2026-10-28 · n/a · [Meta: 5 silicon postings in sourcing_supplier_mgmt](https://www.metacareers.com/profile/job_details/3333103890230916)
- [S88] AWS · 2024-09-16 · press_released_intent · [AWS — existing_relationship](https://press.aboutamazon.com/aws/2024/9/intel-and-aws-expand-strategic-collaboration-helping-advance-u-s-based-chip-manufacturing)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 1 Q4. What supplier relationships have been identified, and what is their reported status?

The records identify active supplier relationships (confirmed facts) and planned collaborations (press-released intents) across wafer foundry, memory, packaging, and custom silicon [S2, S5, S10]. TSMC and Samsung are primary active foundries, while Intel holds existing press-released relationships with AWS and Microsoft [S10, S87, S88].

**Key findings**
- **TSMC foundry dominance**: Confirmed facts show TSMC is the sole advanced-node wafer supplier for Marvell (including 3nm) and Cerebras, and produces all ≤7nm CPU/GPU wafers for AMD alongside wafers for NVIDIA and Tesla [S5, S10, S14]. Microsoft's press-released intent plans Maia 300 compute chiplets on TSMC N2P for 2027 [S43, S44].
- **Samsung Foundry and memory**: Confirmed facts show Samsung supplies wafers and memory to NVIDIA and Tesla, and taped out Tesla's 2nm AI5 chip [S10, S41, S51]. Press-released intents include a >$200B Broadcom MOU (HBM, 2nm, 2.3D/2.5D packaging) and foundry discussions with AMD [S2, S9].
- **Other foundry, OSAT, and substrate suppliers**: Confirmed facts show AMD uses GlobalFoundries (>7nm agreement through 2026) and UMC [S13, S14], while NVIDIA uses TSMC CoWoS, OSATs Hon Hai, Wistron, and Fabrinet, and added Samsung Electro-Mechanics for substrates [S10, S20]. Cerebras announced a press-released intent with Flex to scale CS-3 production [S65].
- **Memory partnerships**: Confirmed facts establish NVIDIA sources memory from SK Hynix, Micron, and Samsung, while Tesla also sources from Micron [S10, S41]. NVIDIA and SK Hynix signed a press-released letter of intent to codevelop next-generation AI memory and HBM [S7].
- **Hyperscaler custom and merchant silicon**: Confirmed facts show Meta partners with AWS (deploying Graviton), AMD, and NVIDIA, while Microsoft deploys NVIDIA GB300 and Vera Rubin systems [S38, S54, S74]. Press-released intents cover Broadcom co-developing Meta's MTIA chips and supplying XPUs for Anthropic, plus AWS supplying Trainium to OpenAI and Anthropic [S18, S50, S56].
- **Intel foundry relationships**: Existing relationships recorded as press-released intents include a multi-year AWS collaboration for 18A and a Custom Xeon 6 chip on Intel 3, and Microsoft's plan to produce a chip design on Intel 18A [S87, S88].

**Implications for Intel**
Intel has established press-released intents with AWS (Intel 18A and Intel 3) and Microsoft (Intel 18A) [S87, S88]. No further Intel opportunities are established from the records.

**Cited sources:**

- [S2] Samsung Foundry · 2026-07-25 · press_released_intent · [Samsung Electronics and Broadcom sign MOU for memory, HBM, 2nm foundry, and 2.3D/2.5D advanced packaging collaboration](https://news.samsung.com/global/samsung-electronics-and-broadcom-expand-strategic-collaboration-across-memory-and-foundry-technologies)
- [S5] Marvell · 2026-08-28 · confirmed_fact · [TSMC is Marvell's sole wafer supplier for advanced node products including 3nm](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000025/mrvl-20260801.htm)
- [S7] NVIDIA · 2026-07-24 · press_released_intent · [NVIDIA and SK hynix establish partnership to secure and codevelop next-generation AI memory including HBM](https://nvidianews.nvidia.com/news/sk-group-and-nvidia-expand-strategic-partnership-across-ai-factories-and-next-generation-memory)
- [S9] Samsung Foundry · 2026-03-18 · press_released_intent · [Samsung and AMD to discuss opportunities for foundry partnership](https://news.samsung.com/global/samsung-and-amd-expand-strategic-collaboration-on-next-generation-ai-memory-solutions)
- [S10] NVIDIA · 2026-02-25 · confirmed_fact · [NVIDIA utilizes TSMC and Samsung for wafer fabrication, CoWoS for packaging, and SK Hynix, Micron, and Samsung for memory](https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm)
- [S13] AMD · 2025-11-05 · confirmed_fact · [AMD wafer supply agreement with GF through 2026](https://www.sec.gov/Archives/edgar/data/2488/000000248825000166/amd-20250927.htm)
- [S14] AMD · 2025-11-05 · confirmed_fact · [AMD discloses foundry relationships with TSMC, GLOBALFOUNDRIES, UMC and Samsung](https://www.sec.gov/Archives/edgar/data/2488/000000248825000166/amd-20250927.htm)
- [S18] Broadcom · 2026-10-26 · press_released_intent · [Purchase and Lease of Broadcom XPU AI Accelerators and Networking Solutions for Anthropic](https://www.prnewswire.com/news-releases/bank-of-america-blackstone-citi-and-morgan-stanley-announce-landmark-63-billion-financing-structure-to-enable-ai-compute-capacity-in-partnership-with-broadcom-302919849.html)
- [S20] NVIDIA · 2026-10-21 · confirmed_fact · [Samsung Electro-Mechanics joins NVIDIA substrate supply chain and expands South Korea facilities](https://nvidianews.nvidia.com/news/nvidia-and-supply-chain-partners-expand-capacity-to-accelerate-ai-infrastructure-buildout)
- [S38] Meta · 2026-06-10 · confirmed_fact · [Meta announced chip supply partnerships with AWS, AMD, and NVIDIA](https://about.fb.com/news/2026/06/what-is-compute-power-meta-ai-infrastructure/)
- [S41] Tesla · 2026-03-23 · confirmed_fact · [Tesla, SpaceX, and xAI to continue sourcing chips from TSMC, Samsung, and Micron](https://www.trendforce.com/news/2026/03/23/news-musks-terafab-vision-raises-questions-over-tsmc-impact-advanced-packaging-may-be-best-entry-point/)
- [S43] Microsoft · 2027 · press_released_intent · [Microsoft announces Azure Maia 300 architecture with HBM4, multi-chiplet design, and TSMC N2P](https://blogs.microsoft.com/blog/2026/10/12/microsoft-to-expand-azure-maia-system-to-multi-gigawatt-deployments/)
- [S44] Microsoft · 2027 · press_released_intent · [Microsoft announces third-generation Maia 300 in-house AI chip on TSMC N2P with chiplet architecture](https://www.theverge.com/news/1009465/microsoft-maia-300-chip-improvements-rollout)
- [S50] AWS · 2026-07-30 · confirmed_fact · [Trainium secures multi-year commitments and customer adoption](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000024/amzn-20260630xex991.htm)
- [S51] Tesla · 2026-07-13 · confirmed_fact · [Tesla AI5 chip reaches tape-out at Samsung Foundry on 2nm process](https://www.tomshardware.com/tech-industry/artificial-intelligence/teslas-ai5-with-2nm-class-node-tapes-out-at-samsung-foundry-production-starts-soon-months-after-tsmc-tape-out)
- [S54] AWS · 2026-04-24 · confirmed_fact · [Meta signs agreement with AWS to deploy Graviton processors](https://press.aboutamazon.com/aws/2026/4/meta-signs-agreement-with-aws-to-power-agentic-ai-on-amazons-graviton-chips)
- [S56] Meta · 2026-04-14 · press_released_intent · [Meta expands partnership with Broadcom to co-develop next-generation MTIA custom AI silicon](https://about.fb.com/news/2026/04/meta-partners-with-broadcom-to-co-develop-custom-ai-silicon/)
- [S65] Cerebras · 2026-07-09 · press_released_intent · [Cerebras ↔ Flex](https://www.cerebras.ai/press-release/flex-and-cerebras-expand-partnership-to-scale-american-manufacturing-of-cerebras-ai)
- [S74] Microsoft · 2026-08-22 · confirmed_fact · [Microsoft ↔ Nvidia](https://www.linkedin.com/feed/update/urn:li:activity:7496695637644828672/)
- [S87] AWS · 2024-09-16 · press_released_intent · [AWS — existing_relationship](https://press.aboutamazon.com/aws/2024/9/intel-and-aws-expand-strategic-collaboration-helping-advance-u-s-based-chip-manufacturing)
- [S88] Microsoft · 2024-02-21 · press_released_intent · [Microsoft — existing_relationship](https://www.intel.com/content/www/us/en/newsroom/news/foundry-news-roadmaps-updates.html)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 1 Q5. Which companies have announced relevant technology or silicon-development milestones?

Microsoft, AWS, Meta, Tesla, Cerebras, AMD, NVIDIA, Broadcom, Marvell, Arm, TSMC, and Samsung Foundry have announced relevant technology or silicon-development milestones across confirmed production deployments, tape-outs, and press-released roadmap plans [S3, S28, S29].

**Key findings**
- **Microsoft**: Confirmed full production of its TSMC 3nm Maia 200 AI accelerator and Arm-based Cobalt 200 CPU [S44, S48, S71], while announcing press-released intent to deploy the multi-chiplet Maia 300 on TSMC N2P in 2027 [S31, S72].
- **AWS**: Confirmed general availability of 3nm Trainium3 UltraServers (fabricated by TSMC) and custom Intel Xeon 6 instances [S43, S49, S66], alongside press-released intent to develop Trainium4 integrating NVIDIA NVLink Fusion [S42].
- **Meta**: Confirmed multi-chiplet architectures for its MTIA 300 (3nm/5nm) and MTIA 400 accelerators [S35, S51], and announced press-released intent for a 2027 MTIA 500 rollout and multi-generation Broadcom co-development [S32, S33].
- **Tesla**: Confirmed finalizing AI5 development—reaching 2nm tape-out at Samsung Foundry with TSMC also producing a version—and continuing Dojo 3 [S41, S57, S60], with press-released plans for AI5 (2027), AI6 (2028), and AI7 [S45, S46, S58].
- **Cerebras & AMD**: Confirmed 5nm TSMC production for Cerebras's WSE-3 and the launch of WSE-3T, plus press-released intent for 3D DRAM-stacked CS-6 systems [S36, S54, S59]; AMD confirmed qualifying 2.5D EFB packaging with ASE, SPIL, and PTI for Venice CPUs [S18, S19].
- **Ecosystem suppliers (NVIDIA, Broadcom, Marvell, Arm)**: Confirmed NVIDIA's NVLink Fusion chiplet platform and Vera Rubin [S3, S12], Marvell's 5nm PCIe 6 retimers [S13], and Arm's CSS V3 and C2C protocols [S23, S24], plus press-released packaging and optics expansions with Amkor, Samsung, Lumentum, and Coherent [S5, S16, S21, S29].

**Implications for Intel**
Confirmed facts show AWS has deployed custom Intel Xeon 6 processors in EC2 M8in, M8ib, and T8i instances [S49, S56]. Furthermore, press-released intents establish multi-year collaborations for AWS to use Intel 18A and Intel 3, and for Microsoft to produce a chip design on Intel 18A [S96, S97].

**Cited sources:**

- [S3] NVIDIA · 2026-08-31 · confirmed_fact · [NVIDIA details NVLink Fusion platform for multi-die custom XPU development](https://nvidianews.nvidia.com/news/nvidia-and-mediatek-deepen-long-standing-partnership-to-build-ai-edge-to-cloud-computing-platforms)
- [S5] Marvell · 2026-11-02 · press_released_intent · [Marvell enters definitive agreement to acquire Lumentum](https://investor.marvell.com/news-events/press-releases/detail/1040/marvell-and-lumentum-to-combine-creating-a-category-leader-in-ai-connectivity)
- [S12] NVIDIA · 2026-01-06 · confirmed_fact · [NVIDIA announces Arm-based Vera Rubin AI platform at CES 2026](https://newsroom.arm.com/blog/arm-rubin-converged-ai-datacenter)
- [S13] Marvell · 2025-12-09 · confirmed_fact · [Marvell announces availability and industry adoption of 5nm Alaska P PCIe 6 retimer product line](https://investor.marvell.com/news-events/press-releases/detail/1001/marvell-announces-adoption-of-its-pcie-retimers-by-leading-ai-and-data-center-infrastructure-providers)
- [S16] NVIDIA · 2026-10-21 · press_released_intent · [NVIDIA and Amkor plan over 300% increase in South Korea interposer wafer capacity](https://nvidianews.nvidia.com/news/nvidia-and-supply-chain-partners-expand-capacity-to-accelerate-ai-infrastructure-buildout)
- [S18] AMD · 2026-05-21 · confirmed_fact · [AMD collaborates with ASE and SPIL to develop and qualify wafer-based 2.5D EFB packaging for Venice CPUs](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S19] AMD · 2026-05-21 · confirmed_fact · [AMD and PTI qualify 2.5D panel-based EFB interconnect](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S21] NVIDIA · 2026-03-02 · press_released_intent · [NVIDIA and Coherent Announce Multiyear Strategic Agreement for Optics and Silicon Photonics](https://nvidianews.nvidia.com/news/nvidia-and-coherent-announce-strategic-partnership-to-develop-optics-technology-to-scale-next-generation-data-center-architecture)
- [S23] Arm · 2025-11-18 · confirmed_fact · [Arm collaborates with Microsoft on Cobalt 200 as first publicly announced Neoverse CSS V3 implementation](https://newsroom.arm.com/blog/microsoft-azure-cobalt-200-arm-neoverse-css-v3)
- [S24] Arm · 2025-11-17 · confirmed_fact · [Arm extends Neoverse platform with NVIDIA NVLink Fusion and AMBA CHI C2C compatibility](https://newsroom.arm.com/news/arm-neoverse-nvidia-nvlink)
- [S28] TSMC · 2026-08-11 · press_released_intent · [Sony Semiconductor Solutions and TSMC execute definitive agreement to establish Advanced Vision Semiconductor Manufacturing Corporation joint venture](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000539/sonysemiconductorsolutions.htm)
- [S29] Samsung Foundry · 2026-07-25 · press_released_intent · [Samsung Electronics and Broadcom sign MOU for memory, HBM, 2nm foundry, and 2.3D/2.5D advanced packaging collaboration](https://news.samsung.com/global/samsung-electronics-and-broadcom-expand-strategic-collaboration-across-memory-and-foundry-technologies)
- [S31] Microsoft · 2027 · press_released_intent · [Microsoft announces third-generation Maia 300 in-house AI chip on TSMC N2P with chiplet architecture](https://www.theverge.com/news/1009465/microsoft-maia-300-chip-improvements-rollout)
- [S32] Meta · 2026-04-14 · press_released_intent · [Meta expands partnership with Broadcom to co-develop next-generation MTIA custom AI silicon](https://about.fb.com/news/2026/04/meta-partners-with-broadcom-to-co-develop-custom-ai-silicon/)
- [S33] Meta · 2027 · press_released_intent · [Meta announces MTIA 500 multi-chiplet AI accelerator scheduled for mass deployment in 2027](https://ai.meta.com/blog/meta-mtia-scale-ai-chips-for-billions/)
- [S35] Meta · 2026-08-25 · confirmed_fact · [Meta details MTIA 400 inference accelerator with multi-chiplet package, RISC-V cores, and HBM3e](https://www.servethehome.com/metas-mtia-custom-ai-silicon-at-hot-chips-2026/)
- [S36] Cerebras · 2026-08-19 · confirmed_fact · [Cerebras Systems announces Wafer Scale Engine 3 Turbo (WSE-3T) AI processor](https://www.hpcwire.com/off-the-wire/cerebras-introduces-cs-4-with-750-pflops-of-ai-compute/)
- [S41] Tesla · 2026-01-19 · confirmed_fact · [Tesla finalizes development of AI5 automotive processor for production at TSMC and Samsung](https://www.techpowerup.com/345369/tesla-completes-ai5-chip-revives-dojo-3-with-intel-packaging-deal)
- [S42] AWS · 2025-12-02 · press_released_intent · [AWS announces development of Trainium4 custom silicon integrating Nvidia NVLink Fusion](https://www.hpcwire.com/2025/12/02/aws-brings-the-trainium3-chip-to-market-with-new-ec2-ultraservers/)
- [S43] AWS · 2025-12-02 · confirmed_fact · [AWS announces general availability of Amazon EC2 Trn3 UltraServers powered by 3nm Trainium3 AI chip](https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-ec2-trn3-ultraservers/)
- [S44] Microsoft · 2025-11-18 · confirmed_fact · [Microsoft announces Azure Cobalt 200 CPU built on Arm Neoverse CSS V3](https://newsroom.arm.com/blog/microsoft-azure-cobalt-200-arm-neoverse-css-v3)
- [S45] Tesla · 2028 · press_released_intent · [Tesla progresses development of custom-designed AI6 inference chip with production planned for 2028](https://assets-ir.tesla.com/tesla-contents/IR/TSLA-Q4-2025-Update.pdf)
- [S46] Tesla · 2027 · press_released_intent · [Tesla progresses development of custom-designed AI5 inference chip with production planned for 2027](https://assets-ir.tesla.com/tesla-contents/IR/TSLA-Q4-2025-Update.pdf)
- [S48] Microsoft · 2026-10-12 · confirmed_fact · [Microsoft Maia 200 running on production AI workloads](https://www.theverge.com/news/1009465/microsoft-maia-300-chip-improvements-rollout)
- [S49] AWS · 2026-09-18 · confirmed_fact · [AWS launches Amazon EC2 T8i instances powered by custom Intel Xeon 6 processors and sixth generation AWS Nitro cards](https://www.hpcwire.com/off-the-wire/aws-launches-burstable-ec2-t8i-instances-powered-by-intel-xeon-6/)
- [S51] Meta · 2026-08-25 · confirmed_fact · [Meta details MTIA 300 DLRM training accelerator architecture at Hot Chips 2026](https://www.servethehome.com/metas-mtia-custom-ai-silicon-at-hot-chips-2026/)
- [S54] Cerebras · 2026-05-04 · confirmed_fact · [Cerebras WSE-3 third-generation Wafer-Scale Engine in production on 5nm TSMC process](https://www.sec.gov/Archives/edgar/data/2021728/000162828026029503/cerebras-sx1amay2026.htm)
- [S56] AWS · 2026-04-27 · confirmed_fact · [AWS announces general availability of EC2 M8in and M8ib instances powered by custom sixth generation Intel Xeon Scalable processors and sixth generation AWS Nitro cards](https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-ec2-m8in-m8ib/)
- [S57] Tesla · 2026-04-22 · confirmed_fact · [Tesla continues custom silicon development with Dojo 3](https://ir.tesla.com/_flysystem/s3/sec/000162828026026551/tsla-20260422-gen.pdf)
- [S58] Tesla · 2025-11-10 · press_released_intent · [Tesla AI7 chip in early development and planned to move to different fabs](https://www.tomshardware.com/tech-industry/semiconductors/musk-confirms-tesla-ai5-and-ai6-will-be-made-at-samsung-and-tsmc)
- [S59] Cerebras · 2026-08-25 · press_released_intent · [Cerebras plans CS-6 system with DRAM stacked on top of wafer scale engines](https://www.servethehome.com/cerebras-talks-going-rack-scale-with-their-wses-at-hot-chips-2026/)
- [S60] Tesla · 2026-07-13 · confirmed_fact · [Tesla AI5 chip reaches tape-out at Samsung Foundry on 2nm process](https://www.tomshardware.com/tech-industry/artificial-intelligence/teslas-ai5-with-2nm-class-node-tapes-out-at-samsung-foundry-production-starts-soon-months-after-tsmc-tape-out)
- [S66] AWS · 2025-12-02 · confirmed_fact · [AWS ↔ TSMC](https://www.hpcwire.com/2025/12/02/aws-brings-the-trainium3-chip-to-market-with-new-ec2-ultraservers/)
- [S71] Microsoft · 2026-10-12 · confirmed_fact · [Microsoft ↔ TSMC](https://www.hpcwire.com/2026/10/12/microsoft-boosts-hbm-bandwidth-by-2-5x-with-maia-300-accelerator/)
- [S72] Microsoft · 2027 · press_released_intent · [Microsoft ↔ TSMC](https://blogs.microsoft.com/blog/2026/10/12/microsoft-to-expand-azure-maia-system-to-multi-gigawatt-deployments/)
- [S96] AWS · 2024-09-16 · press_released_intent · [AWS — existing_relationship](https://press.aboutamazon.com/aws/2024/9/intel-and-aws-expand-strategic-collaboration-helping-advance-u-s-based-chip-manufacturing)
- [S97] Microsoft · 2024-02-21 · press_released_intent · [Microsoft — existing_relationship](https://www.intel.com/content/www/us/en/newsroom/news/foundry-news-roadmaps-updates.html)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 1 Q6. What evidence supports the assessment of a particular company's potential relevance to Intel?

The supplied records establish potential and existing relevance to Intel across five companies—AWS, Microsoft, Tesla, Oracle/NVIDIA, and Arm—supported by a mix of confirmed facts and press-released intents [S3, S7, S23, S32, S55].

**Key findings**
- **AWS (Confirmed Fact & Press-Released Intent):** As a confirmed fact, AWS deployed EC2 T8i, C8ine, M8in/b, and C8in/b instances using custom Intel Xeon 6/Scalable processors exclusive to AWS [S23, S25, S31]. Press-released intent also notes a multi-year, multi-billion-dollar collaboration for 18A and a custom Xeon 6 chip on Intel 3 [S54].
- **Microsoft (Press-Released Intent):** Press-released intent shows Microsoft selected a chip design it plans to produce on the Intel 18A process [S55]. Separately, Microsoft deployed its Maia 200 accelerator (confirmed fact) and secured IP rights to OpenAI's chip designs (press-released intent) [S39, S40].
- **Tesla (Press-Released Intent):** Press-released intent indicates Tesla plans to use Intel's 14A manufacturing process at its envisioned Terafab AI chip complex in Texas [S32]. 
- **Oracle and NVIDIA (Press-Released Intent):** Press-released intent shows Oracle Cloud Infrastructure plans to introduce NVIDIA HGX Rubin NVL8 systems featuring two 64-core Intel Xeon 6 CPUs [S3].
- **Arm (Confirmed Fact):** As a confirmed fact, Arm lists Intel Corporation among its customers [S7].

**Implications for Intel**
Confirmed facts demonstrate active revenue relevance with AWS through custom Xeon 6 deployments and an existing customer relationship with Arm [S7, S23, S31]. Announced plans (press-released intents, not proof of completion) indicate foundry relevance for Intel 18A, 14A, and Intel 3 with AWS, Microsoft, and Tesla, alongside host-CPU relevance with Oracle and NVIDIA [S3, S32, S54, S55].

**Cited sources:**

- [S3] NVIDIA · 2026-10-27 · press_released_intent · [Oracle plans to introduce NVIDIA HGX Rubin NVL8 systems with Intel Xeon 6 CPUs](https://nvidianews.nvidia.com/news/nvidia-and-oracle-expand-nvidia-vera-rubin-to-multi-gigawatt-scale-and-bring-nvidia-vera-cpu-to-oracle-cloud-infrastructure)
- [S7] Arm · 2026-09-18 · confirmed_fact · [Arm reports customer list including AMD, Alphabet, AWS, Intel, MediaTek, Meta, Microsoft, NVIDIA, Qualcomm, Samsung and SoftBank](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000135/armukconsolidatedannualr.htm)
- [S23] AWS · 2026-09-18 · confirmed_fact · [AWS launches Amazon EC2 T8i instances powered by custom Intel Xeon 6 processors and sixth generation AWS Nitro cards](https://www.hpcwire.com/off-the-wire/aws-launches-burstable-ec2-t8i-instances-powered-by-intel-xeon-6/)
- [S25] AWS · 2026-07-07 · confirmed_fact · [Amazon EC2 C8ine instances powered by custom sixth generation Intel Xeon Scalable processors and sixth generation AWS Nitro cards available in AWS Europe (Frankfurt) region](https://aws.amazon.com/about-aws/whats-new/2026/07/amazon-ec2-c8ine-aws-frankfurt/)
- [S31] AWS · 2026-04-27 · confirmed_fact · [AWS announces general availability of EC2 M8in and M8ib instances powered by custom sixth generation Intel Xeon Scalable processors and sixth generation AWS Nitro cards](https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-ec2-m8in-m8ib/)
- [S32] Tesla · 2026-04-23 · press_released_intent · [Tesla plans to use Intel 14A manufacturing process at Terafab project](https://www.reuters.com/business/autos-transportation/elon-musk-lays-out-terafab-ai-chip-project-plan-2026-05-06/)
- [S39] Microsoft · 2026-01-26 · confirmed_fact · [Microsoft deploys Maia 200 in US Central datacenter region and plans US West 3 deployment](https://blogs.microsoft.com/blog/2026/01/26/maia-200-the-ai-accelerator-built-for-inference/)
- [S40] Microsoft · 2025-11-13 · press_released_intent · [Microsoft secures IP rights to OpenAI's custom AI chip designs](https://techcrunch.com/2025/11/13/microsofts-plan-to-fix-its-chip-problem-is-partly-to-let-openai-do-the-heavy-lifting/)
- [S54] AWS · 2024-09-16 · press_released_intent · [AWS — existing_relationship](https://press.aboutamazon.com/aws/2024/9/intel-and-aws-expand-strategic-collaboration-helping-advance-u-s-based-chip-manufacturing)
- [S55] Microsoft · 2024-02-21 · press_released_intent · [Microsoft — existing_relationship](https://www.intel.com/content/www/us/en/newsroom/news/foundry-news-roadmaps-updates.html)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 2 Q1. What are the most significant custom-silicon design wins announced in the last 12 months?

Over the past 12 months (November 2025 to November 2026), major custom-silicon design wins centered on multi-gigawatt AI accelerator agreements by Broadcom, AMD, and AWS alongside Microsoft, OpenAI, and Intel deployments [S5, S27, S48]. These span both confirmed production facts and press-released intents [S30, S41, S53].

**Key findings**
- **Broadcom XPU deals**: As a confirmed fact, Broadcom signed a long-term custom AI accelerator contract (within $164.6B of total obligations) and launched a $35B tranche for >1 GW of custom racks [S24, S30]. Press-released intents include co-developing Meta's multi-gigawatt MTIA chips (>1 GW phase one) and a $63B-backed vehicle to lease Broadcom XPUs to Anthropic [S5, S32, S41].
- **AMD and Meta**: As a press-released intent, AMD and Meta announced an agreement for up to 6 GW of custom MI450-based Instinct GPUs, starting shipments in H2 2026 [S19, S27].
- **AWS and Anthropic**: In a press-released intent, Anthropic committed to securing up to 5 GW of current and future custom Amazon Trainium chips [S53].
- **Intel and AWS**: As a confirmed fact, AWS launched general availability of EC2 T8i instances powered by custom Intel Xeon 6 processors exclusive to AWS [S48].
- **Arm and Microsoft**: Confirmed facts show Microsoft built its Azure Cobalt 200 CPU on Arm Neoverse CSS V3, while startups and edge vendors adopted Arm Flexible Access and Ethos-U85 IP [S10, S11, S17].
- **Cerebras and OpenAI**: As a confirmed fact, Cerebras powers OpenAI's GPT-5.6 Sol Ultrafast Mode using its Wafer-Scale Engine architecture [S58].

**Implications for Intel**
As a confirmed fact, Intel achieved production deployment of its custom Xeon 6 processor exclusively on AWS EC2 T8i instances [S48]. This aligns with prior press-released intents from 2024 regarding Intel's collaboration with AWS on custom Xeon 6 and 18A, and Microsoft's plan to produce a chip design on Intel 18A [S96, S97].

**Cited sources:**

- [S5] Broadcom · 2026-10-26 · press_released_intent · [Purchase and Lease of Broadcom XPU AI Accelerators and Networking Solutions for Anthropic](https://www.prnewswire.com/news-releases/bank-of-america-blackstone-citi-and-morgan-stanley-announce-landmark-63-billion-financing-structure-to-enable-ai-compute-capacity-in-partnership-with-broadcom-302919849.html)
- [S10] Arm · 2026-02-02 · confirmed_fact · [SpiNNcloud Systems, Minima, M5ERS, and Equal1 participate in Arm Flexible Access for custom silicon development](https://newsroom.arm.com/blog/arm-flexible-access-broadens-scope-to-help-companies-build-silicon-faster)
- [S11] Arm · 2026-02-02 · confirmed_fact · [Alif Semiconductor and Ambiq integrate Arm Ethos-U85 NPU into edge AI silicon](https://newsroom.arm.com/blog/arm-flexible-access-broadens-scope-to-help-companies-build-silicon-faster)
- [S17] Arm · 2025-11-18 · confirmed_fact · [Arm collaborates with Microsoft on Cobalt 200 as first publicly announced Neoverse CSS V3 implementation](https://newsroom.arm.com/blog/microsoft-azure-cobalt-200-arm-neoverse-css-v3)
- [S19] AMD · 2026-10-27 · press_released_intent · [Meta to deploy custom AMD Instinct GPU and was an early definition customer for MI450](https://ir.amd.com/news-events/press-releases/detail/1302/amd-and-meta-advance-strategic-partnership-to-power-metas-superintelligence-infrastructure)
- [S24] Broadcom · 2026-06 · confirmed_fact · [Broadcom establishes AI XPV platform with initial $35 billion tranche to deploy custom AI accelerators and XPUs](https://www.sec.gov/Archives/edgar/data/1730168/000173016826000080/avgo-20260802.htm)
- [S27] AMD · 2026-02-24 · press_released_intent · [AMD and Meta announce 6-gigawatt strategic partnership for custom MI450-based Instinct GPUs](https://ir.amd.com/news-events/press-releases/detail/1279/amd-and-meta-announce-expanded-strategic-partnership-to-deploy-6-gigawatts-of-amd-gpus)
- [S30] Broadcom · 2026-06-09 · confirmed_fact · [Broadcom enters long-term contract for custom AI accelerators](https://www.sec.gov/Archives/edgar/data/1730168/000173016826000054/avgo-20260503.htm)
- [S32] Meta · 2026-04-14 · press_released_intent · [Meta expands partnership with Broadcom to co-develop next-generation MTIA custom AI silicon](https://about.fb.com/news/2026/04/meta-partners-with-broadcom-to-co-develop-custom-ai-silicon/)
- [S41] Meta · 2026-04-15 · press_released_intent · [Meta partners with Broadcom to develop multiple generations of MTIA chips](https://www.datacenterdynamics.com/en/news/meta-partners-with-broadcom-for-development-of-multiple-generations-of-mtia-chips/)
- [S48] AWS · 2026-09-18 · confirmed_fact · [AWS launches Amazon EC2 T8i instances powered by custom Intel Xeon 6 processors and sixth generation AWS Nitro cards](https://www.hpcwire.com/off-the-wire/aws-launches-burstable-ec2-t8i-instances-powered-by-intel-xeon-6/)
- [S53] AWS · 2026-04-29 · press_released_intent · [Anthropic to secure up to 5 GW of current and future Amazon Trainium chips](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000012/amzn-20260331xex991.htm)
- [S58] Cerebras · 2026-08-13 · confirmed_fact · [Cerebras powers OpenAI's GPT-5.6 Sol Ultrafast Mode using Wafer-Scale Engine architecture](https://www.cerebras.ai/blog/accelerating-gpt-5-6-sol-ultrafast-with-openai)
- [S96] AWS · 2024-09-16 · press_released_intent · [AWS — existing_relationship](https://press.aboutamazon.com/aws/2024/9/intel-and-aws-expand-strategic-collaboration-helping-advance-u-s-based-chip-manufacturing)
- [S97] Microsoft · 2024-02-21 · press_released_intent · [Microsoft — existing_relationship](https://www.intel.com/content/www/us/en/newsroom/news/foundry-news-roadmaps-updates.html)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 2 Q2. Which companies are expanding advanced packaging or chiplet capabilities?

Multiple foundries, merchant silicon vendors, and AI system builders—including TSMC, Samsung, Broadcom, AMD, NVIDIA, Marvell, Arm, Meta, Microsoft, AWS, Cerebras, and Tesla—are expanding advanced packaging or chiplet capabilities through confirmed product architectures, capital appropriations, and press-released intents [S1, S5, S32]. Additionally, Microsoft, AWS, Cerebras, Tesla, and Meta have open packaging-integration job vacancies, though vacancies are not confirmed hires [S76, S77, S79].

**Key findings**
- **Foundries & OSATs (TSMC, Samsung, Amkor, SPIL, ASE, PTI):** It is a confirmed fact that TSMC approved billions in capital appropriations for advanced packaging equipment [S18, S23, S28], while ASE, SPIL, and PTI are developing or qualifying 2.5D EFB interconnects with AMD [S11, S12]. As press-released intents, Samsung and Broadcom signed an MOU covering 2.3D/2.5D packaging [S5], and Amkor and SPIL plan capacity expansions with NVIDIA [S4, S9].
- **AMD & NVIDIA:** Confirmed facts show AMD uses TSMC SoIC-X/CoWoS-L and 2.5D EFB packaging [S7, S11], while NVIDIA offers its NVLink Fusion chiplet platform [S2]. Press-released intents include AMD's $10B Taiwan packaging investment [S6] and NVIDIA's planned interposer and optical-engine capacity expansions [S4, S9].
- **Marvell, Broadcom & Arm:** Confirmed facts establish that Marvell uses CoWoS, InFo, EMIB, and chiplets [S1, S3], Broadcom integrates XPUs using advanced packaging [S24], and Arm is evaluating expansion into chiplets [S26].
- **Hyperscalers (Meta, Microsoft, AWS):** Confirmed facts show AWS's Graviton5 uses four chiplets [S32], Meta's MTIA uses modular chiplets [S33, S44], and Microsoft's Maia 300 adopts a multi-chiplet design [S68]. Meta also announced a press-released intent to co-develop MTIA packaging with Broadcom [S48].
- **Cerebras & Tesla:** As press-released intents, Cerebras plans 3D DRAM stacking and optical hybrid bonding on wafer-scale engines [S31, S37], while Tesla and SpaceX plan a fab integrating logic, memory, and advanced packaging [S38, S49].
- **Hiring signals:** Microsoft (15), AWS (12), Cerebras (4), Tesla (4), and Meta (2) posted packaging-integration vacancies (not confirmed hires) [S76, S77, S79, S82, S89].

**Implications for Intel**
It is a confirmed fact that Marvell utilizes EMIB alongside CoWoS and InFo for complex accelerated compute ASICs [S1]. Separately, as a press-released intent, Tesla plans to use Intel's 14A process at its envisioned Terafab complex, which aims to integrate logic, memory, and advanced packaging [S49, S57]. No other Intel packaging opportunities are established from the records.

**Cited sources:**

- [S1] Marvell · 2026-03-11 · confirmed_fact · [R&D in 5nm, 3nm, 2nm, and 1.4nm (A14) CMOS processes and CoWoS, InFo, and EMIB packaging](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000011/mrvl-20260131.htm)
- [S2] NVIDIA · 2026-08-31 · confirmed_fact · [NVIDIA details NVLink Fusion platform for multi-die custom XPU development](https://nvidianews.nvidia.com/news/nvidia-and-mediatek-deepen-long-standing-partnership-to-build-ai-edge-to-cloud-computing-platforms)
- [S3] Marvell · 2026-03-11 · confirmed_fact · [Custom ASIC platform, advanced packaging, and 5nm, 3nm, and 2nm designs](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000011/mrvl-20260131.htm)
- [S4] NVIDIA · 2026-10-21 · press_released_intent · [NVIDIA and Amkor plan over 300% increase in South Korea interposer wafer capacity](https://nvidianews.nvidia.com/news/nvidia-and-supply-chain-partners-expand-capacity-to-accelerate-ai-infrastructure-buildout)
- [S5] Samsung Foundry · 2026-07-25 · press_released_intent · [Samsung Electronics and Broadcom sign MOU for memory, HBM, 2nm foundry, and 2.3D/2.5D advanced packaging collaboration](https://news.samsung.com/global/samsung-electronics-and-broadcom-expand-strategic-collaboration-across-memory-and-foundry-technologies)
- [S6] AMD · 2026-05-21 · press_released_intent · [AMD announces more than $10 billion in Taiwan ecosystem investments for advanced packaging](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S7] AMD · 2026-05-21 · confirmed_fact · [AMD utilizes TSMC SoIC-X and CoWoS-L advanced packaging across its AI and data center portfolio](https://ir.amd.com/news-events/press-releases/detail/1287/amd-announces-production-ramp-of-next-generation-amd-epyc-processor-venice-on-tsmc-2nm-process-technology)
- [S9] NVIDIA · 2026-10-21 · press_released_intent · [NVIDIA and SPIL plan 15x expansion in optical-engine capacity for co-packaged optics](https://nvidianews.nvidia.com/news/nvidia-and-supply-chain-partners-expand-capacity-to-accelerate-ai-infrastructure-buildout)
- [S11] AMD · 2026-05-21 · confirmed_fact · [AMD collaborates with ASE and SPIL to develop and qualify wafer-based 2.5D EFB packaging for Venice CPUs](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S12] AMD · 2026-05-21 · confirmed_fact · [AMD and PTI qualify 2.5D panel-based EFB interconnect](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S18] TSMC · 2026-08 · confirmed_fact · [TSMC board approves capital appropriations for advanced technology, advanced packaging, and mature/specialty capacity](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000660/tsm-monthend6kx20260924.htm)
- [S23] TSMC · 2026-02 · confirmed_fact · [TSMC board approves capital appropriations for February 2026 including advanced technology and advanced packaging capacity](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000126/tsm-monthend6kx20260325.htm)
- [S24] Broadcom · 2025-12-18 · confirmed_fact · [Broadcom Custom Silicon Solutions and custom XPUs for AI and high-performance computing](https://www.sec.gov/Archives/edgar/data/1730168/000173016825000121/avgo-20251102.htm)
- [S26] Arm · 2025-11-05 · confirmed_fact · [Arm evaluates expansion into custom chips, chiplets, SoC solutions and chip design services](https://www.sec.gov/Archives/edgar/data/1973239/000197323925000043/arm-20250930.htm)
- [S28] TSMC · 2025-11 · confirmed_fact · [TSMC board approves capital appropriations for advanced technology, advanced packaging, R&D and real estate](https://www.sec.gov/Archives/edgar/data/1046179/000104617925000142/tsm-monthend6kx20251223.htm)
- [S31] Cerebras · 2026-08-27 · press_released_intent · [Cerebras reveals plans for 3D stacking of DRAM on wafer-scale engine for CS-6 system](https://www.tomshardware.com/tech-industry/artificial-intelligence/hot-chips-2026-cerebras-lays-out-the-future-of-wafer-scale-ai-nexus-system-architecture-triples-rack-scale-performance-cs-6-wafer-to-incorporate-stacked-dram)
- [S32] AWS · 2026-06-10 · confirmed_fact · [Graviton5 adopts four-chiplet architecture with custom die-to-die connectivity](https://www.amazon.science/blog/graviton5s-improved-design-increases-speed-and-energy-efficiency-beyond-moores-law)
- [S33] Meta · 2026-03-11 · confirmed_fact · [Meta architects MTIA accelerators as modular multi-node chiplet systems](https://ai.meta.com/blog/meta-mtia-scale-ai-chips-for-billions/)
- [S37] Cerebras · 2026-05-13 · press_released_intent · [Cerebras plans to hybrid bond a wafer scale optical transceiver onto WSE](https://newsletter.semianalysis.com/p/cerebras-faster-tokens-please)
- [S38] Tesla · 2026-04-22 · press_released_intent · [Tesla and SpaceX partner to build semiconductor chip fab starting with Research Fab at Gigafactory Texas](https://ir.tesla.com/_flysystem/s3/sec/000162828026026551/tsla-20260422-gen.pdf)
- [S44] Meta · 2026-08-25 · confirmed_fact · [Meta details MTIA 400 inference accelerator with multi-chiplet package, RISC-V cores, and HBM3e](https://www.servethehome.com/metas-mtia-custom-ai-silicon-at-hot-chips-2026/)
- [S48] Meta · 2026-04-15 · press_released_intent · [Meta partners with Broadcom to develop multiple generations of MTIA chips](https://www.datacenterdynamics.com/en/news/meta-partners-with-broadcom-for-development-of-multiple-generations-of-mtia-chips/)
- [S49] Tesla · 2026-03-23 · press_released_intent · [Tesla unveils Terafab mega-fab vision integrating logic, memory, and advanced packaging](https://www.trendforce.com/news/2026/03/23/news-musks-terafab-vision-raises-questions-over-tsmc-impact-advanced-packaging-may-be-best-entry-point/)
- [S57] Tesla · 2026-04-23 · press_released_intent · [Tesla plans to use Intel 14A manufacturing process at Terafab project](https://www.reuters.com/business/autos-transportation/elon-musk-lays-out-terafab-ai-chip-project-plan-2026-05-06/)
- [S68] Microsoft · 2026-10-12 · confirmed_fact · [Microsoft ↔ TSMC](https://azure.microsoft.com/en-us/blog/deep-dive-into-azure-maia-300-architecture/)
- [S76] Microsoft · 2026-10-30 · n/a · [Microsoft: 15 silicon postings in packaging_integration](https://www.linkedin.com/jobs/view/4477675712/)
- [S77] AWS · 2026-10-30 · n/a · [AWS: 12 silicon postings in packaging_integration](https://www.amazon.jobs/en/jobs/10591564/thermal-mechanical-engineer-annapurna-labs-ai-silicon-packaging)
- [S79] Cerebras · 2026-09-03 · n/a · [Cerebras: 4 silicon postings in packaging_integration](https://jobs.ashbyhq.com/cerebras/4197a749-fd21-4420-8d01-1df94c96310b)
- [S82] Tesla · 2026-09-29 · n/a · [Tesla: 4 silicon postings in packaging_integration](https://hire-r1.mokahr.com/social-recruitment/tesla/100004142#/job/0f939843-bc9a-4b86-b129-8cf7565e264a)
- [S89] Meta · 2026-09-28 · n/a · [Meta: 2 silicon postings in packaging_integration](https://www.metacareers.com/profile/job_details/2079446389603122)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 2 Q3. What are the latest material developments involving Broadcom, Marvell and TSMC?

Recent material developments show TSMC dominating advanced foundry supply for Marvell and Broadcom while investing nearly $29.4 billion in capacity [S3, S6, S23]. Meanwhile, Broadcom is diversifying via a >$200 billion Samsung MOU and major XPU deals [S12, S24, S46], and Marvell is expanding through a planned $115 billion Lumentum acquisition and ecosystem partnerships [S11, S15, S28].

**Key findings**
- **TSMC foundry dominance**: As confirmed facts, TSMC produces ~95% of Broadcom's contract-manufactured wafers [S6, S8] and is Marvell's sole advanced-node (including 3nm) wafer supplier under a multi-year capacity reservation agreement [S3, S4]. TSMC also manufactures Arm's 3nm AGI CPU, AWS's 3nm Trainium3, and Cerebras's 5nm WSE-3 (confirmed facts) [S29, S54, S58], plus Microsoft's planned N2P Maia 300 (press-released intent) [S33].
- **TSMC capital and ecosystem expansion**: TSMC's board approved ~$29.44 billion for advanced nodes, packaging, and facilities (confirmed fact) [S19, S23]. TSMC also launched a High-NA EUV photomask initiative with ASML (confirmed fact) and a Japan image-sensor JV with Sony (press-released intent) [S17, S18].
- **Broadcom AI wins and foundry diversification**: Broadcom announced a $63 billion financing vehicle to lease XPUs and networking to Anthropic, and a multi-gigawatt MTIA co-development expansion with Meta (press-released intents) [S12, S13, S46]. Broadcom also signed a >$200 billion MOU with Samsung for HBM, 2nm foundry, and 2.3D/2.5D packaging (press-released intent) [S24].
- **Marvell M&A and product roadmap**: Marvell announced a definitive agreement to acquire Lumentum for $115 billion, unveiled CXL 3.2 memory expanders, and partnered with NVIDIA on NVLink Fusion and silicon photonics (press-released intents) [S10, S11, S28].
- **Open-source security standardization**: As a confirmed fact, Marvell, Microsoft, and Oracle launched the OCP Project Tessera open-source integrated HSM initiative [S15, S35, S37].

**Implications for Intel**
Not established from the records.

**Cited sources:**

- [S3] Marvell · 2026-08-28 · confirmed_fact · [Marvell multi-year wafer capacity reservation agreement with TSMC](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000025/mrvl-20260801.htm)
- [S4] Marvell · 2026-08-28 · confirmed_fact · [TSMC is Marvell's sole wafer supplier for advanced node products including 3nm](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000025/mrvl-20260801.htm)
- [S6] Broadcom · 2026-02-01 · confirmed_fact · [TSMC produces approximately 95% of Broadcom's contract-manufactured wafers in fiscal quarter ended February 1, 2026](https://www.sec.gov/Archives/edgar/data/1730168/000173016826000016/avgo-20260201.htm)
- [S8] Broadcom · 2025-12-18 · confirmed_fact · [TSMC produced approximately 95% of Broadcom's contract-manufactured wafers in fiscal year 2025](https://www.sec.gov/Archives/edgar/data/1730168/000173016825000121/avgo-20251102.htm)
- [S10] Marvell · 2027-01 · press_released_intent · [Marvell unveils second-generation Structera X 3406 and 3506 CXL 3.2 memory expanders](https://investor.marvell.com/news-events/press-releases/detail/1037/adding-and-replacing-marvell-unveils-second-generation-structera-x-industry-first-six-channel-cxl-3-2-memory-expanders-for-ai-inference)
- [S11] Marvell · 2026-11-02 · press_released_intent · [Marvell enters definitive agreement to acquire Lumentum](https://investor.marvell.com/news-events/press-releases/detail/1040/marvell-and-lumentum-to-combine-creating-a-category-leader-in-ai-connectivity)
- [S12] Broadcom · 2026-10-26 · press_released_intent · [Purchase and Lease of Broadcom XPU AI Accelerators and Networking Solutions for Anthropic](https://www.prnewswire.com/news-releases/bank-of-america-blackstone-citi-and-morgan-stanley-announce-landmark-63-billion-financing-structure-to-enable-ai-compute-capacity-in-partnership-with-broadcom-302919849.html)
- [S13] Broadcom · 2026-10-26 · press_released_intent · [$63 Billion Financing Transaction with Bank of America, Blackstone, Citi and Morgan Stanley for AI Compute Capacity](https://www.prnewswire.com/news-releases/bank-of-america-blackstone-citi-and-morgan-stanley-announce-landmark-63-billion-financing-structure-to-enable-ai-compute-capacity-in-partnership-with-broadcom-302919849.html)
- [S15] Marvell · 2026-10-13 · confirmed_fact · [Marvell, Microsoft and Oracle establish OCP working group to standardize silicon-based integrated HSM](https://investor.marvell.com/news-events/press-releases/detail/1038/marvell-microsoft-and-oracle-establish-ocp-working-group-to-standardize-data-center-hardware-security)
- [S17] TSMC · 2026-09-08 · confirmed_fact · [ASML and TSMC announce initiative on large-format photomasks for High NA EUV](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000726/a3q26presentatione.htm)
- [S18] TSMC · 2026-08-11 · press_released_intent · [Sony Semiconductor Solutions and TSMC execute definitive agreement to establish Advanced Vision Semiconductor Manufacturing Corporation joint venture](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000539/sonysemiconductorsolutions.htm)
- [S19] TSMC · 2026-08-11 · press_released_intent · [TSMC Board approves US$29,442.50 million capital appropriations for technology, packaging, and fab capacity](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000536/tsm-boardx20260811.htm)
- [S23] TSMC · 2026-08 · confirmed_fact · [TSMC board approves capital appropriations for advanced technology, advanced packaging, and mature/specialty capacity](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000660/tsm-monthend6kx20260924.htm)
- [S24] Samsung Foundry · 2026-07-25 · press_released_intent · [Samsung Electronics and Broadcom sign MOU for memory, HBM, 2nm foundry, and 2.3D/2.5D advanced packaging collaboration](https://news.samsung.com/global/samsung-electronics-and-broadcom-expand-strategic-collaboration-across-memory-and-foundry-technologies)
- [S28] NVIDIA · 2026-03-31 · press_released_intent · [NVIDIA and Marvell announce strategic partnership through NVIDIA NVLink Fusion and collaboration on silicon photonics](https://nvidianews.nvidia.com/news/nvidia-ai-ecosystem-expands-as-marvell-joins-forces-through-nvlink-fusion)
- [S29] Arm · 2026-03-24 · confirmed_fact · [TSMC manufactures Arm AGI CPU on 3nm process technology](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000050/exhibit991-march24finalarm.htm)
- [S33] Microsoft · 2027 · press_released_intent · [Microsoft announces Azure Maia 300 architecture with HBM4, multi-chiplet design, and TSMC N2P](https://blogs.microsoft.com/blog/2026/10/12/microsoft-to-expand-azure-maia-system-to-multi-gigawatt-deployments/)
- [S35] Microsoft · 2026-10-13 · confirmed_fact · [Microsoft, Marvell, and Oracle introduce open-source Tessera Integrated HSM initiative](https://azure.microsoft.com/en-us/blog/infrastructure-for-the-frontier-era-scaling-intelligence-through-open-industry-collaboration/)
- [S37] Microsoft · 2026-10-13 · confirmed_fact · [Microsoft announces Project Tessera open-source Integrated HSM initiative with Marvell, Oracle, and OCP](https://azure.microsoft.com/en-us/blog/advancing-hardware-security-with-open-source-integrated-hsm-technology/)
- [S46] Meta · 2026-04-14 · press_released_intent · [Meta expands partnership with Broadcom to co-develop next-generation MTIA custom AI silicon](https://about.fb.com/news/2026/04/meta-partners-with-broadcom-to-co-develop-custom-ai-silicon/)
- [S54] AWS · 2025-12-02 · confirmed_fact · [AWS ↔ TSMC](https://www.hpcwire.com/2025/12/02/aws-brings-the-trainium3-chip-to-market-with-new-ec2-ultraservers/)
- [S58] Cerebras · 2026 · confirmed_fact · [Cerebras ↔ TSMC](https://www.servethehome.com/cerebras-intros-faster-wse-3-turbo-processor-and-first-rack-scale-cs-4-system/)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 2 Q4. Which competitive developments could be relevant to Intel's foundry or packaging offerings?

Competitive developments directly involving or rivaling Intel's foundry and packaging offerings include confirmed adoption of EMIB packaging by Marvell and announced plans by Tesla, AWS, and Microsoft to use Intel's 14A, 18A, and Intel 3 nodes [S1, S46, S96]. Concurrently, TSMC, Samsung Foundry, and OSATs are heavily expanding competing advanced node (3nm, 2nm) and 2.5D/3D packaging capacities [S7, S14, S19].

**Key findings**
- **Direct Intel node and packaging adoption**: It is a confirmed fact that Marvell uses EMIB alongside CoWoS and InFo for complex ASICs [S1]. Press-released intents include Tesla planning to use Intel 14A at Terafab [S46], Microsoft planning a chip design on Intel 18A [S97], and AWS collaborating on 18A and Intel 3 [S96].
- **TSMC advanced-node dominance**: Confirmed facts show TSMC is the sole advanced-node wafer supplier for Marvell (3nm), AMD (≤7nm), and Cerebras (5nm), and produces ~95% of Broadcom's CM wafers [S2, S6, S20, S34]. TSMC also manufactures Arm's 3nm AGI CPU, AWS's 3nm Trainium3, and Microsoft's 3nm Maia 200 (confirmed facts), while Microsoft's multi-chiplet Maia 300 is planned on TSMC N2P (press-released intent) [S12, S38, S62, S73].
- **Samsung Foundry 2nm traction**: Samsung's 2nm tape-out of Tesla's AI5 chip is a confirmed fact [S45], and Samsung signed an MOU exceeding $200B (press-released intent) with Broadcom for 2nm foundry, HBM, and 2.3D/2.5D packaging [S7].
- **Competitor packaging and capacity expansion**: Confirmed facts show AMD using TSMC SoIC-X/CoWoS-L and qualifying 2.5D EFB with ASE/SPIL [S10, S29], while Cerebras avoids supply-limited CoWoS and 3nm [S31]. Press-released intents include TSMC approving ~$44.96B and ~$29.44B for capacity/packaging [S17, S19], AMD investing >$10B in Taiwan packaging [S28], and NVIDIA/Amkor planning a >300% Korea interposer capacity increase [S14].

**Implications for Intel**
Confirmed EMIB usage by Marvell and press-released intents from Tesla (14A), AWS (18A, Intel 3), and Microsoft (18A) establish customer engagement with Intel offerings, though AWS and Microsoft simultaneously use TSMC 3nm and N2P for AI accelerators [S1, S46, S62, S70, S96, S97].

**Cited sources:**

- [S1] Marvell · 2026-03-11 · confirmed_fact · [R&D in 5nm, 3nm, 2nm, and 1.4nm (A14) CMOS processes and CoWoS, InFo, and EMIB packaging](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000011/mrvl-20260131.htm)
- [S2] AMD · 2026-05-06 · confirmed_fact · [AMD relies on TSMC and UMC for wafer manufacturing, focusing 7 nm and smaller nodes on TSMC](https://www.sec.gov/Archives/edgar/data/2488/000000248826000076/amd-20260328.htm)
- [S6] Marvell · 2026-08-28 · confirmed_fact · [TSMC is Marvell's sole wafer supplier for advanced node products including 3nm](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000025/mrvl-20260801.htm)
- [S7] Samsung Foundry · 2026-07-25 · press_released_intent · [Samsung Electronics and Broadcom sign MOU for memory, HBM, 2nm foundry, and 2.3D/2.5D advanced packaging collaboration](https://news.samsung.com/global/samsung-electronics-and-broadcom-expand-strategic-collaboration-across-memory-and-foundry-technologies)
- [S10] AMD · 2026-05-21 · confirmed_fact · [AMD utilizes TSMC SoIC-X and CoWoS-L advanced packaging across its AI and data center portfolio](https://ir.amd.com/news-events/press-releases/detail/1287/amd-announces-production-ramp-of-next-generation-amd-epyc-processor-venice-on-tsmc-2nm-process-technology)
- [S12] Arm · 2026-03-24 · confirmed_fact · [TSMC manufactures Arm AGI CPU on 3nm process technology](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000050/exhibit991-march24finalarm.htm)
- [S14] NVIDIA · 2026-10-21 · press_released_intent · [NVIDIA and Amkor plan over 300% increase in South Korea interposer wafer capacity](https://nvidianews.nvidia.com/news/nvidia-and-supply-chain-partners-expand-capacity-to-accelerate-ai-infrastructure-buildout)
- [S17] TSMC · 2026-08-11 · press_released_intent · [TSMC Board approves US$29,442.50 million capital appropriations for technology, packaging, and fab capacity](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000536/tsm-boardx20260811.htm)
- [S19] TSMC · 2026-02-10 · press_released_intent · [TSMC Board approves US$44,962.00 million in capital appropriations](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000017/tsm-boardx20260210x6k.htm)
- [S20] Broadcom · 2026-02-01 · confirmed_fact · [TSMC produces approximately 95% of Broadcom's contract-manufactured wafers in fiscal quarter ended February 1, 2026](https://www.sec.gov/Archives/edgar/data/1730168/000173016826000016/avgo-20260201.htm)
- [S28] AMD · 2026-05-21 · press_released_intent · [AMD announces more than $10 billion in Taiwan ecosystem investments for advanced packaging](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S29] AMD · 2026-05-21 · confirmed_fact · [AMD collaborates with ASE and SPIL to develop and qualify wafer-based 2.5D EFB packaging for Venice CPUs](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S31] Cerebras · 2026-08-12 · confirmed_fact · [Cerebras secures TSMC wafer supply and notes wafer-scale architecture avoids HBM, CoWoS, and 3nm](https://markets.ft.com/data/announce/full?dockey=1330-9809014en-5MJPP1D74BSHO2OHRMNTHQ2PVB)
- [S34] Cerebras · 2026-05-04 · confirmed_fact · [Cerebras WSE-3 third-generation Wafer-Scale Engine in production on 5nm TSMC process](https://www.sec.gov/Archives/edgar/data/2021728/000162828026029503/cerebras-sx1amay2026.htm)
- [S38] Microsoft · 2027 · press_released_intent · [Microsoft announces Azure Maia 300 architecture with HBM4, multi-chiplet design, and TSMC N2P](https://blogs.microsoft.com/blog/2026/10/12/microsoft-to-expand-azure-maia-system-to-multi-gigawatt-deployments/)
- [S45] Tesla · 2026-07-13 · confirmed_fact · [Tesla AI5 chip reaches tape-out at Samsung Foundry on 2nm process](https://www.tomshardware.com/tech-industry/artificial-intelligence/teslas-ai5-with-2nm-class-node-tapes-out-at-samsung-foundry-production-starts-soon-months-after-tsmc-tape-out)
- [S46] Tesla · 2026-04-23 · press_released_intent · [Tesla plans to use Intel 14A manufacturing process at Terafab project](https://www.reuters.com/business/autos-transportation/elon-musk-lays-out-terafab-ai-chip-project-plan-2026-05-06/)
- [S62] AWS · 2025-12-02 · confirmed_fact · [AWS ↔ TSMC](https://www.hpcwire.com/2025/12/02/aws-brings-the-trainium3-chip-to-market-with-new-ec2-ultraservers/)
- [S70] Microsoft · 2027 · press_released_intent · [Microsoft ↔ TSMC](https://blogs.microsoft.com/blog/2026/10/12/microsoft-to-expand-azure-maia-system-to-multi-gigawatt-deployments/)
- [S73] Microsoft · 2026-10-12 · confirmed_fact · [Microsoft ↔ TSMC](https://www.hpcwire.com/2026/10/12/microsoft-boosts-hbm-bandwidth-by-2-5x-with-maia-300-accelerator/)
- [S96] AWS · 2024-09-16 · press_released_intent · [AWS — existing_relationship](https://press.aboutamazon.com/aws/2024/9/intel-and-aws-expand-strategic-collaboration-helping-advance-u-s-based-chip-manufacturing)
- [S97] Microsoft · 2024-02-21 · press_released_intent · [Microsoft — existing_relationship](https://www.intel.com/content/www/us/en/newsroom/news/foundry-news-roadmaps-updates.html)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 2 Q5. What partnerships or ecosystem developments could affect Intel's competitive position?

Multiple ecosystem developments across foundry, packaging, and custom silicon directly involve Intel or strengthen its competitors [S2, S25, S49]. While Intel has confirmed custom Xeon 6 deployments and announced 14A/18A foundry intents, rivals are locking in multi-billion-dollar advanced packaging and custom XPU alliances [S25, S41, S49].

**Key findings**
- **Direct Intel engagements:** Confirmed facts show AWS launched multiple EC2 instances using custom Intel Xeon 6 processors [S41, S43, S48]. Press-released intents include Oracle planning NVIDIA HGX Rubin systems with Xeon 6 CPUs [S9], Tesla planning to use Intel 14A at its Terafab project [S49], and AWS and Microsoft planning Intel 18A/Intel 3 collaborations [S80, S81].
- **Rival foundry and packaging:** Press-released intents include a >$200B Samsung–Broadcom MOU covering HBM, 2nm foundry, and 2.3D/2.5D packaging [S25], alongside AMD's >$10B Taiwan advanced packaging investment [S2]. Confirmed facts show AMD relies on TSMC for ≤7nm nodes and Unimicron, Nan Ya PCB, and Kinsus for substrates [S4, S28].
- **Custom silicon and Arm:** Confirmed facts show Arm built a production-silicon supply chain, joined EuroCDP, and codefined AWS's Graviton5 core [S15, S26, S46]. Press-released intents show Meta expanding its Broadcom MTIA partnership (>1GW) and Microsoft adopting OpenAI chip IP [S34, S51].
- **AI compute alliances:** Press-released intents show Marvell and NVIDIA partnering on NVLink Fusion custom XPUs and Vera CPUs [S30], while Meta and NVIDIA collaborate on Vera CPUs for 2027 [S6]. Confirmed facts show Meta disclosed a $100B AMD agreement [S54] and Cerebras partnered with AMD and AWS Trainium on disaggregated inference [S31].

**Implications for Intel**
Intel maintains active cloud CPU traction via AWS custom Xeon 6 deployments and Oracle's planned Rubin NVL8 systems, plus stated foundry intents on 18A (AWS, Microsoft) and 14A (Tesla) [S9, S41, S49, S80, S81]. However, competitors are scaling alternative ecosystems, including Samsung–Broadcom 2nm/packaging, AMD's Taiwan packaging investments, and Arm's shift to production silicon [S2, S25, S26].

**Cited sources:**

- [S2] AMD · 2026-05-21 · press_released_intent · [AMD announces more than $10 billion in Taiwan ecosystem investments for advanced packaging](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S4] AMD · 2026-05-06 · confirmed_fact · [AMD relies on TSMC and UMC for wafer manufacturing, focusing 7 nm and smaller nodes on TSMC](https://www.sec.gov/Archives/edgar/data/2488/000000248826000076/amd-20260328.htm)
- [S6] NVIDIA · 2027 · press_released_intent · [Meta and NVIDIA collaborate on deploying NVIDIA Vera CPUs with potential large-scale deployment in 2027](https://nvidianews.nvidia.com/news/meta-builds-ai-infrastructure-with-nvidia)
- [S9] NVIDIA · 2026-10-27 · press_released_intent · [Oracle plans to introduce NVIDIA HGX Rubin NVL8 systems with Intel Xeon 6 CPUs](https://nvidianews.nvidia.com/news/nvidia-and-oracle-expand-nvidia-vera-rubin-to-multi-gigawatt-scale-and-bring-nvidia-vera-cpu-to-oracle-cloud-infrastructure)
- [S15] Arm · 2026-09-21 · confirmed_fact · [Arm joins European Chips Design Platform (EuroCDP) as first commercial IP provider](https://newsroom.arm.com/blog/arm-joins-eurocdp-europe-chip-innovation)
- [S25] Samsung Foundry · 2026-07-25 · press_released_intent · [Samsung Electronics and Broadcom sign MOU for memory, HBM, 2nm foundry, and 2.3D/2.5D advanced packaging collaboration](https://news.samsung.com/global/samsung-electronics-and-broadcom-expand-strategic-collaboration-across-memory-and-foundry-technologies)
- [S26] Arm · 2026-07-16 · confirmed_fact · [Arm establishes operations organization and supply chain to deliver production silicon](https://newsroom.arm.com/blog/inside-arms-transition-from-ip-to-silicon)
- [S28] AMD · 2026-05-21 · confirmed_fact · [Unimicron, Nan Ya PCB, and Kinsus support AMD advanced packaging with substrate solutions](https://ir.amd.com/news-events/press-releases/detail/1286/amd-announces-more-than-10-billion-in-taiwan-ecosystem-investments-to-accelerate-ai-infrastructure)
- [S30] Marvell · 2026-03-31 · press_released_intent · [Marvell and NVIDIA announce strategic partnership through NVIDIA NVLink Fusion](https://investor.marvell.com/news-events/press-releases/detail/1019/nvidia-ai-ecosystem-expands-as-marvell-joins-forces-through-nvlink-fusion)
- [S31] Cerebras · 2026-08-19 · confirmed_fact · [Cerebras works with AMD and AWS Trainium on disaggregated inference for CS-4](https://newsletter.semianalysis.com/p/cerebrass-next-generation-cs-4-fast)
- [S34] Microsoft · 2025-11-13 · press_released_intent · [Microsoft secures IP rights to OpenAI's custom AI chip designs](https://techcrunch.com/2025/11/13/microsofts-plan-to-fix-its-chip-problem-is-partly-to-let-openai-do-the-heavy-lifting/)
- [S41] AWS · 2026-09-18 · confirmed_fact · [AWS launches Amazon EC2 T8i instances powered by custom Intel Xeon 6 processors and sixth generation AWS Nitro cards](https://www.hpcwire.com/off-the-wire/aws-launches-burstable-ec2-t8i-instances-powered-by-intel-xeon-6/)
- [S43] AWS · 2026-07-07 · confirmed_fact · [Amazon EC2 C8ine instances powered by custom sixth generation Intel Xeon Scalable processors and sixth generation AWS Nitro cards available in AWS Europe (Frankfurt) region](https://aws.amazon.com/about-aws/whats-new/2026/07/amazon-ec2-c8ine-aws-frankfurt/)
- [S46] AWS · 2026-06-10 · confirmed_fact · [Arm and Amazon's Annapurna Labs codefined the Neoverse V3 core used in Graviton5](https://www.amazon.science/blog/graviton5s-improved-design-increases-speed-and-energy-efficiency-beyond-moores-law)
- [S48] AWS · 2026-04-27 · confirmed_fact · [AWS announces general availability of EC2 M8in and M8ib instances powered by custom sixth generation Intel Xeon Scalable processors and sixth generation AWS Nitro cards](https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-ec2-m8in-m8ib/)
- [S49] Tesla · 2026-04-23 · press_released_intent · [Tesla plans to use Intel 14A manufacturing process at Terafab project](https://www.reuters.com/business/autos-transportation/elon-musk-lays-out-terafab-ai-chip-project-plan-2026-05-06/)
- [S51] Meta · 2026-04-14 · press_released_intent · [Meta expands partnership with Broadcom to co-develop next-generation MTIA custom AI silicon](https://about.fb.com/news/2026/04/meta-partners-with-broadcom-to-co-develop-custom-ai-silicon/)
- [S54] Meta · 2026-03-12 · confirmed_fact · [Meta disclosed a $100 billion AI infrastructure agreement with AMD](https://www.tomshardware.com/tech-industry/semiconductors/meta-reveals-four-new-mtia-chips-built-for-ai-inference)
- [S80] AWS · 2024-09-16 · press_released_intent · [AWS — existing_relationship](https://press.aboutamazon.com/aws/2024/9/intel-and-aws-expand-strategic-collaboration-helping-advance-u-s-based-chip-manufacturing)
- [S81] Microsoft · 2024-02-21 · press_released_intent · [Microsoft — existing_relationship](https://www.intel.com/content/www/us/en/newsroom/news/foundry-news-roadmaps-updates.html)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓

## Module 2 Q6. What is Arm's role in the chiplet ecosystem, and how does it differ from that of Intel's direct foundry competitors?

Arm is expanding from IP licensing into compute subsystems (CSS), chiplets, and production silicon (such as the Arm AGI CPU) as a fabless provider [S6, S18, S19]. Unlike direct foundries such as TSMC and Samsung—which physically manufacture wafers and execute advanced packaging—Arm relies on third-party foundries (specifically TSMC for its 3nm AGI CPU) and supply chain partners to fabricate and package its designs [S1, S6, S17].

**Key findings**
- **Arm's chiplet and silicon expansion**: As a confirmed fact, Arm established commercial arrangements with SoftBank-related businesses to develop CSS, chiplets, and complete chips [S18]. As a press-released intent, Arm plans to further explore RTL/GDSII-based CSSs, chiplets, and end-chip solutions with ecosystem partners [S19].
- **Arm's fabless supply chain**: Confirmed facts show Arm built an end-to-end operations organization across foundry, substrates, assembly, and test to deliver production silicon, relying on TSMC's 3nm process to manufacture the Arm AGI CPU [S1, S5, S6].
- **Ecosystem IP provider**: Confirmed facts show Arm provides foundational IP and Neoverse cores used in chiplet and custom ASIC architectures by Marvell, AWS (four-chiplet Graviton5), and Microsoft (Cobalt 200) [S2, S39, S58].
- **Foundry competitors' physical execution**: Unlike Arm, TSMC (confirmed fact) and Samsung Foundry (press-released intent) provide wafer fabrication (5nm, 3nm, 2nm) and 2.3D/2.5D/3D advanced packaging (CoWoS, SoIC-X) [S8, S17, S21].

**Implications for Intel**
Not established from the records.

**Cited sources:**

- [S1] Arm · 2026-03-24 · confirmed_fact · [TSMC manufactures Arm AGI CPU on 3nm process technology](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000050/exhibit991-march24finalarm.htm)
- [S2] Marvell · 2026-03-11 · confirmed_fact · [Custom ASIC platform, advanced packaging, and 5nm, 3nm, and 2nm designs](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000011/mrvl-20260131.htm)
- [S5] Arm · 2026-07-16 · confirmed_fact · [Arm establishes operations organization and supply chain to deliver production silicon](https://newsroom.arm.com/blog/inside-arms-transition-from-ip-to-silicon)
- [S6] Arm · 2026-05-26 · confirmed_fact · [Arm entry into production silicon products with the Arm AGI CPU](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000097/arm-20260331.htm)
- [S8] TSMC · 2026-04-16 · confirmed_fact · [TSMC 1Q26 revenue breakdown by process node technology](https://www.sec.gov/Archives/edgar/data/1046179/000104617926000199/a1q26presentatione.htm)
- [S17] Samsung Foundry · 2026-07-25 · press_released_intent · [Samsung Electronics and Broadcom sign MOU for memory, HBM, 2nm foundry, and 2.3D/2.5D advanced packaging collaboration](https://news.samsung.com/global/samsung-electronics-and-broadcom-expand-strategic-collaboration-across-memory-and-foundry-technologies)
- [S18] Arm · 2026-05-26 · confirmed_fact · [Arm establishes commercial arrangements with SoftBank Group-related businesses for Arm CSS, chiplets, and complete end chip solutions](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000097/arm-20260331.htm)
- [S19] Arm · 2026-05-26 · press_released_intent · [Arm plans to explore and develop RTL-based CSSs, GDSII-based CSSs, chiplets and complete chip solutions](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000097/arm-20260331.htm)
- [S21] AMD · 2026-05-21 · confirmed_fact · [AMD utilizes TSMC SoIC-X and CoWoS-L advanced packaging across its AI and data center portfolio](https://ir.amd.com/news-events/press-releases/detail/1287/amd-announces-production-ramp-of-next-generation-amd-epyc-processor-venice-on-tsmc-2nm-process-technology)
- [S39] Microsoft · 2026 · confirmed_fact · [Microsoft reveals Azure Cobalt 200 Arm-based CPU built on TSMC 3nm](https://www.datacenterdynamics.com/en/news/microsoft-reveals-next-generation-cobalt-cpu-and-azure-boost/)
- [S58] AWS · 2026-06-10 · confirmed_fact · [Arm and Amazon's Annapurna Labs codefined the Neoverse V3 core used in Graviton5](https://www.amazon.science/blog/graviton5s-improved-design-increases-speed-and-energy-efficiency-beyond-moores-law)

Checks: cited ✓, sourced ✓, dated ✓, classed ✓, no_intent ✓
