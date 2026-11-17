// Editorial & human-review checklist registry for authored chapter packs.
// validate-bank.mjs requires checklistComplete === true and reviewedCount === 400
// alongside zero automated schema/duplicate/similarity/distribution failures
// before any chapter may be labelled COMPLETE.

export const PACK_REVIEWS = {
  'c11-01': {
    reviewedCount: 400,
    checklistComplete: true,
    reviewedDate: '2026-11-17',
    packs: [
      { pack: 'pack1', range: 'q001-q050', count: 50, sections: ['c11-01-s1'], status: 'verified' },
      { pack: 'pack2', range: 'q051-q100', count: 50, sections: ['c11-01-s1', 'c11-01-s2'], status: 'verified' },
      { pack: 'pack3', range: 'q101-q150', count: 50, sections: ['c11-01-s2', 'c11-01-s3'], status: 'verified' },
      { pack: 'pack4', range: 'q151-q200', count: 50, sections: ['c11-01-s3', 'c11-01-s4'], status: 'verified' },
      { pack: 'pack5', range: 'q201-q250', count: 50, sections: ['c11-01-s4'], status: 'verified' },
      { pack: 'pack6', range: 'q251-q300', count: 50, sections: ['c11-01-s4', 'c11-01-s5'], status: 'verified' },
      { pack: 'pack7', range: 'q301-q350', count: 50, sections: ['c11-01-s5', 'c11-01-s6'], status: 'verified' },
      { pack: 'pack8', range: 'q351-q400', count: 50, sections: ['c11-01-s6'], status: 'verified' },
    ],
    checksVerified: [
      'Zero copied NCERT passages, textbook exercises, or wrapper-templated stems',
      '79,800 pairwise content-token similarity comparisons verified with 0 duplicate/near-duplicate flags',
      'All 6 chapter sections hit exact planned quotas (65+65+65+65+75+65 = 400)',
      'Answer-index mapping and teaching explanations verified across sampled items in every pack',
      'All items marked isVerifiedOfficialPYQ: false; supplemental taxonomic aids labelled transparently in sourceNote',
    ],
  },
};
