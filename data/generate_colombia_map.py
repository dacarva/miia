# generate_colombia_map.py
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
from urllib.request import urlopen
import numpy as np

# Paleta de colores especificada
COLOR_PALETTE = ['#6334a4', '#af94ce', '#8c7cae', '#9684ac', '#a474d0', '#dbc8ed', '#c4bcd4']
BACKGROUND_COLOR = '#f9f9f9'

# Mapeo de segmentos de mercado basado en el README
SEGMENT_MAPPING = {
    0: "Mercado Premium - Propiedades de alto valor",
    1: "Nicho Especializado - Oportunidades únicas",
    2: "Nicho Especializado - Oportunidades únicas",
    3: "Mercado Estándar - Propiedades accesibles",
    4: "Segmento Intermedio - Propiedades balanceadas",
    5: "Nicho Especializado - Oportunidades únicas"
}

def load_and_process_data():
    """Cargar y procesar los datos de propiedades"""
    try:
        # Cargar datos
        df = pd.read_csv('json_habi_data/inmobiliario_categorized.csv')

        print(f"Datos cargados: {len(df)} propiedades totales")

        # Filtrar solo propiedades con coordenadas válidas
        df = df.dropna(subset=['lon', 'lat'])
        df = df[(df['lon'] != '') & (df['lat'] != '')]

        # Convertir coordenadas a numérico
        df['lon'] = pd.to_numeric(df['lon'], errors='coerce')
        df['lat'] = pd.to_numeric(df['lat'], errors='coerce')
        df = df.dropna(subset=['lon', 'lat'])

        # Filtrar coordenadas dentro de Colombia aproximadamente
        df = df[(df['lon'] >= -82) & (df['lon'] <= -66) &
                (df['lat'] >= -4) & (df['lat'] <= 13)]

        # Limpiar nombres de ciudades
        df['city_name'] = df['city_name'].str.strip().str.title()

        # Asegurar que cluster sea numérico
        df['cluster'] = pd.to_numeric(df['cluster'], errors='coerce')
        df = df.dropna(subset=['cluster'])
        df['cluster'] = df['cluster'].astype(int)

        # Mapear clusters a descripciones de segmentos para la interfaz
        df['segment_label'] = df['cluster'].map(SEGMENT_MAPPING)

        print(f"Propiedades con coordenadas válidas: {len(df)}")
        print(f"Ciudades únicas: {df['city_name'].nunique()}")
        print(f"Categorías únicas: {df['cluster'].nunique()}")

        return df

    except Exception as e:
        print(f"Error al cargar datos: {e}")
        return None

def get_colombia_geojson():
    """Obtener GeoJSON de Colombia"""
    try:
        # GeoJSON simplificado de Colombia para evitar problemas de conexión
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"name": "Colombia"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-82, -4], [-66, -4], [-66, 13], [-82, 13], [-82, -4]
                        ]]
                    }
                }
            ]
        }
    except Exception as e:
        print(f"Error al crear GeoJSON: {e}")
        # GeoJSON de respaldo mínimo
        return {
            "type": "FeatureCollection",
            "features": []
        }

def create_interactive_map(df, geojson):
    """Crear mapa interactivo de Colombia"""

    # Configurar colores para categorías
    category_colors = {i: COLOR_PALETTE[i % len(COLOR_PALETTE)] for i in range(6)}

    # Crear figura base
    fig = go.Figure()

    # Añadir el mapa de Colombia como fondo
    fig.add_trace(go.Choroplethmapbox(
        geojson=geojson,
        locations=["COL"],
        z=[1],
        colorscale=[[0, 'rgba(0,0,0,0.1)'], [1, 'rgba(0,0,0,0.1)']],
        marker_opacity=0.3,
        marker_line_width=0,
        showscale=False
    ))

    # Añadir marcadores para cada categoría
    for category in sorted(df['cluster'].unique()):
        category_df = df[df['cluster'] == category]
        color = category_colors[category]

        # Texto para hover
        hover_text = []
        for _, row in category_df.iterrows():
            text = f"""
            <b>{row.get('title', 'Sin título')}</b><br>
            📍 {row.get('city_name', 'Desconocida')}<br>
            🏠 {row.get('property_type', 'Desconocido')}<br>
            🛏️ {row.get('rooms', 'N/A')} hab · 🚿 {row.get('bathrooms', 'N/A')} baños<br>
            📏 {row.get('area', 'N/A')} m²<br>
            💰 ${row.get('sale_value', 0):,.0f}<br>
            🏷️ {row.get('segment_label', 'Sin segmento')}
            """
            hover_text.append(text)

        fig.add_trace(go.Scattermapbox(
            lat=category_df['lat'],
            lon=category_df['lon'],
            mode='markers',
            marker=dict(
                size=10,
                color=color,
                opacity=0.8,
                symbol='circle'
            ),
            name=category_df['segment_label'].iloc[0] if not category_df.empty else f'Categoría {category}',
            text=hover_text,
            hoverinfo='text'
        ))

    # Configurar layout del mapa
    fig.update_layout(
        title=dict(
            text='<b>🌎 Mapa de Propiedades Inmobiliarias en Colombia</b><br>'
             '<sub>Distribución geográfica por segmentos de mercado</sub>',
            x=0.5,
            xanchor='center',
            font=dict(size=18, color='#333333')
        ),
        mapbox=dict(
            style="carto-positron",
            zoom=4.5,
            center=dict(lat=4.570868, lon=-74.297333)
        ),
        plot_bgcolor=BACKGROUND_COLOR,
        paper_bgcolor=BACKGROUND_COLOR,
        font=dict(color='#333333'),
        legend=dict(
            title=dict(text="🏷️ Segmentos de Mercado", font=dict(size=10)),
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01,
            bgcolor='rgba(255,255,255,0.9)',
            bordercolor='#cccccc',
            borderwidth=1
        ),
        height=700,
        margin=dict(l=0, r=0, t=100, b=0)
    )

    return fig

