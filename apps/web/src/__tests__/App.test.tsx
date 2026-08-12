import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockInitialize = vi.fn();

vi.mock("@/lib/store", () => ({
  useAuthStore: Object.assign(
    vi.fn((selector?: Function) => {
      const state = {
        user: null,
        loading: false,
        signIn: vi.fn(),
        signInAsGuest: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        initialize: mockInitialize,
      };
      return selector ? selector(state) : state;
    }),
    { getState: vi.fn() }
  ),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/ui/Toast", () => ({
  ToastContainer: () => null,
}));

vi.mock("@/pages/LandingPage", () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}));

vi.mock("@/pages/Dashboard", () => ({
  default: () => <div>Dashboard</div>,
}));

vi.mock("@/pages/Settings", () => ({
  default: () => <div>Settings</div>,
}));

vi.mock("@/pages/CreateRoom", () => ({
  default: () => <div>Create Room</div>,
}));

vi.mock("@/pages/JoinRoom", () => ({
  default: () => <div>Join Room</div>,
}));

vi.mock("@/pages/auth/Login", () => ({
  default: () => <div>Login</div>,
}));

vi.mock("@/pages/auth/Register", () => ({
  default: () => <div>Register</div>,
}));

vi.mock("@/pages/NotFound", () => ({
  default: () => <div>Not Found</div>,
}));

import App from "../App";

describe("App Component", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it("renders landing page by default", () => {
    render(<App />);
    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
  });
});
