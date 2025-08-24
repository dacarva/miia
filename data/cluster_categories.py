import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns

class ClusterCategoryAnalyzer:
    """Analizador de categorías de clusters para datos inmobiliarios"""

    def __init__(self, csv_path):
        """Inicializar el analizador con la ruta del archivo CSV"""
        self.csv_path = csv_path
        self.df = None
        self.cluster_descriptions = {}

    def load_data(self):
        """Cargar datos del archivo CSV"""
        print("📊 Cargando datos con clusters...")
        self.df = pd.read_csv(self.csv_path)

        # Verificar que existe la columna de clusters
        if 'cluster' not in self.df.columns:
            raise ValueError("El archivo CSV no contiene la columna 'cluster'")

        print(f"✅ Datos cargados: {len(self.df)} propiedades, {self.df['cluster'].nunique()} clusters")
        return self

    def analyze_cluster_categories(self):
        """Analizar y categorizar los clusters"""
        if self.df is None:
            self.load_data()

        print("\n🎯 ANALIZANDO CATEGORÍAS DE CLUSTERS")
        print("=" * 50)

        # Definir categorías basadas en características
        categories = {
            'Premium_Lujo': {
                'criteria': lambda x: (x['rent_value'] >= 1000000000) or
                                    (x['sale_value'] >= 5000000000),
                'description': 'Propiedades de ultra lujo con valores excepcionales'
            },
            'Alto_Valor': {
                'criteria': lambda x: (x['rent_value'] >= 50000000) and
                                    (x['rent_value'] < 1000000000),
                'description': 'Propiedades de alto valor con amenities premium'
            },
            'Medio_Alto': {
                'criteria': lambda x: (x['rent_value'] >= 20000000) and
                                    (x['rent_value'] < 50000000) and
                                    (x['stratum'] >= 5),
                'description': 'Propiedades de clase media-alta en estratos altos'
            },
            'Medio': {
                'criteria': lambda x: (x['rent_value'] >= 10000000) and
                                    (x['rent_value'] < 20000000) and
                                    (x['stratum'] >= 4),
                'description': 'Propiedades de clase media con buen estándar'
            },
            'Económico': {
                'criteria': lambda x: (x['rent_value'] >= 1000000) and
                                    (x['rent_value'] < 10000000),
                'description': 'Propiedades económicas con buen valor'
            },
            'Comercial': {
                'criteria': lambda x: (x['property_type'].str.contains('local|bodega|oficina', case=False, na=False)) if 'property_type' in x else False,
                'description': 'Propiedades comerciales y de negocio'
            },
            'Residencial_Familiar': {
                'criteria': lambda x: (x['rooms'] >= 3) and
                                    (x['bathrooms'] >= 2) and
                                    (x['area'] >= 100),
                'description': 'Propiedades familiares con amplio espacio'
            },
            'Estudio_Eficiencia': {
                'criteria': lambda x: (x['rooms'] <= 1) and
                                    (x['area'] < 60),
                'description': 'Estudios y apartamentos eficientes'
            }
        }

        # Asignar categorías a cada cluster
        cluster_stats = self.df.groupby('cluster').agg({
            'rent_value': ['mean', 'std', 'count'],
            'sale_value': ['mean', 'std'],
            'area': ['mean', 'std'],
            'rooms': ['mean', 'std'],
            'bathrooms': ['mean', 'std'],
            'stratum': ['mean', 'std']
        }).round(2)

        print("\n📋 CATEGORIZACIÓN DE CLUSTERS:")
        print("-" * 40)

        for cluster_id in sorted(self.df['cluster'].unique()):
            cluster_data = self.df[self.df['cluster'] == cluster_id]
            cluster_size = len(cluster_data)

            if cluster_size == 0:
                continue

            print(f"\n🔹 Cluster {cluster_id} ({cluster_size} propiedades)")

            # Calcular porcentajes para cada categoría
            category_percentages = {}
            for cat_name, cat_info in categories.items():
                try:
                    mask = cluster_data.apply(cat_info['criteria'], axis=1)
                    percentage = (mask.sum() / cluster_size) * 100
                    if percentage > 20:  # Solo mostrar categorías significativas
                        category_percentages[cat_name] = percentage
                except:
                    continue

            # Ordenar categorías por porcentaje
            sorted_categories = sorted(category_percentages.items(), key=lambda x: x[1], reverse=True)

            if sorted_categories:
                print("   Categorías principales:")
                for cat_name, percentage in sorted_categories[:3]:  # Top 3 categorías
                    print(f"   • {cat_name}: {percentage:.1f}% - {categories[cat_name]['description']}")
            else:
                print("   📍 Categoría mixta o única")

            # Estadísticas clave
            stats = cluster_stats.loc[cluster_id]
            print(f"   💰 Valor renta promedio: ${stats[('rent_value', 'mean')]:,.0f}")
            print(f"   🏠 Área promedio: {stats[('area', 'mean')]:.0f} m²")
            print(f"   🛏️ Habitaciones: {stats[('rooms', 'mean')]:.1f}")
            print(f"   🚿 Baños: {stats[('bathrooms', 'mean')]:.1f}")
            print(f"   🏙️ Estrato: {stats[('stratum', 'mean')]:.1f}")

            # Guardar descripción
            self.cluster_descriptions[cluster_id] = {
                'size': cluster_size,
                'main_categories': [cat[0] for cat in sorted_categories[:2]],
                'avg_rent': stats[('rent_value', 'mean')],
                'avg_area': stats[('area', 'mean')],
                'avg_rooms': stats[('rooms', 'mean')]
            }

    def generate_visualizations(self):
        """Generar visualizaciones de las categorías"""
        if self.df is None:
            self.load_data()

        print("\n📈 GENERANDO VISUALIZACIONES...")

        # Configurar estilo
        plt.style.use('seaborn-v0_8')
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))

        # 1. Distribución de clusters
        cluster_counts = self.df['cluster'].value_counts().sort_index()
        axes[0, 0].bar(cluster_counts.index.astype(str), cluster_counts.values)
        axes[0, 0].set_title('Distribución de Propiedades por Cluster')
        axes[0, 0].set_xlabel('Cluster')
        axes[0, 0].set_ylabel('Número de Propiedades')

        # 2. Valor de renta promedio por cluster
        rent_by_cluster = self.df.groupby('cluster')['rent_value'].mean() / 1000000
        axes[0, 1].bar(rent_by_cluster.index.astype(str), rent_by_cluster.values)
        axes[0, 1].set_title('Valor de Renta Promedio por Cluster (Millones)')
        axes[0, 1].set_xlabel('Cluster')
        axes[0, 1].set_ylabel('Valor de Renta (Millones COP)')

        # 3. Área promedio por cluster
        area_by_cluster = self.df.groupby('cluster')['area'].mean()
        axes[1, 0].bar(area_by_cluster.index.astype(str), area_by_cluster.values)
        axes[1, 0].set_title('Área Promedio por Cluster')
        axes[1, 0].set_xlabel('Cluster')
        axes[1, 0].set_ylabel('Área (m²)')

        # 4. Estrato promedio por cluster
        if 'stratum' in self.df.columns:
            stratum_by_cluster = self.df.groupby('cluster')['stratum'].mean()
            axes[1, 1].bar(stratum_by_cluster.index.astype(str), stratum_by_cluster.values)
            axes[1, 1].set_title('Estrato Promedio por Cluster')
            axes[1, 1].set_xlabel('Cluster')
            axes[1, 1].set_ylabel('Estrato')
            axes[1, 1].set_ylim(0, 7)

        plt.tight_layout()
        plt.savefig('plots/cluster_categories_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()

        print("✅ Visualizaciones guardadas en: plots/cluster_categories_analysis.png")

    def generate_summary_report(self):
        """Generar un reporte resumen de las categorías"""
        if not self.cluster_descriptions:
            self.analyze_cluster_categories()

        print("\n" + "="*60)
        print("📋 REPORTE RESUMEN DE CATEGORÍAS DE CLUSTERS")
        print("="*60)

        for cluster_id, info in self.cluster_descriptions.items():
            print(f"\n🎯 CLUSTER {cluster_id}:")
            print(f"   📊 {info['size']} propiedades")
            print(f"   💰 Valor renta promedio: ${info['avg_rent']:,.0f}")
            print(f"   📐 Área promedio: {info['avg_area']:.0f} m²")
            print(f"   🛏️ Habitaciones promedio: {info['avg_rooms']:.1f}")

            if info['main_categories']:
                print(f"   🏷️ Categorías principales: {', '.join(info['main_categories'])}")
            else:
                print("   🏷️ Categoría: Mixta/Especializada")

            print(f"   {'─'*40}")

    def save_detailed_analysis(self, output_path):
        """Guardar análisis detallado en CSV"""
        if self.df is None:
            self.load_data()

        # Crear DataFrame con análisis detallado
        detailed_df = self.df.copy()

        # Añadir información de categorización
        def assign_category(row):
            for cluster_id, info in self.cluster_descriptions.items():
                if row['cluster'] == cluster_id:
                    return '_'.join(info['main_categories']) if info['main_categories'] else 'Mixto'
            return 'No_Categorizado'

        detailed_df['category'] = detailed_df.apply(assign_category, axis=1)
        detailed_df.to_csv(output_path, index=False, encoding='utf-8')

        print(f"✅ Análisis detallado guardado en: {output_path}")

def main():
    """Función principal"""
    # Configuración
    input_csv = "json_habi_data/inmobiliario_clustered.csv"
    output_csv = "json_habi_data/inmobiliario_categorized.csv"

    try:
        # Crear analizador
        analyzer = ClusterCategoryAnalyzer(input_csv)

        # Cargar datos
        analyzer.load_data()

        # Analizar categorías
        analyzer.analyze_cluster_categories()

        # Generar visualizaciones
        analyzer.generate_visualizations()

        # Generar reporte resumen
        analyzer.generate_summary_report()

        # Guardar análisis detallado
        analyzer.save_detailed_analysis(output_csv)

        print(f"\n🎉 Análisis de categorías completado!")
        print(f"📊 Archivo categorizado guardado en: {output_csv}")

    except Exception as e:
        print(f"❌ Error durante el análisis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
