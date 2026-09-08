export function getEaster(year: number): Date {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

export function getBrazilianHolidays(year: number): string[] {
  // Feriados fixos
  const fixedHolidays = [
    `${year}-01-01`, // Confraternização Universal
    `${year}-04-21`, // Tiradentes
    `${year}-05-01`, // Dia do Trabalhador
    `${year}-09-07`, // Independência
    `${year}-10-12`, // Nossa Senhora Aparecida
    `${year}-11-02`, // Finados
    `${year}-11-15`, // Proclamação da República
    `${year}-11-20`, // Consciência Negra
    `${year}-12-25`, // Natal
  ];

  // Feriados móveis baseados na Páscoa
  const easter = getEaster(year);
  
  const carnaval = new Date(easter.getTime() - 47 * 24 * 60 * 60 * 1000);
  const paixaoCristo = new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000);
  const corpusChristi = new Date(easter.getTime() + 60 * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return [
    ...fixedHolidays,
    formatDate(carnaval),
    formatDate(paixaoCristo),
    formatDate(corpusChristi)
  ];
}

/**
 * Calcula a diferença em minutos de horas úteis entre duas datas.
 * Horas úteis: Seg a Sex, das 07:00 às 18:00 (ignora almoço conforme solicitado).
 * Finais de semana e feriados nacionais são ignorados.
 */
export function calculateBusinessMinutes(startDate: Date, endDate: Date): number {
  if (endDate < startDate) return 0;

  const startHour = 7;
  const endHour = 18;
  let totalMinutes = 0;

  let current = new Date(startDate.getTime());
  
  // Se a data final for a mesma do início e no mesmo dia (otimização)
  if (current.toDateString() === endDate.toDateString()) {
    if (isWorkingDay(current)) {
      return getWorkingMinutesInDay(current, endDate, startHour, endHour);
    }
    return 0;
  }

  // Adicionar minutos do primeiro dia
  if (isWorkingDay(current)) {
    // Fim do dia para o primeiro dia é 18:00
    const endOfDay = new Date(current);
    endOfDay.setHours(endHour, 0, 0, 0);
    totalMinutes += getWorkingMinutesInDay(current, endOfDay, startHour, endHour);
  }

  // Avançar para o próximo dia à meia noite
  current.setDate(current.getDate() + 1);
  current.setHours(0, 0, 0, 0);

  // Somar dias inteiros entre start e end
  while (current.toDateString() !== endDate.toDateString() && current < endDate) {
    if (isWorkingDay(current)) {
      totalMinutes += (endHour - startHour) * 60;
    }
    current.setDate(current.getDate() + 1);
  }

  // Adicionar minutos do último dia (se start e end não foram no mesmo dia)
  if (current.toDateString() === endDate.toDateString() && isWorkingDay(endDate)) {
    const startOfLastDay = new Date(endDate);
    startOfLastDay.setHours(startHour, 0, 0, 0);
    // Se o fim for antes das 07h, getWorkingMinutesInDay já vai tratar e retornar 0
    totalMinutes += getWorkingMinutesInDay(startOfLastDay, endDate, startHour, endHour);
  }

  return totalMinutes;
}

function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  // Domingo (0) e Sábado (6)
  if (day === 0 || day === 6) return false;

  const year = date.getFullYear();
  const holidays = getBrazilianHolidays(year);
  const dateStr = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  if (holidays.includes(dateStr)) return false;

  return true;
}

function getWorkingMinutesInDay(start: Date, end: Date, startHour: number, endHour: number): number {
  let sTime = start.getTime();
  let eTime = end.getTime();

  const dayStart = new Date(start);
  dayStart.setHours(startHour, 0, 0, 0);
  
  const dayEnd = new Date(start);
  dayEnd.setHours(endHour, 0, 0, 0);

  // Ajustar inícios antes das 07h para 07h
  if (sTime < dayStart.getTime()) {
    sTime = dayStart.getTime();
  }
  // Ajustar fins após 18h para 18h
  if (eTime > dayEnd.getTime()) {
    eTime = dayEnd.getTime();
  }

  // Se começou depois das 18h ou terminou antes das 07h
  if (sTime >= dayEnd.getTime() || eTime <= dayStart.getTime()) {
    return 0;
  }

  const diffMs = eTime - sTime;
  return diffMs > 0 ? Math.round(diffMs / 60000) : 0;
}
