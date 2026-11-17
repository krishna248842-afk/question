// Chapter c11-04: Animal Kingdom — Verified Starter Pack (Q001–Q005 of 400, IN PROGRESS)
import { createChapterPack } from '../../packHelper.js';

export const starterQuestions = createChapterPack('c11-04', [
  [1, 's1', 'coelom-types-acoelomate-pseudocoelomate-eucoelomate', 'C', 'Distinguishing coelomates, pseudocoelomates, and acoelomates', 'concept', 'easy',
    'Select the accurate match pairing body-cavity architecture with its representative animal phylum.',
    ['Coelomate (mesoderm-lined cavity): Annelida; Pseudocoelomate (scattered mesodermal pouches): Aschelminthes; Acoelomate (no body cavity): Platyhelminthes', 'Coelomate: Platyhelminthes; Pseudocoelomate: Mollusca; Acoelomate: Annelida', 'Coelomate: Aschelminthes; Pseudocoelomate: Ctenophora; Acoelomate: Arthropoda', 'Coelomate: Porifera; Pseudocoelomate: Chordata; Acoelomate: Echinodermata'],
    'True coelomates (Annelida through Chordata) possess a body cavity lined completely by mesoderm; Aschelminthes (roundworms) are pseudocoelomates with mesoderm present as scattered pouches between ectoderm and endoderm; Platyhelminthes are triploblastic acoelomates.',
    'NCERT Class 11 Ch.4 — Section 4.1.4 Coelom: coelomates, pseudocoelomates, and acoelomates'],

  [2, 's2', 'porifera-choanocytes-cnidaria-ctenophora', 'C', 'Diagnostic structures of lower non-chordate phyla', 'recall', 'medium',
    'Which sequence correctly pairs a phylum-unique diagnostic feature with Porifera, Coelenterata, Ctenophora, and Platyhelminthes respectively?',
    ['Choanocyte-lined canal system; cnidoblasts with nematocysts; eight ciliated comb plates & bioluminescence; flame cells for osmoregulation and excretion', 'Water vascular system; comb plates; malpighian tubules; muscular radula', 'Nephridia; choanocytes; flame cells; open haemocoel with book gills', 'Proboscis gland; parapodia; cnidoblasts; calcareous endoskeletal ossicles'],
    'Sponges (Porifera) use a canal system (ostia → spongocoel → osculum) lined by choanocytes; cnidarians possess stinging cnidoblasts (and metagenesis in Obelia); marine ctenophores bear eight external ciliated comb plates and show bioluminescence; flatworms employ flame cells.',
    'NCERT Class 11 Ch.4 — Sections 4.2.1–4.2.4: Lower non-chordate hallmarks'],

  [3, 's3', 'echinodermata-symmetry-shift-water-vascular', 'N', 'Symmetry shift and water vascular system in Echinodermata', 'application', 'medium',
    'Do not confuse sponge canal systems with echinoderm systems: adult Asterias (starfish) and Cucumaria exhibit which combination of symmetry and hallmark organ system?',
    ['Radially symmetrical adults developing from bilaterally symmetrical larvae, with a water vascular system serving locomotion, food capture/transport, and respiration', 'Bilaterally symmetrical adults developing from radial larvae, with a spongocoel canal system lined by collar cells', 'Metamerically segmented body bearing chitinous parapodia and paired Malpighian tubules', 'Proboscis–collar–trunk body plan containing a stomochord and paired pharyngeal gill slits'],
    'Exclusively marine Echinodermata possess calcareous endoskeletal ossicles, radial adult symmetry alongside bilateral larval symmetry, absence of a dedicated excretory system, and a distinctive water vascular system.',
    'NCERT Class 11 Ch.4 — Section 4.2.9 Phylum Echinodermata'],

  [4, 's4', 'chondrichthyes-vs-osteichthyes-comparison', 'N', 'Contrasting Chondrichthyes and Osteichthyes', 'statement-analysis', 'hard',
    'Compare marine cartilaginous fishes (e.g., Scoliodon, Trygon, Torpedo) with bony fishes (e.g., Labeo, Hippocampus, Exocoetus). Which contrast holds strictly true?',
    ['Chondrichthyes have placoid scales, uncovered gill slits, ventral mouth, and lack an air bladder, whereas Osteichthyes have cycloid/ctenoid scales, four operculate gill pairs, and an air bladder regulating buoyancy', 'Chondrichthyes possess an operculum and external fertilisation, whereas Osteichthyes have claspers on pelvic fins and persistent viviparity', 'Chondrichthyes are homeothermic with three-chambered hearts, whereas Osteichthyes are poikilothermic with four-chambered hearts', 'Both classes lack jaws altogether and migrate from sea to fresh water for spawning before dying'],
    'Cartilaginous fishes bear persistent notochord, ventral mouth, placoid scales, gill slits without operculum, no air bladder (must swim continuously to avoid sinking), and male pelvic claspers with internal fertilisation; bony fishes have operculate gills, cycloid/ctenoid scales, terminal mouth, and a buoyancy-regulating air bladder.',
    'NCERT Class 11 Ch.4 — Sections 4.2.11.2 & 4.2.11.3: Chondrichthyes versus Osteichthyes'],

  [5, 's5', 'tetrapoda-heart-exceptions-aves-mammalia', 'C', 'Heart chambers, pneumatic bones, and oviparous mammal', 'concept', 'easy',
    'Which statement integrates verified diagnostic traits across Reptilia, Aves, and Mammalia accurately?',
    ['Crocodiles uniquely among reptiles possess a four-chambered heart; birds possess pneumatic hollow long bones and air sacs aiding respiration; Ornithorhynchus (platypus) is an oviparous mammal', 'All reptiles possess four-chambered hearts; birds are poikilothermic; Macropus is an oviparous mammal', 'Amphibians lack tympanum; birds bear mammary glands; Balaenoptera breathes via gill slits', 'Snakes and lizards are homeothermic; Struthio lacks feathers; Pteropus belongs to Class Aves'],
    'Reptiles typically have three-chambered hearts EXCEPT four-chambered Crocodilus; homeothermic birds (Aves) possess forelimb wings, pneumatic bones, crop/gizzard, and lung-connected air sacs; mammals possess mammary glands, hair, pinnae, and are mostly viviparous except egg-laying Ornithorhynchus.',
    'NCERT Class 11 Ch.4 — Sections 4.2.11.5–4.2.11.7: Reptilia, Aves, and Mammalia'],
]);
