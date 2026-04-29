<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrower;
use App\Models\Loan;
use App\Models\Installment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $borrowerQ = Borrower::query();
        $loanQ     = Loan::query();
        
        // Apply Scoping
        if ($user->isStaff()) {
            $financerId = $user->financer_id;
            $staffId = $user->id;
            $borrowerQ->where('financer_id', $financerId)->where('recovery_man_id', $staffId);
            $loanQ->where('financer_id', $financerId)->whereHas('borrower', function($q) use ($staffId) {
                $q->where('recovery_man_id', $staffId);
            });
        } elseif ($user->isFinancer()) {
            $borrowerQ->where('financer_id', $user->id);
            $loanQ->where('financer_id', $user->id);
        }

        // Optimization: Use date ranges instead of whereMonth/whereYear to utilize indexes
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth   = Carbon::now()->endOfMonth()->toDateString();
        $today        = Carbon::today()->toDateString();

        // Optimized Query Execution: 
        // We still need to run these, but we can potentially combine some or use better indexing.
        // For now, the biggest win is the date range and moving to a controller.
        
        $loanIds = $loanQ->select('id');
        $installmentQ = Installment::whereIn('loan_id', $loanIds);

        return response()->json([
            'total_borrowers'      => $borrowerQ->count(),
            'active_loans'         => (clone $loanQ)->where('status', 'ACTIVE')->count(),
            'pending_installments' => (clone $installmentQ)->where('status', 'PENDING')->count(),
            
            'collected_this_month' => (float) (clone $installmentQ)
                ->where('status', 'PAID')
                ->whereBetween('paid_date', [$startOfMonth, $endOfMonth])
                ->sum('amount_paid'),
                
            'collected_today'      => (float) (clone $installmentQ)
                ->where('status', 'PAID')
                ->whereDate('paid_date', $today)
                ->sum('amount_paid'),
        ]);
    }
}
