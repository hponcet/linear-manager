import { expect, test } from "@playwright/test"

import {
  getDescriptionUpdates,
  openIssueWebview,
  waitForDescriptionUpdate,
} from "./support/issueWebview"

test("renders, edits, deletes, and recreates a paragraph", async ({ page }) => {
  const initial = "Original paragraph."
  const edited = `${initial} Edited.`
  const recreated = "Recreated paragraph."
  const harness = await openIssueWebview(page, initial)
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await expect(editor).toHaveText(initial)

  await editor.press("End")
  await editor.pressSequentially(" Edited.")
  let updates = await waitForDescriptionUpdate(page, 0)
  expect(updates.at(-1)?.fields.description).toBe(edited)
  await expect(editor).toHaveText(edited)

  await editor.press(process.platform === "darwin" ? "Meta+A" : "Control+A")
  await editor.press("Backspace")
  updates = await waitForDescriptionUpdate(page, updates.length)
  expect(updates.at(-1)?.fields.description).toBe("")
  await expect(editor).toHaveText("")

  await editor.pressSequentially(recreated)
  updates = await waitForDescriptionUpdate(page, updates.length)
  expect(updates.at(-1)?.fields.description).toBe(recreated)
  await expect(editor).toHaveText(recreated)

  expect(await getDescriptionUpdates(page)).toHaveLength(3)
  await harness.assertClean()
})
