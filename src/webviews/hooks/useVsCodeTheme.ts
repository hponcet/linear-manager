import { useEffect, useState } from "react"

export type VsCodeThemeKind = "light" | "dark" | "high-contrast"

export function resolveVsCodeThemeKind(classes: Iterable<string>): VsCodeThemeKind {
  const classList = new Set(classes)

  if (classList.has("vscode-high-contrast")) {
    return "high-contrast"
  }
  if (classList.has("vscode-light")) {
    return "light"
  }
  return "dark"
}

export function getVsCodeThemeKind(): VsCodeThemeKind {
  return resolveVsCodeThemeKind(Array.from(document.body.classList))
}

export function isVsCodeLightTheme(): boolean {
  return getVsCodeThemeKind() === "light"
}

export function useVsCodeTheme(): VsCodeThemeKind {
  const [theme, setTheme] = useState<VsCodeThemeKind>(() => getVsCodeThemeKind())

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getVsCodeThemeKind())
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  return theme
}

export function useRsuiteTheme(): "light" | "dark" {
  const theme = useVsCodeTheme()
  return theme === "light" ? "light" : "dark"
}

export function useEditorThemeClass(): "light" | "dark" {
  const theme = useVsCodeTheme()
  return theme === "light" ? "light" : "dark"
}
