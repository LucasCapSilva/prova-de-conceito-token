export interface CepEntry {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const CEPS: CepEntry[] = [
  { cep: "01001-000", street: "Praça da Sé", neighborhood: "Sé", city: "São Paulo", state: "SP" },
  { cep: "01310-100", street: "Avenida Paulista", neighborhood: "Bela Vista", city: "São Paulo", state: "SP" },
  { cep: "02011-010", street: "Rua Voluntários da Pátria", neighborhood: "Tatuapé", city: "São Paulo", state: "SP" },
  { cep: "03103-010", street: "Avenida Cruzeiro do Sul", neighborhood: "Santana", city: "São Paulo", state: "SP" },
  { cep: "04023-060", street: "Avenida Jabaquara", neighborhood: "Santo Amaro", city: "São Paulo", state: "SP" },
  { cep: "05407-002", street: "Rua Clélia", neighborhood: "Liberdade", city: "São Paulo", state: "SP" },
  { cep: "06010-000", street: "Avenida São João", neighborhood: "Centro", city: "Santo André", state: "SP" },
  { cep: "09001-010", street: "Rua Marechal Deodoro", neighborhood: "Centro", city: "Guarulhos", state: "SP" },
  { cep: "20011-010", street: "Praça XV de Novembro", neighborhood: "Centro", city: "Rio de Janeiro", state: "RJ" },
  { cep: "22041-011", street: "Avenida Atlântica", neighborhood: "Copacabana", city: "Rio de Janeiro", state: "RJ" },
  { cep: "22631-003", street: "Avenida das Américas", neighborhood: "Barra da Tijuca", city: "Rio de Janeiro", state: "RJ" },
  { cep: "25050-030", street: "Rua Barão do Flamengo", neighborhood: "Flamengo", city: "Rio de Janeiro", state: "RJ" },
  { cep: "30130-010", street: "Praça Sete de Setembro", neighborhood: "Centro", city: "Belo Horizonte", state: "MG" },
  { cep: "30180-001", street: "Avenida Afonso Pena", neighborhood: "Centro", city: "Belo Horizonte", state: "MG" },
  { cep: "31010-340", street: "Rua Pernambuco", neighborhood: "Savassi", city: "Belo Horizonte", state: "MG" },
  { cep: "90020-002", street: "Rua dos Andradas", neighborhood: "Centro Histórico", city: "Porto Alegre", state: "RS" },
  { cep: "90430-131", street: "Avenida Padre Chagas", neighborhood: "Moinhos de Vento", city: "Porto Alegre", state: "RS" },
  { cep: "80020-000", street: "Rua XV de Novembro", neighborhood: "Centro", city: "Curitiba", state: "PR" },
  { cep: "60055-060", street: "Avenida Beberibe", neighborhood: "Aldeota", city: "Fortaleza", state: "CE" },
  { cep: "70040-010", street: "Eixo Monumental", neighborhood: "Asa Sul", city: "Brasília", state: "DF" },
];

export function findCep(cepRaw: string): CepEntry | null {
  const digits = cepRaw.replace(/\D/g, "");
  return CEPS.find((e) => e.cep.replace(/\D/g, "") === digits) ?? null;
}
