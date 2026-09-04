import { Extension } from "@tiptap/core"

import { getCanonicalPrivateLinearAssetUrl } from "./privateLinearImageUrl"

import { parseLinearEmbedJson } from "../markdownEscaping"

import type { MarkdownToken } from "@tiptap/core"

export type LinearMediaEmbedType = "audio" | "video"

export type LinearMediaEmbedAttributes = {
  uploadState: string
  src: string
  title: string
  size: number | null
  mimetype: string | null
  controls: boolean
  height?: number | null
  width?: number | null
}

export type ParsedLinearMediaEmbed = LinearMediaEmbedAttributes & {
  raw: string
  nodeType: LinearMediaEmbedType
}

const linearMediaEmbedPattern =
  /^<linear-embed node-type="(audio|video)">([^\r\n]*)<\/linear-embed>(?:\r?\n|$)/
const mimeTypePattern = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i
const uploadStatePattern = /^[a-z][a-z0-9_-]*$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeOptionalDimension(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined
}

export function normalizeLinearMediaEmbedAttributes(
  nodeType: LinearMediaEmbedType,
  value: unknown,
): LinearMediaEmbedAttributes | null {
  if (!isRecord(value)) return null

  const src = typeof value.src === "string" ? getCanonicalPrivateLinearAssetUrl(value.src) : null
  const size = value.size === null ? null : value.size
  const mimetype = value.mimetype === null ? null : value.mimetype
  const height = normalizeOptionalDimension(value.height)
  const width = normalizeOptionalDimension(value.width)
  const title = value.title === null ? "" : value.title

  if (
    typeof value.uploadState !== "string" ||
    !uploadStatePattern.test(value.uploadState) ||
    !src ||
    typeof title !== "string" ||
    (size !== null && (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0)) ||
    (mimetype !== null && (typeof mimetype !== "string" || !mimeTypePattern.test(mimetype))) ||
    typeof value.controls !== "boolean" ||
    (nodeType === "video" &&
      ((value.height !== undefined && height === undefined) ||
        (value.width !== undefined && width === undefined)))
  ) {
    return null
  }

  return {
    uploadState: value.uploadState,
    src,
    title,
    size,
    mimetype,
    controls: value.controls,
    ...(nodeType === "video" ? { height: height ?? null, width: width ?? null } : {}),
  }
}

export function parseLinearMediaEmbed(source: string): ParsedLinearMediaEmbed | null {
  const match = linearMediaEmbedPattern.exec(source)
  if (!match) return null

  let payload: unknown
  try {
    payload = parseLinearEmbedJson(match[2])
  } catch {
    return null
  }

  const nodeType = match[1] as LinearMediaEmbedType
  const attributes = normalizeLinearMediaEmbedAttributes(nodeType, payload)
  return attributes ? { raw: match[0], nodeType, ...attributes } : null
}

export function findLinearMediaEmbed(source: string): number {
  return source.search(/^<linear-embed node-type="(?:audio|video)">/m)
}

export function serializeLinearMediaEmbed(
  nodeType: LinearMediaEmbedType,
  value: unknown,
): string | null {
  const attributes = normalizeLinearMediaEmbedAttributes(nodeType, value)
  if (!attributes) return null

  return `<linear-embed node-type="${nodeType}">${JSON.stringify({
    uploadState: attributes.uploadState,
    uploadId: null,
    src: attributes.src,
    title: attributes.title || null,
    size: attributes.size,
    mimetype: attributes.mimetype,
    controls: attributes.controls,
    ...(nodeType === "video"
      ? { height: attributes.height ?? null, width: attributes.width ?? null, metadataId: null }
      : {}),
  })}</linear-embed>`
}

export const LinearMediaEmbedTokenizer = Extension.create({
  name: "linearMediaEmbedTokenizer",

  markdownTokenizer: {
    name: "linearMediaEmbed",
    level: "block",
    start: findLinearMediaEmbed,
    tokenize(source): MarkdownToken | undefined {
      const media = parseLinearMediaEmbed(source)
      return media
        ? {
            type: media.nodeType,
            ...media,
            syntax: "linearEmbed",
          }
        : undefined
    },
  },
})
