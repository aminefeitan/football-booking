"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeSlash,
  User as UserIcon,
  Envelope,
  Lock,
  Phone,
  SoccerBall,
  ChartBar,
  Ticket,
  SignOut,
  Compass,
  CheckCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Au moins 8 caractères"),
  phone: z.string().optional(),
  role: z.enum(["PLAYER", "FIELD_MANAGER"]),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

/* ── Illustration terrain SVG gauche ─────────────────────────── */
function FieldIllustration() {
  return (
    <svg viewBox="0 0 400 500" className="w-full h-full" aria-hidden="true">
      <rect width="400" height="500" fill="#0B2E22" />
      <rect x="30" y="80" width="340" height="340" fill="#0d3828" stroke="#C8FF3D" strokeWidth="2.5" />
      <line x1="200" y1="80" x2="200" y2="420" stroke="#C8FF3D" strokeWidth="1.5" />
      <circle cx="200" cy="250" r="50" fill="none" stroke="#C8FF3D" strokeWidth="1.5" />
      <circle cx="200" cy="250" r="5" fill="#C8FF3D" />
      <rect x="30" y="195" width="45" height="110" fill="none" stroke="#C8FF3D" strokeWidth="1.5" />
      <rect x="325" y="195" width="45" height="110" fill="none" stroke="#C8FF3D" strokeWidth="1.5" />
      <rect x="30" y="155" width="85" height="190" fill="none" stroke="#C8FF3D" strokeWidth="1" />
      <rect x="285" y="155" width="85" height="190" fill="none" stroke="#C8FF3D" strokeWidth="1" />
      {/* Joueurs */}
      {([
        [95, 180, "#FF5B1F"],
        [95, 320, "#FF5B1F"],
        [155, 250, "#FF5B1F"],
        [295, 180, "#C8FF3D"],
        [295, 320, "#C8FF3D"],
        [245, 250, "#C8FF3D"],
      ] as [number, number, string][]).map(([x, y, c], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="10" fill={c} stroke="#0A0F0D" strokeWidth="1.5" />
          <circle cx={x} cy={y - 4} r="4" fill="#0A0F0D" />
        </g>
      ))}
      <text
        x="200"
        y="470"
        textAnchor="middle"
        fill="#C8FF3D"
        fontFamily="'Big Shoulders Display', sans-serif"
        fontSize="26"
        fontWeight="900"
      >
        FOOTBOOK
      </text>
    </svg>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-craie/40 uppercase tracking-widest font-mono block">
        {label}
      </label>
      {children}
      {error && <p className="text-orange-sifflet text-xs font-mono">{error}</p>}
    </div>
  );
}

