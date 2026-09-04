import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Together Forever — PMA 56 Long Course',
    short_name: 'Together Forever',
    description: 'Brotherhood • Est. 1977',
    start_url: '/network',
    display: 'standalone',
    background_color: '#06150d',
    theme_color: '#06150d',
    orientation: 'portrait-primary',
    icons: [
      { src: '/tf-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/tf-icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
