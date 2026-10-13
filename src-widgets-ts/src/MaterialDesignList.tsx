import React from 'react';

import type { RxWidgetInfo, WidgetData } from '@iobroker/types-vis-2';

import { renderIcon } from './MaterialDesignButtons';
import { fill, withAutoFill } from './deviceFill';
import { MAX_DYNAMIC_ITEMS, squarePreview, RenderProps, VisWidget, accessibleText, boundedCount, createInfo, designStyle, indexedFields, designStyleClasses, iconField, legacyInk, legacyInkMuted, legacyOutline, legacySurface, itemCount, m3Switch, parseActionValue, safeWidgetUrl, setStateValue, sizeCss, stateValue, sanitizeHtml, boolValue as b, numberValue as n, textValue as s } from './widgetUtils';

type Data = Record<string, unknown> & { listItemDataMethod?: string; countListItems?: number; json_string_oid?: string };
type Item = { objectId: string; text: string; subText: string; rightText: string; rightSubText: string; image: string; imageColor: string; imageActive: string; imageActiveColor: string; header: string; divider: boolean; buttonStateValue: unknown; buttonNavView: string; buttonLink: string };

// Mirrors legacy myMdwHelper.getFontSize. Applying keyword sizes as literal CSS font-size blew the
// text up to 24px and overlapped the subtitle.
const fontSizeStyle = (v: unknown): { className: string; fontSize: string | undefined } => {
    const t = s(v);
    if (t === '') return { className: '', fontSize: undefined };
    if (/headline|subtitle|body|caption|button|overline/.test(t)) return { className: `mdc-typography--${t}`, fontSize: undefined };
    // Keyword sizes become explicit `inherit` so they override the MDC `__secondary-text`/`__meta`
    // defaults, exactly like legacy getFontSize.
    return { className: '', fontSize: Number.isFinite(Number(t)) ? `${Number(t)}px` : 'inherit' };
};

const fonts = ['auto', 'headline1', 'headline2', 'headline3', 'headline4', 'headline5', 'headline6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'button', 'overline', 'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'smaller', 'larger'];
// Issue #15: picking the datapoint of a row fills what the object's own metadata already says.
const autoFillMap = {
    oid: [fill.name('label'), fill.valueBinding('rightLabel'), fill.icon('listImage')],
};

