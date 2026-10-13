import React from 'react';

import type { RxWidgetInfo, WidgetData } from '@iobroker/types-vis-2';

import { renderIcon } from './MaterialDesignButtons';
import { fill, withAutoFill } from './deviceFill';
import { MAX_DYNAMIC_ITEMS, squarePreview, RenderProps, VisWidget, accessibleText, boundedCount, createInfo, designStyle, indexedFields, designStyleClasses, legacyInk, legacyOutline, legacySurface, iconField, itemCount, parseActionValue, safeWidgetUrl, setStateValue, stateValue, sanitizeHtml, stringValue, boolValue as b, numberValue as n, textValue as s } from './widgetUtils';

type Data = Record<string, unknown> & {
    listItemDataMethod?: string;
    countListItems?: number;
    json_string_oid?: string;
};

interface Item {
    listType: string;
    objectId: string;
    minWidth: string;
    usePercentOfRow: number;
    buttonStateValue: unknown;
    buttonNavView: string;
    buttonLink: string;
    buttonToggleValueTrue: unknown;
    buttonToggleValueFalse: unknown;
    readOnly: boolean;
    showValueLabel: boolean;
    valueAppendix: string;
    background: string;
    text: string;
    subText: string;
    image: string;
    imageColor: string;
    imageActive: string;
    imageActiveColor: string;
    buttonBackgroundColor: string;
    buttonBackgroundActiveColor: string;
    statusBarColor: string;
    statusBarColorActive: string;
    statusBarText: string;
    statusBarTextActive: string;
    lockEnabled: boolean;
    visibilityOid: string;
    visibilityCondition: string;
    visibilityConditionValue: unknown;
}

// Issue #15: picking the datapoint of a row fills what the object's own metadata already says.
const autoFillMap = {
    oid: [
        fill.name('label'),
        fill.place('subLabel'),
        fill.unit('valueAppendix'),
        fill.icon('listImage'),
        fill.readOnly('readOnly'),
    ],
};

