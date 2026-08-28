import { useState } from "react";
import {
  PRIVACY_CATEGORIES,
  deleteAllData,
  deleteCategoryKeys,
  exportAllData,
  keyExists,
  type PrivacyCategory,
} from "../lib/privacy";
import { useToasts } from "../context/toastsCore";
import ConfirmModal from "../components/ConfirmModal";

export default function Privacy() {
  const { toast } = useToasts();
  const [confirming, setConfirming] = useState<PrivacyCategory | "all" | null>(
    null,
  );

  const exists = (key: string) => keyExists(key);

  const doExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "electronica-meus-dados.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Arquivo com seus dados exportado.");
  };

  const doDelete = () => {
    if (confirming === "all") {
      deleteAllData();
    } else if (confirming) {
      deleteCategoryKeys(confirming);
    }
    toast.success("Dados apagados.");
    window.location.reload();
  };

  const totalKeys = PRIVACY_CATEGORIES.reduce(
    (acc, c) => acc + c.keys.length,
    0,
  );
  const presentKeys = PRIVACY_CATEGORIES.reduce(
    (acc, c) => acc + c.keys.filter((k) => keyExists(k.key)).length,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
        Privacidade e dados
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Veja o que guardamos neste navegador, exporte tudo ou apague o que
        quiser.
      </p>

      <div className="card mt-6 rounded-lg p-4">
        <h2 className="font-bold text-ink">Como funcionam seus dados</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          A Electronica Store não tem servidor: tudo que você salva fica apenas
          neste navegador, em áreas identificadas pelo prefixo{" "}
          <span className="font-mono text-xs">electronica:</span>. Nenhum dado
          sai do seu dispositivo. Você pode exportar tudo em um arquivo JSON ou
          apagar categorias inteiras a qualquer momento.
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          Há {totalKeys} tipos de dados mapeados; {presentKeys} deles têm
          conteúdo neste navegador agora.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={doExport}
          className="btn-brand rounded-[6px] px-4 py-2 text-sm font-bold"
        >
          Exportar meus dados (JSON)
        </button>
        <span className="text-xs text-ink-soft">
          O arquivo inclui todas as categorias abaixo.
        </span>
      </div>

      <ul className="mt-6 space-y-4">
        {PRIVACY_CATEGORIES.map((cat) => (
          <li key={cat.id} className="card rounded-lg p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-ink">{cat.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {cat.description}
                </p>
              </div>
              <button
                onClick={() => setConfirming(cat)}
                className="shrink-0 rounded border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-ink-soft hover:text-ink"
              >
                Apagar categoria
              </button>
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {cat.keys.map((k) => (
                <li
                  key={k.key}
                  className={`flex items-center justify-between gap-2 text-xs ${
                    exists(k.key) ? "text-ink" : "text-ink-soft/50"
                  }`}
                >
                  <span className="truncate">{k.label}</span>
                  <span className="shrink-0 font-mono text-[10px]">
                    {k.key}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-lg border border-ink/20 bg-brand-soft/40 p-4">
        <h3 className="font-bold text-ink">Zona de perigo</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          Apagar tudo remove pedidos, carrinho, favoritos, conta e preferências
          deste navegador. Essa ação não pode ser desfeita.
        </p>
        <button
          onClick={() => setConfirming("all")}
          className="mt-3 rounded border border-ink/30 px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-surface"
        >
          Apagar todos os dados
        </button>
      </div>

      <ConfirmModal
        open={confirming !== null}
        title={
          confirming === "all"
            ? "Apagar todos os dados"
            : confirming
            ? `Apagar "${confirming.label}"`
            : ""
        }
        message={
          confirming === "all"
            ? "Todos os dados da Electronica Store serão removidos deste navegador. Deseja continuar?"
            : confirming
            ? `Os dados da categoria "${confirming.label}" serão removidos. Deseja continuar?`
            : ""
        }
        confirmLabel="Apagar"
        onClose={() => setConfirming(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