const attrs: RxWidgetInfo['visAttrs'] = [
    { name: 'listLayout', label: 'group_listLayout', fields: [
        { name: 'listType', label: 'listType', type: 'select', options: ['text', 'buttonState', 'buttonToggle', 'buttonToggle_readonly', 'buttonNav', 'buttonLink', 'switch', 'switch_readonly', 'checkbox', 'checkbox_readonly'], default: 'text' },
        { name: 'listItemDividerStyle', label: 'listItemDividerStyle', type: 'select', options: ['standard', 'padded', 'inset'], default: 'standard' }, { name: 'listLayout', label: 'listLayout', type: 'select', options: ['standard', 'card', 'cardOutlined'], default: 'standard' },
        { name: 'showScrollbar', label: 'showScrollbar', type: 'checkbox', default: true }, { name: 'scrollToTopOnChanges', label: 'scrollToTopOnChanges', type: 'checkbox' }, { name: 'vibrateOnMobilDevices', label: 'vibrateOnMobilDevices', type: 'number', default: 50 }, { name: 'clickSoundPlay', label: 'clickSoundPlay', type: 'checkbox' }, { name: 'clickSoundVolume', label: 'clickSoundVolume', type: 'slider', min: 0, max: 1, step: .1, default: .5 },
    ] },
    { name: 'listHeader', label: 'group_listHeader', fields: [{ name: 'headers', label: 'headers', type: 'html' }, { name: 'alignment', label: 'alignment', type: 'select', options: ['flex-start', 'center', 'flex-end'], default: 'flex-start' }, { name: 'header_height', label: 'header_height', type: 'number', default: 60 }, { name: 'header_padding_left', label: 'header_padding_left', type: 'number', default: 16 }, { name: 'header_padding_right', label: 'header_padding_right', type: 'number', default: 16 }, { name: 'header_padding_top', label: 'header_padding_top', type: 'number', default: 6 }, { name: 'header_padding_bottom', label: 'header_padding_bottom', type: 'number', default: 20 }, { name: 'headerTextColor', label: 'headerTextColor', type: 'color' }, { name: 'headerTextSize', label: 'headerTextSize', type: 'number' }, { name: 'headerFontFamily', label: 'headerFontFamily', type: 'fontname' }, iconField('headerImage', 'headerImage', 'head'), { name: 'headerImageColor', label: 'headerImageColor', type: 'color' }, { name: 'headerImageHeight', label: 'headerImageHeight', type: 'slider', min: 0, max: 200, step: 1 }, { name: 'headerImagePosition', label: 'headerImagePosition', type: 'select', options: ['left', 'right'], default: 'left' }, { name: 'headerDistanceBetweenTextAndImage', label: 'headerDistanceBetweenTextAndImage', type: 'number' }] },
    { name: 'listItemData', label: 'group_listItemData', fields: [{ name: 'listItemDataMethod', label: 'listItemDataMethod', type: 'select', options: ['inputPerEditor', 'jsonStringObject'], default: 'inputPerEditor' }, { name: 'countListItems', label: 'countListItems', type: 'number', default: 1 }, { name: 'json_string_oid', label: 'json_string_oid', type: 'id' }] },
    { name: 'listItemLayout', label: 'group_listItemLayout', fields: [{ name: 'listItemHeight', label: 'listItemHeight', type: 'number' }, { name: 'listImageHeight', label: 'listImageHeight', type: 'number' }, { name: 'listItemAlignment', label: 'listItemAlignment', type: 'select', options: ['left', 'center', 'right'], default: 'left' }, { name: 'distanceBetweenTextAndImage', label: 'distanceBetweenTextAndImage', type: 'number' }, { name: 'rightTextWidth', label: 'rightTextWidth', type: 'number' }, { name: 'listControlPosition', label: 'listControlPosition', type: 'select', options: ['left', 'right'], default: 'left' }, { name: 'distanceBetweenControlAndText', label: 'distanceBetweenControlAndText', type: 'number' }] },
    { name: 'color', label: 'group_color', fields: ['listBackground','listItemBackground','listItemBackgroundActive','colorSwitchThumb','colorSwitchTrack','colorSwitchTrue','colorSwitchHover','colorCheckBox','colorListItemHover','colorListItemSelected','colorListItemText','colorListItemTextSecondary','colorListItemTextRight','colorListItemTextSecondaryRight','colorListItemHeaders','colorListItemDivider'].map(name => ({ name, label: name, type: 'color' as const })) },
    // `headerFontFamily` stays in the header group only: listing it here too made the two editor
    // fields write the same attribute, and it styles the widget header, not the row headers.
    { name: 'font', label: 'group_font', fields: [['listItemFont', 'listItemLeftFont'], ['listItemSubFont', 'listItemSubLeftFont'], ['listItemRightFont', 'listItemRightFont'], ['listItemSubRightFont', 'listItemSubRightFont'], ['listItemHeaderFont', 'listItemHeaderFont']].map(([name, label]) => ({ name, label, type: 'fontname' as const })) },
    { name: 'fontSize', label: 'group_fontSize', fields: ['listItemTextSize','listItemSubTextSize','listItemTextRightSize','listItemSubTextRightSize','listItemHeaderTextSize'].map(name => ({ name, label: name, type: 'select' as const, options: fonts })) },
    { name: 'rows', label: 'group_rows', indexFrom: 0, indexTo: 'countListItems', hidden: (data: WidgetData) => !!data.listItemDataMethod && data.listItemDataMethod !== 'inputPerEditor', fields: indexedFields([
        { name: 'oid', label: 'oid', type: 'id' }, { name: 'groupHeader', label: 'groupHeader', type: 'html' }, iconField('listImage', 'listImage'), { name: 'listImageColor', label: 'listImageColor', type: 'color' }, iconField('listImageActive', 'listImageActive'), { name: 'listImageActiveColor', label: 'listImageActiveColor', type: 'color' }, { name: 'label', label: 'label', type: 'html' }, { name: 'subLabel', label: 'subLabel', type: 'html' }, { name: 'rightLabel', label: 'rightLabel', type: 'html' }, { name: 'rightSubLabel', label: 'rightSubLabel', type: 'html' }, { name: 'dividers', label: 'dividers', type: 'checkbox' }, { name: 'listTypeButtonStateValue', label: 'listTypeButtonStateValue', type: 'text' }, { name: 'listTypeButtonNav', label: 'listTypeButtonNav', type: 'views' }, { name: 'listTypeButtonLink', label: 'listTypeButtonLink', type: 'url' },
    ], data => itemCount(data.countListItems)) },
];

