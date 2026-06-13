type GraphQLErrorLike = {
  message?: string
}

type LinearErrorLike = Error & {
  errors?: GraphQLErrorLike[]
  query?: unknown
  status?: number
}

export function formatLinearError(error: unknown): string {
  if (typeof error === "string") {
    return error
  }

  if (error instanceof Error) {
    const linearError = error as LinearErrorLike
    const graphQlMessages = linearError.errors
      ?.map((entry) => entry.message?.trim())
      .filter((message): message is string => !!message)

    if (graphQlMessages?.length) {
      return graphQlMessages.join("\n")
    }

    if (error.message.trim()) {
      return error.message
    }
  }

  return "An unexpected error occurred"
}
