<?php

namespace App\Helpers;

use App\Models\Installment;
use Illuminate\Support\Facades\DB;

class ReceiptHelper
{
    /**
     * Generate the next unique receipt number in the SSSF series.
     * Uses a database lock to prevent duplicates under concurrent access.
     */
    public static function generateReceiptNo(): string
    {
        $prefix = 'SSSF';
        
        $last = Installment::where('receipt_no', 'like', $prefix . '%')
            ->orderByRaw('CAST(SUBSTRING(receipt_no, 5) AS UNSIGNED) DESC')
            ->lockForUpdate()
            ->value('receipt_no');
        
        $nextNum = 100;
        if ($last) {
            $lastNum = (int) substr($last, strlen($prefix));
            $nextNum = $lastNum + 1;
        }
        
        return $prefix . $nextNum;
    }
}
