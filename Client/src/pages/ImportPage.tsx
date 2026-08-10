import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import DataGrid, { Column, RenderCellProps } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { AiOutlineCloudUpload, AiOutlineDelete } from 'react-icons/ai';

import { Button, Card, Input, Select } from '../components/ui';
import { useAuth } from '../provider/AuthProvider';
import { useRecord } from '../provider/RecordDataProvider';
import { fetchCategories, addCategory } from '../apis/category';
import { createWallet } from '../apis/wallet';
import { bulkCreateRecords } from '../apis/import';
import { ICategory, TCategoryType } from '../types';
import { currencyList } from '../utils';
import { EIconName } from '../common/icon-name.enum';

// --- Spreadsheet parsing helpers ---------------------------------------

type SheetKind = 'expense' | 'income';

type UploadedFile = {
  fileName: string;
  header: string[];
  dataRows: string[][];
  dateCol: number;
  descCol: number;
  amountCol: number;
  categoryCol: number;
};

type ImportRow = {
  id: string;
  type: SheetKind;
  date: string;
  description: string;
  amount: number;
  categoryName: string;
};

async function readSheetAsRows(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });
  return rows.map((row) => row.map((cell) => String(cell ?? '').trim()));
}

// Copying cells out of Google Sheets/Excel and pasting as plain text yields
// tab-separated rows (not comma-separated) - split on that directly rather
// than routing through XLSX's CSV parser, which assumes commas. Fully blank
// lines (Google Sheets exports pad rows with a lot of trailing empty
// columns, which paste as a line of nothing but tabs) are dropped up front
// so the first *real* line is what becomes the header.
function parsePastedRows(text: string): string[][] {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.split('\t').map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell !== ''));
}

// Real Google Sheets exports don't reliably label every column (e.g. the
// Date column's header is sometimes blank) - guess by header keyword first,
// then fall back to position, so both real sample files' layouts
// (Date/Expence/Amount/Category, in that order) are picked correctly even
// when the header text doesn't cooperate.
function guessColumnIndex(
  header: string[],
  keywords: string[],
  positionalFallback: number,
): number {
  for (const keyword of keywords) {
    const idx = header.findIndex((h) => h.toLowerCase().includes(keyword));
    if (idx !== -1) return idx;
  }
  return Math.min(positionalFallback, Math.max(header.length - 1, 0));
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^0-9.-]/g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

// Handles DD/MM/YYYY (both real sample files' date format) as well as
// already-ISO YYYY-MM-DD (e.g. after a user edits the date in the grid).
function parseDateToISO(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return trimmed;
}

// Both real sample files only write the date on the first transaction of
// each day, leaving it blank on the rows below - carry the last-seen date
// forward instead of dropping those rows.
function buildImportRows(file: UploadedFile, type: SheetKind): ImportRow[] {
  const rows: ImportRow[] = [];
  let lastDate = '';

  file.dataRows.forEach((row, index) => {
    const rawDate = row[file.dateCol] ?? '';
    const description = (row[file.descCol] ?? '').trim();
    const amountRaw = row[file.amountCol] ?? '';
    const categoryName = (row[file.categoryCol] ?? '').trim();

    if (!description && !amountRaw.trim()) return; // blank divider row

    const date = rawDate.trim() ? parseDateToISO(rawDate) : lastDate;
    if (rawDate.trim()) lastDate = date;

    rows.push({
      id: `${type}-${index}`,
      type,
      date,
      description,
      amount: parseAmount(amountRaw),
      categoryName,
    });
  });

  return rows;
}

// Shared by both the file-upload and paste-rows input paths - once we have
// rows of raw strings (however they got here), turning them into an
// UploadedFile is identical.
function buildUploadedFile(sourceName: string, allRows: string[][]): UploadedFile {
  const [header = [], ...dataRows] = allRows;

  const dateCol = guessColumnIndex(header, ['date'], 0);
  const descCol = guessColumnIndex(
    header,
    ['expence', 'expense', 'description', 'payee', 'remarks'],
    1,
  );
  const amountCol = guessColumnIndex(header, ['amount', 'price'], 2);
  const categoryCol = guessColumnIndex(header, ['categ'], 3);

  return {
    fileName: sourceName,
    header,
    dataRows,
    dateCol,
    descCol,
    amountCol,
    categoryCol,
  };
}

function suggestWalletName(fileNames: string[]): string {
  const name = fileNames[0] ?? '';
  return name
    .replace(/\.(csv|xlsx?|xls)$/i, '')
    .replace(/\s*-\s*(Expenses?|Income)\s*$/i, '')
    .trim() || 'Imported';
}

