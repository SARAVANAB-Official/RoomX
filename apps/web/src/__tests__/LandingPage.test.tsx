import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LandingPage from "../pages/LandingPage";

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("LandingPage", () => {
  it("renders hero section", () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/Your Room\. Your Browser/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Team\./i)).toBeInTheDocument();
  });

  it("renders feature cards", () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText("Screen Sharing")).toBeInTheDocument();
    expect(screen.getByText("Voice & Video")).toBeInTheDocument();
    expect(screen.getByText("Collaborative Browser")).toBeInTheDocument();
    expect(screen.getByText("Real-time Chat")).toBeInTheDocument();
    expect(screen.getByText("File Sharing")).toBeInTheDocument();
    expect(screen.getByText("Whiteboard")).toBeInTheDocument();
  });

  it("renders CTA buttons", () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getAllByText("Create Room").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Join Room")).toBeInTheDocument();
    expect(screen.getByText("Get Started Free")).toBeInTheDocument();
  });

  it("renders how it works section", () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("Share Link")).toBeInTheDocument();
    expect(screen.getByText("Collaborate")).toBeInTheDocument();
  });

  it("renders feature section heading", () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText("Everything you need")).toBeInTheDocument();
  });

  it("renders footer", () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/RoomX - Collaborative Virtual Rooms/i)).toBeInTheDocument();
  });
});
