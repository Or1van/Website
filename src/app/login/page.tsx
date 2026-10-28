import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getDictionary } from "@/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).t.meta.login };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  const { t } = await getDictionary();

  return (
    <AuthShell
      image="/images/char-ilona.jpg"
      focus="55% 35%"
      eyebrow={t.auth.loginEyebrow}
      title={t.auth.loginTitle}
      quote={t.auth.loginQuote}
    >
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
