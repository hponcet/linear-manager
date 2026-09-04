import { forwardRef, useCallback, useEffect, useRef, useState } from "react"
import { Separator } from "src/webviews/components/Editor/components/tiptap-ui-primitive/separator"
import { useComposedRef } from "src/webviews/components/Editor/hooks/use-composed-ref"
import { useMenuNavigation } from "src/webviews/components/Editor/hooks/use-menu-navigation"
import { cn } from "src/webviews/components/Editor/lib/tiptap-utils"

import "src/webviews/components/Editor/components/tiptap-ui-primitive/toolbar/toolbar.scss"

type BaseProps = React.HTMLAttributes<HTMLDivElement>

interface ToolbarProps extends BaseProps {
  variant?: "floating" | "fixed"
}

const useToolbarNavigation = (toolbarRef: React.RefObject<HTMLDivElement | null>) => {
  const [items, setItems] = useState<HTMLElement[]>([])

  const collectItems = useCallback(() => {
    if (!toolbarRef.current) return []
    const items = Array.from(
      toolbarRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [role="button"]:not([disabled]), [tabindex="0"]:not([disabled])',
      ),
      // A dropdown renders its content inside the toolbar so it stays anchored to its trigger.
      // Its entries belong to that menu's own keyboard handling: collecting them here would make
      // the roving-tabindex effect pull focus out of the open menu and close it immediately.
    ).filter((item) => !item.closest('[role="menu"]'))
    items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1
    })
    return items
  }, [toolbarRef])

  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return

    const updateItems = () => setItems(collectItems())

    updateItems()
    const observer = new MutationObserver(updateItems)
    observer.observe(toolbar, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [collectItems, toolbarRef])

  const { selectedIndex, setSelectedIndex } = useMenuNavigation<HTMLElement>({
    containerRef: toolbarRef,
    items,
    orientation: "horizontal",
    onSelect: (el) => el.click(),
    autoSelectFirstItem: false,
    handleTab: false,
  })

  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (!toolbar.contains(target)) return
      target.setAttribute("data-focus-visible", "true")
      const index = items.indexOf(target)
      if (index >= 0) setSelectedIndex(index)
    }

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (toolbar.contains(target)) target.removeAttribute("data-focus-visible")
    }

    toolbar.addEventListener("focus", handleFocus, true)
    toolbar.addEventListener("blur", handleBlur, true)

    return () => {
      toolbar.removeEventListener("focus", handleFocus, true)
      toolbar.removeEventListener("blur", handleBlur, true)
    }
  }, [items, setSelectedIndex, toolbarRef])

  useEffect(() => {
    if (selectedIndex !== undefined && items[selectedIndex]) {
      items.forEach((item, index) => {
        item.tabIndex = index === selectedIndex ? 0 : -1
      })
      // Opening a dropdown re-renders the toolbar, which rebuilds `items` and re-runs this
      // effect. Pulling focus back to the trigger then closes the menu that just took it, so
      // leave focus alone while an open menu owns it.
      if (document.activeElement?.closest('[role="menu"]')) return
      items[selectedIndex].focus()
    }
  }, [selectedIndex, items])
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  ({ children, className, variant = "fixed", ...props }, ref) => {
    const toolbarRef = useRef<HTMLDivElement>(null)
    const composedRef = useComposedRef(toolbarRef, ref)
    useToolbarNavigation(toolbarRef)

    return (
      <div
        ref={composedRef}
        role="toolbar"
        aria-label="Formatting toolbar"
        data-variant={variant}
        className={cn("tiptap-toolbar", className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Toolbar.displayName = "Toolbar"

export const ToolbarGroup = forwardRef<HTMLDivElement, BaseProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} role="group" className={cn("tiptap-toolbar-group", className)} {...props}>
      {children}
    </div>
  ),
)
ToolbarGroup.displayName = "ToolbarGroup"

export const ToolbarSeparator = forwardRef<HTMLDivElement, BaseProps>(({ ...props }, ref) => (
  <Separator ref={ref} orientation="vertical" decorative {...props} />
))
ToolbarSeparator.displayName = "ToolbarSeparator"
