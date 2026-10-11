# Site Data Tools

A small Chrome extension (Manifest V3) that gives you one-click export or wipe of the current site's cookies and `localStorage`, plus extraction of hidden form inputs.

## Features

**Export**
- **localStorage → JSON**: dumps every key/value pair for the current page's origin.
- **Cookies → JSON**: exports all cookies that apply to the current URL, including `HttpOnly` and `Secure` cookies, with full metadata (domain, path, expiry, flags, etc.).
- **Hidden inputs → TXT**: collects every `<input type="hidden">` on the page, including those inside iframes. Output is `name=value` per line. Tick **Hidden inputs: values only** to export just the values. The checkbox state is remembered.

**Wipe**
- **Wipe cookies**: removes all cookies for the current site.
- **Wipe localStorage**: clears `localStorage` for the current page.
- Wipe buttons require a **second click within 3 seconds** to confirm, so you can't trigger them by accident.

Each button shows a live count (e.g. `Export cookies (12) → JSON`), and a status line reports what happened. Exported files are named after the site, e.g. `example.com-cookies.json`, `example.com-localstorage.json`, `example.com-hidden-inputs.txt`.

## Installation

1. Unzip `popup.zip` so the folder contains `manifest.json` at its top level.
2. Open `chrome://extensions` in Chrome (or any Chromium browser such as Edge, Brave, or Arc).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.
5. Pin the extension from the puzzle-piece menu if you want quick access.

## Usage

1. Navigate to any regular `http(s)` page.
2. Click the **Site Data Tools** toolbar icon.
3. Choose an export or wipe action.

On non-web pages (`chrome://`, `about:`, the Web Store, `file://`, etc.) the buttons are disabled and the popup asks you to open a regular page.

## Permissions

| Permission | Why it's needed |
|---|---|
| `cookies` | Read and remove cookies for the current site. |
| `scripting` | Inject small functions into the page to read/clear `localStorage` and read hidden inputs. |
| `<all_urls>` (host) | Lets the cookie and scripting APIs work on whichever site you're viewing. |

Everything runs locally in your browser. The extension makes no network requests and sends no data anywhere.

## Project structure

```
.
├── manifest.json     # Extension manifest (MV3)
├── popup.html        # Popup UI and styles (light/dark aware)
├── popup.js          # Popup logic: export, wipe, confirmation, counts
└── icons/            # Toolbar and store icons (16, 32, 48, 128 px)
```

## Notes and limitations

- **Treat exports as secrets.** Cookie and `localStorage` dumps often contain session tokens and other credentials. Anyone with the file may be able to access your account. Don't share or commit them.
- **Wiping cookies will usually sign you out** of the site, and wiping `localStorage` can reset app settings or saved state.
- `localStorage` is read from the top-level page only; hidden inputs are read from all frames.
- Hidden inputs without a `name` fall back to their `id`, or `(unnamed)`.
- Only cookies matching the current tab's URL are affected, not other subdomains or unrelated sites.

## License

Add a license of your choice here (e.g. MIT).