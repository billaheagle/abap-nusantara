"use client";

import { useState } from "react";
import type { HeaderSettings } from "@/features/settings/schema";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { Grid, ListEditor, Section, TextField, Toggle } from "@/components/admin/settings/fields";

export function HeaderSettingsForm({ initial }: { initial: HeaderSettings }) {
  const [v, setV] = useState(initial);
  const set = (patch: Partial<HeaderSettings>) => setV((prev) => ({ ...prev, ...patch }));

  return (
    <SettingsForm settingKey="header" value={v} previewHref="/">
      <Section title="Menu links" description="The navigation in the top bar, left to right. Site paths (/articles) or full URLs (open in a new tab). Use the eye button to hide a link for now without deleting it.">
        <ListEditor
          items={v.links}
          onChange={(links) => set({ links })}
          create={() => ({ label: "", href: "/", hidden: false })}
          max={8}
          addLabel="Add link"
          itemTitle={(l) => l.label}
          hiding={{ isHidden: (l) => l.hidden, setHidden: (l, hidden) => ({ ...l, hidden }) }}
          renderItem={(l, setL, i) => (
            <Grid>
              <TextField label="Label" path={`links.${i}.label`} value={l.label} onChange={(label) => setL({ label })} />
              <TextField label="URL" mono path={`links.${i}.href`} value={l.href} onChange={(href) => setL({ href })} />
            </Grid>
          )}
        />
      </Section>

      <Section title="Icons">
        <Toggle label="Show search icon" checked={v.showSearch} onChange={(showSearch) => set({ showSearch })} />
        <Toggle label="Show GitHub icon" hint="Uses the GitHub URL from General." checked={v.showGithub} onChange={(showGithub) => set({ showGithub })} />
      </Section>
    </SettingsForm>
  );
}
