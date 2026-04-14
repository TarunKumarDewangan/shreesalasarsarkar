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
        $this->authorizeAccess($request, $loan);
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
        $this->authorizeAccess($request, $installment->loan);

        $data = $request->validate([
            'paid_date'  => 'required|date',
            'penalty'    => 'nullable|numeric|min:0',
            'discount'   => 'nullable|numeric|min:0',
            'method'     => 'required|string|max:50',
            'notes'      => 'nullable|string',
            'receipt_no' => 'nullable|string|max:50',
        ]);

        // Auto-save the payment method if it's new
        $user = $request->user();
        $financerId = $user->isStaff() ? $user->financer_id : $user->id;
        
        \App\Models\PaymentMethod::firstOrCreate([
            'financer_id' => $financerId,
            'name' => strtoupper($data['method'])
        ]);

        $penalty  = $data['penalty']  ?? 0;
        $discount = $data['discount'] ?? 0;
        $amountPaid = $installment->amount_due + $penalty - $discount;

        $receiptNo = $data['receipt_no'] ?? null;

        if (! $receiptNo) {
            // Generate dynamic Receipt No: SSSF + 100 base count
            $receiptPrefix = 'SSSF';
            $lastReceipt = \App\Models\Installment::where('receipt_no', 'like', $receiptPrefix . '%')->max('receipt_no');
            $nextNumber = 100;
            if ($lastReceipt) {
                $lastNum = (int)str_replace($receiptPrefix, '', $lastReceipt);
                $nextNumber = $lastNum + 1;
            }
            $receiptNo = $receiptPrefix . $nextNumber;
        }

        $installment->update(array_merge($data, [
            'status'      => 'PAID',
            'amount_paid' => $amountPaid,
            'penalty'     => $penalty,
            'discount'    => $discount,
            'receipt_no'  => $receiptNo,
            'method'      => strtoupper($data['method'])
        ]));

        if ($request->boolean('send_whatsapp') && $installment->loan->borrower?->mobile) {
            $installment->sendPaymentWhatsApp();
        }

        return response()->json($installment->fresh());
    }

    public function markPending(Request $request, Installment $installment)
    {
        $this->authorizeAccess($request, $installment->loan);
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

    private function authorizeAccess(Request $request, Loan $loan): void
    {
        $user = $request->user();
        if ($user->isAdmin()) return;

        $ownerId = $user->isStaff() ? $user->financer_id : $user->id;
        if ($loan->financer_id !== $ownerId) {
            abort(403, 'Access denied.');
        }
    }
}
