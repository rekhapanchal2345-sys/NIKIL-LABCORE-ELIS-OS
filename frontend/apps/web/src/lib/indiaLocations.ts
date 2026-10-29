export interface IndiaLocation {
  city: string;
  district: string;
  state: string;
  stateCode: string;
  pincode: string;
}

export const INDIAN_STATES: string[] = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const INDIA_LOCATIONS: IndiaLocation[] = [
  { city: "Mumbai", district: "Mumbai", state: "Maharashtra", stateCode: "MH", pincode: "400001" },
  { city: "Pune", district: "Pune", state: "Maharashtra", stateCode: "MH", pincode: "411001" },
  { city: "Nagpur", district: "Nagpur", state: "Maharashtra", stateCode: "MH", pincode: "440001" },
  { city: "Ahmedabad", district: "Ahmedabad", state: "Gujarat", stateCode: "GJ", pincode: "380001" },
  { city: "Surat", district: "Surat", state: "Gujarat", stateCode: "GJ", pincode: "395003" },
  { city: "Vadodara", district: "Vadodara", state: "Gujarat", stateCode: "GJ", pincode: "390001" },
  { city: "Gandhinagar", district: "Gandhinagar", state: "Gujarat", stateCode: "GJ", pincode: "382010" },
  { city: "Rajkot", district: "Rajkot", state: "Gujarat", stateCode: "GJ", pincode: "360001" },
  { city: "New Delhi", district: "New Delhi", state: "Delhi", stateCode: "DL", pincode: "110001" },
  { city: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", stateCode: "KA", pincode: "560001" },
  { city: "Mysuru", district: "Mysuru", state: "Karnataka", stateCode: "KA", pincode: "570001" },
  { city: "Chennai", district: "Chennai", state: "Tamil Nadu", stateCode: "TN", pincode: "600001" },
  { city: "Coimbatore", district: "Coimbatore", state: "Tamil Nadu", stateCode: "TN", pincode: "641001" },
  { city: "Hyderabad", district: "Hyderabad", state: "Telangana", stateCode: "TS", pincode: "500001" },
  { city: "Kolkata", district: "Kolkata", state: "West Bengal", stateCode: "WB", pincode: "700001" },
  { city: "Jaipur", district: "Jaipur", state: "Rajasthan", stateCode: "RJ", pincode: "302001" },
  { city: "Udaipur", district: "Udaipur", state: "Rajasthan", stateCode: "RJ", pincode: "313001" },
  { city: "Lucknow", district: "Lucknow", state: "Uttar Pradesh", stateCode: "UP", pincode: "226001" },
  { city: "Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", stateCode: "UP", pincode: "201301" },
  { city: "Gurugram", district: "Gurugram", state: "Haryana", stateCode: "HR", pincode: "122001" },
  { city: "Chandigarh", district: "Chandigarh", state: "Punjab", stateCode: "PB", pincode: "160017" },
  { city: "Indore", district: "Indore", state: "Madhya Pradesh", stateCode: "MP", pincode: "452001" },
  { city: "Bhopal", district: "Bhopal", state: "Madhya Pradesh", stateCode: "MP", pincode: "462001" },
  { city: "Kochi", district: "Ernakulam", state: "Kerala", stateCode: "KL", pincode: "682001" },
];

export function findLocationByCity(city?: string, state?: string): IndiaLocation | null {
  if (!city) return null;
  const c = city.trim().toLowerCase();
  return (
    INDIA_LOCATIONS.find(
      (loc) =>
        loc.city.toLowerCase() === c &&
        (!state || loc.state.toLowerCase() === state.trim().toLowerCase())
    ) ||
    INDIA_LOCATIONS.find((loc) => loc.city.toLowerCase().includes(c)) ||
    null
  );
}

export function findLocationByPincode(pincode?: string): IndiaLocation | null {
  if (!pincode) return null;
  const p = pincode.trim();
  return INDIA_LOCATIONS.find((loc) => loc.pincode === p || loc.pincode.startsWith(p.slice(0, 3))) || null;
}

export function searchLocations(query: string, state?: string, limit = 10): IndiaLocation[] {
  const q = (query || "").trim().toLowerCase();
  return INDIA_LOCATIONS.filter((loc) => {
    if (state && loc.state.toLowerCase() !== state.trim().toLowerCase()) return false;
    if (!q) return true;
    return (
      loc.city.toLowerCase().includes(q) ||
      loc.pincode.includes(q) ||
      loc.state.toLowerCase().includes(q)
    );
  }).slice(0, limit);
}

export function getCitiesForState(state?: string): IndiaLocation[] {
  if (!state) return INDIA_LOCATIONS;
  const s = state.trim().toLowerCase();
  return INDIA_LOCATIONS.filter((loc) => loc.state.toLowerCase() === s);
}

export async function fetchOnlineCityByPincode(pincode: string): Promise<IndiaLocation | null> {
  return findLocationByPincode(pincode);
}

export async function fetchOnlinePincodeByCity(city: string): Promise<IndiaLocation | null> {
  return findLocationByCity(city);
}
