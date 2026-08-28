export type Category =
  | "audio"
  | "mobile"
  | "computadores"
  | "wearables"
  | "gamer"
  | "casa";

export type Condition = "novo" | "usado";

export interface Installment {
  count: number;
  value: number;
}

export interface VariantOption {
  id: string;
  name: string;
  hex?: string;
  priceDelta?: number;
  stock: number;
}

export interface VariantGroup {
  id: string;
  label: string;
  options: VariantOption[];
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  sold: number;
  image: string;
  gallery: string[];
  description: string;
  highlights: string[];
  badge?: string;
  brand: string;
  sellerId: string;
  stock: number;
  freeShipping: boolean;
  condition: Condition;
  warrantyMonths: number;
  freeReturn: boolean;
  exchangeDays: number;
  installments: Installment;
  variants?: VariantGroup[];
  featured?: boolean;
  ean?: string;
}

import { SELLERS } from "./sellers.ts";

const lf = (kw: string) => `https://loremflickr.com/900/900/${kw}`;

export const FALLBACK_IMAGE = lf("electronics");

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function eanFor(id: string): string {
  let x = hashId(id) || 1;
  let s = "7891";
  while (s.length < 12) {
    x = Math.imul(x, 48271) % 2147483647;
    s += String(x % 10);
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return s + String((10 - (sum % 10)) % 10);
}

export const CATEGORIES: { key: Category | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "audio", label: "Áudio" },
  { key: "mobile", label: "Mobile" },
  { key: "computadores", label: "Computadores" },
  { key: "wearables", label: "Wearables" },
  { key: "gamer", label: "Gamer" },
  { key: "casa", label: "Casa Smart" },
];

type Seed = [
  id: string,
  name: string,
  price: number,
  oldPrice?: number,
  rating?: number,
  reviews?: number,
  badge?: string,
  description?: string,
  highlights?: string[],
];

const g = (a: string, b: string, c: string) => [lf(a), lf(b), lf(c)];

const AUDIO_SEEDS: Seed[] = [
  ["headphone-pro-max", "VoltTech Pro Max Headphones", 899.9, 1199.9, 4.9, 1284, "MAIS VENDIDO",
    "Cancelamento de ruído adaptativo, 40h de bateria e drivers de 42mm com som espacial imersivo. O flagship de áudio da VOLTTECH.",
    ["ANC híbrido adaptativo", "Bateria de 40 horas", "Bluetooth 5.4 multiponto", "Driver de 42mm Hi-Res"]],
  ["headphone-studio-wireless", "Studio Wireless S2", 449.9, 599.9, 4.7, 862, undefined,
    "Som assinado por estúdios, conforto premium e estúdio de gravação com 8 mics. Perfeito para quem produz música.",
    ["Driver de 40mm", "Modo monitor para gravação", "35h de bateria", "Dobrável, 240g"]],
  ["earbuds-air-pulse", "Air Pulse Earbuds", 329.9, 449.9, 4.8, 2031, "NOVO",
    "Fones true wireless com ANC, carga rápida de 10min = 5h e certificação IPX5. Levantou o som da sua playlist.",
    ["ANC + modo transparência", "Carga rápida 10min", "IPX5 à prova d'água", "Latência gamer 45ms"]],
  ["earbuds-bass-bolt", "Bass Bolt Earbuds", 199.9, 279.9, 4.3, 1456, undefined,
    "Bass encorpado com driver de 13mm, 30h de bateria total e resistência a suor. O custo-benefício que faltava no seu estojo.",
    ["Driver de 13mm", "30h de bateria total", "IPX4 à prova de suor", "Toque para controlar"]],
  ["headphone-open-air", "Open Air On-Ear", 279.9, 349.9, 4.4, 634, undefined,
    "Design on-ear leve com 28h de bateria e som aberto para o dia a dia. Conforto de fone de avião.",
    ["28h de bateria", "Dobrável, 180g", "USB-C + 3,5mm", "Microfone com redução de ruído"]],
  ["speaker-boom-pod", "Boom Pod Speaker", 349.9, 429.9, 4.5, 987, undefined,
    "Caixa bluetooth 20W com TWS para parear duas unidades em estéreo, IPX7 e 18h de festa. Leve a trilha pra onde quiser.",
    ["20W de potência", "TWS estéreo", "IPX7 submersível", "18h de bateria"]],
  ["speaker-cube-mini", "Cube Mini Speaker", 149.9, 199.9, 4.2, 2310, "TOP 100",
    "O cubo que cabe em qualquer mochila: 12W, 15h de bateria e som 360°. O par perfeito pra sua mesa ou sua praiа.",
    ["12W 360°", "15h de bateria", "USB-C", "Magnetismo para fixar"]],
  ["turntable-vinyl-go", "Vinyl Go Turntable", 1299.9, 1599.9, 4.6, 287, undefined,
    "Toca-discos bluetooth com pré-amplificador embutido, saída P2 e modo estéreo. O analógico que cabe no seu setup.",
    ["Pré-amp embutido", "Saída P2 + bluetooth", "Velocidades 33/45 RPM", "Design compacto"]],
  ["mic-podcast-pro", "Podcast Pro Microphone", 429.9, 549.9, 4.7, 512, undefined,
    "Microfone USB-C com filtro AI de ruído, monitoramento em tempo real e ganho automático. Sua voz, sem ruído.",
    ["Filtro AI de ruído", "Monitoramento real", "Ganho automático", "USB-C plug and play"]],
  ["dock-charge-sound", "Charge Sound Dock", 189.9, 249.9, 4.1, 1876, undefined,
    "Dock de carga com som embutido: 10W, 20h de bateria e som ambiente. Seu celular carregando e tocando ao mesmo tempo.",
    ["10W + 20h", "Som ambiente 360°", "Carga rápida 15W", "Modo alarme"]],
];