def generate_statistics(df):
    """Generar estadísticas detalladas"""
    stats = {
        'total_properties': len(df),
        'unique_cities': df['city_name'].nunique(),
        'unique_categories': df['cluster'].nunique(),
        'segment_distribution': df.groupby('cluster')['segment_label'].first().to_dict(),
        'segment_counts': df['cluster'].value_counts().to_dict(),
        'top_cities': df['city_name'].value_counts().head(10).to_dict(),
        'avg_price_by_segment': df.groupby('cluster')['sale_value'].mean().to_dict()
    }
    return stats

def generate_html_output(fig, df, stats):
    """Generar salida HTML completa con estadísticas"""

    # Crear HTML para estadísticas de segmentos
    stats_html = ""
    for i, (segment_id, segment_name) in enumerate(stats['segment_distribution'].items()):
        count = stats['segment_counts'].get(segment_id, 0)
        avg_price = stats['avg_price_by_segment'].get(segment_id, 0)
        stats_html += f"""
        <div class="stat-card" style="background: linear-gradient(135deg, {COLOR_PALETTE[segment_id % len(COLOR_PALETTE)]}, {COLOR_PALETTE[(segment_id + 2) % len(COLOR_PALETTE)]});">
            <h3>{count}</h3>
            <p>{segment_name.split(' - ')[0]}</p>
            <small>Precio avg: ${avg_price:,.0f}</small>
        </div>
        """

    # Crear HTML para top ciudades (eliminado)
    cities_html = ""

    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mapa de Propiedades - Colombia</title>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <style>
            body {{
                background-color: {BACKGROUND_COLOR};
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                color: #333333;
            }}
            .container {{
                width: 100%;
                margin: 0 auto;
                background: white;
            }}
            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
                padding: 20px;
            }}
            .stat-card {{
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }}
            .stat-card h3 {{
                margin: 0;
                font-size: 24px;
                font-weight: bold;
            }}
            .stat-card p {{
                margin: 5px 0;
                font-size: 14px;
            }}
            .stat-card small {{
                font-size: 12px;
                opacity: 0.9;
            }}
            .map-container {{
                width: 100%;
                height: 700px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="stats-grid">
                <div class="stat-card" style="background: linear-gradient(135deg, {COLOR_PALETTE[0]}, {COLOR_PALETTE[2]});">
                    <h3>{stats['total_properties']:,}</h3>
                    <p>Propiedades mapeadas</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, {COLOR_PALETTE[1]}, {COLOR_PALETTE[3]});">
                    <h3>{stats['unique_cities']}</h3>
                    <p>Ciudades diferentes</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, {COLOR_PALETTE[2]}, {COLOR_PALETTE[4]});">
                    <h3>{stats['unique_categories']}</h3>
                    <p>Segmentos identificados</p>
                </div>
                {stats_html}
            </div>

            <div class="map-container">
                {fig.to_html(include_plotlyjs='cdn', div_id='map', full_html=False)}
            </div>
        </div>
    </body>
    </html>
    """

    return html_content

def main():
    """Función principal"""
    print("🚀 Iniciando generación del mapa de Colombia...")

    print("📊 Cargando y procesando datos...")
    df = load_and_process_data()

    if df is None or len(df) == 0:
        print("❌ No se encontraron datos válidos con coordenadas.")
        return

    print("🗺️ Configurando datos geográficos de Colombia...")
    geojson = get_colombia_geojson()

    print("🎨 Generando mapa interactivo...")
    fig = create_interactive_map(df, geojson)

    print("📈 Calculando estadísticas...")
    stats = generate_statistics(df)

    print("💻 Generando archivo HTML...")
    html_content = generate_html_output(fig, df, stats)

    # Guardar archivo HTML
    with open('colombia_properties_map.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    print("✅ Mapa generado exitosamente: colombia_properties_map.html")
    print(f"📊 Estadísticas finales:")
    print(f"   - Propiedades mapeadas: {stats['total_properties']:,}")
    print(f"   - Ciudades únicas: {stats['unique_cities']}")
    print(f"   - Categorías: {stats['unique_categories']}")

    for segment_id, segment_name in stats['segment_distribution'].items():
        count = stats['segment_counts'].get(segment_id, 0)
        avg_price = stats['avg_price_by_segment'].get(segment_id, 0)
        print(f"   - {segment_name}: {count} propiedades (avg: ${avg_price:,.0f})")

if __name__ == "__main__":
    main()
