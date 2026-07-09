<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Borrower;
use App\Models\Loan;
use App\Models\BacklogAccount;
use Carbon\Carbon;

class CombineController extends Controller
{
    private function financer_id(Request $request): int
    {
        $user = $request->user();
        if ($user->isAdmin()) return $request->financer_id ?? $user->id;
        if ($user->isStaff()) return $user->financer_id;
        return $user->id;
    }

    public function dueInstallments(Request $request)
    {
        $user = $request->user();
        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        $source = $request->get('source_filter', 'ALL');

        // 1. Build the Active (New) Query
        $newQuery = \Illuminate\Support\Facades\DB::table('loans as l')
            ->join('borrowers as b', 'b.id', '=', 'l.borrower_id')
            ->leftJoin('vehicles as v', 'v.borrower_id', '=', 'b.id')
            ->leftJoin('users as rm', 'rm.id', '=', 'b.recovery_man_id')
            ->select([
                \Illuminate\Support\Facades\DB::raw("CONCAT('new-', l.id) AS id"),
                \Illuminate\Support\Facades\DB::raw("NULL AS sno"),
                \Illuminate\Support\Facades\DB::raw("b.folio_no AS fno"),
                \Illuminate\Support\Facades\DB::raw("b.name AS customer_name"),
                \Illuminate\Support\Facades\DB::raw("b.father_name AS father_name"),
                \Illuminate\Support\Facades\DB::raw("b.mobile AS mobile"),
                \Illuminate\Support\Facades\DB::raw("v.model AS vehicle_model"),
                \Illuminate\Support\Facades\DB::raw("v.vehicle_no AS vehicle_no"),
                \Illuminate\Support\Facades\DB::raw("v.chassis_no AS chassis_no"),
                \Illuminate\Support\Facades\DB::raw("v.engine_no AS engine_no"),
                \Illuminate\Support\Facades\DB::raw("v.make_year AS vehicle_make"),
                \Illuminate\Support\Facades\DB::raw("b.zone AS zone"),
                \Illuminate\Support\Facades\DB::raw("b.folio_prefix AS cbcode"),
                \Illuminate\Support\Facades\DB::raw("l.total_months AS total_months"),
                \Illuminate\Support\Facades\DB::raw("l.installment_rate * COALESCE(l.interval, 1) AS installment_amount"),
                \Illuminate\Support\Facades\DB::raw("l.finance_amount AS finance_amount"),
                \Illuminate\Support\Facades\DB::raw("l.total_amount AS total_amount"),
                \Illuminate\Support\Facades\DB::raw("CASE WHEN l.status = 'SEIZED' THEN 'S' ELSE 'P' END AS type"),
                \Illuminate\Support\Facades\DB::raw("(SELECT COALESCE(SUM(amount_due), 0) FROM installments WHERE loan_id = l.id AND status = 'PENDING') AS current_balance"),
                \Illuminate\Support\Facades\DB::raw("(SELECT COUNT(*) FROM installments WHERE loan_id = l.id AND status = 'PENDING' AND due_date < '" . \Carbon\Carbon::today()->toDateString() . "') AS due_inst"),
                \Illuminate\Support\Facades\DB::raw("(SELECT MIN(due_date) FROM installments WHERE loan_id = l.id AND status = 'PENDING') AS due_date"),
                \Illuminate\Support\Facades\DB::raw("l.agreement_date AS agreement_date"),
                \Illuminate\Support\Facades\DB::raw("'New' AS source"),
                \Illuminate\Support\Facades\DB::raw("b.id AS borrower_id"),
                \Illuminate\Support\Facades\DB::raw("b.recovery_man_id AS recovery_man_id"),
                \Illuminate\Support\Facades\DB::raw("rm.name AS recovery_man_name"),
                \Illuminate\Support\Facades\DB::raw("NULL AS collection_date")
            ])
            ->whereIn('l.status', ['ACTIVE', 'SEIZED'])
            ->whereNull('l.deleted_at')
            ->whereNull('b.deleted_at');

        if (!$user->isAdmin()) {
            $newQuery->where('b.financer_id', $effectiveOwnerId);
        }

        // Apply filters to $newQuery
        if ($request->filled('folio_start')) {
            $newQuery->where('b.folio_no', '>=', (int)$request->folio_start);
        }
        if ($request->filled('folio_end')) {
            $newQuery->where('b.folio_no', '<=', (int)$request->folio_end);
        }
        if ($request->filled('financer') && $request->financer !== 'ALL') {
            $newQuery->where('b.folio_prefix', $request->financer);
        }
        if ($request->filled('zone') && $request->zone !== 'ALL') {
            $newQuery->where('b.zone', $request->zone);
        }
        if ($request->filled('model') && $request->model !== 'ALL') {
            $newQuery->where('v.model', $request->model);
        }
        if ($request->filled('vehicle_no')) {
            $val = $request->vehicle_no;
            $newQuery->where(function($q) use ($val) {
                $q->where('v.vehicle_no', 'like', "%{$val}%")->orWhere('v.reg_no', 'like', "%{$val}%");
            });
        }
        if ($request->filled('make_start')) {
            $newQuery->where('v.make_year', '>=', (int)$request->make_start);
        }
        if ($request->filled('make_end')) {
            $newQuery->where('v.make_year', '<=', (int)$request->make_end);
        }
        if ($request->filled('total_months_start')) {
            $newQuery->where('l.total_months', '>=', (int)$request->total_months_start);
        }
        if ($request->filled('total_months_end')) {
            $newQuery->where('l.total_months', '<=', (int)$request->total_months_end);
        }
        if ($request->filled('agreement_date_start')) {
            $newQuery->where('l.agreement_date', '>=', $request->agreement_date_start);
        }
        if ($request->filled('agreement_date_end')) {
            $newQuery->where('l.agreement_date', '<=', $request->agreement_date_end);
        }
        if ($request->filled('search_val')) {
            $searchType = $request->search_type === 'engine' ? 'v.engine_no' : 'v.chassis_no';
            $newQuery->where($searchType, 'like', "%{$request->search_val}%");
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $newQuery->where(function($q) use ($search) {
                $q->where('b.name', 'like', "%{$search}%")
                  ->orWhere('b.folio_no', 'like', "%{$search}%")
                  ->orWhere('b.mobile', 'like', "%{$search}%")
                  ->orWhere('v.vehicle_no', 'like', "%{$search}%");
            });
        }

        // 2. Build the Old (Backlog) Query
        $oldQuery = \Illuminate\Support\Facades\DB::table('backlog_accounts as ba')
            ->leftJoin('users as rm', 'rm.id', '=', 'ba.recovery_man_id')
            ->select([
                \Illuminate\Support\Facades\DB::raw("CONCAT('old-', ba.id) AS id"),
                \Illuminate\Support\Facades\DB::raw("ba.sno AS sno"),
                \Illuminate\Support\Facades\DB::raw("ba.fno AS fno"),
                \Illuminate\Support\Facades\DB::raw("ba.customer_name AS customer_name"),
                \Illuminate\Support\Facades\DB::raw("ba.father_name AS father_name"),
                \Illuminate\Support\Facades\DB::raw("ba.mobile AS mobile"),
                \Illuminate\Support\Facades\DB::raw("ba.vehicle_model AS vehicle_model"),
                \Illuminate\Support\Facades\DB::raw("ba.vehicle_no AS vehicle_no"),
                \Illuminate\Support\Facades\DB::raw("ba.chassis_no AS chassis_no"),
                \Illuminate\Support\Facades\DB::raw("ba.engine_no AS engine_no"),
                \Illuminate\Support\Facades\DB::raw("ba.vehicle_make AS vehicle_make"),
                \Illuminate\Support\Facades\DB::raw("ba.zone AS zone"),
                \Illuminate\Support\Facades\DB::raw("ba.cbcode AS cbcode"),
                \Illuminate\Support\Facades\DB::raw("ba.total_months AS total_months"),
                \Illuminate\Support\Facades\DB::raw("ba.installment_amount AS installment_amount"),
                \Illuminate\Support\Facades\DB::raw("ba.finance_amount AS finance_amount"),
                \Illuminate\Support\Facades\DB::raw("ba.total_amount AS total_amount"),
                \Illuminate\Support\Facades\DB::raw("ba.type AS type"),
                \Illuminate\Support\Facades\DB::raw("(ba.total_amount - (SELECT COALESCE(SUM(paid_amount), 0) FROM backlog_installments WHERE backlog_account_id = ba.id AND status = 'PAID' AND deleted_at IS NULL)) AS current_balance"),
                // due_inst
                \Illuminate\Support\Facades\DB::raw("CASE WHEN (CASE WHEN ba.installment_amount > 0 THEN ba.installment_amount WHEN ba.total_months > 0 THEN ba.total_amount / ba.total_months ELSE 0 END) > 0 THEN ROUND((ba.total_amount - (SELECT COALESCE(SUM(paid_amount), 0) FROM backlog_installments WHERE backlog_account_id = ba.id AND status = 'PAID' AND deleted_at IS NULL)) / (CASE WHEN ba.installment_amount > 0 THEN ba.installment_amount WHEN ba.total_months > 0 THEN ba.total_amount / ba.total_months ELSE 0 END), 1) ELSE 0 END AS due_inst"),
                \Illuminate\Support\Facades\DB::raw("(SELECT MIN(due_date) FROM backlog_installments WHERE backlog_account_id = ba.id AND status = 'PENDING' AND deleted_at IS NULL) AS due_date"),
                \Illuminate\Support\Facades\DB::raw("(SELECT MIN(due_date) FROM backlog_installments WHERE backlog_account_id = ba.id AND deleted_at IS NULL) AS agreement_date"),
                \Illuminate\Support\Facades\DB::raw("'Old' AS source"),
                \Illuminate\Support\Facades\DB::raw("NULL AS borrower_id"),
                \Illuminate\Support\Facades\DB::raw("ba.recovery_man_id AS recovery_man_id"),
                \Illuminate\Support\Facades\DB::raw("rm.name AS recovery_man_name"),
                \Illuminate\Support\Facades\DB::raw("ba.collection_date AS collection_date")
            ])
            ->whereNull('ba.deleted_at');

        // Apply filters to $oldQuery
        if ($request->filled('folio_start')) {
            $oldQuery->where('ba.fno', '>=', (int)$request->folio_start);
        }
        if ($request->filled('folio_end')) {
            $oldQuery->where('ba.fno', '<=', (int)$request->folio_end);
        }
        if ($request->filled('financer') && $request->financer !== 'ALL') {
            $oldQuery->where('ba.cbcode', $request->financer);
        }
        if ($request->filled('zone') && $request->zone !== 'ALL') {
            $oldQuery->where('ba.zone', $request->zone);
        }
        if ($request->filled('model') && $request->model !== 'ALL') {
            $oldQuery->where('ba.vehicle_model', $request->model);
        }
        if ($request->filled('vehicle_no')) {
            $oldQuery->where('ba.vehicle_no', 'like', "%{$request->vehicle_no}%");
        }
        if ($request->filled('make_start')) {
            $oldQuery->where('ba.vehicle_make', '>=', (int)$request->make_start);
        }
        if ($request->filled('make_end')) {
            $oldQuery->where('ba.vehicle_make', '<=', (int)$request->make_end);
        }
        if ($request->filled('total_months_start')) {
            $oldQuery->where('ba.total_months', '>=', (int)$request->total_months_start);
        }
        if ($request->filled('total_months_end')) {
            $oldQuery->where('ba.total_months', '<=', (int)$request->total_months_end);
        }
        if ($request->filled('search_val')) {
            $searchType = $request->search_type === 'engine' ? 'ba.engine_no' : 'ba.chassis_no';
            $oldQuery->where($searchType, 'like', "%{$request->search_val}%");
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $oldQuery->where(function($q) use ($search) {
                $q->where('ba.customer_name', 'like', "%{$search}%")
                  ->orWhere('ba.fno', 'like', "%{$search}%")
                  ->orWhere('ba.mobile', 'like', "%{$search}%")
                  ->orWhere('ba.vehicle_no', 'like', "%{$search}%");
            });
        }

        // 3. Union them
        if ($source === 'New') {
            $unionQuery = $newQuery;
        } elseif ($source === 'Old') {
            $unionQuery = $oldQuery;
        } else {
            $unionQuery = $newQuery->unionAll($oldQuery);
        }

        // 4. Wrap and apply derived filters
        $wrappedQuery = \Illuminate\Support\Facades\DB::table(
            \Illuminate\Support\Facades\DB::raw("({$unionQuery->toSql()}) as combined")
        )->mergeBindings($unionQuery);

        if ($request->filled('due_months_min')) {
            $wrappedQuery->where('due_inst', '>=', (float)$request->due_months_min);
        }
        if ($request->filled('due_date_start')) {
            $wrappedQuery->where('due_date', '>=', $request->due_date_start);
        }
        if ($request->filled('due_date_end')) {
            $wrappedQuery->where('due_date', '<=', $request->due_date_end);
        }
        if ($request->filled('agreement_date_start')) {
            $wrappedQuery->where('agreement_date', '>=', $request->agreement_date_start);
        }
        if ($request->filled('agreement_date_end')) {
            $wrappedQuery->where('agreement_date', '<=', $request->agreement_date_end);
        }

        $perPage = min((int) $request->get('per_page', 15), 100);
        $paginator = $wrappedQuery->orderBy('fno', 'asc')->paginate($perPage);

        return response()->json($paginator);
    }

