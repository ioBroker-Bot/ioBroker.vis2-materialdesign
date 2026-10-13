"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function readJson(file) {
    return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function walk(dir, predicate, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, predicate, files);
        } else if (predicate(full)) {
            files.push(full);
        }
    }
    return files;
}

const pkg = readJson("package.json");
const io = readJson("io-package.json");

assert.strictEqual(pkg.name, `iobroker.${io.common.name}`);
assert.strictEqual(pkg.version, io.common.version);
assert.strictEqual(pkg.license, io.common.licenseInformation.license);
assert.strictEqual(pkg.repository.type, "git");
assert.ok(fs.existsSync(path.join(root, pkg.main)), "package.json main must exist");
assert.ok(fs.existsSync(path.join(root, "README.md")), "README.md must exist");
assert.ok(fs.existsSync(path.join(root, "LICENSE")), "LICENSE must exist");
assert.ok(Object.keys(io.common.news).length <= 7, "common.news must contain maximum 7 entries");
assert.ok(!io.common.main, "WWW-only adapter must not point to missing main.js");
assert.strictEqual(io.common.onlyWWW, true);
assert.strictEqual(io.native.sentryReport, false);
assert.strictEqual(io.common.adminUI.config, "html", "React admin must use the HTML admin UI");
assert.ok(fs.existsSync(path.join(root, "admin", "index.html")), "React admin build entry point must exist");
assert.ok(fs.existsSync(path.join(root, "admin", "assets", "index.js")), "React admin bundle must exist");
assert.ok(fs.existsSync(path.join(root, "src-admin", "src", "main.tsx")), "React admin source must exist");

const sentry = io.instanceObjects.find((obj) => obj._id === "sentry");
assert.ok(sentry, "sentry state must exist");
assert.strictEqual(sentry.common.def, false);

const widgetRegistry = io.common.visWidgets.vis2MaterialDesignWidgets;
assert.ok(widgetRegistry, "VIS2 widget registry must exist");
const vite = fs.readFileSync(path.join(root, "src-widgets-ts", "vite.config.ts"), "utf8");
const exposedComponents = [...vite.matchAll(/["']\.\/(MaterialDesign[^"']+)["']\s*:/g)].map((match) => match[1]).sort();
assert.deepStrictEqual(
    [...widgetRegistry.components].sort(),
    exposedComponents,
    "io-package.json components and Vite MaterialDesign exposes must match exactly",
);
const widgetUtils = fs.readFileSync(path.join(root, "src-widgets-ts", "src", "widgetUtils.tsx"), "utf8");
assert.ok(widgetUtils.includes("name: 'useTheme'"), "all VIS2 widgets must expose the legacy theme action");
assert.ok(widgetUtils.includes("__mdwThemeDark"), "VIS2 widgets must subscribe to the theme selector state");
assert.ok(widgetUtils.includes("applyThemeVariables"), "VIS2 widgets must apply theme state values as CSS variables");
const requiredComponents = [
    "MaterialDesignCalendar",
    "MaterialDesignChartBar",
    "MaterialDesignChartPie",
    "MaterialDesignChartJson",
    "MaterialDesignChartLineHistory",
    "MaterialDesignDialogView",
    "MaterialDesignDialogIFrame",
    "MaterialDesignMasonryViews",
    "MaterialDesignGridViews",
    "MaterialDesignAdvancedViewInWidget",
    "MaterialDesignAdvancedViewInWidget8",
];
for (const component of requiredComponents) {
    assert.ok(widgetRegistry.components.includes(component), `${component} must be registered in io-package.json`);
    assert.ok(vite.includes(`./${component}`), `${component} must be exposed by Vite`);
    assert.ok(fs.existsSync(path.join(root, "src-widgets-ts", "src", `${component}.tsx`)), `${component} source must exist`);
}

