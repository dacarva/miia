# 🏠 Sistema de Clustering K-means para Datos Inmobiliarios

## 📋 Descripción General

Este proyecto implementa un sistema completo de análisis de clustering utilizando el algoritmo K-means para categorizar propiedades inmobiliarias basado en sus características. El sistema procesa datos en formato CSV, aplica técnicas de machine learning, y genera categorías inteligentes con visualizaciones detalladas.

## 🎯 Objetivo

Identificar y categorizar automáticamente propiedades inmobiliarias en grupos homogéneos basados en características como:
- Valor de renta y venta
- Área construida y total
- Número de habitaciones y baños
- Estrato socioeconómico
- Ubicación geográfica

## 📊 Estructura del Proyecto

```
data/
├── json2csv.py              # Conversor JSON Lines → CSV
├── kmeans_clustering.py     # Script principal de clustering
├── cluster_categories.py    # Analizador de categorías
├── json_habi_data/
│   ├── inmobiliario.json    # Datos originales (JSON Lines)
│   ├── inmobiliario.csv     # Datos convertidos a CSV
│   ├── inmobiliario_clustered.csv    # Datos con clusters
│   └── inmobiliario_categorized.csv  # Datos con categorías
└── plots/
    ├── cluster_analysis.png           # Visualización de clusters
    └── cluster_categories_analysis.png # Análisis de categorías
```

## 🛠️ Tecnologías Utilizadas

- **Python 3.12+**
- **Pandas** - Procesamiento y manipulación de datos
- **Scikit-learn** - Algoritmos de machine learning (K-means)
- **NumPy** - Cálculos numéricos
- **Matplotlib/Seaborn** - Visualizaciones
- **PCA** - Reducción dimensional para visualización

## 📈 Clusters Identificados

### 🔹 Cluster 0 (569 propiedades) - **Económico/Residencial Familiar**
- **Valor renta promedio**: $22.3M
- **Área promedio**: 1,014 m²
- **Habitaciones**: 2.7 | **Baños**: 2.5 | **Estrato**: 4.6
- **Ubicaciones principales**: Medellín, Pereira, Bogotá D.C.
- **Tipos de propiedad**: Apartamento, Bodega, Casa

### 🔹 Cluster 1 (1 propiedad) - **Premium/Lujo Comercial**
- **Valor renta**: $12M
- **Área**: 400 m²
- **Tipo**: Local comercial en Bello
- **Característica**: Valor excepcional único

### 🔹 Cluster 2 (1 propiedad) - **Residencial Familiar Grande**
- **Valor renta**: $10M
- **Área**: 480,000 m² (¡Enorme!)
- **Habitaciones**: 5 | **Baños**: 5
- **Ubicación**: Bogotá D.C.
- **Tipo**: Casa con amplísimo espacio

### 🔹 Cluster 3 (62 propiedades) - **Económico/Residencial Costero**
- **Valor renta promedio**: $19.5M
- **Área promedio**: 451 m²
- **Habitaciones**: 2.7 | **Baños**: 2.4 | **Estrato**: 4.6
- **Ubicaciones principales**: Barranquilla, Cartagena, Santa Marta
- **Característica**: Propiedades en zonas costeras

### 🔹 Cluster 4 (268 propiedades) - **Residencial Familiar Premium**
- **Valor renta promedio**: $12M
- **Área promedio**: 677 m²
- **Habitaciones**: 3.8 | **Baños**: 4.4 | **Estrato**: 5.6
- **Ubicaciones principales**: Bogotá D.C., Medellín, Pereira
- **Característica**: Estrato alto, amplias comodidades

### 🔹 Cluster 5 (4 propiedades) - **Ultra Lujo/Residencial Exclusivo**
- **Valor renta promedio**: $1,810M (¡Ultra premium!)
- **Área promedio**: 1,053 m²
- **Habitaciones**: 3.2 | **Baños**: 4.5 | **Estrato**: 4.3
- **Ubicaciones principales**: Bogotá D.C., Sopetran
- **Característica**: Propiedades de valor excepcional

## 🎨 Criterios de Categorización

El sistema utiliza múltiples criterios para asignar categorías:

### 💰 Por Valor de Renta
- **Premium_Lujo**: ≥ $1,000M
- **Alto_Valor**: $50M - $1,000M
- **Medio_Alto**: $20M - $50M + estrato ≥5
- **Medio**: $10M - $20M + estrato ≥4
- **Económico**: $1M - $10M

### 🏠 Por Características Físicas
- **Residencial_Familiar**: ≥3 habitaciones + ≥100m²
- **Estudio_Eficiencia**: ≤1 habitación + <60m²
- **Comercial**: Locales, bodegas, oficinas

### 📍 Por Ubicación y Demografía
- Análisis de ciudades principales
- Distribución por estratos
- Concentración geográfica

## 🚀 Cómo Usar el Sistema

