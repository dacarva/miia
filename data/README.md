# Proyecto de Clustering y Mapeo de Propiedades Inmobiliarias

## 📋 Descripción del Proyecto

Este proyecto implementa un sistema completo de análisis de mercado inmobiliario que incluye clustering con algoritmo K-Means y visualización geográfica interactiva de propiedades en Colombia. El sistema procesa datos de propiedades en venta, realiza limpieza de datos, identifica clusters naturales, genera análisis detallados y crea mapas interactivos.

## 🎯 Objetivos

- Identificar patrones en el mercado inmobiliario de venta
- Segmentar propiedades en clusters homogéneos
- Visualizar distribución geográfica de propiedades
- Proporcionar insights para toma de decisiones
- Generar visualizaciones comprensibles e interactivas
- Exportar resultados para análisis posteriores

## 🏗️ Arquitectura del Proyecto

```
data/
├── cluster_data_optimized.py      # Script principal de clustering
├── city_cluster_analysis.py       # Análisis de distribución geográfica
├── generate_colombia_map.py       # Generador de mapa interactivo
├── json2csv.py                    # Conversión de datos JSON a CSV
├── kmeans_clustering.py           # Implementación de K-Means
├── cluster_categories.py          # Categorización de clusters
├── cluster_analysis.md            # Análisis detallado de clusters
├── clustered_inmobiliario.csv     # Datos originales con clusters
├── cluster_centroids.csv          # Centroides de cada cluster
├── city_cluster_analysis_report.csv # Reporte de análisis por ciudad
├── colombia_properties_map.html   # Mapa interactivo HTML
├── requirements_map.txt           # Dependencias para mapeo
└── json_habi_data/                # Datos fuente
    ├── inmobiliario.csv           # Datos originales
    ├── inmobiliario_categorized.csv # Datos categorizados
    └── inmobiliario_clustered.csv # Datos clusterizados
```

## 📊 Datos Utilizados

### Fuente de Datos
- Archivo principal: `json_habi_data/inmobiliario.csv`
- Total de registros originales: 190,000
- Propiedades de venta analizadas: 361
- Propiedades con coordenadas válidas: 401

### Características Principales
1. **sale_value**: Valor de venta
2. **area**: Área total en m²
3. **rooms**: Número de habitaciones
4. **bathrooms**: Número de baños
5. **business_type**: Tipo de negocio (filtrado por "venta")
6. **lon/lat**: Coordenadas geográficas
7. **city_name**: Nombre de la ciudad
8. **cluster**: Categoría asignada (0-5)

## ⚙️ Instalación y Configuración

### Requisitos Básicos
```bash
pip install pandas numpy matplotlib seaborn scikit-learn
```

### Requisitos para Mapa Interactivo
```bash
pip install plotly requests
# o usando el archivo de requisitos
pip install -r requirements_map.txt
```

### Ejecución del Proyecto
```bash
# Clustering principal
python cluster_data_optimized.py

# Análisis de distribución por ciudades
python city_cluster_analysis.py

# Generar mapa interactivo
python generate_colombia_map.py
```

## 🔧 Funcionalidades Implementadas

### 1. Limpieza y Procesamiento de Datos
- Filtrado por `business_type = "venta"`
- Eliminación de valores NaN en campos críticos
- Validación y normalización de coordenadas geográficas
- Conversión de tipos de datos
- Imputación de valores faltantes (mediana)
- Escalado estándar de características

### 2. Clustering K-Means
- Método del codo para determinar clusters óptimos
- 5 clusters identificados automáticamente
- Random state fijo para reproducibilidad
- Análisis de centroides y distribución

### 3. Visualización Geográfica
- Mapa interactivo de Colombia con Plotly
- Paleta de colores personalizada
- Tooltips informativos con detalles de propiedades
- Leyenda interactiva por categorías
- Diseño responsive para web

### 4. Análisis y Reportes
- Estadísticas por cluster y ciudad
- Visualizaciones de dispersión y distribución
- Análisis geográfico por ciudades
- Reportes exportables en CSV

## 🗺️ Mapa Interactivo

### Características del Mapa
- **Archivo**: `colombia_properties_map.html`
- **Tecnología**: Plotly + Mapbox
- **Interactividad**: Zoom, tooltips, filtros por categoría
- **Responsive**: Compatible con desktop, tablet y mobile
- **Autónomo**: No requiere servidor, abre directamente en navegador

### Paleta de Colores
- **Fondo**: `#f9f9f9`
- **Categoría 0**: `#6334a4` (Púrpura oscuro)
- **Categoría 1**: `#af94ce` (Lavanda claro)
- **Categoría 2**: `#8c7cae` (Púrpura medio)
- **Categoría 3**: `#9684ac` (Púrpura grisáceo)
- **Categoría 4**: `#a474d0` (Lila)
- **Categoría 5**: `#dbc8ed` (Lavanda muy claro)

### Información en Tooltips
- 📍 Nombre de la propiedad y ciudad
- 🏠 Tipo de propiedad y características
- 🛏️ Habitaciones y baños
- 📏 Área construida
- 💰 Precio de venta
- 🎯 Categoría asignada

## 📈 Resultados Obtenidos

