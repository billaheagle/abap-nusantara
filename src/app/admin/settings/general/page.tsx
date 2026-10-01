import { getSetting } from "@/features/settings/queries";
import { GeneralSettingsForm } from "@/components/admin/settings/general-form";
import { PageHeader } from "@/components/admin/admin-ui";

export default async function AdminSettingsGeneralPage() {
  const initial = await getSetting("general");

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8">
        <PageHeader title="General settings" description="Site name, links & contact details, and the landing page copy." />
      </div>
      <GeneralSettingsForm initial={initial} />
    </div>
  );
}
