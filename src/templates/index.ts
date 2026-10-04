import type { TemplateId } from '../config.js';
import { aurora } from './aurora.js';
import { mono } from './mono.js';
import { studio } from './studio.js';
import type { Template } from './shared.js';

export { aurora, mono, studio };
export type { Template, TemplateContext, CanvasSize, TemplateColors, BoxSpec } from './shared.js';

const REGISTRY: Record<TemplateId, Template> = { aurora, studio, mono };

export function getTemplate(id: TemplateId): Template {
  const t = REGISTRY[id];
  if (!t) throw new Error(`Unknown template "${id}"`);
  return t;
}

export function templateIds(): TemplateId[] {
  return Object.keys(REGISTRY) as TemplateId[];
}
