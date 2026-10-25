/**
 * India Locations Database & Postal Intelligence Service
 * Provides instant 0ms offline lookup + online fallback for:
 *  - City -> Automatic PIN Code & State
 *  - State -> Cities & Regional PIN Codes
 *  - PIN Code -> Automatic City & State
 */

export interface IndiaLocation {
  city: string;
  state: string;
  defaultPincode: string;
  district?: string;
  pincodes?: string[];
  aliases?: string[];
}

export const INDIAN_STATES: string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export const INDIA_LOCATIONS: IndiaLocation[] = [
  // --- GUJARAT (Comprehensive coverage of all districts, talukas & key cities) ---
  {
    city: 'Ahmedabad',
    state: 'Gujarat',
    defaultPincode: '380001',
    district: 'Ahmedabad',
    pincodes: ['380001', '380006', '380009', '380015', '380054', '380060', '382345', '382481'],
    aliases: ['Amdavad', 'Ahmedabad City'],
  },
  {
    city: 'Palanpur',
    state: 'Gujarat',
    defaultPincode: '385001',
    district: 'Banaskantha',
    pincodes: ['385001', '385002', '385010', '385515'],
    aliases: ['Banaskantha', 'Palanpore'],
  },
  {
    city: 'Deesa',
    state: 'Gujarat',
    defaultPincode: '385535',
    district: 'Banaskantha',
    pincodes: ['385535', '385540'],
    aliases: ['Disa'],
  },
  {
    city: 'Tharad',
    state: 'Gujarat',
    defaultPincode: '385565',
    district: 'Banaskantha',
    pincodes: ['385565'],
  },
  {
    city: 'Dhanera',
    state: 'Gujarat',
    defaultPincode: '385310',
    district: 'Banaskantha',
    pincodes: ['385310'],
  },
  {
    city: 'Vadgam',
    state: 'Gujarat',
    defaultPincode: '385410',
    district: 'Banaskantha',
    pincodes: ['385410'],
  },
  {
    city: 'Danta',
    state: 'Gujarat',
    defaultPincode: '385110',
    district: 'Banaskantha',
    pincodes: ['385110', '385120'],
    aliases: ['Ambaji'],
  },
  {
    city: 'Surat',
    state: 'Gujarat',
    defaultPincode: '395001',
    district: 'Surat',
    pincodes: ['395001', '395003', '395006', '395007', '395009', '394210'],
  },
  {
    city: 'Vadodara',
    state: 'Gujarat',
    defaultPincode: '390001',
    district: 'Vadodara',
    pincodes: ['390001', '390002', '390007', '390019', '390020'],
    aliases: ['Baroda'],
  },
  {
    city: 'Rajkot',
    state: 'Gujarat',
    defaultPincode: '360001',
    district: 'Rajkot',
    pincodes: ['360001', '360002', '360004', '360005'],
  },
  {
    city: 'Gandhinagar',
    state: 'Gujarat',
    defaultPincode: '382010',
    district: 'Gandhinagar',
    pincodes: ['382010', '382016', '382021', '382024'],
  },
  {
    city: 'Bhavnagar',
    state: 'Gujarat',
    defaultPincode: '364001',
    district: 'Bhavnagar',
    pincodes: ['364001', '364002', '364004'],
  },
  {
    city: 'Jamnagar',
    state: 'Gujarat',
    defaultPincode: '361001',
    district: 'Jamnagar',
    pincodes: ['361001', '361002', '361008'],
  },
  {
    city: 'Junagadh',
    state: 'Gujarat',
    defaultPincode: '362001',
    district: 'Junagadh',
    pincodes: ['362001', '362002'],
  },
  {
    city: 'Mehsana',
    state: 'Gujarat',
    defaultPincode: '384001',
    district: 'Mehsana',
    pincodes: ['384001', '384002'],
    aliases: ['Mahesana'],
  },
  {
    city: 'Patan',
    state: 'Gujarat',
    defaultPincode: '384265',
    district: 'Patan',
    pincodes: ['384265'],
  },
  {
    city: 'Siddhpur',
    state: 'Gujarat',
    defaultPincode: '384151',
    district: 'Patan',
    pincodes: ['384151'],
    aliases: ['Sidhhpur', 'Sidhpur'],
  },
  {
    city: 'Himatnagar',
    state: 'Gujarat',
    defaultPincode: '383001',
    district: 'Sabarkantha',
    pincodes: ['383001', '383002'],
    aliases: ['Himmatnagar', 'Sabarkantha'],
  },
  {
    city: 'Idar',
    state: 'Gujarat',
    defaultPincode: '383430',
    district: 'Sabarkantha',
    pincodes: ['383430'],
  },
  {
    city: 'Modasa',
    state: 'Gujarat',
    defaultPincode: '383315',
    district: 'Aravalli',
    pincodes: ['383315'],
    aliases: ['Aravalli'],
  },
  {
    city: 'Anand',
    state: 'Gujarat',
    defaultPincode: '388001',
    district: 'Anand',
    pincodes: ['388001', '388120'],
  },
  {
    city: 'Nadiad',
    state: 'Gujarat',
    defaultPincode: '387001',
    district: 'Kheda',
    pincodes: ['387001', '387002'],
    aliases: ['Kheda'],
  },
  {
    city: 'Bharuch',
    state: 'Gujarat',
    defaultPincode: '392001',
    district: 'Bharuch',
    pincodes: ['392001', '392015'],
    aliases: ['Broach'],
  },
  {
    city: 'Ankleshwar',
    state: 'Gujarat',
    defaultPincode: '393001',
    district: 'Bharuch',
    pincodes: ['393001', '393002'],
  },
  {
    city: 'Navsari',
    state: 'Gujarat',
    defaultPincode: '396445',
    district: 'Navsari',
    pincodes: ['396445', '396444'],
  },
  {
    city: 'Valsad',
    state: 'Gujarat',
    defaultPincode: '396001',
    district: 'Valsad',
    pincodes: ['396001'],
    aliases: ['Bulsar'],
  },
  {
    city: 'Vapi',
    state: 'Gujarat',
    defaultPincode: '396191',
    district: 'Valsad',
    pincodes: ['396191', '396195'],
  },
  {
    city: 'Bhuj',
    state: 'Gujarat',
    defaultPincode: '370001',
    district: 'Kutch',
    pincodes: ['370001', '370020'],
    aliases: ['Kutch', 'Kachchh'],
  },
  {
    city: 'Gandhidham',
    state: 'Gujarat',
    defaultPincode: '370201',
    district: 'Kutch',
    pincodes: ['370201', '370205'],
  },
  {
    city: 'Mundra',
    state: 'Gujarat',
    defaultPincode: '370421',
    district: 'Kutch',
    pincodes: ['370421'],
  },
  {
    city: 'Porbandar',
    state: 'Gujarat',
    defaultPincode: '360575',
    district: 'Porbandar',
    pincodes: ['360575', '360577'],
  },
  {
    city: 'Morbi',
    state: 'Gujarat',
    defaultPincode: '363641',
    district: 'Morbi',
    pincodes: ['363641', '363642'],
  },
  {
    city: 'Surendranagar',
    state: 'Gujarat',
    defaultPincode: '363001',
    district: 'Surendranagar',
    pincodes: ['363001', '363002'],
  },
  {
    city: 'Wadhwan',
    state: 'Gujarat',
    defaultPincode: '363030',
    district: 'Surendranagar',
    pincodes: ['363030'],
  },
  {
    city: 'Godhra',
    state: 'Gujarat',
    defaultPincode: '389001',
    district: 'Panchmahal',
    pincodes: ['389001'],
    aliases: ['Panchmahal'],
  },
  {
    city: 'Halol',
    state: 'Gujarat',
    defaultPincode: '389350',
    district: 'Panchmahal',
    pincodes: ['389350'],
  },
  {
    city: 'Dahod',
    state: 'Gujarat',
    defaultPincode: '389151',
    district: 'Dahod',
    pincodes: ['389151'],
  },
  {
    city: 'Botad',
    state: 'Gujarat',
    defaultPincode: '364710',
    district: 'Botad',
    pincodes: ['364710'],
  },
  {
    city: 'Amreli',
    state: 'Gujarat',
    defaultPincode: '365601',
    district: 'Amreli',
    pincodes: ['365601'],
  },
  {
    city: 'Veraval',
    state: 'Gujarat',
    defaultPincode: '362265',
    district: 'Gir Somnath',
    pincodes: ['362265'],
    aliases: ['Somnath', 'Gir Somnath'],
  },
  {
    city: 'Vyara',
    state: 'Gujarat',
    defaultPincode: '394650',
    district: 'Tapi',
    pincodes: ['394650'],
    aliases: ['Tapi'],
  },
  {
    city: 'Sanand',
    state: 'Gujarat',
    defaultPincode: '382110',
    district: 'Ahmedabad',
    pincodes: ['382110'],
  },
  {
    city: 'Kalol',
    state: 'Gujarat',
    defaultPincode: '382721',
    district: 'Gandhinagar',
    pincodes: ['382721'],
  },
  {
    city: 'Kadi',
    state: 'Gujarat',
    defaultPincode: '382715',
    district: 'Mehsana',
    pincodes: ['382715'],
  },
  {
    city: 'Unjha',
    state: 'Gujarat',
    defaultPincode: '384170',
    district: 'Mehsana',
    pincodes: ['384170'],
  },
  {
    city: 'Visnagar',
    state: 'Gujarat',
    defaultPincode: '384315',
    district: 'Mehsana',
    pincodes: ['384315'],
  },
  {
    city: 'Vadnagar',
    state: 'Gujarat',
    defaultPincode: '384355',
    district: 'Mehsana',
    pincodes: ['384355'],
  },
  {
    city: 'Gondal',
    state: 'Gujarat',
    defaultPincode: '360311',
    district: 'Rajkot',
    pincodes: ['360311'],
  },
  {
    city: 'Jetpur',
    state: 'Gujarat',
    defaultPincode: '360370',
    district: 'Rajkot',
    pincodes: ['360370'],
  },
  {
    city: 'Daman',
    state: 'Dadra and Nagar Haveli and Daman and Diu',
    defaultPincode: '396210',
    pincodes: ['396210', '396220'],
  },
  {
    city: 'Silvassa',
    state: 'Dadra and Nagar Haveli and Daman and Diu',
    defaultPincode: '396230',
    pincodes: ['396230'],
  },
  {
    city: 'Diu',
    state: 'Dadra and Nagar Haveli and Daman and Diu',
    defaultPincode: '362520',
    pincodes: ['362520'],
  },

  // --- MAHARASHTRA ---
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    defaultPincode: '400001',
    pincodes: ['400001', '400050', '400051', '400076', '400092'],
    aliases: ['Bombay'],
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    defaultPincode: '411001',
    pincodes: ['411001', '411004', '411014', '411038', '411057'],
    aliases: ['Poona'],
  },
  {
    city: 'Nagpur',
    state: 'Maharashtra',
    defaultPincode: '440001',
    pincodes: ['440001', '440010', '440022'],
  },
  {
    city: 'Nashik',
    state: 'Maharashtra',
    defaultPincode: '422001',
    pincodes: ['422001', '422005', '422009'],
    aliases: ['Nasik'],
  },
  {
    city: 'Thane',
    state: 'Maharashtra',
    defaultPincode: '400601',
    pincodes: ['400601', '400602', '400607'],
  },
  {
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    defaultPincode: '400703',
    pincodes: ['400703', '400705', '400706'],
  },
  {
    city: 'Aurangabad',
    state: 'Maharashtra',
    defaultPincode: '431001',
    pincodes: ['431001', '431005'],
    aliases: ['Chhatrapati Sambhajinagar'],
  },
  {
    city: 'Kolhapur',
    state: 'Maharashtra',
    defaultPincode: '416001',
    pincodes: ['416001', '416003'],
  },
  {
    city: 'Solapur',
    state: 'Maharashtra',
    defaultPincode: '413001',
    pincodes: ['413001'],
  },
  {
    city: 'Jalgaon',
    state: 'Maharashtra',
    defaultPincode: '425001',
    pincodes: ['425001'],
  },
  {
    city: 'Dhule',
    state: 'Maharashtra',
    defaultPincode: '424001',
    pincodes: ['424001'],
  },

  // --- DELHI NCR ---
  {
    city: 'New Delhi',
    state: 'Delhi',
    defaultPincode: '110001',
    pincodes: ['110001', '110002', '110016', '110020', '110092'],
    aliases: ['Delhi', 'Central Delhi'],
  },
  {
    city: 'Noida',
    state: 'Uttar Pradesh',
    defaultPincode: '201301',
    pincodes: ['201301', '201303', '201304', '201307'],
  },
  {
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    defaultPincode: '201310',
    pincodes: ['201310'],
  },
  {
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    defaultPincode: '201001',
    pincodes: ['201001', '201002', '201009', '201010'],
  },
  {
    city: 'Gurugram',
    state: 'Haryana',
    defaultPincode: '122001',
    pincodes: ['122001', '122002', '122018', '122051'],
    aliases: ['Gurgaon'],
  },
  {
    city: 'Faridabad',
    state: 'Haryana',
    defaultPincode: '121001',
    pincodes: ['121001', '121002', '121007'],
  },

  // --- RAJASTHAN ---
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    defaultPincode: '302001',
    pincodes: ['302001', '302004', '302017', '302020'],
  },
  {
    city: 'Jodhpur',
    state: 'Rajasthan',
    defaultPincode: '342001',
    pincodes: ['342001', '342003', '342006'],
  },
  {
    city: 'Udaipur',
    state: 'Rajasthan',
    defaultPincode: '313001',
    pincodes: ['313001', '313002'],
  },
  {
    city: 'Kota',
    state: 'Rajasthan',
    defaultPincode: '324001',
    pincodes: ['324001', '324005'],
  },
  {
    city: 'Bikaner',
    state: 'Rajasthan',
    defaultPincode: '334001',
    pincodes: ['334001'],
  },
  {
    city: 'Ajmer',
    state: 'Rajasthan',
    defaultPincode: '305001',
    pincodes: ['305001'],
  },
  {
    city: 'Mount Abu',
    state: 'Rajasthan',
    defaultPincode: '307501',
    pincodes: ['307501'],
    aliases: ['Abu Road'],
  },
  {
    city: 'Sirohi',
    state: 'Rajasthan',
    defaultPincode: '307001',
    pincodes: ['307001'],
  },
  {
    city: 'Jalore',
    state: 'Rajasthan',
    defaultPincode: '343001',
    pincodes: ['343001'],
  },
  {
    city: 'Barmer',
    state: 'Rajasthan',
    defaultPincode: '344001',
    pincodes: ['344001'],
  },

  // --- KARNATAKA ---
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    defaultPincode: '560001',
    pincodes: ['560001', '560002', '560034', '560068', '560100'],
    aliases: ['Bangalore'],
  },
  {
    city: 'Mysuru',
    state: 'Karnataka',
    defaultPincode: '570001',
    pincodes: ['570001'],
    aliases: ['Mysore'],
  },
  {
    city: 'Mangaluru',
    state: 'Karnataka',
    defaultPincode: '575001',
    pincodes: ['575001'],
    aliases: ['Mangalore'],
  },
  {
    city: 'Hubballi',
    state: 'Karnataka',
    defaultPincode: '580020',
    pincodes: ['580020'],
    aliases: ['Hubli'],
  },

  // --- TAMIL NADU ---
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    defaultPincode: '600001',
    pincodes: ['600001', '600002', '600028', '600040', '600096'],
    aliases: ['Madras'],
  },
  {
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    defaultPincode: '641001',
    pincodes: ['641001', '641018'],
  },
  {
    city: 'Madurai',
    state: 'Tamil Nadu',
    defaultPincode: '625001',
    pincodes: ['625001'],
  },

  // --- TELANGANA & ANDHRA PRADESH ---
  {
    city: 'Hyderabad',
    state: 'Telangana',
    defaultPincode: '500001',
    pincodes: ['500001', '500034', '500081', '500084'],
  },
  {
    city: 'Secunderabad',
    state: 'Telangana',
    defaultPincode: '500003',
    pincodes: ['500003'],
  },
  {
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    defaultPincode: '530001',
    pincodes: ['530001'],
    aliases: ['Vizag'],
  },
  {
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    defaultPincode: '520001',
    pincodes: ['520001'],
  },

  // --- UTTAR PRADESH ---
  {
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    defaultPincode: '226001',
    pincodes: ['226001', '226010', '226016'],
  },
  {
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    defaultPincode: '208001',
    pincodes: ['208001', '208005'],
  },
  {
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    defaultPincode: '221001',
    pincodes: ['221001'],
    aliases: ['Banaras', 'Kashi'],
  },
  {
    city: 'Agra',
    state: 'Uttar Pradesh',
    defaultPincode: '282001',
    pincodes: ['282001'],
  },
  {
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    defaultPincode: '211001',
    pincodes: ['211001'],
    aliases: ['Allahabad'],
  },

  // --- MADHYA PRADESH ---
  {
    city: 'Indore',
    state: 'Madhya Pradesh',
    defaultPincode: '452001',
    pincodes: ['452001', '452010'],
  },
  {
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    defaultPincode: '462001',
    pincodes: ['462001', '462016'],
  },
  {
    city: 'Gwalior',
    state: 'Madhya Pradesh',
    defaultPincode: '474001',
    pincodes: ['474001'],
  },
  {
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    defaultPincode: '482001',
    pincodes: ['482001'],
  },
  {
    city: 'Ujjain',
    state: 'Madhya Pradesh',
    defaultPincode: '456001',
    pincodes: ['456001'],
  },

  // --- WEST BENGAL ---
  {
    city: 'Kolkata',
    state: 'West Bengal',
    defaultPincode: '700001',
    pincodes: ['700001', '700020', '700091'],
    aliases: ['Calcutta'],
  },
  {
    city: 'Howrah',
    state: 'West Bengal',
    defaultPincode: '711101',
    pincodes: ['711101'],
  },

  // --- BIHAR ---
  {
    city: 'Patna',
    state: 'Bihar',
    defaultPincode: '800001',
    pincodes: ['800001'],
  },
  {
    city: 'Gaya',
    state: 'Bihar',
    defaultPincode: '823001',
    pincodes: ['823001'],
  },

  // --- PUNJAB & CHANDIGARH ---
  {
    city: 'Chandigarh',
    state: 'Chandigarh',
    defaultPincode: '160001',
    pincodes: ['160001', '160017', '160022'],
  },
  {
    city: 'Ludhiana',
    state: 'Punjab',
    defaultPincode: '141001',
    pincodes: ['141001'],
  },
  {
    city: 'Amritsar',
    state: 'Punjab',
    defaultPincode: '143001',
    pincodes: ['143001'],
  },

  // --- KERALA ---
  {
    city: 'Kochi',
    state: 'Kerala',
    defaultPincode: '682001',
    pincodes: ['682001', '682016'],
    aliases: ['Cochin', 'Ernakulam'],
  },
  {
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    defaultPincode: '695001',
    pincodes: ['695001'],
    aliases: ['Trivandrum'],
  },

  // --- GOA ---
  {
    city: 'Panaji',
    state: 'Goa',
    defaultPincode: '403001',
    pincodes: ['403001'],
    aliases: ['Panjim'],
  },
  {
    city: 'Margao',
    state: 'Goa',
    defaultPincode: '403601',
    pincodes: ['403601'],
    aliases: ['Madgaon'],
  },

  // --- ODISHA ---
  {
    city: 'Bhubaneswar',
    state: 'Odisha',
    defaultPincode: '751001',
    pincodes: ['751001'],
  },
  {
    city: 'Cuttack',
    state: 'Odisha',
    defaultPincode: '753001',
    pincodes: ['753001'],
  },

  // --- CHHATTISGARH ---
  {
    city: 'Raipur',
    state: 'Chhattisgarh',
    defaultPincode: '492001',
    pincodes: ['492001'],
  },

  // --- JHARKHAND ---
  {
    city: 'Ranchi',
    state: 'Jharkhand',
    defaultPincode: '834001',
    pincodes: ['834001'],
  },
  {
    city: 'Jamshedpur',
    state: 'Jharkhand',
    defaultPincode: '831001',
    pincodes: ['831001'],
  },

  // --- UTTARAKHAND ---
  {
    city: 'Dehradun',
    state: 'Uttarakhand',
    defaultPincode: '248001',
    pincodes: ['248001'],
  },
  {
    city: 'Haridwar',
    state: 'Uttarakhand',
    defaultPincode: '249401',
    pincodes: ['249401'],
  },

  // --- HIMACHAL PRADESH ---
  {
    city: 'Shimla',
    state: 'Himachal Pradesh',
    defaultPincode: '171001',
    pincodes: ['171001'],
  },

  // --- ASSAM ---
  {
    city: 'Guwahati',
    state: 'Assam',
    defaultPincode: '781001',
    pincodes: ['781001'],
  },

  // --- JAMMU & KASHMIR ---
  {
    city: 'Srinagar',
    state: 'Jammu and Kashmir',
    defaultPincode: '190001',
    pincodes: ['190001'],
  },
  {
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    defaultPincode: '180001',
    pincodes: ['180001'],
  },
];

