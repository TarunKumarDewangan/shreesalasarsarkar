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
        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->decimal('principal_amount', 12, 2)->nullable()->after('installment_no');
            $table->decimal('interest_amount', 12, 2)->nullable()->after('principal_amount');
            $table->decimal('fine_amount', 12, 2)->nullable()->after('balance_amount');
            $table->decimal('exc_amount', 12, 2)->nullable()->after('fine_amount');
            $table->string('status')->nullable()->after('exc_amount');
            $table->string('coverage')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('backlog_installments', function (Blueprint $table) {
            $table->dropColumn(['principal_amount', 'interest_amount', 'fine_amount', 'exc_amount', 'status', 'coverage']);
        });
    }
};
