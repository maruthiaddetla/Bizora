/**
 * Generates supabase/migrations/013_india_wide_locations.sql
 * Preserves existing Telangana / Andhra Pradesh IDs from seed.sql.
 * Run: node scripts/generate-india-locations.mjs
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const pad = (n, w = 12) => String(n).padStart(w, "0");
const stateId = (n) => `a1000000-0000-4000-8000-${pad(n)}`;
const districtId = (n) => `b2000000-0000-4000-8000-${pad(n)}`;
const cityId = (n) => `c3000000-0000-4000-8000-${pad(n)}`;

const EXISTING = {
  telangana: stateId(1),
  andhra: stateId(2),
  hyderabadDistrict: districtId(1),
  visakhapatnamDistrict: districtId(3),
  hyderabadCity: cityId(1),
  secunderabadCity: cityId(2),
  visakhapatnamCity: cityId(4),
};

const UT_NAMES = new Set([
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
]);

/**
 * Official 28 States + 8 UTs.
 * Cities: major commercial / population centres (no localities).
 */
const DATA = [
  {
    id: EXISTING.andhra,
    name: "Andhra Pradesh",
    code: "AP",
    cities: [
      {
        name: "Visakhapatnam",
        districtName: "Visakhapatnam",
        districtId: EXISTING.visakhapatnamDistrict,
        cityId: EXISTING.visakhapatnamCity,
      },
      "Vijayawada",
      "Guntur",
      "Nellore",
      "Kurnool",
      "Rajahmundry",
      "Tirupati",
      "Kakinada",
      "Anantapur",
      "Eluru",
    ],
  },
  {
    id: stateId(3),
    name: "Arunachal Pradesh",
    code: "AR",
    cities: ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro"],
  },
  {
    id: stateId(4),
    name: "Assam",
    code: "AS",
    cities: [
      "Guwahati",
      "Silchar",
      "Dibrugarh",
      "Jorhat",
      "Nagaon",
      "Tinsukia",
      "Tezpur",
      "Bongaigaon",
    ],
  },
  {
    id: stateId(5),
    name: "Bihar",
    code: "BR",
    cities: [
      "Patna",
      "Gaya",
      "Bhagalpur",
      "Muzaffarpur",
      "Purnia",
      "Darbhanga",
      "Bihar Sharif",
      "Ara",
      "Begusarai",
    ],
  },
  {
    id: stateId(6),
    name: "Chhattisgarh",
    code: "CG",
    cities: [
      "Raipur",
      "Bhilai",
      "Bilaspur",
      "Korba",
      "Durg",
      "Rajnandgaon",
      "Raigarh",
      "Jagdalpur",
    ],
  },
  {
    id: stateId(7),
    name: "Goa",
    code: "GA",
    cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  },
  {
    id: stateId(8),
    name: "Gujarat",
    code: "GJ",
    cities: [
      "Ahmedabad",
      "Surat",
      "Vadodara",
      "Rajkot",
      "Bhavnagar",
      "Jamnagar",
      "Gandhinagar",
      "Junagadh",
      "Anand",
      "Morbi",
      "Mehsana",
      "Nadiad",
    ],
  },
  {
    id: stateId(9),
    name: "Haryana",
    code: "HR",
    cities: [
      "Gurugram",
      "Faridabad",
      "Panipat",
      "Ambala",
      "Hisar",
      "Karnal",
      "Rohtak",
      "Sonipat",
      "Yamunanagar",
      "Panchkula",
    ],
  },
  {
    id: stateId(10),
    name: "Himachal Pradesh",
    code: "HP",
    cities: ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu", "Hamirpur", "Una"],
  },
  {
    id: stateId(11),
    name: "Jharkhand",
    code: "JH",
    cities: [
      "Ranchi",
      "Jamshedpur",
      "Dhanbad",
      "Bokaro Steel City",
      "Deoghar",
      "Hazaribagh",
      "Giridih",
    ],
  },
  {
    id: stateId(12),
    name: "Karnataka",
    code: "KA",
    cities: [
      "Bengaluru",
      "Mysuru",
      "Mangaluru",
      "Hubballi",
      "Belagavi",
      "Kalaburagi",
      "Davangere",
      "Ballari",
      "Shivamogga",
      "Tumakuru",
      "Udupi",
      "Vijayapura",
    ],
  },
  {
    id: stateId(13),
    name: "Kerala",
    code: "KL",
    cities: [
      "Thiruvananthapuram",
      "Kochi",
      "Kozhikode",
      "Thrissur",
      "Kollam",
      "Kannur",
      "Alappuzha",
      "Palakkad",
      "Kottayam",
      "Malappuram",
    ],
  },
  {
    id: stateId(14),
    name: "Madhya Pradesh",
    code: "MP",
    cities: [
      "Bhopal",
      "Indore",
      "Jabalpur",
      "Gwalior",
      "Ujjain",
      "Sagar",
      "Dewas",
      "Satna",
      "Ratlam",
      "Rewa",
      "Katni",
    ],
  },
  {
    id: stateId(15),
    name: "Maharashtra",
    code: "MH",
    cities: [
      "Mumbai",
      "Pune",
      "Nagpur",
      "Nashik",
      "Thane",
      "Aurangabad",
      "Solapur",
      "Kolhapur",
      "Amravati",
      "Navi Mumbai",
      "Kalyan",
      "Sangli",
      "Jalgaon",
      "Akola",
      "Latur",
    ],
  },
  {
    id: stateId(16),
    name: "Manipur",
    code: "MN",
    cities: ["Imphal", "Thoubal", "Churachandpur", "Bishnupur", "Kakching"],
  },
  {
    id: stateId(17),
    name: "Meghalaya",
    code: "ML",
    cities: ["Shillong", "Tura", "Jowai", "Nongpoh", "Williamnagar"],
  },
  {
    id: stateId(18),
    name: "Mizoram",
    code: "MZ",
    cities: ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib"],
  },
  {
    id: stateId(19),
    name: "Nagaland",
    code: "NL",
    cities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"],
  },
  {
    id: stateId(20),
    name: "Odisha",
    code: "OD",
    cities: [
      "Bhubaneswar",
      "Cuttack",
      "Rourkela",
      "Berhampur",
      "Sambalpur",
      "Puri",
      "Balasore",
      "Bhadrak",
      "Baripada",
    ],
  },
  {
    id: stateId(21),
    name: "Punjab",
    code: "PB",
    cities: [
      "Ludhiana",
      "Amritsar",
      "Jalandhar",
      "Patiala",
      "Bathinda",
      "Mohali",
      "Pathankot",
      "Hoshiarpur",
      "Batala",
    ],
  },
  {
    id: stateId(22),
    name: "Rajasthan",
    code: "RJ",
    cities: [
      "Jaipur",
      "Jodhpur",
      "Udaipur",
      "Kota",
      "Ajmer",
      "Bikaner",
      "Alwar",
      "Bhilwara",
      "Sikar",
      "Bharatpur",
      "Pali",
    ],
  },
  {
    id: stateId(23),
    name: "Sikkim",
    code: "SK",
    cities: ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo"],
  },
  {
    id: stateId(24),
    name: "Tamil Nadu",
    code: "TN",
    cities: [
      "Chennai",
      "Coimbatore",
      "Madurai",
      "Tiruchirappalli",
      "Salem",
      "Tirunelveli",
      "Erode",
      "Vellore",
      "Thoothukudi",
      "Dindigul",
      "Thanjavur",
      "Nagercoil",
      "Hosur",
    ],
  },
  {
    id: EXISTING.telangana,
    name: "Telangana",
    code: "TS",
    cities: [
      {
        name: "Hyderabad",
        districtName: "Hyderabad",
        districtId: EXISTING.hyderabadDistrict,
        cityId: EXISTING.hyderabadCity,
      },
      {
        name: "Secunderabad",
        districtName: "Hyderabad",
        districtId: EXISTING.hyderabadDistrict,
        cityId: EXISTING.secunderabadCity,
      },
      "Warangal",
      "Nizamabad",
      "Karimnagar",
      "Khammam",
      "Ramagundam",
      "Mahbubnagar",
      "Nalgonda",
      "Adilabad",
      "Siddipet",
    ],
  },
  {
    id: stateId(25),
    name: "Tripura",
    code: "TR",
    cities: ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Belonia"],
  },
  {
    id: stateId(26),
    name: "Uttar Pradesh",
    code: "UP",
    cities: [
      "Lucknow",
      "Kanpur",
      "Ghaziabad",
      "Agra",
      "Varanasi",
      "Meerut",
      "Prayagraj",
      "Noida",
      "Bareilly",
      "Aligarh",
      "Moradabad",
      "Saharanpur",
      "Gorakhpur",
      "Jhansi",
      "Mathura",
    ],
  },
  {
    id: stateId(27),
    name: "Uttarakhand",
    code: "UK",
    cities: [
      "Dehradun",
      "Haridwar",
      "Roorkee",
      "Haldwani",
      "Rudrapur",
      "Kashipur",
      "Rishikesh",
    ],
  },
  {
    id: stateId(28),
    name: "West Bengal",
    code: "WB",
    cities: [
      "Kolkata",
      "Howrah",
      "Durgapur",
      "Asansol",
      "Siliguri",
      "Bardhaman",
      "Malda",
      "Kharagpur",
      "Haldia",
      "Krishnanagar",
    ],
  },
  {
    id: stateId(29),
    name: "Andaman and Nicobar Islands",
    code: "AN",
    cities: ["Port Blair", "Diglipur", "Mayabunder", "Car Nicobar", "Havelock Island"],
  },
  {
    id: stateId(30),
    name: "Chandigarh",
    code: "CH",
    cities: ["Chandigarh"],
  },
  {
    id: stateId(31),
    name: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DH",
    cities: ["Silvassa", "Daman", "Diu"],
  },
  {
    id: stateId(32),
    name: "Delhi",
    code: "DL",
    cities: ["New Delhi", "Delhi"],
  },
  {
    id: stateId(33),
    name: "Jammu and Kashmir",
    code: "JK",
    cities: [
      "Srinagar",
      "Jammu",
      "Anantnag",
      "Baramulla",
      "Udhampur",
      "Kathua",
      "Sopore",
    ],
  },
  {
    id: stateId(34),
    name: "Ladakh",
    code: "LA",
    cities: ["Leh", "Kargil"],
  },
  {
    id: stateId(35),
    name: "Lakshadweep",
    code: "LD",
    cities: ["Kavaratti", "Agatti", "Andrott", "Minicoy"],
  },
  {
    id: stateId(36),
    name: "Puducherry",
    code: "PY",
    cities: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  },
];

