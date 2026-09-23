const nodemailer = require('nodemailer');

// CU06 - Envío de correo. Por defecto usa Ethereal (cuenta SMTP de prueba,
// gratuita, generada sola): el correo se manda por SMTP de verdad pero queda
// en una bandeja falsa, visible solo a través del link de previsualización
// que se imprime en la consola. Para usar una cuenta real, definir MAIL_HOST,
// MAIL_PORT, MAIL_USER y MAIL_PASS en el .env.
let transportadorPromesa = null;

async function obtenerTransportador() {
  if (transportadorPromesa) return transportadorPromesa;

  transportadorPromesa = (async () => {
    if (process.env.MAIL_HOST) {
      return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT) || 587,
        secure: false,
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
      });
    }

    const cuentaPrueba = await nodemailer.createTestAccount();
    console.log('[correo] Usando cuenta de prueba Ethereal (sin configuración real en .env)');
    return nodemailer.createTransport({
      host: cuentaPrueba.smtp.host,
      port: cuentaPrueba.smtp.port,
      secure: cuentaPrueba.smtp.secure,
      auth: { user: cuentaPrueba.user, pass: cuentaPrueba.pass }
    });
  })();

  return transportadorPromesa;
}

async function enviarCorreo({ para, asunto, texto, html }) {
  const transportador = await obtenerTransportador();
  const info = await transportador.sendMail({
    from: '"ATI Termic SpA" <no-responder@atitermic.cl>',
    to: para,
    subject: asunto,
    text: texto,
    html
  });

  const urlPreview = nodemailer.getTestMessageUrl(info);
  if (urlPreview) console.log(`[correo] Ver correo enviado a ${para}: ${urlPreview}`);

  return { info, urlPreview };
}

module.exports = { enviarCorreo };
