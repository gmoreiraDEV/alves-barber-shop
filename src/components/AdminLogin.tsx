"use client";

import { useStackApp } from "@stackframe/stack";

type AdminLoginProps = {
  onCancel: () => void;
};

export default function AdminLogin({ onCancel }: AdminLoginProps) {
  const stackApp = useStackApp();

  return (
    <div className="max-w-md mx-auto bg-stone-900/80 border border-stone-800 rounded-3xl p-8 shadow-2xl">
      <h3 className="text-2xl font-bold text-stone-100 mb-2">Área do administrador</h3>
      <p className="text-stone-400 mb-6">
        Entre com sua conta Stack Auth para gerenciar os agendamentos.
      </p>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => stackApp.redirectToSignIn()}
          className="h-11 rounded-full bg-amber-500 text-stone-950 font-bold uppercase tracking-widest text-xs hover:bg-amber-400 transition"
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-full border border-stone-700 text-stone-100 text-xs uppercase tracking-widest hover:bg-stone-800 transition"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
