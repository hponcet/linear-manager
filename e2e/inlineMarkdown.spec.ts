import { expect, test } from "@playwright/test"

import { getIpcRequests, openIssueWebview, waitForDescriptionUpdate } from "./support/issueWebview"

import type { Locator, Page } from "@playwright/test"

const selectAll = async (editor: Locator) => {
  await editor.press(process.platform === "darwin" ? "Meta+A" : "Control+A")
}

async function expectSavedDescription(page: Page, previousCount: number, expected: string) {
  const updates = await waitForDescriptionUpdate(page, previousCount)
  expect(updates.at(-1)?.fields.description).toBe(expected)
  return updates.length
}

async function deleteDocument(page: Page, editor: Locator, previousCount: number) {
  await editor.focus()
  await selectAll(editor)
  await editor.press("Backspace")
  const count = await expectSavedDescription(page, previousCount, "")
  await expect(editor).toHaveText("")
  return count
}

for (const level of [1, 2, 3, 4, 5, 6] as const) {
  test(`uses, edits, deletes, and recreates heading ${level}`, async ({ page }) => {
    const marker = "#".repeat(level)
    const initialText = `Original heading ${level}`
    const editedText = `O editedriginal heading ${level}`
    const recreatedText = `Recreated heading ${level}`
    const context = "Context paragraph."
    const harness = await openIssueWebview(page, `${marker} ${initialText}\n\n${context}`)
    const editor = page.getByRole("textbox", { name: "Issue description" })

    await expect(editor.locator(`h${level}`)).toHaveText(initialText)

    await editor.press("Home")
    await editor.press("ArrowRight")
    await editor.pressSequentially(" edited")
    let updateCount = await expectSavedDescription(page, 0, `${marker} ${editedText}\n\n${context}`)
    await expect(editor.locator(`h${level}`)).toHaveText(editedText)

    updateCount = await deleteDocument(page, editor, updateCount)

    await editor.pressSequentially(`${marker} `)
    await editor.pressSequentially(recreatedText)
    await editor.press("Enter")
    await editor.pressSequentially(context)
    await expectSavedDescription(page, updateCount, `${marker} ${recreatedText}\n\n${context}`)
    await expect(editor.locator(`h${level}`)).toHaveText(recreatedText)
    await harness.assertClean()
  })
}

const markCases = [
  { name: "bold", marker: "**", selector: "strong", button: "Bold" },
  { name: "italic", marker: "*", selector: "em", button: "Italic" },
  { name: "strike", marker: "~~", selector: "s", button: "Strike" },
  { name: "inline code", marker: "`", selector: "code", button: "Code" },
] as const

for (const feature of markCases) {
  test(`uses, edits, deletes, and recreates ${feature.name}`, async ({ page }) => {
    const initialText = `Original ${feature.name}`
    const editedText = `O editedriginal ${feature.name}`
    const recreatedText = `Recreated ${feature.name}`
    const markdown = (text: string) => `${feature.marker}${text}${feature.marker}`
    const harness = await openIssueWebview(page, markdown(initialText))
    const editor = page.getByRole("textbox", { name: "Issue description" })

    await expect(editor.locator(feature.selector)).toHaveText(initialText)

    await editor.press("Home")
    await editor.press("ArrowRight")
    await editor.pressSequentially(" edited")
    let updateCount = await expectSavedDescription(page, 0, markdown(editedText))
    await expect(editor.locator(feature.selector)).toHaveText(editedText)

    updateCount = await deleteDocument(page, editor, updateCount)

    await editor.pressSequentially(recreatedText)
    await selectAll(editor)
    await page.getByRole("button", { name: feature.button, exact: true }).click()
    await expectSavedDescription(page, updateCount, markdown(recreatedText))
    await expect(editor.locator(feature.selector)).toHaveText(recreatedText)
    await harness.assertClean()
  })
}

test("preserves a named link label while editing its URL", async ({ page }) => {
  const initialText = "Original link"
  const initialUrl = "https://example.com/original"
  const editedUrl = "https://example.com/edited_(link)"
  await openIssueWebview(page, `[${initialText}](${initialUrl})`)
  const editor = page.getByRole("textbox", { name: "Issue description" })
  const linkInput = page.getByPlaceholder("Paste a link...")

  await expect(editor.locator("a")).toHaveText(initialText)
  await expect(editor.locator("a")).toHaveAttribute("href", initialUrl)

  await selectAll(editor)
  await expect(linkInput).toBeVisible()
  await linkInput.fill(editedUrl)
  await linkInput.press("Enter")
  await expectSavedDescription(page, 0, `[${initialText}](<${editedUrl}>)`)
})

