import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getDictionary } from "@/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).t.meta.register };
}

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  const { t } = await getDictionary();

  return (
    <AuthShell
      image="/images/char-elias.jpg"
      focus="50% 40%"
      eyebrow={t.auth.registerEyebrow}
      title={t.auth.registerTitle}
      quote={t.auth.registerQuote}
    >
      <AuthForm mode="register" next={next} />
    </AuthShell>
  );
}
