<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BorrowerController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
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
    Route::get('borrowers/onboarding-metadata', [BorrowerController::class, 'onboardingMetadata']);
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
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/reports/recovery', [\App\Http\Controllers\Api\ReportController::class, 'recovery']);
    Route::get('/reports/individual-balance/{borrower}', [\App\Http\Controllers\Api\ReportController::class, 'individualBalance']);

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

    // Backlog Management
    Route::get('/backlog', [\App\Http\Controllers\Api\BacklogController::class, 'index']);
    Route::get('/backlog/{id}', [\App\Http\Controllers\Api\BacklogController::class, 'show']);
    Route::post('/backlog/upload-accounts', [\App\Http\Controllers\Api\BacklogController::class, 'uploadAccounts']);
    Route::post('/backlog/upload-installments', [\App\Http\Controllers\Api\BacklogController::class, 'uploadInstallments']);
    Route::delete('/backlog/clear', [\App\Http\Controllers\Api\BacklogController::class, 'destroy']);
    Route::post('/backlog/{id}/payment', [\App\Http\Controllers\Api\BacklogController::class, 'addPayment']);
    Route::patch('/backlog-installments/{id}', [\App\Http\Controllers\Api\BacklogController::class, 'updateInstallment']);
    Route::delete('/backlog-installments/{id}', [\App\Http\Controllers\Api\BacklogController::class, 'deleteInstallment']);
    Route::post('/backlog/{id}/settle', [\App\Http\Controllers\Api\BacklogController::class, 'settle']);
    Route::post('/backlog/{id}/recalculate', [\App\Http\Controllers\Api\BacklogController::class, 'recalculateAll']);
});
