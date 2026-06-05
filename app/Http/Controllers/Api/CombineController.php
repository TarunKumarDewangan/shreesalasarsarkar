<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Borrower;
use App\Models\Loan;
use App\Models\BacklogAccount;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

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

        // 1. Fetch Active (New) Loans with pending installments
        $loans = Loan::with(['borrower.vehicle', 'borrower.recoveryMan', 'installments'])
            ->whereIn('status', ['ACTIVE', 'SEIZED'])
            ->when(!$user->isAdmin(), function($q) use ($effectiveOwnerId) {
                $q->where('financer_id', $effectiveOwnerId);
            })
            ->get();

        $data = [];

        foreach ($loans as $loan) {
            $borrower = $loan->borrower;
            if (!$borrower) continue;

            $pendingIns = $loan->installments->where('status', 'PENDING');
            if ($pendingIns->isEmpty()) continue;

            $current_balance = (float)$pendingIns->sum('amount_due');
            $due_date = $pendingIns->sortBy('due_date')->first()?->due_date;
            if ($due_date instanceof Carbon) {
                $due_date = $due_date->toDateString();
            }

            $agreement_date = $loan->agreement_date;
            if ($agreement_date instanceof Carbon) {
                $agreement_date = $agreement_date->toDateString();
            }

            $due_inst = $pendingIns->filter(function($ins) {
                $dueDate = Carbon::parse($ins->due_date);
                return $dueDate->lt(Carbon::today());
            })->count();

            $data[] = [
                'id' => 'new-' . $loan->id,
                'sno' => null,
                'fno' => (int)$borrower->folio_no,
                'customer_name' => $borrower->name,
                'father_name' => $borrower->father_name,
                'mobile' => $borrower->mobile,
                'vehicle_model' => $borrower->vehicle?->model,
                'vehicle_no' => $borrower->vehicle?->vehicle_no,
                'chassis_no' => $borrower->vehicle?->chassis_no,
                'engine_no' => $borrower->vehicle?->engine_no,
                'vehicle_make' => $borrower->vehicle?->make_year,
                'zone' => $borrower->zone,
                'cbcode' => $borrower->folio_prefix,
                'total_months' => $loan->total_months,
                'installment_amount' => $loan->installment_amount,
                'finance_amount' => $loan->finance_amount,
                'total_amount' => $loan->total_amount,
                'type' => $loan->status === 'SEIZED' ? 'S' : 'P', // 'S' for seized, 'P' for pending
                'current_balance' => $current_balance,
                'due_inst' => $due_inst,
                'due_date' => $due_date,
                'agreement_date' => $agreement_date,
                'source' => 'New',
                'borrower_id' => $borrower->id,
                'recovery_man_id' => $borrower->recovery_man_id,
                'recovery_man_name' => $borrower->recoveryMan?->name,
                'collection_date' => $borrower->collection_date,
            ];
        }

        // 2. Fetch Old (Backlog) Accounts
        $backlogAccounts = BacklogAccount::with(['installments' => function($q) {
            $q->orderBy('due_date', 'asc');
        }, 'recoveryMan'])->get();

        foreach ($backlogAccounts as $account) {
            $total_paid = $account->installments->sum('paid_amount');
            $current_balance = $account->total_amount - $total_paid;
            
            $oldestPending = $account->installments->where('status', 'PENDING')->first();
            $due_date = $oldestPending ? $oldestPending->due_date : ($account->installments->first()?->due_date ?? null);
            
            $agreement_date = $account->installments->first()?->due_date ?? null;
            
            $inst_rate = (float)$account->installment_amount;
            if ($inst_rate <= 0 && $account->total_months > 0) {
                $inst_rate = $account->total_amount / $account->total_months;
            }
            
            $due_inst = 0;
            if ($inst_rate > 0) {
                $due_inst = round($current_balance / $inst_rate, 1);
            }

            $data[] = [
                'id' => 'old-' . $account->id,
                'sno' => $account->sno,
                'fno' => (int)$account->fno,
                'customer_name' => $account->customer_name,
                'father_name' => $account->father_name,
                'mobile' => $account->mobile,
                'vehicle_model' => $account->vehicle_model,
                'vehicle_no' => $account->vehicle_no,
                'chassis_no' => $account->chassis_no,
                'engine_no' => $account->engine_no,
                'vehicle_make' => $account->vehicle_make,
                'zone' => $account->zone,
                'cbcode' => $account->cbcode,
                'total_months' => $account->total_months,
                'installment_amount' => $account->installment_amount,
                'finance_amount' => $account->finance_amount,
                'total_amount' => $account->total_amount,
                'type' => $account->type, // 'P', 'F', 'S'
                'current_balance' => $current_balance,
                'due_inst' => $due_inst,
                'due_date' => $due_date,
                'agreement_date' => $agreement_date,
                'source' => 'Old',
                'borrower_id' => null,
                'recovery_man_id' => $account->recovery_man_id,
                'recovery_man_name' => $account->recoveryMan?->name,
                'collection_date' => $account->collection_date,
            ];
        }

        // Apply filters in PHP
        $collection = collect($data);

        // Filter: Folio range
        if ($request->filled('folio_start')) {
            $collection = $collection->where('fno', '>=', (int)$request->folio_start);
        }
        if ($request->filled('folio_end')) {
            $collection = $collection->where('fno', '<=', (int)$request->folio_end);
        }

        // Filter: Financer (cbcode)
        if ($request->filled('financer') && $request->financer !== 'ALL') {
            $collection = $collection->where('cbcode', $request->financer);
        }

        // Filter: Zone
        if ($request->filled('zone') && $request->zone !== 'ALL') {
            $collection = $collection->where('zone', $request->zone);
        }

        // Filter: Model
        if ($request->filled('model') && $request->model !== 'ALL') {
            $collection = $collection->where('vehicle_model', $request->model);
        }

        // Filter: Vehicle No
        if ($request->filled('vehicle_no')) {
            $val = strtolower($request->vehicle_no);
            $collection = $collection->filter(function($item) use ($val) {
                return str_contains(strtolower($item['vehicle_no'] ?? ''), $val);
            });
        }

        // Filter: Make year range
        if ($request->filled('make_start')) {
            $collection = $collection->where('vehicle_make', '>=', (int)$request->make_start);
        }
        if ($request->filled('make_end')) {
            $collection = $collection->where('vehicle_make', '<=', (int)$request->make_end);
        }

        // Filter: Due Months >=
        if ($request->filled('due_months_min')) {
            $collection = $collection->where('due_inst', '>=', (float)$request->due_months_min);
        }

        // Filter: Total Months range
        if ($request->filled('total_months_start')) {
            $collection = $collection->where('total_months', '>=', (int)$request->total_months_start);
        }
        if ($request->filled('total_months_end')) {
            $collection = $collection->where('total_months', '<=', (int)$request->total_months_end);
        }

        // Filter: Due Date range
        if ($request->filled('due_date_start')) {
            $collection = $collection->filter(function($item) use ($request) {
                return $item['due_date'] >= $request->due_date_start;
            });
        }
        if ($request->filled('due_date_end')) {
            $collection = $collection->filter(function($item) use ($request) {
                return $item['due_date'] <= $request->due_date_end;
            });
        }

        // Filter: Agreement Date range
        if ($request->filled('agreement_date_start')) {
            $collection = $collection->filter(function($item) use ($request) {
                return $item['agreement_date'] >= $request->agreement_date_start;
            });
        }
        if ($request->filled('agreement_date_end')) {
            $collection = $collection->filter(function($item) use ($request) {
                return $item['agreement_date'] <= $request->agreement_date_end;
            });
        }

        // Filter: Search (Chassis or Engine)
        if ($request->filled('search_val')) {
            $searchType = $request->search_type === 'engine' ? 'engine_no' : 'chassis_no';
            $val = strtolower($request->search_val);
            $collection = $collection->filter(function($item) use ($searchType, $val) {
                return str_contains(strtolower($item[$searchType] ?? ''), $val);
            });
        }

        // Filter: Global search / name search
        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $collection = $collection->filter(function($item) use ($search) {
                return str_contains(strtolower($item['customer_name'] ?? ''), $search) ||
                       str_contains(strtolower((string)$item['fno'] ?? ''), $search) ||
                       str_contains(strtolower($item['mobile'] ?? ''), $search) ||
                       str_contains(strtolower($item['vehicle_no'] ?? ''), $search);
            });
        }

        // Filter: Source (New / Old)
        if ($request->filled('source_filter') && $request->source_filter !== 'ALL') {
            $collection = $collection->where('source', $request->source_filter);
        }

        // Sort by folio_no asc by default, or due_date asc
        $sorted = $collection->sortBy('fno')->values();

        // Paginate manually
        $page = (int)$request->input('page', 1);
        $perPage = (int)$request->input('per_page', 15);
        $sliced = $sorted->slice(($page - 1) * $perPage, $perPage)->values()->all();

        $paginator = new LengthAwarePaginator(
            $sliced,
            $sorted->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return response()->json($paginator);
    }

    public function backlogAccounts(Request $request)
    {
        $user = $request->user();
        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;

        // 1. Fetch Active (New) Borrowers with latest loan
        $borrowers = Borrower::with(['vehicle', 'latestLoan.installments', 'recoveryMan'])
            ->has('loans')
            ->where('financer_id', $this->financer_id($request))
            ->get();

        $data = [];

        foreach ($borrowers as $b) {
            $loan = $b->latestLoan;
            if (!$loan) continue;

            $data[] = [
                'id' => 'new-' . $b->id,
                'sno' => null,
                'fno' => (int)$b->folio_no,
                'cbcode' => $b->folio_prefix,
                'customer_name' => $b->name,
                'father_name' => $b->father_name,
                'mobile' => $b->mobile,
                'address' => $b->address,
                'vehicle_model' => $b->vehicle?->model,
                'vehicle_no' => $b->vehicle?->vehicle_no,
                'vehicle_color' => $b->vehicle?->color,
                'chassis_no' => $b->vehicle?->chassis_no,
                'engine_no' => $b->vehicle?->engine_no,
                'vehicle_make' => $b->vehicle?->make_year,
                'total_months' => $loan->total_months,
                'interval' => $loan->interval ?: 1,
                'finance_amount' => $loan->finance_amount,
                'agreement_amount' => $loan->agreement_amount,
                'hp_amount' => $loan->hire_purchase_rto,
                'interest_amount' => $loan->interest_amount,
                'total_amount' => $loan->total_amount,
                'installment_amount' => $loan->installment_amount,
                'interest_rate' => $loan->interest_rate,
                'installments_count' => $loan->installments->count(),
                'type' => $loan->status === 'CLOSED' ? 'F' : ($loan->status === 'SEIZED' ? 'S' : 'P'), // Pending/Seized/Final
                'source' => 'New',
                'borrower_id' => $b->id,
                'recovery_man_id' => $b->recovery_man_id,
                'recovery_man_name' => $b->recoveryMan?->name,
                'collection_date' => $b->collection_date,
                'installments' => $loan->installments->map(function($ins, $index) {
                    return [
                        'installment_no' => $index + 1,
                        'due_date' => $ins->due_date ? Carbon::parse($ins->due_date)->toDateString() : null,
                        'payment_date' => $ins->paid_date ? Carbon::parse($ins->paid_date)->toDateString() : null,
                        'installment_amount' => $ins->amount_due,
                        'paid_amount' => $ins->amount_paid ?: 0,
                        'balance_amount' => $ins->balance,
                        'mode' => $ins->method ?: '—',
                    ];
                })->values()->all(),
            ];
        }

        // 2. Fetch Old (Backlog) Accounts
        $backlogAccounts = BacklogAccount::with(['installments', 'recoveryMan'])->get();

        foreach ($backlogAccounts as $account) {
            $data[] = [
                'id' => 'old-' . $account->id,
                'sno' => $account->sno,
                'fno' => (int)$account->fno,
                'cbcode' => $account->cbcode,
                'customer_name' => $account->customer_name,
                'father_name' => $account->father_name,
                'mobile' => $account->mobile,
                'address' => $account->address,
                'vehicle_model' => $account->vehicle_model,
                'vehicle_no' => $account->vehicle_no,
                'vehicle_color' => $account->vehicle_color,
                'chassis_no' => $account->chassis_no,
                'engine_no' => $account->engine_no,
                'vehicle_make' => $account->vehicle_make,
                'total_months' => $account->total_months,
                'interval' => $account->interval ?: 1,
                'finance_amount' => $account->finance_amount,
                'agreement_amount' => $account->agreement_amount,
                'hp_amount' => $account->hp_amount,
                'interest_amount' => $account->interest_amount,
                'total_amount' => $account->total_amount,
                'installment_amount' => $account->installment_amount,
                'interest_rate' => $account->interest_rate,
                'installments_count' => $account->installments->count(),
                'type' => $account->type, // P, F, S
                'source' => 'Old',
                'borrower_id' => null,
                'recovery_man_id' => $account->recovery_man_id,
                'recovery_man_name' => $account->recoveryMan?->name,
                'collection_date' => $account->collection_date,
                'installments' => $account->installments->map(function($ins) {
                    return [
                        'installment_no' => $ins->installment_no,
                        'due_date' => $ins->due_date,
                        'payment_date' => $ins->payment_date,
                        'installment_amount' => $ins->installment_amount,
                        'paid_amount' => $ins->paid_amount ?: 0,
                        'balance_amount' => $ins->balance_amount ?: 0,
                        'mode' => $ins->mode ?: '—',
                    ];
                })->values()->all(),
            ];
        }

        $collection = collect($data);

        // Apply search
        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $collection = $collection->filter(function($item) use ($search) {
                return str_contains(strtolower($item['customer_name'] ?? ''), $search) ||
                       str_contains(strtolower((string)$item['fno'] ?? ''), $search) ||
                       str_contains(strtolower($item['mobile'] ?? ''), $search) ||
                       str_contains(strtolower($item['vehicle_no'] ?? ''), $search);
            });
        }

        // Apply type (P, F, S)
        if ($request->filled('type')) {
            $collection = $collection->where('type', $request->type);
        }

        // Filter: Source (New / Old)
        if ($request->filled('source_filter') && $request->source_filter !== 'ALL') {
            $collection = $collection->where('source', $request->source_filter);
        }

        // Sort by fno
        $sorted = $collection->sortBy('fno')->values();

        // Paginate manually
        $page = (int)$request->input('page', 1);
        $perPage = (int)$request->input('per_page', 15);
        $sliced = $sorted->slice(($page - 1) * $perPage, $perPage)->values()->all();

        $paginator = new LengthAwarePaginator(
            $sliced,
            $sorted->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

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
