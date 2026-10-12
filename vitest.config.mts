import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        // The admin bundle is not otherwise unit-tested, but the M3 scheme generator lives there by
        // design (Phase 9.1: the color math must not reach the widget runtime) and it is the one
        // piece of admin code whose output every M3 widget depends on.
        include: ['src-widgets-ts/src/**/*.test.{ts,tsx}', 'src-widgets-ts/*.test.ts', 'src-admin/src/**/*.test.{ts,tsx}'],
        setupFiles: ['test/widgets.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary'],
            reportsDirectory: 'coverage',
            include: ['src-widgets-ts/src/**/*.{ts,tsx}'],
            // Everything below is a 3-16 line registration shim — one `createButtonClass(...)` /
            // `createViewClass(...)` call with no branch in it. They are excluded so the percentages
            // below describe the code that can actually be wrong, not ~30 files of boilerplate that
            // would inflate them. Anything with logic belongs in the measurement, not here.
            exclude: [
                'src-widgets-ts/src/**/*.test.{ts,tsx}',
                'src-widgets-ts/src/**/*.d.ts',
                'src-widgets-ts/src/generated/**',
                'src-widgets-ts/src/index.tsx',
                'src-widgets-ts/src/MaterialDesignAdvancedViewInWidget*.tsx',
                'src-widgets-ts/src/MaterialDesignButton{Adition,Link,Navigation,State,StateMulti,Toggle}{,Vertical}.tsx',
                'src-widgets-ts/src/MaterialDesignIconButton*.tsx',
                'src-widgets-ts/src/MaterialDesign{Checkbox,Switch}.tsx',
                'src-widgets-ts/src/MaterialDesignDialog{View,IFrame}.tsx',
                'src-widgets-ts/src/MaterialDesign{Grid,Masonry}Views.tsx',
            ],
            // Set just under the measured values (71.69 / 61.07 / 68.65 / 73.81), so removing a test
            // trips the gate. The previous numbers sat ~20 points below the actual coverage and
            // could only have failed after a collapse, which is not a gate.
            thresholds: {
                statements: 70,
                branches: 60,
                functions: 67,
                lines: 72,
            },
        },
    },
});
