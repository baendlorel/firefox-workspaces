Usage guide (based on the main view)

This guide describes the popup UI and common user actions. The popup UI is implemented under `src/web` and consists of a header, workspace list, editor dialog, and footer version info.

Header

- Title: shows the name of the workspace associated with the current window (if any).
- Sync icon: indicates sync/status information (for example last sync or sync state).
- Create button (+): opens a create menu with two options:
  - "Save tabs to a workspace" (Create with current tabs): collect all tabs in the current browser window and open the editor dialog prefilled with those tabs.
  - "Create workspace": open an empty editor dialog to create a workspace manually.
- More button: opens a menu with Import, Export, Settings, Donate and About actions.

Workspace list

- Displays saved workspaces. Each item shows a color marker, name, and tab count.
- Click an item: opens the workspace (restores its tabs in a new browser window).
- Edit button (three dots): opens the edit dialog (change name, color, delete) without triggering the open action.
- Scroll controls appear when the list is long; holding the scroll buttons scrolls continuously.

Editor dialog (Create / Edit workspace)

- Fields:
  - Name (required)
  - Color (hex, #RRGGBB; a color picker is provided)
  - Tabs (if created from current window, the dialog pre-fills the tab list)
- Actions: Save, Cancel, Delete (Delete appears only when editing an existing workspace and requires confirmation).
- Save behavior:
  - Creating a workspace: saves the new workspace and, if tabs were provided, opens it immediately.
  - Editing: updates the workspace and persists changes.

Opening workspaces and window association

- Opening a workspace restores its tabs (pinned and unpinned) in a new window and preserves pinned status.
- The extension tries to associate the created window with the workspace so that when the window closes the current tab set can be saved back to the workspace. Re-opening an already-associated workspace will focus the existing window instead of creating a new one.

Import / Export

- Export: use More -> Export to export workspaces and settings to a JSON file for backup.
- Import: use More -> Import to load a JSON file. The import process validates and merges data (workspaces are typically added, settings may be overwritten depending on the import logic).

Settings & About

- Settings opens a dialog to change extension options (for example sync interval).
- About opens a page showing version, author, and repository link.

Empty state

- When no workspace exists the popup shows an empty state with guidance to create the first workspace.

Notes

- Popup behavior: because opening a new window causes the popup to lose focus and be destroyed, some interactions won’t continue after a new window is opened; the popup must be reopened for further actions.
- Permissions: the extension uses `tabs`, `sessions`, `storage`, `activeTab`/`scripting` (for on-demand content script injection), and `notifications` to support tab management, session persistence, import flows, and user notifications.

Common actions (quick examples)

- Create a workspace with current tabs: Header -> + -> "Save tabs to a workspace" -> confirm name/color -> Save.
- Create an empty workspace: Header -> + -> "Create workspace" -> fill name/color -> Save.
- Open a workspace: click its list item to restore tabs in a new window.
- Edit or delete a workspace: click the three dots on a list item -> edit dialog -> modify or delete.
- Export workspaces: Header -> More -> Export.
- Import workspaces: Header -> More -> Import.

If you want this guide added to `README.md` or appended to `.draft/description.md` for reviewers, I can merge or produce a shorter reviewer note.
