// Normaliza el RUT a formato NUMERO-DV: quita puntos, espacios y hace opcional el guion.
// Acepta desde 6 digitos (trabajadores de mayor edad) hasta 9.
function normalizarRut(rut) {
  if (!rut) return null;
  const limpio = String(rut).replace(/[.\s]/g, '').toUpperCase().trim();
  const m = /^(\d{6,9})-?([0-9K])$/.exec(limpio);
  return m ? `${m[1]}-${m[2]}` : null;
}

function calcularDv(numero) {
  let suma = 0;
  let multiplo = 2;
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  return resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
}

// Devuelve { valido, rut, error }. Tanto el error de formato como el de digito
// verificador entregan el mismo mensaje: el sistema no revela el DV esperado.
const RUT_INVALIDO = 'El RUT ingresado tiene un formato inválido';

function validarRutChileno(rut) {
  const normalizado = normalizarRut(rut);
  if (!normalizado) {
    return { valido: false, error: RUT_INVALIDO };
  }
  const [numero, dv] = normalizado.split('-');
  if (calcularDv(numero) !== dv) {
    return { valido: false, error: RUT_INVALIDO };
  }
  return { valido: true, rut: normalizado };
}

module.exports = { normalizarRut, validarRutChileno, RUT_INVALIDO };
