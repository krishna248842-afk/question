// Chapter c11-06: Anatomy of Flowering Plants — Verified Starter Pack (Q001–Q005 of 400, IN PROGRESS)
import { createChapterPack } from '../packHelper.js';

export const questions = createChapterPack('c11-06', [
  [1, 's1', 'simple-and-complex-plant-tissues', 'C', 'Functional comparison of collenchyma, xylem, and phloem', 'concept', 'easy',
    'Why do young dicot stems and leaf petioles bend smoothly in strong wind without snapping, and how do angiosperm phloem sieve tube elements stay physiologically controlled despite lacking a nucleus at maturity?',
    ['Living pectin-cellulose-thickened collenchyma provides flexible mechanical support, while companion cell nuclei regulate connected sieve tube functions via pit fields', 'Dead suberised parenchyma bends elastically, while xylem fibres pump sucrose into enucleate tracheids', 'Lignified sclereids carry out photosynthesis, while albuminous cells govern all dicot sieve tubes', 'Intercalary meristems line adult bark, while guard cells control pressure gradients inside xylem vessels'],
    'Collenchyma is a living mechanical tissue with corner thickenings of cellulose, hemicellulose, and pectin providing tensile flexibility to young dicot stems/petioles; mature enucleate angiosperm sieve tube elements stay tightly paired with nucleated companion cells that maintain the pressure gradient.',
    'NCERT Class 11 Ch.6 — Permanent simple and complex plant tissues'],

  [2, 's2', 'stomatal-apparatus-dicot-vs-grass-guard-cells', 'C', 'Stomatal apparatus and bean vs dumb-bell guard cells', 'recall', 'easy',
    'The stomatal apparatus comprises the stomatal aperture, guard cells, and surrounding subsidiary cells. How do guard cells of grasses differ morphologically from those of typical dicots?',
    ['Grasses possess dumb-bell-shaped guard cells, whereas typical dicots possess bean- (kidney-) shaped guard cells with thicker inner walls and thinner outer walls', 'Grasses possess dead lignified guard cells devoid of chloroplasts, whereas dicots lack subsidiary cells entirely', 'Grasses bear multicellular branched trichomes inside each pore, whereas dicots restrict stomata to root epidermis', 'Both grasses and dicots have spherical guard cells with thick outer walls and paper-thin inner walls'],
    'Guard cells contain chloroplasts and regulate transpiration and gas exchange: dicot guard cells are bean-shaped (thin outer wall, thick inner wall facing pore), whereas monocot grass guard cells are distinctively dumb-bell shaped.',
    'NCERT Class 11 Ch.6 — Section 6.1.1 Epidermal Tissue System: stomatal apparatus'],

  [3, 's3', 'radial-vs-conjoint-open-closed-bundles', 'N', 'Radial versus conjoint open and closed vascular bundles', 'application', 'medium',
    'A transverse section shows xylem and phloem arranged alternately on separate radii in Slide X, and conjoint bundles containing a strip of cambium between phloem and xylem in Slide Y. Identify the organs represented by Slides X and Y.',
    ['Slide X: root (radial vascular bundles); Slide Y: dicotyledonous stem (conjoint open vascular bundles capable of secondary growth)', 'Slide X: monocot stem (conjoint closed); Slide Y: monocot leaf (radial open bundles)', 'Slide X: dorsiventral leaf; Slide Y: monocot root with polyarch endarch xylem', 'Slide X: dicot stem; Slide Y: monocot stem bounded by sclerenchymatous bundle sheath'],
    'Roots possess radial vascular bundles (xylem and phloem on alternate radii with exarch protoxylem); dicot stems possess ring-arranged conjoint open bundles (containing intrafascicular cambium), whereas monocot stems possess scattered conjoint closed bundles lacking cambium.',
    'NCERT Class 11 Ch.6 — Section 6.1.3 Vascular Tissue System'],

  [4, 's4', 'dicot-vs-monocot-root-and-stem-histology', 'N', 'Comparative anatomy of dicot and monocot roots and stems', 'statement-analysis', 'hard',
    'Identify the strictly ACCURATE histological comparison between dicot and monocot organs.',
    ['Dicot roots typically have 2–4 xylem patches, Casparian-strip endodermis, small pith, and secondary growth from pericycle, whereas monocot roots are polyarch (>6 bundles) with a large well-developed pith and no secondary growth', 'Dicot stems possess a sclerenchymatous hypodermis and scattered water-cavity bundles, whereas monocot stems possess a collenchymatous hypodermis and ringed bundles', 'Endodermis of monocot roots lacks suberin Casparian strips completely and generates vascular cambium annually', 'Both dicot and monocot roots display endarch primary xylem with protoxylem facing the pith centre'],
    'Dicot roots show 2–4 radial exarch xylem/phloem patches, waxy suberin Casparian strips in barrel-shaped endodermis, pericycle initiating lateral roots and vascular cambium, and small inconspicuous pith; monocot roots are polyarch (>6 bundles), keep a large pith, and do not undergo secondary growth.',
    'NCERT Class 11 Ch.6 — Sections 6.2.1–6.2.4: Dicot and monocot root and stem anatomy'],

  [5, 's5', 'dorsiventral-vs-isobilateral-leaf-bulliform', 'C', 'Dorsiventral versus isobilateral leaves and bulliform cells', 'application', 'medium',
    'In grasses (isobilateral leaves), mesophyll is NOT differentiated into palisade and spongy parenchyma, and large empty colourless adaxial epidermal cells along veins called bulliform cells help the plant tolerate drought by',
    ['becoming flaccid under water stress so leaves curl inward, reducing exposed surface area and evaporative water loss', 'becoming hyper-turgid during drought to split the cuticle open for rapid nocturnal transpiration', 'differentiating into cambial rings that deposit secondary xylem inside leaf veins', 'secreting waxy suberin Casparian bands across every abaxial stomatal pore'],
    'Unlike dorsiventral dicot leaves (adaxial palisade + abaxial spongy mesophyll, usually more abaxial stomata), isobilateral monocot leaves have undifferentiated mesophyll, stomata on both surfaces, and grass bulliform cells—turgid to expose the blade, flaccid during water stress to curl leaves inward and minimise water loss.',
    'NCERT Class 11 Ch.6 — Sections 6.2.5 & 6.2.6: Dorsiventral and isobilateral leaves'],
]);
