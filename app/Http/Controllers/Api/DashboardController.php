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
        $financerId = $user->isStaff() ? $user->financer_id : $user->id;
        $staffId = $user->isStaff() ? $user->id : null;
        
        if ($user->isAdmin()) {
            $cacheKey = "dashboard_stats_admin";
        } else {
            $cacheKey = "dashboard_stats_{$financerId}" . ($staffId ? "_{$staffId}" : "");
        }

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 600, function() use ($user, $financerId, $staffId) {
            $borrowerQ = Borrower::query();
            $loanQ     = Loan::query();
            
            if ($user->isAdmin()) {
                // Admin gets global stats - no scoping required
            } else if ($staffId) {
                $borrowerQ->where('financer_id', $financerId)->where('recovery_man_id', $staffId);
                $loanQ->where('financer_id', $financerId)->whereHas('borrower', function($q) use ($staffId) {
                    $q->where('recovery_man_id', $staffId);
                });
            } else {
                $borrowerQ->where('financer_id', $financerId);
                $loanQ->where('financer_id', $financerId);
            }

            $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
            $endOfMonth   = Carbon::now()->endOfMonth()->toDateString();
            $today        = Carbon::today()->toDateString();
            
            $loanIds = $loanQ->select('id');
            $installmentQ = Installment::whereIn('loan_id', $loanIds);

            return [
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
            ];
        });
    }
}
