"use client";

import { CredentialSignIn } from "@stackframe/stack";
import Link from "next/link";

export default function HandlerSignInPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_32%),linear-gradient(180deg,_#1c1917_0%,_#0c0a09_100%)] px-4 py-12 text-stone-100">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center">
        <section className="w-full rounded-[2rem] border border-stone-800 bg-stone-950/80 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400">
              Alves Barber Shop
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-stone-50">
              Entrar no painel
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              Use o e-mail e a senha do administrador para acessar o dashboard.
            </p>
          </div>

          <CredentialSignIn />

          <div className="mt-6 flex justify-center">
            <Link
              href="/"
              className="text-sm text-stone-400 transition hover:text-stone-200"
            >
              Voltar para o site
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