const MOBILE_SEEDS: Seed[] = [
  ["smartphone-nova-x", "Nova X5 Smartphone", 3299.9, 3799.9, 4.9, 1547, "TOP 100",
    'Tela AMOLED 120Hz de 6.7", câmera tripla de 108MP com IA, carga turbo de 120W e 5G. O smartphone que redefine o topo.',
    ['AMOLED 120Hz 6.7"', "Câmera tripla 108MP + IA", "Carga turbo 120W", "5G + 1TB"]],
  ["smartphone-crimson", "Crimson Phone R", 2799.9, 3299.9, 4.6, 978, undefined,
    "Design ousado em vermelho profundo, bateria de 5500mAh e chipset de ponta. Potência pra quem não passa despercebido.",
    ["Bateria 5500mAh", "Chipset octa-core 3.4GHz", "Câmera noturna 50MP", "NFC + leitor de íris"]],
  ["smartphone-slim-5g", "Slim 5G Phone", 1899.9, 2299.9, 4.5, 1123, undefined,
    "O 5G que cabe no bolso: 190g, tela de 6.4 polegadas e 48h de autonomia. Essencial sem abrir mão do essencial.",
    ["190g ultraleve", "Tela 6.4 polegadas 90Hz", "Bateria 48h", "5G + Wi-Fi 6"]],
  ["smartphone-compact-s", "Compact S Phone", 1499.9, 1799.9, 4.4, 856, undefined,
    "O compacto que não abre mão: tela de 5.9 polegadas, 4500mAh e câmera de 64MP. Potência no tamanho certo.",
    ["Tela 5.9 polegadas compacta", "Bateria 4500mAh", "Câmera 64MP", "NFC + 2 SIM"]],
  ["smartphone-ultra-z", "Ultra Z Phone", 4499.9, 4999.9, 4.8, 432, "PRO",
    "O topo absoluto: tela LTPO 120Hz de 6.8 polegadas, câmera periscópica de 200MP e 1TB. Para quem não aceita menos.",
    ['Tela LTPO 6.8" 120Hz', "Câmera periscópica 200MP", "1TB + 16GB RAM", "Carga 150W"]],
  ["tablet-pro-11", "Pro 11 Tablet", 2899.9, 3499.9, 4.7, 654, undefined,
    "Tela de 11 polegadas 120Hz, caneta inclusa e 10h de bateria. O tablet que substitui o notebook no dia a dia.",
    ['Tela 11" 120Hz', "Caneta inclusa", "10h de bateria", "Wi-Fi 6E + 5G"]],
  ["tablet-air-10", "Air 10 Tablet", 1699.9, 1999.9, 4.3, 921, undefined,
    "Leve, fino e com 9h de bateria: o tablet certo pra estudar, ler e maratonar. Compatível com teclado magnético.",
    ['Tela 10.4" 90Hz', "9h de bateria", "390g", "Teclado magnético opcional"]],
  ["powerbank-20k", "Power Bank 20K", 129.9, 179.9, 4.6, 3210, undefined,
    "20.000mAh com carga rápida de 30W e display digital. Carrega o celular 4x e ainda sobra. O fim da ansiedade de bateria.",
    ["20.000mAh", "Carga rápida 30W", "Display digital", "2 USB + USB-C"]],
  ["charger-turbo-120", "Turbo 120W Charger", 189.9, 249.9, 4.5, 1543, undefined,
    "Carregador GaN de 120W com 3 portas: 2 USB-C e 1 USB-A. Carrega notebook, celular e fone ao mesmo tempo.",
    ["120W GaN", "2 USB-C + 1 USB-A", "Proteção térmica", "Compacto 60g"]],
  ["smartwatch-band-2", "Band 2 Smartwatch", 249.9, 329.9, 4.2, 1765, undefined,
    "Pulseira inteligente com 10 dias de bateria, notificações e rastreamento de sono. O essencial no pulso.",
    ["10 dias de bateria", "Notificações", "Rastreamento de sono", "IP67"]],
];

