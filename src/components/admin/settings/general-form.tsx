"use client";

import { useState } from "react";
import type { GeneralSettings } from "@/features/settings/schema";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { Grid, Section, TextField, Toggle } from "@/components/admin/settings/fields";

export function GeneralSettingsForm({ initial }: { initial: GeneralSettings }) {
  const [v, setV] = useState(initial);
  const set = <S extends keyof GeneralSettings>(section: S, patch: Partial<GeneralSettings[S]>) =>
    setV((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));

  return (
    <SettingsForm settingKey="general" value={v} previewHref="/">
      <Section title="Brand & SEO" description="Site name shown in the header and footer, plus the default title/description for search engines and link previews.">
        <Grid>
          <TextField label="Site name" path="brand.name" value={v.brand.name} onChange={(name) => set("brand", { name })} />
          <TextField label="Site name — accent part" hint="Shown in the brand colour after the name." path="brand.accent" value={v.brand.accent} onChange={(accent) => set("brand", { accent })} />
        </Grid>
        <TextField label="SEO title" path="brand.seoTitle" value={v.brand.seoTitle} onChange={(seoTitle) => set("brand", { seoTitle })} />
        <TextField label="SEO description" multiline rows={2} path="brand.seoDescription" value={v.brand.seoDescription} onChange={(seoDescription) => set("brand", { seoDescription })} />
      </Section>

      <Section title="Links & contact" description="Used across the site — header GitHub icon, landing page, About, Hire Me buttons and footer icons. Leave empty to hide.">
        <Grid>
          <TextField label="GitHub URL" type="url" mono path="links.github" value={v.links.github} onChange={(github) => set("links", { github })} placeholder="https://github.com/username" />
          <TextField label="LinkedIn URL" type="url" mono path="links.linkedin" value={v.links.linkedin} onChange={(linkedin) => set("links", { linkedin })} />
          <TextField label="Email" type="email" mono path="links.email" value={v.links.email} onChange={(email) => set("links", { email })} />
          <TextField label="WhatsApp number" type="tel" mono hint="Digits with country code, no + or spaces." path="links.whatsapp" value={v.links.whatsapp} onChange={(whatsapp) => set("links", { whatsapp })} placeholder="6281234567890" />
        </Grid>
      </Section>

      <Section title="Landing page — hero">
        <TextField label="Badge" path="hero.badge" value={v.hero.badge} onChange={(badge) => set("hero", { badge })} />
        <Grid>
          <TextField label="Headline — line 1" path="hero.titleLine1" value={v.hero.titleLine1} onChange={(titleLine1) => set("hero", { titleLine1 })} />
          <TextField label="Headline — line 2" path="hero.titleLine2" value={v.hero.titleLine2} onChange={(titleLine2) => set("hero", { titleLine2 })} />
        </Grid>
        <TextField label="Headline — highlighted (gradient)" path="hero.titleHighlight" value={v.hero.titleHighlight} onChange={(titleHighlight) => set("hero", { titleHighlight })} />
        <TextField label="Description" multiline path="hero.description" value={v.hero.description} onChange={(description) => set("hero", { description })} />
        <Grid>
          <TextField label="Primary button label" path="hero.primaryCtaLabel" value={v.hero.primaryCtaLabel} onChange={(primaryCtaLabel) => set("hero", { primaryCtaLabel })} />
          <div className="sm:pt-7">
            <Toggle label="Show GitHub button" checked={v.hero.showGithubButton} onChange={(showGithubButton) => set("hero", { showGithubButton })} />
          </div>
        </Grid>
      </Section>

      <Section title="Landing page — sections">
        <Grid>
          <TextField label="Featured section title" path="home.featuredTitle" value={v.home.featuredTitle} onChange={(featuredTitle) => set("home", { featuredTitle })} />
          <TextField label="Latest section title" path="home.latestTitle" value={v.home.latestTitle} onChange={(latestTitle) => set("home", { latestTitle })} />
        </Grid>
        <TextField label="About band — title" path="home.aboutTitle" value={v.home.aboutTitle} onChange={(aboutTitle) => set("home", { aboutTitle })} />
        <TextField label="About band — text" multiline path="home.aboutBody" value={v.home.aboutBody} onChange={(aboutBody) => set("home", { aboutBody })} />
        <TextField label="About band — link label" path="home.aboutLinkLabel" value={v.home.aboutLinkLabel} onChange={(aboutLinkLabel) => set("home", { aboutLinkLabel })} />
        <Grid>
          <TextField label="Tools card — title" path="home.toolsTitle" value={v.home.toolsTitle} onChange={(toolsTitle) => set("home", { toolsTitle })} />
          <TextField label="Tools card — text" multiline rows={2} path="home.toolsBody" value={v.home.toolsBody} onChange={(toolsBody) => set("home", { toolsBody })} />
        </Grid>
      </Section>
    </SettingsForm>
  );
}