const attrs: RxWidgetInfo['visAttrs'] = [
    { name: 'common', fields: [
        { name: 'wrapItems', label: 'wrapItems', type: 'checkbox', default: true },
        { name: 'maxItemsperRow', label: 'maxItemsperRow', type: 'number' },
        { name: 'itemGaps', label: 'itemGaps', type: 'number' },
        { name: 'vibrateOnMobilDevices', label: 'vibrateOnMobilDevices', type: 'number', default: 50 },
        { name: 'clickSoundPlay', label: 'clickSoundPlay', type: 'checkbox' },
        { name: 'clickSoundVolume', label: 'clickSoundVolume', type: 'slider', min: 0, max: 1, step: 0.1, default: 0.5 },
    ] },
    { name: 'listItemLayout', fields: [
        { name: 'listLayout', label: 'listLayout', type: 'select', options: ['standard', 'card', 'cardOutlined'], default: 'standard' },
        { name: 'containerBackgroundColor', label: 'containerBackgroundColor', type: 'color' },
        { name: 'itemBackgroundColor', label: 'itemBackgroundColor', type: 'color' },
        { name: 'itemLayout', label: 'itemLayout', type: 'select', options: ['vertical', 'horizontal'], default: 'vertical' },
        { name: 'iconItemMinWidth', label: 'iconItemMinWidth', type: 'number' },
        { name: 'iconItemMinHeight', label: 'iconItemMinHeight', type: 'number' },
        { name: 'iconHeight', label: 'iconHeight', type: 'number' },
        { name: 'horizontalIconContainerWidth', label: 'horizontalIconContainerWidth', type: 'number' },
        { name: 'verticalIconContainerHeight', label: 'verticalIconContainerHeight', type: 'number' },
        { name: 'buttonLayout', label: 'buttonLayout', type: 'select', options: ['round', 'square', 'full'], default: 'round' },
        { name: 'buttonHeight', label: 'buttonHeight', type: 'number' },
        { name: 'buttonColorPress', label: 'buttonColorPress', type: 'color' },
        { name: 'labelFontSize', label: 'labelFontSize', type: 'number' },
        { name: 'labelFontFamily', label: 'labelFontFamily', type: 'fontname' },
        { name: 'labelFontColor', label: 'labelFontColor', type: 'color' },
        { name: 'labelFontColorSelected', label: 'labelFontColorSelected', type: 'color' },
        { name: 'subLabelFontSize', label: 'subLabelFontSize', type: 'number' },
        { name: 'subLabelFontFamily', label: 'subLabelFontFamily', type: 'fontname' },
        { name: 'subLabelFontColor', label: 'subLabelFontColor', type: 'color' },
        { name: 'subLabelFontColorSelected', label: 'subLabelFontColorSelected', type: 'color' },
        { name: 'valueFontSize', label: 'valueFontSize', type: 'number' },
        { name: 'valueFontFamily', label: 'valueFontFamily', type: 'fontname' },
        { name: 'valueFontColor', label: 'valueFontColor', type: 'color' },
    ] },
    { name: 'listItemCardBackground', fields: [
        { name: 'cardUse', label: 'cardUse', type: 'checkbox' },
        { name: 'title', label: 'title', type: 'html' },
        { name: 'titleLayout', label: 'titleLayout', type: 'text' },
        { name: 'showScrollbar', label: 'showScrollbar', type: 'checkbox', default: true },
        { name: 'borderDistance', label: 'borderDistance', type: 'number' },
        { name: 'titleFontFamily', label: 'titleFontFamily', type: 'fontname' },
        { name: 'colorBackground', label: 'colorBackground', type: 'color' },
        { name: 'colorTitleSectionBackground', label: 'colorTitleSectionBackground', type: 'color' },
        { name: 'colorTextSectionBackground', label: 'colorTextSectionBackground', type: 'color' },
        { name: 'colorTitle', label: 'colorTitle', type: 'color' },
    ] },
    { name: 'iconListHeader', fields: [
        { name: 'headers', label: 'headers', type: 'html' },
        { name: 'alignment', label: 'alignment', type: 'select', options: ['flex-start', 'center', 'flex-end'], default: 'flex-start' },
        { name: 'header_height', label: 'header_height', type: 'number', default: 60 },
        { name: 'header_padding_left', label: 'header_padding_left', type: 'number', default: 16 },
        { name: 'header_padding_right', label: 'header_padding_right', type: 'number', default: 16 },
        { name: 'header_padding_top', label: 'header_padding_top', type: 'number', default: 6 },
        { name: 'header_padding_bottom', label: 'header_padding_bottom', type: 'number', default: 20 },
        { name: 'headerTextColor', label: 'headerTextColor', type: 'color' },
        { name: 'headerTextSize', label: 'headerTextSize', type: 'number' },
        { name: 'headerFontFamily', label: 'headerFontFamily', type: 'fontname' },
        iconField('headerImage', 'headerImage'),
        { name: 'headerImageColor', label: 'headerImageColor', type: 'color' },
        { name: 'headerImageHeight', label: 'headerImageHeight', type: 'slider', min: 0, max: 200, step: 1 },
    ] },
    { name: 'lock', fields: [
        { name: 'autoLockAfter', label: 'autoLockAfter', type: 'number', default: 10 },
        iconField('lockIcon', 'lockIcon', 'lock-outline'),
        { name: 'lockIconTop', label: 'lockIconTop', type: 'slider', min: 0, max: 100, step: 1, default: 5 },
        { name: 'lockIconLeft', label: 'lockIconLeft', type: 'slider', min: 0, max: 100, step: 1, default: 5 },
        { name: 'lockIconSize', label: 'lockIconSize', type: 'number' },
        { name: 'lockIconColor', label: 'lockIconColor', type: 'color' },
        { name: 'lockFilterGrayscale', label: 'lockFilterGrayscale', type: 'slider', min: 0, max: 100, step: 1, default: 30 },
        { name: 'lockApplyOnlyOnImage', label: 'lockApplyOnlyOnImage', type: 'checkbox', default: true },
    ] },
    { name: 'listItemData', fields: [
        { name: 'listItemDataMethod', label: 'listItemDataMethod', type: 'select', options: ['inputPerEditor', 'jsonStringObject'], default: 'inputPerEditor' },
        { name: 'countListItems', label: 'countListItems', type: 'number', default: 1 },
        { name: 'json_string_oid', label: 'json_string_oid', type: 'id' },
    ] },
    { name: 'rows', label: 'group_rows', indexFrom: 0, indexTo: 'countListItems', hidden: (data: WidgetData) => !!data.listItemDataMethod && data.listItemDataMethod !== 'inputPerEditor', fields: indexedFields([
        { name: 'listType', label: 'listType', type: 'select', options: ['text', 'buttonState', 'buttonToggle', 'buttonToggleValueTrue', 'buttonToggleValueFalse', 'buttonNav', 'buttonLink'], default: 'text' },
        { name: 'oid', label: 'oid', type: 'id' },
        { name: 'minWidth', label: 'minWidth', type: 'dimension' },
        { name: 'usePercentOfRow', label: 'usePercentOfRow', type: 'number' },
        { name: 'listTypeButtonStateValue', label: 'listTypeButtonStateValue', type: 'text' },
        { name: 'typeButtonToggleValueTrue', label: 'typeButtonToggleValueTrue', type: 'text' },
        { name: 'typeButtonToggleValueFalse', label: 'typeButtonToggleValueFalse', type: 'text' },
        { name: 'listTypeButtonNav', label: 'listTypeButtonNav', type: 'views' },
        { name: 'listTypeButtonLink', label: 'listTypeButtonLink', type: 'url' },
        { name: 'lockEnabled', label: 'lockEnabled', type: 'checkbox' },
        { name: 'readOnly', label: 'readOnly', type: 'checkbox' },
        { name: 'itemBackgroundColor', label: 'itemBackgroundColor', type: 'color' },
        { name: 'label', label: 'label', type: 'html' },
        { name: 'subLabel', label: 'subLabel', type: 'html' },
        { name: 'showValueLabel', label: 'showValueLabel', type: 'checkbox', default: true },
        { name: 'valueAppendix', label: 'valueAppendix', type: 'html' },
        { name: 'buttonBgColor', label: 'buttonBgColor', type: 'color' },
        { name: 'buttonBgColorActive', label: 'buttonBgColorActive', type: 'color' },
        iconField('listImage', 'listImage'),
        { name: 'listImageColor', label: 'listImageColor', type: 'color' },
        iconField('listImageActive', 'listImageActive'),
        { name: 'listImageActiveColor', label: 'listImageActiveColor', type: 'color' },
        { name: 'statusBarColor', label: 'statusBarColor', type: 'color' },
        { name: 'statusBarColorActive', label: 'statusBarColorActive', type: 'color' },
        { name: 'statusBarText', label: 'statusBarText', type: 'html' },
        { name: 'statusBarTextActive', label: 'statusBarTextActive', type: 'html' },
        { name: 'visibilityOid', label: 'visibilityOid', type: 'id' },
        { name: 'visibilityCondition', label: 'visibilityCondition', type: 'text', default: '==' },
        { name: 'visibilityConditionValue', label: 'visibilityConditionValue', type: 'text' },
    ], data => itemCount(data.countListItems)) },
];