const COMPUTERS_SEEDS: Seed[] = [
  ["ultrabook-air-14", "Ultrabook Air 14", 5499.9, 6499.9, 4.8, 654, undefined,
    'Apenas 990g, 18h de autonomia e tela 2.8K de 14". Produtividade pura onde você estiver.',
    ["990g ultraleve", "18h de bateria real", 'Tela 14" 2.8K 90Hz', "RAM 32GB LPDDR5"]],
  ["laptop-creator-16", "Creator Laptop 16", 8999.9, 10499.9, 4.9, 312, "PRO",
    "Máquina de render com GPU dedicada de 16GB, tela 4K calibrada em fábrica e 64GB de RAM. Feita para criadores.",
    ["GPU dedicada 16GB", "Tela 4K 100% DCI-P3", "64GB RAM", "SSD 2TB PCIe 4.0"]],
  ["gaming-rig-vortex", "Vortex Gaming Rig", 12999.9, 14999.9, 4.9, 198, undefined,
    "Desktop gamer com GPU de 24GB, 32GB de RAM e arrefecimento líquido. 144fps em tudo, sem suar.",
    ["GPU 24GB", "32GB RAM DDR5", "Arrefecimento líquido", "SSD 2TB Gen4"]],
  ["desktop-mini-pc", "Mini PC Ultra", 2499.9, 2999.9, 4.4, 743, undefined,
    "O desktop que cabe na palma da mão: 16GB de RAM, 512GB SSD e Wi-Fi 6E. Potência sem ocupar espaço.",
    ["16GB RAM", "512GB SSD", "Wi-Fi 6E", "Apenas 0.5L"]],
   ["monitor-27-4k", "27 polegadas 4K Monitor Pro", 2199.9, 2699.9, 4.7, 456, undefined,
    'Tela 27" 4K de 144Hz com USB-C 90W, calibração de fábrica e 99% sRGB. O monitor que faz jus ao seu setup.',
    ['27" 4K 144Hz', "USB-C 90W", "99% sRGB", "Altura ajustável"]],
   ["monitor-34-ultrawide", "34 polegadas Ultrawide QHD", 2899.9, 3499.9, 4.6, 287, undefined,
    'Ultrawide de 34" QHD com 120Hz, 144Hz em modo gamer e hub USB. Imersão total sem abrir mão da produtividade.',
    ['34" QHD 120Hz', "144Hz modo gamer", "Hub USB 3.0", "Curvatura 1500R"]],
  ["ssd-2tb-gen4", "SSD 2TB Gen4", 549.9, 699.9, 4.8, 1123, undefined,
    "SSD NVMe de 2TB com 7.4GB/s de leitura. A velocidade que seu PC merece, sem abrir o gabinete.",
    ["2TB NVMe", "7.4GB/s leitura", "Garantia 5 anos", "Dissipador incluso"]],
  ["ram-32gb-ddr5", "RAM 32GB DDR5 Kit", 429.9, 549.9, 4.7, 876, undefined,
    "Kit de 32GB DDR5 a 6000MHz com dissipador e perfil EXPO. A memória que faz jus à sua placa.",
    ["32GB DDR5", "6000MHz", "Perfil EXPO", "Dissipador incluso"]],
  ["webcam-4k-pro", "4K Pro Webcam", 399.9, 499.9, 4.5, 534, undefined,
    "Webcam 4K com sensor Sony, enquadramento por IA e microfone com filtro de ruído. Sua imagem, impecável.",
    ["Sensor Sony 4K", "Enquadramento por IA", "Mic com filtro de ruído", "Privacidade com tampa"]],
  ["dock-usbc-8in1", "8-in-1 USB-C Dock", 299.9, 379.9, 4.4, 654, undefined,
    "Hub USB-C com 8 portas: 3 HDMI, 2 USB-A, 1 GbE, SD e carga de 100W. O fim da bagunça de cabos.",
    ["3 HDMI 4K", "Carga 100W", "GbE + SD", "Alumínio anodizado"]],
];

