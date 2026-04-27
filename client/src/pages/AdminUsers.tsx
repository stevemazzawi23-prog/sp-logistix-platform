import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, KeyRound, Trash2, ShieldCheck, User } from "lucide-react";

export default function AdminUsers() {
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [resetPassword, setResetPassword] = useState("");

  const utils = trpc.useUtils();
  const { data: users = [], isLoading } = trpc.users.list.useQuery();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Compte créé avec succès");
      utils.users.list.invalidate();
      setCreateOpen(false);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("user");
    },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Mot de passe réinitialisé");
      setResetOpen(null);
      setResetPassword("");
    },
    onError: (err) => toast.error(err.message),
  });

  const roleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      utils.users.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Compte supprimé");
      utils.users.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a5f3f]">Gestion des comptes</h1>
            <p className="text-gray-500 text-sm mt-1">Créez et gérez les accès au portail</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a5f3f] hover:bg-[#2d8659] text-white gap-2">
                <UserPlus className="h-4 w-4" />
                Nouveau compte
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#1a5f3f]">Créer un compte</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Nom complet</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jean Dupont" />
                </div>
                <div className="space-y-1.5">
                  <Label>Adresse email</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jean@exemple.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Mot de passe temporaire</Label>
                  <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 caractères" />
                  <p className="text-xs text-gray-400">L'utilisateur devra le changer à sa première connexion</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Rôle</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as "user" | "admin")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Client (accès limité)</SelectItem>
                      <SelectItem value="admin">Administrateur (accès complet)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-[#1a5f3f] hover:bg-[#2d8659] text-white"
                  onClick={() => createMutation.mutate({ name: newName, email: newEmail, password: newPassword, role: newRole })}
                  disabled={createMutation.isPending || !newName || !newEmail || !newPassword}
                >
                  {createMutation.isPending ? "Création..." : "Créer le compte"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-700">
              {users.length} compte{users.length !== 1 ? "s" : ""} enregistré{users.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 border-2 border-[#1a5f3f]/30 border-t-[#1a5f3f] rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Aucun compte créé</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "—"}</TableCell>
                      <TableCell className="text-gray-500">{user.email || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === "admin" ? "default" : "secondary"}
                          className={user.role === "admin" ? "bg-[#1a5f3f] text-white" : ""}
                        >
                          {user.role === "admin" ? (
                            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Admin</span>
                          ) : (
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> Client</span>
                          )}
                        </Badge>
                        {user.mustChangePassword === 1 && (
                          <Badge variant="outline" className="ml-1 text-orange-600 border-orange-300 text-xs">
                            MDP temporaire
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString("fr-CA") : "Jamais"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle role */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-500 hover:text-[#1a5f3f]"
                            onClick={() => roleMutation.mutate({ id: user.id, role: user.role === "admin" ? "user" : "admin" })}
                            title={user.role === "admin" ? "Rétrograder en client" : "Promouvoir en admin"}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>

                          {/* Reset password */}
                          <Dialog open={resetOpen === user.id} onOpenChange={(o) => { setResetOpen(o ? user.id : null); setResetPassword(""); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500 hover:text-blue-600" title="Réinitialiser le mot de passe">
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 mt-2">
                                <p className="text-sm text-gray-500">Nouveau mot de passe temporaire pour <strong>{user.name}</strong></p>
                                <Input
                                  type="text"
                                  value={resetPassword}
                                  onChange={(e) => setResetPassword(e.target.value)}
                                  placeholder="Nouveau mot de passe (min. 6 car.)"
                                />
                                <Button
                                  className="w-full bg-[#1a5f3f] hover:bg-[#2d8659] text-white"
                                  onClick={() => resetMutation.mutate({ id: user.id, newPassword: resetPassword })}
                                  disabled={resetMutation.isPending || resetPassword.length < 6}
                                >
                                  {resetMutation.isPending ? "Enregistrement..." : "Réinitialiser"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-500 hover:text-red-600"
                            onClick={() => {
                              if (confirm(`Supprimer le compte de ${user.name} ?`)) {
                                deleteMutation.mutate({ id: user.id });
                              }
                            }}
                            title="Supprimer le compte"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-700 font-medium mb-1">Comment créer votre premier compte admin ?</p>
            <p className="text-xs text-blue-600">
              1. Cliquez sur "Nouveau compte" ci-dessus<br />
              2. Entrez votre email et un mot de passe temporaire<br />
              3. Choisissez le rôle "Administrateur"<br />
              4. Connectez-vous avec ces identifiants sur le portail
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
