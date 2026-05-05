# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of single-file HTML developer productivity tools, primarily for payment gateway (金流商) integration work. No build step — all files open directly in a browser.

## Running / Viewing

Open `index.html` directly in a browser (double-click or `open index.html`). No server required.

## Architecture

```
index.html              ← Top-level shell with tab navigation
ToolPage/               ← Utility tools, each registered as a tab in index.html
  Bank-Tool.html        ← Bank code mapping tool (Vue 3)
  DataFormat.html       ← Tab-delimited bank data ↔ JSON/CSV converter (vanilla JS)
  JSON2map.html         ← JSON → Java map.put() converter (Vue 3)
  JSON_Format.html      ← JSON pretty-print + tree viewer (Vue 3)
  WorkWebPage.html      ← Nested shell, hosts WorkTabPage files as its own tabs
WorkTabPage/
  JyintGroup.html       ← Work navigation: stores internal URLs in localStorage and opens them
```

`index.html` embeds each tool via `<iframe src="ToolPage/xxx.html">`. `WorkWebPage.html` is itself an iframe inside `index.html`, and it embeds `WorkTabPage/` files.

## Adding a New Tool

1. Create `ToolPage/NewTool.html` (self-contained, follow conventions below).
2. Add a tab `<li>` entry to `index.html`'s `#toolTabs`.
3. Add a `<div class="tab-pane fade" id="tabN">` with `<iframe src="ToolPage/NewTool.html">` to `#toolTabsContent`.

## Conventions

**Tech stack (CDN, no npm):**
- Bootstrap 5.3.3 for layout and components
- Vue 3 (`https://unpkg.com/vue@3`) for reactive tools; vanilla JS is fine for simpler pages

**CSS — copy this block into every new tool page:**
```css
body { background-color: #f8f9fa; color: #212529; }
[data-bs-theme="dark"] body { background-color: #212529 !important; color: #f8f9fa !important; }
textarea, select, input { font-size: 0.9rem !important; }
.form-control, .form-select { background-color: #f5f5f5; color: #000; }
[data-bs-theme="dark"] .form-control, [data-bs-theme="dark"] .form-select { background-color: #343a40; color: #f8f9fa; }
.form-label { font-weight: bold; }
.btn { font-size: 0.85rem; }
.row .col { padding: 6px 12px; }
```

**Theme sync — every tool page must include this at the bottom of `<script>`:**
```js
window.addEventListener('message', (e) => {
    if (e.data?.theme) document.documentElement.setAttribute('data-bs-theme', e.data.theme);
});
window.parent?.postMessage({ ask: 'theme' }, '*');
```
The parent shell (`index.html`) holds the theme authority and broadcasts it to iframes via `postMessage`. Child pages ask for the theme on load with `{ ask: 'theme' }` and apply it when received with `{ theme: 'dark'|'light' }`.

**Vue pages** use the `<template id="original-content">` + `createApp({ template: '#original-content' }).mount('#app')` pattern.

## Domain Context — Payment Gateway (金流商) Integration

The user integrates third-party payment gateways into a Java Spring Boot backend. Each new gateway requires four files:

| File | Purpose |
|---|---|
| `XxxPayMethod.java` | Collect (收款) — extends `AbstractPayVendorMethod` |
| `XxxPayWithdrawMethod.java` | Payout (代付) — implements `WithdrawMethod` |
| `XxxPayMethodTest.java` | Integration test for collect |
| `XxxPayWithdrawMethodTest.java` | Integration test for payout |

The boilerplate is nearly identical across gateways; only the parameter field names/values (from the upstream API doc), URLs, and bank code mappings differ. The `SmartPayMethod.java` and `SmartPayWithdrawMethod.java` pasted at the start of the conversation are canonical reference implementations.

Key patterns to know:
- Signing: `makeSign()` serialises a `TreeMap` to JSON (sorted keys, no nulls, BigDecimal as plain), then RSA-signs it.
- Request headers carry `x-signature` and `x-mchNum`.
- Amount handling: amounts are stored in cents internally; `AmountUtil.toDollarStringNoDot()` converts to the decimal string the gateway expects; `AmountUtil.toCent()` converts back.
- Response success code is a string (e.g. `"200"`), checked against a constant.
- Callback verification: `getCallbackOrderNo()` extracts the merchant order number from the callback map.
