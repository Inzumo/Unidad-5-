let textos = {};
let idiomaActual = "es";

async function cargarIdioma(idioma) {
  try {
    const r = await fetch(`${idioma}.json`);
    if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
    
    textos = await r.json();
    idiomaActual = idioma;
    aplicarTextos();
    document.documentElement.lang = idioma;
  } catch (e) {
    console.warn("No se pudo cargar el archivo JSON de idioma:", idioma, e);
  }
}

function aplicarTextos() {
  document.querySelectorAll("[data-clave]").forEach(el => {
    const clave = el.dataset.clave;
    if (textos[clave] !== undefined) {
      el.textContent = textos[clave];
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".selector-idioma button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".selector-idioma button")
        .forEach(b => b.classList.remove("activo"));
      btn.classList.add("activo");
      cargarIdioma(btn.dataset.idioma);
    });
  });

  cargarIdioma("es");
});