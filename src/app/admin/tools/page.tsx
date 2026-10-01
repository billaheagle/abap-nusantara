import { getSetting } from "@/features/settings/queries";
import { ToolsSettingsForm } from "@/components/admin/settings/tools-form";
import { PageHeader } from "@/components/admin/admin-ui";

export default async function AdminToolsPage() {
  const initial = await getSetting("tools");

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8">
        <PageHeader
          title="Tools"
          description="Publish or hide individual developer tools. A hidden tool disappears from /tools and its page returns 404 — handy for taking one offline while a bug is fixed."
        />
      </div>
      <ToolsSettingsForm initial={initial} />
    </div>
  );
}
