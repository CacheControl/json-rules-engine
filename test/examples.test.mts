import { beforeAll, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import rulesEngineDefault, * as ruleEngine from '../src/index.mjs';

const exampleDir = resolve(__dirname, '../examples');

describe('examples', () => {
    beforeAll(() => {
        vi.mock('json-rules-engine', () => ({...ruleEngine, default: rulesEngineDefault }));
    });

    beforeEach(() => {
        vi.spyOn(console, 'log');
        vi.spyOn(console, 'error');
    })

    it.each(readdirSync(exampleDir).filter(fileName => fileName.endsWith(".mts")))('example %s', async (filename) => {
        await (await import(resolve(exampleDir, filename))).default;
        expect.soft((console.log as Mock).mock.calls).toMatchSnapshot("expected consistent console logs");
        expect.soft((console.error as Mock).mock.calls).toMatchSnapshot("expected consistent console errors");
    })
})