test("deletes and recreates a named link", async ({ page }) => {
  const initialText = "Original link"
  const initialUrl = "https://example.com/original"
  const recreatedText = "Recreated link"
  const recreatedUrl = "mailto:editor@example.com"
  const harness = await openIssueWebview(page, `[${initialText}](${initialUrl})`)
  const editor = page.getByRole("textbox", { name: "Issue description" })
  const linkInput = page.getByPlaceholder("Paste a link...")

  await expect(editor.locator("a")).toHaveText(initialText)
  await expect(editor.locator("a")).toHaveAttribute("href", initialUrl)

  const updateCount = await deleteDocument(page, editor, 0)

  await editor.pressSequentially(recreatedText)
  await selectAll(editor)
  await page.getByRole("button", { name: "Link", exact: true }).click()
  await linkInput.fill(recreatedUrl)
  await linkInput.press("Enter")
  await expectSavedDescription(page, updateCount, `[${recreatedText}](<${recreatedUrl}>)`)
  await expect(editor.locator("a")).toHaveAttribute("href", recreatedUrl)
  await harness.assertClean()
})

test("uses, edits, deletes, and recreates a signed private Linear link", async ({ page }) => {
  const canonicalUrl = "https://uploads.linear.app/e2e/private-file"
  const editedCanonicalUrl = "https://uploads.linear.app/e2e/private-file-edited"
  const signedUrl = `${canonicalUrl}?signature=temporary`
  const label = "Private file"
  const recreatedLabel = "Recreated private file"
  const harness = await openIssueWebview(page, `[${label}](<${signedUrl}>)`)
  const editor = page.getByRole("textbox", { name: "Issue description" })
  const linkInput = page.getByPlaceholder("Paste a link...")

  await expect(editor.locator("a")).toHaveAttribute("href", canonicalUrl)
  await selectAll(editor)
  await linkInput.fill(`${editedCanonicalUrl}?signature=edited`)
  await linkInput.press("Enter")
  let updateCount = await expectSavedDescription(page, 0, `[${label}](<${editedCanonicalUrl}>)`)
  await expect(editor.locator("a")).toHaveAttribute("href", editedCanonicalUrl)

  updateCount = await deleteDocument(page, editor, updateCount)

  await editor.pressSequentially(recreatedLabel)
  await selectAll(editor)
  await page.getByRole("button", { name: "Link", exact: true }).click()
  await linkInput.fill(signedUrl)
  await linkInput.press("Enter")
  await expectSavedDescription(page, updateCount, `[${recreatedLabel}](<${canonicalUrl}>)`)
  await expect(editor.locator("a")).toHaveAttribute("href", canonicalUrl)
  await harness.assertClean()
})

test("uses, edits, deletes, and recreates a bare link canonically", async ({ page }) => {
  const initialUrl = "https://example.com/original"
  const editedUrl = "http://example.com/edited"
  const recreatedUrl = "https://example.com/recreated"
  const harness = await openIssueWebview(page, initialUrl)
  const editor = page.getByRole("textbox", { name: "Issue description" })
  const linkInput = page.getByPlaceholder("Paste a link...")

  await expect(editor.locator("a")).toHaveText(initialUrl)
  await expect(editor.locator("a")).toHaveAttribute("href", initialUrl)

  await selectAll(editor)
  await linkInput.fill(editedUrl)
  await linkInput.press("Enter")
  let updateCount = await expectSavedDescription(page, 0, `[${initialUrl}](<${editedUrl}>)`)

  updateCount = await deleteDocument(page, editor, updateCount)

  await editor.pressSequentially(recreatedUrl)
  await editor.press("Space")
  await editor.press("Backspace")
  await expectSavedDescription(page, updateCount, `[${recreatedUrl}](<${recreatedUrl}>)`)
  await expect(editor.locator("a")).toHaveAttribute("href", recreatedUrl)
  await harness.assertClean()
})

