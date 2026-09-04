import { expect, test } from "@playwright/test"

import {
  getDescriptionUpdates,
  getIpcRequests,
  openIssueWebview,
  waitForDescriptionUpdate,
} from "./support/issueWebview"

import type { Locator, Page } from "@playwright/test"

const SELECT_ALL = process.platform === "darwin" ? "Meta+A" : "Control+A"
const commandLabels = [
  "Text",
  "Heading 1",
  "Heading 2",
  "Heading 3",
  "Heading 4",
  "Bulleted list",
  "Numbered list",
  "Checklist",
  "Quote",
  "Code block",
  "Diagram",
  "Divider",
  "Table",
  "Collapsible section",
  "Image",
  "Date",
  "File",
] as const

async function openSlashCommand(page: Page, editor: Locator, query: string, label: string) {
  await editor.pressSequentially(`/${query}`)
  const listbox = page.getByRole("listbox", { name: "Editor commands" })
  const option = listbox.getByRole("option", { name: label, exact: true })

  await expect(listbox).toBeVisible()
  await expect(option).toBeVisible()
  await expect(option).toHaveAttribute("aria-selected", "true")

  return { listbox, option }
}

async function expectDescription(page: Page, expected: string) {
  const updates = await waitForDescriptionUpdate(page, 0)
  expect(updates.at(-1)?.fields.description).toBe(expected)
}

const slashCommandCases = [
  { label: "Text", query: "paragraph", text: "Plain text", expected: "Plain text" },
  { label: "Heading 1", query: "h1", text: "First", expected: "# First" },
  { label: "Heading 2", query: "h2", text: "Second", expected: "## Second" },
  { label: "Heading 3", query: "h3", text: "Third", expected: "### Third" },
  { label: "Heading 4", query: "h4", text: "Fourth", expected: "#### Fourth" },
  { label: "Bulleted list", query: "bullet", text: "Bullet", expected: "- Bullet" },
  { label: "Numbered list", query: "number", text: "Number", expected: "1. Number" },
  { label: "Checklist", query: "check", text: "Task", expected: "- [ ] Task" },
  { label: "Quote", query: "quote", text: "Quoted", expected: "> Quoted" },
  {
    label: "Diagram",
    query: "mermaid",
    text: "graph TD\nA-->B",
    expected: "```mermaid\ngraph TD\nA-->B\n```",
  },
] as const

for (const command of slashCommandCases) {
  test(`discovers and activates ${command.label} from the slash menu`, async ({ page }) => {
    const harness = await openIssueWebview(page, "")
    const editor = page.getByRole("textbox", { name: "Issue description" })

    const { listbox } = await openSlashCommand(page, editor, command.query, command.label)
    await editor.press("Enter")
    await expect(listbox).toBeHidden()
    if (command.label === "Diagram") {
      await page.keyboard.insertText("graph TD")
      await page.keyboard.press("Enter")
      await page.keyboard.insertText("A-->B")
    } else {
      await page.keyboard.insertText(command.text)
    }

    await expectDescription(page, command.expected)
    await harness.assertClean()
  })
}

test("exposes accessible slash options and supports ArrowUp, ArrowDown, Enter, and Escape", async ({
  page,
}) => {
  const harness = await openIssueWebview(page, "")
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await editor.pressSequentially("/")
  const listbox = page.getByRole("listbox", { name: "Editor commands" })
  const options = listbox.getByRole("option")
  await expect(options).toHaveCount(10)
  await expect(options).toHaveText(commandLabels.slice(0, 10))
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true")

  await editor.press("ArrowDown")
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true")
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "false")
  await editor.press("ArrowUp")
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true")
  await editor.press("ArrowUp")
  await expect(options.nth(9)).toHaveAttribute("aria-selected", "true")
  await editor.press("Enter")
  await expect(listbox).toBeHidden()
  await page.keyboard.insertText("keyboard")
  await expectDescription(page, "```\nkeyboard\n```")

  await editor.press(SELECT_ALL)
  await editor.press("Backspace")
  await editor.pressSequentially("/")
  await expect(listbox).toBeVisible()
  await editor.press("Escape")
  await expect(listbox).toBeHidden()
  await expect(editor).toHaveText("/")

  await harness.assertClean()
})

const structuralCommandCases = [
  { label: "Divider", query: "divider", expected: "---\n\n" },
  {
    label: "Table",
    query: "grid",
    expected:
      "\n|     |     |     |\n| --- | --- | --- |\n|     |     |     |\n|     |     |     |\n",
  },
  {
    label: "Collapsible section",
    query: "collapsible",
    expected: "+++ Summary\n\nBody\n\n+++",
  },
] as const

