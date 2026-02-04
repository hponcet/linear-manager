import { LinearClient } from "@linear/sdk"
import { useMemo } from "react"

export function useLinearClient(linearAccessToken: string | undefined) {
  return useMemo(
    () =>
      linearAccessToken
        ? new LinearClient({
            accessToken: linearAccessToken,
            headers: {
              "public-file-urls-expire-in": "60",
            },
          })
        : null,
    [linearAccessToken],
  )
}
