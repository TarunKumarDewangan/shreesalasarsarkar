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
            $table->index('name');
            $table->index('mobile');
            $table->index('zone');
            $table->index('folio_no');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->index('agreement_date');
            $table->index('status');
        });

        Schema::table('installments', function (Blueprint $table) {
            $table->index('due_date');
            $table->index('status');
            $table->index('paid_date');
        });
        
        Schema::table('vehicles', function (Blueprint $table) {
            $table->index('vehicle_no');
            $table->index('model');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('borrowers', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['mobile']);
            $table->dropIndex(['zone']);
            $table->dropIndex(['folio_no']);
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex(['agreement_date']);
            $table->dropIndex(['status']);
        });

        Schema::table('installments', function (Blueprint $table) {
            $table->dropIndex(['due_date']);
            $table->dropIndex(['status']);
            $table->dropIndex(['paid_date']);
        });
        
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropIndex(['vehicle_no']);
            $table->dropIndex(['model']);
        });
    }
};
