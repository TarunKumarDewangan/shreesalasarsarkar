<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BorrowerController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\FinancerController;
use App\Http\Controllers\Api\InstallmentController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\WhatsAppController;
use Illuminate\Support\Facades\Route;

// ──────────────── PUBLIC ────────────────
Route::post('/login', [AuthController::class, 'login']);

// Borrower Portal Auth
Route::post('/borrower/send-otp', [\App\Http\Controllers\Api\BorrowerAuthController::class, 'sendOTP']);
Route::post('/borrower/login',    [\App\Http\Controllers\Api\BorrowerAuthController::class, 'login']);

// ──────────────── PROTECTED ─────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me',     [AuthController::class, 'me']);
    Route::post('/logout',[AuthController::class, 'logout']);
    Route::get('/search/global', [SearchController::class, 'global']);

    // ── ADMIN ONLY ──
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('financers', FinancerController::class)->except(['index']);
    });
    Route::get('financers', [FinancerController::class, 'index']);

    // ── FINANCER + ADMIN ──
    Route::get('borrowers/next-folio', [BorrowerController::class, 'nextFolio']);
    Route::get('borrowers/zones', [BorrowerController::class, 'zones']);
    Route::get('borrowers/vehicle-conditions', [BorrowerController::class, 'vehicleConditions']);
    Route::get('borrowers/vehicle-sold-by', [BorrowerController::class, 'vehicleSoldBy']);
    Route::get('borrowers/vehicle-models', [BorrowerController::class, 'vehicleModels']);
    Route::get('borrowers/vehicle-colors', [BorrowerController::class, 'vehicleColors']);
    Route::apiResource('borrowers', BorrowerController::class);
    Route::post('customers/sync-all', [CustomerController::class, 'syncAll']);
    Route::apiResource('customers', CustomerController::class)->only(['index', 'show']);

    // Loans
    Route::post('/loans/calculate', [LoanController::class, 'calculate']);
    Route::post('/loans/{loan}/send-notification', [LoanController::class, 'sendNotification']);
    Route::patch('/loans/{loan}/approve', [LoanController::class, 'approve']);
    Route::patch('/loans/{loan}/reject', [LoanController::class, 'reject']);
    Route::post('/loans/{loan}/settle', [LoanController::class, 'settle']);
    Route::apiResource('loans', LoanController::class);

    // Installments
    Route::get('/loans/{loan}/installments',        [InstallmentController::class, 'index']);
    Route::patch('/installments/{installment}/pay', [InstallmentController::class, 'markPaid']);
    Route::patch('/installments/{installment}/unpay',[InstallmentController::class, 'markPending']);

    // Dashboard stats
    Route::get('/dashboard', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $borrowerQ     = \App\Models\Borrower::query();
        $loanQ         = \App\Models\Loan::query();
        $installmentQ  = \App\Models\Installment::query();

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

        $loanIds = $loanQ->pluck('id');
        $installmentQ->whereIn('loan_id', $loanIds);

        return response()->json([
            'total_borrowers'       => $borrowerQ->count(),
            'active_loans'          => (clone $loanQ)->where('status', 'ACTIVE')->count(),
            'pending_installments'  => (clone $installmentQ)->where('status', 'PENDING')->count(),
            'collected_this_month'  => (clone $installmentQ)
                ->where('status', 'PAID')
                ->whereMonth('paid_date', now()->month)
                ->whereYear('paid_date', now()->year)
                ->sum('amount_paid'),
            'collected_today'       => (clone $installmentQ)
                ->where('status', 'PAID')
                ->whereDate('paid_date', now()->toDateString())
                ->sum('amount_paid'),
        ]);
    });

    Route::get('/reports/recovery', [\App\Http\Controllers\Api\ReportController::class, 'recovery']);

    // Staff / Recovery Men (For Financer)
    Route::get('recovery-men', [\App\Http\Controllers\Api\StaffController::class, 'recoveryMen']);
    Route::apiResource('staff', \App\Http\Controllers\Api\StaffController::class);
    Route::apiResource('payment-methods', \App\Http\Controllers\Api\PaymentMethodController::class);

    // Two-step Recovery process
    Route::get('recoveries', [\App\Http\Controllers\Api\RecoveryController::class, 'index']);
    Route::post('recoveries', [\App\Http\Controllers\Api\RecoveryController::class, 'store']);
    Route::patch('recoveries/{recovery}/approve', [\App\Http\Controllers\Api\RecoveryController::class, 'approve']);
    Route::patch('recoveries/{recovery}/reject', [\App\Http\Controllers\Api\RecoveryController::class, 'reject']);

    // WhatsApp Settings
    Route::get('/whatsapp/settings', [WhatsAppController::class, 'getSettings']);
    Route::post('/whatsapp/settings', [WhatsAppController::class, 'updateSettings']);
    Route::post('/whatsapp/test', [WhatsAppController::class, 'testConnection']);
    // Trash Recovery
    Route::get('/trash', [\App\Http\Controllers\Api\TrashController::class, 'index']);
    Route::post('/trash/{type}/{id}/restore', [\App\Http\Controllers\Api\TrashController::class, 'restore']);
    Route::delete('/trash/{type}/{id}/force', [\App\Http\Controllers\Api\TrashController::class, 'forceDelete']);
});
