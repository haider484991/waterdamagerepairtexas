/**
 * US States and Cities Location Data
 * Top 25 US states by population with cities having population > 10,000
 */

export interface StateData {
  code: string;
  name: string;
  population: number;
  rank: number;
  slug: string;
}

export interface CityData {
  name: string;
  stateCode: string;
  population: number;
  slug: string;
  lat: number;
  lng: number;
}

// Top 25 US States by Population (2023 Census estimates)
export const TOP_25_STATES: StateData[] = [
  { code: "CA", name: "California", population: 39538223, rank: 1, slug: "california" },
  { code: "TX", name: "Texas", population: 29145505, rank: 2, slug: "texas" },
  { code: "FL", name: "Florida", population: 21538187, rank: 3, slug: "florida" },
  { code: "NY", name: "New York", population: 20201249, rank: 4, slug: "new-york" },
  { code: "PA", name: "Pennsylvania", population: 13002700, rank: 5, slug: "pennsylvania" },
  { code: "IL", name: "Illinois", population: 12812508, rank: 6, slug: "illinois" },
  { code: "OH", name: "Ohio", population: 11799448, rank: 7, slug: "ohio" },
  { code: "GA", name: "Georgia", population: 10711908, rank: 8, slug: "georgia" },
  { code: "NC", name: "North Carolina", population: 10439388, rank: 9, slug: "north-carolina" },
  { code: "MI", name: "Michigan", population: 10077331, rank: 10, slug: "michigan" },
  { code: "NJ", name: "New Jersey", population: 9288994, rank: 11, slug: "new-jersey" },
  { code: "VA", name: "Virginia", population: 8631393, rank: 12, slug: "virginia" },
  { code: "WA", name: "Washington", population: 7705281, rank: 13, slug: "washington" },
  { code: "AZ", name: "Arizona", population: 7151502, rank: 14, slug: "arizona" },
  { code: "MA", name: "Massachusetts", population: 7029917, rank: 15, slug: "massachusetts" },
  { code: "TN", name: "Tennessee", population: 6910840, rank: 16, slug: "tennessee" },
  { code: "IN", name: "Indiana", population: 6785528, rank: 17, slug: "indiana" },
  { code: "MD", name: "Maryland", population: 6177224, rank: 18, slug: "maryland" },
  { code: "MO", name: "Missouri", population: 6154913, rank: 19, slug: "missouri" },
  { code: "WI", name: "Wisconsin", population: 5893718, rank: 20, slug: "wisconsin" },
  { code: "CO", name: "Colorado", population: 5773714, rank: 21, slug: "colorado" },
  { code: "MN", name: "Minnesota", population: 5706494, rank: 22, slug: "minnesota" },
  { code: "SC", name: "South Carolina", population: 5118425, rank: 23, slug: "south-carolina" },
  { code: "AL", name: "Alabama", population: 5024279, rank: 24, slug: "alabama" },
  { code: "LA", name: "Louisiana", population: 4657757, rank: 25, slug: "louisiana" },
];

