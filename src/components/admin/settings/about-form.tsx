"use client";

import { useState } from "react";
import type { AboutSettings } from "@/features/settings/schema";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { Section, TextField, Toggle } from "@/components/admin/settings/fields";

export function AboutSettingsForm({ initial }: { initial: AboutSettings }) {
  const [v, setV] = useState(initial);
  const set = (patch: Partial<AboutSettings>) => setV((prev) => ({ ...prev, ...patch }));

  return (
    <SettingsForm settingKey="about" value={v} previewHref="/about">
      <Section title="About page">
        <TextField label="Page title" path="title" value={v.title} onChange={(title) => set({ title })} />
        <TextField
          label="Content"
          hint="Separate paragraphs with a blank line."
          multiline
          rows={14}
          path="body"
          value={v.body}
          onChange={(body) => set({ body })}
        />
        <Toggle label="Show GitHub button" hint="Uses the GitHub URL from General." checked={v.showGithubButton} onChange={(showGithubButton) => set({ showGithubButton })} />
      </Section>
      <Section title="SEO">
        <TextField label="Meta description" multiline rows={2} path="metaDescription" value={v.metaDescription} onChange={(metaDescription) => set({ metaDescription })} />
      </Section>
    </SettingsForm>
  );
}
