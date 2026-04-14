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
            $table->string('receipt_no')->nullable()->unique()->after('loan_id');
            $table->decimal('principal_amount', 12, 2)->default(0)->after('amount_due');
            $table->decimal('interest_amount', 12, 2)->default(0)->after('principal_amount');
            $table->decimal('balance', 12, 2)->default(0)->after('interest_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('installments', function (Blueprint $table) {
            $table->dropColumn(['receipt_no', 'principal_amount', 'interest_amount', 'balance']);
        });
    }
};
