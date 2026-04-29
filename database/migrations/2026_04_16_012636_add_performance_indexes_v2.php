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
        Schema::table('borrowers', function (Blueprint $table) {
            $table->index('financer_id');
            $table->index('recovery_man_id');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->index('financer_id');
        });

        Schema::table('installments', function (Blueprint $table) {
            $table->index('loan_id');
            // 'status' is already indexed in previous migration, but adding composite or others if needed
            // Actually, let's add a composite index for common queries
            $table->index(['loan_id', 'status']);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->index('borrower_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('borrowers', function (Blueprint $table) {
            $table->dropIndex(['financer_id']);
            $table->dropIndex(['recovery_man_id']);
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex(['financer_id']);
        });

        Schema::table('installments', function (Blueprint $table) {
            $table->dropIndex(['loan_id']);
            $table->dropIndex(['loan_id', 'status']);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropIndex(['borrower_id']);
        });
    }
};