const WEARABLES_SEEDS: Seed[] = [
  ["watch-pulse-2", "Pulse Watch 2", 1899.9, 2299.9, 4.7, 1103, undefined,
    "Monitoramento de saúde completo: ECG, SpO2, sono e treino. Tela sempre ativa e 10 dias de bateria.",
    ["ECG + SpO2 + sono", "Tela LTPO Always-On", "10 dias de bateria", "5ATM à prova d'água"]],
  ["watch-active-fit", "Active Fit Watch", 999.9, 1399.9, 4.5, 745, undefined,
    "150+ modos esportivos, GPS duplo e resistência a impacto. O companheiro ideal pro seu treino.",
    ["150+ modos esportivos", "GPS + GLONASS", "7 dias de bateria", 'Tela AMOLED 1.5"']],
  ["ring-health-2", "Health Ring 2", 1499.9, 1899.9, 4.6, 321, undefined,
    "Anel inteligente com 7 dias de bateria, ECG e rastreamento de sono. Saúde no dedo, sem peso.",
    ["7 dias de bateria", "ECG + SpO2", "Rastreamento de sono", "À prova d'água"]],
  ["band-slim-sport", "Slim Sport Band", 299.9, 399.9, 4.3, 1543, undefined,
    "Pulseira esportiva com 14 dias de bateria, GPS e 50+ modos de treino. Leve, discreta e pronta pro treino.",
    ["14 dias de bateria", "GPS integrado", "50+ modos de treino", "IP68"]],
  ["earbuds-sport-2", "Sport 2 Earbuds", 249.9, 329.9, 4.4, 876, undefined,
    "Fones esportivos com gancho de orelha, IPX7 e 24h de bateria. O som que não sai do lugar no treino.",
    ["Gancho de orelha", "IPX7", "24h de bateria", "Carga rápida 10min"]],
  ["watch-kids-go", "Kids Go Watch", 399.9, 499.9, 4.2, 432, undefined,
    "Smartwatch infantil com GPS, chamadas e geofence. A localização em tempo real que você precisa.",
    ["GPS + chamadas", "Geofence de segurança", "7 dias de bateria", "Resistente a água"]],
  ["band-sleep-pro", "Sleep Pro Band", 449.9, 549.9, 4.5, 654, undefined,
    "Pulseira de sono com rastreamento de fases, respiração e SpO2. Entenda seu descanso em profundidade.",
    ["Fases do sono", "Respiração + SpO2", "14 dias de bateria", "Alertas de ronco"]],
  ["watch-classic-e", "Classic E Watch", 799.9, 999.9, 4.4, 287, undefined,
    "Design clássico com tela de 1.4 polegadas, 7 dias de bateria e chamadas Bluetooth. Elegância com função.",
    ['Tela 1.4" AMOLED', "7 dias de bateria", "Chamadas Bluetooth", "Pulseira de couro"]],
  ["ring-slim-1", "Slim Ring 1", 899.9, 1099.9, 4.3, 198, undefined,
    "Anel minimalista com 5 dias de bateria e rastreamento de atividade. O essencial no dedo.",
    ["5 dias de bateria", "Rastreamento de passos", "À prova d'água", "Carga sem fio"]],
  ["watch-outdoor-x", "Outdoor X Watch", 1299.9, 1599.9, 4.6, 345, undefined,
    "Smartwatch outdoor com GPS de 5 frequências, 14 dias de bateria e mapas offline. Prontinho pra trilha.",
    ["GPS 5 frequências", "14 dias de bateria", "Mapas offline", "10ATM"]],
];

