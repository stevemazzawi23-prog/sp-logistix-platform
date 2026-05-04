import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Pencil, Trash2, Phone, Mail, User, MapPin, Building2, Container } from "lucide-react";
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

type SiteForm = {
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
};

const emptySiteForm: SiteForm = {
  name: "",
  address: "",
  city: "",
  province: "QC",
  postalCode: "",
  notes: "",
};

type UnitForm = {
  unitName: string;
  description: string;
  sortOrder: number;
};

const emptyUnitForm: UnitForm = {
  unitName: "",
  description: "",
  sortOrder: 0,
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

  // Site state
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [siteForm, setSiteForm] = useState<SiteForm>(emptySiteForm);
  const [siteClientId, setSiteClientId] = useState<number | null>(null);
  const [editingSiteId, setEditingSiteId] = useState<number | null>(null);

  // Unit state
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [unitForm, setUnitForm] = useState<UnitForm>(emptyUnitForm);
  const [unitClientId, setUnitClientId] = useState<number | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);

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

  const createSiteMutation = trpc.sites.create.useMutation({
    onSuccess: () => {
      if (siteClientId) utils.sites.listByClient.invalidate({ clientId: siteClientId });
      setSiteDialogOpen(false);
      setSiteForm(emptySiteForm);
      setEditingSiteId(null);
      toast.success("Site de livraison ajouté");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSiteMutation = trpc.sites.update.useMutation({
    onSuccess: () => {
      if (siteClientId) utils.sites.listByClient.invalidate({ clientId: siteClientId });
      setSiteDialogOpen(false);
      setSiteForm(emptySiteForm);
      setEditingSiteId(null);
      toast.success("Site mis à jour");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteSiteMutation = trpc.sites.delete.useMutation({
    onSuccess: () => {
      if (siteClientId) utils.sites.listByClient.invalidate({ clientId: siteClientId });
      toast.success("Site supprimé");
    },
    onError: (err) => toast.error(err.message),
  });

  const createUnitMutation = trpc.clientUnits.create.useMutation({
    onSuccess: () => {
      if (unitClientId) utils.clientUnits.listByClient.invalidate({ clientId: unitClientId });
      setUnitDialogOpen(false);
      setUnitForm(emptyUnitForm);
      setEditingUnitId(null);
      toast.success("Unité ajoutée");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateUnitMutation = trpc.clientUnits.update.useMutation({
    onSuccess: () => {
      if (unitClientId) utils.clientUnits.listByClient.invalidate({ clientId: unitClientId });
      setUnitDialogOpen(false);
      setUnitForm(emptyUnitForm);
      setEditingUnitId(null);
      toast.success("Unité mise à jour");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUnitMutation = trpc.clientUnits.delete.useMutation({
    onSuccess: () => {
      if (unitClientId) utils.clientUnits.listByClient.invalidate({ clientId: unitClientId });
      toast.success("Unité supprimée");
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
    createContactMutation.mutate({ clientId: contactClientId, ...contactForm });
  };

  const handleSiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteClientId) return;
    if (editingSiteId) {
      updateSiteMutation.mutate({ id: editingSiteId, ...siteForm });
    } else {
      createSiteMutation.mutate({ clientId: siteClientId, ...siteForm });
    }
  };

  const handleUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitClientId) return;
    if (editingUnitId) {
      updateUnitMutation.mutate({ id: editingUnitId, ...unitForm });
    } else {
      createUnitMutation.mutate({ clientId: unitClientId, ...unitForm });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des clients</h1>
          <p className="text-muted-foreground">Créez et gérez les comptes clients, leurs contacts et leurs sites de livraison.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier le client" : "Nouveau client"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Code *</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="EX: CLT001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nom du client" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Adresse</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Rue Exemple" />
                </div>
                <div className="space-y-1.5">
                  <Label>Ville</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Montréal" />
                </div>
                <div className="space-y-1.5">
                  <Label>Province</Label>
                  <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="QC" />
                </div>
                <div className="space-y-1.5">
                  <Label>Code postal</Label>
                  <Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="H1A 1A1" />
                </div>
                <div className="space-y-1.5">
                  <Label>Classe</Label>
                  <Input value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} placeholder="Classe" />
                </div>
                <div className="space-y-1.5">
                  <Label>Sous-classe</Label>
                  <Input value={form.sousClasse} onChange={(e) => setForm({ ...form, sousClasse: e.target.value })} placeholder="Sous-classe" />
                </div>
                <div className="space-y-1.5">
                  <Label>Statut du site</Label>
                  <Input value={form.siteStatus} onChange={(e) => setForm({ ...form, siteStatus: e.target.value })} placeholder="Active" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type de gestion</Label>
                  <Input value={form.managementType} onChange={(e) => setForm({ ...form, managementType: e.target.value })} placeholder="Type de gestion" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom BTU</Label>
                  <Input value={form.btuName} onChange={(e) => setForm({ ...form, btuName: e.target.value })} placeholder="BTU" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type de site</Label>
                  <Input value={form.siteType} onChange={(e) => setForm({ ...form, siteType: e.target.value })} placeholder="Delivery Location" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground">
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
              onToggle={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
              onEdit={() => handleEdit(client)}
              onDelete={() => {
                if (confirm(`Supprimer le client "${client.name}" ? Cette action est irréversible.`)) {
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
              onAddSite={() => {
                setSiteClientId(client.id);
                setSiteForm(emptySiteForm);
                setEditingSiteId(null);
                setSiteDialogOpen(true);
              }}
              onEditSite={(site: any) => {
                setSiteClientId(client.id);
                setEditingSiteId(site.id);
                setSiteForm({
                  name: site.name,
                  address: site.address || "",
                  city: site.city || "",
                  province: site.province || "QC",
                  postalCode: site.postalCode || "",
                  notes: site.notes || "",
                });
                setSiteDialogOpen(true);
              }}
              onDeleteSite={(siteId: number) => {
                setSiteClientId(client.id);
                if (confirm("Supprimer ce site de livraison ?")) {
                  deleteSiteMutation.mutate({ id: siteId });
                }
              }}
              onAddUnit={() => {
                setUnitClientId(client.id);
                setUnitForm(emptyUnitForm);
                setEditingUnitId(null);
                setUnitDialogOpen(true);
              }}
              onEditUnit={(unit: any) => {
                setUnitClientId(client.id);
                setEditingUnitId(unit.id);
                setUnitForm({
                  unitName: unit.unitName,
                  description: unit.description || "",
                  sortOrder: unit.sortOrder || 0,
                });
                setUnitDialogOpen(true);
              }}
              onDeleteUnit={(unitId: number) => {
                setUnitClientId(client.id);
                if (confirm("Supprimer cette unité ?")) {
                  deleteUnitMutation.mutate({ id: unitId });
                }
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun client enregistré. Créez votre premier client.</p>
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
                <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Rôle</Label>
                <Input value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })} placeholder="Gérant, Technicien..." />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="514-555-1234" />
              </div>
              <div className="space-y-1.5">
                <Label>Extension</Label>
                <Input value={contactForm.extension} onChange={(e) => setContactForm({ ...contactForm, extension: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Email</Label>
                <Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} type="email" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPrimary" checked={contactForm.isPrimary === 1} onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked ? 1 : 0 })} />
              <Label htmlFor="isPrimary">Contact principal</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createContactMutation.isPending} className="bg-primary text-primary-foreground">Ajouter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnitId ? "Modifier l'unité" : "Ajouter une unité"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUnitSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom de l'unité *</Label>
              <Input
                value={unitForm.unitName}
                onChange={(e) => setUnitForm({ ...unitForm, unitName: e.target.value })}
                required
                placeholder="Ex: Unité 12, Réservoir A, Cuve 3..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optionnel)</Label>
              <Input
                value={unitForm.description}
                onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                placeholder="Capacité, emplacement, notes..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                value={unitForm.sortOrder}
                onChange={(e) => setUnitForm({ ...unitForm, sortOrder: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Les unités sont triées par ordre croissant, puis par nom.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setUnitDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createUnitMutation.isPending || updateUnitMutation.isPending} className="bg-primary text-primary-foreground">
                {editingUnitId ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Site Dialog */}
      <Dialog open={siteDialogOpen} onOpenChange={setSiteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSiteId ? "Modifier le site" : "Ajouter un site de livraison"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSiteSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom du site *</Label>
              <Input value={siteForm.name} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} required placeholder="Ex: Entrepôt principal, Bureau Laval..." />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={siteForm.address} onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })} placeholder="430 rue Isabey" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ville</Label>
                <Input value={siteForm.city} onChange={(e) => setSiteForm({ ...siteForm, city: e.target.value })} placeholder="Montréal" />
              </div>
              <div className="space-y-1.5">
                <Label>Province</Label>
                <Input value={siteForm.province} onChange={(e) => setSiteForm({ ...siteForm, province: e.target.value })} placeholder="QC" />
              </div>
              <div className="space-y-1.5">
                <Label>Code postal</Label>
                <Input value={siteForm.postalCode} onChange={(e) => setSiteForm({ ...siteForm, postalCode: e.target.value })} placeholder="H4P 1T4" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={siteForm.notes} onChange={(e) => setSiteForm({ ...siteForm, notes: e.target.value })} placeholder="Instructions spéciales, accès, etc." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSiteDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createSiteMutation.isPending || updateSiteMutation.isPending} className="bg-primary text-primary-foreground">
                {editingSiteId ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientCard({
  client, expanded, onToggle, onEdit, onDelete,
  onAddContact, onDeleteContact,
  onAddSite, onEditSite, onDeleteSite,
  onAddUnit, onEditUnit, onDeleteUnit,
}: {
  client: any;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddContact: () => void;
  onDeleteContact: (id: number) => void;
  onAddSite: () => void;
  onEditSite: (site: any) => void;
  onDeleteSite: (id: number) => void;
  onAddUnit: () => void;
  onEditUnit: (unit: any) => void;
  onDeleteUnit: (id: number) => void;
}) {
  const { data: contacts } = trpc.contacts.listByClient.useQuery({ clientId: client.id }, { enabled: expanded });
  const { data: sites } = trpc.sites.listByClient.useQuery({ clientId: client.id }, { enabled: expanded });
  const { data: clientUnitsList } = trpc.clientUnits.listByClient.useQuery({ clientId: client.id }, { enabled: expanded });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 cursor-pointer" onClick={onToggle}>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{client.name}</h3>
              <Badge variant="outline">{client.code}</Badge>
              <Badge variant={client.siteStatus === "Active" ? "default" : "secondary"} className="text-xs">
                {client.siteStatus || "Active"}
              </Badge>
              {sites && sites.length > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-[#1a5f3f]/40 text-[#1a5f3f]">
                  <MapPin className="h-3 w-3" />
                  {sites.length} site{sites.length > 1 ? "s" : ""}
                </Badge>
              )}
              {clientUnitsList && clientUnitsList.length > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-blue-500/40 text-blue-600">
                  <Container className="h-3 w-3" />
                  {clientUnitsList.length} unité{clientUnitsList.length > 1 ? "és" : "é"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {client.address && `${client.address}, `}
              {client.city && `${client.city} `}
              {client.province && `${client.province} `}
              {client.postalCode}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-1">
            {/* Info grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
              <div><span className="text-muted-foreground">Classe:</span> <span className="font-medium">{client.classe || "—"}</span></div>
              <div><span className="text-muted-foreground">Sous-classe:</span> <span className="font-medium">{client.sousClasse || "—"}</span></div>
              <div><span className="text-muted-foreground">Gestion:</span> <span className="font-medium">{client.managementType || "—"}</span></div>
              <div><span className="text-muted-foreground">BTU:</span> <span className="font-medium">{client.btuName || "—"}</span></div>
            </div>

            <Tabs defaultValue="sites" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sites" className="gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Sites de livraison
                  {sites && sites.length > 0 && (
                    <span className="ml-1 bg-[#1a5f3f] text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{sites.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="units" className="gap-1.5">
                  <Container className="h-3.5 w-3.5" />
                  Unités
                  {clientUnitsList && clientUnitsList.length > 0 && (
                    <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{clientUnitsList.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="contacts" className="gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Contacts
                  {contacts && contacts.length > 0 && (
                    <span className="ml-1 bg-muted text-muted-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">{contacts.length}</span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* SITES TAB */}
              <TabsContent value="sites" className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Sites visibles dans l'application APK</p>
                  <Button variant="outline" size="sm" onClick={onAddSite} className="gap-1 border-[#1a5f3f]/40 text-[#1a5f3f] hover:bg-[#1a5f3f]/5">
                    <Plus className="h-3 w-3" />
                    Ajouter un site
                  </Button>
                </div>
                {sites && sites.length > 0 ? (
                  <div className="space-y-2">
                    {sites.map((site) => (
                      <div key={site.id} className="flex items-start justify-between p-3 rounded-lg border border-border bg-muted/20 text-sm">
                        <div className="flex items-start gap-2.5">
                          <Building2 className="h-4 w-4 text-[#1a5f3f] mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-foreground">{site.name}</p>
                            {(site.address || site.city) && (
                              <p className="text-muted-foreground text-xs mt-0.5">
                                {site.address && `${site.address}`}
                                {site.city && `, ${site.city}`}
                                {site.province && ` ${site.province}`}
                                {site.postalCode && ` ${site.postalCode}`}
                              </p>
                            )}
                            {site.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{site.notes}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditSite(site)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onDeleteSite(site.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                    <MapPin className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                    <p className="text-xs">Aucun site de livraison. Cliquez sur "Ajouter un site".</p>
                  </div>
                )}
              </TabsContent>

              {/* UNITS TAB */}
              <TabsContent value="units" className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Unités pré-configurées pour ce client (visibles dans l'APK lors d'une livraison)</p>
                  <Button variant="outline" size="sm" onClick={onAddUnit} className="gap-1 border-blue-500/40 text-blue-600 hover:bg-blue-50">
                    <Plus className="h-3 w-3" />
                    Ajouter une unité
                  </Button>
                </div>
                {clientUnitsList && clientUnitsList.length > 0 ? (
                  <div className="space-y-2">
                    {clientUnitsList.map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-blue-50/30 text-sm">
                        <div className="flex items-center gap-2.5">
                          <Container className="h-4 w-4 text-blue-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-foreground">{unit.unitName}</p>
                            {unit.description && (
                              <p className="text-muted-foreground text-xs mt-0.5">{unit.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditUnit(unit)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onDeleteUnit(unit.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                    <Container className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                    <p className="text-xs">Aucune unité configurée. Cliquez sur "Ajouter une unité".</p>
                  </div>
                )}
              </TabsContent>

              {/* CONTACTS TAB */}
              <TabsContent value="contacts" className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Personnes à contacter pour ce client</p>
                  <Button variant="outline" size="sm" onClick={onAddContact}>
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
                {contacts && contacts.length > 0 ? (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-2 rounded border text-sm">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="font-medium">{contact.name}</span>
                            {contact.isPrimary === 1 && <Badge variant="secondary" className="ml-2 text-xs">Principal</Badge>}
                            {contact.role && <span className="text-muted-foreground ml-2">({contact.role})</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {contact.phone && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />{contact.phone}
                            </span>
                          )}
                          {contact.email && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />{contact.email}
                            </span>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => onDeleteContact(contact.id)} className="h-7 w-7 p-0 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Aucun contact. Cliquez sur "Ajouter" pour en créer un.</p>
                )}
              </TabsContent>
            </Tabs>
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
