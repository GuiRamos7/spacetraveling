import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatData = (date: string) => {
  const newDate = new Date(date);

  return format(newDate, 'dd LLL yyy', {
    locale: ptBR,
  });
};
