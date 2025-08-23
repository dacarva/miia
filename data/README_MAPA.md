# 🌎 Mapa Interactivo de Propiedades Inmobiliarias en Colombia

## 📋 Descripción del Proyecto

Este proyecto genera un mapa interactivo de Colombia que visualiza la distribución geográfica de propiedades inmobiliarias, clasificadas por clusters de mercado. El mapa utiliza la paleta de colores especificada y está optimizado para integración en páginas web.

## 🎨 Paleta de Colores

La visualización utiliza la siguiente paleta de colores:

- **Fondo**: `#f9f9f9`
- **Colores principales**: 
  - `#6334a4` (Principal - púrpura oscuro)
  - `#af94ce` (Lavanda claro)
  - `#8c7cae` (Púrpura medio)
  - `#9684ac` (Púrpura grisáceo)
  - `#a474d0` (Lila)
  - `#dbc8ed` (Lavanda muy claro)
  - `#c4bcd4` (Púrpura pastel)

## 📊 Datos Utilizados

**Archivo fuente**: `json_habi_data/inmobiliario_categorized.csv`

### Estructura de datos procesados:
- **401 propiedades** con coordenadas válidas
- **43 ciudades** diferentes en Colombia
- **5 clusters** de mercado identificados
- Coordenadas geográficas (latitud/longitud)
- Información de precios, características de propiedades y categorización

## 🛠️ Scripts Disponibles

### 1. `generate_colombia_map.py`
Script principal que genera un mapa completo con:
- Mapa base de Colombia
- Marcadores por cluster con colores personalizados
- Información detallada en tooltips
- Estadísticas completas
- Interfaz responsive

### 2. `simple_colombia_map.py`
Versión simplificada con:
- Enfoque minimalista
- Carga más rápida
- Funcionalidades esenciales
- Diseño optimizado

## 📁 Archivos Generados

### `colombia_properties_map.html`
- Mapa completo con todas las funcionalidades
- Estadísticas detalladas
- Tabla de ciudades principales
- Diseño profesional

### `simple_colombia_map.html`
- Versión ligera y rápida
- Información esencial
- Ideal para integración web

## 🚀 Cómo Usar

### Requisitos previos
```bash
pip install plotly pandas numpy requests
```

### Ejecución
```bash
# Mapa completo
python generate_colombia_map.py

# Mapa simplificado
python simple_colombia_map.py
```

### Integración en Web
Los archivos HTML generados son autónomos y pueden:
1. Abrirse directamente en cualquier navegador
2. Incrustarse en páginas web existentes
3. Servirse desde cualquier servidor web

## 🔧 Personalización

### Modificar colores
Editar las variables en los scripts:
```python
COLOR_PALETTE = ['#6334a4', '#af94ce', '#8c7cae', '#9684ac', '#a474d0', '#dbc8ed', '#c4bcd4']
BACKGROUND_COLOR = '#f9f9f9'
```

### Ajustar tamaño del mapa
Modificar en `update_layout`:
```python
height=700,  # Altura en píxeles
```

## 📈 Características del Mapa

### Interactividad
- **Zoom** y **pan** para navegación
- **Tooltips** con información detallada al pasar el mouse
- **Leyenda** interactiva para filtrar por cluster
- **Responsive** para dispositivos móviles

### Información mostrada
- Título de la propiedad
- Ciudad y ubicación
- Tipo de propiedad (apartamento, casa, etc.)
- Número de habitaciones y baños
- Área construida
- Precio de venta
- Cluster asignado

## 🎯 Clusters de Mercado

El mapa visualiza 5 clusters diferentes:
1. **Cluster 0**: 199 propiedades (Precio promedio: $12.2B)
2. **Cluster 4**: 136 propiedades (Precio promedio: $2.3B)  
3. **Cluster 3**: 62 propiedades (Precio promedio: $2.8B)
4. **Cluster 5**: 3 propiedades (Precio promedio: $1.7B)
5. **Cluster 1**: 1 propiedad (Precio especial)

## 🌍 Cobertura Geográfica

### Ciudades principales con propiedades:
1. **Bogotá D.C.**: 61 propiedades
2. **Medellín**: 18 propiedades  
3. **Pereira**: 10 propiedades
4. **Funza**: 10 propiedades
5. **Cajica**: 10 propiedades

### Distribución nacional:
- Propiedades en 43 ciudades diferentes
- Cobertura en múltiples departamentos
- Enfoque en áreas urbanas principales

## 🔍 Funcionalidades Técnicas

### Procesamiento de datos
- Limpieza automática de coordenadas
- Validación de datos geográficos
- Normalización de nombres de ciudades
- Filtrado de outliers espaciales

### Optimizaciones
- Carga diferida de recursos
- Minimización de requests
- Cacheo de datos geográficos
- Renderizado eficiente

## 📱 Compatibilidad

### Navegadores soportados
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Dispositivos
- Desktop (óptimo)
- Tablet (compatible)
- Mobile (responsive)

## 🚨 Limitaciones Actuales

1. **Datos faltantes**: Solo 401 de 905 propiedades tienen coordenadas válidas
2. **Precisión**: Algunas coordenadas pueden ser aproximadas
3. **Actualización**: Los datos son estáticos (requiere reprocesamiento para actualizar)

## 🔄 Mantenimiento

### Actualizar datos
1. Reemplazar el archivo CSV de origen
2. Ejecutar los scripts nuevamente
3. Los archivos HTML se regenerarán automáticamente

### Personalizar estilos
Modificar las secciones CSS dentro de los scripts Python o editar directamente los archivos HTML generados.

## 📞 Soporte

Para issues o mejoras:
1. Verificar que los datos de origen tengan coordenadas válidas
2. Asegurar que todas las dependencias estén instaladas
3. Revisar la consola del navegador para errores JavaScript

## 📄 Licencia

Este proyecto es de uso libre para visualización de datos inmobiliarios. Los datos son propiedad de sus respectivos dueños.

---

*Última actualización: 2024* | *Generado automáticamente*