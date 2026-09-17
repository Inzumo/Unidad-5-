// La navegación principal vive en sketch.js porque usa applyScene().
// Este archivo agrega soporte para gestos táctiles básicos.

let touchStartX = 0;

document.addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener("touchend", e => {
  const touchEndX = e.changedTouches[0].screenX;
  if (touchEndX < touchStartX - 50) nextSlide();
  if (touchEndX > touchStartX + 50) prevSlide();
});