function item(data: Data, index: number, json?: Record<string, unknown>): Item {
    const get = (name: string, jsonName = name): unknown => json ? json[jsonName] : data[`${name}${index}`];
    const image = s(get('listImage', 'image'));
    // Left empty when unset: a defaulted color would count as "user picked one" and mask every SVG.
    const imageColor = s(get('listImageColor', 'imageColor'));
    return { objectId: s(get('oid', 'objectId')), text: s(get('label', 'text'), `Item ${index}`), subText: s(get('subLabel', 'subText')), rightText: s(get('rightLabel', 'rightText')), rightSubText: s(get('rightSubLabel', 'rightSubText')), image, imageColor, imageActive: s(get('listImageActive', 'imageActive'), image), imageActiveColor: s(get('listImageActiveColor', 'imageActiveColor'), imageColor), header: s(get('groupHeader', 'header')), divider: b(get('dividers', 'showDivider')), buttonStateValue: get('listTypeButtonStateValue', 'buttonStateValue'), buttonNavView: s(get('listTypeButtonNav', 'buttonNavView')), buttonLink: s(get('listTypeButtonLink', 'buttonLink')) };
}

// Fully inline-styled so the control stays visible without the legacy MDC stylesheet, which VIS2
// does not load.
function listToggle(kind: 'switch' | 'checkbox', on: boolean, readonly: boolean, data: Data, onChange: (checked: boolean) => void, isM3 = false): React.JSX.Element {
    const input = (
        <input
            checked={on}
            className={kind === 'switch' ? 'mdc-switch__native-control' : 'mdc-checkbox__native-control'}
            disabled={readonly}
            onChange={e => onChange(e.target.checked)}
            style={{ cursor: readonly ? 'default' : 'pointer', margin: 0, opacity: 0, position: 'absolute', inset: 0, width: '100%', height: isM3 && kind === 'switch' ? '100%' : 'auto' }}
            type="checkbox"
            {...(kind === 'switch' ? { role: 'switch' } : {})}
        />
    );
    // In M3 the row switch is the shared 52×32 control, which also clears the WCAG 2.5.8 24 px minimum
    // that the 32×20 legacy shape misses.
    if (kind === 'switch' && isM3) {
        return m3Switch({
            disabled: readonly,
            input,
            on,
            rootProps: { 'aria-checked': undefined, role: undefined },
            thumbOff: s(data.colorSwitchThumb) || undefined,
            thumbOn: s(data.colorSwitchThumb) || undefined,
            trackOff: s(data.colorSwitchTrack) || undefined,
            trackOn: s(data.colorSwitchTrue) || undefined,
        });
    }
    if (kind === 'switch') {
        const onColor = isM3 && !s(data.colorSwitchTrue) ? 'var(--md-sys-color-primary)' : s(data.colorSwitchTrue, '#44739e');
        return (
            <span className="mdc-switch" style={{ flex: '0 0 auto', height: 20, overflow: 'visible', position: 'relative', width: 32 }}>
                <span className="mdc-switch__track" style={{ background: on ? onColor : s(data.colorSwitchTrack, '#000000'), border: 'none', borderRadius: 7, height: 14, left: 0, opacity: on ? 0.54 : 0.38, position: 'absolute', top: 3, width: 32 }} />
                <span className="mdc-switch__thumb-underlay" style={{ border: 'none', height: 28, left: on ? 12 : -8, position: 'absolute', top: -4, transform: 'none', transition: 'left 120ms ease', width: 28 }}>
                    <span className="mdc-switch__thumb" style={{ background: on ? onColor : s(data.colorSwitchThumb, '#FFFFFF'), border: 'none', borderRadius: '50%', boxShadow: '0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)', height: 20, left: 4, position: 'absolute', top: 4, width: 20 }} />
                </span>
                {input}
            </span>
        );
    }
    const cbColor = isM3 && !s(data.colorCheckBox) ? 'var(--md-sys-color-primary)' : s(data.colorCheckBox, '#44739e');
    return (
        <span className="mdc-checkbox" style={{ boxSizing: 'border-box', flex: '0 0 auto', height: 40, position: 'relative', width: 40 }}>
            {input}
            <span className="mdc-checkbox__background" style={{ background: on ? cbColor : 'transparent', border: `2px solid ${on ? cbColor : 'rgba(0, 0, 0, 0.54)'}`, borderRadius: 2, boxSizing: 'border-box', height: 18, left: 11, position: 'absolute', top: 11, width: 18 }}>
                <svg className="mdc-checkbox__checkmark" style={{ height: '100%', inset: 0, opacity: on ? 1 : 0, position: 'absolute', width: '100%' }} viewBox="0 0 24 24">
                    <path className="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" fill="none" stroke="#fff" strokeWidth="3.12" />
                </svg>
            </span>
        </span>
    );
}