const normalizeStr = (s?: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();

/**
 * 0ms Instant Local Lookup by City Name (Fuzzy & Alias-aware)
 */
export function findLocationByCity(
  cityName: string,
  stateName?: string
): IndiaLocation | null {
  if (!cityName || !cityName.trim()) return null;
  const target = normalizeStr(cityName);
  if (!target) return null;

  const targetState = stateName ? normalizeStr(stateName) : null;

  // Filter candidates if state provided
  const candidates = targetState
    ? INDIA_LOCATIONS.filter((l) => normalizeStr(l.state) === targetState)
    : INDIA_LOCATIONS;

  // 1. Exact city match
  const exact = candidates.find((l) => normalizeStr(l.city) === target);
  if (exact) return exact;

  // 2. Exact alias or district match
  const aliasMatch = candidates.find((l) => {
    if (l.district && normalizeStr(l.district) === target) return true;
    return l.aliases?.some((a) => normalizeStr(a) === target);
  });
  if (aliasMatch) return aliasMatch;

  // 3. Prefix match (e.g. "Palan" -> Palanpur, "Ahmed" -> Ahmedabad)
  if (target.length >= 3) {
    const prefixMatch = candidates.find(
      (l) =>
        normalizeStr(l.city).startsWith(target) ||
        (l.district && normalizeStr(l.district).startsWith(target)) ||
        l.aliases?.some((a) => normalizeStr(a).startsWith(target))
    );
    if (prefixMatch) return prefixMatch;
  }

  // 4. If no match in state candidates, try all locations
  if (targetState) {
    return findLocationByCity(cityName);
  }

  return null;
}

/**
 * 0ms Instant Local Lookup by 6-digit PIN Code
 */
export function findLocationByPincode(pincode: string): IndiaLocation | null {
  const clean = pincode.replace(/\D/g, '').slice(0, 6);
  if (clean.length !== 6) return null;

  // 1. Exact default pincode match
  const exact = INDIA_LOCATIONS.find((l) => l.defaultPincode === clean);
  if (exact) return exact;

  // 2. Exact match in city pincodes list
  const multiMatch = INDIA_LOCATIONS.find((l) => l.pincodes?.includes(clean));
  if (multiMatch) return multiMatch;

  return null;
}

/**
 * Search locations for autocomplete as user types
 */
export function searchLocations(
  query: string,
  stateFilter?: string,
  limit: number = 8
): IndiaLocation[] {
  const normQuery = normalizeStr(query);
  const normState = stateFilter ? normalizeStr(stateFilter) : null;

  let pool = normState
    ? INDIA_LOCATIONS.filter((l) => normalizeStr(l.state) === normState)
    : INDIA_LOCATIONS;

  if (!normQuery) {
    return pool.slice(0, limit);
  }

  const results: { loc: IndiaLocation; score: number }[] = [];

  for (const loc of pool) {
    const cityNorm = normalizeStr(loc.city);
    const distNorm = loc.district ? normalizeStr(loc.district) : '';
    let score = 0;

    if (cityNorm === normQuery) score = 100;
    else if (cityNorm.startsWith(normQuery)) score = 80;
    else if (cityNorm.includes(normQuery)) score = 50;
    else if (distNorm.startsWith(normQuery)) score = 40;
    else if (loc.aliases?.some((a) => normalizeStr(a).startsWith(normQuery))) score = 35;
    else if (loc.defaultPincode.startsWith(query.replace(/\D/g, ''))) score = 60;

    if (score > 0) {
      results.push({ loc, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.loc);
}

/**
 * Get popular cities for a given state
 */
export function getCitiesForState(stateName: string): IndiaLocation[] {
  const normState = normalizeStr(stateName);
  return INDIA_LOCATIONS.filter((l) => normalizeStr(l.state) === normState);
}

/**
 * Online Postal Department API Fallback: City -> PIN Code
 * Automatically fetches from postalpincode.in if city isn't in local DB.
 */
export async function fetchOnlinePincodeByCity(
  city: string
): Promise<{ pincode: string; city: string; state: string } | null> {
  const clean = city.trim();
  if (clean.length < 3) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(
      `https://api.postalpincode.in/postoffice/${encodeURIComponent(clean)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const offices = data[0].PostOffice;
      // Prefer Delivery post office or first one
      const preferred = offices.find((p: any) => p.DeliveryStatus === 'Delivery') || offices[0];
      return {
        pincode: preferred.Pincode,
        city: preferred.District || preferred.Circle || clean,
        state: preferred.State,
      };
    }
  } catch {
    // Network or abort
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}

/**
 * Online Postal Department API Fallback: PIN Code -> City & State
 */
export async function fetchOnlineCityByPincode(
  pincode: string
): Promise<{ city: string; state: string; district?: string } | null> {
  const clean = pincode.replace(/\D/g, '').slice(0, 6);
  if (clean.length !== 6) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return {
        city: po.District || po.Block || po.Name,
        state: po.State,
        district: po.District,
      };
    }
  } catch {
    // Network or abort
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}
