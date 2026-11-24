export type Place = {
  outcode: string;
  town: string;
  county: string;
  region: string;
  lat: number;
  lng: number;
};

// Approximate outcode centroids for radius search. Not an official postcode file.
export const PLACES: Place[] = [
  { outcode: "YO1", town: "York", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 53.959, lng: -1.082 },
  { outcode: "YO7", town: "Thirsk", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.233, lng: -1.343 },
  { outcode: "YO8", town: "Selby", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 53.783, lng: -1.069 },
  { outcode: "YO11", town: "Scarborough", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.279, lng: -0.404 },
  { outcode: "YO17", town: "Malton", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.136, lng: -0.799 },
  { outcode: "YO21", town: "Whitby", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.486, lng: -0.615 },
  { outcode: "YO61", town: "Easingwold", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.12, lng: -1.19 },
  { outcode: "HG1", town: "Harrogate", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 53.992, lng: -1.541 },
  { outcode: "HG4", town: "Ripon", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.136, lng: -1.524 },
  { outcode: "DL6", town: "Northallerton", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.339, lng: -1.433 },
  { outcode: "DL7", town: "Northallerton", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.339, lng: -1.48 },
  { outcode: "DL8", town: "Bedale", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.291, lng: -1.591 },
  { outcode: "DL9", town: "Catterick", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.377, lng: -1.633 },
  { outcode: "DL10", town: "Richmond", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.403, lng: -1.737 },
  { outcode: "BD23", town: "Skipton", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 53.962, lng: -2.017 },
  { outcode: "BD24", town: "Settle", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.068, lng: -2.277 },
  { outcode: "TS9", town: "Stokesley", county: "North Yorkshire", region: "Yorkshire and the Humber", lat: 54.471, lng: -1.19 },
  { outcode: "LS1", town: "Leeds", county: "West Yorkshire", region: "Yorkshire and the Humber", lat: 53.8, lng: -1.549 },
  { outcode: "LS17", town: "Leeds", county: "West Yorkshire", region: "Yorkshire and the Humber", lat: 53.85, lng: -1.53 },
  { outcode: "WF1", town: "Wakefield", county: "West Yorkshire", region: "Yorkshire and the Humber", lat: 53.683, lng: -1.499 },
  { outcode: "HX1", town: "Halifax", county: "West Yorkshire", region: "Yorkshire and the Humber", lat: 53.725, lng: -1.863 },
  { outcode: "HD1", town: "Huddersfield", county: "West Yorkshire", region: "Yorkshire and the Humber", lat: 53.645, lng: -1.785 },
  { outcode: "BD1", town: "Bradford", county: "West Yorkshire", region: "Yorkshire and the Humber", lat: 53.794, lng: -1.752 },
  { outcode: "S1", town: "Sheffield", county: "South Yorkshire", region: "Yorkshire and the Humber", lat: 53.381, lng: -1.47 },
  { outcode: "S70", town: "Barnsley", county: "South Yorkshire", region: "Yorkshire and the Humber", lat: 53.553, lng: -1.479 },
  { outcode: "DN1", town: "Doncaster", county: "South Yorkshire", region: "Yorkshire and the Humber", lat: 53.523, lng: -1.128 },
  { outcode: "S60", town: "Rotherham", county: "South Yorkshire", region: "Yorkshire and the Humber", lat: 53.43, lng: -1.357 },
  { outcode: "HU1", town: "Hull", county: "East Riding of Yorkshire", region: "Yorkshire and the Humber", lat: 53.745, lng: -0.337 },
  { outcode: "HU17", town: "Beverley", county: "East Riding of Yorkshire", region: "Yorkshire and the Humber", lat: 53.845, lng: -0.423 },
  { outcode: "YO25", town: "Driffield", county: "East Riding of Yorkshire", region: "Yorkshire and the Humber", lat: 54.006, lng: -0.438 },
  { outcode: "DN14", town: "Goole", county: "East Riding of Yorkshire", region: "Yorkshire and the Humber", lat: 53.703, lng: -0.875 },
  { outcode: "DH1", town: "Durham", county: "County Durham", region: "North East", lat: 54.776, lng: -1.573 },
  { outcode: "DL14", town: "Bishop Auckland", county: "County Durham", region: "North East", lat: 54.656, lng: -1.677 },
  { outcode: "TS1", town: "Middlesbrough", county: "North Yorkshire", region: "North East", lat: 54.576, lng: -1.235 },
  { outcode: "NE1", town: "Newcastle upon Tyne", county: "Tyne and Wear", region: "North East", lat: 54.978, lng: -1.614 },
  { outcode: "SR1", town: "Sunderland", county: "Tyne and Wear", region: "North East", lat: 54.906, lng: -1.383 },
  { outcode: "NE46", town: "Hexham", county: "Northumberland", region: "North East", lat: 54.971, lng: -2.101 },
  { outcode: "NE61", town: "Morpeth", county: "Northumberland", region: "North East", lat: 55.168, lng: -1.688 },
  { outcode: "NE66", town: "Alnwick", county: "Northumberland", region: "North East", lat: 55.413, lng: -1.706 },
  { outcode: "CA1", town: "Carlisle", county: "Cumbria", region: "North West", lat: 54.892, lng: -2.932 },
  { outcode: "LA1", town: "Lancaster", county: "Lancashire", region: "North West", lat: 54.047, lng: -2.801 },
  { outcode: "LA9", town: "Kendal", county: "Cumbria", region: "North West", lat: 54.328, lng: -2.746 },
  { outcode: "LA22", town: "Ambleside", county: "Cumbria", region: "North West", lat: 54.428, lng: -2.962 },
  { outcode: "PR1", town: "Preston", county: "Lancashire", region: "North West", lat: 53.763, lng: -2.703 },
  { outcode: "BB1", town: "Blackburn", county: "Lancashire", region: "North West", lat: 53.748, lng: -2.482 },
  { outcode: "M1", town: "Manchester", county: "Greater Manchester", region: "North West", lat: 53.48, lng: -2.242 },
  { outcode: "L1", town: "Liverpool", county: "Merseyside", region: "North West", lat: 53.408, lng: -2.991 },
  { outcode: "CH1", town: "Chester", county: "Cheshire", region: "North West", lat: 53.19, lng: -2.891 },
  { outcode: "NG1", town: "Nottingham", county: "Nottinghamshire", region: "East Midlands", lat: 52.954, lng: -1.155 },
  { outcode: "LE1", town: "Leicester", county: "Leicestershire", region: "East Midlands", lat: 52.636, lng: -1.132 },
  { outcode: "DE1", town: "Derby", county: "Derbyshire", region: "East Midlands", lat: 52.922, lng: -1.476 },
  { outcode: "LN1", town: "Lincoln", county: "Lincolnshire", region: "East Midlands", lat: 53.229, lng: -0.541 },
  { outcode: "B1", town: "Birmingham", county: "West Midlands", region: "West Midlands", lat: 52.479, lng: -1.902 },
  { outcode: "CV1", town: "Coventry", county: "West Midlands", region: "West Midlands", lat: 52.408, lng: -1.51 },
  { outcode: "WR1", town: "Worcester", county: "Worcestershire", region: "West Midlands", lat: 52.193, lng: -2.22 },
  { outcode: "HR1", town: "Hereford", county: "Herefordshire", region: "West Midlands", lat: 52.056, lng: -2.716 },
  { outcode: "CB1", town: "Cambridge", county: "Cambridgeshire", region: "East of England", lat: 52.205, lng: 0.122 },
  { outcode: "NR1", town: "Norwich", county: "Norfolk", region: "East of England", lat: 52.628, lng: 1.297 },
  { outcode: "IP1", town: "Ipswich", county: "Suffolk", region: "East of England", lat: 52.056, lng: 1.148 },
  { outcode: "CM1", town: "Chelmsford", county: "Essex", region: "East of England", lat: 51.736, lng: 0.469 },
  { outcode: "OX1", town: "Oxford", county: "Oxfordshire", region: "South East", lat: 51.752, lng: -1.256 },
  { outcode: "RG1", town: "Reading", county: "Berkshire", region: "South East", lat: 51.454, lng: -0.973 },
  { outcode: "GU1", town: "Guildford", county: "Surrey", region: "South East", lat: 51.236, lng: -0.57 },
  { outcode: "BN1", town: "Brighton", county: "East Sussex", region: "South East", lat: 50.822, lng: -0.137 },
  { outcode: "CT1", town: "Canterbury", county: "Kent", region: "South East", lat: 51.28, lng: 1.08 },
  { outcode: "PO1", town: "Portsmouth", county: "Hampshire", region: "South East", lat: 50.819, lng: -1.088 },
  { outcode: "SO14", town: "Southampton", county: "Hampshire", region: "South East", lat: 50.909, lng: -1.404 },
  { outcode: "BS1", town: "Bristol", county: "Bristol", region: "South West", lat: 51.454, lng: -2.588 },
  { outcode: "BA1", town: "Bath", county: "Somerset", region: "South West", lat: 51.381, lng: -2.359 },
  { outcode: "GL1", town: "Gloucester", county: "Gloucestershire", region: "South West", lat: 51.864, lng: -2.238 },
  { outcode: "EX1", town: "Exeter", county: "Devon", region: "South West", lat: 50.723, lng: -3.533 },
  { outcode: "PL1", town: "Plymouth", county: "Devon", region: "South West", lat: 50.371, lng: -4.142 },
  { outcode: "TR1", town: "Truro", county: "Cornwall", region: "South West", lat: 50.263, lng: -5.051 },
  { outcode: "SN1", town: "Swindon", county: "Wiltshire", region: "South West", lat: 51.558, lng: -1.781 },
  { outcode: "DT1", town: "Dorchester", county: "Dorset", region: "South West", lat: 50.715, lng: -2.44 },
  { outcode: "CF10", town: "Cardiff", county: "Cardiff", region: "Wales", lat: 51.481, lng: -3.179 },
  { outcode: "SA1", town: "Swansea", county: "Swansea", region: "Wales", lat: 51.621, lng: -3.943 },
  { outcode: "LL11", town: "Wrexham", county: "Wrexham", region: "Wales", lat: 53.046, lng: -3.002 },
  { outcode: "SY23", town: "Aberystwyth", county: "Ceredigion", region: "Wales", lat: 52.415, lng: -4.082 },
  { outcode: "EH1", town: "Edinburgh", county: "City of Edinburgh", region: "Scotland", lat: 55.953, lng: -3.189 },
  { outcode: "G1", town: "Glasgow", county: "Glasgow", region: "Scotland", lat: 55.861, lng: -4.252 },
  { outcode: "AB10", town: "Aberdeen", county: "Aberdeen", region: "Scotland", lat: 57.149, lng: -2.096 },
  { outcode: "IV1", town: "Inverness", county: "Highland", region: "Scotland", lat: 57.478, lng: -4.225 },
  { outcode: "E1", town: "London", county: "London", region: "London", lat: 51.515, lng: -0.072 },
  { outcode: "SW1", town: "London", county: "London", region: "London", lat: 51.498, lng: -0.135 },
  { outcode: "N1", town: "London", county: "London", region: "London", lat: 51.537, lng: -0.098 },
];

