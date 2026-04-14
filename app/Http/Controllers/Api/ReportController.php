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
        
        // Base Query
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

        $borrowers = $query->get();

        // Recovery Percentage Calculation & Filtering
        $data = $borrowers->map(function($b) {
            $loan = $b->latestLoan;
            $percent = 0;
            if ($loan && $loan->total_ins > 0) {
                $percent = ($loan->paid_ins / $loan->total_ins) * 100;
            }
            $b->recovery_percentage = round($percent, 1);
            return $b;
        });

        if ($request->min_percent !== null) {
            $data = $data->filter(fn($b) => $b->recovery_percentage >= (float)$request->min_percent);
        }
        if ($request->max_percent !== null) {
            $data = $data->filter(fn($b) => $b->recovery_percentage <= (float)$request->max_percent);
        }

        // Global Stats (Independent of borrower list filtering, but scoped to financer & dates)
        $statQuery = Installment::whereHas('loan', fn($q) => $q->where('financer_id', $financer_id));
        
        if ($start && $end) {
            $statQuery->whereBetween('due_date', [$start, $end]);
        }

        $stats = [
            'total_receivable' => (float)$statQuery->sum('amount_due'),
            'total_received'   => (float)$statQuery->where('status', 'PAID')->sum('amount_paid'),
            'total_pending'    => (float)$statQuery->where('status', 'PENDING')->sum('amount_due'),
            'overdue_count'    => $statQuery->where('status', 'PENDING')->where('due_date', '<', Carbon::today())->count(),
        ];

        return response()->json([
            'stats' => $stats,
            'data'  => $data->values(),
        ]);
    }

    private function financer_id(Request $request): int
    {
        $user = $request->user();
        return $user->isAdmin() ? ($request->financer_id ?? $user->id) : $user->id;
    }
}
