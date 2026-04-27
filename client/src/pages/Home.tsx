import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LOGO_URL, APP_NAME } from "@shared/const";
import {
  Truck,
  Droplets,
  Package,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
} from "lucide-react";

function ClientDashboardContent() {
  const { user } = useAuth();
  const { data: client, isLoading: clientLoading } =
    trpc.clients.getMyClient.useQuery();
  const { data: contacts, isLoading: contactsLoading } =
    trpc.contacts.listByClient.useQuery(
      { clientId: client?.id ?? 0 },
      { enabled: !!client?.id }
    );
  const { data: tickets, isLoading: ticketsLoading } =
    trpc.tickets.listByClient.useQuery(
      { clientId: client?.id ?? 0 },
      { enabled: !!client?.id }
    );

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <img src={LOGO_URL} alt={APP_NAME} className="h-16 w-auto opacity-50" />
        <h2 className="text-xl font-semibold text-muted-foreground">
          Aucun compte client associé
        </h2>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          Votre compte utilisateur n'est pas encore lié à un profil client.
          Veuillez contacter l'administrateur pour configurer votre accès.
        </p>
      </div>
    );
  }

  // Calculate stats
  const totalVolume = tickets?.reduce(
    (sum, t) => sum + parseFloat(t.volumeTotal as string || "0"),
    0
  ) ?? 0;
  const totalPieces = tickets?.reduce((sum, t) => sum + (t.pieces || 0), 0) ?? 0;
  const totalDeliveries = tickets?.length ?? 0;
  const recentTickets = tickets?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bonjour, {user?.name || "Client"}
          </h1>
          <p className="text-muted-foreground">
            Bienvenue sur votre espace client {APP_NAME}
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          {client.siteStatus || "Actif"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Livraisons</p>
                <p className="text-2xl font-bold">{totalDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume total (L)</p>
                <p className="text-2xl font-bold">
                  {totalVolume.toLocaleString("fr-CA", { maximumFractionDigits: 1 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unités</p>
                <p className="text-2xl font-bold">{totalPieces}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Fiche client — {client.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Code
                </p>
                <p className="font-medium">{client.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Adresse
                </p>
                <p className="font-medium">
                  {client.address || "—"}
                  {client.city && `, ${client.city}`}
                  {client.province && ` ${client.province}`}
                  {client.postalCode && ` ${client.postalCode}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Type de site
                </p>
                <p className="font-medium">{client.siteType || "—"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Classe
                </p>
                <p className="font-medium">
                  {client.classe || "—"}
                  {client.sousClasse && ` / ${client.sousClasse}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Type de gestion
                </p>
                <p className="font-medium">{client.managementType || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  BTU
                </p>
                <p className="font-medium">{client.btuName || "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contactsLoading ? (
            <Skeleton className="h-20" />
          ) : contacts && contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {contact.name}
                      {contact.isPrimary === 1 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Principal
                        </Badge>
                      )}
                    </p>
                    {contact.role && (
                      <p className="text-xs text-muted-foreground">
                        {contact.role}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1">
                      {contact.phone && (
                        <span className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                          {contact.extension && ` ext. ${contact.extension}`}
                        </span>
                      )}
                      {contact.email && (
                        <span className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun contact enregistré.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Derniers bordereaux de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <Skeleton className="h-40" />
          ) : recentTickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      No. Ticket
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                      Volume (L)
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                      Unités
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Durée
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium">
                        {ticket.ticketNumber}
                      </td>
                      <td className="py-2 px-3">
                        {new Date(ticket.deliveryDate).toLocaleDateString(
                          "fr-CA"
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {parseFloat(ticket.volumeTotal as string || "0").toLocaleString(
                          "fr-CA",
                          { maximumFractionDigits: 1 }
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {ticket.pieces || 0}
                      </td>
                      <td className="py-2 px-3">{ticket.duration || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun bordereau de livraison enregistré.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Dashboard
function AdminDashboardContent() {
  const { user } = useAuth();
  const { data: allClients, isLoading: clientsLoading } =
    trpc.clients.list.useQuery();
  const { data: allTickets, isLoading: ticketsLoading } =
    trpc.tickets.listAll.useQuery();

  const totalClients = allClients?.length ?? 0;
  const totalTickets = allTickets?.length ?? 0;
  const totalVolume =
    allTickets?.reduce(
      (sum, t) => sum + parseFloat(t.volumeTotal as string || "0"),
      0
    ) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Administration {APP_NAME}
        </h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.name}. Voici un aperçu de la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">
                  {clientsLoading ? "..." : totalClients}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Livraisons</p>
                <p className="text-2xl font-bold">
                  {ticketsLoading ? "..." : totalTickets}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume total (L)</p>
                <p className="text-2xl font-bold">
                  {ticketsLoading
                    ? "..."
                    : totalVolume.toLocaleString("fr-CA", {
                        maximumFractionDigits: 0,
                      })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent tickets across all clients */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières livraisons (tous clients)</CardTitle>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <Skeleton className="h-40" />
          ) : allTickets && allTickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      No. Ticket
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                      Volume (L)
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                      Unités
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Client ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allTickets.slice(0, 10).map((ticket) => (
                    <tr key={ticket.id} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium">
                        {ticket.ticketNumber}
                      </td>
                      <td className="py-2 px-3">
                        {new Date(ticket.deliveryDate).toLocaleDateString(
                          "fr-CA"
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {parseFloat(ticket.volumeTotal as string || "0").toLocaleString(
                          "fr-CA",
                          { maximumFractionDigits: 1 }
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {ticket.pieces || 0}
                      </td>
                      <td className="py-2 px-3">{ticket.clientId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune livraison enregistrée.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      {user?.role === "admin" ? (
        <AdminDashboardContent />
      ) : (
        <ClientDashboardContent />
      )}
    </DashboardLayout>
  );
}