const COUNTY_COPY: Record<string, string> = {
  "North Yorkshire":
    "North Yorkshire is where VerifiedHorses starts: moors, vale and a lot of yards between York, Thirsk and the Dales. Adverts here show the town and the distance, not the seller's full postcode. Watch the video, read the vetting date, and arrange your own vet before you buy.",
  "West Yorkshire":
    "West Yorkshire's adverts sit around Leeds, Bradford, Halifax and the edges of the Dales. It is a short trip from the launch area, so buyers from the cities and the hills use the same search. Identity checks and riding video are on by default.",
  "South Yorkshire":
    "South Yorkshire covers Sheffield, Doncaster, Barnsley and Rotherham. Horses here are often a mix of riding-club animals and cobs. Use the video and the document dates, then go and see the horse.",
  "East Riding of Yorkshire":
    "The East Riding runs from Hull and Beverley out to Driffield and the Wolds. Yards are spread out, so the distance on each card matters. Sellers still need an identity check before the ID-verified badge appears.",
  "County Durham":
    "County Durham sits just north of the Yorkshire border, with yards from Durham city out to Bishop Auckland and the Dales edge. It is part of the northern launch, not an afterthought.",
  Northumberland:
    "Northumberland is long on miles and short on traffic once you leave the Tyne. Adverts around Hexham, Morpeth and Alnwick need a clear video because a wasted journey is a long one.",
  Cumbria:
    "Cumbria's fells and lakes hold a lot of native types and hunting homes. Weather and distance both matter, so the video checklist (walk, trot, canter, load) earns its place.",
  Lancashire:
    "Lancashire buyers search from Lancaster, Preston and the mill towns as well as the rural east of the county. The same rules apply: verified seller, video, and your own vetting.",
  "Tyne and Wear":
    "Tyne and Wear is the urban end of the North East. Many horses are kept just outside Newcastle and Sunderland. Search by outcode if you want to keep the trip short.",
};

