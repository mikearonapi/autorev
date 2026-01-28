/**
 * API Route: /api/user/location
 * Purpose: ZIP code lookup and user location management
 */

import { NextResponse } from 'next/server';

import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createServerSupabaseClient, createAuthenticatedClient, getBearerToken } from '@/lib/supabaseServer';

// Simple ZIP code to city/state mapping for common US ZIPs
// In production, could use a full database or external API
const ZIP_DATA = {
  // Virginia
  '22033': { city: 'Fairfax', state: 'VA' },
  '22030': { city: 'Fairfax', state: 'VA' },
  '22031': { city: 'Fairfax', state: 'VA' },
  '22032': { city: 'Fairfax', state: 'VA' },
  '22042': { city: 'Falls Church', state: 'VA' },
  '22041': { city: 'Falls Church', state: 'VA' },
  '22043': { city: 'Falls Church', state: 'VA' },
  '22044': { city: 'Falls Church', state: 'VA' },
  '22101': { city: 'McLean', state: 'VA' },
  '22102': { city: 'McLean', state: 'VA' },
  '22182': { city: 'Vienna', state: 'VA' },
  '22180': { city: 'Vienna', state: 'VA' },
  '22181': { city: 'Vienna', state: 'VA' },
  '20190': { city: 'Reston', state: 'VA' },
  '20191': { city: 'Reston', state: 'VA' },
  '20170': { city: 'Herndon', state: 'VA' },
  '20171': { city: 'Herndon', state: 'VA' },
  '22003': { city: 'Annandale', state: 'VA' },
  '22312': { city: 'Alexandria', state: 'VA' },
  '22314': { city: 'Alexandria', state: 'VA' },
  '22301': { city: 'Alexandria', state: 'VA' },
  '22302': { city: 'Alexandria', state: 'VA' },
  '22304': { city: 'Alexandria', state: 'VA' },
  '22305': { city: 'Alexandria', state: 'VA' },
  '22306': { city: 'Alexandria', state: 'VA' },
  '22307': { city: 'Alexandria', state: 'VA' },
  '22308': { city: 'Alexandria', state: 'VA' },
  '22201': { city: 'Arlington', state: 'VA' },
  '22202': { city: 'Arlington', state: 'VA' },
  '22203': { city: 'Arlington', state: 'VA' },
  '22204': { city: 'Arlington', state: 'VA' },
  '22205': { city: 'Arlington', state: 'VA' },
  '22206': { city: 'Arlington', state: 'VA' },
  '22207': { city: 'Arlington', state: 'VA' },
  '22209': { city: 'Arlington', state: 'VA' },
  
  // Maryland
  '20814': { city: 'Bethesda', state: 'MD' },
  '20815': { city: 'Chevy Chase', state: 'MD' },
  '20816': { city: 'Bethesda', state: 'MD' },
  '20817': { city: 'Bethesda', state: 'MD' },
  '20850': { city: 'Rockville', state: 'MD' },
  '20851': { city: 'Rockville', state: 'MD' },
  '20852': { city: 'Rockville', state: 'MD' },
  '20853': { city: 'Rockville', state: 'MD' },
  '20854': { city: 'Potomac', state: 'MD' },
  '20901': { city: 'Silver Spring', state: 'MD' },
  '20902': { city: 'Silver Spring', state: 'MD' },
  '20903': { city: 'Silver Spring', state: 'MD' },
  '20904': { city: 'Silver Spring', state: 'MD' },
  '20910': { city: 'Silver Spring', state: 'MD' },
  '21201': { city: 'Baltimore', state: 'MD' },
  '21202': { city: 'Baltimore', state: 'MD' },
  '21224': { city: 'Baltimore', state: 'MD' },
  '21230': { city: 'Baltimore', state: 'MD' },
  
  // DC
  '20001': { city: 'Washington', state: 'DC' },
  '20002': { city: 'Washington', state: 'DC' },
  '20003': { city: 'Washington', state: 'DC' },
  '20004': { city: 'Washington', state: 'DC' },
  '20005': { city: 'Washington', state: 'DC' },
  '20006': { city: 'Washington', state: 'DC' },
  '20007': { city: 'Washington', state: 'DC' },
  '20008': { city: 'Washington', state: 'DC' },
  '20009': { city: 'Washington', state: 'DC' },
  '20010': { city: 'Washington', state: 'DC' },
  '20011': { city: 'Washington', state: 'DC' },
  '20012': { city: 'Washington', state: 'DC' },
  '20015': { city: 'Washington', state: 'DC' },
  '20016': { city: 'Washington', state: 'DC' },
  '20017': { city: 'Washington', state: 'DC' },
  '20018': { city: 'Washington', state: 'DC' },
  '20019': { city: 'Washington', state: 'DC' },
  '20020': { city: 'Washington', state: 'DC' },
  
  // California
  '90001': { city: 'Los Angeles', state: 'CA' },
  '90002': { city: 'Los Angeles', state: 'CA' },
  '90003': { city: 'Los Angeles', state: 'CA' },
  '90004': { city: 'Los Angeles', state: 'CA' },
  '90005': { city: 'Los Angeles', state: 'CA' },
  '90006': { city: 'Los Angeles', state: 'CA' },
  '90007': { city: 'Los Angeles', state: 'CA' },
  '90008': { city: 'Los Angeles', state: 'CA' },
  '90010': { city: 'Los Angeles', state: 'CA' },
  '90012': { city: 'Los Angeles', state: 'CA' },
  '90015': { city: 'Los Angeles', state: 'CA' },
  '90017': { city: 'Los Angeles', state: 'CA' },
  '90019': { city: 'Los Angeles', state: 'CA' },
  '90020': { city: 'Los Angeles', state: 'CA' },
  '90024': { city: 'Los Angeles', state: 'CA' },
  '90025': { city: 'Los Angeles', state: 'CA' },
  '90026': { city: 'Los Angeles', state: 'CA' },
  '90027': { city: 'Los Angeles', state: 'CA' },
  '90028': { city: 'Hollywood', state: 'CA' },
  '90029': { city: 'Los Angeles', state: 'CA' },
  '90034': { city: 'Los Angeles', state: 'CA' },
  '90035': { city: 'Los Angeles', state: 'CA' },
  '90036': { city: 'Los Angeles', state: 'CA' },
  '90046': { city: 'West Hollywood', state: 'CA' },
  '90048': { city: 'Los Angeles', state: 'CA' },
  '90049': { city: 'Los Angeles', state: 'CA' },
  '90064': { city: 'Los Angeles', state: 'CA' },
  '90065': { city: 'Los Angeles', state: 'CA' },
  '90066': { city: 'Los Angeles', state: 'CA' },
  '90067': { city: 'Century City', state: 'CA' },
  '90068': { city: 'Hollywood', state: 'CA' },
  '90069': { city: 'West Hollywood', state: 'CA' },
  '90071': { city: 'Los Angeles', state: 'CA' },
  '90077': { city: 'Los Angeles', state: 'CA' },
  '90210': { city: 'Beverly Hills', state: 'CA' },
  '90211': { city: 'Beverly Hills', state: 'CA' },
  '90212': { city: 'Beverly Hills', state: 'CA' },
  '90265': { city: 'Malibu', state: 'CA' },
  '90266': { city: 'Manhattan Beach', state: 'CA' },
  '90274': { city: 'Palos Verdes Peninsula', state: 'CA' },
  '90291': { city: 'Venice', state: 'CA' },
  '90292': { city: 'Marina Del Rey', state: 'CA' },
  '90401': { city: 'Santa Monica', state: 'CA' },
  '90402': { city: 'Santa Monica', state: 'CA' },
  '90403': { city: 'Santa Monica', state: 'CA' },
  '90404': { city: 'Santa Monica', state: 'CA' },
  '90405': { city: 'Santa Monica', state: 'CA' },
  '91101': { city: 'Pasadena', state: 'CA' },
  '91103': { city: 'Pasadena', state: 'CA' },
  '91104': { city: 'Pasadena', state: 'CA' },
  '91105': { city: 'Pasadena', state: 'CA' },
  '91106': { city: 'Pasadena', state: 'CA' },
  '92101': { city: 'San Diego', state: 'CA' },
  '92102': { city: 'San Diego', state: 'CA' },
  '92103': { city: 'San Diego', state: 'CA' },
  '92104': { city: 'San Diego', state: 'CA' },
  '92105': { city: 'San Diego', state: 'CA' },
  '92106': { city: 'Point Loma', state: 'CA' },
  '92107': { city: 'San Diego', state: 'CA' },
  '92109': { city: 'San Diego', state: 'CA' },
  '92110': { city: 'San Diego', state: 'CA' },
  '92111': { city: 'San Diego', state: 'CA' },
  '92116': { city: 'San Diego', state: 'CA' },
  '92117': { city: 'San Diego', state: 'CA' },
  '92118': { city: 'Coronado', state: 'CA' },
  '92120': { city: 'San Diego', state: 'CA' },
  '92121': { city: 'San Diego', state: 'CA' },
  '92122': { city: 'San Diego', state: 'CA' },
  '92123': { city: 'San Diego', state: 'CA' },
  '92124': { city: 'San Diego', state: 'CA' },
  '92126': { city: 'San Diego', state: 'CA' },
  '92127': { city: 'San Diego', state: 'CA' },
  '92128': { city: 'San Diego', state: 'CA' },
  '92129': { city: 'San Diego', state: 'CA' },
  '92130': { city: 'San Diego', state: 'CA' },
  '94102': { city: 'San Francisco', state: 'CA' },
  '94103': { city: 'San Francisco', state: 'CA' },
  '94104': { city: 'San Francisco', state: 'CA' },
  '94105': { city: 'San Francisco', state: 'CA' },
  '94107': { city: 'San Francisco', state: 'CA' },
  '94108': { city: 'San Francisco', state: 'CA' },
  '94109': { city: 'San Francisco', state: 'CA' },
  '94110': { city: 'San Francisco', state: 'CA' },
  '94111': { city: 'San Francisco', state: 'CA' },
  '94112': { city: 'San Francisco', state: 'CA' },
  '94114': { city: 'San Francisco', state: 'CA' },
  '94115': { city: 'San Francisco', state: 'CA' },
  '94116': { city: 'San Francisco', state: 'CA' },
  '94117': { city: 'San Francisco', state: 'CA' },
  '94118': { city: 'San Francisco', state: 'CA' },
  '94121': { city: 'San Francisco', state: 'CA' },
  '94122': { city: 'San Francisco', state: 'CA' },
  '94123': { city: 'San Francisco', state: 'CA' },
  '94124': { city: 'San Francisco', state: 'CA' },
  '94127': { city: 'San Francisco', state: 'CA' },
  '94131': { city: 'San Francisco', state: 'CA' },
  '94132': { city: 'San Francisco', state: 'CA' },
  '94133': { city: 'San Francisco', state: 'CA' },
  '94134': { city: 'San Francisco', state: 'CA' },
  '95101': { city: 'San Jose', state: 'CA' },
  '95110': { city: 'San Jose', state: 'CA' },
  '95111': { city: 'San Jose', state: 'CA' },
  '95112': { city: 'San Jose', state: 'CA' },
  '95113': { city: 'San Jose', state: 'CA' },
  '95116': { city: 'San Jose', state: 'CA' },
  '95117': { city: 'San Jose', state: 'CA' },
  '95118': { city: 'San Jose', state: 'CA' },
  '95119': { city: 'San Jose', state: 'CA' },
  '95120': { city: 'San Jose', state: 'CA' },
  '95121': { city: 'San Jose', state: 'CA' },
  '95122': { city: 'San Jose', state: 'CA' },
  '95123': { city: 'San Jose', state: 'CA' },
  '95124': { city: 'San Jose', state: 'CA' },
  '95125': { city: 'San Jose', state: 'CA' },
  '95126': { city: 'San Jose', state: 'CA' },
  '95127': { city: 'San Jose', state: 'CA' },
  '95128': { city: 'San Jose', state: 'CA' },
  '95129': { city: 'San Jose', state: 'CA' },
  '95130': { city: 'San Jose', state: 'CA' },
  '95131': { city: 'San Jose', state: 'CA' },
  '95132': { city: 'San Jose', state: 'CA' },
  '95133': { city: 'San Jose', state: 'CA' },
  '95134': { city: 'San Jose', state: 'CA' },
  '95135': { city: 'San Jose', state: 'CA' },
  '95136': { city: 'San Jose', state: 'CA' },
  '95138': { city: 'San Jose', state: 'CA' },
  '95139': { city: 'San Jose', state: 'CA' },
  '95148': { city: 'San Jose', state: 'CA' },
  '94301': { city: 'Palo Alto', state: 'CA' },
  '94303': { city: 'Palo Alto', state: 'CA' },
  '94304': { city: 'Palo Alto', state: 'CA' },
  '94306': { city: 'Palo Alto', state: 'CA' },
  '94040': { city: 'Mountain View', state: 'CA' },
  '94041': { city: 'Mountain View', state: 'CA' },
  '94043': { city: 'Mountain View', state: 'CA' },
  '95014': { city: 'Cupertino', state: 'CA' },
  
  // Texas
  '75001': { city: 'Addison', state: 'TX' },
  '75201': { city: 'Dallas', state: 'TX' },
  '75202': { city: 'Dallas', state: 'TX' },
  '75203': { city: 'Dallas', state: 'TX' },
  '75204': { city: 'Dallas', state: 'TX' },
  '75205': { city: 'Dallas', state: 'TX' },
  '75206': { city: 'Dallas', state: 'TX' },
  '75207': { city: 'Dallas', state: 'TX' },
  '75208': { city: 'Dallas', state: 'TX' },
  '75209': { city: 'Dallas', state: 'TX' },
  '75210': { city: 'Dallas', state: 'TX' },
  '75211': { city: 'Dallas', state: 'TX' },
  '75214': { city: 'Dallas', state: 'TX' },
  '75215': { city: 'Dallas', state: 'TX' },
  '75216': { city: 'Dallas', state: 'TX' },
  '75217': { city: 'Dallas', state: 'TX' },
  '75218': { city: 'Dallas', state: 'TX' },
  '75219': { city: 'Dallas', state: 'TX' },
  '75220': { city: 'Dallas', state: 'TX' },
  '75223': { city: 'Dallas', state: 'TX' },
  '75224': { city: 'Dallas', state: 'TX' },
  '75225': { city: 'Dallas', state: 'TX' },
  '75226': { city: 'Dallas', state: 'TX' },
  '75228': { city: 'Dallas', state: 'TX' },
  '75229': { city: 'Dallas', state: 'TX' },
  '75230': { city: 'Dallas', state: 'TX' },
  '75231': { city: 'Dallas', state: 'TX' },
  '75234': { city: 'Dallas', state: 'TX' },
  '75235': { city: 'Dallas', state: 'TX' },
  '75238': { city: 'Dallas', state: 'TX' },
  '75240': { city: 'Dallas', state: 'TX' },
  '75243': { city: 'Dallas', state: 'TX' },
  '75244': { city: 'Dallas', state: 'TX' },
  '75248': { city: 'Dallas', state: 'TX' },
  '75251': { city: 'Dallas', state: 'TX' },
  '75252': { city: 'Dallas', state: 'TX' },
  '77001': { city: 'Houston', state: 'TX' },
  '77002': { city: 'Houston', state: 'TX' },
  '77003': { city: 'Houston', state: 'TX' },
  '77004': { city: 'Houston', state: 'TX' },
  '77005': { city: 'Houston', state: 'TX' },
  '77006': { city: 'Houston', state: 'TX' },
  '77007': { city: 'Houston', state: 'TX' },
  '77008': { city: 'Houston', state: 'TX' },
  '77009': { city: 'Houston', state: 'TX' },
  '77010': { city: 'Houston', state: 'TX' },
  '77011': { city: 'Houston', state: 'TX' },
  '77012': { city: 'Houston', state: 'TX' },
  '77019': { city: 'Houston', state: 'TX' },
  '77020': { city: 'Houston', state: 'TX' },
  '77021': { city: 'Houston', state: 'TX' },
  '77024': { city: 'Houston', state: 'TX' },
  '77025': { city: 'Houston', state: 'TX' },
  '77027': { city: 'Houston', state: 'TX' },
  '77030': { city: 'Houston', state: 'TX' },
  '77035': { city: 'Houston', state: 'TX' },
  '77036': { city: 'Houston', state: 'TX' },
  '77042': { city: 'Houston', state: 'TX' },
  '77054': { city: 'Houston', state: 'TX' },
  '77056': { city: 'Houston', state: 'TX' },
  '77057': { city: 'Houston', state: 'TX' },
  '77063': { city: 'Houston', state: 'TX' },
  '77077': { city: 'Houston', state: 'TX' },
  '77079': { city: 'Houston', state: 'TX' },
  '77096': { city: 'Houston', state: 'TX' },
  '78201': { city: 'San Antonio', state: 'TX' },
  '78202': { city: 'San Antonio', state: 'TX' },
  '78203': { city: 'San Antonio', state: 'TX' },
  '78204': { city: 'San Antonio', state: 'TX' },
  '78205': { city: 'San Antonio', state: 'TX' },
  '78207': { city: 'San Antonio', state: 'TX' },
  '78208': { city: 'San Antonio', state: 'TX' },
  '78209': { city: 'San Antonio', state: 'TX' },
  '78210': { city: 'San Antonio', state: 'TX' },
  '78211': { city: 'San Antonio', state: 'TX' },
  '78212': { city: 'San Antonio', state: 'TX' },
  '78213': { city: 'San Antonio', state: 'TX' },
  '78214': { city: 'San Antonio', state: 'TX' },
  '78215': { city: 'San Antonio', state: 'TX' },
  '78216': { city: 'San Antonio', state: 'TX' },
  '78217': { city: 'San Antonio', state: 'TX' },
  '78218': { city: 'San Antonio', state: 'TX' },
  '78219': { city: 'San Antonio', state: 'TX' },
  '78220': { city: 'San Antonio', state: 'TX' },
  '78221': { city: 'San Antonio', state: 'TX' },
  '78223': { city: 'San Antonio', state: 'TX' },
  '78224': { city: 'San Antonio', state: 'TX' },
  '78225': { city: 'San Antonio', state: 'TX' },
  '78226': { city: 'San Antonio', state: 'TX' },
  '78227': { city: 'San Antonio', state: 'TX' },
  '78228': { city: 'San Antonio', state: 'TX' },
  '78229': { city: 'San Antonio', state: 'TX' },
  '78230': { city: 'San Antonio', state: 'TX' },
  '78231': { city: 'San Antonio', state: 'TX' },
  '78232': { city: 'San Antonio', state: 'TX' },
  '78233': { city: 'San Antonio', state: 'TX' },
  '78234': { city: 'San Antonio', state: 'TX' },
  '78240': { city: 'San Antonio', state: 'TX' },
  '78245': { city: 'San Antonio', state: 'TX' },
  '78247': { city: 'San Antonio', state: 'TX' },
  '78248': { city: 'San Antonio', state: 'TX' },
  '78249': { city: 'San Antonio', state: 'TX' },
  '78250': { city: 'San Antonio', state: 'TX' },
  '78251': { city: 'San Antonio', state: 'TX' },
  '78253': { city: 'San Antonio', state: 'TX' },
  '78254': { city: 'San Antonio', state: 'TX' },
  '78255': { city: 'San Antonio', state: 'TX' },
  '78256': { city: 'San Antonio', state: 'TX' },
  '78257': { city: 'San Antonio', state: 'TX' },
  '78258': { city: 'San Antonio', state: 'TX' },
  '78259': { city: 'San Antonio', state: 'TX' },
  '78260': { city: 'San Antonio', state: 'TX' },
  '78701': { city: 'Austin', state: 'TX' },
  '78702': { city: 'Austin', state: 'TX' },
  '78703': { city: 'Austin', state: 'TX' },
  '78704': { city: 'Austin', state: 'TX' },
  '78705': { city: 'Austin', state: 'TX' },
  '78712': { city: 'Austin', state: 'TX' },
  '78721': { city: 'Austin', state: 'TX' },
  '78722': { city: 'Austin', state: 'TX' },
  '78723': { city: 'Austin', state: 'TX' },
  '78724': { city: 'Austin', state: 'TX' },
  '78725': { city: 'Austin', state: 'TX' },
  '78726': { city: 'Austin', state: 'TX' },
  '78727': { city: 'Austin', state: 'TX' },
  '78728': { city: 'Austin', state: 'TX' },
  '78729': { city: 'Austin', state: 'TX' },
  '78730': { city: 'Austin', state: 'TX' },
  '78731': { city: 'Austin', state: 'TX' },
  '78732': { city: 'Austin', state: 'TX' },
  '78733': { city: 'Austin', state: 'TX' },
  '78735': { city: 'Austin', state: 'TX' },
  '78736': { city: 'Austin', state: 'TX' },
  '78737': { city: 'Austin', state: 'TX' },
  '78738': { city: 'Austin', state: 'TX' },
  '78739': { city: 'Austin', state: 'TX' },
  '78741': { city: 'Austin', state: 'TX' },
  '78744': { city: 'Austin', state: 'TX' },
  '78745': { city: 'Austin', state: 'TX' },
  '78746': { city: 'Austin', state: 'TX' },
  '78747': { city: 'Austin', state: 'TX' },
  '78748': { city: 'Austin', state: 'TX' },
  '78749': { city: 'Austin', state: 'TX' },
  '78750': { city: 'Austin', state: 'TX' },
  '78751': { city: 'Austin', state: 'TX' },
  '78752': { city: 'Austin', state: 'TX' },
  '78753': { city: 'Austin', state: 'TX' },
  '78754': { city: 'Austin', state: 'TX' },
  '78756': { city: 'Austin', state: 'TX' },
  '78757': { city: 'Austin', state: 'TX' },
  '78758': { city: 'Austin', state: 'TX' },
  '78759': { city: 'Austin', state: 'TX' },
  
  // New York
  '10001': { city: 'New York', state: 'NY' },
  '10002': { city: 'New York', state: 'NY' },
  '10003': { city: 'New York', state: 'NY' },
  '10004': { city: 'New York', state: 'NY' },
  '10005': { city: 'New York', state: 'NY' },
  '10006': { city: 'New York', state: 'NY' },
  '10007': { city: 'New York', state: 'NY' },
  '10009': { city: 'New York', state: 'NY' },
  '10010': { city: 'New York', state: 'NY' },
  '10011': { city: 'New York', state: 'NY' },
  '10012': { city: 'New York', state: 'NY' },
  '10013': { city: 'New York', state: 'NY' },
  '10014': { city: 'New York', state: 'NY' },
  '10016': { city: 'New York', state: 'NY' },
  '10017': { city: 'New York', state: 'NY' },
  '10018': { city: 'New York', state: 'NY' },
  '10019': { city: 'New York', state: 'NY' },
  '10020': { city: 'New York', state: 'NY' },
  '10021': { city: 'New York', state: 'NY' },
  '10022': { city: 'New York', state: 'NY' },
  '10023': { city: 'New York', state: 'NY' },
  '10024': { city: 'New York', state: 'NY' },
  '10025': { city: 'New York', state: 'NY' },
  '10026': { city: 'New York', state: 'NY' },
  '10027': { city: 'New York', state: 'NY' },
  '10028': { city: 'New York', state: 'NY' },
  '10029': { city: 'New York', state: 'NY' },
  '10030': { city: 'New York', state: 'NY' },
  '10031': { city: 'New York', state: 'NY' },
  '10032': { city: 'New York', state: 'NY' },
  '10033': { city: 'New York', state: 'NY' },
  '10034': { city: 'New York', state: 'NY' },
  '10035': { city: 'New York', state: 'NY' },
  '10036': { city: 'New York', state: 'NY' },
  '10037': { city: 'New York', state: 'NY' },
  '10038': { city: 'New York', state: 'NY' },
  '10039': { city: 'New York', state: 'NY' },
  '10040': { city: 'New York', state: 'NY' },
  '10044': { city: 'New York', state: 'NY' },
  '10065': { city: 'New York', state: 'NY' },
  '10075': { city: 'New York', state: 'NY' },
  '10128': { city: 'New York', state: 'NY' },
  '11201': { city: 'Brooklyn', state: 'NY' },
  '11203': { city: 'Brooklyn', state: 'NY' },
  '11204': { city: 'Brooklyn', state: 'NY' },
  '11205': { city: 'Brooklyn', state: 'NY' },
  '11206': { city: 'Brooklyn', state: 'NY' },
  '11207': { city: 'Brooklyn', state: 'NY' },
  '11208': { city: 'Brooklyn', state: 'NY' },
  '11209': { city: 'Brooklyn', state: 'NY' },
  '11210': { city: 'Brooklyn', state: 'NY' },
  '11211': { city: 'Brooklyn', state: 'NY' },
  '11212': { city: 'Brooklyn', state: 'NY' },
  '11213': { city: 'Brooklyn', state: 'NY' },
  '11214': { city: 'Brooklyn', state: 'NY' },
  '11215': { city: 'Brooklyn', state: 'NY' },
  '11216': { city: 'Brooklyn', state: 'NY' },
  '11217': { city: 'Brooklyn', state: 'NY' },
  '11218': { city: 'Brooklyn', state: 'NY' },
  '11219': { city: 'Brooklyn', state: 'NY' },
  '11220': { city: 'Brooklyn', state: 'NY' },
  '11221': { city: 'Brooklyn', state: 'NY' },
  '11222': { city: 'Brooklyn', state: 'NY' },
  '11223': { city: 'Brooklyn', state: 'NY' },
  '11224': { city: 'Brooklyn', state: 'NY' },
  '11225': { city: 'Brooklyn', state: 'NY' },
  '11226': { city: 'Brooklyn', state: 'NY' },
  '11228': { city: 'Brooklyn', state: 'NY' },
  '11229': { city: 'Brooklyn', state: 'NY' },
  '11230': { city: 'Brooklyn', state: 'NY' },
  '11231': { city: 'Brooklyn', state: 'NY' },
  '11232': { city: 'Brooklyn', state: 'NY' },
  '11233': { city: 'Brooklyn', state: 'NY' },
  '11234': { city: 'Brooklyn', state: 'NY' },
  '11235': { city: 'Brooklyn', state: 'NY' },
  '11236': { city: 'Brooklyn', state: 'NY' },
  '11237': { city: 'Brooklyn', state: 'NY' },
  '11238': { city: 'Brooklyn', state: 'NY' },
  '11239': { city: 'Brooklyn', state: 'NY' },
  
  // Florida
  '33101': { city: 'Miami', state: 'FL' },
  '33109': { city: 'Miami Beach', state: 'FL' },
  '33125': { city: 'Miami', state: 'FL' },
  '33126': { city: 'Miami', state: 'FL' },
  '33127': { city: 'Miami', state: 'FL' },
  '33128': { city: 'Miami', state: 'FL' },
  '33129': { city: 'Miami', state: 'FL' },
  '33130': { city: 'Miami', state: 'FL' },
  '33131': { city: 'Miami', state: 'FL' },
  '33132': { city: 'Miami', state: 'FL' },
  '33133': { city: 'Miami', state: 'FL' },
  '33134': { city: 'Miami', state: 'FL' },
  '33135': { city: 'Miami', state: 'FL' },
  '33136': { city: 'Miami', state: 'FL' },
  '33137': { city: 'Miami', state: 'FL' },
  '33138': { city: 'Miami', state: 'FL' },
  '33139': { city: 'Miami Beach', state: 'FL' },
  '33140': { city: 'Miami Beach', state: 'FL' },
  '33141': { city: 'Miami Beach', state: 'FL' },
  '33142': { city: 'Miami', state: 'FL' },
  '33143': { city: 'Miami', state: 'FL' },
  '33144': { city: 'Miami', state: 'FL' },
  '33145': { city: 'Miami', state: 'FL' },
  '33146': { city: 'Coral Gables', state: 'FL' },
  '33147': { city: 'Miami', state: 'FL' },
  '33149': { city: 'Key Biscayne', state: 'FL' },
  '33154': { city: 'Miami Beach', state: 'FL' },
  '33155': { city: 'Miami', state: 'FL' },
  '33156': { city: 'Miami', state: 'FL' },
  '32801': { city: 'Orlando', state: 'FL' },
  '32803': { city: 'Orlando', state: 'FL' },
  '32804': { city: 'Orlando', state: 'FL' },
  '32805': { city: 'Orlando', state: 'FL' },
  '32806': { city: 'Orlando', state: 'FL' },
  '32807': { city: 'Orlando', state: 'FL' },
  '32808': { city: 'Orlando', state: 'FL' },
  '32809': { city: 'Orlando', state: 'FL' },
  '32810': { city: 'Orlando', state: 'FL' },
  '32811': { city: 'Orlando', state: 'FL' },
  '32812': { city: 'Orlando', state: 'FL' },
  '32814': { city: 'Orlando', state: 'FL' },
  '32817': { city: 'Orlando', state: 'FL' },
  '32818': { city: 'Orlando', state: 'FL' },
  '32819': { city: 'Orlando', state: 'FL' },
  '32820': { city: 'Orlando', state: 'FL' },
  '32821': { city: 'Orlando', state: 'FL' },
  '32822': { city: 'Orlando', state: 'FL' },
  '32824': { city: 'Orlando', state: 'FL' },
  '32825': { city: 'Orlando', state: 'FL' },
  '32826': { city: 'Orlando', state: 'FL' },
  '32827': { city: 'Orlando', state: 'FL' },
  '32828': { city: 'Orlando', state: 'FL' },
  '32829': { city: 'Orlando', state: 'FL' },
  '32832': { city: 'Orlando', state: 'FL' },
  '32835': { city: 'Orlando', state: 'FL' },
  '32836': { city: 'Orlando', state: 'FL' },
  '32837': { city: 'Orlando', state: 'FL' },
  '33601': { city: 'Tampa', state: 'FL' },
  '33602': { city: 'Tampa', state: 'FL' },
  '33603': { city: 'Tampa', state: 'FL' },
  '33604': { city: 'Tampa', state: 'FL' },
  '33605': { city: 'Tampa', state: 'FL' },
  '33606': { city: 'Tampa', state: 'FL' },
  '33607': { city: 'Tampa', state: 'FL' },
  '33609': { city: 'Tampa', state: 'FL' },
  '33610': { city: 'Tampa', state: 'FL' },
  '33611': { city: 'Tampa', state: 'FL' },
  '33612': { city: 'Tampa', state: 'FL' },
  '33613': { city: 'Tampa', state: 'FL' },
  '33614': { city: 'Tampa', state: 'FL' },
  '33615': { city: 'Tampa', state: 'FL' },
  '33616': { city: 'Tampa', state: 'FL' },
  '33617': { city: 'Tampa', state: 'FL' },
  '33618': { city: 'Tampa', state: 'FL' },
  '33619': { city: 'Tampa', state: 'FL' },
  '33624': { city: 'Tampa', state: 'FL' },
  '33625': { city: 'Tampa', state: 'FL' },
  '33626': { city: 'Tampa', state: 'FL' },
  '33629': { city: 'Tampa', state: 'FL' },
  '33634': { city: 'Tampa', state: 'FL' },
  '33635': { city: 'Tampa', state: 'FL' },
  '33647': { city: 'Tampa', state: 'FL' },
  
  // Illinois
  '60601': { city: 'Chicago', state: 'IL' },
  '60602': { city: 'Chicago', state: 'IL' },
  '60603': { city: 'Chicago', state: 'IL' },
  '60604': { city: 'Chicago', state: 'IL' },
  '60605': { city: 'Chicago', state: 'IL' },
  '60606': { city: 'Chicago', state: 'IL' },
  '60607': { city: 'Chicago', state: 'IL' },
  '60608': { city: 'Chicago', state: 'IL' },
  '60609': { city: 'Chicago', state: 'IL' },
  '60610': { city: 'Chicago', state: 'IL' },
  '60611': { city: 'Chicago', state: 'IL' },
  '60612': { city: 'Chicago', state: 'IL' },
  '60613': { city: 'Chicago', state: 'IL' },
  '60614': { city: 'Chicago', state: 'IL' },
  '60615': { city: 'Chicago', state: 'IL' },
  '60616': { city: 'Chicago', state: 'IL' },
  '60617': { city: 'Chicago', state: 'IL' },
  '60618': { city: 'Chicago', state: 'IL' },
  '60619': { city: 'Chicago', state: 'IL' },
  '60620': { city: 'Chicago', state: 'IL' },
  '60621': { city: 'Chicago', state: 'IL' },
  '60622': { city: 'Chicago', state: 'IL' },
  '60623': { city: 'Chicago', state: 'IL' },
  '60624': { city: 'Chicago', state: 'IL' },
  '60625': { city: 'Chicago', state: 'IL' },
  '60626': { city: 'Chicago', state: 'IL' },
  '60628': { city: 'Chicago', state: 'IL' },
  '60629': { city: 'Chicago', state: 'IL' },
  '60630': { city: 'Chicago', state: 'IL' },
  '60631': { city: 'Chicago', state: 'IL' },
  '60632': { city: 'Chicago', state: 'IL' },
  '60634': { city: 'Chicago', state: 'IL' },
  '60636': { city: 'Chicago', state: 'IL' },
  '60637': { city: 'Chicago', state: 'IL' },
  '60638': { city: 'Chicago', state: 'IL' },
  '60639': { city: 'Chicago', state: 'IL' },
  '60640': { city: 'Chicago', state: 'IL' },
  '60641': { city: 'Chicago', state: 'IL' },
  '60642': { city: 'Chicago', state: 'IL' },
  '60643': { city: 'Chicago', state: 'IL' },
  '60644': { city: 'Chicago', state: 'IL' },
  '60645': { city: 'Chicago', state: 'IL' },
  '60646': { city: 'Chicago', state: 'IL' },
  '60647': { city: 'Chicago', state: 'IL' },
  '60649': { city: 'Chicago', state: 'IL' },
  '60651': { city: 'Chicago', state: 'IL' },
  '60652': { city: 'Chicago', state: 'IL' },
  '60653': { city: 'Chicago', state: 'IL' },
  '60654': { city: 'Chicago', state: 'IL' },
  '60655': { city: 'Chicago', state: 'IL' },
  '60656': { city: 'Chicago', state: 'IL' },
  '60657': { city: 'Chicago', state: 'IL' },
  '60659': { city: 'Chicago', state: 'IL' },
  '60660': { city: 'Chicago', state: 'IL' },
  '60661': { city: 'Chicago', state: 'IL' },
  
  // Georgia
  '30301': { city: 'Atlanta', state: 'GA' },
  '30303': { city: 'Atlanta', state: 'GA' },
  '30305': { city: 'Atlanta', state: 'GA' },
  '30306': { city: 'Atlanta', state: 'GA' },
  '30307': { city: 'Atlanta', state: 'GA' },
  '30308': { city: 'Atlanta', state: 'GA' },
  '30309': { city: 'Atlanta', state: 'GA' },
  '30310': { city: 'Atlanta', state: 'GA' },
  '30311': { city: 'Atlanta', state: 'GA' },
  '30312': { city: 'Atlanta', state: 'GA' },
  '30313': { city: 'Atlanta', state: 'GA' },
  '30314': { city: 'Atlanta', state: 'GA' },
  '30315': { city: 'Atlanta', state: 'GA' },
  '30316': { city: 'Atlanta', state: 'GA' },
  '30317': { city: 'Atlanta', state: 'GA' },
  '30318': { city: 'Atlanta', state: 'GA' },
  '30319': { city: 'Atlanta', state: 'GA' },
  '30324': { city: 'Atlanta', state: 'GA' },
  '30326': { city: 'Atlanta', state: 'GA' },
  '30327': { city: 'Atlanta', state: 'GA' },
  '30328': { city: 'Atlanta', state: 'GA' },
  '30329': { city: 'Atlanta', state: 'GA' },
  '30331': { city: 'Atlanta', state: 'GA' },
  '30332': { city: 'Atlanta', state: 'GA' },
  '30334': { city: 'Atlanta', state: 'GA' },
  '30336': { city: 'Atlanta', state: 'GA' },
  '30339': { city: 'Atlanta', state: 'GA' },
  '30342': { city: 'Atlanta', state: 'GA' },
  '30344': { city: 'Atlanta', state: 'GA' },
  '30349': { city: 'Atlanta', state: 'GA' },
  '30354': { city: 'Atlanta', state: 'GA' },
  
  // North Carolina
  '28201': { city: 'Charlotte', state: 'NC' },
  '28202': { city: 'Charlotte', state: 'NC' },
  '28203': { city: 'Charlotte', state: 'NC' },
  '28204': { city: 'Charlotte', state: 'NC' },
  '28205': { city: 'Charlotte', state: 'NC' },
  '28206': { city: 'Charlotte', state: 'NC' },
  '28207': { city: 'Charlotte', state: 'NC' },
  '28208': { city: 'Charlotte', state: 'NC' },
  '28209': { city: 'Charlotte', state: 'NC' },
  '28210': { city: 'Charlotte', state: 'NC' },
  '28211': { city: 'Charlotte', state: 'NC' },
  '28212': { city: 'Charlotte', state: 'NC' },
  '28213': { city: 'Charlotte', state: 'NC' },
  '28214': { city: 'Charlotte', state: 'NC' },
  '28215': { city: 'Charlotte', state: 'NC' },
  '28216': { city: 'Charlotte', state: 'NC' },
  '28217': { city: 'Charlotte', state: 'NC' },
  '28226': { city: 'Charlotte', state: 'NC' },
  '28227': { city: 'Charlotte', state: 'NC' },
  '28262': { city: 'Charlotte', state: 'NC' },
  '28269': { city: 'Charlotte', state: 'NC' },
  '28270': { city: 'Charlotte', state: 'NC' },
  '28273': { city: 'Charlotte', state: 'NC' },
  '28277': { city: 'Charlotte', state: 'NC' },
  '27601': { city: 'Raleigh', state: 'NC' },
  '27603': { city: 'Raleigh', state: 'NC' },
  '27604': { city: 'Raleigh', state: 'NC' },
  '27605': { city: 'Raleigh', state: 'NC' },
  '27606': { city: 'Raleigh', state: 'NC' },
  '27607': { city: 'Raleigh', state: 'NC' },
  '27608': { city: 'Raleigh', state: 'NC' },
  '27609': { city: 'Raleigh', state: 'NC' },
  '27610': { city: 'Raleigh', state: 'NC' },
  '27612': { city: 'Raleigh', state: 'NC' },
  '27613': { city: 'Raleigh', state: 'NC' },
  '27614': { city: 'Raleigh', state: 'NC' },
  '27615': { city: 'Raleigh', state: 'NC' },
  '27616': { city: 'Raleigh', state: 'NC' },
  '27617': { city: 'Raleigh', state: 'NC' },
};