const GAMER_SEEDS: Seed[] = [
  ["headset-gamer-viper", "Viper Headset Gamer", 649.9, 799.9, 4.8, 1876, "GAMER",
    "Som surround 7.1, microfone com filtro AI e espuma memory foam. Vantagem competitiva com conforto de maratona.",
    ["Surround 7.1 virtual", "Mic com filtro AI", "30h de bateria", "Memory foam premium"]],
  ["keyboard-mech-k87", "K87 Teclado Mecânico RGB", 489.9, 649.9, 4.6, 923, undefined,
    "Switch hot-swap, RGB por tecla e estrutura de alumínio. Tactilidade e iluminação para dominar o game.",
    ["Switch hot-swap", "RGB por tecla (16.8M)", "Alumínio aeronáutico", "Keycaps PBT"]],
  ["mouse-gamer-x7", "X7 Gamer Mouse", 249.9, 329.9, 4.7, 2109, undefined,
    "Sensor de 26.000 DPI, 59g e 1000Hz de polling. O mouse que responde na velocidade do seu reflexo.",
    ["Sensor 26.000 DPI", "59g ultraleve", "1000Hz polling", "Switch óptico"]],
  ["mousepad-xl-900", "XL 900 Mousepad", 129.9, 169.9, 4.5, 1432, undefined,
    "Mousepad XL de 900x400mm com superfície de tecido e borda costurada. Espaço pra jogar sem limites.",
    ["900x400mm", "Tecido de precisão", "Borda costurada", "Antideslizante"]],
  ["controller-pro-2", "Pro 2 Controller", 399.9, 499.9, 4.6, 765, undefined,
    "Controle sem fio com gatilos ajustáveis, 40h de bateria e 3 modos de conexão. O controle que acompanha seu jogo.",
    ["Gatilos ajustáveis", "40h de bateria", "3 modos de conexão", "Vibração háptica"]],
  ["stream-cam-4k", "4K Stream Cam", 549.9, 699.9, 4.7, 321, undefined,
    "Câmera 4K com sensor Sony, enquadramento por IA e streaming em 60fps. Sua imagem, pronta pra stream.",
    ["Sensor Sony 4K", "Enquadramento por IA", "60fps streaming", "Mic com filtro de ruído"]],
  ["gaming-chair-elite", "Elite Gaming Chair", 1899.9, 2399.9, 4.4, 198, undefined,
    "Cadeira gamer com espuma de alta densidade, reclinação de 180° e apoio de braço 4D. Conforto de maratona.",
    ["Espuma alta densidade", "Reclinação 180°", "Apoio 4D", "Pistão classe 4"]],
  ["rgb-strip-60cm", "60cm RGB Strip", 79.9, 99.9, 4.3, 2341, undefined,
    "Fitinha RGB de 60cm com 16.8M de cores, controle por app e adesivo 3M. O setup que brilha na sua cara.",
    ["16.8M de cores", "Controle por app", "Adesivo 3M", "Corte em qualquer ponto"]],
  ["gamer-desk-mat", "Desk Mat XL", 149.9, 189.9, 4.5, 876, undefined,
    "Desk mat XL de 800x300mm com superfície de couro sintético e base antideslizante. O toque final no setup.",
    ["800x300mm", "Couro sintético", "Base antideslizante", "Fácil de limpar"]],
  ["gamer-cooler-pad", "Cooler Pad 200W", 199.9, 259.9, 4.4, 543, undefined,
    "Cooler pad de 200W com ventilação silenciosa e controle por app. Seu notebook, sempre na temperatura certa.",
    ["200W de potência", "Ventilação silenciosa", "Controle por app", "USB 3.0"]],
];

const CASA_SEEDS: Seed[] = [
  ["smart-speaker-orbit", "Órbita Smart Speaker", 549.9, 699.9, 4.4, 534, undefined,
    "Assistente de voz, som 360° de 30W e hub de casa inteligente. A central da sua rotina conectada.",
    ["Som 360° 30W", "Assistente de voz", "Hub Matter/Thread", "Multiroom wireless"]],
  ["smart-bulb-kit-4", "Smart Bulb Kit 4x", 199.9, 259.9, 4.5, 1234, undefined,
    "Kit com 4 lâmpadas inteligentes de 16.8M de cores, controle por app e rotinas. A luz que se adapta ao seu dia.",
    ["16.8M de cores", "Controle por app", "Rotinas + agenda", "Compatível com assistentes"]],
  ["smart-plug-2x", "Smart Plug 2x", 99.9, 139.9, 4.3, 1876, undefined,
    "Kit com 2 tomadas inteligentes com controle por app, rotinas e medição de consumo. O básico da casa conectada.",
    ["Controle por app", "Rotinas + agenda", "Medição de consumo", "Compatível com assistentes"]],
  ["smart-lock-pro", "Pro Smart Lock", 899.9, 1099.9, 4.6, 234, undefined,
    "Fechadura digital com digital, senha e chave física. Acesso sem chave, com trilha de auditoria.",
    ["Digital + senha + chave", "Trilha de auditoria", "Bateria 12 meses", "Instalação simples"]],
  ["smart-cam-360", "360 Smart Cam", 349.9, 449.9, 4.5, 654, undefined,
    "Câmera 360° com visão noturna, detecção de movimento e armazenamento local. Sua casa, monitorada 24/7.",
    ["Visão noturna", "Detecção de movimento", "Armazenamento local", "Áudio bidirecional"]],
  ["air-purifier-2", "Air Purifier 2", 1299.9, 1599.9, 4.4, 321, undefined,
    "Purificador de ar com filtro HEPA H13, display de qualidade e modo automático. O ar da sua casa, sempre limpo.",
    ["Filtro HEPA H13", "Display de qualidade", "Modo automático", "Silencioso 32dB"]],
  ["robot-vacuum-s2", "S2 Robot Vacuum", 1999.9, 2499.9, 4.5, 432, undefined,
    "Robô aspirador com mapeamento a laser, 2200Pa e base de recarga automática. O chão limpo, sem você.",
    ["Mapeamento a laser", "2200Pa de sucção", "Base de recarga", "App com zonas"]],
  ["smart-dimmer-3x", "Smart Dimmer 3x", 149.9, 189.9, 4.2, 345, undefined,
    "Kit com 3 dimmers inteligentes com controle por app, rotinas e compatibilidade com assistentes. A luz na intensidade certa.",
    ["Controle por app", "Rotinas + agenda", "Compatível com assistentes", "Instalação simples"]],
  ["smart-thermostat-e", "E Smart Thermostat", 699.9, 899.9, 4.3, 198, undefined,
    "Termostato inteligente com controle por app, rotinas e compatibilidade com assistentes. O clima da sua casa, no piloto automático.",
    ["Controle por app", "Rotinas + agenda", "Compatível com assistentes", "Display touch"]],
  ["smart-garage-kit", "Garage Kit", 449.9, 549.9, 4.4, 123, undefined,
    "Kit de abertura de garagem com controle por app, geofence e trilha de acessos. A garagem que abre na sua chegada.",
    ["Controle por app", "Geofence", "Trilha de acessos", "Bateria 1 ano"]],
];

