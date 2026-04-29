import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
import { Truck, Plus, Search, ChevronDown, ChevronRight, Clock, User, MapPin, Smartphone, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// Component to display units grid for a specific ticket
function TicketUnitsGrid({ ticketId }: { ticketId: number }) {
  const { data: units, isLoading } = trpc.units.listByTicket.useQuery({ ticketId });

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (!units || units.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        Aucun détail d'unité disponible pour ce bordereau.
      </div>
    );
  }

  const total = units.reduce((sum, u) => sum + parseFloat((u.liters as string) || "0"), 0);

  return (
    <div className="p-4 bg-muted/10">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Détail des unités remplies
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary/5 border-b border-border">
              <th className="text-left py-2 px-4 font-semibold text-foreground">#</th>
              <th className="text-left py-2 px-4 font-semibold text-foreground">Unité / Réservoir</th>
              <th className="text-right py-2 px-4 font-semibold text-foreground">Volume (L)</th>
              <th className="text-right py-2 px-4 font-semibold text-foreground">% du total</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit, idx) => {
              const liters = parseFloat((unit.liters as string) || "0");
              const pct = total > 0 ? ((liters / total) * 100).toFixed(1) : "0";
              return (
                <tr key={unit.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                  <td className="py-2 px-4 text-muted-foreground">{idx + 1}</td>
                  <td className="py-2 px-4 font-medium text-foreground">{unit.unitName}</td>
                  <td className="py-2 px-4 text-right font-semibold text-primary">
                    {liters.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} L
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-primary/10 border-t-2 border-primary/30">
              <td colSpan={2} className="py-2 px-4 font-bold text-foreground">TOTAL</td>
              <td className="py-2 px-4 text-right font-bold text-primary text-base">
                {total.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} L
              </td>
              <td className="py-2 px-4 text-right text-xs text-muted-foreground">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// Expandable ticket row
function TicketRow({
  ticket,
  clientName,
}: {
  ticket: any;
  clientName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [, setLocation] = useLocation();

  const formatDate = (d: any) => {
    try { return new Date(d).toLocaleDateString("fr-CA"); } catch { return "—"; }
  };

  const formatTime = (d: any) => {
    if (!d) return null;
    try { return new Date(d).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }); } catch { return null; }
  };

  return (
    <>
      <tr
        className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-3">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-sm">{clientName}</span>
          </div>
        </td>
        <td className="py-3 px-3 font-medium text-sm">
          <div className="flex items-center gap-2">
            {ticket.ticketNumber}
            {ticket.source === 'apk' && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-400 text-blue-600 gap-0.5">
                <Smartphone className="h-2.5 w-2.5" />
                APK
              </Badge>
            )}
          </div>
        </td>
        <td className="py-3 px-3 text-sm">
          <div>{formatDate(ticket.deliveryDate)}</div>
          {(ticket.startTime || ticket.endTime) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              {formatTime(ticket.startTime)} → {formatTime(ticket.endTime)}
            </div>
          )}
        </td>
        <td className="py-3 px-3 text-right font-medium text-sm">
          {parseFloat((ticket.volumeTotal as string) || "0").toLocaleString("fr-CA", { maximumFractionDigits: 1 })}
        </td>
        <td className="py-3 px-3 text-right text-sm">{ticket.pieces || 0}</td>
        <td className="py-3 px-3 text-sm">
          <div className="flex flex-col gap-0.5">
            {ticket.driverName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {ticket.driverName}
              </div>
            )}
            {ticket.siteName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {ticket.siteName}
              </div>
            )}
            {!ticket.driverName && !ticket.siteName && (
              <span className="text-muted-foreground">{ticket.duration || "—"}</span>
            )}
          </div>
        </td>
        <td className="py-3 px-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-[#1a5f3f] hover:text-[#1a5f3f] hover:bg-[#1a5f3f]/10"
            onClick={(e) => { e.stopPropagation(); setLocation(`/admin/tickets/${ticket.id}`); }}
          >
            <ExternalLink className="h-3 w-3" />
            Détails
          </Button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b bg-muted/5">
          <td colSpan={7} className="p-0">
            <TicketUnitsGrid ticketId={ticket.id} />
          </td>
        </tr>
      )}
    </>
  );
}

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
        (t.locationCode && t.locationCode.toLowerCase().includes(s)) ||
        (t.driverName && t.driverName.toLowerCase().includes(s)) ||
        (t.siteName && t.siteName.toLowerCase().includes(s))
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

  const apkCount = useMemo(() => allTickets?.filter(t => t.source === 'apk').length || 0, [allTickets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Tous les bordereaux
          </h1>
          <p className="text-muted-foreground">
            Gérez l'ensemble des bordereaux de livraison.
            {apkCount > 0 && (
              <span className="ml-2 text-blue-600 font-medium text-sm">
                {apkCount} depuis l'APK
              </span>
            )}
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
          placeholder="Rechercher par ticket, livreur, site..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        <ChevronRight className="h-3.5 w-3.5" />
        Cliquez sur une ligne pour voir le détail des unités remplies
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
                      Date / Heure
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Volume (L)
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Unités
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Livreur / Site
                    </th>
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      clientName={clientMap[ticket.clientId] || `#${ticket.clientId}`}
                    />
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
