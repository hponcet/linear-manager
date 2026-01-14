import { Plugin } from "prosemirror-state";
import { MenuElement, renderGrouped } from "prosemirror-menu";
import { EditorView } from "prosemirror-view";
/*import { coordsAtPos } from "../utils/position.js"*/

export function selectionMenu(options: {
  content: readonly (readonly MenuElement[])[];
}) {
  return new Plugin({
    view(editorView) {
      return new SelectionMenu(editorView, options);
    },
  });
}

class SelectionMenu {
  editorView: EditorView;
  options: { content: readonly (readonly MenuElement[])[] };
  menu: HTMLDivElement;

  contentUpdate: (state: any) => void;

  constructor(
    editorView: EditorView,
    options: { content: readonly (readonly MenuElement[])[] }
  ) {
    this.editorView = editorView;
    this.options = options;

    this.menu = document.createElement("div");
    this.menu.style.display = "none";
    this.menu.style.position = "absolute";
    this.menu.className = "pm-selectionmenu";

    let { dom, update } = renderGrouped(this.editorView, this.options.content);

    this.contentUpdate = update;
    this.menu.appendChild(dom);

    editorView.dom.parentNode?.appendChild(this.menu);

    this.update(editorView);
  }

  update(view: EditorView) {
    const { state } = view;

    if (!state || state.selection.empty) {
      if (this.menu.style.display !== "none") {
        this.menu.style.display = "none";
      }
      return;
    }

    this.menu.style.display = "block";

    if (!this.menu.offsetParent) {
      if (this.menu.style.display !== "none") {
        this.menu.style.display = "none";
      }
      return;
    }
    // Update the Content state before calculating the position
    this.contentUpdate(this.editorView.state);

    const { from, to } = state.selection;

    try {
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);

      let box = this.menu.getBoundingClientRect();

      let offsetParentBox = this.menu.offsetParent.getBoundingClientRect();
      let left =
        (start.left + end.left) / 2 - box.width / 2 - offsetParentBox.left;

      if (left < 5) {
        left = 5;
      }

      this.menu.style.left = left + "px";
      this.menu.style.top = start.top - offsetParentBox.top - box.height + "px";
    } catch (err) {}
  }

  destroy() {
    if (this.menu) {
      this.menu.remove();
    }
  }
}