const ALL_SEEDS: [Category, Seed[]][] = [
  ["audio", AUDIO_SEEDS],
  ["mobile", MOBILE_SEEDS],
  ["computadores", COMPUTERS_SEEDS],
  ["wearables", WEARABLES_SEEDS],
  ["gamer", GAMER_SEEDS],
  ["casa", CASA_SEEDS],
];

const KEYWORDS: Record<Category, string[]> = {
  audio: ["headphones", "bluetooth", "wireless-earbuds", "earbuds", "bluetooth-speaker", "smart-speaker", "turntable", "microphone", "dock", "soundbar"],
  mobile: ["iphone", "smartphone", "tablet", "power-bank", "charger", "smartwatch", "mobile-phone", "phone-case", "mobile-accessory", "phone"],
  computadores: ["laptop", "macbook", "desktop", "monitor", "ssd", "ram", "webcam", "usb-dock", "gaming-pc", "computer"],
  wearables: ["smartwatch", "watch", "fitness-band", "health-ring", "earbuds", "kids-watch", "sleep-band", "classic-watch", "outdoor-watch", "wearable"],
  gamer: ["headset", "gaming-headset", "mechanical-keyboard", "keyboard", "gaming-mouse", "mousepad", "game-controller", "streaming-camera", "gaming-chair", "rgb-lighting"],
  casa: ["bluetooth-speaker", "smart-speaker", "smart-bulb", "smart-plug", "smart-lock", "security-camera", "air-purifier", "robot-vacuum", "smart-dimmer", "smart-thermostat"],
};

function soldFor(id: string, reviews: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return reviews * 3 + (h % 900) + 150;
}

export function installmentsFor(price: number): Installment {
  const count = price >= 5000 ? 12 : price >= 1000 ? 10 : 6;
  const value = Math.round((price / count) * 100) / 100;
  return { count, value };
}