// Vendored MDC list layout: without display:flex the item stacks the icon above the text, and
// without the list reset the <ul> gets browser indent/bullets.
const listCss = '.materialdesign-list .mdc-list{list-style:none;margin:0;padding:0}'
    // Without the ambient legacy `padding:0 16px` the left icon hugs the edge and the switch
    // thumb-underlay gets clipped by the list's overflow-x:hidden.
    + '.materialdesign-list .mdc-list-item{display:flex;align-items:center;position:relative;padding:0 16px}'
    + '.materialdesign-list .mdc-list-item__text{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center}'
    + '.materialdesign-list .mdc-list-item__primary-text,.materialdesign-list .mdc-list-item__secondary-text{display:block}'
    // Legacy MDC defaults for the secondary line; the inline style only sets these when the editor
    // provides them.
    + '.materialdesign-list .mdc-list-item__secondary-text{font-size:.875rem}'
    + '.materialdesign-list .mdc-list-item__meta{margin-left:auto}'
    + '.materialdesign-list .mdc-list-group__subheader{display:block;margin:0;list-style:none}'
    + '.materialdesign-list .mdc-list-item:focus-visible{outline:2px solid #44739e;outline-offset:-2px}'
    + '.materialdesign-list.mdw-style-material3 .mdc-list-item:focus-visible{outline-color:var(--md-sys-color-primary)}'
    // Counters the legacy `min-height:40px!important` and lets the graphic size itself (legacy forced
    // 24x24, clamping larger listImageHeight SVGs).
    + '.materialdesign-list.materialdesign-widget .mdc-list-item{min-height:var(--materialdesign-list-item-height,48px)!important;height:auto!important}'
    + '.materialdesign-list .mdc-list-item__graphic{flex-shrink:0;display:inline-flex;align-items:center;width:auto!important;height:auto!important;overflow:visible}'
    // `listLayout: card`/`cardOutlined` set this class but the geometry came from ambient legacy VIS1
    // CSS that is gone, so both card layouts rendered identical to `standard`.
    // The 4 px inset is not decoration: the card filled the widget box edge to edge, and VIS2 clips
    // there (`.vis-widget` is `overflow: hidden`), so the shadow was entirely outside the visible
    // area and the outlined variant lost its bottom border. It has to clear the 4 px the elevation
    // shadow reaches below the card, otherwise `card` and `cardOutlined` look alike again.
    // Flex item, not `height:100%`: the header is a sibling, so a card measured against the whole
    // widget box hangs one header height out of it and VIS2 clips that part away.
    + '.materialdesign-list .materialdesign-list-card{background:var(--materialdesign-color-card-background,#fff);border-radius:4px;box-shadow:0 2px 1px -1px rgba(0,0,0,.2),0 1px 1px 0 rgba(0,0,0,.14),0 1px 3px 0 rgba(0,0,0,.12);box-sizing:border-box;display:flex;flex:1 1 auto;flex-direction:column;margin:4px;min-height:0;overflow:hidden}'
    + '.materialdesign-list .materialdesign-list-card--outlined{border:1px solid var(--materialdesign-color-card-outline,rgba(0,0,0,.12));box-shadow:none}'
    + '.materialdesign-list.mdw-style-material3 .materialdesign-list-card{border-radius:var(--md-sys-shape-corner-medium);box-shadow:var(--md-sys-elevation-level1)}'
    + '.materialdesign-list.mdw-style-material3 .materialdesign-list-card--outlined{background:var(--md-sys-color-surface);border:1px solid var(--md-sys-color-outline-variant);box-shadow:none}';

