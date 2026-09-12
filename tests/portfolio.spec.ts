import { expect, test } from "@playwright/test";

const routes = [
  ["/p/about", "ABOUT"],
  ["/p/contact", "CONTACT"],
  ["/p/awsinternship", "Amazon UX Design Internship"],
  ["/p/docbot", "DocBot"],
  ["/p/costco-redesign", "CostcoGrocery • Website Redesign"],
  ["/p/diem-app", "Diem"],
  ["/p/uxresearch", "UX Research"],
];

test("homepage has six linked projects and no exposed editing navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, I'm Victoria!");
  await expect(page.locator(".project-card")).toHaveCount(6);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.locator('a[href*="admin"], a[href*="sanity"]')).toHaveCount(0);
  await expect(page.locator('a[href$="resume.pdf"]')).toHaveAttribute("target", "_blank");
  await page.getByRole("link", { name: "View DocBot • Capstone Project" }).click();
  await expect(page).toHaveURL(/\/p\/docbot\/?$/);
});

for (const [path, heading] of routes) {
  test(`${path} renders the migrated page with working images`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(path || "/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading || "");
    await page.locator("img").evaluateAll((images) => {
      for (const image of images) {
        if (image instanceof HTMLImageElement) image.loading = "eager";
      }
    });
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}

test("the image lightbox supports Escape and restores focus", async ({ page }) => {
  await page.goto("/p/about");
  const trigger = page.getByRole("button", { name: /^Enlarge/ }).first();
  await trigger.scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    document.querySelector('astro-island[component-export="ImageGallery"]:not([ssr])'),
  );
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Close enlarged image" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("protected work is an honest teaser, not a client-side password bypass", async ({ page }) => {
  await page.goto("/p/integro");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This case study is available on request.",
  );
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.getByRole("link", { name: "Request access" }).click();
  await expect(page).toHaveURL(/\/p\/contact\/?$/);
});

test("editor entry is unlinked, noindex, and clearly unconfigured", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(page.getByText("The editing portal has not been connected yet.")).toBeVisible();
});

test("contact fallback does not pretend a message was sent", async ({ page }) => {
  test.skip(Boolean(process.env.TEST_CONTACT_FORM), "Runs against the unconfigured static build.");
  await page.goto("/p/contact");
  await expect(page.getByRole("button", { name: "Open email draft" })).toBeVisible();
  await expect(page.getByText("Opens your email app.", { exact: false })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "email me directly", exact: true }).first(),
  ).toHaveAttribute("href", /^mailto:/);
  await expect(page.getByText("Your message has been sent", { exact: false })).toHaveCount(0);
});

test("missing routes return a real 404", async ({ page }) => {
  const response = await page.goto("/not-a-real-page");
  expect(response?.status()).toBe(404);
});

for (const outcome of ["success", "failure", "network error"]) {
  test(`configured contact form handles ${outcome}`, async ({ page }) => {
    test.skip(!process.env.TEST_CONTACT_FORM, "Requires the isolated Formspree test build.");
    await page.route("https://formspree.io/f/testform", async (route) => {
      if (outcome === "network error") return route.abort();
      await route.fulfill({
        status: outcome === "success" ? 200 : 422,
        contentType: "application/json",
        body: JSON.stringify({ ok: outcome === "success" }),
      });
    });
    await page.goto("/p/contact");
    await page.getByLabel("Email", { exact: true }).fill("visitor@example.com");
    await page.getByLabel("Name", { exact: true }).fill("Test Visitor");
    await page
      .getByLabel("Message", { exact: true })
      .fill("A local, intercepted test submission. Not delivered.");
    await page.getByRole("button", { name: "Send email", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
      outcome === "success"
        ? "Your message has been sent"
        : outcome === "failure"
          ? "could not be sent"
          : "Could not connect",
    );
    await expect(page.getByRole("button", { name: "Send email", exact: true })).toBeEnabled();
  });
}
