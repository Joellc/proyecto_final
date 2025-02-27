from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import pandas as pd
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import wordnet,stopwords
import os
from thefuzz import process, fuzz

nltk.data.path.append('C:/Users/ASUS/anaconda3/Scripts/nltk.exe')

nltk.download('punkt')
nltk.download('wordnet')

# Cargar recomendaciones desde el CSV
def load_recommendations():
    df = pd.read_csv("Sugerencias_Ahorro.csv", encoding="utf-8")[[
        'ID', 'ElectroDomestico', 'Sugerencia_1', 'Sugerencia_2',
        'Sugerencia_3', 'Sugerencia_4', 'Sugerencia_5', 'Sugerencia_6'
    ]]
    df.columns = [
        'ID', 'ElectroDomestico', 'Sugerencia 1', 'Sugerencia 2',
        'Sugerencia 3', 'Sugerencia 4', 'Sugerencia 5', 'Sugerencia 6'
    ]
    return df.fillna('').to_dict(orient='records')

# Obtener sinónimos con WordNet
def get_synonyms(word):
    return {lemma.name().lower() for syn in wordnet.synsets(word) for lemma in syn.lemmas()}

recommendations_list = load_recommendations()
ELECTRODOMESTICOS_CSV = {m['ElectroDomestico'].lower() for m in recommendations_list}

app = FastAPI(
    title="API de Recomendaciones de Ahorro de Energía",
    version="1.0.0",
    description="Explora y filtra recomendaciones de ahorro de energía para diversos electrodomésticos."
)

# Ejemplo de stopwords personalizadas en español:
STOP_ES = set(stopwords.words("spanish"))  # si no se descarga, podrías crear una lista manual
STOP_ES.update(["como", "ahorra", "ahorrar", "con", "la", "el", "los", "las", "un", "una", "que", "para"])

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

# Ruta principal que devuelve la página web
@app.get("/", tags=["Home"])
def home():
    return FileResponse(os.path.join("static", "index.html"))

@app.get("/recommendations", tags=["Recommendations"])
def get_recommendations():
    if not recommendations_list:
        raise HTTPException(status_code=500, detail="No hay datos de Recomendaciones disponibles")
    return recommendations_list

@app.get("/recommendations/{ID}", tags=["Recommendations"])
def get_recommendation(ID: int):
    rec = next((r for r in recommendations_list if r["ID"] == ID), None)
    if rec:
        return rec
    else:
        return {"Detalle": "Recomendación no encontrada"}

@app.get("/recommendations/Electro_Domestico/", tags=["Recommendations"])
def get_recommendations_by_Electro_Domestico(Electro_Domestico: str):
    return [
        m for m in recommendations_list
        if Electro_Domestico.lower() in m["ElectroDomestico"].lower()
    ]

@app.get("/chatbot")
def chatbot(query: str):
    """
    Endpoint Chatbot con fuzzy matching:
      1) Tokeniza la frase del usuario.
      2) Elimina stopwords (es, un, el...).
      3) Concatena el resto en un string -> p.e. "lavadora".
      4) fuzzy matching con partial_ratio -> "lavadora" vs "Aire Acondicionado", "Ventilador", "Lavadora", ...
      5) Si la similitud > umbral, retornamos las recomendaciones.
      6) Si no hay coincidencia, mensaje de no encontrado.
    """
    query_tokens = word_tokenize(query.lower())
    
    # Filtramos stopwords para quedarnos con las palabras "relevantes"
    filtered_tokens = [t for t in query_tokens if t not in STOP_ES]
    
    if not filtered_tokens:
        return {
            "respuesta": "No encontré ninguna palabra clave en tu pregunta.",
            "Recomendaciones": []
        }
    
    # Unimos las palabras que quedan
    final_query = " ".join(filtered_tokens)
    
    # fuzzy matching: best_match, score
    best_match, score = process.extractOne(
        final_query,
        ELECTRODOMESTICOS_CSV,       # tu set/list de electrodomésticos en minúsculas
        scorer=fuzz.partial_ratio    # partial_ratio para que sea flexible con frases
    )
    
    # Ajusta el umbral según tu gusto
    if score >= 50:
        # Filtramos el CSV para devolver las recomendaciones de ese electrodoméstico
        results = [
            m for m in recommendations_list
            if m["ElectroDomestico"].lower() == best_match.lower()
        ]
        return {
            "respuesta": f"Aquí tienes recomendaciones específicas para '{best_match}':",
            "Recomendaciones": results
        }
    else:
        return {
            "respuesta": "No encontré ninguna recomendación en esa categoría.",
            "Recomendaciones": []
        }

