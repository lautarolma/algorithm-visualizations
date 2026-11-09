const { test, expect } = require("@playwright/test");

async function totalScenes(page) {
  const text = await page.locator("#scene-counter").textContent();
  return parseInt(text.split("/")[1].trim(), 10);
}

test.describe("guía curada", () => {
  test("carga con 10 escenas y sin errores de consola", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });

    await page.goto("/");

    await expect(page.locator("#scene-counter")).toHaveText("1 / 10");
    await expect(page.locator("#scene-title")).toHaveText("Qué vas a ver");
    await expect(page.locator("#mode-chip")).toHaveText("Guía");
    await expect(page.locator("#target-chip")).toHaveText("Objetivo: F");
    await expect(page.locator("#tree .node")).toHaveCount(7);
    expect(errors).toEqual([]);
  });

  test("teclado: avanza, retrocede y reinicia", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Space");
    await expect(page.locator("#scene-counter")).toHaveText("2 / 10");

    await page.keyboard.press("Shift+Space");
    await expect(page.locator("#scene-counter")).toHaveText("1 / 10");

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#scene-counter")).toHaveText("2 / 10");

    await page.keyboard.press("KeyR");
    await expect(page.locator("#scene-counter")).toHaveText("1 / 10");
  });

  test("la escena 8 muestra a F esperando en la cola sin evaluarse", async ({ page }) => {
    await page.goto("/?scene=8");

    await expect(page.locator('[data-node="F"]')).toHaveClass(/s-queued/);
    await expect(page.locator('[data-node="F"]')).not.toHaveClass(/s-eval|s-found/);
    await expect(page.locator("#queue-list .qchip.is-front")).toContainText("F");
  });

  test("la escena 10 cierra con la corrida Z y la leyenda", async ({ page }) => {
    await page.goto("/?scene=10");

    await expect(page.locator("#scene-counter")).toHaveText("10 / 10");
    await expect(page.locator("#target-chip")).toHaveText("Objetivo: Z");
    await expect(page.locator("#target-chip")).toHaveClass(/is-alt/);
    await expect(page.locator("#legend")).toBeVisible();
  });
});

test.describe("modo Explorar", () => {
  test("el selector cambia a Explorar y encuentra B", async ({ page }) => {
    await page.goto("/");
    await page.selectOption("#target-select", "B");

    await expect(page.locator("#mode-chip")).toHaveText("Explorar");
    await expect(page.locator("#target-chip")).toHaveText("Objetivo: B");
    await expect(page).toHaveURL(/\?target=B/);

    const total = await totalScenes(page);
    expect(total).toBeGreaterThan(3);

    await page.goto("/?target=B&scene=" + total);
    await expect(page.locator("#app")).toHaveClass(/result-found/);
    await expect(page.locator("#queue-note")).toContainText("Objetivo encontrado");
  });

  test("un objetivo inexistente termina en rojo", async ({ page }) => {
    await page.goto("/?target=Z");
    const total = await totalScenes(page);

    await page.goto("/?target=Z&scene=" + total);
    await expect(page.locator("#app")).toHaveClass(/result-exhausted/);
    await expect(page.locator("#queue-note")).toContainText("Cola vacía");
  });

  test("el objetivo raíz genera una timeline corta y válida", async ({ page }) => {
    await page.goto("/?target=A");

    await expect(page.locator("#scene-counter")).toHaveText("1 / 4");
    await page.goto("/?target=A&scene=4");
    await expect(page.locator("#app")).toHaveClass(/result-found/);
  });
});

test.describe("árboles", () => {
  test("cambiar de árbol reconstruye el SVG y el modo", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#tree .node")).toHaveCount(7);

    await page.selectOption("#tree-select", "wide");
    await expect(page.locator("#tree .node")).toHaveCount(10);
    await expect(page.locator("#mode-chip")).toHaveText("Explorar");
    await expect(page).toHaveURL(/tree=wide/);

    await page.selectOption("#tree-select", "deep");
    await expect(page.locator("#tree .node")).toHaveCount(6);

    await page.selectOption("#tree-select", "classic");
    await expect(page.locator("#tree .node")).toHaveCount(7);
    await expect(page.locator("#mode-chip")).toHaveText("Guía");
  });
});

test.describe("tema", () => {
  test("alterna a oscuro y persiste al recargar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.click("#btn-theme");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("#btn-theme")).toHaveAttribute("aria-pressed", "true");

    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe("rgb(14, 17, 22)");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("impresión", () => {
  test("muestra solo el contenido imprimible con 3 diagramas", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    await expect(page.locator(".app")).toBeHidden();
    await expect(page.locator(".print-only")).toBeVisible();
    await expect(page.locator(".print-figures figure")).toHaveCount(3);
    await expect(page.locator(".print-scenes li")).toHaveCount(10);
    await expect(page.locator(".print-only .subtitle")).toContainText("Clásico");
  });

  test("en modo oscuro el papel sigue siendo claro", async ({ page }) => {
    await page.goto("/");
    await page.click("#btn-theme");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.emulateMedia({ media: "print" });
    const ink = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--ink").trim()
    );
    expect(ink).toBe("#1f2933");
  });

  test("el print refleja el árbol y el objetivo elegidos", async ({ page }) => {
    await page.goto("/?tree=wide&target=B");
    const total = await totalScenes(page);

    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".print-figures figure")).toHaveCount(3);
    await expect(page.locator(".print-scenes li")).toHaveCount(total);
    await expect(page.locator(".print-only .subtitle")).toContainText("Buscando B en Ancho");
  });
});

test.describe("accesibilidad y motion", () => {
  test("respeta prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?scene=6");

    // La escena 7 tiene 9 frames y 420 ms entre cada uno.
    await page.keyboard.press("Space");
    await expect(page.locator("#beat-label")).toContainText("Expandir D");
  });

  test("en móvil no hay overflow horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator("#btn-next")).toBeVisible();
  });
});
