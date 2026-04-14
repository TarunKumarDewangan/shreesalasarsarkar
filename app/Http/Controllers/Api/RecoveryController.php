<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recovery;
use Illuminate\Http\Request;

class RecoveryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Recovery::with(['borrower', 'staff', 'installment']);

        if ($user->isStaff()) {
            $query->where('staff_id', $user->id);
        } else if ($user->isFinancer()) {
            $query->where('financer_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->whereHas('borrower', function ($s) use ($q) {
                $s->where('name', 'like', "%{$q}%")
                  ->orWhere('mobile', 'like', "%{$q}%");
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('collection_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('collection_date', '<=', $request->end_date);
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->isStaff()) {
            return response()->json(['message' => 'Only staff can submit recovery'], 403);
        }

        $data = $request->validate([
            'borrower_id'     => 'required|exists:borrowers,id',
            'amount'          => 'required|numeric|min:0',
            'collection_date' => 'required|date',
            'notes'           => 'nullable|string',
            'installment_id'  => 'nullable|exists:installments,id',
            'penalty'         => 'nullable|numeric|min:0',
            'discount'        => 'nullable|numeric|min:0',
            'payment_method'  => 'nullable|string',
            'receipt_no'      => 'nullable|string',
            'paid_date'       => 'nullable|date',
        ]);

        $insId = $data['installment_id'];
        if (!$insId) {
            $borrower = \App\Models\Borrower::find($data['borrower_id']);
            $insId = $borrower->latestLoan?->nextPendingInstallment?->id;
        }

        if ($insId) {
            $exists = Recovery::where('installment_id', $insId)
                ->where('status', 'PENDING')
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'This installment is already sent for scrutiny.'], 422);
            }
        }

        $recovery = Recovery::create([
            'financer_id'     => $user->financer_id,
            'staff_id'        => $user->id,
            'borrower_id'     => $data['borrower_id'],
            'amount'          => $data['amount'],
            'collection_date' => $data['collection_date'],
            'notes'           => $data['notes'] ?? null,
            'status'          => 'PENDING',
            'installment_id'  => $data['installment_id'] ?? null,
            'penalty'         => $data['penalty'] ?? 0,
            'discount'        => $data['discount'] ?? 0,
            'payment_method'  => $data['payment_method'] ?? null,
            'receipt_no'      => $data['receipt_no'] ?? null,
            'paid_date'       => $data['paid_date'] ?? null,
        ]);

        return response()->json($recovery, 201);
    }

    public function approve(Request $request, Recovery $recovery)
    {
        $user = $request->user();
        if (!$user->isFinancer() || $recovery->financer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($recovery->status !== 'PENDING') {
            return response()->json(['message' => 'Already processed'], 422);
        }

        $recovery->update(['status' => 'APPROVED']);

        // Load borrower if not already present
        $borrower = $recovery->borrower ?: \App\Models\Borrower::find($recovery->borrower_id);

        // Auto-link to next pending installment if not specified
        if (!$recovery->installment_id) {
            $activeLoan = \App\Models\Loan::where('borrower_id', $recovery->borrower_id)
                ->where('status', 'ACTIVE')
                ->first();
            
            if ($activeLoan) {
                $next = $activeLoan->nextPendingInstallment;
                if ($next) {
                    $recovery->update(['installment_id' => $next->id]);
                }
            }
        }

        if ($recovery->installment_id) {
            $installment = \App\Models\Installment::find($recovery->installment_id);
            if ($installment && $installment->status !== 'PAID') {
                $receiptNo = $recovery->receipt_no;
                if (! $receiptNo) {
                    $receiptPrefix = 'SSSF';
                    $lastReceipt = \App\Models\Installment::where('receipt_no', 'like', $receiptPrefix . '%')->max('receipt_no');
                    $nextNumber = 100;
                    if ($lastReceipt) {
                        $lastNum = (int)str_replace($receiptPrefix, '', $lastReceipt);
                        $nextNumber = $lastNum + 1;
                    }
                    $receiptNo = $receiptPrefix . $nextNumber;
                    $recovery->update(['receipt_no' => $receiptNo]);
                }

                $installment->update([
                    'status'      => 'PAID',
                    'amount_paid' => $recovery->amount,
                    'penalty'     => $recovery->penalty ?? 0,
                    'discount'    => $recovery->discount ?? 0,
                    'paid_date'   => $recovery->paid_date ?? $recovery->collection_date,
                    'method'      => $recovery->payment_method ?? 'CASH',
                    'notes'       => $recovery->notes,
                    'receipt_no'  => $receiptNo
                ]);
                
                $loan = \App\Models\Loan::find($installment->loan_id);
                if ($loan) {
                    $loan->updateStatus();
                }
            }
        }

        $recovery->load(['borrower', 'installment', 'installment.loan']);
        $borrower = $recovery->borrower;
        if ($borrower && $borrower->mobile && $recovery->status === 'APPROVED') {
            $installment = $recovery->installment;
            if ($installment) {
                $installment->sendPaymentWhatsApp();
            }
        }

        return response()->json($recovery);
    }

    public function reject(Request $request, Recovery $recovery)
    {
        $user = $request->user();
        if (!$user->isFinancer() || $recovery->financer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $recovery->update(['status' => 'REJECTED']);
        return response()->json($recovery);
    }
}
