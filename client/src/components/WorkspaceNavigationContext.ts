import { createContext } from "react";

// Embedded programs may keep their original TopNav when opened independently.
// Inside the computer, one shared navigation owns the program hierarchy.
export const WorkspaceNavigationContext = createContext(false);
