export interface Seller {
  id: string;
  name: string;
  logo: string;
  rating: number;
  sales: number;
  since: number;
  location: string;
  isOfficial: boolean;
}

const lf = (kw: string) => `https://loremflickr.com/200/200/${kw}`;

export const SELLERS: Seller[] = [
  {
    id: "seller-volttech",
    name: "VoltTech Oficial",
    logo: lf("electronics-brand"),
    rating: 4.9,
    sales: 128400,
    since: 2018,
    location: "São Paulo, SP",
    isOfficial: true,
  },
  {
    id: "seller-techstore",
    name: "TechStore Brasil",
    logo: lf("computer-store"),
    rating: 4.7,
    sales: 54210,
    since: 2019,
    location: "Barueri, SP",
    isOfficial: false,
  },
  {
    id: "seller-audiomax",
    name: "AudioMax Brasil",
    logo: lf("headphones-brand"),
    rating: 4.8,
    sales: 41870,
    since: 2020,
    location: "Curitiba, PR",
    isOfficial: false,
  },
  {
    id: "seller-gamerzone",
    name: "GamerZone",
    logo: lf("gaming-setup"),
    rating: 4.6,
    sales: 63120,
    since: 2019,
    location: "Belo Horizonte, MG",
    isOfficial: false,
  },
  {
    id: "seller-smarthome",
    name: "SmartHome Center",
    logo: lf("smart-home"),
    rating: 4.5,
    sales: 28740,
    since: 2021,
    location: "Porto Alegre, RS",
    isOfficial: false,
  },
  {
    id: "seller-mobileprime",
    name: "Mobile Prime",
    logo: lf("mobile-phone"),
    rating: 4.7,
    sales: 71330,
    since: 2018,
    location: "Campinas, SP",
    isOfficial: false,
  },
  {
    id: "seller-electroshop",
    name: "ElectroShop",
    logo: lf("electronics-shop"),
    rating: 4.4,
    sales: 19850,
    since: 2022,
    location: "Brasília, DF",
    isOfficial: false,
  },
  {
    id: "seller-casaconecta",
    name: "Casa Conecta",
    logo: lf("home-devices"),
    rating: 4.6,
    sales: 33420,
    since: 2020,
    location: "Recife, PE",
    isOfficial: false,
  },
];

const MAP = new Map(SELLERS.map((s) => [s.id, s]));

export function getSeller(id: string): Seller | undefined {
  return MAP.get(id);
}