const VARIANTS: Record<string, VariantGroup[]> = {
  "headphone-pro-max": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 42 },
        { id: "prata", name: "Prata", hex: "#C9C9CE", stock: 26 },
        { id: "azul", name: "Azul Meia-noite", hex: "#1E2A4A", stock: 18 },
      ],
    },
  ],
  "headphone-studio-wireless": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 30 },
        { id: "vermelho", name: "Vermelho", hex: "#D73211", stock: 12 },
        { id: "branco", name: "Branco", hex: "#F5F5F5", stock: 20 },
      ],
    },
  ],
  "earbuds-air-pulse": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "branco", name: "Branco", hex: "#F5F5F5", stock: 50 },
        { id: "preto", name: "Preto", hex: "#14141a", stock: 35 },
      ],
    },
  ],
  "earbuds-bass-bolt": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 40 },
        { id: "azul", name: "Azul", hex: "#1E4FD6", stock: 22 },
        { id: "verde", name: "Verde", hex: "#1F7A5C", stock: 0 },
      ],
    },
  ],
  "speaker-boom-pod": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 28 },
        { id: "laranja", name: "Laranja", hex: "#EE4D2D", stock: 14 },
      ],
    },
  ],
  "speaker-cube-mini": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 60 },
        { id: "verde", name: "Verde", hex: "#1F7A5C", stock: 24 },
      ],
    },
  ],
  "smartphone-nova-x": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 35 },
        { id: "azul", name: "Azul", hex: "#1E4FD6", stock: 22 },
        { id: "prata", name: "Prata", hex: "#C9C9CE", stock: 18 },
      ],
    },
    {
      id: "armazenamento",
      label: "Armazenamento",
      options: [
        { id: "256gb", name: "256GB", priceDelta: 0, stock: 20 },
        { id: "512gb", name: "512GB", priceDelta: 400, stock: 12 },
        { id: "1tb", name: "1TB", priceDelta: 900, stock: 6 },
      ],
    },
  ],
  "smartphone-crimson": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "vermelho", name: "Vermelho", hex: "#D73211", stock: 24 },
        { id: "preto", name: "Preto", hex: "#14141a", stock: 16 },
      ],
    },
  ],
  "smartphone-slim-5g": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 30 },
        { id: "verde", name: "Verde", hex: "#1F7A5C", stock: 14 },
      ],
    },
  ],
  "smartphone-compact-s": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 25 },
        { id: "branco", name: "Branco", hex: "#F5F5F5", stock: 12 },
      ],
    },
  ],
  "smartphone-ultra-z": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 12 },
        { id: "prata", name: "Prata", hex: "#C9C9CE", stock: 0 },
      ],
    },
    {
      id: "armazenamento",
      label: "Armazenamento",
      options: [
        { id: "512gb", name: "512GB", priceDelta: 0, stock: 10 },
        { id: "1tb", name: "1TB", priceDelta: 700, stock: 6 },
      ],
    },
  ],
  "tablet-pro-11": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 20 },
        { id: "prata", name: "Prata", hex: "#C9C9CE", stock: 15 },
      ],
    },
    {
      id: "armazenamento",
      label: "Armazenamento",
      options: [
        { id: "128gb", name: "128GB", priceDelta: 0, stock: 18 },
        { id: "256gb", name: "256GB", priceDelta: 350, stock: 10 },
        { id: "512gb", name: "512GB", priceDelta: 700, stock: 5 },
      ],
    },
  ],
  "tablet-air-10": [
    {
      id: "armazenamento",
      label: "Armazenamento",
      options: [
        { id: "64gb", name: "64GB", priceDelta: 0, stock: 25 },
        { id: "128gb", name: "128GB", priceDelta: 250, stock: 16 },
        { id: "256gb", name: "256GB", priceDelta: 500, stock: 7 },
      ],
    },
  ],
  "powerbank-20k": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 45 },
        { id: "branco", name: "Branco", hex: "#F5F5F5", stock: 30 },
      ],
    },
  ],
  "ultrabook-air-14": [
    {
      id: "armazenamento",
      label: "Armazenamento",
      options: [
        { id: "512gb", name: "512GB", priceDelta: 0, stock: 15 },
        { id: "1tb", name: "1TB", priceDelta: 800, stock: 10 },
        { id: "2tb", name: "2TB", priceDelta: 1600, stock: 4 },
      ],
    },
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "prata", name: "Prata", hex: "#C9C9CE", stock: 12 },
        { id: "preto", name: "Preto", hex: "#14141a", stock: 8 },
      ],
    },
  ],
  "laptop-creator-16": [
    {
      id: "armazenamento",
      label: "Armazenamento",
      options: [
        { id: "1tb", name: "1TB", priceDelta: 0, stock: 8 },
        { id: "2tb", name: "2TB", priceDelta: 1500, stock: 5 },
      ],
    },
  ],
  "gaming-rig-vortex": [
    {
      id: "gpu",
      label: "Placa de vídeo",
      options: [
        { id: "rtx4070", name: "RTX 4070", priceDelta: 0, stock: 6 },
        { id: "rtx4080", name: "RTX 4080", priceDelta: 1500, stock: 4 },
        { id: "rtx4090", name: "RTX 4090", priceDelta: 3000, stock: 2 },
      ],
    },
  ],
  "desktop-mini-pc": [
    {
      id: "armazenamento",
      label: "Armazenamento",
      options: [
        { id: "512gb", name: "512GB", priceDelta: 0, stock: 20 },
        { id: "1tb", name: "1TB", priceDelta: 300, stock: 12 },
      ],
    },
  ],
  "ssd-2tb-gen4": [
    {
      id: "capacidade",
      label: "Capacidade",
      options: [
        { id: "1tb", name: "1TB", priceDelta: -250, stock: 18 },
        { id: "2tb", name: "2TB", priceDelta: 0, stock: 25 },
        { id: "4tb", name: "4TB", priceDelta: 500, stock: 8 },
      ],
    },
  ],
  "watch-pulse-2": [
    {
      id: "pulseira",
      label: "Pulseira",
      options: [
        { id: "silicone", name: "Silicone", priceDelta: 0, stock: 30 },
        { id: "couro", name: "Couro", priceDelta: 150, stock: 12 },
        { id: "inox", name: "Inox", priceDelta: 300, stock: 6 },
      ],
    },
  ],
  "watch-active-fit": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 25 },
        { id: "vermelho", name: "Vermelho", hex: "#D73211", stock: 14 },
      ],
    },
  ],
  "ring-health-2": [
    {
      id: "tamanho",
      label: "Tamanho",
      options: [
        { id: "6", name: "6", stock: 10 },
        { id: "7", name: "7", stock: 14 },
        { id: "8", name: "8", stock: 8 },
      ],
    },
  ],
  "band-slim-sport": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 35 },
        { id: "rosa", name: "Rosa", hex: "#E58FB1", stock: 15 },
      ],
    },
  ],
  "headset-gamer-viper": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 30 },
        { id: "vermelho", name: "Vermelho", hex: "#D73211", stock: 16 },
      ],
    },
  ],
  "keyboard-mech-k87": [
    {
      id: "switch",
      label: "Switch",
      options: [
        { id: "linear", name: "Linear", priceDelta: 0, stock: 20 },
        { id: "tátil", name: "Tátil", priceDelta: 30, stock: 15 },
        { id: "clicky", name: "Clicky", priceDelta: 30, stock: 0 },
      ],
    },
  ],
  "mouse-gamer-x7": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 40 },
        { id: "branco", name: "Branco", hex: "#F5F5F5", stock: 20 },
      ],
    },
  ],
  "controller-pro-2": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 25 },
        { id: "branco", name: "Branco", hex: "#F5F5F5", stock: 15 },
      ],
    },
  ],
  "smart-speaker-orbit": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#14141a", stock: 18 },
        { id: "branco", name: "Branco", hex: "#F5F5F5", stock: 12 },
      ],
    },
  ],
  "smart-bulb-kit-4": [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "branco", name: "Branco", hex: "#F5F5F5", stock: 20 },
        { id: "laranja", name: "Laranja", hex: "#EE4D2D", stock: 10 },
      ],
    },
  ],
  "robot-vacuum-s2": [
    {
      id: "modelo",
      label: "Modelo",
      options: [
        { id: "s2", name: "S2", priceDelta: 0, stock: 12 },
        { id: "s2-pro", name: "S2 Pro", priceDelta: 400, stock: 6 },
      ],
    },
  ],
};

