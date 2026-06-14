import * as assert from "assert"
import * as fs from "fs/promises"

import {
  buildUserAvatarIconCacheInTemp,
  buildUserAvatarPng,
  deriveUserInitials,
  parseHexColor,
  resolveAssigneeIconInfo,
  UNASSIGNED_ASSIGNEE_ID,
} from "../../utils/userAvatarIcon"

suite("userAvatarIcon", () => {
  test("buildUserAvatarPng returns a valid PNG buffer", () => {
    const png = buildUserAvatarPng("HP", "#ff0000")

    assert.deepStrictEqual(
      [...png.subarray(0, 8)],
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    )
  })

  test("buildUserAvatarIconCache writes PNG files to disk", async () => {
    const iconByUserId = await buildUserAvatarIconCacheInTemp([
      {
        id: "user-1",
        initials: "HP",
        avatarBackgroundColor: "#ff0000",
      } as never,
    ])

    const iconUri = iconByUserId.get("user-1")
    assert.ok(iconUri)
    assert.strictEqual(iconUri?.scheme, "file")

    const fileContents = await fs.readFile(iconUri!.fsPath)
    assert.deepStrictEqual(
      [...fileContents.subarray(0, 8)],
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    )

    assert.ok(iconByUserId.has(UNASSIGNED_ASSIGNEE_ID))
  })

  test("deriveUserInitials falls back to display name", () => {
    assert.strictEqual(
      deriveUserInitials({
        initials: null,
        displayName: "Hugues Poncet",
        name: "Hugues Poncet",
      } as never),
      "HP",
    )
  })

  test("parseHexColor supports short and long hex values", () => {
    assert.deepStrictEqual(parseHexColor("#f00"), { r: 255, g: 0, b: 0 })
    assert.deepStrictEqual(parseHexColor("#ff0000"), { r: 255, g: 0, b: 0 })
  })

  test("resolveAssigneeIconInfo returns defaults for missing background color", () => {
    const iconInfo = resolveAssigneeIconInfo({ initials: "ab" })

    assert.deepStrictEqual(iconInfo, {
      initials: "ab",
      avatarBackgroundColor: "#5e6ad2",
    })
  })

  test("resolveAssigneeIconInfo returns undefined when initials are missing", () => {
    assert.strictEqual(resolveAssigneeIconInfo(undefined), undefined)
    assert.strictEqual(resolveAssigneeIconInfo({ initials: "  " }), undefined)
  })
})