const normalize = (value: string) => value.trim().toLowerCase();

// --- Component -----------------------------------------------------------

type Step = 'upload' | 'review' | 'destination';

const ImportPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { wallets = [] } = useRecord();

  const [step, setStep] = useState<Step>('upload');
  const [expenseFile, setExpenseFile] = useState<UploadedFile | null>(null);
  const [incomeFile, setIncomeFile] = useState<UploadedFile | null>(null);
  // Per-type choice between uploading a file and pasting rows straight out
  // of Google Sheets/Excel, plus the in-progress paste text for each.
  const [inputMode, setInputMode] = useState<Record<SheetKind, 'file' | 'paste'>>({
    expense: 'file',
    income: 'file',
  });
  const [pasteText, setPasteText] = useState<Record<SheetKind, string>>({
    expense: '',
    income: '',
  });
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, number>>(new Map());

  const [walletMode, setWalletMode] = useState<'existing' | 'new'>('existing');
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(
    wallets[0]?.id ?? null,
  );
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletCurrency, setNewWalletCurrency] = useState('LKR');

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const handleFileChange = async (file: File | undefined, type: SheetKind) => {
    if (!file) return;
    const allRows = await readSheetAsRows(file);
    const uploaded = buildUploadedFile(file.name, allRows);

    if (type === 'expense') setExpenseFile(uploaded);
    else setIncomeFile(uploaded);
  };

  // Rows pasted straight from Google Sheets/Excel (Ctrl+C there, Ctrl+V into
  // the textarea below) - same column-guessing as an uploaded file, just
  // skipping the file-picker/XLSX-parsing step entirely.
  const handlePasteRows = (text: string, type: SheetKind) => {
    const allRows = parsePastedRows(text);
    if (allRows.length === 0) return;
    const uploaded = buildUploadedFile(`Pasted ${type} rows`, allRows);

    if (type === 'expense') setExpenseFile(uploaded);
    else setIncomeFile(uploaded);
  };

  const columnOptions = (file: UploadedFile) =>
    file.header.map((h, i) => `${i}: ${h || '(blank)'}`);

  const columnOptionToIndex = (option: string) => Number(option.split(':')[0]);

  const updateFileMapping = (
    type: SheetKind,
    field: 'dateCol' | 'descCol' | 'amountCol' | 'categoryCol',
    option: string,
  ) => {
    const index = columnOptionToIndex(option);
    const setter = type === 'expense' ? setExpenseFile : setIncomeFile;
    setter((prev) => (prev ? { ...prev, [field]: index } : prev));
  };

  const goToReview = () => {
    const combined = [
      ...(expenseFile ? buildImportRows(expenseFile, 'expense') : []),
      ...(incomeFile ? buildImportRows(incomeFile, 'income') : []),
    ];
    setRows(combined);

    // Auto-match every distinct category name (case-insensitive/trimmed)
    // against the user's existing categories of the matching type.
    const initialMap = new Map<string, number>();
    combined.forEach((row) => {
      const key = `${row.type}:${normalize(row.categoryName)}`;
      if (initialMap.has(key)) return;
      const match = categories.find(
        (c) => c.type === row.type && normalize(c.name) === normalize(row.categoryName),
      );
      if (match) initialMap.set(key, match.id);
    });
    setCategoryMap(initialMap);
    setStep('review');
  };

  const unresolvedCategories = useMemo(() => {
    const seen = new Set<string>();
    const list: { key: string; name: string; type: SheetKind }[] = [];
    rows.forEach((row) => {
      const key = `${row.type}:${normalize(row.categoryName)}`;
      if (seen.has(key) || categoryMap.has(key)) return;
      seen.add(key);
      list.push({ key, name: row.categoryName, type: row.type });
    });
    return list;
  }, [rows, categoryMap]);

  const createCategoryMutation = useMutation<
    ICategory,
    AxiosError<{ message?: string }>,
    { key: string; name: string; type: TCategoryType }
  >({
    mutationFn: ({ name, type }) =>
      addCategory({ name, icon: EIconName.MONEY, type, enable: true, userId: userId! }),
    onSuccess: (created, variables) => {
      setCategoryMap((prev) => new Map(prev).set(variables.key, created.id));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast(error.response?.data.message ?? 'Could not create category', { type: 'error' });
    },
  });

  const rowsReady = rows.length > 0 && unresolvedCategories.length === 0;

  const createWalletMutation = useMutation({
    mutationFn: createWallet,
  });

  const bulkCreateMutation = useMutation<
    unknown,
    AxiosError<{ message?: string }>,
    { walletId: number; rows: ImportRow[] }
  >({
    mutationFn: ({ walletId, rows: importRows }) =>
      bulkCreateRecords({
        walletId,
        rows: importRows.map((row) => ({
          price: row.amount,
          date: row.date,
          remarks: row.description || undefined,
          categoryId: categoryMap.get(`${row.type}:${normalize(row.categoryName)}`)!,
        })),
      }),
    onSuccess: () => {
      toast(`Imported ${rows.length} record${rows.length === 1 ? '' : 's'}`, {
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      navigate('/records');
    },
    onError: (error) => {
      toast(error.response?.data.message ?? 'Import failed', { type: 'error' });
    },
  });

  const handleConfirmImport = async () => {
    let walletId = selectedWalletId;

    if (walletMode === 'new') {
      if (!newWalletName.trim()) {
        toast('Enter a name for the new wallet', { type: 'error' });
        return;
      }
      try {
        const created = await createWalletMutation.mutateAsync({
          name: newWalletName.trim(),
          currency: newWalletCurrency,
          userId: userId!,
        });
        walletId = created.id;
      } catch (error) {
        toast('Could not create the wallet', { type: 'error' });
        return;
      }
    }

    if (!walletId) {
      toast('Pick a wallet to import into', { type: 'error' });
      return;
    }

    bulkCreateMutation.mutate({ walletId, rows });
  };

  // --- react-data-grid columns ---------------------------------------

  const gridColumns: Column<ImportRow>[] = [
    {
      key: 'type',
      name: 'Type',
      width: 80,
      renderCell: ({ row }: RenderCellProps<ImportRow>) => (
        <span
          className={
            row.type === 'expense'
              ? 'text-danger-600 dark:text-danger-400 text-xs font-bold'
              : 'text-success-600 dark:text-success-400 text-xs font-bold'
          }
        >
          {row.type === 'expense' ? 'Expense' : 'Income'}
        </span>
      ),
    },
    { key: 'date', name: 'Date', editable: true, width: 110 },
    { key: 'description', name: 'Description', editable: true },
    {
      key: 'amount',
      name: 'Amount',
      editable: true,
      width: 100,
      renderCell: ({ row }: RenderCellProps<ImportRow>) => row.amount.toFixed(2),
    },
    { key: 'categoryName', name: 'Category', editable: true, width: 140 },
    {
      key: 'actions',
      name: '',
      width: 40,
      renderCell: ({ row }: RenderCellProps<ImportRow>) => (
        <button
          type="button"
          aria-label="Remove row"
          className="text-zinc-400 hover:text-danger-600"
          onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
        >
          <AiOutlineDelete />
        </button>
      ),
    },
  ];

  // --- Render ----------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          Import from spreadsheet
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Upload a Google Sheets/Excel export of your expenses and/or income - review and fix
          anything before it becomes real records.
        </p>
      </div>

      {step === 'upload' && (
        <Card className="flex flex-col gap-4">
          {(['expense', 'income'] as const).map((type) => {
            const uploaded = type === 'expense' ? expenseFile : incomeFile;
            return (
              <div key={type} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200 capitalize">
                    {type} {inputMode[type] === 'file' ? 'file (.csv, .xlsx)' : 'rows'}
                  </label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant={inputMode[type] === 'file' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode((prev) => ({ ...prev, [type]: 'file' }))}
                    >
                      Upload file
                    </Button>
                    <Button
                      type="button"
                      variant={inputMode[type] === 'paste' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode((prev) => ({ ...prev, [type]: 'paste' }))}
                    >
                      Paste rows
                    </Button>
                  </div>
                </div>

                {inputMode[type] === 'file' ? (
                  <label className="flex items-center gap-2 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 w-fit">
                    <AiOutlineCloudUpload className="text-xl text-primary-600" />
                    <span className="text-sm">
                      {uploaded ? uploaded.fileName : `Choose ${type} file`}
                    </span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files?.[0], type)}
                    />
                  </label>
                ) : (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full h-28 text-sm font-mono border border-zinc-300 dark:border-zinc-600 rounded-xl p-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
                      placeholder={`Select the rows in Google Sheets (including the header row), copy, then paste here…`}
                      value={pasteText[type]}
                      onChange={(e) =>
                        setPasteText((prev) => ({ ...prev, [type]: e.target.value }))
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!pasteText[type].trim()}
                        onClick={() => handlePasteRows(pasteText[type], type)}
                      >
                        Parse pasted rows
                      </Button>
                      {uploaded && uploaded.fileName.startsWith('Pasted') && (
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {uploaded.dataRows.length} row{uploaded.dataRows.length === 1 ? '' : 's'}{' '}
                          parsed
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {uploaded && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    <Select
                      label="Date column"
                      options={columnOptions(uploaded)}
                      value={columnOptions(uploaded)[uploaded.dateCol]}
                      onChange={(v) => updateFileMapping(type, 'dateCol', v)}
                    />
                    <Select
                      label="Description column"
                      options={columnOptions(uploaded)}
                      value={columnOptions(uploaded)[uploaded.descCol]}
                      onChange={(v) => updateFileMapping(type, 'descCol', v)}
                    />
                    <Select
                      label="Amount column"
                      options={columnOptions(uploaded)}
                      value={columnOptions(uploaded)[uploaded.amountCol]}
                      onChange={(v) => updateFileMapping(type, 'amountCol', v)}
                    />
                    <Select
                      label="Category column"
                      options={columnOptions(uploaded)}
                      value={columnOptions(uploaded)[uploaded.categoryCol]}
                      onChange={(v) => updateFileMapping(type, 'categoryCol', v)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end">
            <Button
              variant="primary"
              disabled={!expenseFile && !incomeFile}
              onClick={goToReview}
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

      {step === 'review' && (
        <div className="flex flex-col gap-4">
          <Card padding="none" className="overflow-hidden">
            <DataGrid
              columns={gridColumns}
              rows={rows}
              rowKeyGetter={(row: ImportRow) => row.id}
              onRowsChange={setRows}
              className="rdg-light dark:rdg-dark"
              style={{ blockSize: Math.min(420, 40 + rows.length * 35) }}
            />
          </Card>

          {unresolvedCategories.length > 0 && (
            <Card className="flex flex-col gap-2">
              <p className="font-medium text-zinc-800 dark:text-zinc-100">
                Some categories in your sheet don't match your existing categories yet
              </p>
              {unresolvedCategories.map((item) => {
                const existingOfType = categories.filter((c) => c.type === item.type);
                return (
                  <div
                    key={item.key}
                    className="flex flex-wrap items-center gap-2 justify-between border-b border-zinc-100 dark:border-zinc-700 pb-2"
                  >
                    <span className="text-sm">
                      "{item.name || '(blank)'}" ·{' '}
                      <span className="text-zinc-500">{item.type}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {existingOfType.length > 0 && (
                        <Select
                          className="w-48"
                          placeholder="Map to existing…"
                          options={existingOfType.map((c) => c.name)}
                          value=""
                          onChange={(name) => {
                            const match = existingOfType.find((c) => c.name === name);
                            if (match) {
                              setCategoryMap((prev) => new Map(prev).set(item.key, match.id));
                            }
                          }}
                        />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={createCategoryMutation.isPending}
                        onClick={() =>
                          createCategoryMutation.mutate({
                            key: item.key,
                            name: item.name || 'Imported',
                            type: item.type,
                          })
                        }
                      >
                        Create new
                      </Button>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button variant="primary" disabled={!rowsReady} onClick={() => setStep('destination')}>
              Continue ({rows.length} row{rows.length === 1 ? '' : 's'})
            </Button>
          </div>
        </div>
      )}

      {step === 'destination' && (
        <Card className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              variant={walletMode === 'existing' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setWalletMode('existing')}
              disabled={wallets.length === 0}
            >
              Existing wallet
            </Button>
            <Button
              variant={walletMode === 'new' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setWalletMode('new')}
            >
              New wallet
            </Button>
          </div>

          {walletMode === 'existing' ? (
            <Select
              label="Wallet"
              options={wallets.map((w) => `${w.name} (${w.currency})`)}
              value={
                wallets.find((w) => w.id === selectedWalletId)
                  ? `${wallets.find((w) => w.id === selectedWalletId)!.name} (${wallets.find((w) => w.id === selectedWalletId)!.currency})`
                  : ''
              }
              onChange={(v) => {
                const match = wallets.find((w) => `${w.name} (${w.currency})` === v);
                if (match) setSelectedWalletId(match.id);
              }}
            />
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                label="Wallet name"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                placeholder={suggestWalletName([
                  expenseFile?.fileName ?? '',
                  incomeFile?.fileName ?? '',
                ])}
              />
              <Select
                label="Currency"
                options={currencyList}
                value={newWalletCurrency}
                onChange={setNewWalletCurrency}
                filter
              />
            </div>
          )}

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {rows.length} record{rows.length === 1 ? '' : 's'} will be created.
          </p>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep('review')}>
              Back
            </Button>
            <Button
              variant="primary"
              isLoading={bulkCreateMutation.isPending || createWalletMutation.isPending}
              onClick={handleConfirmImport}
            >
              Import
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImportPage;
