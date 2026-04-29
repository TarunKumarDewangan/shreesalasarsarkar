<?php

namespace App\Imports;

use App\Models\BacklogAccount;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithStartRow;

class BacklogAccountsImport implements ToModel, WithStartRow
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

    public function model(array $row)
    {
        // Skip empty rows or rows without a name
        if (!isset($row[7]) || empty($row[7])) {
            return null;
        }

        $famt = $this->num($row[40] ?? 0);
        $tmonths = $this->num($row[38] ?? 0);
        $interval = $this->num($row[39] ?? 1);
        $inst_amt = $this->num($row[45] ?? 0); // irate / Installment Amount
        
        $agreement_amt = $this->num($row[42] ?? 0);
        $hp_amt = $this->num($row[43] ?? 0);
        
        // Calculate Flat Annual Interest Rate (%) from Installment Amount if possible
        $interest_rate = 0;
        $interest_amt = $this->num($row[41] ?? 0);

        if ($inst_amt > 0 && $tmonths > 0) {
            $total_inst = $tmonths / $interval;
            $calc_total = $inst_amt * $total_inst;
            // Derived Interest Amount = Calculated Total - Finance - Agreement - HP
            $interest_amt = $calc_total - $famt - $agreement_amt - $hp_amt;
            
            if ($famt > 0) {
                $interest_rate = ($interest_amt / $famt) * (12 / $tmonths) * 100;
            }
        } elseif ($famt > 0 && $tmonths > 0) {
            // Fallback to provided interest amount
            $interest_rate = ($interest_amt / $famt) * (12 / $tmonths) * 100;
        }

        return new BacklogAccount([
            'sno'             => $this->num($row[0] ?? null),
            'fno'             => $this->num($row[2] ?? null),
            'pno'             => $this->num($row[3] ?? null),
            'zone'            => $row[4] ?? null,
            'cbcode'          => $row[6] ?? null,
            'customer_name'   => $row[7] ?? null,
            'father_name'     => $row[8] ?? null,
            'mobile'          => $row[15] ?? null,
            'address'         => $row[13] ?? null,
            'guarantor_name'  => $row[18] ?? null,
            'vehicle_model'   => $row[29] ?? null,
            'vehicle_color'   => $row[30] ?? null,
            'chassis_no'      => $row[31] ?? null,
            'engine_no'       => $row[32] ?? null,
            'vehicle_make'    => $row[33] ?? null,
            'vehicle_no'      => $row[34] ?? null,
            'total_months'    => $tmonths,
            'interval'        => $interval,
            'finance_amount'  => $famt,
            'agreement_amount'=> $agreement_amt,
            'hp_amount'       => $hp_amt,
            'interest_amount' => $interest_amt,
            'total_amount'    => $this->num($row[44] ?? ($famt + $interest_amt + $agreement_amt + $hp_amt)),
            'interest_rate'   => round($interest_rate, 2),
            'installment_amount' => $inst_amt,
            'type'            => $this->type,
            'is_active'       => true,
        ]);
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
}
