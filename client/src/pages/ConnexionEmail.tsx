import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ConnexionEmail() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.loginEmail.useMutation({
    onSuccess: () => {
      toast.success("Connexion réussie !");
      window.location.href = "/";
    },
    onError: (err) => {
      toast.error(err.message || "Email ou mot de passe incorrect");
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loginMutation.mutate({ email, password });
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
          <h1 className="text-2xl font-bold text-white">studio.studiomanagereurope.eu</h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-text-muted)" }}>
            Gestion RGPD pour salons de tatouage & piercing
          </p>
        </div>

        <Card style={{ background: "var(--brand-card)", border: "1px solid var(--brand-border)" }}>
          <CardHeader>
            <CardTitle className="text-white text-xl">Connexion</CardTitle>
            <CardDescription style={{ color: "var(--brand-text-muted)" }}>
              Accédez à votre espace studio.studiomanagereurope.eu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
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
                <Label htmlFor="password" className="text-white">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {loading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p style={{ color: "var(--brand-text-muted)", fontSize: "0.875rem" }}>
                Pas encore de compte ?{" "}
                <button
                  onClick={() => setLocation("/inscription")}
                  className="underline"
                  style={{ color: "var(--brand-accent)" }}
                >
                  Créer un compte gratuit
                </button>
              </p>
              <p style={{ color: "var(--brand-text-muted)", fontSize: "0.875rem" }}>
                Vous avez un code PIN ?{" "}
                <button
                  onClick={() => setLocation("/")}
                  className="underline"
                  style={{ color: "var(--brand-accent)" }}
                >
                  Connexion par PIN
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
