import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '../../../context/ThemeContext';

/**
 * ThemeToggle is not yet mounted anywhere, so the build cannot catch a broken
 * import in it -- which is exactly how it shipped with the wrong relative depth
 * (`../../context` instead of `../../../context`) from Phase 0 until now.
 * This test is what makes the fix verifiable instead of merely plausible.
 */
describe('ThemeToggle', () => {
  it('resolves its ThemeContext import and renders a toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
