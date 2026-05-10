import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { useToast } from "./useToast";

function Consumer() {
  useToast();
  return null;
}

describe("useToast", () => {
  it("throws when used outside ToastProvider", () => {
    expect(() => render(<Consumer />)).toThrow(
      /useToast must be used within ToastProvider/,
    );
  });
});
