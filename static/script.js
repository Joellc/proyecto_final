/**
 * Carrusel de imágenes de fondo
 */
 let currentIndex = 0; // Índice de la imagen actual
 const carouselItems = document.querySelectorAll('.carousel-item'); // Selecciona todas las imágenes del carrusel
 
 // Función para mostrar la siguiente imagen
 function showNextImage() {
   // Oculta la imagen actual
   carouselItems[currentIndex].classList.remove('active');
   
   // Calcula el índice de la siguiente imagen
   currentIndex = (currentIndex + 1) % carouselItems.length;
   
   // Muestra la siguiente imagen
   carouselItems[currentIndex].classList.add('active');
 }
 
 // Cambia de imagen cada 5 segundos (5000 milisegundos)
 setInterval(showNextImage, 100000);
 
 /**
  * Ajusta aquí la URL base donde corre tu API de FastAPI.
  * Si usas la configuración por defecto: http://127.0.0.1:8000
  */
 const BASE_URL = "http://127.0.0.1:8000";
 
 // Capturamos los elementos de la sección de resultados:
 window.addEventListener("DOMContentLoaded", () => {
   // Si tu script corre con 'defer', esto podría no ser estrictamente necesario,
   // pero es una buena práctica asegurar que se ejecuta cuando el DOM esté listo.
 });
 
 // Referencias al contenedor de resultados:
 const resultsSection = document.getElementById("results");
 const resultsContent = document.getElementById("resultsContent");
 
/**
 * Muestra los datos en la sección de resultados con un formato amigable.
 */
 function displayResults(data) {
  const resultsContent = document.getElementById("resultsContent");

  // Limpia el contenido anterior
  resultsContent.innerHTML = "";

  // Si no hay datos, muestra un mensaje
  if (!data || (Array.isArray(data) && data.length === 0)) {
    resultsContent.innerHTML = "<p>No se encontraron resultados.</p>";
    resultsSection.classList.remove("hidden");
    return;
  }

  // Si es un mensaje de error, muéstralo
  if (data.error) {
    resultsContent.innerHTML = `<p class="error">${data.error}</p>`;
    resultsSection.classList.remove("hidden");
    return;
  }

  // Si es una respuesta del chatbot
  if (data.respuesta && data.Recomendaciones) {
    const chatbotHTML = `
      <p><strong>${data.respuesta}</strong></p>
      ${data.Recomendaciones.map(rec => `
        <div class="recommendation">
          <h3>${rec.ElectroDomestico}</h3>
          <ul>
            ${Object.entries(rec)
              .filter(([key, value]) => key !== "ID" && key !== "ElectroDomestico" && value)
              .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
              .join("")}
          </ul>
        </div>
      `).join("")}
    `;

    resultsContent.innerHTML = chatbotHTML;
  }
  // Si es una lista de recomendaciones (para otras consultas)
  else if (Array.isArray(data)) {
    const recommendationsHTML = data.map(rec => `
      <div class="recommendation">
        <h3>${rec.ElectroDomestico}</h3>
        <ul>
          ${Object.entries(rec)
            .filter(([key, value]) => key !== "ID" && key !== "ElectroDomestico" && value)
            .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
            .join("")}
        </ul>
      </div>
    `).join("");

    resultsContent.innerHTML = recommendationsHTML;
  }
  // Si es un solo objeto (por ejemplo, búsqueda por ID)
  else {
    const recommendationHTML = `
      <div class="recommendation">
        <h3>${data.ElectroDomestico}</h3>
        <ul>
          ${Object.entries(data)
            .filter(([key, value]) => key !== "ID" && key !== "ElectroDomestico" && value)
            .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
            .join("")}
        </ul>
      </div>
    `;

    resultsContent.innerHTML = recommendationHTML;
  }

  // Muestra la sección de resultados
  resultsSection.classList.remove("hidden");
}
 
 /**
  * 1) Ver todas las recomendaciones -> GET /recommendations
  */
 function fetchAllRecommendations() {
   fetch(`${BASE_URL}/recommendations`)
     .then(resp => {
       if (!resp.ok) {
         throw new Error(`Error HTTP! status: ${resp.status}`);
       }
       return resp.json();
     })
     .then(data => {
       displayResults(data);
     })
     .catch(err => {
       displayResults({ error: err.toString() });
     });
 }
 
 /**
  * 2) Buscar recomendación por ID -> GET /recommendations/{ID}
  */
 function fetchRecommendationById() {
   const idInput = document.getElementById("idInput").value.trim();
   if (!idInput) {
     displayResults({ error: "Ingresa un ID válido" });
     return;
   }
   fetch(`${BASE_URL}/recommendations/${idInput}`)
     .then(resp => {
       if (!resp.ok) {
         throw new Error(`Error HTTP! status: ${resp.status}`);
       }
       return resp.json();
     })
     .then(data => {
       displayResults(data);
     })
     .catch(err => {
       displayResults({ error: err.toString() });
     });
 }
 
 /**
  * 3) Buscar por electrodoméstico -> GET /recommendations/Electro_Domestico/?Electro_Domestico=xxx
  */
 function fetchByElectrodomestico() {
   const electroInput = document.getElementById("electroInput").value.trim();
   if (!electroInput) {
     displayResults({ error: "Ingresa el nombre de un electrodoméstico" });
     return;
   }
   fetch(`${BASE_URL}/recommendations/Electro_Domestico/?Electro_Domestico=${electroInput}`)
     .then(resp => {
       if (!resp.ok) {
         throw new Error(`Error HTTP! status: ${resp.status}`);
       }
       return resp.json();
     })
     .then(data => {
       displayResults(data);
     })
     .catch(err => {
       displayResults({ error: err.toString() });
     });
 }
 
 /**
  * 4) Chatbot -> GET /chatbot?query=XXXX
  */
 function chatbotSearch() {
   const chatbotInput = document.getElementById("chatbotInput").value.trim();
   if (!chatbotInput) {
     displayResults({ error: "Ingresa una pregunta para el chatbot" });
     return;
   }
   fetch(`${BASE_URL}/chatbot?query=${encodeURIComponent(chatbotInput)}`)
     .then(resp => {
       if (!resp.ok) {
         throw new Error(`Error HTTP! status: ${resp.status}`);
       }
       return resp.json();
     })
     .then(data => {
       displayResults(data);
     })
     .catch(err => {
       displayResults({ error: err.toString() });
     });
 }