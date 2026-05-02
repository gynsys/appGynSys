
import React from 'react';

export const SVGIcons = {
  arrow: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/>
    </svg>
  ),
  arrowLeft: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M7.99 11H20v2H7.99v3L4 12l3.99-4z"/>
    </svg>
  ),
  arrowUp: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M13 7.99V20h-2V7.99H8L12 4l4 3.99z"/>
    </svg>
  ),
  arrowDown: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M11 16.01V4h2v12.01h3L12 20l-4-3.99z"/>
    </svg>
  ),
  star: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  ),
  heart: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  bubble: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  ),
  bulletCheck: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  ),
  stetho: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm8-10h-2c0-4.4-3.6-8-8-8s-8 3.6-8 8H2c0 5.5 4.5 10 10 10s10-4.5 10-10z"/>
    </svg>
  ),
  dna: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M18.8 15.6c-.6-.6-1.5-.6-2.1 0l-1.1 1.1-1.1-1.1c-.6-.6-1.5-.6-2.1 0s-.6 1.5 0 2.1l1.1 1.1-1.1 1.1c-.6.6-.6 1.5 0 2.1.3.3.7.4 1.1.4s.8-.1 1.1-.4l1.1-1.1 1.1 1.1c.3.3.7.4 1.1.4s.8-.1 1.1-.4c.6-.6.6-1.5 0-2.1l-1.1-1.1 1.1-1.1c.5-.6.5-1.5-.1-2.1zM5.2 8.4c.6.6 1.5.6 2.1 0l1.1-1.1 1.1 1.1c.6.6 1.5.6 2.1 0s.6-1.5 0-2.1l-1.1-1.1 1.1-1.1c.6-.6.6-1.5 0-2.1-.3-.3-.7-.4-1.1-.4s-.8.1-1.1.4l-1.1 1.1-1.1-1.1c-.3-.3-.7-.4-1.1-.4s-.8.1-1.1.4c-.6.6-.6 1.5 0 2.1l1.1 1.1-1.1 1.1c-.6.6-.6 1.5 0 2.1z"/>
    </svg>
  ),
  utero: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8 0-1.5.4-2.8 1.1-4 .6 1.1 1.6 2 2.9 2.6-.1.5-.2 1.1-.2 1.6 0 2.2 1.8 4 4 4s4-1.8 4-4c0-.5-.1-1.1-.2-1.6 1.3-.6 2.3-1.5 2.9-2.6.7 1.2 1.1 2.5 1.1 4 0 4.4-3.6 8-8 8z"/>
    </svg>
  ),
  blob1: (props) => (
    <svg viewBox="0 0 200 200" {...props}>
      <path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87.1,-15.7,85.2,-0.9C83.3,13.8,76.1,27.7,67.6,40.1C59.1,52.5,49.3,63.5,37.3,71.1C25.3,78.7,11.1,82.9,-3.4,88.7C-17.9,94.5,-32.7,101.9,-45.3,97.7C-57.9,93.5,-68.3,77.7,-76.1,62.3C-83.9,46.9,-89.1,31.9,-90.1,16.8C-91.1,1.7,-87.9,-13.5,-82,-27.1C-76.1,-40.7,-67.5,-52.7,-56.3,-62C-45.1,-71.3,-31.3,-77.9,-17.1,-80.9C-2.9,-83.9,11.7,-83.3,44.7,-76.4Z" transform="translate(100 100)" />
    </svg>
  ),
  sparkle: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 2l2.4 7.2L22 11.6l-7.6 2.4L12 22l-2.4-7.6L2 11.6l7.6-2.4L12 2z"/>
    </svg>
  ),
};

export const SHAPES_CONFIG = [
  { id: 'circle', label: 'Círculo', icon: <div className="w-8 h-8 rounded-full bg-current"/> },
  { id: 'square', label: 'Rectángulo', icon: <div className="w-8 h-8 bg-current"/> },
  { id: 'roundedSquare', label: 'R. Redon.', icon: <div className="w-8 h-8 bg-current rounded-[20%]"/> },
  { id: 'arrow', label: 'Flecha Der', icon: <SVGIcons.arrow className="w-10 h-10" /> },
  { id: 'arrowLeft', label: 'Flecha Izq', icon: <SVGIcons.arrowLeft className="w-10 h-10" /> },
  { id: 'arrowUp', label: 'Flecha Arr', icon: <SVGIcons.arrowUp className="w-10 h-10" /> },
  { id: 'arrowDown', label: 'Flecha Aba', icon: <SVGIcons.arrowDown className="w-10 h-10" /> },
  { id: 'star', label: 'Estrella', icon: <SVGIcons.star className="w-10 h-10" /> },
  { id: 'heart', label: 'Corazón', icon: <SVGIcons.heart className="w-10 h-10" /> },
  { id: 'bubble', label: 'Burbuja', icon: <SVGIcons.bubble className="w-10 h-10" /> },
  { id: 'line', label: 'Línea', icon: <div className="w-10 h-1 bg-current rounded-full" /> },
  { id: 'bullet', label: 'Viñeta', icon: <div className="w-4 h-4 rounded-full bg-current" /> },
  { id: 'bulletCheck', label: 'Viñeta Check', icon: <SVGIcons.bulletCheck className="w-8 h-8" /> },
  { id: 'stetho', label: 'Estetoscopio', icon: <SVGIcons.stetho className="w-8 h-8" /> },
  { id: 'dna', label: 'ADN', icon: <SVGIcons.dna className="w-8 h-8" /> },
  { id: 'utero', label: 'Útero', icon: <SVGIcons.utero className="w-8 h-8" /> },
  { id: 'blob1', label: 'Mancha Orgánica', icon: <SVGIcons.blob1 className="w-8 h-8 bg-current rounded-full opacity-50" style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }} /> },
  { id: 'sparkle', label: 'Destello', icon: <SVGIcons.sparkle className="w-8 h-8" /> }
];
