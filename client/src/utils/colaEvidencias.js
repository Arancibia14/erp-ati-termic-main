// Cola local de evidencias (CU 16, Excepción 2). Cuando la subida falla porque
// no hay conexión, la foto queda guardada en el navegador y se reintenta sola
// al volver la señal. Se usa IndexedDB y no localStorage porque una fotografía
// supera con facilidad los ~5 MB que admite localStorage.
const BASE = 'ati-termic';
const ALMACEN = 'cola-evidencias';

const disponible = () => typeof indexedDB !== 'undefined';

function abrir() {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BASE, 1);
    pedido.onupgradeneeded = () => {
      const base = pedido.result;
      if (!base.objectStoreNames.contains(ALMACEN)) {
        base.createObjectStore(ALMACEN, { keyPath: 'id', autoIncrement: true });
      }
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function operar(modo, fn) {
  if (!disponible()) throw new Error('Este navegador no permite guardar la foto en cola');
  const base = await abrir();
  return new Promise((resolve, reject) => {
    const tx = base.transaction(ALMACEN, modo);
    const pedido = fn(tx.objectStore(ALMACEN));
    tx.oncomplete = () => { base.close(); resolve(pedido ? pedido.result : undefined); };
    tx.onerror = () => { base.close(); reject(tx.error); };
    tx.onabort = () => { base.close(); reject(tx.error); };
  });
}

// La foto se guarda como Blob junto al hito y las coordenadas del momento en
// que se tomó, para que al subirla llegue con los mismos datos.
export const encolarEvidencia = evidencia =>
  operar('readwrite', almacen => almacen.add({ ...evidencia, fecha: Date.now() }));

export const listarCola = () => operar('readonly', almacen => almacen.getAll());

export const quitarDeCola = id => operar('readwrite', almacen => almacen.delete(id));

export const vaciarColaLocal = () => operar('readwrite', almacen => almacen.clear());
