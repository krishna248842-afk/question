// Chapter c11-03: Plant Kingdom — Verified Starter Pack (Q001–Q005 of 400, IN PROGRESS)
import { createChapterPack } from '../../packHelper.js';

export const starterQuestions = createChapterPack('c11-03', [
  [1, 's1', 'bentham-hooker-natural-system', 'C', 'Natural system of angiosperm classification', 'concept', 'easy',
    'What distinguishes a natural classification from a system based on only a few superficial plant characters?',
    ['It aims to group plants using a broad range of natural affinities', 'It groups plants using only the number of stamens', 'It sorts plants exclusively by their local names', 'It excludes all comparisons of plant form'],
    'A natural system seeks affinities across multiple characters rather than relying on a few arbitrary traits. Bentham and Hooker proposed an influential natural system for flowering plants.',
    'NCERT Class 11 Biology, Plant Kingdom: natural classification systems'],

  [2, 's2', 'algae-classes-pigments-stored-food', 'N', 'Pigments and reserve foods across three algal classes', 'data-based', 'medium',
    'Match the three algal classes accurately with their dominant pigments and characteristic reserve food material (NCERT Table 3.1).',
    ['Chlorophyceae: chl a, b & starch; Phaeophyceae: chl a, c, fucoxanthin & mannitol/laminarin; Rhodophyceae: chl a, d, r-phycoerythrin & floridean starch', 'Chlorophyceae: chl a, d & laminarin; Phaeophyceae: chl a, b & floridean starch; Rhodophyceae: chl a, c & mannitol', 'Chlorophyceae: fucoxanthin & glycogen; Phaeophyceae: r-phycoerythrin & starch; Rhodophyceae: chl b & oil only', 'Chlorophyceae: chl a, c & mannitol; Phaeophyceae: chl a, d & starch; Rhodophyceae: chl a, b & cellulose'],
    'Green algae (Chlorophyceae) possess chl a, b and store starch in pyrenoids; brown algae (Phaeophyceae) possess chl a, c plus fucoxanthin and store laminarin/mannitol; red algae (Rhodophyceae) possess chl a, d plus r-phycoerythrin and store floridean starch (structurally akin to amylopectin and glycogen).',
    'NCERT Class 11 Ch.3 — Table 3.1: Divisions of Algae and their Main Characteristics'],

  [3, 's3', 'bryophytes-amphibians-gametophyte-dominant', 'C', 'Why bryophytes are called amphibians of the plant kingdom', 'concept', 'easy',
    'Liverworts (such as Marchantia with gemma cups) and mosses (such as Funaria and Sphagnum) have a dominant haploid photosynthetic gametophyte and are termed amphibians of the plant kingdom because',
    ['they live on moist soil yet depend obligatorily on external water for biflagellate antherozoids to reach the archegonium for sexual reproduction', 'their adult sporophytes swim freely across open marine waters using cellulose-plated flagella', 'they possess lignified xylem vessels ashore and functional gills when submerged', 'their seeds germinate exclusively on dry exposed desert sandstone'],
    'Bryophytes colonise damp terrestrial substrates with a free-living haploid gametophyte (while the diploid foot-seta-capsule sporophyte stays attached and nutritionally dependent on it), yet still require a water film to transfer motile male gametes to the archegonium.',
    'NCERT Class 11 Ch.3 — Section 3.2 Bryophytes: dominant gametophyte and water-dependent fertilisation'],

  [4, 's4', 'pteridophytes-heterospory-seed-habit', 'N', 'Heterospory in Selaginella and Salvinia as seed-habit precursor', 'application', 'hard',
    'While majority of pteridophytes are homosporous, Selaginella and Salvinia produce macrospores and microspores. Which associated event acts as an evolutionary precursor to the seed habit?',
    ['Female gametophytes remain retained on the parent sporophyte for variable periods while zygotes develop into young embryos within them', 'Male microspores fuse directly with diploid root hair cells without forming prothalli', 'Megaspores enclose triploid endosperm formed via double fertilisation inside closed ovaries', 'Independent vascular sporophytes degenerate completely, leaving mosses dominant'],
    'In heterosporous pteridophytes (Selaginella, Salvinia), retention of the megaspore-derived female gametophyte on the parent sporophyte and early embryogeny inside the female gametophyte represent a critical evolutionary step considered a precursor to the seed habit.',
    'NCERT Class 11 Ch.3 — Section 3.3 Pteridophytes: heterospory and precursor to seed habit'],

  [5, 's5', 'gymnosperms-naked-seeds-mycorrhiza-coralloid', 'C', 'Specialised root associations and naked ovules in Pinus and Cycas', 'statement-analysis', 'medium',
    'Examine two classic gymnosperms bearing ovules unenclosed by any ovary wall: how do Pinus and Cycas differ in root symbiosis and stem branching?',
    ['Pinus has branched stems and fungal mycorrhizal roots, whereas Cycas has unbranched stems and coralloid roots harbouring N2-fixing cyanobacteria', 'Pinus has unbranched stems and coralloid roots, whereas Cycas has branched stems and ectomycorrhizal roots', 'Pinus is strictly dioecious bearing male and female cones on separate trees, whereas Cycas is monoecious', 'Both enclose haploid seeds inside fleshy pericarp walls following triple fusion'],
    'In gymnosperms (heterosporous plants with naked ovules/seeds and reduced pollen-grain male gametophytes), Pinus is monoecious with branched stems and mycorrhizal roots, whereas Cycas is dioecious with unbranched stems, pinnate leaves, and N2-fixing cyanobacterial coralloid roots.',
    'NCERT Class 11 Ch.3 — Section 3.4 Gymnosperms: comparative features of Pinus and Cycas'],
]);
