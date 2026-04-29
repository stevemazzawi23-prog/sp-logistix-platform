import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, ChevronDown, ChevronRight, Clock, User, MapPin, Smartphone } from "lucide-react";
import { useState, useMemo } from "react";

// Units grid component
function TicketUnitsGrid({ ticketId }: { ticketId: number }) {
  const { data: units, isLoading } = trpc.units.listByTicket.useQuery({ ticketId });

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
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
function TicketRow({ ticket }: { ticket: any }) {
  const [expanded, setExpanded] = useState(false);

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
        className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-3 font-medium">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <span>{ticket.ticketNumber}</span>
            {ticket.source === 'apk' && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-400 text-blue-600 gap-0.5">
                <Smartphone className="h-2.5 w-2.5" />
                APK
              </Badge>
            )}
          </div>
        </td>
        <td className="py-3 px-3 text-sm">
          {ticket.locationCode || ticket.siteName || "—"}
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
        <td className="py-3 px-3 text-right text-sm">
          {parseFloat((ticket.volumeTotalDef as string) || "0").toLocaleString("fr-CA", { maximumFractionDigits: 1 })}
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
            {!ticket.driverName && (ticket.duration || "—")}
          </div>
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

function TicketsContent() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: client } = trpc.clients.getMyClient.useQuery(undefined, {
    enabled: user?.role !== "admin",
  });

  const { data: tickets, isLoading } = trpc.tickets.listByClient.useQuery(
    { clientId: client?.id ?? 0 },
    { enabled: user?.role !== "admin" && !!client?.id }
  );

  const { data: allTickets, isLoading: allLoading } =
    trpc.tickets.listAll.useQuery(undefined, {
      enabled: user?.role === "admin",
    });

  const displayTickets = user?.role === "admin" ? allTickets : tickets;
  const loading = user?.role === "admin" ? allLoading : isLoading;

  const filteredTickets = useMemo(() => {
    if (!displayTickets) return [];
    if (!search.trim()) return displayTickets;
    const s = search.toLowerCase();
    return displayTickets.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(s) ||
        (t.locationCode && t.locationCode.toLowerCase().includes(s)) ||
        (t.siteName && t.siteName.toLowerCase().includes(s)) ||
        (t.driverName && t.driverName.toLowerCase().includes(s))
    );
  }, [displayTickets, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bordereaux de livraison
          </h1>
          <p className="text-muted-foreground">
            {user?.role === "admin"
              ? "Tous les bordereaux de livraison"
              : `Bordereaux pour ${client?.name || "votre compte"}`}
          </p>
        </div>
        <Badge variant="outline">
          {filteredTickets.length} bordereau{filteredTickets.length !== 1 ? "x" : ""}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par numéro, site, livreur..."
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
            <FileText className="h-5 w-5 text-primary" />
            Liste des bordereaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
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
                      No. Ticket
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Site / Code lieu
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Date / Heure
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Vol. Déf. (L)
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Vol. Total (L)
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Unités
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Livreur
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <TicketRow key={ticket.id} ticket={ticket} />
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

export default function Tickets() {
  return (
    <DashboardLayout>
      <TicketsContent />
    </DashboardLayout>
  );
}
