import * as fs from "fs/promises"
import * as os from "os"
import * as path from "path"

import { User } from "@linear/sdk"
import { PNG } from "pngjs"
import { ExtensionContext, Uri } from "vscode"

const DEFAULT_BACKGROUND_COLOR = "#5e6ad2"
const UNASSIGNED_BACKGROUND_COLOR = "#6b7280"
export const UNASSIGNED_ASSIGNEE_ID = "__unassigned__"
const ICON_CANVAS_SIZE = 22
const AVATAR_SIZE = 18
const FONT_WIDTH = 5
const FONT_HEIGHT = 7
const GLYPH_SCALE = 1
const GLYPH_GAP = 1
const GLYPH_X_OFFSET = 1

export type AssigneeIconInfo = {
  initials?: string | null
  avatarBackgroundColor?: string | null
}

type Rgb = { r: number; g: number; b: number }

const FONT_5X7: Record<string, number[]> = {
  "?": [0x0e, 0x11, 0x02, 0x04, 0x04, 0x00, 0x04],
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1f, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x1f],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0e],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x11, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
}

export function deriveUserInitials(
  user: Pick<User, "initials" | "displayName" | "name">,
): string | undefined {
  const fromInitials = user.initials?.trim()
  if (fromInitials) {
    return fromInitials
  }

  const label = (user.displayName || user.name || "").trim()
  if (!label) {
    return undefined
  }

  const parts = label.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
  }

  return label.slice(0, 2).toUpperCase()
}

export function resolveAssigneeIconInfo(
  info?: AssigneeIconInfo | null,
): AssigneeIconInfo | undefined {
  if (!info) {
    return undefined
  }

  const initials = info.initials?.trim()
  if (!initials) {
    return undefined
  }

  return {
    initials,
    avatarBackgroundColor: info.avatarBackgroundColor?.trim() || DEFAULT_BACKGROUND_COLOR,
  }
}

export function parseHexColor(color: string): Rgb {
  const normalized = color.trim()
  if (!normalized.startsWith("#")) {
    return { r: 94, g: 106, b: 210 }
  }

  const hex = normalized.slice(1)
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    }
  }

  if (hex.length >= 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    }
  }

  return { r: 94, g: 106, b: 210 }
}

function setPixel(png: PNG, x: number, y: number, color: Rgb, alpha = 255) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
    return
  }

  const idx = (png.width * y + x) << 2
  png.data[idx] = color.r
  png.data[idx + 1] = color.g
  png.data[idx + 2] = color.b
  png.data[idx + 3] = alpha
}

function drawFilledCircle(png: PNG, center: number, radius: number, color: Rgb) {
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const dx = x - center + 0.5
      const dy = y - center + 0.5
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(png, x, y, color)
      }
    }
  }
}

function getGlyph(char: string): number[] {
  return FONT_5X7[char.toUpperCase()] ?? FONT_5X7["?"]
}

function drawGlyph(
  png: PNG,
  startX: number,
  startY: number,
  glyph: number[],
  scale: number,
  color: Rgb,
) {
  for (let row = 0; row < FONT_HEIGHT; row++) {
    const bits = glyph[row]
    for (let col = 0; col < FONT_WIDTH; col++) {
      if (bits & (1 << (FONT_WIDTH - 1 - col))) {
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            setPixel(png, startX + col * scale + sx, startY + row * scale + sy, color)
          }
        }
      }
    }
  }
}

function drawInitials(
  png: PNG,
  initials: string,
  color: Rgb,
  boundsSize: number,
  boundsOrigin: number,
) {
  const chars = initials.slice(0, 2).toUpperCase().split("")
  const glyphWidth = FONT_WIDTH * GLYPH_SCALE
  const glyphHeight = FONT_HEIGHT * GLYPH_SCALE
  const totalWidth = chars.length * glyphWidth + (chars.length - 1) * GLYPH_GAP
  const startX = boundsOrigin + Math.floor((boundsSize - totalWidth) / 2) + GLYPH_X_OFFSET
  const startY = boundsOrigin + Math.floor((boundsSize - glyphHeight) / 2)

  chars.forEach((char, index) => {
    drawGlyph(
      png,
      startX + index * (glyphWidth + GLYPH_GAP),
      startY,
      getGlyph(char),
      GLYPH_SCALE,
      color,
    )
  })
}

export function buildUserAvatarPng(initials: string, backgroundColor: string): Buffer {
  const png = new PNG({ width: ICON_CANVAS_SIZE, height: ICON_CANVAS_SIZE })
  const background = parseHexColor(backgroundColor)
  const textColor = { r: 255, g: 255, b: 255 }
  const avatarOrigin = (ICON_CANVAS_SIZE - AVATAR_SIZE) / 2
  const avatarCenter = avatarOrigin + AVATAR_SIZE / 2

  drawFilledCircle(png, avatarCenter, AVATAR_SIZE / 2, background)
  drawInitials(png, initials, textColor, AVATAR_SIZE, avatarOrigin)

  return PNG.sync.write(png)
}

export async function writeUserAvatarIcon(
  cacheDir: string,
  userId: string,
  info: AssigneeIconInfo,
): Promise<Uri | undefined> {
  const iconInfo = resolveAssigneeIconInfo(info)
  if (!iconInfo) {
    return undefined
  }

  const png = buildUserAvatarPng(iconInfo.initials!, iconInfo.avatarBackgroundColor!)
  const filePath = path.join(cacheDir, `${userId}.png`)
  await fs.writeFile(filePath, png)
  return Uri.file(filePath)
}

export async function buildUserAvatarIconCache(
  cacheDir: string,
  users: User[],
): Promise<Map<string, Uri>> {
  await fs.mkdir(cacheDir, { recursive: true })

  const iconByUserId = new Map<string, Uri>()

  for (const user of users) {
    const iconUri = await writeUserAvatarIcon(cacheDir, user.id, {
      initials: deriveUserInitials(user),
      avatarBackgroundColor: user.avatarBackgroundColor,
    })

    if (iconUri) {
      iconByUserId.set(user.id, iconUri)
    }
  }

  const unassignedIconUri = await writeUserAvatarIcon(cacheDir, UNASSIGNED_ASSIGNEE_ID, {
    initials: "?",
    avatarBackgroundColor: UNASSIGNED_BACKGROUND_COLOR,
  })
  if (unassignedIconUri) {
    iconByUserId.set(UNASSIGNED_ASSIGNEE_ID, unassignedIconUri)
  }

  return iconByUserId
}

export async function buildUserAvatarIconCacheForContext(
  context: ExtensionContext,
  users: User[],
): Promise<Map<string, Uri>> {
  const cacheDir = path.join(context.globalStorageUri.fsPath, "user-avatar-icons")
  return buildUserAvatarIconCache(cacheDir, users)
}

export async function buildUserAvatarIconCacheInTemp(users: User[]): Promise<Map<string, Uri>> {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), "linear-manager-avatar-icons-"))
  return buildUserAvatarIconCache(cacheDir, users)
}
