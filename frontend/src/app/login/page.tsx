"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeSlash, Envelope, Lock, WarningCircle } from "@phosphor-icons/react";
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
  const { login } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (data: LoginForm) => {
    try {
      setError(null);
      const res = await login({
        email: data.email.trim(),
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
    }
  });

  const inputCls =
    "flex-1 bg-transparent text-craie px-3 py-2.5 text-sm outline-none placeholder-craie/25 font-body";

  return (
    <div className="min-h-screen bg-nuit-pelouse flex flex-col justify-between">
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <Link href="/" className="font-display text-3xl font-black text-vert-projecteur uppercase tracking-wider">
              Foot<span className="text-orange-sifflet">Book</span>
            </Link>
            <p className="font-mono text-xs text-craie/50 uppercase tracking-widest mt-1">Connexion à votre compte</p>
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
                  placeholder="votre@email.com"
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
                Mot de passe
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="px-3 text-craie/30 hover:text-craie transition-colors cursor-pointer"
                >
                  {showPass ? <EyeSlash size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="text-orange-sifflet text-xs font-mono">{errors.password.message}</p>
              )}
            </div>

            <Button variant="primary" size="md" type="submit" className="w-full shadow-brutal" loading={isSubmitting}>
              Se connecter
            </Button>

            <div className="pt-2 text-center text-xs font-mono text-craie/50">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-vert-projecteur hover:underline font-bold">
                Créer un compte joueur
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
