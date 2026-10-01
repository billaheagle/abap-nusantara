import { getSetting } from "@/features/settings/queries";
import { FooterSettingsForm } from "@/components/admin/settings/footer-form";
import { PageHeader } from "@/components/admin/admin-ui";

export default async function AdminSettingsFooterPage() {
  const initial = await getSetting("footer");

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8">
        <PageHeader title="Footer" description="Tagline, links and copyright shown at the bottom of every public page." />
      </div>
      <FooterSettingsForm initial={initial} />
    </div>
  );
}
