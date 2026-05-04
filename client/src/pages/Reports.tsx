import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, Droplets, ChevronDown, ChevronRight, Package } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function ReportsContent() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const currentDate = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [unitFilterYear, setUnitFilterYear] = useState(currentDate.getFullYear().toString());
  const [unitFilterMonth, setUnitFilterMonth] = useState("all");
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const { data: client } = trpc.clients.getMyClient.useQuery(undefined, {
    enabled: user?.role !== "admin",
  });

  const { data: reports, isLoading } = trpc.reports.listByClient.useQuery(
    { clientId: client?.id ?? 0 },
    { enabled: !!client?.id }
  );

  const { data: allClients } = trpc.clients.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const { data: clientReports, isLoading: clientReportsLoading } =
    trpc.reports.listByClient.useQuery(
      { clientId: parseInt(selectedClientId) || 0 },
      { enabled: user?.role === "admin" && !!selectedClientId }
    );

  const { data: monthTickets, isLoading: monthTicketsLoading } =
    trpc.tickets.listByClientAndMonth.useQuery(
      {
        clientId: user?.role === "admin" ? parseInt(selectedClientId) || 0 : client?.id ?? 0,
        year: parseInt(selectedYear),
        month: parseInt(selectedMonth),
      },
      {
        enabled:
          (user?.role === "admin" ? !!selectedClientId : !!client?.id) &&
          !!selectedYear && !!selectedMonth,
      }
    );

  // Rapport par unité
  const unitReportClientId = user?.role === "admin"
    ? parseInt(selectedClientId) || 0
    : client?.id ?? 0;

  const { data: unitReport, isLoading: unitReportLoading } =
    trpc.reports.byUnit.useQuery(
      {
        clientId: unitReportClientId,
        year: parseInt(unitFilterYear),
        month: unitFilterMonth !== "all" ? parseInt(unitFilterMonth) : undefined,
      },
      { enabled: unitReportClientId > 0 }
    );

  const generateMutation = trpc.reports.generate.useMutation();

  const handleGenerate = async () => {
    const clientId = user?.role === "admin" ? parseInt(selectedClientId) : client?.id;
    if (!clientId) return;
    await generateMutation.mutateAsync({
      clientId,
      year: parseInt(selectedYear),
      month: parseInt(selectedMonth),
    });
  };

  const displayReports = user?.role === "admin" ? clientReports : reports;
  const displayLoading = user?.role === "admin" ? clientReportsLoading : isLoading;

  const monthTotal = useMemo(() => {
    if (!monthTickets) return { volume: 0, units: 0, count: 0 };
    return {
      volume: monthTickets.reduce((sum, t) => sum + parseFloat(t.volumeTotal as string || "0"), 0),
      units: monthTickets.reduce((sum, t) => sum + (t.pieces || 0), 0),
      count: monthTickets.length,
    };
  }, [monthTickets]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (current - i).toString());
  }, []);

  // Total litres pour le rapport par unité
  const unitReportTotal = useMemo(() => {
    if (!unitReport) return 0;
    return unitReport.reduce((sum, u) => sum + u.totalLiters, 0);
  }, [unitReport]);

  const toggleUnit = (unitName: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unitName)) next.delete(unitName);
      else next.add(unitName);
      return next;
    });
  };

  const expandAll = () => {
    if (unitReport) setExpandedUnits(new Set(unitReport.map(u => u.unitName)));
  };

  const collapseAll = () => setExpandedUnits(new Set());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rapports</h1>
        <p className="text-muted-foreground">Consultez les récapitulatifs mensuels et le détail par unité.</p>
      </div>

      {/* Client selector for admin */}
      {user?.role === "admin" && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Client :</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {allClients?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="units">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="units" className="gap-1.5">
            <Package className="h-4 w-4" />
            Rapport par unité
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Rapport mensuel
          </TabsTrigger>
        </TabsList>

        {/* ===== ONGLET RAPPORT PAR UNITÉ ===== */}
        <TabsContent value="units" className="space-y-4 mt-4">
          {/* Filtres */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Année</label>
                  <Select value={unitFilterYear} onValueChange={setUnitFilterYear}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Mois</label>
                  <Select value={unitFilterMonth} onValueChange={setUnitFilterMonth}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toute l'année</SelectItem>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résumé */}
          {!unitReportLoading && unitReport && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground">Unités distinctes</p>
                <p className="text-3xl font-bold text-[#1a5f3f]">{unitReport.length}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground">Volume total (L)</p>
                <p className="text-3xl font-bold text-blue-600">
                  {unitReportTotal.toLocaleString("fr-CA", { maximumFractionDigits: 1 })}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground">Remplissages</p>
                <p className="text-3xl font-bold text-amber-600">
                  {unitReport.reduce((sum, u) => sum + u.fills.length, 0)}
                </p>
              </div>
            </div>
          )}

          {/* Tableau par unité */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-[#1a5f3f]" />
                  Détail par unité — {unitFilterMonth !== "all" ? `${MONTHS[parseInt(unitFilterMonth) - 1]} ` : ""}{unitFilterYear}
                </CardTitle>
                {unitReport && unitReport.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={expandAll}>
                      Tout développer
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={collapseAll}>
                      Tout réduire
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {unitReportLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : !unitReport || unitReport.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    {user?.role === "admin" && !selectedClientId
                      ? "Sélectionnez un client pour voir le rapport par unité."
                      : "Aucune donnée d'unité pour cette période. Les unités sont enregistrées lors des livraisons via l'APK."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unitReport.map((unit) => {
                    const isExpanded = expandedUnits.has(unit.unitName);
                    return (
                      <div key={unit.unitName} className="border rounded-lg overflow-hidden">
                        {/* En-tête de l'unité */}
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                          onClick={() => toggleUnit(unit.unitName)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            }
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{unit.unitName}</span>
                              <Badge variant="outline" className="text-xs border-[#1a5f3f]/30 text-[#1a5f3f]">
                                {unit.fills.length} remplissage{unit.fills.length > 1 ? "s" : ""}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-blue-600">
                              {unit.totalLiters.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} L
                            </span>
                            <span className="text-xs text-muted-foreground">total</span>
                          </div>
                        </button>

                        {/* Détail des remplissages */}
                        {isExpanded && (
                          <div className="border-t">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/10">
                                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">#</th>
                                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Date</th>
                                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">No. Billet</th>
                                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">Litres reçus</th>
                                </tr>
                              </thead>
                              <tbody>
                                {unit.fills.map((fill, idx) => (
                                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/10">
                                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{idx + 1}</td>
                                    <td className="py-2.5 px-4 font-medium">
                                      {new Date(fill.date).toLocaleDateString("fr-CA", {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <button
                                        className="text-[#1a5f3f] hover:underline font-mono text-xs"
                                        onClick={() => navigate(`/tickets/${fill.ticketId}`)}
                                      >
                                        {fill.ticketNumber}
                                      </button>
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                      <span className="font-bold text-blue-600">
                                        {fill.liters.toLocaleString("fr-CA", { maximumFractionDigits: 1 })}
                                      </span>
                                      <span className="text-muted-foreground ml-1 text-xs">L</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 bg-muted/10">
                                  <td colSpan={3} className="py-2.5 px-4 font-bold text-sm">Sous-total {unit.unitName}</td>
                                  <td className="py-2.5 px-4 text-right font-bold text-blue-600">
                                    {unit.totalLiters.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} L
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Grand total */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#1a5f3f]/5 border border-[#1a5f3f]/20 mt-2">
                    <span className="font-bold text-[#1a5f3f]">TOTAL GÉNÉRAL</span>
                    <span className="font-bold text-xl text-[#1a5f3f]">
                      {unitReportTotal.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} L
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ONGLET RAPPORT MENSUEL ===== */}
        <TabsContent value="monthly" className="space-y-4 mt-4">
          {/* Filtres */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Année</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Mois</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {user?.role === "admin" && (
                  <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="bg-primary text-primary-foreground">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {generateMutation.isPending ? "Génération..." : "Générer le rapport"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résumé mensuel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Résumé — {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthTicketsLoading ? (
                <Skeleton className="h-20" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">Livraisons</p>
                    <p className="text-3xl font-bold text-primary">{monthTotal.count}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">Volume total (L)</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {monthTotal.volume.toLocaleString("fr-CA", { maximumFractionDigits: 1 })}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">Unités totales</p>
                    <p className="text-3xl font-bold text-amber-600">{monthTotal.units}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détail des livraisons du mois */}
          <Card>
            <CardHeader>
              <CardTitle>Détail des livraisons du mois</CardTitle>
            </CardHeader>
            <CardContent>
              {monthTicketsLoading ? (
                <Skeleton className="h-40" />
              ) : monthTickets && monthTickets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">No. Ticket</th>
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground">Volume (L)</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground">Unités</th>
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Durée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-3 font-medium">{ticket.ticketNumber}</td>
                          <td className="py-3 px-3">{new Date(ticket.deliveryDate).toLocaleDateString("fr-CA")}</td>
                          <td className="py-3 px-3 text-right">
                            {parseFloat((ticket.volumeTotal as string) || "0").toLocaleString("fr-CA", { maximumFractionDigits: 1 })}
                          </td>
                          <td className="py-3 px-3 text-right">{ticket.pieces || 0}</td>
                          <td className="py-3 px-3">{ticket.duration || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="py-3 px-3" colSpan={2}>TOTAL</td>
                        <td className="py-3 px-3 text-right">
                          {monthTotal.volume.toLocaleString("fr-CA", { maximumFractionDigits: 1 })}
                        </td>
                        <td className="py-3 px-3 text-right">{monthTotal.units}</td>
                        <td className="py-3 px-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune livraison pour ce mois.</p>
              )}
            </CardContent>
          </Card>

          {/* Historique des rapports */}
          {displayReports && displayReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historique des rapports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Période</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground">Livraisons</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground">Volume (L)</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground">Unités</th>
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground">Généré le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayReports.map((report) => (
                        <tr key={report.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-3 font-medium">{MONTHS[report.month - 1]} {report.year}</td>
                          <td className="py-3 px-3 text-right">{report.totalDeliveries || 0}</td>
                          <td className="py-3 px-3 text-right">
                            {parseFloat((report.totalVolume as string) || "0").toLocaleString("fr-CA", { maximumFractionDigits: 1 })}
                          </td>
                          <td className="py-3 px-3 text-right">{report.totalUnits || 0}</td>
                          <td className="py-3 px-3">{new Date(report.generatedAt).toLocaleDateString("fr-CA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Reports() {
  return (
    <DashboardLayout>
      <ReportsContent />
    </DashboardLayout>
  );
}
