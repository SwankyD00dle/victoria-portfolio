import { body, grid, portfolioImage } from "./primitives";
import { project, projectHero } from "./project";
import {
  columnsSection,
  embedSection,
  gallerySection,
  mediaSection,
  splitSection,
  textSection,
} from "./sections";
import { aboutPage, siteSettings } from "./singletons";

export const schemaTypes = [
  body,
  grid,
  portfolioImage,
  textSection,
  splitSection,
  mediaSection,
  gallerySection,
  columnsSection,
  embedSection,
  projectHero,
  project,
  siteSettings,
  aboutPage,
];
