<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BacklogAccount;
use App\Models\BacklogInstallment;
use App\Models\AuditLog;
use App\Imports\BacklogAccountsImport;
use App\Imports\BacklogInstallmentsImport;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class BacklogController extends Controller
{
    /**
     * Load a BacklogAccount by id. `cbcode` is an internal legacy branch
     * label carried over from Excel imports, not a per-financer ownership
     * key (this deployment is single-tenant), so no ownership check here.
     */
    private function resolveAccount($id): BacklogAccount
    {
        return BacklogAccount::findOrFail($id);
    }

    /**
     * Load a BacklogInstallment with its account by id.
     */
    private function resolveInstallment($id): BacklogInstallment
    {
        return BacklogInstallment::with('account')->findOrFail($id);
    }

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

    public function show(Request $request, $id)
    {
        $this->resolveAccount($id);

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

        try {
            Excel::import(new BacklogAccountsImport($request->type), $request->file('file'));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Backlog accounts import failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Accounts imported successfully']);
    }

    public function uploadInstallments(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xls,xlsx,csv',
            'type' => 'required|in:P,F'
        ]);

        try {
            Excel::import(new BacklogInstallmentsImport($request->type), $request->file('file'));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Backlog installments import failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 422);
        }

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
            'im' => 'nullable|integer',
        ]);

        $account = $this->resolveAccount($id);

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
            'coverage' => $request->im ? ($request->im . ($request->im > 1 ? ' Months' : ' Month')) : ($request->coverage ?: '1 Month'),
            'rate_per_day' => $request->rate_per_day ?: 10,
            'im' => $request->im ?: 1,
            'cheque_no' => $request->cheque_no
        ]);

        AuditLog::log($request, 'BACKLOG_PAYMENT_ADDED', $installment, $request->all());

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
            'im' => 'nullable|integer',
            'strategy' => 'nullable|string', // 'BAL' or 'AUTO_SPLIT'
        ]);

        $installment = $this->resolveInstallment($id);

        $strategy = $request->strategy ?? 'BAL';
        $paidAmt = (float)$request->amount;
        $emi = (float)$installment->installment_amount;
        
        $installment->update([
            'paid_amount' => ($strategy === 'AUTO_SPLIT') ? $emi : $paidAmt,
            'payment_date' => $request->payment_date,
            'due_date' => $request->due_date ?: $installment->due_date,
            'mode' => $request->mode ?: $installment->mode,
            'rno' => $request->rno,
            'principal_amount' => $request->principal_amount,
            'interest_amount' => $request->interest_amount,
            'fine_amount' => $request->fine_amount,
            'exc_amount' => $request->exc_amount,
            'coverage' => ($strategy === 'AUTO_SPLIT') ? floor($paidAmt / $emi) . ' Months' : ($request->im ? ($request->im . ($request->im > 1 ? ' Months' : ' Month')) : ($request->coverage ?: '1 Month')),
            'status' => $request->status ?: 'PAID',
            'rate_per_day' => $request->rate_per_day,
            'im' => $request->im,
            'cheque_no' => $request->cheque_no
        ]);

        // If AUTO_SPLIT, generate next months
        if ($strategy === 'AUTO_SPLIT' && $paidAmt > $emi) {
            $excess = $paidAmt - $emi;
            $currentDate = Carbon::parse($installment->due_date);
            $payDate = $request->payment_date;
            $rno = $request->rno;
            $suffix = 1;

            while ($excess >= $emi) {
                $currentDate->addMonth();
                $installment->backlogAccount->installments()->create([
                    'fno' => $installment->fno,
                    'installment_no' => 0, // Recalculated later
                    'due_date' => $currentDate->toDateString(),
                    'payment_date' => $payDate,
                    'installment_amount' => $emi,
                    'paid_amount' => $emi,
                    'mode' => $request->mode ?: 'CASH',
                    'rno' => $rno ? $rno . '-' . $suffix : null,
                    'status' => 'PAID',
                    'coverage' => '1 Month',
                    'notes' => 'Auto-split from ' . ($rno ?: 'Ref'),
                    'balance_amount' => 0, // Recalculated later
                ]);
                $excess -= $emi;
                $suffix++;
            }
        }

        // Recalculate balance for this and subsequent installments
        $this->recalculateBalances($installment->backlog_account_id);

        AuditLog::log($request, 'BACKLOG_INSTALLMENT_EDITED', $installment, $request->all());

        return response()->json(['message' => 'Installment updated successfully']);
    }

    public function deleteInstallment(Request $request, $id)
    {
        $installment = $this->resolveInstallment($id);
        $accountId = $installment->backlog_account_id;
        \App\Models\AuditLog::log($request, 'BACKLOG_INSTALLMENT_DELETED', $installment, $installment->toArray());
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
        $currentMonthCount = 0;
        foreach ($installments as $ins) {
            $currentPaid += $ins->paid_amount;
            $months = $ins->im ?: 1;
            $ins->update([
                'installment_no' => $currentMonthCount + 1,
                'balance_amount' => max(0, $account->total_amount - $currentPaid)
            ]);
            $currentMonthCount += $months;
        }
    }

    public function seize(Request $request, $id)
    {
        $account = $this->resolveAccount($id);
        $account->type = 'S'; // 'S' for Seized
        $account->save();
        return response()->json(['message' => 'Vehicle seized successfully']);
    }

    public function settle(Request $request, $id)
    {
        $request->validate([
            'settlement_amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'mode' => 'nullable|string',
        ]);

        $account = $this->resolveAccount($id);

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

    public function recalculateAll(Request $request, $id)
    {
        $this->resolveAccount($id);
        $account = BacklogAccount::with('installments')->findOrFail($id);

        $totalInt = $account->interest_amount ?? 0;
        $totalMonths = $account->total_months ?? 1;
        $monthlyInt = $totalMonths > 0 ? ($totalInt / $totalMonths) : 0;
        
        $interestFixed = ceil($monthlyInt); // Roundup
        $instAmt = $account->installment_amount ?: ($account->total_amount / ($account->total_months ?: 1));
        $principalFixed = round($instAmt - $interestFixed);

        $installments = $account->installments()->orderBy('due_date', 'asc')->orderBy('id', 'asc')->get();
        $currentPaid = 0;
        $currentMonthCount = 0;
        
        foreach ($installments as $ins) {
            $paid = $ins->paid_amount;
            $currentPaid += $paid;
            $months = $ins->im ?: 1;
            
            $ins->update([
                'installment_no' => $currentMonthCount + 1,
                'principal_amount' => $principalFixed * $months,
                'interest_amount' => $interestFixed * $months,
                'balance_amount' => max(0, $account->total_amount - $currentPaid)
            ]);
            $currentMonthCount += $months;
        }
        
        return response()->json(['message' => 'All installments recalculated successfully']);
    }

    public function dueInstallments(Request $request)
    {
        // 1. Build the base query with filters that can be applied directly on backlog_accounts
        $subQuery = BacklogAccount::query();

        if ($request->filled('folio_start')) {
            $subQuery->where('fno', '>=', (int)$request->folio_start);
        }
        if ($request->filled('folio_end')) {
            $subQuery->where('fno', '<=', (int)$request->folio_end);
        }

        if ($request->filled('financer') && $request->financer !== 'ALL') {
            $subQuery->where('cbcode', $request->financer);
        }

        if ($request->filled('zone') && $request->zone !== 'ALL') {
            $subQuery->where('zone', $request->zone);
        }
        if ($request->filled('model') && $request->model !== 'ALL') {
            $subQuery->where('vehicle_model', $request->model);
        }
        if ($request->filled('vehicle_no') && $request->vehicle_no !== 'ALL') {
            $subQuery->where('vehicle_no', $request->vehicle_no);
        }
        if ($request->filled('make_start')) {
            $subQuery->where('vehicle_make', '>=', (int)$request->make_start);
        }
        if ($request->filled('make_end')) {
            $subQuery->where('vehicle_make', '<=', (int)$request->make_end);
        }
        if ($request->filled('total_months_start')) {
            $subQuery->where('total_months', '>=', (int)$request->total_months_start);
        }
        if ($request->filled('total_months_end')) {
            $subQuery->where('total_months', '<=', (int)$request->total_months_end);
        }
        if ($request->filled('search_val')) {
            $searchVal = "%{$request->search_val}%";
            // The global UppercaseStrings middleware uppercases all request input,
            // so match search_type case-insensitively rather than against literal lowercase strings.
            switch (strtolower((string) $request->search_type)) {
                case 'engine':
                    $subQuery->where('engine_no', 'like', $searchVal);
                    break;
                case 'borrower_name':
                    $subQuery->where(function($q) use ($searchVal) {
                        $q->where('customer_name', 'like', $searchVal)
                          ->orWhere('father_name', 'like', $searchVal);
                    });
                    break;
                case 'vehicle_no':
                    $subQuery->where('vehicle_no', 'like', $searchVal);
                    break;
                default:
                    $subQuery->where('chassis_no', 'like', $searchVal);
            }
        }

        // 2. Select subqueries for computed columns
        $totalPaidSub = BacklogInstallment::selectRaw('COALESCE(SUM(paid_amount), 0)')
            ->whereColumn('backlog_account_id', 'backlog_accounts.id');
        $subQuery->selectSub($totalPaidSub, 'total_paid');

        $dueDatePendingSub = BacklogInstallment::select('due_date')
            ->whereColumn('backlog_account_id', 'backlog_accounts.id')
            ->where('status', 'PENDING')
            ->orderBy('due_date', 'asc')
            ->limit(1);
        $subQuery->selectSub($dueDatePendingSub, 'due_date_pending');

        $firstDueDateSub = BacklogInstallment::select('due_date')
            ->whereColumn('backlog_account_id', 'backlog_accounts.id')
            ->orderBy('due_date', 'asc')
            ->limit(1);
        $subQuery->selectSub($firstDueDateSub, 'first_due_date');

        // Add all columns of backlog_accounts
        $subQuery->addSelect('backlog_accounts.*');

        // 3. Wrap in a derived query so we can filter/query against computed attributes in SQL
        $derivedQuery = BacklogAccount::fromSub($subQuery, 'ba_derived')->withoutGlobalScopes();

        // Add finalized computed attributes
        $derivedQuery->addSelect([
            'ba_derived.*',
            \Illuminate\Support\Facades\DB::raw('(total_amount - total_paid) AS current_balance'),
            \Illuminate\Support\Facades\DB::raw('COALESCE(due_date_pending, first_due_date) AS due_date'),
            \Illuminate\Support\Facades\DB::raw('first_due_date AS agreement_date'),
            \Illuminate\Support\Facades\DB::raw('(CASE WHEN installment_amount > 0 THEN installment_amount WHEN total_months > 0 THEN total_amount / total_months ELSE 0 END) AS inst_rate')
        ]);
        $derivedQuery->addSelect([
            \Illuminate\Support\Facades\DB::raw('CASE WHEN (CASE WHEN installment_amount > 0 THEN installment_amount WHEN total_months > 0 THEN total_amount / total_months ELSE 0 END) > 0 THEN ROUND((total_amount - total_paid) / (CASE WHEN installment_amount > 0 THEN installment_amount WHEN total_months > 0 THEN total_amount / total_months ELSE 0 END), 1) ELSE 0 END AS due_inst')
        ]);

        // 4. Apply filters directly on the SQL query
        if ($request->filled('due_months_min')) {
            $derivedQuery->where(
                \Illuminate\Support\Facades\DB::raw('CASE WHEN (CASE WHEN installment_amount > 0 THEN installment_amount WHEN total_months > 0 THEN total_amount / total_months ELSE 0 END) > 0 THEN ROUND((total_amount - total_paid) / (CASE WHEN installment_amount > 0 THEN installment_amount WHEN total_months > 0 THEN total_amount / total_months ELSE 0 END), 1) ELSE 0 END'),
                '>=',
                (float)$request->due_months_min
            );
        }
        if ($request->filled('due_date_start')) {
            $derivedQuery->where(\Illuminate\Support\Facades\DB::raw('COALESCE(due_date_pending, first_due_date)'), '>=', $request->due_date_start);
        }
        if ($request->filled('due_date_end')) {
            $derivedQuery->where(\Illuminate\Support\Facades\DB::raw('COALESCE(due_date_pending, first_due_date)'), '<=', $request->due_date_end);
        }
        if ($request->filled('agreement_date_start')) {
            $derivedQuery->where('first_due_date', '>=', $request->agreement_date_start);
        }
        if ($request->filled('agreement_date_end')) {
            $derivedQuery->where('first_due_date', '<=', $request->agreement_date_end);
        }

        // 5. Order and Paginate
        $perPage = min((int) $request->get('per_page', 50), 100);
        $accounts = $derivedQuery->orderBy('fno', 'asc')->paginate($perPage);

        return response()->json($accounts);
    }

    public function destroy()
    {
        BacklogInstallment::query()->delete();
        BacklogAccount::query()->delete();
        return response()->json(['message' => 'Backlog cleared successfully']);
    }

    public function assignRecoveryMan(Request $request, $id)
    {
        $request->validate([
            'recovery_man_id' => 'nullable|exists:users,id',
            'collection_date' => 'nullable|date',
        ]);

        $account = $this->resolveAccount($id);
        $account->update([
            'recovery_man_id' => $request->recovery_man_id,
            'collection_date' => $request->collection_date,
        ]);

        return response()->json([
            'message' => 'Recovery agent assigned successfully',
            'account' => $account
        ]);
    }
}
