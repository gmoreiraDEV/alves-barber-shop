"use client";

import { useUser } from "@stackframe/stack";
import Link from "next/link";
import type { ReactNode } from "react";
import { ToastProvider } from "./ui/toast";

type AppShellProps = {
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
};

export default function AppShell({
  actionHref,
  actionLabel,
  children,
}: AppShellProps) {
  const user = useUser();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-stone-950 flex flex-col">
        <nav className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-lg border-b border-stone-800 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link
              href="/"
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-700 bg-white transition group-hover:scale-105">
                <img
                  src="/images/logo.png"
                  alt="Alves Barbershop Logo"
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-stone-100">
                  Alves Barber
                </h1>
                <span className="text-[10px] tracking-[0.3em] uppercase text-stone-500 font-bold">
                  Shop & Style
                </span>
              </div>
            </Link>
            <div className="flex gap-4 items-center">
              {user ? (
                <div className="hidden md:flex items-center gap-3 mr-4 border-r border-stone-800 pr-4">
                  <div className="w-8 h-8 rounded-full border border-amber-600 bg-stone-800" />
                  <span className="text-xs font-bold text-stone-300">
                    {user.displayName || user.primaryEmail || "Admin"}
                  </span>
                </div>
              ) : null}
              <Link
                href={actionHref}
                className="px-4 py-2 border border-stone-700 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition text-stone-100"
              >
                {actionLabel}
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-grow">{children}</main>

        <footer className="bg-stone-950 border-t border-stone-900 py-12 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <h4 className="text-xl font-bold mb-4 uppercase text-amber-500">
                Localização
              </h4>
              <p className="text-stone-400">
                Rua Nelson Lomanto, 3
                <br />
                São Paulo, SP
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4 uppercase text-amber-500">
                Horários
              </h4>
              <p className="text-stone-400">Segunda a Sábado: 08h às 21h</p>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-2xl font-black tracking-tighter uppercase text-stone-100">
                  Alves Barber
                </h4>
              </div>
              <p className="text-[10px] text-stone-600 uppercase mt-4">
                © {new Date().getFullYear()} Alves Barber Shop. Todos os
                direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
