/**
 * Utilidad de almacenamiento seguro compatible con Tauri
 * Abstracción para almacenar datos de forma segura
 * 
 * En desarrollo: usa sessionStorage (más seguro que localStorage)
 * En producción con Tauri: usa sessionStorage (compatible con Tauri 1.x)
 * 
 * Nota: Para almacenamiento más seguro en escritorio, considerar actualizar a Tauri 2.x
 * con el plugin @tauri-apps/plugin-store
 */

// Detectar si estamos en Tauri
const isTauri = () => {
  return window.__TAURI__ !== undefined;
};

/**
 * Clase de almacenamiento seguro
 * Usa sessionStorage que es seguro y compatible tanto en web como en Tauri
 */
class SecureStorage {
  constructor() {
    this.isTauriEnv = isTauri();
    // Por ahora usamos sessionStorage en ambos entornos
    // Es más seguro que localStorage porque se limpia al cerrar la ventana
    console.log(`Storage inicializado en modo ${this.isTauriEnv ? 'Tauri' : 'Web'}`);
  }

  /**
   * Guarda un valor
   * @param {string} key - Clave
   * @param {any} value - Valor a guardar
   */
  async setItem(key, value) {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error al guardar en storage:', error);
      throw error;
    }
  }

  /**
   * Obtiene un valor
   * @param {string} key - Clave
   * @returns {Promise<any>} Valor almacenado
   */
  async getItem(key) {
    try {
      const serialized = sessionStorage.getItem(key);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.error('Error al leer de storage:', error);
      return null;
    }
  }

  /**
   * Elimina un valor
   * @param {string} key - Clave
   */
  async removeItem(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar de storage:', error);
      throw error;
    }
  }

  /**
   * Limpia todo el almacenamiento
   */
  async clear() {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error al limpiar storage:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const secureStorage = new SecureStorage();
export default secureStorage;
