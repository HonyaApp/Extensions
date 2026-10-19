# Honya Extensions

Honya comes with no sources. Users add **repositories** under Settings → Sources and install sources from them. A source is a small TypeScript extension, bundled to one JavaScript file that the app runs in JavaScriptCore. A repository is a folder of those files plus an `index.json` that lists them. Anyone can host one for free, for example on GitHub Pages or in a GitHub branch.

This repository holds the SDK for writing sources, the build script, and three example sources: Public Domain Comics, Public Domain Manga, and Pepper&Carrot (with Mini Fantasy Theater) in twelve languages. Its `repo` branch is a working repository: add `https://github.com/HonyaApp/Extensions` in Settings → Sources to install the examples.

## Quick start

Use this repository as a template, or copy it, then:

```sh
npm install
npm run dev        # type-check, build to dist/, and serve dist/ on port 8642
```

In the app, open Settings → Sources → Add Repository and enter `http://localhost:8642` (in the Simulator), or the network address `npm run serve` prints (on a device). Then tap **Get** next to the source.

To try a change, rebuild, bump `version` in the source's `info`, then pull to refresh the Sources screen and tap **Update**.

## Writing a source

Create `src/<lang>/<name>/index.ts` and default-export a `Source` (see [`sdk/types.ts`](sdk/types.ts)). [`src/en/publicdomaincomics`](src/en/publicdomaincomics) is a complete example: a hand-picked list of public-domain comics, read through the Internet Archive's JSON APIs.

```ts
import { fetchJSON, type Source } from "../../../sdk"

const source: Source = {
  info: {
    id: "6998882641562544524",          // Mihon's ID; see below
    name: "Public Domain Comics",
    lang: "en",
    version: "1.0.0",
    baseUrl: "https://archive.org",
  },
  async getPopularManga(page) { /* … */ },
  async getLatestUpdates(page) { /* optional, with info.supportsLatest */ },
  async searchManga(page, query, filters) { /* … */ },
  async getMangaDetails(manga) { /* … */ },
  async getChapterList(manga) { /* newest first */ },
  async getPageList(chapter) { /* [{ url }] */ },
  getFilterList(data) { /* optional, synchronous */ },
  async fetchFilterData() { /* optional: what getFilterList's data comes from */ },
}
export default source
```

The functions mirror Mihon's `HttpSource`, so a Mihon extension ports over function by function: each `*Request`/`*Parse` pair becomes one async function. Jsoup selectors work unchanged, because the app parses HTML with SwiftSoup (a Jsoup port).

Set `nsfw: true` in `info` on any source that can show adult content. The app hides those sources, and titles from them, unless the person is 18 or older and turns on Show 18+ Sources.

### Several sources in one extension

Like Mihon's `SourceFactory`, an extension can default-export an **array** of sources, typically one per language, each with its own Mihon `id`. The build lists each in `index.json` and they share one script. See [`src/all/peppercarrot`](src/all/peppercarrot).

### What a source can use

Sources run in JavaScriptCore, not a browser or Node. There's no `fetch`, DOM, `URL`, `setTimeout` or `atob`. The app provides the `Honya` global and `console` (see [`sdk/host.d.ts`](sdk/host.d.ts)):

| | |
|---|---|
| `Honya.request({ url, method, headers, body })` | Goes through the app's HTTP client, so it gets the app's User-Agent and cookies, your `rateLimits` and Cloudflare handling. Every status resolves. |
| `Honya.parseHTML(html, baseUrl?)` | Native HTML parsing with Jsoup's API: `select`, `selectFirst`, `text`, `attr("abs:href")`, `parent`, `children`. |
| `Honya.prefs.get/set` | The source's own settings. A Mihon backup restores its source's settings here. |
| `Honya.localStorage(url, key)` | What the site keeps in the web view's `localStorage` (Mihon's `getLocalStorage`), for tokens sites hand out there. |
| `Honya.loadInWebView(url, { waitForLocalStorage })` | Opens a page in a hidden web view so its scripts can issue a token; resolves with that `localStorage` value. |
| `Honya.sleep(ms)` | Waits; there's no `setTimeout`. |
| `console.log/warn/error` | The app's log (Console.app, category "Extension <name>"). |

