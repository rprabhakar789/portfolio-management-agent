import path from "node:path";

import YAML from "yaml";
import { z } from "zod";

export const ALLOWED_CONTENT_PATHS = [
  "content/about.md",
  "content/experience.yaml",
  "content/projects.yaml",
  "content/education.yaml",
  "content/skills.yaml",
  "content/contact.yaml",
] as const;

export type AllowedContentPath = (typeof ALLOWED_CONTENT_PATHS)[number];

const nonEmptyString = z.string().trim().min(1);

const experienceEntrySchema = z.object({
  company: nonEmptyString,
  role: nonEmptyString,
  period: nonEmptyString,
  location: nonEmptyString.optional(),
  summary: nonEmptyString.optional(),
  highlights: z.array(nonEmptyString).min(1),
});

const projectLinkSchema = z.object({
  label: nonEmptyString,
  url: z.string().url(),
});

const projectEntrySchema = z.object({
  name: nonEmptyString,
  summary: nonEmptyString,
  technologies: z.array(nonEmptyString).min(1),
  featured: z.boolean().optional(),
  links: z.array(projectLinkSchema).default([]),
});

const educationEntrySchema = z.object({
  institution: nonEmptyString,
  degree: nonEmptyString,
  period: nonEmptyString,
  location: nonEmptyString.optional(),
  highlights: z.array(nonEmptyString).default([]),
});

const skillItemSchema = z.object({
  name: nonEmptyString,
  level: z.number().int().min(0).max(100).optional(),
  notes: nonEmptyString.optional(),
});

const skillCategorySchema = z.object({
  category: nonEmptyString,
  items: z.array(skillItemSchema).min(1),
});

const contactLinkSchema = z.object({
  label: nonEmptyString,
  url: z.string().url(),
});

const contactSchema = z.object({
  email: z.string().email(),
  phone: nonEmptyString.optional(),
  location: nonEmptyString.optional(),
  links: z.array(contactLinkSchema).default([]),
});

type ContentFormat = "markdown" | "yaml";

interface ContentFileSpec<TValue> {
  format: ContentFormat;
  schema: z.ZodType<TValue>;
  promptHint: string;
}

const markdownSchema = nonEmptyString;

const yamlArraySchema = <TValue>(entrySchema: z.ZodType<TValue>) =>
  z.array(entrySchema).min(1);

export const CONTENT_FILE_SPECS = {
  "content/about.md": {
    format: "markdown",
    schema: markdownSchema,
    promptHint:
      "Markdown prose for the About section. Preserve headings only if they already exist.",
  },
  "content/experience.yaml": {
    format: "yaml",
    schema: yamlArraySchema(experienceEntrySchema),
    promptHint:
      "YAML array of roles with company, role, period, optional location/summary, and highlights.",
  },
  "content/projects.yaml": {
    format: "yaml",
    schema: yamlArraySchema(projectEntrySchema),
    promptHint:
      "YAML array of projects with name, summary, technologies, optional featured flag, and links.",
  },
  "content/education.yaml": {
    format: "yaml",
    schema: yamlArraySchema(educationEntrySchema),
    promptHint:
      "YAML array of education entries with institution, degree, period, and optional highlights.",
  },
  "content/skills.yaml": {
    format: "yaml",
    schema: yamlArraySchema(skillCategorySchema),
    promptHint:
      "YAML array of skill categories. Each category has items with name and optional level/notes.",
  },
  "content/contact.yaml": {
    format: "yaml",
    schema: contactSchema,
    promptHint:
      "YAML object with email, optional phone/location, and links as label/url pairs.",
  },
} satisfies Record<AllowedContentPath, ContentFileSpec<unknown>>;

export function isAllowedContentPath(pathname: string): pathname is AllowedContentPath {
  return (ALLOWED_CONTENT_PATHS as readonly string[]).includes(pathname);
}

export function normalizeRepoPath(pathname: string): string {
  return path.posix.normalize(pathname.replaceAll("\\", "/")).replace(/^\/+/, "");
}

export function getContentFileSpec(pathname: AllowedContentPath) {
  return CONTENT_FILE_SPECS[pathname];
}

export function parseContentFile(
  pathname: AllowedContentPath,
  rawContent: string,
): unknown {
  const spec = getContentFileSpec(pathname);
  if (spec.format === "markdown") {
    return spec.schema.parse(rawContent.trim());
  }

  return spec.schema.parse(YAML.parse(rawContent));
}

export function serializeContentFile(
  pathname: AllowedContentPath,
  contentValue: unknown,
): string {
  const spec = getContentFileSpec(pathname);
  const validatedValue = spec.schema.parse(contentValue);

  if (spec.format === "markdown") {
    return `${validatedValue}\n`;
  }

  return YAML.stringify(validatedValue, {
    lineWidth: 0,
  });
}

export function describeContentSchemas(): string {
  return ALLOWED_CONTENT_PATHS.map((pathname) => {
    const spec = getContentFileSpec(pathname);
    return `- ${pathname}: ${spec.promptHint}`;
  }).join("\n");
}