// Every ported widget must be registered in io-package.json, exposed by Vite, and have source.
// This list used to be cross-checked against the VIS1 legacy templates in
// widgets/materialdesign.html; that legacy bundle has been removed, so the list is now the
// authoritative set of VIS2 counterparts on its own.
const portedComponents = [
    "MaterialDesignAlerts",
    "MaterialDesignAutocomplete",
    "MaterialDesignButtonAdition",
    "MaterialDesignButtonAditionVertical",
    "MaterialDesignButtonLink",
    "MaterialDesignButtonLinkVertical",
    "MaterialDesignButtonNavigation",
    "MaterialDesignButtonNavigationVertical",
    "MaterialDesignButtonState",
    "MaterialDesignButtonStateMulti",
    "MaterialDesignButtonStateMultiVertical",
    "MaterialDesignButtonStateVertical",
    "MaterialDesignButtonToggle",
    "MaterialDesignButtonToggleVertical",
    "MaterialDesignCalendar",
    "MaterialDesignCard",
    "MaterialDesignChartBar",
    "MaterialDesignChartJson",
    "MaterialDesignChartLineHistory",
    "MaterialDesignChartPie",
    "MaterialDesignCheckbox",
    "MaterialDesignColorScheme",
    "MaterialDesignGridViews",
    "MaterialDesignIcon",
    "MaterialDesignIconButtonAdition",
    "MaterialDesignIconButtonLink",
    "MaterialDesignIconButtonNavigation",
    "MaterialDesignIconButtonSlider",
    "MaterialDesignIconButtonState",
    "MaterialDesignIconButtonStateMulti",
    "MaterialDesignIconButtonToggle",
    "MaterialDesignIconList",
    "MaterialDesignInput",
    "MaterialDesignInstalledVersion",
    "MaterialDesignList",
    "MaterialDesignMasonryViews",
    "MaterialDesignProgress",
    "MaterialDesignProgressCircular",
    "MaterialDesignSelect",
    "MaterialDesignRoundSlider",
    "MaterialDesignSwitch",
    "MaterialDesignTable",
    "MaterialDesignTopAppBar",
    "MaterialDesignDialogView",
    "MaterialDesignDialogIFrame",
    "MaterialDesignSlider",
    "MaterialDesignValue",
    "MaterialDesignAdvancedViewInWidget",
    "MaterialDesignAdvancedViewInWidget8",
];
for (const component of portedComponents) {
    assert.ok(widgetRegistry.components.includes(component), `${component} must be registered in io-package.json`);
    assert.ok(vite.includes(`./${component}`), `${component} must be exposed by Vite`);
    assert.ok(fs.existsSync(path.join(root, "src-widgets-ts", "src", `${component}.tsx`)), `${component} source must exist`);
}
assert.strictEqual(widgetRegistry.components.length, portedComponents.length, "io-package.json must register exactly the ported VIS2 components");
assert.ok(fs.existsSync(path.join(root, "widgets", "vis2-materialdesign", "materialdesign-widgets-click-sound.mp3")), "VIS2 click sound must be packaged");

