<?php

namespace App\Imports;

use App\Models\BacklogAccount;
use App\Models\BacklogInstallment;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class BacklogInstallmentsImport implements ToModel, WithStartRow, WithBatchInserts, WithChunkReading
{
    protected $type;

    public function __construct($type = 'P')
    {
        $this->type = $type;
    }

    public function startRow(): int
    {
        return 2; // Skip header
    }

    protected static $accountCache = [];

    public function model(array $row)
    {
        $fno = $row[2] ?? null;
        if (!$fno) return null;

        $cacheKey = $this->type . '_' . $fno;
        
        if (!isset(self::$accountCache[$cacheKey])) {
            $account = BacklogAccount::where('fno', $fno)
                                      ->where('type', $this->type)
                                      ->first();
            if (!$account) return null;
            self::$accountCache[$cacheKey] = $account;
        }
        
        $account = self::$accountCache[$cacheKey];

        $paid = $this->num($row[9] ?? 0);
        $balanceAfter = $this->num($row[12] ?? 0);
        
        $totalInt = $account->interest_amount ?? 0;
        $totalMonths = $account->total_months ?? 1;
        $monthlyInt = $totalInt / $totalMonths;
        
        $interestFixed = ceil($monthlyInt);
        $instAmt = $account->installment_amount ?: ($account->total_amount / ($account->total_months ?: 1));
        $principalFixed = round($instAmt - $interestFixed);

        $im = $this->num($row[10] ?? 1);

        return new BacklogInstallment([
            'backlog_account_id' => $account->id,
            'fno'                => $fno,
            'rno'                => $row[3] ?? null,
            'installment_no'     => $this->num($row[4] ?? null),
            'installment_amount' => $this->num($row[5] ?? null),
            'due_date'           => $this->parseDate($row[6] ?? null),
            'paid_amount'        => $paid,
            'im'                 => $im,
            'payment_date'       => $this->parseDate($row[11] ?? null),
            'balance_amount'     => $balanceAfter,
            'delay_days'         => $this->num($row[13] ?? null),
            'mode'               => $row[7] ?? null, // cbcode is the Mode at index 7
            'principal_amount'   => $principalFixed,
            'interest_amount'    => $interestFixed,
            'coverage'           => ($im > 1) ? "$im Months" : "1 Month",
            'status'             => ($paid > 0) ? 'PAID' : 'PENDING',
        ]);
    }

    public function batchSize(): int
    {
        return 1000;
    }

    public function chunkSize(): int
    {
        return 1000;
    }

    private function num($val)
    {
        if ($val === '' || $val === null || is_null($val)) return null;
        if (is_string($val)) {
            $val = str_replace(',', '', $val);
            if (!is_numeric($val)) return null;
        }
        return $val;
    }

    private function parseDate($value)
    {
        if (!$value) return null;
        try {
            // Excel dates are sometimes numeric
            if (is_numeric($value)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
            }
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }
}
