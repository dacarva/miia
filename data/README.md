# Proyecto de Clustering de Propiedades Inmobiliarias

## 📋 Descripción del Proyecto

Este proyecto implementa un sistema de clustering utilizando el algoritmo K-Means para analizar y segmentar el mercado de propiedades inmobiliarias en Colombia. El sistema procesa datos de propiedades en venta, realiza limpieza de datos, identifica clusters naturales y genera análisis detallados con visualizaciones.

## 🎯 Objetivos

- Identificar patrones en el mercado inmobiliario de venta
- Segmentar propiedades en clusters homogéneos
- Proporcionar insights para toma de decisiones
- Generar visualizaciones comprensibles
- Exportar resultados para análisis posteriores

## 🏗️ Arquitectura del Proyecto

```
data/
├── cluster_data_optimized.py      # Script principal de clustering
├── city_cluster_analysis.py       # Análisis de distribución geográfica
├── cluster_analysis.md            # Análisis detallado de clusters
├── clustered_inmobiliario.csv     # Datos originales con clusters
├── cluster_centroids.csv          # Centroides de cada cluster
├── city_cluster_analysis_report.csv # Reporte de análisis por ciudad
└── plots/                         # Visualizaciones generadas
    ├── elbow_method.png
    ├── cluster_scatter.png
    ├── rent_value_boxplot.png
    └── city_analysis/
        ├── top_cities.png
        ├── city_cluster_heatmap.png
        └── cluster_distribution_pie.png
```

## 📊 Datos Utilizados

### Fuente de Datos
- Archivo: `json_habi_data/inmobiliario.csv`
- Total de registros originales: 190,000
- Propiedades de venta analizadas: 361

### Características Principales
1. **rent_value**: Valor de venta (filtrado > 100,000)
2. **area**: Área total en m²
3. **rooms**: Número de habitaciones
4. **bathrooms**: Número de baños
5. **business_type**: Tipo de negocio (filtrado por "venta")

## ⚙️ Instalación y Configuración

### Requisitos
- Python 3.8+
- pip (gestor de paquetes de Python)

### Instalación de Dependencias
```bash
pip install pandas numpy matplotlib seaborn scikit-learn
```

### Ejecución del Proyecto
```bash
# Clustering principal
python cluster_data_optimized.py

# Análisis de distribución por ciudades
python city_cluster_analysis.py
```

## 🔧 Funcionalidades Implementadas

### 1. Limpieza de Datos
- Filtrado por `business_type = "venta"`
- Eliminación de valores NaN en rent_value
- Filtrado por `rent_value > 100,000`
- Eliminación de outliers (3 desviaciones estándar)

### 2. Preprocesamiento
- Conversión de tipos de datos
- Imputación de valores faltantes (mediana)
- Escalado estándar de características

### 3. Clustering K-Means
- Método del codo para determinar clusters óptimos
- 5 clusters identificados automáticamente
- Random state fijo para reproducibilidad

### 4. Análisis y Visualización
- Estadísticas por cluster
- Centroides en escala original
- Visualizaciones de dispersión y distribución
- Análisis geográfico por ciudades

## 📈 Resultados Obtenidos

### Clusters Identificados
| Cluster | Propiedades | % Total | Valor Promedio | Área Promedio | Descripción |
|---------|-------------|---------|----------------|---------------|-------------|
| 0 | 102 | 28.3% | $8.7M | 71 m² | Económicas Compactas |
| 1 | 104 | 28.8% | $14.0M | 365 m² | Premium Completas |
| 2 | 5 | 1.4% | $1.37B | 187 m² | Ultra Premium |
| 3 | 6 | 1.7% | $9.6M | 2,708 m² | Gran Superficie |
| 4 | 144 | 39.9% | $18.2M | 107 m² | Estándar Intermedias |

### Distribución Geográfica
**Top 5 Ciudades:**
1. **Bogotá D.C.**: 42 propiedades (11.6%)
2. **Medellín**: 37 propiedades (10.2%)
3. **Barranquilla**: 29 propiedades (8.0%)
4. **Pereira**: 22 propiedades (6.1%)
5. **Cartagena**: 22 propiedades (6.1%)

## 🎨 Visualizaciones Generadas

### Gráficas Principales
1. **Método del Codo**: Determina número óptimo de clusters
2. **Scatter Plot**: Valor vs Área por cluster
3. **Boxplot**: Distribución de valores por cluster
4. **Heatmap**: Distribución de clusters por ciudad
5. **Gráfico de Torta**: Distribución general de clusters

## 📋 Archivos de Salida

### Datos
- `clustered_inmobiliario.csv`: Datos originales + asignación de cluster
- `cluster_centroids.csv`: Centroides de cada cluster
- `city_cluster_analysis_report.csv`: Estadísticas por ciudad

### Análisis
- `cluster_analysis.md`: Análisis detallado de clusters
- `PROYECTO_CLUSTERING_RESUMEN.md`: Resumen ejecutivo completo

## 🚀 Uso del Sistema

### Para Desarrolladores
```python
from cluster_data_optimized import load_and_clean_data, prepare_features

# Cargar y limpiar datos
df = load_and_clean_data('json_habi_data/inmobiliario.csv')

# Preparar características
X_scaled, features, scaler = prepare_features(df)
```

### Para Analistas
Los archivos CSV generados pueden ser importados directamente en:
- Excel / Google Sheets
- Tableau / Power BI
- Pandas para análisis adicionales

## 🔍 Insights de Negocio

### Segmentos Identificados
1. **Mercado Masivo (68.2%)**: Clusters 0 y 4 - Propiedades accesibles
2. **Segmento Premium (28.8%)**: Cluster 1 - Propiedades completas
3. **Nicho Especializado (3.1%)**: Clusters 2 y 3 - Propiedades únicas

### Recomendaciones
- **Inversores**: Enfocarse en Cluster 4 (estabilidad) y Cluster 0 (alto potencial)
- **Desarrolladores**: Desarrollar propiedades entre Cluster 0 y Cluster 4
- **Data Quality**: Validar valores extremos en Cluster 2

## 🛠️ Tecnologías Utilizadas

- **Python**: Lenguaje principal
- **Pandas**: Manipulación de datos
- **Scikit-learn**: Machine Learning (K-Means)
- **Matplotlib/Seaborn**: Visualizaciones
- **NumPy**: Cálculos numéricos

## 📝 Próximos Pasos

### Mejoras Técnicas
1. Incorporar más características (ubicación, amenities)
2. Implementar validación cruzada
3. Agregar análisis temporal
4. Optimizar performance para datasets grandes

### Análisis Business
1. Desarrollar modelo de pricing predictivo
2. Analizar tendencias temporales por cluster
3. Comparar mercado de venta vs arriendo
4. Integrar datos externos (económicos, demográficos)

## 📞 Soporte y Contacto

Para preguntas o issues relacionados con este proyecto, por favor revisar:
1. Documentación en `cluster_analysis.md`
2. Código fuente comentado
3. Archivos de ejemplo generados

## 📄 Licencia

Este proyecto es para fines educativos y de análisis. Los datos deben ser utilizados respetando las políticas de privacidad y términos de uso correspondientes.

---

**Última actualización**: 2024  
**Versión**: 1.0  
**Estado**: ✅ Completado