// The React 18 copies of react/jsx-runtime and react-dom that the widget bundle carries as share
// fallbacks read React's internals the moment they are evaluated. Under vis-2 with React 19 those
// internals are gone, so a fallback that is evaluated before the share scope is asked crashes the
// whole widget set (ioBroker.vis-2#689). A fallback may therefore never be in the static import
// closure of the remote entry or of an exposed widget; a loader chunk that is itself only reached
// through import() may import it statically.
function eagerFallbacks(chunks, entries) {
    const isFallback = (code) =>
        code.includes("__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner") ||
        (code.includes("createPortal=") && code.includes(".__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED="));
    const offenders = [];
    for (const entry of entries) {
        const seen = new Set();
        const stack = [entry];
        while (stack.length) {
            const name = stack.pop();
            if (seen.has(name) || chunks[name] === undefined) {
                continue;
            }
            seen.add(name);
            if (isFallback(chunks[name])) {
                offenders.push(`${entry} -> ${name}`);
            }
            for (const match of chunks[name].matchAll(/(?:from|import)\s*"\.\/(?:assets\/)?([^"]+)"/g)) {
                stack.push(match[1]);
            }
        }
    }
    return offenders;
}
const jsxFallback = "var o=t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;export{o as jsx};";
const domFallback = "var c=1;exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=x;exports.createPortal=c;";
assert.deepStrictEqual(
    eagerFallbacks({ "widget.js": 'import{n as e}from"./jsx.js";', "jsx.js": jsxFallback }, ["widget.js"]),
    ["widget.js -> jsx.js"],
);
// Through a chain of static imports, and from the remote entry, which names its chunks below assets/.
assert.deepStrictEqual(
    eagerFallbacks({ "entry.js": 'import"./assets/a.js";', "a.js": 'import"./dom.js";', "dom.js": domFallback }, ["entry.js"]),
    ["entry.js -> dom.js"],
);
// A fallback behind import(), directly or through a loader that imports it statically, is fine.
assert.deepStrictEqual(eagerFallbacks({ "map.js": "e(()=>import(`./jsx.js`));", "jsx.js": jsxFallback }, ["map.js"]), []);
assert.deepStrictEqual(
    eagerFallbacks({ "map.js": "e(()=>import(`./loader.js`));", "loader.js": 'import"./dom.js";', "dom.js": domFallback }, ["map.js"]),
    [],
);
// Import cycles end, missing chunks and an empty bundle pass.
assert.deepStrictEqual(eagerFallbacks({ "a.js": 'import"./b.js";', "b.js": 'import"./a.js";' }, ["a.js"]), []);
assert.deepStrictEqual(eagerFallbacks({ "widget.js": 'import"./gone.js";' }, ["widget.js"]), []);
assert.deepStrictEqual(eagerFallbacks({}, []), []);
const widgetDir = path.join(root, "widgets", "vis2-materialdesign");
const builtChunks = Object.fromEntries(
    fs.readdirSync(path.join(widgetDir, "assets"))
        .filter((name) => name.endsWith(".js"))
        .map((name) => [name, fs.readFileSync(path.join(widgetDir, "assets", name), "utf8")]),
);
builtChunks["customWidgets.js"] = fs.readFileSync(path.join(widgetDir, "customWidgets.js"), "utf8");
const entries = Object.keys(builtChunks).filter(
    (name) => name === "customWidgets.js" || widgetRegistry.components.some((component) => name.startsWith(`${component}-`)),
);
// Not one chunk per widget: MaterialDesignProgress is also imported by other widgets, so the
// bundler splits it into its expose chunk and a shared one of the same name. Both count as entries.
for (const component of widgetRegistry.components) {
    assert.ok(entries.some((name) => name.startsWith(`${component}-`)), `a chunk of ${component} must exist - run npm run build`);
}
assert.deepStrictEqual(
    eagerFallbacks(builtChunks, entries),
    [],
    "React 18 share fallbacks must only be loaded through import(), or the widget set crashes on vis-2 with React 19",
);

for (const file of walk(path.join(root, "admin"), (name) => name.endsWith(".json") && !name.endsWith("tsconfig.json"))) {
    JSON.parse(fs.readFileSync(file, "utf8"));
}

const i18nDir = path.join(root, "admin", "i18n");
const languageFiles = fs.readdirSync(i18nDir).filter((name) => name.endsWith(".json"));
assert.ok(languageFiles.includes("en.json") && languageFiles.includes("de.json") && languageFiles.includes("ru.json"), "widget translations need en, de and ru");
const englishKeys = Object.keys(readJson("admin/i18n/en.json")).sort();
for (const file of languageFiles) {
    const content = fs.readFileSync(path.join(i18nDir, file), "utf8");
    assert.ok(!content.includes("Ã"), `${file} must not contain mojibake`);
    assert.deepStrictEqual(Object.keys(JSON.parse(content)).sort(), englishKeys, `${file} must contain the same keys as en.json`);
}

console.log("Package checks passed");
