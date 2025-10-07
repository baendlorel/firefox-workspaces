Firefox Workspaces — Summary

Firefox Workspaces organizes browser tabs into named "workspaces" so users can save, restore, and switch between groups of tabs. The extension models the Workspace concept found in Microsoft Edge and is focused on making tab grouping and session recovery simple and reliable.

Key features

- Workspaces as tab collections: each workspace stores a set of tabs with their URL, title, and pinned state.
- Create and remove workspaces: users can name workspaces and assign a color for easy identification.
- Create from current window: create a new workspace from all tabs in the current browser window with one action.
- Move tabs between workspaces: drag-and-drop support to move tabs or remove them from a workspace.
- Pinned tab handling: preserve pinned tabs when opening or restoring a workspace.
- Open workspace in a new window: restore the full set of tabs (pinned and unpinned) in a new browser window and maintain an association between that window and the workspace.
- Automatic save and restore: when a workspace-associated window closes, the extension records the current tabs (including pinned state) so the workspace can be restored later.
- Import / Export: JSON import and export of workspaces for backup or migration.
- User interface: a popup UI for workspace management and quick actions; content scripts are used only when necessary (for example file selection during import).

Permissions and rationale (for reviewers)

- tabs: required to read and manipulate browser tabs (open, move, query tab info).
- sessions: used to store and recover window/tab state when a workspace window closes.
- activeTab & scripting: used to inject a small content script when needed (for import flow) and to access the active tab temporarily.
- storage: persist workspaces and settings locally.
- notifications: show user-facing notifications for important events such as import results.

This summary is intended for inclusion with the source archive for reviewers, so they can quickly understand the extension’s purpose, main features, and why each permission is requested.
