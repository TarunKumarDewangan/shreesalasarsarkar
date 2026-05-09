<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\Loan;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class InstallmentController extends Controller
{
    public function index(Request $request, Loan $loan)
    {
        $this->authorize('view', $loan);
        $installments = $loan->installments()
            ->withCount(['recoveries as pending_recovery_count' => function($q) {
                $q->where('status', 'PENDING');
            }])
            ->orderBy('due_date')
            ->get();
            
        return response()->json($installments);
    }

    public function markPaid(Request $request, Installment $installment)
    {
        $this->authorize('update', $installment->loan);

        $data = $request->validate([
            'paid_date'        => 'required|date',
            'penalty'          => 'nullable|numeric|min:0',
            'discount'         => 'nullable|numeric|min:0',
            'method'           => 'required|string|max:50',
            'notes'            => 'nullable|string',
            'receipt_no'       => 'nullable|string|max:50',
            'amount_collected' => 'nullable|numeric|min:0',
            'strategy'         => 'nullable|string', // 'BAL' or 'AUTO_SPLIT'
            'principal_amount' => 'nullable|numeric',
            'interest_amount'  => 'nullable|numeric',
            'cheque_no'        => 'nullable|string',
        ]);

        $user       = $request->user();
        $financerId = $user->isStaff() ? $user->financer_id : $user->id;

        \App\Models\PaymentMethod::firstOrCreate([
            'financer_id' => $financerId,
            'name'        => strtoupper($data['method'])
        ]);

        $penalty  = (float)($data['penalty']  ?? 0);
        $discount = (float)($data['discount'] ?? 0);

        $amountCollected = isset($data['amount_collected']) && $data['amount_collected'] > 0
            ? (float)$data['amount_collected']
            : (float)$installment->amount_due + $penalty - $discount;

        $amountDue = (float)$installment->amount_due;
        $netDue    = $amountDue + $penalty - $discount;

        // ── Helper: find the next truly unused receipt number ──────────────
        $generateReceipt = function() {
            $prefix = 'SSSF';
            $last   = \App\Models\Installment::where('receipt_no', 'like', $prefix . '%')
                        ->orderByRaw('CAST(SUBSTRING(receipt_no, 5) AS UNSIGNED) DESC')
                        ->lockForUpdate()
                        ->value('receipt_no');
            
            $nextNum = 100;
            if ($last) {
                $lastNum = (int)substr($last, strlen($prefix));
                $nextNum = $lastNum + 1;
            }
            
            return $prefix . $nextNum;
        };

        // ── Wrap everything in a transaction so partial failures roll back ──
        return \Illuminate\Support\Facades\DB::transaction(function() use (
            $installment, $data, $penalty, $discount, $amountCollected,
            $amountDue, $netDue, $generateReceipt, $request, $user
        ) {
            $strategy = $data['strategy'] ?? 'AUTO_SPLIT';
            $receiptNo = !empty($data['receipt_no']) ? $data['receipt_no'] : $generateReceipt();

            // Mark this installment PAID
            $installment->update([
                'status'           => 'PAID',
                'paid_date'        => $data['paid_date'],
                'amount_paid'      => ($strategy === 'BAL') ? $amountCollected : min($amountCollected, $netDue),
                'principal_amount' => $data['principal_amount'] ?? $installment->principal_amount,
                'interest_amount'  => $data['interest_amount'] ?? $installment->interest_amount,
                'penalty'          => $penalty,
                'discount'         => $discount,
                'receipt_no'       => $receiptNo,
                'method'           => strtoupper($data['method']),
                'notes'            => ($data['notes'] ?? '') . ($data['cheque_no'] ? " | Cheque: {$data['cheque_no']}" : ""),
            ]);

            // Cascade excess to next pending installments ONLY IF strategy is AUTO_SPLIT
            $excess = $amountCollected - $netDue;
            if ($excess > 0.5 && $strategy !== 'BAL') {
                $nextInstallments = $installment->loan->installments()
                    ->where('status', '!=', 'PAID')
                    ->where('id', '!=', $installment->id)
                    ->orderBy('due_date', 'asc')
                    ->get();
                
                $suffixCounter = 1;

                foreach ($nextInstallments as $next) {
                    if ($excess <= 0.5) break;
                    $nextDue = (float)$next->amount_due;

                    if ($excess >= $nextDue) {
                        $autoReceipt = $receiptNo . '-' . $suffixCounter;
                        $suffixCounter++;
                        
                        $next->update([
                            'status'      => 'PAID',
                            'paid_date'   => $data['paid_date'],
                            'amount_paid' => $nextDue,
                            'penalty'     => 0,
                            'discount'    => 0,
                            'method'      => strtoupper($data['method']),
                            'receipt_no'  => $autoReceipt,
                            'notes'       => 'Auto-paid from excess (ref: ' . $receiptNo . ')',
                        ]);
                        $excess -= $nextDue;
                    } else {
                        $next->update([
                            'notes' => "Advance ₹" . number_format($excess, 2) . " received | Remaining: ₹" . number_format($nextDue - $excess, 2),
                        ]);
                        $excess = 0;
                    }
                }
            }


            if ($request->boolean('send_whatsapp') && $installment->loan->borrower?->mobile) {
                $installment->sendPaymentWhatsApp();
            }

            // Clear Dashboard Cache
            $financerId = $user->isStaff() ? $user->financer_id : $user->id;
            Cache::forget("dashboard_stats_{$financerId}");
            if ($user->isStaff()) Cache::forget("dashboard_stats_{$financerId}_{$user->id}");

            AuditLog::log($request, 'INSTALLMENT_PAID', $installment, $data);

            return response()->json($installment->fresh());
        });
    }

    public function markPending(Request $request, Installment $installment)
    {
        $this->authorize('update', $installment->loan);
        $installment->update([
            'status'      => 'PENDING',
            'paid_date'   => null,
            'amount_paid' => 0,
            'penalty'     => 0,
            'discount'    => 0,
            'method'      => null,
            'receipt_no'  => null,
        ]);

        AuditLog::log($request, 'INSTALLMENT_UNPAID', $installment);

        return response()->json($installment->fresh());
    }


    public function addExtraPayment(Request $request, Loan $loan)
    {
        $this->authorize('update', $loan);

        $data = $request->validate([
            'paid_date'        => 'required|date',
            'due_date'         => 'nullable|date',
            'amount'           => 'required|numeric|min:0',
            'penalty'          => 'nullable|numeric|min:0',
            'discount'         => 'nullable|numeric|min:0',
            'method'           => 'required|string|max:50',
            'notes'            => 'nullable|string',
            'receipt_no'       => 'nullable|string|max:50',
            'cheque_no'        => 'nullable|string',
            'principal_amount' => 'nullable|numeric',
            'interest_amount'  => 'nullable|numeric',
        ]);

        $receiptNo = !empty($data['receipt_no']) ? $data['receipt_no'] : null;
        if (!$receiptNo) {
            $prefix = 'SSSF';
            $last   = \App\Models\Installment::where('receipt_no', 'like', $prefix . '%')
                        ->orderByRaw('CAST(SUBSTRING(receipt_no, 5) AS UNSIGNED) DESC')
                        ->lockForUpdate()
                        ->value('receipt_no');
            $nextNum = 100;
            if ($last) {
                $lastNum = (int)substr($last, strlen($prefix));
                $nextNum = $lastNum + 1;
            }
            $receiptNo = $prefix . $nextNum;
        }

        $installment = $loan->installments()->create([
            'due_date'         => $data['due_date'] ?? $data['paid_date'],
            'amount_due'       => $data['amount'],
            'status'           => 'PAID',
            'paid_date'        => $data['paid_date'],
            'amount_paid'      => $data['amount'],
            'principal_amount' => $data['principal_amount'] ?? 0,
            'interest_amount'  => $data['interest_amount'] ?? 0,
            'penalty'          => $data['penalty'] ?? 0,
            'discount'         => $data['discount'] ?? 0,
            'receipt_no'       => $receiptNo,
            'method'           => strtoupper($data['method']),
            'notes'            => ($data['notes'] ?? '') . ($data['cheque_no'] ? " | Cheque: {$data['cheque_no']}" : ""),
        ]);

        return response()->json($installment);
    }

    public function editPayment(Request $request, Installment $installment)
    {
        $this->authorize('update', $installment->loan);

        $data = $request->validate([
            'paid_date'        => 'required|date',
            'amount_paid'      => 'required|numeric|min:0',
            'penalty'          => 'nullable|numeric|min:0',
            'discount'         => 'nullable|numeric|min:0',
            'method'           => 'required|string|max:50',
            'notes'            => 'nullable|string',
            'receipt_no'       => 'nullable|string|max:50',
            'cheque_no'        => 'nullable|string',
            'principal_amount' => 'nullable|numeric',
            'interest_amount'  => 'nullable|numeric',
            'im'               => 'nullable|integer',
        ]);

        $installment->update([
            'paid_date'        => $data['paid_date'],
            'amount_paid'      => $data['amount_paid'],
            'principal_amount' => $data['principal_amount'] ?? $installment->principal_amount,
            'interest_amount'  => $data['interest_amount'] ?? $installment->interest_amount,
            'penalty'          => $data['penalty'] ?? 0,
            'discount'         => $data['discount'] ?? 0,
            'receipt_no'       => $data['receipt_no'],
            'method'           => strtoupper($data['method']),
            'notes'            => $data['notes'],
            'im'               => $data['im'] ?? $installment->im,
        ]);

        AuditLog::log($request, 'INSTALLMENT_EDITED', $installment, $data);

        return response()->json($installment);
    }

}
