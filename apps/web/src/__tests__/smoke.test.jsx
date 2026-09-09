import { render, screen } from '@testing-library/react';
import App from '../App';

// Phase 1 smoke test: the harness works and the app mounts.
// Real coverage arrives with the domain (Phase 2) and the seam (Phase 3).
describe('App', () => {
  it('mounts and renders the landing page at /', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
