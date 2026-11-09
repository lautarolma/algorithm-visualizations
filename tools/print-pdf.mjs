import { chromium } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, process.argv[2] || "guia-bfs.pdf");
const url = pathToFileURL(resolve(root, "index.html")).href;

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(url);
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: output,
  printBackground: true,
  preferCSSPageSize: true
});
await browser.close();

console.log("PDF generado: " + output);
