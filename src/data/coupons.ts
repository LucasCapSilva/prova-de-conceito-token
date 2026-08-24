export type CouponType = "percent" | "fixed" | "freeship";

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minValue: number;
  expiresAt: string;
  sellerId?: string;
}

export const COUPONS: Coupon[] = [
  {
    id: "cpn-bemvindo",
    code: "BEMVINDO10",
    description: "10% off para novos clientes",
    type: "percent",
    value: 10,
    minValue: 100,
    expiresAt: "2026-12-31",
  },
  {
    id: "cpn-eletro",
    code: "ELETRO15",
    description: "15% off em todo o catálogo",
    type: "percent",
    value: 15,
    minValue: 300,
    expiresAt: "2026-11-30",
  },
  {
    id: "cpn-fixo",
    code: "FIXO50",
    description: "R$ 50 off em compras acima de R$ 500",
    type: "fixed",
    value: 50,
    minValue: 500,
    expiresAt: "2026-10-15",
  },
  {
    id: "cpn-frete",
    code: "FRETE0",
    description: "Frete grátis em qualquer pedido",
    type: "freeship",
    value: 100,
    minValue: 0,
    expiresAt: "2026-09-30",
  },
  {
    id: "cpn-verao",
    code: "VERAO20",
    description: "20% off de verão",
    type: "percent",
    value: 20,
    minValue: 250,
    expiresAt: "2026-01-31",
  },
  {
    id: "cpn-tech",
    code: "TECH100",
    description: "R$ 100 off em compras acima de R$ 1.000",
    type: "fixed",
    value: 100,
    minValue: 1000,
    expiresAt: "2026-12-31",
  },
  {
    id: "cpn-volttech",
    code: "VOLT15",
    description: "15% off na VoltTech Oficial",
    type: "percent",
    value: 15,
    minValue: 300,
    expiresAt: "2026-12-31",
    sellerId: "seller-volttech",
  },
  {
    id: "cpn-gamerzone",
    code: "GAMER50",
    description: "R$ 50 off na GamerZone",
    type: "fixed",
    value: 50,
    minValue: 800,
    expiresAt: "2026-12-31",
    sellerId: "seller-gamerzone",
  },
  {
    id: "cpn-audiomax",
    code: "AUDIO10",
    description: "10% off na AudioMax Brasil",
    type: "percent",
    value: 10,
    minValue: 150,
    expiresAt: "2026-12-31",
    sellerId: "seller-audiomax",
  },
  {
    id: "cpn-smarthome",
    code: "SMART30",
    description: "R$ 30 off na SmartHome Center",
    type: "fixed",
    value: 30,
    minValue: 400,
    expiresAt: "2026-12-31",
    sellerId: "seller-smarthome",
  },
];

function matchCoupon(code: string): Coupon | undefined {
  return COUPONS.find(
    (c) => c.code.toLowerCase() === code.trim().toLowerCase()
  );
}

export function getCoupon(code: string): Coupon | undefined {
  const found = matchCoupon(code);
  return found && !found.sellerId ? found : undefined;
}

export function getCouponForSeller(
  code: string,
  sellerId: string
): Coupon | undefined {
  const found = matchCoupon(code);
  return found && found.sellerId === sellerId ? found : undefined;
}
