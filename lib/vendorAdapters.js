/**
 * Vendor Adapters for Parts Fitment Expansion
 *
 * Multi-vendor adapter pattern for normalizing fitment data from different sources.
 * Each vendor has unique tag formats, product structures, and confidence levels.
 *
 * @module lib/vendorAdapters
 */

// ============================================================================
// CAR SLUG MAPPINGS — Canonical mappings from vendor tags to our car slugs
// ============================================================================

/**
 * Platform tag patterns mapped to our car slugs.
 * Patterns can be RegExp or exact strings.
 * Higher specificity patterns should come first.
 */
export const PLATFORM_TAG_PATTERNS = {
  // ===========================================================================
  // VAG (Volkswagen Group)
  // ===========================================================================
  vag: [
    // Audi RS3
    { pattern: /8Y[- ]?RS3/i, car_slug: 'audi-rs3-8y', confidence: 0.85 },
    { pattern: /RS3.*8Y/i, car_slug: 'audi-rs3-8y', confidence: 0.80 },
    { pattern: /8V\.?2[- ]?RS3/i, car_slug: 'audi-rs3-8v', confidence: 0.80 },
    { pattern: /8V[- ]?RS3/i, car_slug: 'audi-rs3-8v', confidence: 0.85 },
    { pattern: /RS3.*8V/i, car_slug: 'audi-rs3-8v', confidence: 0.80 },
    { pattern: /RS3.*2\.5T/i, car_slug: 'audi-rs3-8v', confidence: 0.70 },

    // Audi TT RS
    { pattern: /8S[- ]?TT\s?RS/i, car_slug: 'audi-tt-rs-8s', confidence: 0.85 },
    { pattern: /TT\s?RS.*8S/i, car_slug: 'audi-tt-rs-8s', confidence: 0.80 },
    { pattern: /8J[- ]?TT\s?RS/i, car_slug: 'audi-tt-rs-8j', confidence: 0.85 },
    { pattern: /TT\s?RS.*8J/i, car_slug: 'audi-tt-rs-8j', confidence: 0.80 },

    // Audi RS5
    { pattern: /B9[- ]?RS5/i, car_slug: 'audi-rs5-b9', confidence: 0.85 },
    { pattern: /RS5.*B9/i, car_slug: 'audi-rs5-b9', confidence: 0.80 },
    { pattern: /B8[- ]?RS5/i, car_slug: 'audi-rs5-b8', confidence: 0.85 },
    { pattern: /RS5.*B8/i, car_slug: 'audi-rs5-b8', confidence: 0.80 },

    // Audi R8
    { pattern: /R8.*V10/i, car_slug: 'audi-r8-v10', confidence: 0.85 },
    { pattern: /V10.*R8/i, car_slug: 'audi-r8-v10', confidence: 0.80 },
    { pattern: /R8.*V8/i, car_slug: 'audi-r8-v8', confidence: 0.85 },
    { pattern: /V8.*R8/i, car_slug: 'audi-r8-v8', confidence: 0.80 },

    // VW GTI
    { pattern: /MK8[- ]?GTI/i, car_slug: 'volkswagen-gti-mk8', confidence: 0.85, notes: 'No MK8 GTI in DB yet' },
    { pattern: /MK7\.?5[- ]?GTI/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.80 },
    { pattern: /MK7[- ]?GTI/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.85 },
    { pattern: /GTI.*MK7/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.80 },
    { pattern: /GTI.*2\.0T.*\[?MQB\]?/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.75 },
    { pattern: /GTI 2\.0T \(Mk7/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.80 },

    // VW Golf R
    { pattern: /MK8[- ]?R(?!S)/i, car_slug: 'volkswagen-golf-r-mk8', confidence: 0.85 },
    { pattern: /Golf\s?R.*MK8/i, car_slug: 'volkswagen-golf-r-mk8', confidence: 0.80 },
    { pattern: /MK7\.?5[- ]?R(?!S)/i, car_slug: 'volkswagen-golf-r-mk7', confidence: 0.80 },
    { pattern: /MK7[- ]?R(?!S)/i, car_slug: 'volkswagen-golf-r-mk7', confidence: 0.85 },
    { pattern: /Golf\s?R.*MK7/i, car_slug: 'volkswagen-golf-r-mk7', confidence: 0.80 },
    { pattern: /Golf R 2\.0T \(Mk7/i, car_slug: 'volkswagen-golf-r-mk7', confidence: 0.80 },

    // Focus RS (technically Ford but often grouped with VAG by vendors)
    { pattern: /Focus\s?RS/i, car_slug: 'ford-focus-rs', confidence: 0.80 },
  ],

  // ===========================================================================
  // BMW
  // ===========================================================================
  bmw: [
    // M3
    { pattern: /E46[- ]?M3/i, car_slug: 'bmw-m3-e46', confidence: 0.85 },
    { pattern: /M3.*E46/i, car_slug: 'bmw-m3-e46', confidence: 0.80 },
    { pattern: /E9[02][- ]?M3/i, car_slug: 'bmw-m3-e92', confidence: 0.85 },
    { pattern: /M3.*E9[02]/i, car_slug: 'bmw-m3-e92', confidence: 0.80 },
    { pattern: /F80[- ]?M3/i, car_slug: 'bmw-m3-f80', confidence: 0.85 },
    { pattern: /M3.*F80/i, car_slug: 'bmw-m3-f80', confidence: 0.80 },
    { pattern: /G80[- ]?M3/i, car_slug: 'bmw-m3-g80', confidence: 0.85, notes: 'G80 M3 not in DB' },

    // M4
    { pattern: /F82[- ]?M4/i, car_slug: 'bmw-m4-f82', confidence: 0.85 },
    { pattern: /M4.*F82/i, car_slug: 'bmw-m4-f82', confidence: 0.80 },
    { pattern: /F83[- ]?M4/i, car_slug: 'bmw-m4-f82', confidence: 0.80, notes: 'F83 is convertible, maps to F82' },

    // M2
    { pattern: /F87[- ]?M2/i, car_slug: 'bmw-m2-competition', confidence: 0.85 },
    { pattern: /M2.*Comp/i, car_slug: 'bmw-m2-competition', confidence: 0.80 },

    // M5
    { pattern: /F90[- ]?M5/i, car_slug: 'bmw-m5-f90-competition', confidence: 0.85 },
    { pattern: /F10[- ]?M5/i, car_slug: 'bmw-m5-f10-competition', confidence: 0.85 },
    { pattern: /E60[- ]?M5/i, car_slug: 'bmw-m5-e60', confidence: 0.85 },
    { pattern: /E39[- ]?M5/i, car_slug: 'bmw-m5-e39', confidence: 0.85 },

    // 1M
    { pattern: /E82.*1M/i, car_slug: 'bmw-1m-coupe-e82', confidence: 0.85 },
    { pattern: /1M.*E82/i, car_slug: 'bmw-1m-coupe-e82', confidence: 0.80 },
    { pattern: /1\s?Series\s?M/i, car_slug: 'bmw-1m-coupe-e82', confidence: 0.75 },

    // Z4M
    { pattern: /E8[56][- ]?Z4\s?M/i, car_slug: 'bmw-z4m-e85-e86', confidence: 0.85 },
    { pattern: /Z4\s?M.*E8[56]/i, car_slug: 'bmw-z4m-e85-e86', confidence: 0.80 },

    // Generic platform codes
    { pattern: /S55/i, car_slug: 'bmw-m3-f80', confidence: 0.65, notes: 'S55 engine used in F80 M3, F82 M4' },
    { pattern: /S65/i, car_slug: 'bmw-m3-e92', confidence: 0.65, notes: 'S65 V8 in E9x M3' },
    { pattern: /S54/i, car_slug: 'bmw-m3-e46', confidence: 0.65, notes: 'S54 I6 in E46 M3' },
  ],

  // ===========================================================================
  // Porsche
  // ===========================================================================
  porsche: [
    // 718 Cayman
    { pattern: /718.*GT4/i, car_slug: '718-cayman-gt4', confidence: 0.85 },
    { pattern: /Cayman\s?GT4/i, car_slug: '718-cayman-gt4', confidence: 0.80 },
    { pattern: /718.*GTS\s?4\.0/i, car_slug: '718-cayman-gts-40', confidence: 0.85 },
    { pattern: /982.*Cayman/i, car_slug: '718-cayman-gt4', confidence: 0.75 },

    // 981 Cayman
    { pattern: /981.*GTS/i, car_slug: '981-cayman-gts', confidence: 0.85 },
    { pattern: /981.*Cayman\s?S/i, car_slug: '981-cayman-s', confidence: 0.85 },
    { pattern: /981.*Cayman/i, car_slug: '981-cayman-s', confidence: 0.70 },

    // 987 Cayman
    { pattern: /987\.?2.*Cayman/i, car_slug: '987-2-cayman-s', confidence: 0.80 },
    { pattern: /987.*Cayman/i, car_slug: '987-2-cayman-s', confidence: 0.70 },

    // 911 GT3
    { pattern: /997.*GT3/i, car_slug: 'porsche-911-gt3-997', confidence: 0.85 },
    { pattern: /996.*GT3/i, car_slug: 'porsche-911-gt3-996', confidence: 0.85 },
    { pattern: /GT3.*997/i, car_slug: 'porsche-911-gt3-997', confidence: 0.80 },

    // 911 Carrera
    { pattern: /991\.?1.*Carrera/i, car_slug: '991-1-carrera-s', confidence: 0.80 },
    { pattern: /997\.?2.*Carrera/i, car_slug: '997-2-carrera-s', confidence: 0.80 },

    // 911 Turbo
    { pattern: /997\.?2.*Turbo/i, car_slug: 'porsche-911-turbo-997-2', confidence: 0.85 },
    { pattern: /997\.?1.*Turbo/i, car_slug: 'porsche-911-turbo-997-1', confidence: 0.85 },
  ],

  // ===========================================================================
  // Nissan / Infiniti
  // ===========================================================================
  nissan: [
    { pattern: /R35.*GT-?R/i, car_slug: 'nissan-gt-r', confidence: 0.85 },
    { pattern: /GT-?R.*R35/i, car_slug: 'nissan-gt-r', confidence: 0.80 },
    { pattern: /GT-?R.*VR38/i, car_slug: 'nissan-gt-r', confidence: 0.75 },
    { pattern: /370Z.*NISMO/i, car_slug: 'nissan-370z-nismo', confidence: 0.85 },
    { pattern: /Z34.*370Z/i, car_slug: 'nissan-370z-nismo', confidence: 0.75 },
    { pattern: /370Z/i, car_slug: 'nissan-370z-nismo', confidence: 0.70 },
    { pattern: /Z33.*350Z/i, car_slug: 'nissan-350z', confidence: 0.80 },
    { pattern: /350Z/i, car_slug: 'nissan-350z', confidence: 0.70 },
    { pattern: /RZ34|Nissan\s?Z(?!\d)/i, car_slug: 'nissan-z-rz34', confidence: 0.80 },
    { pattern: /Z32.*300ZX/i, car_slug: 'nissan-300zx-twin-turbo-z32', confidence: 0.80 },
  ],

  // ===========================================================================
  // Toyota / Scion / Subaru (86 twins)
  // ===========================================================================
  toyota: [
    { pattern: /GR\s?Supra.*A90/i, car_slug: 'toyota-gr-supra', confidence: 0.85 },
    { pattern: /A90.*Supra/i, car_slug: 'toyota-gr-supra', confidence: 0.80 },
    { pattern: /MK5.*Supra/i, car_slug: 'toyota-gr-supra', confidence: 0.80 },
    { pattern: /GR\s?Supra/i, car_slug: 'toyota-gr-supra', confidence: 0.75 },
    { pattern: /A80.*Supra/i, car_slug: 'toyota-supra-mk4-a80-turbo', confidence: 0.85 },
    { pattern: /MK4.*Supra/i, car_slug: 'toyota-supra-mk4-a80-turbo', confidence: 0.80 },
    { pattern: /GR86/i, car_slug: 'toyota-gr86', confidence: 0.85 },
    { pattern: /ZN8.*86/i, car_slug: 'toyota-gr86', confidence: 0.80 },
    { pattern: /ZN6.*86|FT86|GT86/i, car_slug: 'toyota-86-scion-frs', confidence: 0.80 },
    { pattern: /FR-?S|Scion.*86/i, car_slug: 'toyota-86-scion-frs', confidence: 0.80 },
    { pattern: /ZD8.*BRZ/i, car_slug: 'subaru-brz-zd8', confidence: 0.80 },
    { pattern: /BRZ.*2nd.*Gen/i, car_slug: 'subaru-brz-zd8', confidence: 0.75 },
    { pattern: /ZC6.*BRZ/i, car_slug: 'subaru-brz-zc6', confidence: 0.80 },
    { pattern: /BRZ/i, car_slug: 'subaru-brz-zc6', confidence: 0.65 },
  ],

  // ===========================================================================
  // Subaru (WRX/STI)
  // ===========================================================================
  subaru: [
    // STI VA (2015-2021)
    { pattern: /VA.*STI|STI.*VA/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.85 },
    { pattern: /15[-\s]?21.*STI|2015[-\s]?2021.*STI/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.80 },
    { pattern: /VA\s?(?:sedan|Sedan).*STI/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.80 },
    
    // STI GR/GV (2008-2014, hatch)
    { pattern: /GR.*STI|GV.*STI|STI.*GR|STI.*GV/i, car_slug: 'subaru-wrx-sti-gr-gv', confidence: 0.85 },
    { pattern: /08[-\s]?14.*STI|2008[-\s]?2014.*STI/i, car_slug: 'subaru-wrx-sti-gr-gv', confidence: 0.80 },
    { pattern: /STI.*Hatch|Hatch.*STI/i, car_slug: 'subaru-wrx-sti-gr-gv', confidence: 0.80 },
    { pattern: /Wide.*Body.*STI.*Hatch/i, car_slug: 'subaru-wrx-sti-gr-gv', confidence: 0.80 },
    
    // STI GD (2004-2007, blobeye/hawkeye)
    { pattern: /GD.*STI|STI.*GD/i, car_slug: 'subaru-wrx-sti-gd', confidence: 0.85 },
    { pattern: /04[-\s]?07.*STI|2004[-\s]?2007.*STI/i, car_slug: 'subaru-wrx-sti-gd', confidence: 0.80 },
    { pattern: /Blob.*Eye.*STI|Hawk.*Eye.*STI/i, car_slug: 'subaru-wrx-sti-gd', confidence: 0.80 },
    
    // STI GC8 (1994-2001)
    { pattern: /GC8.*STI|STI.*GC8/i, car_slug: 'subaru-wrx-sti-gc8', confidence: 0.85 },
    { pattern: /GC8.*WRX|WRX.*GC8/i, car_slug: 'subaru-impreza-wrx-gc8', confidence: 0.85 },
    { pattern: /94[-\s]?01.*(?:STI|WRX)|Impreza.*GC8/i, car_slug: 'subaru-impreza-wrx-gc8', confidence: 0.80 },
    
    // WRX general patterns (non-STI)
    { pattern: /VA.*WRX(?!.*STI)|WRX.*VA(?!.*STI)/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.70, notes: 'WRX VA maps to STI VA' },
    { pattern: /15[-\s]?21.*WRX(?!.*STI)/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.70 },
    { pattern: /VB.*WRX|WRX.*VB/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.70, notes: 'VB is 2022+ WRX - needs slug' },
    
    // Forester XT
    { pattern: /SG.*Forester.*XT|Forester.*XT.*SG/i, car_slug: 'subaru-forester-xt-sg', confidence: 0.85 },
    { pattern: /03[-\s]?08.*Forester.*XT/i, car_slug: 'subaru-forester-xt-sg', confidence: 0.80 },
    
    // Legacy GT
    { pattern: /BL.*Legacy.*GT|Legacy.*GT.*BL|Spec.*B/i, car_slug: 'subaru-legacy-gt-spec-b-bl', confidence: 0.85 },
    { pattern: /05[-\s]?09.*Legacy.*GT/i, car_slug: 'subaru-legacy-gt-spec-b-bl', confidence: 0.80 },
    
    // EJ engine codes
    { pattern: /\bEJ25[57]\b/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.65, notes: 'EJ257 in STI' },
    { pattern: /\bEJ20[7G]\b/i, car_slug: 'subaru-wrx-sti-gc8', confidence: 0.65, notes: 'EJ20 in early WRX/STI' },
    { pattern: /\bFA20DIT\b/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.65, notes: 'FA20DIT in VA WRX' },
  ],

  // ===========================================================================
  // Domestic (Corvette, Mustang, Camaro, Ford)
  // ===========================================================================
  domestic: [
    // Corvette C8
    { pattern: /C8.*Corvette|Corvette.*C8/i, car_slug: 'c8-corvette-stingray', confidence: 0.85 },
    { pattern: /C8.*Z06|Z06.*C8/i, car_slug: 'chevrolet-corvette-z06-c8', confidence: 0.85 },
    { pattern: /20[-\s]?26.*Corvette|2020[-\s]?2026.*Corvette/i, car_slug: 'c8-corvette-stingray', confidence: 0.75 },
    { pattern: /\bLT2\b.*Corvette|Corvette.*\bLT2\b/i, car_slug: 'c8-corvette-stingray', confidence: 0.75 },
    
    // Corvette C7
    { pattern: /C7.*Z06|Z06.*C7/i, car_slug: 'c7-corvette-z06', confidence: 0.85 },
    { pattern: /C7.*Grand\s?Sport|Grand\s?Sport.*C7/i, car_slug: 'c7-corvette-grand-sport', confidence: 0.85 },
    { pattern: /C7.*Stingray|Stingray.*C7/i, car_slug: 'c7-corvette-grand-sport', confidence: 0.80 },
    { pattern: /14[-\s]?19.*Corvette|2014[-\s]?2019.*Corvette/i, car_slug: 'c7-corvette-grand-sport', confidence: 0.75 },
    { pattern: /\bLT1\b.*C7|C7.*\bLT1\b/i, car_slug: 'c7-corvette-grand-sport', confidence: 0.75 },
    { pattern: /\bLT4\b.*Corvette|Corvette.*\bLT4\b/i, car_slug: 'c7-corvette-z06', confidence: 0.80 },
    
    // Corvette C6
    { pattern: /C6.*Z06|Z06.*C6/i, car_slug: 'chevrolet-corvette-c6-z06', confidence: 0.85 },
    { pattern: /C6.*Grand\s?Sport|Grand\s?Sport.*C6/i, car_slug: 'chevrolet-corvette-c6-grand-sport', confidence: 0.85 },
    { pattern: /05[-\s]?13.*Corvette|2005[-\s]?2013.*Corvette/i, car_slug: 'chevrolet-corvette-c6-grand-sport', confidence: 0.75 },
    { pattern: /\bLS7\b.*Corvette|Corvette.*\bLS7\b/i, car_slug: 'chevrolet-corvette-c6-z06', confidence: 0.80 },
    
    // Corvette C5
    { pattern: /C5.*Z06|Z06.*C5/i, car_slug: 'chevrolet-corvette-c5-z06', confidence: 0.85 },
    { pattern: /97[-\s]?04.*Corvette|1997[-\s]?2004.*Corvette/i, car_slug: 'chevrolet-corvette-c5-z06', confidence: 0.75 },
    { pattern: /\bLS6\b.*Corvette|Corvette.*\bLS6\b/i, car_slug: 'chevrolet-corvette-c5-z06', confidence: 0.80 },

    // Camaro ZL1
    { pattern: /ZL1.*Camaro|Camaro.*ZL1/i, car_slug: 'camaro-zl1', confidence: 0.85 },
    { pattern: /6th.*Gen.*Camaro.*ZL1/i, car_slug: 'camaro-zl1', confidence: 0.80 },
    { pattern: /16[-\s]?24.*Camaro.*ZL1/i, car_slug: 'camaro-zl1', confidence: 0.80 },
    
    // Camaro SS 1LE
    { pattern: /SS.*1LE|1LE.*SS/i, car_slug: 'camaro-ss-1le', confidence: 0.85 },
    { pattern: /6th.*Gen.*Camaro.*SS/i, car_slug: 'camaro-ss-1le', confidence: 0.75 },
    { pattern: /16[-\s]?24.*Camaro.*SS/i, car_slug: 'camaro-ss-1le', confidence: 0.75 },
    { pattern: /Alpha.*Platform.*Camaro/i, car_slug: 'camaro-ss-1le', confidence: 0.70 },
    
    // Camaro 5th Gen
    { pattern: /5th.*Gen.*Camaro.*SS/i, car_slug: 'chevrolet-camaro-ss-ls1', confidence: 0.75, notes: '5th gen is 2010-2015' },
    { pattern: /10[-\s]?15.*Camaro.*SS/i, car_slug: 'chevrolet-camaro-ss-ls1', confidence: 0.75 },

    // Shelby GT350/GT500
    { pattern: /GT350[R]?/i, car_slug: 'shelby-gt350', confidence: 0.85 },
    { pattern: /Shelby.*GT350|GT350.*Shelby/i, car_slug: 'shelby-gt350', confidence: 0.85 },
    { pattern: /GT500/i, car_slug: 'shelby-gt500', confidence: 0.85 },
    { pattern: /Shelby.*GT500|GT500.*Shelby/i, car_slug: 'shelby-gt500', confidence: 0.85 },
    
    // Mustang GT S550 (2015-2024)
    { pattern: /S550.*(?:GT|Mustang)|Mustang.*S550/i, car_slug: 'mustang-gt-pp2', confidence: 0.85 },
    { pattern: /15[-\s]?24.*Mustang.*GT|Mustang.*GT.*15[-\s]?24/i, car_slug: 'mustang-gt-pp2', confidence: 0.80 },
    { pattern: /6th.*Gen.*Mustang.*GT/i, car_slug: 'mustang-gt-pp2', confidence: 0.75 },
    { pattern: /PP[12].*Mustang|Mustang.*PP[12]/i, car_slug: 'mustang-gt-pp2', confidence: 0.80 },
    { pattern: /\bCoyote\b.*Mustang|Mustang.*\bCoyote\b/i, car_slug: 'mustang-gt-pp2', confidence: 0.75 },
    
    // Mustang S197 (2005-2014)
    { pattern: /S197.*Mustang|Mustang.*S197/i, car_slug: 'ford-mustang-gt-sn95', confidence: 0.80 },
    { pattern: /05[-\s]?14.*Mustang.*GT/i, car_slug: 'ford-mustang-gt-sn95', confidence: 0.75 },
    { pattern: /5th.*Gen.*Mustang/i, car_slug: 'ford-mustang-gt-sn95', confidence: 0.70 },
    
    // Mustang Boss 302
    { pattern: /Boss\s?302/i, car_slug: 'ford-mustang-boss-302', confidence: 0.85 },
    { pattern: /12[-\s]?13.*Boss|Boss.*12[-\s]?13/i, car_slug: 'ford-mustang-boss-302', confidence: 0.80 },
    
    // Mustang SVT Cobra / Terminator
    { pattern: /Terminator.*Cobra|Cobra.*Terminator/i, car_slug: 'ford-mustang-cobra-terminator', confidence: 0.85 },
    { pattern: /03[-\s]?04.*Cobra|SVT.*Cobra.*03/i, car_slug: 'ford-mustang-cobra-terminator', confidence: 0.80 },
    { pattern: /SN95.*Cobra|Cobra.*SN95/i, car_slug: 'ford-mustang-svt-cobra-sn95', confidence: 0.85 },
    
    // Mustang Fox Body
    { pattern: /Fox.*Body.*Mustang|Mustang.*Fox.*Body/i, car_slug: 'ford-mustang-gt-fox-body', confidence: 0.85 },
    { pattern: /79[-\s]?93.*Mustang|Mustang.*79[-\s]?93/i, car_slug: 'ford-mustang-gt-fox-body', confidence: 0.80 },
    
    // Mustang EcoBoost
    { pattern: /EcoBoost.*Mustang|Mustang.*EcoBoost/i, car_slug: 'mustang-gt-pp2', confidence: 0.70, notes: 'EcoBoost - needs separate slug' },
    { pattern: /2\.3.*Turbo.*Mustang|Mustang.*2\.3T/i, car_slug: 'mustang-gt-pp2', confidence: 0.65 },

    // Focus RS/ST
    { pattern: /Focus\s?RS/i, car_slug: 'ford-focus-rs', confidence: 0.85 },
    { pattern: /16[-\s]?18.*Focus.*RS/i, car_slug: 'ford-focus-rs', confidence: 0.80 },
    { pattern: /Focus\s?ST.*MK3|MK3.*Focus\s?ST/i, car_slug: 'ford-focus-st-mk3', confidence: 0.85 },
    { pattern: /13[-\s]?18.*Focus.*ST/i, car_slug: 'ford-focus-st-mk3', confidence: 0.80 },

    // Hellcat / SRT
    { pattern: /Challenger.*Hellcat|Hellcat.*Challenger/i, car_slug: 'dodge-challenger-hellcat', confidence: 0.85 },
    { pattern: /Charger.*Hellcat|Hellcat.*Charger/i, car_slug: 'dodge-charger-hellcat', confidence: 0.85 },
    { pattern: /Challenger.*SRT.*392|392.*Challenger/i, car_slug: 'dodge-challenger-srt-392', confidence: 0.85 },
    { pattern: /Charger.*SRT.*392|392.*Charger/i, car_slug: 'dodge-charger-srt-392', confidence: 0.85 },
    { pattern: /\bLC2\b.*Hellcat|Hellcat.*\bLC2\b/i, car_slug: 'dodge-challenger-hellcat', confidence: 0.75, notes: '6.2L Supercharged' },
    { pattern: /\b6\.4L\b.*(?:Challenger|Charger)/i, car_slug: 'dodge-challenger-srt-392', confidence: 0.75 },

    // Cadillac CTS-V / CT4-V / CT5-V
    { pattern: /CTS-?V.*Gen\s?2|Gen\s?2.*CTS-?V/i, car_slug: 'cadillac-cts-v-gen2', confidence: 0.85 },
    { pattern: /09[-\s]?15.*CTS-?V/i, car_slug: 'cadillac-cts-v-gen2', confidence: 0.80 },
    { pattern: /CTS-?V.*Gen\s?3|Gen\s?3.*CTS-?V/i, car_slug: 'cadillac-cts-v-gen3', confidence: 0.85 },
    { pattern: /16[-\s]?19.*CTS-?V/i, car_slug: 'cadillac-cts-v-gen3', confidence: 0.80 },
    { pattern: /CTS-?V.*Gen\s?1|Gen\s?1.*CTS-?V/i, car_slug: 'cadillac-cts-v-gen1', confidence: 0.85 },
    { pattern: /04[-\s]?07.*CTS-?V/i, car_slug: 'cadillac-cts-v-gen1', confidence: 0.80 },
    { pattern: /CT5-?V.*Blackwing/i, car_slug: 'cadillac-ct5-v-blackwing', confidence: 0.85 },
    { pattern: /CT4-?V.*Blackwing/i, car_slug: 'cadillac-ct4-v-blackwing', confidence: 0.85 },
    { pattern: /ATS-?V/i, car_slug: 'cadillac-ats-v-first-generation', confidence: 0.85 },

    // Dodge Viper
    { pattern: /Dodge.*Viper|Viper.*SRT/i, car_slug: 'dodge-viper', confidence: 0.85 },
    { pattern: /Viper.*ACR|ACR.*Viper/i, car_slug: 'dodge-viper', confidence: 0.85 },
    
    // Chevy SS
    { pattern: /Chevy\s?SS|Chevrolet\s?SS/i, car_slug: 'chevrolet-ss-vf', confidence: 0.85 },
    { pattern: /VF.*Commodore|SS.*VF/i, car_slug: 'chevrolet-ss-vf', confidence: 0.85 },
    { pattern: /14[-\s]?17.*(?:Chevy|Chevrolet)\s?SS/i, car_slug: 'chevrolet-ss-vf', confidence: 0.80 },
    
    // Pontiac G8
    { pattern: /G8.*GXP|GXP.*G8/i, car_slug: 'pontiac-g8-gxp-2009', confidence: 0.85 },
    { pattern: /G8.*GT|GT.*G8/i, car_slug: 'pontiac-g8-gt', confidence: 0.85 },
    { pattern: /08[-\s]?09.*G8/i, car_slug: 'pontiac-g8-gt', confidence: 0.80 },
    
    // Engine codes
    { pattern: /\bLT1\b.*(?!Corvette)/i, car_slug: 'camaro-ss-1le', confidence: 0.60, notes: 'LT1 in 6th gen Camaro' },
    { pattern: /\bLS3\b/i, car_slug: 'chevrolet-corvette-c6-grand-sport', confidence: 0.60, notes: 'LS3 in C6/5th gen Camaro' },
    { pattern: /\bLSA\b/i, car_slug: 'cadillac-cts-v-gen2', confidence: 0.65, notes: 'LSA supercharged' },
  ],

  // ===========================================================================
  // Honda / Acura
  // ===========================================================================
  honda: [
    // Civic Type R
    { pattern: /FK8.*Type\s?R|CTR.*FK8/i, car_slug: 'honda-civic-type-r-fk8', confidence: 0.85 },
    { pattern: /FL5.*Type\s?R|CTR.*FL5/i, car_slug: 'honda-civic-type-r-fl5', confidence: 0.85 },
    { pattern: /Civic\s?Type[- ]?R.*FL5|FL5.*Civic/i, car_slug: 'honda-civic-type-r-fl5', confidence: 0.85 },
    { pattern: /23\+?\s*Civic\s?Type[- ]?R|22\+?\s*Civic\s?Type[- ]?R/i, car_slug: 'honda-civic-type-r-fl5', confidence: 0.80 },
    { pattern: /17[-\s]?21.*Type\s?R|2017[-\s]?2021.*Type\s?R/i, car_slug: 'honda-civic-type-r-fk8', confidence: 0.80 },
    { pattern: /10th\s*gen.*Type\s?R/i, car_slug: 'honda-civic-type-r-fk8', confidence: 0.75 },
    { pattern: /11th\s*gen.*Type\s?R/i, car_slug: 'honda-civic-type-r-fl5', confidence: 0.75 },
    
    // S2000
    { pattern: /AP1.*S2000|AP2.*S2000/i, car_slug: 'honda-s2000', confidence: 0.85 },
    { pattern: /S2000.*AP[12]/i, car_slug: 'honda-s2000', confidence: 0.85 },
    { pattern: /\bS2000\b/i, car_slug: 'honda-s2000', confidence: 0.75 },
    { pattern: /00[-\s]?09.*S2000|99[-\s]?09.*S2000/i, car_slug: 'honda-s2000', confidence: 0.80 },
    
    // Integra Type R
    { pattern: /DC2.*Integra.*Type\s?R|DC2.*ITR/i, car_slug: 'acura-integra-type-r-dc2', confidence: 0.85 },
    { pattern: /Integra\s?Type[- ]?R.*DC2/i, car_slug: 'acura-integra-type-r-dc2', confidence: 0.85 },
    { pattern: /94[-\s]?01.*Integra.*Type\s?R/i, car_slug: 'acura-integra-type-r-dc2', confidence: 0.80 },
    { pattern: /\bITR\b.*DC2|DC2.*\bITR\b/i, car_slug: 'acura-integra-type-r-dc2', confidence: 0.80 },
    
    // RSX / Integra DC5
    { pattern: /DC5.*RSX|RSX.*DC5/i, car_slug: 'acura-integra-type-s-dc5', confidence: 0.85 },
    { pattern: /RSX\s?Type[- ]?S|RSX-S/i, car_slug: 'acura-integra-type-s-dc5', confidence: 0.85 },
    { pattern: /02[-\s]?06.*RSX/i, car_slug: 'acura-integra-type-s-dc5', confidence: 0.80 },
    { pattern: /Integra.*DC5/i, car_slug: 'acura-integra-type-s-dc5', confidence: 0.80 },
    
    // Civic Si generations
    { pattern: /FG2.*Si|Si.*FG2/i, car_slug: 'honda-civic-si-fg2', confidence: 0.85 },
    { pattern: /FA5.*Si|Si.*FA5/i, car_slug: 'honda-civic-si-fg2', confidence: 0.85, notes: 'FA5 sedan maps to FG2' },
    { pattern: /06[-\s]?11.*Civic\s?Si|8th\s*gen.*Civic\s?Si/i, car_slug: 'honda-civic-si-fg2', confidence: 0.80 },
    { pattern: /EP3.*Si|Si.*EP3/i, car_slug: 'honda-civic-si-ep3', confidence: 0.85 },
    { pattern: /02[-\s]?05.*Civic\s?Si/i, car_slug: 'honda-civic-si-ep3', confidence: 0.80 },
    { pattern: /EM1.*Si|Si.*EM1/i, car_slug: 'honda-civic-si-em1', confidence: 0.85 },
    { pattern: /99[-\s]?00.*Civic\s?Si/i, car_slug: 'honda-civic-si-em1', confidence: 0.80 },
    { pattern: /22[-\s]?24.*Civic\s?Si|22\+.*Civic\s?Si/i, car_slug: 'honda-civic-si-fg2', confidence: 0.70, notes: '11th gen Si - needs slug' },
    
    // Civic generations (general)
    { pattern: /EG.*Civic|Civic.*EG/i, car_slug: 'honda-civic-si-em1', confidence: 0.70, notes: 'EG Civic 92-95' },
    { pattern: /EK.*Civic|Civic.*EK/i, car_slug: 'honda-civic-si-em1', confidence: 0.70, notes: 'EK Civic 96-00' },
    { pattern: /92[-\s]?00.*Civic|96[-\s]?00.*Civic/i, car_slug: 'honda-civic-si-em1', confidence: 0.65 },
    
    // Prelude
    { pattern: /BB6.*Prelude|Prelude.*BB6/i, car_slug: 'honda-prelude-si-vtec-bb4', confidence: 0.85 },
    { pattern: /92[-\s]?01.*Prelude|97[-\s]?01.*Prelude/i, car_slug: 'honda-prelude-si-vtec-bb4', confidence: 0.80 },
    { pattern: /Prelude.*VTEC|VTEC.*Prelude/i, car_slug: 'honda-prelude-si-vtec-bb4', confidence: 0.75 },
    
    // CRX
    { pattern: /EF.*CRX|CRX.*EF/i, car_slug: 'honda-crx-si-ef', confidence: 0.85 },
    { pattern: /CRX\s?Si/i, car_slug: 'honda-crx-si-ef', confidence: 0.80 },
    { pattern: /88[-\s]?91.*CRX/i, car_slug: 'honda-crx-si-ef', confidence: 0.80 },
    
    // Del Sol
    { pattern: /Del\s?Sol.*VTEC/i, car_slug: 'honda-del-sol-vtec-eg', confidence: 0.85 },
    { pattern: /EG.*Del\s?Sol|Del\s?Sol.*EG/i, car_slug: 'honda-del-sol-vtec-eg', confidence: 0.85 },
    { pattern: /93[-\s]?97.*Del\s?Sol/i, car_slug: 'honda-del-sol-vtec-eg', confidence: 0.80 },
    
    // Accord
    { pattern: /10th\s*gen.*Accord.*2\.0T|Accord.*2\.0T.*10th/i, car_slug: 'honda-accord-sport-2-0t-tenth-generation', confidence: 0.80 },
    { pattern: /18[-\s]?22.*Accord.*2\.0T/i, car_slug: 'honda-accord-sport-2-0t-tenth-generation', confidence: 0.80 },
    
    // TL Type-S
    { pattern: /TL.*Type[- ]?S|Type[- ]?S.*TL/i, car_slug: 'acura-tl-type-s-ua6', confidence: 0.85 },
    { pattern: /UA6.*TL|TL.*UA6/i, car_slug: 'acura-tl-type-s-ua6', confidence: 0.85 },
    
    // TSX
    { pattern: /CU2.*TSX|TSX.*CU2/i, car_slug: 'acura-tsx-cu2', confidence: 0.85 },
    { pattern: /09[-\s]?14.*TSX/i, car_slug: 'acura-tsx-cu2', confidence: 0.80 },
    
    // Engine code patterns (K-series, B-series, etc.)
    { pattern: /\bK20[AC]?\b.*Type\s?R/i, car_slug: 'honda-civic-type-r-fk8', confidence: 0.70 },
    { pattern: /\bK24[AZ]?\b/i, car_slug: 'acura-tsx-cu2', confidence: 0.60, notes: 'K24 generic' },
    { pattern: /\bF20C\b|\bF22C\b/i, car_slug: 'honda-s2000', confidence: 0.80 },
    { pattern: /\bB18C\b.*Type\s?R/i, car_slug: 'acura-integra-type-r-dc2', confidence: 0.80 },
  ],

  // ===========================================================================
  // Toyota / Lexus / Scion (including Subaru twins)
  // ===========================================================================
  toyotasubaru: [
    // GR86 / BRZ (2nd gen - ZN8/ZD8)
    { pattern: /GR86|GR\s?86/i, car_slug: 'toyota-gr86', confidence: 0.85 },
    { pattern: /ZN8.*86|86.*ZN8/i, car_slug: 'toyota-gr86', confidence: 0.85 },
    { pattern: /22[-\s]?26.*(?:86|BRZ)|2022[-\s]?2026.*(?:86|BRZ)/i, car_slug: 'toyota-gr86', confidence: 0.80 },
    { pattern: /2nd\s*gen.*BRZ|BRZ.*2nd\s*gen/i, car_slug: 'subaru-brz-zd8', confidence: 0.85 },
    { pattern: /ZD8.*BRZ|BRZ.*ZD8/i, car_slug: 'subaru-brz-zd8', confidence: 0.85 },
    { pattern: /22\+.*BRZ|2022\+.*BRZ/i, car_slug: 'subaru-brz-zd8', confidence: 0.80 },
    
    // 86 / FR-S / BRZ (1st gen - ZN6/ZC6)
    { pattern: /ZN6.*86|86.*ZN6/i, car_slug: 'toyota-86-scion-frs', confidence: 0.85 },
    { pattern: /GT86|GT-86/i, car_slug: 'toyota-86-scion-frs', confidence: 0.85 },
    { pattern: /FT86|FT-86/i, car_slug: 'toyota-86-scion-frs', confidence: 0.85 },
    { pattern: /FR-?S|Scion.*86/i, car_slug: 'toyota-86-scion-frs', confidence: 0.85 },
    { pattern: /13[-\s]?16.*(?:FR-?S|86)/i, car_slug: 'toyota-86-scion-frs', confidence: 0.80 },
    { pattern: /17[-\s]?20.*86|2017[-\s]?2020.*86/i, car_slug: 'toyota-86-scion-frs', confidence: 0.80 },
    { pattern: /ZC6.*BRZ|BRZ.*ZC6/i, car_slug: 'subaru-brz-zc6', confidence: 0.85 },
    { pattern: /1st\s*gen.*BRZ|BRZ.*1st\s*gen/i, car_slug: 'subaru-brz-zc6', confidence: 0.80 },
    { pattern: /13[-\s]?20.*BRZ|2013[-\s]?2020.*BRZ/i, car_slug: 'subaru-brz-zc6', confidence: 0.80 },
    { pattern: /13[-\s]?16.*Subaru\s?BRZ/i, car_slug: 'subaru-brz-zc6', confidence: 0.80 },
    { pattern: /17[-\s]?20.*Subaru\s?BRZ/i, car_slug: 'subaru-brz-zc6', confidence: 0.80 },
    
    // GR Supra (A90)
    { pattern: /GR\s?Supra|Supra.*A90|A90.*Supra/i, car_slug: 'toyota-gr-supra', confidence: 0.85 },
    { pattern: /MK5.*Supra|Supra.*MK5|5th\s*gen.*Supra/i, car_slug: 'toyota-gr-supra', confidence: 0.85 },
    { pattern: /19[-\s]?26.*Supra|2019[-\s]?2026.*Supra/i, car_slug: 'toyota-gr-supra', confidence: 0.80 },
    { pattern: /\bB58\b.*Supra|Supra.*\bB58\b/i, car_slug: 'toyota-gr-supra', confidence: 0.75 },
    
    // MK4 Supra (A80)
    { pattern: /A80.*Supra|Supra.*A80/i, car_slug: 'toyota-supra-mk4-a80-turbo', confidence: 0.85 },
    { pattern: /MK4.*Supra|Supra.*MK4|4th\s*gen.*Supra/i, car_slug: 'toyota-supra-mk4-a80-turbo', confidence: 0.85 },
    { pattern: /\b2JZ\b.*Supra|Supra.*\b2JZ\b/i, car_slug: 'toyota-supra-mk4-a80-turbo', confidence: 0.80 },
    { pattern: /93[-\s]?02.*Supra|1993[-\s]?2002.*Supra/i, car_slug: 'toyota-supra-mk4-a80-turbo', confidence: 0.80 },
    
    // GR Corolla
    { pattern: /GR\s?Corolla/i, car_slug: 'toyota-gr-corolla', confidence: 0.85, notes: 'Need to verify slug exists' },
    { pattern: /23[-\s]?26.*Corolla.*GR|GR.*Corolla/i, car_slug: 'toyota-gr-corolla', confidence: 0.80 },
    
    // MR2
    { pattern: /SW20.*MR2|MR2.*SW20|MR2\s?Turbo/i, car_slug: 'toyota-mr2-turbo-sw20', confidence: 0.85 },
    { pattern: /ZZW30.*MR2|MR2.*ZZW30|MR2\s?Spyder/i, car_slug: 'toyota-mr2-spyder-zzw30', confidence: 0.85 },
    
    // Celica GT-Four
    { pattern: /ST205.*Celica|Celica.*ST205|GT-?Four.*ST205/i, car_slug: 'toyota-celica-gt-four-st205', confidence: 0.85 },
    { pattern: /Celica.*GT-?Four|GT-?Four.*Celica/i, car_slug: 'toyota-celica-gt-four-st205', confidence: 0.80 },
    
    // Lexus IS
    { pattern: /IS300.*XE10|XE10.*IS300/i, car_slug: 'lexus-is300-xe10', confidence: 0.85 },
    { pattern: /\b2JZ-GE\b.*IS|IS.*\b2JZ\b/i, car_slug: 'lexus-is300-xe10', confidence: 0.80 },
    { pattern: /01[-\s]?05.*IS300|IS300.*01[-\s]?05/i, car_slug: 'lexus-is300-xe10', confidence: 0.80 },
    { pattern: /IS350.*F.*Sport|IS350.*XE30/i, car_slug: 'lexus-is350-f-sport-xe30', confidence: 0.85 },
    { pattern: /IS-?F|IS\s?F\b/i, car_slug: 'lexus-is-f-use20', confidence: 0.85 },
    
    // Lexus RC-F / LC500
    { pattern: /RC-?F|RC\s?F\b/i, car_slug: 'lexus-rc-f', confidence: 0.85 },
    { pattern: /LC\s?500|LC500/i, car_slug: 'lexus-lc-500', confidence: 0.85 },
    { pattern: /GS-?F|GS\s?F\b/i, car_slug: 'lexus-gs-f-url2', confidence: 0.85 },
    
    // FA20/FA24 engine patterns (86/BRZ twins)
    { pattern: /\bFA20\b/i, car_slug: 'toyota-86-scion-frs', confidence: 0.65, notes: 'FA20 in 1st gen 86/BRZ' },
    { pattern: /\bFA24\b/i, car_slug: 'toyota-gr86', confidence: 0.65, notes: 'FA24 in 2nd gen 86/BRZ' },
  ],

  // ===========================================================================
  // Mazda
  // ===========================================================================
  mazda: [
    { pattern: /ND.*Miata|ND.*MX-?5/i, car_slug: 'mazda-mx5-miata-nd', confidence: 0.85 },
    { pattern: /NC.*Miata|NC.*MX-?5/i, car_slug: 'mazda-mx5-miata-nc', confidence: 0.85 },
    { pattern: /NB.*Miata|NB.*MX-?5/i, car_slug: 'mazda-mx5-miata-nb', confidence: 0.85 },
    { pattern: /NA.*Miata|NA.*MX-?5/i, car_slug: 'mazda-mx5-miata-na', confidence: 0.85 },
    { pattern: /FD3?S.*RX-?7|RX-?7.*FD/i, car_slug: 'mazda-rx7-fd3s', confidence: 0.85 },
  ],

  // ===========================================================================
  // Mitsubishi
  // ===========================================================================
  mitsubishi: [
    // Evo X (2008-2015)
    { pattern: /Evo\s?X|Evo\s?10|CZ4A/i, car_slug: 'mitsubishi-lancer-evo-x', confidence: 0.85 },
    { pattern: /Lancer.*Evolution.*X|Evolution.*X.*Lancer/i, car_slug: 'mitsubishi-lancer-evo-x', confidence: 0.85 },
    { pattern: /08[-\s]?15.*Evo|Evo.*08[-\s]?15/i, car_slug: 'mitsubishi-lancer-evo-x', confidence: 0.80 },
    { pattern: /4B11T?.*Evo|Evo.*4B11/i, car_slug: 'mitsubishi-lancer-evo-x', confidence: 0.75 },
    
    // Evo 8/9 (2003-2007)
    { pattern: /Evo\s?[89]|Evo\s?VIII|Evo\s?IX|CT9A/i, car_slug: 'mitsubishi-lancer-evo-8-9', confidence: 0.85 },
    { pattern: /Lancer.*Evolution.*(?:VIII|IX|8|9)/i, car_slug: 'mitsubishi-lancer-evo-8-9', confidence: 0.85 },
    { pattern: /03[-\s]?07.*Evo|Evo.*03[-\s]?07/i, car_slug: 'mitsubishi-lancer-evo-8-9', confidence: 0.80 },
    { pattern: /4G63T?.*Evo|Evo.*4G63/i, car_slug: 'mitsubishi-lancer-evo-8-9', confidence: 0.75 },
    
    // Generic Evo patterns (fallback to Evo X as most common)
    { pattern: /\bEvo\b(?!\s*\d)|Lancer\s*Evolution/i, car_slug: 'mitsubishi-lancer-evo-x', confidence: 0.65 },
  ],

  // ===========================================================================
  // Mercedes / Mercedes-AMG
  // ===========================================================================
  mercedes: [
    { pattern: /W204.*C63|C63.*W204/i, car_slug: 'mercedes-c63-amg-w204', confidence: 0.85 },
    { pattern: /W205.*C63|C63.*W205/i, car_slug: 'mercedes-amg-c63-w205', confidence: 0.85 },
    { pattern: /W212.*E63|E63.*W212/i, car_slug: 'mercedes-amg-e63-w212', confidence: 0.85 },
    { pattern: /W213.*E63\s?S|E63\s?S.*W213/i, car_slug: 'mercedes-amg-e63s-w213', confidence: 0.85 },
    { pattern: /AMG\s?GT|Mercedes-?AMG\s?GT/i, car_slug: 'mercedes-amg-gt', confidence: 0.85 },
  ],

  // ===========================================================================
  // Misc / Exotic / Other
  // ===========================================================================
  misc: [
    // Alfa Romeo
    { pattern: /Alfa.*4C|\b4C\b/i, car_slug: 'alfa-romeo-4c', confidence: 0.85 },
    { pattern: /Giulia.*Quadrifoglio|Quadrifoglio/i, car_slug: 'alfa-romeo-giulia-quadrifoglio', confidence: 0.85 },

    // Aston Martin
    { pattern: /Aston.*Vantage|V8\s?Vantage/i, car_slug: 'aston-martin-v8-vantage', confidence: 0.85 },

    // Jaguar
    { pattern: /F-?Type.*V6\s?S/i, car_slug: 'jaguar-f-type-v6-s', confidence: 0.85 },
    { pattern: /F-?Type.*\bR\b|F-?Type\s?R/i, car_slug: 'jaguar-f-type-r', confidence: 0.85 },

    // Lamborghini
    { pattern: /Gallardo/i, car_slug: 'lamborghini-gallardo', confidence: 0.85 },

    // Lexus
    { pattern: /LC\s?500|Lexus.*LC/i, car_slug: 'lexus-lc-500', confidence: 0.85 },
    { pattern: /RC\s?F|RCF/i, car_slug: 'lexus-rc-f', confidence: 0.85 },

    // Lotus
    { pattern: /Elise.*S2|Lotus.*Elise/i, car_slug: 'lotus-elise-s2', confidence: 0.85 },
    { pattern: /Emira/i, car_slug: 'lotus-emira', confidence: 0.85 },
    { pattern: /Evora\s?GT/i, car_slug: 'lotus-evora-gt', confidence: 0.85 },
    { pattern: /Evora\s?S/i, car_slug: 'lotus-evora-s', confidence: 0.85 },
    { pattern: /Exige\s?S/i, car_slug: 'lotus-exige-s', confidence: 0.85 },

    // Maserati
    { pattern: /GranTurismo/i, car_slug: 'maserati-granturismo', confidence: 0.85 },

    // Tesla
    { pattern: /Model\s?3.*Performance|Tesla.*Model\s?3.*Performance|M3P/i, car_slug: 'tesla-model-3-performance', confidence: 0.85 },
  ],

  // ===========================================================================
  // Trucks (NEW - High Market Demand Tier 1)
  // ===========================================================================
  trucks: [
    // Ford F-150 (Tier 1 - #1 US Modification Market)
    { pattern: /F-?150.*20(?:21|22|23|24)|20(?:21|22|23|24).*F-?150/i, car_slug: 'ford-f150-fourteenth-generation', confidence: 0.85 },
    { pattern: /F-?150.*14th|14th.*F-?150/i, car_slug: 'ford-f150-fourteenth-generation', confidence: 0.85 },
    { pattern: /F-?150.*20(?:15|16|17|18|19|20)|20(?:15|16|17|18|19|20).*F-?150/i, car_slug: 'ford-f150-thirteenth', confidence: 0.85 },
    { pattern: /F-?150.*13th|13th.*F-?150/i, car_slug: 'ford-f150-thirteenth', confidence: 0.85 },
    { pattern: /F-?150.*Raptor.*R|Raptor\s?R/i, car_slug: 'ford-f150-raptor-r-third-generation', confidence: 0.90 },
    { pattern: /F-?150.*Raptor.*20(?:21|22|23|24)|Raptor.*20(?:21|22|23|24)/i, car_slug: 'ford-f-150-raptor-2021-2024', confidence: 0.85 },
    { pattern: /F-?150.*Raptor.*2nd|Raptor.*Gen\s?2/i, car_slug: 'ford-f150-raptor-second-generation', confidence: 0.85 },
    { pattern: /F-?150.*Lightning|Lightning.*EV/i, car_slug: 'ford-f150-lightning-1st-gen', confidence: 0.85 },
    { pattern: /\bF-?150\b(?!.*Raptor|.*Lightning)/i, car_slug: 'ford-f150-fourteenth-generation', confidence: 0.70, notes: 'Generic F-150 defaults to 14th gen' },

    // Chevrolet Silverado (Tier 1)
    { pattern: /Silverado.*1500.*(?:4th|T1XX)|T1XX.*Silverado/i, car_slug: 'chevrolet-silverado-1500-fourth-generation', confidence: 0.85 },
    { pattern: /Silverado.*ZR2/i, car_slug: 'chevrolet-silverado-zr2-t1xx', confidence: 0.90 },
    { pattern: /Silverado.*1500.*20(?:19|20|21|22|23|24)/i, car_slug: 'chevrolet-silverado-1500-fourth-generation', confidence: 0.85 },
    { pattern: /Silverado\s?1500/i, car_slug: 'chevrolet-silverado-1500-fourth-generation', confidence: 0.75 },

    // Toyota Tacoma (Tier 1)
    { pattern: /Tacoma.*20(?:24|25)|20(?:24|25).*Tacoma/i, car_slug: 'toyota-tacoma-2024', confidence: 0.85 },
    { pattern: /Tacoma.*4th|4th.*Tacoma/i, car_slug: 'toyota-tacoma-2024', confidence: 0.85 },
    { pattern: /Tacoma.*N300|N300.*Tacoma/i, car_slug: 'toyota-tacoma-n300', confidence: 0.85 },
    { pattern: /Tacoma.*TRD\s?Pro.*3rd/i, car_slug: 'toyota-tacoma-trd-pro-3rd-gen', confidence: 0.85 },
    { pattern: /Tacoma.*3rd|3rd.*Tacoma|Tacoma.*20(?:16|17|18|19|20|21|22|23)/i, car_slug: 'toyota-tacoma-n300', confidence: 0.80 },
    { pattern: /\bTacoma\b/i, car_slug: 'toyota-tacoma-n300', confidence: 0.65, notes: 'Generic Tacoma defaults to N300' },

    // Ram 1500 (Tier 2)
    { pattern: /Ram\s?1500.*TRX/i, car_slug: 'ram-1500-trx-dt', confidence: 0.90 },
    { pattern: /Ram\s?1500.*Rebel/i, car_slug: 'ram-1500-rebel-dt', confidence: 0.85 },
    { pattern: /Ram\s?1500.*DT|DT.*Ram/i, car_slug: 'ram-1500-dt', confidence: 0.85 },
    { pattern: /Ram\s?1500.*20(?:19|20|21|22|23|24)/i, car_slug: 'ram-1500-dt', confidence: 0.85 },
    { pattern: /\bRam\s?1500\b/i, car_slug: 'ram-1500-dt', confidence: 0.75 },

    // Ram 2500 (Heavy Duty)
    { pattern: /Ram\s?2500.*Cummins|Cummins.*Ram/i, car_slug: 'ram-2500-cummins-ds', confidence: 0.85 },
    { pattern: /Power\s?Wagon/i, car_slug: 'ram-power-wagon-dt', confidence: 0.85 },
  ],

  // ===========================================================================
  // Jeep / Off-Road (NEW - High Market Demand Tier 1)
  // ===========================================================================
  jeep: [
    // Jeep Wrangler (Tier 1 - #2 US Modification Market)
    { pattern: /Wrangler.*Rubicon.*392|392.*Rubicon/i, car_slug: 'jeep-wrangler-rubicon-392-jl', confidence: 0.90 },
    { pattern: /Wrangler.*JL|JL.*Wrangler/i, car_slug: 'jeep-wrangler-jl', confidence: 0.85 },
    { pattern: /Wrangler.*20(?:18|19|20|21|22|23|24)/i, car_slug: 'jeep-wrangler-jl', confidence: 0.85 },
    { pattern: /Wrangler.*JK|JK.*Wrangler/i, car_slug: 'jeep-wrangler-jk', confidence: 0.85 },
    { pattern: /Wrangler.*200[7-9]|Wrangler.*201[0-7]/i, car_slug: 'jeep-wrangler-jk', confidence: 0.80 },
    { pattern: /\bWrangler\b/i, car_slug: 'jeep-wrangler-jl', confidence: 0.70, notes: 'Generic Wrangler defaults to JL' },

    // Ford Bronco (6th Gen - High demand)
    { pattern: /Bronco.*Raptor/i, car_slug: 'ford-bronco-raptor-sixth-generation', confidence: 0.90 },
    { pattern: /Bronco.*6th|6th.*Bronco|Bronco.*20(?:21|22|23|24)/i, car_slug: 'ford-bronco-sixth-generation', confidence: 0.85 },
    { pattern: /\bBronco\b(?!.*Sport)/i, car_slug: 'ford-bronco-sixth-generation', confidence: 0.75, notes: 'Generic Bronco defaults to 6th gen' },
  ],

  // ===========================================================================
  // Domestic / American Muscle (NEW - High Market Demand)
  // ===========================================================================
  domestic: [
    // Ford Mustang (Tier 1 - #4 US Modification Market)
    { pattern: /Mustang.*GT.*PP2|PP2.*Mustang/i, car_slug: 'mustang-gt-pp2', confidence: 0.90 },
    { pattern: /Mustang.*Boss\s?302/i, car_slug: 'ford-mustang-boss-302', confidence: 0.90 },
    { pattern: /Mustang.*Terminator|Cobra.*Terminator/i, car_slug: 'ford-mustang-cobra-terminator', confidence: 0.90 },
    { pattern: /Mustang.*SVT.*Cobra|SVT.*Cobra.*SN95/i, car_slug: 'ford-mustang-svt-cobra-sn95', confidence: 0.85 },
    { pattern: /Mustang.*Mach\s?1.*SN95/i, car_slug: 'ford-mustang-mach-1-sn95', confidence: 0.85 },
    { pattern: /Mustang.*GT.*SN95|SN95.*GT/i, car_slug: 'ford-mustang-gt-sn95', confidence: 0.85 },
    { pattern: /Mustang.*Fox\s?Body|Fox.*Mustang/i, car_slug: 'ford-mustang-gt-fox-body', confidence: 0.85 },
    { pattern: /Mustang.*196[78]|Fastback.*196[78]/i, car_slug: 'ford-mustang-fastback-1967-1968', confidence: 0.85 },
    { pattern: /Mustang.*S550|S550.*Mustang/i, car_slug: 'mustang-gt-pp2', confidence: 0.80, notes: 'S550 platform defaults to GT PP2' },
    { pattern: /Mustang.*20(?:15|16|17|18|19|20|21|22)/i, car_slug: 'mustang-gt-pp2', confidence: 0.75 },
    { pattern: /Shelby.*GT350|GT350/i, car_slug: 'shelby-gt350', confidence: 0.90 },

    // Chevrolet Camaro (Tier 2)
    { pattern: /Camaro.*ZL1/i, car_slug: 'camaro-zl1', confidence: 0.90 },
    { pattern: /Camaro.*SS.*1LE|1LE.*Camaro/i, car_slug: 'camaro-ss-1le', confidence: 0.90 },
    { pattern: /Camaro.*Z28.*2nd|Z28.*70s/i, car_slug: 'chevrolet-camaro-z28-second-generation', confidence: 0.85 },
    { pattern: /Camaro.*SS.*1969|1969.*Camaro/i, car_slug: 'chevrolet-camaro-ss-1969', confidence: 0.85 },
    { pattern: /Camaro.*LS1|LS1.*Camaro/i, car_slug: 'chevrolet-camaro-ss-ls1', confidence: 0.85 },
    { pattern: /Camaro.*6th|6th.*Camaro|Camaro.*20(?:16|17|18|19|20|21|22|23|24)/i, car_slug: 'camaro-ss-1le', confidence: 0.75, notes: '6th gen defaults to SS 1LE' },
    { pattern: /\bCamaro\s?SS\b/i, car_slug: 'camaro-ss-1le', confidence: 0.70 },

    // Dodge Challenger (Tier 2)
    { pattern: /Challenger.*Hellcat/i, car_slug: 'dodge-challenger-hellcat', confidence: 0.90 },
    { pattern: /Challenger.*SRT.*392|392.*Challenger/i, car_slug: 'dodge-challenger-srt-392', confidence: 0.85 },
    { pattern: /Challenger.*Scat\s?Pack/i, car_slug: 'dodge-challenger-srt-392', confidence: 0.80, notes: 'Scat Pack maps to SRT 392' },
    { pattern: /\bChallenger\b(?!.*V6)/i, car_slug: 'dodge-challenger-srt-392', confidence: 0.65, notes: 'Generic Challenger defaults to SRT 392' },
  ],
};

// ============================================================================
// VENDOR CONFIGURATIONS
// ============================================================================

export const VENDOR_CONFIGS = {
  // ---------------------------------------------------------------------------
  // VAG Vendors (Shopify JSON)
  // ---------------------------------------------------------------------------
  performancebyie: {
    vendorKey: 'performancebyie',
    vendorName: 'Integrated Engineering',
    vendorUrl: 'https://performancebyie.com',
    ingestionType: 'shopify_json',
    families: ['vag'],
    tagField: 'tags', // Shopify tags field
    tagSeparator: ',',
    confidenceBase: 0.75,
    notes: 'Strong platform tags (MK7/MK8/8V/8Y)',
  },
  eqtuning: {
    vendorKey: 'eqtuning',
    vendorName: 'EQTuning',
    vendorUrl: 'https://eqtuning.com',
    ingestionType: 'shopify_json',
    families: ['vag'],
    tagField: 'tags',
    tagSeparator: ',',
    confidenceBase: 0.72,
    notes: 'Good MQB tagging',
  },
  bmptuning: {
    vendorKey: 'bmptuning',
    vendorName: 'BMP Tuning',
    vendorUrl: 'https://www.bmptuning.com',
    ingestionType: 'shopify_json',
    families: ['vag'],
    tagField: 'tags',
    tagSeparator: ',',
    confidenceBase: 0.70,
    notes: 'Tags like "MK7 GTI 2.0T I4 [MQB]"',
  },

  // ---------------------------------------------------------------------------
  // BMW Vendors (Candidates - need verification)
  // ---------------------------------------------------------------------------
  turnermotorsport: {
    vendorKey: 'turnermotorsport',
    vendorName: 'Turner Motorsport',
    vendorUrl: 'https://www.turnermotorsport.com',
    ingestionType: 'affiliate_feed', // Large catalog, better via affiliate
    families: ['bmw'],
    confidenceBase: 0.70,
    notes: 'Large BMW catalog; may need CJ/Rakuten feed',
  },

  // ---------------------------------------------------------------------------
  // Porsche Vendors
  // ---------------------------------------------------------------------------
  rennline: {
    vendorKey: 'rennline',
    vendorName: 'Rennline',
    vendorUrl: 'https://www.rennline.com',
    ingestionType: 'manual_export', // Need to verify if Shopify
    families: ['porsche'],
    confidenceBase: 0.70,
    notes: 'Porsche specialist; fitment by model selector',
  },
  suncoast: {
    vendorKey: 'suncoast',
    vendorName: 'Suncoast Porsche',
    vendorUrl: 'https://www.suncoastparts.com',
    ingestionType: 'manual_export',
    families: ['porsche'],
    confidenceBase: 0.72,
    notes: 'Porsche parts specialist',
  },

  // ---------------------------------------------------------------------------
  // Nissan/JDM Vendors
  // ---------------------------------------------------------------------------
  z1motorsports: {
    vendorKey: 'z1motorsports',
    vendorName: 'Z1 Motorsports',
    vendorUrl: 'https://www.z1motorsports.com',
    ingestionType: 'manual_export', // Custom platform
    families: ['nissan'],
    confidenceBase: 0.75,
    notes: 'Nissan Z specialist (350Z, 370Z, GT-R)',
  },

  // ---------------------------------------------------------------------------
  // Multi-Brand Vendors
  // ---------------------------------------------------------------------------
  fcpeuro: {
    vendorKey: 'fcpeuro',
    vendorName: 'FCP Euro',
    vendorUrl: 'https://www.fcpeuro.com',
    ingestionType: 'affiliate_feed',
    families: ['vag', 'bmw', 'porsche'],
    confidenceBase: 0.70,
    notes: 'Best for OEM/OE parts; Rakuten affiliate feed available',
  },
  ecstuning: {
    vendorKey: 'ecstuning',
    vendorName: 'ECS Tuning',
    vendorUrl: 'https://www.ecstuning.com',
    ingestionType: 'affiliate_feed',
    families: ['vag', 'bmw', 'porsche'],
    confidenceBase: 0.68,
    notes: 'Huge catalog; Rakuten affiliate feed',
  },
  summitracing: {
    vendorKey: 'summitracing',
    vendorName: 'Summit Racing',
    vendorUrl: 'https://www.summitracing.com',
    ingestionType: 'affiliate_feed',
    families: ['domestic'],
    confidenceBase: 0.65,
    notes: 'Domestic performance; CJ Affiliate feed',
  },

  // ---------------------------------------------------------------------------
  // Toyota/Subaru Vendors
  // ---------------------------------------------------------------------------
  ftspeed: {
    vendorKey: 'ftspeed',
    vendorName: 'FT Speed',
    vendorUrl: 'https://www.ftspeed.com',
    ingestionType: 'shopify_json',
    families: ['toyotasubaru', 'subaru', 'mitsubishi'], // Added mitsubishi for Evo coverage
    tagField: 'tags',
    tagSeparator: ',',
    confidenceBase: 0.72,
    notes: 'BRZ/86/GR86/GR Supra/GR Corolla/WRX/STI/Evo specialist - Tags in title format',
  },
  titanmotorsports: {
    vendorKey: 'titanmotorsports',
    vendorName: 'Titan Motorsports',
    vendorUrl: 'https://www.titanmotorsports.com',
    ingestionType: 'shopify_json',
    families: ['toyotasubaru'],
    tagField: 'tags',
    tagSeparator: ',',
    confidenceBase: 0.70,
    notes: 'Toyota Supra specialist',
  },
  rallysportdirect: {
    vendorKey: 'rallysportdirect',
    vendorName: 'RallySport Direct',
    vendorUrl: 'https://www.rallysportdirect.com',
    ingestionType: 'affiliate_feed',
    families: ['subaru', 'toyota'],
    confidenceBase: 0.70,
    notes: 'Subaru specialist; affiliate feed',
  },

  // ---------------------------------------------------------------------------
  // Honda Vendors
  // ---------------------------------------------------------------------------
  jhpusa: {
    vendorKey: 'jhpusa',
    vendorName: 'JHP USA',
    vendorUrl: 'https://www.jhpusa.com',
    ingestionType: 'shopify_json',
    families: ['honda'],
    tagField: 'tags',
    tagSeparator: ',',
    confidenceBase: 0.72,
    notes: 'Honda/Acura specialist - Tags like "22+ Civic Si", "FL5", "DC2"',
  },

  // ---------------------------------------------------------------------------
  // Multi-Brand / Universal Vendors
  // ---------------------------------------------------------------------------
  maperformance: {
    vendorKey: 'maperformance',
    vendorName: 'MAPerformance',
    vendorUrl: 'https://www.maperformance.com',
    ingestionType: 'shopify_json',
    families: ['mitsubishi', 'subaru', 'domestic', 'toyotasubaru'],
    tagField: 'tags',
    tagSeparator: ',',
    confidenceBase: 0.68,
    notes: 'Multi-brand - Evo, WRX, domestic, imports',
  },

  // ---------------------------------------------------------------------------
  // American Muscle / Domestic Vendors (NEW - High Market Demand)
  // NOTE: These vendors use custom platforms, not Shopify. Require affiliate feed integration.
  // ---------------------------------------------------------------------------
  americanmuscle: {
    vendorKey: 'americanmuscle',
    vendorName: 'AmericanMuscle',
    vendorUrl: 'https://www.americanmuscle.com',
    ingestionType: 'affiliate_feed',  // No Shopify JSON - needs CJ/Rakuten affiliate feed
    families: ['domestic', 'trucks'],
    confidenceBase: 0.75,
    notes: 'Mustang specialist (35K+ SKUs); also Camaro/Challenger. Requires CJ affiliate integration.',
  },
  extremeterrain: {
    vendorKey: 'extremeterrain',
    vendorName: 'ExtremeTerrain',
    vendorUrl: 'https://www.extremeterrain.com',
    ingestionType: 'affiliate_feed',  // No Shopify JSON - needs affiliate feed
    families: ['jeep', 'trucks'],
    confidenceBase: 0.75,
    notes: 'Jeep Wrangler specialist; also Bronco. Part of Turn 14 network - requires affiliate integration.',
  },
  realtruck: {
    vendorKey: 'realtruck',
    vendorName: 'RealTruck',
    vendorUrl: 'https://realtruck.com',
    ingestionType: 'affiliate_feed',  // No Shopify JSON - needs affiliate feed
    families: ['trucks'],
    confidenceBase: 0.72,
    notes: 'Truck specialist - F-150, Silverado, Ram, Tacoma. Requires affiliate integration.',
  },

  // ---------------------------------------------------------------------------
  // Additional Subaru / Japanese Vendors
  // ---------------------------------------------------------------------------
  subimods: {
    vendorKey: 'subimods',
    vendorName: 'Subimods',
    vendorUrl: 'https://www.subimods.com',
    ingestionType: 'shopify_json',  // ✅ Verified working Shopify feed
    families: ['subaru'],
    tagField: 'tags',
    tagSeparator: ',',
    confidenceBase: 0.75,
    notes: 'Subaru WRX/STI specialist. Tags like "VA STI", "GR/GV", "GC8"',
  },
  twentysevenWon: {
    vendorKey: 'twentysevenWon',
    vendorName: '27WON Performance',
    vendorUrl: 'https://www.27won.com',
    ingestionType: 'manual_export',  // No Shopify JSON - custom platform
    families: ['honda'],
    confidenceBase: 0.75,
    notes: 'Civic Type R / Integra Type S specialist. Custom platform - needs manual export or API.',
  },
};

// ============================================================================
// ADAPTER FUNCTIONS
// ============================================================================

/**
 * Resolve car slug from a tag string using pattern matching.
 *
 * @param {string} tag - The vendor tag to match
 * @param {string[]} families - Families to search (e.g., ['vag', 'bmw'])
 * @returns {{ car_slug: string, confidence: number, notes?: string } | null}
 */
export function resolveCarSlugFromTag(tag, families = []) {
  if (!tag || typeof tag !== 'string') return null;

  const normalized = tag.trim();
  const familiesToSearch = families.length > 0 ? families : Object.keys(PLATFORM_TAG_PATTERNS);

  for (const family of familiesToSearch) {
    const patterns = PLATFORM_TAG_PATTERNS[family];
    if (!patterns) continue;

    for (const entry of patterns) {
      const { pattern, car_slug, confidence, notes } = entry;

      if (pattern instanceof RegExp) {
        if (pattern.test(normalized)) {
          return { car_slug, confidence, notes, matched_pattern: pattern.toString(), family };
        }
      } else if (typeof pattern === 'string') {
        if (normalized.toLowerCase() === pattern.toLowerCase()) {
          return { car_slug, confidence, notes, matched_pattern: pattern, family };
        }
      }
    }
  }

  return null;
}

/**
 * Resolve all possible car slugs from a list of tags.
 * Returns unique results sorted by confidence (highest first).
 *
 * @param {string[]} tags - Array of vendor tags
 * @param {string[]} families - Families to search
 * @returns {Array<{ car_slug: string, confidence: number, tags: string[] }>}
 */
export function resolveCarSlugsFromTags(tags, families = []) {
  if (!Array.isArray(tags) || tags.length === 0) return [];

  const resultsBySlug = new Map();

  for (const tag of tags) {
    const match = resolveCarSlugFromTag(tag, families);
    if (!match) continue;

    const existing = resultsBySlug.get(match.car_slug);
    if (existing) {
      // Keep highest confidence and accumulate tags
      existing.confidence = Math.max(existing.confidence, match.confidence);
      existing.tags.push(tag);
    } else {
      resultsBySlug.set(match.car_slug, {
        car_slug: match.car_slug,
        confidence: match.confidence,
        tags: [tag],
        family: match.family,
        notes: match.notes,
      });
    }
  }

  return [...resultsBySlug.values()].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get vendor configuration by key.
 * @param {string} vendorKey
 * @returns {object | undefined}
 */
export function getVendorConfig(vendorKey) {
  return VENDOR_CONFIGS[vendorKey];
}

/**
 * Get all vendors for a specific family (e.g., 'bmw', 'porsche').
 * @param {string} family
 * @returns {object[]}
 */
export function getVendorsForFamily(family) {
  return Object.values(VENDOR_CONFIGS).filter((v) => v.families?.includes(family));
}

/**
 * Get all vendors that support Shopify JSON ingestion.
 * @returns {object[]}
 */
export function getShopifyVendors() {
  return Object.values(VENDOR_CONFIGS).filter((v) => v.ingestionType === 'shopify_json');
}

/**
 * Parse Shopify product tags into normalized array.
 * @param {string | string[]} tags
 * @returns {string[]}
 */
export function parseShopifyTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Generate fitment suggestions for a product based on its tags.
 * Returns all possible fitments with confidence scores.
 *
 * @param {object} product - Shopify product object
 * @param {object} vendorConfig - Vendor configuration
 * @returns {Array<{ car_slug: string, confidence: number, source_tag: string }>}
 */
export function suggestFitmentsForProduct(product, vendorConfig) {
  const tags = parseShopifyTags(product?.tags);
  const families = vendorConfig?.families || [];
  const baseConfidence = vendorConfig?.confidenceBase || 0.70;

  const matches = resolveCarSlugsFromTags(tags, families);

  return matches.map((m) => ({
    car_slug: m.car_slug,
    confidence: Math.min(1.0, m.confidence * (baseConfidence / 0.70)), // Adjust by vendor
    source_tags: m.tags,
    family: m.family,
    notes: m.notes,
  }));
}

// ============================================================================
// PRIORITY CARS FOR EXPANSION
// ============================================================================

/**
 * Priority tiers for fitment expansion.
 * Tier 1 = highest demand, expand first.
 */
export const PRIORITY_CARS = {
  // Tier 1: Top 10 by US Modification Market (per Top 100 Vehicles research)
  tier1: [
    // #1 Ford F-150 (largest US modification market)
    'ford-f150-fourteenth-generation',
    'ford-f150-thirteenth',
    'ford-f-150-raptor-2021-2024',
    'ford-f150-raptor-second-generation',
    // #2 Jeep Wrangler
    'jeep-wrangler-jl',
    'jeep-wrangler-jk',
    // #3-4 Mustang
    'mustang-gt-pp2',
    'shelby-gt350',
    'ford-mustang-boss-302',
    // #5 Silverado
    'chevrolet-silverado-1500-fourth-generation',
    // #6 GTI/Golf R (high-engagement enthusiast platform)
    'volkswagen-gti-mk7',
    'volkswagen-golf-r-mk7',
    // #7 Tacoma
    'toyota-tacoma-n300',
    'toyota-tacoma-trd-pro-3rd-gen',
    // #8-9 WRX/STI
    'subaru-wrx-sti-va',
  ],
  // Tier 2: Major Platforms (#10-25 in market)
  tier2: [
    // Trucks & SUVs
    'ram-1500-dt',
    'ram-1500-trx-dt',
    'ford-bronco-sixth-generation',
    'chevrolet-silverado-zr2-t1xx',
    // American Muscle
    'camaro-zl1',
    'camaro-ss-1le',
    'dodge-challenger-hellcat',
    'dodge-challenger-srt-392',
    // Sports Cars (high engagement)
    'c8-corvette-stingray',
    'c7-corvette-z06',
    'toyota-gr-supra',
    'toyota-gr86',
    'subaru-brz-zd8',
    'honda-civic-type-r-fk8',
    'honda-civic-type-r-fl5',
    'nissan-gt-r',
    'bmw-m3-e46',
    'bmw-m4-f82',
  ],
  // Tier 3: Enthusiast Favorites (lower volume but high engagement)
  tier3: [
    // BMW M Cars
    'bmw-m3-e92',
    'bmw-m3-f80',
    'bmw-m2-competition',
    'bmw-m5-f90-competition',
    'bmw-1m-coupe-e82',
    // Porsche
    '718-cayman-gt4',
    '718-cayman-gts-40',
    '981-cayman-gts',
    'porsche-911-gt3-997',
    // Audi
    'audi-tt-rs-8s',
    'audi-tt-rs-8j',
    'audi-rs5-b9',
    'audi-rs3-8v',
    // Japanese Legends
    'mitsubishi-lancer-evo-x',
    'nissan-370z-nismo',
    'nissan-350z',
    'mazda-rx7-fd3s',
    'mazda-mx5-miata-nd',
    'honda-s2000',
    'acura-integra-type-r-dc2',
    'ford-focus-rs',
  ],
};

const vendorAdapters = {
  PLATFORM_TAG_PATTERNS,
  VENDOR_CONFIGS,
  PRIORITY_CARS,
  resolveCarSlugFromTag,
  resolveCarSlugsFromTags,
  getVendorConfig,
  getVendorsForFamily,
  getShopifyVendors,
  parseShopifyTags,
  suggestFitmentsForProduct,
};

export default vendorAdapters;













