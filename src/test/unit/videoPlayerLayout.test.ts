import * as assert from "assert"

import { scaleVideoDimensions } from "../../webviews/components/Editor/markdownPlugins/VideosPlugin/videoPlayerLayout"

suite("scaleVideoDimensions", () => {
  test("keeps natural dimensions when video fits the container", () => {
    assert.deepStrictEqual(scaleVideoDimensions(640, 360, 800), { width: 640, height: 360 })
  })

  test("scales down wide videos to the container width", () => {
    assert.deepStrictEqual(scaleVideoDimensions(1920, 1080, 960), { width: 960, height: 540 })
  })
})
