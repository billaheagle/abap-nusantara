"use client";

import { useState } from "react";
import type { FooterSettings } from "@/features/settings/schema";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { Grid, ListEditor, Section, TextField, Toggle } from "@/components/admin/settings/fields";

export function FooterSettingsForm({ initial }: { initial: FooterSettings }) {
  const [v, setV] = useState(initial);
  const set = (patch: Partial<FooterSettings>) => setV((prev) => ({ ...prev, ...patch }));

  return (
    <SettingsForm settingKey="footer" value={v} previewHref="/">
      <Section title="Footer text">
        <TextField label="Tagline" path="tagline" value={v.tagline} onChange={(tagline) => set({ tagline })} />
        <TextField label="Copyright line" hint="“© <current year>” is added in front automatically." path="copyright" value={v.copyright} onChange={(copyright) => set({ copyright })} />
      </Section>

      <Section title="Footer links" description="Site paths (/articles) or full URLs.">
        <ListEditor
          items={v.links}
          onChange={(links) => set({ links })}
          create={() => ({ label: "", href: "/" })}
          max={12}
          addLabel="Add link"
          itemTitle={(l) => l.label}
          renderItem={(l, setL, i) => (
            <Grid>
              <TextField label="Label" path={`links.${i}.label`} value={l.label} onChange={(label) => setL({ label })} />
              <TextField label="URL" mono path={`links.${i}.href`} value={l.href} onChange={(href) => setL({ href })} />
            </Grid>
          )}
        />
        <div className="space-y-3 border-t border-border pt-4">
          <Toggle label="Show “Admin” link" checked={v.showAdminLink} onChange={(showAdminLink) => set({ showAdminLink })} />
          <Toggle label="Show social icons" hint="GitHub, LinkedIn and email from General." checked={v.showSocialIcons} onChange={(showSocialIcons) => set({ showSocialIcons })} />
        </div>
      </Section>
    </SettingsForm>
  );
}