let nextDistrict = 100;
let nextCity = 100;

const stateRows = [];
const districtByKey = new Map(); // `${stateId}|${districtName}` -> districtId
const districtRows = [];
const cityRows = [];
const cityNamesSeen = new Set();

function esc(s) {
  return s.replace(/'/g, "''");
}

for (const state of DATA) {
  stateRows.push(`  ('${state.id}', '${esc(state.name)}', '${state.code}')`);

  for (const cityEntry of state.cities) {
    const cityName = typeof cityEntry === "string" ? cityEntry : cityEntry.name;
    const districtName =
      typeof cityEntry === "string" ? cityEntry : cityEntry.districtName;

    let dId;
    let cId;

    if (typeof cityEntry === "object") {
      dId = cityEntry.districtId;
      cId = cityEntry.cityId;
    } else {
      dId = districtId(nextDistrict++);
      cId = cityId(nextCity++);
    }

    const dKey = `${state.id}|${districtName}`;
    if (!districtByKey.has(dKey)) {
      districtByKey.set(dKey, dId);
      districtRows.push(`  ('${dId}', '${state.id}', '${esc(districtName)}')`);
    } else {
      dId = districtByKey.get(dKey);
    }

    const cityKey = `${dId}|${cityName}`;
    if (cityNamesSeen.has(cityKey)) {
      throw new Error(`Duplicate city ${cityKey}`);
    }
    cityNamesSeen.add(cityKey);
    cityRows.push(`  ('${cId}', '${dId}', '${esc(cityName)}')`);
  }
}

const header = `-- Bizora: India-wide location expansion
-- Extends states / districts / cities for all 28 States + 8 Union Territories.
-- Preserves existing Telangana / Andhra Pradesh IDs referenced by listings.
-- Public UI remains: India → State/UT → City → Locality (optional).
-- District rows exist only for internal FK integrity (ensureDistrictFromCity).
-- No new localities are seeded here.
-- Idempotent: safe to re-run via on conflict (id).

`;

const sql =
  header +
  `-- ---------------------------------------------------------------------------
-- States & Union Territories (official names)
-- ---------------------------------------------------------------------------
insert into public.states (id, name, code) values
${stateRows.join(",\n")}
on conflict (id) do update set name = excluded.name, code = excluded.code;

-- ---------------------------------------------------------------------------
-- Districts (internal only — not exposed in public selectors)
-- ---------------------------------------------------------------------------
insert into public.districts (id, state_id, name) values
${districtRows.join(",\n")}
on conflict (id) do update set state_id = excluded.state_id, name = excluded.name;

-- ---------------------------------------------------------------------------
-- Cities (major commercial / population centres)
-- ---------------------------------------------------------------------------
insert into public.cities (id, district_id, name) values
${cityRows.join(",\n")}
on conflict (id) do update set district_id = excluded.district_id, name = excluded.name;
`;

const outPath = join(root, "supabase", "migrations", "013_india_wide_locations.sql");
writeFileSync(outPath, sql, "utf8");

const utCount = DATA.filter((s) => UT_NAMES.has(s.name)).length;
console.log(`Wrote ${outPath}`);
console.log(`States: ${DATA.length - utCount}, UTs: ${utCount}, total: ${DATA.length}`);
console.log(`Districts: ${districtRows.length}, Cities: ${cityRows.length}`);

const byName = Object.fromEntries(DATA.map((s) => [s.name, s]));
for (const [state, city] of [
  ["Telangana", "Hyderabad"],
  ["Telangana", "Secunderabad"],
  ["Karnataka", "Bengaluru"],
  ["Maharashtra", "Mumbai"],
  ["Tamil Nadu", "Chennai"],
  ["Delhi", "New Delhi"],
  ["Delhi", "Delhi"],
]) {
  const ok = byName[state]?.cities.some((c) =>
    typeof c === "string" ? c === city : c.name === city,
  );
  console.log(`${state} → ${city}: ${ok ? "OK" : "MISSING"}`);
}

const embed = spawnSync(
  process.execPath,
  [join(root, "scripts", "embed-locations-into-seed.mjs")],
  { stdio: "inherit" },
);
if (embed.status !== 0) process.exit(embed.status ?? 1);
