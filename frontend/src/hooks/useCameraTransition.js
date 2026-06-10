import { useState } from "react";

export default function useCameraTransition() {
  const [focused, setFocused] =
    useState(false);

  const activateFocus = () => {
    setFocused(true);
  };

  const resetFocus = () => {
    setFocused(false);
  };

  return {
    focused,
    activateFocus,
    resetFocus,
  };
}