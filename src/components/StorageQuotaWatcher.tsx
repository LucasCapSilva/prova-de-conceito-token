import { useEffect } from "react";
import { onStorageError } from "../lib/storage";
import { clearViewed } from "../lib/recent";
import { useToasts } from "../context/toastsCore";

export default function StorageQuotaWatcher() {
  const { toast } = useToasts();

  useEffect(() => {
    return onStorageError((kind) => {
      if (kind !== "quota") return;
      toast.error(
        "O armazenamento do navegador está cheio — os dados não foram salvos.",
        {
          label: "Limpar produtos vistos",
          onClick: () => clearViewed(),
        }
      );
    });
  }, [toast]);

  return null;
}
