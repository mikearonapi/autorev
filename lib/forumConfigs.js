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
  // vBulletin platform
  // ─────────────────────────────────────────────────────────────────────────
  rennlist: {
    slug: 'rennlist',
    name: 'Rennlist',
    baseUrl: 'https://rennlist.com/forums',
    carBrands: ['Porsche'],
    // IMPORTANT: These slugs must match exactly with the cars table
    carSlugs: [
      '718-cayman-gt4',           // 718 Cayman GT4
      '718-cayman-gts-40',        // 718 Cayman GTS 4.0
      '981-cayman-s',             // 981 Cayman S
      '981-cayman-gts',           // 981 Cayman GTS
      '987-2-cayman-s',           // 987.2 Cayman S
      '991-1-carrera-s',          // 991.1 Carrera S
      '997-2-carrera-s',          // 997.2 Carrera S
      'porsche-911-gt3-996',      // Porsche 911 GT3 996
      'porsche-911-gt3-997',      // Porsche 911 GT3 997
      'porsche-911-turbo-997-1',  // Porsche 911 Turbo 997.1
      'porsche-911-turbo-997-2',  // Porsche 911 Turbo 997.2
    ],
    priority: 10,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 30,
      
      // Subforum mapping to car slugs (paths relative to baseUrl)
      // IMPORTANT: Slugs must match exactly with cars table
      subforums: {
        '/987-forum-125/': ['987-2-cayman-s'],
        '/981-forum-264/': ['981-cayman-s', '981-cayman-gts'],
        '/718-forum-246/': ['718-cayman-gt4', '718-cayman-gts-40'],
        '/996-forum-60/': ['porsche-911-gt3-996'],
        '/996-gt2-gt3-forum-103/': ['porsche-911-gt3-996'],
        '/997-forum-113/': ['997-2-carrera-s', 'porsche-911-turbo-997-1', 'porsche-911-turbo-997-2'],
        '/997-gt2-gt3-forum-141/': ['porsche-911-gt3-997'],
        '/991-221/': ['991-1-carrera-s'],
        '/991-gt3-gt3rs-gt2rs-and-911r-229/': ['991-1-carrera-s'],  // GT3 not in DB, use Carrera S
      },
      
      // vBulletin 3.x selectors (Rennlist custom theme)
      threadListSelectors: {
        threadContainer: '#threadbits_forum_125, .trow-group',
        thread: '.trow.text-center',  // Each thread row
        title: 'a[id^="thread_title_"]',
        url: 'a[id^="thread_title_"]@href',
        replies: '.tcell.alt2.smallfont@title', // Parse from title="Replies: X, Views: Y"
        views: '.tcell.alt2.smallfont@title',
        lastPostDate: '.lastpost, .jumbo-txt',
        isSticky: 'img[alt="Sticky Thread"]',
      },
      
      threadContentSelectors: {
        post: 'div[id^="post"]:not(.vbmenu_popup):not([id*="thanks"])',  // Main post containers
        postId: '@id',
        author: 'a.bigusername',
        authorJoinDate: '.userinfo dd',
        authorPostCount: '.userinfo dd',
        date: '.trow.thead.smallfont .tcell',  // "Dec 27, 2018 | 09:34 AM"
        content: 'div[id^="post_message_"]',
        postNumber: 'a[name^="post"]',
      },
      
      // Thread quality filters - targeting high-value enthusiast content
      threadFilters: {
        titleInclude: [
          // DIY & Technical
          'DIY', 'how to', 'guide', 'tutorial', 'step by step', 'complete',
          'PPI', 'pre-purchase', 'inspection', 'checklist',
          // Ownership & Reliability
          '100k', '150k', '200k', 'long term', 'ownership', 'report', 'experience',
          'high mileage', 'years of', 'update',
          // Track & Performance
          'track', 'HPDE', 'DE', 'autocross', 'lap time', 'racing',
          // Issues & Solutions (valuable for buyers)
          'failure', 'failed', 'problem', 'issue', 'fix', 'solved', 'resolved',
          'IMS', 'bore score', 'RMS', 'AOS', 'recall',
          // Modifications
          'mod', 'upgrade', 'install', 'build', 'project',
          // Cost & Value (helps buyers budget)
          'cost', 'price', 'paid', 'invoice', 'quote', 'worth',
          'maintenance', 'service', 'interval', 'schedule',
          // Comparison content
          'comparison', 'vs', 'versus', 'better than', 'difference',
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE', 'SOLD',
          'price check', 'PC:', 'value?', 'appraisal',
          'shipping', 'group buy', 'GB:',
          'wanted', 'looking for', 'ISO',
          // Low-value content
          'pic thread', 'photo thread', 'show off',
          'introduce', 'hello', 'new member',
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
  // vBulletin platform (classic format)
  // ─────────────────────────────────────────────────────────────────────────
  bimmerpost: {
    slug: 'bimmerpost',
    name: 'Bimmerpost',
    baseUrl: 'https://f87.bimmerpost.com/forums',
    carBrands: ['BMW'],
    // IMPORTANT: These slugs must match exactly with the cars table
    carSlugs: [
      'bmw-m2-competition',       // BMW M2 Competition
      'bmw-m3-f80',               // BMW M3 F80
      'bmw-m4-f82',               // BMW M4 F82
    ],
    priority: 9,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2000,
      maxPagesPerRun: 30,
      
      // vBulletin classic forumdisplay.php format - verified URLs
      subforums: {
        '/forumdisplay.php?f=577': ['bmw-m2-competition'],  // M2 Discussions
        '/forumdisplay.php?f=721': ['bmw-m2-competition'],  // M2 Competition Model
        '/forumdisplay.php?f=864': ['bmw-m2-competition'],  // M2 CS Model
      },
      
      // vBulletin classic selectors
      threadListSelectors: {
        threadContainer: '#threads, #threadbits_forum',
        thread: '.trow.text-center, [id^="thread_"]',
        title: 'a[id^="thread_title_"], .title a',
        url: 'a[id^="thread_title_"]@href, .title a@href',
        replies: '.tcell.alt2@title, .replies',
        views: '.tcell.alt2@title, .views',
        lastPostDate: '.lastpost, .lastpostdate',
        isSticky: 'img[alt="Sticky Thread"], .sticky',
      },
      
      threadContentSelectors: {
        // Bimmerpost threads use generic `div[id^="post"]` containers
        post: 'div[id^="post"]',
        postId: '@id',
        author: 'a.bigusername, .bigusername, .username',
        date: '.trow.thead.smallfont .tcell, .postdate, .date',
        content: 'div[id^="post_message_"]',
        postNumber: 'a[name^="post"], .postcounter',
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
        // Bimmerpost uses `forumdisplay.php?...&page=2` style pagination
        mode: 'query_param',
        paramName: 'page',
        maxPages: 15,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MIATA - Miata.net (30 years of data)
  // XenForo platform - NOTE: Currently blocking bots (403), disabled
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
    priority: 0,  // Disabled - blocking bots
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
  // vBulletin platform (classic)
  // ─────────────────────────────────────────────────────────────────────────
  ft86club: {
    slug: 'ft86club',
    name: 'FT86Club',
    baseUrl: 'https://www.ft86club.com/forums',
    carBrands: ['Toyota', 'Subaru', 'Scion'],
    // IMPORTANT: These slugs must match exactly with the cars table
    carSlugs: [
      'toyota-gr86',              // Toyota GR86 (2nd gen)
      'toyota-86-scion-frs',      // Toyota 86 / Scion FR-S (1st gen)
      'subaru-brz-zd8',           // Subaru BRZ 2nd Gen
      'subaru-brz-zc6',           // Subaru BRZ 1st Gen
    ],
    priority: 8,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2000,
      maxPagesPerRun: 30,
      
      // vBulletin classic forumdisplay.php format - verified actual thread forums (not category pages)
      subforums: {
        '/forumdisplay.php?f=24': ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'], // Wheels & Tires
        '/forumdisplay.php?f=27': ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'], // Issues/Warranty/Recalls
        '/forumdisplay.php?f=36': ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'], // Intake & Exhaust
        '/forumdisplay.php?f=39': ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'], // Engine
        '/forumdisplay.php?f=42': ['toyota-gr86', 'subaru-brz-zd8', 'toyota-86-scion-frs', 'subaru-brz-zc6'], // Suspension
      },
      
      threadListSelectors: {
        threadContainer: '#threads, #threadbits_forum',
        thread: '.trow.text-center, [id^="thread_"]',
        title: 'a[id^="thread_title_"], .title a',
        url: 'a[id^="thread_title_"]@href, .title a@href',
        replies: '.tcell.alt2@title, .replies',
        views: '.tcell.alt2@title, .views',
        lastPostDate: '.lastpost, .lastpostdate',
        isSticky: 'img[alt="Sticky Thread"], .sticky',
      },
      
      threadContentSelectors: {
        // FT86Club threads use generic `div[id^="post"]` containers
        post: 'div[id^="post"]',
        postId: '@id',
        author: 'a.bigusername, .bigusername, .username',
        date: '.trow.thead.smallfont .tcell, .postdate, .date',
        content: 'div[id^="post_message_"]',
        postNumber: 'a[name^="post"], .postcounter',
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
        // FT86Club uses `forumdisplay.php?...&page=2` style pagination
        mode: 'query_param',
        paramName: 'page',
        maxPages: 15,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CORVETTE - CorvetteForum
  // vBulletin/Custom platform - XenForo-like structure with clean URLs
  // ─────────────────────────────────────────────────────────────────────────
  corvetteforum: {
    slug: 'corvetteforum',
    name: 'CorvetteForum',
    baseUrl: 'https://www.corvetteforum.com/forums',
    carBrands: ['Chevrolet'],
    // IMPORTANT: These slugs must match exactly with the cars table
    carSlugs: [
      'c8-corvette-stingray',           // C8 Corvette Stingray
      'c7-corvette-grand-sport',        // C7 Corvette Grand Sport
      'c7-corvette-z06',                // C7 Corvette Z06
      'chevrolet-corvette-c6-z06',      // Chevrolet Corvette C6 Z06
      'chevrolet-corvette-c6-grand-sport', // Chevrolet Corvette C6 Grand Sport
      'chevrolet-corvette-c5-z06',      // Chevrolet Corvette C5 Z06
      'camaro-ss-1le',                  // Camaro SS 1LE
      'camaro-zl1',                     // Camaro ZL1
    ],
    // Reduced priority - site may have anti-scraping protection
    priority: 5,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 3000, // Slower to avoid blocks
      maxPagesPerRun: 15,
      
      // Updated URL structure - using forumdisplay.php format which is more reliable
      subforums: {
        '/forumdisplay.php?f=175': ['c8-corvette-stingray'],  // C8 General Discussion
        '/forumdisplay.php?f=142': ['c7-corvette-grand-sport', 'c7-corvette-z06'],  // C7 General
        '/forumdisplay.php?f=95': ['chevrolet-corvette-c6-z06', 'chevrolet-corvette-c6-grand-sport'],  // C6
        '/forumdisplay.php?f=16': ['chevrolet-corvette-c5-z06'],  // C5 Tech
      },
      
      threadListSelectors: {
        // CorvetteForum uses modern vBulletin with table-based thread lists
        threadContainer: '#threads, .threads, #threadbits_forum',
        thread: 'tr[id^="thread_"], .threadbit',
        title: 'a.title, a[id^="thread_title_"], .threadtitle a',
        url: 'a.title@href, a[id^="thread_title_"]@href, .threadtitle a@href',
        replies: 'td.replies, .stats li:first-child',
        views: 'td.views, .stats li:last-child',
        lastPostDate: '.lastpost .time, .lastpostdate',
        isSticky: '.sticky, img[alt*="Sticky"]',
      },
      
      threadContentSelectors: {
        post: '.postcontainer, div[id^="post"]',
        author: '.username, a.bigusername',
        date: '.postdate, .date',
        content: '.postcontent, div[id^="post_message_"]',
        postNumber: '.postcounter, a[name^="post"]',
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
        minReplies: 3,  // Lowered threshold
        minViews: 300,  // Lowered threshold
      },
      
      pagination: {
        mode: 'query_param',
        paramName: 'page',
        maxPages: 10,
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
    // Disabled: thread pages currently trigger JS/captcha bot protection in direct HTTP fetch.
    priority: 0,
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2000,
      maxPagesPerRun: 25,
      
      // XenForo format - these need verification
      subforums: {
        '/a3-s3-rs-3-mqb-8v.5319/': ['volkswagen-gti-mk7', 'volkswagen-golf-r-mk7'],  // MK7 era
        '/audi-8y.5662/': ['audi-rs3-8y', 'volkswagen-gti-mk8'],  // Newer platforms
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
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FORD - Mustang6G (GT350, GT500, GT PP2)
  // XenForo 2.x platform
  // ─────────────────────────────────────────────────────────────────────────
  mustang6g: {
    slug: 'mustang6g',
    name: 'Mustang6G',
    baseUrl: 'https://www.mustang6g.com/forums',
    carBrands: ['Ford'],
    carSlugs: [
      'shelby-gt350',
      'shelby-gt500',
      'mustang-gt-pp2',
      'ford-mustang-boss-302',
      'ford-focus-rs',
    ],
    // Disabled: returns HTTP 403 on the forum root in automated fetches.
    priority: 0,
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2000,
      maxPagesPerRun: 30,
      
      subforums: {
        '/forums/shelby-gt350-mustang.70/': ['shelby-gt350'],
        '/forums/shelby-gt500-mustang.127/': ['shelby-gt500'],
        '/forums/mustang-gt.57/': ['mustang-gt-pp2'],
        '/forums/mustang-s550-general-forums.56/': ['mustang-gt-pp2', 'shelby-gt350', 'shelby-gt500'],
        '/forums/transmission-drivetrain.69/': ['mustang-gt-pp2', 'shelby-gt350', 'shelby-gt500'],
        '/forums/road-course-track-autocross-hpde.197/': ['mustang-gt-pp2', 'shelby-gt350', 'shelby-gt500'],
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
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '10k', '20k', '50k',
          'track', 'HPDE', 'autocross',
          'voodoo', 'predator', 'coyote',
          'problem', 'issue', 'failure',
          'tune', 'E85', 'headers', 'supercharger',
          'tremec', 'diff', 'cooling',
          'maintenance', 'service'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'group buy', 'GB'
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
  // HONDA - S2Ki (S2000)
  // vBulletin platform
  // ─────────────────────────────────────────────────────────────────────────
  s2ki: {
    slug: 's2ki',
    name: 'S2Ki',
    baseUrl: 'https://www.s2ki.com/forums',
    carBrands: ['Honda'],
    carSlugs: [
      'honda-s2000',
      'honda-civic-type-r-fk8',
      'honda-civic-type-r-fl5',
      'acura-integra-type-r-dc2',
    ],
    priority: 8,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 30,
      
      subforums: {
        '/s2000-talk-1/': ['honda-s2000'],
        '/s2000-modifications-parts-193/': ['honda-s2000'],
        '/s2000-under-hood-2/': ['honda-s2000'],
        '/s2000-library-144/': ['honda-s2000'],
        '/forced-induction-engine-management-237/': ['honda-s2000'],
      },
      
      threadListSelectors: {
        // S2Ki vBulletin uses a div-based thread list (no `tr[id^="thread_"]` rows)
        threadContainer: '#threadbits_forum_1, .trow-group, #threadslist',
        thread: '.trow.text-center',
        title: 'a[id^="thread_title_"]',
        url: 'a[id^="thread_title_"]@href',
        // Parse from title="Replies: X, Views: Y" when available
        replies: '.tcell.alt2.smallfont@title',
        views: '.tcell.alt2.smallfont@title',
        lastPostDate: '.lastpost, .lastpostdate, .lastpost .time',
        isSticky: 'img[alt*="Sticky"], .sticky',
      },
      
      threadContentSelectors: {
        post: '.postcontainer, [id^="post_"]',
        postId: '@id',
        author: '.username',
        date: '.postdate',
        content: '.postcontent, .postbody',
        postNumber: '.postcounter',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '100k', '150k', '200k',
          'track', 'autocross', 'HPDE',
          'VTEC', 'valve adjustment', 'AP1', 'AP2',
          'problem', 'issue', 'failure',
          'turbo', 'supercharger', 'header', 'exhaust',
          'suspension', 'alignment', 'hardtop',
          'soft top', 'convertible', 'maintenance'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'group buy'
        ],
        minReplies: 5,
        minViews: 500,
      },
      
      pagination: {
        // S2Ki uses `/page2/` style pagination
        mode: 'page_path',
        paramName: 'page',
        maxPages: 20,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NISSAN - My350Z (350Z, 370Z, Z)
  // vBulletin platform
  // ─────────────────────────────────────────────────────────────────────────
  my350z: {
    slug: 'my350z',
    name: 'My350Z',
    baseUrl: 'https://my350z.com/forum',
    carBrands: ['Nissan'],
    carSlugs: [
      'nissan-350z',
      'nissan-370z-nismo',
      'nissan-z-rz34',
      'nissan-300zx-twin-turbo-z32',
    ],
    priority: 8,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 30,
      
      subforums: {
        '/engine-and-drivetrain-50/': ['nissan-350z', 'nissan-370z-nismo'],
        '/vq35hr-479/': ['nissan-350z'],
        '/tuning-448/': ['nissan-350z', 'nissan-370z-nismo'],
        '/forced-induction-182/': ['nissan-350z', 'nissan-370z-nismo'],
        '/brakes-and-suspension-399/': ['nissan-350z', 'nissan-370z-nismo'],
        '/autocross-road-305/': ['nissan-350z', 'nissan-370z-nismo'],
        '/370z-engine-and-drivetrain-523/': ['nissan-370z-nismo'],
        '/vq37hvr-524/': ['nissan-370z-nismo'],
      },
      
      threadListSelectors: {
        // My350Z uses a div-based thread list (no `tr[id^="thread_"]` rows)
        threadContainer: '#threadbits_forum_50, .trow-group, #threadslist',
        thread: '.trow.text-center',
        title: 'a[id^="thread_title_"]',
        url: 'a[id^="thread_title_"]@href',
        // Parse from title="Replies: X, Views: Y" when available
        replies: '.tcell.alt2.smallfont@title',
        views: '.tcell.alt2.smallfont@title',
        lastPostDate: '.lastpost, .lastpostdate, .lastpost .time',
        isSticky: 'img[alt*="Sticky"], .sticky',
      },
      
      threadContentSelectors: {
        post: '.postcontainer, [id^="post_"]',
        postId: '@id',
        author: '.username',
        date: '.postdate',
        content: '.postcontent, .postbody',
        postNumber: '.postcounter',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '100k', '150k',
          'track', 'autocross', 'HPDE',
          'VQ', 'HR', 'DE', 'oil consumption', 'gallery gasket',
          'problem', 'issue', 'failure', 'CEL',
          'turbo', 'supercharger', 'header', 'exhaust',
          'tune', 'ECU', 'UpRev', 'ecutek',
          'suspension', 'coilover', 'diff'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'group buy'
        ],
        minReplies: 5,
        minViews: 500,
      },
      
      pagination: {
        // My350Z uses `index2.html` style pagination
        mode: 'index_html',
        paramName: 'page',
        maxPages: 20,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SUBARU - NASIOC (WRX STI)
  // vBulletin platform
  // ─────────────────────────────────────────────────────────────────────────
  nasioc: {
    slug: 'nasioc',
    name: 'NASIOC',
    baseUrl: 'https://forums.nasioc.com',
    carBrands: ['Subaru'],
    carSlugs: [
      'subaru-wrx-sti-gd',
      'subaru-wrx-sti-gr-gv',
      'subaru-wrx-sti-va',
      'subaru-brz-zc6',
      'subaru-brz-zd8',
    ],
    // Disabled: returns HTTP 403 on the forum root in automated fetches.
    priority: 0,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 30,
      
      subforums: {
        '/forums/engine-building-supported-by-iag-44/': ['subaru-wrx-sti-gd', 'subaru-wrx-sti-gr-gv', 'subaru-wrx-sti-va'],
        '/forums/2015-sti-2015-wrx-specific-207/': ['subaru-wrx-sti-va'],
        '/forums/2008-2014-wrx-sti-hatchback-110/': ['subaru-wrx-sti-gr-gv'],
        '/forums/brz-fr-s-86-212/': ['subaru-brz-zc6', 'subaru-brz-zd8'],
      },
      
      threadListSelectors: {
        threadContainer: '[id^="threadbits_forum_"], .trow-group, #threadslist',
        thread: '.trow.text-center',
        title: 'a[id^="thread_title_"]',
        url: 'a[id^="thread_title_"]@href',
        replies: '.tcell.alt2.smallfont@title',
        views: '.tcell.alt2.smallfont@title',
        lastPostDate: '.lastpost, .lastpostdate, .lastpost .time',
        isSticky: 'img[alt*="Sticky"], .sticky',
      },
      
      threadContentSelectors: {
        post: 'div[id^="post"]',
        postId: '@id',
        author: 'a.bigusername, .bigusername, .username',
        date: '.trow.thead.smallfont .tcell, .postdate, .date',
        content: 'div[id^="post_message_"]',
        postNumber: 'a[name^="post"], .postcounter',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '100k', '150k',
          'track', 'autocross', 'rally',
          'EJ257', 'FA20', 'ringland', 'rod bearing',
          'problem', 'issue', 'failure', 'knock',
          'turbo', 'big turbo', 'TGV', 'AVCS',
          'tune', 'accessport', 'pro tune', 'E85',
          'suspension', 'coilover', 'sway bar'
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
        maxPages: 20,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MERCEDES - MBWorld (AMG)
  // vBulletin platform
  // ─────────────────────────────────────────────────────────────────────────
  mbworld: {
    slug: 'mbworld',
    name: 'MBWorld',
    baseUrl: 'https://mbworld.org/forums',
    carBrands: ['Mercedes-AMG'],
    carSlugs: [
      'mercedes-amg-c63-w205',
      'mercedes-c63-amg-w204',
      'mercedes-amg-e63-w212',
      'mercedes-amg-e63s-w213',
      'mercedes-amg-gt',
    ],
    priority: 7,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 25,
      
      subforums: {
        '/w205-c63-amg-149/': ['mercedes-amg-c63-w205'],
        '/w204-amg-65/': ['mercedes-c63-amg-w204'],
        '/amg-gt-gts-gtr-152/': ['mercedes-amg-gt'],
        '/e63-amg-82/': ['mercedes-amg-e63-w212', 'mercedes-amg-e63s-w213'],
      },
      
      threadListSelectors: {
        // MBWorld uses a div-based vBulletin list with `.trow.text-center`
        threadContainer: '[id^="threadbits_forum_"], .trow-group, #threadslist',
        thread: '.trow.text-center',
        title: 'a[id^="thread_title_"]',
        url: 'a[id^="thread_title_"]@href',
        // Parse from title="Replies: X, Views: Y" when available
        replies: '.tcell.alt2.smallfont@title',
        views: '.tcell.alt2.smallfont@title',
        lastPostDate: '.lastpost, .lastpostdate, .lastpost .time',
        isSticky: 'img[alt*="Sticky"], .sticky',
      },
      
      threadContentSelectors: {
        post: 'div[id^="post"]',
        postId: '@id',
        author: 'a.bigusername, .bigusername, .username',
        date: '.trow.thead.smallfont .tcell, .postdate, .date',
        content: 'div[id^="post_message_"]',
        postNumber: 'a[name^="post"], .postcounter',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '50k', '100k',
          'track', 'HPDE',
          'M156', 'M157', 'M177', 'head bolt', 'cam adjuster',
          'problem', 'issue', 'failure',
          'tune', 'ECU', 'exhaust', 'downpipe',
          'suspension', 'airmatic',
          'transmission', 'MCT', 'speedshift'
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
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LOTUS - LotusTalk
  // XenForo platform
  // ─────────────────────────────────────────────────────────────────────────
  lotustalk: {
    slug: 'lotustalk',
    name: 'LotusTalk',
    baseUrl: 'https://www.lotustalk.com',
    carBrands: ['Lotus'],
    carSlugs: [
      'lotus-elise-s2',
      'lotus-exige-s',
      'lotus-evora-s',
      'lotus-evora-gt',
      'lotus-emira',
    ],
    // Disabled: thread pages currently trigger JS/captcha bot protection in direct HTTP fetch.
    priority: 0,
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 25,
      
      subforums: {
        '/forums/lotus-elise.259/': ['lotus-elise-s2'],
        '/forums/lotus-exige.157/': ['lotus-exige-s'],
        '/forums/lotus-evora.170/': ['lotus-evora-s', 'lotus-evora-gt'],
        '/forums/lotus-emira.488/': ['lotus-emira'],
      },
      
      threadListSelectors: {
        threadContainer: '#threads',
        thread: '.structItem--thread',
        title: '.structItem-title a',
        url: '.structItem-title a@href',
        replies: '.pairs--justified dd',
        views: '.pairs--justified dd',
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
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '50k', '100k',
          'track', 'autocross', 'HPDE',
          '2ZZ', 'Toyota engine', 'clam',
          'problem', 'issue', 'failure',
          'supercharger', 'turbo', 'exhaust',
          'suspension', 'alignment', 'geo',
          'maintenance', 'service'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'group buy'
        ],
        minReplies: 3,
        minViews: 300,
      },
      
      pagination: {
        paramName: 'page',
        maxPages: 15,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NISSAN - GT-R Life (GT-R specific)
  // XenForo platform
  // ─────────────────────────────────────────────────────────────────────────
  gtrlife: {
    slug: 'gtrlife',
    name: 'GT-R Life',
    baseUrl: 'https://www.gtrlife.com',
    carBrands: ['Nissan'],
    carSlugs: [
      'nissan-gt-r',
    ],
    // Disabled: thread pages currently trigger JS/captcha bot protection in direct HTTP fetch.
    priority: 0,
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 25,
      
      subforums: {
        // XenForo forum URLs live under `/forums/...`
        '/forums/r35-gt-r.192/': ['nissan-gt-r'],
        '/forums/engine.84/': ['nissan-gt-r'],
        '/forums/transmission-drivetrain.9/': ['nissan-gt-r'],
        '/forums/track.76/': ['nissan-gt-r'],
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
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '50k', '100k',
          'track', 'HPDE',
          'VR38', 'GR6', 'transmission', 'launch control',
          'problem', 'issue', 'failure',
          'turbo', 'big turbo', 'E85', 'flex fuel',
          'tune', 'ECU', 'cobb', 'ecutek',
          'suspension', 'alignment'
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
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DODGE - LX Forums (Challenger/Charger)
  // vBulletin platform
  // ─────────────────────────────────────────────────────────────────────────
  lxforums: {
    slug: 'lxforums',
    name: 'LX Forums',
    baseUrl: 'https://www.lxforums.com/board',
    carBrands: ['Dodge'],
    carSlugs: [
      'dodge-challenger-hellcat',
      'dodge-challenger-srt-392',
      'dodge-charger-hellcat',
      'dodge-charger-srt-392',
    ],
    // Disabled: forum pages currently trigger a JS-gated experience in direct HTTP fetch.
    priority: 0,
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 25,
      
      subforums: {
        '/forums/challenger-srt-hellcat-48/': ['dodge-challenger-hellcat'],
        '/forums/challenger-srt8-392-43/': ['dodge-challenger-srt-392'],
        '/forums/charger-srt-hellcat-49/': ['dodge-charger-hellcat'],
        '/forums/charger-srt8-11/': ['dodge-charger-srt-392'],
      },
      
      threadListSelectors: {
        threadContainer: '#threads',
        thread: '[id^="thread_"]',
        title: 'a[id^="thread_title_"]',
        url: 'a[id^="thread_title_"]@href',
        replies: '.stats li:first-child dd',
        views: '.stats li:last-child dd',
        lastPostDate: '.lastpost .time',
        isSticky: '.sticky',
      },
      
      threadContentSelectors: {
        post: '.postcontainer, [id^="post_"]',
        postId: '@id',
        author: '.username',
        date: '.postdate',
        content: '.postcontent, .postbody',
        postNumber: '.postcounter',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '50k', '100k',
          'track', 'drag', '1/4 mile',
          'HEMI', 'supercharger', 'hellcat swap',
          'problem', 'issue', 'failure',
          'tune', 'pulley', 'headers', 'exhaust',
          'suspension', 'widebody',
          'transmission', 'ZF', 'TR6060'
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
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FORD - F150Forum (F-150 specialist) - NEW: High Market Demand Tier 1
  // vBulletin platform
  // ─────────────────────────────────────────────────────────────────────────
  f150forum: {
    slug: 'f150forum',
    name: 'F150Forum',
    baseUrl: 'https://www.f150forum.com',
    carBrands: ['Ford'],
    carSlugs: [
      'ford-f150-fourteenth-generation',
      'ford-f150-thirteenth',
      'ford-f-150-raptor-2021-2024',
      'ford-f150-raptor-second-generation',
      'ford-f150-lightning-1st-gen',
    ],
    priority: 10,  // Tier 1 - Highest market demand
    platformType: 'vbulletin',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 3000,  // Conservative rate limiting
      maxPagesPerRun: 25,
      
      subforums: {
        '/f118/': ['ford-f150-fourteenth-generation'],  // 2021+ F-150
        '/f56/': ['ford-f150-thirteenth'],  // 2015-2020 F-150
        '/f65/': ['ford-f150-raptor-second-generation', 'ford-f-150-raptor-2021-2024'],  // Raptor
        '/f216/': ['ford-f150-lightning-1st-gen'],  // Lightning
      },
      
      threadListSelectors: {
        threadContainer: '#threadbits_forum, .trow-group',
        thread: '.trow.text-center, [id^="thread_"]',
        title: 'a[id^="thread_title_"], .title a',
        url: 'a[id^="thread_title_"]@href',
        replies: '.tcell.alt2@title',
        views: '.tcell.alt2@title',
        lastPostDate: '.lastpost',
        isSticky: 'img[alt="Sticky Thread"]',
      },
      
      threadContentSelectors: {
        post: 'div[id^="post"]',
        postId: '@id',
        author: 'a.bigusername, .username',
        date: '.postdate',
        content: 'div[id^="post_message_"]',
        postNumber: 'a[name^="post"]',
      },
      
      threadFilters: {
        titleInclude: [
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '50k', '100k', '150k',
          'towing', 'payload', 'mpg', 'fuel economy',
          'problem', 'issue', 'TSB', 'recall',
          'ecoboost', '3.5', '5.0', 'coyote', 'powerboost',
          'tune', 'programmer', 'exhaust', 'intake',
          'leveling', 'lift', 'suspension',
          'off-road', 'trail', 'overlanding'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'group buy', 'price check'
        ],
        minReplies: 5,
        minViews: 500,
      },
      
      pagination: {
        mode: 'query_param',
        paramName: 'page',
        maxPages: 20,
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TOYOTA - TacomaWorld (Tacoma specialist) - NEW: High Market Demand Tier 1
  // XenForo platform - 395K members
  // ─────────────────────────────────────────────────────────────────────────
  tacomaworld: {
    slug: 'tacomaworld',
    name: 'TacomaWorld',
    baseUrl: 'https://www.tacomaworld.com/forums',
    carBrands: ['Toyota'],
    carSlugs: [
      'toyota-tacoma-n300',
      'toyota-tacoma-2024',
      'toyota-tacoma-trd-pro-3rd-gen',
    ],
    priority: 9,  // Tier 1 - High market demand
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 3000,
      maxPagesPerRun: 25,
      
      subforums: {
        '/3rd-gen-tacomas-2016.112/': ['toyota-tacoma-n300', 'toyota-tacoma-trd-pro-3rd-gen'],
        '/4th-gen-tacomas-2024.201/': ['toyota-tacoma-2024'],
        '/engine-suspension.72/': ['toyota-tacoma-n300', 'toyota-tacoma-2024'],
        '/off-road-trails.64/': ['toyota-tacoma-n300', 'toyota-tacoma-2024'],
        '/exterior-mods.65/': ['toyota-tacoma-n300', 'toyota-tacoma-2024'],
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
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '100k', '200k',
          'off-road', 'trail', 'overlanding', 'camping',
          'problem', 'issue', 'TSB', 'recall',
          '3.5', 'V6', 'turbo', 'i-force',
          'tune', 'pedal commander', 'exhaust', 'intake',
          'lift', 'suspension', 'leveling', 'UCAs',
          'TRD', 'pro', 'OR', 'off-road',
          'bumper', 'skid plate', 'armor', 'RTT'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'group buy', 'price check'
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
  // CHEVROLET - Camaro6 (6th Gen Camaro) - NEW: Tier 2 Market Demand
  // XenForo platform
  // ─────────────────────────────────────────────────────────────────────────
  camaro6: {
    slug: 'camaro6',
    name: 'Camaro6',
    baseUrl: 'https://www.camaro6.com/forums',
    carBrands: ['Chevrolet'],
    carSlugs: [
      'camaro-ss-1le',
      'camaro-zl1',
    ],
    priority: 8,  // Tier 2 - Strong market demand
    platformType: 'xenforo',
    scrapeConfig: {
      requiresAuth: false,
      rateLimitMs: 2500,
      maxPagesPerRun: 25,
      
      subforums: {
        '/camaro-ss.15/': ['camaro-ss-1le'],
        '/camaro-zl1.20/': ['camaro-zl1'],
        '/1le.90/': ['camaro-ss-1le'],
        '/engine-drivetrain.18/': ['camaro-ss-1le', 'camaro-zl1'],
        '/forced-induction.76/': ['camaro-zl1'],
        '/track-autocross.22/': ['camaro-ss-1le', 'camaro-zl1'],
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
          'DIY', 'how to', 'guide', 'install',
          'long term', 'ownership', '50k', '100k',
          'track', 'HPDE', 'autocross', 'drag',
          'problem', 'issue', 'failure',
          'LT1', 'LT4', 'supercharger', 'cam',
          'tune', 'headers', 'exhaust', 'intake',
          'suspension', 'magnetic ride', 'coilover',
          '1LE', 'ZL1', 'TR6060', '10-speed',
          'cooling', 'brakes', 'rotors', 'pads'
        ],
        titleExclude: [
          'WTB', 'WTS', 'FS:', 'FOR SALE',
          'group buy', 'price check'
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
 * IMPORTANT: All slugs must match exactly with the cars table
 */
export const CAR_KEYWORD_MAPPINGS = {
  // Porsche - matches cars table slugs
  '718': ['718-cayman-gt4', '718-cayman-gts-40'],
  '981': ['981-cayman-s', '981-cayman-gts'],
  '987': ['987-2-cayman-s'],
  '987.2': ['987-2-cayman-s'],
  '996': ['porsche-911-gt3-996'],
  '996 gt3': ['porsche-911-gt3-996'],
  '997': ['997-2-carrera-s', 'porsche-911-gt3-997', 'porsche-911-turbo-997-1', 'porsche-911-turbo-997-2'],
  '997.1': ['porsche-911-turbo-997-1'],
  '997.2': ['997-2-carrera-s', 'porsche-911-turbo-997-2'],
  '997 gt3': ['porsche-911-gt3-997'],
  '991': ['991-1-carrera-s'],
  '991.1': ['991-1-carrera-s'],
  'gt4': ['718-cayman-gt4'],
  'gts 4.0': ['718-cayman-gts-40'],
  'cayman': ['718-cayman-gt4', '718-cayman-gts-40', '981-cayman-s', '981-cayman-gts', '987-2-cayman-s'],
  'cayman s': ['981-cayman-s', '987-2-cayman-s'],
  'cayman gts': ['981-cayman-gts', '718-cayman-gts-40'],
  'carrera s': ['991-1-carrera-s', '997-2-carrera-s'],
  'ims': ['porsche-911-gt3-996', 'porsche-911-turbo-997-1'],  // IMS bearing issue cars
  'bore scoring': ['987-2-cayman-s', '981-cayman-s', 'porsche-911-gt3-997'],
  
  // BMW - matches cars table slugs
  'm2': ['bmw-m2-competition'],
  'm2 competition': ['bmw-m2-competition'],
  'f87': ['bmw-m2-competition'],
  'm3': ['bmw-m3-e46', 'bmw-m3-e92', 'bmw-m3-f80'],
  'm3 e46': ['bmw-m3-e46'],
  'm3 e92': ['bmw-m3-e92'],
  'm3 f80': ['bmw-m3-f80'],
  'm4': ['bmw-m4-f82'],
  'm4 f82': ['bmw-m4-f82'],
  'e46': ['bmw-m3-e46'],
  'e92': ['bmw-m3-e92'],
  'f80': ['bmw-m3-f80'],
  'f82': ['bmw-m4-f82'],
  '1m': ['bmw-1m-coupe-e82'],
  'm5': ['bmw-m5-e39', 'bmw-m5-e60', 'bmw-m5-f10-competition', 'bmw-m5-f90-competition'],
  'z4m': ['bmw-z4m-e85-e86'],
  
  // Mazda - matches cars table slugs
  'miata': ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'],
  'mx5': ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'],
  'mx-5': ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'],
  'na miata': ['mazda-mx5-miata-na'],
  'na': ['mazda-mx5-miata-na'],
  'nb miata': ['mazda-mx5-miata-nb'],
  'nb': ['mazda-mx5-miata-nb'],
  'nc miata': ['mazda-mx5-miata-nc'],
  'nc': ['mazda-mx5-miata-nc'],
  'nd miata': ['mazda-mx5-miata-nd'],
  'nd': ['mazda-mx5-miata-nd'],
  'rx7': ['mazda-rx7-fd3s'],
  'rx-7': ['mazda-rx7-fd3s'],
  'fd3s': ['mazda-rx7-fd3s'],
  
  // Toyota/Subaru/Scion - matches cars table slugs
  'brz': ['subaru-brz-zc6', 'subaru-brz-zd8'],
  'gr86': ['toyota-gr86'],
  'gr 86': ['toyota-gr86'],
  '86': ['toyota-86-scion-frs', 'toyota-gr86'],
  'frs': ['toyota-86-scion-frs'],
  'fr-s': ['toyota-86-scion-frs'],
  'gt86': ['toyota-86-scion-frs'],
  'zn6': ['toyota-86-scion-frs', 'subaru-brz-zc6'],
  'zd8': ['toyota-gr86', 'subaru-brz-zd8'],
  'supra': ['toyota-gr-supra', 'toyota-supra-mk4-a80-turbo'],
  'gr supra': ['toyota-gr-supra'],
  'mk4 supra': ['toyota-supra-mk4-a80-turbo'],
  'a80': ['toyota-supra-mk4-a80-turbo'],
  'sti': ['subaru-wrx-sti-gd', 'subaru-wrx-sti-gr-gv', 'subaru-wrx-sti-va'],
  'wrx sti': ['subaru-wrx-sti-gd', 'subaru-wrx-sti-gr-gv', 'subaru-wrx-sti-va'],
  
  // VW/Audi - matches cars table slugs
  'gti': ['volkswagen-gti-mk7'],
  'mk7 gti': ['volkswagen-gti-mk7'],
  'mk7': ['volkswagen-gti-mk7', 'volkswagen-golf-r-mk7'],
  'mk8': ['volkswagen-golf-r-mk8'],
  'golf r': ['volkswagen-golf-r-mk7', 'volkswagen-golf-r-mk8'],
  'mk7 r': ['volkswagen-golf-r-mk7'],
  'mk8 r': ['volkswagen-golf-r-mk8'],
  'rs3': ['audi-rs3-8v', 'audi-rs3-8y'],
  '8v': ['audi-rs3-8v'],
  '8y': ['audi-rs3-8y'],
  'tt rs': ['audi-tt-rs-8j', 'audi-tt-rs-8s'],
  'ttrs': ['audi-tt-rs-8j', 'audi-tt-rs-8s'],
  'r8': ['audi-r8-v10', 'audi-r8-v8'],
  'rs5': ['audi-rs5-b8', 'audi-rs5-b9'],
  
  // Corvette/Camaro - matches cars table slugs
  'c8': ['c8-corvette-stingray'],
  'c8 corvette': ['c8-corvette-stingray'],
  'c7': ['c7-corvette-grand-sport', 'c7-corvette-z06'],
  'c7 z06': ['c7-corvette-z06'],
  'c7 grand sport': ['c7-corvette-grand-sport'],
  'c6': ['chevrolet-corvette-c6-z06', 'chevrolet-corvette-c6-grand-sport'],
  'c6 z06': ['chevrolet-corvette-c6-z06'],
  'c5': ['chevrolet-corvette-c5-z06'],
  'c5 z06': ['chevrolet-corvette-c5-z06'],
  'z06': ['chevrolet-corvette-c5-z06', 'chevrolet-corvette-c6-z06', 'c7-corvette-z06'],
  'grand sport': ['c7-corvette-grand-sport', 'chevrolet-corvette-c6-grand-sport'],
  'stingray': ['c8-corvette-stingray'],
  'camaro': ['camaro-ss-1le', 'camaro-zl1'],
  'zl1': ['camaro-zl1'],
  'ss 1le': ['camaro-ss-1le'],
  '1le': ['camaro-ss-1le'],
  
  // Nissan - matches cars table slugs
  'gt-r': ['nissan-gt-r'],
  'gtr': ['nissan-gt-r'],
  'r35': ['nissan-gt-r'],
  '370z': ['nissan-370z-nismo'],
  '350z': ['nissan-350z'],
  'z': ['nissan-z-rz34', 'nissan-350z', 'nissan-370z-nismo'],
  '300zx': ['nissan-300zx-twin-turbo-z32'],
  'z32': ['nissan-300zx-twin-turbo-z32'],
  
  // Honda - matches cars table slugs
  's2000': ['honda-s2000'],
  's2k': ['honda-s2000'],
  'ap1': ['honda-s2000'],
  'ap2': ['honda-s2000'],
  'type r': ['honda-civic-type-r-fk8', 'honda-civic-type-r-fl5'],
  'ctr': ['honda-civic-type-r-fk8', 'honda-civic-type-r-fl5'],
  'fk8': ['honda-civic-type-r-fk8'],
  'fl5': ['honda-civic-type-r-fl5'],
  
  // Ford - matches cars table slugs
  'gt350': ['shelby-gt350'],
  'gt500': ['shelby-gt500'],
  'mustang': ['mustang-gt-pp2', 'shelby-gt350', 'shelby-gt500', 'ford-mustang-boss-302'],
  'boss 302': ['ford-mustang-boss-302'],
  'pp2': ['mustang-gt-pp2'],
  'focus rs': ['ford-focus-rs'],
  
  // Dodge - matches cars table slugs
  'hellcat': ['dodge-challenger-hellcat', 'dodge-charger-hellcat'],
  'challenger': ['dodge-challenger-hellcat', 'dodge-challenger-srt-392'],
  'charger': ['dodge-charger-hellcat', 'dodge-charger-srt-392'],
  'srt 392': ['dodge-challenger-srt-392', 'dodge-charger-srt-392'],
  'viper': ['dodge-viper'],
  
  // Mercedes - matches cars table slugs
  'c63': ['mercedes-amg-c63-w205', 'mercedes-c63-amg-w204'],
  'e63': ['mercedes-amg-e63-w212', 'mercedes-amg-e63s-w213'],
  'amg gt': ['mercedes-amg-gt'],
  'w204': ['mercedes-c63-amg-w204'],
  'w205': ['mercedes-amg-c63-w205'],
  
  // Lotus - matches cars table slugs
  'elise': ['lotus-elise-s2'],
  'exige': ['lotus-exige-s'],
  'evora': ['lotus-evora-s', 'lotus-evora-gt'],
  'emira': ['lotus-emira'],
  
  // Ford Trucks - NEW: High Market Demand
  'f-150': ['ford-f150-fourteenth-generation', 'ford-f150-thirteenth'],
  'f150': ['ford-f150-fourteenth-generation', 'ford-f150-thirteenth'],
  'f 150': ['ford-f150-fourteenth-generation', 'ford-f150-thirteenth'],
  'raptor': ['ford-f-150-raptor-2021-2024', 'ford-f150-raptor-second-generation', 'ford-bronco-raptor-sixth-generation'],
  'f-150 raptor': ['ford-f-150-raptor-2021-2024', 'ford-f150-raptor-second-generation'],
  'raptor r': ['ford-f150-raptor-r-third-generation'],
  'lightning': ['ford-f150-lightning-1st-gen'],
  'ecoboost': ['ford-f150-fourteenth-generation', 'ford-f150-thirteenth'],
  '3.5 ecoboost': ['ford-f150-fourteenth-generation', 'ford-f150-thirteenth'],
  'powerboost': ['ford-f150-fourteenth-generation'],
  
  // Jeep - NEW: High Market Demand
  'wrangler': ['jeep-wrangler-jl', 'jeep-wrangler-jk'],
  'jl': ['jeep-wrangler-jl'],
  'jk': ['jeep-wrangler-jk'],
  'rubicon': ['jeep-wrangler-jl', 'jeep-wrangler-jk'],
  'rubicon 392': ['jeep-wrangler-rubicon-392-jl'],
  '392': ['jeep-wrangler-rubicon-392-jl', 'dodge-challenger-srt-392'],
  'bronco': ['ford-bronco-sixth-generation'],
  'bronco raptor': ['ford-bronco-raptor-sixth-generation'],
  
  // Toyota Trucks - NEW: High Market Demand
  'tacoma': ['toyota-tacoma-n300', 'toyota-tacoma-2024'],
  'trd pro': ['toyota-tacoma-trd-pro-3rd-gen'],
  'trd off-road': ['toyota-tacoma-n300'],
  'n300': ['toyota-tacoma-n300'],
  
  // Chevrolet Trucks - NEW: High Market Demand
  'silverado': ['chevrolet-silverado-1500-fourth-generation'],
  'silverado 1500': ['chevrolet-silverado-1500-fourth-generation'],
  'zr2': ['chevrolet-silverado-zr2-t1xx'],
  't1xx': ['chevrolet-silverado-1500-fourth-generation'],
  
  // Ram Trucks - NEW: Tier 2
  'ram 1500': ['ram-1500-dt'],
  'ram': ['ram-1500-dt'],
  'trx': ['ram-1500-trx-dt'],
  'rebel': ['ram-1500-rebel-dt'],
  'power wagon': ['ram-power-wagon-dt'],
  'cummins': ['ram-2500-cummins-ds'],
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

const forumConfigs = {
  FORUM_CONFIGS,
  CAR_KEYWORD_MAPPINGS,
  generateSeedSQL,
  getForumConfig,
  getActiveForumConfigs,
  getForumPlatformType,
};

export default forumConfigs;

