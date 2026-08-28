import type { Category } from "./products.ts";

export interface GuideSection {
  heading: string;
  body: string;
}

export interface Guide {
  id: string;
  slug: string;
  title: string;
  category: Category;
  intro: string;
  sections: GuideSection[];
  productIds: string[];
}

export const GUIDES: Guide[] = [
  {
    id: "guide-notebook",
    slug: "como-escolher-um-notebook",
    title: "Como escolher um notebook",
    category: "computadores",
    intro:
      "Tela, bateria, peso e potência: os quatro pontos que separam um notebook bom de um grande. Veja o que importa para cada tipo de uso.",
    sections: [
      {
        heading: "Comece pelo uso principal",
        body: "Antes de olhar a ficha técnica, defina para que o notebook vai servir. Estudos e escritório pedem leveza e bateria; criação de vídeo e jogos pedem GPU dedicada e boa tela. Um aparelho bom no uso errado é sempre uma dor de cabeça.",
      },
      {
        heading: "Tela: o que você vive olhando",
        body: "Prefira painéis de 14 a 16 polegadas com resolução de 2.5K ou 4K e 99% de sRGB. A taxa de 90Hz ou 120Hz faz a interface parecer mais fluida. Se trabalha com cor, procure calibração de fábrica e cobertura DCI-P3.",
      },
      {
        heading: "Bateria e peso de verdade",
        body: "Descuide das horas anunciadas: procure modelos com 15h ou mais de uso real e menos de 1,2kg. Verifique se a carga é por USB-C e se o carregador é pequeno. São os detalhes que aparecem todo dia na mochila.",
      },
      {
        heading: "Potência sob medida",
        body: "Para o dia a dia, 16GB de RAM e um SSD de 512GB já sobram. Para render e jogos, vá de 32GB, SSD de 1TB e GPU dedicada. Relembre: SSD e memória costuma-se ampliar depois; tela e chassi nunca.",
      },
      {
        heading: "Periféricos que completam",
        body: "Um dock USB-C com HDMI e GbE transforma qualquer mesa em estação. Um bom monitor externo estende a produtividade. Combine o notebook certo com o acerto do setup, e a troca de aparelho deixa de doer.",
      },
    ],
    productIds: [
      "ultrabook-air-14",
      "laptop-creator-16",
      "monitor-27-4k",
      "ssd-2tb-gen4",
      "ram-32gb-ddr5",
      "dock-usbc-8in1",
    ],
  },
  {
    id: "guide-fone",
    slug: "como-escolher-um-fone-de-ouvido",
    title: "Como escolher um fone de ouvido",
    category: "audio",
    intro:
      "Fecho de ruído, bateria e conforto: entenda as diferenças entre fones grandes, true wireless e caixas, e encontre o som certo para o seu dia.",
    sections: [
      {
        heading: "Qual formato combina com você",
        body: "Os de cabeça (over/on-ear) entregam mais graves e conforto para sessões longas. Os true wireless ganham no transporte e no treino. Se o objetivo é festa ou ambiente, uma caixa bluetooth resolve. Pense no onde: avião, casa, academia.",
      },
      {
        heading: "Cancelamento de ruído (ANC)",
        body: "O ANC híbrido adaptativo corta o ronco constante de avião e ônibus. O modo transparência deixa o ambiente entrar quando você fala. Em fones de baixo preço, o ANC é básico: verifique se é real ou apenas marketing.",
      },
      {
        heading: "Bateria e recarga rápida",
        body: "Procure 30h ou mais nos de cabeça e estojo incluso nos true wireless. A carga rápida importa: 10 minutos que rendem 4h de uso salvam o dia. Prefira USB-C e verifique se o estojo também carrega sem fio.",
      },
      {
        heading: "Conforto e durabilidade",
        body: "Fones grandes com espuma memory foam distribuem melhor o peso. Nos true wireless, a resistência à água (IPX4 a IPX7) decide se eles sobrevivem ao suor. Verifique a gramatura e as almofadas: são horas no seu rosto.",
      },
      {
        heading: "Para música séria e gravação",
        body: "Se grava ou produz, procure driver de 40mm, modo monitor e microfone com redução de ruído. Um bom microfone de mesa dá o acabamento que fone nenhum entrega. Combine o fone certo com o resto da cadeia de som.",
      },
    ],
    productIds: [
      "headphone-pro-max",
      "headphone-studio-wireless",
      "earbuds-air-pulse",
      "earbuds-bass-bolt",
      "headphone-open-air",
      "mic-podcast-pro",
    ],
  },
  {
    id: "guide-smartphone",
    slug: "como-escolher-um-smartphone",
    title: "Como escolher um smartphone",
    category: "mobile",
    intro:
      "Câmera, tela, bateria e recarga: os quatro pilares de um bom celular. Veja o que realmente pesa em cada faixa de preço.",
    sections: [
      {
        heading: "Defina a faixa de preço",
        body: "Nos de entrada, o essencial é tela boa e bateria. Nos intermediários, entram câmeras versáteis e recarga rápida. Nos topo, o salto é sensor, tela LTPO e armazenamento. Escolha a faixa e não pague pelo que não vai usar.",
      },
      {
        heading: "Tela: o que você toca e vê",
        body: "Procure AMOLED de 90Hz ou 120Hz e brilho alto para o sol. O tamanho ideal varia: de 5.9 a 6.4 polegadas cabe na mão; acima de 6.5 vira TV no bolso. A taxa de 120Hz faz a rolagem parecer duas classes à frente.",
      },
      {
        heading: "Câmeras que importam",
        body: "A câmera principal vale mais que a quantidade de lentes. Procure boa câmera noturna e zoom óptico. Verifique se há IA de cena e estabilização: é o que separa uma foto boa de uma foto apenas registrada.",
      },
      {
        heading: "Bateria e recarga",
        body: "Procure 4.500mAh ou mais e recarga de pelo menos 30W. As de 100W ou mais enchem em minutos, mas verifique a longevidade da bateria. Um celular de 48h de uso real vale mais que qualquer número de megapixel.",
      },
      {
        heading: "O que vem na caixa",
        body: "Nem todo celular traz carregador ou fone. Verifique o que acompanha e separe o essencial: um power bank para a rua, um carregador GaN para a mesa e uma pulseira para quem vive no pulso. O celular é o centro; os acessórios completam.",
      },
    ],
    productIds: [
      "smartphone-nova-x",
      "smartphone-crimson",
      "smartphone-slim-5g",
      "smartphone-compact-s",
      "smartphone-ultra-z",
      "charger-turbo-120",
    ],
  },
  {
    id: "guide-smartwatch",
    slug: "como-escolher-um-smartwatch",
    title: "Como escolher um smartwatch",
    category: "wearables",
    intro:
      "Relógio ou anel? Entenda o que cada wearable mede de verdade e qual combina com o seu treino, sono e rotina.",
    sections: [
      {
        heading: "Relógio, pulseira ou anel",
        body: "O relógio mostra na tela e avisa na hora. A pulseira é discreta e dura mais. O anel é o mais leve e mede saúde sem distrair. Escolha pelo que quer ver: notificações, treino ou apenas sono.",
      },
      {
        heading: "Saúde: o que ele realmente mede",
        body: "Procure ECG, SpO2 e fases do sono. O GPS duplo separa quem treina na rua de quem treina no estúdio. Verifique a precisão dos sensores e a duração da bateria: sono e treino são o que importa de verdade.",
      },
      {
        heading: "Bateria e conforto",
        body: "Procure 7 a 14 dias de uso real. A resistência à água (5ATM, IP68) decide se ele aguenta banho e treino. A pulseira certa faz o relógio sumir no pulso: é onde você vai passar horas.",
      },
      {
        heading: "Para cada tipo de treino",
        body: "Corredores e ciclistas querem GPS e modos esportivos. Quem dorme mal quer rastreamento de sono e respiração. Quem quer elegância quer um relógio clássico com chamadas. Combine o wearable com o fone certo e o treino fica redondo.",
      },
      {
        heading: "Integração com o resto",
        body: "O wearable brilha quando conversa com o celular, o fone e a casa. Verifique a compatibilidade e as rotinas: um anel que só mede é bom, um que integra o dia todo é melhor.",
      },
    ],
    productIds: [
      "watch-pulse-2",
      "watch-active-fit",
      "ring-health-2",
      "band-slim-sport",
      "watch-classic-e",
      "band-sleep-pro",
    ],
  },
  {
    id: "guide-setup-gamer",
    slug: "montando-seu-setup-gamer",
    title: "Montando seu setup gamer",
    category: "gamer",
    intro:
      "Do mouse à cadeira: monte um setup que responde rápido, não cansa e ainda fica bom de olhar. Uma lista que funciona para qualquer orçamento.",
    sections: [
      {
        heading: "Comece pelo que você toca",
        body: "Teclado e mouse são a interface com o jogo. Um mecânico hot-swap e um mouse leve de 59g com sensor de 26.000 DPI mudam a mira. Não economize aqui: é o que você usa a cada frame.",
      },
      {
        heading: "Áudio que dá vantagem",
        body: "Um headset com surround 7.1 e microfone com filtro de ruído separa passo de tiro. A bateria de 30h aguenta maratona. O som posiciona inimigo; o microfone mantém a equipe no fio.",
      },
      {
        heading: "Espaço e conforto",
        body: "Um mousepad XL deixa o braço livre. A cadeira com reclinação de 180° e apoio 4D protege as costas em sessões longas. Um desk mat organiza o que sobrou. O setup bom é o que você esquece que está ali.",
      },
      {
        heading: "Iluminação e acabamento",
        body: "Uma fita RGB e um cooler pad dão o toque final e mantêm o notebook fresco. A luz certa reduz o cansaço e o visual certo dá identidade ao setup. O acabamento é o que separa a mesa boa da mesa de verdade.",
      },
      {
        heading: "Monte por camadas",
        body: "Comece pelo essencial (teclado, mouse, headset) e acrescente por conforto (cadeira, desk mat) e por estilo (RGB, cooler). Assim o orçamento rende e nada do que importa fica de fora. O setup é seu: monte no seu ritmo.",
      },
    ],
    productIds: [
      "keyboard-mech-k87",
      "mouse-gamer-x7",
      "headset-gamer-viper",
      "mousepad-xl-900",
      "gaming-chair-elite",
      "rgb-strip-60cm",
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function guideForCategory(category: Category): Guide | undefined {
  return GUIDES.find((g) => g.category === category);
}
