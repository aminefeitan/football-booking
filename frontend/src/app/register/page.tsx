"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeSlash, Envelope, Lock, Phone, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Footer } from "@/components/ui/Footer";

const registerSchema = z.object({
  firstName: z.string().min(2, "Prénom requis (2 caractères min)"),
  lastName: z.string().min(2, "Nom requis (2 caractères min)"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Au moins 8 caractères").max(72, "Au plus 72 caractères"),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const { register: registerUser } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (data: RegisterForm) => {
    try {
      setError(null);
      await registerUser({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
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
    }
  });

  const inputCls =
    "flex-1 bg-transparent text-craie px-3 py-2.5 text-sm outline-none placeholder-craie/25 font-body";

  return (
    <div className="min-h-screen bg-nuit-pelouse flex flex-col justify-between">
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link href="/" className="font-display text-3xl font-black text-vert-projecteur uppercase tracking-wider">
              Foot<span className="text-orange-sifflet">Book</span>
            </Link>
            <p className="font-mono text-xs text-craie/50 uppercase tracking-widest mt-1">
              Créer un compte Joueur
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-orange-sifflet bg-orange-sifflet/15 text-orange-sifflet px-3.5 py-2.5 font-mono text-xs font-bold shadow-brutal flex items-center gap-2.5"
            >
              <WarningCircle size={18} weight="bold" className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={onSubmit} className="border-2 border-encre bg-encre p-6 shadow-brutal space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-craie/40 uppercase tracking-widest font-mono block">
                  Prénom
                </label>
                <input
                  {...register("firstName")}
                  placeholder="Karim"
                  className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur placeholder-craie/25"
                />
                {errors.firstName?.message && (
                  <p className="text-orange-sifflet text-[11px] font-mono">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-craie/40 uppercase tracking-widest font-mono block">
                  Nom
                </label>
                <input
                  {...register("lastName")}
                  placeholder="Benzema"
                  className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur placeholder-craie/25"
                />
                {errors.lastName?.message && (
                  <p className="text-orange-sifflet text-[11px] font-mono">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-craie/40 uppercase tracking-widest font-mono block">
                Email
              </label>
              <div className="flex items-center border-2 border-encre/60 bg-nuit-pelouse focus-within:border-vert-projecteur transition-colors">
                <span className="pl-3 text-vert-projecteur shrink-0">
                  <Envelope size={14} weight="bold" />
                </span>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="joueur@example.com"
                  className={inputCls}
                  autoComplete="email"
                />
              </div>
              {errors.email?.message && (
                <p className="text-orange-sifflet text-xs font-mono">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-craie/40 uppercase tracking-widest font-mono block">
                Mot de passe (8–72 caractères)
              </label>
              <div className="flex items-center border-2 border-encre/60 bg-nuit-pelouse focus-within:border-vert-projecteur transition-colors">
                <span className="pl-3 text-vert-projecteur shrink-0">
                  <Lock size={14} weight="bold" />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className={inputCls}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="px-3 text-craie/30 hover:text-craie cursor-pointer"
                >
                  {showPass ? <EyeSlash size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="text-orange-sifflet text-xs font-mono">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-craie/40 uppercase tracking-widest font-mono block">
                Téléphone (optionnel)
              </label>
              <div className="flex items-center border-2 border-encre/60 bg-nuit-pelouse focus-within:border-vert-projecteur transition-colors">
                <span className="pl-3 text-vert-projecteur shrink-0">
                  <Phone size={14} weight="bold" />
                </span>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="+212 6 12 34 56 78"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="bg-nuit-pelouse border border-craie/15 p-3 text-[11px] font-mono text-craie/60 text-center space-y-1">
              <div>💡 Inscription automatique en tant que <strong className="text-vert-projecteur">Joueur</strong>.</div>
              <div className="text-orange-sifflet font-bold">
                Vous souhaitez devenir gérant de terrain ? Contactez un administrateur.
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              type="submit"
              className="w-full shadow-brutal"
              loading={isSubmitting}
            >
              Créer mon compte joueur
            </Button>

            <div className="pt-2 text-center text-xs font-mono text-craie/50">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-vert-projecteur hover:underline font-bold">
                Se connecter
              </Link>
            </div>
          </form>
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
