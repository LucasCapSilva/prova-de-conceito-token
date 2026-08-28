import { PICKUP_POINTS, type PickupPoint } from "../data/pickup";
import { findCep } from "../data/ceps";

export interface PickupSelection {
  point: PickupPoint;
  readyInDays: number;
}

export function pickupForCep(cepRaw: string): PickupSelection | null {
  const digits = cepRaw.replace(/\D/g, "");
  if (digits.length < 8) return null;

  const sum = digits.split("").reduce((acc, c) => acc + Number(c), 0);
  const readyInDays = 1 + (sum % 3);

  const cep = findCep(digits);
  const sameCity = cep
    ? PICKUP_POINTS.filter((p) => p.city === cep.city && p.state === cep.state)
    : [];
  const pool = sameCity.length > 0 ? sameCity : PICKUP_POINTS;
  const point = pool[sum % pool.length];

  return { point, readyInDays };
}
