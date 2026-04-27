import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function ReportsContent() {
  const { user } = useAuth();
  const currentDate = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (currentDate.getMonth() + 1).toString()
  );

  const { data: client } = trpc.clients.getMyClient.useQuery(undefined, {
    enabled: user?.role !== "admin",
  });

  const { data: reports, isLoading } = trpc.reports.listByClient.useQuery(
    { clientId: client?.id ?? 0 },
    { enabled: !!client?.id }
  );

  // For admin: show all clients
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
        clientId:
          user?.role === "admin"
            ? parseInt(selectedClientId) || 0
            : client?.id ?? 0,
        year: parseInt(selectedYear),
        month: parseInt(selectedMonth),
      },
      {
        enabled:
          (user?.role === "admin" ? !!selectedClientId : !!client?.id) &&
          !!selectedYear &&
          !!selectedMonth,
      }
    );

  const generateMutation = trpc.reports.generate.useMutation();

  const handleGenerate = async () => {
    const clientId =
      user?.role === "admin"
        ? parseInt(selectedClientId)
        : client?.id;
    if (!clientId) return;
    await generateMutation.mutateAsync({
      clientId,
      year: parseInt(selectedYear),
      month: parseInt(selectedMonth),
    });
  };

  const displayReports = user?.role === "admin" ? clientReports : reports;
  const displayLoading = user?.role === "admin" ? clientReportsLoading : isLoading;

  // Calculate totals for selected month
  const monthTotal = useMemo(() => {
    if (!monthTickets) return { volume: 0, units: 0, count: 0 };
    return {
      volume: monthTickets.reduce(
        (sum, t) => sum + parseFloat(t.volumeTotal as string || "0"),
        0
      ),
      units: monthTickets.reduce((sum, t) => sum + (t.pieces || 0), 0),
      count: monthTickets.length,
    };
  }, [monthTickets]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (current - i).toString());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Rapports mensuels
        </h1>
        <p className="text-muted-foreground">
          Consultez les récapitulatifs mensuels de vos livraisons.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            {user?.role === "admin" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Client
                </label>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {allClients?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Année
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Mois
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {user?.role === "admin" && (
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="bg-primary text-primary-foreground"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {generateMutation.isPending
                  ? "Génération..."
                  : "Générer le rapport"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
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
                <p className="text-3xl font-bold text-primary">
                  {monthTotal.count}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Volume total (L)</p>
                <p className="text-3xl font-bold text-blue-600">
                  {monthTotal.volume.toLocaleString("fr-CA", {
                    maximumFractionDigits: 1,
                  })}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Unités totales</p>
                <p className="text-3xl font-bold text-amber-600">
                  {monthTotal.units}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed tickets for the month */}
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
                  {monthTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="py-3 px-3 font-medium">
                        {ticket.ticketNumber}
                      </td>
                      <td className="py-3 px-3">
                        {new Date(ticket.deliveryDate).toLocaleDateString(
                          "fr-CA"
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
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
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="py-3 px-3" colSpan={2}>
                      TOTAL
                    </td>
                    <td className="py-3 px-3 text-right">
                      {monthTotal.volume.toLocaleString("fr-CA", {
                        maximumFractionDigits: 1,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">{monthTotal.units}</td>
                    <td className="py-3 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aucune livraison pour ce mois.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Historical reports */}
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
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Période
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Livraisons
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Volume (L)
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">
                      Unités
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Généré le
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="py-3 px-3 font-medium">
                        {MONTHS[report.month - 1]} {report.year}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {report.totalDeliveries || 0}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {parseFloat(
                          (report.totalVolume as string) || "0"
                        ).toLocaleString("fr-CA", {
                          maximumFractionDigits: 1,
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {report.totalUnits || 0}
                      </td>
                      <td className="py-3 px-3">
                        {new Date(report.generatedAt).toLocaleDateString(
                          "fr-CA"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
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
