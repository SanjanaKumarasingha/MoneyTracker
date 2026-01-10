import { useQuery } from '@tanstack/react-query';
import React, { useContext, useMemo, useState } from 'react';
import { fetchWallets } from '../apis/wallet';
import {
  ICategory,
  IGroupByCategoryRecord,
  IRecordWithCategory,
  IWalletRecordWithCategory,
} from '../types';
import { useAppSelector } from '../hooks';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { GroupByScale } from '../common/group-scale.enum';
import { displayDate, formatDate } from '../common/format-date';
import { useAuth } from './AuthProvider';

interface ProviderValue {
  wallets: IWalletRecordWithCategory[];
  favWallet?: IWalletRecordWithCategory;
  income: number;
  expense: number;
  total: number;
  dateRecords: {
    date: string;
    records: IRecordWithCategory[];
  }[];
  groupByCategoryRecords: {
    date: string;
    records: IGroupByCategoryRecord | undefined;
  };
  incomeByDate: number;
  expenseByDate: number;
  groupBy: GroupByScale;
  updateGroupingScale: (value: GroupByScale, reset?: boolean) => void;
  updateCurrentDate: (type: 'plus' | 'minus') => void;
  filterForTrend: (
    currentYear: number,
    category?: ICategory,
  ) => {
    date: string;
    income: number;
    expense: number;
  }[];
}

const RecordDataContext = React.createContext<any>({});

export const useRecord = () => {
  return useContext<ProviderValue>(RecordDataContext);
};

