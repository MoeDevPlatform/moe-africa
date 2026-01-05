export interface Country {
  code: string;
  name: string;
  states: string[];
}

export const countries: Country[] = [
  {
    code: "NG",
    name: "Nigeria",
    states: [
      "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
      "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe",
      "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
      "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
      "Taraba", "Yobe", "Zamfara"
    ],
  },
  {
    code: "GH",
    name: "Ghana",
    states: [
      "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra",
      "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta",
      "Western", "Western North"
    ],
  },
  {
    code: "KE",
    name: "Kenya",
    states: [
      "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
      "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
      "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos",
      "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
      "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya",
      "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans-Nzoia", "Turkana", "Uasin Gishu",
      "Vihiga", "Wajir", "West Pokot"
    ],
  },
  {
    code: "ZA",
    name: "South Africa",
    states: [
      "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga",
      "North West", "Northern Cape", "Western Cape"
    ],
  },
  {
    code: "EG",
    name: "Egypt",
    states: [
      "Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Cairo", "Dakahlia",
      "Damietta", "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr El Sheikh", "Luxor",
      "Matruh", "Minya", "Monufia", "New Valley", "North Sinai", "Port Said", "Qalyubia",
      "Qena", "Red Sea", "Sharqia", "Sohag", "South Sinai", "Suez"
    ],
  },
  {
    code: "US",
    name: "United States",
    states: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
      "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
      "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
      "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
      "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
      "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
      "Wisconsin", "Wyoming"
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    states: [
      "England", "Northern Ireland", "Scotland", "Wales"
    ],
  },
  {
    code: "CA",
    name: "Canada",
    states: [
      "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
      "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
      "Quebec", "Saskatchewan", "Yukon"
    ],
  },
  {
    code: "AU",
    name: "Australia",
    states: [
      "Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland",
      "South Australia", "Tasmania", "Victoria", "Western Australia"
    ],
  },
  {
    code: "DE",
    name: "Germany",
    states: [
      "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg",
      "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia",
      "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein",
      "Thuringia"
    ],
  },
  {
    code: "FR",
    name: "France",
    states: [
      "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire",
      "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy",
      "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur"
    ],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    states: [
      "Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"
    ],
  },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

export const getStatesByCountry = (countryCode: string): string[] => {
  const country = getCountryByCode(countryCode);
  return country?.states || [];
};
