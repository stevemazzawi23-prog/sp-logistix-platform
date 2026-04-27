import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
import { Truck, Plus, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

function AdminTicketsContent() {
  const utils = trpc.useUtils();
  const { data: allTickets, isLoading } = trpc.tickets.listAll.useQuery();
  const { data: allClients } = trpc.clients.list.useQuery();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    clientId: "",
    ticketNumber: "",
    locationCode: "",
    volumeTotalDef: "",
    volumeTotal: "",
    pieces: "",
    duration: "",
    deliveryDate: "",
  });

  const createMutation = trpc.tickets.create.useMutation({
    onSuccess: () => {
      utils.tickets.listAll.invalidate();
      setDialogOpen(false);
      setForm({
        clientId: "",
        ticketNumber: "",
        locationCode: "",
        volumeTotalDef: "",
        volumeTotal: "",
        pieces: "",
        duration: "",
        deliveryDate: "",
      });
      toast.success("Bordereau créé avec succès");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      clientId: parseInt(form.clientId),
      ticketNumber: form.ticketNumber,
      locationCode: form.locationCode || undefined,
      volumeTotalDef: form.volumeTotalDef || undefined,
      volumeTotal: form.volumeTotal,
      pieces: form.pieces ? parseInt(form.pieces) : undefined,
      duration: form.duration || undefined,
      deliveryDate: form.deliveryDate,
    });
  };

  const filteredTickets = useMemo(() => {
    if (!allTickets) return [];
    if (!search.trim()) return allTickets;
    const s = search.toLowerCase();
    return allTickets.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(s) ||
        (t.locationCode && t.locationCode.toLowerCase().includes(s))
    );
  }, [allTickets, search]);

  // Map clientId to name
  const clientMap = useMemo(() => {
    const map: Record<number, string> = {};
    allClients?.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [allClients]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Tous les bordereaux
          </h1>
          <p className="text-muted-foreground">
            Gérez l'ensemble des bordereaux de livraison.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau bordereau
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter un bordereau</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Client *</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => setForm({ ...form, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {allClients?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>No. Ticket *</Label>
                  <Input
                    value={form.ticketNumber}
                    onChange={(e) =>
                      setForm({ ...form, ticketNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Code lieu</Label>
                  <Input
                    value={form.locationCode}
                    onChange={(e) =>
                      setForm({ ...form, locationCode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Vol. Déf. (L)</Label>
                  <Input
                    value={form.volumeTotalDef}
                    onChange={(e) =>
                      setForm({ ...form, volumeTotalDef: e.target.value })
                    }
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Vol. Total (L) *</Label>
                  <Input
                    value={form.volumeTotal}
                    onChange={(e) =>
                      setForm({ ...form, volumeTotal: e.target.value })
                    }
                    required
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Unités</Label>
                  <Input
                    value={form.pieces}
                    onChange={(e) =>
                      setForm({ ...form, pieces: e.target.value })
                    }
                    type="number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Durée</Label>
                  <Input
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    placeholder="0:45"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Date de livraison *</Label>
                  <Input
                    value={form.deliveryDate}
                    onChange={(e) =>
                      setForm({ ...form, deliveryDate: e.target.value })
                    }
                    required
                    type="date"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary text-primary-foreground"
                >
                  Créer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Bordereaux ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Client
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      No. Ticket
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Volume (L)
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Unités
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Durée
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="py-3 px-3">
                        {clientMap[ticket.clientId] || `#${ticket.clientId}`}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {ticket.ticketNumber}
                      </td>
                      <td className="py-3 px-3">
                        {new Date(ticket.deliveryDate).toLocaleDateString(
                          "fr-CA"
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-medium">
                        {parseFloat(
                          (ticket.volumeTotal as string) || "0"
                        ).toLocaleString("fr-CA", {
                          maximumFractionDigits: 1,
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {ticket.pieces || 0}
                      </td>
                      <td className="py-3 px-3">{ticket.duration || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aucun bordereau trouvé.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminTickets() {
  return (
    <DashboardLayout>
      <AdminTicketsContent />
    </DashboardLayout>
  );
}