for (const [protocol, url] of [
  ["HTTP", "http://example.com/path"],
  ["HTTPS", "https://example.com/path"],
  ["mailto", "mailto:editor@example.com"],
] as const) {
  test(`activates an allowed ${protocol} link through IPC`, async ({ page }) => {
    const harness = await openIssueWebview(page, `[Allowed link](<${url}>)`)
    const initialPageUrl = page.url()

    await page.getByRole("textbox", { name: "Issue description" }).locator("a").click()
    await expect.poll(async () => (await getIpcRequests(page, "openExternalUrl")).length).toBe(1)
    expect(await getIpcRequests(page, "openExternalUrl")).toMatchObject([
      { type: "openExternalUrl", url },
    ])
    expect(page.url()).toBe(initialPageUrl)
    await harness.assertClean()
  })
}

test("rejects link schemes outside HTTP, HTTPS, and mailto", async ({ page }) => {
  const harness = await openIssueWebview(page, "")
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await editor.pressSequentially("Unsafe link")
  await selectAll(editor)
  await page.getByRole("button", { name: "Link", exact: true }).click()
  await page.getByPlaceholder("Paste a link...").fill("command:workbench.action.closeWindow")

  await expect(page.getByRole("alert")).toHaveText("Use an http, https, or mailto URL.")
  await expect(page.getByTitle("Apply link")).toBeDisabled()
  await expect(editor.locator("a")).toHaveCount(0)
  await harness.assertClean()
})

test("uses, edits, deletes, and recreates paragraph breaks", async ({ page }) => {
  const initial = "Original first paragraph.\n\nOriginal second paragraph."
  const edited = "Original first paragraph.\n\nOriginal second paragraph. edited."
  const recreated = "Recreated first paragraph.\n\nRecreated second paragraph."
  const harness = await openIssueWebview(page, initial)
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await expect(editor.locator("p")).toHaveCount(2)

  await editor.locator("p").last().click()
  await page.keyboard.press("End")
  await page.keyboard.type(" edited.")
  let updateCount = await expectSavedDescription(page, 0, edited)

  updateCount = await deleteDocument(page, editor, updateCount)

  await editor.pressSequentially("Recreated first paragraph.")
  await editor.press("Enter")
  await editor.pressSequentially("Recreated second paragraph.")
  await expectSavedDescription(page, updateCount, recreated)
  await expect(editor.locator("p")).toHaveCount(2)
  await harness.assertClean()
})

test("preserves a soft break while editing", async ({ page }) => {
  const initial = "Original first soft line.\nOriginal second soft line."
  const edited = "Original first soft line.\nO editedriginal second soft line."
  const harness = await openIssueWebview(page, initial)
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await expect(editor.locator("p")).toHaveCount(1)
  await expect(editor.locator("br")).toHaveCount(1)

  await editor.locator("p").click()
  await page.keyboard.press("Home")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.type(" edited")
  await expectSavedDescription(page, 0, edited)
  await expect(editor.locator("br")).toHaveCount(1)
  await harness.assertClean()
})

test("deletes and recreates a Linear soft break", async ({ page }) => {
  const initial = "Original first soft line.\nOriginal second soft line."
  const recreated = "Recreated first soft line.\nRecreated second soft line."
  const harness = await openIssueWebview(page, initial)
  const editor = page.getByRole("textbox", { name: "Issue description" })

  const updateCount = await deleteDocument(page, editor, 0)

  await editor.pressSequentially("Recreated first soft line.")
  await editor.press("Shift+Enter")
  await editor.pressSequentially("Recreated second soft line.")
  await expectSavedDescription(page, updateCount, recreated)
  await expect(editor.locator("p")).toHaveCount(1)
  await expect(editor.locator("br")).toHaveCount(1)
  await harness.assertClean()
})

test("canonicalizes hard-break input throughout its lifecycle", async ({ page }) => {
  const initial = "Original first line.  \nOriginal second line."
  const edited = "Original first line.\nOriginal second line. edited."
  const recreated = "Recreated first line.\nRecreated second line."
  const harness = await openIssueWebview(page, initial)
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await expect(editor.locator("br")).toHaveCount(1)

  await editor.click()
  await page.keyboard.press("Control+End")
  await page.keyboard.type(" edited.")
  let updateCount = await expectSavedDescription(page, 0, edited)

  updateCount = await deleteDocument(page, editor, updateCount)

  await editor.pressSequentially("Recreated first line.")
  await editor.press("Shift+Enter")
  await editor.pressSequentially("Recreated second line.")
  await expectSavedDescription(page, updateCount, recreated)
  await expect(editor.locator("br")).toHaveCount(1)
  await harness.assertClean()
})
