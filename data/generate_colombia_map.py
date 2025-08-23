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

        print(f"Propiedades con coordenadas válidas: {len(df)}")
        print(f"Ciudades únicas: {df['city_name'].nunique()}")
        print(f"Clusters únicos: {df['cluster'].nunique()}")

        return df

    except Exception as e:
        print(f"Error al cargar datos: {e}")
        return None

def get_colombia_geojson():
    """Obtener GeoJSON de Colombia"""
    try:
        # URL alternativa del GeoJSON de Colombia
        url = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/colombia/colombia-departments.json"
        with urlopen(url) as response:
            geojson = json.load(response)
            print("GeoJSON de Colombia cargado exitosamente")
            return geojson
    except Exception as e:
        print(f"Error al cargar GeoJSON: {e}")
        # GeoJSON de respaldo simplificado
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

def create_interactive_map(df, geojson):
    """Crear mapa interactivo de Colombia"""

    # Configurar colores para clusters
    cluster_colors = {i: COLOR_PALETTE[i % len(COLOR_PALETTE)] for i in range(6)}

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

    # Añadir marcadores para cada propiedad por cluster
    for cluster in sorted(df['cluster'].unique()):
        cluster_df = df[df['cluster'] == cluster]
        color = cluster_colors[cluster]

        # Crear texto para hover
        hover_text = []
        for _, row in cluster_df.iterrows():
            text = f"""
            <b>{row.get('title', 'Sin título')}</b><br>
            Ciudad: {row.get('city_name', 'Desconocida')}<br>
            Tipo: {row.get('property_type', 'Desconocido')}<br>
            Habitaciones: {row.get('rooms', 'N/A')}<br>
            Baños: {row.get('bathrooms', 'N/A')}<br>
            Área: {row.get('area', 'N/A')} m²<br>
            Precio: ${row.get('sale_value', 0):,.0f}<br>
            Cluster: {row.get('cluster', 'N/A')} - {row.get('category', 'Sin categoría')}
            """
            hover_text.append(text)

        fig.add_trace(go.Scattermapbox(
            lat=cluster_df['lat'],
            lon=cluster_df['lon'],
            mode='markers',
            marker=dict(
                size=10,
                color=color,
                opacity=0.8,
                symbol='circle'
            ),
            name=f'Cluster {cluster}',
            text=hover_text,
            hoverinfo='text'
        ))

    # Configurar layout del mapa
    fig.update_layout(
        title=dict(
            text='<b>Mapa de Propiedades Inmobiliarias en Colombia</b><br>'
                 '<sub>Distribución geográfica por clusters de mercado</sub>',
            x=0.5,
            xanchor='center',
            font=dict(size=16, color='#333333')
        ),
        mapbox=dict(
            style="carto-positron",
            zoom=4,
            center=dict(lat=4.570868, lon=-74.297333)
        ),
        plot_bgcolor=BACKGROUND_COLOR,
        paper_bgcolor=BACKGROUND_COLOR,
        font=dict(color='#333333'),
        legend=dict(
            title=dict(text="Clusters", font=dict(size=12)),
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01,
            bgcolor='rgba(255,255,255,0.9)',
            bordercolor='#cccccc',
            borderwidth=1
        ),
        height=800,
        margin=dict(l=0, r=0, t=100, b=0)
    )

    return fig

def generate_statistics(df):
    """Generar estadísticas detalladas"""
    stats = {
        'total_properties': len(df),
        'unique_cities': df['city_name'].nunique(),
        'unique_clusters': df['cluster'].nunique(),
        'cluster_distribution': df['cluster'].value_counts().to_dict(),
        'top_cities': df['city_name'].value_counts().head(10).to_dict(),
        'avg_price_by_cluster': df.groupby('cluster')['sale_value'].mean().to_dict()
    }
    return stats

def generate_html_output(fig, df, stats):
    """Generar salida HTML completa con estadísticas"""

    # Crear HTML para estadísticas
    stats_html = ""
    for cluster, count in stats['cluster_distribution'].items():
        avg_price = stats['avg_price_by_cluster'].get(cluster, 0)
        stats_html += f"""
        <div class="stat-card" style="background: linear-gradient(135deg, {COLOR_PALETTE[cluster % len(COLOR_PALETTE)]}, {COLOR_PALETTE[(cluster + 2) % len(COLOR_PALETTE)]});">
            <h3>{count}</h3>
            <p>Cluster {cluster}</p>
            <small>Precio avg: ${avg_price:,.0f}</small>
        </div>
        """

    # Crear HTML para top ciudades
    cities_html = ""
    for city, count in stats['top_cities'].items():
        cities_html += f"""
        <tr>
            <td>{city}</td>
            <td>{count}</td>
        </tr>
        """

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
                padding: 20px;
                color: #333333;
            }}
            .container {{
                max-width: 1400px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 6px 12px rgba(0,0,0,0.1);
                padding: 25px;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #eeeeee;
            }}
            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
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
                margin-bottom: 30px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }}
            .cities-table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }}
            .cities-table th,
            .cities-table td {{
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #eeeeee;
            }}
            .cities-table th {{
                background-color: {COLOR_PALETTE[0]};
                color: white;
                font-weight: bold;
            }}
            .cities-table tr:nth-child(even) {{
                background-color: #f8f9fa;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #eeeeee;
                color: #666666;
            }}
            .color-palette {{
                display: flex;
                justify-content: center;
                margin: 10px 0;
            }}
            .color-box {{
                width: 20px;
                height: 20px;
                margin: 0 2px;
                border-radius: 3px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌎 Mapa de Propiedades Inmobiliarias en Colombia</h1>
                <p>Visualización interactiva de propiedades clasificadas por clusters de mercado</p>
            </div>

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
                    <h3>{stats['unique_clusters']}</h3>
                    <p>Clusters identificados</p>
                </div>
                {stats_html}
            </div>

            <div class="map-container">
                {fig.to_html(include_plotlyjs='cdn', div_id='map', full_html=False)}
            </div>

            <div>
                <h3>Top 10 Ciudades con más propiedades</h3>
                <table class="cities-table">
                    <thead>
                        <tr>
                            <th>Ciudad</th>
                            <th>Número de Propiedades</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cities_html}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <div class="color-palette">
                    {' '.join([f'<div class="color-box" style="background-color: {color};"></div>' for color in COLOR_PALETTE])}
                </div>
                <p><small>Paleta de colores utilizada: {', '.join(COLOR_PALETTE)}</small></p>
                <p><small>Generado el {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}</small></p>
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

    print("🗺️ Obteniendo datos geográficos de Colombia...")
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
    print(f"   - Clusters: {stats['unique_clusters']}")

    for cluster, count in stats['cluster_distribution'].items():
        avg_price = stats['avg_price_by_cluster'].get(cluster, 0)
        print(f"   - Cluster {cluster}: {count} propiedades (avg: ${avg_price:,.0f})")

if __name__ == "__main__":
    main()
