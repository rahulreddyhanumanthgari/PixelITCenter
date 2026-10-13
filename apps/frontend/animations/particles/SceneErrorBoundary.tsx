"use client";

import { Component, type ReactNode } from "react";

/**
 * The 3D scene is decorative. If WebGL fails in any way (no GPU, blocked by
 * policy, context lost during setup), drop the scene and keep the page —
 * without this, the error bubbles up and Next.js replaces the whole page.
 */
export class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("Hero 3D scene disabled:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
