import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("https://api.open-meteo.com/**", (r) =>
    r.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.route("https://*.tile.openstreetmap.org/**", (r) => r.abort());
});
test("guest feed, municipality filters, real detail routes and safe errors", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Find your place. Share your journey." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Torrijos", exact: true }).click();
  await expect(page.locator(".post-card")).toHaveCount(2);
  await page.getByRole("link", { name: "Poctoy White Beach" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Poctoy White Beach", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Fee not verified — confirm with the operator.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Forecast unavailable.", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/desktop-detail.png",
    fullPage: true,
  });
});
test("map filters and editable transparent Lenten simulation", async ({
  page,
}) => {
  await page.goto("/map");
  await expect(
    page.getByRole("heading", { name: "6 places to discover" }),
  ).toBeVisible();
  await page
    .locator(".filter-grid")
    .getByRole("combobox", { name: "municipality", exact: true })
    .selectOption("Boac");
  await expect(
    page.getByRole("heading", { name: "1 places to discover" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Lenten tourism surge", exact: true })
    .click();
  await expect(page.getByText("154.7%", { exact: true })).toBeVisible();
  await page.getByLabel("Additional visitors", { exact: true }).fill("0");
  await expect(page.getByText("128.0%", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Generate itinerary", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No verified destinations match yet" }),
  ).toBeVisible();
});
test("RINI cites records and hands off to itinerary engine", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Chat with RINI" }).click();
  const widget = page.getByRole("dialog", { name: "Ask RINI", exact: true });
  await expect(
    widget.getByRole("textbox", { name: "Message RINI" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(widget).not.toBeVisible();
  await page.goto("/rini");
  await page
    .getByRole("button", { name: "Tell me about Boac", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Boac Cathedral · source reference" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Plan a two-day beach itinerary",
      exact: true,
    })
    .click();
  await page
    .getByRole("link", { name: "Continue in DALUYAN →" })
    .last()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Plan your Marinduque journey" }),
  ).toBeVisible();
});
test("hub filters, demo labels, no invented contacts and enabled auth", async ({
  page,
}) => {
  await page.goto("/hub");
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Local artisans");
  await expect(page.locator(".listing-card")).toHaveCount(1);
  await page.locator(".listing-card h3").click();
  await expect(
    page.getByText("Contact information unavailable.", { exact: true }),
  ).toBeVisible();
  await page.goto("/auth");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("Account services are unavailable in public preview.", {
      exact: false,
    }),
  ).toHaveCount(0);
  await page.goto("/notifications");
  await expect(
    page.getByRole("heading", { name: "Your journey starts here" }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/auth/);
});
test("mobile drawer active routes, outside click, Escape and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  const drawer = page.getByRole("dialog", { name: "Explore DALUYAN" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "MAP", exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await menu.click();
  await expect(
    drawer.getByRole("link", { name: "MAP", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.click();
  await page.mouse.click(360, 500);
  await expect(drawer).not.toBeVisible();
  for (const route of ["/", "/map", "/hub", "/rini", "/settings", "/auth"]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page.screenshot({
    path: "test-results/mobile-home.png",
    fullPage: true,
  });
});

test("town stories scroll, feed stacks and reduced motion stays accessible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".town-story")).toHaveCount(6);
    await expect(page.locator(".feed-welcome .button")).toBeVisible();
    await expect(page.locator(".story-mosaic")).toHaveCSS(
      "flex-direction",
      "column",
    );
    await page
      .getByRole("button", { name: "Show stories from Torrijos", exact: true })
      .scrollIntoViewIfNeeded();
    await page
      .getByRole("button", { name: "Show stories from Torrijos", exact: true })
      .click();
    await expect(page.locator(".post-card")).toHaveCount(2);
    await page.getByRole("button", { name: "All towns", exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "All towns", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.goto("/notifications");
  await expect(page.locator(".empty-mask")).toBeVisible();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Share a story", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Share a story", exact: true }),
  ).toBeFocused();
  const animation = await page
    .locator(".feed-welcome .button")
    .evaluate((el) => getComputedStyle(el, "::after").animationName);
  expect(animation).toBe("none");
});
