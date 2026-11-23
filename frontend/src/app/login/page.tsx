"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Eye,
  EyeSlash,
  Envelope,
  Lock,
  WarningCircle,
  SoccerBall,
  ShieldCheck,
  CheckCircle,
  Lightning,
  CalendarCheck,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Footer } from "@/components/ui/Footer";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const { login, isAuthenticated, user, loading } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.mustChangePassword) {
        router.replace("/change-password");
      } else if (redirectTarget) {
        router.replace(redirectTarget);
      } else if (user.role === "ADMIN") {
        router.replace("/admin");
      } else if (user.role === "FIELD_MANAGER") {
        router.replace("/dashboard");
      } else {
        router.replace("/terrains");
      }
    }
  }, [loading, isAuthenticated, user, redirectTarget, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (data: LoginForm) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setError(null);
      const res = await login({
        email: data.email.trim().toLowerCase(),
        password: data.password.trim(),
      });
      if (res.user.mustChangePassword) {
        router.push("/change-password");
      } else if (redirectTarget) {
        router.push(redirectTarget);
      } else if (res.user.role === "ADMIN") {
        router.push("/admin");
      } else if (res.user.role === "FIELD_MANAGER") {
        router.push("/dashboard");
      } else {
        router.push("/terrains");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError("Email ou mot de passe incorrect.");
      }
    } finally {
      submittingRef.current = false;
    }
  });

  return (
    <div className="min-h-screen bg-nuit-pelouse flex flex-col justify-between text-craie relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-vert-projecteur/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-sifflet/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl border border-craie/10 bg-encre/85 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Left Panel: Football Branding & Perks */}
          <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-nuit-pelouse/90 via-encre/90 to-encre border-r border-craie/10 relative">
            <div className="space-y-6">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-vert-projecteur text-encre flex items-center justify-center font-black shadow-md shadow-vert-projecteur/20">
                  <SoccerBall size={20} weight="fill" />
                </div>
                <span className="font-display text-2xl font-black text-craie tracking-tight uppercase">
                  FOOT<span className="text-vert-projecteur">BOOK</span>
                </span>
              </Link>

              <div className="space-y-3 pt-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-vert-projecteur/30 bg-vert-projecteur/10 text-vert-projecteur font-mono text-[11px] uppercase tracking-wider">
                  <Lightning size={14} weight="fill" />
                  <span>Accès Rapide & Sécurisé</span>
                </div>
                <h2 className="font-display font-black text-3xl xl:text-4xl uppercase text-craie leading-tight">
                  Prêt à entrer sur le <span className="text-vert-projecteur">terrain</span> ?
                </h2>
                <p className="text-xs text-craie/70 font-sans leading-relaxed">
                  Retrouvez vos réservations en cours, organisez vos matchs avec votre équipe et réservez les meilleurs créneaux sportifs.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                {[
                  "Disponibilités en temps réel sur les complexes agréés",
                  "Gestion d'équipes et défis entre joueurs",
                  "Paiement direct sur place au gérant",
                ].map((perk, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs font-mono text-craie/80">
                    <CheckCircle size={16} weight="fill" className="text-vert-projecteur shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-craie/10 flex items-center gap-2 text-[11px] font-mono text-craie/40">
              <ShieldCheck size={16} className="text-vert-projecteur" />
              <span>Plateforme certifiée FootBook SportsTech</span>
            </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="p-8 sm:p-10 flex flex-col justify-center space-y-6">
            <div className="space-y-1">
              <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-craie">
                Bon retour <span className="text-vert-projecteur">parmi nous</span>
              </h2>
              <p className="font-mono text-xs text-craie/50">
                Saisissez vos identifiants pour accéder à votre espace
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-orange-sifflet/40 bg-orange-sifflet/15 text-orange-sifflet p-3.5 font-mono text-xs flex items-center gap-2.5"
              >
                <WarningCircle size={18} weight="bold" className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-craie/70 uppercase tracking-wider block">
                  Adresse Email
                </label>
                <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse px-3.5 py-2.5 focus-within:border-vert-projecteur transition-all">
                  <Envelope size={18} weight="bold" className="text-vert-projecteur shrink-0 mr-2.5" />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="nom@exemple.com"
                    className="w-full bg-transparent text-craie text-sm font-sans outline-none placeholder-craie/30"
                    autoComplete="email"
                  />
                </div>
                {errors.email?.message && (
                  <p className="text-orange-sifflet text-xs font-mono pt-0.5">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-semibold text-craie/70 uppercase tracking-wider block">
                    Mot de passe
                  </label>
                </div>
                <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse px-3.5 py-2.5 focus-within:border-vert-projecteur transition-all">
                  <Lock size={18} weight="bold" className="text-vert-projecteur shrink-0 mr-2.5" />
                  <input
                    type={showPass ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-craie text-sm font-sans outline-none placeholder-craie/30"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="text-craie/40 hover:text-craie transition-colors cursor-pointer pl-2"
                    aria-label={showPass ? "Masquer mot de passe" : "Afficher mot de passe"}
                  >
                    {showPass ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password?.message && (
                  <p className="text-orange-sifflet text-xs font-mono pt-0.5">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-craie/60 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-craie/20 text-vert-projecteur focus:ring-vert-projecteur"
                  />
                  <span>Se souvenir de moi</span>
                </label>
                <Link href="/" className="hover:text-vert-projecteur transition-colors text-[11px]">
                  Besoin d&apos;aide ?
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  className="w-full shadow-lg shadow-vert-projecteur/20 font-bold"
                  loading={isSubmitting}
                >
                  Se connecter
                </Button>
              </div>

              <div className="pt-3 text-center text-xs font-mono text-craie/60 border-t border-craie/10">
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-vert-projecteur hover:underline font-bold">
                  Créer un compte Joueur
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
