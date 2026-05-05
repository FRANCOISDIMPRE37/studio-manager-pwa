import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Inscription() {
  const [, setLocation] = useLocation();
  const [nomSalon, setNomSalon] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Compte créé avec succès ! Bienvenue dans Studio Manager.");
      // Recharger pour déclencher la sync cloud et l'onboarding
      window.location.href = "/";
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la création du compte");
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);
    registerMutation.mutate({ email, password, nomSalon });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--brand-navy)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_intemporelle_293813dd.jpg"
            alt="Intemporelle RGPD & Cybersécurité"
            className="rounded-lg mb-4"
            style={{ width: "120px", objectFit: "contain" }}
          />
          <h1 className="text-2xl font-bold text-white">studio.intemporelle.eu</h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-text-muted)" }}>
            Gestion RGPD pour salons de tatouage & piercing
          </p>
        </div>

        <Card style={{ background: "var(--brand-card)", border: "1px solid var(--brand-border)" }}>
          <CardHeader>
            <CardTitle className="text-white text-xl">Créer votre compte</CardTitle>
            <CardDescription style={{ color: "var(--brand-text-muted)" }}>
              Essai gratuit 30 jours — sans carte bancaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomSalon" className="text-white">Nom de votre salon *</Label>
                <Input
                  id="nomSalon"
                  type="text"
                  placeholder="Ex: Clip's Mode, Studio Ink..."
                  value={nomSalon}
                  onChange={(e) => setNomSalon(e.target.value)}
                  required
                  minLength={2}
                  style={{
                    background: "var(--brand-input)",
                    border: "1px solid var(--brand-border)",
                    color: "white",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email professionnel *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@votresalon.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    background: "var(--brand-input)",
                    border: "1px solid var(--brand-border)",
                    color: "white",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{
                    background: "var(--brand-input)",
                    border: "1px solid var(--brand-border)",
                    color: "white",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Répétez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    background: "var(--brand-input)",
                    border: "1px solid var(--brand-border)",
                    color: "white",
                  }}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2"
                style={{
                  background: "var(--brand-accent)",
                  color: "white",
                  fontWeight: "600",
                }}
              >
                {loading ? "Création en cours..." : "Créer mon compte gratuitement"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p style={{ color: "var(--brand-text-muted)", fontSize: "0.875rem" }}>
                Déjà un compte ?{" "}
                <button
                  onClick={() => setLocation("/connexion")}
                  className="underline"
                  style={{ color: "var(--brand-accent)" }}
                >
                  Se connecter
                </button>
              </p>
            </div>

            <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-xs text-center" style={{ color: "var(--brand-text-muted)" }}>
                🔒 Vos données sont hébergées en France (OVH) et protégées conformément au RGPD.
                <br />
                Aucune donnée client n'est partagée avec des tiers.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs mt-4" style={{ color: "var(--brand-text-muted)" }}>
          En créant un compte, vous acceptez nos{" "}
          <a href="/mentions-legales" className="underline" style={{ color: "var(--brand-accent)" }}>
            Mentions légales
          </a>{" "}
          et notre{" "}
          <a href="/confidentialite" className="underline" style={{ color: "var(--brand-accent)" }}>
            Politique de confidentialité
          </a>
        </p>
      </div>
    </div>
  );
}
