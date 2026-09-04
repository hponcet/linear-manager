import { expect, test } from "@playwright/test"

import {
  getDescriptionUpdates,
  getIpcRequests,
  openIssueWebview,
  waitForDescriptionUpdate,
} from "./support/issueWebview"

import type { Locator, Page } from "@playwright/test"

const selectAll = process.platform === "darwin" ? "Meta+A" : "Control+A"

async function replaceDescription(page: Page, editor: Locator, value: string) {
  await editor.click()
  await editor.press(selectAll)
  await editor.press("Backspace")
  await page.keyboard.insertText(value)
  await expect(editor).toHaveText(value)
}

async function appendDescription(page: Page, editor: Locator, value: string) {
  await editor.locator("p").last().click()
  await page.keyboard.press("End")
  await page.keyboard.insertText(value)
}

async function blurDescription(page: Page) {
  await page.getByRole("heading", { name: "Activity" }).click()
}

test("debounces description saves for 750 ms and flushes the next value on blur", async ({
  page,
}) => {
  await page.clock.install()
  const harness = await openIssueWebview(page, "Initial")
  await page.clock.pauseAt(Date.now() + 1_000)
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await appendDescription(page, editor, " debounced")
  expect(await getDescriptionUpdates(page)).toEqual([])

  await page.clock.runFor(749)
  expect(await getDescriptionUpdates(page)).toEqual([])

  await page.clock.runFor(1)
  let updates = await waitForDescriptionUpdate(page, 0)
  expect(updates.at(-1)?.fields.description).toBe("Initial debounced")

  await appendDescription(page, editor, " blurred")
  await blurDescription(page)
  await page.clock.runFor(0)
  updates = await waitForDescriptionUpdate(page, updates.length)
  expect(updates.at(-1)?.fields.description).toBe("Initial debounced blurred")

  expect(updates).toHaveLength(2)
  await harness.assertClean()
})

test("keeps one description save active and sends only the latest pending value", async ({
  page,
}) => {
  await page.clock.install()
  const harness = await openIssueWebview(page, {
    initialDescription: "Initial",
    descriptionUpdateDelayMs: 1_000,
  })
  await page.clock.pauseAt(Date.now() + 1_000)
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await appendDescription(page, editor, " first")
  await blurDescription(page)
  await page.clock.runFor(0)
  await waitForDescriptionUpdate(page, 0)

  await replaceDescription(page, editor, "Outdated value")
  await replaceDescription(page, editor, "Latest value")
  await blurDescription(page)
  await page.clock.runFor(0)

  expect(await getDescriptionUpdates(page)).toHaveLength(1)
  await page.clock.runFor(999)
  expect(await getDescriptionUpdates(page)).toHaveLength(1)

  await page.clock.runFor(1)
  const updates = await waitForDescriptionUpdate(page, 1)
  expect(updates.map(({ fields }) => fields.description)).toEqual(["Initial first", "Latest value"])

  await page.clock.runFor(1_000)
  await expect
    .poll(async () => (await getIpcRequests(page, "setIssueDescriptionDraft")).at(-1)?.value)
    .toBeNull()
  await harness.assertClean()
})

test("restores a draft after a network failure and retries it successfully", async ({
  page,
  context,
}) => {
  const failedHarness = await openIssueWebview(page, {
    initialDescription: "Saved description",
    descriptionUpdateFailures: 1,
  })
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await replaceDescription(page, editor, "Unsaved network draft")
  await blurDescription(page)
  const failedUpdates = await waitForDescriptionUpdate(page, 0)
  expect(failedUpdates.at(-1)?.fields.description).toBe("Unsaved network draft")
  await expect(
    page.getByText(/Failed to update issue.*E2E description update failure/),
  ).toBeVisible()
  await expect(editor).toHaveText("Unsaved network draft")

  const persistedDrafts = await getIpcRequests(page, "setIssueDescriptionDraft")
  expect(persistedDrafts.at(-1)?.value).toBe("Unsaved network draft")
  expect(persistedDrafts.some(({ value }) => value === null)).toBe(false)
  await failedHarness.assertClean()

  const restoredPage = await context.newPage()
  const restoredHarness = await openIssueWebview(restoredPage, {
    initialDescription: "Saved description",
    initialDraft: "Unsaved network draft",
  })
  const restoredEditor = restoredPage.getByRole("textbox", { name: "Issue description" })

  await expect(restoredEditor).toHaveText("Unsaved network draft")
  const retriedUpdates = await waitForDescriptionUpdate(restoredPage, 0)
  expect(retriedUpdates.at(-1)?.fields.description).toBe("Unsaved network draft")
  await expect
    .poll(
      async () => (await getIpcRequests(restoredPage, "setIssueDescriptionDraft")).at(-1)?.value,
    )
    .toBeNull()
  await restoredHarness.assertClean()
  await restoredPage.close()
})

test("keeps an invalid local draft from hiding the saved Linear description", async ({ page }) => {
  const savedDescription = "## Saved Linear description\n\nAll supported features stay visible."
  const harness = await openIssueWebview(page, {
    initialDescription: savedDescription,
    initialDraft: "+++ \n\n+++",
    expectUnsupported: true,
  })

  const reader = page.getByRole("document", { name: "Issue description" })
  await expect(reader).toHaveText(/Saved Linear description.*All supported features stay visible/s)
  await expect(page.getByText(/content is read-only to prevent Markdown data loss/i)).toHaveCount(0)
  await expect(page.getByRole("alert")).toContainText(
    "local draft contains invalid Linear Markdown",
  )
  expect(await getDescriptionUpdates(page)).toEqual([])

  await page.getByRole("button", { name: "Discard local draft" }).click()
  await expect(page.getByRole("textbox", { name: "Issue description" })).toHaveText(
    /Saved Linear description.*All supported features stay visible/s,
  )
  await expect
    .poll(async () => (await getIpcRequests(page, "setIssueDescriptionDraft")).at(-1)?.value)
    .toBeNull()
  expect(await getDescriptionUpdates(page)).toEqual([])
  await harness.assertClean()
})

test("keeps unsupported source read-only and never starts a description mutation", async ({
  page,
}) => {
  const source = "<div>Unsupported source stays byte-for-byte</div>"
  const harness = await openIssueWebview(page, {
    initialDescription: source,
    expectUnsupported: true,
  })

  await expect(page.getByRole("alert")).toContainText("read-only")
  await expect(page.getByRole("document", { name: "Issue description" })).toHaveText(source)
  await page.waitForTimeout(800)
  expect(await getDescriptionUpdates(page)).toEqual([])
  expect(await getIpcRequests(page, "setIssueDescriptionDraft")).toEqual([])
  await harness.assertClean()
})
