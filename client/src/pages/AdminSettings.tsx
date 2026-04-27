import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LOGO_URL, APP_NAME } from "@shared/const";
import { Settings, Mail, Bell } from "lucide-react";

function AdminSettingsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">
          Configuration de la plateforme {APP_NAME}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt={APP_NAME} className="h-16 w-auto" />
            <div>
              <p className="font-semibold text-lg">{APP_NAME}</p>
              <p className="text-sm text-muted-foreground">
                Portail de gestion des livraisons
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Collecte automatique Gmail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Adresse email surveillée
              </p>
              <p className="font-medium">logistixsp@gmail.com</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Sujet email filtré
              </p>
              <p className="font-medium">"Rapport de livraison"</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            La collecte automatique des bordereaux de livraison est configurée
            via une tâche planifiée. Les emails avec le sujet exact "Rapport de
            livraison" sont analysés pour extraire les informations de livraison
            (unités, litrage, date, client).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Lors de la réception d'un nouveau bordereau de livraison, une
            notification est envoyée automatiquement au propriétaire
            (logistixsp@gmail.com) et au client concerné.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSettings() {
  return (
    <DashboardLayout>
      <AdminSettingsContent />
    </DashboardLayout>
  );
}
