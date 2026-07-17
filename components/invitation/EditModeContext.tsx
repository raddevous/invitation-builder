"use client";

import { createContext, useContext } from "react";
import type { AssetCategory } from "@/lib/types/invitation";

export interface EditField {
  field: string;
  category: AssetCategory | "gallery";
  label: string;
  index?: number;
}

interface EditModeContextValue {
  editMode: boolean;
  invitationId: string;
  openPicker: (editField: EditField) => void;
}

export const EditModeContext = createContext<EditModeContextValue>({
  editMode: false,
  invitationId: "",
  openPicker: () => {},
});

export function useEditMode() {
  return useContext(EditModeContext);
}
