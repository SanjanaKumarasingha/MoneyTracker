import { DateTime } from 'luxon';
import { GroupByScale } from './group-scale.enum';

const formatDate = (date: string, type: GroupByScale) => {
  switch (type) {
    case GroupByScale.MONTH:
      return DateTime.fromSQL(date).toFormat('yyyyLL');

    case GroupByScale.QUARTER:
      return DateTime.fromSQL(date).toFormat('yyyyqq');

    case GroupByScale.WEEK:
      return DateTime.fromSQL(date).toFormat('kkkkWW');

    case GroupByScale.YEAR:
      return DateTime.fromSQL(date).toFormat('yyyy');

    default:
      return date;
  }
};

const displayDate = (date: string, type: GroupByScale) => {
  switch (type) {
    case GroupByScale.MONTH:
      return DateTime.fromFormat(date, 'yyyyLL').toFormat('LLL yyyy');

    case GroupByScale.QUARTER:
      return DateTime.fromFormat(date, 'yyyyqq').toFormat("'Quarter' qq yyyy");

    case GroupByScale.WEEK:
      return DateTime.fromFormat(date, 'kkkkWW').toFormat("'Week' WW yyyy");

    case GroupByScale.YEAR:
      return date;

    case GroupByScale.DATE:
      return DateTime.fromSQL(date).toLocaleString(DateTime.DATE_MED);
    default:
      return date;
  }
};

export { formatDate, displayDate };
