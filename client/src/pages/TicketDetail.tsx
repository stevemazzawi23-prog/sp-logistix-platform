import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Truck, Calendar, Clock, User, MapPin, Package,
  Smartphone, Hash, Droplets, BarChart3
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface TicketDetailProps {
  ticketId: number;
  isAdmin?: boolean;
}

function TicketDetailContent({ ticketId, isAdmin }: TicketDetailProps) {
  const [, setLocation] = useLocation();
  const { data: ticket, isLoading: ticketLoading } = trpc.tickets.getById.useQuery({ id: ticketId });
  const { data: units, isLoading: unitsLoading } = trpc.units.listByTicketPublic.useQuery({ ticketId });
  const { data: clients } = trpc.clients.list.useQuery(undefined, { enabled: !!isAdmin });

  const clientName = isAdmin
    ? clients?.find((c) => c.id === ticket?.clientId)?.name ?? "—"
    : null;

  const formatDate = (d: any) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return "—"; }
  };

  const formatTime = (d: any) => {
    if (!d) return null;
    try { return new Date(d).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }); }
    catch { return null; }
  };

  const formatDateTime = (d: any) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("fr-CA", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      });
    } catch { return "—"; }
  };

  const totalLiters = units?.reduce((sum, u) => sum + parseFloat((u.liters as string) || "0"), 0) ?? 0;

  const backPath = isAdmin ? "/admin/tickets" : "/tickets";

  if (ticketLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation(backPath)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <div className="text-center py-16 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Billet introuvable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation(backPath)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      {/* Title card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-[#1a5f3f]/5 to-[#1a5f3f]/10">
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hash className="h-4 w-4 text-[#1a5f3f]" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bordereau</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{ticket.ticketNumber}</h1>
              {isAdmin && clientName && (
                <p className="text-sm text-muted-foreground mt-1">Client : <span className="font-medium text-foreground">{clientName}</span></p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(ticket as any).source === 'apk' && (
                <Badge variant="outline" className="border-blue-400 text-blue-600 gap-1">
                  <Smartphone className="h-3 w-3" />
                  APK
                </Badge>
              )}
              <Badge className="bg-[#1a5f3f] text-white text-base px-3 py-1 gap-1.5">
                <Droplets className="h-4 w-4" />
                {parseFloat((ticket.volumeTotal as string) || "0").toLocaleString("fr-CA", { maximumFractionDigits: 1 })} L
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date & Heure */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date & Horaire
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Date de livraison</p>
              <p className="font-semibold text-foreground">{formatDate(ticket.deliveryDate)}</p>
            </div>
            {(ticket as any).startTime && (
              <div>
                <p className="text-xs text-muted-foreground">Heure de début</p>
                <p className="font-medium text-foreground">{formatDateTime((ticket as any).startTime)}</p>
              </div>
            )}
            {(ticket as any).endTime && (
              <div>
                <p className="text-xs text-muted-foreground">Heure de fin</p>
                <p className="font-medium text-foreground">{formatDateTime((ticket as any).endTime)}</p>
              </div>
            )}
            {ticket.duration && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Durée : <span className="font-medium text-foreground">{ticket.duration}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Livraison info */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Informations de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {(ticket as any).driverName && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Livreur</p>
                  <p className="font-medium text-foreground">{(ticket as any).driverName}</p>
                </div>
              </div>
            )}
            {(ticket as any).siteName && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Site</p>
                  <p className="font-medium text-foreground">{(ticket as any).siteName}</p>
                </div>
              </div>
            )}
            {ticket.locationCode && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Code lieu</p>
                  <p className="font-medium text-foreground">{ticket.locationCode}</p>
                </div>
              </div>
            )}
            {ticket.pieces !== null && ticket.pieces !== undefined && (
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Pièces</p>
                  <p className="font-medium text-foreground">{ticket.pieces}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Units grid */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Détail des unités remplies
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {unitsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !units || units.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Droplets className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm italic">Aucun détail d'unité disponible pour ce bordereau.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a5f3f]/5 border-b border-border">
                    <th className="text-left py-2.5 px-4 font-semibold text-foreground">#</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-foreground">Unité / Réservoir</th>
                    <th className="text-right py-2.5 px-4 font-semibold text-foreground">Volume (L)</th>
                    <th className="text-right py-2.5 px-4 font-semibold text-foreground hidden sm:table-cell">% du total</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit, idx) => {
                    const liters = parseFloat((unit.liters as string) || "0");
                    const pct = totalLiters > 0 ? ((liters / totalLiters) * 100).toFixed(1) : "0";
                    return (
                      <tr key={unit.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{unit.unitName}</td>
                        <td className="py-3 px-4 text-right font-semibold text-[#1a5f3f]">
                          {liters.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} L
                        </td>
                        <td className="py-3 px-4 text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#1a5f3f] rounded-full transition-all"
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
                  <tr className="bg-[#1a5f3f]/10 border-t-2 border-[#1a5f3f]/30">
                    <td colSpan={2} className="py-3 px-4 font-bold text-foreground">TOTAL</td>
                    <td className="py-3 px-4 text-right font-bold text-[#1a5f3f] text-base">
                      {totalLiters.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} L
                    </td>
                    <td className="py-3 px-4 text-right hidden sm:table-cell text-xs text-muted-foreground">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email info if available */}
      {ticket.emailSubject && ticket.emailSubject !== 'Importe depuis APK' && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Source email</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            <p className="text-sm text-foreground">{ticket.emailSubject}</p>
            {ticket.emailReceivedAt && (
              <p className="text-xs text-muted-foreground">Reçu le {formatDateTime(ticket.emailReceivedAt)}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Admin version
export function AdminTicketDetail({ ticketId }: { ticketId: number }) {
  return (
    <DashboardLayout>
      <TicketDetailContent ticketId={ticketId} isAdmin />
    </DashboardLayout>
  );
}

// Client version
export default function TicketDetail({ ticketId }: { ticketId: number }) {
  return (
    <DashboardLayout>
      <TicketDetailContent ticketId={ticketId} isAdmin={false} />
    </DashboardLayout>
  );
}