/**
 * Lookup city/state from ZIP code
 */
function lookupZip(zip) {
  // Normalize ZIP to 5 digits
  const normalizedZip = zip?.toString().replace(/\D/g, '').slice(0, 5);
  
  if (!normalizedZip || normalizedZip.length !== 5) {
    return null;
  }
  
  // Check our local mapping first
  if (ZIP_DATA[normalizedZip]) {
    return {
      zip: normalizedZip,
      ...ZIP_DATA[normalizedZip],
    };
  }
  
  // For unknown ZIPs, try to determine state from ZIP prefix
  // This is a rough approximation based on USPS ZIP code ranges
  const prefix = parseInt(normalizedZip.slice(0, 3), 10);
  let state = null;
  
  if (prefix >= 100 && prefix <= 149) state = 'NY';
  else if (prefix >= 150 && prefix <= 196) state = 'PA';
  else if (prefix >= 197 && prefix <= 199) state = 'DE';
  else if (prefix >= 200 && prefix <= 205) state = 'DC';
  else if (prefix >= 206 && prefix <= 219) state = 'MD';
  else if (prefix >= 220 && prefix <= 246) state = 'VA';
  else if (prefix >= 247 && prefix <= 268) state = 'WV';
  else if (prefix >= 270 && prefix <= 289) state = 'NC';
  else if (prefix >= 290 && prefix <= 299) state = 'SC';
  else if (prefix >= 300 && prefix <= 319) state = 'GA';
  else if (prefix >= 320 && prefix <= 339) state = 'FL';
  else if (prefix >= 350 && prefix <= 369) state = 'AL';
  else if (prefix >= 370 && prefix <= 385) state = 'TN';
  else if (prefix >= 386 && prefix <= 397) state = 'MS';
  else if (prefix >= 400 && prefix <= 427) state = 'KY';
  else if (prefix >= 430 && prefix <= 459) state = 'OH';
  else if (prefix >= 460 && prefix <= 479) state = 'IN';
  else if (prefix >= 480 && prefix <= 499) state = 'MI';
  else if (prefix >= 500 && prefix <= 528) state = 'IA';
  else if (prefix >= 530 && prefix <= 549) state = 'WI';
  else if (prefix >= 550 && prefix <= 567) state = 'MN';
  else if (prefix >= 570 && prefix <= 577) state = 'SD';
  else if (prefix >= 580 && prefix <= 588) state = 'ND';
  else if (prefix >= 590 && prefix <= 599) state = 'MT';
  else if (prefix >= 600 && prefix <= 629) state = 'IL';
  else if (prefix >= 630 && prefix <= 658) state = 'MO';
  else if (prefix >= 660 && prefix <= 679) state = 'KS';
  else if (prefix >= 680 && prefix <= 693) state = 'NE';
  else if (prefix >= 700 && prefix <= 714) state = 'LA';
  else if (prefix >= 716 && prefix <= 729) state = 'AR';
  else if (prefix >= 730 && prefix <= 749) state = 'OK';
  else if (prefix >= 750 && prefix <= 799) state = 'TX';
  else if (prefix >= 800 && prefix <= 816) state = 'CO';
  else if (prefix >= 820 && prefix <= 831) state = 'WY';
  else if (prefix >= 832 && prefix <= 838) state = 'ID';
  else if (prefix >= 840 && prefix <= 847) state = 'UT';
  else if (prefix >= 850 && prefix <= 865) state = 'AZ';
  else if (prefix >= 870 && prefix <= 884) state = 'NM';
  else if (prefix >= 889 && prefix <= 898) state = 'NV';
  else if (prefix >= 900 && prefix <= 961) state = 'CA';
  else if (prefix >= 967 && prefix <= 968) state = 'HI';
  else if (prefix >= 970 && prefix <= 979) state = 'OR';
  else if (prefix >= 980 && prefix <= 994) state = 'WA';
  else if (prefix >= 995 && prefix <= 999) state = 'AK';
  
  if (state) {
    return {
      zip: normalizedZip,
      city: null, // We don't know the city, just the state
      state,
    };
  }
  
  return null;
}

