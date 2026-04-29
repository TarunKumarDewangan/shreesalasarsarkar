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
            // Composite index for Dashboard collection stats (status + paid_date)
            $table->index(['status', 'paid_date'], 'installments_status_paid_date_index');
            
            // Composite index for Overdue reports (status + due_date)
            $table->index(['status', 'due_date'], 'installments_status_due_date_index');
        });

        Schema::table('loans', function (Blueprint $table) {
            // Composite index for Financer-scoped filtered counts
            $table->index(['financer_id', 'status'], 'loans_financer_id_status_index');
            
            // Composite index for agreement date filtering
            $table->index(['financer_id', 'agreement_date'], 'loans_financer_id_agreement_date_index');
        });

        Schema::table('borrowers', function (Blueprint $table) {
            // Composite index for zone-based reports
            $table->index(['financer_id', 'zone'], 'borrowers_financer_id_zone_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('installments', function (Blueprint $table) {
            $table->dropIndex('installments_status_paid_date_index');
            $table->dropIndex('installments_status_due_date_index');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex('loans_financer_id_status_index');
            $table->dropIndex('loans_financer_id_agreement_date_index');
        });

        Schema::table('borrowers', function (Blueprint $table) {
            $table->dropIndex('borrowers_financer_id_zone_index');
        });
    }
};