const css = `
.materialdesign-icon-list-header{font-size:var(--materialdesign-icon-list-header-font-size);font-family:var(--materialdesign-icon-list-header-font-family);color:var(--materialdesign-icon-list-header-font-color)}
.materialdesign-icon-list-container{display:flex;margin:calc(-1 * var(--materialdesign-icon-list-items-gaps) + 3px);background:var(--materialdesign-icon-list-background)}
.materialdesign-icon-list-item{flex:1 1 calc(100% / var(--materialdesign-icon-list-items-per-row));min-width:var(--materialdesign-icon-list-items-min-width)!important;min-height:var(--materialdesign-icon-list-items-min-height)!important;display:flex;justify-content:center;flex-direction:row;flex-wrap:wrap;margin:var(--materialdesign-icon-list-items-gaps);position:relative}
.materialdesign-icon-list-item-standard{background:var(--materialdesign-color-item-surface,#fff)}.materialdesign-icon-list-item-card,.materialdesign-icon-list-item-card-layout-full{border-radius:4px;background:var(--materialdesign-color-item-surface,#fff);box-shadow:0 2px 1px -1px rgba(0,0,0,.2),0 1px 1px 0 rgba(0,0,0,.14),0 1px 3px 0 rgba(0,0,0,.12);box-sizing:border-box;color:var(--materialdesign-color-item-ink,#000)}.materialdesign-icon-list-item-card-layout-full{align-items:center}.materialdesign-icon-list-item-card--outlined{border:1px solid var(--materialdesign-color-card-outline,#e0e0e0)}
.materialdesign-icon-list-item-layout-vertical-image-container{position:relative;width:100%;text-align:center;height:var(--materialdesign-icon-list-item-layout-vertical-image-container-height);display:flex;align-items:center;justify-content:center}
.materialdesign-icon-list-item-text{width:calc(100% - 8px);font-size:var(--materialdesign-icon-list-items-text-font-size);font-family:var(--materialdesign-icon-list-items-text-font-family);color:var(--materialdesign-icon-list-items-text-font-color);text-overflow:ellipsis;overflow:hidden;padding:4px 4px 0;white-space:normal}.materialdesign-icon-list-item-subText{width:calc(100% - 8px);font-size:var(--materialdesign-icon-list-items-subText-font-size);font-family:var(--materialdesign-icon-list-items-subText-font-family);color:var(--materialdesign-icon-list-items-subText-font-color);text-overflow:ellipsis;overflow:hidden;padding:2px 4px 0;white-space:normal}.materialdesign-icon-list-item-value{width:100%;font-size:var(--materialdesign-icon-list-items-value-font-size);font-family:var(--materialdesign-icon-list-items-value-font-family);color:var(--materialdesign-icon-list-items-value-font-color);white-space:nowrap;text-overflow:ellipsis;overflow:hidden;padding:2px 4px 0}.materialdesign-icon-list-item-text-vertical{text-align:center}
.materialdesign-icon-list-item-layout-vertical-status-line,.materialdesign-icon-list-item-layout-horizontal-status-line{background:transparent;width:100%;align-self:flex-end}.materialdesign-icon-list-item-layout-vertical-status-line-card,.materialdesign-icon-list-item-layout-horizontal-status-line-card{background:transparent;width:100%;border-radius:0 0 4px 4px;align-self:flex-end}
.materialdesign-icon-list-item-layout-horizontal-image-container{position:relative;text-align:center;display:flex;justify-content:center;align-items:center;height:100%;width:var(--materialdesign-icon-list-item-layout-horizontal-image-container-width)}.materialdesign-icon-list-item-layout-horizontal-text-container{display:flex;flex-direction:column;flex-wrap:wrap;flex:1 1;margin-left:4px;justify-content:center}
.materialdesign-icon-list .materialdesign-html-card.mdc-card{border-radius:4px;background-color:var(--materialdesign-color-card-background);box-shadow:0 2px 1px -1px rgba(0,0,0,.2),0 1px 1px 0 rgba(0,0,0,.14),0 1px 3px 0 rgba(0,0,0,.12);display:flex;flex-direction:column;box-sizing:border-box;color:var(--materialdesign-color-item-ink,#000)}.materialdesign-icon-list .card-title-section{box-sizing:border-box;width:100%;padding:16px 16px 0;background-color:var(--materialdesign-color-card-title-section-background)}.materialdesign-icon-list .card-text-section.iconlist{box-sizing:border-box;padding:1px;background-color:var(--materialdesign-color-card-text-section-background)}.materialdesign-icon-list .card-title{color:var(--materialdesign-color-card-title);font-family:var(--materialdesign-font-card-title)}
.materialdesign-icon-list .materialdesign-button{font-family:var(--materialdesign-font-button);font-size:var(--materialdesign-font-size-button);font-weight:500;text-decoration:none;padding:0 8px;align-items:center;justify-content:center;box-sizing:border-box;height:36px;border:0;outline:0;line-height:inherit;user-select:none;overflow:hidden;vertical-align:middle;border-radius:4px}.materialdesign-icon-list .materialdesign-icon-button{border-radius:100%;width:48px;height:48px;font-size:24px;display:inline-block;box-sizing:border-box;border:0;outline:0;background-color:transparent;fill:currentColor;color:inherit;text-decoration:none;cursor:pointer;user-select:none}.materialdesign-icon-list .materialdesign-button,.materialdesign-icon-list .materialdesign-icon-button{-webkit-tap-highlight-color:transparent}.materialdesign-icon-list .materialdesign-iconList-button:active{box-shadow:inset 0 0 0 999px color-mix(in srgb,var(--materialdesign-color-icon-button-hover) 12%,transparent)}.materialdesign-icon-list .materialdesign-iconList-button:focus-visible{outline:2px solid #44739e;outline-offset:2px}
`;