for (const command of structuralCommandCases) {
  test(`activates ${command.label} with exact Markdown`, async ({ page }) => {
    const harness = await openIssueWebview(page, "")
    const editor = page.getByRole("textbox", { name: "Issue description" })

    await openSlashCommand(page, editor, command.query, command.label)
    await editor.press("Enter")
    if (command.label === "Collapsible section") {
      await page.keyboard.insertText("Summary")
      await page.getByRole("button", { name: "Expand details" }).click()
      await page.locator('[data-type="detailsContent"] p').click()
      await page.keyboard.insertText("Body")
    }

    await expectDescription(page, command.expected)
    await harness.assertClean()
  })
}

test("activates Image through its upload entry point", async ({ page }) => {
  const harness = await openIssueWebview(page, "")
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await openSlashCommand(page, editor, "picture", "Image")
  await editor.press("Enter")
  await expect(page.getByRole("button", { name: "Upload image" })).toBeVisible()
  expect(await getDescriptionUpdates(page)).toEqual([])

  await harness.assertClean()
})

test("activates Date through its native picker and emits the selected date", async ({ page }) => {
  const harness = await openIssueWebview(page, "")
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await openSlashCommand(page, editor, "calendar", "Date")
  await editor.press("Enter")
  const dateInput = page
    .locator(".simple-editor-wrapper")
    .filter({ has: editor })
    .getByLabel("Choose date")
  await expect(dateInput).toBeFocused()
  await dateInput.fill("2026-09-03", { force: true })
  await dateInput.dispatchEvent("change")
  await expectDescription(page, "2026-09-03")

  await harness.assertClean()
})

test("activates File through the native file chooser", async ({ page }) => {
  const harness = await openIssueWebview(page, "")
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await openSlashCommand(page, editor, "attachment", "File")
  const chooserPromise = page.waitForEvent("filechooser")
  await editor.press("Enter")
  const chooser = await chooserPromise
  expect(chooser.isMultiple()).toBe(false)
  await chooser.setFiles([])
  expect(await getIpcRequests(page, "uploadLinearFile")).toEqual([])

  await harness.assertClean()
})

test("shares every command through the accessible formatting toolbar", async ({ page }) => {
  const harness = await openIssueWebview(page, "# Toolbar title")
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await editor.press(SELECT_ALL)
  const toolbar = page.getByRole("toolbar", { name: "Formatting toolbar" })
  const textStyle = toolbar.getByRole("button", { name: "Format text as heading" })
  const commands = toolbar.getByRole("button", { name: "Editor commands" })
  await expect(toolbar).toBeVisible()

  // The text-style dropdown opens the bar, immediately followed by the mark buttons.
  await textStyle.focus()
  await textStyle.press("ArrowRight")
  await expect(toolbar.getByRole("button", { name: "Bold" })).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(textStyle).toBeFocused()

  // The toolbar's roving selection follows focus, so let it settle on Commands before Enter,
  // otherwise the keypress acts on whichever item the roving state still points at.
  await commands.focus()
  await expect(commands).toBeFocused()
  await commands.press("Enter")

  const menu = page.getByRole("menu")
  for (const label of commandLabels) {
    await expect(menu.getByRole("menuitem", { name: label, exact: true })).toBeVisible()
  }

  await menu.getByRole("menuitem", { name: "Text", exact: true }).click()
  await expectDescription(page, "Toolbar title")
  await harness.assertClean()
})

for (const trigger of ["Format text as heading", "List options", "Editor commands"]) {
  test(`keeps the toolbar and anchors the ${trigger} menu inside the webview`, async ({ page }) => {
    const harness = await openIssueWebview(page, "Anchored menu fixture.")
    const editor = page.getByRole("textbox", { name: "Issue description" })

    await editor.press(SELECT_ALL)
    const toolbar = page.getByRole("toolbar", { name: "Formatting toolbar" })
    const button = toolbar.getByRole("button", { name: trigger })
    await expect(toolbar).toBeVisible()

    const buttonBox = await button.boundingBox()
    await button.click()

    // Opening the menu must not blur the editor into hiding the bar the menu hangs off.
    await expect(toolbar).toBeVisible()

    const menuBox = await page.getByRole("menu").boundingBox()
    const viewport = page.viewportSize()
    expect(buttonBox, "trigger has a box").not.toBeNull()
    expect(menuBox, "menu has a box").not.toBeNull()
    if (!buttonBox || !menuBox || !viewport) return

    // Anchored to its trigger rather than parked in the top-left corner.
    expect(Math.abs(menuBox.x - buttonBox.x)).toBeLessThanOrEqual(8)
    expect(menuBox.y).toBeGreaterThan(buttonBox.y)

    // Fully inside the webview on every edge.
    expect(menuBox.x).toBeGreaterThanOrEqual(0)
    expect(menuBox.y).toBeGreaterThanOrEqual(0)
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width)
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height)

    await page.keyboard.press("Escape")
    await harness.assertClean()
  })
}
