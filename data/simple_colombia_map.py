# simple_colombia_map.py
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
import requests

# Paleta de colores especificada
COLOR_PALETTE = ['#6334a4', '#af94ce', '#8c7cae', '#9684ac', '#a474d0', '#dbc8ed', '#c4bcd4']
BACKGROUND_COLOR = '#f9f9f9'

def load_data():
    """Cargar y procesar datos de propiedades"""
    df = pd.read_csv('json_habi_data/inmobiliario_categorized.csv')

    # Filtrar propiedades con coordenadas válidas
    df = df.dropna(subset=['lon', 'lat'])
    df['lon'] = pd.to_numeric(df['lon'], errors='coerce')
    df['lat'] = pd.to_numeric(df['lat'], errors='coerce')
    df = df.dropna(subset=['lon', 'lat'])

    # Filtrar coordenadas dentro de Colombia
    df = df[(df['lon'] >= -82) & (df['lon'] <= -66) &
            (df['lat'] >= -4) & (df['lat'] <= 13)]

    # Limpiar y procesar datos
    df['city_name'] = df['city_name'].str.strip().str.title()
    df['cluster'] = pd.to_numeric(df['cluster'], errors='coerce').fillna(0).astype(int)

    print(f"✅ {len(df)} propiedades con coordenadas válidas")
    print(f"🏙️  {df['city_name'].nunique()} ciudades diferentes")
    print(f"🎯 {df['cluster'].nunique()} clusters identificados")

    return df

def create_simple_map(df):
    """Crear mapa simple pero efectivo de Colombia"""

    # Configurar colores para clusters
    cluster_colors = {i: COLOR_PALETTE[i % len(COLOR_PALETTE)] for i in range(6)}

    # Crear figura
    fig = go.Figure()

    # Añadir marcadores para cada cluster
    for cluster in sorted(df['cluster'].unique()):
        cluster_df = df[df['cluster'] == cluster]
        color = cluster_colors[cluster]

        # Texto para hover
        hover_text = []
        for _, row in cluster_df.iterrows():
            text = f"""
            <b>{row.get('title', 'Sin título')}</b><br>
            📍 {row.get('city_name', 'Desconocida')}<br>
            🏠 {row.get('property_type', 'Desconocido')}<br>
            🛏️ {row.get('rooms', 'N/A')} hab · 🚿 {row.get('bathrooms', 'N/A')} baños<br>
            📏 {row.get('area', 'N/A')} m²<br>
            💰 ${row.get('sale_value', 0):,.0f}<br>
            🎯 Cluster {row.get('cluster', 'N/A')}
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
            text='<b>🌎 Mapa de Propiedades en Colombia</b><br>'
                 '<sub>Distribución por clusters de mercado inmobiliario</sub>',
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
            title=dict(text="🎯 Clusters", font=dict(size=12)),
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01,
            bgcolor='rgba(255,255,255,0.9)',
            bordercolor='#cccccc',
            borderwidth=1
        ),
        height=700,
        margin=dict(l=0, r=0, t=80, b=0)
    )

    return fig

def generate_html(fig, df):
    """Generar archivo HTML completo"""

    # Estadísticas
    total_properties = len(df)
    unique_cities = df['city_name'].nunique()
    unique_clusters = df['cluster'].nunique()

    # Distribución por cluster
    cluster_stats = ""
    for cluster in sorted(df['cluster'].unique()):
        count = len(df[df['cluster'] == cluster])
        avg_price = df[df['cluster'] == cluster]['sale_value'].mean()
        cluster_stats += f"""
        <div class="stat-card" style="background: linear-gradient(135deg, {COLOR_PALETTE[cluster % len(COLOR_PALETTE)]}, {COLOR_PALETTE[(cluster + 2) % len(COLOR_PALETTE)]});">
            <h3>{count}</h3>
            <p>Cluster {cluster}</p>
            <small>${avg_price:,.0f} avg</small>
        </div>
        """

    # Top ciudades
    top_cities = df['city_name'].value_counts().head(5)
    cities_html = ""
    for city, count in top_cities.items():
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
        <title>Mapa Colombia - Propiedades Inmobiliarias</title>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <style>
            body {{
                background-color: {BACKGROUND_COLOR};
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                color: #333333;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                padding: 25px;
            }}
            .header {{
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 20px;
                border-bottom: 2px solid #eeeeee;
            }}
            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 25px;
            }}
            .stat-card {{
                color: white;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .stat-card h3 {{
                margin: 0;
                font-size: 20px;
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
                height: 600px;
                margin-bottom: 25px;
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
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #eeeeee;
            }}
            .cities-table th {{
                background-color: {COLOR_PALETTE[0]};
                color: white;
                font-weight: bold;
            }}
            .footer {{
                text-align: center;
                margin-top: 25px;
                padding-top: 20px;
                border-top: 2px solid #eeeeee;
                color: #666666;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌎 Mapa de Propiedades Inmobiliarias</h1>
                <p>Visualización interactiva de propiedades en Colombia por clusters de mercado</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card" style="background: linear-gradient(135deg, {COLOR_PALETTE[0]}, {COLOR_PALETTE[2]});">
                    <h3>{total_properties}</h3>
                    <p>Propiedades</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, {COLOR_PALETTE[1]}, {COLOR_PALETTE[3]});">
                    <h3>{unique_cities}</h3>
                    <p>Ciudades</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, {COLOR_PALETTE[2]}, {COLOR_PALETTE[4]});">
                    <h3>{unique_clusters}</h3>
                    <p>Clusters</p>
                </div>
                {cluster_stats}
            </div>

            <div class="map-container">
                {fig.to_html(include_plotlyjs='cdn', div_id='map', full_html=False)}
            </div>

            <div>
                <h3>🏙️ Top 5 Ciudades</h3>
                <table class="cities-table">
                    <thead>
                        <tr>
                            <th>Ciudad</th>
                            <th>Propiedades</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cities_html}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p>✨ Generado con Python & Plotly · Paleta: {', '.join(COLOR_PALETTE[:3])}...</p>
            </div>
        </div>
    </body>
    </html>
    """

    return html_content

def main():
    """Función principal"""
    print("🚀 Generando mapa simple de Colombia...")

    # Cargar datos
    df = load_data()

    if len(df) == 0:
        print("❌ No hay datos válidos para generar el mapa")
        return

    # Crear mapa
    fig = create_simple_map(df)

    # Generar HTML
    html_content = generate_html(fig, df)

    # Guardar archivo
    with open('simple_colombia_map.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    print("✅ Mapa generado: simple_colombia_map.html")
    print("📊 Resumen:")
    print(f"   - Propiedades: {len(df)}")
    print(f"   - Ciudades: {df['city_name'].nunique()}")
    print(f"   - Clusters: {df['cluster'].nunique()}")

if __name__ == "__main__":
    main()
