import { test, expect } from "@playwright/test"

const MOVIE_ID = 550
const MOVIE_TITLE = "Fight Club"

const TV_ID = 1399
const TV_TITLE = "Game of Thrones"

test.describe("TMDB — Movie detail page", () => {
    test("loads and displays movie data", async ({ page }) => {
        await page.goto(`/movie/${MOVIE_ID}`)
        await expect(page.getByRole("heading", { level: 1 })).toContainText(MOVIE_TITLE, { timeout: 10000 })
    })

    test("shows release year", async ({ page }) => {
        await page.goto(`/movie/${MOVIE_ID}`)
        await expect(page.getByText(/1999/).first()).toBeVisible({ timeout: 10000 })
    })

    test("shows cast section", async ({ page }) => {
        await page.goto(`/movie/${MOVIE_ID}`)
        await expect(page.getByText(/cast|distribution/i).first()).toBeVisible({ timeout: 10000 })
    })
})

test.describe("TMDB — TV show detail page", () => {
    test("loads and displays TV show data", async ({ page }) => {
        await page.goto(`/tv/${TV_ID}`)
        await expect(page.getByRole("heading", { level: 1 })).toContainText(TV_TITLE, { timeout: 10000 })
    })

    test("shows seasons", async ({ page }) => {
        await page.goto(`/tv/${TV_ID}`)
        await expect(page.getByText(/season|saison/i).first()).toBeVisible({ timeout: 10000 })
    })
})
