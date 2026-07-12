// IndexNow bulk submission: pings Bing, Yandex, Seznam, Naver instantly.
// Reads the live sitemap and submits every URL (IndexNow allows 10,000/request).
// Usage: node scripts/indexnow-submit.mjs [--cities-only]

const KEY = "ea2d92bcfd4b40d4bf14ca9a5f203e9a";
const HOST = "www.waterdamagerepair.io";
const KEY_LOCATION = "https://" + HOST + "/" + KEY + ".txt";
const SITEMAP = "https://" + HOST + "/sitemap.xml";
const ENDPOINT = "https://api.indexnow.org/IndexNow";
const citiesOnly = process.argv.includes("--cities-only");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sm = await (await fetch(SITEMAP)).text();
let urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (citiesOnly) urls = urls.filter((u) => /\/states\/[a-z-]+\/[a-z-]+$/.test(u));

console.log("sitemap URLs: " + urls.length + (citiesOnly ? " (cities only)" : ""));

let ok = 0;
for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }),
  });
  const txt = await res.text().catch(() => "");
  console.log("batch " + (i / 10000 + 1) + ": " + batch.length + " URLs -> HTTP " + res.status + " " + res.statusText + " " + txt.slice(0, 120));
  if (res.status === 200 || res.status === 202) ok += batch.length;
  await sleep(1000);
}
console.log("done: " + ok + "/" + urls.length + " accepted");
