import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

def load_and_preprocess_data(csv_path):
    """Cargar y preprocesar los datos para clustering"""
    print("Cargando datos...")
    df = pd.read_csv(csv_path)

    # Seleccionar características numéricas relevantes
    numeric_features = [
        'rent_value', 'rooms', 'bathrooms', 'garage', 'area',
        'built_area', 'sale_value', 'stratum', 'lon', 'lat'
    ]

    # Filtrar solo las columnas que existen en el dataset
    available_features = [col for col in numeric_features if col in df.columns]
    print(f"Características numéricas disponibles: {available_features}")

    # Crear dataset para clustering
    X = df[available_features].copy()

    # Manejar valores faltantes
    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)
    X = pd.DataFrame(X_imputed, columns=available_features, index=X.index)

    # Escalar los datos
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return df, X_scaled, available_features, scaler

def determine_optimal_clusters(X_scaled, max_clusters=15):
    """Determinar el número óptimo de clusters usando el método del codo"""
    print("Determinando número óptimo de clusters...")

    inertia = []
    k_range = range(2, max_clusters + 1)

    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X_scaled)
        inertia.append(kmeans.inertia_)

    # Calcular la diferencia de inercia para encontrar el "codo"
    differences = np.diff(inertia)
    second_diff = np.diff(differences)

    # Encontrar el punto donde la segunda derivada es máxima (el codo)
    optimal_k = np.argmax(np.abs(second_diff)) + 3  # +3 porque empezamos desde k=2

    # Asegurarnos de tener entre 6 y 10 clusters
    optimal_k = min(max(optimal_k, 6), 10)

    print(f"Número óptimo de clusters sugerido: {optimal_k}")
    return optimal_k, inertia, k_range

def perform_kmeans_clustering(X_scaled, n_clusters):
    """Realizar clustering K-means"""
    print(f"Realizando clustering con {n_clusters} clusters...")

    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=20, max_iter=300)
    clusters = kmeans.fit_predict(X_scaled)

    return clusters, kmeans

def analyze_clusters(df, clusters, original_df):
    """Analizar y describir los clusters"""
    print("\n=== ANÁLISIS DE CLUSTERS ===")

    # Añadir clusters al DataFrame original
    df_with_clusters = original_df.copy()
    df_with_clusters['cluster'] = clusters

    # Estadísticas por cluster
    cluster_stats = df_with_clusters.groupby('cluster').agg({
        'rent_value': ['count', 'mean', 'std', 'min', 'max'],
        'sale_value': ['mean', 'std', 'min', 'max'],
        'area': ['mean', 'std'],
        'rooms': ['mean', 'std'],
        'bathrooms': ['mean', 'std'],
        'stratum': ['mean', 'std']
    }).round(2)

    print("Estadísticas por cluster:")
    print(cluster_stats)

    # Descripción de cada cluster
    print("\n=== DESCRIPCIÓN DE CLUSTERS ===")
    for cluster_id in range(len(cluster_stats)):
        cluster_data = df_with_clusters[df_with_clusters['cluster'] == cluster_id]

        print(f"\n--- Cluster {cluster_id} ({len(cluster_data)} propiedades) ---")
        print(f"Valor de renta promedio: ${cluster_data['rent_value'].mean():,.0f}")
        print(f"Valor de venta promedio: ${cluster_data['sale_value'].mean():,.0f}")
        print(f"Área promedio: {cluster_data['area'].mean():.0f} m²")
        print(f"Habitaciones promedio: {cluster_data['rooms'].mean():.1f}")
        print(f"Baños promedio: {cluster_data['bathrooms'].mean():.1f}")
        print(f"Estrato promedio: {cluster_data['stratum'].mean():.1f}")

        # Ciudades más comunes (solo si hay datos)
        if 'city_name' in cluster_data.columns and not cluster_data['city_name'].isna().all():
            top_cities = cluster_data['city_name'].value_counts().head(3)
            if not top_cities.empty:
                print(f"Ciudades principales: {', '.join(top_cities.index.tolist())}")

        # Tipos de propiedad más comunes (solo si hay datos)
        if 'property_type' in cluster_data.columns and not cluster_data['property_type'].isna().all():
            top_properties = cluster_data['property_type'].value_counts().head(3)
            if not top_properties.empty:
                print(f"Tipos de propiedad: {', '.join(top_properties.index.tolist())}")

        # Mostrar características únicas si el cluster es pequeño
        if len(cluster_data) <= 5:
            print("🔍 Propiedades en este cluster:")
            for idx, prop in cluster_data.head(3).iterrows():
                if 'title' in prop and pd.notna(prop['title']):
                    print(f"   - {prop['title']}")

    return df_with_clusters

def visualize_clusters(X_scaled, clusters, features, n_clusters):
    """Visualizar los clusters usando PCA"""
    print("\nGenerando visualizaciones...")

    # Reducción de dimensionalidad con PCA
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)

    plt.figure(figsize=(15, 5))

    # Scatter plot de clusters
    plt.subplot(1, 2, 1)
    scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=clusters, cmap='viridis', alpha=0.6)
    plt.colorbar(scatter, label='Cluster')
    plt.title(f'K-means Clustering ({n_clusters} clusters)')
    plt.xlabel('Componente Principal 1')
    plt.ylabel('Componente Principal 2')

    # Gráfico de inercia (método del codo)
    plt.subplot(1, 2, 2)
    k_range = range(2, 11)
    inertia = []
    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X_scaled)
        inertia.append(kmeans.inertia_)

    plt.plot(k_range, inertia, 'bo-')
    plt.xlabel('Número de clusters')
    plt.ylabel('Inercia')
    plt.title('Método del Codo')
    plt.axvline(x=n_clusters, color='r', linestyle='--', label=f'K óptimo: {n_clusters}')
    plt.legend()

    plt.tight_layout()
    plt.savefig('plots/cluster_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()

def save_clustered_data(df_with_clusters, output_path):
    """Guardar datos con clusters"""
    print(f"\nGuardando datos con clusters en: {output_path}")
    df_with_clusters.to_csv(output_path, index=False, encoding='utf-8')
    print("Datos guardados exitosamente!")

def main():
    """Función principal"""
    # Configuración
    input_csv = "json_habi_data/inmobiliario.csv"
    output_csv = "json_habi_data/inmobiliario_clustered.csv"

    try:
        # Cargar y preprocesar datos
        original_df, X_scaled, features, scaler = load_and_preprocess_data(input_csv)

        # Determinar número óptimo de clusters (mínimo 6, máximo 10)
        optimal_k, inertia, k_range = determine_optimal_clusters(X_scaled, max_clusters=10)
        optimal_k = min(max(optimal_k, 6), 10)  # Asegurar entre 6 y 10 clusters

        # Realizar clustering
        clusters, kmeans = perform_kmeans_clustering(X_scaled, optimal_k)

        # Analizar clusters
        df_with_clusters = analyze_clusters(original_df, clusters, original_df)

        # Visualizar resultados
        visualize_clusters(X_scaled, clusters, features, optimal_k)

        # Guardar resultados
        save_clustered_data(df_with_clusters, output_csv)

        print(f"\n✅ Análisis de clustering completado con {optimal_k} clusters!")
        print(f"📊 Archivo con clusters guardado en: {output_csv}")
        print(f"📈 Visualización guardada en: plots/cluster_analysis.png")

    except Exception as e:
        print(f"❌ Error durante el clustering: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
