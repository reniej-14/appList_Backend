const ZONA_HORARIA = 'America/Guatemala'
const DESFASE = '-06:00'   // Guatemala no usa horario de verano

// Fecha de hoy en Guatemala, con formato YYYY-MM-DD
export const fechaHoy = () =>
    new Date().toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA })

// Instante en que empieza ese día (00:00 hora de Guatemala)
export const inicioDelDia = (fecha: string) =>
    new Date(`${fecha}T00:00:00${DESFASE}`)

// Instante en que empieza el día siguiente (límite superior, no incluido)
export const inicioDelDiaSiguiente = (fecha: string) => {
    const fin = inicioDelDia(fecha)
    fin.setUTCDate(fin.getUTCDate() + 1)
    return fin
}