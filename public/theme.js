// Aplica el tema antes de pintar para evitar un destello de color.
try {
  var l = localStorage.getItem('essentia:light');
  if (l !== 'on' && l !== 'off') l = matchMedia('(prefers-color-scheme: dark)').matches ? 'off' : 'on';
  document.documentElement.dataset.light = l;
} catch (e) {
  document.documentElement.dataset.light = 'on';
}
