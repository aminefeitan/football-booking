"use client";

import { useState } from "react";
import { User, Lock, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import { updateProfile, updatePassword } from "@/services/auth.service";
import { Button } from "@/components/ui/Button";

export default function ProfilPage() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profileMsg, setProfileMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      await refreshUser();
      setProfileMsg({ text: "Profil mis à jour avec succès !" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour.";
      setProfileMsg({ text: msg, error: true });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "Les nouveaux mots de passe ne correspondent pas.", error: true });
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordMsg({ text: "Le mot de passe doit comporter entre 8 et 72 caractères.", error: true });
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ text: "Mot de passe modifié avec succès !" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors du changement de mot de passe.";
      setPasswordMsg({ text: msg, error: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-nuit-pelouse py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="font-display font-black text-3xl sm:text-4xl uppercase text-craie tracking-tight">
              Mon <span className="text-vert-projecteur">Profil</span>
            </h1>
            <p className="font-mono text-xs text-craie/60 uppercase tracking-widest mt-1">
              Gérez vos informations personnelles et votre sécurité
            </p>
          </div>

          {/* Formulaire Informations Générales */}
          <div className="border-2 border-encre bg-encre p-6 shadow-brutal space-y-4">
            <div className="flex items-center gap-2 border-b border-encre/60 pb-3">
              <User size={20} weight="bold" className="text-vert-projecteur" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-craie">
                Informations du compte
              </h2>
            </div>

            {profileMsg && (
              <div
                className={`p-3 border-2 font-mono text-xs flex items-center gap-2 ${
                  profileMsg.error
                    ? "border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet"
                    : "border-vert-projecteur bg-vert-projecteur/10 text-vert-projecteur"
                }`}
              >
                {profileMsg.error ? <WarningCircle size={16} /> : <CheckCircle size={16} />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Prénom</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Nom</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Email</label>
                  <input
                    type="email"
                    value={user?.email ?? ""}
                    disabled
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse/40 text-craie/40 px-3 py-2 text-sm cursor-not-allowed outline-none"
                  />
                  <p className="font-mono text-[10px] text-craie/30">L'email n'est pas modifiable.</p>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Téléphone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6 00 00 00 00"
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs uppercase text-craie/60 block">Rôle actuel</label>
                <div className="font-mono text-xs font-bold uppercase text-vert-projecteur px-3 py-2 bg-nuit-pelouse border-2 border-encre/60 w-fit">
                  {user?.role}
                </div>
              </div>

              <Button type="submit" variant="primary" loading={profileLoading} className="shadow-brutal">
                Enregistrer les modifications
              </Button>
            </form>
          </div>

          {/* Formulaire Modification du mot de passe */}
          <div className="border-2 border-encre bg-encre p-6 shadow-brutal space-y-4">
            <div className="flex items-center gap-2 border-b border-encre/60 pb-3">
              <Lock size={20} weight="bold" className="text-orange-sifflet" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-craie">
                Sécurité du compte (Mot de passe)
              </h2>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 border-2 font-mono text-xs flex items-center gap-2 ${
                  passwordMsg.error
                    ? "border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet"
                    : "border-vert-projecteur bg-vert-projecteur/10 text-vert-projecteur"
                }`}
              >
                {passwordMsg.error ? <WarningCircle size={16} /> : <CheckCircle size={16} />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-xs uppercase text-craie/60 block">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 8 caractères"
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirmer"
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur"
                  />
                </div>
              </div>

              <Button type="submit" variant="secondary" loading={passwordLoading} className="shadow-brutal">
                Mettre à jour le mot de passe
              </Button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