    public function backlogAccounts(Request $request)
    {
        $user = $request->user();
        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        $source = $request->get('source_filter', 'ALL');

        // 1. Build the Active (New) Borrower/Loan query
        $newQuery = \Illuminate\Support\Facades\DB::table('borrowers as b')
            ->join('loans as l', 'l.borrower_id', '=', 'b.id')
            ->leftJoin('vehicles as v', 'v.borrower_id', '=', 'b.id')
            ->leftJoin('users as rm', 'rm.id', '=', 'b.recovery_man_id')
            ->select([
                \Illuminate\Support\Facades\DB::raw("CONCAT('new-', b.id) AS id"),
                \Illuminate\Support\Facades\DB::raw("NULL AS sno"),
                \Illuminate\Support\Facades\DB::raw("b.folio_no AS fno"),
                \Illuminate\Support\Facades\DB::raw("b.folio_prefix AS cbcode"),
                \Illuminate\Support\Facades\DB::raw("b.name AS customer_name"),
                \Illuminate\Support\Facades\DB::raw("b.father_name AS father_name"),
                \Illuminate\Support\Facades\DB::raw("b.mobile AS mobile"),
                \Illuminate\Support\Facades\DB::raw("b.address AS address"),
                \Illuminate\Support\Facades\DB::raw("v.model AS vehicle_model"),
                \Illuminate\Support\Facades\DB::raw("v.vehicle_no AS vehicle_no"),
                \Illuminate\Support\Facades\DB::raw("v.color AS vehicle_color"),
                \Illuminate\Support\Facades\DB::raw("v.chassis_no AS chassis_no"),
                \Illuminate\Support\Facades\DB::raw("v.engine_no AS engine_no"),
                \Illuminate\Support\Facades\DB::raw("v.make_year AS vehicle_make"),
                \Illuminate\Support\Facades\DB::raw("l.total_months AS total_months"),
                \Illuminate\Support\Facades\DB::raw("COALESCE(l.interval, 1) AS `interval`"),
                \Illuminate\Support\Facades\DB::raw("l.finance_amount AS finance_amount"),
                \Illuminate\Support\Facades\DB::raw("l.agreement_amount AS agreement_amount"),
                \Illuminate\Support\Facades\DB::raw("l.hire_purchase_rto AS hp_amount"),
                \Illuminate\Support\Facades\DB::raw("l.interest_amount AS interest_amount"),
                \Illuminate\Support\Facades\DB::raw("l.total_amount AS total_amount"),
                \Illuminate\Support\Facades\DB::raw("l.installment_rate * COALESCE(l.interval, 1) AS installment_amount"),
                \Illuminate\Support\Facades\DB::raw("l.interest_rate AS interest_rate"),
                \Illuminate\Support\Facades\DB::raw("CASE WHEN l.status = 'CLOSED' THEN 'F' WHEN l.status = 'SEIZED' THEN 'S' ELSE 'P' END AS type"),
                \Illuminate\Support\Facades\DB::raw("'New' AS source"),
                \Illuminate\Support\Facades\DB::raw("b.id AS borrower_id"),
                \Illuminate\Support\Facades\DB::raw("b.recovery_man_id AS recovery_man_id"),
                \Illuminate\Support\Facades\DB::raw("rm.name AS recovery_man_name"),
                \Illuminate\Support\Facades\DB::raw("NULL AS collection_date")
            ])
            ->whereNull('b.deleted_at')
            ->whereNull('l.deleted_at');

        if (!$user->isAdmin()) {
            $newQuery->where('b.financer_id', $effectiveOwnerId);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $newQuery->where(function($q) use ($search) {
                $q->where('b.name', 'like', "%{$search}%")
                  ->orWhere('b.folio_no', 'like', "%{$search}%")
                  ->orWhere('b.mobile', 'like', "%{$search}%")
                  ->orWhere('v.vehicle_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $type = $request->type;
            $newQuery->where(function($q) use ($type) {
                if ($type === 'F') {
                    $q->where('l.status', 'CLOSED');
                } elseif ($type === 'S') {
                    $q->where('l.status', 'SEIZED');
                } else {
                    $q->whereNotIn('l.status', ['CLOSED', 'SEIZED']);
                }
            });
        }

        // 2. Build the Old (Backlog) query
        $oldQuery = \Illuminate\Support\Facades\DB::table('backlog_accounts as ba')
            ->leftJoin('users as rm', 'rm.id', '=', 'ba.recovery_man_id')
            ->select([
                \Illuminate\Support\Facades\DB::raw("CONCAT('old-', ba.id) AS id"),
                \Illuminate\Support\Facades\DB::raw("ba.sno AS sno"),
                \Illuminate\Support\Facades\DB::raw("ba.fno AS fno"),
                \Illuminate\Support\Facades\DB::raw("ba.cbcode AS cbcode"),
                \Illuminate\Support\Facades\DB::raw("ba.customer_name AS customer_name"),
                \Illuminate\Support\Facades\DB::raw("ba.father_name AS father_name"),
                \Illuminate\Support\Facades\DB::raw("ba.mobile AS mobile"),
                \Illuminate\Support\Facades\DB::raw("ba.address AS address"),
                \Illuminate\Support\Facades\DB::raw("ba.vehicle_model AS vehicle_model"),
                \Illuminate\Support\Facades\DB::raw("ba.vehicle_no AS vehicle_no"),
                \Illuminate\Support\Facades\DB::raw("ba.vehicle_color AS vehicle_color"),
                \Illuminate\Support\Facades\DB::raw("ba.chassis_no AS chassis_no"),
                \Illuminate\Support\Facades\DB::raw("ba.engine_no AS engine_no"),
                \Illuminate\Support\Facades\DB::raw("ba.vehicle_make AS vehicle_make"),
                \Illuminate\Support\Facades\DB::raw("ba.total_months AS total_months"),
                \Illuminate\Support\Facades\DB::raw("COALESCE(ba.interval, 1) AS `interval`"),
                \Illuminate\Support\Facades\DB::raw("ba.finance_amount AS finance_amount"),
                \Illuminate\Support\Facades\DB::raw("ba.agreement_amount AS agreement_amount"),
                \Illuminate\Support\Facades\DB::raw("ba.hp_amount AS hp_amount"),
                \Illuminate\Support\Facades\DB::raw("ba.interest_amount AS interest_amount"),
                \Illuminate\Support\Facades\DB::raw("ba.total_amount AS total_amount"),
                \Illuminate\Support\Facades\DB::raw("ba.installment_amount AS installment_amount"),
                \Illuminate\Support\Facades\DB::raw("ba.interest_rate AS interest_rate"),
                \Illuminate\Support\Facades\DB::raw("ba.type AS type"),
                \Illuminate\Support\Facades\DB::raw("'Old' AS source"),
                \Illuminate\Support\Facades\DB::raw("NULL AS borrower_id"),
                \Illuminate\Support\Facades\DB::raw("ba.recovery_man_id AS recovery_man_id"),
                \Illuminate\Support\Facades\DB::raw("rm.name AS recovery_man_name"),
                \Illuminate\Support\Facades\DB::raw("ba.collection_date AS collection_date")
            ])
            ->whereNull('ba.deleted_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $oldQuery->where(function($q) use ($search) {
                $q->where('ba.customer_name', 'like', "%{$search}%")
                  ->orWhere('ba.fno', 'like', "%{$search}%")
                  ->orWhere('ba.mobile', 'like', "%{$search}%")
                  ->orWhere('ba.vehicle_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $oldQuery->where('ba.type', $request->type);
        }

        // 3. Union them
        if ($source === 'New') {
            $unionQuery = $newQuery;
        } elseif ($source === 'Old') {
            $unionQuery = $oldQuery;
        } else {
            $unionQuery = $newQuery->unionAll($oldQuery);
        }

        // 4. Wrap and Paginate
        $wrappedQuery = \Illuminate\Support\Facades\DB::table(
            \Illuminate\Support\Facades\DB::raw("({$unionQuery->toSql()}) as combined")
        )->mergeBindings($unionQuery);

        $perPage = min((int) $request->get('per_page', 15), 100);
        $paginator = $wrappedQuery->orderBy('fno', 'asc')->paginate($perPage);

        $sliced = $paginator->items();

        // 5. Load installments ONLY for the current page records
        $newBorrowerIds = [];
        $oldAccountIds = [];
        foreach ($sliced as $item) {
            if ($item->source === 'New') {
                $newBorrowerIds[] = $item->borrower_id;
            } else {
                $oldAccountIds[] = (int) str_replace('old-', '', $item->id);
            }
        }

        $loansWithInstallments = collect();
        if (!empty($newBorrowerIds)) {
            $loansWithInstallments = Loan::with('installments')
                ->whereIn('borrower_id', $newBorrowerIds)
                ->whereIn('status', ['ACTIVE', 'SEIZED', 'CLOSED'])
                ->get()
                ->groupBy('borrower_id');
        }

        $oldAccountsWithInstallments = collect();
        if (!empty($oldAccountIds)) {
            $oldAccountsWithInstallments = BacklogAccount::with(['installments' => function($q) {
                $q->orderBy('installment_no', 'asc');
            }])
            ->whereIn('id', $oldAccountIds)
            ->get()
            ->keyBy('id');
        }

        // Map installments back to the sliced items
        foreach ($sliced as $item) {
            $item->installments = [];
            $item->installments_count = 0;
            if ($item->source === 'New') {
                $bId = $item->borrower_id;
                $borrowerLoan = isset($loansWithInstallments[$bId]) ? $loansWithInstallments[$bId]->first() : null;
                if ($borrowerLoan) {
                    $item->installments_count = $borrowerLoan->installments->count();
                    $item->installments = $borrowerLoan->installments->map(function($ins, $index) {
                        return [
                            'installment_no' => $index + 1,
                            'due_date' => $ins->due_date ? Carbon::parse($ins->due_date)->toDateString() : null,
                            'payment_date' => $ins->paid_date ? Carbon::parse($ins->paid_date)->toDateString() : null,
                            'installment_amount' => $ins->amount_due,
                            'paid_amount' => $ins->amount_paid ?: 0,
                            'balance_amount' => $ins->balance,
                            'mode' => $ins->method ?: '—',
                        ];
                    })->values()->all();
                }
            } else {
                $accId = (int) str_replace('old-', '', $item->id);
                $account = $oldAccountsWithInstallments[$accId] ?? null;
                if ($account) {
                    $item->installments_count = $account->installments->count();
                    $item->installments = $account->installments->map(function($ins) {
                        return [
                            'installment_no' => $ins->installment_no,
                            'due_date' => $ins->due_date,
                            'payment_date' => $ins->payment_date,
                            'installment_amount' => $ins->installment_amount,
                            'paid_amount' => $ins->paid_amount ?: 0,
                            'balance_amount' => $ins->balance_amount ?: 0,
                            'mode' => $ins->mode ?: '—',
                        ];
                    })->values()->all();
                }
            }
        }

        return response()->json($paginator);
    }

    public function metadata(Request $request)
    {
        $cbcodes = array_unique(array_merge(
            Borrower::distinct()->pluck('folio_prefix')->filter()->toArray(),
            BacklogAccount::distinct()->pluck('cbcode')->filter()->toArray()
        ));
        sort($cbcodes);

        $zones = array_unique(array_merge(
            Borrower::distinct()->pluck('zone')->filter()->toArray(),
            BacklogAccount::distinct()->pluck('zone')->filter()->toArray()
        ));
        sort($zones);

        $models = array_unique(array_merge(
            \App\Models\Vehicle::distinct()->pluck('model')->filter()->toArray(),
            BacklogAccount::distinct()->pluck('vehicle_model')->filter()->toArray()
        ));
        sort($models);

        return response()->json([
            'financers' => array_values($cbcodes),
            'zones' => array_values($zones),
            'models' => array_values($models),
        ]);
    }
}
