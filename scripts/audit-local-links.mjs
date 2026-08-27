#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const origin = new URL(process.argv[2] || "http://127.0.0.1:8000");
const prefix = "/kootok/";
const excluded = new Set([".git", ".claude", ".impeccable", "figmosha2", "node_modules", "tmp"]);
const reports = [];
const fetchedCss = new Set();

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function routeContexts(file) {
  const rel = relative(root, file).split(sep).join("/");
  if (rel === "index.html") return [prefix, prefix + "index.html"];
  if (/^research\/(research|personas|ia)\.html$/.test(rel)) {
    return [prefix + rel.replace("research/", ""), prefix + rel];
  }
  if (rel === "beginners/source/concept.html") {
    return [prefix + "lesson-6-concept.html", prefix + rel];
  }
  if (rel.startsWith("beginners/source/prototype/") && rel.endsWith(".html")) {
    return [prefix + "lesson-6/" + rel.split("/").pop(), prefix + rel];
  }
  return [prefix + rel];
}

function localUrl(raw, baseUrl) {
  const value = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!value || value.startsWith("#") || /^(?:data|mailto|tel|javascript|blob):/i.test(value)) return null;
  const url = new URL(value, baseUrl);
  if (url.origin !== origin.origin) return null;
  return url;
}

function htmlRefs(text) {
  const refs = [];
  const attr = /\b(href|src|action)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match;
  while ((match = attr.exec(text))) refs.push({ kind: match[1].toLowerCase(), value: match[2] ?? match[3] ?? match[4] });
  const styles = [...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((item) => item[1]);
  return { refs, inlineCss: styles.join("\n") };
}

function cssRefs(text) {
  return [...text.matchAll(/url\(\s*([^)]*?)\s*\)/gi)].map((item) => item[1]);
}

async function request(url) {
  const visited = [];
  let current = new URL(url);
  for (let redirects = 0; redirects <= 10; redirects += 1) {
    const key = current.href;
    if (visited.includes(key)) return { ok: false, status: "redirect-loop", final: key, visited };
    visited.push(key);
    let response;
    try {
      response = await fetch(current, { redirect: "manual" });
    } catch (error) {
      return { ok: false, status: "network-error", final: key, error: String(error), visited };
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { ok: false, status: response.status, final: key, visited };
      current = new URL(location, current);
      continue;
    }
    return { ok: response.ok, status: response.status, final: current.href, visited, response };
  }
  return { ok: false, status: "too-many-redirects", final: current.href, visited };
}

async function auditTarget(source, kind, url) {
  const fetchUrl = new URL(url);
  fetchUrl.hash = "";
  const result = await request(fetchUrl);
  reports.push({ source, kind, target: url.href, status: result.status, final: result.final, redirects: result.visited.length - 1, ok: result.ok });
  if (!result.ok || kind !== "href" || !url.hash || !/text\/html/i.test(result.response.headers.get("content-type") || "")) return;
  const text = await result.response.text();
  const id = decodeURIComponent(url.hash.slice(1));
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasFragment = new RegExp("\\b(?:id|name)\\s*=\\s*([\"'])" + escaped + "\\1", "i").test(text);
  if (!hasFragment) {
    reports.push({ source, kind: "fragment", target: url.href, status: "missing-fragment", final: result.final, redirects: 0, ok: false });
  }
}

async function auditCss(cssUrl, source) {
  const key = cssUrl.href;
  if (fetchedCss.has(key)) return;
  fetchedCss.add(key);
  const result = await request(cssUrl);
  reports.push({ source, kind: "stylesheet", target: key, status: result.status, final: result.final, redirects: result.visited.length - 1, ok: result.ok });
  if (!result.ok) return;
  const css = await result.response.text();
  for (const raw of cssRefs(css)) {
    const target = localUrl(raw, cssUrl);
    if (target) await auditTarget(key, "css-url", target);
  }
}

const all = await walk(root);
const htmlFiles = all.filter((file) => {
  const rel = relative(root, file).split(sep).join("/");
  return extname(file) === ".html" && (rel === "index.html" || rel.startsWith("research/") || rel === "beginners/source/concept.html" || rel.startsWith("beginners/source/prototype/"));
});

for (const file of htmlFiles) {
  const source = relative(root, file).split(sep).join("/");
  const text = await readFile(file, "utf8");
  const { refs, inlineCss } = htmlRefs(text);
  for (const route of routeContexts(file)) {
    const pageUrl = new URL(route, origin);
    for (const ref of refs) {
      const target = localUrl(ref.value, pageUrl);
      if (!target) continue;
      if (ref.kind === "href" && /\.css(?:$|[?#])/i.test(target.pathname)) await auditCss(target, source + " @ " + route);
      else await auditTarget(source + " @ " + route, ref.kind, target);
    }
    for (const raw of cssRefs(inlineCss)) {
      const target = localUrl(raw, pageUrl);
      if (target) await auditTarget(source + " @ " + route, "inline-css-url", target);
    }
  }
}

const broken = reports.filter((item) => !item.ok);
const redirects = reports.filter((item) => item.redirects > 0);
const counts = reports.reduce((acc, item) => {
  acc[item.kind] = (acc[item.kind] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ origin: origin.origin, htmlFiles: htmlFiles.length, contexts: htmlFiles.reduce((sum, file) => sum + routeContexts(file).length, 0), checks: reports.length, counts, redirects: redirects.length, broken }, null, 2));
if (broken.length) process.exitCode = 1;
