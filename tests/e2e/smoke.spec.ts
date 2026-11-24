import { expect, test } from "@playwright/test";

test.describe("halaman publik", () => {
  test("landing menampilkan CTA dan tautan harga", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /Bangun kebiasaan kecil/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Mulai gratis|Buka aplikasi/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Lihat paket/i }).first()).toBeVisible();
  });

  test("pricing menampilkan tiga paket", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByRole("heading", { name: /Pilih kapasitas/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("halaman privat mengarahkan pengguna anonim ke login", async ({ page }) => {
    await page.goto("/app");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Masuk/i })).toBeVisible();
  });

  test("sitemap dan robots dapat diakses", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain("<urlset");

    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Sitemap:");
  });
});