### Clusters Identificados
| Categoría | Propiedades | % Total | Valor Promedio | Descripción |
|-----------|-------------|---------|----------------|-------------|
| 0 | 199 | 49.6% | $12.2B | Propiedades Premium |
| 4 | 136 | 33.9% | $2.3B | Segmento Intermedio |
| 3 | 62 | 15.5% | $2.8B | Propiedades Estándar |
| 5 | 3 | 0.7% | $1.7B | Nicho Especializado |
| 1 | 1 | 0.2% | $6.3T | Valor Extremo |

### Distribución Geográfica
**Top 5 Ciudades con Propiedades:**
1. **Bogotá D.C.**: 61 propiedades (15.2%)
2. **Medellín**: 18 propiedades (4.5%)
3. **Pereira**: 10 propiedades (2.5%)
4. **Funza**: 10 propiedades (2.5%)
5. **Cajica**: 10 propiedades (2.5%)

**Cobertura Total**: 43 ciudades diferentes en Colombia

## 🎨 Visualizaciones Generadas

### Gráficas Principales
1. **Método del Codo**: Determina número óptimo de clusters
2. **Scatter Plot**: Valor vs Área por categoría
3. **Boxplot**: Distribución de valores por categoría
4. **Heatmap**: Distribución de categorías por ciudad
5. **Mapa Interactivo**: Visualización geográfica completa

### Archivos de Salida
- `clustered_inmobiliario.csv`: Datos con asignación de categoría
- `cluster_centroids.csv`: Centroides de cada categoría
- `city_cluster_analysis_report.csv`: Estadísticas por ciudad
- `colombia_properties_map.html`: Mapa interactivo HTML
- Varios archivos PNG con visualizaciones estáticas

## 🚀 Uso del Sistema

### Para Desarrolladores
```python
# Ejemplo de uso del clustering
from cluster_data_optimized import load_and_clean_data, prepare_features

df = load_and_clean_data('json_habi_data/inmobiliario.csv')
X_scaled, features, scaler = prepare_features(df)
```

### Para Analistas y Business
Los archivos generados pueden ser utilizados en:
- **Excel/Google Sheets**: Análisis tabular de los CSV
- **Tableau/Power BI**: Dashboards interactivos
- **Navegador Web**: Mapa interactivo directamente
- **Presentaciones**: Gráficas exportadas en PNG

### Para Integración Web
El archivo HTML del mapa puede:
- Incrustarse en páginas web existentes
- Servirse desde cualquier servidor web
- Personalizarse mediante CSS y JavaScript
- Actualizarse con nuevos datos

## 🔍 Insights de Negocio

### Segmentos de Mercado Identificados
1. **Mercado Premium (49.6%)**: Categoría 0 - Propiedades de alto valor
2. **Segmento Intermedio (33.9%)**: Categoría 4 - Propiedades balanceadas
3. **Mercado Estándar (15.5%)**: Categoría 3 - Propiedades accesibles
4. **Nichos Especializados (0.9%)**: Categorías 1 y 5 - Oportunidades únicas

### Aplicaciones Prácticas
- **Inversores**: Identificar oportunidades por categoría y ubicación
- **Desarrolladores**: Entender distribución geográfica de demanda
- **Corredores**: Optimizar portafolio según segmentos
- **Analistas**: Detectar tendencias y patrones de mercado

## 🛠️ Tecnologías Utilizadas

- **Python 3.8+**: Lenguaje principal de desarrollo
- **Pandas**: Manipulación y análisis de datos
- **Scikit-learn**: Machine Learning (K-Means clustering)
- **Plotly**: Visualizaciones interactivas y mapas
- **Matplotlib/Seaborn**: Visualizaciones estáticas
- **NumPy**: Operaciones numéricas eficientes
- **Requests**: Consumo de datos geográficos

## 📝 Próximos Pasos y Mejoras

### Mejoras Técnicas
1. ✅ Implementar mapa interactivo con Plotly
2. 🔄 Optimizar carga de datos geográficos
3. 📊 Agregar más métricas de análisis
4. 🗺️ Mejorar precisión de coordenadas
5. ⚡ Optimizar performance para grandes volúmenes

### Expansion Funcional
1. 🔍 Análisis temporal de tendencias
2. 📱 Versión móvil optimizada del mapa
3. 🌐 Integración con APIs de mapas externos
4- 📈 Modelos predictivos de pricing
5. 🏙️ Análisis comparativo entre ciudades

## 📞 Soporte y Contacto

### Documentación Disponible
1. **Este README.md**: Documentación principal
2. **cluster_analysis.md**: Análisis técnico detallado
3. **Código comentado**: Explicaciones en los scripts
4. **Ejemplos de salida**: Archivos generados de referencia

### Resolución de Issues
1. Verificar que todas las dependencias estén instaladas
2. Asegurar que los archivos de datos existan en las rutas correctas
3. Revisar la consola del navegador para errores JavaScript
4. Validar que las coordenadas en los datos sean correctas

## 📄 Licencia y Uso

Este proyecto es para fines educativos, de análisis y demostración. Los datos deben ser utilizados respetando:

- Políticas de privacidad de los datos originales
- Términos de uso de las fuentes de datos
- Regulaciones locales de protección de datos
- Normativas de uso de información inmobiliaria

---

**Versión**: 2.0 (Con Mapa Interactivo)  
**Última Actualización**: 2024  
**Estado**: ✅ Completado con funcionalidades extendidas  
**Mapa Generado**: `colombia_properties_map.html`
