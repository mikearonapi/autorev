/**
 * Forum Configurations
 * 
 * Defines scraping configuration for each automotive forum.
 * These configs are seeded into the forum_sources table.
 * 
 * @module lib/forumConfigs
 */

/**
 * Forum configuration registry
 * Each forum has selectors optimized for its platform (XenForo, vBulletin, etc.)
 */
export const FORUM_CONFIGS = {
  // ─────────────────────────────────────────────────────────────────────────
  // PORSCHE - Rennlist (highest priority, best technical content)
  // XenForo 2.x platform
  // ─────────────────────────────────────────────────────────────────────────
  rennlist: {
    slug: 'rennlist',
    name: 'Rennlist',
    baseUrl: 'https://rennlist.com/forums',
    carBrands: ['Porsche'],
    carSlugs: [
      '718-cayman-gt4', '718-cayman-gts-4', '987-2-cayman-s', '981-cayman-s',
      '981-cayman-gts', '996-gt3', '997-1-gt3', '997-2-gt3', '991-1-gt3',
      '997-1-carrera-s', '997-2-carrera-s', '991-1-carrera-s'
    ],
    priority: 10,
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 30,
      
      // Subforum mapping to car slugs (paths relative to baseUrl)
      subforums: {
        '/987-boxster-cayman-talk.208/': ['987-2-cayman-s'],
        '/981-boxster-cayman-talk.277/': ['981-cayman-s', '981-cayman-gts'],
        '/718-boxster-cayman-talk.296/': ['718-cayman-gt4', '718-cayman-gts-4'],
        '/996-forum.194/': ['996-gt3'],
        '/997-forum.199/': ['997-1-carrera-s', '997-2-carrera-s', '997-1-gt3', '997-2-gt3'],
        '/991.271/': ['991-1-carrera-s', '991-1-gt3'],
      },
      
      // XenForo 2.x selectors
      threadListSelectors: {
        threadContainer: '.structItemContainer',
        thread: '.structItem--thread',
        title: '.structItem-title a',
        url: '.structItem-title a@href',
        replies: '.structItem-cell--meta dd:first-child',
        views: '.structItem-cell--meta dd:last-child',
        lastPostDate: '.structItem-latestDate',
        isSticky: '.structItem-status--sticky',
      },
      
      threadContentSelectors: {
        post: '.message--post',
        postId: '@data-content',
        author: '.message-name a',
        authorJoinDate: '.message-userExtras dt:contains("Joined") + dd',
        authorPostCount: '.message-userExtras dt:contains("Messages") + dd',
        date: '.message-date time@datetime',
        content: '.message-body .bbWrapper',
        postNumber: '.message-attribution-opposite a',
        reactions: '.reactionsBar-link',
      },
      
      // Thread quality filters
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide', 'PPI', 'pre-purchase',
          '100k', '150k', '200k', 'long term', 'ownership',
          'track', 'HPDE', 'DE', 'autocross',
          'failure', 'failed', 'problem', 'issue', 'fix',
          'IMS', 'bore score', 'RMS', 'AOS',
          'mod', 'upgrade', 'install', 'build',
          'cost', 'price', 'paid', 'invoice',
          'maintenance', 'service', 'interval'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE', 'SOLD',
          'price check', 'PC:', 'value',
          'shipping', 'group buy', 'GB:',
          'wanted', 'looking for'
        ],
        minReplies: 5,
        minViews: 500,
      },
      
      pagination: {
        paramName: 'page',
        maxPages: 20,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BMW - Bimmerpost (M cars focus)
  // vBulletin platform
  // ─────────────────────────────────────────────────────────────────────────
  bimmerpost: {
    slug: 'bimmerpost',
    name: 'Bimmerpost',
    baseUrl: 'https://f87.bimmerpost.com/forums',
    carBrands: ['BMW'],
    carSlugs: ['bmw-m2-f87', 'bmw-m2-competition', 'bmw-m240i'],
    priority: 9,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2000,
      maxPagesPerRun: 30,
      
      subforums: {
        '/forums/f87-m2-general-forum.566/': ['bmw-m2-f87', 'bmw-m2-competition'],
        '/forums/f87-m2-technical-mechanical.569/': ['bmw-m2-f87', 'bmw-m2-competition'],
        '/forums/f87-m2-track.571/': ['bmw-m2-f87', 'bmw-m2-competition'],
      },
      
      // vBulletin selectors
      threadListSelectors: {
        threadContainer: '#threads',
        thread: '.threadbit',
        title: '.title a',
        url: '.title a@href',
        replies: '.replies a',
        views: '.views',
        lastPostDate: '.lastpostdate',
        isSticky: '.sticky',
      },
      
      threadContentSelectors: {
        post: '.postcontainer',
        postId: '@id',
        author: '.username',
        date: '.postdate',
        content: '.postcontent',
        postNumber: '.postcounter',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '10k', '20k', '50k',
          'track', 'HPDE',
          'problem', 'issue', 'failure', 'fault',
          'crank hub', 'rod bearing', 'DCT',
          'tune', 'JB4', 'MHD', 'BM3',
          'cost', 'paid', 'dealer'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'group buy', 'GB'
        ],
        minReplies: 5,
        minViews: 1000,
      },
      
      pagination: {
        paramName: 'page',
        maxPages: 15,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MIATA - Miata.net (30 years of data)
  // XenForo platform
  // ─────────────────────────────────────────────────────────────────────────
  'miata-net': {
    slug: 'miata-net',
    name: 'Miata.net',
    baseUrl: 'https://forum.miata.net',
    carBrands: ['Mazda'],
    carSlugs: [
      'mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 
      'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'
    ],
    priority: 8,
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2000,
      maxPagesPerRun: 30,
      
      subforums: {
        '/forums/na-nb-general-discussion.5/': ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb'],
        '/forums/nc-general-discussion.44/': ['mazda-mx5-miata-nc'],
        '/forums/nd-general-discussion.99/': ['mazda-mx5-miata-nd'],
        '/forums/garage-and-diy.10/': ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'],
        '/forums/track-day-and-autocross.12/': ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'],
      },
      
      threadListSelectors: {
        threadContainer: '.structItemContainer',
        thread: '.structItem--thread',
        title: '.structItem-title a',
        url: '.structItem-title a@href',
        replies: '.pairs--justified dd',
        lastPostDate: '.structItem-latestDate time@datetime',
        isSticky: '.structItem-status--sticky',
      },
      
      threadContentSelectors: {
        post: '.message--post',
        author: '.message-name a',
        date: '.message-date time@datetime',
        content: '.message-body .bbWrapper',
        postNumber: '.message-attribution-opposite a',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide',
          'long term', '100k', '200k', '300k',
          'track', 'autocross', 'spec miata',
          'failure', 'problem', 'issue',
          'turbo', 'supercharged', 'boost',
          'suspension', 'coilover',
          'maintenance', 'service'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'price check'
        ],
        minReplies: 3,
        minViews: 300,
      },
      
      pagination: {
        paramName: 'page',
        maxPages: 20,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 86/BRZ - FT86Club
  // vBulletin platform
  // ─────────────────────────────────────────────────────────────────────────
  ft86club: {
    slug: 'ft86club',
    name: 'FT86Club',
    baseUrl: 'https://www.ft86club.com/forums',
    carBrands: ['Toyota', 'Subaru', 'Scion'],
    carSlugs: ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'],
    priority: 8,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2000,
      maxPagesPerRun: 30,
      
      subforums: {
        '/forums/brz-86-gt86-frs-general.33/': ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'],
        '/forums/brz-86-gt86-frs-tech.35/': ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'],
        '/forums/suspension-handling.41/': ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'],
        '/forums/forced-induction.47/': ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'],
      },
      
      threadListSelectors: {
        threadContainer: '#threads',
        thread: '.threadbit',
        title: '.title a',
        url: '.title a@href',
        replies: '.replies',
        views: '.views',
        isSticky: '.sticky',
      },
      
      threadContentSelectors: {
        post: '.postcontainer',
        author: '.username',
        date: '.postdate',
        content: '.postcontent',
        postNumber: '.postcounter',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'install',
          'long term', 'ownership', '50k', '100k',
          'track', 'autocross', 'HPDE',
          'valve spring', 'recall', 'issue', 'problem',
          'turbo', 'supercharger', 'header',
          'tune', 'ecutek', 'oft',
          'suspension', 'coilover', 'alignment'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE'
        ],
        minReplies: 5,
        minViews: 500,
      },
      
      pagination: {
        paramName: 'page',
        maxPages: 15,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CORVETTE - CorvetteForum
  // XenForo platform
  // ─────────────────────────────────────────────────────────────────────────
  corvetteforum: {
    slug: 'corvetteforum',
    name: 'CorvetteForum',
    baseUrl: 'https://www.corvetteforum.com/forums',
    carBrands: ['Chevrolet'],
    carSlugs: [
      'c8-corvette-stingray', 'c7-corvette-stingray', 'c7-corvette-grand-sport',
      'c7-corvette-z06', 'c6-corvette-z06', 'c5-corvette-z06'
    ],
    priority: 7,
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 25,
      
      subforums: {
        '/forums/c8-general-discussion.622/': ['c8-corvette-stingray'],
        '/forums/c7-general-discussion.299/': ['c7-corvette-stingray', 'c7-corvette-grand-sport', 'c7-corvette-z06'],
        '/forums/c6-corvette-general-discussion.8/': ['c6-corvette-z06'],
        '/forums/c5-corvette-general-discussion.3/': ['c5-corvette-z06'],
      },
      
      threadListSelectors: {
        threadContainer: '.structItemContainer',
        thread: '.structItem--thread',
        title: '.structItem-title a',
        url: '.structItem-title a@href',
        replies: '.pairs--justified dd',
        lastPostDate: '.structItem-latestDate time@datetime',
        isSticky: '.structItem-status--sticky',
      },
      
      threadContentSelectors: {
        post: '.message--post',
        author: '.message-name a',
        date: '.message-date time@datetime',
        content: '.message-body .bbWrapper',
        postNumber: '.message-attribution-opposite a',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide',
          'long term', 'ownership', '50k', '100k',
          'track', 'HPDE', 'autocross',
          'lifter', 'AFM', 'DOD', 'valve spring',
          'problem', 'issue', 'failure',
          'heads', 'cam', 'tune', 'procharger'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE'
        ],
        minReplies: 5,
        minViews: 500,
      },
      
      pagination: {
        paramName: 'page',
        maxPages: 15,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VAG - VWVortex (Golf R, GTI)
  // XenForo platform
  // ─────────────────────────────────────────────────────────────────────────
  vwvortex: {
    slug: 'vwvortex',
    name: 'VWVortex',
    baseUrl: 'https://www.vwvortex.com/forums',
    carBrands: ['Volkswagen', 'Audi'],
    carSlugs: [
      'volkswagen-gti-mk7', 'volkswagen-gti-mk8',
      'volkswagen-golf-r-mk7', 'volkswagen-golf-r-mk8',
      'audi-rs3-8v', 'audi-rs3-8y', 'audi-tt-rs-8s'
    ],
    priority: 7,
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2000,
      maxPagesPerRun: 25,
      
      subforums: {
        '/forums/golf-gti-mk7.224/': ['volkswagen-gti-mk7', 'volkswagen-golf-r-mk7'],
        '/forums/golf-gti-mk8.260/': ['volkswagen-gti-mk8', 'volkswagen-golf-r-mk8'],
        '/forums/audi-a3-s3-rs3.254/': ['audi-rs3-8v', 'audi-rs3-8y'],
      },
      
      threadListSelectors: {
        threadContainer: '.structItemContainer',
        thread: '.structItem--thread',
        title: '.structItem-title a',
        url: '.structItem-title a@href',
        replies: '.pairs--justified dd',
        lastPostDate: '.structItem-latestDate',
        isSticky: '.structItem-status--sticky',
      },
      
      threadContentSelectors: {
        post: '.message--post',
        author: '.message-name a',
        date: '.message-date time@datetime',
        content: '.message-body .bbWrapper',
        postNumber: '.message-attribution-opposite a',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '50k', '100k',
          'track', 'HPDE', 'autocross',
          'carbon buildup', 'intake valve', 'HPFP', 'turbo',
          'stage 1', 'stage 2', 'is38', 'big turbo',
          'DSG', 'tune', 'APR', 'Unitronic', 'IE'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'group buy'
        ],
        minReplies: 5,
        minViews: 500,
      },
      
      pagination: {
        paramName: 'page',
        maxPages: 15,
      }
    }
  }
};

/**
 * Car keyword to slug mapping for detection in forum content
 */
export const CAR_KEYWORD_MAPPINGS = {
  // Porsche
  '718': ['718-cayman-gt4', '718-cayman-gts-4'],
  '981': ['981-cayman-s', '981-cayman-gts'],
  '987': ['987-2-cayman-s'],
  '996': ['996-gt3'],
  '997': ['997-1-carrera-s', '997-2-carrera-s', '997-1-gt3', '997-2-gt3'],
  '991': ['991-1-gt3', '991-1-carrera-s'],
  'gt4': ['718-cayman-gt4'],
  'cayman': ['718-cayman-gt4', '718-cayman-gts-4', '981-cayman-s', '981-cayman-gts', '987-2-cayman-s'],
  'ims': ['996-gt3', '997-1-carrera-s', '997-1-gt3'],  // IMS bearing issue cars
  
  // BMW
  'm2': ['bmw-m2-f87', 'bmw-m2-competition'],
  'f87': ['bmw-m2-f87', 'bmw-m2-competition'],
  'm240': ['bmw-m240i'],
  
  // Mazda
  'miata': ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'],
  'mx5': ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'],
  'mx-5': ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'],
  'na miata': ['mazda-mx5-miata-na'],
  'nb miata': ['mazda-mx5-miata-nb'],
  'nc miata': ['mazda-mx5-miata-nc'],
  'nd miata': ['mazda-mx5-miata-nd'],
  
  // Toyota/Subaru/Scion
  'brz': ['subaru-brz-zc6', 'subaru-brz-zd8'],
  'gr86': ['toyota-gr86'],
  '86': ['toyota-86-scion-frs'],
  'frs': ['toyota-86-scion-frs'],
  'fr-s': ['toyota-86-scion-frs'],
  'gt86': ['toyota-86-scion-frs'],
  'zn6': ['toyota-86-scion-frs', 'subaru-brz-zc6'],
  'zd8': ['toyota-gr86', 'subaru-brz-zd8'],
  
  // VW/Audi
  'gti': ['volkswagen-gti-mk7', 'volkswagen-gti-mk8'],
  'mk7': ['volkswagen-gti-mk7', 'volkswagen-golf-r-mk7'],
  'mk8': ['volkswagen-gti-mk8', 'volkswagen-golf-r-mk8'],
  'golf r': ['volkswagen-golf-r-mk7', 'volkswagen-golf-r-mk8'],
  'rs3': ['audi-rs3-8v', 'audi-rs3-8y'],
  'tt rs': ['audi-tt-rs-8s'],
  'ttrs': ['audi-tt-rs-8s'],
  
  // Corvette
  'c8': ['c8-corvette-stingray'],
  'c7': ['c7-corvette-stingray', 'c7-corvette-grand-sport', 'c7-corvette-z06'],
  'c6': ['c6-corvette-z06'],
  'c5': ['c5-corvette-z06'],
  'z06': ['c5-corvette-z06', 'c6-corvette-z06', 'c7-corvette-z06'],
  'grand sport': ['c7-corvette-grand-sport'],
  'stingray': ['c7-corvette-stingray', 'c8-corvette-stingray'],
};

/**
 * Generate SQL INSERT statement for seeding forum_sources table
 * @returns {string} SQL INSERT/UPSERT statement
 */
export function generateSeedSQL() {
  const values = Object.values(FORUM_CONFIGS).map(config => {
    const carBrandsSQL = `ARRAY[${config.carBrands.map(b => `'${b}'`).join(',')}]`;
    const carSlugsSQL = config.carSlugs 
      ? `ARRAY[${config.carSlugs.map(s => `'${s}'`).join(',')}]` 
      : 'NULL';
    const scrapeConfigJSON = JSON.stringify(config.scrapeConfig).replace(/'/g, "''");
    
    return `(
      '${config.slug}',
      '${config.name}',
      '${config.baseUrl}',
      ${carBrandsSQL},
      ${carSlugsSQL},
      '${scrapeConfigJSON}'::jsonb,
      true,
      ${config.priority}
    )`;
  }).join(',\n    ');
  
  return `
INSERT INTO forum_sources (slug, name, base_url, car_brands, car_slugs, scrape_config, is_active, priority)
VALUES 
    ${values}
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  car_brands = EXCLUDED.car_brands,
  car_slugs = EXCLUDED.car_slugs,
  scrape_config = EXCLUDED.scrape_config,
  priority = EXCLUDED.priority,
  updated_at = now();
  `;
}

/**
 * Get forum config by slug
 * @param {string} slug - Forum slug
 * @returns {Object|null} Forum configuration
 */
export function getForumConfig(slug) {
  return FORUM_CONFIGS[slug] || null;
}

/**
 * Get all active forum configs sorted by priority
 * @returns {Object[]} Array of forum configurations
 */
export function getActiveForumConfigs() {
  return Object.values(FORUM_CONFIGS)
    .filter(config => config.priority > 0)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Determine forum platform type from config
 * @param {string} slug - Forum slug
 * @returns {string} 'xenforo' or 'vbulletin'
 */
export function getForumPlatformType(slug) {
  const config = FORUM_CONFIGS[slug];
  return config?.platformType || 'xenforo';
}

export default {
  FORUM_CONFIGS,
  CAR_KEYWORD_MAPPINGS,
  generateSeedSQL,
  getForumConfig,
  getActiveForumConfigs,
  getForumPlatformType,
};

