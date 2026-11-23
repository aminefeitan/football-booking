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
  Phone,
  User,
  WarningCircle,
  SoccerBall,
  CheckCircle,
  ShieldCheck,
  Trophy,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Footer } from "@/components/ui/Footer";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "Prénom requis (2 caractères min)"),
    lastName: z.string().min(2, "Nom requis (2 caractères min)"),
    email: z.string().email("Adresse email invalide"),
    password: z.string().min(8, "Au moins 8 caractères").max(72, "Au plus 72 caractères"),
    confirmPassword: z.string().min(1, "Veuillez confirmer votre mot de passe"),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const { register: registerUser, isAuthenticated, user, loading } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (redirectTarget) {
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const pwdWatch = watch("password", "");
  const pwdStrength =
    pwdWatch.length === 0
      ? 0
      : pwdWatch.length < 8
      ? 1
      : pwdWatch.length < 12
      ? 2
      : 3;

  const onSubmit = handleSubmit(async (data: RegisterForm) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setError(null);
      await registerUser({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password.trim(),
        phone: data.phone?.trim() || undefined,
      });
      if (redirectTarget) {
        router.push(redirectTarget);
      } else {
        router.push("/terrains");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError("Erreur d'inscription. Vérifiez vos informations.");
      }
    } finally {
      submittingRef.current = false;
    }
  });

  return (
    <div className="min-h-screen bg-nuit-pelouse flex flex-col justify-between text-craie relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-vert-projecteur/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-orange-sifflet/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl border border-craie/10 bg-encre/85 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Left Panel: Sports Tech Branding */}
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-sifflet/30 bg-orange-sifflet/10 text-orange-sifflet font-mono text-[11px] uppercase tracking-wider">
                  <Trophy size={14} weight="fill" />
                  <span>Rejoignez la Communauté</span>
                </div>
                <h2 className="font-display font-black text-3xl xl:text-4xl uppercase text-craie leading-tight">
                  Créez votre profil <span className="text-vert-projecteur">Joueur</span> en 1 minute
                </h2>
                <p className="text-xs text-craie/70 font-sans leading-relaxed">
                  Accédez instantanément à l'ensemble des terrains de football, organisez des rencontres sportives et suivez vos statistiques.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                {[
                  "Réservation instantanée de créneaux",
                  "Création et composition de votre propre équipe",
                  "Invitations de coéquipiers et défis amicaux",
                  "Historique et gestion des matchs planifiés",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-mono text-craie/80">
                    <CheckCircle size={16} weight="fill" className="text-vert-projecteur shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-craie/10 flex items-center gap-2 text-[11px] font-mono text-craie/40">
              <ShieldCheck size={16} className="text-vert-projecteur" />
              <span>Données personnelles protégées · Inscription gratuite</span>
            </div>
          </div>

          {/* Right Panel: Registration Form */}
          <div className="p-8 sm:p-10 flex flex-col justify-center space-y-6">
            <div className="space-y-1">
              <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-craie">
                Créer un compte <span className="text-vert-projecteur">Joueur</span>
              </h2>
              <p className="font-mono text-xs text-craie/50">
                Remplissez les informations ci-dessous pour démarrer
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

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-craie/70 uppercase tracking-wider block">
                    Prénom
                  </label>
                  <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse px-3 py-2 focus-within:border-vert-projecteur transition-all">
                    <User size={16} weight="bold" className="text-vert-projecteur mr-2 shrink-0" />
                    <input
                      {...register("firstName")}
                      placeholder="Karim"
                      className="w-full bg-transparent text-craie text-sm font-sans outline-none placeholder-craie/30"
                    />
                  </div>
                  {errors.firstName?.message && (
                    <p className="text-orange-sifflet text-[11px] font-mono">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-craie/70 uppercase tracking-wider block">
                    Nom
                  </label>
                  <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse px-3 py-2 focus-within:border-vert-projecteur transition-all">
                    <User size={16} weight="bold" className="text-vert-projecteur mr-2 shrink-0" />
                    <input
                      {...register("lastName")}
                      placeholder="Benzema"
                      className="w-full bg-transparent text-craie text-sm font-sans outline-none placeholder-craie/30"
                    />
                  </div>
                  {errors.lastName?.message && (
                    <p className="text-orange-sifflet text-[11px] font-mono">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-semibold text-craie/70 uppercase tracking-wider block">
                  Email
                </label>
                <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse px-3 py-2 focus-within:border-vert-projecteur transition-all">
                  <Envelope size={16} weight="bold" className="text-vert-projecteur mr-2 shrink-0" />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="joueur@exemple.com"
                    className="w-full bg-transparent text-craie text-sm font-sans outline-none placeholder-craie/30"
                    autoComplete="email"
                  />
                </div>
                {errors.email?.message && (
                  <p className="text-orange-sifflet text-[11px] font-mono">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-craie/70 uppercase tracking-wider block">
                    Mot de passe
                  </label>
                  <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse px-3 py-2 focus-within:border-vert-projecteur transition-all">
                    <Lock size={16} weight="bold" className="text-vert-projecteur mr-2 shrink-0" />
                    <input
                      type={showPass ? "text" : "password"}
                      {...register("password")}
                      placeholder="Min. 8 caractères"
                      className="w-full bg-transparent text-craie text-sm font-sans outline-none placeholder-craie/30"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="text-craie/40 hover:text-craie cursor-pointer pl-1"
                    >
                      {showPass ? <EyeSlash size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password?.message && (
                    <p className="text-orange-sifflet text-[11px] font-mono">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-craie/70 uppercase tracking-wider block">
                    Confirmer
                  </label>
                  <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse px-3 py-2 focus-within:border-vert-projecteur transition-all">
                    <Lock size={16} weight="bold" className="text-vert-projecteur mr-2 shrink-0" />
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder="Répétez"
                      className="w-full bg-transparent text-craie text-sm font-sans outline-none placeholder-craie/30"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass((v) => !v)}
                      className="text-craie/40 hover:text-craie cursor-pointer pl-1"
                    >
                      {showConfirmPass ? <EyeSlash size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.confirmPassword?.message && (
                    <p className="text-orange-sifflet text-[11px] font-mono">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Password strength indicator bar */}
              {pwdWatch.length > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <div
                    className={`h-1.5 flex-1 rounded-full ${
                      pwdStrength >= 1 ? "bg-orange-sifflet" : "bg-craie/10"
                    }`}
                  />
                  <div
                    className={`h-1.5 flex-1 rounded-full ${
                      pwdStrength >= 2 ? "bg-jaune-carton" : "bg-craie/10"
                    }`}
                  />
                  <div
                    className={`h-1.5 flex-1 rounded-full ${
                      pwdStrength >= 3 ? "bg-vert-projecteur" : "bg-craie/10"
                    }`}
                  />
                  <span className="text-[10px] font-mono text-craie/50 pl-1">
                    {pwdStrength === 1 ? "Faible" : pwdStrength === 2 ? "Moyen" : "Sécurisé"}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-semibold text-craie/70 uppercase tracking-wider block">
                  Téléphone (optionnel)
                </label>
                <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse px-3 py-2 focus-within:border-vert-projecteur transition-all">
                  <Phone size={16} weight="bold" className="text-vert-projecteur mr-2 shrink-0" />
                  <input
                    type="tel"
                    {...register("phone")}
                    placeholder="+212 6 12 34 56 78"
                    className="w-full bg-transparent text-craie text-sm font-sans outline-none placeholder-craie/30"
                  />
                </div>
              </div>

              {/* Role badge */}
              <div className="rounded-xl border border-craie/10 bg-nuit-pelouse/60 p-3 text-[11px] font-mono text-craie/70 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-vert-projecteur" />
                  <span>Inscription automatique avec le rôle <strong className="text-vert-projecteur">Joueur</strong>.</span>
                </div>
                <div className="text-[10px] text-craie/50">
                  Vous gérez un complexe de football ? Contactez notre administrateur.
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="booking"
                  size="md"
                  type="submit"
                  className="w-full shadow-lg shadow-vert-projecteur/20 font-bold"
                  loading={isSubmitting}
                >
                  Créer mon compte joueur
                </Button>
              </div>

              <div className="pt-2 text-center text-xs font-mono text-craie/60 border-t border-craie/10">
                Déjà inscrit ?{" "}
                <Link href="/login" className="text-vert-projecteur hover:underline font-bold">
                  Se connecter
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
