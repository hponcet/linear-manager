import { expect, test } from "@playwright/test"

import { getIpcRequests, openIssueWebview } from "./support/issueWebview"

const workspace = "https://linear.app/example"
const userId = "11111111-1111-4111-8111-111111111111"
const issueId = "22222222-2222-4222-8222-222222222222"
const projectId = "33333333-3333-4333-8333-333333333333"
const documentId = "44444444-4444-4444-8444-444444444444"
const cycleId = "55555555-5555-4555-8555-555555555555"
const milestoneId = "66666666-6666-4666-8666-666666666666"

const description = [
  `User tag: <user id="${userId}" notify>example.user</user>`,
  "",
  "Plain handle: @example.user",
  "",
  `Issue entity: <issue id="${issueId}" href="${workspace}/issue/EX-538/fixture">EX-538</issue>`,
  "",
  `Project URL: <project id="${projectId}" href="${workspace}/project/design-system-876049">Design System</project>`,
  "",
  `Document URL: <document id="${documentId}" href="${workspace}/document/cahier-baf30e">Cahier de recette</document>`,
  "",
  `Cycle URL shape: [${workspace}/cycle/${cycleId}](<${workspace}/cycle/${cycleId}>)`,
  "",
  `Project milestone URL shape: [${workspace}/project-milestone/${milestoneId}](<${workspace}/project-milestone/${milestoneId}>)`,
  "",
  `View URL shape: [${workspace}/view/fixture-view](<${workspace}/view/fixture-view>)`,
  "",
  `Initiative URL shape: [${workspace}/initiative/fixture-initiative](<${workspace}/initiative/fixture-initiative>)`,
  "",
].join("\n")

const referenceCards = {
  [`cycle:${cycleId}`]: {
    kind: "cycle",
    title: "Cycle 12",
    subtitle: "Desktop",
    rows: [{ label: "Ends", value: "2026-09-30" }],
  },
  [`issue:${issueId}`]: {
    kind: "issue",
    title: "EX-538",
    subtitle: "Linear Markdown acceptance fixture",
    identifier: "EX-538",
    workflowState: {
      id: "state-1",
      name: "Triage",
      color: "#f2994a",
      type: "triage",
      position: 0,
      stateProgress: 0,
      stateTypeLength: 1,
    },
    rows: [
      { label: "Status", value: "Triage" },
      { label: "Priority", value: "No priority" },
    ],
  },
  "user:example.user": {
    kind: "user",
    title: "example.user",
    subtitle: "example.user@example.com",
    rows: [{ label: "Status", value: "Active" }],
  },
}

test("renders every Linear reference as the same chip", async ({ page }) => {
  await openIssueWebview(page, { initialDescription: description, referenceCards })
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await expect(page.getByRole("alert")).toHaveCount(0)

  for (const [kind, count] of [
    ["user", 2],
    ["issue", 1],
    ["project", 1],
    ["document", 1],
    ["cycle", 1],
    ["milestone", 1],
    ["view", 1],
    ["initiative", 1],
  ] as const) {
    await expect(editor.locator(`[data-linear-reference="${kind}"]`)).toHaveCount(count)
  }

  await expect(editor.locator('[data-linear-reference="project"]')).toHaveText("Design System")
  // Linear shows an issue as its state ring, then the identifier, then the title.
  await expect(editor.locator('[data-linear-reference="issue"]')).toContainText("EX-538")
  await expect(editor.locator('[data-linear-reference="issue"]')).toContainText(
    "Linear Markdown acceptance fixture",
  )
  await expect(
    editor.locator('[data-linear-reference="issue"] .linear-reference-identifier'),
  ).toHaveText("EX-538")
  await expect(editor.locator('[data-linear-reference="user"]').nth(1)).toHaveText("@example.user")

  // A reference Linear wrote as a URL only carries its UUID, so the chip resolves the name.
  await expect(editor.locator('[data-linear-reference="cycle"]')).toHaveText("Cycle 12")
  await expect(editor.locator('[data-linear-reference="view"]')).toHaveText("fixture-view")
})

test("opens an issue reference in the extension instead of the browser", async ({ page }) => {
  await openIssueWebview(page, { initialDescription: description, referenceCards })
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await editor.locator('[data-linear-reference="issue"]').click()

  await expect
    .poll(async () => await getIpcRequests(page, "openIssue"))
    .toMatchObject([{ type: "openIssue", issueId }])
  // Neither the editor's delegated link handler nor the webview host may also open it.
  expect(await getIpcRequests(page, "openExternalUrl")).toEqual([])
  expect(await getIpcRequests(page, "openExternal")).toEqual([])
  expect(page.url()).toContain("/e2e/issue")

  // A project has no in-extension view, so it still opens on Linear.
  await editor.locator('[data-linear-reference="project"]').click()
  await expect.poll(async () => (await getIpcRequests(page, "openExternalUrl")).length).toBe(1)
})

test("shows one hover card for an entity mention and for a bare handle", async ({ page }) => {
  await openIssueWebview(page, { initialDescription: description, referenceCards })
  const editor = page.getByRole("textbox", { name: "Issue description" })
  const card = page.getByRole("tooltip")

  await editor.locator('[data-linear-reference="issue"]').hover()
  await expect(card).toContainText("Issue")
  await expect(card).toContainText("Linear Markdown acceptance fixture")
  await expect(card).toContainText("Triage")

  await editor.locator('[data-linear-reference="user"]').nth(1).hover()
  await expect(card).toContainText("example.user@example.com")

  await editor.locator('[data-linear-reference="view"]').hover()
  await expect(card).toContainText("Not available in this workspace.")
})

test("keeps a handle inside a mark as plain text", async ({ page }) => {
  const harness = await openIssueWebview(page, {
    initialDescription: "Bold ping: **@example.user** stays bold.",
  })
  const editor = page.getByRole("textbox", { name: "Issue description" })

  await expect(page.getByRole("alert")).toHaveCount(0)
  await expect(editor.locator("strong")).toHaveText("@example.user")
  await expect(editor.locator('strong [data-linear-reference="user"]')).toHaveCount(1)
  await harness.assertClean()
})