// Scoped overrides for the static surface colors the css block above hardcodes.
const m3Css = `
.materialdesign-icon-list.mdw-style-material3 .materialdesign-icon-list-item-standard{background:transparent}
.materialdesign-icon-list.mdw-style-material3 .materialdesign-icon-list-item-card,.materialdesign-icon-list.mdw-style-material3 .materialdesign-icon-list-item-card-layout-full{background:var(--md-sys-color-surface-container-low);color:var(--md-sys-color-on-surface)}
.materialdesign-icon-list.mdw-style-material3 .materialdesign-icon-list-item-card--outlined{border-color:var(--md-sys-color-outline-variant)}
.materialdesign-icon-list.mdw-style-material3 .materialdesign-html-card.mdc-card{color:var(--md-sys-color-on-surface)}
`;

function getItem(data: Data, index: number, json?: Record<string, unknown>): Item {
    const get = (editorName: string, jsonName = editorName): unknown => json ? json[jsonName] : data[`${editorName}${index}`];
    const image = s(get('listImage', 'image'));
    // Left empty when unset: a defaulted color would count as "user picked one" and mask every SVG.
    const imageColor = s(get('listImageColor', 'imageColor'));
    const buttonBackgroundColor = s(get('buttonBgColor', 'buttonBackgroundColor'));
    const statusBarColor = s(get('statusBarColor'));
    const statusBarText = s(get('statusBarText'));
    return {
        listType: s(get('listType'), 'text'), objectId: s(get('oid', 'objectId')), minWidth: s(get('minWidth')), usePercentOfRow: n(get('usePercentOfRow')),
        buttonStateValue: get('listTypeButtonStateValue', 'buttonStateValue'), buttonNavView: s(get('listTypeButtonNav', 'buttonNavView')), buttonLink: s(get('listTypeButtonLink', 'buttonLink')),
        buttonToggleValueTrue: get('typeButtonToggleValueTrue', 'buttonToggleValueTrue'), buttonToggleValueFalse: get('typeButtonToggleValueFalse', 'buttonToggleValueFalse'), readOnly: b(get('readOnly')),
        showValueLabel: b(get('showValueLabel'), true), valueAppendix: s(get('valueAppendix')), background: s(get('itemBackgroundColor', 'background'), s(data.itemBackgroundColor)),
        text: s(get('label', 'text')), subText: s(get('subLabel', 'subText')), image, imageColor, imageActive: s(get('listImageActive', 'imageActive'), image), imageActiveColor: s(get('listImageActiveColor', 'imageActiveColor'), imageColor),
        buttonBackgroundColor, buttonBackgroundActiveColor: s(get('buttonBgColorActive', 'buttonBackgroundActiveColor'), buttonBackgroundColor), statusBarColor,
        statusBarColorActive: s(get('statusBarColorActive'), statusBarColor), statusBarText, statusBarTextActive: s(get('statusBarTextActive'), statusBarText), lockEnabled: b(get('lockEnabled')),
        visibilityOid: s(get('visibilityOid')), visibilityCondition: s(get('visibilityCondition')), visibilityConditionValue: get('visibilityConditionValue'),
    };
}

function isActive(item: Item, value: unknown): boolean {
    if (value !== undefined && value !== null && value !== '') {
        if (item.listType === 'buttonState') return stringValue(value) === stringValue(item.buttonStateValue);
        if (item.listType === 'buttonToggleValueTrue') return stringValue(value) === stringValue(item.buttonToggleValueTrue);
        if (item.listType === 'buttonToggleValueFalse') return stringValue(value) !== stringValue(item.buttonToggleValueFalse);
    }
    return value === true || value === 'true';
}

function isVisible(item: Item, value: unknown): boolean {
    if (!item.visibilityOid) return true;
    const expected = item.visibilityConditionValue;
    switch (item.visibilityCondition) {
        case '!=': return String(value) !== String(expected);
        case '<=': return n(value) <= n(expected);
        case '>=': return n(value) >= n(expected);
        case '<': return n(value) < n(expected);
        case '>': return n(value) > n(expected);
        case 'consist': return String(value).includes(String(expected));
        case 'not consist': return !String(value).includes(String(expected));
        case 'exist': return value !== undefined && value !== null;
        case 'not exist': return value === undefined || value === null;
        default: return String(value) === String(expected);
    }
}

function icon(value: string, color: string, height: number, recolor: boolean): React.JSX.Element | null {
    const result = renderIcon(value, color, height, recolor);
    return result ? <span className="materialdesign-icon-image iconlist-icon" style={{ alignItems: 'center', display: 'inline-flex' }}>{result}</span> : null;
}

export default class MaterialDesignIconList extends VisWidget {
    private readonly unlocked = new Set<number>();
    private readonly relockTimers = new Map<number, number>();

