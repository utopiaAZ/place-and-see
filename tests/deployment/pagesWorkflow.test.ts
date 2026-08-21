import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/deploy-pages.yml', 'utf8');

describe('GitHub Pages workflow', () => {
  it('uses official Pages actions and the dist artifact', () => {
    expect(workflow).toContain('actions/checkout@v6');
    expect(workflow).toContain('actions/setup-node@v7');
    expect(workflow).toContain('actions/configure-pages@v6');
    expect(workflow).toContain('actions/upload-pages-artifact@v5');
    expect(workflow).toContain('actions/deploy-pages@v5');
    expect(workflow).toMatch(/path: dist/);
  });

  it('has the required triggers, permissions and deployment environment', () => {
    expect(workflow).toMatch(/branches: \[main\]/);
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('name: github-pages');
    expect(workflow).toContain('steps.deployment.outputs.page_url');
  });

  it('validates before building and derives the base from Pages metadata', () => {
    expect(workflow.indexOf('npm run test')).toBeLessThan(workflow.indexOf('npm run build'));
    expect(workflow.indexOf('npm run validate:audio')).toBeLessThan(workflow.indexOf('npm run build'));
    expect(workflow).toContain('VITE_BASE_PATH: ${{ steps.pages.outputs.base_path }}/');
    expect(workflow).toContain('npm ci');
  });
});
