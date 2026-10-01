import { getSetting } from "@/features/settings/queries";
import { HeaderSettingsForm } from "@/components/admin/settings/header-form";
import { PageHeader } from "@/components/admin/admin-ui";

export default async function AdminSettingsHeaderPage() {
  const initial = await getSetting("header");

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8">
        <PageHeader title="Header" description="Menu links and icons in the top bar of every public page." />
      </div>
      <HeaderSettingsForm initial={initial} />
    </div>
  );
}
