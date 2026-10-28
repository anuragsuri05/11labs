import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const PAGES = [
  { path: '/', title: 'Home' },
  { path: '/text-to-speech', title: 'Text to Speech' },
  { path: '/voice-changer', title: 'Voice Changer' },
  { path: '/sound-effects', title: 'Sound Effects' },
  { path: '/music', title: 'Music' },
  { path: '/speech-to-text', title: 'Speech to Text' },
  { path: '/voice-isolator', title: 'Voice Isolator' },
  { path: '/voices', title: 'Voices' },
  { path: '/history', title: 'History' },
  { path: '/api', title: 'API' },
];

/** Collects console errors and uncaught exceptions for the lifetime of the page. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Completion polling of a streamed generation: GET /v1/history/{id} is 404 by design until it finishes.
    if (/\/v1\/history\/[^/?]+$/.test(m.location().url) && m.text().includes('404')) return;
    errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

/**
 * Asserts nothing is wider than the viewport. The app shell clips horizontally (overflow-hidden),
 * so the scrolling <main> is checked too: content that would be cut off on the right shows up there.
 */
export async function expectNoHorizontalOverflow(page: Page) {
  const m = await page.evaluate(() => {
    const de = document.documentElement;
    const main = document.querySelector('main');
    return {
      doc: { scroll: de.scrollWidth, client: de.clientWidth },
      main: main ? { scroll: main.scrollWidth, client: main.clientWidth } : null,
    };
  });
  expect(m.doc.scroll, 'document is wider than the viewport').toBeLessThanOrEqual(m.doc.client);
  if (m.main) expect(m.main.scroll, '<main> content is wider than the viewport').toBeLessThanOrEqual(m.main.client);
}

export interface ApiModel {
  model_id: string;
  name: string;
}

export async function listModels(request: APIRequestContext): Promise<ApiModel[]> {
  const res = await request.get('/v1/models');
  expect(res.ok(), 'GET /v1/models').toBeTruthy();
  return res.json();
}
