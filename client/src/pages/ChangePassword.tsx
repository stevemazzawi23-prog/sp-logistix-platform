import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from "lucide-react";

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const utils = trpc.useUtils();
  const changeMutation = trpc.auth.changePassword.useMutation({
    onSuccess: async () => {
      setSuccess(true);
      await utils.auth.me.invalidate();
      setTimeout(() => setLocation("/"), 2000);
    },
    onError: (err) => {
      setError(err.message || "Erreur lors du changement de mot de passe");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }
    changeMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2438] via-[#1a5f3f] to-[#0f2438] p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-2xl mb-4">
            <img src="/logo.png" alt="SP Logistix" className="h-16 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h1 className="text-white text-2xl font-bold">SP Logistix</h1>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center text-[#1a5f3f]">Changer votre mot de passe</CardTitle>
            <CardDescription className="text-center">
              Pour des raisons de sécurité, vous devez changer votre mot de passe temporaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-green-700 font-medium">Mot de passe changé avec succès !</p>
                <p className="text-gray-500 text-sm">Redirection en cours...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label className="text-[#1a5f3f] font-medium">Mot de passe temporaire</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="Mot de passe actuel"
                      disabled={changeMutation.isPending}
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#1a5f3f] font-medium">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="Minimum 6 caractères"
                      disabled={changeMutation.isPending}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#1a5f3f] font-medium">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Répétez le nouveau mot de passe"
                      disabled={changeMutation.isPending}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1a5f3f] hover:bg-[#2d8659] text-white font-semibold py-2.5"
                  disabled={changeMutation.isPending}
                >
                  {changeMutation.isPending ? "Enregistrement..." : "Changer le mot de passe"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
