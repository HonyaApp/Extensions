"use strict";
var __extension = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/en/agegatetest/index.ts
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });
  var baseUrl = "https://github.com/HonyaApp/Extensions";
  var files = "https://raw.githubusercontent.com/HonyaApp/Extensions/app-review/sources/en.agegatetest";
  var manga = {
    url: "/tree/app-review",
    title: "Age Gate Test",
    thumbnailUrl: `${files}/cover.png`,
    author: "Honya",
    artist: "Honya",
    description: "This source is marked 18+ only to test Honya's age gate. It contains no adult content: just two pages explaining how the gate works.",
    genres: ["Test"],
    status: "completed"
  };
  var chapter = {
    url: "/tree/app-review/sources",
    name: "How the Age Gate Works",
    dateUpload: Date.UTC(2026, 9, 21),
    chapterNumber: 1,
    scanlator: "Honya"
  };
  var source = {
    info: {
      id: "4495982035071456780",
      // md5("age gate test/en/1"), as Mihon would make it
      name: "Age Gate Test",
      lang: "en",
      version: "1.0.0",
      baseUrl,
      nsfw: true,
      icon: `${files}/icon.png`
    },
    async getPopularManga() {
      return { mangas: [manga], hasNextPage: false };
    },
    async searchManga(_page, query) {
      const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 0);
      const text = `${manga.title} ${manga.genres?.join(" ")}`.toLowerCase();
      return { mangas: words.every((word) => text.includes(word)) ? [manga] : [], hasNextPage: false };
    },
    async getMangaDetails() {
      return manga;
    },
    async getChapterList() {
      return [chapter];
    },
    async getPageList() {
      return [1, 2].map((page) => ({ url: `${files}/page-${page}.png` }));
    }
  };
  var index_default = source;
  return __toCommonJS(index_exports);
})();
globalThis.source = __extension.default;
