<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\Loan;
use Illuminate\Http\Request;

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
            $amountDue, $netDue, $generateReceipt, $request
        ) {
            $receiptNo = $data['receipt_no'] ?? $generateReceipt();
            // Mark this installment PAID
            $installment->update([
                'status'      => 'PAID',
                'paid_date'   => $data['paid_date'],
                'amount_paid' => min($amountCollected, $netDue),
                'penalty'     => $penalty,
                'discount'    => $discount,
                'receipt_no'  => $receiptNo,
                'method'      => strtoupper($data['method']),
                'notes'       => $data['notes'] ?? null,
            ]);

            // Cascade excess to next pending installments
            $excess = $amountCollected - $netDue;
            if ($excess > 0.5) {
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
        return response()->json($installment->fresh());
    }


}
