import { useMemo, useState } from "react";

interface Faq {
  q: string;
  a: string;
}

interface FaqTheme {
  id: string;
  label: string;
  icon: string;
  items: Faq[];
}

const THEMES: FaqTheme[] = [
  {
    id: "pedidos",
    label: "Pedidos e entrega",
    icon: "📦",
    items: [
      {
        q: "Como acompanho meu pedido?",
        a: "Acesse Meu perfil > Meus pedidos e abra o pedido. Você vê a linha do tempo com as etapas (confirmado, preparando, enviado, em trânsito, entregue), cada uma com data, hora e local.",
      },
      {
        q: "Posso cancelar um pedido?",
        a: "Sim, enquanto o pedido estiver como confirmado ou preparando. No detalhe do pedido, clique em Cancelar pedido e confirme. O status muda para cancelado e o valor é liberado na forma de pagamento.",
      },
      {
        q: "Qual o prazo de entrega?",
        a: "O prazo depende da modalidade escolhida no checkout (econômico, padrão ou expresso) e aparece na etapa de entrega. Ele começa a contar a partir da confirmação do pedido.",
      },
      {
        q: "Quando o frete fica grátis?",
        a: "O frete é grátis em compras acima de R$ 999 ou quando todos os itens do carrinho tiverem o selo Frete Grátis.",
      },
    ],
  },
  {
    id: "pagamento",
    label: "Pagamento e cupons",
    icon: "💳",
    items: [
      {
        q: "Quais formas de pagamento são aceitas?",
        a: "Pix (com 5% de desconto), boleto e cartão de crédito em até 12x. Acima de 6x é aplicado juros de 1,99% ao mês, com o total exibido antes de confirmar.",
      },
      {
        q: "Como uso um cupom?",
        a: "No carrinho, digite o código no campo Cupom e clique em Aplicar. Cupons da plataforma e cupons de cada vendedor podem ser usados juntos, e o desconto soma no total.",
      },
      {
        q: "O cupom tem valor mínimo?",
        a: "Sim. Cada cupom tem um valor mínimo de compra. Se o subtotal dos itens selecionados não atingir o mínimo, o cupom não é aplicado e uma mensagem de erro é exibida.",
      },
      {
        q: "Posso usar moedas de fidelidade?",
        a: "Você acumula 1 moeda a cada real gasto. No checkout é possível abater até 5% do total em moedas, se houver saldo no perfil.",
      },
    ],
  },
  {
    id: "devolucoes",
    label: "Devoluções e garantia",
    icon: "↩️",
    items: [
      {
        q: "Como solicito uma devolução?",
        a: "Quando o pedido for entregue, abra o detalhe do pedido e clique em Solicitar devolução no item desejado. Informe motivo, descrição e fotos. Um protocolo é gerado e você acompanha tudo em Minhas devoluções.",
      },
      {
        q: "Quanto tempo tenho para devolver?",
        a: "Você pode solicitar a devolução a qualquer momento após a entrega. Cada solicitação passa pelas etapas aberta, em análise, aprovada e concluída.",
      },
      {
        q: "O produto tem garantia?",
        a: "Todos os produtos novos acompanham a garantia legal de 90 dias. Produtos usados têm garantia de 7 dias conforme o Código de Defesa do Consumidor.",
      },
      {
        q: "E se o produto chegar com defeito?",
        a: "Solicite a devolução indicando defeito e anexe fotos. A troca ou o reembolso é processado após a análise, e o status fica visível na página Minhas devoluções.",
      },
    ],
  },
  {
    id: "conta",
    label: "Conta e privacidade",
    icon: "🔒",
    items: [
      {
        q: "Como altero meus dados?",
        a: "Em Meu perfil, você edita nome, e-mail, telefone, CPF e data de nascimento. As mudanças são validadas e ficam salvas no dispositivo.",
      },
      {
        q: "Meus dados de cartão ficam salvos?",
        a: "Só os 4 últimos dígitos ficam guardados nos Cartões salvos. Nenhum número completo de cartão é armazenado.",
      },
      {
        q: "Como recebo as notificações?",
        a: "O sino no topo do site mostra avisos de pedidos, promoções e mensagens. Você escolhe quais tipos recebe em Preferências de notificação.",
      },
      {
        q: "O que acontece se eu sair da conta?",
        a: "Sair encerra a sessão e limpa os dados sensíveis do dispositivo. Seu carrinho, favoritos e endereços são mantidos.",
      },
    ],
  },
];

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function Help() {
  const [term, setTerm] = useState("");

  const { themes, total } = useMemo(() => {
    const t = norm(term.trim());
    const themes = THEMES.map((th) => ({
      ...th,
      items:
        t === ""
          ? th.items
          : th.items.filter(
              (i) => norm(i.q).includes(t) || norm(i.a).includes(t),
            ),
    })).filter((th) => th.items.length > 0);
    const total = themes.reduce((acc, th) => acc + th.items.length, 0);
    return { themes, total };
  }, [term]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Central de ajuda
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Respostas rápidas sobre pedidos, pagamento, devoluções e sua conta.
        </p>
      </div>

      <div className="relative mb-5">
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por palavra-chave, ex.: frete, cupom, devolução…"
          aria-label="Buscar na central de ajuda"
          className="w-full rounded-[4px] border border-line bg-surface px-3 py-2.5 pr-9 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        {term !== "" && (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Limpar busca"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-soft hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>

      {term !== "" && (
        <p className="mb-4 text-xs text-ink-soft" role="status">
          {total === 0
            ? "Nenhuma resposta encontrada para essa busca."
            : `${total} resposta${total === 1 ? "" : "s"} encontrada${total === 1 ? "" : "s"} para “${term.trim()}”.`}
        </p>
      )}

      {total === 0 ? (
        <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-sm font-semibold text-ink">
            Nada encontrado
          </p>
          <p className="max-w-xs text-xs text-ink-soft">
            Tente outra palavra-chave, como “frete”, “cupom” ou
            “devolução”.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {themes.map((th) => (
            <section key={th.id} className="card rounded-lg">
              <header className="flex items-center gap-2 border-b border-line px-4 py-3">
                <span className="text-base" aria-hidden>
                  {th.icon}
                </span>
                <h2 className="text-sm font-bold text-ink">
                  {th.label}
                </h2>
                <span className="ml-auto text-[11px] font-semibold text-ink-soft">
                  {th.items.length} pergunta{th.items.length === 1 ? "" : "s"}
                </span>
              </header>
              <ul className="divide-y divide-line">
                {th.items.map((item) => (
                  <li key={item.q}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-brand-soft/40">
                        <span className="text-brand" aria-hidden>
                          ▸
                        </span>
                        {item.q}
                        <span
                          aria-hidden
                          className="ml-auto text-ink-soft transition-transform group-open:rotate-90"
                        >
                          ›
                        </span>
                      </summary>
                      <p className="px-4 pb-4 text-sm leading-relaxed text-ink-soft">
                        {item.a}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
