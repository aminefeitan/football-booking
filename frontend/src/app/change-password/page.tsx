"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updatePassword } from "@/services/auth.service";
import { Button } from "@/components/ui/Button";
import { Lock, WarningCircle, SignOut, ShieldCheck } from "@phosphor-icons/react";

export default function ChangePasswordPage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8 || newPassword.length > 72) {
      setError("Le nouveau mot de passe doit comporter entre 8 et 72 caractères.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("Le nouveau mot de passe doit être différent de l'actuel.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      await refreshUser();
      if (user?.role === "ADMIN") {
        router.push("/admin");
      } else if (user?.role === "FIELD_MANAGER") {
        router.push("/dashboard");
      } else {
        router.push("/terrains");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4 text-craie relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-jaune-carton/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl bg-encre/90 border border-craie/15 p-8 space-y-6 shadow-2xl backdrop-blur-2xl relative z-10">
        <div className="space-y-2 text-center">
          <div className="inline-flex p-3 bg-jaune-carton/10 text-jaune-carton border border-jaune-carton/30 rounded-2xl mb-1">
            <Lock size={28} weight="bold" />
          </div>
          <h1 className="font-display font-black text-2xl uppercase tracking-wider text-craie">
            Changement de mot de passe obligatoire
          </h1>
          <p className="font-sans text-xs text-craie/65 leading-relaxed">
            Pour des raisons de sécurité, vous devez définir un nouveau mot de passe personnel avant de continuer.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2.5">
            <WarningCircle size={18} weight="bold" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-craie/60">
              Mot de passe actuel (ou temporaire)
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl bg-nuit-pelouse border border-craie/15 px-3.5 py-2.5 text-craie text-sm font-sans focus:border-jaune-carton outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-craie/60">
              Nouveau mot de passe (8–72 caractères)
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={72}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl bg-nuit-pelouse border border-craie/15 px-3.5 py-2.5 text-craie text-sm font-sans focus:border-jaune-carton outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-craie/60">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={72}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl bg-nuit-pelouse border border-craie/15 px-3.5 py-2.5 text-craie text-sm font-sans focus:border-jaune-carton outline-none"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full shadow-lg shadow-jaune-carton/20 font-bold"
              disabled={loading}
            >
              {loading ? "Mise à jour…" : "Valider mon nouveau mot de passe"}
            </Button>
          </div>
        </form>

        <div className="pt-3 text-center border-t border-craie/10">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-craie/40 hover:text-orange-sifflet transition-colors cursor-pointer"
          >
            <SignOut size={16} weight="bold" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