    private isM3(data: Data): boolean { return designStyle(data) === 'material3'; }
    private m3IconColor(data: Data, color: string): string { return color || (this.isM3(data) ? 'var(--md-sys-color-primary)' : '#44739e'); }

    static getWidgetInfo(): RxWidgetInfo {
        return { ...createInfo('tplVis2-materialdesign-Icon-List', 'Icon List', withAutoFill(attrs, autoFillMap), ['listItemLayout', 'listItemCardBackground', 'iconListHeader', 'lock']), visPrev: squarePreview('F0572'), visDefaultStyle: { width: 400, height: 270 } };
    }

    getWidgetInfo(): RxWidgetInfo { return MaterialDesignIconList.getWidgetInfo(); }

    componentWillUnmount(): void {
        for (const timer of this.relockTimers.values()) window.clearTimeout(timer);
        this.relockTimers.clear();
        super.componentWillUnmount();
    }

    private feedback(data: Data, sound: boolean): void {
        if (sound && b(data.clickSoundPlay)) {
            const audio = new Audio('widgets/vis2-materialdesign/materialdesign-widgets-click-sound.mp3');
            audio.volume = Math.max(0, Math.min(1, n(data.clickSoundVolume, 0.5)));
            void audio.play().catch(() => undefined);
        } else if (!sound && n(data.vibrateOnMobilDevices, 50) > 0) {
            navigator.vibrate?.(n(data.vibrateOnMobilDevices, 50));
        }
    }

    private unlock(index: number, data: Data): void {
        this.unlocked.add(index);
        window.clearTimeout(this.relockTimers.get(index));
        this.relockTimers.set(index, window.setTimeout(() => { this.relockTimers.delete(index); this.unlocked.delete(index); this.forceUpdate(); }, Math.min(86_400, Math.max(1, n(data.autoLockAfter, 10))) * 1000));
        this.forceUpdate();
    }

    private activate(item: Item, index: number, current: unknown, data: Data): void {
        if (item.readOnly) return;
        this.feedback(data, false);
        const locked = item.lockEnabled && !this.unlocked.has(index);
        if (['buttonToggle', 'buttonState', 'buttonToggleValueTrue', 'buttonToggleValueFalse'].includes(item.listType) && locked) { this.unlock(index, data); return; }
        if (item.listType === 'buttonToggle') setStateValue(this.props, item.objectId, !current);
        else if (item.listType === 'buttonState') setStateValue(this.props, item.objectId, parseActionValue(stringValue(item.buttonStateValue)));
        else if (item.listType === 'buttonToggleValueTrue') setStateValue(this.props, item.objectId, parseActionValue(String(String(current) === String(item.buttonToggleValueTrue) ? item.buttonToggleValueFalse : item.buttonToggleValueTrue)));
        else if (item.listType === 'buttonToggleValueFalse') setStateValue(this.props, item.objectId, parseActionValue(String(String(current) === String(item.buttonToggleValueFalse) ? item.buttonToggleValueTrue : item.buttonToggleValueFalse)));
        else if (item.listType === 'buttonNav') this.props.context?.changeView?.(item.buttonNavView);
        else if (item.listType === 'buttonLink') { const href = safeWidgetUrl(item.buttonLink); if (href) window.open(href, '_blank', 'noopener,noreferrer'); }
    }

