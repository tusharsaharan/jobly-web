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
    // Low score (< 40) - should have lighter green shade
    const { container: lowContainer } = render(<AtsScoreRing score={35} />);
    const lowCircle = lowContainer.querySelector("circle:nth-child(2)") as HTMLElement;
    expect(lowCircle).toBeInTheDocument();
    expect(lowCircle.style.stroke).toBeTruthy();

    // Mid score (>= 40, < 70) - medium green shade
    const { container: midContainer } = render(<AtsScoreRing score={55} />);
    const midCircle = midContainer.querySelector("circle:nth-child(2)") as HTMLElement;
    expect(midCircle).toBeInTheDocument();
    expect(midCircle.style.stroke).toBeTruthy();

    // High score (>= 70) - darker green shade
    const { container: highContainer } = render(<AtsScoreRing score={85} />);
    const highCircle = highContainer.querySelector("circle:nth-child(2)") as HTMLElement;
    expect(highCircle).toBeInTheDocument();
    expect(highCircle.style.stroke).toBeTruthy();

    // Verify shades are distinct (lighter to darker)
    expect(lowCircle.style.stroke).not.toBe(highCircle.style.stroke);
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
