import { getSetting } from "@/features/settings/queries";
import { AboutSettingsForm } from "@/components/admin/settings/about-form";
import { PageHeader } from "@/components/admin/admin-ui";

export default async function AdminSettingsAboutPage() {
  const initial = await getSetting("about");

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8">
        <PageHeader title="About page" description="The content of the public About page." />
      </div>
      <AboutSettingsForm initial={initial} />
    </div>
  );
}
