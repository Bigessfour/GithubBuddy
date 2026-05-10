import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommandOutput } from "./CommandOutput";

describe("CommandOutput", () => {
  it("returns null when no output and no error", () => {
    const { container } = render(<CommandOutput output="" success={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders success state with stdout", () => {
    render(<CommandOutput output="ok" success={true} />);
    expect(screen.getByText(/completed successfully/i)).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("renders failure header with stderr", () => {
    render(<CommandOutput output="" error="bad" success={false} />);
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
    expect(screen.getByText("bad")).toBeInTheDocument();
  });

  it("shows recovery steps for known git errors", () => {
    render(
      <CommandOutput
        output=""
        error="fatal: not a git repository (or any of the parent directories): .git"
        success={false}
        exitCode={128}
      />,
    );
    expect(
      screen.getByRole("region", { name: /suggested fixes/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Workspace/i)).toBeInTheDocument();
  });

  it("renders both output and error regions", () => {
    render(<CommandOutput output="out" error="err" success={false} />);
    expect(screen.getByText("out")).toBeInTheDocument();
    expect(screen.getByText("err")).toBeInTheDocument();
  });
});
