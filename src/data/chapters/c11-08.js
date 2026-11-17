// Cell: The Unit of Life — automatically checked, IN PROGRESS.
// Preserve the original starter ordering and stored answer positions.
import { createChapterPack } from '../packHelper.js';
import { cellDiversityDraft } from './c11-08/pack1-cell-diversity-draft.js';
import { prokaryoteDraft } from './c11-08/pack2-prokaryote-draft.js';
import { membranesDraft } from './c11-08/pack3-membranes-draft.js';
import { endomembraneDraft } from './c11-08/pack4-endomembrane-draft.js';
import { energyOrganelles } from './c11-08/pack5-energy-organelles.js';
import { cytoskeletonPack } from './c11-08/pack6-cytoskeleton.js';
import { nucleusPack } from './c11-08/pack7-nucleus.js';

export const questions = createChapterPack('c11-08', [
  [1, 's1', 'schleiden-schwann-virchow-cell-theory', 'C', 'Schleiden, Schwann, and Virchow’s refinement of cell theory', 'recall', 'easy',
    'Schleiden and Schwann jointly formulated early cell theory yet could not explain how new cells originated. Who solved this in 1855 with the dictum Omnis cellula-e cellula?',
    ['Rudolf Virchow, establishing that all new cells arise by division of pre-existing cells', 'Robert Brown, who earlier discovered the nucleus inside orchid root cells', 'Antonie van Leeuwenhoek, who first observed and described a live cell', 'Camillo Golgi, who stained densely reticular structures near nerve-cell nuclei'],
    'Matthias Schleiden (1838, botanist) and Theodore Schwann (1839, zoologist—who also noted the plasma membrane and plant cell wall) proposed cell theory; Rudolf Virchow (1855) gave it final form by showing cells divide and new cells arise strictly from pre-existing cells (Omnis cellula-e cellula).',
    'NCERT Class 11 Ch.8 — Section 8.2 Cell Theory'],

  [2, 's2', 'prokaryotic-envelope-mesosome-polysome', 'C', 'Bacterial cell envelope, mesosome roles, and polysomes', 'concept', 'medium',
    'Older accounts attributed functions to bacterial membrane infoldings called mesosomes, although many are now considered fixation artifacts. Which option accurately states the historical description and the meaning of a polysome?',
    ['Mesosomes were described as assisting wall formation, DNA distribution and respiration; a polysome has several ribosomes translating one mRNA', 'Mesosomes were described as eukaryotic nuclei; a polysome is a single chromosome wrapped in histones', 'Mesosomes were described as plant chloroplasts; a polysome is a membrane-bound store of starch', 'Mesosomes were described as bacterial flagella; a polysome is a cellulose fibre used for locomotion'],
    'The older NCERT account attributed several functions to mesosomes, but many such structures are now interpreted as artifacts of chemical fixation, so those proposed functions should not be treated as established. A polysome consists of multiple ribosomes translating the same mRNA.',
    'NCERT Class 11 Biology, Cell: The Unit of Life — historical mesosome account and polysomes; supplemental modern correction on fixation artifacts'],

  [3, 's3', 'fluid-mosaic-and-endomembrane-system', 'N', 'Singer-Nicolson membrane and Golgi cis-to-trans trafficking', 'application', 'medium',
    'Trace a secretory glycoprotein inside a eukaryotic cell governed by Singer and Nicolson’s (1972) fluid mosaic membrane and the coordinated endomembrane system (ER, Golgi apparatus, lysosomes, vacuoles).',
    ['Synthesised on RER, packaged in vesicles fusing with the convex forming (cis) face of Golgi cisternae, chemically modified into glycoproteins, and released from the concave maturing (trans) face', 'Synthesised on SER (main site of lipid/steroid synthesis), pumped into mitochondria, and modified on the cis face of peroxisomes', 'Translated inside acidic lysosomes filled with alkaline hydrolases, then concentrated against a gradient across the tonoplast by simple diffusion', 'Imported across the phospholipid bilayer without energy because lateral fluidity converts polar proteins into nonpolar sterols'],
    'Singer and Nicolson (1972) explained lateral protein movement within the quasi-fluid phospholipid bilayer. Within the endomembrane system (which excludes mitochondria, chloroplasts, and peroxisomes), RER-synthesised proteins fuse with the Golgi cis (forming) face, undergo glycosylation into glycoproteins (and lipids into glycolipids), and exit the trans (maturing) face.',
    'NCERT Class 11 Ch.8 — Sections 8.5.1 & 8.5.3: Plasma membrane and endomembrane system'],

  [4, 's4', 'mitochondria-plastids-cilia-centriole-microtubules', 'N', 'Comparing 9+2 axoneme and 9+0 centriole alongside semi-autonomous organelles', 'data-based', 'hard',
    'Contrast microtubule architecture between a eukaryotic cilium/flagellum axoneme and a centriole, and state what mitochondria and chloroplasts share in their matrix/stroma.',
    ['Axoneme shows 9 peripheral microtubule doublets + 2 central singlets (9+2), whereas a centriole shows a cartwheel of 9 peripheral fibril triplets + 0 central microtubules (9+0); both mitochondria and chloroplasts carry single circular dsDNA, RNA, and 70S ribosomes', 'Axoneme shows 9+0 triplets, whereas a centriole shows 9+2 doublets; both mitochondria and chloroplasts carry 80S ribosomes and linear chromosomes', 'Both axoneme and centriole lack tubulin and match prokaryotic flagellin filaments; cristae stack chlorophyll inside amyloplasts', 'Centrioles are enclosed by a double membrane, whereas elaioplasts store proteins and aleuroplasts store oils'],
    'Eukaryotic cilia/flagella emerge from basal bodies with a membrane-covered 9+2 axoneme (9 peripheral tubulin doublets + 2 central microtubules), whereas non-membranous centrioles show a 9+0 cartwheel of tubulin triplets. Both double-membraned mitochondria (fission-dividing, with cristae) and chloroplasts hold circular dsDNA, RNAs, and 70S ribosomes.',
    'NCERT Class 11 Ch.8 — Sections 8.5.4–8.5.9: Mitochondria, plastids, cilia/flagella, and centrosome'],

  [5, 's5', 'chromosome-centromere-types-and-nucleolus', 'C', 'Nucleolus role and four centromere-based chromosome shapes', 'recall', 'easy',
    'Inside the interphase nucleus, the non-membrane-bound nucleolus is the active site for ribosomal RNA synthesis. During division, a chromosome carrying a terminal centromere versus one positioned slightly away from the middle are termed, respectively,',
    ['telocentric and sub-metacentric', 'metacentric and acrocentric', 'acrocentric and metacentric', 'sub-metacentric and telocentric'],
    'Based on primary constriction (centromere flanked by disc-shaped kinetochores), metacentric has a middle centromere (two equal arms), sub-metacentric has a slightly off-centre centromere (one shorter p arm, one longer q arm), acrocentric is close to one end (one extremely short, one very long arm), and telocentric has a terminal centromere; some chromosomes also bear non-staining secondary constrictions forming satellites.',
    'NCERT Class 11 Ch.8 — Section 8.5.10 Nucleus: nucleolus and chromosome types'],
]);

questions.push(...cellDiversityDraft, ...prokaryoteDraft, ...membranesDraft, ...endomembraneDraft, ...energyOrganelles, ...cytoskeletonPack, ...nucleusPack);
