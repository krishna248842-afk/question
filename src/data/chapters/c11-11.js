// Chapter c11-11: Photosynthesis in Higher Plants — Verified Starter Pack (Q001–Q005 of 400, IN PROGRESS)
import { createChapterPack } from '../packHelper.js';

export const questions = createChapterPack('c11-11', [
  [1, 's1', 'engelmann-van-niel-pigment-absorption', 'C', 'Engelmann’s action spectrum, van Niel’s proof, and chlorophyll a', 'concept', 'easy',
    'How did T. W. Engelmann map the first action spectrum of photosynthesis, and what did Cornelius van Niel infer about the source of evolved O2?',
    ['Engelmann dispersed light with a prism onto Cladophora alongside aerobic bacteria concentrating mainly in blue and red wavelengths (matching chlorophyll a absorption); van Niel proved O2 evolved by green plants comes strictly from H2O, not CO2', 'Engelmann used purple sulphur bacteria to show green light drives maximal O2 release; van Niel proved O2 originates from cleavage of CO2', 'Engelmann isolated carotenoids on filter paper; van Niel proved glucose is stored directly as liquid sucrose inside grana', 'Engelmann boiled Hydrilla in dark jars; van Niel demonstrated that chlorophyll b serves as the reaction-centre pigment'],
    'Using Cladophora and aerotactic bacteria, Engelmann revealed peak photosynthesis in blue and red light matching chlorophyll a (chief bright/blue-green pigment; chl b yellow-green, xanthophylls yellow, carotenoids yellow-orange protect against photo-oxidation). Van Niel (verified via radioisotopes) proved photosynthetic O2 derives from H2O.',
    'NCERT Class 11 Ch.11 — Sections 11.2–11.4: Early experiments and photosynthetic pigments'],

  [2, 's2', 'non-cyclic-vs-cyclic-photophosphorylation', 'N', 'Z-scheme water splitting versus stroma-lamellae cyclic photophosphorylation', 'statement-analysis', 'medium',
    'Contrast non-cyclic (Z-scheme) and cyclic photophosphorylation accurately inside chloroplasts.',
    ['Non-cyclic engages both PS II (P680, coupled to lumen-side water splitting releasing O2) and PS I (P700) on grana to yield both ATP and NADPH + H+, whereas cyclic operates via PS I alone (e.g., stroma lamellae lacking PS II and NADP reductase) under >680 nm light to generate ATP only', 'Cyclic photophosphorylation splits H2O at P700 to liberate O2 and NADPH, whereas non-cyclic occurs exclusively in stroma lamellae producing ATP alone', 'PS I absorbs maximally at 680 nm and oxidises water on the stromal side, whereas PS II absorbs at 700 nm', 'Neither pathway creates a proton gradient across the thylakoid membrane'],
    'In grana membranes, PS II (P680, coupled to lumen-side Mn/Cl water-splitting complex: 2H2O → 4H+ + O2 + 4e-) feeds electrons through PQ, cytochrome b6f, and PC to PS I (P700) and stromal NADP reductase, synthesising ATP and NADPH. Stroma lamellae lack PS II and NADP reductase, performing PS I-only cyclic photophosphorylation yielding ATP alone.',
    'NCERT Class 11 Ch.11 — Sections 11.5 & 11.6: Electron transport, water splitting, and photophosphorylation'],

  [3, 's3', 'chemiosmosis-and-calvin-cycle-stoichiometry', 'N', 'Lumen proton gradient and exact ATP/NADPH budget of Calvin cycle', 'data-based', 'hard',
    'During chloroplast chemiosmosis, protons accumulate in the thylakoid lumen (dropping lumen pH) and exit through CF0–CF1 ATP synthase into the stroma. How many turns, CO2, ATP, and NADPH are consumed by the Calvin cycle to synthesise ONE molecule of glucose?',
    ['6 turns fixing 6 CO2 onto RuBP (forming 3-PGA first), consuming exactly 18 ATP and 12 NADPH (3 ATP and 2 NADPH per CO2 fixed)', '6 turns fixing 6 CO2, consuming 30 ATP and 12 NADPH (5 ATP and 2 NADPH per CO2 fixed)', '1 turn fixing 6 CO2 onto PEP, consuming 12 ATP and 18 NADPH', '3 turns fixing 3 CO2, consuming 6 ATP and 6 NADPH with zero ATP used in RuBP regeneration'],
    'Across the three stages of Melvin Calvin’s C3 cycle—carboxylation (RuBP + CO2 → two 3-PGA via RuBisCO), reduction (2 ATP + 2 NADPH per CO2), and regeneration of RuBP (1 ATP per CO2)—each CO2 demands 3 ATP + 2 NADPH, so one 6-carbon glucose requires 6 CO2, 18 ATP, and 12 NADPH.',
    'NCERT Class 11 Ch.11 — Sections 11.6.2 & 11.7: Chemiosmosis and Calvin cycle budget'],

  [4, 's4', 'c4-kranz-anatomy-lack-of-photorespiration', 'C', 'Kranz anatomy, PEPcase, and elimination of photorespiration in C4 plants', 'application', 'medium',
    'Why do tropical C4 plants such as maize and sorghum avoid wasteful photorespiration and outperform C3 plants under high light and temperature?',
    ['Mesophyll cells have PEPcase (lacking RuBisCO) to fix CO2 onto 3C PEP forming 4C OAA, then deliver C4 acids to gas-tight, RuBisCO-rich bundle sheath cells (Kranz anatomy) where decarboxylation keeps intracellular CO2 high', 'Mesophyll cells pack high RuBisCO alongside PEPcase while thin-walled bundle sheath cells run Calvin cycle without ATP', 'Photorespiration generates 4 extra ATP and 2 NADPH per RuBP oxygenated in C3 plants', 'C4 plants fix CO2 using only 18 ATP per glucose without requiring pyruvate-to-PEP regeneration in mesophyll'],
    'In C3 plants, O2 competes at RuBisCO forming one 3-PGA + one 2C phosphoglycolate (photorespiration—releasing CO2, consuming ATP, synthesising neither sugar nor ATP/NADPH). C4 plants (Kranz wreath bundle sheath: thick gas-impervious walls, large agranal chloroplasts, no intercellular spaces) pump CO2 via PEPcase/C4 acids onto bundle-sheath RuBisCO (using 2 extra ATP per CO2, i.e., 30 ATP + 12 NADPH per glucose).',
    'NCERT Class 11 Ch.11 — Sections 11.8 & 11.9: C4 Hatch-Slack pathway and photorespiration'],

  [5, 's5', 'blackman-limiting-factors-co2-saturation', 'C', 'Blackman’s law and CO2 saturation in C3 versus C4 crops', 'application', 'easy',
    'Under Blackman’s (1905) Law of Limiting Factors, carbon dioxide is the major limiting factor in nature (0.03–0.04%). Why are greenhouse C3 crops like tomatoes and bell pepper enriched with elevated CO2 rather than C4 maize?',
    ['C4 plants already saturate near 360 µL L-1 CO2, whereas C3 plants show rising photosynthetic rates and higher yields up to beyond 450 µL L-1 under high light', 'Light saturation in most plants is reached only at 95% of full sunlight rather than 10%', 'C3 plants possess a far higher temperature optimum (30–40 °C) than tropical C4 plants', 'Increasing CO2 above 0.05% permanently doubles chlorophyll concentration in C4 bundle sheaths'],
    'Light saturates around ~10% of full sunlight, so CO2 commonly limits photosynthesis: at current atmospheric CO2, C4 plants are already near saturation (~360 µL L-1), whereas C3 plants remain unsaturated (saturating only beyond ~450 µL L-1)—making CO2 fertilisation commercially rewarding for greenhouse C3 crops like tomatoes and bell pepper.',
    'NCERT Class 11 Ch.11 — Section 11.10: Blackman’s Law and CO2 fertilisation effect'],
]);
