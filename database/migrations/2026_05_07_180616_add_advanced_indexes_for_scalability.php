<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('installments', function (Blueprint $table) {
            $table->index(['loan_id', 'status'], 'idx_loan_status');
            $table->index(['paid_date'], 'idx_paid_date');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->index(['borrower_id', 'status'], 'idx_borrower_status');
            $table->index(['financer_id', 'status'], 'idx_financer_status');
        });

        Schema::table('borrowers', function (Blueprint $table) {
            $table->index(['financer_id', 'recovery_man_id'], 'idx_financer_staff');
        });

        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->index(['backlog_account_id', 'installment_no'], 'idx_backlog_acc_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('installments', function (Blueprint $table) {
            $table->dropIndex('idx_loan_status');
            $table->dropIndex('idx_paid_date');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex('idx_borrower_status');
            $table->dropIndex('idx_financer_status');
        });

        Schema::table('borrowers', function (Blueprint $table) {
            $table->dropIndex('idx_financer_staff');
        });

        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->dropIndex('idx_backlog_acc_no');
        });
    }
};
