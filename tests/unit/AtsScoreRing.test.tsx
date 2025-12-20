import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AtsScoreRing, AtsBreakdown } from "../../src/components/ui/AtsScoreRing";
import React from "react";

describe("AtsScoreRing", () => {
  it("should render correct score number", () => {
    render(<AtsScoreRing score={85} />);
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("should enforce safe bounds (0 to 100)", () => {
    const { rerender } = render(<AtsScoreRing score={150} />);
    expect(screen.getByText("100")).toBeInTheDocument();

    rerender(<AtsScoreRing score={-10} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should render correct color class based on score value", () => {
    // Red/pink for low score (< 40)
    const { container: lowContainer } = render(<AtsScoreRing score={35} />);
    expect(lowContainer.querySelector("circle.text-\\[\\#a65b75\\]")).toBeInTheDocument();

    // Yellow/brown for mid score (>= 40, < 70)
    const { container: midContainer } = render(<AtsScoreRing score={55} />);
    expect(midContainer.querySelector("circle.text-\\[\\#b48644\\]")).toBeInTheDocument();

    // Green for high score (>= 70)
    const { container: highContainer } = render(<AtsScoreRing score={85} />);
    expect(highContainer.querySelector("circle.text-\\[\\#4f8c78\\]")).toBeInTheDocument();
  });
});

describe("AtsBreakdown", () => {
  it("should return null if breakdown is missing", () => {
    const { container } = render(<AtsBreakdown />);
    expect(container.firstChild).toBeNull();
  });

  it("should render breakdown bars and tips correctly", () => {
    const breakdown = {
      skillMatch: 90,
      experienceRelevance: 80,
    };
    const tips = ["Include more metrics", "Add missing keywords"];

    render(<AtsBreakdown breakdown={breakdown} tips={tips} />);

    expect(screen.getByText("Skill Match")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();

    expect(screen.getByText("Improvement tips:")).toBeInTheDocument();
    expect(screen.getByText("Include more metrics")).toBeInTheDocument();
    expect(screen.getByText("Add missing keywords")).toBeInTheDocument();
  });
});