    private actionProps(item: Item, index: number, current: unknown, data: Data): React.HTMLAttributes<HTMLDivElement> {
        const activate = (): void => this.activate(item, index, current, data);
        return {
            'aria-disabled': item.readOnly,
            'aria-label': accessibleText(item.text, VisWidget.t('ariaListItemAction')),
            onClick: activate,
            onKeyDown: event => { if (!item.readOnly && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); activate(); } },
            onPointerDown: () => this.feedback(data, true),
            role: 'button',
            tabIndex: item.readOnly ? -1 : 0,
        };
    }

    private renderLock(data: Data, locked: boolean): React.JSX.Element | null {
        if (!locked) return null;
        const size = n(data.lockIconSize, 0);
        return <span className="materialdesign-lock-icon" style={{ color: s(data.lockIconColor, '#B22222'), fontSize: size || undefined, height: size || undefined, left: `${n(data.lockIconLeft, 5)}%`, position: 'absolute', top: `${n(data.lockIconTop, 5)}%`, width: size || undefined }}>{renderIcon(s(data.lockIcon, 'lock-outline'), s(data.lockIconColor, '#B22222'), size || 16, !!data.lockIconColor)}</span>;
    }

    private renderButtonIcon(item: Item, index: number, data: Data, active: boolean, locked: boolean, current: unknown): React.JSX.Element {
        const height = n(data.iconHeight, 24);
        const image = active ? item.imageActive : item.image;
        const savedBackground = active ? item.buttonBackgroundActiveColor : item.buttonBackgroundColor;
        // On a token-filled active button the surface IS primary, so the icon default has to become
        // on-primary there, or icon and circle are one color.
        const savedColor = active ? item.imageActiveColor : item.imageColor;
        const color = this.isM3(data) && active && !savedBackground && !savedColor
            ? 'var(--md-sys-color-on-primary)'
            : this.m3IconColor(data, savedColor);
        // The icon-button background had no token fallback: it went transparent while the icon kept its
        // saved color — typically a white icon on the now-white view.
        const buttonBackground = savedBackground || (this.isM3(data) ? (active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)') : undefined);
        const action = this.actionProps(item, index, current, data);
        const filter = locked && b(data.lockApplyOnlyOnImage, true) ? `grayscale(${n(data.lockFilterGrayscale, 30)}%)` : undefined;
        if (s(data.buttonLayout, 'round') === 'round') {
            const buttonHeight = n(data.buttonHeight, height * 1.5);
            return <div style={{ textAlign: 'center', width: '100%' }}><div {...action} className="materialdesign-icon-button materialdesign-iconList-button" style={{ ['--materialdesign-color-icon-button-hover' as string]: item.readOnly ? 'transparent' : s(data.buttonColorPress), background: buttonBackground, cursor: item.readOnly ? 'default' : 'pointer', filter, height: buttonHeight, position: 'relative', width: buttonHeight }}><div className="materialdesign-button-body" style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}>{icon(image, color, height, !!savedColor)}</div></div></div>;
        }
        const buttonHeight = n(data.buttonHeight) > 0 ? n(data.buttonHeight) : '100%';
        return <div style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}><div {...action} className="materialdesign-button materialdesign-iconList-button" style={{ ['--materialdesign-color-icon-button-hover' as string]: item.readOnly ? 'transparent' : s(data.buttonColorPress), background: buttonBackground, cursor: item.readOnly ? 'default' : 'pointer', filter, height: buttonHeight, position: 'relative', width: '100%' }}><div className="materialdesign-button-body" style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}>{icon(image, color, height, !!savedColor)}</div></div></div>;
    }

    private renderItem(item: Item, index: number, data: Data): React.JSX.Element | null {
        const current = stateValue(this.state, item.objectId);
        if (item.listType !== 'text' && current === 'null') return null;
        if (!isVisible(item, stateValue(this.state, item.visibilityOid))) return null;
        const active = isActive(item, current);
        const locked = item.lockEnabled && !this.unlocked.has(index);
        const full = s(data.buttonLayout, 'round') === 'full' && item.listType !== 'text';
        const card = s(data.listLayout).includes('card');
        const classes = s(data.listLayout, 'standard') === 'standard' ? 'materialdesign-icon-list-item-standard' : `${full ? 'materialdesign-icon-list-item-card-layout-full' : 'materialdesign-icon-list-item-card'}${s(data.listLayout) === 'cardOutlined' ? ' materialdesign-icon-list-item-card--outlined' : ''}`;
        const percent = item.usePercentOfRow ? `calc(${item.usePercentOfRow}% - (${n(data.itemGaps, 4)}px + 6px) - (${n(data.maxItemsperRow, 1)} - 1) * ${n(data.itemGaps, 4)}px)` : undefined;
        const itemStyle: React.CSSProperties = { background: item.background || undefined, display: 'flex', filter: locked && !b(data.lockApplyOnlyOnImage, true) ? `grayscale(${n(data.lockFilterGrayscale, 30)}%)` : undefined, flexBasis: percent, minWidth: item.minWidth || undefined };
        const image = active ? item.imageActive : item.image;
        const savedColor = active ? item.imageActiveColor : item.imageColor;
        const color = this.m3IconColor(data, savedColor);
        const statusColor = active ? item.statusBarColorActive : item.statusBarColor;
        const statusText = active ? item.statusBarTextActive : item.statusBarText;
        const statusClass = `materialdesign-icon-list-item-layout-${s(data.itemLayout, 'vertical')}-status-line${card ? '-card' : ''}`;
        const status = <div className={statusClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(statusText) }} style={{ background: statusColor, minHeight: statusColor ? 4 : 0, visibility: statusColor || statusText ? 'visible' : 'collapse' }} />;
        const showValue = item.showValueLabel && (item.listType.includes('buttonToggle') || item.listType === 'buttonState');
        const value = current === 'null' || current === undefined || current === null ? '' : `${current}${item.valueAppendix}`;
        const labelStyle = { color: active ? s(data.labelFontColorSelected, s(data.labelFontColor)) : s(data.labelFontColor), cursor: !item.readOnly && full ? 'pointer' : undefined };
        const subStyle = { color: active ? s(data.subLabelFontColorSelected, s(data.subLabelFontColor)) : s(data.subLabelFontColor), cursor: !item.readOnly && full ? 'pointer' : undefined };
        const imageContent = item.listType === 'text' ? icon(image, color, n(data.iconHeight, 24), !!savedColor) : this.renderButtonIcon(item, index, data, active, locked, current);
        const action = this.actionProps(item, index, current, data);

        if (s(data.itemLayout, 'vertical') === 'vertical') {
            if (full) return <div className={`materialdesign-icon-list-item ${classes}`} data-oid={item.objectId} key={index} style={itemStyle}><div style={{ display: 'flex', flex: 1, flexDirection: 'column', height: '100%' }}><div style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}><div {...action} className="materialdesign-button materialdesign-iconList-button" style={{ background: active ? item.buttonBackgroundActiveColor : item.buttonBackgroundColor, borderBottomLeftRadius: statusColor || statusText ? 0 : undefined, borderBottomRightRadius: statusColor || statusText ? 0 : undefined, cursor: item.readOnly ? 'default' : 'pointer', height: '100%', padding: 0, position: 'relative', width: '100%' }}><div className="materialdesign-button-body" style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', width: '100%' }}>{item.text ? <label className="materialdesign-icon-list-item-text materialdesign-icon-list-item-text-vertical" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.text) }} style={labelStyle} /> : null}{image ? <div className="materialdesign-icon-list-item-layout-vertical-image-container">{icon(image, color, n(data.iconHeight, 24), !!savedColor)}{this.renderLock(data, locked)}</div> : null}{showValue ? <label className="materialdesign-icon-list-item-value materialdesign-icon-list-item-text-vertical" dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} /> : null}{item.subText ? <label className="materialdesign-icon-list-item-subText materialdesign-icon-list-item-text-vertical" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.subText) }} style={subStyle} /> : null}</div></div></div>{status}</div></div>;
            return <div className={`materialdesign-icon-list-item ${classes}`} data-oid={item.objectId} key={index} style={itemStyle}>{item.text ? <label className="materialdesign-icon-list-item-text materialdesign-icon-list-item-text-vertical" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.text) }} style={labelStyle} /> : null}{imageContent ? <div className="materialdesign-icon-list-item-layout-vertical-image-container">{imageContent}{this.renderLock(data, locked)}</div> : null}{showValue ? <label className="materialdesign-icon-list-item-value materialdesign-icon-list-item-text-vertical" dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} /> : null}{item.subText ? <label className="materialdesign-icon-list-item-subText materialdesign-icon-list-item-text-vertical" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.subText) }} style={subStyle} /> : null}{status}</div>;
        }

        if (full) return <div className={`materialdesign-icon-list-item ${classes}`} data-oid={item.objectId} key={index} style={itemStyle}><div style={{ display: 'flex', flex: 1, flexDirection: 'column', height: '100%' }}><div style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}><div {...action} className="materialdesign-button materialdesign-iconList-button" style={{ background: active ? item.buttonBackgroundActiveColor : item.buttonBackgroundColor, borderBottomLeftRadius: statusColor || statusText ? 0 : undefined, borderBottomRightRadius: statusColor || statusText ? 0 : undefined, cursor: item.readOnly ? 'default' : 'pointer', height: '100%', padding: 0, position: 'relative', width: '100%' }}><div className="materialdesign-button-body" style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}>{image ? <div className="materialdesign-icon-list-item-layout-horizontal-image-container">{icon(image, color, n(data.iconHeight, 24), !!savedColor)}{this.renderLock(data, locked)}</div> : null}<div className="materialdesign-icon-list-item-layout-horizontal-text-container" style={{ cursor: item.readOnly ? undefined : 'pointer' }}>{item.text ? <label className="materialdesign-icon-list-item-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.text) }} style={labelStyle} /> : null}{item.subText ? <label className="materialdesign-icon-list-item-subText" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.subText) }} style={subStyle} /> : null}{showValue ? <label className="materialdesign-icon-list-item-value" dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} /> : null}</div></div></div></div>{status}</div></div>;
        return <div className={`materialdesign-icon-list-item ${classes}`} data-oid={item.objectId} key={index} style={itemStyle}><div style={{ display: 'flex', flex: 1, flexDirection: 'column', height: '100%' }}><div style={{ display: 'flex', flex: 1 }}>{imageContent ? <div className="materialdesign-icon-list-item-layout-horizontal-image-container">{imageContent}{this.renderLock(data, locked)}</div> : null}<div className="materialdesign-icon-list-item-layout-horizontal-text-container">{item.text ? <label className="materialdesign-icon-list-item-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.text) }} style={labelStyle} /> : null}{item.subText ? <label className="materialdesign-icon-list-item-subText" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.subText) }} style={subStyle} /> : null}{showValue ? <label className="materialdesign-icon-list-item-value" dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} /> : null}</div></div>{status}</div></div>;
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as unknown as Data;
        const isM3 = this.isM3(data);
        const m3f = (v: unknown, token: string, fb: string): string => s(v) || (isM3 ? token : fb);
        // The classic card and its outline follow the theme; they used to stay white on a dark page.
        const isDark = this.isDarkTheme();
        let parsed: Record<string, unknown>[] | undefined;
        if (data.listItemDataMethod === 'jsonStringObject') {
            try { const value = JSON.parse(s(stateValue(this.state, s(data.json_string_oid)), '[]')); parsed = Array.isArray(value) ? value : []; }
            catch (error) { parsed = [{ text: '<font color="red"><b>Error in JSON string</b></font>', subText: `<label style="word-wrap:break-word;white-space:normal">${error instanceof Error ? error.message : String(error)}</label>` }]; }
        }
        const items = parsed ? parsed.slice(0, MAX_DYNAMIC_ITEMS).map((value, index) => getItem(data, index, value)) : Array.from({ length: boundedCount(data.countListItems, 1) }, (_, index) => getItem(data, index));
        const variables = {
            '--materialdesign-icon-list-header-font-color': m3f(data.headerTextColor, 'var(--md-sys-color-on-surface)', '#44739e'), '--materialdesign-icon-list-header-font-size': `${n(data.headerTextSize, 24)}px`, '--materialdesign-icon-list-header-font-family': s(data.headerFontFamily, 'inherit'), '--materialdesign-icon-list-background': s(data.containerBackgroundColor, 'transparent'),
            '--materialdesign-icon-list-items-per-row': n(data.maxItemsperRow, 1), '--materialdesign-icon-list-items-min-width': `${n(data.iconItemMinWidth, 50)}px`, '--materialdesign-icon-list-items-min-height': `${n(data.iconItemMinHeight, 0)}px`, '--materialdesign-icon-list-items-gaps': `${n(data.itemGaps, 4)}px`,
            '--materialdesign-icon-list-items-text-font-size': `${n(data.labelFontSize, 14)}px`, '--materialdesign-icon-list-items-text-font-family': s(data.labelFontFamily, 'inherit'), '--materialdesign-icon-list-items-text-font-color': m3f(data.labelFontColor, 'var(--md-sys-color-on-surface)', '#44739e'), '--materialdesign-icon-list-items-subText-font-size': `${n(data.subLabelFontSize, 12)}px`, '--materialdesign-icon-list-items-subText-font-family': s(data.subLabelFontFamily, 'inherit'), '--materialdesign-icon-list-items-subText-font-color': m3f(data.subLabelFontColor, 'var(--md-sys-color-on-surface-variant)', 'rgba(0,0,0,.54)'),
            '--materialdesign-icon-list-items-value-font-size': `${n(data.valueFontSize, 12)}px`, '--materialdesign-icon-list-items-value-font-family': s(data.valueFontFamily, 'inherit'), '--materialdesign-icon-list-items-value-font-color': m3f(data.valueFontColor, 'var(--md-sys-color-on-surface-variant)', '#44739e'), '--materialdesign-icon-list-item-layout-horizontal-image-container-width': n(data.horizontalIconContainerWidth) ? `${n(data.horizontalIconContainerWidth)}px` : 'auto', '--materialdesign-icon-list-item-layout-vertical-image-container-height': n(data.verticalIconContainerHeight) ? `${n(data.verticalIconContainerHeight)}px` : 'auto',
            '--materialdesign-font-card-title': s(data.titleFontFamily, 'inherit'), '--materialdesign-color-card-background': m3f(data.colorBackground, 'var(--md-sys-color-surface-container-low)', legacySurface(isDark)), '--materialdesign-color-card-outline': isM3 ? 'var(--md-sys-color-outline-variant)' : legacyOutline(isDark), '--materialdesign-color-item-surface': isM3 ? 'var(--md-sys-color-surface-container-low)' : legacySurface(isDark), '--materialdesign-color-item-ink': isM3 ? 'var(--md-sys-color-on-surface)' : legacyInk(isDark), '--materialdesign-color-card-title-section-background': s(data.colorTitleSectionBackground, 'transparent'), '--materialdesign-color-card-text-section-background': s(data.colorTextSectionBackground, 'transparent'), '--materialdesign-color-card-title': m3f(data.colorTitle, 'var(--md-sys-color-on-surface)', '#44739e'),
        } as React.CSSProperties;
        const headerHeight = n(data.header_height, 60);
        const header = s(data.headers) ? <div className="materialdesign-widget materialdesign-html-card" style={{ flex: '0 0 auto', position: 'relative' }}><div className="materialdesign-list-header-row" style={{ alignItems: 'center', background: 'transparent', boxSizing: 'border-box', display: 'flex', flexDirection: 'row', justifyContent: s(data.alignment, 'flex-start'), margin: '8px 3px 3px', minHeight: headerHeight, padding: `${n(data.header_padding_top, 6)}px ${n(data.header_padding_right, 16)}px ${n(data.header_padding_bottom, 0)}px ${n(data.header_padding_left, 16)}px`, textAlign: s(data.alignment, 'flex-start').replace('flex-', '') as React.CSSProperties['textAlign'], width: 'calc(100% - 6px)' }}>{icon(s(data.headerImage), m3f(data.headerImageColor, 'var(--md-sys-color-on-surface-variant)', ''), n(data.headerImageHeight, 24), !!data.headerImageColor)}<div className="materialdesign-icon-list-header" dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(data.headers)) }} /></div></div> : null;
        const container = <div className="materialdesign-icon-list-container" style={{ flexWrap: b(data.wrapItems, true) ? 'wrap' : undefined, height: b(data.wrapItems, true) ? 'auto' : undefined }}>{items.map((value, index) => this.renderItem(value, index, data))}</div>;
        const titleSize = n(data.titleLayout) ? `${n(data.titleLayout)}px` : undefined;
        return <div className={`materialdesign-widget materialdesign-icon-list${isM3 ? ` ${designStyleClasses(data, this.isDarkTheme())}` : ''}`} style={{ ...variables, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%' }}><style>{isM3 ? css + m3Css : css}</style>{header}{b(data.cardUse) ? <div className="materialdesign-html-card mdc-card" style={{ flex: '1 1 auto', margin: '3px 0 3px 3px', minHeight: 0, width: 'calc(100% - 6px)' }}>{data.title !== undefined && data.title !== null ? <div className="materialdesign-html-card card-title-section"><div className={`materialdesign-html-card card-title ${s(data.titleLayout).match(/^(headline|subtitle|body|caption|button|overline)/) ? `mdc-typography--${s(data.titleLayout)}` : ''}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(data.title)) }} style={{ fontSize: titleSize }} /></div> : null}<div className="materialdesign-html-card card-text-section iconlist" style={{ flex: '1 1 auto', margin: n(data.borderDistance), minHeight: 0, overflowX: b(data.showScrollbar, true) ? 'hidden' : undefined, overflowY: b(data.showScrollbar, true) ? 'auto' : undefined }}><div className="materialdesign-html-card">{container}</div></div></div> : <div className="materialdesign-icon-list-scroll" style={{ boxSizing: 'border-box', flex: '0 1 auto', maxHeight: '100%', minHeight: 0, overflowX: 'hidden', overflowY: b(data.showScrollbar, true) ? 'auto' : 'hidden' }}>{container}</div>}</div>;
    }
}
