import type { z } from "zod";
import type {
  imageSchema,
  portfolioSchema,
  projectSchema,
  richTextSchema,
  sectionSchema,
  settingsSchema,
} from "./schema/portfolio-schema";

export type Portfolio = z.infer<typeof portfolioSchema>;
export type Project = z.infer<typeof projectSchema>;
export type PublicProject = Extract<Project, { visibility: "public" }>;
export type Section = z.infer<typeof sectionSchema>;
export type PortfolioImage = z.infer<typeof imageSchema>;
export type RichText = z.infer<typeof richTextSchema>;
export type SiteSettings = z.infer<typeof settingsSchema>;