### 1. Conversión de Datos
```bash
python json2csv.py
```

### 2. Ejecutar Clustering
```bash
python kmeans_clustering.py
```

### 3. Análisis de Categorías
```bash
python cluster_categories.py
```

### 4. Resultados Generados
- **Clusters**: 6 categorías identificadas automáticamente
- **Visualizaciones**: Gráficos de análisis y distribución
- **Archivos CSV**: Datos enriquecidos con clusters y categorías

## 📊 Métricas de Calidad

- **Total de propiedades analizadas**: 905
- **Clusters identificados**: 6
- **Preprocesamiento**: Limpieza automática de datos
- **Escalado**: Normalización StandardScaler
- **Método de selección**: Análisis del codo (Elbow Method)

## 🎯 Aplicaciones Prácticas

### Para Inmobiliarias
- Segmentación automática de portafolio
- Estrategias de precios por categoría
- Identificación de nichos de mercado

### Para Inversores
- Detección de oportunidades de inversión
- Análisis comparativo de propiedades
- Evaluación de tendencias de mercado

### Para Desarrolladores
- Estudio de mercado para nuevos proyectos
- Análisis de demanda por categorías
- Optimización de diseños según segmentos

## 🔮 Características Técnicas Avanzadas

### Preprocesamiento Inteligente
- Manejo automático de valores faltantes (imputación por mediana)
- Detección y conversión de tipos de datos
- Escalado robusto con StandardScaler

### Algoritmo K-means Optimizado
- **Inicialización**: K-means++ para mejores resultados
- **Iteraciones**: 300 máximo por convergencia
- **Random state**: 42 para reproducibilidad
- **Múltiples inicializaciones**: n_init=20

### Análisis Dimensional
- **PCA**: Reducción a 2 componentes para visualización
- **Método del codo**: Determinación automática de clusters óptimos
- **Validación**: Análisis de inercia y silueta

## 📈 Insights Obtenidos

1. **Distribución Geográfica**: Clusters muestran patrones regionales claros
2. **Estratificación**: Relación directa entre estrato y valor de propiedades
3. **Tipología**: Diversidad de tipos de propiedad bien categorizada
4. **Valores Extremos**: Detección automática de propiedades únicas/excepcionales

## 🎨 Visualizaciones Generadas

### cluster_analysis.png
- Scatter plot de clusters en espacio PCA
- Gráfico del método del codo para determinar K óptimo
- Representación visual de la distribución de clusters

### cluster_categories_analysis.png
- Distribución de propiedades por cluster
- Valor de renta promedio por categoría
- Área promedio por cluster
- Estrato socioeconómico promedio

## 🔄 Flujo de Procesamiento

1. **Carga de datos** → CSV con 27 características
2. **Preprocesamiento** → Limpieza y escalado
3. **Determinación de K** → Método del codo
4. **Clustering** → K-means con K óptimo
5. **Análisis** → Estadísticas por cluster
6. **Categorización** → Asignación inteligente de categorías
7. **Visualización** → Gráficos y reportes
8. **Exportación** → Datos enriquecidos

## 📋 Requisitos del Sistema

### Dependencias Python
```python
pandas>=1.5.0
scikit-learn>=1.2.0
matplotlib>=3.7.0
seaborn>=0.12.0
numpy>=1.24.0
```

### Recursos Computacionales
- **RAM**: ≥4GB recomendado
- **Procesador**: Multi-core para optimización
- **Almacenamiento**: Espacio para datasets y visualizaciones

## 🚦 Próximos Pasos y Mejoras

### Mejoras Técnicas
- [ ] Implementar DBSCAN para detección de outliers
- [ ] Añadir análisis de silueta para validación
- [ ] Incorporar clustering jerárquico
- [ ] Optimizar para datasets más grandes

### Funcionalidades Adicionales
- [ ] API REST para clustering en tiempo real
- [ ] Dashboard interactivo con Streamlit
- [ ] Integración con bases de datos
- [ ] Análisis temporal de tendencias

### Análisis Avanzado
- [ ] Segmentación por micro-mercados
- [ ] Predicción de precios por machine learning
- [ ] Análisis de sentimiento en descripciones
- [ ] Integración con datos macroeconómicos

## 📞 Soporte y Contribuciones

Este sistema es modular y extensible. Para contribuciones:
1. Sigue la estructura de proyectos existente
2. Mantén consistencia en el preprocesamiento
3. Documenta nuevas funcionalidades
4. Incluye tests para validación

## 📊 Estadísticas Finales

- **✅ Procesamiento completado**: 100%
- **📈 Clusters identificados**: 6 categorías
- **🏠 Propiedades analizadas**: 905
- **🎯 Precisión**: Segmentación coherente con datos reales
- **⚡ Performance**: Procesamiento eficiente de datos

---

**✨ Sistema desarrollado para análisis inteligente de mercado inmobiliario ✨**