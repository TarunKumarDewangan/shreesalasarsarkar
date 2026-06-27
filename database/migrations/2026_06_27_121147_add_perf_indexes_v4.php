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
        Schema::table('backlog_accounts', function (Blueprint $table) {
            $table->index(['cbcode', 'type', 'fno'], 'idx_backlog_cbcode_type_fno');
            $table->index(['fno'], 'idx_backlog_fno');
            $table->index(['zone'], 'idx_backlog_zone');
        });

        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->index(['backlog_account_id', 'status', 'due_date'], 'idx_backlog_inst_status_due');
            $table->index(['backlog_account_id', 'status', 'paid_amount'], 'idx_backlog_inst_status_paid');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->index(['financer_id', 'status', 'borrower_id'], 'idx_loans_financer_status_borrower');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('backlog_accounts', function (Blueprint $table) {
            $table->dropIndex('idx_backlog_cbcode_type_fno');
            $table->dropIndex('idx_backlog_fno');
            $table->dropIndex('idx_backlog_zone');
        });

        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->dropIndex('idx_backlog_inst_status_due');
            $table->dropIndex('idx_backlog_inst_status_paid');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex('idx_loans_financer_status_borrower');
        });
    }
};
