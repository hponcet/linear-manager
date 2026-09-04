import * as assert from "assert"

import { Image } from "@tiptap/extension-image"
import { Markdown, MarkdownManager } from "@tiptap/markdown"
import { StarterKit } from "@tiptap/starter-kit"

import {
  findAudioMarkdown,
  isSupportedAudioUrl,
  parseAudioMarkdown,
} from "../../webviews/components/Editor/markdownPlugins/AudioPlugin/audioMarkdownDetection"
import { LinearAudio } from "../../webviews/components/Editor/markdownPlugins/AudioPlugin/LinearAudio"

suite("audio Markdown", () => {
  test("classifies direct audio and audio data URLs", () => {
    for (const extension of ["mp3", "m4a", "wav", "oga", "flac", "aac"]) {
      assert.strictEqual(
        isSupportedAudioUrl(`https://uploads.linear.app/track.${extension}?token=abc`),
        true,
      )
    }

    assert.strictEqual(isSupportedAudioUrl("data:audio/mpeg;base64,AAAA"), true)
    assert.strictEqual(isSupportedAudioUrl("data:audio/x-wav;base64,AAAA"), true)
    assert.strictEqual(isSupportedAudioUrl("data:image/png;base64,AAAA"), false)
    assert.strictEqual(isSupportedAudioUrl("https://uploads.linear.app/cover.png"), false)
    assert.strictEqual(isSupportedAudioUrl("https://uploads.linear.app/clip.mp4"), false)
    assert.strictEqual(isSupportedAudioUrl("https://uploads.linear.app/ambiguous.ogg"), false)
    assert.strictEqual(isSupportedAudioUrl("https://cdn.example.com/track.mp3"), false)
    assert.strictEqual(isSupportedAudioUrl("file:///tmp/track.mp3"), false)
  })

  test("parses only canonical image syntax for audio URLs", () => {
    assert.deepStrictEqual(parseAudioMarkdown("![Theme](https://uploads.linear.app/theme.mp3)"), {
      raw: "![Theme](https://uploads.linear.app/theme.mp3)",
      src: "https://uploads.linear.app/theme.mp3",
      title: "Theme",
      destinationTitle: null,
    })
    assert.deepStrictEqual(parseAudioMarkdown("![A\\] B](data:audio/aac;base64,AAAA)"), {
      raw: "![A\\] B](data:audio/aac;base64,AAAA)",
      src: "data:audio/aac;base64,AAAA",
      title: "A] B",
      destinationTitle: null,
    })
    assert.deepStrictEqual(
      parseAudioMarkdown('![A \\* song](https://uploads.linear.app/theme.mp3 "T \\_ one")'),
      {
        raw: '![A \\* song](https://uploads.linear.app/theme.mp3 "T \\_ one")',
        src: "https://uploads.linear.app/theme.mp3",
        title: "A * song",
        destinationTitle: "T _ one",
      },
    )
    assert.deepStrictEqual(
      parseAudioMarkdown('![Theme](https://uploads.linear.app/theme.mp3 "Destination title")'),
      {
        raw: '![Theme](https://uploads.linear.app/theme.mp3 "Destination title")',
        src: "https://uploads.linear.app/theme.mp3",
        title: "Theme",
        destinationTitle: "Destination title",
      },
    )
    assert.strictEqual(
      parseAudioMarkdown("![Theme](https://uploads.linear.app/theme.mp3 \"mismatch')"),
      null,
    )
    assert.deepStrictEqual(
      parseAudioMarkdown(
        "![uploaded-tone.mp3](https://uploads.linear.app/workspace/asset-uuid?signature=fixture)",
      ),
      {
        raw: "![uploaded-tone.mp3](https://uploads.linear.app/workspace/asset-uuid?signature=fixture)",
        src: "https://uploads.linear.app/workspace/asset-uuid?signature=fixture",
        title: "uploaded-tone.mp3",
        destinationTitle: null,
      },
    )
    assert.strictEqual(
      parseAudioMarkdown("![uploaded-tone.mp3](https://cdn.example.com/asset-uuid)"),
      null,
    )
    assert.strictEqual(
      parseAudioMarkdown("![uploaded-tone.mp3](https://uploads.linear.app/cover.png)"),
      null,
    )

    assert.strictEqual(parseAudioMarkdown("[Theme](https://uploads.linear.app/theme.mp3)"), null)
    assert.strictEqual(parseAudioMarkdown("![Cover](https://cdn.example.com/cover.png)"), null)
    assert.strictEqual(findAudioMarkdown("Listen ![](https://uploads.linear.app/theme.flac)"), 7)
  })

  test("round-trips audio without stealing ordinary images", () => {
    const manager = new MarkdownManager({
      extensions: [Markdown, StarterKit, Image, LinearAudio],
    })
    const source =
      "![Theme](https://uploads.linear.app/theme.mp3)\n\n![Cover](https://cdn.example.com/cover.png)"
    const document = manager.parse(source)
    const content = JSON.stringify(document)

    assert.match(content, /"type":"audio"/)
    assert.match(content, /"type":"image"/)
    assert.strictEqual(
      manager.serialize(document),
      "![Theme](<https://uploads.linear.app/theme.mp3>)\n\n![Cover](https://cdn.example.com/cover.png)",
    )
  })
})
