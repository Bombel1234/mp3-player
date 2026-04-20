
export default function manifest() {
  return {
    id:'/',
    name: 'Mp3 Player',
    short_name: 'Mp3 Player',
    description: 'Aplikacja dla odtwazania muzyki',
    start_url: '/',
    display: 'standalone',
    background_color: 'rgb(10, 234, 151)',
    theme_color: 'rgb(26, 125, 125)',
    icons: [
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/x-icon',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    screenshots: [
      
    {
      "src": "images/Screenshot_1080x2408.png",
      "type": "image/png",
      "sizes": "1080x2408",
      "form_factor": "wide"
    },
    
  ]
  }
}