export default class MaterialDesignList extends VisWidget {
    private listRef = React.createRef<HTMLUListElement>();
    private lastRowSignature = '';
    static getWidgetInfo(): RxWidgetInfo { return { ...createInfo('tplVis2-materialdesign-List', 'List', withAutoFill(attrs, autoFillMap), ['listHeader', 'listItemLayout', 'color', 'font', 'fontSize']), visPrev: squarePreview('F0279'), visDefaultStyle: { width: 400, height: 270 } }; }
    getWidgetInfo(): RxWidgetInfo { return MaterialDesignList.getWidgetInfo(); }
    private feedback(data: Data): void { if (n(data.vibrateOnMobilDevices, 50) > 0) navigator.vibrate?.(n(data.vibrateOnMobilDevices, 50)); if (b(data.clickSoundPlay)) { const audio = new Audio('widgets/vis2-materialdesign/materialdesign-widgets-click-sound.mp3'); audio.volume = Math.max(0, Math.min(1, n(data.clickSoundVolume, .5))); void audio.play().catch(() => undefined); } }
    private activate(data: Data, value: unknown, current: unknown, row: Item): void { const type = s(data.listType); if (type.endsWith('_readonly') || type === 'text') return; this.feedback(data); if (type === 'checkbox' || type === 'switch') setStateValue(this.props, row.objectId, value as ioBroker.StateValue); else if (type === 'buttonToggle') setStateValue(this.props, row.objectId, !current); else if (type === 'buttonState') setStateValue(this.props, row.objectId, parseActionValue(s(row.buttonStateValue))); else if (type === 'buttonNav') this.props.context?.changeView?.(row.buttonNavView); else if (type === 'buttonLink') { const href = safeWidgetUrl(row.buttonLink); if (href) window.open(href, '_blank', 'noopener,noreferrer'); } }
    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props); const data = this.state.rxData as unknown as Data;
        const isM3 = designStyle(data) === 'material3';
        const m3 = (v: unknown, token: string): string | undefined => s(v) || (isM3 ? token : undefined);
        const m3f = (v: unknown, token: string, fb: string): string => s(v) || (isM3 ? token : fb);
        // Both lines follow the theme; so does the card they may sit on (`--…-card-background`).
        const isDark = this.isDarkTheme();
        let json: Record<string, unknown>[] | undefined;
        if (data.listItemDataMethod === 'jsonStringObject') { try { const value = JSON.parse(s(stateValue(this.state, s(data.json_string_oid)), '[]')); json = Array.isArray(value) ? value : []; } catch (e) { json = [{ text: `<font color="red"><b>Error in JSON string</b></font>`, subText: String(e) }]; } }
        const rows = json ? json.slice(0, MAX_DYNAMIC_ITEMS).map((row, index) => item(data, index, row)) : Array.from({ length: boundedCount(data.countListItems, 1) }, (_, index) => item(data, index)); const type = s(data.listType, 'text');
        const vars = { '--materialdesign-color-card-outline': m3f(data.colorListItemDivider, 'var(--md-sys-color-outline-variant)', legacyOutline(isDark)), '--materialdesign-color-list-background': s(data.listBackground, 'transparent'), '--materialdesign-color-card-background': m3f(data.listBackground, 'var(--md-sys-color-surface-container-low)', legacySurface(isDark)), '--materialdesign-color-list-item-hover': s(data.colorListItemHover), '--materialdesign-color-list-item-text': s(data.colorListItemText), '--materialdesign-color-list-item-text-secondary': s(data.colorListItemTextSecondary), '--materialdesign-color-list-item-text-right': s(data.colorListItemTextRight), '--materialdesign-color-list-item-text-secondary-right': s(data.colorListItemTextSecondaryRight), '--materialdesign-color-list-item-header': s(data.colorListItemHeaders), '--materialdesign-color-list-item-divider': s(data.colorListItemDivider), '--materialdesign-font-list-item-text': s(data.listItemFont), '--materialdesign-font-list-item-text-secondary': s(data.listItemSubFont), '--materialdesign-font-list-item-text-right': s(data.listItemRightFont), '--materialdesign-font-list-item-text-secondary-right': s(data.listItemSubRightFont), '--materialdesign-font-list-item-header': s(data.listItemHeaderFont) } as React.CSSProperties;
        const content = <ul ref={this.listRef} className={`mdc-list materialdesign-list-container${type === 'text' ? ' mdc-list--non-interactive' : ''}`} style={{ flex: '0 1 auto', maxHeight: '100%', minHeight: 0, overflowX: 'hidden', overflowY: b(data.showScrollbar, true) ? 'auto' : undefined }}>{rows.map((row, index) => { const current = stateValue(this.state, row.objectId); const active = current === true || current === 'true' || current === 1 || current === '1'; const readonly = type.endsWith('_readonly'); const image = active ? row.imageActive : row.image; const color = active ? row.imageActiveColor : row.imageColor; const iconColor = color || (isM3 ? 'var(--md-sys-color-primary)' : '#44739e'); const control = type.startsWith('checkbox') ? listToggle('checkbox', active, readonly, data, checked => this.activate(data, checked, current, row), isM3) : type.startsWith('switch') ? listToggle('switch', active, readonly, data, checked => this.activate(data, checked, current, row), isM3) : null; const interactive = !control && !readonly && type !== 'text'; const pSz = fontSizeStyle(data.listItemTextSize), sSz = fontSizeStyle(data.listItemSubTextSize), rSz = fontSizeStyle(data.listItemTextRightSize), rsSz = fontSizeStyle(data.listItemSubTextRightSize), hSz = fontSizeStyle(data.listItemHeaderTextSize); const controlFirst = s(data.listControlPosition, 'left') === 'left'; const controlGap = n(data.distanceBetweenControlAndText) || undefined;
        // Only the leading meta element may carry `margin-left: auto`. With it on both, flexbox
        // splits the free space evenly and the control floats in the middle of the row.
        const controlNode = control ? <span key="control" className="mdc-list-item__meta" style={{ alignItems: 'center', display: 'flex', marginLeft: controlFirst ? 'auto' : controlGap, marginRight: controlFirst ? controlGap : undefined }}>{control}</span> : null;
        const rightNode = row.rightText ? <span key="right" className="mdc-list-item__meta materialdesign-list-item-text-right" style={{ fontSize: 'inherit', marginLeft: control && controlFirst ? undefined : 'auto', textAlign: 'right', width: n(data.rightTextWidth) || undefined }}><span className={`materialdesign-list-item-text-right-primary ${rSz.className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.rightText) }} style={{ display: 'block', fontFamily: s(data.listItemRightFont), fontSize: rSz.fontSize, color: m3(data.colorListItemTextRight, 'var(--md-sys-color-on-surface)') }} />{row.rightSubText ? <span className={`materialdesign-list-item-text-right-secondary ${rsSz.className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.rightSubText) }} style={{ display: 'block', fontFamily: s(data.listItemSubRightFont), fontSize: rsSz.fontSize, color: m3(data.colorListItemTextSecondaryRight, 'var(--md-sys-color-on-surface-variant)') }} /> : null}</span> : null;
        // Legacy MDC shipped the geometry for these two divider variants in a stylesheet VIS2 does not
        // load, so `padded`/`inset` rendered exactly like `standard`.
        const dividerStyle = s(data.listItemDividerStyle, 'standard'); return <React.Fragment key={index}>{row.header ? <li className={`mdc-list-group__subheader ${hSz.className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.header) }} style={{ color: m3(data.colorListItemHeaders, 'var(--md-sys-color-primary)'), fontSize: hSz.fontSize, fontFamily: s(data.listItemHeaderFont) }} /> : null}<li className={`mdc-list-item${readonly ? ' mdc-list-item--disabled' : ''}`} aria-label={interactive ? accessibleText(row.text, VisWidget.t('ariaListItemAction')) : undefined} data-oid={row.objectId} onClick={interactive ? () => this.activate(data, undefined, current, row) : undefined} onKeyDown={interactive ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.activate(data, undefined, current, row); } } : undefined} role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined} style={{ alignItems: 'center', background: active ? s(data.listItemBackgroundActive) : s(data.listItemBackground), cursor: readonly || type === 'text' ? 'default' : 'pointer', height: n(data.listItemHeight) || undefined, textAlign: s(data.listItemAlignment, 'left') as React.CSSProperties['textAlign'] }}>{image ? <span className="mdc-list-item__graphic materialdesign-icon-image" style={{ color: iconColor, fontSize: n(data.listImageHeight, 24), marginRight: n(data.distanceBetweenTextAndImage) || undefined }}>{renderIcon(image, iconColor, n(data.listImageHeight, 24), !!color)}</span> : null}<span className="mdc-list-item__text"><span className={`mdc-list-item__primary-text ${pSz.className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.text) }} style={{ color: m3f(data.colorListItemText, 'var(--md-sys-color-on-surface)', legacyInk(isDark)), fontFamily: s(data.listItemFont), fontSize: pSz.fontSize }} />{row.subText ? <span className={`mdc-list-item__secondary-text ${sSz.className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.subText) }} style={{ color: m3f(data.colorListItemTextSecondary, 'var(--md-sys-color-on-surface-variant)', legacyInkMuted(isDark)), fontFamily: s(data.listItemSubFont), fontSize: sSz.fontSize }} /> : null}</span>{controlFirst ? [controlNode, rightNode] : [rightNode, controlNode]}</li>{row.divider ? <li className={`mdc-list-divider${dividerStyle === 'padded' ? ' mdc-list-divider--padded' : dividerStyle === 'inset' ? ' mdc-list-divider--inset' : ''}`} style={{ borderBottom: `1px solid ${m3f(data.colorListItemDivider, 'var(--md-sys-color-outline-variant)', 'rgba(0,0,0,.12)')}`, listStyle: 'none', margin: dividerStyle === 'padded' ? '0 16px' : dividerStyle === 'inset' ? '0 0 0 72px' : undefined }} /> : null}</React.Fragment>; })}</ul>;
        const headerHeight = n(data.header_height, 60); const headerImageRight = s(data.headerImagePosition, 'left') === 'right'; const headerIcon = renderIcon(s(data.headerImage), m3f(data.headerImageColor, 'var(--md-sys-color-on-surface-variant)', ''), n(data.headerImageHeight, 24), !!data.headerImageColor); const headerIconNode = headerIcon ? <span key="icon" style={{ alignItems: 'center', display: 'inline-flex', flex: '0 0 auto', [headerImageRight ? 'marginLeft' : 'marginRight']: n(data.headerDistanceBetweenTextAndImage) || undefined }}>{headerIcon}</span> : null;
        const headerTextNode = <div key="text" className="materialdesign-list-header" dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(data.headers)) }} style={{ color: m3f(data.headerTextColor, 'var(--md-sys-color-on-surface)', '#44739e'), fontFamily: s(data.headerFontFamily), fontSize: isM3 && !s(data.headerTextSize) ? undefined : sizeCss(data.headerTextSize, 24) }} />;
        // The row is a flex container, so `text-align` alone never moved anything: without
        // `justify-content` the header stayed glued to the left whatever the alignment said.
        // It must not carry `mdc-card`: that class is `flex-direction: column`, which turned the
        // alignment into a vertical one and stacked the image above/below the text instead of
        // beside it - and its radius plus shadow painted a card frame around the header.
        // A fixed `height` on the row was the reason "padding bottom" did nothing: without `border-box`
        // that height is the content box, so the bottom padding hung below it and the clipping container
        // cut it away. The height is a minimum now and every side of the padding takes part.
        const header = s(data.headers) ? <div className="materialdesign-list-header-container" style={{ flex: '0 0 auto', position: 'relative' }}><div className="materialdesign-list-header-row" style={{ alignItems: 'center', background: 'transparent', boxSizing: 'border-box', display: 'flex', justifyContent: s(data.alignment, 'flex-start'), margin: '8px 3px 3px', minHeight: headerHeight, padding: `${n(data.header_padding_top, 6)}px ${n(data.header_padding_right, 16)}px ${n(data.header_padding_bottom, 0)}px ${n(data.header_padding_left, 16)}px`, textAlign: s(data.alignment, 'flex-start').replace('flex-', '') as React.CSSProperties['textAlign'] }}>{headerImageRight ? [headerTextNode, headerIconNode] : [headerIconNode, headerTextNode]}</div></div> : null;
        const stateCss = [
            s(data.colorListItemSelected) && `.materialdesign-list .mdc-list-item:focus-visible{background:${s(data.colorListItemSelected)}!important}`,
            s(data.colorSwitchHover) && `.materialdesign-list .mdc-switch:hover .mdc-switch__thumb{background:${s(data.colorSwitchHover)}!important}`,
        ].filter(Boolean).join('');
        // Neue Zeilen -> wieder nach oben, wenn der Nutzer das so eingestellt hat.
        const signature = rows.map(row => `${row.objectId}|${row.text}`).join('\n');
        if (signature !== this.lastRowSignature) {
            this.lastRowSignature = signature;
            if (b(data.scrollToTopOnChanges) && this.listRef.current) this.listRef.current.scrollTop = 0;
        }
        const list = s(data.listLayout, 'standard') === 'standard' ? content : <div className={`materialdesign-list-card${s(data.listLayout) === 'cardOutlined' ? ' materialdesign-list-card--outlined' : ''}`}>{content}</div>; return <div className={`materialdesign-widget materialdesign-list${isM3 ? ` ${designStyleClasses(data, this.isDarkTheme())}` : ''}`} style={{ ...vars, ['--materialdesign-list-item-height' as string]: n(data.listItemHeight) ? `${n(data.listItemHeight)}px` : undefined, background: s(data.listBackground) || undefined, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}><style>{listCss + stateCss}</style>{header}{list}</div>;
    }
}