export const RecordDateProvider = ({ children }: any) => {
  const { userId } = useAuth();

  const [groupBy, setGroupBy] = useState<GroupByScale>(GroupByScale.ALL);

  const [currentDate, setCurrentDate] = useState<number>(0);

  const { data: wallets } = useQuery<IWalletRecordWithCategory[]>(
    ['wallets', userId],
    () => fetchWallets(userId!),
    { enabled: !!userId },
  );

  const { id } = useAppSelector((state) => state.wallet);

  // Format the date in different format
  const dateGrouping = (scale: GroupByScale, value: IRecordWithCategory[]) => {
    let res;
    switch (scale) {
      case GroupByScale.ALL:
        res = _.toPairs({ ALL: value });
        break;
      case GroupByScale.MONTH:
        res = _.toPairs(
          _.groupBy(value, (r) => {
            return formatDate(r.date, GroupByScale.MONTH);
          }),
        );
        break;
      case GroupByScale.QUARTER:
        res = _.toPairs(
          _.groupBy(value, (r) => {
            return formatDate(r.date, GroupByScale.QUARTER);
          }),
        );
        break;
      case GroupByScale.WEEK:
        res = _.toPairs(
          _.groupBy(value, (r) => {
            return formatDate(r.date, GroupByScale.WEEK);
          }),
        );
        break;
      case GroupByScale.YEAR:
        res = _.toPairs(
          _.groupBy(value, (r) => {
            return formatDate(r.date, GroupByScale.YEAR);
          }),
        );
        break;
      default:
        res = _.toPairs(_.groupBy(value, 'date'));
        break;
    }

    return res;
  };

  // Grouping record by category
  const categoryGrouping = (value: [string, IRecordWithCategory[]][]) => {
    return value.map((groupRecord) => {
      const tmpGrouping = groupRecord[1]?.reduce(
        (acc: IGroupByCategoryRecord, cur) => {
          if (acc[cur.category.type][cur.category.name]) {
            acc[cur.category.type][cur.category.name].push(cur);
          } else {
            acc[cur.category.type][cur.category.name] = [cur];
          }

          return acc;
        },
        { expense: {}, income: {} } as IGroupByCategoryRecord,
      );

      return { date: groupRecord[0], records: tmpGrouping };
    });
  };

  // Filter the records by date
  const filterByScale = (
    value: {
      date: string;
      records: IGroupByCategoryRecord;
    }[],
    scale: GroupByScale,
    now: DateTime,
  ) => {
    let incomeByDate = 0;
    let expenseByDate = 0;
    const tmpFilter = value
      .filter(
        (gbcr) => gbcr.date === formatDate(now.toFormat('yyyy-LL-dd'), scale),
      )
      .map((t) => {
        Object.values(t.records?.expense ?? {}).forEach((exp) => {
          exp.forEach((e) => {
            expenseByDate += Number(e.price);
          });
        });

        Object.values(t.records?.income ?? {}).forEach((inc) => {
          inc.forEach((i) => {
            incomeByDate += Number(i.price);
          });
        });
        return { ...t, date: displayDate(t.date, scale) };
      });

    return { incomeByDate, expenseByDate, filteredResult: tmpFilter };
  };

  const updateGroupingScale = (value: GroupByScale, reset?: boolean) => {
    if (reset) {
      setCurrentDate(0);
    }
    setGroupBy(value);
  };

  const updateCurrentDate = (type: 'plus' | 'minus') => {
    setCurrentDate((prev) => (type === 'plus' ? prev + 1 : prev - 1));
  };

  // Filter the records by current year and use Month for grouping
  const filterForTrend = (currentYear: number, category?: ICategory) => {
    const now = DateTime.now().plus({
      year: currentYear,
    });
    const groupedDateRecord = dateGrouping(
      GroupByScale.MONTH,
      favWallet?.records ?? [],
    );

    const groupDateRecordByCategory = categoryGrouping(groupedDateRecord);

    return groupDateRecordByCategory
      .filter(
        (gbcr) => DateTime.fromFormat(gbcr.date, 'yyyyLL').year === now.year,
      )
      .map((record) => {
        const expense = Object.values(record.records.expense).reduce(
          (acc, cur) => {
            return (
              acc +
              cur.reduce((a, c) => {
                if (category && c.category.name !== category.name) return a;
                return a + Number(c.price);
              }, 0)
            );
          },
          0,
        );
        const income = Object.values(record.records.income).reduce(
          (acc, cur) => {
            return (
              acc +
              cur.reduce((a, c) => {
                if (category && c.category.name !== category.name) return a;
                return a + Number(c.price);
              }, 0)
            );
          },
          0,
        );

        return {
          date: record.date,
          income,
          expense,
        };
      });
  };

  const { favWallet, income, expense, total, dateRecords } = useMemo(() => {
    let tmpWallet;

    if (wallets) {
      if (id === 0) {
        tmpWallet = wallets[0];
      } else {
        tmpWallet = wallets.find((w) => w.id === id);
      }
    }

    const { walletExpense, walletIncome } = tmpWallet?.records?.reduce(
      (i, w) => {
        if (w.category.type === 'income') {
          i.walletIncome += Number(w.price);
        } else {
          i.walletExpense += Number(w.price);
        }
        return i;
      },
      { walletExpense: 0, walletIncome: 0 },
    ) ?? { walletExpense: 0, walletIncome: 0 };

    const groupedDates = _.groupBy(tmpWallet?.records, 'date');

    const dateRecords = _.sortBy(Object.keys(groupedDates)).map((date) => ({
      date,
      records: groupedDates[date],
    }));

    return {
      favWallet: tmpWallet,
      income: walletIncome,
      expense: walletExpense,
      total: walletExpense + walletIncome,
      dateRecords,
    };
  }, [id, wallets]);

  const groupByCategoryAndDateRecords = useMemo(() => {
    return dateGrouping(groupBy, favWallet?.records ?? []);
  }, [groupBy, favWallet]);

  const { groupByCategoryRecords, incomeByDate, expenseByDate } =
    useMemo(() => {
      const tmpGroupingByCategory = categoryGrouping(
        groupByCategoryAndDateRecords,
      );

      const now = DateTime.now().plus({
        year: groupBy === GroupByScale.YEAR ? currentDate : 0,
        quarter: groupBy === GroupByScale.QUARTER ? currentDate : 0,
        month: groupBy === GroupByScale.MONTH ? currentDate : 0,
        week: groupBy === GroupByScale.WEEK ? currentDate : 0,
        day: groupBy === GroupByScale.DATE ? currentDate : 0,
      });

      if (groupBy === GroupByScale.ALL) {
        return {
          incomeByDate: income,
          expenseByDate: expense,
          groupByCategoryRecords: tmpGroupingByCategory[0],
        };
      }
      const { incomeByDate, expenseByDate, filteredResult } = filterByScale(
        tmpGroupingByCategory,
        groupBy,
        now,
      );

      return {
        incomeByDate,
        expenseByDate,
        groupByCategoryRecords:
          filteredResult.length > 0
            ? filteredResult[0]
            : {
                date: displayDate(
                  formatDate(now.toFormat('yyyy-LL-dd'), groupBy),
                  groupBy,
                ),
                records: [],
              },
      };
    }, [groupByCategoryAndDateRecords, groupBy, currentDate, income, expense]);

  return (
    <RecordDataContext.Provider
      value={{
        wallets,
        favWallet,
        income,
        expense,
        total,
        dateRecords,
        groupByCategoryRecords,
        groupBy,
        incomeByDate,
        expenseByDate,
        updateGroupingScale,
        updateCurrentDate,
        filterForTrend,
      }}
    >
      {children}
    </RecordDataContext.Provider>
  );
};
