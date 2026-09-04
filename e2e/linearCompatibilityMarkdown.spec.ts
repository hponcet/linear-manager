import { expect, test } from "@playwright/test"

import {
  getDescriptionUpdates,
  openIssueWebview,
  waitForDescriptionUpdate,
} from "./support/issueWebview"

import type { Locator, Page } from "@playwright/test"

const SELECT_ALL = process.platform === "darwin" ? "Meta+A" : "Control+A"

async function pasteMarkdown(editor: Locator, markdown: string): Promise<void> {
  await editor.evaluate((element, value) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData("text/plain", value)
    element.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }),
    )
  }, markdown)
}

async function replaceDescription(editor: Locator, markdown: string): Promise<void> {
  await editor.press(SELECT_ALL)
  await pasteMarkdown(editor, markdown)
}

async function expectSave(page: Page, count: number, markdown: string): Promise<number> {
  const updates = await waitForDescriptionUpdate(page, count)
  expect(updates.at(-1)?.fields.description).toBe(markdown)
  return updates.length
}

for (const opaque of [
  {
    name: "Linear HTML comment",
    initial: "<!-- Solution considered -->",
    edited: "<!-- Solution implemented -->",
    locator: (editor: Locator) => editor.locator('[data-linear-opaque-block="html-comment"]'),
    label: "HTML comment: Solution considered",
  },
  {
    name: "Linear Figma embed",
    initial:
      '<linear-embed node-type="figma">{"href":"https://figma.com/file/one","title":"Original design"}</linear-embed>',
    edited:
      '<linear-embed node-type="figma">{"href":"https://figma.com/file/two","title":"Edited design"}</linear-embed>',
    locator: (editor: Locator) => editor.locator('[data-linear-opaque-block="figma"]'),
    label: "Figma: Original design",
  },
  {
    name: "Linear placeholder file",
    initial:
      '<linear-embed node-type="file">{"uploadState":"finished","href":null,"name":"","size":0,"mimetype":null}</linear-embed>',
    edited:
      '<linear-embed node-type="file">{"uploadState":"finished","href":null,"name":"","size":1,"mimetype":null}</linear-embed>',
    locator: (editor: Locator) => editor.locator('[data-linear-opaque-block="placeholder-file"]'),
    label: "Unavailable Linear file",
  },
  {
    name: "legacy Linear superscript",
    initial: "\\[<sup>Archive one.zip\\]\n\\[</sup>Archive two.zip\\]",
    edited: "\\[<sup>Archive edited.zip\\]\n\\[</sup>Archive two.zip\\]",
    locator: (editor: Locator) => editor.locator('[data-linear-opaque-block="legacy-superscript"]'),
    label: "Legacy superscript: [Archive one.zip]\n[Archive two.zip]",
  },
  {
    name: "canonical legacy Linear superscript",
    initial:
      "[<sup>Archive [one.zip](<http://one.zip>)]\n[</sup>Archive [two.zip](<http://two.zip>)]",
    edited:
      "[<sup>Archive [edited.zip](<http://edited.zip>)]\n[</sup>Archive [two.zip](<http://two.zip>)]",
    locator: (editor: Locator) => editor.locator('[data-linear-opaque-block="legacy-superscript"]'),
    label:
      "Legacy superscript: [Archive [one.zip](<http://one.zip>)]\n[Archive [two.zip](<http://two.zip>)]",
  },
] as const) {
  test(`uses, edits, deletes, and recreates ${opaque.name}`, async ({ page }) => {
    const harness = await openIssueWebview(page, opaque.initial)
    const editor = page.getByRole("textbox", { name: "Issue description" })
    const block = opaque.locator(editor)

    await expect(block).toBeVisible()
    await expect(block).toHaveAttribute("aria-label", opaque.label)
    if (opaque.name === "Linear Figma embed") {
      await expect(block).toHaveAttribute("href", "https://figma.com/file/one")
    }
    if (opaque.name === "legacy Linear superscript") {
      await expect(block.locator("sup")).toHaveText("Archive one.zip]\n[")
    }

    await replaceDescription(editor, opaque.edited)
    let count = await expectSave(page, 0, opaque.edited)

    await editor.press(SELECT_ALL)
    await editor.press("Backspace")
    count = await expectSave(page, count, "")

    await pasteMarkdown(editor, opaque.initial)
    await expectSave(page, count, opaque.initial)
    await expect(opaque.locator(editor)).toBeVisible()

    expect(await getDescriptionUpdates(page)).toHaveLength(3)
    await harness.assertClean()
  })
}

test("edits inline code containing backtick runs without changing its semantics", async ({
  page,
}) => {
  const source = "Run ```` ```powershell ```` now."
  const harness = await openIssueWebview(page, source)
  const editor = page.getByRole("textbox", { name: "Issue description" })
  const code = editor.locator("code")

  await expect(code).toHaveText("```powershell")
  await code.evaluate((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    ;(element.closest('[contenteditable="true"]') as HTMLElement | null)?.focus()
  })
  await page.keyboard.insertText("```` edited")

  const edited = "Run ````` ```powershell```` edited ````` now."
  let count = await expectSave(page, 0, edited)

  await editor.press(SELECT_ALL)
  await editor.press("Backspace")
  count = await expectSave(page, count, "")

  await pasteMarkdown(editor, source)
  await expectSave(page, count, source)
  await expect(editor.locator("code")).toHaveText("```powershell")

  expect(await getDescriptionUpdates(page)).toHaveLength(3)
  await harness.assertClean()
})