[`sdk/helpers.ts`](sdk/helpers.ts) adds `fetchHTML`, `fetchPage`, `fetchJSON`, `fetchText` (all throw on HTTP errors), `relativeUrl` (Mihon's `setUrlWithoutDomain`, percent-decoded like Mihon stores URLs), `queryString`, `formBody`, `imgAttr`, `mapLimit`, base64 and UTF-8 helpers, and date parsing. [`sdk/dates.ts`](sdk/dates.ts) reads the Java date patterns Kotlin sources declare (`"dd MMMM yyyy"` in Turkish, say), [`sdk/crypto.ts`](sdk/crypto.ts) has MD5 and AES-CBC for page lists encrypted the CryptoJS way, and [`sdk/nextjs.ts`](sdk/nextjs.ts) finds data in Next.js pages and `rsc` responses. Helpers are bundled into each source that uses them.

`info.imageHeaders` apply to page images and covers; a header set to `""` is left out (some image hosts refuse a Referer).

What the app can't do yet, so sources work around it:
- **Lazy page images.** Mihon resolves some pages' images only when they're shown (`getImageUrl`). Here, resolve them in `getPageList`, a few at a time with `mapLimit`.
- **Image interceptors.** Fallbacks Mihon does per image in OkHttp are decided once in `getPageList` instead. The one kind of image rewriting the app does is putting back pages served as a grid of shuffled tiles: give the page's URL with `tiledImageUrl(url, { columns, rows, order })` and the app rearranges it for reading and downloads (host API 4).

### Keep Mihon's IDs and URLs

People switching from Mihon restore their backups into Honya. Each library entry in a backup stores its **source ID** and the manga's **relative URL**. A restored entry finds your source automatically only if:

1. **`info.id` is Mihon's ID for the same source**, as a string (a JavaScript number can't hold 63 bits). Mihon computes it as the first 8 bytes of `md5("<name lowercased>/<lang>/1")`, and `npm run build` warns when `id` doesn't match that. Some Kotlin extensions override `id` after a rename; in that case copy the overridden value. A source that replaces several Mihon sources lists the others in `info.aliases`.
2. **`Manga.url` and `Chapter.url` are exactly what the Kotlin extension stores** (usually the path without the domain). If they differ, restored entries resolve to your source but their pages won't load.

A Mihon backup also restores each entry's memo into `sourceData`, so keep Mihon's memo there too. When a URL isn't the page's path (a WordPress post ID, say, with the path in the memo), `getMangaUrl(manga)` gives the page for the web view and sharing.

A source that's new, with nothing to match in Mihon, still needs an `id`: use `md5("<name lowercased>/<lang>/1")` as the build computes it, so it doesn't clash with anyone else's.

### Filters

`getFilterList()` returns Mihon's filter kinds as plain data: `header`, `separator`, `text`, `select`, `checkboxes`, `tristates` and `sort`. The app shows them, and `searchManga` receives the same list with the user's choices.

Filters that come from the site, like the genres it lists, work as Mihon's `fetchFilterData` does. The source's `fetchFilterData()` fetches them and returns anything JSON can hold; the app keeps that for a day (per version of the source) and passes it to `getFilterList(data)`. Until it has, and in apps older than host API 3, `data` is undefined, so `getFilterList` returns the filters that work without it. The app fetches it when the source's Browse screen opens and updates the filters once it arrives.

The app merges its Popular and Latest into the source's sort (a `sort` filter, or a `select` named like "Sort by"). So that the same list isn't offered twice, the sort says which of its options give `getPopularManga`'s and `getLatestUpdates`' lists, by value, and the app shows those options in their place:

```ts
{ type: "select", id: "sort", name: "Sort by", options, selected: 0, listings: { popular: "popular", latest: "" } }
```

Leave out one that no option matches; the app then adds its own. `listings: {}` says none do. The build fails on a sort without `listings`, so every source makes the call.

## Testing

`npm run build` checks each source as it bundles it: that it loads without calling the app, that its `info` is complete, that it has every function the app calls, its Mihon ID, and its sort's `listings`. Then `npm run serve` and install it in the app, in the Simulator or on a device, to try it for real. The app logs what a source writes with `console` to Console.app, under the category "Extension <name>".

## Publishing a repository

`npm run build` writes `dist/`:

```
dist/index.json              { name, sources: [{ ...info, apiVersion, file, sha256 }] }
dist/sources/<lang>.<name>.js
dist/icons/<lang>.<name>.png  (from an icon.png beside index.ts, if info.icon isn't set)
```

The repository's name, which the app shows, is `honya.repoName` in `package.json`.

Host `dist/` anywhere that serves static files. Users can add any of these:

- the address of the folder that holds `index.json`, or the `index.json` URL itself
- a GitHub repository link (`https://github.com/<you>/<repo>`). The app reads `index.json` from the repository's `repo` branch, then from its default branch. `/tree/<branch>/<path>` links work too.

[`.github/workflows/publish.yml`](.github/workflows/publish.yml) builds on every push to `main` and force-pushes `dist/` to the `repo` branch, so a copy of this repository on GitHub is a repository people can add as it is.

The app checks each download against `sha256` and loads the script once before installing it. It won't offer a source whose `apiVersion` is newer than the version it supports (currently 4).

## Versions

- **Source `version`**: bump it for every release. The app compares versions numerically ("1.10.0" > "1.9.2") to offer updates.
- **Host API version** (`apiVersion`): the version of what the app provides a source: the `Honya` global, and the functions it calls. `API_VERSION` in `scripts/build.mjs` is the newest the app supports. The build lists each source with the oldest version it runs on (4 for one with tiled page images, 3 for one with `fetchFilterData` or `getMangaUrl`, else 2), so older apps keep the rest.

## License

The SDK, the build scripts and the example sources' code are under the [Apache License 2.0](LICENSE). The comics Public Domain Comics and Public Domain Manga list are in the public domain; their scans are hosted by the Internet Archive and Japan's National Diet Library. Pepper&Carrot is by David Revoy and its translators, under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/); Mini Fantasy Theater, also by David Revoy and its translators, is under [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Both are read from [peppercarrot.com](https://www.peppercarrot.com).
