import { getSetting } from "@/features/settings/queries";
import { HireMeSettingsForm } from "@/components/admin/settings/hire-me-form";
import { PageHeader } from "@/components/admin/admin-ui";

export default async function AdminSettingsHireMePage() {
  const initial = await getSetting("hireMe");

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8">
        <PageHeader title="Hire Me page" description="Your freelance pitch and CV — experience, certifications, expertise and process." />
      </div>
      <HireMeSettingsForm initial={initial} />
    </div>
  );
}
