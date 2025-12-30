import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Утилита для работы с датами в указанном часовом поясе
 * Используется для обеспечения консистентности работы с датами
 * независимо от часового пояса сервера
 */
export class DateTimeZoneUtil {
  /**
   * Получить день недели в указанном часовом поясе
   * @param date - дата (может быть Date, timestamp, или строка)
   * @param timezone - часовой пояс (например, 'Europe/Moscow')
   * @returns день недели (0=воскресенье, 1=понедельник, ..., 6=суббота)
   */
  static getDayOfWeek(date: Date | number | string, timezone: string): number {
    return dayjs(date).tz(timezone).day();
  }

  /**
   * Форматировать дату в строку YYYY-MM-DD в указанном часовом поясе
   */
  static toDateString(date: Date | number | string, timezone: string): string {
    return dayjs(date).tz(timezone).format('YYYY-MM-DD');
  }

  /**
   * Создать дату из строки YYYY-MM-DD в указанном часовом поясе
   * Возвращает Date объект, нормализованный к началу дня в этом часовом поясе
   */
  static fromDateString(dateStr: string, timezone: string): Date {
    return dayjs.tz(dateStr, timezone).startOf('day').toDate();
  }

  /**
   * Нормализовать дату к началу дня в указанном часовом поясе
   */
  static normalizeToStartOfDay(date: Date | number, timezone: string): Date {
    return dayjs(date).tz(timezone).startOf('day').toDate();
  }

  /**
   * Добавить дни к дате в указанном часовом поясе
   */
  static addDays(date: Date | number, days: number, timezone: string): Date {
    return dayjs(date).tz(timezone).add(days, 'day').toDate();
  }

  /**
   * Получить "сегодня" в указанном часовом поясе (начало дня)
   */
  static getToday(timezone: string): Date {
    return dayjs().tz(timezone).startOf('day').toDate();
  }

  /**
   * Проверить, является ли дата сегодняшним днем в указанном часовом поясе
   */
  static isToday(date: Date | number | string, timezone: string): boolean {
    const today = this.getToday(timezone);
    const dateToCheck = dayjs(date).tz(timezone).startOf('day').toDate();
    return dayjs(today).isSame(dateToCheck, 'day');
  }

  /**
   * Сравнить две даты по дню (без учета времени) в указанном часовом поясе
   */
  static isSameDay(
    date1: Date | number | string,
    date2: Date | number | string,
    timezone: string,
  ): boolean {
    return dayjs(date1)
      .tz(timezone)
      .startOf('day')
      .isSame(dayjs(date2).tz(timezone).startOf('day'), 'day');
  }
}

