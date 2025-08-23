import json
import pandas as pd
import os

def json_to_csv(json_file_path, csv_file_path=None):
    """
    Convierte un archivo JSON Lines a formato CSV usando pandas.

    Args:
        json_file_path (str): Ruta al archivo JSON de entrada
        csv_file_path (str, optional): Ruta al archivo CSV de salida.
                                      Si es None, se usa la misma ubicación con extensión .csv

    Returns:
        str: Ruta del archivo CSV generado
    """
    # Si no se especifica ruta de salida, usar misma ubicación con extensión .csv
    if csv_file_path is None:
        csv_file_path = os.path.splitext(json_file_path)[0] + '.csv'

    try:
        # Leer el archivo JSON Lines
        print(f"Leyendo archivo JSON: {json_file_path}")

        # Leer línea por línea y cargar cada objeto JSON
        data = []
        with open(json_file_path, 'r', encoding='utf-8') as file:
            for line_number, line in enumerate(file, 1):
                line = line.strip()
                if line:  # Ignorar líneas vacías
                    try:
                        json_obj = json.loads(line)
                        data.append(json_obj)
                    except json.JSONDecodeError as e:
                        print(f"Error en línea {line_number}: {e}")
                        print(f"Contenido de la línea: {line}")

        # Convertir a DataFrame de pandas
        df = pd.DataFrame(data)

        # Guardar como CSV
        print(f"Convirtiendo a CSV: {csv_file_path}")
        df.to_csv(csv_file_path, index=False, encoding='utf-8')

        print(f"Conversión completada exitosamente!")
        print(f"Total de registros procesados: {len(df)}")
        print(f"Columnas en el CSV: {list(df.columns)}")

        return csv_file_path

    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {json_file_path}")
        return None
    except Exception as e:
        print(f"Error inesperado: {e}")
        return None

def main():
    """Función principal para ejecutar la conversión"""
    # Definir rutas
    json_file = "json_habi_data/inmobiliario.json"
    csv_file = "json_habi_data/inmobiliario.csv"

    # Ejecutar conversión
    result = json_to_csv(json_file, csv_file)

    if result:
        print(f"Archivo CSV generado en: {result}")
    else:
        print("La conversión falló")

if __name__ == "__main__":
    main()
