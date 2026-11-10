# Instructions for AI agents

This repository builds sources for Honya, a manga reader for iPhone and iPad, with the SDK in `sdk/`, and publishes them as a Honya repository. On every push to `main`, `.github/workflows/publish.yml` builds `dist/` and pushes it to the `repo` branch, and people add the repository's GitHub address in Honya under Settings → Sources. A change reaches them only once it's on `main`.

The person asking may not be a developer. Do the work yourself, don't ask them to run commands, and explain what you did in plain words. When you're done, tell them how to get the change onto `main`, usually by merging your pull request.

To work on it, read `README.md`, `sdk/types.ts`, `sdk/host.d.ts` and `sdk/helpers.ts`. The example sources in `src/` show how a source is written.

## Ask first

Unless this is github.com/HonyaApp/Extensions itself, the repository is a copy for someone's sources. Before you change anything, ask them these questions in one message, then stop until they answer:

1. **What should Honya call this repository?** Ask while `honya.repoName` in `package.json` is still "Honya Example Repo". It's the name Honya shows wherever the repository is listed.
2. **Which sites do you want to port?** By the names their extensions have in Mihon. Ask unless the request names them.

In the same message, say that the SDK's example sources (`src/en/publicdomaincomics`, `src/ja/publicdomainmanga`, `src/all/peppercarrot`) go with the first port, unless they want to keep them.

Don't answer for them or guess, and don't start until they've answered. Skip a question only when it's already answered. If a site's name matches more than one Keiyoushi extension, or none, say what you found and ask which they mean.

## Porting from Keiyoushi

Sources can be ported from Keiyoushi's Mihon extensions, written in Kotlin. Check them out into `.keiyoushi/`, which git ignores:

    git clone --depth 1 --filter=blob:none --sparse https://github.com/keiyoushi/extensions-source .keiyoushi
    git -C .keiyoushi sparse-checkout set --no-cone /src/ /lib/ /lib-multisrc/ /core/

If it's already there, `git -C .keiyoushi pull` instead. An extension is a folder in `.keiyoushi/src/<lang>/<name>/`: find the one asked for by the name in its `build.gradle.kts`. Read its `build.gradle.kts` and Kotlin, and what it uses from `.keiyoushi/core`, `lib` and `lib-multisrc` (its theme, when `build.gradle.kts` names one).

### Keep what Mihon backups rely on

- `info.id` is the extension's Mihon source ID: the `id` its `build.gradle.kts` sets, or else `md5("<name lowercased>/<lang>/<versionId>")` as the build computes it, with `versionId` 1 unless the extension sets one. `npm run build` warns about an id that doesn't match `versionId` 1; for these that's expected, so keep the id.
- `Manga.url` and `Chapter.url` are exactly what the Kotlin stores. Keep its memo in `sourceData`, and its settings under the same preference keys.
- `name`, `lang` and `baseUrl` come from `build.gradle.kts`, one source per `source {}` block. Export an array when there are several.
- Set `nsfw: true` unless its `contentWarning` is `SAFE`.

### Porting

- Map KeiSource's functions onto the `Source`'s: `getSearchMangaList` is `searchManga`, `fetchMangaUpdate` becomes `getMangaDetails` and `getChapterList`, and `getMangaUrl` stays `getMangaUrl`. Leave out what the `Source` type has no place for, such as `getMangaByUrl`, `getChapterUrl` and related titles.
- Keep the Jsoup selectors as they are.
- Sources run in JavaScriptCore: there's no `fetch`, DOM, `URL`, `setTimeout` or `atob`. Use the `Honya` global and the SDK helpers.
- Rate limits go in `info.rateLimits`, and image headers in `info.imageHeaders`. Images that `getImageUrl` finds lazily are resolved in `getPageList`, a few at a time with `mapLimit`.
- Every sort filter needs `listings`.
- A theme several sites share goes in `src/themes/<theme>.ts`, taking the Kotlin members sites override as options, so each site is a few lines. The build only builds folders with an `index.ts`, so it isn't listed as a source.
- Don't edit `sdk/`. Put anything else a source needs in its folder.
- If you can reach the site, check your selectors against its pages, and say whether you could.

### Each port

- Goes in `src/<lang>/<name>/index.ts`, named after its Keiyoushi folder, with the extension's `res/mipmap-xxxhdpi/ic_launcher.png` copied to `icon.png` beside it.
- Starts with a comment naming its Keiyoushi folder, the full hash of the `.keiyoushi` commit it was ported from, and the extension's `versionCode`.

### Updating from Keiyoushi

For each port, fetch the commit in its header (`git -C .keiyoushi fetch --depth 1 origin <hash>`), compare its Keiyoushi folder and theme at that commit with the latest, port what changed, and update the header.

## Before you finish

- Raise the `version` of every source you changed, or Honya won't offer the update. New sources start at `1.0.0`.
- Run `npm install` if `node_modules/` is missing, then `npm run check` and `npm run build`, and fix every error.
- Keep `LICENSE`. Keiyoushi's code is under the Apache License 2.0 too, so once there are ports, credit https://github.com/keiyoushi/extensions-source in `README.md`.
- Tell them what you couldn't port, and why.
