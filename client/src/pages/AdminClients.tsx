import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Plus, Pencil, Trash2, Phone, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ClientForm = {
  code: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  classe: string;
  sousClasse: string;
  siteStatus: string;
  managementType: string;
  btuName: string;
  siteType: string;
};

const emptyForm: ClientForm = {
  code: "",
  name: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  classe: "",
  sousClasse: "",
  siteStatus: "Active",
  managementType: "",
  btuName: "",
  siteType: "Delivery Location",
};

type ContactForm = {
  name: string;
  role: string;
  phone: string;
  extension: string;
  email: string;
  isPrimary: number;
};

const emptyContactForm: ContactForm = {
  name: "",
  role: "",
  phone: "",
  extension: "",
  email: "",
  isPrimary: 0,
};

function AdminClientsContent() {
  const utils = trpc.useUtils();
  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  // Contact state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm);
  const [contactClientId, setContactClientId] = useState<number | null>(null);

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Client créé avec succès");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success("Client mis à jour");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      toast.success("Client supprimé");
    },
    onError: (err) => toast.error(err.message),
  });

  const createContactMutation = trpc.contacts.create.useMutation({
    onSuccess: () => {
      if (contactClientId) {
        utils.contacts.listByClient.invalidate({ clientId: contactClientId });
      }
      setContactDialogOpen(false);
      setContactForm(emptyContactForm);
      toast.success("Contact ajouté");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteContactMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      if (contactClientId) {
        utils.contacts.listByClient.invalidate({ clientId: contactClientId });
      }
      toast.success("Contact supprimé");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (client: any) => {
    setEditingId(client.id);
    setForm({
      code: client.code,
      name: client.name,
      address: client.address || "",
      city: client.city || "",
      province: client.province || "",
      postalCode: client.postalCode || "",
      classe: client.classe || "",
      sousClasse: client.sousClasse || "",
      siteStatus: client.siteStatus || "Active",
      managementType: client.managementType || "",
      btuName: client.btuName || "",
      siteType: client.siteType || "Delivery Location",
    });
    setDialogOpen(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactClientId) return;
    createContactMutation.mutate({
      clientId: contactClientId,
      ...contactForm,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestion des clients
          </h1>
          <p className="text-muted-foreground">
            Créez et gérez les comptes clients et leurs fiches.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Modifier le client" : "Nouveau client"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Code *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value })
                    }
                    required
                    placeholder="EX: CLT001"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                    placeholder="Nom du client"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Adresse</Label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="123 Rue Exemple"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ville</Label>
                  <Input
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                    placeholder="Montréal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Province</Label>
                  <Input
                    value={form.province}
                    onChange={(e) =>
                      setForm({ ...form, province: e.target.value })
                    }
                    placeholder="QC"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Code postal</Label>
                  <Input
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm({ ...form, postalCode: e.target.value })
                    }
                    placeholder="H1A 1A1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Classe</Label>
                  <Input
                    value={form.classe}
                    onChange={(e) =>
                      setForm({ ...form, classe: e.target.value })
                    }
                    placeholder="Classe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sous-classe</Label>
                  <Input
                    value={form.sousClasse}
                    onChange={(e) =>
                      setForm({ ...form, sousClasse: e.target.value })
                    }
                    placeholder="Sous-classe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Statut du site</Label>
                  <Input
                    value={form.siteStatus}
                    onChange={(e) =>
                      setForm({ ...form, siteStatus: e.target.value })
                    }
                    placeholder="Active"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type de gestion</Label>
                  <Input
                    value={form.managementType}
                    onChange={(e) =>
                      setForm({ ...form, managementType: e.target.value })
                    }
                    placeholder="Type de gestion"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom BTU</Label>
                  <Input
                    value={form.btuName}
                    onChange={(e) =>
                      setForm({ ...form, btuName: e.target.value })
                    }
                    placeholder="BTU"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type de site</Label>
                  <Input
                    value={form.siteType}
                    onChange={(e) =>
                      setForm({ ...form, siteType: e.target.value })
                    }
                    placeholder="Delivery Location"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="bg-primary text-primary-foreground"
                >
                  {editingId ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : clients && clients.length > 0 ? (
        <div className="space-y-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              expanded={expandedClient === client.id}
              onToggle={() =>
                setExpandedClient(
                  expandedClient === client.id ? null : client.id
                )
              }
              onEdit={() => handleEdit(client)}
              onDelete={() => {
                if (
                  confirm(
                    `Supprimer le client "${client.name}" ? Cette action est irréversible.`
                  )
                ) {
                  deleteMutation.mutate({ id: client.id });
                }
              }}
              onAddContact={() => {
                setContactClientId(client.id);
                setContactForm(emptyContactForm);
                setContactDialogOpen(true);
              }}
              onDeleteContact={(contactId: number) => {
                setContactClientId(client.id);
                if (confirm("Supprimer ce contact ?")) {
                  deleteContactMutation.mutate({ id: contactId });
                }
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucun client enregistré. Créez votre premier client.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rôle</Label>
                <Input
                  value={contactForm.role}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, role: e.target.value })
                  }
                  placeholder="Gérant, Technicien..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                  placeholder="514-555-1234"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Extension</Label>
                <Input
                  value={contactForm.extension}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      extension: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Email</Label>
                <Input
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  type="email"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={contactForm.isPrimary === 1}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    isPrimary: e.target.checked ? 1 : 0,
                  })
                }
              />
              <Label htmlFor="isPrimary">Contact principal</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setContactDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createContactMutation.isPending}
                className="bg-primary text-primary-foreground"
              >
                Ajouter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientCard({
  client,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddContact,
  onDeleteContact,
}: {
  client: any;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddContact: () => void;
  onDeleteContact: (id: number) => void;
}) {
  const { data: contacts } = trpc.contacts.listByClient.useQuery(
    { clientId: client.id },
    { enabled: expanded }
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div
            className="flex-1 cursor-pointer"
            onClick={onToggle}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{client.name}</h3>
              <Badge variant="outline">{client.code}</Badge>
              <Badge
                variant={
                  client.siteStatus === "Active" ? "default" : "secondary"
                }
                className="text-xs"
              >
                {client.siteStatus || "Active"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {client.address && `${client.address}, `}
              {client.city && `${client.city} `}
              {client.province && `${client.province} `}
              {client.postalCode}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Classe:</span>{" "}
                <span className="font-medium">{client.classe || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sous-classe:</span>{" "}
                <span className="font-medium">{client.sousClasse || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gestion:</span>{" "}
                <span className="font-medium">
                  {client.managementType || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">BTU:</span>{" "}
                <span className="font-medium">{client.btuName || "—"}</span>
              </div>
            </div>

            {/* Contacts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contacts
                </h4>
                <Button variant="outline" size="sm" onClick={onAddContact}>
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>
              {contacts && contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-2 rounded border text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium">{contact.name}</span>
                          {contact.isPrimary === 1 && (
                            <Badge
                              variant="secondary"
                              className="ml-2 text-xs"
                            >
                              Principal
                            </Badge>
                          )}
                          {contact.role && (
                            <span className="text-muted-foreground ml-2">
                              ({contact.role})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {contact.phone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.email && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteContact(contact.id)}
                          className="h-7 w-7 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aucun contact. Cliquez sur "Ajouter" pour en créer un.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminClients() {
  return (
    <DashboardLayout>
      <AdminClientsContent />
    </DashboardLayout>
  );
}
