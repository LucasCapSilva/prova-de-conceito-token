export interface PickupPoint {
  id: string;
  name: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  hours: string;
}

export const PICKUP_POINTS: PickupPoint[] = [
  {
    id: "pickup-se",
    name: "Ponto de Coleta Sé",
    street: "Rua da Consolação",
    number: "520",
    neighborhood: "Sé",
    city: "São Paulo",
    state: "SP",
    cep: "01001-000",
    hours: "Seg. a sáb., 9h às 20h",
  },
  {
    id: "pickup-paulista",
    name: "Ponto de Coleta Paulista",
    street: "Avenida Paulista",
    number: "1436",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    cep: "01310-100",
    hours: "Seg. a dom., 10h às 22h",
  },
  {
    id: "pickup-liberdade",
    name: "Ponto de Coleta Liberdade",
    street: "Rua da Glória",
    number: "88",
    neighborhood: "Liberdade",
    city: "São Paulo",
    state: "SP",
    cep: "05407-002",
    hours: "Seg. a sáb., 9h30 às 21h",
  },
  {
    id: "pickup-santo-amaro",
    name: "Ponto de Coleta Santo Amaro",
    street: "Avenida Jabaquara",
    number: "1201",
    neighborhood: "Santo Amaro",
    city: "São Paulo",
    state: "SP",
    cep: "04023-060",
    hours: "Seg. a sáb., 9h às 19h",
  },
  {
    id: "pickup-centro-rio",
    name: "Ponto de Coleta Centro Rio",
    street: "Rua da Assembleia",
    number: "9",
    neighborhood: "Centro",
    city: "Rio de Janeiro",
    state: "RJ",
    cep: "20011-010",
    hours: "Seg. a sáb., 10h às 20h",
  },
  {
    id: "pickup-copacabana",
    name: "Ponto de Coleta Copacabana",
    street: "Avenida Atlântica",
    number: "2100",
    neighborhood: "Copacabana",
    city: "Rio de Janeiro",
    state: "RJ",
    cep: "22041-011",
    hours: "Seg. a dom., 9h às 21h",
  },
  {
    id: "pickup-bh-centro",
    name: "Ponto de Coleta Centro BH",
    street: "Avenida dos Tamoios",
    number: "421",
    neighborhood: "Centro",
    city: "Belo Horizonte",
    state: "MG",
    cep: "30130-010",
    hours: "Seg. a sáb., 9h às 18h",
  },
  {
    id: "pickup-savassi",
    name: "Ponto de Coleta Savassi",
    street: "Rua Pernambuco",
    number: "1045",
    neighborhood: "Savassi",
    city: "Belo Horizonte",
    state: "MG",
    cep: "31010-340",
    hours: "Seg. a dom., 10h às 21h",
  },
  {
    id: "pickup-po-centro",
    name: "Ponto de Coleta Porto Alegre",
    street: "Rua dos Andradas",
    number: "890",
    neighborhood: "Centro Histórico",
    city: "Porto Alegre",
    state: "RS",
    cep: "90020-002",
    hours: "Seg. a sáb., 9h às 18h30",
  },
  {
    id: "pickup-curitiba",
    name: "Ponto de Coleta Curitiba",
    street: "Rua XV de Novembro",
    number: "310",
    neighborhood: "Centro",
    city: "Curitiba",
    state: "PR",
    cep: "80020-000",
    hours: "Seg. a sáb., 9h às 19h",
  },
  {
    id: "pickup-aldeota",
    name: "Ponto de Coleta Aldeota",
    street: "Avenida Beberibe",
    number: "1870",
    neighborhood: "Aldeota",
    city: "Fortaleza",
    state: "CE",
    cep: "60055-060",
    hours: "Seg. a sáb., 9h às 20h",
  },
  {
    id: "pickup-asasul",
    name: "Ponto de Coleta Asa Sul",
    street: "CLS 307",
    number: "Bloco A, 100",
    neighborhood: "Asa Sul",
    city: "Brasília",
    state: "DF",
    cep: "70040-010",
    hours: "Seg. a sáb., 9h às 21h",
  },
];

export function getPickupPoint(id: string): PickupPoint | undefined {
  return PICKUP_POINTS.find((p) => p.id === id);
}
