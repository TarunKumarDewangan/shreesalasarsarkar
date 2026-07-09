<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\BacklogInstallment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CashbookController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;

        $startDate = $request->input('start_date') ?: Carbon::today()->startOfMonth()->toDateString();
        $endDate = $request->input('end_date') ?: Carbon::today()->endOfMonth()->toDateString();
        $type = strtolower($request->input('type', 'combine')); // combine, new, backlog

        // 1. Calculate Opening Balance (collections before $startDate)
        $openingBalance = 0;
        
        if ($type === 'combine' || $type === 'new') {
            // Active
            $activeOpening = Installment::where('status', 'PAID')
                ->where('paid_date', '<', $startDate)
                ->whereHas('loan.borrower', function($q) use ($user, $effectiveOwnerId) {
                    if (!$user->isAdmin()) {
                        $q->where('financer_id', $effectiveOwnerId);
                    }
                })
                ->sum('amount_paid');
            $openingBalance += $activeOpening;
        }

        if ($type === 'combine' || $type === 'backlog') {
            // Backlog data is single-tenant; cbcode is a legacy branch label, not a per-financer key.
            $backlogOpening = BacklogInstallment::where('status', 'PAID')
                ->where('payment_date', '<', $startDate)
                ->sum('paid_amount');
            $openingBalance += $backlogOpening;
        }

        $rows = [];

        if ($type === 'combine' || $type === 'new') {
            // 2. Fetch Active Collections within period
            $activeCollections = Installment::where('status', 'PAID')
                ->whereBetween('paid_date', [$startDate, $endDate])
                ->whereHas('loan.borrower', function($q) use ($user, $effectiveOwnerId) {
                    if (!$user->isAdmin()) {
                        $q->where('financer_id', $effectiveOwnerId);
                    }
                })
                ->with(['loan.borrower.vehicle'])
                ->get();

            foreach ($activeCollections as $ins) {
                $borrower = $ins->loan->borrower;
                $vehicleNo = $borrower->vehicle?->vehicle_no ?: ($borrower->vehicle?->reg_no ?: '');
                
                $nameStr = strtoupper(trim($borrower->name));
                if ($borrower->father_name) {
                    $nameStr .= ' ' . strtoupper(trim($borrower->father_name));
                }
                if ($vehicleNo) {
                    $nameStr .= ' ' . strtoupper(trim($vehicleNo));
                }

                $paid = Carbon::parse($ins->paid_date);
                $due = Carbon::parse($ins->due_date);
                $lateDays = $due->diffInDays($paid, false);

                $rows[] = [
                    'date' => $ins->paid_date,
                    'particulars' => $nameStr,
                    'detail' => sprintf(
                        "Instalment @: %.2f, Due Date: %s, IM: %d, Late Days: %d",
                        $ins->amount_due,
                        Carbon::parse($ins->due_date)->format('d/m/Y'),
                        $ins->im ?: 1,
                        $lateDays
                    ),
                    'mode' => 'Instalment',
                    'method' => $ins->method ?: 'CASH',
                    'debit' => (float)$ins->amount_paid,
                    'credit' => 0.0
                ];
            }
        }

        if ($type === 'combine' || $type === 'backlog') {
            // 3. Fetch Backlog Collections within period
            $backlogCollections = BacklogInstallment::where('status', 'PAID')
                ->whereBetween('payment_date', [$startDate, $endDate])
                ->with('account')
                ->get();

            foreach ($backlogCollections as $ins) {
                $account = $ins->account;
                if (!$account) continue;

                $vehicleNo = $account->vehicle_no ?: 'OLD';
                $nameStr = strtoupper(trim($account->customer_name));
                if ($account->father_name) {
                    $nameStr .= ' ' . strtoupper(trim($account->father_name));
                }
                if ($vehicleNo) {
                    $nameStr .= ' ' . strtoupper(trim($vehicleNo));
                }

                $paid = Carbon::parse($ins->payment_date);
                $due = Carbon::parse($ins->due_date);
                $lateDays = $due->diffInDays($paid, false);

                $rows[] = [
                    'date' => $ins->payment_date,
                    'particulars' => $nameStr,
                    'detail' => sprintf(
                        "Instalment @: %.2f, Due Date: %s, IM: %d, Late Days: %d",
                        $ins->installment_amount ?: 0,
                        Carbon::parse($ins->due_date)->format('d/m/Y'),
                        $ins->im ?: 1,
                        $lateDays
                    ),
                    'mode' => 'Instalment',
                    'method' => $ins->mode ?: 'CASH',
                    'debit' => (float)$ins->paid_amount,
                    'credit' => 0.0
                ];
            }
        }

        // 4. Sort rows by date, then particulars
        usort($rows, function($a, $b) {
            $cmp = strcmp($a['date'], $b['date']);
            if ($cmp === 0) {
                return strcmp($a['particulars'], $b['particulars']);
            }
            return $cmp;
        });

        // Format dates in returned list to d/m/Y
        foreach ($rows as &$r) {
            $r['date'] = Carbon::parse($r['date'])->format('d/m/Y');
        }

        $totalReceipts = array_sum(array_column($rows, 'debit'));
        $closingBalance = $openingBalance + $totalReceipts;

        return response()->json([
            'opening_balance' => $openingBalance,
            'total_receipts' => $totalReceipts,
            'closing_balance' => $closingBalance,
            'transactions' => $rows,
        ]);
    }
}