// Major cities with population > 10,000 for top 25 states
// This is a representative sample - in production, you'd want comprehensive data
export const MAJOR_CITIES: CityData[] = [
  // California (Top 50+ cities)
  { name: "Los Angeles", stateCode: "CA", population: 3898747, slug: "los-angeles", lat: 34.0522, lng: -118.2437 },
  { name: "San Diego", stateCode: "CA", population: 1386932, slug: "san-diego", lat: 32.7157, lng: -117.1611 },
  { name: "San Jose", stateCode: "CA", population: 1013240, slug: "san-jose", lat: 37.3382, lng: -121.8863 },
  { name: "San Francisco", stateCode: "CA", population: 873965, slug: "san-francisco", lat: 37.7749, lng: -122.4194 },
  { name: "Fresno", stateCode: "CA", population: 542107, slug: "fresno", lat: 36.7378, lng: -119.7871 },
  { name: "Sacramento", stateCode: "CA", population: 524943, slug: "sacramento", lat: 38.5816, lng: -121.4944 },
  { name: "Long Beach", stateCode: "CA", population: 466742, slug: "long-beach", lat: 33.7701, lng: -118.1937 },
  { name: "Oakland", stateCode: "CA", population: 440646, slug: "oakland", lat: 37.8044, lng: -122.2712 },
  { name: "Bakersfield", stateCode: "CA", population: 403455, slug: "bakersfield", lat: 35.3733, lng: -119.0187 },
  { name: "Anaheim", stateCode: "CA", population: 346824, slug: "anaheim", lat: 33.8366, lng: -117.9143 },
  { name: "Santa Ana", stateCode: "CA", population: 310227, slug: "santa-ana", lat: 33.7455, lng: -117.8677 },
  { name: "Riverside", stateCode: "CA", population: 314998, slug: "riverside", lat: 33.9533, lng: -117.3962 },
  { name: "Stockton", stateCode: "CA", population: 320804, slug: "stockton", lat: 37.9577, lng: -121.2908 },
  { name: "Irvine", stateCode: "CA", population: 307670, slug: "irvine", lat: 33.6846, lng: -117.8265 },
  { name: "Chula Vista", stateCode: "CA", population: 275487, slug: "chula-vista", lat: 32.6401, lng: -117.0842 },
  
  // Texas (Top 30+ cities)
  { name: "Houston", stateCode: "TX", population: 2304580, slug: "houston", lat: 29.7604, lng: -95.3698 },
  { name: "San Antonio", stateCode: "TX", population: 1547253, slug: "san-antonio", lat: 29.4241, lng: -98.4936 },
  { name: "Dallas", stateCode: "TX", population: 1304379, slug: "dallas", lat: 32.7767, lng: -96.7970 },
  { name: "Austin", stateCode: "TX", population: 978908, slug: "austin", lat: 30.2672, lng: -97.7431 },
  { name: "Fort Worth", stateCode: "TX", population: 956709, slug: "fort-worth", lat: 32.7555, lng: -97.3308 },
  { name: "El Paso", stateCode: "TX", population: 679879, slug: "el-paso", lat: 31.7619, lng: -106.4850 },
  { name: "Arlington", stateCode: "TX", population: 398121, slug: "arlington", lat: 32.7357, lng: -97.1081 },
  { name: "Corpus Christi", stateCode: "TX", population: 317863, slug: "corpus-christi", lat: 27.8006, lng: -97.3964 },
  { name: "Plano", stateCode: "TX", population: 285494, slug: "plano", lat: 33.0198, lng: -96.6989 },
  { name: "Lubbock", stateCode: "TX", population: 263930, slug: "lubbock", lat: 33.5779, lng: -101.8552 },
  { name: "Irving", stateCode: "TX", population: 256684, slug: "irving", lat: 32.8140, lng: -96.9489 },
  { name: "Laredo", stateCode: "TX", population: 255205, slug: "laredo", lat: 27.5306, lng: -99.4803 },
  { name: "Frisco", stateCode: "TX", population: 200509, slug: "frisco", lat: 33.1507, lng: -96.8236 },
  { name: "McKinney", stateCode: "TX", population: 199177, slug: "mckinney", lat: 33.1972, lng: -96.6397 },
  
  // Florida (Top 25+ cities)
  { name: "Jacksonville", stateCode: "FL", population: 949611, slug: "jacksonville", lat: 30.3322, lng: -81.6557 },
  { name: "Miami", stateCode: "FL", population: 442241, slug: "miami", lat: 25.7617, lng: -80.1918 },
  { name: "Tampa", stateCode: "FL", population: 384959, slug: "tampa", lat: 27.9506, lng: -82.4572 },
  { name: "Orlando", stateCode: "FL", population: 307573, slug: "orlando", lat: 28.5383, lng: -81.3792 },
  { name: "St. Petersburg", stateCode: "FL", population: 258308, slug: "st-petersburg", lat: 27.7676, lng: -82.6403 },
  { name: "Hialeah", stateCode: "FL", population: 223109, slug: "hialeah", lat: 25.8576, lng: -80.2781 },
  { name: "Port St. Lucie", stateCode: "FL", population: 204851, slug: "port-st-lucie", lat: 27.2730, lng: -80.3582 },
  { name: "Tallahassee", stateCode: "FL", population: 196169, slug: "tallahassee", lat: 30.4383, lng: -84.2807 },
  { name: "Cape Coral", stateCode: "FL", population: 194016, slug: "cape-coral", lat: 26.5629, lng: -81.9495 },
  { name: "Fort Lauderdale", stateCode: "FL", population: 182760, slug: "fort-lauderdale", lat: 26.1224, lng: -80.1373 },
  { name: "Pembroke Pines", stateCode: "FL", population: 171178, slug: "pembroke-pines", lat: 26.0034, lng: -80.2962 },
  { name: "Hollywood", stateCode: "FL", population: 153067, slug: "hollywood", lat: 26.0112, lng: -80.1495 },
  
  // New York (Top 20+ cities)
  { name: "New York", stateCode: "NY", population: 8336817, slug: "new-york", lat: 40.7128, lng: -74.0060 },
  { name: "Buffalo", stateCode: "NY", population: 278349, slug: "buffalo", lat: 42.8864, lng: -78.8784 },
  { name: "Rochester", stateCode: "NY", population: 211328, slug: "rochester", lat: 43.1566, lng: -77.6088 },
  { name: "Yonkers", stateCode: "NY", population: 211569, slug: "yonkers", lat: 40.9312, lng: -73.8987 },
  { name: "Syracuse", stateCode: "NY", population: 148620, slug: "syracuse", lat: 43.0481, lng: -76.1474 },
  { name: "Albany", stateCode: "NY", population: 99224, slug: "albany", lat: 42.6526, lng: -73.7562 },
  { name: "New Rochelle", stateCode: "NY", population: 79726, slug: "new-rochelle", lat: 40.9115, lng: -73.7823 },
  { name: "Mount Vernon", stateCode: "NY", population: 68224, slug: "mount-vernon", lat: 40.9126, lng: -73.8370 },
  
  // Pennsylvania
  { name: "Philadelphia", stateCode: "PA", population: 1584064, slug: "philadelphia", lat: 39.9526, lng: -75.1652 },
  { name: "Pittsburgh", stateCode: "PA", population: 302971, slug: "pittsburgh", lat: 40.4406, lng: -79.9959 },
  { name: "Allentown", stateCode: "PA", population: 125845, slug: "allentown", lat: 40.6084, lng: -75.4902 },
  { name: "Erie", stateCode: "PA", population: 96616, slug: "erie", lat: 42.1292, lng: -80.0851 },
  { name: "Reading", stateCode: "PA", population: 95112, slug: "reading", lat: 40.3356, lng: -75.9269 },
  
  // Illinois
  { name: "Chicago", stateCode: "IL", population: 2746388, slug: "chicago", lat: 41.8781, lng: -87.6298 },
  { name: "Aurora", stateCode: "IL", population: 180542, slug: "aurora", lat: 41.7606, lng: -88.3201 },
  { name: "Naperville", stateCode: "IL", population: 149104, slug: "naperville", lat: 41.7508, lng: -88.1535 },
  { name: "Joliet", stateCode: "IL", population: 150362, slug: "joliet", lat: 41.5250, lng: -88.0817 },
  { name: "Rockford", stateCode: "IL", population: 148655, slug: "rockford", lat: 42.2711, lng: -89.0940 },
  
  // Ohio
  { name: "Columbus", stateCode: "OH", population: 905748, slug: "columbus", lat: 39.9612, lng: -82.9988 },
  { name: "Cleveland", stateCode: "OH", population: 372624, slug: "cleveland", lat: 41.4993, lng: -81.6944 },
  { name: "Cincinnati", stateCode: "OH", population: 309317, slug: "cincinnati", lat: 39.1031, lng: -84.5120 },
  { name: "Toledo", stateCode: "OH", population: 270871, slug: "toledo", lat: 41.6528, lng: -83.5379 },
  { name: "Akron", stateCode: "OH", population: 190469, slug: "akron", lat: 41.0814, lng: -81.5190 },
  
  // Georgia
  { name: "Atlanta", stateCode: "GA", population: 498715, slug: "atlanta", lat: 33.7490, lng: -84.3880 },
  { name: "Augusta", stateCode: "GA", population: 202081, slug: "augusta", lat: 33.4735, lng: -82.0105 },
  { name: "Columbus", stateCode: "GA", population: 206922, slug: "columbus", lat: 32.4609, lng: -84.9877 },
  { name: "Macon", stateCode: "GA", population: 157346, slug: "macon", lat: 32.8407, lng: -83.6324 },
  { name: "Savannah", stateCode: "GA", population: 147780, slug: "savannah", lat: 32.0809, lng: -81.0912 },
  
  // North Carolina
  { name: "Charlotte", stateCode: "NC", population: 897720, slug: "charlotte", lat: 35.2271, lng: -80.8431 },
  { name: "Raleigh", stateCode: "NC", population: 474069, slug: "raleigh", lat: 35.7796, lng: -78.6382 },
  { name: "Greensboro", stateCode: "NC", population: 299035, slug: "greensboro", lat: 36.0726, lng: -79.7920 },
  { name: "Durham", stateCode: "NC", population: 283506, slug: "durham", lat: 35.9940, lng: -78.8986 },
  { name: "Winston-Salem", stateCode: "NC", population: 247945, slug: "winston-salem", lat: 36.0999, lng: -80.2442 },
  
  // Michigan
  { name: "Detroit", stateCode: "MI", population: 639111, slug: "detroit", lat: 42.3314, lng: -83.0458 },
  { name: "Grand Rapids", stateCode: "MI", population: 198917, slug: "grand-rapids", lat: 42.9634, lng: -85.6681 },
  { name: "Warren", stateCode: "MI", population: 139387, slug: "warren", lat: 42.5145, lng: -83.0147 },
  { name: "Sterling Heights", stateCode: "MI", population: 134346, slug: "sterling-heights", lat: 42.5803, lng: -83.0302 },
  { name: "Ann Arbor", stateCode: "MI", population: 123851, slug: "ann-arbor", lat: 42.2808, lng: -83.7430 },
  
  // New Jersey
  { name: "Newark", stateCode: "NJ", population: 311549, slug: "newark", lat: 40.7357, lng: -74.1724 },
  { name: "Jersey City", stateCode: "NJ", population: 292449, slug: "jersey-city", lat: 40.7178, lng: -74.0431 },
  { name: "Paterson", stateCode: "NJ", population: 159732, slug: "paterson", lat: 40.9168, lng: -74.1718 },
  { name: "Elizabeth", stateCode: "NJ", population: 137298, slug: "elizabeth", lat: 40.6640, lng: -74.2107 },
  { name: "Edison", stateCode: "NJ", population: 107588, slug: "edison", lat: 40.5187, lng: -74.4121 },
  
  // Virginia
  { name: "Virginia Beach", stateCode: "VA", population: 459470, slug: "virginia-beach", lat: 36.8529, lng: -75.9780 },
  { name: "Norfolk", stateCode: "VA", population: 238005, slug: "norfolk", lat: 36.8508, lng: -76.2859 },
  { name: "Chesapeake", stateCode: "VA", population: 249422, slug: "chesapeake", lat: 36.7682, lng: -76.2875 },
  { name: "Richmond", stateCode: "VA", population: 226610, slug: "richmond", lat: 37.5407, lng: -77.4360 },
  { name: "Newport News", stateCode: "VA", population: 186247, slug: "newport-news", lat: 37.0871, lng: -76.4730 },
  
  // Washington
  { name: "Seattle", stateCode: "WA", population: 737015, slug: "seattle", lat: 47.6062, lng: -122.3321 },
  { name: "Spokane", stateCode: "WA", population: 228989, slug: "spokane", lat: 47.6588, lng: -117.4260 },
  { name: "Tacoma", stateCode: "WA", population: 219346, slug: "tacoma", lat: 47.2529, lng: -122.4443 },
  { name: "Vancouver", stateCode: "WA", population: 190915, slug: "vancouver", lat: 45.6387, lng: -122.6615 },
  { name: "Bellevue", stateCode: "WA", population: 151854, slug: "bellevue", lat: 47.6101, lng: -122.2015 },
  
  // Arizona
  { name: "Phoenix", stateCode: "AZ", population: 1680992, slug: "phoenix", lat: 33.4484, lng: -112.0740 },
  { name: "Tucson", stateCode: "AZ", population: 548073, slug: "tucson", lat: 32.2226, lng: -110.9747 },
  { name: "Mesa", stateCode: "AZ", population: 504258, slug: "mesa", lat: 33.4152, lng: -111.8315 },
  { name: "Chandler", stateCode: "AZ", population: 275987, slug: "chandler", lat: 33.3062, lng: -111.8413 },
  { name: "Scottsdale", stateCode: "AZ", population: 241361, slug: "scottsdale", lat: 33.4942, lng: -111.9261 },
  
  // Massachusetts
  { name: "Boston", stateCode: "MA", population: 675647, slug: "boston", lat: 42.3601, lng: -71.0589 },
  { name: "Worcester", stateCode: "MA", population: 206518, slug: "worcester", lat: 42.2626, lng: -71.8023 },
  { name: "Springfield", stateCode: "MA", population: 155929, slug: "springfield", lat: 42.1015, lng: -72.5898 },
  { name: "Cambridge", stateCode: "MA", population: 118403, slug: "cambridge", lat: 42.3736, lng: -71.1097 },
  { name: "Lowell", stateCode: "MA", population: 115554, slug: "lowell", lat: 42.6334, lng: -71.3162 },
  
  // Tennessee
  { name: "Nashville", stateCode: "TN", population: 689447, slug: "nashville", lat: 36.1627, lng: -86.7816 },
  { name: "Memphis", stateCode: "TN", population: 633104, slug: "memphis", lat: 35.1495, lng: -90.0490 },
  { name: "Knoxville", stateCode: "TN", population: 190740, slug: "knoxville", lat: 35.9606, lng: -83.9207 },
  { name: "Chattanooga", stateCode: "TN", population: 184232, slug: "chattanooga", lat: 35.0456, lng: -85.3097 },
  { name: "Clarksville", stateCode: "TN", population: 166722, slug: "clarksville", lat: 36.5298, lng: -87.3595 },
  
  // Indiana
  { name: "Indianapolis", stateCode: "IN", population: 887642, slug: "indianapolis", lat: 39.7684, lng: -86.1581 },
  { name: "Fort Wayne", stateCode: "IN", population: 270402, slug: "fort-wayne", lat: 41.0793, lng: -85.1394 },
  { name: "Evansville", stateCode: "IN", population: 117298, slug: "evansville", lat: 37.9716, lng: -87.5711 },
  { name: "South Bend", stateCode: "IN", population: 103453, slug: "south-bend", lat: 41.6764, lng: -86.2520 },
  { name: "Carmel", stateCode: "IN", population: 99757, slug: "carmel", lat: 39.9784, lng: -86.1180 },
  
  // Maryland
  { name: "Baltimore", stateCode: "MD", population: 585708, slug: "baltimore", lat: 39.2904, lng: -76.6122 },
  { name: "Columbia", stateCode: "MD", population: 104681, slug: "columbia", lat: 39.2037, lng: -76.8610 },
  { name: "Germantown", stateCode: "MD", population: 90582, slug: "germantown", lat: 39.1732, lng: -77.2717 },
  { name: "Silver Spring", stateCode: "MD", population: 81015, slug: "silver-spring", lat: 38.9907, lng: -77.0261 },
  { name: "Waldorf", stateCode: "MD", population: 79314, slug: "waldorf", lat: 38.6414, lng: -76.9519 },
  
  // Missouri
  { name: "Kansas City", stateCode: "MO", population: 508090, slug: "kansas-city", lat: 39.0997, lng: -94.5786 },
  { name: "St. Louis", stateCode: "MO", population: 301578, slug: "st-louis", lat: 38.6270, lng: -90.1994 },
  { name: "Springfield", stateCode: "MO", population: 169176, slug: "springfield", lat: 37.2090, lng: -93.2923 },
  { name: "Columbia", stateCode: "MO", population: 126254, slug: "columbia", lat: 38.9517, lng: -92.3341 },
  { name: "Independence", stateCode: "MO", population: 123011, slug: "independence", lat: 39.0911, lng: -94.4155 },
  
  // Wisconsin
  { name: "Milwaukee", stateCode: "WI", population: 577222, slug: "milwaukee", lat: 43.0389, lng: -87.9065 },
  { name: "Madison", stateCode: "WI", population: 269840, slug: "madison", lat: 43.0731, lng: -89.4012 },
  { name: "Green Bay", stateCode: "WI", population: 107395, slug: "green-bay", lat: 44.5133, lng: -88.0133 },
  { name: "Kenosha", stateCode: "WI", population: 100164, slug: "kenosha", lat: 42.5847, lng: -87.8212 },
  { name: "Racine", stateCode: "WI", population: 76893, slug: "racine", lat: 42.7261, lng: -87.7829 },
  
  // Colorado
  { name: "Denver", stateCode: "CO", population: 715522, slug: "denver", lat: 39.7392, lng: -104.9903 },
  { name: "Colorado Springs", stateCode: "CO", population: 478961, slug: "colorado-springs", lat: 38.8339, lng: -104.8214 },
  { name: "Aurora", stateCode: "CO", population: 386261, slug: "aurora", lat: 39.7294, lng: -104.8319 },
  { name: "Fort Collins", stateCode: "CO", population: 170243, slug: "fort-collins", lat: 40.5853, lng: -105.0844 },
  { name: "Lakewood", stateCode: "CO", population: 155984, slug: "lakewood", lat: 39.7047, lng: -105.0814 },
  
  // Minnesota
  { name: "Minneapolis", stateCode: "MN", population: 429954, slug: "minneapolis", lat: 44.9778, lng: -93.2650 },
  { name: "St. Paul", stateCode: "MN", population: 311527, slug: "st-paul", lat: 44.9537, lng: -93.0900 },
  { name: "Rochester", stateCode: "MN", population: 121465, slug: "rochester", lat: 44.0121, lng: -92.4802 },
  { name: "Bloomington", stateCode: "MN", population: 89987, slug: "bloomington", lat: 44.8408, lng: -93.2983 },
  { name: "Duluth", stateCode: "MN", population: 86697, slug: "duluth", lat: 46.7867, lng: -92.1005 },
  
  // South Carolina
  { name: "Columbia", stateCode: "SC", population: 137300, slug: "columbia", lat: 34.0007, lng: -81.0348 },
  { name: "Charleston", stateCode: "SC", population: 150227, slug: "charleston", lat: 32.7765, lng: -79.9311 },
  { name: "North Charleston", stateCode: "SC", population: 114852, slug: "north-charleston", lat: 32.8546, lng: -79.9748 },
  { name: "Mount Pleasant", stateCode: "SC", population: 90801, slug: "mount-pleasant", lat: 32.8323, lng: -79.8284 },
  { name: "Rock Hill", stateCode: "SC", population: 74410, slug: "rock-hill", lat: 34.9249, lng: -81.0251 },
  
  // Alabama
  { name: "Birmingham", stateCode: "AL", population: 200733, slug: "birmingham", lat: 33.5207, lng: -86.8025 },
  { name: "Montgomery", stateCode: "AL", population: 200603, slug: "montgomery", lat: 32.3668, lng: -86.3000 },
  { name: "Huntsville", stateCode: "AL", population: 215006, slug: "huntsville", lat: 34.7304, lng: -86.5861 },
  { name: "Mobile", stateCode: "AL", population: 187041, slug: "mobile", lat: 30.6954, lng: -88.0399 },
  { name: "Tuscaloosa", stateCode: "AL", population: 101129, slug: "tuscaloosa", lat: 33.2098, lng: -87.5692 },
  
  // Louisiana
  { name: "New Orleans", stateCode: "LA", population: 383997, slug: "new-orleans", lat: 29.9511, lng: -90.0715 },
  { name: "Baton Rouge", stateCode: "LA", population: 227470, slug: "baton-rouge", lat: 30.4515, lng: -91.1871 },
  { name: "Shreveport", stateCode: "LA", population: 187593, slug: "shreveport", lat: 32.5252, lng: -93.7502 },
  { name: "Lafayette", stateCode: "LA", population: 126185, slug: "lafayette", lat: 30.2241, lng: -92.0198 },
  { name: "Lake Charles", stateCode: "LA", population: 84872, slug: "lake-charles", lat: 30.2134, lng: -93.2044 },
];

/**
 * Get cities for a specific state
 */
export function getCitiesForState(stateCode: string): CityData[] {
  return MAJOR_CITIES.filter(city => city.stateCode === stateCode);
}

/**
 * Get state by code
 */
export function getStateByCode(code: string): StateData | undefined {
  return TOP_25_STATES.find(state => state.code === code);
}

/**
 * Get state by slug
 */
export function getStateBySlug(slug: string): StateData | undefined {
  return TOP_25_STATES.find(state => state.slug === slug);
}

/**
 * Get city by slug and state code
 */
export function getCityBySlug(stateCode: string, citySlug: string): CityData | undefined {
  return MAJOR_CITIES.find(
    city => city.stateCode === stateCode && city.slug === citySlug
  );
}

/**
 * Get all state codes
 */
export function getAllStateCodes(): string[] {
  return TOP_25_STATES.map(state => state.code);
}

/**
 * Get all states (for seeding)
 */
export function getAllStates(): StateData[] {
  return TOP_25_STATES;
}

/**
 * Get all cities (for seeding)
 */
export function getAllCities(): CityData[] {
  return MAJOR_CITIES;
}

