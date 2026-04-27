import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search } from "lucide-react";
import { useState, useMemo } from "react";

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
        (t.locationCode && t.locationCode.toLowerCase().includes(s))
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
          placeholder="Rechercher par numéro de ticket..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
                      Code lieu
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Date livraison
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
                      Durée
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium">
                        {ticket.ticketNumber}
                      </td>
                      <td className="py-3 px-3">
                        {ticket.locationCode || "—"}
                      </td>
                      <td className="py-3 px-3">
                        {new Date(ticket.deliveryDate).toLocaleDateString(
                          "fr-CA"
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {parseFloat(
                          (ticket.volumeTotalDef as string) || "0"
                        ).toLocaleString("fr-CA", {
                          maximumFractionDigits: 1,
                        })}
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

export default function Tickets() {
  return (
    <DashboardLayout>
      <TicketsContent />
    </DashboardLayout>
  );
}
