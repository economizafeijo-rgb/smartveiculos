import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  className?: string;
  children: ReactNode;
}

/** Label + controle + mensagem de erro acessível. */
export function FormField({ id, label, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Converte texto do input em número; vazio vira NaN para o Zod rejeitar. */
export const toNumber = (v: string): number => (v.trim() === "" ? Number.NaN : Number(v.replace(",", ".")));

/** Achata erros do Zod em { campo: mensagem }. */
export function fieldErrors<K extends string>(issues: { path: (string | number)[]; message: string }[]): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "form") as K;
    out[key] ??= i.message;
  }
  return out;
}
