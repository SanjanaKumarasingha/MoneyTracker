import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('redirects a signed-out visitor to the login page', async () => {
  render(<App />);

  expect(
    await screen.findByRole('heading', { name: /welcome back/i }),
  ).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
});