/**
 * GET /api/user/location?zip=12345
 * Lookup city/state from ZIP code
 */
async function handleGet(_request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');
  
  if (!zip) {
    return NextResponse.json(
      { error: 'ZIP code is required' },
      { status: 400 }
    );
  }
  
  const result = lookupZip(zip);
  
  if (!result) {
    return NextResponse.json(
      { error: 'Invalid or unknown ZIP code', zip },
      { status: 404 }
    );
  }
  
  return NextResponse.json(result);
}

/**
 * POST /api/user/location
 * Save user location to profile
 */
async function handlePost(request) {
  // Support both cookie and Bearer token auth
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    const body = await request.json();
    const { zip } = body;
    
    if (!zip) {
      return errors.missingField('zip');
    }
    
    // Lookup ZIP to get city/state
    const locationData = lookupZip(zip);
    
    if (!locationData) {
      return NextResponse.json(
        { error: 'Invalid or unknown ZIP code' },
        { status: 400 }
      );
    }
    
    // Update user profile with location
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        location_zip: locationData.zip,
        location_city: locationData.city,
        location_state: locationData.state,
        // location_updated_at is auto-set by trigger
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('[Location] Error saving location:', error);
      return NextResponse.json(
        { error: 'Failed to save location' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      location: {
        zip: data.location_zip,
        city: data.location_city,
        state: data.location_state,
      },
    });
}

/**
 * DELETE /api/user/location
 * Clear user location from profile
 */
async function handleDelete(_request) {
  const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Clear location from profile
    const { error } = await supabase
      .from('user_profiles')
      .update({
        location_zip: null,
        location_city: null,
        location_state: null,
        location_updated_at: null,
      })
      .eq('id', user.id);
    
    if (error) {
      console.error('[Location] Error clearing location:', error);
      return NextResponse.json(
        { error: 'Failed to clear location' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
}

export const GET = withErrorLogging(handleGet, { route: 'user/location', feature: 'events' });
export const POST = withErrorLogging(handlePost, { route: 'user/location', feature: 'events' });
export const DELETE = withErrorLogging(handleDelete, { route: 'user/location', feature: 'events' });

