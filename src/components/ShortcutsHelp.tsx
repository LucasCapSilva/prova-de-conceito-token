import Modal from "./Modal";

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: "/", desc: "Focar a busca" },
  { keys: "Esc", desc: "Fechar sugestões, menus e janelas abertas" },
  { keys: "?", desc: "Mostrar esta tela de ajuda" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsHelp({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Atalhos de teclado">
      <ul className="space-y-3">
        {SHORTCUTS.map((s) => (
          <li
            key={s.keys}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-ink">{s.desc}</span>
            <kbd className="shrink-0 rounded border border-line bg-page px-2 py-0.5 text-xs font-bold text-ink">
              {s.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
