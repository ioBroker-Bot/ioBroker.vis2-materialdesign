import React from 'react';
import { describe, expect, it } from 'vitest';

import MaterialDesignIconList from './MaterialDesignIconList';
import MaterialDesignList from './MaterialDesignList';
import MaterialDesignTable from './MaterialDesignTable';
import MaterialDesignTopAppBar from './MaterialDesignTopAppBar';

function fixture<T>(value: unknown): T { return value as T; }

function styleChildren(node: React.ReactNode): unknown[] {
    if (Array.isArray(node)) return node.flatMap(child => styleChildren(child));
    if (!React.isValidElement(node)) return [];
    const { children } = node.props as { children?: React.ReactNode };
    return node.type === 'style' ? [children] : styleChildren(children);
}

type Widget = { new (props: never): { state: unknown; renderWidgetBody(props: never): React.ReactNode } };

function render(Widget: Widget, rxData: Record<string, unknown>): unknown[] {
    const widget = new Widget(fixture<never>({ context: { setValue: () => undefined } }));
    widget.state = { rxData, values: {} };
    return styleChildren(widget.renderWidgetBody(fixture<never>({})));
}

// React 19's server renderer drops a <style> whose children are an array and writes `<style></style>`.
// The client renderer still joins them, so the widgets looked fine in vis-2 while every
// renderToStaticMarkup test of their CSS failed on React 19.
describe('widget <style> elements', () => {
    const widgets: Array<[string, Widget, Record<string, unknown>, string]> = [
        ['icon list', MaterialDesignIconList, {}, '.materialdesign-icon-list'],
        ['list', MaterialDesignList, { colorListItemSelected: 'red', colorSwitchHover: 'blue' }, 'focus-visible{background:red'],
        ['table', MaterialDesignTable, {}, '.materialdesign-table'],
        ['top app bar', MaterialDesignTopAppBar, { colorListItemHover: 'red', colorListSubItemHover: 'blue' }, 'isSubItem):hover{background:red'],
    ];

    for (const [name, Widget, optionalCss, expected] of widgets) {
        for (const designStyle of ['legacy', 'material3', undefined]) {
            it(`${name} (${designStyle ?? 'project default'}) passes its CSS as one string`, () => {
                for (const rxData of [{ designStyle }, { designStyle, ...optionalCss }]) {
                    const styles = render(Widget, rxData);
                    expect(styles.length).toBeGreaterThan(0);
                    for (const css of styles) expect(typeof css).toBe('string');
                }
                expect(String(render(Widget, { designStyle, ...optionalCss })[0])).toContain(expected);
            });
        }
    }

    it('keeps the Material 3 rules apart from the legacy ones', () => {
        expect(String(render(MaterialDesignTable, { designStyle: 'material3' })[0])).toContain('-card{background:var(--md-sys-color-surface-container-low)');
        expect(String(render(MaterialDesignTable, { designStyle: 'legacy' })[0])).not.toContain('-card{background:var(--md-sys-color-surface-container-low)');
    });
});
