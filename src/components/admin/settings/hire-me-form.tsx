"use client";

import { useState } from "react";
import { YEARS_TOKEN, yearsSince, type HireMeSettings } from "@/features/settings/schema";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { DocumentField } from "@/components/admin/settings/document-field";
import { Grid, IconSelect, ListEditor, Section, TextField, Toggle } from "@/components/admin/settings/fields";

type CardSection = "why" | "expertise";
// Sections that carry the shared show / eyebrow / title header.
type MetaSection = "why" | "expertise" | "experience" | "projects" | "skills" | "testimonials" | "credentials" | "process";

export function HireMeSettingsForm({ initial }: { initial: HireMeSettings }) {
  const [v, setV] = useState(initial);
  const set = <S extends keyof HireMeSettings>(section: S, patch: Partial<HireMeSettings[S]>) =>
    setV((prev) => ({ ...prev, [section]: { ...(prev[section] as object), ...patch } }));

  /** Show toggle + "[ eyebrow ]" label + section title — the same for every section. */
  const meta = (section: MetaSection, hint?: string) => (
    <>
      <Toggle
        label="Show this section"
        hint={hint ?? "Turn off to hide it from the page without deleting its content."}
        checked={v[section].show}
        onChange={(show) => set(section, { show })}
      />
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <TextField
          label="Small label"
          hint="Shown as [ label ] above the title."
          path={`${section}.eyebrow`}
          value={v[section].eyebrow}
          onChange={(eyebrow) => set(section, { eyebrow })}
        />
        <TextField label="Section title" path={`${section}.title`} value={v[section].title} onChange={(title) => set(section, { title })} />
      </div>
    </>
  );

  const cards = (section: CardSection) => (
    <ListEditor
      items={v[section].items}
      onChange={(items) => set(section, { items })}
      create={() => ({ icon: "Star" as const, title: "", body: "" })}
      max={8}
      addLabel="Add card"
      itemTitle={(c) => c.title}
      renderItem={(c, setC, i) => (
        <>
          <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
            <IconSelect value={c.icon} onChange={(icon) => setC({ icon })} />
            <TextField label="Title" path={`${section}.items.${i}.title`} value={c.title} onChange={(title) => setC({ title })} />
          </div>
          <TextField label="Text" multiline rows={2} path={`${section}.items.${i}.body`} value={c.body} onChange={(body) => setC({ body })} />
        </>
      )}
    />
  );

  const startYear = v.profile.careerStartYear;

  return (
    <SettingsForm settingKey="hireMe" value={v} previewHref="/hire-me">
      <Section title="Profile" description="Shown at the top of the page so clients see who they'd be working with. Leave empty to hide.">
        <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
          <CoverImageField label="Photo" uploadLabel="Upload photo" square value={v.profile.photo} onChange={(photo) => set("profile", { photo })} />
          <div className="space-y-4">
            <TextField label="Full name" path="profile.name" value={v.profile.name} onChange={(name) => set("profile", { name })} />
            <TextField label="Title / role" path="profile.role" value={v.profile.role} onChange={(role) => set("profile", { role })} placeholder="SAP ABAP Developer" />
            <TextField
              label="Career start year"
              type="number"
              path="profile.careerStartYear"
              value={startYear === null ? "" : String(startYear)}
              onChange={(raw) => set("profile", { careerStartYear: raw === "" ? null : Math.trunc(Number(raw)) })}
              hint={
                startYear
                  ? `Write ${YEARS_TOKEN} in any text on this page — it becomes “${yearsSince(startYear)}” today and updates automatically each year.`
                  : `Set a year to use ${YEARS_TOKEN} in your texts.`
              }
            />
          </div>
        </div>
      </Section>

      <Section title="Hero" description="Contact buttons use the email / WhatsApp / LinkedIn from General.">
        <TextField label="Badge" path="hero.badge" value={v.hero.badge} onChange={(badge) => set("hero", { badge })} />
        <Grid>
          <TextField label="Headline" path="hero.titlePrefix" value={v.hero.titlePrefix} onChange={(titlePrefix) => set("hero", { titlePrefix })} />
          <TextField label="Headline — highlighted (gradient)" path="hero.titleHighlight" value={v.hero.titleHighlight} onChange={(titleHighlight) => set("hero", { titleHighlight })} />
        </Grid>
        <TextField label="Intro" multiline path="hero.intro" value={v.hero.intro} onChange={(intro) => set("hero", { intro })} />
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <DocumentField
            label="CV / résumé"
            hint="Upload a PDF (stored on this site) or paste a link. Leave empty to hide the button."
            path="hero.resumeUrl"
            value={v.hero.resumeUrl}
            onChange={(resumeUrl) => set("hero", { resumeUrl })}
          />
          <TextField label="CV button label" path="hero.resumeLabel" value={v.hero.resumeLabel} onChange={(resumeLabel) => set("hero", { resumeLabel })} />
        </div>
      </Section>

      <Section title="Why work with me">
        {meta("why")}
        {cards("why")}
      </Section>

      <Section title="Expertise">
        {meta("expertise")}
        {cards("expertise")}
      </Section>

      <Section title="Work experience" description="Your CV timeline, newest first. Hidden while empty.">
        {meta("experience")}
        <ListEditor
          items={v.experience.items}
          onChange={(items) => set("experience", { items })}
          create={() => ({ role: "", company: "", location: "", period: "", summary: "", highlights: "", tech: "" })}
          max={20}
          addLabel="Add experience"
          empty="No experience added yet."
          itemTitle={(e) => [e.role, e.company].filter(Boolean).join(" @ ")}
          renderItem={(e, setE, i) => {
            const p = `experience.items.${i}`;
            return (
              <>
                <Grid>
                  <TextField label="Role / position" path={`${p}.role`} value={e.role} onChange={(role) => setE({ role })} placeholder="SAP ABAP Consultant" />
                  <TextField label="Company" path={`${p}.company`} value={e.company} onChange={(company) => setE({ company })} placeholder="PT Example Indonesia" />
                  <TextField label="Period" path={`${p}.period`} value={e.period} onChange={(period) => setE({ period })} placeholder="Jan 2022 – Present" />
                  <TextField label="Location" path={`${p}.location`} value={e.location} onChange={(location) => setE({ location })} placeholder="Jakarta · Hybrid" />
                </Grid>
                <TextField label="Summary" multiline rows={2} path={`${p}.summary`} value={e.summary} onChange={(summary) => setE({ summary })} />
                <TextField label="Highlights" hint="One achievement per line — shown as bullet points." multiline rows={4} path={`${p}.highlights`} value={e.highlights} onChange={(highlights) => setE({ highlights })} />
                <TextField label="Tech stack" hint="Comma-separated, e.g. ABAP, RAP, CDS, CPI" path={`${p}.tech`} value={e.tech} onChange={(tech) => setE({ tech })} />
              </>
            );
          }}
        />
      </Section>

      <Section title="Projects" description="Notable projects, independent of employer. Hidden while empty.">
        {meta("projects")}
        <ListEditor
          items={v.projects.items}
          onChange={(items) => set("projects", { items })}
          create={() => ({ title: "", highlights: "", tech: "" })}
          max={20}
          addLabel="Add project"
          empty="No projects added yet."
          itemTitle={(p) => p.title}
          renderItem={(p, setP, i) => (
            <>
              <TextField label="Project name" path={`projects.items.${i}.title`} value={p.title} onChange={(title) => setP({ title })} />
              <TextField label="Highlights" hint="One point per line — shown as bullet points." multiline rows={3} path={`projects.items.${i}.highlights`} value={p.highlights} onChange={(highlights) => setP({ highlights })} />
              <TextField label="Tech stack" hint="Comma-separated" path={`projects.items.${i}.tech`} value={p.tech} onChange={(tech) => setP({ tech })} />
            </>
          )}
        />
      </Section>

      <Section title="Skills" description="Grouped skill lists (e.g. SAP technologies, tools, languages). Hidden while empty.">
        {meta("skills")}
        <ListEditor
          items={v.skills.groups}
          onChange={(groups) => set("skills", { groups })}
          create={() => ({ title: "", items: "" })}
          max={12}
          addLabel="Add skill group"
          empty="No skill groups added yet."
          itemTitle={(g) => g.title}
          renderItem={(g, setG, i) => (
            <>
              <TextField label="Group name" path={`skills.groups.${i}.title`} value={g.title} onChange={(title) => setG({ title })} />
              <TextField label="Skills" hint="One per line." multiline rows={4} path={`skills.groups.${i}.items`} value={g.items} onChange={(items) => setG({ items })} />
            </>
          )}
        />
      </Section>

      <Section title="Testimonials" description="Quotes from clients or colleagues. Hidden while empty.">
        {meta("testimonials")}
        <ListEditor
          items={v.testimonials.items}
          onChange={(items) => set("testimonials", { items })}
          create={() => ({ quote: "", name: "", role: "" })}
          max={12}
          addLabel="Add testimonial"
          empty="No testimonials added yet."
          itemTitle={(t) => t.name}
          renderItem={(t, setT, i) => (
            <>
              <TextField label="Quote" multiline rows={3} path={`testimonials.items.${i}.quote`} value={t.quote} onChange={(quote) => setT({ quote })} />
              <Grid>
                <TextField label="Name" path={`testimonials.items.${i}.name`} value={t.name} onChange={(name) => setT({ name })} />
                <TextField label="Role / company" path={`testimonials.items.${i}.role`} value={t.role} onChange={(role) => setT({ role })} placeholder="IT Manager, PT Example" />
              </Grid>
            </>
          )}
        />
      </Section>

      <Section title="Education & certifications" description="Hidden while empty.">
        {meta("credentials")}
        <ListEditor
          items={v.credentials.items}
          onChange={(items) => set("credentials", { items })}
          create={() => ({ title: "", issuer: "", year: "" })}
          max={20}
          addLabel="Add entry"
          empty="No education or certifications added yet."
          itemTitle={(c) => c.title}
          renderItem={(c, setC, i) => (
            <div className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr]">
              <TextField label="Title" path={`credentials.items.${i}.title`} value={c.title} onChange={(title) => setC({ title })} placeholder="SAP Certified – ABAP Cloud" />
              <TextField label="Issuer / school" path={`credentials.items.${i}.issuer`} value={c.issuer} onChange={(issuer) => setC({ issuer })} />
              <TextField label="Year" path={`credentials.items.${i}.year`} value={c.year} onChange={(year) => setC({ year })} />
            </div>
          )}
        />
      </Section>

      <Section title="How it works & pricing" description="The pricing note is shown under the process steps.">
        {meta("process")}
        <ListEditor
          items={v.process.steps}
          onChange={(steps) => set("process", { steps })}
          create={() => ({ title: "", body: "" })}
          max={10}
          addLabel="Add step"
          itemTitle={(s) => s.title}
          renderItem={(s, setS, i) => (
            <>
              <TextField label="Step title" path={`process.steps.${i}.title`} value={s.title} onChange={(title) => setS({ title })} />
              <TextField label="Text" multiline rows={2} path={`process.steps.${i}.body`} value={s.body} onChange={(body) => setS({ body })} />
            </>
          )}
        />
        <div className="space-y-4 border-t border-border pt-4">
          <Toggle label="Show pricing note" checked={v.pricing.show} onChange={(show) => set("pricing", { show })} />
          <TextField label="Pricing — title" path="pricing.title" value={v.pricing.title} onChange={(title) => set("pricing", { title })} />
          <TextField label="Pricing — text" multiline path="pricing.body" value={v.pricing.body} onChange={(body) => set("pricing", { body })} />
        </div>
      </Section>

      <Section title="Closing call-to-action" description="The dark band at the bottom with your contact buttons.">
        <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
          <TextField label="Small label" hint="Shown as [ label ] above the title." path="cta.eyebrow" value={v.cta.eyebrow} onChange={(eyebrow) => set("cta", { eyebrow })} />
          <TextField label="Title" path="cta.title" value={v.cta.title} onChange={(title) => set("cta", { title })} />
        </div>
        <TextField label="Text" multiline rows={2} path="cta.body" value={v.cta.body} onChange={(body) => set("cta", { body })} />
        <div className="space-y-4 border-t border-border pt-4">
          <Toggle label="Show “see the work first” links" hint="Links to Articles and Tools under the contact buttons." checked={v.proof.show} onChange={(show) => set("proof", { show })} />
          <TextField label="Title" path="proof.title" value={v.proof.title} onChange={(title) => set("proof", { title })} />
          <TextField label="Text" multiline rows={2} path="proof.body" value={v.proof.body} onChange={(body) => set("proof", { body })} />
          <Grid>
            <TextField label="Articles link label" path="proof.articlesLabel" value={v.proof.articlesLabel} onChange={(articlesLabel) => set("proof", { articlesLabel })} />
            <TextField label="Tools link label" path="proof.toolsLabel" value={v.proof.toolsLabel} onChange={(toolsLabel) => set("proof", { toolsLabel })} />
          </Grid>
        </div>
      </Section>

      <Section title="SEO">
        <TextField label="Meta description" multiline rows={2} path="metaDescription" value={v.metaDescription} onChange={(metaDescription) => setV((prev) => ({ ...prev, metaDescription }))} />
      </Section>
    </SettingsForm>
  );
}
