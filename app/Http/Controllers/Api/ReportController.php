<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrower;
use App\Models\Loan;
use App\Models\Installment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function recovery(Request $request)
    {
        $financer_id = $this->financer_id($request);
        $start = $request->start_date;
        $end   = $request->end_date;
        
        // Base Query with eager loading and counts
        $query = Borrower::with(['vehicle', 'latestLoan' => function($q) {
            $q->withCount([
                'installments as total_ins',
                'installments as paid_ins' => fn($iq) => $iq->where('status', 'PAID'),
                'installments as overdue_ins' => fn($iq) => $iq->where('status', 'PENDING')->where('due_date', '<', Carbon::today())
            ]);
        }])->where('financer_id', $financer_id);

        // Filter: Search Query (q)
        if ($request->q) {
            $qStr = $request->q;
            $query->where(function($q) use ($qStr) {
                $q->where('name', 'like', "%{$qStr}%")
                  ->orWhere('mobile', 'like', "%{$qStr}%")
                  ->orWhere('address', 'like', "%{$qStr}%")
                  ->orWhere('folio_no', 'like', "%{$qStr}%");
            });
        }

        // Filter: Overdue Only
        if ($request->only_overdue === 'true') {
            $query->whereHas('latestLoan.installments', function($q) {
                $q->where('status', 'PENDING')->where('due_date', '<', Carbon::today());
            });
        }

        // Filter: Pending Only
        if ($request->only_pending === 'true') {
            $query->whereHas('latestLoan.installments', function($q) {
                $q->where('status', 'PENDING');
            });
        }

        // Filter: Completed Only
        if ($request->only_completed === 'true') {
            $query->whereDoesntHave('latestLoan.installments', function($q) {
                $q->where('status', 'PENDING');
            });
        }

        // Filter: Zone
        if ($request->zone) {
            $query->where('zone', $request->zone);
        }

        // --- Stats Calculation (Optimized) ---
        // Use a more efficient subquery pattern for stats
        $filteredBorrowerIds = (clone $query)->select('id');
        
        $statQuery = Installment::whereIn('loan_id', function($q) use ($filteredBorrowerIds) {
            $q->select('id')->from('loans')->whereIn('borrower_id', $filteredBorrowerIds);
        });

        if ($start && $end) {
            $statQuery->whereBetween('due_date', [$start, $end]);
        }

        $stats = [
            'total_receivable' => (float)$statQuery->sum('amount_due'),
            'total_received'   => (float)$statQuery->where('status', 'PAID')->sum('amount_paid'),
            'total_pending'    => (float)$statQuery->where('status', 'PENDING')->sum('amount_due'),
            'overdue_count'    => $statQuery->where('status', 'PENDING')->where('due_date', '<', Carbon::today())->count(),
        ];

        // Pagination: 50 per page for reports
        $borrowers = $query->paginate(50);

        // Map recovery percentage (still needed for display)
        $borrowers->getCollection()->transform(function($b) {
            $loan = $b->latestLoan;
            $percent = 0;
            if ($loan && $loan->total_ins > 0) {
                $percent = ($loan->paid_ins / $loan->total_ins) * 100;
            }
            $b->recovery_percentage = round($percent, 1);
            return $b;
        });

        // Note: Percentage filtering at the PHP level with pagination is complex.
        // If the user needs strict percentage filtering, it should ideally be refactored 
        // to a raw SQL query with a 'HAVING' clause or a database view.
        // For now, we prioritize pagination for large dataset stability.

        return response()->json([
            'stats' => $stats,
            'data'  => $borrowers,
        ]);
    }

    public function individualBalance(Request $request, Borrower $borrower)
    {
        $this->authorizeAccess($request, $borrower);

        $borrower->load([
            'vehicle', 
            'guarantor', 
            'recoveryMan',
            'latestLoan.installments' => function($q) {
                $q->orderBy('due_date', 'asc');
            }
        ]);

        $loan = $borrower->latestLoan;
        $summary = null;

        if ($loan) {
            $summary = [
                'total_amount'    => (float)$loan->total_amount,
                'total_paid'      => (float)$loan->installments()->where('status', 'PAID')->sum('amount_paid'),
                'total_pending'   => (float)$loan->installments()->where('status', 'PENDING')->sum('amount_due'),
                'overdue_amount'  => (float)$loan->installments()
                    ->where('status', 'PENDING')
                    ->where('due_date', '<', Carbon::today())
                    ->sum('amount_due'),
                'last_paid_date'  => $loan->installments()->where('status', 'PAID')->latest('paid_date')->first()?->paid_date,
            ];
            $summary['balance'] = round($summary['total_amount'] - $summary['total_paid'], 2);
        }

        return response()->json([
            'borrower' => $borrower,
            'summary'  => $summary
        ]);
    }

    private function authorizeAccess(Request $request, Borrower $borrower): void
    {
        $user = $request->user();
        if ($user->isAdmin()) return;

        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        
        if ($borrower->financer_id !== $effectiveOwnerId) {
            abort(403, 'Access denied.');
        }
    }

    private function financer_id(Request $request): int
    {
        $user = $request->user();
        return $user->isAdmin() ? ($request->financer_id ?? $user->id) : $user->id;
    }
}
