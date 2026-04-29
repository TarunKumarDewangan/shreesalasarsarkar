<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BacklogAccount;
use App\Models\BacklogInstallment;
use App\Imports\BacklogAccountsImport;
use App\Imports\BacklogInstallmentsImport;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class BacklogController extends Controller
{
    public function index(Request $request)
    {
        $query = BacklogAccount::with('installments')->withCount('installments');

        if ($request->search) {
            $query->where('customer_name', 'like', "%{$request->search}%")
                  ->orWhere('fno', 'like', "%{$request->search}%");
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        return response()->json($query->paginate(50));
    }

    public function show($id)
    {
        $account = BacklogAccount::with(['installments' => function($q) {
            $q->orderBy('installment_no', 'asc');
        }])->findOrFail($id);
        
        $summary = [
            'total_amount' => $account->total_amount,
            'total_paid'   => $account->installments->sum('paid_amount'),
            'balance'      => $account->total_amount - $account->installments->sum('paid_amount'),
            'installment_count' => $account->installments->count(),
        ];

        return response()->json([
            'account' => $account,
            'summary' => $summary
        ]);
    }

    public function uploadAccounts(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xls,xlsx,csv',
            'type' => 'required|in:P,F'
        ]);

        Excel::import(new BacklogAccountsImport($request->type), $request->file('file'));

        return response()->json(['message' => 'Accounts imported successfully']);
    }

    public function uploadInstallments(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xls,xlsx,csv',
            'type' => 'required|in:P,F'
        ]);

        Excel::import(new BacklogInstallmentsImport($request->type), $request->file('file'));

        return response()->json(['message' => 'Installments imported successfully']);
    }

    public function addPayment(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'due_date' => 'nullable|date',
            'mode' => 'nullable|string',
            'remarks' => 'nullable|string',
            'rno' => 'nullable|string',
            'principal_amount' => 'nullable|numeric',
            'interest_amount' => 'nullable|numeric',
            'fine_amount' => 'nullable|numeric',
            'exc_amount' => 'nullable|numeric',
            'coverage' => 'nullable|string',
            'rate_per_day' => 'nullable|integer',
        ]);

        $account = BacklogAccount::findOrFail($id);
        
        $lastIns = $account->installments()->orderBy('installment_no', 'asc')->get()->last();
        $nextNo = ($lastIns ? $lastIns->installment_no : 0) + 1;
        
        $totalPaid = $account->installments()->sum('paid_amount');
        $currentBalance = $account->total_amount - $totalPaid;
        $newBalance = $currentBalance - $request->amount;

        $installment = $account->installments()->create([
            'installment_no' => $nextNo,
            'fno' => $account->fno,
            'rno' => $request->rno,
            'due_date' => $request->due_date ?: $request->payment_date,
            'payment_date' => $request->payment_date,
            'installment_amount' => $account->installment_amount ?: ($account->total_amount / ($account->total_months ?: 1)),
            'paid_amount' => $request->amount,
            'principal_amount' => $request->principal_amount,
            'interest_amount' => $request->interest_amount,
            'fine_amount' => $request->fine_amount,
            'exc_amount' => $request->exc_amount,
            'balance_amount' => max(0, $newBalance),
            'mode' => $request->mode ?: 'CASH',
            'status' => 'PAID',
            'coverage' => $request->coverage ?: '1 Month',
            'rate_per_day' => $request->rate_per_day ?: 10,
            'cheque_no' => $request->cheque_no
        ]);

        return response()->json([
            'message' => 'Payment recorded successfully',
            'installment' => $installment
        ]);
    }

    public function updateInstallment(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'due_date' => 'nullable|date',
            'mode' => 'nullable|string',
            'rno' => 'nullable|string',
            'principal_amount' => 'nullable|numeric',
            'interest_amount' => 'nullable|numeric',
            'fine_amount' => 'nullable|numeric',
            'exc_amount' => 'nullable|numeric',
            'coverage' => 'nullable|string',
            'status' => 'nullable|string',
            'rate_per_day' => 'nullable|integer',
        ]);

        $installment = BacklogInstallment::findOrFail($id);
        
        $installment->update([
            'paid_amount' => $request->amount,
            'payment_date' => $request->payment_date,
            'due_date' => $request->due_date ?: $installment->due_date,
            'mode' => $request->mode ?: $installment->mode,
            'rno' => $request->rno,
            'principal_amount' => $request->principal_amount,
            'interest_amount' => $request->interest_amount,
            'fine_amount' => $request->fine_amount,
            'exc_amount' => $request->exc_amount,
            'coverage' => $request->coverage,
            'status' => $request->status ?: 'PAID',
            'rate_per_day' => $request->rate_per_day,
            'cheque_no' => $request->cheque_no
        ]);

        // Recalculate balance for this and subsequent installments
        $this->recalculateBalances($installment->backlog_account_id);

        return response()->json(['message' => 'Installment updated successfully']);
    }

    public function deleteInstallment($id)
    {
        $installment = BacklogInstallment::findOrFail($id);
        $accountId = $installment->backlog_account_id;
        $installment->delete();

        // Recalculate balances and installment numbers
        $this->recalculateBalances($accountId);

        return response()->json(['message' => 'Installment deleted successfully']);
    }

    private function recalculateBalances($accountId)
    {
        $account = BacklogAccount::with('installments')->findOrFail($accountId);
        $installments = $account->installments()->orderBy('due_date', 'asc')->orderBy('id', 'asc')->get();
        
        $currentPaid = 0;
        foreach ($installments as $idx => $ins) {
            $currentPaid += $ins->paid_amount;
            $ins->update([
                'installment_no' => $idx + 1,
                'balance_amount' => max(0, $account->total_amount - $currentPaid)
            ]);
        }
    }

    public function settle(Request $request, $id)
    {
        $request->validate([
            'settlement_amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'mode' => 'nullable|string',
        ]);

        $account = BacklogAccount::findOrFail($id);
        
        $totalPaid = $account->installments()->sum('paid_amount');
        $balance = $account->total_amount - $totalPaid;

        $lastIns = $account->installments()->orderBy('installment_no', 'asc')->get()->last();
        
        $account->installments()->create([
            'installment_no' => ($lastIns ? $lastIns->installment_no : 0) + 1,
            'fno' => $account->fno,
            'due_date' => $request->payment_date,
            'payment_date' => $request->payment_date,
            'installment_amount' => $balance,
            'paid_amount' => $request->settlement_amount,
            'balance_amount' => 0,
            'mode' => $request->mode ?: 'CASH',
        ]);

        $account->type = 'F';
        $account->save();

        return response()->json(['message' => 'Account settled and closed successfully']);
    }

    public function recalculateAll($id)
    {
        $account = BacklogAccount::with('installments')->findOrFail($id);
        
        $totalInt = $account->interest_amount ?? 0;
        $totalMonths = $account->total_months ?? 1;
        $monthlyInt = $totalInt / $totalMonths;
        
        $interestFixed = ceil($monthlyInt); // Roundup
        $instAmt = $account->installment_amount ?: ($account->total_amount / ($account->total_months ?: 1));
        $principalFixed = round($instAmt - $interestFixed);

        $installments = $account->installments()->orderBy('due_date', 'asc')->orderBy('id', 'asc')->get();
        $currentPaid = 0;
        
        foreach ($installments as $idx => $ins) {
            $paid = $ins->paid_amount;
            $currentPaid += $paid;
            
            $ins->update([
                'installment_no' => $idx + 1,
                'principal_amount' => $principalFixed,
                'interest_amount' => $interestFixed,
                'balance_amount' => max(0, $account->total_amount - $currentPaid)
            ]);
        }
        
        return response()->json(['message' => 'All installments recalculated successfully']);
    }

    public function destroy()
    {
        BacklogInstallment::query()->delete();
        BacklogAccount::query()->delete();
        return response()->json(['message' => 'Backlog cleared successfully']);
    }
}