function InputWrap({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center border-2 border-encre/60 bg-encre focus-within:border-vert-projecteur transition-colors">
      {icon && <span className="pl-3 text-vert-projecteur shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const defaultRole = searchParams.get("role") === "manager" ? "FIELD_MANAGER" : "PLAYER";

  const { user, isAuthenticated, login, register: registerUser, logout } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LF = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const RF = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole as "PLAYER" | "FIELD_MANAGER" },
  });

  const handleLogin = LF.handleSubmit(async (data: LoginForm) => {
    try {
      setError(null);
      const res = await login(data);
      if (redirectTarget) {
        router.push(redirectTarget);
      } else if (res.user.role === "FIELD_MANAGER") {
        router.push("/dashboard");
      } else {
        router.push("/terrains");
      }
    } catch {
      setError("Email ou mot de passe incorrect.");
    }
  });

  const handleRegister = RF.handleSubmit(async (data: RegisterForm) => {
    try {
      setError(null);
      const res = await registerUser(data);
      if (redirectTarget) {
        router.push(redirectTarget);
      } else if (res.user.role === "FIELD_MANAGER") {
        router.push("/dashboard");
      } else {
        router.push("/terrains");
      }
    } catch {
      setError("Erreur d'inscription. Vérifiez vos informations.");
    }
  });

  const inputCls =
    "flex-1 bg-transparent text-craie px-3 py-2.5 text-sm outline-none placeholder-craie/25 font-body";

  // ── Si l'utilisateur est déjà connecté : Vue Mon Profil ─────────
  if (isAuthenticated && user) {
    const isManager = user.role === "FIELD_MANAGER";

    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg border-2 border-encre bg-encre shadow-brutal-xl p-8 space-y-6">
          {/* Header profil */}
          <div className="flex items-center gap-4 pb-6 border-b-2 border-encre/60">
            <div className="w-16 h-16 border-2 border-encre bg-vert-projecteur text-encre flex items-center justify-center font-display font-black text-3xl shadow-brutal">
              {user.firstName ? user.firstName[0].toUpperCase() : "U"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-2xl uppercase text-craie">
                  {user.firstName} {user.lastName}
                </h1>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 border font-mono font-bold uppercase",
                    isManager
                      ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                      : "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                  )}
                >
                  {isManager ? "Gérant" : "Joueur"}
                </span>
              </div>
              <p className="font-mono text-xs text-craie/50 mt-1">{user.email}</p>
              {user.phone && <p className="font-mono text-xs text-craie/40">{user.phone}</p>}
            </div>
          </div>

          {/* Statut de compte */}
          <div className="flex items-center gap-2 text-xs font-mono text-vert-projecteur bg-vert-projecteur/10 border border-vert-projecteur/40 px-3 py-2">
            <CheckCircle size={16} weight="fill" />
            <span>Compte actif et vérifié · Connecté</span>
          </div>

          {/* Raccourcis d'actions */}
          <div className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-craie/40">
              Accès rapide :
            </h2>

            {isManager && (
              <Link
                href="/dashboard"
                className="flex items-center justify-between border-2 border-orange-sifflet bg-orange-sifflet/10 p-3.5 text-craie font-mono font-bold text-sm uppercase hover:bg-orange-sifflet hover:text-craie transition-colors shadow-brutal"
              >
                <span className="flex items-center gap-2">
                  <ChartBar size={18} weight="bold" />
                  Tableau de bord gérant
                </span>
                <span>→</span>
              </Link>
            )}

            <Link
              href="/mes-reservations"
              className="flex items-center justify-between border-2 border-encre/60 bg-nuit-pelouse p-3.5 text-craie font-mono font-bold text-sm uppercase hover:border-vert-projecteur transition-colors shadow-brutal"
            >
              <span className="flex items-center gap-2">
                <Ticket size={18} weight="bold" className="text-vert-projecteur" />
                Mes réservations de match
              </span>
              <span>→</span>
            </Link>

            <Link
              href="/terrains"
              className="flex items-center justify-between border-2 border-encre/60 bg-nuit-pelouse p-3.5 text-craie font-mono font-bold text-sm uppercase hover:border-vert-projecteur transition-colors shadow-brutal"
            >
              <span className="flex items-center gap-2">
                <Compass size={18} weight="bold" className="text-vert-projecteur" />
                Réserver un nouveau terrain
              </span>
              <span>→</span>
            </Link>
          </div>

          {/* Déconnexion */}
          <div className="pt-4 border-t-2 border-encre/60">
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 border-2 border-orange-sifflet text-orange-sifflet hover:bg-orange-sifflet hover:text-craie py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <SignOut size={16} weight="bold" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Si non connecté : Formulaires Connexion / Inscription ────────
  return (
    <div className="min-h-screen bg-nuit-pelouse flex">
      {/* Illustration gauche — desktop */}
      <div className="hidden lg:block w-[42%] border-r-2 border-encre relative overflow-hidden">
        <FieldIllustration />
        <div className="absolute bottom-8 left-6 right-6">
          <div className="border-l-4 border-vert-projecteur pl-4 space-y-0">
            {["Joue.", "Réserve.", "Gagne."].map((w, i) => (
              <div
                key={w}
                className="font-display font-black uppercase leading-tight"
                style={{
                  fontSize: "clamp(28px,4vw,52px)",
                  color: i === 0 ? "#C8FF3D" : i === 1 ? "#F5F0E1" : "#FF5B1F",
                }}
              >
                {w}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulaire droite */}
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-5">
          {/* Logo mobile */}
          <div className="lg:hidden mb-2">
            <span className="font-display text-2xl font-black text-vert-projecteur uppercase">
              Foot<span className="text-orange-sifflet">Book</span>
            </span>
          </div>

          {/* Toggle connexion / inscription */}
          <div className="flex border-2 border-encre overflow-hidden shadow-brutal">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 py-2.5 font-display font-black uppercase text-xs tracking-widest transition-colors cursor-pointer ${
                  mode === m
                    ? m === "login"
                      ? "bg-vert-projecteur text-encre"
                      : "bg-orange-sifflet text-craie"
                    : "bg-encre text-craie/40 hover:text-craie"
                }`}
              >
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <div className="border-2 border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet px-3 py-2 font-mono text-xs">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── CONNEXION ─────────────────────────── */}
            {mode === "login" && (
              <motion.form
                key="login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <FormField label="Email" error={LF.formState.errors.email?.message}>
                  <InputWrap icon={<Envelope size={14} weight="bold" />}>
                    <input
                      type="email"
                      {...LF.register("email")}
                      placeholder="joueur@example.com"
                      className={inputCls}
                      autoComplete="email"
                      aria-label="Email"
                    />
                  </InputWrap>
                </FormField>

                <FormField label="Mot de passe" error={LF.formState.errors.password?.message}>
                  <InputWrap icon={<Lock size={14} weight="bold" />}>
                    <input
                      type={showPass ? "text" : "password"}
                      {...LF.register("password")}
                      placeholder="••••••••"
                      className={inputCls}
                      autoComplete="current-password"
                      aria-label="Mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="px-3 text-craie/30 hover:text-craie transition-colors cursor-pointer"
                      aria-label="Afficher/Masquer le mot de passe"
                    >
                      {showPass ? <EyeSlash size={14} /> : <Eye size={14} />}
                    </button>
                  </InputWrap>
                </FormField>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  className="w-full shadow-brutal"
                  loading={LF.formState.isSubmitting}
                >
                  Se connecter
                </Button>
              </motion.form>
            )}

            {/* ── INSCRIPTION ───────────────────────── */}
            {mode === "register" && (
              <motion.form
                key="register"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleRegister}
                className="space-y-3"
              >
                {/* Rôle */}
                <FormField label="Je souhaite m'inscrire en tant que :">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "PLAYER", label: "Joueur", icon: SoccerBall },
                      { value: "FIELD_MANAGER", label: "Gérant de terrain", icon: UserIcon },
                    ].map(({ value, label, icon: Icon }) => (
                      <label key={value} className="cursor-pointer">
                        <input type="radio" value={value} {...RF.register("role")} className="sr-only" />
                        <div
                          className={`border-2 p-2.5 text-center transition-all ${
                            RF.watch("role") === value
                              ? "border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet shadow-brutal"
                              : "border-encre/40 bg-encre/50 text-craie/40 hover:border-craie/50"
                          }`}
                        >
                          <Icon size={18} weight="bold" className="mx-auto mb-1" />
                          <div className="font-bold text-xs uppercase font-mono tracking-wider">{label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </FormField>

                {/* Prénom + Nom */}
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Prénom" error={RF.formState.errors.firstName?.message}>
                    <input
                      {...RF.register("firstName")}
                      placeholder="Karim"
                      className="w-full border-2 border-encre/60 bg-encre text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur placeholder-craie/25"
                      aria-label="Prénom"
                    />
                  </FormField>
                  <FormField label="Nom" error={RF.formState.errors.lastName?.message}>
                    <input
                      {...RF.register("lastName")}
                      placeholder="Benzema"
                      className="w-full border-2 border-encre/60 bg-encre text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur placeholder-craie/25"
                      aria-label="Nom"
                    />
                  </FormField>
                </div>

                <FormField label="Email" error={RF.formState.errors.email?.message}>
                  <InputWrap icon={<Envelope size={14} weight="bold" />}>
                    <input
                      type="email"
                      {...RF.register("email")}
                      placeholder="joueur@example.com"
                      className={inputCls}
                      autoComplete="email"
                      aria-label="Email"
                    />
                  </InputWrap>
                </FormField>

                <FormField label="Mot de passe" error={RF.formState.errors.password?.message}>
                  <InputWrap icon={<Lock size={14} weight="bold" />}>
                    <input
                      type={showPass ? "text" : "password"}
                      {...RF.register("password")}
                      placeholder="••••••••"
                      className={inputCls}
                      autoComplete="new-password"
                      aria-label="Mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="px-3 text-craie/30 hover:text-craie cursor-pointer"
                      aria-label="Afficher/Masquer le mot de passe"
                    >
                      {showPass ? <EyeSlash size={14} /> : <Eye size={14} />}
                    </button>
                  </InputWrap>
                </FormField>

                <FormField label="Téléphone (optionnel)">
                  <InputWrap icon={<Phone size={14} weight="bold" />}>
                    <input
                      type="tel"
                      {...RF.register("phone")}
                      placeholder="+33 6 12 34 56 78"
                      className={inputCls}
                      aria-label="Numéro de téléphone"
                    />
                  </InputWrap>
                </FormField>

                <Button
                  variant="secondary"
                  size="md"
                  type="submit"
                  className="w-full shadow-brutal mt-2"
                  loading={RF.formState.isSubmitting}
                >
                  Créer mon compte
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}
