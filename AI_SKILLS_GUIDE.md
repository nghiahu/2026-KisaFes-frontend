# KisaFres Frontend - AI Coding Guidelines & Skills

This document serves as the "Skill" file for AI coding assistants (like Cursor, Copilot, Antigravity) to properly utilize existing resources in the KisaFres frontend codebase, avoiding redundant work and ensuring high performance and UI consistency.

## 1. Tech Stack & Architecture
- **Framework:** React + Vite + TypeScript.
- **Styling:** Tailwind CSS + custom UI components.
- **State Management:** Redux Toolkit (`store/slices/`).
- **API & Networking:** Axios with custom `axiosClient` interceptors (`services/axiosClient.ts`).
- **Icons:** `lucide-react`, centrally exported via `src/assets/icons/index.tsx`.

## 2. Reusable UI Components
Always prioritize using these existing components over building new ones from scratch:
- **Icons (`src/assets/icons/index.tsx`):**
  - Use `import { Icons } from 'src/assets/icons'` instead of importing directly from `lucide-react`.
  - Example: `<Icons.user size={14} className="text-slate-400" />`
- **Modals (`src/components/common/`):**
  - `ConfirmModal.tsx`: Use this for any action that requires confirmation (deleting, starting sprint, etc.).
  - `PermissionDeniedToast.tsx`: Reusable toast for unauthorized actions.
  - `SessionExpiredModal.tsx`: Handles authentication timeouts gracefully.
- **Dropdowns & Selects (`src/components/common/`):**
  - `UserDropdown.tsx`: Standard component for selecting assignees or users.

## 3. State Management (Redux)
- **Store Location:** `src/store/`
- **When to use Redux:** Use Redux for global entities that are accessed across multiple pages (e.g., `userSlice`, `authSlice`, `projectSlice`, `notificationSlice`).
- **When to use Local State:** Use local React state (`useState`) for page-specific UI states (e.g., dropdown visibility, active modal ID, temporary form data).
- **Existing Slices:**
  - `taskSlice.ts`: Contains async thunks for updating tasks (`updateTaskStatus`, `updateTaskAssignee`, `createTask`, etc.). Use these thunks when you need the UI to automatically sync with the global Redux store.

## 4. API Services Layer
- **Location:** `src/services/`
- **Rule:** Never make direct `axios` calls from components. Always use or add methods to the corresponding service file.
- **Key Services:**
  - `task.service.ts`: CRUD operations for tasks.
  - `sprint.service.ts`: Managing sprints and moving tasks between backlogs/sprints (`moveTaskToSprint`, `getSprintTasks`).
  - `project.service.ts`: Fetching and updating project details, members, and statuses.

## 5. UI/UX & Styling Guidelines
- **Color Palette & Theme:** Adhere to the `slate` and `blue` Tailwind palette currently dominant in the app. Use `text-[#3B82F6]` and `bg-[#EEF2FF]` for active/primary states.
- **Click Outside to Close:** Any custom dropdown or inline-form (like task creation) MUST implement a `handleClickOutside` listener to dismiss it when clicking outside the element. Use `useRef` and `useEffect` with `document.addEventListener('mousedown', ...)`.
- **Portals:** Use `createPortal(..., document.body)` for dropdown menus to prevent CSS `overflow: hidden` clipping issues in complex table or board layouts.

## 6. Common Pitfalls & Optimizations
- **Task Creation in Sprints vs Backlog:** When creating a task within a sprint, the backend `createTask` API defaults to creating it in the backlog. Always call `sprintService.moveTaskToSprint(res.id, sprintId)` immediately after creation to correctly assign it to the sprint.
- **Optimistic UI Updates:** For interactions like dragging tasks or changing statuses, immediately update the local state using `setTasks` before waiting for the API response. If the API fails, catch the error and revert the state.

## 7. Component Structure & Code Organization Rule
- **Keep it modular:** If a file exceeds 800 lines (e.g., `ProjectBacklog.tsx`, `ProjectList.tsx`), abstract sub-components (like `SprintSection` or `TaskRow`) rather than bloating the main file.
- **Phân chia code hợp lý (Reasonable Separation):** UI markup, business logic (custom hooks), and data fetching should be separated logically to keep files clean and maintainable.
- **Interfaces & Types:** DO NOT define large TypeScript `interface` or `type` blocks directly inside component files. Write them in separate type declaration files (e.g., `src/types/` or a dedicated `types.ts` next to the component) and import them into the files where they are needed.

## 8. Data & State Management Rules
- **State Cục bộ (Local State):** Use `useState` or `useReducer` strictly for UI state (e.g., modals, form inputs, toggle states, drag-and-drop local positioning). Keep local state as close to the consuming component as possible.
- **Quản lý trong Store (Global State):** Data that is shared across multiple pages or distant components (e.g., user profiles, project configurations) MUST be stored in Redux slices. Ensure to synchronize global state with backend API calls seamlessly.