const BRAND_POOL = [
  "Aurix",
  "Boltz",
  "Kavo",
  "Lumen",
  "Nexa",
  "Orbe",
  "Pulso",
  "Quantix",
  "Rexa",
  "Solen",
  "Terra",
  "Vega",
];

function buildProduct([id, name, price, oldPrice, rating, reviews, badge, description, highlights]: Seed, category: Category, idx: number): Product {
  const kws = KEYWORDS[category];
  const image = lf(kws[idx % kws.length]);
  const gallery = g(
    kws[idx % kws.length],
    kws[(idx + 1) % kws.length],
    kws[(idx + 2) % kws.length]
  );
  const h = hashId(id);
  const seller = SELLERS[h % SELLERS.length];
  const lowStock = h % 7 === 0;
  const stock = lowStock ? 2 + (h % 5) : 15 + (h % 80);
  const condition: Condition = h % 12 === 0 ? "usado" : "novo";
  const warrantyMonths = condition === "usado" ? 3 : [3, 6, 12, 24][h % 4];
  const freeReturn = h % 6 !== 0;
  const exchangeDays = h % 3 === 0 ? 30 : 7;
  return {
    id,
    name,
    category,
    price,
    oldPrice,
    rating: rating ?? 4.5,
    reviews: reviews ?? 100,
    sold: soldFor(id, reviews ?? 100),
    image,
    gallery,
    description: description ?? "Produto premium da linha VOLTTECH.",
    highlights: highlights ?? ["Qualidade premium", "Garantia de 2 anos", "Frete grátis", "Troca em 30 dias"],
    badge,
    brand: BRAND_POOL[h % BRAND_POOL.length],
    sellerId: seller.id,
    stock,
    freeShipping: h % 5 !== 0,
    condition,
    warrantyMonths,
    freeReturn,
    exchangeDays,
    installments: installmentsFor(price),
    variants: VARIANTS[id],
    ean: eanFor(id),
  };
}

export const PRODUCTS: Product[] = ALL_SEEDS.flatMap(([category, seeds]) =>
  seeds.map((seed, idx) => buildProduct(seed, category, idx))
);

export const BRANDS: string[] = Array.from(
  new Set(PRODUCTS.map((p) => p.brand))
).sort();

export function brandSlug(brand: string): string {
  return brand
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function findProductByEan(code: string): Product | undefined {
  const clean = code.replace(/[^0-9]/g, "");
  if (clean.length !== 13) return undefined;
  return PRODUCTS.find((p) => p.ean === clean);
}