export function lookupPlace(input: string): Place | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  const compact = raw.toUpperCase().replace(/\s+/g, "");
  const outcode = compact.match(/^[A-Z]{1,2}\d{1,2}[A-Z]?/);
  if (outcode) {
    const exact = PLACES.find((place) => place.outcode === outcode[0]);
    if (exact) return exact;
    const stem = outcode[0].replace(/[A-Z]$/, "");
    const stemHit = PLACES.find((place) => place.outcode === stem);
    if (stemHit) return stemHit;
  }
  const town = PLACES.find((place) => place.town.toLowerCase() === raw);
  if (town) return town;
  return PLACES.find((place) => place.town.toLowerCase().startsWith(raw)) || null;
}

export function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function countyIntro(county: string): string {
  return (
    COUNTY_COPY[county] ||
    `${county} listings on VerifiedHorses show the town and a distance, not a yard address. Watch the video, check the document dates, and have your own vet out before you agree a sale. The site is a noticeboard: the contract is between you and the seller.`
  );
}

export function counties(): string[] {
  return [...new Set(PLACES.map((place) => place.county))].sort();
}

export function regions(): string[] {
  return [...new Set(PLACES.map((place) => place.region))];
}

export function countiesInRegion(region: string): string[] {
  return [...new Set(PLACES.filter((place) => place.region === region).map((place) => place.county))];
}

export function slugifyCounty(value: string): string {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function countyFromSlug(slug: string): string | null {
  return counties().find((county) => slugifyCounty(county) === slug) || null;
}

export function regionFromSlug(slug: string): string | null {
  return regions().find((region) => slugifyCounty(region) === slug) || null;
}

export const NORTHERN_COUNTIES = [
  "North Yorkshire",
  "West Yorkshire",
  "South Yorkshire",
  "East Riding of Yorkshire",
  "County Durham",
  "Northumberland",
  "Tyne and Wear",
  "Cumbria",
  "Lancashire",
];
